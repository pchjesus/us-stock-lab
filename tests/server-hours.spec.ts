import {test,expect,type Page} from '@playwright/test';
import {marketState} from '../src/marketHours';
import {applyTrade,emptyAccount} from '../src/trading';
const uid='00000000-0000-0000-0000-000000000001';
async function setup(page:Page){
 let now='2026-10-27T19:59:59Z',account=emptyAccount(),disconnect=false,lose=false;const seen=new Map<string,any>();let requests=0;
 const user={id:uid,aud:'authenticated',role:'authenticated',email:'hours@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-10-26T00:00:00Z'};
 const payload=Buffer.from(JSON.stringify({sub:uid,aud:'authenticated',role:'authenticated',exp:2208988800})).toString('base64url');
 await page.addInitScript(({payload,user})=>{localStorage.setItem('sb-auth-test-auth-token',JSON.stringify({access_token:`e30.${payload}.test`,refresh_token:'test-refresh',expires_at:2208988800,expires_in:99999999,token_type:'bearer',user}));},{payload,user});
 const snapshot=()=>({id:'test-account',cash:String(account.cash),realized:String(account.realized),positions:Object.entries(account.holdings).map(([symbol,h])=>({symbol,quantity:String(h.quantity),cost:String(h.cost)})),trades:account.trades,prices:{AAPL:'22374'},market:{...marketState(new Date(now)),serverNow:now}});
 await page.route('https://auth-test.invalid/**',async r=>{
 const path=new URL(r.request().url()).pathname;
 if(path.endsWith('/paper_snapshot')){if(disconnect)return r.abort();return r.fulfill({json:snapshot()});}
 if(path.endsWith('/paper_order')){requests++;if(disconnect)return r.abort();const b=r.request().postDataJSON();expect(Object.keys(b).sort()).toEqual(['p_quantity','p_request_id','p_side','p_symbol']);const prior=seen.get(b.p_request_id);if(prior)return r.fulfill({json:snapshot()});if(!marketState(new Date(now)).canTrade)return r.fulfill({status:400,json:{code:'P0001',message:'market_closed'}});
 account=applyTrade(account,{id:b.p_request_id,symbol:b.p_symbol,side:b.p_side,quantity:b.p_quantity,price:22374,time:now});seen.set(b.p_request_id,b);if(lose){lose=false;disconnect=true;return r.abort();}return r.fulfill({json:snapshot()});}
 if(path.endsWith('/user'))return r.fulfill({json:user});if(path.includes('watchlist_items'))return r.fulfill({json:[]});return r.fulfill({json:{}});
 });
 return {setTime:(v:string)=>{now=v;},disconnect:(v:boolean)=>{disconnect=v;},lose:()=>{lose=true;},snapshot,get requests(){return requests;}};
}
test('server status overrides forged browser time and rejects review crossing close',async({page})=>{
 const fixture=await setup(page);await page.clock.setFixedTime(new Date('2026-10-27T14:00:00Z'));fixture.setTime('2026-10-27T20:00:00Z');await page.goto('/#stock/AAPL');await expect(page.getByTestId('order-session')).toContainText('신규 주문 제한');await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeDisabled();
 fixture.setTime('2026-10-27T19:59:59Z');await page.reload();await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeEnabled();await page.getByRole('button',{name:'주문 검토',exact:true}).click();fixture.setTime('2026-10-27T20:00:00Z');await page.getByRole('button',{name:'체결 확정',exact:true}).click();await expect(page.getByRole('alert')).toContainText('체결하지 않았습니다');expect(fixture.snapshot().trades).toHaveLength(0);expect(fixture.snapshot().cash).toBe('10000000');expect(await page.evaluate(uid=>localStorage.getItem('paper.pending.'+uid),uid)).toBeNull();await expect(page.getByTestId('order-session')).toContainText('신규 주문 제한');
 await page.getByLabel('추가매수 수량',{exact:true}).fill('5');await expect(page.getByTestId('simulation')).toContainText('5주');
});
test('lost fill response remains pending; after-close same id readback recovers once',async({page})=>{
 const fixture=await setup(page);await page.goto('/#stock/AAPL');await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeEnabled();await page.getByRole('button',{name:'주문 검토',exact:true}).click();fixture.lose();await page.getByRole('button',{name:'체결 확정',exact:true}).click();await expect(page.getByRole('alert')).toContainText('체결 여부 확인 중');
 const pending=await page.evaluate(uid=>JSON.parse(localStorage.getItem('paper.pending.'+uid)!),uid);expect(pending.id).toBe(fixture.snapshot().trades[0].id);fixture.disconnect(false);fixture.setTime('2026-10-27T20:00:00Z');await page.reload();await expect(page.getByRole('button',{name:'체결 여부 재확인',exact:true})).toBeEnabled();await page.getByRole('button',{name:'체결 여부 재확인',exact:true}).click();await expect(page.getByRole('status')).toContainText('체결되고 저장');expect(fixture.snapshot().trades).toHaveLength(1);expect(fixture.requests).toBe(2);expect(await page.evaluate(uid=>localStorage.getItem('paper.pending.'+uid),uid)).toBeNull();await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeDisabled();
});
