import {test,expect} from '@playwright/test';
import {parseHistory,analyze} from '../src/performance/core';
const header='date,currency,source,value,flow,benchmark_return,risk_free_return\n';
const sample=header+'2023-01-01,USD,synthetic,1000,0,,\n2024-01-01,USD,synthetic,1100,0,0.08,0.03\n2024-12-31,USD,synthetic,1045,0,-0.02,0.03';
test('independent two-period reference values and end-flow neutralization',()=>{
 const h=parseHistory(sample),r=analyze(h),m=r.metrics;expect(m.TWR.value).toBeCloseTo(.045,10);expect(m.CAGR.value).toBeCloseTo(Math.sqrt(1.045)-1,10);expect(m.XIRR.value).toBeCloseTo(Math.sqrt(1.045)-1,8);expect(m.MDD.value).toBeCloseTo(-.05,10);
 expect(m.Volatility.value).toBeCloseTo(.15/Math.sqrt(2),10);expect(m.Sharpe.value).toBeCloseTo(-.005/(.15/Math.sqrt(2)),10);expect(m.Sortino.value).toBeCloseTo(-.005/Math.sqrt(.08**2/2),10);
 expect(m.Beta.value).toBeCloseTo(1.5,10);expect(m.Correlation.value).toBeCloseTo(1,10);expect(m['Tracking Error'].value).toBeCloseTo(.05/Math.sqrt(2),10);expect(m['Information Ratio'].value).toBeCloseTo(-.005/(.05/Math.sqrt(2)),10);
 const flow=analyze(parseHistory(header+'2023-01-01,USD,user,1000,0,,\n2024-01-01,USD,user,1600,500,,\n2024-12-31,USD,user,1760,0,,'));
 expect(flow.metrics.TWR.value).toBeCloseTo(.21,10);expect(flow.metrics.XIRR.value).toBeCloseTo(.1,8);expect(flow.metrics.CAGR.value).toBeNull();expect(flow.metrics.Sharpe.value).toBeNull();expect(flow.metrics.Beta.value).toBeNull();expect(flow.drawdown).toEqual([0,0,0]);
 const excel=analyze(parseHistory(header+'2008-01-01,USD,user,10000,0,,\n2008-03-01,USD,user,10000,-2750,,\n2008-10-30,USD,user,10000,-4250,,\n2009-02-15,USD,user,10000,-3250,,\n2009-04-01,USD,user,2750,0,,'));expect(excel.metrics.XIRR.value).toBeCloseTo(.373362535,7);
});
test('missing, unequal intervals, total loss, zero dispersion and ambiguous XIRR',()=>{
 const partial=analyze(parseHistory(sample.replace(',0.08,0.03',',,0.03')));expect(partial.metrics.Beta.value).toBeNull();expect(partial.benchmarkWealth).toBeNull();expect(partial.metrics.Sharpe.value).not.toBeNull();
 const uneven=analyze(parseHistory(sample.replace('2024-12-31','2025-01-02')));expect(uneven.metrics.Volatility.value).toBeNull();expect(uneven.metrics.TWR.value).not.toBeNull();
 const loss=analyze(parseHistory(header+'2023-01-01,USD,user,100,0,,\n2024-01-01,USD,user,0,0,,'));
 expect(loss.metrics.MDD.value).toBe(-1);expect(loss.metrics.TWR.value).toBe(-1);expect(loss.metrics.XIRR.value).toBeNull();
 const zero=analyze(parseHistory(header+'2023-01-01,USD,user,100,0,,\n2024-01-01,USD,user,100,0,0,0\n2024-12-31,USD,user,100,0,0,0'));expect(zero.metrics.Sharpe.value).toBeNull();expect(zero.metrics.Beta.value).toBeNull();expect(zero.metrics['Information Ratio'].value).toBeNull();expect(zero.metrics.Volatility.value).toBe(0);
 const mixed=analyze(parseHistory(header+'2023-01-01,USD,user,100,0,,\n2024-01-01,USD,user,20,-100,,\n2024-12-31,USD,user,200,150,,\n2025-12-31,USD,user,220,0,,'));
 expect(mixed.metrics.XIRR.value).toBeNull();
 for(const bad of [sample.replace('2024-01-01','2023-01-01'),sample.replace('2024-01-01','2024-02-30'),sample.replace('1100',''),sample.replace('1100','NaN'),sample.replace('1100','-1'),sample.replace('1100','9007199254740992'),sample.replace('2024-01-01,USD','2024-01-01,KRW'),sample.replace('2024-01-01,USD,synthetic','2024-01-01,USD,user')])expect(()=>parseHistory(bad)).toThrow();
});
test('CSV UI preserves PA1 and account data; responsive charts and optional explanations',async({page})=>{
 const rpc:string[]=[],errors:string[]=[];page.on('request',r=>{if(r.url().includes('/rest/v1/rpc/'))rpc.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#portfolio/analysis');await expect(page.getByRole('heading',{name:'현재 계좌'})).toBeVisible();const before=await page.evaluate(()=>JSON.stringify(localStorage));
 await page.getByLabel('과거 평가액 CSV').setInputFiles({name:'example.csv',mimeType:'text/csv',buffer:Buffer.from(sample)});
 await expect(page.getByRole('status')).toContainText('합성 자료');await expect(page.getByRole('heading',{name:'현재 합성 계좌의 기간 성과'})).toBeVisible();await expect(page.getByRole('heading',{name:'사용자 CSV 수익·위험 분석'})).toBeVisible();await expect(page.getByRole('heading',{name:'TWR',exact:true})).toBeVisible();await expect(page.locator('.performance-panel')).toContainText('4.50%');
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
 await page.getByText('상세 성과·벤치마크·위험 지표',{exact:true}).click();await expect(page.locator('.performance-panel')).toContainText('Information Ratio');expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);expect(rpc).toEqual([]);expect(errors).toEqual([]);
 await page.getByLabel('과거 평가액 CSV').setInputFiles({name:'user.csv',mimeType:'text/csv',buffer:Buffer.from(sample.replaceAll('synthetic','user'))});await expect(page.getByRole('status')).toContainText('사용자 신고 자료');await expect(page.getByRole('heading',{name:'현재 합성 계좌의 기간 성과'})).toBeVisible();
 await page.getByLabel('과거 평가액 CSV').setInputFiles({name:'bad.csv',mimeType:'text/csv',buffer:Buffer.from('bad')});await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('heading',{name:'TWR',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'가져온 자료 지우기'}).click();await expect(page.getByRole('alert')).toHaveCount(0);
});
