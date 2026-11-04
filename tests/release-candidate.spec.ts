import {openTrading} from './detail-navigation';
import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('release defaults suppress stale manual mode even for a restored authenticated session',async({page})=>{
 const uid='00000000-0000-0000-0000-000000000001';
 const user={id:uid,aud:'authenticated',role:'authenticated',email:'release@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-10-26T00:00:00Z'};
 const payload=Buffer.from(JSON.stringify({sub:uid,aud:'authenticated',role:'authenticated',exp:2208988800})).toString('base64url');
 await page.addInitScript(({uid,user,payload})=>{localStorage.setItem('sb-vveljtqmujdzkzmoncjx-auth-token',JSON.stringify({access_token:`e30.${payload}.fixture`,refresh_token:'fixture',expires_at:2208988800,expires_in:999999,token_type:'bearer',user}));localStorage.setItem('manual.mode.'+uid,'manual');},{uid,user,payload});
 const calls:string[]=[];
 await page.route('https://vveljtqmujdzkzmoncjx.supabase.co/**',route=>{const path=new URL(route.request().url()).pathname;calls.push(path);if(path.endsWith('/paper_snapshot'))return route.fulfill({json:{id:'fixture',cash:'10000000',realized:'0',trades:[],positions:[],prices:{AAPL:'22374'}}});if(path.endsWith('/user'))return route.fulfill({json:user});if(path.includes('watchlist_items'))return route.fulfill({json:[]});return route.fulfill({status:404,json:{message:'fixture: unavailable'}});});
 await page.goto('/#settings');await expect(page.getByText('로그인: release@example.invalid',{exact:true})).toBeVisible();
 for(const route of ['home','market','learn/AAPL','stock/AAPL','portfolio','settings']){await page.goto('/#'+route);if(route.startsWith('stock/'))await openTrading(page);if(['portfolio','settings'].includes(route)){await expect(page.getByLabel('계좌 화면 모드')).toHaveValue('synthetic');await expect(page.locator('option[value="manual"]')).toHaveJSProperty('disabled',true);await expect(page.getByText('수기 계좌는 공개 준비 중이므로 선택할 수 없습니다.')).toBeVisible();}else await expect(page.getByLabel('계좌 화면 모드')).toHaveCount(0);if(route==='stock/AAPL'){for(const tab of await page.getByRole('tab').all()){await tab.click();await expect(tab).toHaveAttribute('aria-selected','true');}await openTrading(page);}if(route==='stock/AAPL')await expect(page.getByRole('region',{name:'현재 주문 계좌'})).toContainText('기존 합성 계좌 · 사용자 서버');await expect(page.getByLabel('수기 계좌',{exact:true})).toHaveCount(0);}
 await page.clock.install();await page.clock.runFor(16000);
 expect(calls.some(path=>/manual_|dividend_|tax_/.test(path))).toBe(false);
 expect(calls.some(path=>path.endsWith('/paper_snapshot'))).toBe(true);
 expect(await page.evaluate(uid=>localStorage.getItem('manual.mode.'+uid),uid)).toBe('manual');
});

for(const width of [1440,1200,768,390,320])test(`release screen matrix at ${width}px`,async({page})=>{
 test.setTimeout(90000);mkdirSync('work/v08-r1/screens',{recursive:true});await page.setViewportSize({width,height:950});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['home','market',...'AAPL MSFT NVDA AMZN GOOGL VOO QQQ SCHD'.split(' ').map(s=>'stock/'+s),'portfolio','learn/AAPL','settings']){
  await page.goto('/#'+route);await expect(page.getByTestId('ticker-current')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`work/v08-r1/screens/${width}-${route.replace('/','-')}.png`});
 }
 await page.getByRole('button',{name:'주요 시장 지표 열기'}).click();await expect(page.getByRole('dialog',{name:'주요 시장 지표'})).toBeVisible();await page.screenshot({path:`work/v08-r1/screens/${width}-indices-modal.png`});
 expect(errors).toEqual([]);
});
