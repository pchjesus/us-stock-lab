import {instruments} from './data';
import {amount,valuation,type Account} from './trading';
export interface AnalysisRow {id:string;label:string;kind:'주식'|'ETF'|'현금';sector:string;value:number;profit:number|null}
export interface AllocationMetrics {weights:number[];largest:number|null;topThree:number|null;hhi:number|null;investedWeight:number}
export type HistoricalMetric={status:'unavailable';reason:string}|{status:'available';value:number;unit:string;period:string;source:string};
export interface HistoryContract {source:'synthetic'|'licensed';currency:'USD';observations:ReadonlyArray<{date:string;totalValueCents:number;externalFlowCents:number}>}
export const unavailableHistory={status:'unavailable',reason:'검증된 기간별 평가액과 입출금 이력이 없어 계산하지 않습니다.'} satisfies HistoricalMetric;
export function allocationMetrics(values:readonly number[],cashIndex:number):AllocationMetrics {
 if(!values.length||!Number.isInteger(cashIndex)||cashIndex<0||cashIndex>=values.length||values.some(v=>!Number.isSafeInteger(v)||v<0))throw Error('유효하지 않은 구성입니다.');
 const total=values.reduce((sum,v)=>sum+BigInt(v),0n);if(total>BigInt(Number.MAX_SAFE_INTEGER))throw Error('분석 범위를 초과했습니다.');
 if(total===0n)return {weights:values.map(()=>0),largest:null,topThree:null,hhi:null,investedWeight:0};
 const totalNumber=Number(total),weights=values.map(v=>v/totalNumber*100),invested=values.reduce((sum,v,i)=>i===cashIndex?sum:sum+v,0),shares=values.filter((_,i)=>i!==cashIndex).map(v=>v/totalNumber*100).sort((a,b)=>b-a);
 return {weights,largest:invested?shares[0]:null,topThree:invested?shares.slice(0,3).reduce((a,b)=>a+b,0):null,hhi:invested?values.reduce((sum,v,i)=>i===cashIndex?sum:sum+(v/invested*100)**2,0):null,investedWeight:invested/totalNumber*100};
}
export function buildAnalysis(account:Account,prices:Record<string,number>){
 const summary=valuation(account,prices);const rows:AnalysisRow[]=Object.entries(account.holdings).map(([symbol,h])=>{const instrument=instruments.find(i=>i.symbol===symbol);if(!instrument)throw Error('분류되지 않은 보유종목이 있어 분석할 수 없습니다.');const value=amount(prices[symbol],h.quantity);return {id:symbol,label:instrument.name+' ('+symbol+')',kind:instrument.kind,sector:instrument.kind==='ETF'?'ETF 내부 섹터 미확인':instrument.sector,value,profit:value-h.cost}});
 rows.push({id:'cash',label:'현금',kind:'현금',sector:'현금',value:account.cash,profit:null});return {rows,summary,metrics:allocationMetrics(rows.map(r=>r.value),rows.length-1)};
}
/** Round to hundredths of a percent while retaining exactly 100%. */
export function initialBasisPoints(values:readonly number[]):number[]{
 if(values.some(v=>!Number.isSafeInteger(v)||v<0))throw Error('유효하지 않은 구성입니다.');
 const total=values.reduce((s,v)=>s+BigInt(v),0n);if(total>BigInt(Number.MAX_SAFE_INTEGER))throw Error('분석 범위를 초과했습니다.');if(!total)return values.map(()=>0);
 const pieces=values.map((v,i)=>{const scaled=BigInt(v)*10000n;return {i,whole:Number(scaled/total),remainder:scaled%total}});let left=10000-pieces.reduce((s,p)=>s+p.whole,0);for(const p of [...pieces].sort((a,b)=>a.remainder===b.remainder?a.i-b.i:a.remainder>b.remainder?-1:1)){if(left===0)break;p.whole++;left--}return pieces.map(p=>p.whole);
}
export function parseScenario(text:readonly string[]):number[]{const values=text.map(v=>{if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(v))throw Error('각 비중에 0~100의 숫자를 소수 둘째 자리까지 입력하세요.');const [whole,decimal='']=v.split('.');const n=Number(whole)*100+Number(decimal.padEnd(2,'0'));if(n>10000)throw Error('각 비중은 100%를 넘을 수 없습니다.');return n});if(values.reduce((a,b)=>a+b,0)!==10000)throw Error('비중 합계가 정확히 100%여야 비교할 수 있습니다.');return values}
