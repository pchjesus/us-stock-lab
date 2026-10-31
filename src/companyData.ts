/** Offline, reviewed company information. Never used by orders or synthetic quotes. */
export const companyCiks={AAPL:'0000320193',MSFT:'0000789019',NVDA:'0001045810',AMZN:'0001018724',GOOGL:'0001652044'} as const;
export type CompanySymbol=keyof typeof companyCiks;
export const metrics=['revenue','operatingIncome','netIncome','dilutedEps','assets','liabilities','equity','cashAndEquivalents','debt','operatingCashFlow','capitalExpenditure','freeCashFlow','debtCurrent','debtNoncurrent','commercialPaper'] as const;
export type Metric=typeof metrics[number];
export interface OfficialSource {id:string;url:string;form:'10-K'|'10-Q'|'10-K/A'|'10-Q/A'|'IR'|'SEC-profile';accession?:string;filedAt:string|null;checkedAt:string;verification:'verified'|'unverified';locator:string;amends:string|null}
export interface FiscalPeriod {fiscalYear:number;quarter:1|2|3|4|null;basis:'annual'|'quarter'|'ytd'|'instant';start:string;end:string}
export interface FinancialFact {id:string;metric:Metric;value:string|null;unit:'USD'|'USD/share';currency:'USD';period:FiscalPeriod;sourceId:string|null;status:'verified'|'unverified'|'missing';missingReason:string|null;supersedes:string|null;origin:{kind:'reported'}|{kind:'calculated';formula:'operatingCashFlow - capitalExpenditure';inputIds:[string,string]}|{kind:'calculated';formula:'debtCurrent + debtNoncurrent + commercialPaper';inputIds:[string,string,string]};evidence?:{concept:string;unit:'USD'|'USD/shares';contextRef:string;rawValue:string;scale:number;reportFiscalYear:number;reportFiscalPeriod:string;frame:string|null;start:string;end:string;accession:string}}
export interface CompanyProfile {kind:'company';symbol:CompanySymbol;name:string;cik:string;industry:string;identitySourceId:string;profileSourceId:string;business:string[];segments:string[];revenueModel:string;tenSecondSummary:string;risks:string[];summaryKind:'editorial-from-official';sources:OfficialSource[];financialAsOf?:string;financials:FinancialFact[];financialCoverage:{status:'not-reviewed'|'partial';reason:string};dividends:{status:'not-reviewed';reason:string}|{status:'verified';entries:OfficialCashDividend[]}}
export interface OfficialCashDividend {id:string;amountPerShare:string;currency:'USD';announced:string;exDate:string;recordDate:string;paymentDate:string;sourceId:string}
/** ETF data has separate semantics; no corporate earnings facts are accepted. */
export interface EtfInformationContract {kind:'etf';symbol:'VOO'|'QQQ'|'SCHD';trackingIndex:string|null;expenseRatio:string|null;holdings:{symbol:string;weight:string}[]|null;distributions:OfficialCashDividend[]|null;status:'not-built'}
const evidenceConcepts:Partial<Record<Metric,string>>={revenue:'RevenueFromContractWithCustomerExcludingAssessedTax',operatingIncome:'OperatingIncomeLoss',netIncome:'NetIncomeLoss',dilutedEps:'EarningsPerShareDiluted',assets:'Assets',liabilities:'Liabilities',equity:'StockholdersEquity',cashAndEquivalents:'CashAndCashEquivalentsAtCarryingValue',debt:'LongTermDebt',debtCurrent:'LongTermDebtCurrent',debtNoncurrent:'LongTermDebtNoncurrent',commercialPaper:'CommercialPaper',operatingCashFlow:'NetCashProvidedByUsedInOperatingActivities',capitalExpenditure:'PaymentsToAcquirePropertyPlantAndEquipment'};
const hosts:Record<CompanySymbol,string[]>={AAPL:['apple.com'],MSFT:['microsoft.com'],NVDA:['nvidia.com'],AMZN:['aboutamazon.com'],GOOGL:['abc.xyz']};
function requireValue(ok:unknown,message:string):asserts ok {if(!ok)throw Error(message);}
function date(s:string){requireValue(typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s,'Invalid date');return Date.parse(s);}
function decimal(s:string){requireValue(typeof s==='string'&&/^-?(0|[1-9]\d{0,23})(\.\d{1,6})?$/.test(s),'Invalid decimal');const negative=s.startsWith('-'),[whole,part='']=s.replace('-','').split('.');return (BigInt(whole)*1000000n+BigInt(part.padEnd(6,'0')))*(negative?-1n:1n);}
function format(n:bigint){const sign=n<0n?'-':'';n=n<0n?-n:n;const fraction=(n%1000000n).toString().padStart(6,'0').replace(/0+$/,'');return sign+(n/1000000n).toString()+(fraction?'.'+fraction:'');}
// These concepts are accepted only for NVIDIA after original statement verification.
const companyEvidenceConcepts:Partial<Record<CompanySymbol,Partial<Record<Metric,string>>>>={NVDA:{revenue:'Revenues',capitalExpenditure:'PaymentsToAcquireProductiveAssets'}};
export function validateSource(source:OfficialSource,symbol:CompanySymbol){
 requireValue(typeof source.id==='string'&&!!source.id&&typeof source.locator==='string'&&!!source.locator.trim(),'Missing source identity');
 const u=new URL(source.url);requireValue(u.protocol==='https:'&&!u.username&&!u.password&&!u.port,'Unsafe source URL');
 if(source.accession!==undefined)requireValue(/^\d{10}-\d{2}-\d{6}$/.test(source.accession)&&u.pathname.includes('/'+source.accession.replaceAll('-','')+'/'),'Invalid accession');
 const sec=u.hostname==='www.sec.gov'||u.hostname==='data.sec.gov';requireValue(sec||hosts[symbol].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)),'Not an official company source');
 if(sec)requireValue(u.pathname.includes('/'+Number(companyCiks[symbol])+'/')||u.pathname===`/submissions/CIK${companyCiks[symbol]}.json`,'Source CIK mismatch');
 requireValue(['10-K','10-Q','10-K/A','10-Q/A','IR','SEC-profile'].includes(source.form)&&['verified','unverified'].includes(source.verification),'Invalid source status');
 if(source.filedAt!==null)date(source.filedAt);requireValue(!source.form.startsWith('10-')||source.filedAt!==null,'Missing filing date');requireValue(typeof source.checkedAt==='string'&&/(Z|[+-]\d{2}:\d{2})$/.test(source.checkedAt)&&Number.isFinite(Date.parse(source.checkedAt))&&(source.filedAt===null||Date.parse(source.checkedAt)>=date(source.filedAt)),'Invalid source confirmation');
 requireValue(source.form.endsWith('/A')?typeof source.amends==='string'&&!!source.amends:source.amends===null,'Invalid amendment reference');
}
export function validatePeriod(p:FiscalPeriod){
 requireValue(Number.isInteger(p.fiscalYear)&&p.fiscalYear>=2000&&p.fiscalYear<=2100,'Invalid fiscal year');const start=date(p.start),end=date(p.end),days=(end-start)/86400000+1;
 requireValue(days>=1&&Number(p.end.slice(0,4))>=p.fiscalYear-1&&Number(p.end.slice(0,4))<=p.fiscalYear,'Fiscal year/date mismatch');
 requireValue(p.quarter===null||[1,2,3,4].includes(p.quarter),'Invalid fiscal quarter');
 requireValue(p.basis==='instant'?days===1:p.basis==='annual'?p.quarter===null&&days>=330&&days<=385&&Number(p.end.slice(0,4))===p.fiscalYear:p.basis==='quarter'?p.quarter!==null&&days>=60&&days<=110:p.basis==='ytd'?p.quarter!==null&&days>=84*p.quarter-7&&days<=98*p.quarter+7:false,'Invalid period basis or duration');
}
function periodKey(p:FiscalPeriod){return JSON.stringify([p.fiscalYear,p.quarter,p.basis,p.start,p.end]);}
export function calculateFcf(operating:FinancialFact,capex:FinancialFact):string {
 requireValue(operating.metric==='operatingCashFlow'&&capex.metric==='capitalExpenditure'&&operating.status==='verified'&&capex.status==='verified'&&operating.value!==null&&capex.value!==null&&operating.sourceId&&capex.sourceId,'Missing verified FCF inputs');
 requireValue(operating.origin.kind==='reported'&&capex.origin.kind==='reported'&&operating.currency===capex.currency&&operating.unit==='USD'&&capex.unit==='USD'&&periodKey(operating.period)===periodKey(capex.period),'Incompatible FCF inputs');
 requireValue(decimal(capex.value)>=0n,'Capex must be a positive cash outflow');return format(decimal(operating.value)-decimal(capex.value));
}
export function calculateDebt(parts:FinancialFact[]):string {
 requireValue(parts.length===3&&parts.map(p=>p.metric).join(',')==='debtCurrent,debtNoncurrent,commercialPaper','Invalid debt components');
 for(const p of parts)requireValue(p.status==='verified'&&p.value!==null&&p.sourceId&&p.origin.kind==='reported'&&p.unit==='USD'&&p.currency==='USD'&&p.period.basis==='instant'&&periodKey(p.period)===periodKey(parts[0].period)&&decimal(p.value)>=0n,'Incompatible debt inputs');
 return format(parts.reduce((sum,p)=>sum+decimal(p.value!),0n));
}
export function validateCompany(profile:CompanyProfile):CompanyProfile {
 requireValue(profile&&profile.kind==='company'&&Object.hasOwn(companyCiks,profile.symbol)&&profile.cik===companyCiks[profile.symbol],'Invalid company symbol or CIK');
 for(const s of [profile.name,profile.industry,profile.revenueModel,profile.tenSecondSummary])requireValue(typeof s==='string'&&!!s.trim(),'Missing profile text');
 for(const a of [profile.business,profile.segments,profile.risks])requireValue(Array.isArray(a)&&a.length&&a.every(s=>typeof s==='string'&&!!s.trim()),'Missing profile section');
 requireValue(profile.summaryKind==='editorial-from-official','Unclassified summary');
 const sources=new Map<string,OfficialSource>();for(const s of profile.sources){validateSource(s,profile.symbol);requireValue(!sources.has(s.id),'Duplicate source');sources.set(s.id,s);}
 for(const id of [profile.identitySourceId,profile.profileSourceId])requireValue(sources.get(id)?.verification==='verified','Profile requires verified source');
 for(const s of profile.sources)if(s.amends){const prior=sources.get(s.amends);requireValue(prior&&prior.id!==s.id&&s.filedAt&&prior.filedAt&&s.filedAt>=prior.filedAt&&s.form===prior.form+'/A','Invalid amendment chain');}
 requireValue(profile.financialCoverage&&!!profile.financialCoverage.reason.trim()&&profile.financialCoverage.status===(profile.financials.length?'partial':'not-reviewed'),'Invalid financial coverage');
 if(profile.financialAsOf)date(profile.financialAsOf);
 const facts=new Map<string,FinancialFact>(),keys=new Map<string,FinancialFact>();
 for(const f of profile.financials){
  requireValue(f.id&&!facts.has(f.id)&&metrics.includes(f.metric),'Invalid or duplicate financial fact');validatePeriod(f.period);
  requireValue(['assets','liabilities','equity','cashAndEquivalents','debt','debtCurrent','debtNoncurrent','commercialPaper'].includes(f.metric)?f.period.basis==='instant':f.period.basis!=='instant','Metric/period mismatch');
  requireValue(f.currency==='USD'&&f.unit===(f.metric==='dilutedEps'?'USD/share':'USD'),'Unit/currency mismatch');
  requireValue(['verified','unverified','missing'].includes(f.status),'Invalid fact status');
  if(f.status==='missing')requireValue(f.value===null&&typeof f.missingReason==='string'&&!!f.missingReason.trim()&&f.sourceId===null&&f.origin.kind==='reported'&&f.supersedes===null,'Invalid missing value');
  else {requireValue(f.value!==null&&f.missingReason===null,'Invalid present value');decimal(f.value);const source=sources.get(f.sourceId??'');requireValue(source&&source.filedAt&&source.filedAt>=f.period.end&&(f.status!=='verified'||source.verification==='verified'),'Missing verified financial source');}
  if(profile.financialAsOf){const s=sources.get(f.sourceId??'');requireValue(f.period.end<=profile.financialAsOf&&(!s?.filedAt||s.filedAt<=profile.financialAsOf),'After financial cutoff');}
  if(f.evidence){const e=f.evidence;requireValue(f.origin.kind==='reported'&&f.value!==null&&Number.isInteger(e.scale)&&e.scale>=0&&e.scale<=12&&decimal(e.rawValue)*10n**BigInt(e.scale)===decimal(f.value)&&e.unit===(f.unit==='USD/share'?'USD/shares':'USD')&&e.start===f.period.start&&e.end===f.period.end&&e.accession===sources.get(f.sourceId??'')?.accession&&Number.isInteger(e.reportFiscalYear)&&['FY','Q1','Q2','Q3','Q4'].includes(e.reportFiscalPeriod)&&!!e.contextRef&&e.concept==='us-gaap:'+(companyEvidenceConcepts[profile.symbol]?.[f.metric]??evidenceConcepts[f.metric]),'Invalid original evidence');}
  requireValue(f.origin.kind==='reported'||f.origin.kind==='calculated','Invalid fact origin');
  const key=JSON.stringify([f.metric,periodKey(f.period)]);const prior=keys.get(key);
  if(prior)requireValue(f.supersedes===prior.id&&sources.get(f.sourceId??'')?.amends===prior.sourceId,'Duplicate observation without explicit correction');else requireValue(f.supersedes===null,'Unknown correction');
  facts.set(f.id,f);keys.set(key,f);
 }
 for(const f of profile.financials)if(f.origin.kind==='calculated'){
  const debt=f.origin.formula==='debtCurrent + debtNoncurrent + commercialPaper';
  requireValue(f.metric===(debt?'debt':'freeCashFlow')&&f.status==='verified'&&(debt||f.origin.formula==='operatingCashFlow - capitalExpenditure')&&Array.isArray(f.origin.inputIds)&&f.origin.inputIds.length===(debt?3:2),'Unknown financial formula');
  const inputs=f.origin.inputIds.map(id=>facts.get(id));requireValue(inputs.every(Boolean),'Missing calculation inputs');const values=inputs as FinancialFact[];
  requireValue(profile.financials.some(x=>x.supersedes===f.id)||!profile.financials.some(x=>values.some(v=>x.supersedes===v.id)),'Superseded calculation inputs');
  requireValue(periodKey(f.period)===periodKey(values[0].period)&&f.currency===values[0].currency&&f.unit===values[0].unit&&f.sourceId===values[0].sourceId&&f.value!==null&&decimal(f.value)===decimal(debt?calculateDebt(values):calculateFcf(values[0],values[1])),'Calculation mismatch');
 }
 if(profile.dividends.status==='not-reviewed')requireValue(!!profile.dividends.reason,'Missing dividend reason');
 else {requireValue(profile.dividends.status==='verified'&&Array.isArray(profile.dividends.entries),'Invalid dividend status');const ids=new Set<string>();for(const d of profile.dividends.entries){requireValue(d.id&&!ids.has(d.id)&&d.currency==='USD'&&decimal(d.amountPerShare)>0n&&sources.get(d.sourceId)?.verification==='verified','Invalid official dividend');ids.add(d.id);requireValue(date(d.announced)<=date(d.exDate)&&date(d.exDate)<=date(d.recordDate)&&date(d.recordDate)<=date(d.paymentDate),'Invalid dividend dates');}}
 return profile;
}
