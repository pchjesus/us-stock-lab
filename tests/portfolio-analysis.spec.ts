import {test,expect} from '@playwright/test';
import {allocationMetrics,buildAnalysis,initialBasisPoints,parseScenario} from '../src/portfolioAnalysis';
import {accountKey,marketPrices} from '../src/accountStore';
import {emptyAccount} from '../src/trading';
const prices=marketPrices();
const doc=JSON.stringify({version:1,generation:'pa-test',trades:[{id:'a',symbol:'AAPL',side:'buy',quantity:10,price:prices.AAPL,time:'2026-10-27T14:00:00Z'},{id:'b',symbol:'VOO',side:'buy',quantity:5,price:prices.VOO,time:'2026-10-27T14:01:00Z'}]});
test('allocation math distinguishes cash, securities and unavailable history',()=>{
 const m=allocationMetrics([300,200,500],2);expect(m.weights).toEqual([30,20,50]);expect(m.largest).toBe(30);expect(m.topThree).toBe(50);expect(m.hhi).toBe(5200);
 expect(allocationMetrics([100,0],1).hhi).toBe(10000);expect(allocationMetrics([0,100],1).hhi).toBeNull();expect(allocationMetrics([0,0],1).largest).toBeNull();
 expect(initialBasisPoints([1,1,1])).toEqual([3334,3333,3333]);expect(parseScenario(['20.00','30','50.00'])).toEqual([2000,3000,5000]);
 for(const bad of [['20','30','49'],['-1','51','50'],['NaN','0','100'],['0.001','0','100'],['101','0','0']])expect(()=>parseScenario(bad)).toThrow();
 expect(()=>allocationMetrics([NaN,0],1)).toThrow();expect(()=>initialBasisPoints([-1,2])).toThrow();expect(()=>allocationMetrics([Number.MAX_SAFE_INTEGER,1],1)).toThrow();
 const a=emptyAccount();const before=JSON.stringify(a);const result=buildAnalysis(a,prices);expect(result.summary.total).toBe(a.cash);expect(result.metrics.weights).toEqual([100]);expect(JSON.stringify(a)).toBe(before);
 expect(()=>buildAnalysis({...a,holdings:{UNKNOWN:{quantity:1,cost:100}}},prices)).toThrow();expect(()=>buildAnalysis({...a,holdings:{AAPL:{quantity:1,cost:100}}},{...prices,AAPL:NaN})).toThrow();
});
test('read-only analysis compares holdings and cash without account or RPC mutations',async({page})=>{
 const errors:string[]=[],rpcs:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/rest\/v1\/rpc\//.test(r.url()))rpcs.push(r.url())});
 await page.addInitScript(({accountKey,doc})=>localStorage.setItem(accountKey,doc),{accountKey,doc});await page.goto('/#portfolio');await page.getByRole('link',{name:'분석실 열기 →'}).click();
 await expect(page.getByRole('heading',{name:'포트폴리오 분석실'})).toBeVisible();await expect(page.getByText('ETF 내부 섹터 미확인').first()).toBeVisible();await expect(page.getByText(/기간 수익률, 변동성, 최대 낙폭: 미제공/)).toBeVisible();
 await page.getByLabel('애플 (AAPL) 비중 (%)').fill('20');await page.getByLabel('Vanguard S&P 500 ETF (VOO) 비중 (%)').fill('30');await page.getByLabel('현금 비중 (%)').fill('50');await page.getByRole('button',{name:'변경 전후 비교'}).click();await expect(page.getByRole('heading',{name:'가상 구성',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'가상 구성의 집중도'})).toBeVisible();await expect(page.getByText(/가상 HHI 5200/)).toBeVisible();
 expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe(doc);expect(rpcs).toEqual([]);expect(errors).toEqual([]);
 await page.getByLabel('현금 비중 (%)').fill('49');await expect(page.getByRole('button',{name:'변경 전후 비교'})).toBeDisabled();await expect(page.getByRole('status')).toContainText('100%');
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const input=page.getByLabel('현금 비중 (%)');await input.focus();await expect(input).toBeFocused();await expect(input).toHaveCSS('outline-width','3px');}
 await page.reload();await expect(page.getByRole('heading',{name:'포트폴리오 분석실'})).toBeVisible();expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe(doc);
});
test('empty account and invalid price fail closed',async({page})=>{
 await page.goto('/#portfolio/analysis');await expect(page.getByText('보유 종목이 없어 비교할 종목이 없습니다.')).toBeVisible();await expect(page.getByText('미제공').first()).toBeVisible();await expect(page.getByRole('link',{name:'← 포트폴리오로 돌아가기'})).toBeVisible();
});
test('a changed account snapshot clears the experiment without writing the new account',async({page})=>{
 await page.addInitScript(({accountKey,doc})=>localStorage.setItem(accountKey,doc),{accountKey,doc});await page.goto('/#portfolio/analysis');
 await page.getByLabel('애플 (AAPL) 비중 (%)').fill('20');await page.getByLabel('Vanguard S&P 500 ETF (VOO) 비중 (%)').fill('30');await page.getByLabel('현금 비중 (%)').fill('50');await page.getByRole('button',{name:'변경 전후 비교'}).click();await expect(page.getByRole('heading',{name:'가상 구성의 집중도'})).toBeVisible();
 const other=JSON.stringify({version:1,generation:'other',trades:[]});await page.evaluate(({accountKey,other})=>{localStorage.setItem(accountKey,other);window.dispatchEvent(new StorageEvent('storage',{key:accountKey,newValue:other}));},{accountKey,other});
 await expect(page.getByText('보유 종목이 없어 비교할 종목이 없습니다.')).toBeVisible();await expect(page.getByRole('heading',{name:'가상 구성의 집중도'})).toHaveCount(0);expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe(other);
});
