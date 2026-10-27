"""Disposable PostgreSQL only. No credentials, production time changes or public test API."""
import subprocess,pathlib,json,datetime,zoneinfo,os
root=pathlib.Path(__file__).resolve().parents[1];name='stock-v04-test';db='stock_test'
def shell(args,**kw):return subprocess.run(args,check=True,text=True,capture_output=True,**kw)
def sql(s,database=db):return shell(['docker','exec','-i',name,'psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1','-Atq'],input=s).stdout.strip()
def file(p,database=db):return sql((root/p).read_text(),database)
try:
 shell(['docker','run','--rm','-d','--name',name,'-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17'])
 for _ in range(60):
  if subprocess.run(['docker','exec',name,'pg_isready','-U','postgres'],capture_output=True).returncode==0:break
  import time;time.sleep(.3)
 sql('create database stock_test;',database='postgres')
 file('tests/sql/bootstrap.sql')
 for p in sorted((root/'supabase/migrations').glob('*.sql')):sql(p.read_text())
 file('tests/sql/clock-fixture.sql');print(file('tests/sql/server.sql').splitlines()[-1])
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
 # Separate database for pre-existing RLS/schema negative tests.
 sql('create database stock_rls;',database='postgres');sql((root/'tests/sql/bootstrap.sql').read_text().replace('create role anon nologin;','').replace('create role authenticated nologin;',''),'stock_rls')
 for p in sorted((root/'supabase/migrations').glob('*.sql')):sql(p.read_text(),'stock_rls')
 file('tests/sql/rls.sql','stock_rls');print('PASS existing financial RLS / FK / direct-write denial')
finally:
 subprocess.run(['docker','rm','-f',name],capture_output=True)
