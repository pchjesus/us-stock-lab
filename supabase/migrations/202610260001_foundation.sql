begin;
-- Financial writes deliberately have NO browser policy. A future trusted RPC must
-- atomically validate prices/idempotency, update positions and append ledger rows.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (length(display_name)<=80),
 created_at timestamptz not null default now()
);
create table public.paper_accounts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 currency text not null default 'USD' check(currency='USD'),
 cash_cents bigint not null default 10000000 check(cash_cents>=0),
 created_at timestamptz not null default now(),
 unique(id,user_id)
);
create index paper_accounts_user on public.paper_accounts(user_id);
create table public.paper_positions (
 account_id uuid not null references public.paper_accounts(id) on delete cascade,
 symbol text not null check(symbol ~ '^[A-Z][A-Z0-9.]{0,14}$'),
 quantity bigint not null check(quantity>0),
 cost_cents bigint not null check(cost_cents>=0),
 primary key(account_id,symbol)
);
create table public.paper_orders (
 id uuid primary key default gen_random_uuid(),
 account_id uuid not null references public.paper_accounts(id) on delete cascade,
 client_request_id uuid not null,
 symbol text not null check(symbol ~ '^[A-Z][A-Z0-9.]{0,14}$'),
 side text not null check(side in ('buy','sell')),
 quantity bigint not null check(quantity>0),
 status text not null default 'pending' check(status in ('pending','filled','rejected')),
 price_cents bigint check(price_cents>0),
 filled_at timestamptz,
 created_at timestamptz not null default now(),
 check((status='filled' and price_cents is not null and filled_at is not null) or (status<>'filled' and price_cents is null and filled_at is null)),
 unique(account_id,client_request_id), unique(id,account_id)
);
create table public.paper_cash_ledger (
 id uuid primary key default gen_random_uuid(),
 account_id uuid not null references public.paper_accounts(id) on delete cascade,
 order_id uuid,
 kind text not null check(kind in ('initial_funding','trade')),
 delta_cents bigint not null check(delta_cents<>0),
 balance_cents bigint not null check(balance_cents>=0),
 created_at timestamptz not null default now(),
 check((kind='initial_funding' and order_id is null and delta_cents=10000000 and balance_cents=10000000) or (kind='trade' and order_id is not null)),
 foreign key(order_id,account_id) references public.paper_orders(id,account_id),
 unique(order_id)
);
create unique index one_initial_funding on public.paper_cash_ledger(account_id) where kind='initial_funding';
create index ledger_account on public.paper_cash_ledger(account_id);
create table public.watchlist_items (
 user_id uuid not null references auth.users(id) on delete cascade,
 symbol text not null check(symbol ~ '^[A-Z][A-Z0-9.]{0,14}$'),
 created_at timestamptz not null default now(), primary key(user_id,symbol)
);
create table public.market_events (
 id uuid primary key default gen_random_uuid(), title text not null,
 region text not null, scheduled_at timestamptz not null,
 importance text not null check(importance in ('high','medium','low')),
 data_status text not null check(data_status in ('synthetic','official','pending')),
 actual text, forecast text, previous text, interpretation text,
 source_name text not null, source_url text not null check(source_url ~ '^https://'),
 published boolean not null default false
);
create table public.market_news (
 id uuid primary key default gen_random_uuid(), title text not null,
 published_at timestamptz not null, source_name text not null,
 source_url text not null check(source_url ~ '^https://'),
 summary text not null check(length(summary)<=500),
 data_status text not null check(data_status in ('official','licensed')),
 published boolean not null default false
);
create table public.learning_articles (
 id text primary key, title text not null, category text not null,
 body text not null, sort_order integer not null default 0,
 published boolean not null default false
);

alter table public.profiles enable row level security;
alter table public.paper_accounts enable row level security;
alter table public.paper_positions enable row level security;
alter table public.paper_orders enable row level security;
alter table public.paper_cash_ledger enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.market_events enable row level security;
alter table public.market_news enable row level security;
alter table public.learning_articles enable row level security;

create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profiles_create on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profiles_edit on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy accounts_read on public.paper_accounts for select to authenticated using(user_id=(select auth.uid()));
create policy positions_read on public.paper_positions for select to authenticated using(exists(select 1 from public.paper_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
create policy orders_read on public.paper_orders for select to authenticated using(exists(select 1 from public.paper_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
create policy ledger_read on public.paper_cash_ledger for select to authenticated using(exists(select 1 from public.paper_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
create policy watchlist_own on public.watchlist_items for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy events_read on public.market_events for select to anon,authenticated using(published);
create policy news_read on public.market_news for select to anon,authenticated using(published);
create policy learning_read on public.learning_articles for select to anon,authenticated using(published);

revoke all on public.profiles,public.paper_accounts,public.paper_positions,public.paper_orders,public.paper_cash_ledger,public.watchlist_items,public.market_events,public.market_news,public.learning_articles from anon,authenticated;
grant select,insert on public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select on public.paper_accounts,public.paper_positions,public.paper_orders,public.paper_cash_ledger to authenticated;
grant select,insert,update,delete on public.watchlist_items to authenticated;
grant select on public.market_events,public.market_news,public.learning_articles to anon,authenticated;
commit;
