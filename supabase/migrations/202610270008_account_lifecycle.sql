-- AC1-A1 STAGING ONLY: DO NOT APPLY TO PRODUCTION WITHOUT EXPLICIT APPROVAL.
-- Keeps every previous order, position, and ledger immutable and scoped to its account.
-- Requires existing 001-003; does not affect manual_accounts or real trading.
begin;
alter table public.paper_accounts
 add column status text not null default 'active' check(status in ('active','closed')),
 add column closed_at timestamptz,
 add constraint paper_account_status_time check(
   (status='active' and closed_at is null) or (status='closed' and closed_at is not null)
 );
alter table public.paper_accounts drop constraint one_paper_account_per_user;
create unique index paper_one_active_per_user on public.paper_accounts(user_id) where status='active';
create index paper_account_history_by_user on public.paper_accounts(user_id,created_at desc,id);

-- Locks all lifecycle operations for one auth user, including first snapshot auto-creation.
-- No implicit recreation is allowed once any account has been closed.
create or replace function public.paper_account_id() returns uuid language plpgsql security definer set search_path='' as $$
declare aid uuid;uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'authentication_required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,1));
 select id into aid from public.paper_accounts where user_id=uid and status='active' for update;
 if aid is not null then return aid;end if;
 if exists(select 1 from public.paper_accounts where user_id=uid) then
  raise exception 'account_closed';
 end if;
 -- Legacy first-login behavior preserved: first snapshot opens one active account.
 insert into public.paper_accounts(user_id) values(uid) returning id into aid;
 insert into public.paper_cash_ledger(account_id,kind,delta_cents,balance_cents)
 values(aid,'initial_funding',10000000,10000000);
 return aid;
end$$;

-- This RPC is explicit on every recreation; existing active accounts are never reset.
create function public.paper_open_account() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();aid uuid;
begin
 if uid is null then raise exception 'authentication_required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,1));
 if exists(select 1 from public.paper_accounts where user_id=uid and status='active') then
  raise exception 'account_already_active';
 end if;
 insert into public.paper_accounts(user_id) values(uid) returning id into aid;
 insert into public.paper_cash_ledger(account_id,kind,delta_cents,balance_cents)
 values(aid,'initial_funding',10000000,10000000);
 return public.paper_snapshot();
end$$;

-- A closure preserves positions/trades/cash/ledger for read-only history.
-- Stale close requests cannot close a newer account.
create function public.paper_close_account(p_expected_account_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();aid uuid;
begin
 if uid is null then raise exception 'authentication_required';end if;
 if p_expected_account_id is null then raise exception 'invalid_account';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,1));
 select id into aid from public.paper_accounts where user_id=uid and status='active' for update;
 if aid is null then
  if exists(select 1 from public.paper_accounts where user_id=uid and id=p_expected_account_id and status='closed') then
   return jsonb_build_object('status','closed','id',p_expected_account_id);
  end if;
  raise exception 'account_not_found';
 end if;
 if aid<>p_expected_account_id then raise exception 'account_changed';end if;
 update public.paper_accounts set status='closed',closed_at=clock_timestamp()
 where id=aid and user_id=uid and status='active';
 return jsonb_build_object('status','closed','id',aid);
end$$;

-- Unlike paper_snapshot(), this read-only overview never creates an account.
create function public.paper_accounts_overview() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();items jsonb;active_id uuid;
begin
 if uid is null then raise exception 'authentication_required';end if;
 select a.id into active_id from public.paper_accounts a where a.user_id=uid and a.status='active';
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',a.id,'status',a.status,'createdAt',a.created_at,'closedAt',a.closed_at,
  'cash',a.cash_cents::text,'realized',a.realized_cents::text,
  'tradeCount',(select count(*) from public.paper_orders o where o.account_id=a.id)
 ) order by a.created_at desc,a.id desc),'[]'::jsonb)
 into items from public.paper_accounts a where a.user_id=uid;
 return jsonb_build_object('activeId',active_id,'accounts',items);
end$$;

-- Preserve all market-hours/idempotency/cash/ledger safeguards of migration 003.
-- Only append protection against replaying a closed account's request ID.
create or replace function public.paper_order(p_request_id uuid,p_symbol text,p_side text,p_quantity bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid; a public.paper_accounts%rowtype; old public.paper_positions%rowtype; prior public.paper_orders%rowtype;
 price bigint; value numeric; basis bigint; qty bigint; cost bigint; delta bigint; oid uuid; gate jsonb; result jsonb; finished_at timestamptz;
begin
 if p_request_id is null or p_side is null or p_side not in ('buy','sell') or p_quantity is null or p_quantity<1 or p_quantity>1000000000 then raise exception 'invalid_order';end if;
 aid:=public.paper_account_id();
 select * into a from public.paper_accounts where id=aid for update;
 select * into prior from public.paper_orders where account_id=aid and client_request_id=p_request_id;
 if found then
  if (prior.symbol,prior.side,prior.quantity) is distinct from (p_symbol,p_side,p_quantity) then raise exception 'idempotency_conflict';end if;
  return public.paper_snapshot();
 end if;
 -- An old unsettled request token must never be executed against a newly opened account.
 if exists (
  select 1 from public.paper_orders old_order
  join public.paper_accounts archived on archived.id=old_order.account_id
  where archived.user_id=auth.uid() and archived.id<>aid and old_order.client_request_id=p_request_id
 ) then raise exception 'idempotency_conflict';end if;
 select price_cents into price from public.paper_prices where symbol=p_symbol;
 if price is null then raise exception 'unsupported_symbol';end if;
 value:=price::numeric*p_quantity;
 if value>9007199254740991 then raise exception 'unsafe_amount';end if;
 select * into old from public.paper_positions where account_id=aid and symbol=p_symbol;
 qty:=coalesce(old.quantity,0);cost:=coalesce(old.cost_cents,0);
 if p_side='buy' then
  if value>a.cash_cents then raise exception 'insufficient_cash';end if;
  qty:=qty+p_quantity;cost:=cost+value;delta:=-value;
 else
  if p_quantity>qty then raise exception 'insufficient_shares';end if;
  basis:=round(cost::numeric*p_quantity/qty);qty:=qty-p_quantity;cost:=cost-basis;delta:=value;
 end if;
 if cost>9007199254740991 or qty>1000000000 or a.cash_cents::numeric+delta>9007199254740991 or abs(a.realized_cents::numeric+case when p_side='sell' then value-basis else 0 end)>9007199254740991 then raise exception 'unsafe_amount';end if;
 -- Account lock is held. An operator halt waits for in-flight orders and blocks subsequent fills.
 perform 1 from paper_private.market_control where id=true for share;
 gate:=paper_private.market_state(clock_timestamp());
 if not coalesce((gate->>'canTrade')::boolean,false) then
  raise exception '%',case gate->>'state' when 'unknown' then 'market_unavailable' when 'halted' then 'market_halted' else 'market_closed' end;
 end if;
 update public.paper_accounts set cash_cents=cash_cents+delta,realized_cents=realized_cents+case when p_side='sell' then value-basis else 0 end where id=aid;
 if qty=0 then delete from public.paper_positions where account_id=aid and symbol=p_symbol;
 else insert into public.paper_positions(account_id,symbol,quantity,cost_cents) values(aid,p_symbol,qty,cost) on conflict(account_id,symbol) do update set quantity=excluded.quantity,cost_cents=excluded.cost_cents;end if;
 insert into public.paper_orders(account_id,client_request_id,symbol,side,quantity,status,price_cents,filled_at) values(aid,p_request_id,p_symbol,p_side,p_quantity,'filled',price,clock_timestamp()) returning id into oid;
 insert into public.paper_cash_ledger(account_id,order_id,kind,delta_cents,balance_cents) values(aid,oid,'trade',delta,a.cash_cents+delta);
 result:=public.paper_snapshot();
 -- A trigger/statement/lock delay must not turn a pre-close request into an after-close fill.
 finished_at:=clock_timestamp();
 if finished_at>=(gate->>'closeAt')::timestamptz or not coalesce((paper_private.market_state(finished_at)->>'canTrade')::boolean,false) then raise exception 'market_closed';end if;
 return result;
end$$;

revoke all on function public.paper_account_id() from public,anon,authenticated;
revoke all on function public.paper_open_account(),public.paper_close_account(uuid),public.paper_accounts_overview() from public,anon;
grant execute on function public.paper_open_account(),public.paper_close_account(uuid),public.paper_accounts_overview() to authenticated;
revoke all on function public.paper_order(uuid,text,text,bigint) from public,anon;
grant execute on function public.paper_order(uuid,text,text,bigint) to authenticated;
commit;
