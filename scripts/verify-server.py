"""Explicit live smoke test. Synthetic identities only; no emails, cleanup in finally."""
import os,sys,json,uuid,urllib.request,urllib.error,concurrent.futures,subprocess
assert os.environ.get('US_STOCK_LIVE_TEST')=='1','Explicit live-test opt-in required'
ref='vveljtqmujdzkzmoncjx';base='https://'+ref+'.supabase.co'
public=os.environ['VITE_SUPABASE_PUBLISHABLE_KEY']
def req(url,body=None,headers=None,method=None):
 r=urllib.request.Request(url,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json',**(headers or {})},method=method)
 try:
  with urllib.request.urlopen(r,timeout=40) as f:
   raw=f.read();return f.status,json.loads(raw) if raw else None
 except urllib.error.HTTPError as e:
  try:return e.code,json.loads(e.read())
  except Exception:return e.code,None
h={'Authorization':'Bearer '+os.environ['SUPABASE_ACCESS_TOKEN']}
status,keys=req('https://api.supabase.com/v1/projects/'+ref+'/api-keys',headers=h);assert status==200
service=next(k['api_key'] for k in keys if k['name']=='service_role')
def api(path,body=None,session=None,admin=False,method=None):
 return req(base+path,body,{'apikey':service if admin else public,**({'Authorization':'Bearer '+(service if admin else session['access_token'])} if session or admin else {})},method)
def rpc(name,body,s):
 status,data=api('/rest/v1/rpc/'+name,body,session=s);assert status==200,'RPC failed: '+name;return data
users=[]
try:
 for _ in range(2):
  email='codex-v04-'+uuid.uuid4().hex+'@example.invalid';status,u=api('/auth/v1/admin/users',{'email':email,'email_confirm':True},admin=True);assert status in (200,201);uid=u.get('user',u)['id'];users.append((uid,None))
  status,link=api('/auth/v1/admin/generate_link',{'type':'magiclink','email':email},admin=True);assert status==200
  props=link.get('properties',link);status,s=api('/auth/v1/verify',{'type':'email','email':email,'token':props['email_otp']});assert status==200;users[-1]=(uid,s)
 a,b=[u[1] for u in users];snap=rpc('paper_snapshot',{},a);assert snap['cash']=='10000000';assert rpc('paper_snapshot',{},a)['id']==snap['id']
 key=str(uuid.uuid4());body={'p_request_id':key,'p_symbol':'AAPL','p_side':'buy','p_quantity':1}
 open_market=snap.get('market',{}).get('canTrade') is True
 if open_market:
  with concurrent.futures.ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda _:rpc('paper_order',body,a),range(2)))
  assert all(len(r['trades'])==1 for r in results);price=int(results[0]['prices']['AAPL']);assert int(results[0]['cash'])==10000000-price
 else:
  with concurrent.futures.ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda _:api('/rest/v1/rpc/paper_order',body,session=a),range(2)))
  assert all(status==400 and data['message'] in ['market_closed','market_unavailable','market_halted'] for status,data in results)
  for side in ['buy','sell']:
   status,data=api('/rest/v1/rpc/paper_order',{**body,'p_side':side},session=a);assert status==400
  after=rpc('paper_snapshot',{},a);assert {k:v for k,v in snap.items() if k!='market'}=={k:v for k,v in after.items() if k!='market'}
 other=rpc('paper_snapshot',{},b);assert other['cash']=='10000000' and other['trades']==[]
 status,rows=api('/rest/v1/paper_accounts?select=id',session=b);assert status==200 and [r['id'] for r in rows]==[other['id']]
 status,_=api('/rest/v1/paper_accounts?id=eq.'+snap['id'],{'cash_cents':1},session=a,method='PATCH');assert status in (401,403)
 status,_=api('/rest/v1/rpc/paper_order',{**body,'p_request_id':str(uuid.uuid4()),'p_quantity':-1},session=a);assert status>=400
 status,_=api('/rest/v1/rpc/paper_snapshot',{},session={'access_token':'invalid'});assert status in (401,403)
 if open_market:rpc('paper_order',{'p_request_id':str(uuid.uuid4()),'p_symbol':'AAPL','p_side':'sell','p_quantity':1},a)
 for session,symbol in [(a,'MSFT'),(b,'QQQ')]:
  status,_=api('/rest/v1/watchlist_items',{'user_id':session['user']['id'],'symbol':symbol},session=session);assert status==201
 print('PASS live RPC: initialization, '+('open fills/concurrent duplicate' if open_market else 'closed concurrent rejection/no financial mutation')+', invalid input, invalid JWT and A/B isolation',flush=True)
 result=subprocess.run(['node','scripts/verify-server-browser.mjs' if open_market else 'scripts/verify-server-closed-browser.mjs'],env={**os.environ,'TEST_SESSIONS':json.dumps([a,b]),'TEST_BASE':os.environ.get('TEST_BASE','http://127.0.0.1:4180/')},capture_output=True,text=True,timeout=160)
 if result.returncode:
  # Do not expose session-bearing Playwright errors. Only a safe diagnostic label.
  print('FAIL live browser:',result.stdout[-1000:],flush=True);raise RuntimeError('Live browser validation failed; sensitive output suppressed')
 print(result.stdout.strip(),flush=True)
finally:
 for uid,_ in users:
  status,_=api('/auth/v1/admin/users/'+uid,admin=True,method='DELETE');assert status in (200,204),'test identity cleanup failed'
 print('Temporary users and cascade data removed',flush=True)
