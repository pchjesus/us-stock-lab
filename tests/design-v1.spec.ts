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
   if(width<=900){await expect(page.locator('.v1-mobile-nav')).toBeVisible();await expect(page.locator('.v1-sidebar')).toBeHidden();}
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
 const paths=['home','market','stock/AAPL','portfolio','portfolio/analysis','backtest','learn','learn/lessons','learn/lessons/etf','learn/lab','experience','calendar','news','settings'];
 const width=testInfo.project.name==='mobile'?390:1440;
 await page.setViewportSize({width,height:960});
 for(const route of paths){
  await page.goto('/?ui=v1#'+route);
  await expect(page.locator('main')).toBeVisible();
  await page.screenshot({path:'work/ui-v1/captures/'+testInfo.project.name+'-'+width+'-'+route.replaceAll('/','-')+'.png',fullPage:true,animations:'disabled'});
 }
});


test('index and clock form one aligned market strip with explicit regular-session hours',async({page})=>{
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  await page.goto('/?ui=v1#home');
  const strip=page.locator('header .v1-market-info');
  const ticker=strip.getByRole('button',{name:'주요 시장 지표 열기'});
  const clock=strip.locator('.clock');
  await expect(strip).toBeVisible();
  await expect(ticker).toBeVisible();
  await expect(clock).toBeVisible();
  await expect(clock.locator('.live-times time')).toHaveCount(2);
  await expect(clock.locator('.v1-market-hours')).toContainText('09:30–16:00 ET');
  await expect(clock.locator('.v1-market-hours')).toContainText('조기마감');
  const rect=await strip.boundingBox();
  const ti=await ticker.boundingBox(),cl=await clock.boundingBox();
  expect(rect).not.toBeNull();expect(ti).not.toBeNull();expect(cl).not.toBeNull();
  expect(ti!.x).toBeGreaterThanOrEqual(rect!.x-1);
  expect(cl!.x).toBeGreaterThanOrEqual(rect!.x-1);
  expect(ti!.x+ti!.width).toBeLessThanOrEqual(rect!.x+rect!.width+1);
  expect(cl!.x+cl!.width).toBeLessThanOrEqual(rect!.x+rect!.width+1);
  await ticker.click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:/닫기/}).click();
 }
 await page.goto('/#home');
 await expect(page.locator('header .v1-market-hours')).toHaveCount(0);
});

test('market and detail v1 visually reorganize existing eight synthetic instruments',async({page})=>{
 await page.goto('/?ui=v1#market');
 const list=page.getByRole('region',{name:'모의투자 지원 종목'});
 await expect(list.locator('.v1-discovery-intro')).toBeVisible();
 await expect(list.locator('.discovery-stock')).toHaveCount(8);
 if((page.viewportSize()?.width??1440)>790)await expect(list.locator('.v1-market-result-head')).toBeVisible();
 else await expect(list.locator('.v1-market-result-head')).toBeHidden();
 await list.getByRole('button',{name:'ETF',exact:true}).click();
 await expect(list.locator('.discovery-stock')).toHaveCount(3);
 await list.getByRole('button',{name:'전체',exact:true}).click();
 await list.locator('.discovery-stock[data-symbol="AAPL"] a.identity').click();
 await expect(page).toHaveURL(/#stock\/AAPL$/);
 const detail=page.getByRole('article',{name:'기업 상세 화면'});
 await expect(detail.locator('.v1-detail-price')).toContainText('실제 시세 아님');
 await expect(detail.getByRole('tab',{name:'개요'})).toHaveAttribute('aria-selected','true');
 await detail.getByRole('tab',{name:'재무'}).click();
 await expect(detail.getByRole('tab',{name:'재무'})).toHaveAttribute('aria-selected','true');
 await detail.getByRole('tab',{name:'개요'}).click();
 await expect(detail.getByRole('tab',{name:'개요'})).toHaveAttribute('aria-selected','true');
});

test('portfolio v1 groups unaltered account summary, holdings, trade history and analysis link',async({page})=>{
 await page.addInitScript(doc=>localStorage.setItem('us-stock-lab.account.v1',doc),demo);
 await page.goto('/?ui=v1#portfolio');
 const before=await page.evaluate(key=>localStorage.getItem(key),accountKey);
 const area=page.locator('.v1-portfolio-page');
 await expect(area).toBeVisible();
 await expect(area.locator('.account-summary')).toBeVisible();
 await expect(area.locator('.v1-portfolio-holdings')).toBeVisible();
 await expect(area.locator('.v1-portfolio-analysis-entry a[href="#portfolio/analysis"]')).toBeVisible();
 await expect(area.locator('.v1-portfolio-history')).toBeVisible();
 const original=decodeAccount(demo).account;
 await expect(page.getByTestId('total-assets').first()).toHaveText(formatDisplay(valuation(original,marketPrices()).total,'USD'));
 expect(await page.evaluate(key=>localStorage.getItem(key),accountKey)).toBe(before);
});


test('analysis v1 preserves computed portfolio metrics while reorganizing summaries and charts',async({page})=>{
 await page.addInitScript(doc=>localStorage.setItem('us-stock-lab.account.v1',doc),demo);
 await page.goto('/?ui=v1#portfolio/analysis');
 const app=page.locator('.v1-analysis-shell');
 await expect(app).toBeVisible();
 await expect(app.locator('.pa-summary>div')).toHaveCount(6);
 await expect(app.locator('.pa-grid')).toBeVisible();
 await expect(app.locator('.pa-metrics dt')).toContainText(['가장 큰 종목 비중','상위 3종목 비중','종목 HHI']);
 await expect(app).toContainText('실제 시장 성과가 아닙니다');
 const first=await app.locator('.pa-summary strong').first().textContent();
 const original=decodeAccount(demo).account;
 expect(first).toBe(formatDisplay(valuation(original,marketPrices()).total,'USD'));
 await page.goto('/#portfolio/analysis');
 await expect(page.locator('.v1-analysis-shell')).toHaveCount(0);
});
test('backtest v1 separates scenario forms from results without changing calculated TWR or account',async({page})=>{
 const before='{"version":1,"generation":"bt-v1-demo","trades":[]}';
 await page.addInitScript(doc=>localStorage.setItem('us-stock-lab.account.v1',doc),before);
 await page.goto('/?ui=v1#backtest');
 const app=page.locator('.v1-bt-lab');
 await expect(app).toBeVisible();
 await expect(app.locator('.bt-case')).toHaveCount(2);
 await expect(app.locator('.bt-form')).toHaveCount(2);
 await app.getByRole('button',{name:'설정 A 계산'}).click();
 await expect(app).toContainText('기간 수익률 (TWR)');
 await expect(app).toContainText('최대 낙폭 (MDD)');
 await app.getByRole('button',{name:'설정 B 계산'}).click();
 await expect(app.getByRole('region',{name:'A/B 수익률 비교'})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(before);
 await page.goto('/#backtest');
 await expect(page.locator('.v1-bt-lab')).toHaveCount(0);
});


test('PER PBR ROE are inside company overview and disappear from financial, trade and evidence tabs',async({page})=>{
 await page.goto('/?ui=v1#stock/AAPL');
 const root=page.getByRole('article',{name:'기업 상세 화면'});
 const overview=root.getByRole('tabpanel',{name:'개요'});
 const comparison=overview.locator('.v1-valuation');
 await expect(comparison).toBeVisible();
 await expect(comparison.getByTestId('valuation-per')).toBeVisible();
 await expect(comparison.getByTestId('valuation-pbr')).toBeVisible();
 await expect(comparison.getByTestId('valuation-roe')).toBeVisible();
 await expect(root.locator('.v1-detail-price .v1-valuation')).toHaveCount(0);
 expect(await comparison.evaluate(node=>node.closest('[role=tabpanel]')?.id)).toBe('stock-AAPL-panel-overview');
 const business=root.locator('#company-overview');
 const businessBox=await business.boundingBox(),comparisonBox=await comparison.boundingBox();
 expect(businessBox).not.toBeNull();expect(comparisonBox).not.toBeNull();
 expect(comparisonBox!.y).toBeGreaterThan(businessBox!.y);
 await root.getByRole('tab',{name:'재무'}).click();
 await expect(comparison).toBeHidden();
 await root.getByRole('tab',{name:'근거'}).click();
 await expect(comparison).toBeHidden();
 await root.getByRole('tab',{name:'차트·거래'}).click();
 await expect(comparison).toBeHidden();
 await root.getByRole('tab',{name:'개요'}).click();
 await expect(comparison).toBeVisible();
 await page.goto('/#stock/AAPL');
 await expect(page.locator('.v1-valuation')).toHaveCount(0);
 await page.goto('/?ui=v1#stock/VOO');
 await expect(page.locator('.v1-valuation')).toHaveCount(0);
});
test('v1 learning path, quiz progress and practice keep existing behavior across new layout',async({page})=>{
 await page.goto('/?ui=v1#learn');
 const root=page.locator('.v1-learning-page');
 await expect(root).toBeVisible();
 await expect(root.locator('.learning-choice')).toHaveCount(2);
 await expect(root.locator('.learning-path')).toBeVisible();
 await expect(root.getByRole('region',{name:'학습 현황'})).toBeVisible();
 await root.locator('a[href="#learn/lessons"]').first().click();
 await expect(page).toHaveURL(/#learn\/lessons$/);
 await expect(page.locator('.v1-learning-page .lesson-card')).toHaveCount(0);
 await expect(page.locator('.v1-course-active')).toHaveCount(1);
 await expect(page.locator('.v1-course-list a')).toHaveCount(10);
 const course=page.locator('.v1-course-reader');
 await expect(course).toContainText('주식이 뭐야?');
 await course.getByRole('tab',{name:/퀴즈/}).click();
 await expect(course.locator('.v1-reader-question')).toHaveCount(2);
 await course.getByRole('button',{name:'이 수업 학습 완료로 표시'}).click();
 await page.goto('/?ui=v1#learn');
 await expect(page.getByRole('region',{name:'학습 현황'})).toContainText('1/10');
 await expect(page.locator('.v1-learning-page .learning-practice-hub')).toBeVisible();
});
test('v1 experience layout, calendar/news and settings retain existing actions and information boundaries',async({page})=>{
 const existing=JSON.stringify({version:1,generation:'stage4-preserve',trades:[]});
 await page.addInitScript(doc=>localStorage.setItem('us-stock-lab.account.v1',doc),existing);
 await page.goto('/?ui=v1#experience');
 const exp=page.locator('.v1-experience-lab');
 await expect(exp.getByTestId('experience-cash')).toHaveText('$100,000.00');
 await exp.getByRole('button',{name:'예시 매수'}).click();
 await expect(exp.getByTestId('experience-cash')).toHaveText('$99,900.00');
 await exp.getByRole('tab',{name:'2. 포트폴리오 분석'}).click();
 await expect(exp.getByRole('tabpanel',{name:'2. 포트폴리오 분석'})).toBeVisible();
 await exp.getByRole('tab',{name:'1. 가상 매매'}).click();
 await expect(exp.getByTestId('experience-cash')).toHaveText('$99,900.00');
 await page.goto('/?ui=v1#calendar');
 const calendar=page.locator('.v1-calendar-page');
 await expect(calendar).toBeVisible();
 await expect(calendar).toContainText('교육용 가상 예시');
 await expect(calendar.locator('.calendar-grid')).toBeVisible();
 await calendar.getByText('전체 일정 목록').click();
 await expect(calendar.locator('.event-list article')).toHaveCount(8);
 await page.goto('/?ui=v1#news');
 const news=page.locator('.v1-news-page');
 await expect(news).toBeVisible();
 await expect(news).toContainText('수신된 뉴스가 없습니다');
 await expect(news.locator('.source-links a')).toHaveCount(5);
 await page.goto('/?ui=v1#settings');
 const settings=page.locator('.v1-settings-page');
 await expect(settings).toBeVisible();
 await expect(settings.getByRole('heading',{name:'화면 설정'})).toBeVisible();
 await expect(settings.getByLabel('기본 표시 통화')).toBeVisible();
 await expect(settings.getByRole('heading',{name:'데이터 안내'})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(existing);
});
test('new learning, experience and support sections have no page overflow on mobile or desktop',async({page})=>{
 const routes=['learn','learn/lessons','experience','calendar','news','settings'];
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:860});
  for(const route of routes){
   await page.goto('/?ui=v1#'+route);
   await expect(page.locator('main')).toBeVisible();
   const overflow=await page.evaluate(()=>({excess:document.documentElement.scrollWidth-innerWidth,body:document.body.scrollWidth-innerWidth}));
   expect(overflow.excess,'root overflow at '+width+': '+route).toBeLessThanOrEqual(0);
   expect(overflow.body,'body overflow at '+width+': '+route).toBeLessThanOrEqual(0);
  }
 }
});


test('Atlas v1 chapter reader displays one lesson and preserves source content across focused stage tabs',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?ui=v1#learn/lessons');
 const course=page.locator('.v1-course-workspace');
 await expect(course).toBeVisible();
 await expect(page.locator('.lesson-card')).toHaveCount(0);
 await expect(course.locator('.v1-course-active')).toHaveCount(1);
 await expect(course.locator('.v1-course-reader-heading')).toContainText('주식이 뭐야?');
 const nav=course.locator('.v1-course-list');
 await expect(nav.locator('a')).toHaveCount(10);
 const unit=course.locator('.v1-unit-reader');
 await expect(unit.getByRole('tab')).toHaveCount(4);
 await expect(unit.getByRole('tab',{name:/개념/})).toHaveAttribute('aria-selected','true');
 await expect(unit).toContainText('주식 한 주는 기업의 소유 지분');
 await unit.getByRole('tab',{name:/사례/}).click();
 await expect(unit).toContainText('한 주를 $100에 사서 $120에 판다면');
 await expect(unit.locator('.v1-reader-questions')).toHaveCount(0);
 await unit.getByRole('tab',{name:/실습/}).click();
 await expect(unit.getByRole('region',{name:'학습 연계 실습 미션'})).toBeVisible();
 await expect(unit.getByRole('link',{name:/애플 기업 정보 살펴보기/})).toHaveAttribute('href','#stock/AAPL');
 await unit.getByRole('tab',{name:/퀴즈/}).click();
 await expect(unit.locator('.v1-reader-question')).toHaveCount(2);
 await unit.locator('.v1-reader-question').first().getByRole('radio').first().check();
 await expect(unit.locator('.v1-reader-feedback').first()).toContainText('맞았어요.');
 await unit.getByRole('button',{name:'이 수업 학습 완료로 표시'}).click();
 await expect(unit.getByRole('button',{name:'완료 표시 취소'})).toHaveAttribute('aria-pressed','true');
 await course.getByRole('link',{name:/다음 수업.*ETF가 뭐야/}).click();
 await expect(page).toHaveURL(/#learn\/lessons\/etf$/);
 await expect(course.locator('.v1-course-active')).toHaveCount(1);
 await expect(course.locator('.v1-course-reader-heading')).toContainText('ETF가 뭐야?');
 await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute('href','#learn/lessons/etf');
 await page.goto('/?ui=v1#learn/lessons/stock');
 await unit.getByRole('tab',{name:/퀴즈/}).click();
 await expect(unit.locator('.v1-reader-question').first().getByRole('radio').first()).toBeChecked();
 await expect(unit.getByRole('button',{name:'완료 표시 취소'})).toHaveAttribute('aria-pressed','true');
 expect(errors).toEqual([]);
});

test('Atlas course mobile chooses a lesson from one picker, not long expanding cards',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('/?ui=v1#learn/lessons');
  const course=page.locator('.v1-course-workspace');
  await expect(course.locator('.v1-course-reader')).toBeVisible();
  await expect(course.locator('.v1-course-active')).toHaveCount(1);
  await expect(page.locator('.lesson-card')).toHaveCount(0);
  if(width<=850){
   const picker=course.getByLabel('읽을 수업 선택');
   await expect(picker).toBeVisible();
   await expect(course.getByRole('navigation',{name:'레슨 선택'})).toBeHidden();
   await expect(picker.locator('option')).toHaveCount(10);
   await picker.selectOption('diversification');
   await expect(page).toHaveURL(/#learn\/lessons\/diversification$/);
   await expect(course.locator('.v1-course-reader-heading')).toContainText('분산투자가 왜 필요해?');
  }else{
   await expect(course.getByRole('navigation',{name:'레슨 선택'}).getByRole('link')).toHaveCount(10);
   await expect(course.getByLabel('읽을 수업 선택')).toBeHidden();
  }
  const tabs=course.locator('.v1-unit-reader').getByRole('tab');
  await tabs.first().focus();await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');
  await expect(tabs.nth(1)).toBeFocused();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow,'course overflow at '+width).toBeLessThanOrEqual(0);
 }
 expect(errors).toEqual([]);
});
test('Settings is an explicit sidebar navigation item and a visible header action on mobile',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/?ui=v1#home');
 const sidebar=page.locator('.v1-sidebar');
 const settings=sidebar.getByRole('navigation',{name:'계정 및 설정'}).getByRole('link',{name:'설정'});
 await expect(settings).toBeVisible();
 await expect(settings).toHaveAttribute('href','#settings');
 await settings.click();
 await expect(page).toHaveURL(/#settings$/);
 await expect(settings).toHaveAttribute('aria-current','page');
 await page.getByRole('button',{name:'메뉴 접기'}).click();
 await expect(sidebar.locator('.v1-desktop-settings a[href="#settings"]')).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await expect(sidebar).toBeHidden();
 const mobileSettings=page.locator('header .header-actions').getByRole('link',{name:'설정'});
 await expect(mobileSettings).toBeVisible();
 await page.goto('/?ui=v1#home');await mobileSettings.click();
 await expect(page).toHaveURL(/#settings$/);
 await expect(page.getByRole('heading',{name:'화면 설정'})).toBeVisible();
});
test('course reduced-motion removes animation without hiding focused content',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?ui=v1#learn/lessons/stock');
 const active=page.locator('.v1-course-active');
 await expect(active).toBeVisible();
 expect(await active.evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 await page.locator('.v1-unit-reader').getByRole('tab',{name:/퀴즈/}).click();
 const content=page.locator('.v1-reader-content');
 expect(await content.evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 await expect(content.locator('.v1-reader-question')).toHaveCount(2);
});


test('Chart learning lab uses the Atlas v1 instrument panel while preserving synthetic indicators and local account',async({page})=>{
 const original=JSON.stringify({version:1,generation:'atlas-chart-unchanged',trades:[]});
 await page.addInitScript(doc=>localStorage.setItem('us-stock-lab.account.v1',doc),original);
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:920});
  await page.goto('/?ui=v1#learn/lab');
  const lab=page.locator('.v1-chart-lab');
  await expect(lab).toBeVisible();
  await expect(lab.getByRole('heading',{name:'차트 실습실'})).toBeVisible();
  await expect(lab.getByRole('img',{name:/학습용 가상 (캔들|선) 차트/})).toBeVisible();
  await expect(lab.getByLabel('학습 종목')).toHaveValue('AAPL');
  await expect(lab).toContainText('실제 주가 아님');
  await lab.getByRole('button',{name:'중급'}).click();
  const sma=lab.getByRole('button',{name:'5봉 이동평균'});
  if(await sma.getAttribute('aria-pressed')!=='true')await sma.click();
  await expect(lab.getByTestId('sma-5')).toBeVisible();
  await lab.getByRole('button',{name:'고급'}).click();
  const rsi=lab.getByRole('button',{name:'RSI(14)'});
  if(await rsi.getAttribute('aria-pressed')!=='true')await rsi.click();
  await expect(lab.getByTestId('rsi-value')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);
 }
 expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(original);
 await page.goto('/#learn/lab');
 await expect(page.locator('.v1-chart-lab')).toHaveCount(0);
});


test('collapsed main rail never compresses nested lesson navigation text, links or index width',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1024,1160,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('/?ui=v1#learn/lessons');
  const root=page.locator('.v1-course-workspace');
  const index=root.locator('aside.v1-course-index');
  const links=index.getByRole('navigation',{name:'레슨 선택'}).getByRole('link');
  await expect(links).toHaveCount(10);
  const filterBounds=await index.locator('.v1-course-filters').evaluate(el=>{
   const parent=el.getBoundingClientRect();
   const buttons=Array.from(el.querySelectorAll('button')).map(item=>{
    const r=item.getBoundingClientRect();return {right:r.right,height:r.height};
   });
   return {parentRight:parent.right,parentOverflow:el.scrollWidth-el.clientWidth,buttons};
  });
  expect(filterBounds.buttons).toHaveLength(6);
  for(const btn of filterBounds.buttons){
   expect(btn.right,'All stage filters should fit the panel, not be clipped').toBeLessThanOrEqual(filterBounds.parentRight+2);
   expect(btn.height).toBeGreaterThanOrEqual(44);
  }
  expect(filterBounds.parentOverflow).toBeLessThanOrEqual(1);
  const layout=async()=>{
   return index.evaluate(el=>{
    const nav=el.querySelector('nav.v1-course-list')!;
    const a=nav.querySelector('a.v1-course-link')!;
    const title=a.querySelector<HTMLElement>('.v1-course-link-text')!;
    const titleText=title.querySelector<HTMLElement>('strong')!;
    const box=(node:Element)=>{const b=node.getBoundingClientRect();return {width:b.width,height:b.height,left:b.left,right:b.right,top:b.top,bottom:b.bottom};};
    return {index:box(el),nav:box(nav),item:box(a),title:box(title),text:box(titleText),
      titleFont:parseFloat(getComputedStyle(titleText).fontSize),display:getComputedStyle(a).display,
      titleOverflow:getComputedStyle(titleText).overflowWrap,navScroll:nav.scrollWidth-nav.clientWidth,
      hidden:getComputedStyle(nav).display==='none'};
   });
  };
  for(const collapsed of [false,true,false]){
   const railToggle=page.locator('.v1-sidebar .v1-collapse-button');
   if(collapsed)await railToggle.click();
   else if((await page.locator('.app').getAttribute('class'))?.includes('collapsed'))await railToggle.click();
   await expect(page.locator('.app')).toHaveClass(collapsed?/collapsed/:/ui-v1/);
   await expect(links.first()).toBeVisible();
   const x=await layout();
   expect(x.hidden,'Lesson chapter list must remain visible, even with app sidebar collapsed').toBe(false);
   expect(x.index.width,'Learning index must not inherit app collapsed rail width at '+width).toBeGreaterThanOrEqual(190);
   expect(x.item.width,'Chapter links must not be fixed to collapsed 48px width at '+width).toBeGreaterThan(160);
   expect(x.item.height,'Chapter item should not become vertically towering at '+width).toBeLessThan(108);
   expect(x.title.width,'Title needs at least readable two-line width at '+width).toBeGreaterThan(85);
   expect(x.text.height,'Title cannot wrap into one character per row at '+width).toBeLessThan(67);
   expect(x.titleFont,'Chapter titles should not be tiny').toBeGreaterThanOrEqual(14);
   expect(x.navScroll,'Chapter list must not horizontally overflow').toBeLessThanOrEqual(1);
   expect(x.display).toBe('grid');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);
   if(collapsed&&width===1440&&testInfo.project.name==='desktop'){
    mkdirSync('work/ui-v1/captures',{recursive:true});
    await page.screenshot({path:'work/ui-v1/captures/stage6-1440-collapsed-lesson-index.png',fullPage:true,animations:'disabled'});
   }
  }
  await links.last().click();
  await expect(page).toHaveURL(/#learn\/lessons\/news$/);
  await expect(root.locator('.v1-course-active')).toHaveCount(1);
  await expect(root.locator('.v1-course-reader-heading')).toContainText('뉴스는 어떻게 읽어야 해?');
 }
 expect(errors).toEqual([]);
});

test('learning reading type is 16px-class across concepts, examples, practice, quizzes and mobile',async({page})=>{
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  await page.goto('/?ui=v1#learn/lessons/stock');
  const reader=page.locator('.v1-course-reader');
  const intro=reader.locator('.v1-course-summary');
  await expect(intro).toBeVisible();
  await reader.getByRole('tab',{name:/개념/}).click();
  await expect(reader.locator('.v1-reader-essentials p')).toHaveCount(2);
  const font=async(sel:string)=>reader.locator(sel).first().evaluate(el=>({size:parseFloat(getComputedStyle(el).fontSize),height:parseFloat(getComputedStyle(el).lineHeight)}));
  expect((await font('.v1-course-summary')).size,'summary font '+width).toBeGreaterThanOrEqual(16);
  expect((await font('.v1-reader-intro p')).size,'concept paragraph '+width).toBeGreaterThanOrEqual(16);
  expect((await font('.v1-reader-essentials p')).size,'why/how paragraphs '+width).toBeGreaterThanOrEqual(16);
  expect((await font('.v1-reader-note p')).size,'misunderstanding paragraph '+width).toBeGreaterThanOrEqual(16);
  await reader.getByRole('tab',{name:/사례/}).click();
  expect((await font('.v1-reader-intro p')).size,'example paragraph '+width).toBeGreaterThanOrEqual(16);
  await reader.getByRole('tab',{name:/실습/}).click();
  expect((await font('.v1-reader-intro p')).size,'practice paragraph '+width).toBeGreaterThanOrEqual(16);
  await reader.getByRole('tab',{name:/퀴즈/}).click();
  expect((await font('.v1-reader-question legend')).size,'quiz question '+width).toBeGreaterThanOrEqual(16);
  expect((await font('.v1-reader-options label')).size,'quiz answer '+width).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'horizontal scroll '+width).toBeLessThanOrEqual(0);
 }
});
test('v1 global finishing maintains all core routes and their first meaningful content without new backend writes',async({page})=>{
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const original=JSON.stringify({version:1,generation:'ui-v1-finish-safety',trades:[]});
 await page.addInitScript(data=>localStorage.setItem('us-stock-lab.account.v1',data),original);
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of ['home','market','stock/AAPL','portfolio','portfolio/analysis','backtest','learn','learn/lessons','learn/lab','experience','calendar','news','settings']){
   await page.goto('/?ui=v1#'+route);
   await expect(page.locator('main')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),
     'horizontal document scroll at '+width+' '+route).toBeLessThanOrEqual(0);
   if(route==='learn/lessons')await expect(page.locator('.v1-course-active')).toHaveCount(1);
   if(route==='stock/AAPL')await expect(page.locator('.v1-valuation')).toHaveCount(1);
  }
 }
 expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(original);
 expect(errors).toEqual([]);
});
