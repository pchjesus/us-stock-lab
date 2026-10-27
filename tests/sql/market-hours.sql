-- Deterministic fixture cases; only stock_test owns the private test clock.
create function paper_private.assert_rejected_at(t timestamptz) returns void language plpgsql as $$
declare before jsonb;after jsonb;begin
 update paper_private.test_clock set value=t;
 select public.paper_snapshot()-'market' into before;
 begin perform public.paper_order(gen_random_uuid(),'AAPL','buy',1);raise exception 'accepted outside session' using errcode='XX000';
 exception when raise_exception then if sqlerrm not in ('market_closed','market_unavailable','market_halted') then raise;end if;end;
 select public.paper_snapshot()-'market' into after;
 if before is distinct from after then raise exception 'rejection mutated finances';end if;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
-- One second boundaries, early closes, holidays, DST, unsupported years.
select paper_private.assert_rejected_at(t::timestamptz) from unnest(array[
'2026-01-05T14:29:59Z','2026-01-05T21:00:00Z','2026-03-09T13:29:59Z','2026-11-02T14:29:59Z',
'2026-11-27T18:00:00Z','2026-12-24T18:00:00Z','2027-11-26T18:00:00Z',
'2026-10-24T15:00:00Z','2026-10-25T15:00:00Z','2025-12-31T16:00:00Z','2028-01-03T16:00:00Z']) t;
select paper_private.assert_rejected_at((date+time '12:00') at time zone 'America/New_York') from paper_private.market_days where open_at is null;
do $$declare t text;begin
 foreach t in array array['2026-01-05T14:30:00Z','2026-01-05T20:59:59Z','2026-03-06T14:30:00Z','2026-03-09T13:30:00Z','2026-10-30T13:30:00Z','2026-11-02T14:30:00Z','2027-03-12T14:30:00Z','2027-03-15T13:30:00Z','2027-11-05T13:30:00Z','2027-11-08T14:30:00Z','2026-11-27T17:59:59Z','2026-12-24T17:59:59Z','2027-11-26T17:59:59Z','2026-10-27T14:59:59Z','2026-10-27T15:00:00Z'] loop
 update paper_private.test_clock set value=t::timestamptz;
 perform public.paper_order(gen_random_uuid(),'AAPL','buy',1);
 end loop;
end$$;
-- Missing/unverified day, missing control and operator halt must fail closed.
update paper_private.market_days set verified=false where date='2026-10-27';
select paper_private.assert_rejected_at('2026-10-27T15:00:00Z');
update paper_private.market_days set verified=true where date='2026-10-27';
begin;delete from paper_private.market_days where date='2026-10-27';select paper_private.assert_rejected_at('2026-10-27T15:00:00Z');rollback;
begin;delete from paper_private.market_control;select paper_private.assert_rejected_at('2026-10-27T15:00:00Z');rollback;
update paper_private.market_control set enabled=false;
select paper_private.assert_rejected_at('2026-10-27T15:00:00Z');
update paper_private.market_control set enabled=true;
-- Existing fills return after close, conflicting payload still rejects.
update paper_private.test_clock set value='2026-10-27T19:59:59Z';
set role authenticated;
select public.paper_order('30000000-0000-0000-0000-000000000001','AAPL','buy',1);
reset role;
update paper_private.test_clock set value='2026-10-27T20:00:00Z';
set role authenticated;
select public.paper_order('30000000-0000-0000-0000-000000000001','AAPL','buy',1);
do $$begin
 begin perform public.paper_order('30000000-0000-0000-0000-000000000001','AAPL','buy',2);raise exception 'conflict allowed' using errcode='XX000';exception when raise_exception then if sqlerrm<>'idempotency_conflict' then raise;end if;end;
 begin perform public.paper_order(gen_random_uuid(),'AAPL','buy',1);raise exception 'direct call bypass' using errcode='XX000';exception when raise_exception then if sqlerrm<>'market_closed' then raise;end if;end;
 begin perform paper_private.market_state(now());raise exception 'private time API exposed' using errcode='XX000';exception when insufficient_privilege then null;end;
 begin update paper_private.market_control set enabled=true;raise exception 'halt bypass' using errcode='XX000';exception when insufficient_privilege then null;end;
end$$;
reset role;
-- Closing during a statement (e.g. trigger/IO) rolls all changes back.
update paper_private.test_clock set value='2026-10-27T19:59:59Z';
create function paper_private.close_during_order() returns trigger language plpgsql as $$begin update paper_private.test_clock set value='2026-10-27T20:00:00Z';return new;end$$;
create trigger close_during_order after insert on public.paper_cash_ledger for each row when(new.kind='trade') execute function paper_private.close_during_order();
do $$declare before jsonb;begin
 before:=public.paper_snapshot()-'market';
 begin perform public.paper_order(gen_random_uuid(),'AAPL','sell',1);raise exception 'late fill accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'market_closed' then raise;end if;end;
 if before is distinct from public.paper_snapshot()-'market' then raise exception 'late fill not rolled back';end if;
 if (select sum(delta_cents) from public.paper_cash_ledger where account_id=(before->>'id')::uuid)<>(before->>'cash')::bigint then raise exception 'late ledger mutation';end if;
end$$;
drop trigger close_during_order on public.paper_cash_ledger;
drop function paper_private.close_during_order();
update paper_private.test_clock set value='2026-10-27T14:00:00Z';
select 'PASS market boundaries, all closed days, DST, unknown/missing calendar, halt, direct RPC, after-close readback/conflict, delayed-write rollback';
