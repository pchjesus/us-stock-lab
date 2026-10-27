"""Disposable PostgreSQL only. No credentials, production time changes or public test API."""
import subprocess,pathlib,json,datetime,zoneinfo,os
root=pathlib.Path(__file__).resolve().parents[1];name='stock-v04-test';db='stock_test'
def shell(args,**kw):return subprocess.run(args,check=True,text=True,capture_output=True,**kw)
def sql(s,database=db):
 try:return shell(['docker','exec','-i',name,'psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1','-Atq'],input=s).stdout.strip()
 except subprocess.CalledProcessError as e:
  print('Isolated SQL diagnostic: '+e.stderr[-2000:],flush=True);raise
def file(p,database=db):return sql((root/p).read_text(),database)
try:
 shell(['docker','run','--rm','-d','--name',name,'-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17'])
 # pg_isready can briefly succeed during PostgreSQL init/restart before a
 # real SQL connection is ready. Probe an actual SELECT; fail visibly on timeout.
 import time
 ready=False;last=''
 for _ in range(120):
  probe=subprocess.run(['docker','exec','-i',name,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-Atq','-c','select 1'],capture_output=True,text=True)
  if probe.returncode==0 and probe.stdout.strip()=='1':
   ready=True;break
  last=probe.stderr.strip()[-400:]
  time.sleep(.25)
 if not ready:raise RuntimeError('Disposable PostgreSQL SQL readiness timeout: '+last)
 # A post-initialization restart may race this call; retries are scoped only
 # to connection-not-ready failures, not real SQL validation errors.
 for attempt in range(20):
  result=subprocess.run(['docker','exec','-i',name,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-Atq','-c','create database stock_test;'],capture_output=True,text=True)
  if result.returncode==0:break
  if 'already exists' in result.stderr:break
  if 'could not connect' not in result.stderr and 'connection to server' not in result.stderr:raise RuntimeError('Create test database failed: '+result.stderr[-600:])
  if attempt==19:raise RuntimeError('Create test database connection failed: '+result.stderr[-600:])
  time.sleep(.25)
 file('tests/sql/bootstrap.sql')
 for p in sorted((root/'supabase/migrations').glob('*.sql')):sql(p.read_text())
 file('tests/sql/clock-fixture.sql');print(file('tests/sql/server.sql').splitlines()[-1])
 print('\n'.join(x for x in file('tests/sql/manual.sql').splitlines() if x.startswith('PASS')))
 # Existing concurrent financial regression before any extra boundary trades.
 r=shell(['python3',str(root/'tests/sql/concurrency.py')]);print(r.stdout.strip())
 print(file('tests/sql/market-hours.sql').splitlines()[-1])
 # Full-day parity, including exact UTC offsets in both DST regimes, from the ONE JSON contract.
 c=json.loads((root/'src/market-calendar.json').read_text());tz=zoneinfo.ZoneInfo('America/New_York')
 rows=json.loads(sql("select json_agg(json_build_object('date',date,'open',open_at,'close',close_at,'reason',reason)) from paper_private.market_days"))
 assert len(rows)==730
 for row in rows:
  day=datetime.date.fromisoformat(row['date']);y=c['years'][str(day.year)];closed=day.weekday()>4 or row['date'] in y['holidays']
  assert (row['open'] is None)==closed
  if not closed:
   for field,h,m in [('open',9,30),('close',13 if row['date'] in y['earlyCloses'] else 16,0)]:
    expected=datetime.datetime.combine(day,datetime.time(h,m),tz).astimezone(datetime.timezone.utc)
    assert datetime.datetime.fromisoformat(row[field])==expected
 print('PASS 730-day shared calendar / PostgreSQL timezone parity')
 # Account-lock waiter starts pre-close, is released after close; no new write.
 sql("update paper_private.test_clock set value='2026-10-27T19:59:59Z'")
 import concurrent.futures,time
 before=sql("select count(*) from public.paper_orders")
 lock=subprocess.Popen(['docker','exec','-i',name,'psql','-U','postgres','-d',db,'-Atq'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
 lock.stdin.write("begin;select id from public.paper_accounts where user_id='00000000-0000-0000-0000-000000000002' for update;\n\\echo LOCKED\n");lock.stdin.flush()
 while True:
  line=lock.stdout.readline();assert line,'lock process exited early'
  if line.strip()=='LOCKED':break
 with concurrent.futures.ThreadPoolExecutor() as pool:
  def waiter():
   try:sql("set role authenticated;set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';select public.paper_order(gen_random_uuid(),'AAPL','buy',1)");return False
   except subprocess.CalledProcessError as e:return 'market_closed' in e.stderr
  f=pool.submit(waiter)
  waiting=False
  for _ in range(100):
   waiting=int(sql("select count(*) from pg_stat_activity where datname='stock_test' and wait_event_type='Lock'"))>0
   if waiting:break
   time.sleep(.01)
  assert waiting,'waiter did not acquire the contested path'
  sql("update paper_private.test_clock set value='2026-10-27T20:00:00Z'")
  lock.stdin.write('commit;\n');lock.stdin.close();assert f.result()
 lock.wait();assert sql('select count(*) from public.paper_orders')==before
 print('PASS account-lock wait crosses close; no fill')
 print('\n'.join(x for x in file('tests/sql/dividends.sql').splitlines() if x.startswith('PASS')))
 sql("set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';select public.manual_snapshot();")

 # Parallel private settlements and a live manual order share account locks.
 sql("""set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
 update paper_private.test_clock set value='2026-10-26T14:00:00Z';
 select public.manual_order(gen_random_uuid(),'{"symbol":"GOOGL","side":"buy","quantity":1,"priceCents":100,"rateBps":0,"minCents":0,"source":"test","observedAt":"2026-10-26T13:59:00Z"}');
 select public.dividend_manage(null,'{"symbol":"GOOGL","kind":"regular_cash","announced":"2026-01-01","ex_date":"2026-10-27","record_date":"2026-10-27","pay_date":"2026-10-28","amount_units":10000,"source_url":"https://abc.xyz/test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"confirmed"}');
 update paper_private.test_clock set value='2026-11-03T15:00:00Z';""")
 def settle_or_order(i):
  if i<2:return sql('select paper_private.settle_dividends()')
  return sql("""set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';select public.manual_order(gen_random_uuid(),'{"symbol":"MSFT","side":"buy","quantity":1,"priceCents":100,"rateBps":0,"minCents":0,"source":"test","observedAt":"2026-11-03T14:59:00Z"}');""")
 with concurrent.futures.ThreadPoolExecutor(3) as pool:list(pool.map(settle_or_order,range(3)))
 assert sql("select count(*) from public.dividend_credits c join public.dividend_events e on e.id=c.event_id where e.symbol='GOOGL'")=='1'
 assert sql("select bool_and(cash_cents=(select sum(delta_cents) from public.manual_ledger where account_id=a.id)) from public.manual_accounts a")=='t'
 print('PASS overlapping settlement / manual order locks and single-credit invariant')
 # Separate database for pre-existing RLS/schema negative tests.
 sql('create database stock_rls;',database='postgres');sql((root/'tests/sql/bootstrap.sql').read_text().replace('create role anon nologin;','').replace('create role authenticated nologin;',''),'stock_rls')
 for p in sorted((root/'supabase/migrations').glob('*.sql')):sql(p.read_text(),'stock_rls')
 file('tests/sql/rls.sql','stock_rls');print('PASS existing financial RLS / FK / direct-write denial')
finally:
 subprocess.run(['docker','rm','-f',name],capture_output=True)
