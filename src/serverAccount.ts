import {getAuthClient} from './auth';
import {applyTrade,emptyAccount,integer,type Trade} from './trading';
import type {LoadedAccount,LocalOrder} from './accountStore';
export interface ServerLoaded extends LoadedAccount {prices:Record<string,number>}
export function decodeSnapshot(raw:any):ServerLoaded {
 let account=emptyAccount();
 for(const t of raw.trades){const trade:Trade={...t,price:integer(Number(t.price)),quantity:integer(Number(t.quantity))};account=applyTrade(account,trade);}
 if(account.cash!==Number(raw.cash)||account.realized!==Number(raw.realized))throw Error('서버 계좌 원장 불일치');
 const positions=Object.fromEntries(raw.positions.map((p:any)=>[p.symbol,{quantity:integer(Number(p.quantity)),cost:integer(Number(p.cost),'원가',true)}]));
 if(Object.keys(positions).length!==Object.keys(account.holdings).length||Object.entries(account.holdings).some(([s,h])=>positions[s]?.quantity!==h.quantity||positions[s]?.cost!==h.cost))throw Error('서버 보유원가 불일치');
 return {account,token:raw.id,prices:Object.fromEntries(Object.entries(raw.prices).map(([s,p])=>[s,integer(Number(p))]))};
}
export async function serverSnapshot(){const r=await getAuthClient()!.rpc('paper_snapshot');if(r.error)throw Error('서버 계좌를 불러오지 못했습니다. 연결·인증을 확인하고 다시 조회하세요.');return decodeSnapshot(r.data);}
export function pendingOrder(uid:string):LocalOrder|null {try{return JSON.parse(localStorage.getItem('paper.pending.'+uid)??'null');}catch{return null;}}
export async function serverOrder(order:LocalOrder,uid:string){
 const key='paper.pending.'+uid;const pending=pendingOrder(uid);if(pending&&pending.id!==order.id)throw Error('진행 중인 '+pending.symbol+' 주문을 먼저 같은 주문 ID로 확인하세요.');
 localStorage.setItem(key,JSON.stringify(order));
 const client=getAuthClient()!;const session=await client.auth.getSession();if(session.error||session.data.session?.user.id!==uid)throw Error('인증이 변경되었거나 만료되었습니다. 같은 사용자로 다시 로그인하세요.');
 const r=await client.rpc('paper_order',{p_request_id:order.id,p_symbol:order.symbol,p_side:order.side,p_quantity:order.quantity}).setHeader('Authorization','Bearer '+session.data.session.access_token);
 if(!r.error){const result=decodeSnapshot(r.data);localStorage.removeItem(key);return result;}
 // Transport failures can occur after commit. Read back the SAME id; never mint a replacement.
 try{const snapshot=await serverSnapshot();if(snapshot.account.trades.some(t=>t.id===order.id)){localStorage.removeItem(key);return snapshot;}}catch{/* uncertain outcome remains pending */}
 const known=['insufficient_cash','insufficient_shares','invalid_order','unsupported_symbol','idempotency_conflict','unsafe_amount'];
 if(known.some(k=>r.error!.message.includes(k))){localStorage.removeItem(key);throw Error('주문이 거절되었습니다: '+r.error.message);}
 throw Error('체결 여부 확인 중입니다. 같은 주문으로 다시 확인하세요. 새 주문을 만들지 마세요.');
}
