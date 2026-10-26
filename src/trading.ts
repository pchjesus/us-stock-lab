// Pure domain: integer USD cents; no React, storage or market dependencies.
export const INITIAL_CASH = 10_000_000;
export interface Holding { quantity:number; cost:number }
export interface Trade { id:string; symbol:string; side:'buy'|'sell'; quantity:number; price:number; time:string }
export interface LedgerEntry { tradeId:string; delta:number; balance:number }
export interface Account { cash:number; holdings:Record<string,Holding>; realized:number; trades:Trade[]; ledger:LedgerEntry[] }
export const emptyAccount=():Account=>({cash:INITIAL_CASH,holdings:{},realized:0,trades:[],ledger:[]});
export function integer(value:number, label='금액', allowZero=false):number {
 if(!Number.isSafeInteger(value)||value<(allowZero?0:1))throw new Error(`${label}은(는) 안전한 ${allowZero?'0 이상':'1 이상'} 정수여야 합니다.`);return value;
}
function safe(value:bigint):number { const n=Number(value);if(!Number.isSafeInteger(n))throw new Error('계산 범위를 초과했습니다.');return n; }
export const amount=(price:number,quantity:number)=>safe(BigInt(integer(price))*BigInt(integer(quantity,'수량')));
// Round half up in integer cents. Remaining basis stays with remaining shares.
export function allocatedCost(cost:number,quantity:number,total:number):number {
 integer(cost,'원가',true);integer(quantity,'수량');integer(total,'보유수량');if(quantity>total)throw new Error('보유수량을 초과했습니다.');
 return safe((BigInt(cost)*BigInt(quantity)*2n+BigInt(total))/(2n*BigInt(total)));
}
export function averageBuy(holding:Holding,price:number,quantity:number):Holding {
 integer(holding.quantity,'보유수량',true);integer(holding.cost,'원가',true);
 return {quantity:integer(holding.quantity+integer(quantity,'수량'),'수량'),cost:safe(BigInt(holding.cost)+BigInt(amount(price,quantity)))};
}
export function applyTrade(account:Account,trade:Trade):Account {
 if(!trade.id||account.trades.some(t=>t.id===trade.id))throw new Error('중복 주문입니다.');
 if(!trade.symbol||!['buy','sell'].includes(trade.side)||!Number.isFinite(Date.parse(trade.time)))throw new Error('잘못된 주문입니다.');
 const value=amount(trade.price,trade.quantity);const old=account.holdings[trade.symbol]??{quantity:0,cost:0};
 let next:Holding;let realized=account.realized;let delta:number;
 if(trade.side==='buy') {if(value>account.cash)throw new Error('현금잔고가 부족합니다.');next=averageBuy(old,trade.price,trade.quantity);delta=-value;}
 else {if(trade.quantity>old.quantity)throw new Error('보유수량을 초과했습니다.');const basis=allocatedCost(old.cost,trade.quantity,old.quantity);next={quantity:old.quantity-trade.quantity,cost:old.cost-basis};realized+=value-basis;delta=value;}
 const cash=account.cash+delta;integer(cash,'잔고',true);if(!Number.isSafeInteger(realized))throw new Error('손익 범위 초과');
 const holdings={...account.holdings};if(next.quantity)holdings[trade.symbol]=next;else delete holdings[trade.symbol];
 return {cash,holdings,realized,trades:[...account.trades,{...trade}],ledger:[...account.ledger,{tradeId:trade.id,delta,balance:cash}]};
}
export function valuation(account:Account,prices:Record<string,number>) {
 let value=0,cost=0;
 for(const [symbol,h] of Object.entries(account.holdings)){value+=amount(prices[symbol],h.quantity);cost+=h.cost;}
 integer(value,'평가액',true);integer(cost,'원금',true);const total=account.cash+value;integer(total,'총자산',true);
 return {value,cost,total,unrealized:value-cost,realized:account.realized,profit:total-INITIAL_CASH,returnPct:cost?(value-cost)/cost*100:0};
}
export function simulate(holding:Holding,price:number,quantity:number,mark:number) {
 const next=averageBuy(holding,price,quantity);const value=amount(mark,next.quantity);
 return {...next,needed:amount(price,quantity),value,unrealized:value-next.cost,returnPct:(value-next.cost)/next.cost*100};
}
export function parseQuantity(text:string):number {if(!/^\d+$/.test(text))throw new Error('수량은 1주 이상 정수로 입력하세요.');return integer(Number(text),'수량');}
export function parseCents(text:string):number {if(!/^\d+(\.\d{1,2})?$/.test(text))throw new Error('가격은 양수이며 소수 둘째 자리까지 입력하세요.');const [whole,decimal='']=text.split('.');return integer(safe(BigInt(whole)*100n+BigInt(decimal.padEnd(2,'0'))),'가격');}
export function averageText(holding:Holding):string {
 if(!holding.quantity)return '0.00';const cents=allocatedCost(holding.cost,1,holding.quantity);return `${Math.floor(cents/100)}.${String(cents%100).padStart(2,'0')}`;
}
