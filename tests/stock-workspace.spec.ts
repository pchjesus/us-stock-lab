import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {findCompanyProfile} from '../src/companyProfiles';
import {latestFinancialFact} from '../src/companyPresentation';
const url='/?ui=v1&marketDensity=1&stockWorkspace=1';
test('new workspace is independent of all previous detail designs',async({page})=>{
 await page.goto('/?ui=v1&detailLab=1&detailVariant=b#stock/AAPL');
 await expect(page.locator('.detail-lab-b')).toBeVisible();
 await expect(page.locator('.stock-workspace-v3')).toHaveCount(0);
 await page.goto(url+'#stock/AAPL');await expect(page.locator('.stock-workspace-v3')).toBeVisible();
 await expect(page.locator('.detail-lab')).toHaveCount(0);
 await expect(page.locator('.company-detail')).toHaveCount(0);
 await expect(page.locator('.sw-price')).toContainText('실제 시세 아님');
 await expect(page.getByRole('tab',{name:'개요'})).toHaveAttribute('aria-selected','true');
 await page.goto('/#stock/AAPL');await expect(page.locator('.stock-workspace-v3')).toHaveCount(0);
});
test('overview metrics switch real fiscal series and evidence inspector shows exact registered facts',async({page})=>{
 await page.goto(url+'#stock/AAPL');
 await expect(page.locator('.sw-kpis button')).toHaveCount(3);
 await page.locator('.sw-kpis button').filter({hasText:'영업이익'}).click();
 await expect(page.locator('.sw-plot')).toHaveAttribute('aria-label','영업이익 추이');
 await page.getByRole('group',{name:'실적 기간'}).getByRole('button',{name:'분기'}).click();
 const f=latestFinancialFact(findCompanyProfile('AAPL')!,'operatingIncome','quarter')!;
 await expect(page.locator('.sw-bar-row').last()).toHaveAttribute('title',new RegExp(f.value!));
 await page.locator('.sw-bar-row').last().click();
 await expect(page.getByRole('tab',{name:'근거'})).toHaveAttribute('aria-selected','true');
 await expect(page.getByRole('region',{name:'선택한 관측값'})).toContainText(f.value!+' USD');
 await expect(page.getByRole('link',{name:/공식 원문 열기/})).toHaveAttribute('href',/sec.gov/);
});
test('financial statement group tabs, missing data, and on-demand evidence',async({page})=>{
 await page.goto(url+'#stock/AAPL');await page.getByRole('tab',{name:'재무'}).click();
 await expect(page.getByRole('region',{name:'손익계산서 기간 비교'})).toBeVisible();
 await page.getByRole('group',{name:'재무제표 종류'}).getByRole('button',{name:'재무상태'}).click();
 await expect(page.getByRole('region',{name:'재무상태표 기간 비교'})).toContainText('시점 잔액');
 await page.getByRole('group',{name:'재무제표 종류'}).getByRole('button',{name:'현금흐름'}).click();
 await expect(page.getByRole('region',{name:'현금흐름표 기간 비교'})).toBeVisible();
 const f=latestFinancialFact(findCompanyProfile('AAPL')!,'freeCashFlow','annual')!;
 await page.locator('.sw-table tbody button[title="'+f.value+' USD"]').first().click();
 await expect(page.locator('.sw-inspector')).toContainText(f.value!);
 await expect(page.locator('.sw-inspector')).toContainText('계산식');
 await page.locator('.sw-input-fact').first().click();
 await expect(page.locator('.sw-inspector')).toContainText('공식 보고값');
});
test('evidence library searches, selects without resetting filters, and switches official filing scope',async({page})=>{
 await page.goto(url+'#stock/AAPL');await page.getByRole('tab',{name:'근거'}).click();
 await expect(page.locator('.sw-records button')).toHaveCount(25);
 await page.getByLabel('검색',{exact:true}).fill('매출액');await expect(page.locator('.sw-records button').first()).toBeVisible();
 await page.locator('.sw-records button').first().click();await expect(page.getByLabel('검색',{exact:true})).toHaveValue('매출액');
 await expect(page.locator('.sw-inspector')).toContainText('매출액');
 await page.getByRole('button',{name:/공시 문서/}).click();
 await expect(page.locator('.sw-records article').first()).toBeVisible();await expect(page.locator('.sw-records a').first()).toHaveAttribute('href',/^https:\/\//);
});
test('trade screen keeps external chart and original order panel, never mutates account on navigation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'#stock/MSFT');
 const before=await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'));
 await page.getByRole('tab',{name:'차트·거래'}).click();
 await expect(page.locator('.sw-trade .external-chart')).toHaveCount(1);
 await expect(page.getByRole('region',{name:'외부 차트 패널'})).toBeVisible();
 await expect(page.locator('#detail-order')).toBeVisible();
 await page.getByRole('tab',{name:'개요'}).click();
 expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(before);expect(errors).toEqual([]);
});
test('ETF routes do not expose company PER or fake fundamentals, and symbol switch works',async({page})=>{
 await page.goto(url+'#stock/VOO');await expect(page.locator('.sw-etf')).toContainText('Vanguard');
 await expect(page.locator('.sw-ratios')).toHaveCount(0);
 await page.getByRole('tab',{name:'상품정보'}).click();await expect(page.locator('.sw-etf')).toContainText('미확인');
 await page.getByRole('tab',{name:'출처'}).click();await expect(page.getByRole('link',{name:/Vanguard 공식 상품 페이지/})).toBeVisible();
 await page.getByLabel('종목 이동').selectOption('NVDA');await expect(page).toHaveURL(/#stock\/NVDA$/);await expect(page.locator('.sw-title')).toContainText('엔비디아');
});
test('mobile and desktop all rebuilt tabs fit viewport and keyboard works',async({page})=>{
 test.setTimeout(120000);
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:960});await page.goto(url+'#stock/AAPL');
  for(const tab of ['개요','차트·거래','재무','근거']){
   await page.getByRole('tab',{name:tab,exact:true}).click();await expect(page.getByRole('tabpanel',{name:tab,exact:true})).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),width+': '+tab).toBeLessThanOrEqual(0);
  }
 }
 await page.getByRole('tab',{name:'개요',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'차트·거래'})).toHaveAttribute('aria-selected','true');
});
test('captures all four redesigned screens and reduced motion',async({page},info)=>{
 mkdirSync('work/stock-workspace/captures',{recursive:true});
 const w=info.project.name==='mobile'?390:1440;await page.setViewportSize({width:w,height:960});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'#stock/AAPL');
 for(const [i,name] of ['개요','차트·거래','재무','근거'].entries()){
  await page.getByRole('tab',{name,exact:true}).click();
  const panel=page.getByRole('tabpanel',{name,exact:true});await expect(panel).toBeVisible();
  expect(await panel.evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
  await page.screenshot({path:'work/stock-workspace/captures/'+info.project.name+'-'+w+'-'+i+'.png',fullPage:true,animations:'disabled'});
 }
});
