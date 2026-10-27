-- Self-supplied evidence, not a statutory certified rate. No journal modifications.
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
create temp table tax_before as select id,cash_cents,realized_cents,fees_cents from public.manual_accounts;
set role authenticated;
do $$declare oid uuid;d jsonb;rows jsonb;request uuid:=gen_random_uuid();begin
 select id into strict oid from public.manual_orders where account_id=(select id from public.manual_accounts limit 1) order by execution_seq limit 1;
 d:=jsonb_build_object('inputClass','user_supplied','policy','fifo-v1','records',jsonb_build_array(jsonb_build_object('orderId',oid,'confirmedSettlement','2026-10-27','settlementSource','isolated fixture statement','feeDate','2026-10-27','fx',jsonb_build_object('date','2026-10-27','rate','1300.123456','kind','base','provider','user supplied official document','url','https://www.smbs.biz/','checkedAt','2026-10-27T00:00:00Z','status','document_reviewed'),'feeFx',jsonb_build_object('date','2026-10-27','rate','1300.123456','kind','base','provider','user supplied official document','url','https://www.smbs.biz/','checkedAt','2026-10-27T00:00:00Z','status','document_reviewed'))),'external','[]'::jsonb);
 rows:=public.manual_tax_save(request,0,d);perform public.manual_tax_save(request,0,d);
 if jsonb_array_length(rows)<>1 then raise exception 'tax duplicate initialization';end if;
 begin perform public.manual_tax_save(request,1,d||'{"policy":"average-v1"}');raise exception 'id conflict allowed' using errcode='XX000';exception when raise_exception then if sqlerrm<>'idempotency_conflict' then raise;end if;end;
 begin perform public.manual_tax_save(gen_random_uuid(),0,d);raise exception 'stale revision allowed' using errcode='XX000';exception when raise_exception then if sqlerrm<>'tax_revision_conflict' then raise;end if;end;
 perform public.manual_tax_save(gen_random_uuid(),1,d||'{"policy":"average-v1"}');
 if jsonb_array_length(public.manual_tax_snapshot())<>2 then raise exception 'history lost';end if;
 if(select document->>'policy' from public.manual_tax_documents where version=1)<>'fifo-v1' then raise exception 'old version changed';end if;
 begin update public.manual_tax_documents set document='{}';raise exception 'direct tax write' using errcode='XX000';exception when insufficient_privilege then null;end;
 begin perform public.manual_tax_save(gen_random_uuid(),2,jsonb_set(d,'{records,0,fx,rate}','"NaN"'));raise exception 'invalid FX accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'invalid_tax_fx' then raise;end if;end;
 begin perform public.manual_tax_save(gen_random_uuid(),2,jsonb_set(d,'{records,0,fx,date}','"2026-10-26"'));raise exception 'wrong date accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'tax_fx_date_mismatch' then raise;end if;end;
 begin perform public.manual_tax_save(gen_random_uuid(),2,jsonb_set(d,'{records,0,fx,provider}','"Frankfurter"'));raise exception 'reference FX accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'reference_fx_not_tax' then raise;end if;end;
end$$;
reset role;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set role authenticated;
do $$declare other uuid;d jsonb;begin
 if exists(select 1 from public.manual_tax_documents) or jsonb_array_length(public.manual_tax_snapshot())<>0 then raise exception 'tax A/B leak';end if;
 -- A's order id is fixture-known to the attacker; owner binding still rejects it.
end$$;
reset role;
do $$declare oid uuid;d jsonb;begin
 select id into oid from public.manual_orders where account_id=(select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000001') limit 1;
 select document into d from public.manual_tax_documents where version=1;
 begin perform public.manual_tax_save(gen_random_uuid(),0,d);raise exception 'foreign order accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'tax_order_ownership' then raise;end if;end;
 if exists(select * from tax_before except select id,cash_cents,realized_cents,fees_cents from public.manual_accounts) then raise exception 'tax changed finance';end if;
end$$;
set role anon;
do $$begin begin perform public.manual_tax_snapshot();raise exception 'anonymous tax read' using errcode='XX000';exception when insufficient_privilege then null;end;end$$;
reset role;
select 'PASS tax owner isolation, immutable versions, idempotency/CAS, input/date/reference denial and unchanged financial journal';
