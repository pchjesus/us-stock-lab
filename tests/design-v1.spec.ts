import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {decodeAccount,marketPrices,accountKey} from '../src/accountStore';
import {valuation} from '../src/trading';
import {formatDisplay} from '../src/preferences';

const demo=JSON.stringify({version:1,generation:'v1-visual-test',trades:[
 {id:'v1buy-aapl',symbol:'AAPL',side:'buy',quantity:2,price:12200,time:'2026-11-02T14:35:00Z'},
 {id:'v1buy-voo',symbol:'VOO',side:'buy',quantity:1,price:53875,time:'2026-11-02T14:40:00Z'}
]});

test('UI v1 is strictly opt-in and original navigation is untouched by default',async({page})=>{
 await page.goto('/#home');
 await expect(page.locator('.ui-v1')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'◫ 홈',exact:true})).toBeVisible();
 await expect(page.locator('.v1-sidebar')).toHaveCount(0);
 await page.goto('/?ui=v1#home');
 await expect(page.locator('.app.ui-v1')).toBeVisible();
 await expect(page.locator('.v1-sidebar')).toHaveCount(1);
 await expect(page.getByRole('heading',{name:'나의 모의투자 현황'})).toBeVisible();
 await expect(page.getByText('투자를 배우는 가장 안전한 방법.')).toHaveCount(0);
 await expect(page.getByTestId('ticker-current')).toBeVisible();
});

test('new navigation connects existing routes and preserves the complete local account',async({page},testInfo)=>{
 const errors:string[]=[],rpc:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',req=>{if(req.url().includes('/rest/v1/rpc/'))rpc.push(req.url());});
 await page.addInitScript(doc=>localStorage.setItem('us-stock-lab.account.v1',doc),demo);
 await page.goto('/?ui=v1#home');
 const before=await page.evaluate(key=>localStorage.getItem(key),accountKey);
 for(const [href,selector] of [
  ['#market','.market-currency-header'],
  ['#portfolio','.account-summary'],
  ['#portfolio/analysis','main'],
  ['#backtest','.bt-lab'],
  ['#learn','.learning-choice'],
  ['#experience','main'],
  ['#calendar','.calendar-grid'],
  ['#news','h1'],
  ['#settings','.display-settings'],
  ['#home','.home-dashboard']
 ] as const){
  if(testInfo.project.name==='mobile'){
   if(['#home','#market','#portfolio','#portfolio/analysis','#learn'].includes(href))
    await page.locator('.v1-mobile-nav a[href="'+href+'"]').click();
   else if(href==='#settings')await page.locator('.header-actions a[href="#settings"]').click();
   else await page.goto('/?ui=v1'+href);
  }else await page.locator('.v1-sidebar a[href="'+href+'"]').first().click();
  await expect.poll(()=>page.url().endsWith(href)).toBe(true);
  await expect(page.locator(selector).first()).toBeVisible();
 }
 const original=decodeAccount(demo).account;
 await expect(page.getByTestId('total-assets').first()).toHaveText(formatDisplay(valuation(original,marketPrices()).total,'USD'));
 expect(await page.evaluate(key=>localStorage.getItem(key),accountKey)).toBe(before);
 expect(errors).toEqual([]);expect(rpc).toEqual([]);
});

test('UI v1 shows usable pages and no horizontal overflow from 320 to 1440px',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const routes=['home','market','stock/AAPL','portfolio','portfolio/analysis','backtest','learn','settings'];
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of routes){
   await page.goto('/?ui=v1#'+route);
   await expect(page.locator('.app.ui-v1')).toBeVisible();
   await expect(page.locator('main')).toBeVisible();
   const spill=await page.evaluate(()=>{
    const excess=document.documentElement.scrollWidth-window.innerWidth;
    const offenders=Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(el=>el.getBoundingClientRect().right>window.innerWidth+1&&getComputedStyle(el).position!=='fixed').slice(0,8).map(el=>({name:el.tagName,cls:el.className?.toString().slice(0,65),right:Math.round(el.getBoundingClientRect().right)}));
    return {excess,offenders};
   });
   expect(spill.excess,'Overflow at '+width+'px '+route+': '+JSON.stringify(spill.offenders)).toBeLessThanOrEqual(0);
   if(width<=760){await expect(page.locator('.v1-mobile-nav')).toBeVisible();await expect(page.locator('.v1-sidebar')).toBeHidden();}
   else{await expect(page.locator('.v1-sidebar')).toBeVisible();await expect(page.locator('.v1-mobile-nav')).toBeHidden();}
  }
 }
 expect(errors).toEqual([]);
});

test('mobile primary navigation and desktop collapsed rail preserve routing',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?ui=v1#home');
 const mobile=page.getByRole('navigation',{name:'모바일 주요 메뉴'});
 await expect(mobile.locator('a')).toHaveCount(5);
 await mobile.getByRole('link',{name:'분석'}).click();await expect.poll(()=>page.url().endsWith('#portfolio/analysis')).toBe(true);
 await mobile.getByRole('link',{name:'학습'}).click();await expect.poll(()=>page.url().endsWith('#learn')).toBe(true);
 await page.setViewportSize({width:1440,height:900});
 const rail=page.locator('.v1-sidebar');
 await rail.getByRole('button',{name:'메뉴 접기'}).click();
 await expect(page.locator('.app.ui-v1')).toHaveClass(/collapsed/);
 await rail.getByRole('button',{name:'메뉴 펼치기'}).click();
 await expect(page.locator('.app.ui-v1')).not.toHaveClass(/collapsed/);
 await expect(page.getByRole('navigation',{name:'주요 메뉴'}).getByRole('link',{name:'학습'})).toHaveAttribute('aria-current','page');
});

test('save opt-in v1 visual review screenshots across desktop and mobile routes',async({page},testInfo)=>{
 mkdirSync('work/ui-v1/captures',{recursive:true});
 const paths=['home','market','stock/AAPL','portfolio','portfolio/analysis','backtest','learn'];
 const width=testInfo.project.name==='mobile'?390:1440;
 await page.setViewportSize({width,height:960});
 for(const route of paths){
  await page.goto('/?ui=v1#'+route);
  await expect(page.locator('main')).toBeVisible();
  await page.screenshot({path:'work/ui-v1/captures/'+testInfo.project.name+'-'+width+'-'+route.replaceAll('/','-')+'.png',fullPage:true,animations:'disabled'});
 }
});
