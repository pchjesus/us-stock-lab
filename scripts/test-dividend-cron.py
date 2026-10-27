"""Real pg_cron integration, disposable container ONLY. No production configuration.
Requires Docker/network to install the free PostgreSQL extension. Always cleans up.
"""
import subprocess,pathlib,time
root=pathlib.Path(__file__).resolve().parents[1];name='stock-dividend-cron-test'
def run(args,**kw):return subprocess.run(args,text=True,capture_output=True,check=True,**kw)
def sql(s):
 try:return run(['docker','exec','-i',name,'psql','-U','postgres','-d','stock_test','-v','ON_ERROR_STOP=1','-Atq'],input=s).stdout.strip()
 except subprocess.CalledProcessError as e:
  print('Cron isolated SQL diagnostic: '+e.stderr[-2000:],flush=True);raise
def ready():
 for _ in range(120):
  r=subprocess.run(['docker','exec',name,'psql','-U','postgres','-Atqc','select 1'],capture_output=True,text=True)
  if r.returncode==0 and r.stdout.strip()=='1':return
  time.sleep(.25)
 raise RuntimeError('cron database readiness timeout')
try:
 run(['docker','run','--rm','-d','--name',name,'-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17']);ready()
 run(['docker','exec',name,'bash','-c','apt-get update -qq && apt-get install -y -qq postgresql-17-cron'])
 run(['docker','exec',name,'bash','-c',"echo \"shared_preload_libraries='pg_cron'\" >> \"$PGDATA/postgresql.conf\"; echo \"cron.database_name='stock_test'\" >> \"$PGDATA/postgresql.conf\"; echo \"cron.use_background_workers=on\" >> \"$PGDATA/postgresql.conf\""])
 run(['docker','exec',name,'psql','-U','postgres','-c','create database stock_test'])
 run(['docker','restart',name]);ready()
 sql((root/'tests/sql/bootstrap.sql').read_text())
 for p in sorted((root/'supabase/migrations').glob('*.sql')):sql(p.read_text())
 sql((root/'tests/sql/clock-fixture.sql').read_text())
 sql("""insert into auth.users values('00000000-0000-0000-0000-000000000001');
 insert into paper_private.dividend_admins values('00000000-0000-0000-0000-000000000001');
 insert into paper_private.finance_admins values('00000000-0000-0000-0000-000000000001');
 set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
 update paper_private.test_clock set value='2026-10-26T14:00:00Z';
 select public.manual_fee_policy_set((public.manual_snapshot()->>'id')::uuid,1,0,0,'isolated cron policy');
 select public.manual_order_v2(gen_random_uuid(),(public.manual_snapshot()->>'revision')::bigint,2,'{"symbol":"AAPL","side":"buy","quantity":1,"priceCents":10000,"rateBps":0,"minCents":0,"source":"isolated cron fixture","observedAt":"2026-10-26T13:59:00Z"}');
 select public.dividend_manage(null,'{"symbol":"AAPL","kind":"regular_cash","announced":"2026-01-01","ex_date":"2026-10-27","record_date":"2026-10-27","pay_date":"2026-10-28","amount_units":10000,"source_url":"https://investor.apple.com/cron-test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"confirmed"}');
 update paper_private.test_clock set value='2026-10-28T04:00:00Z';
 create extension pg_cron;
 select cron.schedule('isolated-manual-dividend','1 second','select paper_private.settle_dividends()');""")
 def wait_runs(minimum):
  for _ in range(100):
   if int(sql("select count(*) from cron.job_run_details where status='succeeded'"))>=minimum:return
   time.sleep(.2)
  raise RuntimeError('scheduled settlement did not succeed: '+sql("select coalesce(string_agg(status||':'||coalesce(return_message,''),','),'no runs') from cron.job_run_details"))
 wait_runs(2)
 assert sql('select count(*) from public.dividend_credits')=='1'
 assert sql('select net_cents from public.dividend_credits')=='85'
 assert sql('select cash_cents from public.manual_accounts')=='9990085'
 print('PASS actual pg_cron: unattended payout and repeated scheduling, one credit / net 85 cents',flush=True)
 # A second payment becomes due while the approved operator has paused settlement.
 # The real scheduler keeps running, then survives a database restart before resume.
 sql("""set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
 select public.dividend_manage((select id from public.dividend_events limit 1),'{"enabled":false}');
 select public.dividend_manage(null,'{"symbol":"AAPL","kind":"regular_cash","announced":"2026-01-01","ex_date":"2026-10-28","record_date":"2026-10-28","pay_date":"2026-10-29","amount_units":10000,"source_url":"https://investor.apple.com/cron-test-fixture","verified_at":"2026-10-26T00:00:00Z","standard_tax":true,"status":"confirmed"}');
 update paper_private.test_clock set value='2026-10-29T04:00:00Z';""")
 before=int(sql("select count(*) from cron.job_run_details where status='succeeded'"))
 wait_runs(before+2);assert sql('select count(*) from public.dividend_credits')=='1'
 print('PASS actual pg_cron: administrator pause prevents due payment without stopping scheduler',flush=True)
 before=int(sql("select count(*) from cron.job_run_details where status='succeeded'"))
 run(['docker','restart',name]);ready();wait_runs(before+2)
 assert sql('select count(*) from public.dividend_credits')=='1'
 sql("""set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';select public.dividend_manage((select id from public.dividend_events order by ex_date limit 1),'{"enabled":true}');""")
 before=int(sql("select count(*) from cron.job_run_details where status='succeeded'"));wait_runs(before+2)
 assert sql('select count(*) from public.dividend_credits')=='2'
 assert sql('select cash_cents from public.manual_accounts')=='9990170'
 assert sql("select cash_cents=(select sum(delta_cents) from public.manual_ledger) from public.manual_accounts")=='t'
 print('PASS actual pg_cron: persisted schedule catches up overdue payment after restart/resume; no duplicate credit',flush=True)
finally:subprocess.run(['docker','rm','-f',name],capture_output=True)
