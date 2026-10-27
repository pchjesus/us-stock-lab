import calendar from './market-calendar.json' with {type:'json'};
export {calendar};
export interface MarketState {canTrade:boolean;state:'open'|'before'|'closed'|'holiday'|'unknown'|'halted';reason:string;serverNow?:string;openAt:string|null;closeAt:string|null;early:boolean;date:string}
const years:Record<string,{holidays:Record<string,string>;earlyCloses:string[]}>=calendar.years;
export function nyInstant(date:string,minutes:number){const noon=new Date(date+'T12:00:00Z');const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',hourCycle:'h23'}).formatToParts(noon);const hour=Number(parts.find(x=>x.type==='hour')!.value);return new Date(noon.getTime()+(minutes-hour*60)*60000);}
export function marketState(now=new Date()):MarketState {
 const unknown:MarketState={canTrade:false,state:'unknown',reason:'일정 미확인 · 지원 일정 2026~2027',openAt:null,closeAt:null,early:false,date:''};
 if(!Number.isFinite(now.getTime()))return {...unknown,reason:'시계 확인 필요'};
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),y=years[date.slice(0,4)];
 // No extrapolation beyond a complete, explicitly reviewed yearly contract.
 if(date<calendar.start||date>calendar.end||!y||Object.keys(y.holidays).length!==10||(!Array.isArray(y.earlyCloses)||y.earlyCloses.length!==(date.startsWith('2026')?2:1)))return unknown;
 const holiday=y.holidays[date]??([0,6].includes(new Date(date+'T00:00:00Z').getUTCDay())?'주말':null),early=y.earlyCloses.includes(date);
 if(holiday)return {...unknown,state:'holiday',reason:holiday,date};
 const open=nyInstant(date,570),close=nyInstant(date,early?780:960),state=now<open?'before':now<close?'open':'closed';
 return {canTrade:state==='open',state,reason:early?'조기폐장 · 09:30~13:00 ET':'정규장 · 09:30~16:00 ET',date,early,openAt:open.toISOString(),closeAt:close.toISOString()};
}
export function sessionText(s:MarketState,now:Date){
 const label={open:s.early?'장중 · 조기폐장':'장중',before:'개장 전',closed:'마감',holiday:'휴장',unknown:'일정 미확인',halted:'거래 중단'}[s.state];
 const fmt=(iso:string)=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso));
 let next=s.state==='open'?s.closeAt:s.state==='before'?s.openAt:null;
 if(!next&&(s.state==='closed'||s.state==='holiday')){for(let i=1;i<=12;i++){const date=new Date(s.date+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+i);const day=marketState(date);if(day.openAt){next=day.openAt;break;}if(day.state==='unknown')break;}}
 return {...s,label,detail:s.reason+(s.openAt&&s.closeAt?` · ${fmt(s.openAt)}~${fmt(s.closeAt)} KST`:'')+(next?` · ${s.state==='open'?'폐장':'다음 개장'} ${fmt(next)} (${Math.max(0,Math.ceil((Date.parse(next)-now.getTime())/60000))}분)`:'')};
}
export const marketSession=(now=new Date())=>sessionText(marketState(now),now);
// Use a monotonic elapsed interval from a server snapshot, never a browser wall-clock as server authority.
export function serverMarketState(market:MarketState|undefined,receivedAt:number|undefined,monotonicNow:number):MarketState {
 const unknown:MarketState={canTrade:false,state:'unknown',reason:'서버 운영 상태 확인 필요 · 계좌를 다시 조회하세요.',openAt:null,closeAt:null,early:false,date:''};
 const age=receivedAt===undefined?NaN:monotonicNow-receivedAt;
 if(!market||typeof market.canTrade!=='boolean'||!['open','before','closed','holiday','unknown','halted'].includes(market.state)||typeof market.reason!=='string'||(market.openAt!==null&&!Number.isFinite(Date.parse(market.openAt)))||(market.closeAt!==null&&!Number.isFinite(Date.parse(market.closeAt)))||!market.serverNow||!Number.isFinite(Date.parse(market.serverNow))||!Number.isFinite(age)||age<0||age>30000)return unknown;
 const now=Date.parse(market.serverNow)+age;
 if(market.canTrade&&(market.state!=='open'||!market.openAt||!market.closeAt||!Number.isFinite(Date.parse(market.openAt))||!Number.isFinite(Date.parse(market.closeAt))||now<Date.parse(market.openAt)||now>=Date.parse(market.closeAt)))return {...market,canTrade:false,state:'closed',reason:'정규장 마감 · 서버 확인 후 신규 주문 가능'};
 return market;
}
