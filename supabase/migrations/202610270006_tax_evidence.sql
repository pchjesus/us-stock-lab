-- User-supplied tax evidence ONLY; no journal, order, fee, dividend or cash mutation.
begin;
create table public.manual_tax_documents(
 id bigint generated always as identity primary key,account_id uuid not null references public.manual_accounts(id) on delete cascade,
 request_id uuid not null,version integer not null check(version>0),document jsonb not null,
 policy_version text not null default 'kr-overseas-2026-estimate-v1',calendar_version text not null default 'us-t1-conservative-2026-27-v1',
 created_at timestamptz not null default clock_timestamp(),unique(account_id,request_id),unique(account_id,version)
);
alter table public.manual_tax_documents enable row level security;
create policy manual_tax_owner on public.manual_tax_documents for select to authenticated using(exists(select 1 from public.manual_accounts a where a.id=account_id and a.user_id=(select auth.uid())));
revoke all on public.manual_tax_documents from public,anon,authenticated;
grant select on public.manual_tax_documents to authenticated;
create function public.manual_tax_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid;begin
 if auth.uid() is null then raise exception 'authentication_required';end if;
 select id into aid from public.manual_accounts where user_id=auth.uid();
 return coalesce((select jsonb_agg(d order by d.version) from public.manual_tax_documents d where d.account_id=aid),'[]'::jsonb);
end$$;
create function public.manual_tax_save(p_request_id uuid,p_expected_version integer,p_document jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid;prior public.manual_tax_documents%rowtype;v integer;r jsonb;fx jsonb;ext jsonb;begin
 if auth.uid() is null then raise exception 'authentication_required';end if;
 select id into aid from public.manual_accounts where user_id=auth.uid() for update;
 if aid is null then raise exception 'manual_account_required';end if;
 select * into prior from public.manual_tax_documents where account_id=aid and request_id=p_request_id;
 if found then if prior.document is distinct from p_document then raise exception 'idempotency_conflict';end if;return public.manual_tax_snapshot();end if;
 select coalesce(max(version),0) into v from public.manual_tax_documents where account_id=aid;
 if p_expected_version is distinct from v then raise exception 'tax_revision_conflict';end if;
 if p_request_id is null or p_document is null or p_document->>'inputClass' is distinct from 'user_supplied' or coalesce(p_document->>'policy','') not in ('fifo-v1','average-v1') or jsonb_typeof(p_document->'records') is distinct from 'array' or jsonb_typeof(p_document->'external') is distinct from 'array' then raise exception 'invalid_tax_document';end if;
 if jsonb_array_length(p_document->'records')>10000 or jsonb_array_length(p_document->'external')>2 then raise exception 'tax_document_limit';end if;
 if (select count(*)<>count(distinct value->>'orderId') from jsonb_array_elements(p_document->'records')) then raise exception 'duplicate_tax_order';end if;
 for r in select * from jsonb_array_elements(p_document->'records') loop
  if not exists(select 1 from public.manual_orders where id=(r->>'orderId')::uuid and account_id=aid) then raise exception 'tax_order_ownership';end if;
  if r->>'confirmedSettlement' is not null and ((r->>'confirmedSettlement')!~'^\d{4}-\d{2}-\d{2}$' or length(trim(coalesce(r->>'settlementSource','')))=0 or not isfinite((r->>'confirmedSettlement')::date)) then raise exception 'invalid_settlement';end if;
  for fx in select value from jsonb_each(r) where key in ('fx','feeFx') loop
   if fx->>'date' is null or (fx->>'date')!~'^\d{4}-\d{2}-\d{2}$' or not isfinite((fx->>'date')::date) or (fx->>'rate')!~'^\d{1,5}(\.\d{1,6})?$' or fx->>'rate' is null or (fx->>'rate')::numeric not between 100 and 10000 or coalesce(fx->>'kind','') not in ('base','cross') or coalesce(fx->>'status','') not in ('user_entered','document_reviewed') or coalesce(fx->>'url','')!~'^https://[^/@:]+(/|$)' or length(trim(coalesce(fx->>'provider','')))=0 or coalesce(fx->>'checkedAt','')!~'(Z|[+-]\d{2}:\d{2})$' or not isfinite((fx->>'checkedAt')::timestamptz) or (fx->>'checkedAt')::timestamptz>clock_timestamp()+interval '5 minutes' then raise exception 'invalid_tax_fx';end if;
   if (fx->>'provider')||' '||(fx->>'url') ~* '(frankfurter|synthetic|합성)' then raise exception 'reference_fx_not_tax';end if;

  end loop;
  if r->>'confirmedSettlement' is not null and r->>'confirmedSettlement'<>r->'fx'->>'date' then raise exception 'tax_fx_date_mismatch';end if;
  if r->'feeFx'->>'date' is distinct from coalesce(r->>'feeDate',r->'fx'->>'date') then raise exception 'tax_fee_date_mismatch';end if;
  if not(r ?& array['fx','feeFx']) then raise exception 'missing_tax_fx';end if;
 end loop;
 for ext in select * from jsonb_array_elements(p_document->'external') loop
  if coalesce(ext->>'year','') not in ('2026','2027') or coalesce(ext->>'netKrw','')!~'^-?\d{1,16}$' or abs((ext->>'netKrw')::numeric)>9007199254740991 or coalesce(ext->>'usedDeductionKrw','')!~'^\d{1,7}$' or (ext->>'usedDeductionKrw')::numeric not between 0 and 2500000 then raise exception 'invalid_external_tax';end if;
 end loop;
 if (select count(*)<>count(distinct value->>'year') from jsonb_array_elements(p_document->'external')) then raise exception 'duplicate_tax_year';end if;
 insert into public.manual_tax_documents(account_id,request_id,version,document) values(aid,p_request_id,v+1,p_document);
 return public.manual_tax_snapshot();
end$$;
revoke all on function public.manual_tax_snapshot(),public.manual_tax_save(uuid,integer,jsonb) from public,anon;
grant execute on function public.manual_tax_snapshot(),public.manual_tax_save(uuid,integer,jsonb) to authenticated;
commit;
