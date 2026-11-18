import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {accountKey} from '../src/accountStore';

const demo=JSON.stringify({version:1,generation:'home-v2-lab-preservation',trades:[
 {id:'h2-aapl',symbol:'AAPL',side:'buy',quantity:2,price:12200,time:'2026-11-02T14:35:00Z'},
 {id:'h2-voo',symbol:'VOO',side:'buy',quantity:1,price:53875,time:'2026-11-02T14:40:00Z'}
]});
const base='/?ui=v1&homeLab=1';

test('experimental home is opt-in; stable v1 and legacy remain unchanged',async({page})=>{
 await page.goto('/#home');
 await expect(page.locator('.home-lab')).toHaveCount(0);
 await page.goto('/?homeLab=1#home');
 await expect(page.locator('.home-lab')).toHaveCount(0);
 await page.goto('/?ui=v1#home');
 await expect(page.locator('.home-lab')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'나의 모의투자 현황'})).toBeVisible();
 await page.goto(base+'#home');
 await expect(page.getByRole('region',{name:'홈 디자인 실험'})).toBeVisible();
 await expect(page.getByRole('group',{name:'홈 디자인 선택'}).getByRole('button')).toHaveCount(3);
});

test('three alternatives reorder readable sections without mutating simulated account or URLs',async({page})=>{
 const errors:string[]=[],rpc:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(request.url().includes('/rest/v1/rpc/'))rpc.push(request.url());});
 await page.addInitScript(value=>localStorage.setItem('us-stock-lab.account.v1',value),demo);
 await page.goto(base+'#home');
 const controls=page.getByRole('group',{name:'홈 디자인 선택'});
 const before=await page.evaluate(key=>localStorage.getItem(key),accountKey);
 await expect(page.getByTestId('total-assets')).toBeVisible();
 const initialAmount=await page.getByTestId('total-assets').innerText();
 for(const [id,label,first] of [
  ['a','A · 자산 중심','나의 모의투자 현황'],
  ['b','B · 마켓 데스크','미국 시장 한눈에'],
  ['c','C · 간결한 시작','나의 모의투자 현황']
 ] as const){
  await controls.getByRole('button',{name:label}).click();
  await expect(page.locator('.home-lab-'+id)).toBeVisible();
  await expect(controls.getByRole('button',{name:label})).toHaveAttribute('aria-pressed','true');
  await expect(page).toHaveURL(new RegExp('homeVariant='+id+'.*#home$'));
  await expect(page.locator('.home-dashboard > .home-section').first()).toContainText(first);
  await expect(page.locator('.home-account')).toHaveCount(1);
  await expect(page.locator('.home-watchlist')).toHaveCount(1);
  await expect(page.locator('[aria-labelledby="home-market-title"]')).toHaveCount(1);
  await expect(page.locator('.home-explore')).toHaveCount(1);
  await expect(page.getByTestId('total-assets')).toHaveText(initialAmount);
  await expect(page.locator('.home-watchlist')).toContainText('실제 현재가가 아닙니다.');
  await expect(page.locator('[aria-labelledby="home-market-title"]')).toContainText('미국 시장 한눈에');
  expect(await page.evaluate(key=>localStorage.getItem(key),accountKey)).toBe(before);
 }
 await page.reload();
 await expect(page.locator('.home-lab-c')).toBeVisible();
 await expect(page.getByTestId('total-assets')).toHaveText(initialAmount);
 expect(errors).toEqual([]);expect(rpc).toEqual([]);
});

test('all home alternatives fit from 320 to 1440 without hiding existing routes',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const id of ['a','b','c']){
   await page.goto(base+'&homeVariant='+id+'#home');
   await expect(page.locator('.home-lab-'+id)).toBeVisible();
   await expect(page.getByRole('link',{name:/포트폴리오 자세히/})).toBeVisible();
   await expect(page.locator('.home-explore a[href="#learn"]')).toBeVisible();
   await expect(page.locator('.home-explore-grid a[href="#calendar"]')).toBeVisible();
   await expect(page.locator('.home-watchlist .home-section-title a[href="#market"]')).toBeVisible();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   expect(overflow,'horizontal overflow: '+id+' at '+width+'px').toBeLessThanOrEqual(0);
  }
 }
 expect(errors).toEqual([]);
});

test('home comparison screenshots retain source labels and existing account components',async({page},info)=>{
 const width=info.project.name==='mobile'?390:1440;
 await page.setViewportSize({width,height:960});
 mkdirSync('work/home-v2-lab/captures',{recursive:true});
 for(const id of ['a','b','c']){
  await page.goto(base+'&homeVariant='+id+'#home');
  await expect(page.locator('.home-lab-'+id)).toBeVisible();
  await expect(page.locator('[aria-labelledby="home-market-title"] .home-index').first()).toBeVisible();
  await page.screenshot({path:`work/home-v2-lab/captures/${info.project.name}-${width}-home-${id}.png`,fullPage:true,animations:'disabled'});
 }
});
