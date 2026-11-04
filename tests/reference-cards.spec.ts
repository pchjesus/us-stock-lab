import {openTrading,openEvidence} from './detail-navigation';
import {test,expect,type Page,type Route} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {companyProfiles} from '../src/companyProfiles';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NewsPanel} from '../src/MarketPanels';

const fx={base:'USD',quote:'KRW',rateDecimal:'1420.1234',observedOn:'2026-10-26',fetchedAtUtc:'2026-10-27T00:00:00Z',sourceName:'Frankfurter',sourceUrl:'https://frankfurter.dev/',method:'blended'};
const treasury={provider:'US Treasury FiscalData',sourceUrl:'https://fiscaldata.treasury.gov/',asOfDebt:'2026-10-26',debtUsd:'38000000000000.00',asOfRates:'2026-09-30',averageRates:[{name:'Treasury Bills',ratePct:'4.15'},{name:'Treasury Notes',ratePct:'3.91'},{name:'Treasury Bonds',ratePct:'3.35'},{name:'Total Marketable',ratePct:'3.96'}],fetchedAtUtc:'2026-10-27T00:00:00Z'};
type Kind='fx'|'treasury';
const cases=[{kind:'fx' as const,id:'fx-reference',button:'기준환율 다시 조회',value:'1,420.1234',error:'환율을 확인하지 못했습니다.'},{kind:'treasury' as const,id:'treasury-stats',button:'미국 재무부 통계 다시 조회',value:'38.00',error:'미국 재무부 통계 조회 실패'}];
async function setup(page:Page){
 await page.clock.setFixedTime(new Date('2026-10-27T02:00:00Z'));
 const mode:Record<Kind,'ok'|'hold'|'fail'>={fx:'ok',treasury:'ok'},count={fx:0,treasury:0};
 const queue:{kind:Kind;route:Route}[]=[];const responses:Record<Kind,any>={fx,treasury};
 for(const kind of ['fx','treasury'] as const)await page.route(`**/functions/v1/${kind==='fx'?'market-fx':'treasury-stats'}`,route=>{
  count[kind]++;
  if(mode[kind]==='hold'){queue.push({kind,route});return;}
  return mode[kind]==='fail'?route.fulfill({status:503,json:{message:'fixture unavailable'}}):route.fulfill({json:responses[kind]});
 });
 return {mode,count,queue,responses,async release(kind:Kind,value:any,status=200){const pending=queue.filter(x=>x.kind===kind);for(const item of pending){queue.splice(queue.indexOf(item),1);await item.route.fulfill({status,json:value});}}};
}
async function ready(page:Page){for(const c of cases)await expect(page.getByTestId(c.id)).toHaveAttribute('data-state','ready');}

test('reference cards keep values, units, observation dates, fetch times and official links',async({page})=>{
 const f=await setup(page);await page.goto('/#indices');await ready(page);
 const card=page.getByTestId('fx-reference');await expect(card.locator('.reference-value')).toHaveText('1 USD = 1,420.1234 KRW');await expect(card.locator('.reference-metadata')).toContainText('2026-10-26');await expect(card.locator('.reference-metadata')).toContainText('2026. 10. 27. 09:00 KST');
 const debt=page.getByTestId('treasury-stats');await expect(debt.locator('.reference-value')).toHaveText('38.00조 달러');await expect(debt).toContainText('총부채 기준일 2026-10-26');await expect(debt).toContainText('기준일 2026-09-30 (월간)');
 for(const rate of treasury.averageRates){await expect(debt.locator('dt').filter({hasText:rate.name})).toHaveCount(1);await expect(debt).toContainText(rate.ratePct+'%');}
 await expect(card).toContainText('실시간 환전가격이 아니며');await expect(debt).toContainText('미국 10년물 국채 시장수익률을 대체하지 않으며');
 for(const [id,url] of [['fx-reference',fx.sourceUrl],['treasury-stats',treasury.sourceUrl]]){const link=page.getByTestId(id).getByRole('link');await expect(link).toHaveAttribute('href',url);await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAccessibleName(/새 탭/);}
 const before={...f.count};expect(before).toEqual({fx:1,treasury:1});await page.getByRole('button',{name:'주요 시장 지표 열기'}).click();await page.keyboard.press('Escape');await expect(page.locator('.market-indices section')).toHaveCount(6);expect(f.count).toEqual(before);
});

for(const c of cases)test(`${c.kind} refresh retains dated data while pending, blocks duplicate clicks, clears failed values and recovers`,async({page})=>{
 const f=await setup(page);await page.goto('/#indices');await ready(page);const card=page.getByTestId(c.id),button=card.getByRole('button',{name:c.button});const before=f.count[c.kind];
 f.mode[c.kind]='hold';await button.evaluate((b:HTMLButtonElement)=>{b.click();b.click();b.click();});
 await expect.poll(()=>f.count[c.kind]).toBe(before+1);await expect(button).toBeDisabled();await expect(card).toHaveAttribute('aria-busy','true');await expect(card.getByRole('status')).toHaveText('이전 조회 자료 · 재조회 중');await expect(card.locator('.reference-value')).toContainText(c.value);await expect(card).toContainText('2026-10-26');await expect(card).toContainText('재조회가 끝날 때까지');
 await f.release(c.kind,{message:'fixture failure'},503);await expect(card.getByRole('alert')).toHaveText(c.error);await expect(card).toHaveAttribute('data-state','error');await expect(card.locator('.reference-value')).toHaveCount(0);await expect(button).toBeEnabled();
 f.mode[c.kind]='ok';f.responses[c.kind]=c.kind==='fx'?{...fx,rateDecimal:'1431.5678',observedOn:'2026-10-27',fetchedAtUtc:'2026-10-27T01:00:00Z'}:{...treasury,debtUsd:'39000000000000.00',asOfDebt:'2026-10-27',fetchedAtUtc:'2026-10-27T01:00:00Z'};
 await button.click();await expect(card).toHaveAttribute('data-state','ready');await expect(card.locator('.reference-value')).toContainText(c.kind==='fx'?'1,431.5678':'39.00');await expect(card.locator('.reference-metadata')).toContainText('2026. 10. 27. 10:00 KST');expect(f.count[c.kind]).toBe(before+2);
});

test('initial loading/failure and unavailable FX never invent a current rate',async({page})=>{
 const f=await setup(page);f.mode.fx=f.mode.treasury='hold';await page.goto('/#indices');
 for(const c of cases){const card=page.getByTestId(c.id);await expect(card).toHaveAttribute('data-state','loading');await expect(card.locator('.reference-value')).toHaveCount(0);await expect(card.getByRole('button',{name:c.button})).toBeDisabled();}
 await expect.poll(()=>f.queue.length).toBeGreaterThanOrEqual(2);await f.release('fx',{message:'fixture'},503);await f.release('treasury',{message:'fixture'},503);
 for(const c of cases)await expect(page.getByTestId(c.id).getByRole('alert')).toHaveText(c.error);
 f.mode.fx='ok';f.responses.fx={...fx,observedOn:'2026-10-01'};await page.getByRole('button',{name:'기준환율 다시 조회'}).click();const card=page.getByTestId('fx-reference');await expect(card).toHaveAttribute('data-state','unavailable');await expect(card.getByRole('status')).toHaveText('미제공');await expect(card).toContainText('관측일 2026-10-01');await expect(card.locator('.reference-value')).toHaveCount(0);await expect(card.getByRole('button')).toBeEnabled();
});

test('late responses from a discarded route cannot replace newer reference data',async({page})=>{
 const f=await setup(page);f.mode.fx=f.mode.treasury='hold';await page.goto('/#indices');await expect.poll(()=>f.queue.length).toBeGreaterThanOrEqual(2);
 const old=[...f.queue];await page.getByRole('link',{name:'종목',exact:true}).click();await expect(page.getByTestId('fx-reference')).toHaveCount(0);
 f.mode.fx=f.mode.treasury='ok';f.responses.fx={...fx,rateDecimal:'1431.5678'};f.responses.treasury={...treasury,debtUsd:'39000000000000.00'};await page.getByRole('link',{name:'지표',exact:true}).click();await ready(page);
 for(const item of old)await item.route.fulfill({json:item.kind==='fx'?fx:treasury});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await expect(page.getByTestId('fx-reference').locator('.reference-value')).toContainText('1,431.5678');await expect(page.getByTestId('treasury-stats').locator('.reference-value')).toContainText('39.00');
});

test('supporting actions stay buttons; calendar, SEC and official news sources stay links',async({page})=>{
 await setup(page);await page.goto('/#indices');const index=page.getByRole('button',{name:'S&P 500 추이 →',exact:true});await expect(index).toHaveAttribute('aria-haspopup','dialog');await index.focus();await index.press('Enter');await expect(page.getByRole('dialog',{name:'S&P 500 추이'})).toBeVisible();await page.keyboard.press('Escape');await expect(index).toBeFocused();
 await page.getByRole('link',{name:'경제 캘린더',exact:true}).click();await page.locator('.calendar-day').first().click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
 await page.getByRole('link',{name:'뉴스',exact:true}).click();for(const link of await page.locator('.source-links a').all()){await expect(link).toHaveAttribute('href',/^https:\/\//);await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAccessibleName(/새 탭/);}
 for(const profile of companyProfiles){await page.goto('/#stock/'+profile.symbol);await openEvidence(page);const expected=profile.sources.find(s=>s.id===profile.profileSourceId)!;await expect(page.getByRole('link',{name:/공식 10-K 원문/})).toHaveAttribute('href',expected.url);for(const link of await page.locator('.company-detail a.source-link:visible').all()){await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAccessibleName(/새 탭/);}}
});

test('a supplied news article keeps its original URL and opens as a source link',()=>{
 // The current demo feed is empty. Render the existing panel with a supplied article.
 const prior=Object.getOwnPropertyDescriptor(globalThis,'location');
 Object.defineProperty(globalThis,'location',{configurable:true,value:{hash:'#news'}});
 try{
  const html=renderToStaticMarkup(createElement(NewsPanel,{view:{mode:'demo',setMode:()=>{},error:'',retry:()=>{},data:{mode:'demo',indicators:[],events:[],news:[{id:'fixture-news',title:'공식 자료 제목',source:'공식 자료 기관',url:'https://official.example.invalid/news/original',publishedAt:'2026-10-27T00:00:00Z',summary:'확인된 자료 요약'}]}}}));
  expect(html).toContain('href="https://official.example.invalid/news/original"');expect(html).toContain('aria-label="공식 자료 제목 (새 탭)"');expect(html).toContain('target="_blank"');expect(html).toContain('ui-link source-link');expect(html).toContain('확인된 자료 요약');
 }finally{if(prior)Object.defineProperty(globalThis,'location',prior);else Reflect.deleteProperty(globalThis,'location');}
});

test('reference cards and supporting controls fit five widths with keyboard, touch and reduced motion',async({page},info)=>{
 test.setTimeout(90000);mkdirSync('work/ux1-b2/captures',{recursive:true});await setup(page);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,1200,768,390,320]){
  await page.setViewportSize({width,height:950});await page.goto('/#indices');await ready(page);
  for(const c of cases){const card=page.getByTestId(c.id),button=card.getByRole('button',{name:c.button});await button.focus();await button.press('Enter');await expect(card).toHaveAttribute('data-state','ready');await expect(button).toHaveCSS('outline-width','3px');
   const boxes=await card.locator('.reference-header > div,button,a').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,height:r.height,width:r.width};}));
   for(const b of boxes){expect(b.height).toBeGreaterThanOrEqual(44);expect(b.width).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width+1);}
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1).toBe(true);}
   if([1440,390].includes(width)){await card.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.evaluate(()=>scrollBy(0,-16));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await card.screenshot({path:`work/ux1-b2/captures/${info.project.name}-${width}-${c.kind}.png`});}
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/#stock/AAPL');await openTrading(page);const panel=page.getByLabel('외부 차트 패널');await panel.getByLabel('외부 차트 제공자').selectOption('네이버');await expect(panel.getByRole('link',{name:/네이버 AAPL/})).toHaveAttribute('href','https://m.stock.naver.com/worldstock/stock/AAPL.O/total');await expect(panel.getByRole('link')).toHaveAccessibleName(/새 탭/);
  if(info.project.name==='mobile')await panel.getByRole('button',{name:'별도 창에서 열기'}).tap({trial:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByRole('button',{name:'별도 창에서 열기'})).toHaveCSS('transition-duration','0s');expect(errors).toEqual([]);
});
