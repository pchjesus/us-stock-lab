begin;
-- Private operational tables: no new PostgREST endpoint or client-write capability.
create schema paper_private;
revoke all on schema paper_private from public,anon,authenticated;
create table paper_private.market_days(
 date date primary key,open_at timestamptz,close_at timestamptz,reason text not null,
 early boolean not null,verified boolean not null,
 check((open_at is null and close_at is null) or (open_at is not null and close_at is not null and open_at<close_at))
);
create table paper_private.market_control(id boolean primary key default true check(id),enabled boolean not null,reason text not null);
insert into paper_private.market_control values(true,true,'운영자 신규 체결 중단');
alter table paper_private.market_days enable row level security;
alter table paper_private.market_control enable row level security;
revoke all on paper_private.market_days,paper_private.market_control from public,anon,authenticated;
-- BEGIN SHARED CALENDAR (generated from src/market-calendar.json)
with contract as (select '{"version":"nyse-nasdaq-2026-2027-v1","verifiedOn":"2026-10-27","sources":["https://www.nyse.com/trade/hours-calendars","https://www.nyse.com/trade/trading-information","https://www.nasdaq.com/market-activity/stock-market-holiday-schedule"],"start":"2026-01-01","end":"2027-12-31","years":{"2026":{"holidays":{"2026-01-01":"새해","2026-01-19":"MLK Day","2026-02-16":"대통령의 날","2026-04-03":"성금요일","2026-05-25":"메모리얼 데이","2026-06-19":"Juneteenth","2026-07-03":"독립기념일 대체휴일","2026-09-07":"노동절","2026-11-26":"추수감사절","2026-12-25":"성탄절"},"earlyCloses":["2026-11-27","2026-12-24"]},"2027":{"holidays":{"2027-01-01":"새해","2027-01-18":"MLK Day","2027-02-15":"대통령의 날","2027-03-26":"성금요일","2027-05-31":"메모리얼 데이","2027-06-18":"Juneteenth 대체휴일","2027-07-05":"독립기념일 대체휴일","2027-09-06":"노동절","2027-11-25":"추수감사절","2027-12-24":"성탄절 대체휴일"},"earlyCloses":["2027-11-26"]}}}'::jsonb as data), days as (
 select day::date as date, data from contract,
 generate_series((data->>'start')::date::timestamp,(data->>'end')::date::timestamp,interval '1 day') day
), calendar as (
 select date,data->'years'->to_char(date,'YYYY')->'holidays'->>date::text as holiday,
 (data->'years'->to_char(date,'YYYY')->'earlyCloses') ? date::text as early,
 extract(isodow from date) in (6,7) as weekend from days
)
insert into paper_private.market_days(date,open_at,close_at,reason,early,verified)
select date,
 case when holiday is null and not weekend then (date+time '09:30') at time zone 'America/New_York' end,
 case when holiday is null and not weekend then (date+case when early then time '13:00' else time '16:00' end) at time zone 'America/New_York' end,
 coalesce(holiday,case when weekend then '주말' when early then '조기폐장 · 09:30~13:00 ET' else '정규장 · 09:30~16:00 ET' end),early,true from calendar;
-- END SHARED CALENDAR
-- Not a public RPC; security INVOKER, inaccessible to clients. Only server callers supply time.
create function paper_private.market_state(p_now timestamptz) returns jsonb language plpgsql volatile set search_path='' as $$
declare d paper_private.market_days%rowtype;c paper_private.market_control%rowtype;state text;reason text;
begin
 select * into c from paper_private.market_control where id=true;
 select * into d from paper_private.market_days where date=(p_now at time zone 'America/New_York')::date;
 if c.id is null or d.date is null or not d.verified or p_now is null then state:='unknown';reason:='일정 미확인 · 신규 주문 제한';
 elsif not c.enabled then state:='halted';reason:=c.reason;
 elsif d.open_at is null then state:='holiday';reason:=d.reason;
 elsif p_now<d.open_at then state:='before';reason:=d.reason;
 elsif p_now>=d.close_at then state:='closed';reason:=d.reason;
 else state:='open';reason:=d.reason;end if;
 return jsonb_build_object('canTrade',state='open','state',state,'reason',reason,'date',coalesce(d.date::text,''),
 'serverNow',p_now,'openAt',d.open_at,'closeAt',d.close_at,'early',coalesce(d.early,false));
end$$;
revoke all on function paper_private.market_state(timestamptz) from public,anon,authenticated;
create or replace function public.paper_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid; result jsonb;
begin
 aid:=public.paper_account_id();
 select jsonb_build_object('id',a.id,'cash',a.cash_cents::text,'realized',a.realized_cents::text,
 'positions',coalesce((select jsonb_agg(jsonb_build_object('symbol',p.symbol,'quantity',p.quantity::text,'cost',p.cost_cents::text)) from public.paper_positions p where p.account_id=aid),'[]'::jsonb),
 'trades',coalesce((select jsonb_agg(jsonb_build_object('id',o.client_request_id,'symbol',o.symbol,'side',o.side,'quantity',o.quantity::text,'price',o.price_cents::text,'time',o.filled_at) order by o.execution_seq) from public.paper_orders o where o.account_id=aid and o.status='filled'),'[]'::jsonb),
 'prices',(select jsonb_object_agg(symbol,price_cents::text) from public.paper_prices)) into result from public.paper_accounts a where a.id=aid;
 return result || jsonb_build_object('market',paper_private.market_state(clock_timestamp()));
end$$;
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
-- CREATE OR REPLACE preserves grants; assert/restrict explicitly for review.
revoke all on function public.paper_order(uuid,text,text,bigint),public.paper_snapshot() from public,anon;
grant execute on function public.paper_order(uuid,text,text,bigint),public.paper_snapshot() to authenticated;
commit;
