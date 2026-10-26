export type DataStatus='synthetic'|'official'|'pending';
export interface Indicator {id:string;name:string;value:number|null;unit:string;changePct:number|null;asOf:string|null;status:DataStatus}
export interface EconomicEvent {id:string;name:string;region:string;scheduledAt:string;importance:'high'|'medium'|'low';status:DataStatus;actual?:string;forecast?:string;previous?:string;source:string;url:string;interpretation?:string}
export interface NewsItem {id:string;title:string;source:string;publishedAt:string;url:string;summary:string}
export interface MarketSnapshot {indicators:Indicator[];events:EconomicEvent[];news:NewsItem[];mode:'demo'|'official-pending'}
export interface MarketInfoService {load():Promise<MarketSnapshot>}
export const officialSources=[
 {id:'bls',name:'BLS · 물가·고용',url:'https://www.bls.gov/schedule/',feed:'https://www.bls.gov/feed/bls_latest.rss'},
 {id:'fed',name:'연준 · 금리·정책',url:'https://www.federalreserve.gov/newsevents.htm',feed:'https://www.federalreserve.gov/feeds/press_all.xml'},
 {id:'bea',name:'BEA · GDP·PCE',url:'https://www.bea.gov/news/schedule'},
 {id:'fred',name:'FRED · 지표·발표 일정',url:'https://fred.stlouisfed.org/releases/calendar'},
 {id:'krx',name:'KRX · 한국 시장',url:'https://data.krx.co.kr/'}
] as const;
const reference='2026-10-23T07:00:00Z';
export const demoIndicators:Indicator[]=[
 ['sp500','S&P 500',5840.20,'pt',0.42],['nasdaq','Nasdaq',18420.10,'pt',0.68],['dow','Dow',42100.50,'pt',-0.15],['usdkrw','USD/KRW',1360,'원',0.12],['kospi','KOSPI',2650.30,'pt',0],['kosdaq','KOSDAQ',780.50,'pt',-0.23]
].map(([id,name,value,unit,changePct])=>({id:String(id),name:String(name),value:Number(value),unit:String(unit),changePct:Number(changePct),asOf:reference,status:'synthetic'}));
// Deliberately fictitious dates/values for UI examples; never official schedules.
export const demoEvents:EconomicEvent[]=[
 ['fomc','FOMC / Fed decision','2026-10-27T18:00:00Z','연준','https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm'],
 ['cpi','CPI · 소비자물가','2026-10-26T12:30:00Z','BLS','https://www.bls.gov/schedule/news_release/cpi.htm'],
 ['pce','PCE · 개인소비지출 물가','2026-10-25T12:30:00Z','BEA','https://www.bea.gov/news/schedule'],
 ['nfp','Nonfarm Payrolls · 비농업고용','2026-10-28T12:30:00Z','BLS','https://www.bls.gov/schedule/news_release/empsit.htm'],
 ['unemployment','Unemployment Rate · 실업률','2026-10-28T12:30:00Z','BLS','https://www.bls.gov/schedule/news_release/empsit.htm'],
 ['gdp','GDP · 국내총생산','2026-10-29T12:30:00Z','BEA','https://www.bea.gov/news/schedule'],
 ['ppi','PPI · 생산자물가','2026-10-30T12:30:00Z','BLS','https://www.bls.gov/schedule/news_release/ppi.htm'],
 ['retail','Retail Sales · 소매판매','2026-10-30T12:30:00Z','미국 Census','https://www.census.gov/retail/index.html']
].map(([id,name,scheduledAt,source,url])=>({id,name,scheduledAt,source,url,region:'미국',importance:'high',status:'synthetic',...(id==='pce'?{actual:'2.5% (가상)',forecast:'2.6% (가상)',previous:'2.7% (가상)',interpretation:'일반적으로 물가 상승률 둔화는 금리 기대에 영향을 줄 가능성이 있습니다. 이 결과는 교육용 가상 예시입니다.'}:{})}));
const clone=<T,>(value:T):T=>structuredClone(value);
export const demoMarketService:MarketInfoService={load:async()=>clone({indicators:demoIndicators,events:demoEvents,news:[],mode:'demo'})};
// Official ingestion belongs on a server (RSS normalization, licensing, caching,
// release revisions and UTC conversion). This adapter never relabels mock as official.
export const pendingOfficialService:MarketInfoService={load:async()=>({indicators:[],events:[],news:[],mode:'official-pending'})};
export const kstDate=(iso:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
export const kstTime=(iso:string)=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso))+' KST';
function dayNumber(iso:string){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso));const get=(key:string)=>Number(p.find(x=>x.type===key)!.value);return Date.UTC(get('year'),get('month')-1,get('day'))/86400000;}
export function eventPhase(event:EconomicEvent,now=new Date()):'예정'|'오늘'|'발표완료'|'발표 대기' {
 const today=dayNumber(now.toISOString()),day=dayNumber(event.scheduledAt);
 if(event.actual!==undefined&&Date.parse(event.scheduledAt)<=now.getTime())return '발표완료';
 if(day===today)return '오늘';return day>today?'예정':'발표 대기';
}
export function importantEvent(events:EconomicEvent[],now=new Date()):{event:EconomicEvent;label:string}|null {
 const today=dayNumber(now.toISOString());
 const candidates=events.filter(e=>e.importance==='high'&&Math.abs(dayNumber(e.scheduledAt)-today)<=1).sort((a,b)=>Math.abs(dayNumber(a.scheduledAt)-today)-Math.abs(dayNumber(b.scheduledAt)-today)||Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
 const event=candidates[0];if(!event)return null;
 const day=dayNumber(event.scheduledAt);return {event,label:day===today?'오늘 발표':day>today?'예정':event.actual!==undefined?'결과 요약':'발표 결과 확인 중'};
}
// Future domains, intentionally separate from the v0.2 USD-only execution engine.
export interface DividendEvent {symbol:string;exDate:string;payDate:string;amountCents:number;currency:'USD';source:DataStatus}
export interface FxObservation {base:'USD';quote:'KRW';rateDecimal:string;asOf:string;source:DataStatus}
