begin;
revoke all on public.paper_prices from authenticated;
grant select on public.paper_prices to authenticated;
create or replace function public.paper_order(p_request_id uuid,p_symbol text,p_side text,p_quantity bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid; a public.paper_accounts%rowtype; old public.paper_positions%rowtype; prior public.paper_orders%rowtype;
 price bigint; value numeric; basis bigint; qty bigint; cost bigint; delta bigint; oid uuid;
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
 update public.paper_accounts set cash_cents=cash_cents+delta,realized_cents=realized_cents+case when p_side='sell' then value-basis else 0 end where id=aid;
 if qty=0 then delete from public.paper_positions where account_id=aid and symbol=p_symbol;
 else insert into public.paper_positions(account_id,symbol,quantity,cost_cents) values(aid,p_symbol,qty,cost) on conflict(account_id,symbol) do update set quantity=excluded.quantity,cost_cents=excluded.cost_cents;end if;
 insert into public.paper_orders(account_id,client_request_id,symbol,side,quantity,status,price_cents,filled_at) values(aid,p_request_id,p_symbol,p_side,p_quantity,'filled',price,clock_timestamp()) returning id into oid;
 insert into public.paper_cash_ledger(account_id,order_id,kind,delta_cents,balance_cents) values(aid,oid,'trade',delta,a.cash_cents+delta);
 return public.paper_snapshot();
end$$;
commit;
