set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update paper_private.test_clock set value='2026-10-27T14:00:00Z';
set role authenticated;
select public.manual_snapshot();
select public.manual_order('60000000-0000-0000-0000-000000000001','{"symbol":"AAPL","side":"buy","quantity":10,"priceCents":10000,"rateBps":10,"minCents":0,"source":"manual test","observedAt":"2026-10-27T13:59:00Z"}');
select public.manual_order('60000000-0000-0000-0000-000000000002','{"symbol":"AAPL","side":"buy","quantity":5,"priceCents":8000,"rateBps":25,"minCents":0,"source":"manual test","observedAt":"2026-10-27T13:59:00Z"}');
do $$begin
 if (select cost_cents from public.manual_positions)<>140200 or(select cash_cents from public.manual_accounts)<>9859800 or(select fees_cents from public.manual_accounts)<>200 then raise exception 'buy fees mismatch';end if;
end$$;
select public.manual_order('60000000-0000-0000-0000-000000000003','{"symbol":"AAPL","side":"sell","quantity":5,"priceCents":11000,"rateBps":10,"minCents":0,"source":"manual test","observedAt":"2026-10-27T13:59:00Z"}');
do $$begin
 if (select cost_cents from public.manual_positions)<>93467 or(select realized_cents from public.manual_accounts)<>8212 then raise exception 'partial basis/fee mismatch';end if;
end$$;
select public.manual_order('60000000-0000-0000-0000-000000000004','{"symbol":"AAPL","side":"sell","quantity":10,"priceCents":11000,"rateBps":0,"minCents":100,"source":"manual test","observedAt":"2026-10-27T13:59:00Z"}');
do $$declare before jsonb;p jsonb;begin
 before:=public.manual_snapshot();
 if (before->>'realized')::bigint<>24645 or(before->>'cash')::bigint<>10024645 or(before->>'fees')::bigint<>355 or exists(select 1 from public.manual_positions) then raise exception 'liquidation invariant';end if;
 if(select sum(delta_cents) from public.manual_ledger)<>(before->>'cash')::bigint then raise exception 'ledger invariant';end if;
 p:='{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":10000,"rateBps":10,"minCents":0,"source":"manual test","observedAt":"2026-10-27T13:59:00Z"}';
 begin perform public.manual_order(gen_random_uuid(),p||'{"quantity":0}');raise exception 'invalid accepted' using errcode='XX000';exception when raise_exception then null;end;
 begin perform public.manual_order(gen_random_uuid(),p||'{"priceCents":-1}');raise exception 'invalid accepted' using errcode='XX000';exception when raise_exception then null;end;
 begin perform public.manual_order(gen_random_uuid(),p||'{"quantity":1000000}');raise exception 'overdraft accepted' using errcode='XX000';exception when raise_exception then null;end;
 begin perform public.manual_order(gen_random_uuid(),p||'{"side":"sell"}');raise exception 'oversell accepted' using errcode='XX000';exception when raise_exception then null;end;
 begin update public.manual_accounts set cash_cents=0;raise exception 'direct write accepted' using errcode='XX000';exception when insufficient_privilege then null;end;
 if before is distinct from public.manual_snapshot() then raise exception 'rejected order mutation';end if;
end$$;
reset role;
update paper_private.test_clock set value='2026-10-27T20:00:00Z';
set role authenticated;
select public.manual_order('60000000-0000-0000-0000-000000000004','{"symbol":"AAPL","side":"sell","quantity":10,"priceCents":11000,"rateBps":0,"minCents":100,"source":"manual test","observedAt":"2026-10-27T13:59:00Z"}');
do $$declare p jsonb;begin
 p:='{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":10000,"rateBps":0,"minCents":0,"source":"manual test","observedAt":"2026-10-27T13:59:00Z"}';
 begin perform public.manual_order(gen_random_uuid(),p);raise exception 'closed accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'market_closed' then raise;end if;end;
 begin perform public.manual_order('60000000-0000-0000-0000-000000000004',p);raise exception 'conflict accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'idempotency_conflict' then raise;end if;end;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin if exists(select 1 from public.manual_accounts) or exists(select 1 from public.manual_orders) or exists(select 1 from public.manual_positions) or exists(select 1 from public.manual_ledger) then raise exception 'A/B leak';end if;end$$;
reset role;
update paper_private.test_clock set value='2026-10-27T14:00:00Z';
select 'PASS manual fees, weighted basis, liquidation, cash ledger, errors, idempotent readback/conflict, closed gate and A/B isolation';
-- Failure after account/position/order writes must roll the complete manual journal back.
create function paper_private.manual_test_failure() returns trigger language plpgsql as $$begin if new.kind='trade' then raise exception 'injected_failure';end if;return new;end$$;
create trigger manual_failure before insert on public.manual_ledger for each row execute function paper_private.manual_test_failure();
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$declare before jsonb;begin
 before:=public.manual_snapshot();
 begin perform public.manual_order(gen_random_uuid(),'{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":10000,"rateBps":10,"minCents":0,"source":"manual test","observedAt":"2026-10-27T13:59:00Z"}');raise exception 'failure ignored' using errcode='XX000';exception when raise_exception then if sqlerrm<>'injected_failure' then raise;end if;end;
 if before is distinct from public.manual_snapshot() then raise exception 'rollback mismatch';end if;
end$$;
drop trigger manual_failure on public.manual_ledger;drop function paper_private.manual_test_failure();
select 'PASS manual atomic rollback after financial writes';
