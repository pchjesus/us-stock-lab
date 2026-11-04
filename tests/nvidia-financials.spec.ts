import {openFinancials} from './detail-navigation';
import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import data from '../src/companyFinancials.json' with {type:'json'};
import proof from './fixtures/company-financial-evidence.json' with {type:'json'};
import notes from './fixtures/nvda-report-notes.json' with {type:'json'};
import {findCompanyProfile} from '../src/companyProfiles';
import {validateCompany,validatePeriod,calculateFcf} from '../src/companyData';
import {financialSeries,latestFinancialFact} from '../src/companyPresentation';
const p=findCompanyProfile('NVDA')!;
// FY2026 10-K 0001045810-26-000021: GAAP consolidated columns FY2024/2025/2026.
// Values below independently transcribed from income and cash flow tables (USD, not millions).
const expected={revenue:['60922000000','130497000000','215938000000'],operatingIncome:['32972000000','81453000000','130387000000'],netIncome:['29760000000','72880000000','120067000000'],dilutedEps:['1.19','2.94','4.90'],operatingCashFlow:['28090000000','64089000000','102718000000'],capitalExpenditure:['1069000000','3236000000','6042000000'],freeCashFlow:['27021000000','60853000000','96676000000']};
test('NVIDIA three annual GAAP columns, 52-week years and split-adjusted EPS match the original',()=>{
 expect(validateCompany(p)).toBe(p);
 for(const [metric,values] of Object.entries(expected)){const facts=p.financials.filter(f=>f.metric===metric&&f.period.basis==='annual').sort((a,b)=>a.period.end.localeCompare(b.period.end));expect(facts.map(f=>f.value)).toEqual(values);expect(facts.map(f=>f.period.fiscalYear)).toEqual([2024,2025,2026]);for(const f of facts)expect((Date.parse(f.period.end)-Date.parse(f.period.start))/86400000+1).toBe(364);}
 expect(notes.quotes).toContain('In May 2024, we announced a ten-for-one stock split');expect(notes.quotes).toContain('All share, equity award and per share amounts presented herein have been retrospectively adjusted to reflect the Stock Split.');
 const eps=p.financials.find(f=>f.metric==='dilutedEps'&&f.period.fiscalYear===2024)!;expect(eps.unit).toBe('USD/share');expect(eps.evidence!.reportFiscalYear).toBe(2026);expect(eps.evidence!.frame).toBe('CY2023');
 // Generic 53-week contract case; not a claim that the selected NVIDIA years have 53 weeks.
 expect(()=>validatePeriod({fiscalYear:2024,quarter:null,basis:'annual',start:'2023-01-23',end:'2024-01-28'})).not.toThrow();
});
test('NVIDIA only uses original standalone quarters and fiscal labels, with no generated Q4',()=>{
 const series=financialSeries(p,'quarter');expect(series.map(f=>f.value)).toEqual(['46743000000','57006000000','81615000000','96221000000']);expect(series.map(f=>[f.period.fiscalYear,f.period.quarter])).toEqual([[2026,2],[2026,3],[2027,1],[2027,2]]);expect(series.map(f=>f.period.end)).toEqual(['2025-07-27','2025-10-26','2026-04-26','2026-07-26']);
 for(const f of p.financials.filter(f=>f.period.basis==='quarter')){expect(f.origin.kind).toBe('reported');expect(f.period.quarter).not.toBe(4);expect(f.evidence!.reportFiscalYear).toBe(f.period.fiscalYear);expect(f.evidence!.reportFiscalPeriod).toBe('Q'+f.period.quarter);}
 expect(latestFinancialFact(p,'revenue','quarter')!.evidence!.frame).toBe('CY2026Q2');expect(latestFinancialFact(p,'operatingCashFlow','quarter')).toBeUndefined();
});
test('NVIDIA cash Capex, FCF and latest debt/cash classifications match original rows',()=>{
 for(const f of p.financials.filter(f=>f.metric==='freeCashFlow')){if(f.origin.kind!=='calculated')throw Error('No trace');const inputs=f.origin.inputIds.map(id=>p.financials.find(x=>x.id===id)!);expect(calculateFcf(inputs[0],inputs[1])).toBe(f.value);const e=inputs[1].evidence!;expect(e.concept).toBe('us-gaap:PaymentsToAcquireProductiveAssets');expect(e.scale).toBe(6);expect(proof.find(r=>r.id===inputs[1].id)!.tableRow).toContain('property and equipment and intangible assets');}
 const balances=['assets','liabilities','equity','cashAndEquivalents','debt'] as const;const facts=balances.map(metric=>latestFinancialFact(p,metric,'annual')!);expect(facts.map(f=>f.value)).toEqual(['320272000000','91288000000','228984000000','22443000000','33366000000']);for(const f of facts)expect(f.period.end).toBe('2026-07-26');expect(91288000000n+228984000000n).toBe(320272000000n);
 expect(facts[4].origin.kind).toBe('reported');expect(proof.find(r=>r.id===facts[4].id)!.tableRow).toContain('Net carrying amount');expect(1000000000n+32366000000n).toBe(33366000000n);expect(33500000000n-134000000n).toBe(33366000000n);expect(facts[3].value).not.toBe('99369000000'); // cash + marketable debt/equity securities is a different balance.
});
test('NVIDIA concepts are company-specific and all evidence remains exact',()=>{
 const reported=p.financials.filter(f=>f.origin.kind==='reported');expect(reported).toHaveLength(39);expect(p.financials.filter(f=>f.origin.kind==='calculated')).toHaveLength(3);
 for(const f of reported){const e=f.evidence!,s=p.sources.find(s=>s.id===f.sourceId)!;expect(s.filedAt!<='2026-11-01').toBe(true);expect(e.accession).toBe(s.accession);expect(proof.find(r=>r.id===f.id)!.url).toBe(s.url);expect(e.unit).toBe(f.unit==='USD/share'?'USD/shares':'USD');if(f.metric==='revenue')expect(e.concept).toBe('us-gaap:Revenues');}
 const bad=structuredClone(p);bad.financials.find(f=>f.metric==='revenue')!.evidence!.concept='us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax';expect(()=>validateCompany(bad)).toThrow();
 const apple=structuredClone(findCompanyProfile('AAPL')!);apple.financials.find(f=>f.metric==='revenue')!.evidence!.concept='us-gaap:Revenues';expect(()=>validateCompany(apple)).toThrow();
});
test('all B3-A data and original evidence are unchanged and dividends stay unreviewed',()=>{
 const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 const old=data.filter(p=>['AAPL','MSFT'].includes(p.symbol)),oldProof=proof.filter(p=>p.id.startsWith('AAPL-')||p.id.startsWith('MSFT-'));
 expect(old.reduce((s,p)=>s+p.financials.length,0)).toBe(87);expect(oldProof).toHaveLength(80);
 // Digests taken from verified baseline 3e75bb4 before adding NVIDIA.
 expect(hash(old)).toBe('b968443afb28668c72327eb8c680923fd7b3c92c1c754585315fa00e0c9f22dc');expect(hash(oldProof)).toBe('7b0ecc243901c1f8d3a5d04bf964cba3bc2b36aa059debe3cdbd3bed8754d3ea');
 for(const symbol of ['AMZN','GOOGL']){const other=findCompanyProfile(symbol)!;expect(other.financials.length).toBeGreaterThan(0);expect(other.financialCoverage.status).toBe('partial');}expect(p.dividends.status).toBe('not-reviewed');
});
test('NVIDIA UI reflects verified source periods without changing account storage',async({page})=>{
 await page.goto('/#stock/NVDA');await openFinancials(page);const before=await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'));await expect(page.getByTestId('financial-revenue')).toContainText('215938000000 USD');await expect(page.getByTestId('financial-freeCashFlow')).toContainText('96676000000 USD');await expect(page.getByTestId('financial-dilutedEps')).toContainText('4.90 USD/share');await expect(page.getByTestId('financial-debt')).toContainText('33366000000 USD');
 const graph=page.getByLabel('매출 실적 그래프',{exact:true});await expect(graph.locator('svg rect')).toHaveCount(3);await page.getByRole('button',{name:'분기',exact:true}).click();await expect(graph.locator('svg rect')).toHaveCount(4);await expect(graph.locator('svg')).toContainText('FY2027 Q2');await expect(page.getByTestId('financial-revenue')).toContainText('96221000000 USD');await expect(page.getByTestId('financial-operatingIncome')).toContainText('63734000000 USD');await expect(page.getByTestId('financial-netIncome')).toContainText('59688000000 USD');await expect(page.getByTestId('financial-dilutedEps')).toContainText('2.46 USD/share');await expect(page.getByTestId('financial-operatingCashFlow')).toContainText('공식 수치 미확인');await expect(page.getByTestId('financial-debt')).toContainText('2026-07-26');expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
