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
 for(const d of daily.slice(-5)){const points=[d.open,d.high,d.low,d.close];let prev=d.open;const rows:CandlestickData<Time>[]=[];for(let i=0;i<390;i++){const end=i+1,seg=Math.min(2,Math.floor(end/130));const v=+(points[seg]+(points[seg+1]-points[seg])*((end-seg*130)/130)).toFixed(2);rows.push({time:((nyInstant(String(d.time),570).getTime()/1000)+i*60) as Time,open:prev,close:v,high:Math.max(prev,v),low:Math.min(prev,v)});prev=v;}out.push(...aggregate(rows,(_r,i)=>String(Math.floor(i/size))));}return out;
}
export function nyInstant(date:string,minutes:number){const noon=new Date(date+'T12:00:00Z');const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',hourCycle:'h23'}).formatToParts(noon);const hour=Number(parts.find(x=>x.type==='hour')!.value);return new Date(noon.getTime()+(minutes-hour*60)*60000);}
function iso(d:Date){return d.toISOString().slice(0,10);}
function nth(y:number,m:number,day:number,n:number){const d=new Date(Date.UTC(y,m,1));d.setUTCDate(1+(day-d.getUTCDay()+7)%7+7*(n-1));return iso(d);}
function observed(y:number,m:number,d:number){const x=new Date(Date.UTC(y,m,d));if(x.getUTCDay()===0)x.setUTCDate(d+1);if(x.getUTCDay()===6)x.setUTCDate(d-1);return iso(x);}
export function marketSession(now=new Date()){
 if(!Number.isFinite(now.getTime()))return {label:'시계 확인 필요',detail:'유효한 브라우저 시각이 없습니다.'};
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),y=Number(date.slice(0,4));
 if(![2026,2027].includes(y))return {label:'일정 미확인',detail:'지원 일정: 2026~2027. 공식 휴장일을 확인하세요.'};
 function schedule(day:string){const year=+day.slice(0,4);const holidays:Record<string,string>={[nth(year,0,1,3)]:'MLK Day',[nth(year,1,1,3)]:'대통령의 날',[observed(year,5,19)]:'Juneteenth',[observed(year,6,4)]:'독립기념일',[nth(year,8,1,1)]:'노동절',[nth(year,10,4,4)]:'추수감사절',[observed(year,11,25)]:'성탄절'};
 const jan=new Date(Date.UTC(year,0,1));holidays[iso(jan.getUTCDay()===0?new Date(Date.UTC(year,0,2)):jan)]='새해';
 const memorial=new Date(Date.UTC(year,5,0));memorial.setUTCDate(memorial.getUTCDate()-(memorial.getUTCDay()+6)%7);holidays[iso(memorial)]='메모리얼 데이';
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;const easter=new Date(Date.UTC(year,Math.floor(n/31)-1,n%31+1));easter.setUTCDate(easter.getUTCDate()-2);holidays[iso(easter)]='성금요일';
 const dt=new Date(day+'T00:00:00Z');const reason=holidays[day]??([0,6].includes(dt.getUTCDay())?'주말':null);const thanks=new Date(nth(year,10,4,4)+'T00:00:00Z');thanks.setUTCDate(thanks.getUTCDate()+1);
 const early=day===iso(thanks)||day===`${year}-12-24`||day===`${year}-07-03`;return {reason,close:early?780:960};}
 const s=schedule(date),open=nyInstant(date,570),close=nyInstant(date,s.close);let next=open,label='개장 전';
 if(s.reason||now>=close){label=s.reason?'휴장':'마감';const d=new Date(date+'T00:00:00Z');for(let j=1;j<12;j++){d.setUTCDate(d.getUTCDate()+1);if(!schedule(iso(d)).reason){next=nyInstant(iso(d),570);break;}}}else if(now>=open){label=s.close===780?'장중 · 조기폐장':'장중';next=close;}
 const fmt=(v:Date)=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(v);
 return {label,detail:`${s.reason??'정규장'} · ${fmt(open)}~${fmt(close)} KST · ${label.startsWith('장중')?'폐장':'다음 개장'} ${fmt(next)} (${Math.max(0,Math.ceil((next.getTime()-now.getTime())/60000))}분)`};
}
export function monthCells(year:number,month:number){const first=new Date(Date.UTC(year,month,1));first.setUTCDate(1-first.getUTCDay());return Array.from({length:42},(_,i)=>iso(new Date(first.getTime()+i*86400000)));}
export const metadata:Record<string,{exchange:string;industry:string;description:string;source:string}>={
 AAPL:{exchange:'NASDAQ',industry:'기기·서비스',description:'iPhone, Mac 등 기기와 디지털 서비스를 제공하는 기업입니다.',source:'https://www.apple.com/'},MSFT:{exchange:'NASDAQ',industry:'소프트웨어·클라우드',description:'Microsoft 365, Azure 등 소프트웨어와 클라우드 서비스를 제공합니다.',source:'https://www.microsoft.com/'},NVDA:{exchange:'NASDAQ',industry:'반도체·컴퓨팅',description:'GPU와 가속 컴퓨팅 플랫폼을 설계합니다.',source:'https://www.nvidia.com/'},AMZN:{exchange:'NASDAQ',industry:'유통·클라우드',description:'전자상거래와 AWS 클라우드 사업을 운영합니다.',source:'https://www.aboutamazon.com/'},GOOGL:{exchange:'NASDAQ',industry:'인터넷·광고',description:'Google 검색, 광고, 클라우드 등을 운영하는 Alphabet입니다.',source:'https://abc.xyz/'},VOO:{exchange:'NYSE Arca',industry:'미국 대형주 ETF',description:'S&P 500 지수를 추종하는 Vanguard ETF입니다.',source:'https://investor.vanguard.com/investment-products/etfs/profile/voo'},QQQ:{exchange:'NASDAQ',industry:'나스닥 100 ETF',description:'Nasdaq-100 지수를 추종하는 Invesco ETF입니다.',source:'https://www.invesco.com/qqq-etf/en/home.html'},SCHD:{exchange:'NYSE Arca',industry:'미국 배당주 ETF',description:'미국 배당주 지수를 추종하는 Schwab ETF입니다.',source:'https://www.schwabassetmanagement.com/products/schd'}};
export function indicatorSeries(value:number,count=90){return Array.from({length:count},(_,i)=>value*(1+.025*Math.sin(i*.23)-.0004*(count-1-i)-.025*Math.sin((count-1)*.23)));}
// Largest remainder display allocation: rounded labels always total 100.00%.
export function percentages(values:number[]){const total=values.reduce((s,v)=>s+BigInt(v),0n);if(!total)return values.map(()=>0);const units=values.map(v=>Number(BigInt(v)*10000n/total));const order=values.map((v,i)=>({i,r:BigInt(v)*10000n%total})).sort((a,b)=>a.r===b.r?a.i-b.i:a.r>b.r?-1:1);for(let n=10000-units.reduce((s,v)=>s+v,0),i=0;i<n;i++)units[order[i].i]++;return units.map(v=>v/100);}
