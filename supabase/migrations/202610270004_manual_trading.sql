-- v0.6 stage A: NOT applied to production. Separate from every paper_* balance.
begin;
create table public.manual_accounts(
 id uuid primary key default gen_random_uuid(),user_id uuid not null unique references auth.users(id) on delete cascade,
 cash_cents bigint not null default 10000000 check(cash_cents between 0 and 9007199254740991),
 realized_cents bigint not null default 0 check(abs(realized_cents::numeric)<=9007199254740991),
 fees_cents bigint not null default 0 check(fees_cents between 0 and 9007199254740991)
);
create table public.manual_orders(
 id uuid primary key default gen_random_uuid(),account_id uuid not null references public.manual_accounts(id) on delete cascade,
 request_id uuid not null,payload jsonb not null,symbol text not null,side text not null check(side in ('buy','sell')),
 quantity bigint not null check(quantity between 1 and 1000000000),price_cents bigint not null check(price_cents between 1 and 100000000),
 fee_cents bigint not null check(fee_cents>=0),basis_cents bigint not null check(basis_cents>=0),
 source text not null,observed_at timestamptz not null,received_at timestamptz not null,filled_at timestamptz not null,
 execution_seq bigint generated always as identity,unique(account_id,request_id),unique(id,account_id)
);
create table public.manual_positions(
 account_id uuid not null references public.manual_accounts(id) on delete cascade,symbol text not null,
 quantity bigint not null check(quantity between 1 and 1000000000),cost_cents bigint not null check(cost_cents between 0 and 9007199254740991),
 primary key(account_id,symbol)
);
create table public.manual_ledger(
 id bigint generated always as identity primary key,account_id uuid not null references public.manual_accounts(id) on delete cascade,
 order_id uuid unique,kind text not null check(kind in ('initial_funding','trade')),
 delta_cents bigint not null,balance_cents bigint not null check(balance_cents between 0 and 9007199254740991),
 foreign key(order_id,account_id) references public.manual_orders(id,account_id) on delete cascade,
 check((kind='initial_funding' and order_id is null and delta_cents=10000000) or(kind='trade' and order_id is not null))
);
create unique index manual_initial_once on public.manual_ledger(account_id) where kind='initial_funding';
create index manual_ledger_account on public.manual_ledger(account_id,id);
create index manual_orders_account on public.manual_orders(account_id,execution_seq);
alter table public.manual_accounts enable row level security;
alter table public.manual_orders enable row level security;
alter table public.manual_positions enable row level security;
alter table public.manual_ledger enable row level security;
create policy manual_account_read on public.manual_accounts for select to authenticated using(user_id=(select auth.uid()));
create policy manual_order_read on public.manual_orders for select to authenticated using(exists(select 1 from public.manual_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
create policy manual_position_read on public.manual_positions for select to authenticated using(exists(select 1 from public.manual_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
create policy manual_ledger_read on public.manual_ledger for select to authenticated using(exists(select 1 from public.manual_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
revoke all on public.manual_accounts,public.manual_orders,public.manual_positions,public.manual_ledger from public,anon,authenticated;
grant select on public.manual_accounts,public.manual_orders,public.manual_positions,public.manual_ledger to authenticated;
create function paper_private.manual_account_id() returns uuid language plpgsql set search_path='' as $$
declare aid uuid;uid uuid:=auth.uid();begin
 if uid is null then raise exception 'authentication_required';end if;
 insert into public.manual_accounts(user_id) values(uid) on conflict(user_id) do nothing;
 select id into aid from public.manual_accounts where user_id=uid for update;
 insert into public.manual_ledger(account_id,kind,delta_cents,balance_cents) values(aid,'initial_funding',10000000,10000000) on conflict do nothing;
 return aid;
end$$;
revoke all on function paper_private.manual_account_id() from public,anon,authenticated;
create function public.manual_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid;result jsonb;begin
 aid:=paper_private.manual_account_id();
 select jsonb_build_object('id',a.id,'cash',a.cash_cents::text,'realized',a.realized_cents::text,'fees',a.fees_cents::text,
 'positions',coalesce((select jsonb_agg(jsonb_build_object('symbol',p.symbol,'quantity',p.quantity::text,'cost',p.cost_cents::text)) from public.manual_positions p where p.account_id=aid),'[]'::jsonb),
 'orders',coalesce((select jsonb_agg(to_jsonb(o) order by o.execution_seq) from public.manual_orders o where o.account_id=aid),'[]'::jsonb),
 'ledger',coalesce((select jsonb_agg(to_jsonb(l) order by l.id) from public.manual_ledger l where l.account_id=aid),'[]'::jsonb),
 'market',paper_private.market_state(clock_timestamp())) into result from public.manual_accounts a where a.id=aid;
 return result;
end$$;
-- Request fields are user-recorded reference inputs, never represented as exchange executions.
create function public.manual_order(p_request_id uuid,p_order jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare aid uuid;a public.manual_accounts%rowtype;prior public.manual_orders%rowtype;pos public.manual_positions%rowtype;
 symbol text;side text;source text;qty bigint;price bigint;rate bigint;minimum bigint;fee numeric;value numeric;cost numeric;held bigint;basis bigint:=0;delta numeric;realized numeric:=0;oid uuid;observed timestamptz;received timestamptz:=clock_timestamp();gate jsonb;result jsonb;
begin
 if p_request_id is null or p_order is null or jsonb_typeof(p_order)<>'object' then raise exception 'invalid_order';end if;
 aid:=paper_private.manual_account_id();select * into a from public.manual_accounts where id=aid for update;
 select * into prior from public.manual_orders where account_id=aid and request_id=p_request_id;
 if found then if prior.payload is distinct from p_order then raise exception 'idempotency_conflict';end if;return public.manual_snapshot();end if;
 if (select count(*) from jsonb_object_keys(p_order))<>8 or not(p_order ?& array['symbol','side','quantity','priceCents','rateBps','minCents','source','observedAt']) then raise exception 'invalid_fields';end if;
 if exists(select 1 from jsonb_each(p_order) e where e.value='null'::jsonb) then raise exception 'invalid_order';end if;
 if (p_order->>'quantity')!~'^[1-9][0-9]{0,9}$' or (p_order->>'priceCents')!~'^[1-9][0-9]{0,8}$' or (p_order->>'rateBps')!~'^[0-9]{1,5}$' or (p_order->>'minCents')!~'^[0-9]{1,8}$' then raise exception 'invalid_number';end if;
 qty:=(p_order->>'quantity')::bigint;price:=(p_order->>'priceCents')::bigint;rate:=(p_order->>'rateBps')::bigint;minimum:=(p_order->>'minCents')::bigint;
 symbol:=p_order->>'symbol';side:=p_order->>'side';source:=p_order->>'source';
 if qty>1000000000 or price>100000000 or rate>10000 or side not in ('buy','sell') or length(source) not between 1 and 200 or not exists(select 1 from public.paper_prices p where p.symbol=symbol) then raise exception 'invalid_order';end if;
 if (p_order->>'observedAt')!~'(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'invalid_observation';end if;
 observed:=(p_order->>'observedAt')::timestamptz;
 if not isfinite(observed) or observed>received+interval '5 minutes' then raise exception 'invalid_observation';end if;
 value:=price::numeric*qty;fee:=greatest(minimum,round(value*rate/10000));
 select * into pos from public.manual_positions p where p.account_id=aid and p.symbol=symbol;
 held:=coalesce(pos.quantity,0);cost:=coalesce(pos.cost_cents,0);
 if side='buy' then
  delta:=-(value+fee);if -delta>a.cash_cents then raise exception 'insufficient_cash';end if;
  held:=held+qty;cost:=cost+value+fee;
 else
  if qty>held then raise exception 'insufficient_shares';end if;
  basis:=round(cost*qty/held);held:=held-qty;cost:=cost-basis;delta:=value-fee;realized:=delta-basis;
 end if;
 if a.cash_cents+delta<0 or a.cash_cents+delta>9007199254740991 or cost>9007199254740991 or held>1000000000 or abs(a.realized_cents+realized)>9007199254740991 or a.fees_cents+fee>9007199254740991 then raise exception 'unsafe_amount';end if;
 perform 1 from paper_private.market_control where id=true for share;gate:=paper_private.market_state(clock_timestamp());
 if not coalesce((gate->>'canTrade')::boolean,false) then raise exception 'market_closed';end if;
 update public.manual_accounts set cash_cents=a.cash_cents+delta,realized_cents=a.realized_cents+realized,fees_cents=a.fees_cents+fee where id=aid;
 if held=0 then delete from public.manual_positions p where p.account_id=aid and p.symbol=symbol;
 else insert into public.manual_positions values(aid,symbol,held,cost) on conflict on constraint manual_positions_pkey do update set quantity=excluded.quantity,cost_cents=excluded.cost_cents;end if;
 insert into public.manual_orders(account_id,request_id,payload,symbol,side,quantity,price_cents,fee_cents,basis_cents,source,observed_at,received_at,filled_at)
 values(aid,p_request_id,p_order,symbol,side,qty,price,fee,basis,source,observed,received,clock_timestamp()) returning id into oid;
 insert into public.manual_ledger(account_id,order_id,kind,delta_cents,balance_cents) values(aid,oid,'trade',delta,a.cash_cents+delta);
 result:=public.manual_snapshot();
 if clock_timestamp()>=(gate->>'closeAt')::timestamptz or not coalesce((paper_private.market_state(clock_timestamp())->>'canTrade')::boolean,false) then raise exception 'market_closed';end if;
 return result;
end$$;
revoke all on function public.manual_snapshot(),public.manual_order(uuid,jsonb) from public,anon;
grant execute on function public.manual_snapshot(),public.manual_order(uuid,jsonb) to authenticated;
commit;
