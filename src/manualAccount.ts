import {getAuthClient} from './auth';
import {brokerFeeCents,newYorkDate} from './paperFinance';
import {allocatedCost,amount,integer,type Holding} from './trading';
import {instruments} from './data';
import type {MarketState} from './marketHours';
export type ManualInput={symbol:string;side:'buy'|'sell';quantity:number;priceCents:number;rateBps:number;minCents:number;source:string;observedAt:string};
export type ManualRequest={id:string;order:ManualInput;revision?:number;policyVersion?:number};
export type ManualState={id:string;cash:number;realized:number;fees:number;holdings:Record<string,Holding>;orders:any[];ledger:any[];market:MarketState;receivedAt:number;token:string;revision:number|null;feePolicy:{version:number;rateBps:number;minCents:number}|null;dividends:any[];events:any[];entitlements:any[];delivery:any[];gross:number;withheld:number;net:number};
export class ManualDataError extends Error {constructor(public raw:unknown){super('수기 계좌 응답/원장 불일치. 원본을 수정하지 않았습니다.');}}
export function cents(v:unknown,signed=false):number {if(!['number','string'].includes(typeof v)||!new RegExp(signed?'^-?\\d+$':'^\\d+$').test(String(v)))throw Error('정수 형식 오류');const n=Number(v);if(!Number.isSafeInteger(n)||(!signed&&n<0))throw Error('정수 범위 오류');return n;}
export function validateManualInput(o:ManualInput){
 if(!instruments.some(s=>s.symbol===o.symbol)||!['buy','sell'].includes(o.side)||!o.source.trim()||o.source.length>200||!/(Z|[+-]\d{2}:\d{2})$/.test(o.observedAt)||!Number.isFinite(Date.parse(o.observedAt)))throw Error('출처·관측시각·종목을 확인하세요.');
 integer(o.quantity);integer(o.priceCents);if(o.quantity>1e9||o.priceCents>1e8)throw Error('가격·수량 상한 초과');
 brokerFeeCents(0,{rateBps:o.rateBps,minCents:o.minCents});if(o.minCents>99999999)throw Error('최소 수수료 상한 초과');
}
export function preview(a:Pick<ManualState,'cash'|'holdings'>,o:ManualInput){
 validateManualInput(o);
 const value=amount(o.priceCents,o.quantity),fee=brokerFeeCents(value,{rateBps:o.rateBps,minCents:o.minCents});if(o.minCents>99999999)throw Error('최소 수수료 상한 초과');
 const h=a.holdings[o.symbol]??{quantity:0,cost:0};if(o.side==='sell'&&o.quantity>h.quantity)throw Error('보유수량 초과');
 const basis=o.side==='sell'?allocatedCost(h.cost,o.quantity,h.quantity):0,delta=o.side==='buy'?-(value+fee):value-fee;
 const cash=a.cash+delta;if(cash<0)throw Error('현금잔고 부족');integer(cash,'잔고',true);return {value,fee,basis,delta,cash};
}
export function decodeManual(raw:any):ManualState {try{
 if(!raw||typeof raw.id!=='string'||!raw.id||!Array.isArray(raw.orders)||!Array.isArray(raw.positions)||!Array.isArray(raw.ledger))throw Error();
 const a:ManualState={id:raw.id,cash:10000000,realized:0,fees:0,holdings:{},orders:raw.orders,ledger:raw.ledger,market:raw.market,receivedAt:performance.now(),token:'',revision:raw.revision===undefined?null:cents(raw.revision),feePolicy:null,dividends:raw.dividends??[],events:raw.dividend_events??[],entitlements:raw.entitlements??[],delivery:raw.dividend_status??[],gross:0,withheld:0,net:0};
 if(raw.fee_policy!==undefined){const f=raw.fee_policy;if(!f||f.account_id!==a.id||cents(f.version)<1||!Array.isArray(raw.fee_policies))throw Error();brokerFeeCents(1,{rateBps:cents(f.rate_bps),minCents:cents(f.min_cents)});const policies=new Map<number,any>();for(const p of raw.fee_policies){if(p.account_id!==a.id||cents(p.version)!==policies.size+1)throw Error();brokerFeeCents(1,{rateBps:cents(p.rate_bps),minCents:cents(p.min_cents)});policies.set(cents(p.version),p);}const current=policies.get(cents(f.version));if(!current||cents(current.rate_bps)!==cents(f.rate_bps)||cents(current.min_cents)!==cents(f.min_cents))throw Error();a.feePolicy={version:cents(f.version),rateBps:cents(f.rate_bps),minCents:cents(f.min_cents)};for(const o of raw.orders)if(o.fee_policy_version!=null){const p=policies.get(cents(o.fee_policy_version));if(!p||cents(o.payload.rateBps)!==cents(p.rate_bps)||cents(o.payload.minCents)!==cents(p.min_cents))throw Error();}}
 const ids=new Set<string>(),requestIds=new Set<string>();let seq=0,tradeIndex=0,last=0;const credits=new Map<string,any>(),eventIds=new Set<string>();
 if(![a.dividends,a.events,a.entitlements,a.delivery].every(Array.isArray))throw Error();
 const eventKeys=new Set<string>(),entitlementKeys=new Set<string>(),deliveryKeys=new Set<string>();
 for(const e of a.events){if(typeof e.id!=='string'||!e.id||eventKeys.has(e.id)||!instruments.some(s=>s.symbol===e.symbol)||e.kind!=='regular_cash'||e.standard_tax!==true||!['confirmed','review'].includes(e.status)||!/^https:\/\//.test(e.source_url)||!Number.isFinite(Date.parse(e.verified_at))||cents(e.version)<1||cents(e.amount_units)<1||cents(e.amount_units)>100000000)throw Error();eventKeys.add(e.id);for(const key of ['announced','ex_date','record_date','pay_date']){if(!/^\d{4}-\d{2}-\d{2}$/.test(e[key])||new Date(e[key]+'T00:00:00Z').toISOString().slice(0,10)!==e[key])throw Error();}if(e.announced>e.ex_date||e.ex_date>e.record_date||e.record_date>e.pay_date)throw Error();}
 for(const t of a.entitlements){if(t.account_id!==a.id||!eventKeys.has(t.event_id)||entitlementKeys.has(t.event_id)||cents(t.eligible_quantity)>1000000000||cents(t.event_version)<1)throw Error();entitlementKeys.add(t.event_id);}
 for(const d of a.delivery){if(d.account_id!==a.id||!eventKeys.has(d.event_id)||deliveryKeys.has(d.event_id)||!['pending','paid','zero','error'].includes(d.state))throw Error();deliveryKeys.add(d.event_id);}

 for(const c of a.dividends){
  if(!c.id||credits.has(c.id)||eventIds.has(c.event_id)||c.account_id!==a.id)throw Error();
  const e=a.events.find(e=>e.id===c.event_id),t=a.entitlements.find(t=>t.event_id===c.event_id&&t.account_id===a.id);
  if(!e||e.kind!=='regular_cash'||!e.standard_tax||!/^https:\/\//.test(e.source_url)||!t||cents(t.eligible_quantity)!==cents(c.quantity)||cents(t.event_version)!==cents(c.event_version)||cents(c.amount_units)!==cents(e.amount_units)||newYorkDate(c.posted_at)<e.pay_date)throw Error();
  const gross=cents(Number((BigInt(cents(c.quantity))*BigInt(cents(c.amount_units))+50n)/100n)),tax=cents(Number((BigInt(gross)*15n+50n)/100n));
  if(gross<=0||cents(c.gross_cents)!==gross||cents(c.withholding_cents)!==tax||cents(c.net_cents)!==gross-tax||gross-tax<=0)throw Error();
  credits.set(c.id,c);eventIds.add(c.event_id);
 }
 if(raw.ledger.length!==raw.orders.length+credits.size+1)throw Error();
 for(const [i,l] of raw.ledger.entries()){
  if(l.account_id!==a.id||cents(l.id)<=last)throw Error();last=cents(l.id);
  if(i===0){if(l.kind!=='initial_funding'||l.order_id!==null||l.dividend_credit_id!=null||cents(l.delta_cents,true)!==10000000||cents(l.balance_cents)!==10000000)throw Error();continue;}
  if(l.kind==='dividend'){
   const c=credits.get(l.dividend_credit_id);if(!c||l.order_id!==null||cents(l.delta_cents,true)!==cents(c.net_cents))throw Error();credits.delete(l.dividend_credit_id);
   a.cash+=cents(c.net_cents);a.gross+=cents(c.gross_cents);a.withheld+=cents(c.withholding_cents);a.net+=cents(c.net_cents);
   if(![a.cash,a.gross,a.withheld,a.net].every(Number.isSafeInteger)||cents(l.balance_cents)!==a.cash)throw Error();continue;
  }
  if(l.kind!=='trade'||l.dividend_credit_id!=null)throw Error();const r=raw.orders[tradeIndex++];
  if(!r||l.order_id!==r.id||r.account_id!==raw.id||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.request_id!=='string'||!r.request_id||requestIds.has(r.request_id)||cents(r.execution_seq)<=seq)throw Error();ids.add(r.id);requestIds.add(r.request_id);seq=cents(r.execution_seq);
 const o:ManualInput={...r.payload,quantity:cents(r.quantity),priceCents:cents(r.price_cents)};
 if(o.symbol!==r.symbol||o.side!==r.side||cents(r.payload.quantity)!==o.quantity||cents(r.payload.priceCents)!==o.priceCents||o.source!==r.source||Date.parse(o.observedAt)!==Date.parse(r.observed_at)||![r.received_at,r.filled_at].every(t=>typeof t==='string'&&Number.isFinite(Date.parse(t)))||Date.parse(r.filled_at)<Date.parse(r.received_at))throw Error();
 const p=preview(a,o);if(p.fee!==cents(r.fee_cents)||p.basis!==cents(r.basis_cents))throw Error();
 const h=a.holdings[o.symbol]??{quantity:0,cost:0};const next=o.side==='buy'?{quantity:h.quantity+o.quantity,cost:h.cost+p.value+p.fee}:{quantity:h.quantity-o.quantity,cost:h.cost-p.basis};integer(next.cost,'원가',true);integer(next.quantity,'수량',true);
 if(next.quantity)a.holdings[o.symbol]=next;else delete a.holdings[o.symbol];a.cash=p.cash;a.fees+=p.fee;a.realized=cents(Number(BigInt(a.realized)+(o.side==='sell'?BigInt(p.delta)-BigInt(p.basis):0n)),true);
 if(!Number.isSafeInteger(a.realized)||!Number.isSafeInteger(a.fees))throw Error();if(cents(l.delta_cents,true)!==p.delta||cents(l.balance_cents)!==p.cash)throw Error();
 }
 if(a.cash!==cents(raw.cash)||a.realized!==cents(raw.realized,true)||a.fees!==cents(raw.fees))throw Error();
 const positions:Record<string,Holding>={};for(const p of raw.positions){if(positions[p.symbol])throw Error();positions[p.symbol]={quantity:cents(p.quantity),cost:cents(p.cost)};}
 if(Object.keys(positions).length!==Object.keys(a.holdings).length||Object.entries(a.holdings).some(([s,h])=>positions[s]?.quantity!==h.quantity||positions[s]?.cost!==h.cost))throw Error();
 if(credits.size||tradeIndex!==raw.orders.length)throw Error();
 for(const t of a.entitlements){const e=a.events.find(e=>e.id===t.event_id);if(Number(t.event_version)===Number(e.version)||a.dividends.some(c=>c.event_id===t.event_id)){const q=a.orders.filter(o=>o.symbol===e.symbol&&newYorkDate(o.filled_at)<e.ex_date).reduce((sum,o)=>sum+(o.side==='buy'?1:-1)*cents(o.quantity),0);if(q!==cents(t.eligible_quantity))throw Error();}}
 for(const d of a.delivery){const c=a.dividends.find(c=>c.event_id===d.event_id);if((d.state==='paid')!==!!c)throw Error();}

 a.token=JSON.stringify([a.id,raw.orders.map((r:any)=>r.request_id),a.cash,a.fees,a.net,a.revision,a.feePolicy]);return a;
 }catch{throw new ManualDataError(raw);}}
const pendingKey=(uid:string)=>'us-stock.manual.pending.v1.'+uid;
export function readManualPending(uid:string):ManualRequest|null {const raw=localStorage.getItem(pendingKey(uid));if(!raw)return null;try{const r=JSON.parse(raw);if(typeof r.id!=='string'||!r.id||!r.order)throw Error();validateManualInput(r.order);return r;}catch{throw Error('미확정 주문 기록 손상. 원본을 보존했습니다. 새 주문을 보내지 마세요.');}}
async function session(uid:string){const c=getAuthClient();if(!c)throw Error('서버 연결 미설정');const s=await c.auth.getSession();if(s.error||s.data.session?.user.id!==uid)throw Error('사용자 인증이 변경되었습니다.');return {c,jwt:s.data.session.access_token};}
export async function manualSnapshot(uid:string){const {c,jwt}=await session(uid);const r=await c.rpc('manual_snapshot').setHeader('Authorization','Bearer '+jwt);if(r.error)throw Error('수기 계좌 조회 실패. 운영 서버 미적용 또는 연결·인증 상태를 확인하세요.');return decodeManual(r.data);}
export async function submitManual(uid:string,request:ManualRequest,expectedToken:string){
 if(!navigator.locks)throw Error('안전한 수기 주문 잠금을 지원하는 브라우저가 필요합니다.');
 return navigator.locks.request('manual.order.'+uid,()=>sendManual(uid,request,expectedToken));
}
async function sendManual(uid:string,request:ManualRequest,expectedToken:string){
 const prior=readManualPending(uid);if(prior&&(prior.id!==request.id||JSON.stringify(prior.order)!==JSON.stringify(request.order)))throw Error('기존 미확정 주문부터 재확인하세요.');
 const {c,jwt}=await session(uid);
 if(!prior){const fresh=await manualSnapshot(uid);if(fresh.token!==expectedToken)throw Error('다른 화면에서 수기 계좌가 변경되었습니다. 다시 조회 후 검토하세요.');if(fresh.revision===null||!fresh.feePolicy)throw Error('서버 주문 보안 버전 미적용 · 신규 주문 제한');request={...request,revision:fresh.revision,policyVersion:fresh.feePolicy.version};}
 // Persist before transport: quota errors never submit an untracked order.
 localStorage.setItem(pendingKey(uid),JSON.stringify(request));
 const r=await c.rpc('manual_order_v2',{p_request_id:request.id,p_expected_revision:request.revision??null,p_policy_version:request.policyVersion??null,p_order:request.order}).setHeader('Authorization','Bearer '+jwt);
 if(!r.error){const a=decodeManual(r.data);if(!matchesReceipt(a,request))throw new ManualDataError(r.data);localStorage.removeItem(pendingKey(uid));return a;}
 try{const a=await manualSnapshot(uid);if(matchesReceipt(a,request)){localStorage.removeItem(pendingKey(uid));return a;}}catch{/* keep same id on uncertainty */}
 if(r.error.code==='P0001'&&['insufficient_cash','insufficient_shares','invalid_order','invalid_number','invalid_fields','invalid_observation','market_closed','unsafe_amount','account_revision_conflict','fee_policy_conflict','client_upgrade_required'].includes(r.error.message)){localStorage.removeItem(pendingKey(uid));throw Error('주문 거절: '+r.error.message);}
 throw Error('체결 여부 미확정. 새 주문을 만들지 말고 같은 ID로 재확인하세요.');
}

function matchesReceipt(a:ManualState,r:ManualRequest){return a.orders.some(o=>o.request_id===r.id&&Object.entries(r.order).every(([key,value])=>o.payload[key]===value));}
export async function dividendAdminCall(uid:string,name:'dividend_admin'|'dividend_dashboard'|'dividend_manage',args:Record<string,unknown>={}){const {c,jwt}=await session(uid);const r=await c.rpc(name,args).setHeader('Authorization','Bearer '+jwt);if(r.error)throw Error('배당 관리 요청 실패: '+r.error.message);return r.data;}
