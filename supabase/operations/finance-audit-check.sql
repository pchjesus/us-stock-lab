-- READ ONLY post-install checklist. No output contains keys or personal trade rows.
-- Use only after separately authorized 004..007 installation, keep output private.
select 'manual_accounts' as relation,count(*) from public.manual_accounts
union all select 'orders',count(*) from public.manual_orders
union all select 'ledger',count(*) from public.manual_ledger
union all select 'credits',count(*) from public.dividend_credits
union all select 'tax_documents',count(*) from public.manual_tax_documents;
select count(*) as cash_ledger_mismatches from public.manual_accounts a
where a.cash_cents<>(select coalesce(sum(delta_cents),0) from public.manual_ledger l where l.account_id=a.id);
select count(*) as credit_ledger_mismatches from public.dividend_credits c
where not exists(select 1 from public.manual_ledger l where l.dividend_credit_id=c.id and l.account_id=c.account_id and l.kind='dividend' and l.delta_cents=c.net_cents);
select c.relname,c.relrowsecurity from pg_class c where c.relnamespace='public'::regnamespace
and (c.relname like 'manual_%' or c.relname like 'dividend_%') and c.relkind='r';
select p.proname,p.prosecdef,p.proconfig,
has_function_privilege('anon',p.oid,'execute') as anon_execute,
has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute
from pg_proc p where p.pronamespace='public'::regnamespace and p.prosecdef order by p.proname;
select version,rate_bps,min_cents,count(*) from public.manual_fee_policies group by version,rate_bps,min_cents order by version;
-- Advisor must be run separately in Supabase; this SQL does not replace it.
