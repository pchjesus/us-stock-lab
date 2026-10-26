begin;
alter table public.paper_accounts add constraint one_paper_account_per_user unique(user_id);
alter table public.paper_accounts add column realized_cents bigint not null default 0;
alter table public.paper_accounts add constraint safe_cash check(cash_cents<=9007199254740991);
alter table public.paper_orders add column execution_seq bigint generated always as identity;
create index ledger_order_account on public.paper_cash_ledger(order_id,account_id);
create table public.paper_prices(symbol text primary key,price_cents bigint not null check(price_cents>0 and price_cents<=100000000),as_of timestamptz not null);
alter table public.paper_prices enable row level security;
grant select on public.paper_prices to authenticated;
create policy prices_read on public.paper_prices for select to authenticated using(true);
revoke all on public.paper_prices from anon;
insert into public.paper_prices values ('AAPL',22374,'2026-09-18T20:00:00Z'),('MSFT',41839,'2026-09-18T20:00:00Z'),('NVDA',14369,'2026-09-18T20:00:00Z'),('AMZN',20345,'2026-09-18T20:00:00Z'),('GOOGL',17460,'2026-09-18T20:00:00Z'),('VOO',53875,'2026-09-18T20:00:00Z'),('QQQ',49537,'2026-09-18T20:00:00Z'),('SCHD',2995,'2026-09-18T20:00:00Z');
create function public.paper_account_id() returns uuid language plpgsql security definer set search_path='' as $$
declare aid uuid; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'authentication_required';end if;
 insert into public.paper_accounts(user_id) values(uid) on conflict(user_id) do nothing;
 select id into aid from public.paper_accounts where user_id=uid for update;
 insert into public.paper_cash_ledger(account_id,kind,delta_cents,balance_cents) values(aid,'initial_funding',10000000,10000000) on conflict do nothing;
 return aid;
end$$;
revoke all on function public.paper_account_id() from public,anon,authenticated;
create function public.paper_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid; result jsonb;
begin
 aid:=public.paper_account_id();
 select jsonb_build_object('id',a.id,'cash',a.cash_cents::text,'realized',a.realized_cents::text,
 'positions',coalesce((select jsonb_agg(jsonb_build_object('symbol',p.symbol,'quantity',p.quantity::text,'cost',p.cost_cents::text)) from public.paper_positions p where p.account_id=aid),'[]'::jsonb),
 'trades',coalesce((select jsonb_agg(jsonb_build_object('id',o.client_request_id,'symbol',o.symbol,'side',o.side,'quantity',o.quantity::text,'price',o.price_cents::text,'time',o.filled_at) order by o.execution_seq) from public.paper_orders o where o.account_id=aid and o.status='filled'),'[]'::jsonb),
 'prices',(select jsonb_object_agg(symbol,price_cents::text) from public.paper_prices)) into result from public.paper_accounts a where a.id=aid;
 return result;
end$$;
create function public.paper_order(p_request_id uuid,p_symbol text,p_side text,p_quantity bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid; a public.paper_accounts%rowtype; old public.paper_positions%rowtype; prior public.paper_orders%rowtype;
 price bigint; value numeric; basis bigint; qty bigint; cost bigint; delta bigint; oid uuid;
begin
 if p_request_id is null or p_side is null or p_side not in ('buy','sell') or p_quantity is null or p_quantity<1 or p_quantity>1000000000 then raise exception 'invalid_order';end if;
 aid:=public.paper_account_id();
 select * into a from public.paper_accounts where id=aid for update;
 select * into prior from public.paper_orders where account_id=aid and client_request_id=p_request_id;
 if found then
  if prior.symbol<>p_symbol or prior.side<>p_side or prior.quantity<>p_quantity then raise exception 'idempotency_conflict';end if;
  return public.paper_snapshot();
 end if;
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
 update public.paper_accounts set cash_cents=cash_cents+delta,realized_cents=realized_cents+case when p_side='sell' then value-basis else 0 end where id=aid;
 if qty=0 then delete from public.paper_positions where account_id=aid and symbol=p_symbol;
 else insert into public.paper_positions(account_id,symbol,quantity,cost_cents) values(aid,p_symbol,qty,cost) on conflict(account_id,symbol) do update set quantity=excluded.quantity,cost_cents=excluded.cost_cents;end if;
 insert into public.paper_orders(account_id,client_request_id,symbol,side,quantity,status,price_cents,filled_at) values(aid,p_request_id,p_symbol,p_side,p_quantity,'filled',price,clock_timestamp()) returning id into oid;
 insert into public.paper_cash_ledger(account_id,order_id,kind,delta_cents,balance_cents) values(aid,oid,'trade',delta,a.cash_cents+delta);
 return public.paper_snapshot();
end$$;
revoke all on function public.paper_snapshot(),public.paper_order(uuid,text,text,bigint) from public,anon;
grant execute on function public.paper_snapshot(),public.paper_order(uuid,text,text,bigint) to authenticated;
commit;
