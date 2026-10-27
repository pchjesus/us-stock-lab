import {instruments,quote} from './data';
import {applyTrade,emptyAccount,parseCents,type Account,type Trade} from './trading';
import {marketState,type MarketState} from './marketHours';
export const accountKey='us-stock-lab.account.v1';
interface Document { version:1; generation:string; trades:Trade[] }
export interface LoadedAccount { account:Account; token:string|null; market?:MarketState; receivedAt?:number }
export const marketPrices=()=>Object.fromEntries(instruments.map(s=>[s.symbol,parseCents(quote(s).price.toFixed(2))]));
export function decodeAccount(raw:string|null):LoadedAccount {
 if(raw===null)return {account:emptyAccount(),token:null};
 try {
 const doc:Document=JSON.parse(raw);if(doc.version!==1||typeof doc.generation!=='string'||!doc.generation||!Array.isArray(doc.trades))throw Error();
 let account=emptyAccount();
 for(const t of doc.trades){if(!t||typeof t.id!=='string'||typeof t.time!=='string'||!instruments.some(s=>s.symbol===t.symbol))throw Error();account=applyTrade(account,t);}
 return {account,token:raw};
 }catch{throw new Error('저장된 가상계좌가 손상되었거나 지원하지 않는 형식입니다. 원본은 보존했으며 확인 후 초기화할 수 있습니다.');}
}
export function loadAccount():LoadedAccount {try{return decodeAccount(localStorage.getItem(accountKey));}catch(e){if(e instanceof Error&&e.message.startsWith('저장된'))throw e;throw new Error('가상계좌 저장소를 읽을 수 없습니다. 브라우저 저장 설정을 확인하세요.');}}
export interface LocalOrder { id:string; symbol:string; side:'buy'|'sell'; quantity:number }
async function locked<T>(action:()=>T):Promise<T> {
 if(!navigator.locks)throw new Error('이 브라우저는 안전한 로컬 주문 잠금을 지원하지 않습니다. 최신 브라우저를 이용하세요.');
 return navigator.locks.request(accountKey,action);
}
function persist(doc:Document,enforceHours=false):LoadedAccount {
 const raw=JSON.stringify(doc);const result=decodeAccount(raw);
 if(enforceHours&&!marketState().canTrade)throw Error('정규장 외에는 신규 주문을 저장하지 않습니다.');
 try{localStorage.setItem(accountKey,raw);}catch{throw new Error('저장하지 못해 주문 또는 초기화를 반영하지 않았습니다. 저장 공간과 권한을 확인하세요.');}
 return result;
}
export function executeOrder(order:LocalOrder,expectedToken:string|null):Promise<LoadedAccount> {
 return locked(()=>{const latest=loadAccount();
 if(latest.account.trades.some(t=>t.id===order.id))throw new Error('중복 주문입니다.');
 if(latest.token!==expectedToken)throw new Error('다른 화면에서 계좌가 변경되었습니다. 새로고침 후 주문을 다시 확인하세요.');
 const price=marketPrices()[order.symbol];if(!price)throw new Error('검증된 합성 가격이 없는 종목입니다.');
 const now=new Date();const session=marketState(now);if(!session.canTrade)throw Error('신규 주문 제한: '+session.reason+' · 정규장에만 거래할 수 있습니다.');
 const trade:Trade={...order,price,time:now.toISOString()};applyTrade(latest.account,trade);
 const doc:Document=latest.token?JSON.parse(latest.token):{version:1,generation:crypto.randomUUID(),trades:[]};
 return persist({...doc,trades:[...doc.trades,trade]},true);});
}
export function resetAccount(expectedToken:string|null):Promise<LoadedAccount> {
 return locked(()=>{let raw:string|null;try{raw=localStorage.getItem(accountKey);}catch{throw new Error('저장소를 읽을 수 없어 초기화하지 않았습니다.');}
 if(raw!==expectedToken)throw new Error('계좌가 변경되었습니다. 새로고침 후 초기화를 다시 확인하세요.');
 return persist({version:1,generation:crypto.randomUUID(),trades:[]});});
}
