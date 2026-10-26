"""Run only against the disposable container prepared by server.sql."""
import subprocess,concurrent.futures,uuid
container='stock-v04-test'
def sql(s,check=True):
 return subprocess.run(['docker','exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-At'],input=s,text=True,capture_output=True,check=check)
def order(side,qty,key):
 return sql("set role authenticated;set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';select public.paper_order('"+key+"','AAPL','"+side+"',"+str(qty)+");",False)
with concurrent.futures.ThreadPoolExecutor(2) as pool:r=list(pool.map(lambda _:order('buy',600,str(uuid.uuid4())),range(2)))
assert sum(p.returncode==0 for p in r)==1
with concurrent.futures.ThreadPoolExecutor(2) as pool:r=list(pool.map(lambda _:order('sell',400,str(uuid.uuid4())),range(2)))
assert sum(p.returncode==0 for p in r)==1
key=str(uuid.uuid4())
with concurrent.futures.ThreadPoolExecutor(2) as pool:r=list(pool.map(lambda _:order('buy',1,key),range(2)))
assert all(p.returncode==0 for p in r)
assert sql("select count(*) from public.paper_orders where client_request_id='"+key+"';").stdout.strip()=='1'
assert sql("select cash_cents>=0 and cash_cents=(select sum(delta_cents) from public.paper_cash_ledger where account_id=a.id) from public.paper_accounts a;").stdout.strip().splitlines()==['t','t']
print('PASS concurrent overdraft/oversell, repeated id, cash-ledger invariants')
