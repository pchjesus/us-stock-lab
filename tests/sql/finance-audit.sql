set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update paper_private.test_clock set value='2026-11-03T15:00:00Z';
set role authenticated;
do $$declare a jsonb;o jsonb;request_key uuid:=gen_random_uuid();begin
 a:=public.manual_snapshot();o:='{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":10000,"rateBps":10,"minCents":0,"source":"audit fixture","observedAt":"2026-11-03T14:59:00Z"}';
 begin perform public.manual_order(request_key,o);raise exception 'old API originated fill' using errcode='XX000';exception when raise_exception then if sqlerrm<>'client_upgrade_required' then raise;end if;end;
 begin perform public.manual_order_v2(request_key,(a->>'revision')::bigint,1,o||'{"rateBps":0}');raise exception 'fee tampering' using errcode='XX000';exception when raise_exception then if sqlerrm<>'fee_policy_conflict' then raise;end if;end;
 perform public.manual_order_v2(request_key,(a->>'revision')::bigint,1,o);
 -- Retry must work even with the original (now stale) revision.
 perform public.manual_order_v2(request_key,(a->>'revision')::bigint,1,o);
 begin perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,1,o);raise exception 'stale fill' using errcode='XX000';exception when raise_exception then if sqlerrm<>'account_revision_conflict' then raise;end if;end;
 begin perform public.manual_fee_policy_set((a->>'id')::uuid,1,0,0,'unauthorized');raise exception 'policy escalation' using errcode='XX000';exception when raise_exception then if sqlerrm<>'finance_admin_required' then raise;end if;end;
 begin perform paper_private.manual_order_execute(request_key,o);raise exception 'private bypass' using errcode='XX000';exception when insufficient_privilege then null;end;
 if (select count(*) from public.manual_orders where request_id=request_key)<>1 then raise exception 'duplicate id';end if;
end$$;
reset role;
insert into paper_private.finance_admins values('00000000-0000-0000-0000-000000000001');
set role authenticated;
do $$declare a jsonb;o jsonb;begin
 a:=public.manual_snapshot();perform public.manual_fee_policy_set((a->>'id')::uuid,1,25,1,'approved test policy');
 begin perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,1,'{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":10000,"rateBps":10,"minCents":0,"source":"audit","observedAt":"2026-11-03T14:59:00Z"}');raise exception 'policy failed to invalidate review' using errcode='XX000';exception when raise_exception then if sqlerrm<>'account_revision_conflict' then raise;end if;end;
 a:=public.manual_snapshot();o:='{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":10000,"rateBps":25,"minCents":1,"source":"audit fixture","observedAt":"2026-11-03T14:59:00Z"}';perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o);
 if (select count(*) from public.manual_fee_policies)<>2 then raise exception 'policy history missing';end if;
 begin update public.manual_fee_policies set rate_bps=0;raise exception 'direct policy write' using errcode='XX000';exception when insufficient_privilege then null;end;
end$$;
reset role;
-- Tight public function permissions / empty paths, no executable private helpers.
do $$declare p record;begin
 for p in select oid,proname,proconfig from pg_proc where pronamespace='public'::regnamespace and (proname like 'manual_%' or proname like 'dividend_%') loop
 if has_function_privilege('anon',p.oid,'execute') or not(p.proconfig @> array['search_path=""']) then raise exception 'unsafe RPC %',p.proname;end if;end loop;
 if has_schema_privilege('authenticated','paper_private','usage') then raise exception 'private schema exposed';end if;
 if exists(select 1 from public.manual_accounts a where cash_cents<>(select sum(delta_cents) from public.manual_ledger l where l.account_id=a.id)) then raise exception 'post audit ledger mismatch';end if;
end$$;
select 'PASS server fee policy/CAS, immutable policy history, retry/upgrade guard and public RPC permissions';
-- Recheck weighted average/partial/full sale on the current public API, with a
-- privileged policy change (never a per-order client override).
insert into auth.users values('00000000-0000-0000-0000-000000000003');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.manual_snapshot();
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.manual_fee_policy_set((select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000003'),1,0,0,'exact calculation fixture');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
do $$declare a jsonb;o jsonb;begin
 o:='{"symbol":"AAPL","side":"buy","quantity":10,"priceCents":10000,"rateBps":0,"minCents":0,"source":"audit exact fixture","observedAt":"2026-11-03T14:59:00Z"}';
 a:=public.manual_snapshot();perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o);
 a:=public.manual_snapshot();perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o||'{"quantity":5,"priceCents":8000}');
 if(select cost_cents from public.manual_positions where account_id=(a->>'id')::uuid)<>140000 then raise exception 'v2 average cost';end if;
 a:=public.manual_snapshot();perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o||'{"side":"sell","quantity":5,"priceCents":11000}');
 a:=public.manual_snapshot();if(a->>'realized')::bigint<>8333 then raise exception 'v2 partial sale';end if;
 perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o||'{"side":"sell","quantity":10,"priceCents":11000}');
 a:=public.manual_snapshot();if(a->>'cash')::bigint<>10025000 or(a->>'realized')::bigint<>25000 or jsonb_array_length(a->'positions')<>0 then raise exception 'v2 liquidation';end if;
end$$;
select 'PASS v2 exact weighted average, partial allocation and liquidation';
do $$declare p record;allowed boolean;begin
 for p in select oid,proname,proconfig from pg_proc where pronamespace='public'::regnamespace and prosecdef loop
 allowed:=p.proname=any(array['paper_order','paper_snapshot','manual_order','manual_order_v2','manual_snapshot','manual_fee_policy_set','dividend_admin','dividend_manage','dividend_dashboard','manual_tax_save','manual_tax_snapshot']);
 if has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute')<>allowed or not(coalesce(p.proconfig,'{}') @> array['search_path=""']) then raise exception 'definer grant/path mismatch %',p.proname;end if;
 end loop;
end$$;
set role authenticated;
set request.jwt.claim.sub='';
do $$begin
 if public.dividend_admin() then raise exception 'null uid admin';end if;
 begin perform public.manual_snapshot();raise exception 'null uid snapshot' using errcode='XX000';exception when raise_exception then if sqlerrm<>'authentication_required' then raise;end if;end;
 begin perform public.manual_tax_snapshot();raise exception 'null uid tax read' using errcode='XX000';exception when raise_exception then if sqlerrm<>'authentication_required' then raise;end if;end;
 begin perform public.dividend_dashboard();raise exception 'null uid dashboard' using errcode='XX000';exception when raise_exception then if sqlerrm<>'admin_required' then raise;end if;end;
end$$;
reset role;
select 'PASS all public SECURITY DEFINER grants/search_path and null-UID denial';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set role authenticated;
do $$declare d jsonb;v integer;begin
 select max(version) into v from public.manual_tax_documents;
 select document into d from public.manual_tax_documents order by version desc limit 1;
 begin perform public.manual_tax_save(gen_random_uuid(),v,jsonb_set(d,'{records,0,fx}','null'));raise exception 'null FX persisted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'invalid_tax_fx' then raise;end if;end;
 begin perform public.manual_tax_save(gen_random_uuid(),v,d||jsonb_build_object('oversized',repeat('x',2100000)));raise exception 'oversize persisted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'invalid_tax_document' then raise;end if;end;
 begin perform public.manual_tax_save(gen_random_uuid(),v,jsonb_set(d,'{external}','[{"year":2026,"netKrw":0,"usedDeductionKrw":1000}]'));raise exception 'invalid external deduction persisted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'invalid_external_tax' then raise;end if;end;
 if (select max(version) from public.manual_tax_documents)<>v then raise exception 'failed tax request changed history';end if;
end$$;
reset role;
select 'PASS bounded/nested tax evidence and external deduction rejection';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
set role authenticated;
do $$declare a jsonb;o jsonb;begin
 a:=public.manual_snapshot();o:='{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":100,"rateBps":0,"minCents":0,"source":"audit","observedAt":"2026-11-03T14:59:00Z"}';
 begin perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o||'{"source":{"nested":"poison"}}');raise exception 'non-string source fill' using errcode='XX000';exception when raise_exception then if sqlerrm<>'invalid_order' then raise;end if;end;
 begin perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o||'{"quantity":"1"}');raise exception 'non-numeric quantity fill' using errcode='XX000';exception when raise_exception then if sqlerrm<>'invalid_order' then raise;end if;end;
 if (public.manual_snapshot()->>'revision') is distinct from a->>'revision' then raise exception 'invalid JSON changed account';end if;
end$$;
reset role;
select 'PASS typed order JSON prevents irreplayable journal poisoning';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set role authenticated;
do $$declare d jsonb;v integer;begin
 select document,version into d,v from public.manual_tax_documents order by version desc limit 1;
 begin perform public.manual_tax_save(gen_random_uuid(),v,jsonb_set(d,'{records,0,fx,checkedAt}','"2026-10-27T01:00:00+09:00"'));raise exception 'offset confirmation accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'invalid_tax_fx' then raise;end if;end;
end$$;
reset role;
select 'PASS FX confirmation offset normalized to UTC basis day';
-- Safe final balances are not sufficient: trade gross must fit the JS exact domain.
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
set role authenticated;
do $$declare a jsonb;o jsonb;begin
 a:=public.manual_snapshot();o:='{"symbol":"AAPL","side":"sell","quantity":100000000,"priceCents":100000000,"rateBps":0,"minCents":0,"source":"audit boundary","observedAt":"2026-11-03T14:59:00Z"}';
 begin perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o);raise exception 'unsafe gross accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'unsafe_amount' then raise;end if;end;
end$$;
reset role;
select 'PASS unsafe trade gross rejected before any financial mutation';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
set role authenticated;
do $$begin
 if exists(select 1 from public.manual_fee_policies where account_id<>(public.manual_snapshot()->>'id')::uuid) then raise exception 'other owner fee policy leak';end if;
end$$;
reset role;
do $$declare r record;begin
 for r in select oid,relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r' and (relname like 'manual_%' or relname like 'dividend_%') loop
 if not r.relrowsecurity or has_table_privilege('authenticated',r.oid,'INSERT,UPDATE,DELETE') or has_table_privilege('anon',r.oid,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'financial table permission/RLS %',r.relname;end if;
 end loop;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select 'PASS own fee policy isolation and all manual/dividend tables RLS/write-denial catalog';
