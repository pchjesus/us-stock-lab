import {test,expect} from '@playwright/test';
import {homeMarketIndicators} from '../src/MarketPanels';
import {demoIndicators,kstTime,type Indicator} from '../src/marketInfo';
import {accountKey,decodeAccount,marketPrices} from '../src/accountStore';
import {valuation} from '../src/trading';
import {formatDisplay} from '../src/preferences';
import {instruments,quote} from '../src/data';
import {watchKey} from '../src/storage';

const localDoc=JSON.stringify({version:1,generation:'home-fixture',trades:[
 {id:'home-buy',symbol:'AAPL',side:'buy',quantity:3,price:10000,time:'2026-10-27T14:00:00Z'},
 {id:'home-sell',symbol:'AAPL',side:'sell',quantity:1,price:12000,time:'2026-10-27T14:01:00Z'},
 {id:'home-etf',symbol:'VOO',side:'buy',quantity:2,price:25000,time:'2026-10-27T14:02:00Z'}
]});

test('home projection preserves dated values and rejects unavailable, invalid or relabelled quotes',()=>{
 const projected=homeMarketIndicators(demoIndicators,'demo');expect(projected.map(i=>i.id)).toEqual(['sp500','nasdaq','dow']);
 for(let index=0;index<3;index++)expect(projected[index]).toEqual({...demoIndicators[index],name:['S&P 500','NASDAQ','Dow'][index]});
 expect(homeMarketIndicators(demoIndicators,'official-pending').every(i=>i.value===null&&i.asOf===null&&i.changePct===null&&i.status==='pending')).toBe(true);
 for(const patch of [{value:null},{value:NaN},{asOf:null},{asOf:'invalid'},{status:'pending'}])expect(homeMarketIndicators([{...demoIndicators[0],...patch} as Indicator],'demo')[0].value).toBeNull();
 const historical={...demoIndicators[0],status:'official' as const,asOf:'2020-01-02T00:00:00Z'};expect(homeMarketIndicators([historical],'official-pending')[0]).toEqual(historical);
 const missing=homeMarketIndicators([],'official-pending');expect(missing).toHaveLength(3);expect(missing.every(i=>i.value===null&&i.asOf===null&&i.changePct===null)).toBe(true);
});

test('home reuses all local account values, allocation and portfolio without changing the ledger',async({page})=>{
 await page.addInitScript(({accountKey,localDoc})=>{if(!localStorage.getItem(accountKey))localStorage.setItem(accountKey,localDoc);},{accountKey,localDoc});
 const a=decodeAccount(localDoc).account,v=valuation(a,marketPrices());await page.goto('/#home');const section=page.getByRole('region',{name:'나의 모의투자 현황'});
 await expect(section.getByTestId('total-assets')).toHaveText(formatDisplay(v.total,'USD'));await expect(section).toContainText('로컬 가상계좌');
 const expected=[formatDisplay(a.cash,'USD'),formatDisplay(v.value,'USD'),formatDisplay(v.profit,'USD'),`${formatDisplay(v.unrealized,'USD')} / ${formatDisplay(v.realized,'USD')}`,v.returnPct.toFixed(2)+'%'];
 expect(await section.locator('dd').allTextContents()).toEqual(expected);const before=await page.evaluate(k=>localStorage.getItem(k),accountKey);
 await section.getByRole('button',{name:'세부 분석',exact:true}).click();await expect(page.getByRole('dialog',{name:'자산 구성 분석'})).toContainText('AAPL');await expect(page.getByRole('img',{name:'현금 포함 자산 구성 도넛'})).toBeVisible();await page.keyboard.press('Escape');
 await section.getByRole('link',{name:'포트폴리오 자세히 →'}).click();await expect(page).toHaveURL(/#portfolio$/);expect(await page.locator('.account-summary dd').allTextContents()).toEqual(expected);
 await page.goto('/#settings');await page.getByLabel('기본 표시 통화').selectOption('KRW');await page.goto('/#home');await expect(section.getByTestId('total-assets')).toHaveText(formatDisplay(v.total,'KRW'));await page.reload();await expect(section.getByTestId('cash')).toHaveText(formatDisplay(a.cash,'KRW'));expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe(before);
});

test('home account errors preserve corrupt storage and offer a working retry',async({page})=>{
 await page.goto('/#home');await page.evaluate(k=>localStorage.setItem(k,'corrupt-home-account'),accountKey);await page.reload();const section=page.getByRole('region',{name:'나의 모의투자 현황'});await expect(section.getByRole('alert')).toContainText('원본은 보존');await expect(section.getByTestId('total-assets')).toHaveCount(0);expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe('corrupt-home-account');
 await page.evaluate(k=>localStorage.removeItem(k),accountKey);await section.getByRole('button',{name:'계좌 다시 조회'}).click();await expect(section.getByTestId('total-assets')).toHaveText('$100,000.00');
});

test('home watchlist adds through eight-stock exploration, restores, removes and reaches company/ETF detail',async({page})=>{
 await page.goto('/#home');const list=page.getByRole('region',{name:/관심종목/});await expect(list).toContainText('아직 담은 관심종목이 없어요');await list.getByRole('link',{name:'기업·ETF 둘러보기 →'}).click();await expect(page.locator('.stock')).toHaveCount(8);
 for(const s of ['AAPL','VOO'])await page.getByRole('button',{name:s+' 관심종목',exact:true}).click();await page.getByRole('link',{name:'◫ 홈',exact:true}).click();await expect(list.locator('.stock')).toHaveCount(2);await expect(list).toContainText('실제 현재가가 아닙니다');await page.reload();await expect(list.locator('.stock')).toHaveCount(2);
 for(const symbol of ['AAPL','VOO']){const row=list.locator('.stock').filter({has:page.getByRole('button',{name:symbol+' 관심종목',exact:true})});const stock=instruments.find(s=>s.symbol===symbol)!;await expect(row.locator('.price')).toContainText(formatDisplay(Math.round(quote(stock).price*100),'USD'));await expect(row.getByRole('button')).toHaveAttribute('aria-pressed','true');await row.locator('.identity').click();await expect(page).toHaveURL(new RegExp('#stock/'+symbol+'$'));await expect(page.locator('.stock-detail')).toHaveAttribute('data-kind',symbol==='VOO'?'etf':'company');await page.getByRole('link',{name:'◫ 홈',exact:true}).click();}
 await list.getByRole('button',{name:'AAPL 관심종목',exact:true}).click();await page.reload();await expect(list.locator('.stock')).toHaveCount(1);expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),watchKey)).toEqual(['VOO']);
});

test('three home indices match source values and original dates; full data and pending mode stay reachable',async({page})=>{
 let references=0;await page.route('**/functions/v1/*',r=>{references++;return r.fulfill({status:503,json:{}});});await page.goto('/#home');const section=page.getByRole('region',{name:'미국 시장 한눈에'});await expect(section.locator('.home-index')).toHaveCount(3);
 for(const item of demoIndicators.slice(0,3)){const card=section.locator(`[data-indicator="${item.id}"]`);await expect(card.locator('.home-index-value')).toHaveText(item.value!.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+item.unit);await expect(card).toContainText(Math.abs(item.changePct!).toFixed(2)+'%');await expect(card.locator('time')).toHaveAttribute('datetime',item.asOf!);await expect(card).toContainText(kstTime(item.asOf!));await expect(card).toContainText('합성 예시');}expect(references).toBe(0);
 await section.getByRole('link',{name:'전체 지표·참고환율·재무부 →'}).click();await expect(page).toHaveURL(/#indices$/);await expect(page.locator('.market-indices section')).toHaveCount(6);await expect(page.getByTestId('fx-reference')).toBeVisible();await expect(page.getByTestId('treasury-stats')).toBeVisible();await page.getByRole('button',{name:'S&P 500 추이 →',exact:true}).click();await expect(page.getByRole('dialog',{name:'S&P 500 추이'})).toBeVisible();await page.keyboard.press('Escape');
 await page.getByLabel('시장정보 모드').selectOption('official-pending');await page.getByRole('link',{name:'◫ 홈',exact:true}).click();await expect(section.locator('.home-index')).toHaveCount(3);for(const card of await section.locator('.home-index').all()){await expect(card).toContainText('공식 연동 대기');await expect(card).toContainText('미제공');await expect(card.locator('time')).toHaveCount(0);}await expect(section).not.toContainText('5,840');await expect(section).not.toContainText('2026. 10. 23.');
});

test('home learning/news/calendar links preserve the important-event banner and dismissal',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T01:00:00Z'));await page.goto('/#home');const section=page.getByRole('region',{name:'배우고, 시장을 살펴보세요'});const banner=section.locator('.event-banner');await expect(banner).toContainText('최중요 이벤트');await expect(banner).toContainText('실제 발표일·결과가 아닙니다');await banner.getByRole('link').click();await expect(page).toHaveURL(/#calendar$/);await expect(page.locator('.calendar-grid')).toBeVisible();await page.getByRole('link',{name:'◫ 홈',exact:true}).click();await banner.getByRole('button',{name:'이벤트 배너 닫기'}).click();await expect(banner).toHaveCount(0);
 for(const [href,title] of [['#learn','나에게 맞는 학습을 선택하세요'],['#news','경제·금융 뉴스'],['#calendar','경제 캘린더'],['#indices','시장']]){await section.locator(`a.home-explore-link[href="${href}"]`).click();await expect(page).toHaveURL(new RegExp(href+'$'));await expect(page.getByRole('heading',{level:1,name:title,exact:true})).toBeVisible();await page.getByRole('link',{name:'◫ 홈',exact:true}).click();}
});

test('home first spotlight remains on the account summary and all seven Tour steps preserve state',async({page})=>{
 await page.goto('/#home');await expect(page.getByTestId('cash')).toBeVisible();const before=await page.evaluate(k=>localStorage.getItem(k),accountKey),trigger=page.getByRole('button',{name:'사용 방법',exact:true});await trigger.click();
 const selectors=['.home-account .account-summary','.toolbar','.chart','.detail-order','.account-summary','.calendar-grid','.lesson-stage-filters'];for(let step=1;step<=7;step++){await expect(page.getByRole('dialog',{name:`사용 방법 ${step}/7`})).toBeVisible();await expect(page.locator('.spotlight')).toBeVisible();const [target,ring]=await Promise.all([page.locator(selectors[step-1]).first().boundingBox(),page.locator('.spotlight').boundingBox()]);await expect.poll(async()=>{const a=await page.locator(selectors[step-1]).first().boundingBox(),b=await page.locator('.spotlight').boundingBox();return a&&b?Math.abs(a.y-b.y)+Math.abs(a.width-b.width):Infinity;}).toBeLessThan(2);expect(target).not.toBeNull();expect(ring).not.toBeNull();await page.getByRole('button',{name:step===7?'종료':'다음',exact:true}).click();}
 await expect(page).toHaveURL(/#home$/);await expect(trigger).toBeFocused();expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe(before);
});

test('home sections and controls fit five widths with keyboard/touch and no side effects',async({page},info)=>{
 const errors:string[]=[],rpcs:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/rest\/v1\/rpc\//.test(r.url()))rpcs.push(r.url());});await page.addInitScript(({watchKey,symbols,localDoc,accountKey})=>{localStorage.setItem(watchKey,JSON.stringify(symbols));localStorage.setItem(accountKey,localDoc);},{watchKey,symbols:instruments.map(s=>s.symbol),localDoc,accountKey});
 for(const width of [1440,1200,768,390,320]){await page.setViewportSize({width,height:1000});await page.goto('/#home');await expect(page.getByTestId('cash')).toBeVisible();await expect(page.locator('.home-watchlist .stock')).toHaveCount(8);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const sections=await page.locator('.home-dashboard>.home-section').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));expect(sections).toEqual([...sections].sort((a,b)=>a-b));
  const boxes=await page.locator('.home-dashboard a,.home-dashboard button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,height:r.height,width:r.width};}).filter(r=>r.width&&r.height));for(const box of boxes){expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width+1);}for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1).toBe(true);}
  const link=page.getByRole('link',{name:'포트폴리오 자세히 →'});await link.focus();await expect(link).toHaveCSS('outline-width','3px');if(info.project.name==='mobile')await link.tap();else await link.press('Enter');await expect(page).toHaveURL(/#portfolio$/);
 }await page.goto('/#home');await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.home-explore-link').first()).toHaveCSS('transition-duration','0s');expect(errors).toEqual([]);expect(rpcs).toEqual([]);
});
