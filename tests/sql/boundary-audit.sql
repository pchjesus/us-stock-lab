-- Extreme synthetic values ONLY in this disposable transaction. Not official data.
begin;
insert into auth.users values('00000000-0000-0000-0000-000000000004');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
update paper_private.test_clock set value='2026-11-03T15:00:00Z';
do $$declare a jsonb;o jsonb;begin
 o:='{"symbol":"MSFT","side":"buy","quantity":9000000,"priceCents":1,"rateBps":10,"minCents":0,"source":"isolated integer boundary","observedAt":"2026-11-03T14:59:00Z"}';
 a:=public.manual_snapshot();perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,1,o);
 a:=public.manual_snapshot();perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,1,o||'{"side":"sell","priceCents":100000000}');
 a:=public.manual_snapshot();perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,1,o||'{"symbol":"AAPL","quantity":1000000000}');
end$$;
-- Under the old RPC gross=1e16 with 50% fees could have safe final cash, cost,
-- realized and cumulative fees, yet the shipping client cannot replay gross.
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.manual_fee_policy_set((select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000004'),1,5000,0,'isolated overflow regression');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
do $$declare a jsonb;o jsonb;begin
 a:=public.manual_snapshot();o:='{"symbol":"AAPL","side":"sell","quantity":100000000,"priceCents":100000000,"rateBps":5000,"minCents":0,"source":"isolated boundary","observedAt":"2026-11-03T14:59:00Z"}';
 begin perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,2,o);raise exception 'unsafe gross fill' using errcode='XX000';exception when raise_exception then if sqlerrm<>'unsafe_amount' then raise;end if;end;
 if (public.manual_snapshot()-'market') is distinct from (a-'market') then raise exception 'gross rejection mutated finance';end if;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.manual_fee_policy_set((select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000004'),2,10,0,'restore fixture policy');
do $$declare d date;begin
 foreach d in array array['2026-11-04','2026-11-05','2026-11-06','2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-16']::date[] loop
  perform public.dividend_manage(null,jsonb_build_object('symbol','AAPL','kind','regular_cash','announced','2026-01-01','ex_date',d,'record_date',d,'pay_date',d,'amount_units',100000000,'source_url','https://investor.apple.com/test-fixture','verified_at','2026-10-26T00:00:00Z','standard_tax',true,'status','confirmed'));
 end loop;
end$$;
update paper_private.test_clock set value='2026-11-20T15:00:00Z';
select paper_private.settle_dividends();
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
do $$declare a jsonb;begin
 a:=public.manual_snapshot();
 if(select sum(gross_cents::numeric) from public.dividend_credits where account_id=(a->>'id')::uuid)<>9000000000000000 then raise exception 'boundary gross setup';end if;
 if(select sum(net_cents::numeric) from public.dividend_credits where account_id=(a->>'id')::uuid)<>7650000000000000 then raise exception 'boundary tax setup';end if;
 -- Spending proceeds makes cash safe for a tenth credit; lifetime gross is not.
 perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,3,'{"symbol":"GOOGL","side":"buy","quantity":80000000,"priceCents":100000000,"rateBps":10,"minCents":0,"source":"isolated boundary","observedAt":"2026-11-20T14:59:00Z"}');
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.dividend_manage(null,'{"symbol":"AAPL","kind":"regular_cash","announced":"2026-01-01","ex_date":"2026-11-17","record_date":"2026-11-17","pay_date":"2026-11-17","amount_units":100000000,"source_url":"https://investor.apple.com/test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"confirmed"}');
create temp table boundary_before as select a.id,a.cash_cents,a.revision,(select count(*) from public.manual_ledger where account_id=a.id) as ledger_count from public.manual_accounts a where user_id='00000000-0000-0000-0000-000000000004';
select paper_private.settle_dividends();select paper_private.settle_dividends();
do $$begin
 if exists(select 1 from boundary_before b join public.manual_accounts a using(id) where a.cash_cents<>b.cash_cents or a.revision<>b.revision or (select count(*) from public.manual_ledger where account_id=b.id)<>b.ledger_count) then raise exception 'overflow payout mutated account';end if;
 if exists(select 1 from public.dividend_credits c join public.dividend_events e on e.id=c.event_id join boundary_before b on b.id=c.account_id where e.ex_date='2026-11-17') then raise exception 'overflow payout persisted';end if;
 if not exists(select 1 from public.dividend_delivery_status s join public.dividend_events e on e.id=s.event_id join boundary_before b on b.id=s.account_id where e.ex_date='2026-11-17' and s.state='error') then raise exception 'overflow failure not surfaced';end if;
 if exists(select 1 from public.manual_accounts a where cash_cents<>(select sum(delta_cents::numeric) from public.manual_ledger where account_id=a.id)) then raise exception 'boundary ledger invariant';end if;
end$$;
-- Real SQL history for a negative sale net whose delta-minus-basis is outside
-- JS exact integers, even though the final accumulated realized P/L is safe.
create function pg_temp.boundary_order(s text,d text,q bigint,p bigint) returns void language plpgsql as $$
declare a jsonb;begin
 a:=public.manual_snapshot();perform public.manual_order_v2(gen_random_uuid(),(a->>'revision')::bigint,(a->'fee_policy'->>'version')::integer,jsonb_build_object('symbol',s,'side',d,'quantity',q,'priceCents',p,'rateBps',(a->'fee_policy'->>'rate_bps')::integer,'minCents',(a->'fee_policy'->>'min_cents')::bigint,'source','isolated signed intermediate','observedAt','2026-11-20T14:59:00Z'));
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.manual_fee_policy_set((select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000004'),3,0,0,'signed replay fixture');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select pg_temp.boundary_order('GOOGL','sell',80000000,100000000);
select pg_temp.boundary_order('AAPL','sell',1000000000,466100);
select pg_temp.boundary_order('AAPL','buy',1,1);select pg_temp.boundary_order('AAPL','sell',1,100000000);
select pg_temp.boundary_order('AAPL','buy',1,1);select pg_temp.boundary_order('AAPL','sell',1,100000000);
select pg_temp.boundary_order('AAPL','buy',1,1);select pg_temp.boundary_order('AAPL','sell',1,54749994);
do $$begin if(public.manual_snapshot()->>'cash')::bigint<>9007199254740991 then raise exception 'safe max setup';end if;end$$;
select pg_temp.boundary_order('MSFT','buy',1,1);
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.manual_fee_policy_set((select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000004'),4,0,54740990,'signed replay buy fee');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select pg_temp.boundary_order('AAPL','buy',90071992,100000000);
select pg_temp.boundary_order('MSFT','sell',1,100000000);
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.manual_fee_policy_set((select id from public.manual_accounts where user_id='00000000-0000-0000-0000-000000000004'),5,0,99999999,'signed replay negative net');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select pg_temp.boundary_order('AAPL','sell',90071992,1);
do $$declare a jsonb;begin
 a:=public.manual_snapshot();if(a->>'cash')::bigint<>35331003 or (a->>'realized')::bigint<>-7649999974668997 or jsonb_array_length(a->'positions')<>0 then raise exception 'signed replay exact output';end if;
end$$;
select 'BOUNDARY_SNAPSHOT:'||public.manual_snapshot()::text;
rollback;
select 'PASS safe-final/unsafe-gross rejection and cumulative dividend overflow rollback/retry';
