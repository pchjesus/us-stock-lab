import {test,expect,type Page} from '@playwright/test';
import {fixture} from './manual-fixture';
const uid='00000000-0000-0000-0000-000000000001';
async function setup(page:Page){
 let raw=fixture(),lose=false,offline=false,badReceipt=false,count=0,lastId='';
 const user={id:uid,aud:'authenticated',role:'authenticated',email:'manual@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-10-26T00:00:00Z'};const payload=Buffer.from(JSON.stringify({sub:uid,aud:'authenticated',role:'authenticated',exp:2208988800})).toString('base64url');
 await page.addInitScript(({user,payload})=>{if(!localStorage.getItem('sb-auth-test-auth-token'))localStorage.setItem('sb-auth-test-auth-token',JSON.stringify({access_token:`e30.${payload}.test`,refresh_token:'test-refresh',expires_at:2208988800,expires_in:9999999,token_type:'bearer',user}));},{user,payload});
 await page.route('https://auth-test.invalid/**',async r=>{const path=new URL(r.request().url()).pathname;
 if(path.endsWith('/manual_snapshot')){const token=r.request().headers().authorization?.split(' ')[1];const who=token?JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).sub:uid;if(who!==uid){const b=fixture();b.id='manual-B';b.ledger[0].account_id=b.id;return r.fulfill({json:b});}return offline?r.abort():r.fulfill({json:raw});}
 if(path.endsWith('/manual_order')){count++;if(badReceipt)return r.fulfill({json:fixture()});const b=r.request().postDataJSON();if(lastId&&b.p_request_id!==lastId)throw Error('new id during recovery');lastId=b.p_request_id;const market=raw.market;raw=fixture(true);raw.market=market;raw.orders[0].request_id=b.p_request_id;raw.orders[0].payload=b.p_order;raw.orders[0].observed_at=b.p_order.observedAt;raw.orders[0].source=b.p_order.source;
 if(lose){offline=true;return r.abort();}return r.fulfill({json:raw});}
 if(path.endsWith('/logout'))return r.fulfill({status:204});if(path.endsWith('/user'))return r.fulfill({json:user});if(path.includes('watchlist_items'))return r.fulfill({json:[]});return r.fulfill({status:400,json:{message:'fixture endpoint unavailable'}});
 });
 return {badReceipt:()=>{badReceipt=true;},change:()=>{raw=fixture(true);},lose:()=>{lose=true;},restore:()=>{lose=false;offline=false;raw.market={...raw.market,canTrade:false,state:'closed',reason:'정규장 마감'};},get count(){return count;}};
}
async function form(page:Page){await page.goto('/#stock/AAPL');await expect(page.getByLabel('계좌 화면 모드')).toBeEnabled();await page.getByLabel('계좌 화면 모드').selectOption('manual');await expect(page.getByTestId('manual-cash')).toHaveText('$100,000.00');await page.getByLabel('수기 USD 단가',{exact:true}).fill('100');await page.getByLabel('가격 관측시각 (UTC/offset)',{exact:true}).fill('2026-10-27T13:59:00Z');}
test('manual UI preview/order/portfolio/mark/draft restore separate from synthetic ledger',async({page})=>{
 await setup(page);await form(page);await page.reload();await expect(page.getByLabel('수기 USD 단가',{exact:true})).toHaveValue('100');await expect(page.getByTestId('manual-preview')).toContainText('$99,899.90');
 await page.getByRole('button',{name:'수기 주문 검토',exact:true}).click();await page.getByRole('button',{name:'수기 체결 확정',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});await expect(page.getByRole('status')).toContainText('원장 저장 완료');await expect(page.getByTestId('manual-cash')).toHaveText('$99,899.90');await expect(page.getByText('평가가격·평가손익 미제공',{exact:true})).toBeVisible();
 await page.getByLabel('AAPL 평가 USD 가격',{exact:true}).fill('110');await page.getByLabel('AAPL 평가가격 출처',{exact:true}).fill('직접 확인');await page.getByRole('button',{name:'평가가격 저장',exact:true}).click();await expect(page.getByText(/미실현 \$9.90/)).toBeVisible();await page.reload();await expect(page.getByText(/미실현 \$9.90/)).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBeNull();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results-auth/manual-${test.info().project.name}.png`,fullPage:true});
 await page.goto('/#settings');await page.getByRole('button',{name:'로그아웃',exact:true}).click();await expect(page.getByLabel('계좌 화면 모드')).toHaveValue('synthetic');await expect(page.getByRole('heading',{name:'수기 가격 모의계좌 · USD'})).toHaveCount(0);
});
test('manual lost response restores same id after close without duplicate submission',async({page})=>{
 const f=await setup(page);await form(page);await page.getByRole('button',{name:'수기 주문 검토',exact:true}).click();f.lose();await page.getByRole('button',{name:'수기 체결 확정',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'체결 여부 미확정'})).toBeVisible();const pending=await page.evaluate(uid=>localStorage.getItem('us-stock.manual.pending.v1.'+uid),uid);expect(pending).not.toBeNull();f.restore();await page.reload();await page.getByRole('button',{name:'동일 ID 체결 재확인',exact:true}).click();await expect(page.getByRole('status')).toContainText('원장 저장 완료');expect(f.count).toBe(2);expect(await page.evaluate(uid=>localStorage.getItem('us-stock.manual.pending.v1.'+uid),uid)).toBeNull();await expect(page.getByRole('button',{name:'수기 주문 검토',exact:true})).toBeDisabled();
});

test('manual preflight rejects stale account and storage failure sends no order',async({page})=>{
 const f=await setup(page);await form(page);await page.getByRole('button',{name:'수기 주문 검토',exact:true}).click();f.change();await page.getByRole('button',{name:'수기 체결 확정',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'계좌가 변경'})).toBeVisible();expect(f.count).toBe(0);
 await page.getByRole('button',{name:'수기 주문 취소',exact:true}).click();await page.getByRole('button',{name:'수기 계좌 다시 조회',exact:true}).click();await expect(page.getByTestId('manual-cash')).toHaveText('$99,899.90');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('us-stock.manual.pending.'))throw Error('pending 저장 실패');original.call(this,k,v);};});
 await page.getByRole('button',{name:'수기 주문 검토',exact:true}).click();await page.getByRole('button',{name:'수기 체결 확정',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'pending 저장 실패'})).toBeVisible();expect(f.count).toBe(0);
});

test('manual same-browser user switch hides A positions, drafts and valuation from B',async({page})=>{
 await setup(page);await form(page);await page.getByRole('button',{name:'수기 주문 검토',exact:true}).click();await page.getByRole('button',{name:'수기 체결 확정',exact:true}).click();await expect(page.getByTestId('manual-cash')).toHaveText('$99,899.90');
 await page.evaluate(()=>{const key='sb-auth-test-auth-token',s=JSON.parse(localStorage.getItem(key)!);s.user={...s.user,id:'00000000-0000-0000-0000-000000000002',email:'manual-b@example.invalid'};s.access_token='e30.'+btoa(JSON.stringify({sub:s.user.id,aud:'authenticated',role:'authenticated',exp:2208988800}))+'.test';localStorage.setItem(key,JSON.stringify(s));localStorage.setItem('manual.mode.'+s.user.id,'manual');});await page.reload();await expect(page.getByTestId('manual-cash')).toHaveText('$100,000.00');await expect(page.getByLabel('수기 USD 단가',{exact:true})).toHaveValue('');await expect(page.locator('[aria-label="수기 계좌"] .holding')).toHaveCount(0);await expect(page.locator('[aria-label="수기 계좌"] .history-row')).toHaveCount(0);
 expect(await page.evaluate(uid=>localStorage.getItem('us-stock.manual.draft.v1.'+uid+'.AAPL'),uid)).toContain('100');
});

test('successful HTTP without matching fill never reports success or clears pending',async({page})=>{
 const f=await setup(page);await form(page);await page.getByRole('button',{name:'수기 주문 검토',exact:true}).click();f.badReceipt();await page.getByRole('button',{name:'수기 체결 확정',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'원장 불일치'})).toBeVisible();await expect(page.getByRole('button',{name:'불일치 응답 원본 내려받기',exact:true})).toBeVisible();await expect(page.getByRole('status').filter({hasText:'원장 저장 완료'})).toHaveCount(0);expect(await page.evaluate(uid=>localStorage.getItem('us-stock.manual.pending.v1.'+uid),uid)).not.toBeNull();expect(f.count).toBe(1);
});
