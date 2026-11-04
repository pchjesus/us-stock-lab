import {openTrading,openFinancials} from './detail-navigation';
import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import data from '../src/companyFinancials.json' with {type:'json'};
import proof from './fixtures/company-financial-evidence.json' with {type:'json'};
import {companyProfiles} from '../src/companyProfiles';
import {validateCompany} from '../src/companyData';
import {financialSeries,latestFinancialFact} from '../src/companyPresentation';
test('audit freezes all 219 observations and 200 source records and independently checks 19 calculations',()=>{
 const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');expect(hash(data)).toBe('d751648e984a55870f88bf15d9395259eddb8b56a27f1a46e2b7bcfadffabf88');expect(hash(proof)).toBe('a076282d9929ba667b1f8be4d983e0ea94d9f16d8ab48cad9087e1ec063b4560');
 const all=companyProfiles.flatMap(p=>p.financials);expect(all).toHaveLength(219);expect(all.filter(f=>f.origin.kind==='reported')).toHaveLength(200);expect(new Set(proof.map(p=>p.id)).size).toBe(200);let calculated=0;
 for(const p of companyProfiles){validateCompany(p);for(const f of p.financials){if(f.origin.kind==='reported'){expect(f.evidence).toBeDefined();expect(proof.filter(r=>r.id===f.id)).toHaveLength(1);}else{calculated++;const vs=f.origin.inputIds.map(id=>BigInt(p.financials.find(i=>i.id===id)!.value!));const result=['freeCashFlow','liabilities'].includes(f.metric)?vs[0]-vs[1]:vs.reduce((a,b)=>a+b,0n);expect(result.toString()).toBe(f.value);}}
 for(const basis of ['annual','quarter'] as const){const anchor=latestFinancialFact(p,'revenue',basis)!;for(const metric of ['operatingIncome','netIncome','dilutedEps'] as const)expect(latestFinancialFact(p,metric,basis)!.period).toEqual(anchor.period);expect(financialSeries(p,basis).map(f=>f.period.end)).toEqual(financialSeries(p,basis).map(f=>f.period.end).sort());if(basis==='quarter')for(const metric of ['operatingCashFlow','freeCashFlow'] as const)expect(latestFinancialFact(p,metric,basis)).toBeUndefined();}}
 expect(calculated).toBe(19);
});
test('verified SEC facts require evidence; wrong periods, units and formula inputs fail closed',()=>{
 for(const original of companyProfiles){const missing=structuredClone(original);delete missing.financials.find(f=>f.origin.kind==='reported')!.evidence;expect(()=>validateCompany(missing)).toThrow('Missing SEC original evidence');
 const unit=structuredClone(original);unit.financials.find(f=>f.metric==='dilutedEps')!.unit='USD';expect(()=>validateCompany(unit)).toThrow();
 const mismatch=structuredClone(original);mismatch.financials.find(f=>f.metric==='capitalExpenditure')!.period.start='2023-01-02';expect(()=>validateCompany(mismatch)).toThrow();}
});
for(const width of [1440,768,390,320])test(`all companies and ETFs remain usable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:950});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const symbol of ['AAPL','MSFT','NVDA','AMZN','GOOGL','VOO','QQQ','SCHD']){
  await page.goto('/#stock/'+symbol);await openTrading(page);const before=await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'));
  await expect(page.locator('section:has(> h2:text-is("외부 시세 확인"))')).toHaveCount(1);await expect(page.getByRole('link',{name:'차트 학습실에서 연습하기 →'})).toHaveAttribute('href','#learn/'+symbol);
  const p=companyProfiles.find(p=>p.symbol===symbol);
  if(p){await openFinancials(page);await page.getByText('회계 기준·기업별 정의',{exact:true}).click();await expect(page.getByText(p.financialCoverage.reason,{exact:true})).toBeVisible();await page.locator('.financial-statement').filter({has:page.getByRole('heading',{name:'현금흐름표',exact:true})}).getByText('항목 설명과 최근값 상세',{exact:true}).click();await page.getByTestId('financial-freeCashFlow').locator(':scope > summary').click();await expect(page.getByTestId('financial-freeCashFlow')).toContainText('operatingCashFlow - capitalExpenditure');
   for(const basis of ['annual','quarter'] as const){await page.getByRole('button',{name:basis==='annual'?'연간':'분기',exact:true}).click();const series=financialSeries(p,basis),graph=page.getByLabel('매출 실적 그래프',{exact:true});await expect(graph.locator('svg rect')).toHaveCount(series.length);expect(await graph.locator('svg g[data-value]').evaluateAll(es=>es.map(e=>e.getAttribute('data-value')))).toEqual(series.map(f=>f.value));for(const f of series)await expect(graph.locator('svg')).toContainText('FY'+f.period.fiscalYear+(f.period.quarter?' Q'+f.period.quarter:''));if(basis==='quarter'){await expect(graph.getByRole('note')).toContainText('비연속');await expect(graph.locator('[aria-label="중간 기간 미제공"]')).toHaveCount(1);}}
   await page.reload();await expect(page.getByRole('img',{name:'검증된 매출 실적 그래프'})).toBeVisible();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(before);
 }
 expect(errors).toEqual([]);
});
