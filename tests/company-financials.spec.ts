import {test,expect} from '@playwright/test';
import {companyProfiles,findCompanyProfile} from '../src/companyProfiles';
import {validateCompany,calculateFcf,calculateDebt,type Metric} from '../src/companyData';
import {financialSeries,latestFinancialFact,financialValueText} from '../src/companyPresentation';
import proof from './fixtures/company-financial-evidence.json' with {type:'json'};
// Independently transcribed consolidated statement columns in the linked 10-Ks.
// AAPL: 0000320193-25-000079, columns 2023/2024/2025 (USD millions except EPS).
// MSFT: 0001193125-26-323660, columns 2024/2025/2026 (USD millions except EPS).
const annual={
 AAPL:{revenue:['383285000000','391035000000','416161000000'],operatingIncome:['114301000000','123216000000','133050000000'],netIncome:['96995000000','93736000000','112010000000'],dilutedEps:['6.13','6.08','7.46'],operatingCashFlow:['110543000000','118254000000','111482000000'],capitalExpenditure:['10959000000','9447000000','12715000000'],freeCashFlow:['99584000000','108807000000','98767000000']},
 MSFT:{revenue:['245122000000','281724000000','331839000000'],operatingIncome:['109433000000','128528000000','155237000000'],netIncome:['88136000000','101832000000','133749000000'],dilutedEps:['11.80','13.64','17.95'],operatingCashFlow:['118548000000','136162000000','182935000000'],capitalExpenditure:['44477000000','64551000000','115948000000'],freeCashFlow:['74071000000','71611000000','66987000000']}
};
function scaled(v:string){const [a,b='']=v.replace('-','').split('.');return (BigInt(a)*1000000n+BigInt(b.padEnd(6,'0')))*(v.startsWith('-')?-1n:1n);}
test('official annual statement columns and cash outflows match normalized USD',()=>{
 for(const symbol of ['AAPL','MSFT'] as const){const p=findCompanyProfile(symbol)!;expect(validateCompany(p)).toBe(p);for(const [metric,values] of Object.entries(annual[symbol])){const facts=p.financials.filter(f=>f.metric===metric&&f.period.basis==='annual').sort((a,b)=>a.period.end.localeCompare(b.period.end));expect(facts.map(f=>f.value)).toEqual(values);expect(facts.map(f=>f.period.fiscalYear)).toEqual(symbol==='AAPL'?[2023,2024,2025]:[2024,2025,2026]);for(const f of facts)expect(f.unit).toBe(metric==='dilutedEps'?'USD/share':'USD');}}
});
test('all reported values retain original row, scale, accession and XBRL focus/frame',()=>{
 let count=0;for(const p of companyProfiles.filter(p=>['AAPL','MSFT'].includes(p.symbol)))for(const f of p.financials){const s=p.sources.find(s=>s.id===f.sourceId)!;expect(s.filedAt!<='2026-11-01').toBe(true);expect(s.url).toContain(s.accession!.replaceAll('-',''));if(f.origin.kind!=='reported')continue;count++;const e=f.evidence!,row=proof.find(p=>p.id===f.id)!;expect(row.accession).toBe(s.accession);expect(row.url).toBe(s.url);expect(row.tableRow.length).toBeGreaterThan(5);expect(scaled(row.xbrlValue)).toBe(scaled(f.value!));expect(scaled(e.rawValue)*10n**BigInt(e.scale)).toBe(scaled(f.value!));expect(e.start).toBe(f.period.start);expect(e.end).toBe(f.period.end);expect(e.unit).toBe(f.unit==='USD/share'?'USD/shares':'USD');}
 expect(count).toBe(80);const old=findCompanyProfile('AAPL')!.financials.find(f=>f.metric==='revenue'&&f.period.fiscalYear===2023)!;expect(old.evidence!.reportFiscalYear).toBe(2025);expect(old.period.fiscalYear).toBe(2023);
});
test('direct quarterly statements keep fiscal labels and never manufacture Q4',()=>{
 const a=financialSeries(findCompanyProfile('AAPL')!,'quarter'),m=financialSeries(findCompanyProfile('MSFT')!,'quarter');expect(a.map(f=>f.value)).toEqual(['94036000000','143756000000','111184000000','109417000000']);expect(m.map(f=>f.value)).toEqual(['77673000000','81273000000','82886000000','92279000000']);expect(a).toHaveLength(4);expect(m).toHaveLength(4);for(const f of [...a,...m]){expect(f.period.basis).toBe('quarter');expect(f.period.quarter).not.toBe(4);expect(f.origin.kind).toBe('reported');}expect(m.at(-1)!.period.fiscalYear).toBe(2027);expect(m.at(-1)!.evidence!.frame).toBe('CY2026Q3');
});
test('latest balance sheets and debt are not total liabilities',()=>{
 const expected={AAPL:['383266000000','275746000000','107520000000','39544000000','84344000000'],MSFT:['779403000000','308894000000','470509000000','20281000000','35481000000']};for(const s of ['AAPL','MSFT'] as const){const p=findCompanyProfile(s)!;const facts=(['assets','liabilities','equity','cashAndEquivalents','debt'] as Metric[]).map(m=>latestFinancialFact(p,m,'annual')!);expect(facts.map(f=>f.value)).toEqual(expected[s]);expect(new Set(facts.map(f=>f.period.end)).size).toBe(1);expect(BigInt(facts[0].value!)).toBe(BigInt(facts[1].value!)+BigInt(facts[2].value!));expect(facts[1].value).not.toBe(facts[4].value);}
 const a=findCompanyProfile('AAPL')!,debt=a.financials.find(f=>f.metric==='debt')!;expect(debt.origin.kind).toBe('calculated');if(debt.origin.kind==='calculated'){expect(calculateDebt(debt.origin.inputIds.map(id=>a.financials.find(f=>f.id===id)!))).toBe('84344000000');}expect(4391000000n+31090000000n).toBe(35481000000n);
});
test('FCF, corrected latest observations and income periods remain coherent',()=>{
 for(const p of companyProfiles.filter(p=>['AAPL','MSFT'].includes(p.symbol))){for(const f of p.financials.filter(f=>f.metric==='freeCashFlow')){if(f.origin.kind!=='calculated')throw Error('untraced FCF');const inputs=f.origin.inputIds.map(id=>p.financials.find(f=>f.id===id)!);expect(calculateFcf(inputs[0],inputs[1])).toBe(f.value);expect(inputs[1].evidence!.scale).toBe(6);}
 for(const basis of ['annual','quarter'] as const){const r=latestFinancialFact(p,'revenue',basis)!;for(const metric of ['operatingIncome','netIncome','dilutedEps'] as Metric[])expect(latestFinancialFact(p,metric,basis)!.period).toEqual(r.period);if(basis==='quarter')expect(latestFinancialFact(p,'operatingCashFlow',basis)).toBeUndefined();}
 }
 const p=structuredClone(findCompanyProfile('AAPL')!),f=latestFinancialFact(p,'revenue','annual')!,source=p.sources.find(s=>s.id===f.sourceId)!;p.sources.push({...source,id:'test-amendment',form:'10-K/A',accession:undefined,amends:source.id});p.financials.push({...f,id:'test-corrected',value:'1',evidence:undefined,sourceId:'test-amendment',supersedes:f.id});validateCompany(p);expect(latestFinancialFact(p,'revenue','annual')!.value).toBe('1');
});
test('incorrect evidence and debt calculations fail safely; all dividends stay unreviewed',()=>{
 for(const mutate of [(p:any)=>p.financials[0].evidence.scale=3,(p:any)=>p.financials[0].evidence.unit='USD/shares',(p:any)=>p.financials[0].evidence.concept='us-gaap:NetIncomeLoss',(p:any)=>p.sources.at(-1).filedAt='2026-11-02',(p:any)=>p.financials.find((f:any)=>f.metric==='debt').value='275746000000']){const p=structuredClone(findCompanyProfile('AAPL')!);mutate(p);expect(()=>validateCompany(p)).toThrow();}
 for(const symbol of ['AMZN','GOOGL']){const p=findCompanyProfile(symbol)!;expect(p.financials.length).toBeGreaterThan(0);expect(p.financialCoverage.status).toBe('partial');expect(p.financialAsOf).toBe('2026-11-01');}for(const p of companyProfiles)expect(p.dividends.status).toBe('not-reviewed');for(const s of ['VOO','QQQ','SCHD'])expect(findCompanyProfile(s)).toBeNull();
 expect(financialValueText(latestFinancialFact(findCompanyProfile('AAPL')!,'revenue','annual')!)).toBe('416,161 백만 USD · 정확값 416161000000 USD');
});
