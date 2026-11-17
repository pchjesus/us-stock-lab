-- AC1-A1 regression. ONLY disposable local PostgreSQL seeded with migrations 001-003 + 008.
insert into auth.users(id) values
('00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000002');

-- Force a market-open window ONLY in this disposable database to exercise paper_order.
update paper_private.market_days
set open_at=clock_timestamp()-interval '1 hour',
    close_at=clock_timestamp()+interval '1 hour',
    reason='AC1 isolated trade fixture',early=false,verified=true
where date=(clock_timestamp() at time zone 'America/New_York')::date;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$
declare snapshot jsonb;first_account uuid;closed jsonb;overview jsonb;second_account uuid;old_order uuid:='10000000-0000-0000-0000-000000000011';
begin
 overview:=public.paper_accounts_overview();
 if overview->'accounts'<>'[]'::jsonb or overview->>'activeId' is not null then raise exception 'overview created an account';end if;
 snapshot:=public.paper_snapshot();
 first_account:=(snapshot->>'id')::uuid;
 if (snapshot->>'cash')::bigint<>10000000 then raise exception 'first automatic funding failed';end if;
 if (select count(*) from public.paper_accounts where user_id=auth.uid())<>1 then raise exception 'first snapshot not unique';end if;
 if (select count(*) from public.paper_cash_ledger where account_id=first_account and kind='initial_funding')<>1 then raise exception 'missing initial ledger';end if;
 if (public.paper_snapshot()->>'id')::uuid<>first_account then raise exception 'snapshot recreated active account';end if;
 -- Execute an actual market-gated server order. This persists positions and ledger atomically.
 snapshot:=public.paper_order(old_order,'AAPL','buy',1);
 if (snapshot->>'cash')::bigint<>9977626 then raise exception 'test order cash mismatch';end if;
 snapshot:=public.paper_snapshot();
 if jsonb_array_length(snapshot->'trades')<>1 then raise exception 'trade not in current snapshot';end if;
 closed:=public.paper_close_account(first_account);
 if closed->>'status'<>'closed' or (closed->>'id')::uuid<>first_account then raise exception 'close failed';end if;
 if (select status from public.paper_accounts where id=first_account)<>'closed' then raise exception 'closure status missing';end if;
 overview:=public.paper_accounts_overview();
 if overview->>'activeId' is not null or jsonb_array_length(overview->'accounts')<>1 then raise exception 'closed overview incorrect';end if;
 if (public.paper_archived_snapshot(first_account)->>'cash')::bigint<>9977626 then raise exception 'archive changed cash';end if;
 if jsonb_array_length(public.paper_archived_snapshot(first_account)->'trades')<>1 then raise exception 'archive lost trades';end if;
 if jsonb_array_length(public.paper_archived_snapshot(first_account)->'ledger')<>2 then raise exception 'archive lost ledger';end if;
 if public.paper_close_account(first_account)->>'status'<>'closed' then raise exception 'repeat closure not idempotent';end if;
 begin
  perform public.paper_snapshot();
  raise exception 'unexpected_automatic_recreation';
 exception when others then
  if SQLERRM<>'account_closed' then raise;end if;
 end;
 begin
  perform public.paper_order('10000000-0000-0000-0000-000000000099','AAPL','buy',1);
  raise exception 'unexpected_order_after_closure';
 exception when others then
  if SQLERRM<>'account_closed' then raise;end if;
 end;
 if (select count(*) from public.paper_accounts where user_id=auth.uid())<>1 then raise exception 'closed account auto recreated';end if;
 snapshot:=public.paper_open_account();
 second_account:=(snapshot->>'id')::uuid;
 if first_account=second_account or (snapshot->>'cash')::bigint<>10000000 or jsonb_array_length(snapshot->'trades')<>0 then raise exception 'reopened account not fresh';end if;
 if (select count(*) from public.paper_accounts where user_id=auth.uid() and status='active')<>1 then raise exception 'active account duplicate';end if;
 if (select count(*) from public.paper_cash_ledger where account_id=second_account and kind='initial_funding')<>1 then raise exception 'reopen ledger missing';end if;
 if jsonb_array_length(public.paper_archived_snapshot(first_account)->'trades')<>1 then raise exception 'old archive mutated on open';end if;
 begin
  perform public.paper_order(old_order,'AAPL','buy',1);
  raise exception 'old_request_id_replayed';
 exception when others then
  if SQLERRM<>'idempotency_conflict' then raise;end if;
 end;
 begin
  perform public.paper_close_account(first_account);
  raise exception 'stale_close_closed_new_account';
 exception when others then
  if SQLERRM<>'account_changed' then raise;end if;
 end;
 begin
  perform public.paper_open_account();
  raise exception 'duplicate_active_created';
 exception when others then
  if SQLERRM<>'account_already_active' then raise;end if;
 end;
 if (select status from public.paper_accounts where id=second_account)<>'active' then raise exception 'stale close modified current account';end if;
 -- No one may directly make a second active account even if the RPC were bypassed by an owner.
end$$;
reset role;
do $$
begin
 begin
  insert into public.paper_accounts(user_id) values('00000000-0000-0000-0000-000000000001');
  raise exception 'duplicate_active_insert_passed';
 exception when unique_violation then null;
 end;
end$$;

-- Other signed-in users cannot see or close owner A's archived account.
-- Store a known foreign account ID from a privileged fixture before changing the role.
select pg_catalog.set_config('ac1.test.foreign_closed_id',(select id::text from public.paper_accounts where user_id='00000000-0000-0000-0000-000000000001' and status='closed' limit 1),false);
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$
declare first_account uuid;overview jsonb;snapshot jsonb;
begin
 first_account:=current_setting('ac1.test.foreign_closed_id')::uuid;
 overview:=public.paper_accounts_overview();
 if jsonb_array_length(overview->'accounts')<>0 then raise exception 'other owner accounts leaked';end if;
 begin
  perform public.paper_archived_snapshot(first_account);
  raise exception 'cross_owner_archive_read';
 exception when others then
  if SQLERRM<>'account_not_found' then raise;end if;
 end;
 snapshot:=public.paper_snapshot();
 if (snapshot->>'cash')::bigint<>10000000 then raise exception 'other user first account invalid';end if;
 begin
  perform public.paper_close_account(first_account);
  raise exception 'cross_owner_close';
 exception when others then
  if SQLERRM<>'account_changed' then raise;end if;
 end;
 if (select count(*) from public.paper_accounts)<>1 then raise exception 'RLS leaked another owner';end if;
 begin
  update public.paper_accounts set status='closed' where user_id=auth.uid();
  raise exception 'client_changed_account';
 exception when insufficient_privilege then null;
 end;
end$$;
reset role;
set role anon;
do $$
begin
 begin
  perform public.paper_accounts_overview();
  raise exception 'anonymous_overview_allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.paper_open_account();
  raise exception 'anonymous_open_allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.paper_close_account('00000000-0000-0000-0000-000000000001');
  raise exception 'anonymous_close_allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.paper_archived_snapshot('00000000-0000-0000-0000-000000000001');
  raise exception 'anonymous_archive_allowed';
 exception when insufficient_privilege then null;
 end;
end$$;
reset role;
-- Final server ownership proof across both users; archived rows and account balances persist.
do $$
begin
 if (select count(*) from public.paper_accounts where user_id='00000000-0000-0000-0000-000000000001')<>2 then raise exception 'user A history missing';end if;
 if (select count(*) from public.paper_accounts where user_id='00000000-0000-0000-0000-000000000002')<>1 then raise exception 'user B active missing';end if;
 if (select count(*) from public.paper_cash_ledger where kind='initial_funding')<>3 then raise exception 'funding count corrupt';end if;
 if (select count(*) from public.paper_orders)<>1 then raise exception 'historical orders lost';end if;
end$$;
select 'PASS AC1 account close/reopen archive safety, no implicit recreation, replay protection and RLS' as result;
