import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {accountKey} from '../src/accountStore';
import {quote,instruments} from '../src/data';

const lab='/?ui=v1&marketDensity=1&detailLab=1';
const localAccount=JSON.stringify({version:1,generation:'detail-lab-readonly',trades:[{id:'x-aapl',symbol:'AAPL',side:'buy',quantity:1,price:12500,time:'2026-11-04T11:00:00Z'}]});

test('A references the existing v1 stock detail; B/C are opt-in and no production route changes',async({page})=>{
 await page.goto('/#stock/AAPL');
 await expect(page.locator('.detail-lab')).toHaveCount(0);
 await expect(page.locator('.stock-detail')).toBeVisible();
 await page.goto('/?ui=v1#stock/AAPL');
 await expect(page.locator('.detail-lab')).toHaveCount(0);
 await expect(page.locator('.v1-stock-detail')).toBeVisible();
 await page.goto(lab+'&detailVariant=a#stock/AAPL');
 await expect(page.locator('.detail-lab-a')).toBeVisible();
 await expect(page.locator('.detail-lab-insight')).toHaveCount(0);
 await expect(page.locator('.v1-detail-price')).toBeVisible();
 await page.goto(lab+'&detailVariant=b#stock/AAPL');
 await expect(page.locator('.detail-lab-b')).toBeVisible();
 await expect(page.locator('.detail-lab-insight-grid article')).toHaveCount(3);
 await page.goto(lab+'&detailVariant=c#stock/AAPL');
 await expect(page.locator('.detail-lab-c')).toBeVisible();
 await expect(page.locator('.detail-lab-insight-grid article')).toHaveCount(3);
});

test('B narrative uses actual existing company evidence; no invented price or market capitalization',async({page})=>{
 const aapl=instruments.find(x=>x.symbol==='AAPL')!;
 await page.goto(lab+'&detailVariant=b#stock/AAPL');
 const detail=page.getByRole('article',{name:'기업 상세 화면'});
 const insight=page.getByRole('region',{name:'기업 핵심 이해'});
 await expect(insight).toContainText('iPhone, Mac, iPad');
 await expect(insight).toContainText('하드웨어 판매와 서비스 매출');
 await expect(insight).toContainText('일부 부품의 단일');
 await expect(insight).toContainText('공식 자료 기반 편집 요약');
 await expect(detail.locator('.v1-detail-price')).toContainText('교육용 합성 가격');
 await expect(detail.locator('.v1-detail-price')).toContainText('실제 시세 아님');
 await expect(detail.getByRole('tab',{name:'개요'})).toHaveAttribute('aria-selected','true');
 await expect(detail.locator('#company-overview')).toBeVisible();
 await expect(detail.locator('.v1-valuation')).toBeVisible();
 await detail.getByRole('tab',{name:'재무'}).click();
 await expect(detail.locator('#company-metrics')).toBeVisible();
 await expect(detail.locator('#company-health')).toBeVisible();
 await detail.getByRole('tab',{name:'근거'}).click();
 await expect(detail.getByRole('link',{name:/공식 10-K 원문/})).toBeVisible();
 await detail.getByRole('tab',{name:'개요'}).click();
 await expect(detail.locator('#company-overview')).toBeVisible();
 expect(quote(aapl).price).toBeGreaterThan(0);
});

test('C keeps all original data, tabs, real source links, lazy trade and keyboard arrow contract',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(lab+'&detailVariant=c#stock/NVDA');
 const detail=page.getByRole('article',{name:'기업 상세 화면'});
 const tabs=detail.getByRole('tablist',{name:'기업 상세'});
 await expect(tabs.getByRole('tab')).toHaveCount(4);
 await tabs.getByRole('tab',{name:'개요'}).focus();
 await page.keyboard.press('ArrowRight');
 await expect(tabs.getByRole('tab',{name:'차트·거래'})).toHaveAttribute('aria-selected','true');
 await expect(detail.locator('.price-boundary')).toContainText('교육용 합성 가격');
 await expect(detail.locator('.detail-order')).toBeVisible();
 await expect(detail.locator('.detail-chart')).toBeVisible();
 await tabs.getByRole('tab',{name:'재무'}).click();
 await expect(detail.locator('#company-health')).toBeVisible();
 await expect(detail.locator('.financial-metrics-grid')).toBeVisible();
 await tabs.getByRole('tab',{name:'근거'}).click();
 await expect(detail.locator('.company-evidence')).toBeVisible();
 await expect(detail.getByRole('link',{name:/공식 10-K 원문/})).toHaveAttribute('href',/sec.gov/);
 expect(errors).toEqual([]);
});

test('ETF B and C maintain product pages, missing-value transparency and source navigation',async({page})=>{
 for(const symbol of ['VOO','QQQ','SCHD']){
  for(const variant of ['b','c']){
   await page.goto(lab+'&detailVariant='+variant+'#stock/'+symbol);
   const detail=page.getByRole('article',{name:'ETF 상세 화면'});
   await expect(detail.getByRole('region',{name:'ETF 핵심 이해'})).toBeVisible();
   await expect(detail.getByRole('region',{name:'ETF 상품 안내'})).toBeVisible();
   await detail.getByRole('tab',{name:'상품정보'}).click();
   await expect(detail).toContainText('미확인');
   await detail.getByRole('tab',{name:'출처'}).click();
   await expect(detail.getByRole('link',{name:/공식 상품 페이지/})).toBeVisible();
   await expect(detail.locator('.v1-valuation')).toHaveCount(0);
  }
 }
});

test('comparison buttons preserve hash route and watchlist/account without mutating financial records',async({page})=>{
 const errors:string[]=[];const rpc:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('/rest/v1/rpc/'))rpc.push(r.url());});
 await page.addInitScript(doc=>localStorage.setItem('us-stock-lab.account.v1',doc),localAccount);
 await page.goto(lab+'&detailVariant=b#stock/AAPL');
 const before=await page.evaluate(key=>localStorage.getItem(key),accountKey);
 const switcher=page.getByRole('group',{name:'종목 상세 디자인 선택'});
 await switcher.getByRole('button',{name:/분석 데스크/}).click();
 await expect(page.locator('.detail-lab-c')).toBeVisible();
 await expect(page).toHaveURL(/detailVariant=c#stock\/AAPL$/);
 await page.reload();
 await expect(page.locator('.detail-lab-c')).toBeVisible();
 await switcher.getByRole('button',{name:/기존 상세/}).click();
 await expect(page.locator('.detail-lab-a')).toBeVisible();
 await switcher.getByRole('button',{name:/쉽게 이해/}).click();
 await expect(page.locator('.detail-lab-b')).toBeVisible();
 await expect(page.getByRole('article',{name:'기업 상세 화면'})).toContainText('애플');
 expect(await page.evaluate(key=>localStorage.getItem(key),accountKey)).toBe(before);
 expect(rpc).toEqual([]);
 expect(errors).toEqual([]);
});

test('market density card navigates to the selected detailed design with stock identity',async({page})=>{
 await page.goto(lab+'&detailVariant=b#market');
 await expect(page.locator('.market-v3-card')).toHaveCount(8);
 await page.locator('.market-v3-card[data-symbol="MSFT"] a[href="#stock/MSFT"]').click();
 await expect(page).toHaveURL(/#stock\/MSFT$/);
 await expect(page.locator('.detail-lab-b')).toBeVisible();
 await expect(page.getByRole('article',{name:'기업 상세 화면'})).toContainText('마이크로소프트');
 await page.getByRole('article',{name:'기업 상세 화면'}).getByRole('link',{name:/← 시장/}).click();
 await expect(page).toHaveURL(/#market$/);
 await expect(page.locator('.market-v3')).toBeVisible();
});

test('320–1440px B and C preserve readable layouts without document overflow',async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const variant of ['b','c']){
   await page.goto(lab+'&detailVariant='+variant+'#stock/AAPL');
   await expect(page.locator('.detail-lab-insight-grid article')).toHaveCount(3);
   await expect(page.getByRole('tablist',{name:'기업 상세'})).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'overflow at '+width+' variant '+variant).toBeLessThanOrEqual(0);
   await page.getByRole('tab',{name:'재무'}).click();
   await expect(page.locator('.financial-statements')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'financial overflow at '+width+' variant '+variant).toBeLessThanOrEqual(0);
  }
 }
 expect(errors).toEqual([]);
});

test('reduce-motion disables optional transitions while preserving all stock content',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(lab+'&detailVariant=b#stock/AAPL');
 const root=page.locator('.detail-lab-stock');
 expect(await root.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.getByRole('group',{name:'종목 상세 디자인 선택'}).getByRole('button',{name:/분석 데스크/}).click();
 const panel=page.locator('.detail-lab-stock .detail-panel:not([hidden])');
 await expect(panel).toBeVisible();
 expect(await panel.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('capture A/B/C stock detail and ETF layouts at desktop/mobile sizes',async({page},info)=>{
 mkdirSync('work/detail-v2/captures',{recursive:true});
 const width=info.project.name==='mobile'?390:1440;
 await page.setViewportSize({width,height:960});
 for(const variant of ['a','b','c']){
  await page.goto(lab+'&detailVariant='+variant+'#stock/AAPL');
  await expect(page.getByRole('article',{name:'기업 상세 화면'})).toBeVisible();
  await page.screenshot({path:'work/detail-v2/captures/'+info.project.name+'-'+width+'-AAPL-'+variant+'.png',fullPage:true,animations:'disabled'});
 }
 for(const variant of ['b','c']){
  await page.goto(lab+'&detailVariant='+variant+'#stock/VOO');
  await expect(page.getByRole('article',{name:'ETF 상세 화면'})).toBeVisible();
  await page.screenshot({path:'work/detail-v2/captures/'+info.project.name+'-'+width+'-VOO-'+variant+'.png',fullPage:true,animations:'disabled'});
 }
});
