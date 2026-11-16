import {test,expect} from '@playwright/test';
import {dates,history,runBacktest,symbols} from '../src/backtest';
import {accountKey,marketPrices} from '../src/accountStore';
const weights=[5000,0,0,0,0,0,0,0,5000];
test('one-time purchase uses same-day close, integer shares and correct TWR',()=>{
 const c={start:dates[0],end:dates[4],initialCents:1_000_000,monthlyCents:0,weights};const r=runBacktest(c);const p0=history[0][0].price,p4=history[0][4].price,shares=Math.floor(500_000/p0),cash=1_000_000-shares*p0;
 expect(r.points[0].units[0]).toBe(shares);expect(r.cash).toBe(cash);expect(r.value).toBe(cash+shares*p4);expect(r.returnPct).toBeCloseTo((cash+shares*p4)/1_000_000-1,12);expect(r.contributed).toBe(1_000_000);expect(r.mdd).toBeLessThanOrEqual(0);
 const shorter=runBacktest({...c,end:dates[2]});expect(r.points.slice(0,3)).toEqual(shorter.points);
});
test('monthly schedules use next available date and preserve cashflow-adjusted returns',()=>{
 const r=runBacktest({start:'2026-06-25',end:'2026-08-31',initialCents:1_000_000,monthlyCents:100_000,weights});const flows=r.points.filter(p=>p.flow>0);expect(flows.map(p=>p.date)).toEqual(['2026-06-25','2026-07-27','2026-08-25']);expect(r.contributed).toBe(1_200_000);
 for(let i=1;i<r.points.length;i++){const p=r.points[i],prev=r.points[i-1];expect(p.returnIndex/prev.returnIndex).toBeCloseTo((p.value-p.flow)/prev.value,10);expect(p.cash).toBeGreaterThanOrEqual(0)}
 const weekend=runBacktest({start:'2026-06-27',end:'2026-07-03',initialCents:1000,monthlyCents:0,weights});expect(weekend.first).toBe('2026-06-29');expect(weekend.points[0].units[0]).toBe(0);expect(weekend.returnPct).toBe(0);
});
test('invalid periods, allocations and integer boundaries are rejected deterministically',()=>{
 const c={start:dates[0],end:dates[4],initialCents:10000,monthlyCents:0,weights};
 for(const patch of [{start:'2026-02-30'},{end:dates[0]},{start:'2020-01-01'},{weights:[0,0,0,0,0,0,0,0,10000]},{weights:[1]},{initialCents:-1},{monthlyCents:NaN}])expect(()=>runBacktest({...c,...patch})).toThrow();expect(runBacktest(c)).toEqual(runBacktest(c));
});
test('two scenarios and account copy remain read-only at mobile and desktop widths',async({page})=>{
 const rpc:string[]=[],errors:string[]=[];page.on('request',r=>{if(r.url().includes('/rest/v1/rpc/'))rpc.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
 const price=marketPrices().AAPL,doc=JSON.stringify({version:1,generation:'bt-protected',trades:[{id:'a',symbol:'AAPL',side:'buy',quantity:10,price,time:'2026-10-27T14:00:00Z'}]});await page.addInitScript(({accountKey,doc})=>localStorage.setItem(accountKey,doc),{accountKey,doc});
 await page.goto('/#portfolio/analysis');await page.getByRole('link',{name:'합성 포트폴리오 백테스트 →'}).click();const a=page.getByRole('region',{name:'설정 A'}),b=page.getByRole('region',{name:'설정 B'});await a.getByRole('button',{name:'현재 가상계좌 비중 복사'}).click();expect(Number(await a.getByLabel('A AAPL 비중').inputValue())).toBeGreaterThan(0);await a.getByRole('button',{name:'설정 A 계산'}).click();await expect(a.getByRole('heading',{name:'설정 A 결과'})).toBeVisible();await b.getByLabel('투자 방식').selectOption('monthly');await b.getByRole('button',{name:'설정 B 계산'}).click();await expect(b.getByRole('heading',{name:'설정 B 결과'})).toBeVisible();await expect(b.getByRole('img')).toBeVisible();
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const boxes=await b.locator('.bt-weights label').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('input')!.getBoundingClientRect();return {left:r.left,right:r.right,inputLeft:i.left,inputRight:i.right}}));for(const box of boxes){expect(box.inputLeft).toBeGreaterThanOrEqual(box.left-1);expect(box.inputRight).toBeLessThanOrEqual(box.right+1)}const button=b.getByRole('button',{name:'설정 B 계산'});await button.focus();await expect(button).toBeFocused()}
 expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe(doc);expect(rpc).toEqual([]);expect(errors).toEqual([]);
});
