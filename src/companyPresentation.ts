import type {CompanyProfile,FinancialFact,Metric} from './companyData';
const instant=new Set<Metric>(['assets','liabilities','equity','cashAndEquivalents','debt','debtCurrent','debtNoncurrent','commercialPaper','shortTermBorrowings']);
export function currentFinancialFacts(profile:CompanyProfile){
 const replaced=new Set(profile.financials.flatMap(f=>f.supersedes?[f.supersedes]:[]));
 return profile.financials.filter(f=>f.status==='verified'&&f.value!==null&&!replaced.has(f.id));
}
export function financialSeries(profile:CompanyProfile,basis:'annual'|'quarter'){
 return currentFinancialFacts(profile).filter(f=>f.metric==='revenue'&&f.period.basis===basis).sort((a,b)=>a.period.end.localeCompare(b.period.end));
}
/** Every duration card shares the selected income period; balances use one as-of date. */
export function latestFinancialFact(profile:CompanyProfile,metric:Metric,basis:'annual'|'quarter'){
 const facts=currentFinancialFacts(profile),balance=instant.has(metric);
 const anchor=balance?facts.filter(f=>f.metric==='assets'&&f.period.basis==='instant').sort((a,b)=>b.period.end.localeCompare(a.period.end))[0]:financialSeries(profile,basis).at(-1);
 if(!anchor)return undefined;
 return facts.find(f=>f.metric===metric&&f.period.basis===(balance?'instant':basis)&&f.period.start===anchor.period.start&&f.period.end===anchor.period.end&&f.period.fiscalYear===anchor.period.fiscalYear&&f.period.quarter===anchor.period.quarter);
}
/** Abbreviation is display-only. The full decimal string is always rendered alongside. */
export function financialValueText(f:FinancialFact){
 const value=f.value!;
 if(f.unit!=='USD')return `${value} ${f.unit}`;
 const [whole,fraction='']=value.replace('-','').split('.');
 if(BigInt(whole)<1000000n)return `${value} USD`;
 const units=BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));
 const millions=units/1000000000000n,decimals=(units%1000000000000n).toString().padStart(12,'0').replace(/0+$/,'');
 return `${value.startsWith('-')?'-':''}${millions.toLocaleString('en-US')}${decimals?'.'+decimals:''} 백만 USD · 정확값 ${value} USD`;
}
