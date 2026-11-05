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

/** Display only: scale USD using exact decimal digits; round magnitude half up to one decimal. */
export function koreanFinancialValue(value:string|null,unit:'USD'|'USD/share'):string {
 if(value===null)return '미제공';
 if(!/^-?\d+(?:\.\d+)?$/.test(value))return '미제공';
 const negative=value.startsWith('-'),digits=negative?value.slice(1):value;
 const [whole,fraction='']=digits.split('.');const n=BigInt(whole+fraction),scale=10n**BigInt(fraction.length);
 const sign=negative&&n!==0n?'-':'';const comma=(s:string)=>s.replace(/\B(?=(\d{3})+(?!\d))/g,',');
 if(unit==='USD/share')return `${sign}${comma(BigInt(whole).toString())}${fraction?'.'+fraction:''}달러/주`;
 const units=[{n:1000000000000n,label:'조'},{n:100000000n,label:'억'},{n:10000n,label:'만'}];
 let index=units.findIndex(u=>n>=u.n*scale);
 if(index<0)return `${sign}${comma(BigInt(whole).toString())}${fraction?'.'+fraction:''}달러`;
 const rounded=(u:bigint)=>(n*10n+u*scale/2n)/(u*scale);
 let amount=rounded(units[index].n);
 if(index>0&&amount>=100000n){index--;amount=rounded(units[index].n)}
 return `${sign}${comma((amount/10n).toString())}.${amount%10n}${units[index].label} 달러`;
}
