insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
update public.paper_prices set price_cents=10000 where symbol='AAPL';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.paper_snapshot();
select public.paper_snapshot();
select public.paper_order('10000000-0000-0000-0000-000000000001','AAPL','buy',10);
select public.paper_order('10000000-0000-0000-0000-000000000001','AAPL','buy',10);
reset role;
do $$begin
 if(select count(*) from public.paper_accounts)<>1 or (select count(*) from public.paper_cash_ledger where kind='initial_funding')<>1 or(select count(*) from public.paper_orders)<>1 then raise exception 'duplicate initialization/order';end if;
end$$;
update public.paper_prices set price_cents=8000 where symbol='AAPL';
set role authenticated;
select public.paper_order('10000000-0000-0000-0000-000000000002','AAPL','buy',5);
reset role;
do $$begin
 if (select cost_cents from public.paper_positions)<>140000 or(select round(cost_cents::numeric/quantity) from public.paper_positions)<>9333 then raise exception 'weighted average';end if;
end$$;
update public.paper_prices set price_cents=11000 where symbol='AAPL';
set role authenticated;
select public.paper_order('10000000-0000-0000-0000-000000000003','AAPL','sell',5);
reset role;
do $$begin
 if(select cost_cents from public.paper_positions)<>93333 or(select realized_cents from public.paper_accounts)<>8333 then raise exception 'partial allocation';end if;
end$$;
set role authenticated;
select public.paper_order('10000000-0000-0000-0000-000000000004','AAPL','sell',10);
do $$declare n bigint;begin
 foreach n in array array[0,-1,1000000001]::bigint[] loop
 begin perform public.paper_order(gen_random_uuid(),'AAPL','buy',n);raise exception 'invalid accepted' using errcode='XX000';exception when raise_exception then null;end;end loop;
 begin perform public.paper_order(gen_random_uuid(),'AAPL','buy',1000000);raise exception 'overdraft accepted' using errcode='XX000';exception when raise_exception then null;end;
 begin perform public.paper_order(gen_random_uuid(),'AAPL','sell',1);raise exception 'oversell accepted' using errcode='XX000';exception when raise_exception then null;end;
 begin perform public.paper_order('10000000-0000-0000-0000-000000000004','AAPL','sell',9);raise exception 'id conflict accepted' using errcode='XX000';exception when raise_exception then null;end;
 begin perform public.paper_account_id();raise exception 'internal helper callable' using errcode='XX000';exception when insufficient_privilege then null;end;
end$$;
reset role;
do $$begin
 if exists(select 1 from public.paper_positions) or(select realized_cents from public.paper_accounts)<>25000 or(select cash_cents from public.paper_accounts)<>10025000 then raise exception 'liquidation invariant';end if;
 if(select sum(delta_cents) from public.paper_cash_ledger)<>(select cash_cents from public.paper_accounts) then raise exception 'cash ledger mismatch';end if;
end$$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.paper_snapshot();
do $$begin if(select count(*) from public.paper_accounts)<>1 or exists(select 1 from public.paper_orders) or exists(select 1 from public.paper_cash_ledger where kind='trade') then raise exception 'cross user leak';end if;end$$;
reset role;
create function public.test_fail() returns trigger language plpgsql as $$begin if new.kind='trade' then raise exception 'injected_failure';end if;return new;end$$;
create trigger injected_failure before insert on public.paper_cash_ledger for each row execute function public.test_fail();
set role authenticated;
do $$begin begin perform public.paper_order(gen_random_uuid(),'AAPL','buy',1);raise exception 'failure was ignored' using errcode='XX000';exception when raise_exception then null;end;end$$;
reset role;
drop trigger injected_failure on public.paper_cash_ledger;drop function public.test_fail();
do $$begin if(select cash_cents from public.paper_accounts where user_id='00000000-0000-0000-0000-000000000002')<>10000000 or exists(select 1 from public.paper_positions) or(select count(*) from public.paper_orders)<>4 then raise exception 'rollback failed';end if;end$$;
set role anon;
do $$begin begin perform public.paper_snapshot();raise exception 'anon RPC allowed' using errcode='XX000';exception when insufficient_privilege then null;end;end$$;
reset role;
select 'PASS server calculation, idempotency, isolation, rollback' as result;
