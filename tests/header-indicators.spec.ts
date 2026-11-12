import {test,expect} from '@playwright/test';
import {headerIndicators} from '../src/HeaderIndicators';
import {demoIndicators} from '../src/marketInfo';

test('display normalization keeps six items and suppresses synthetic values in pending mode',()=>{
 expect(headerIndicators(demoIndicators,'demo').map(x=>x.id)).toEqual(['sp500','nasdaq','dow','usdkrw','kospi','kosdaq']);
 expect(headerIndicators(demoIndicators,'official-pending').every(x=>x.status==='pending'&&x.value===null&&x.changePct===null&&x.asOf===null)).toBe(true);
 const missing=headerIndicators([],'demo');expect(missing.every(x=>x.value===null)).toBe(true);
 const official=headerIndicators([{...demoIndicators[0],status:'official',changePct:null}, {...demoIndicators[1],value:null}],'demo');
 expect(official[0].status).toBe('official');expect(official[0].changePct).toBeNull();expect(official[1].changePct).toBeNull();
});

test('five-second rotation wraps all six items while the one-second clock continues',async({page})=>{
 await page.clock.install({time:new Date('2026-11-03T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));await page.goto('/#home');
 const current=page.getByTestId('ticker-current');await expect(current).toContainText('S&P 500');
 const time=await page.locator('.live-times').textContent();
 await page.clock.runFor(4999);await expect(current).toContainText('S&P 500');
 await page.clock.runFor(1);await expect(current).toContainText('NASDAQ');
 expect(await page.locator('.live-times').textContent()).not.toBe(time);
 expect(await current.evaluate(e=>getComputedStyle(e).animationName)).toBe('ticker-in');
 const motion=await current.evaluate(e=>e.getAnimations()[0]?.effect?.getKeyframes().map(f=>f.transform));
 expect(motion).toEqual(['translateY(-100%)','translateY(0px)']);
 for(const name of ['Dow Jones','USD/KRW','KOSPI','KOSDAQ','S&P 500']){await page.clock.runFor(5000);await expect(current).toContainText(name);}
});

test('pause clears the five-second timer and resume leaves exactly one timer',async({page})=>{
 await page.addInitScript(()=>{
  const active=new Set<number>();const original=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
  window.setInterval=((handler:TimerHandler,delay?:number,...args:unknown[])=>{const id=original(handler,delay,...args);if(delay===5000)active.add(id);return id;}) as typeof window.setInterval;
  window.clearInterval=(id?:number)=>{if(id!==undefined)active.delete(id);clear(id);};
  Object.defineProperty(window,'tickerTimers',{get:()=>active.size});
 });
 await page.goto('/#home');const button=page.getByRole('button',{name:'주요 시장 지표 열기'});
 await expect.poll(()=>page.evaluate(()=>(window as any).tickerTimers)).toBe(1);
 await button.hover();await expect.poll(()=>page.evaluate(()=>(window as any).tickerTimers)).toBe(0);
 await page.mouse.move(0,0);await expect.poll(()=>page.evaluate(()=>(window as any).tickerTimers)).toBe(1);
 await page.goto('/#market');await expect.poll(()=>page.evaluate(()=>(window as any).tickerTimers)).toBe(1);
});

test('hover, focus and modal pause rotation; ESC restores focus and scrolling',async({page})=>{
 await page.clock.install({time:new Date('2026-11-03T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));await page.goto('/#home');
 const button=page.getByRole('button',{name:'주요 시장 지표 열기'}),current=page.getByTestId('ticker-current');
 await button.hover();await page.clock.runFor(6000);await expect(current).toContainText('S&P 500');
 await page.mouse.move(0,0);await button.focus();await page.clock.runFor(6000);await expect(current).toContainText('S&P 500');
 await button.click();const dialog=page.getByRole('dialog',{name:'주요 시장 지표'});await expect(dialog.locator('article')).toHaveCount(6);
 await page.clock.runFor(10000);await expect(current).toContainText('S&P 500');
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(button).toBeFocused();
 expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
 await page.getByRole('link',{name:'계정 설정',exact:true}).focus();await page.mouse.move(0,0);await page.clock.runFor(5000);await expect(current).toContainText('NASDAQ');
});

test('popup navigation uses the existing indices screen and pending mode removes mock quotes',async({page})=>{
 await page.goto('/#market');await page.getByRole('button',{name:'주요 시장 지표 열기'}).click();
 await page.getByRole('link',{name:'S&P 500 지표 화면 →',exact:true}).click();await expect(page).toHaveURL(/#indices$/);
 await expect(page.getByRole('dialog',{name:'주요 시장 지표'})).toHaveCount(0);
 await page.getByLabel('시장정보 모드').selectOption('official-pending');
 const current=page.getByTestId('ticker-current');await expect(current).toContainText('연동 준비 중');await expect(current).toContainText('미제공');await expect(current).not.toContainText('5,840');await expect(current).not.toContainText('합성 예시');
});

test('reduced motion disables sliding while content still changes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install({time:new Date('2026-11-02T23:59:00Z')});await page.clock.pauseAt(new Date('2026-11-03T00:00:00Z'));await page.goto('/#home');
 await page.clock.runFor(5000);await expect(page.getByTestId('ticker-current')).toContainText('NASDAQ');
 expect(await page.getByTestId('ticker-current').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
});

test('header controls and modal fit desktop, tablet and mobile widths',async({page})=>{
 for(const width of [1440,1200,768,390,320]){
  await page.setViewportSize({width,height:950});await page.goto('/#home');
  const ticker=page.getByRole('button',{name:'주요 시장 지표 열기'});await expect(ticker).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const boxes=await page.locator('header > .header-ticker,header > .clock,header > .header-actions').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1).toBe(true);}
  await ticker.click();await expect(page.getByRole('dialog',{name:'주요 시장 지표'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'닫기',exact:true}).click();
 }
});
