/**
 * v0.6 preparatory, PURE simulation math. DO NOT mutate v0.4/v0.5 paper ledgers
 * or run on the server as a privileged RPC without separate finance review.
 * All money is integer USD cents or KRW won. No browser/API dependencies.
 */
export const ANNUAL_STOCK_DEDUCTION_KRW=2_500_000;
export const DEFAULT_US_DIVIDEND_WITHHOLDING_BPS=1_500; // simplified Korean resident treaty assumption
export type FeeRule={rateBps:number;minCents:number};
export type CurrencyPair='USD/KRW';

function safe(value:bigint,name='금액'):number {
 const n=Number(value);
 if(!Number.isSafeInteger(n))throw Error(name+' 계산 범위를 초과했습니다.');
 return n;
}
function nonnegative(value:number,name:string):bigint{
 if(!Number.isSafeInteger(value)||value<0)throw Error(name+'은 0 이상 안전한 정수여야 합니다.');
 return BigInt(value);
}
function positive(value:number,name:string):bigint{
 const result=nonnegative(value,name);if(result===0n)throw Error(name+'은 0보다 커야 합니다.');return result;
}
function bps(value:number):bigint{
 if(!Number.isSafeInteger(value)||value<0||value>10_000)throw Error('세율·수수료율 범위를 벗어났습니다.');
 return BigInt(value);
}
function roundDivide(n:bigint,d:bigint):bigint{
 if(n<0n||d<=0n)throw Error('반올림 입력 오류');
 return (n*2n+d)/(2n*d); // nearest half-up
}
export function brokerFeeCents(tradeValueCents:number,rule:FeeRule):number{
 const amount=nonnegative(tradeValueCents,'주문금액');
 const minimum=nonnegative(rule.minCents,'최소 수수료');
 const fee=roundDivide(amount*bps(rule.rateBps),10_000n);
 return safe(fee>minimum?fee:minimum,'수수료');
}
/** Fixed-point KRW conversion; rate is KRW per USD (not the broker's exchange cost). */
export function usdCentsToKrw(cents:number,rateDecimal:string):number{
 const money=nonnegative(cents,'USD 센트');
 if(!/^\d{1,5}(\.\d{1,6})?$/.test(rateDecimal))throw Error('원화 환율 형식이 올바르지 않습니다.');
 const [whole,decimal='']=rateDecimal.split('.');
 const units=BigInt(whole)*1_000_000n+BigInt(decimal.padEnd(6,'0'));
 if(units<100n*1_000_000n||units>10_000n*1_000_000n)throw Error('비정상적인 USD/KRW 환율입니다.');
 return safe(roundDivide(money*units,100n*1_000_000n),'원화');
}
export interface RealizedKrwSale {
  /** KRW tax amounts at each actual purchase/sale settlement FX; no unrealized holdings. */
  year:number;
  proceedsKrw:number;
  acquisitionKrw:number;
  deductibleFeesKrw:number;
}
export interface EstimatedCapitalGainsTax{
 year:number;totalNetRealizedKrw:number;deductionKrw:number;
 taxableKrw:number;nationalKrw:number;localKrw:number;totalTaxKrw:number;
}
/** Educational estimate only, across this app's provided sale records. Not a tax return. */
export function estimateAnnualCapitalGainsTax(sales:readonly RealizedKrwSale[],year:number):EstimatedCapitalGainsTax{
 if(!Number.isSafeInteger(year)||year<2000||year>2100)throw Error('과세연도 형식 오류');
 let total=0n;
 for(const sale of sales){
  if(!Number.isSafeInteger(sale.year)||sale.year<2000||sale.year>2100)throw Error('양도연도 형식 오류');
  if(sale.year!==year)continue;
  total+=nonnegative(sale.proceedsKrw,'양도가액')-nonnegative(sale.acquisitionKrw,'취득가액')-nonnegative(sale.deductibleFeesKrw,'필요경비');
 }
 const taxable=total>BigInt(ANNUAL_STOCK_DEDUCTION_KRW)?total-BigInt(ANNUAL_STOCK_DEDUCTION_KRW):0n;
 const national=roundDivide(taxable*20n,100n);
 const local=roundDivide(taxable*2n,100n);
 return {
  year,totalNetRealizedKrw:safe(total,'연간 양도차익'),deductionKrw:total>0n?safe(total<BigInt(ANNUAL_STOCK_DEDUCTION_KRW)?total:BigInt(ANNUAL_STOCK_DEDUCTION_KRW)):0,
  taxableKrw:safe(taxable),nationalKrw:safe(national),localKrw:safe(local),totalTaxKrw:safe(national+local)
 };
}
export interface TimedTrade {symbol:string;side:'buy'|'sell';quantity:number;time:string}
export interface ConfirmedCashDividend {
 id:string;symbol:string;exDate:string;payDate:string;
 /** USD per share in units of $0.0001 (four decimal places) */
 amountUnits:number;
 sourceUrl:string;verified:true;type:'regular_cash';
}
function isoDay(value:string):boolean{
 return /^\d{4}-\d{2}-\d{2}$/.test(value)&&
 Number.isFinite(Date.parse(value+'T00:00:00Z'))&&
 new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
const nyDay=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
export function newYorkDate(instant:string):string {
 if(!/(?:Z|[+-]\d{2}:\d{2})$/.test(instant)||!Number.isFinite(Date.parse(instant)))throw Error('거래시각은 UTC/offset 지정값이어야 합니다.');
 const parts=nyDay.formatToParts(new Date(instant));
 const part=(type:string)=>parts.find(x=>x.type===type)?.value||'';
 return part('year')+'-'+part('month')+'-'+part('day');
}
export function validateConfirmedDividend(event:ConfirmedCashDividend):void{
 if(typeof event.id!=='string'||event.id.length<1||event.id.length>100||!/^[A-Z][A-Z0-9.]{0,14}$/.test(event.symbol)||
 !isoDay(event.exDate)||!isoDay(event.payDate)||event.payDate<event.exDate||
 event.verified!==true||event.type!=='regular_cash'||
 !Number.isSafeInteger(event.amountUnits)||event.amountUnits<=0||event.amountUnits>100_000_000)throw Error('배당 확정 자료 오류');
 try{const u=new URL(event.sourceUrl);if(u.protocol!=='https:'||!u.hostname)throw Error();}catch{throw Error('공식 출처 URL이 필요합니다.');}
}
/** Shares owned at the end of the NY trading day BEFORE the ex-dividend date. */
export function dividendEligibleShares(trades:readonly TimedTrade[],event:ConfirmedCashDividend):number{
 validateConfirmedDividend(event);
 let qty=0n;
 const prior=trades.filter(t=>t.symbol===event.symbol).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
 for(const t of prior){
  const day=newYorkDate(t.time);
  if(day>=event.exDate)continue;
  const n=positive(t.quantity,'거래수량');
  if(t.side==='buy')qty+=n;
  else if(t.side==='sell'){qty-=n;if(qty<0n)throw Error('배당 권리 계산 중 보유수량이 음수입니다.');}
  else throw Error('잘못된 거래구분');
 }
 return safe(qty,'배당권리 주식수');
}
export interface DividendProjection{
 eventId:string;eligibleShares:number;grossCents:number;withheldCents:number;netCents:number;payDate:string;due:boolean;
}
/** Projection only. Crediting MUST happen in an idempotent server transaction. */
export function projectDividend(trades:readonly TimedTrade[],event:ConfirmedCashDividend,todayNy:string,withholdingBps=DEFAULT_US_DIVIDEND_WITHHOLDING_BPS):DividendProjection{
 if(!isoDay(todayNy))throw Error('미국 기준일 오류');
 const shares=dividendEligibleShares(trades,event);
 const gross=roundDivide(BigInt(event.amountUnits)*BigInt(shares),100n);
 const withholding=roundDivide(gross*bps(withholdingBps),10_000n);
 return {eventId:event.id,eligibleShares:shares,grossCents:safe(gross),withheldCents:safe(withholding),netCents:safe(gross-withholding),payDate:event.payDate,due:todayNy>=event.payDate};
}
