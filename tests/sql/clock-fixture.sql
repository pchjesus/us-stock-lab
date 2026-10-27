-- ONLY disposable database. Production migration never reads a test clock/GUC.
do $$begin if current_database()<>'stock_test' then raise exception 'isolated database required';end if;end$$;
create table paper_private.test_clock(value timestamptz not null);
insert into paper_private.test_clock values('2026-10-27T14:00:00Z');
create function paper_private.test_now() returns timestamptz language sql volatile set search_path='' as $$select value from paper_private.test_clock$$;
revoke all on paper_private.test_clock from public,anon,authenticated;
revoke all on function paper_private.test_now() from public,anon,authenticated;
-- Patch time sources only in this disposable database, never in checked-in migrations or production.
do $$declare f text;begin
 select pg_get_functiondef('public.paper_order(uuid,text,text,bigint)'::regprocedure) into f;
 execute replace(f,'clock_timestamp()','paper_private.test_now()');
 select pg_get_functiondef('public.paper_snapshot()'::regprocedure) into f;
 execute replace(f,'clock_timestamp()','paper_private.test_now()');
end$$;

do $$declare f text;begin
 select pg_get_functiondef('public.manual_order(uuid,jsonb)'::regprocedure) into f;execute replace(f,'clock_timestamp()','paper_private.test_now()');
 select pg_get_functiondef('public.manual_snapshot()'::regprocedure) into f;execute replace(f,'clock_timestamp()','paper_private.test_now()');
end$$;
