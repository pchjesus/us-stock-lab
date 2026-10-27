-- F audit hardening. Additive upgrade; never reprice historical trades or credits.
begin;
alter table public.manual_accounts add column revision bigint not null default 0 check(revision between 0 and 9007199254740991);
alter table public.manual_accounts add column fee_policy_version integer not null default 1;
create table paper_private.finance_admins(user_id uuid primary key references auth.users(id) on delete cascade);
alter table paper_private.finance_admins enable row level security;
revoke all on paper_private.finance_admins from public,anon,authenticated;
create table public.manual_fee_policies(
 account_id uuid not null references public.manual_accounts(id) on delete cascade,version integer not null check(version>0),
 rate_bps integer not null check(rate_bps between 0 and 10000),min_cents bigint not null check(min_cents between 0 and 99999999),
 created_at timestamptz not null default clock_timestamp(),created_by uuid,reason text not null,
 primary key(account_id,version)
);
alter table public.manual_fee_policies enable row level security;
create policy own_manual_fees on public.manual_fee_policies for select to authenticated using(exists(select 1 from public.manual_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
revoke all on public.manual_fee_policies from public,anon,authenticated;
grant select on public.manual_fee_policies to authenticated;
insert into public.manual_fee_policies(account_id,version,rate_bps,min_cents,reason) select id,1,10,0,'initial simulation policy; historical fees unchanged' from public.manual_accounts;
create function paper_private.manual_policy_seed() returns trigger language plpgsql set search_path='' as $$begin
 insert into public.manual_fee_policies(account_id,version,rate_bps,min_cents,reason) values(new.id,1,10,0,'initial simulation policy');return new;
end$$;
create trigger manual_policy_seed after insert on public.manual_accounts for each row execute function paper_private.manual_policy_seed();
alter table public.manual_accounts add constraint active_manual_policy foreign key(id,fee_policy_version) references public.manual_fee_policies(account_id,version) deferrable initially deferred;
create function paper_private.manual_revision() returns trigger language plpgsql set search_path='' as $$begin
 if (new.cash_cents,new.realized_cents,new.fees_cents,new.fee_policy_version) is distinct from (old.cash_cents,old.realized_cents,old.fees_cents,old.fee_policy_version) then
  if old.revision>=9007199254740991 then raise exception 'unsafe_revision';end if;new.revision:=old.revision+1;
 else new.revision:=old.revision;end if;return new;
end$$;
create trigger manual_revision before update on public.manual_accounts for each row execute function paper_private.manual_revision();
alter table public.manual_orders add column fee_policy_version integer;
alter table public.manual_orders add constraint order_manual_policy foreign key(account_id,fee_policy_version) references public.manual_fee_policies(account_id,version);
create function public.manual_fee_policy_set(p_account_id uuid,p_expected_version integer,p_rate_bps integer,p_min_cents bigint,p_reason text) returns integer language plpgsql security definer set search_path='' as $$
declare a public.manual_accounts%rowtype;begin
 if auth.uid() is null or not exists(select 1 from paper_private.finance_admins where user_id=auth.uid()) then raise exception 'finance_admin_required';end if;
 if p_rate_bps is null or p_min_cents is null or p_rate_bps not between 0 and 10000 or p_min_cents not between 0 and 99999999 or coalesce(length(trim(p_reason)),0) not between 1 and 1000 then raise exception 'invalid_fee_policy';end if;
 select * into a from public.manual_accounts where id=p_account_id for update;
 if not found then raise exception 'account_not_found';end if;
 if a.fee_policy_version is distinct from p_expected_version then raise exception 'fee_policy_conflict';end if;
 insert into public.manual_fee_policies values(a.id,a.fee_policy_version+1,p_rate_bps,p_min_cents,clock_timestamp(),auth.uid(),p_reason);
 update public.manual_accounts set fee_policy_version=a.fee_policy_version+1 where id=a.id;return a.fee_policy_version+1;
end$$;
-- Keep the reviewed math private; the old public signature cannot originate new fills.
alter function public.manual_order(uuid,jsonb) set schema paper_private;
alter function paper_private.manual_order(uuid,jsonb) rename to manual_order_execute;
revoke all on function paper_private.manual_order_execute(uuid,jsonb) from public,anon,authenticated;
create function public.manual_order(p_request_id uuid,p_order jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid;prior public.manual_orders%rowtype;begin
 aid:=paper_private.manual_account_id();select * into prior from public.manual_orders where account_id=aid and request_id=p_request_id;
 if not found then raise exception 'client_upgrade_required';end if;
 if prior.payload is distinct from p_order then raise exception 'idempotency_conflict';end if;
 return public.manual_snapshot();
end$$;
create function public.manual_order_v2(p_request_id uuid,p_expected_revision bigint,p_policy_version integer,p_order jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid;a public.manual_accounts%rowtype;prior public.manual_orders%rowtype;policy public.manual_fee_policies%rowtype;begin
 if p_request_id is null or p_order is null or jsonb_typeof(p_order)<>'object' or octet_length(p_order::text)>8192 then raise exception 'invalid_order';end if;
 aid:=paper_private.manual_account_id();select * into a from public.manual_accounts where id=aid for update;
 select * into prior from public.manual_orders where account_id=aid and request_id=p_request_id;
 if found then if prior.payload is distinct from p_order then raise exception 'idempotency_conflict';end if;return public.manual_snapshot();end if;
 if exists(select 1 from unnest(array['symbol','side','source','observedAt']) k where jsonb_typeof(p_order->k) is distinct from 'string') or exists(select 1 from unnest(array['quantity','priceCents','rateBps','minCents']) k where jsonb_typeof(p_order->k) is distinct from 'number') then raise exception 'invalid_order';end if;
 if (p_order->>'observedAt')!~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then raise exception 'invalid_observation';end if;
 if p_expected_revision is distinct from a.revision then raise exception 'account_revision_conflict';end if;
 if p_policy_version is distinct from a.fee_policy_version then raise exception 'fee_policy_conflict';end if;
 select * into strict policy from public.manual_fee_policies where account_id=aid and version=a.fee_policy_version;
 if (p_order->>'rateBps')::numeric is distinct from policy.rate_bps::numeric or (p_order->>'minCents')::numeric is distinct from policy.min_cents::numeric then raise exception 'fee_policy_conflict';end if;
 if coalesce(length(trim(p_order->>'source')),0)=0 then raise exception 'invalid_order';end if;
 if (p_order->>'priceCents')::numeric*(p_order->>'quantity')::numeric>9007199254740991 then raise exception 'unsafe_amount';end if;
 perform paper_private.manual_order_execute(p_request_id,p_order);
 update public.manual_orders set fee_policy_version=policy.version where account_id=aid and request_id=p_request_id;
 return public.manual_snapshot();
exception when data_exception then raise exception 'invalid_order';
end$$;
revoke all on function paper_private.manual_revision(),paper_private.manual_policy_seed() from public,anon,authenticated;
revoke all on function public.manual_order(uuid,jsonb),public.manual_order_v2(uuid,bigint,integer,jsonb),public.manual_fee_policy_set(uuid,integer,integer,bigint,text) from public,anon;
grant execute on function public.manual_order(uuid,jsonb),public.manual_order_v2(uuid,bigint,integer,jsonb),public.manual_fee_policy_set(uuid,integer,integer,bigint,text) to authenticated;
create or replace function public.manual_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid;result jsonb;begin
 aid:=paper_private.manual_account_id();
 select jsonb_build_object('revision',a.revision::text,'fee_policy',(select to_jsonb(f) from public.manual_fee_policies f where f.account_id=a.id and f.version=a.fee_policy_version),'fee_policies',(select jsonb_agg(f order by f.version) from public.manual_fee_policies f where f.account_id=a.id),'id',a.id,'cash',a.cash_cents::text,'realized',a.realized_cents::text,'fees',a.fees_cents::text,
 'positions',coalesce((select jsonb_agg(jsonb_build_object('symbol',p.symbol,'quantity',p.quantity::text,'cost',p.cost_cents::text)) from public.manual_positions p where p.account_id=aid),'[]'::jsonb),
 'orders',coalesce((select jsonb_agg(to_jsonb(o) order by o.execution_seq) from public.manual_orders o where o.account_id=aid),'[]'::jsonb),
 'ledger',coalesce((select jsonb_agg(to_jsonb(l) order by l.id) from public.manual_ledger l where l.account_id=aid),'[]'::jsonb),
 'dividends',coalesce((select jsonb_agg(c) from public.dividend_credits c where c.account_id=aid),'[]'::jsonb),
 'entitlements',coalesce((select jsonb_agg(t) from public.dividend_entitlements t where t.account_id=aid and exists(select 1 from public.dividend_events e where e.id=t.event_id and (e.status='confirmed' or exists(select 1 from public.dividend_credits c where c.event_id=e.id and c.account_id=aid)))),'[]'::jsonb),
 'dividend_status',coalesce((select jsonb_agg(d) from public.dividend_delivery_status d where d.account_id=aid and exists(select 1 from public.dividend_events e where e.id=d.event_id and (e.status='confirmed' or exists(select 1 from public.dividend_credits c where c.event_id=e.id and c.account_id=aid)))),'[]'::jsonb),
 'dividend_events',coalesce((select jsonb_agg(e) from public.dividend_events e where e.status='confirmed' or exists(select 1 from public.dividend_credits c where c.account_id=aid and c.event_id=e.id)),'[]'::jsonb),
 'market',paper_private.market_state(clock_timestamp())) into result from public.manual_accounts a where a.id=aid;
 return result;
end$$;

alter function public.dividend_manage(uuid,jsonb) set schema paper_private;
alter function paper_private.dividend_manage(uuid,jsonb) rename to dividend_manage_execute;
revoke all on function paper_private.dividend_manage_execute(uuid,jsonb) from public,anon,authenticated;
create function public.dividend_manage(p_id uuid,p_event jsonb) returns uuid language plpgsql security definer set search_path='' as $$begin
 if not public.dividend_admin() then raise exception 'admin_required';end if;
 if p_event is null or jsonb_typeof(p_event)<>'object' or octet_length(p_event::text)>16384 then raise exception 'invalid_dividend_document';end if;
 return paper_private.dividend_manage_execute(p_id,p_event);
exception when data_exception then raise exception 'invalid_dividend_document';end$$;
alter function public.manual_tax_save(uuid,integer,jsonb) set schema paper_private;
alter function paper_private.manual_tax_save(uuid,integer,jsonb) rename to manual_tax_save_execute;
revoke all on function paper_private.manual_tax_save_execute(uuid,integer,jsonb) from public,anon,authenticated;
create function public.manual_tax_save(p_request_id uuid,p_expected_version integer,p_document jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb;f jsonb;e jsonb;begin
 if auth.uid() is null then raise exception 'authentication_required';end if;
 if p_document is null or jsonb_typeof(p_document)<>'object' or octet_length(p_document::text)>2097152 then raise exception 'invalid_tax_document';end if;
 if jsonb_typeof(p_document->'records') is distinct from 'array' or jsonb_typeof(p_document->'external') is distinct from 'array' then raise exception 'invalid_tax_document';end if;
 for r in select * from jsonb_array_elements(p_document->'records') loop
  if jsonb_typeof(r)<>'object' or jsonb_typeof(r->'orderId') is distinct from 'string' or jsonb_typeof(r->'settlementSource') is distinct from 'string' or length(r->>'settlementSource')>2000 then raise exception 'invalid_tax_document';end if;
  if not(r ? 'confirmedSettlement') or jsonb_typeof(r->'confirmedSettlement') not in ('string','null') then raise exception 'invalid_settlement';end if;
  for f in select value from jsonb_each(r) where key in ('fx','feeFx') loop
   if jsonb_typeof(f)<>'object' or exists(select 1 from unnest(array['date','rate','kind','provider','url','checkedAt','status']) k where jsonb_typeof(f->k) is distinct from 'string') or length(f->>'url')>2048 or length(f->>'provider') not between 1 and 200 or length(f->>'checkedAt')>64 or length(f->>'date')>10 or length(f->>'rate')>12 then raise exception 'invalid_tax_fx';end if;
   if (f->>'checkedAt')::timestamptz at time zone 'UTC' < (f->>'date')::date::timestamp then raise exception 'invalid_tax_fx';end if;
  end loop;
 end loop;
 for e in select * from jsonb_array_elements(p_document->'external') loop
  if jsonb_typeof(e)<>'object' or exists(select 1 from unnest(array['year','netKrw','usedDeductionKrw']) k where jsonb_typeof(e->k) is distinct from 'number') then raise exception 'invalid_external_tax';end if;
  if (e->>'usedDeductionKrw')::numeric>greatest(0,(e->>'netKrw')::numeric) then raise exception 'invalid_external_tax';end if;
 end loop;
 return paper_private.manual_tax_save_execute(p_request_id,p_expected_version,p_document);
exception when data_exception then raise exception 'invalid_tax_document';end$$;
revoke all on function public.dividend_manage(uuid,jsonb),public.manual_tax_save(uuid,integer,jsonb) from public,anon;
grant execute on function public.dividend_manage(uuid,jsonb),public.manual_tax_save(uuid,integer,jsonb) to authenticated;
create or replace function paper_private.settle_dividends() returns void language plpgsql set search_path='' as $$
declare e public.dividend_events%rowtype;a record;q bigint;gross numeric;tax numeric;net numeric;credit uuid;t timestamptz:=paper_private.dividend_now();begin
 -- One scheduler at a time; account row locks also serialize orders and dividends.
 if not pg_try_advisory_xact_lock(606005) then return;end if;
 perform 1 from paper_private.dividend_control where id and enabled for share;if not found then return;end if;
 for e in select * from public.dividend_events where status='confirmed' and kind='regular_cash' and standard_tax and ex_date<=(t at time zone 'America/New_York')::date order by id for update loop
  for a in select id from public.manual_accounts order by id loop
   begin
    perform 1 from public.manual_accounts where id=a.id for update;if not found then continue;end if;
    if exists(select 1 from public.dividend_credits where account_id=a.id and event_id=e.id) then continue;end if;
    select coalesce(sum(case side when 'buy' then quantity else -quantity end),0) into q from public.manual_orders where account_id=a.id and symbol=e.symbol and (filled_at at time zone 'America/New_York')::date<e.ex_date;
    if q<0 or q>1000000000 then raise exception 'invalid_entitlement';end if;
    insert into public.dividend_entitlements values(a.id,e.id,q,e.version,t) on conflict(account_id,event_id) do update set eligible_quantity=excluded.eligible_quantity,event_version=excluded.event_version,recorded_at=excluded.recorded_at;
    insert into public.dividend_delivery_status values(a.id,e.id,'pending',t,null) on conflict(account_id,event_id) do update set state='pending',last_attempt=t,error_code=null;
    -- Due at 00:00 ET on payment date; actual processing time is recorded separately.
    if e.pay_date>(t at time zone 'America/New_York')::date then continue;end if;
    gross:=round(e.amount_units::numeric*q/100);tax:=round(gross*15/100);net:=gross-tax;
    if q=0 or net<=0 then update public.dividend_delivery_status set state='zero' where account_id=a.id and event_id=e.id;continue;end if;
    if (select coalesce(sum(gross_cents::numeric),0)+gross>9007199254740991 or coalesce(sum(withholding_cents::numeric),0)+tax>9007199254740991 or coalesce(sum(net_cents::numeric),0)+net>9007199254740991 from public.dividend_credits where account_id=a.id) or gross>9007199254740991 or (select cash_cents::numeric+net from public.manual_accounts where id=a.id)>9007199254740991 then raise exception 'unsafe_amount';end if;
    insert into public.dividend_credits(account_id,event_id,event_version,quantity,amount_units,gross_cents,withholding_cents,net_cents,posted_at) values(a.id,e.id,e.version,q,e.amount_units,gross,tax,net,t) returning id into credit;
    update public.manual_accounts set cash_cents=cash_cents+net where id=a.id;
    insert into public.manual_ledger(account_id,dividend_credit_id,kind,delta_cents,balance_cents) select id,credit,'dividend',net,cash_cents from public.manual_accounts where id=a.id;
    update public.dividend_delivery_status set state='paid' where account_id=a.id and event_id=e.id;
   exception when others then
    -- Subtransaction rollback isolates this account. No personal data or SQL text in errors.
    insert into public.dividend_delivery_status values(a.id,e.id,'error',t,sqlstate) on conflict(account_id,event_id) do update set state='error',last_attempt=t,error_code=excluded.error_code;
   end;
  end loop;
 end loop;
end$$;
commit;
