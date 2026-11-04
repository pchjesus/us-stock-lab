import {instruments, type Instrument} from './data.ts';

export type SecurityType='common-stock'|'ETF'|'ADR'|'preferred'|'warrant'|'other'|'unknown';
export interface CatalogEntry {
 id:string; symbol:string; name:string; exchange:string; cik:string|null;
 securityType:SecurityType; listingStatus:'verified'|'unverified'|'delisted';
 sourceUrl:string; sourceAsOf:string|null; checkedAt:string;
 searchable:boolean; detailAvailability:'basic'|'none'; tradeEligible:false;
}
export const SEC_SOURCE='https://www.sec.gov/files/company_tickers_exchange.json';
export function normalizeSymbol(value:string):string {return value.trim().toUpperCase();}
export function searchCatalog(entries:readonly CatalogEntry[],query:string,limit=50):CatalogEntry[] {
 const q=query.trim().toLocaleUpperCase('en-US');if(!q || !Number.isSafeInteger(limit) || limit<1)return [];
 return entries.filter(e=>e.searchable&&(e.symbol.includes(q)||e.name.toLocaleUpperCase('en-US').includes(q))).slice(0,Math.min(limit,100));
}
// Symbol is not a security identifier. This is an explicit bridge to the pre-existing
// eight instruments only; callers must independently validate exchange/identity.
export function existingInstrument(symbol:string):Instrument|undefined {
 const canonical=normalizeSymbol(symbol);return instruments.find(item=>item.symbol===canonical);
}
export function normalizeSec(raw:unknown,checkedAt:string,sourceAsOf:string|null,options?:{includeIssues?:boolean}) {
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(checkedAt)||!Number.isFinite(Date.parse(checkedAt))||new Date(checkedAt).toISOString().replace('.000Z','Z')!==checkedAt)throw Error('Invalid checkedAt');
 if(sourceAsOf!==null&&(!/^\d{4}-\d\d-\d\d$/.test(sourceAsOf)||!Number.isFinite(Date.parse(sourceAsOf+'T00:00:00Z'))||new Date(sourceAsOf+'T00:00:00Z').toISOString().slice(0,10)!==sourceAsOf))throw Error('Invalid sourceAsOf');
 if(!raw||typeof raw!=='object')throw Error('Invalid source');
 const {fields,data}=raw as {fields:unknown;data:unknown};
 if(!Array.isArray(fields)||!Array.isArray(data)||fields.join('|')!=='cik|name|ticker|exchange')throw Error('Invalid SEC schema');
 const groups=new Map<string,{entry:CatalogEntry;row:number}[]>();let excluded=0,duplicates=0;
 const issues:{row:number;reason:string;id?:string}[]=[];
 for(const [index,row] of data.entries()){
  if(!Array.isArray(row)||row.length!==4){excluded++;issues.push({row:index,reason:'invalid-row-shape'});continue;}
  const [cik,name,ticker,exchange]=row;
  let reason='';
  if(!Number.isSafeInteger(cik)||cik<1||cik>9999999999)reason='invalid-cik';
  else if(typeof name!=='string'||!name.trim()||/[\u0000-\u001f\u007f]/.test(name))reason='invalid-name';
  else if(typeof ticker!=='string')reason='invalid-symbol';
  else if(typeof exchange!=='string'||!exchange.trim()||!/^[A-Za-z0-9 .&'\-]+$/.test(exchange.trim()))reason='invalid-exchange';
  if(reason){excluded++;issues.push({row:index,reason});continue;}
  const symbol=normalizeSymbol(ticker),market=exchange.trim();
  if(!/^[A-Z0-9]+(?:[.\-/][A-Z0-9]+)*$/.test(symbol)){excluded++;issues.push({row:index,reason:'invalid-symbol'});continue;}
  const id=market.toUpperCase()+':'+symbol;
  const entry:CatalogEntry={id,symbol,name:name.trim(),exchange:market,cik:String(cik).padStart(10,'0'),securityType:'unknown',listingStatus:'unverified',sourceUrl:SEC_SOURCE,sourceAsOf,checkedAt,searchable:true,detailAvailability:'basic',tradeEligible:false};
  const group=groups.get(id)||[];group.push({entry,row:index});groups.set(id,group);
 }
 const entries:CatalogEntry[]=[];let held=0;
 for(const group of groups.values()){
  const first=JSON.stringify(group[0].entry);
  if(group.some(x=>JSON.stringify(x.entry)!==first)){held+=group.length;for(const x of group)issues.push({row:x.row,reason:'candidate-id-conflict',id:x.entry.id});continue;}
  duplicates+=group.length-1;for(const x of group.slice(1))issues.push({row:x.row,reason:'duplicate',id:x.entry.id});entries.push(group[0].entry);
 }
 entries.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 issues.sort((a,b)=>a.row-b.row);
 return {entries,counts:{input:data.length,normalized:entries.length,excluded,held,duplicates},...(options?.includeIssues?{issues}:{})};
}
