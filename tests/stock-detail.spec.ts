import {test,expect} from '@playwright/test';
import {companyProfiles} from '../src/companyProfiles';
import {instruments} from '../src/data';
import {metadata} from '../src/uiData';
import {financialValueText,latestFinancialFact} from '../src/companyPresentation';
import {openTrading,openFinancials,openEvidence} from './detail-navigation';

test('all companies and ETFs enter their own overview with accessible four-tab navigation',async({page})=>{
 for(const stock of instruments){
  await page.goto('/#stock/'+stock.symbol);const root=page.locator('.stock-detail');
  await expect(root).toHaveAttribute('data-kind',stock.kind==='ETF'?'etf':'company');await expect(root.getByRole('heading',{level:1,name:stock.name,exact:true})).toBeFocused();
  const tabs=page.getByRole('tab');await expect(tabs).toHaveCount(4);await expect(page.getByRole('tab',{name:'개요',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(page.getByLabel('외부 차트 패널')).toHaveCount(0);await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toHaveCount(0);
  if(stock.kind==='ETF'){await expect(page.getByRole('tab',{name:'상품정보',exact:true})).toBeVisible();await expect(page.locator('.company-detail')).toHaveCount(0);await expect(page.getByRole('region',{name:'ETF 상품 안내'})).toContainText(metadata[stock.symbol].description);}
  else {const p=companyProfiles.find(p=>p.symbol===stock.symbol)!;for(const metric of ['revenue','operatingIncome','netIncome'] as const){const f=latestFinancialFact(p,metric,'annual')!;await expect(page.getByTestId('overview-'+metric)).toContainText(financialValueText(f));await expect(page.getByTestId('overview-'+metric)).toContainText(f.period.end);}await expect(page.locator('.overview-metrics > div')).toHaveCount(3);}
 }
});

test('tabs use roving focus, arrows/Home/End, panel labels and shared accounting period',async({page})=>{
 await page.goto('/#stock/AAPL');const tabs=page.getByRole('tab');await tabs.nth(0).focus();
 for(const [key,index] of [['ArrowRight',1],['ArrowRight',2],['End',3],['Home',0],['ArrowLeft',3]] as const){await page.keyboard.press(key);await expect(tabs.nth(index)).toBeFocused();await expect(tabs.nth(index)).toHaveAttribute('aria-selected','true');await expect(tabs.nth(index)).toHaveAttribute('tabindex','0');const id=await tabs.nth(index).getAttribute('aria-controls');await expect(page.locator('#'+id)).toBeVisible();await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby',(await tabs.nth(index).getAttribute('id'))!);}
 await page.keyboard.press('Home');await page.keyboard.press('Tab');await expect(page.getByRole('tabpanel')).toBeFocused();
 await page.getByRole('button',{name:'분기',exact:true}).click();const before=await page.getByTestId('overview-revenue').textContent();await openFinancials(page);await expect(page.getByRole('button',{name:'분기',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByTestId('financial-revenue')).toContainText('109417000000');await page.getByRole('tab',{name:'개요',exact:true}).click();expect(await page.getByTestId('overview-revenue').textContent()).toBe(before);
 await page.reload();await expect(page.getByRole('tab',{name:'개요',exact:true})).toHaveAttribute('aria-selected','true');await expect(page).toHaveURL(/#stock\/AAPL$/);await page.goto('/#stock/MSFT');await expect(page.getByRole('tab',{name:'개요',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByRole('heading',{level:1,name:'마이크로소프트',exact:true})).toBeFocused();
});

test('all 219 observations, 200 reported proofs and 19 formulas remain reachable without loss',async({page})=>{
 let total=0,reported=0,calculated=0;
 for(const p of companyProfiles){
  await page.goto('/#stock/'+p.symbol);await openEvidence(page);const facts=page.locator('[data-fact-id]');await expect(facts).toHaveCount(p.financials.length);
  expect(await facts.evaluateAll(es=>es.map(e=>({id:e.getAttribute('data-fact-id'),exact:e.querySelector('[data-testid=evidence-exact-value]')?.textContent,summary:e.querySelector('summary')?.textContent,body:e.textContent,urls:[...e.querySelectorAll('a')].map(a=>a.getAttribute('href'))})))).toEqual(p.financials.map(f=>expect.objectContaining({id:f.id,exact:`정확값 ${f.value===null?'미제공':f.value} ${f.unit}${f.missingReason?' · '+f.missingReason:''}`,summary:expect.stringContaining(f.period.end),body:expect.stringContaining(f.unit),urls:expect.arrayContaining(f.sourceId?[p.sources.find(s=>s.id===f.sourceId)!.url]:[])})));
  for(const f of p.financials){total++;if(f.origin.kind==='reported')reported++;else{calculated++;const row=page.locator(`[data-fact-id="${f.id}"]`);await expect(row).toContainText(f.origin.formula);for(const id of f.origin.inputIds){const input=p.financials.find(x=>x.id===id)!;await expect(row).toContainText(financialValueText(input));await expect(row).toContainText(id);}}}
  const first=facts.first();await first.locator('summary').first().click();await expect(first.getByTestId('evidence-exact-value')).toBeVisible();await first.getByText('원문 필드 전체',{exact:true}).click();await expect(first.locator('.evidence-grid')).toBeVisible();
  const calc=p.financials.find(f=>f.origin.kind==='calculated')!;const row=page.locator(`[data-fact-id="${calc.id}"]`);await row.locator('summary').first().click();await expect(row.getByText('계산식:',{exact:false})).toBeVisible();
  expect(await page.locator('[data-source-id]').evaluateAll(es=>es.map(e=>e.getAttribute('data-source-id')))).toEqual(p.sources.map(s=>s.id));
 }
 expect({total,reported,calculated}).toEqual({total:219,reported:200,calculated:19});
});

test('all ETF products expose missing holdings/weights/fees/distributions without fake values or corporate graphs',async({page})=>{
 for(const symbol of ['VOO','QQQ','SCHD']){
  await page.goto('/#stock/'+symbol);await page.getByRole('tab',{name:'상품정보',exact:true}).click();const root=page.locator('.etf-detail');await expect(root.locator('.etf-missing')).toHaveCount(4);await expect(root.locator('svg,canvas,.donut')).toHaveCount(0);await expect(root).not.toContainText('0%');await expect(root).not.toContainText('$0');await expect(root).toContainText('무분배를 의미하지 않습니다.');
  await page.getByRole('tab',{name:'출처',exact:true}).click();await expect(page.getByRole('link',{name:/공식 상품 페이지/})).toHaveAttribute('href',metadata[symbol].source);await expect(page.getByRole('link',{name:/공식 상품 페이지/})).toHaveAttribute('target','_blank');await expect(page.locator('.etf-detail')).toContainText('기준일과 확인일은 미확인');
  await openTrading(page);await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeVisible();await expect(page.getByLabel('외부 차트 패널')).toBeVisible();await expect(page.getByRole('link',{name:'차트 학습실에서 연습하기 →'})).toHaveAttribute('href','#learn/'+symbol);
 }
});

test('tab changes preserve order review and inputs, while external scripts and iframes are cleaned',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T14:00:00Z'));let scripts=0;await page.route('https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',r=>{scripts++;return r.fulfill({contentType:'application/javascript',body:"const f=document.createElement('iframe');f.title='fixture chart';document.currentScript.parentElement.appendChild(f);"});});
 await page.goto('/#stock/AAPL');const before=await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'));await openTrading(page);await page.getByLabel('외부 차트 제공자').selectOption('네이버');await page.getByLabel('주문 수량',{exact:true}).fill('7');await page.getByRole('button',{name:'주문 검토',exact:true}).click();await expect(page.getByRole('dialog',{name:'가상 주문 확인'})).toContainText('7주');await page.getByRole('button',{name:'TradingView 공식 표시용 차트 열기'}).click();await expect(page.locator('.external-chart iframe')).toHaveCount(1);expect(scripts).toBe(1);
 await openFinancials(page);await expect(page.locator('.external-chart iframe,.external-chart script')).toHaveCount(0);await expect(page.getByRole('dialog',{name:'가상 주문 확인'})).toHaveCount(0);await openTrading(page);await expect(page.getByLabel('주문 수량',{exact:true})).toHaveValue('7');await expect(page.getByRole('dialog',{name:'가상 주문 확인'})).toContainText('7주');await expect(page.getByRole('button',{name:'TradingView 공식 표시용 차트 열기'})).toHaveAttribute('aria-pressed','false');expect(scripts).toBe(1);await expect(page.getByLabel('외부 차트 제공자')).toHaveValue('네이버');expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(before);await page.getByRole('button',{name:'주문 취소',exact:true}).click();
});

test('order jump and seven-step Tour activate the actual trading tab and restore the origin tab',async({page})=>{
 await page.goto('/#stock/AAPL');await page.getByRole('link',{name:'시세·주문으로 이동 ↓',exact:true}).click();await expect(page.getByRole('tab',{name:'차트·거래',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('#detail-order')).toBeFocused();await expect(page).toHaveURL(/#stock\/AAPL$/);
 await openFinancials(page);const tab=page.getByRole('tab',{name:'재무',exact:true});await tab.focus();const before=await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'));await page.evaluate(()=>window.dispatchEvent(new Event('start-tutorial')));
 for(let step=1;step<=7;step++){await expect(page.getByRole('dialog',{name:`사용 방법 ${step}/7`})).toBeVisible();if(step===4){await expect(page.getByRole('tab',{name:'차트·거래',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('.detail-order')).toBeVisible();await expect(page.locator('.spotlight')).toBeVisible();const [target,spot]=await Promise.all([page.locator('.detail-order').boundingBox(),page.locator('.spotlight').boundingBox()]);expect(Math.abs(target!.y-spot!.y)).toBeLessThan(2);expect(Math.abs(target!.width-spot!.width)).toBeLessThan(2);}await page.getByRole('button',{name:step===7?'종료':'다음',exact:true}).click();}
 await expect(page).toHaveURL(/#stock\/AAPL$/);await expect(tab).toHaveAttribute('aria-selected','true');await expect(tab).toBeFocused();expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(before);
});

test('all eight symbols and all panels fit five widths with visible controls and no JS errors',async({page},info)=>{
 test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const rpcs:string[]=[];page.on('request',r=>{if(/\/rest\/v1\/rpc\//.test(r.url()))rpcs.push(r.url());});
 for(const width of [1440,1200,768,390,320]){
  await page.setViewportSize({width,height:950});
  for(const stock of instruments){await page.goto('/#stock/'+stock.symbol);for(let index=0;index<4;index++){const tab=page.getByRole('tab').nth(index);if(info.project.name==='mobile')await tab.tap();else await tab.click();await expect(tab).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tabpanel')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
   const boxes=await page.getByRole('tab').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};}));for(const box of boxes){expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44);expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width+1);}for(let i=1;i<boxes.length;i++)expect(boxes[i].left).toBeGreaterThanOrEqual(boxes[i-1].right);
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});const selected=page.getByRole('tab',{selected:true});await selected.focus();await expect(selected).toHaveCSS('transition-duration','0s');await expect(selected).toHaveCSS('outline-width','3px');expect(errors).toEqual([]);expect(rpcs).toEqual([]);
});
