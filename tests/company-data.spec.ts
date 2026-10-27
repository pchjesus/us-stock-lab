import {test,expect} from '@playwright/test';
import {companyProfiles,findCompanyProfile} from '../src/companyProfiles';
import {validateCompany,calculateFcf,validatePeriod,type FinancialFact,type CompanyProfile} from '../src/companyData';
import {instruments,quote} from '../src/data';
function fact(id:string,metric:FinancialFact['metric'],value:string|null):FinancialFact{return {id,metric,value,unit:'USD',currency:'USD',period:{fiscalYear:2025,quarter:null,basis:'annual',start:'2024-09-29',end:'2025-09-27'},sourceId:'annual-report',status:'verified',missingReason:null,supersedes:null,origin:{kind:'reported'}};}
function bundle(){const p=structuredClone(companyProfiles[0]);p.financialCoverage={status:'partial',reason:'isolated test facts, not actual reported amounts'};p.financials=[fact('ocf','operatingCashFlow','100.10'),fact('capex','capitalExpenditure','20.03'),{...fact('fcf','freeCashFlow','80.07'),origin:{kind:'calculated',formula:'operatingCashFlow - capitalExpenditure',inputIds:['ocf','capex']}}];return p;}
test('five official profiles remain separate from ETFs and existing synthetic prices',()=>{
 const before=instruments.map(quote);expect(companyProfiles).toHaveLength(5);for(const p of companyProfiles){expect(validateCompany(p)).toBe(p);expect(p.financials).toEqual([]);expect(p.dividends.status).toBe('not-reviewed');}
 for(const s of ['VOO','QQQ','SCHD','UNKNOWN'])expect(findCompanyProfile(s)).toBeNull();expect(instruments).toHaveLength(8);expect(instruments.map(quote)).toEqual(before);
 for(const patch of [{kind:'etf'},{symbol:'VOO'},{cik:'320193'},{symbol:'aapl'}])expect(()=>validateCompany({...companyProfiles[0],...patch} as CompanyProfile)).toThrow();
});
test('official source ownership, date and correction relationships fail closed',()=>{
 for(const url of ['http://www.sec.gov/Archives/edgar/data/320193/test','https://www.sec.gov.evil.test/320193/','https://www.sec.gov/Archives/edgar/data/789019/test','https://www.microsoft.com/investor/','https://user@www.sec.gov/Archives/edgar/data/320193/test']){const p=bundle();p.sources[1].url=url;expect(()=>validateCompany(p)).toThrow();}
 for(const change of [(p:CompanyProfile)=>p.sources[1].verification='unverified',(p:CompanyProfile)=>p.sources[1].checkedAt='2024-01-01T00:00:00Z',(p:CompanyProfile)=>p.sources[1].amends='unknown']){const p=bundle();change(p);expect(()=>validateCompany(p)).toThrow();}
});
test('fiscal calendar uses declared fiscal years and distinguishes standalone quarters from YTD',()=>{
 validatePeriod({fiscalYear:2026,quarter:null,basis:'annual',start:'2025-01-27',end:'2026-01-25'});
 validatePeriod({fiscalYear:2026,quarter:1,basis:'quarter',start:'2025-09-28',end:'2025-12-27'});
 const p=bundle();p.financials=[{...fact('q','revenue','0'),period:{fiscalYear:2025,quarter:2,basis:'quarter',start:'2024-12-29',end:'2025-03-29'}},{...fact('ytd','revenue','100'),period:{fiscalYear:2025,quarter:2,basis:'ytd',start:'2024-09-29',end:'2025-03-29'}}];expect(()=>validateCompany(p)).not.toThrow();
 for(const patch of [{fiscalYear:2020},{quarter:5},{start:'2025-09-28'},{basis:'quarter',quarter:2}])expect(()=>validatePeriod({...fact('a','revenue','1').period,...patch} as any)).toThrow();
 p.financials[0].period.basis='ytd';p.financials[0].period.start='2024-09-29';expect(()=>validateCompany(p)).toThrow();
});
test('financial values distinguish missing from zero and enforce units, currency and sources',()=>{
 const p=bundle();p.financials=[{...fact('missing','revenue',null),status:'missing',missingReason:'not reviewed',sourceId:null},fact('zero','netIncome','0')];expect(()=>validateCompany(p)).not.toThrow();
 for(const change of [(p:CompanyProfile)=>p.financials[0].value='0',(p:CompanyProfile)=>p.financials[1].value=null,(p:CompanyProfile)=>p.financials[1].unit='USD/share',(p:CompanyProfile)=>(p.financials[1] as any).currency='KRW',(p:CompanyProfile)=>p.financials[1].sourceId=null,(p:CompanyProfile)=>p.financials[1].value='1e6',(p:CompanyProfile)=>p.financials[1].metric='assets']){const c=structuredClone(p);change(c);expect(()=>validateCompany(c)).toThrow();}
 const eps={...fact('eps','dilutedEps','-1.25'),unit:'USD/share' as const};p.financials=[eps];expect(()=>validateCompany(p)).not.toThrow();
});
test('FCF is exact, auditable and refuses absent, mixed or superseded inputs',()=>{
 const p=bundle();expect(validateCompany(p)).toBe(p);expect(calculateFcf({...p.financials[0],value:'100000000000000000.01'},{...p.financials[1],value:'0.02'})).toBe('99999999999999999.99');expect(calculateFcf(p.financials[0],p.financials[1])).toBe('80.07');expect(p.financials[0].value).toBe('100.10');
 for(const change of [(p:CompanyProfile)=>p.financials[2].value='80.08',(p:CompanyProfile)=>(p.financials[2].origin as any).formula='sum',(p:CompanyProfile)=>(p.financials[2].origin as any).inputIds=['missing','capex'],(p:CompanyProfile)=>p.financials[1].value='-20.03',(p:CompanyProfile)=>p.financials[1].period.fiscalYear=2024]){const c=bundle();change(c);expect(()=>validateCompany(c)).toThrow();}
 const corrected=bundle();corrected.financials=corrected.financials.slice(0,1);corrected.sources.push({...corrected.sources[1],id:'amended',form:'10-K/A',amends:'annual-report',filedAt:'2025-11-01'});corrected.financials.push({...corrected.financials[0],id:'new',value:'101',sourceId:'amended',supersedes:'ocf'});expect(()=>validateCompany(corrected)).not.toThrow();corrected.financials[1].supersedes=null;expect(()=>validateCompany(corrected)).toThrow();
});

test('restated inputs preserve historical FCF while requiring fresh current calculations',()=>{
 const p=bundle();p.sources.push({...p.sources[1],id:'amended',form:'10-K/A',amends:'annual-report',filedAt:'2025-11-01'});p.financials.push({...p.financials[0],id:'ocf-new',sourceId:'amended',supersedes:'ocf',value:'101.10'});expect(()=>validateCompany(p)).toThrow();p.financials.push({...p.financials[2],id:'fcf-new',sourceId:'amended',supersedes:'fcf',value:'81.07',origin:{kind:'calculated',formula:'operatingCashFlow - capitalExpenditure',inputIds:['ocf-new','capex']}});expect(()=>validateCompany(p)).not.toThrow();
 const a=p.financials[0],b=p.financials[1];expect(calculateFcf(a,{...b,period:{end:b.period.end,start:b.period.start,basis:b.period.basis,quarter:b.period.quarter,fiscalYear:b.period.fiscalYear}})).toBe('80.07');
});
