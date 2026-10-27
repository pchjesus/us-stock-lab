-- Prepared only: no operational migration or Cron registration in this task.
begin;
create table paper_private.dividend_admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table paper_private.dividend_control(id boolean primary key default true check(id),enabled boolean not null default true);
insert into paper_private.dividend_control values(true,true);
create table public.dividend_events(
 id uuid primary key default gen_random_uuid(),symbol text not null references public.paper_prices(symbol),kind text not null,
 announced date not null,ex_date date not null,record_date date not null,pay_date date not null,
 amount_units bigint not null check(amount_units between 1 and 100000000),source_url text not null,verified_at timestamptz not null,
 standard_tax boolean not null,status text not null check(status in ('draft','confirmed','review','cancelled')),
 version integer not null default 1,unique(symbol,ex_date,kind),check(isfinite(announced) and isfinite(ex_date) and isfinite(record_date) and isfinite(pay_date)),check(announced<=ex_date and ex_date<=record_date and record_date<=pay_date)
);
create table paper_private.dividend_audit(id bigint generated always as identity primary key,event_id uuid not null references public.dividend_events(id),actor uuid,at timestamptz not null default clock_timestamp(),before_data jsonb,requested_data jsonb not null,after_data jsonb not null);
create table public.dividend_entitlements(
 account_id uuid not null references public.manual_accounts(id) on delete cascade,event_id uuid not null references public.dividend_events(id),
 eligible_quantity bigint not null check(eligible_quantity between 0 and 1000000000),event_version integer not null,recorded_at timestamptz not null,
 primary key(account_id,event_id)
);
create table public.dividend_credits(
 id uuid primary key default gen_random_uuid(),account_id uuid not null references public.manual_accounts(id) on delete cascade,event_id uuid not null references public.dividend_events(id),
 event_version integer not null,quantity bigint not null check(quantity>0),amount_units bigint not null,gross_cents bigint not null check(gross_cents>0),
 withholding_cents bigint not null check(withholding_cents>=0),net_cents bigint not null check(net_cents>0),posted_at timestamptz not null,
 unique(account_id,event_id),unique(id,account_id),check(net_cents=gross_cents-withholding_cents)
);
create table public.dividend_delivery_status(account_id uuid not null references public.manual_accounts(id) on delete cascade,event_id uuid not null references public.dividend_events(id),state text not null check(state in ('pending','paid','zero','error')),last_attempt timestamptz not null,error_code text,primary key(account_id,event_id));
-- Extend the journal without rewriting any historical row.
alter table public.manual_ledger add column dividend_credit_id uuid;
alter table public.manual_ledger add constraint manual_dividend_credit_fk foreign key(dividend_credit_id,account_id) references public.dividend_credits(id,account_id);
create unique index manual_one_dividend_credit on public.manual_ledger(dividend_credit_id);
do $$declare c record;begin
 for c in select conname from pg_constraint where conrelid='public.manual_ledger'::regclass and contype='c' and pg_get_constraintdef(oid) like '%kind%' loop execute format('alter table public.manual_ledger drop constraint %I',c.conname);end loop;
end$$;
alter table public.manual_ledger add constraint manual_journal_kind check(
 (kind='initial_funding' and order_id is null and dividend_credit_id is null and delta_cents=10000000) or
 (kind='trade' and order_id is not null and dividend_credit_id is null) or
 (kind='dividend' and order_id is null and dividend_credit_id is not null and delta_cents>0));
create index dividend_entitlements_event on public.dividend_entitlements(event_id,account_id);
create index dividend_credits_event on public.dividend_credits(event_id,account_id);
create function public.dividend_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from paper_private.dividend_admins where user_id=auth.uid())$$;
create function public.dividend_manage(p_id uuid,p_event jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare old public.dividend_events%rowtype;result public.dividend_events%rowtype;host text;expected text;st text;begin
 if not public.dividend_admin() then raise exception 'admin_required';end if;
 if p_event ? 'enabled' then
  if jsonb_typeof(p_event->'enabled')<>'boolean' then raise exception 'invalid_control';end if;
  update paper_private.dividend_control set enabled=(p_event->>'enabled')::boolean where id;
  -- Control changes are audited against an existing event; no anonymous operational edits.
  if p_id is null then raise exception 'event_required_for_control_audit';end if;
 end if;
 select * into old from public.dividend_events where id=p_id for update;
 if p_event ? 'enabled' then
  if old.id is null then raise exception 'event_not_found';end if;
  insert into paper_private.dividend_audit(event_id,actor,before_data,requested_data,after_data) values(old.id,auth.uid(),to_jsonb(old),p_event,to_jsonb(old));return old.id;
 end if;
 if p_id is not null and old.id is null then raise exception 'event_not_found';end if;
 if old.id is not null and (p_event->>'version')::integer is distinct from old.version then raise exception 'event_version_conflict';end if;
 if old.id is not null and exists(select 1 from public.dividend_credits where event_id=old.id) then
  update public.dividend_events set status='review',version=version+1 where id=old.id returning * into result;
 else
  expected:=case p_event->>'symbol' when 'AAPL' then 'investor.apple.com' when 'MSFT' then 'microsoft.com' when 'NVDA' then 'investor.nvidia.com' when 'AMZN' then 'ir.aboutamazon.com' when 'GOOGL' then 'abc.xyz' when 'VOO' then 'vanguard.com' when 'QQQ' then 'invesco.com' when 'SCHD' then 'schwabassetmanagement.com' end;
  host:=substring(p_event->>'source_url' from '^https://([^/]+)/');
  if expected is null or host is null or not(host=expected or right(host,length(expected)+1)='.'||expected) or host~'[@:]' then raise exception 'official_source_required';end if;
  st:=p_event->>'status';if st not in ('draft','confirmed','review','cancelled') or st is null then raise exception 'invalid_status';end if;
  if p_event->>'kind'<>'regular_cash' or not coalesce((p_event->>'standard_tax')::boolean,false) then st:='review';end if;
  if st='confirmed' and not exists(select 1 from paper_private.market_days where date=(p_event->>'ex_date')::date and verified and open_at is not null) then raise exception 'unverified_ex_date';end if;
  if (p_event->>'verified_at')::timestamptz>clock_timestamp() or not isfinite((p_event->>'verified_at')::timestamptz) or (p_event->>'announced')::date>(p_event->>'verified_at')::timestamptz::date then raise exception 'invalid_verification';end if;
  insert into public.dividend_events(id,symbol,kind,announced,ex_date,record_date,pay_date,amount_units,source_url,verified_at,standard_tax,status,version)
  values(coalesce(p_id,gen_random_uuid()),p_event->>'symbol',p_event->>'kind',(p_event->>'announced')::date,(p_event->>'ex_date')::date,(p_event->>'record_date')::date,(p_event->>'pay_date')::date,(p_event->>'amount_units')::bigint,p_event->>'source_url',(p_event->>'verified_at')::timestamptz,(p_event->>'standard_tax')::boolean,st,coalesce(old.version,0)+1)
  on conflict(id) do update set symbol=excluded.symbol,kind=excluded.kind,announced=excluded.announced,ex_date=excluded.ex_date,record_date=excluded.record_date,pay_date=excluded.pay_date,amount_units=excluded.amount_units,source_url=excluded.source_url,verified_at=excluded.verified_at,standard_tax=excluded.standard_tax,status=excluded.status,version=excluded.version returning * into result;
 end if;
 insert into paper_private.dividend_audit(event_id,actor,before_data,requested_data,after_data) values(result.id,auth.uid(),case when old.id is null then null else to_jsonb(old) end,p_event,to_jsonb(result));return result.id;
end$$;
-- Server time only; tests replace this internal clock exclusively in stock_test.
create function paper_private.dividend_now() returns timestamptz language sql volatile set search_path='' as $$select clock_timestamp()$$;
create function paper_private.settle_dividends() returns void language plpgsql set search_path='' as $$
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
    if gross>9007199254740991 or (select cash_cents::numeric+net from public.manual_accounts where id=a.id)>9007199254740991 then raise exception 'unsafe_amount';end if;
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
-- Dashboard returns private audit data only after server allowlist verification.
create function public.dividend_dashboard() returns jsonb language plpgsql security definer set search_path='' as $$begin
 if not public.dividend_admin() then raise exception 'admin_required';end if;
 return jsonb_build_object('events',(select coalesce(jsonb_agg(e order by e.ex_date),'[]'::jsonb) from public.dividend_events e),'audit',(select coalesce(jsonb_agg(a order by a.id),'[]'::jsonb) from paper_private.dividend_audit a),'enabled',(select enabled from paper_private.dividend_control where id));
end$$;
alter table public.dividend_events enable row level security;
alter table public.dividend_entitlements enable row level security;
alter table public.dividend_credits enable row level security;
alter table public.dividend_delivery_status enable row level security;
create policy confirmed_events_read on public.dividend_events for select to authenticated using(status='confirmed' or exists(select 1 from public.dividend_credits c join public.manual_accounts a on a.id=c.account_id where c.event_id=dividend_events.id and a.user_id=(select auth.uid())));
create policy own_entitlements on public.dividend_entitlements for select to authenticated using(exists(select 1 from public.manual_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
create policy own_credits on public.dividend_credits for select to authenticated using(exists(select 1 from public.manual_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
create policy own_delivery on public.dividend_delivery_status for select to authenticated using(exists(select 1 from public.manual_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
revoke all on public.dividend_events,public.dividend_entitlements,public.dividend_credits,public.dividend_delivery_status from public,anon,authenticated;
grant select on public.dividend_events,public.dividend_entitlements,public.dividend_credits,public.dividend_delivery_status to authenticated;
alter table paper_private.dividend_admins enable row level security;
alter table paper_private.dividend_control enable row level security;
alter table paper_private.dividend_audit enable row level security;
revoke all on paper_private.dividend_admins,paper_private.dividend_control,paper_private.dividend_audit from public,anon,authenticated;
revoke all on function paper_private.dividend_now(),paper_private.settle_dividends() from public,anon,authenticated;
revoke all on function public.dividend_admin(),public.dividend_manage(uuid,jsonb),public.dividend_dashboard() from public,anon;
grant execute on function public.dividend_admin(),public.dividend_manage(uuid,jsonb),public.dividend_dashboard() to authenticated;
create or replace function public.manual_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid;result jsonb;begin
 aid:=paper_private.manual_account_id();
 select jsonb_build_object('id',a.id,'cash',a.cash_cents::text,'realized',a.realized_cents::text,'fees',a.fees_cents::text,
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
commit;
