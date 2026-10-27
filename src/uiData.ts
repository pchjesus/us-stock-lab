import {candles,type Instrument} from './data';
import type {CandlestickData,Time} from 'lightweight-charts';
export const periods=['1분','5분','15분','30분','1시간','일','주','월'] as const;
export type Period=typeof periods[number];
export function aggregate(rows:CandlestickData<Time>[],key:(r:CandlestickData<Time>,i:number)=>string):CandlestickData<Time>[] {
 const out:CandlestickData<Time>[]=[];let last='';rows.forEach((r,i)=>{const k=key(r,i);if(k!==last){out.push({...r});last=k;}else{const a=out[out.length-1];a.high=Math.max(a.high,r.high);a.low=Math.min(a.low,r.low);a.close=r.close;}});return out;
}
export function chartRows(stock:Instrument,period:Period){
 const daily=candles(stock);if(period==='일')return daily;
 if(period==='주'||period==='월')return aggregate(daily,r=>{const d=new Date(String(r.time)+'T00:00:00Z');if(period==='월')return d.toISOString().slice(0,7);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);});
 const size=period==='1시간'?60:parseInt(period);const out:CandlestickData<Time>[]=[];
 for(const d of daily.slice(-5)){const start=nyInstant(String(d.time),570).getTime()/1000;const points=[d.open,d.high,d.low,d.close];let prev=d.open;const rows:CandlestickData<Time>[]=[];for(let i=0;i<390;i++){const end=i+1,seg=Math.min(2,Math.floor(end/130));const v=+(points[seg]+(points[seg+1]-points[seg])*((end-seg*130)/130)).toFixed(2);rows.push({time:(start+i*60) as Time,open:prev,close:v,high:Math.max(prev,v),low:Math.min(prev,v)});prev=v;}out.push(...aggregate(rows,(_r,i)=>String(Math.floor(i/size))));}return out;
}
export {marketSession} from './marketHours';
import {nyInstant} from './marketHours';
function iso(d:Date){return d.toISOString().slice(0,10);}
export function monthCells(year:number,month:number){const first=new Date(Date.UTC(year,month,1));first.setUTCDate(1-first.getUTCDay());return Array.from({length:42},(_,i)=>iso(new Date(first.getTime()+i*86400000)));}
export const metadata:Record<string,{exchange:string;industry:string;description:string;source:string}>={
 AAPL:{exchange:'NASDAQ',industry:'기기·서비스',description:'iPhone, Mac 등 기기와 디지털 서비스를 제공하는 기업입니다.',source:'https://www.apple.com/'},MSFT:{exchange:'NASDAQ',industry:'소프트웨어·클라우드',description:'Microsoft 365, Azure 등 소프트웨어와 클라우드 서비스를 제공합니다.',source:'https://www.microsoft.com/'},NVDA:{exchange:'NASDAQ',industry:'반도체·컴퓨팅',description:'GPU와 가속 컴퓨팅 플랫폼을 설계합니다.',source:'https://www.nvidia.com/'},AMZN:{exchange:'NASDAQ',industry:'유통·클라우드',description:'전자상거래와 AWS 클라우드 사업을 운영합니다.',source:'https://www.aboutamazon.com/'},GOOGL:{exchange:'NASDAQ',industry:'인터넷·광고',description:'Google 검색, 광고, 클라우드 등을 운영하는 Alphabet입니다.',source:'https://abc.xyz/'},VOO:{exchange:'NYSE Arca',industry:'미국 대형주 ETF',description:'S&P 500 지수를 추종하는 Vanguard ETF입니다.',source:'https://investor.vanguard.com/investment-products/etfs/profile/voo'},QQQ:{exchange:'NASDAQ',industry:'나스닥 100 ETF',description:'Nasdaq-100 지수를 추종하는 Invesco ETF입니다.',source:'https://www.invesco.com/qqq-etf/en/home.html'},SCHD:{exchange:'NYSE Arca',industry:'미국 배당주 ETF',description:'미국 배당주 지수를 추종하는 Schwab ETF입니다.',source:'https://www.schwabassetmanagement.com/products/schd'}};
export function indicatorSeries(value:number,count=90){return Array.from({length:count},(_,i)=>value*(1+.025*Math.sin(i*.23)-.0004*(count-1-i)-.025*Math.sin((count-1)*.23)));}
// Largest remainder display allocation: rounded labels always total 100.00%.
export function percentages(values:number[]){const total=values.reduce((s,v)=>s+BigInt(v),0n);if(!total)return values.map(()=>0);const units=values.map(v=>Number(BigInt(v)*10000n/total));const order=values.map((v,i)=>({i,r:BigInt(v)*10000n%total})).sort((a,b)=>a.r===b.r?a.i-b.i:a.r>b.r?-1:1);for(let n=10000-units.reduce((s,v)=>s+v,0),i=0;i<n;i++)units[order[i].i]++;return units.map(v=>v/100);}
