begin;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into public.paper_accounts(id,user_id) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002');
insert into public.paper_positions values ('10000000-0000-0000-0000-000000000001','AAPL',1,100),('10000000-0000-0000-0000-000000000002','AAPL',1,100);
insert into public.paper_orders(id,account_id,client_request_id,symbol,side,quantity,status,price_cents,filled_at) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','AAPL','buy',1,'filled',100,now()),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','AAPL','buy',1,'filled',100,now());
insert into public.paper_cash_ledger(account_id,order_id,kind,delta_cents,balance_cents) values
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','trade',-100,9999900),
 ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','trade',-100,9999900);
insert into public.market_events(title,region,scheduled_at,importance,data_status,source_name,source_url,published) values
 ('public','US',now(),'high','synthetic','example','https://example.com',true),('draft','US',now(),'high','synthetic','example','https://example.com',false);
insert into public.market_news(title,published_at,source_name,source_url,summary,data_status,published) values ('public',now(),'example','https://example.com','short','official',true),('draft',now(),'example','https://example.com','short','official',false);
insert into public.learning_articles(id,title,category,body,published) values('one','public','basic','short',true),('two','draft','basic','short',false);
set local role anon;
do $$begin
 if (select count(*) from public.market_events)<>1 or (select count(*) from public.market_news)<>1 or (select count(*) from public.learning_articles)<>1 then raise exception 'anon drafts leaked';end if;
 begin perform * from public.paper_accounts;raise exception 'anonymous account access allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$begin
 if (select count(*) from public.paper_accounts)<>1 or (select count(*) from public.paper_positions)<>1 or (select count(*) from public.paper_orders)<>1 or (select count(*) from public.paper_cash_ledger)<>1 then raise exception 'cross-user financial read';end if;
 begin update public.paper_accounts set cash_cents=20000000;raise exception 'client cash mutation allowed';exception when insufficient_privilege then null;end;
 begin delete from public.paper_positions;raise exception 'client position mutation allowed';exception when insufficient_privilege then null;end;
 begin delete from public.paper_orders;raise exception 'client order mutation allowed';exception when insufficient_privilege then null;end;
 begin delete from public.paper_cash_ledger;raise exception 'client ledger mutation allowed';exception when insufficient_privilege then null;end;
 begin update public.market_news set published=true;raise exception 'client publication allowed';exception when insufficient_privilege then null;end;
 begin insert into public.watchlist_items(user_id,symbol) values('00000000-0000-0000-0000-000000000002','AAPL');raise exception 'cross-user watchlist insert';exception when insufficient_privilege then null;end;
end$$;
insert into public.watchlist_items(user_id,symbol) values('00000000-0000-0000-0000-000000000001','AAPL');
insert into public.profiles(id,display_name) values('00000000-0000-0000-0000-000000000001','one');
update public.profiles set display_name='renamed';
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin
 if (select count(*) from public.watchlist_items)<>0 or (select count(*) from public.profiles)<>0 then raise exception 'cross-user personal data leak';end if;
 if (select count(*) from public.paper_accounts where user_id='00000000-0000-0000-0000-000000000001')<>0 then raise exception 'cross-user account leak';end if;
end$$;
reset role;
do $$begin
 begin insert into public.paper_positions values('10000000-0000-0000-0000-000000000001','MSFT',0,100);raise exception 'invalid quantity accepted';exception when check_violation then null;end;
 insert into public.paper_orders(id,account_id,client_request_id,symbol,side,quantity) values('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000003','AAPL','buy',1);
 begin insert into public.paper_cash_ledger(account_id,order_id,kind,delta_cents,balance_cents) values('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','trade',-100,9999900);raise exception 'cross-account ledger reference accepted';exception when foreign_key_violation then null;end;
 begin insert into public.paper_orders(account_id,client_request_id,symbol,side,quantity) values('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','AAPL','buy',1);raise exception 'duplicate order key accepted';exception when unique_violation then null;end;
end$$;
rollback;
select 'PASS: anonymous, two-user RLS, financial write denial, constraints, idempotency' as result;
