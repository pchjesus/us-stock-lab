import {test,expect} from '@playwright/test';
import {calendar,marketState,serverMarketState} from '../src/marketHours';
import {executeOrder,accountKey} from '../src/accountStore';
test('regular/early boundaries, holidays, DST, KST and unsupported dates fail closed',()=>{
 const cases:[string,boolean][]=[
 ['2026-01-05T14:29:59Z',false],['2026-01-05T14:30:00Z',true],['2026-01-05T20:59:59Z',true],['2026-01-05T21:00:00Z',false],
 ['2026-03-06T14:30:00Z',true],['2026-03-09T13:29:59Z',false],['2026-03-09T13:30:00Z',true],['2026-10-30T13:30:00Z',true],['2026-11-02T14:29:59Z',false],['2026-11-02T14:30:00Z',true],
 ['2027-03-12T14:30:00Z',true],['2027-03-15T13:30:00Z',true],['2027-11-05T13:30:00Z',true],['2027-11-08T14:30:00Z',true],
 ['2026-11-27T17:59:59Z',true],['2026-11-27T18:00:00Z',false],['2026-12-24T17:59:59Z',true],['2026-12-24T18:00:00Z',false],['2027-11-26T18:00:00Z',false],
 ['2026-10-24T15:00:00Z',false],['2026-10-25T15:00:00Z',false],['2026-10-27T14:59:59Z',true],['2026-10-27T15:00:00Z',true],
 ['2025-12-31T16:00:00Z',false],['2028-01-03T16:00:00Z',false]];
 for(const [time,allowed] of cases)expect(marketState(new Date(time)).canTrade,time).toBe(allowed);
 for(const y of Object.values(calendar.years))for(const date of Object.keys(y.holidays))expect(marketState(new Date(date+'T16:00:00Z')).state,date).toBe('holiday');
 expect(marketState(new Date(NaN)).canTrade).toBe(false);
 const saved=calendar.years['2026'];try{delete (calendar.years as Partial<typeof calendar.years>)['2026'];expect(marketState(new Date('2026-10-27T15:00:00Z')).state).toBe('unknown');}finally{calendar.years['2026']=saved;}
});
test('server gate uses monotonic age, expires and closes without trusting browser clock',()=>{
 const state={...marketState(new Date('2026-10-27T19:59:59Z')),serverNow:'2026-10-27T19:59:59Z'};
 expect(serverMarketState(state,1000,1000).canTrade).toBe(true);expect(serverMarketState(state,1000,2000).canTrade).toBe(false);
 expect(serverMarketState(state,1000,31001).state).toBe('unknown');expect(serverMarketState(undefined,1000,1000).canTrade).toBe(false);
 expect(serverMarketState({...state,openAt:'bad'},1000,1000).canTrade).toBe(false);
 expect(serverMarketState({...state,state:'halted',canTrade:false,reason:'임시 휴장'},1000,1000).canTrade).toBe(false);
});
test('closed local orders stay unchanged; analysis, currency and navigation remain available',async({page})=>{
 await page.clock.install({time:new Date('2026-11-27T18:00:00Z')});await page.goto('/#stock/AAPL');
 await expect(page.getByTestId('order-session')).toContainText('신규 주문 제한');await expect(page.getByTestId('order-session')).toContainText('조기폐장');await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeDisabled();
 await page.getByLabel('추가매수 가격',{exact:true}).fill('80');await page.getByLabel('추가매수 수량',{exact:true}).fill('5');await expect(page.getByTestId('simulation')).toContainText('5주');
 for(const period of ['1분','5분','15분','30분','1시간','일','주','월'])await page.getByRole('button',{name:period,exact:true}).click();await expect(page.locator('canvas').first()).toBeVisible();
 expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBeNull();await page.reload();await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeDisabled();
 await page.goto('/#settings');await page.getByLabel('기본 표시 통화').selectOption('KRW');await page.goto('/#home');await expect(page.getByTestId('total-assets')).toHaveText('₩136,000,000');await expect(page.locator('.live-times')).toContainText('ET');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/hours-closed-${test.info().project.name}.png`,fullPage:true});
});
test('opening/closing updates UI; close while waiting for local lock never writes',async({page})=>{
 await page.clock.install({time:new Date('2026-10-27T13:29:59Z')});await page.goto('/#stock/AAPL');await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeDisabled();
 await page.clock.setFixedTime(new Date('2026-10-27T13:30:00Z'));await page.clock.runFor(1100);await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'주문 검토',exact:true}).click();
 await page.evaluate(async key=>{await new Promise<void>(ready=>{void navigator.locks.request(key,()=>new Promise<void>(release=>{(window as any).release=release;ready();}));});},accountKey);
 await page.getByRole('button',{name:'체결 확정',exact:true}).click();await expect(page.getByRole('button',{name:'저장 중…',exact:true})).toBeDisabled();
 await page.clock.setFixedTime(new Date('2026-10-27T20:00:00Z'));await page.clock.runFor(1100);await page.evaluate(()=>(window as any).release());await expect(page.locator('.detail-order').getByRole('alert')).toContainText('정규장');
 expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBeNull();await expect(page.getByRole('button',{name:'체결 확정',exact:true})).toBeDisabled();
});
test('storage boundary rejects direct calls outside hours without UI',async()=>{
 const date=globalThis.Date,nav=Object.getOwnPropertyDescriptor(globalThis,'navigator'),store=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const rows=new Map<string,string>();
 try{
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:async(_key:string,run:()=>unknown)=>run()}}});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>rows.get(k)??null,setItem:(k:string,v:string)=>rows.set(k,v)}});
  (globalThis as any).Date=class extends date {constructor(...args:any[]){if(args.length)super(args[0]);else super('2026-10-27T20:00:00Z');}};
  await expect(executeOrder({id:'direct',symbol:'AAPL',side:'buy',quantity:1},null)).rejects.toThrow(/정규장/);expect(rows.size).toBe(0);
 }finally{globalThis.Date=date;if(nav)Object.defineProperty(globalThis,'navigator',nav);else delete (globalThis as any).navigator;if(store)Object.defineProperty(globalThis,'localStorage',store);else delete (globalThis as any).localStorage;}
});
