-- Reproduce baseline defects without leaving a single financial change.
begin;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$declare body jsonb;first_id uuid:=gen_random_uuid();second_id uuid:=gen_random_uuid();begin
 body:='{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":100,"rateBps":0,"minCents":0,"source":"baseline audit only","observedAt":"2026-11-03T14:59:00Z"}';
 perform public.manual_order(first_id,body);perform public.manual_order(second_id,body);
 if(select count(*) from public.manual_orders where request_id in(first_id,second_id) and fee_cents=0)<>2 then raise exception 'expected baseline fee/CAS reproduction missing';end if;
 perform public.manual_order(gen_random_uuid(),body||'{"source":{"nested":"poison"}}');
 if not exists(select 1 from public.manual_orders where jsonb_typeof(payload->'source')='object') then raise exception 'expected JSON poisoning reproduction missing';end if;
end$$;
rollback;
select 'REPRODUCED baseline arbitrary fee / independent stale fills / non-string source (transaction rolled back)';
