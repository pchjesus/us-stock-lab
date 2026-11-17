import {candles,instruments} from './data';
import {buildAnalysis,initialBasisPoints} from './portfolioAnalysis';
import type {AccountView} from './TradingUI';
export const symbols=instruments.map(s=>s.symbol);
export const history=instruments.map(s=>candles(s).map(c=>({date:String(c.time),price:Math.round(Number(c.close)*100)})));
export const dates=history[0].map(c=>c.date);
export interface BacktestConfig {start:string;end:string;initialCents:number;monthlyCents:number;weights:number[]}
export interface Point {date:string;flow:number;contributions:number;cash:number;value:number;units:number[];returnIndex:number;drawdown:number}
export interface BacktestResult {points:Point[];contributed:number;cash:number;value:number;returnPct:number;mdd:number;first:string;last:string}
const safe=(n:bigint)=>{if(n>BigInt(Number.MAX_SAFE_INTEGER)||n<0n)throw Error('계산 가능한 금액 범위를 초과했습니다.');return Number(n)};
const positive=(n:number)=>Number.isSafeInteger(n)&&n>0;
function nextMonth(date:string,offset:number){const [y,m,d]=date.split('-').map(Number),first=new Date(Date.UTC(y,m-1+offset,1)),end=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();first.setUTCDate(Math.min(d,end));return first.toISOString().slice(0,10)}
export function runBacktest(c:BacktestConfig):BacktestResult {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(c.start)||!/^\d{4}-\d{2}-\d{2}$/.test(c.end)||!Number.isFinite(Date.parse(c.start+'T00:00:00Z'))||!Number.isFinite(Date.parse(c.end+'T00:00:00Z'))||new Date(c.start+'T00:00:00Z').toISOString().slice(0,10)!==c.start||new Date(c.end+'T00:00:00Z').toISOString().slice(0,10)!==c.end||c.start<dates[0]||c.end>dates.at(-1)!||c.start>c.end)throw Error('합성 데이터 범위 안의 올바른 시작일과 종료일을 선택하세요.');
 if(!positive(c.initialCents)||!Number.isSafeInteger(c.monthlyCents)||c.monthlyCents<0)throw Error('초기 투자금은 양수, 월 적립금은 0 이상의 센트 정수여야 합니다.');
 if(c.weights.length!==symbols.length+1||c.weights.some(n=>!Number.isInteger(n)||n<0||n>10000)||c.weights.reduce((a,b)=>a+b,0)!==10000||!c.weights.slice(0,-1).some(n=>n>0))throw Error('종목을 하나 이상 선택하고 현금 포함 비중 합계를 100%로 맞추세요.');
 if(history.some(h=>h.length!==dates.length||h.some((p,i)=>p.date!==dates[i]||!positive(p.price))))throw Error('종목별 합성 이력의 날짜 또는 가격이 일치하지 않습니다.');
 const first=dates.findIndex(d=>d>=c.start);let last=dates.length-1;while(last>=0&&dates[last]>c.end)last--;if(first<0||last<=first)throw Error('최소 두 개의 합성 거래일이 필요합니다.');
 let cash=0,contributed=0,units=symbols.map(()=>0),index=1,peak=1,mdd=0,previous=0,month=1,next=nextMonth(c.start,month);const points:Point[]=[];
 for(let day=first;day<=last;day++){
  const current=dates[day];let flow=day===first?c.initialCents:0;
  while(c.monthlyCents&&next<=current){flow=safe(BigInt(flow)+BigInt(c.monthlyCents));next=nextMonth(c.start,++month)}
  const before=safe(BigInt(cash)+units.reduce((sum,u,i)=>sum+BigInt(u)*BigInt(history[i][day].price),0n));
  if(day!==first){if(previous<=0)throw Error('직전 평가액이 0이어서 수익률을 계산할 수 없습니다.');index*=before/previous;if(!Number.isFinite(index))throw Error('수익률 범위 초과');peak=Math.max(peak,index);mdd=Math.min(mdd,index/peak-1)}
  cash=safe(BigInt(cash)+BigInt(flow));contributed=safe(BigInt(contributed)+BigInt(flow));
  for(let i=0;i<symbols.length;i++){const budget=BigInt(flow)*BigInt(c.weights[i])/10000n;const count=budget/BigInt(history[i][day].price),cost=count*BigInt(history[i][day].price);cash=safe(BigInt(cash)-cost);units[i]=safe(BigInt(units[i])+count)}
  const value=safe(BigInt(cash)+units.reduce((sum,u,i)=>sum+BigInt(u)*BigInt(history[i][day].price),0n));points.push({date:current,flow,contributions:contributed,cash,value,units:[...units],returnIndex:index,drawdown:index/peak-1});previous=value;
 }
 return {points,contributed,cash,value:previous,returnPct:index-1,mdd,first:dates[first],last:dates[last]};
}
export function copyAccountWeights(view:AccountView):number[]{if(view.error||!view.loaded)throw Error('가상계좌를 정상적으로 불러온 후 복사할 수 있습니다.');const rows=buildAnalysis(view.loaded.account,view.prices).rows;const values=[...symbols.map(s=>rows.find(r=>r.id===s)?.value??0),rows.find(r=>r.id==='cash')!.value];if(values.every(v=>v===0))throw Error('총자산이 0인 계좌의 비중은 복사할 수 없습니다.');if(values.slice(0,-1).every(v=>v===0))throw Error('현재 계좌는 현금만 보유하고 있습니다. 백테스트할 종목 비중을 직접 입력하세요.');return initialBasisPoints(values)}
