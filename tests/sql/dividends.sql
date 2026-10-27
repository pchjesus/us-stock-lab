-- Synthetic fixtures, NOT official public dividend announcements.
insert into paper_private.dividend_admins values('00000000-0000-0000-0000-000000000001');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set role authenticated;
select public.dividend_manage(null,'{"symbol":"AAPL","kind":"regular_cash","announced":"2026-01-01","ex_date":"2026-10-27","record_date":"2026-10-27","pay_date":"2026-10-28","amount_units":2500,"source_url":"https://investor.apple.com/test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"confirmed"}');
reset role;
-- Existing trades were filled ON ex-date. Add historical pre-ex fills in this disposable DB only.
update public.manual_orders set filled_at='2026-10-26T14:00:00Z' where account_id=(select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000002');
update paper_private.test_clock set value='2026-10-28T03:59:59Z';
select paper_private.settle_dividends();
do $$begin if exists(select 1 from public.dividend_credits) then raise exception 'early payment';end if;end$$;
update paper_private.test_clock set value='2026-10-28T04:00:00Z';
select paper_private.settle_dividends();select paper_private.settle_dividends();
do $$declare c public.dividend_credits%rowtype;begin
 select * into strict c from public.dividend_credits;
 if c.quantity<>601 or c.gross_cents<>15025 or c.withholding_cents<>2254 or c.net_cents<>12771 then raise exception 'dividend amount/rounding';end if;
 if(select count(*) from public.manual_ledger where kind='dividend')<>1 then raise exception 'duplicate dividend';end if;
 if exists(select 1 from public.manual_accounts a where a.cash_cents<>(select sum(delta_cents) from public.manual_ledger l where l.account_id=a.id)) then raise exception 'dividend ledger mismatch';end if;
end$$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin
 if (select count(*) from public.dividend_credits)<>1 then raise exception 'own credit missing';end if;
 begin perform public.dividend_manage(null,'{}');raise exception 'admin bypass' using errcode='XX000';exception when raise_exception then if sqlerrm<>'admin_required' then raise;end if;end;
 begin perform paper_private.settle_dividends();raise exception 'payment API exposed' using errcode='XX000';exception when insufficient_privilege then null;end;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$begin if exists(select 1 from public.dividend_credits) then raise exception 'credit A/B leak';end if;end$$;
select public.dividend_manage((select id from public.dividend_events where symbol='AAPL'),'{"status":"cancelled","version":1}');
reset role;
do $$begin if(select status from public.dividend_events where id=(select id from public.dividend_events where symbol='AAPL'))<>'review' or(select amount_units from public.dividend_events where id=(select id from public.dividend_events where symbol='AAPL'))<>2500 then raise exception 'paid correction overwritten';end if;end$$;
select 'PASS dividend entitlement, NY due boundary, tax rounding, zero shares, duplicate retry, RLS/admin denial and paid correction hold';
-- Multiple buys/partial sale, ex-day buy and liquidation: rights survive zero current holdings.
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update paper_private.test_clock set value='2026-10-30T14:00:00Z';
select public.manual_order(gen_random_uuid(),'{"symbol":"MSFT","side":"buy","quantity":10,"priceCents":100,"rateBps":0,"minCents":0,"source":"test","observedAt":"2026-10-30T13:59:00Z"}');
select public.manual_order(gen_random_uuid(),'{"symbol":"MSFT","side":"sell","quantity":3,"priceCents":100,"rateBps":0,"minCents":0,"source":"test","observedAt":"2026-10-30T13:59:00Z"}');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.manual_order(gen_random_uuid(),'{"symbol":"MSFT","side":"buy","quantity":1,"priceCents":100,"rateBps":0,"minCents":0,"source":"test","observedAt":"2026-10-30T13:59:00Z"}');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update paper_private.test_clock set value='2026-11-02T15:00:00Z';
select public.manual_order(gen_random_uuid(),'{"symbol":"MSFT","side":"buy","quantity":5,"priceCents":100,"rateBps":0,"minCents":0,"source":"test","observedAt":"2026-11-02T14:59:00Z"}');
select public.manual_order(gen_random_uuid(),'{"symbol":"MSFT","side":"sell","quantity":12,"priceCents":100,"rateBps":0,"minCents":0,"source":"test","observedAt":"2026-11-02T14:59:00Z"}');
select public.dividend_manage(null,'{"symbol":"MSFT","kind":"regular_cash","announced":"2026-01-01","ex_date":"2026-11-02","record_date":"2026-11-02","pay_date":"2026-11-03","amount_units":1000,"source_url":"https://www.microsoft.com/investor/test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"confirmed"}');
update paper_private.test_clock set value='2026-11-03T04:59:59Z';
select paper_private.settle_dividends();
do $$begin if exists(select 1 from public.dividend_credits c join public.dividend_events e on e.id=c.event_id where e.symbol='MSFT') then raise exception 'DST early payment';end if;end$$;
update paper_private.test_clock set value='2026-11-03T05:00:00Z';
create function paper_private.fail_dividend_test() returns trigger language plpgsql as $$begin if new.kind='dividend' and new.account_id=(select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000001') then raise exception 'injected_dividend_failure';end if;return new;end$$;
create trigger dividend_failure before insert on public.manual_ledger for each row execute function paper_private.fail_dividend_test();
select paper_private.settle_dividends();
do $$begin
 if exists(select 1 from public.dividend_credits c join public.dividend_events e on e.id=c.event_id where e.symbol='MSFT' and c.account_id=(select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000001')) then raise exception 'failed credit persisted';end if;
 if exists(select 1 from public.manual_accounts a where a.cash_cents<>(select sum(delta_cents) from public.manual_ledger l where l.account_id=a.id)) then raise exception 'failed dividend changed cash';end if;
 if (select count(*) from public.dividend_credits c join public.dividend_events e on e.id=c.event_id where e.symbol='MSFT')<>1 then raise exception 'other account payout damaged';end if;
 if not exists(select 1 from public.dividend_delivery_status where state='error') then raise exception 'missing failure status';end if;
end$$;
drop trigger dividend_failure on public.manual_ledger;drop function paper_private.fail_dividend_test();
select paper_private.settle_dividends();
do $$declare c public.dividend_credits%rowtype;begin
 select credit.* into strict c from public.dividend_credits credit join public.dividend_events e on e.id=credit.event_id where e.symbol='MSFT' and credit.account_id=(select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000001');
 if c.quantity<>7 or c.gross_cents<>70 or c.withholding_cents<>11 or c.net_cents<>59 then raise exception 'ex-day/full-sale entitlement or half-up';end if;
 if exists(select 1 from public.manual_positions where symbol='MSFT' and account_id=(select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000001')) then raise exception 'fixture failed to liquidate';end if;
end$$;
-- Unsupported special distributions never auto-confirm or pay.
select public.dividend_manage(null,'{"symbol":"NVDA","kind":"special_cash","announced":"2026-01-01","ex_date":"2026-10-27","record_date":"2026-10-27","pay_date":"2026-10-28","amount_units":10000,"source_url":"https://investor.nvidia.com/test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"confirmed"}');
do $$begin if(select status from public.dividend_events where symbol='NVDA')<>'review' then raise exception 'special auto confirmed';end if;end$$;
select 'PASS dividend late registration, partial buys/sales/ex-day exclusion/full liquidation, DST midnight, injected failure atomic rollback/retry and special distribution hold';
-- Unpaid revisions/cancellation/duplicate and untrusted sources are audited, not paid.
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$declare eid uuid;p jsonb;begin
 p:='{"symbol":"AMZN","kind":"regular_cash","announced":"2026-01-01","ex_date":"2026-10-27","record_date":"2026-10-27","pay_date":"2026-10-28","amount_units":1,"source_url":"https://ir.aboutamazon.com/test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"draft"}';
 eid:=public.dividend_manage(null,p);
 perform public.dividend_manage(eid,p||'{"version":1,"status":"confirmed","amount_units":1000}');
 if(select version from public.dividend_events where id=eid)<>2 then raise exception 'unpaid version';end if;
 begin perform public.dividend_manage(eid,p||'{"version":1}');raise exception 'stale admin accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'event_version_conflict' then raise;end if;end;
 perform public.dividend_manage(eid,p||'{"version":2,"status":"cancelled","amount_units":1000}');
 begin perform public.dividend_manage(null,p);raise exception 'duplicate accepted' using errcode='XX000';exception when unique_violation then null;end;
 begin perform public.dividend_manage(null,p||'{"source_url":"https://evil.example/dividend"}');raise exception 'untrusted source accepted' using errcode='XX000';exception when raise_exception then if sqlerrm<>'official_source_required' then raise;end if;end;
 if(select count(*) from paper_private.dividend_audit where event_id=eid)<>3 then raise exception 'missing immutable audit';end if;
 perform public.dividend_manage(eid,'{"enabled":false}');
 if(select enabled from paper_private.dividend_control where id) then raise exception 'halt failed';end if;
 perform paper_private.settle_dividends();
 perform public.dividend_manage(eid,'{"enabled":true}');
end$$;
select 'PASS unpaid revisions/cancellation, duplicate rejection, official-source allowlist, stale admin rejection, audit and pause/resume';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin
 begin insert into public.dividend_events default values;raise exception 'direct event write' using errcode='XX000';exception when insufficient_privilege then null;end;
 begin update public.dividend_credits set net_cents=1;raise exception 'direct credit write' using errcode='XX000';exception when insufficient_privilege then null;end;
 begin delete from public.dividend_entitlements;raise exception 'direct entitlement write' using errcode='XX000';exception when insufficient_privilege then null;end;
end$$;
reset role;
set role anon;
do $$begin begin perform public.dividend_manage(null,'{}');raise exception 'anon admin API' using errcode='XX000';exception when insufficient_privilege then null;end;end$$;
reset role;
select 'PASS dividend direct-write and anonymous admin API denial';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update paper_private.test_clock set value='2026-10-26T14:00:00Z';
select public.manual_order(gen_random_uuid(),'{"symbol":"NVDA","side":"buy","quantity":1,"priceCents":100,"rateBps":0,"minCents":0,"source":"test","observedAt":"2026-10-26T13:59:00Z"}');
select public.dividend_manage(null,'{"symbol":"NVDA","kind":"regular_cash","announced":"2026-01-01","ex_date":"2026-10-27","record_date":"2026-10-27","pay_date":"2026-10-28","amount_units":1,"source_url":"https://investor.nvidia.com/test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"confirmed"}');
update paper_private.test_clock set value='2026-11-03T15:00:00Z';
select paper_private.settle_dividends();
do $$begin
 if exists(select 1 from public.dividend_credits c join public.dividend_events e on e.id=c.event_id where e.symbol='NVDA') then raise exception 'zero cent credited';end if;
 if not exists(select 1 from public.dividend_delivery_status d join public.dividend_events e on e.id=d.event_id where e.symbol='NVDA' and d.state='zero') then raise exception 'missing zero amount status';end if;
 if exists(select 1 from public.manual_accounts a where a.cash_cents<>(select sum(delta_cents) from public.manual_ledger where account_id=a.id)) then raise exception 'zero amount ledger mutation';end if;
end$$;
select 'PASS sub-cent dividend rounds to zero without a cash/credit entry';
