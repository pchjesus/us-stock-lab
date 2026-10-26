import type { CandlestickData, Time } from 'lightweight-charts';
export const asOf = '2026-10-23';
export const instruments = [
 {symbol:'AAPL',name:'애플',kind:'주식',sector:'기술',base:220},
 {symbol:'MSFT',name:'마이크로소프트',kind:'주식',sector:'기술',base:420},
 {symbol:'NVDA',name:'엔비디아',kind:'주식',sector:'반도체',base:135},
 {symbol:'AMZN',name:'아마존',kind:'주식',sector:'소비재',base:190},
 {symbol:'GOOGL',name:'알파벳',kind:'주식',sector:'커뮤니케이션',base:170},
 {symbol:'VOO',name:'Vanguard S&P 500 ETF',kind:'ETF',sector:'미국 대형주',base:510},
 {symbol:'QQQ',name:'Invesco QQQ ETF',kind:'ETF',sector:'나스닥 100',base:490},
 {symbol:'SCHD',name:'Schwab US Dividend Equity ETF',kind:'ETF',sector:'배당주',base:28},
] as const;
export type Instrument = typeof instruments[number];
export function candles(stock:Instrument):CandlestickData<Time>[] {
 const rows:CandlestickData<Time>[]=[]; let previous:number=stock.base;
 for(let i=0;i<90;i++){const date=new Date(Date.UTC(2026,5,22+i)); if([0,6].includes(date.getUTCDay()))continue;
 const open=previous; const close=+(open*(1+Math.sin(i*1.7+stock.base)*0.012+0.0006)).toFixed(2);
 rows.push({time:date.toISOString().slice(0,10),open,close,high:+(Math.max(open,close)*1.008).toFixed(2),low:+(Math.min(open,close)*0.992).toFixed(2)});previous=close;}
 return rows;
}
export const quote=(s:Instrument)=>{const c=candles(s);const last=c[c.length-1]; const prev=c[c.length-2];return {price:last.close,change:(last.close/prev.close-1)*100,date:String(last.time)}};
// Future server-owned contracts. No client balance calculation or order execution in Week 1.
export interface VirtualAccount { id:string; userId:string; baseCurrency:'USD'; cashMinorUnits:string }
export interface OrderRequest { accountId:string; instrumentId:string; side:'buy'|'sell'; quantity:string; idempotencyKey:string }
export interface Position { accountId:string; instrumentId:string; quantity:string; costBasisMinorUnits:string }
export interface CorporateAction { instrumentId:string; effectiveDate:string; type:'dividend'|'split'; value:string }
export interface FxRate { base:'USD'; quote:'KRW'; rate:string; asOf:string; source:'synthetic' }
