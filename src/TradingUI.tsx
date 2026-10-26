import {useEffect,useRef,useState} from 'react';
import {accountKey,executeOrder,loadAccount,marketPrices,resetAccount,type LoadedAccount,type LocalOrder} from './accountStore';
import {amount,averageText,parseCents,parseQuantity,simulate,valuation,type Account} from './trading';
import {type Instrument} from './data';
export const usd=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const message=(e:unknown)=>e instanceof Error?e.message:'처리하지 못했습니다.';
export function useAccount(){
 const [loaded,setLoaded]=useState<LoadedAccount|null>(null);const [error,setError]=useState('');const [raw,setRaw]=useState<string|null>(null);
 function refresh(){try{const result=loadAccount();setLoaded(result);setRaw(result.token);setError('');}catch(e){setLoaded(null);setError(message(e));try{setRaw(localStorage.getItem(accountKey));}catch{setRaw(null);}}}
 useEffect(()=>{refresh();const sync=(e:StorageEvent)=>{if(e.key===accountKey||e.key===null)refresh();};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 function accept(result:LoadedAccount){setLoaded(result);setRaw(result.token);setError('');}
 return {loaded,error,raw,accept,refresh};
}
export type AccountView=ReturnType<typeof useAccount>;
export function AccountSummary({view}:{view:AccountView}){
 if(view.error)return <section className="panel" role="alert">{view.error}<p><a href="#portfolio">계좌 복구 및 초기화 →</a></p></section>;
 if(!view.loaded)return <p role="status">계좌 불러오는 중…</p>;
 const a=view.loaded.account,v=valuation(a,marketPrices());
 return <section className="balance account-summary"><div><span>나의 총자산 · 로컬 가상계좌</span><h2 data-testid="total-assets">{usd(v.total)}</h2><p>최초 가상자금 $100,000 · 합성 시세 평가</p></div><dl><dt>현금잔고</dt><dd data-testid="cash">{usd(a.cash)}</dd><dt>보유 평가액</dt><dd>{usd(v.value)}</dd><dt>총손익</dt><dd>{usd(v.profit)}</dd><dt>미실현 / 실현</dt><dd>{usd(v.unrealized)} / {usd(v.realized)}</dd><dt>보유 평가수익률</dt><dd>{v.returnPct.toFixed(2)}%</dd></dl></section>;
}
export function OrderPanel({stock,view}:{stock:Instrument;view:AccountView}){
 const [side,setSide]=useState<'buy'|'sell'>('buy');const [quantity,setQuantity]=useState('1');const [pending,setPending]=useState<{order:LocalOrder;token:string|null}|null>(null);
 const [busy,setBusy]=useState(false);const guard=useRef(false);const [error,setError]=useState('');const [success,setSuccess]=useState('');
 const price=marketPrices()[stock.symbol];const holding=view.loaded?.account.holdings[stock.symbol]??{quantity:0,cost:0};
 function prepare(){setError('');setSuccess('');try{if(!view.loaded)throw Error('계좌를 정상적으로 불러온 후 주문할 수 있습니다.');const count=parseQuantity(quantity);amount(price,count);setPending({order:{id:crypto.randomUUID(),symbol:stock.symbol,side,quantity:count},token:view.loaded.token});}catch(e){setError(message(e));}}
 async function confirm(){if(!pending||guard.current)return;guard.current=true;setBusy(true);setError('');try{const result=await executeOrder(pending.order,pending.token);view.accept(result);setPending(null);setSuccess('가상 주문이 체결되고 저장되었습니다.');}catch(e){setError(message(e));}finally{guard.current=false;setBusy(false);}}
 return <section className="panel"><h2>가상 시장가 주문</h2><p>합성 가격 {usd(price)} · 보유 {holding.quantity}주 · 수수료·세금 0</p><div className="trade-form"><label>주문 유형<select aria-label="주문 유형" value={side} disabled={!!pending} onChange={e=>{setSide(e.target.value as 'buy'|'sell');setSuccess('');}}><option value="buy">매수</option><option value="sell">매도</option></select></label><label>주문 수량<input aria-label="주문 수량" inputMode="numeric" value={quantity} disabled={!!pending} onChange={e=>{setQuantity(e.target.value);setSuccess('');}}/></label><button onClick={prepare} disabled={!view.loaded||!!pending}>주문 검토</button></div>
 {pending&&<div role="dialog" aria-label="가상 주문 확인" className="confirmation"><h3>가상 주문 확인</h3><p>{stock.symbol} {pending.order.quantity}주 {pending.order.side==='buy'?'매수':'매도'} · {usd(price)} / 주</p><p>총 체결금액 {usd(amount(price,pending.order.quantity))}</p><button disabled={busy} onClick={confirm}>{busy?'저장 중…':'체결 확정'}</button> <button disabled={busy} onClick={()=>{setPending(null);setError('');}}>주문 취소</button></div>}
 {error&&<p role="alert">{error}</p>}{success&&<p role="status">{success}</p>}{view.error&&<p role="alert">{view.error}</p>}
 <small>개인 브라우저의 가상 거래입니다. 실제 주문·자금 이동 없음.</small>
 <Simulator key={stock.symbol} stock={stock} account={view.loaded?.account??null}/></section>;
}
function Simulator({stock,account}:{stock:Instrument;account:Account|null}){
 const mark=marketPrices()[stock.symbol];const [price,setPrice]=useState((mark/100).toFixed(2));const [quantity,setQuantity]=useState('1');
 const h=account?.holdings[stock.symbol]??{quantity:0,cost:0};let result=null,error='';
 try{result=simulate(h,parseCents(price),parseQuantity(quantity),mark);}catch(e){error=message(e);}
 return <div className="simulator"><h2>물타기·불타기 분석</h2><p>현재 {h.quantity}주 · 평균매입단가 ${averageText(h)}. 분석만 수행하며 주문하지 않습니다.</p><div className="trade-form"><label>추가매수 가격 (USD)<input aria-label="추가매수 가격" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>추가매수 수량<input aria-label="추가매수 수량" inputMode="numeric" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label></div>{!account?<p>계좌를 불러온 후 분석할 수 있습니다.</p>:error?<p role="alert">{error}</p>:result&&<dl data-testid="simulation"><dt>예상 신규 평단</dt><dd>${averageText(result)}</dd><dt>예상 보유수량</dt><dd>{result.quantity}주</dd><dt>추가 필요금액</dt><dd>{usd(result.needed)}</dd><dt>예상 투자원금</dt><dd>{usd(result.cost)}</dd><dt>현재 합성가 평가액</dt><dd>{usd(result.value)}</dd><dt>예상 미실현손익</dt><dd>{usd(result.unrealized)} ({result.returnPct.toFixed(2)}%)</dd></dl>}</div>;
}
export function Portfolio({view}:{view:AccountView}){
 const [reset,setReset]=useState(false),[phrase,setPhrase]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');const guard=useRef(false);const resetToken=useRef<string|null>(null);
 async function confirmReset(){if(phrase!=='초기화'||guard.current)return;guard.current=true;setBusy(true);setError('');try{view.accept(await resetAccount(resetToken.current));setReset(false);setPhrase('');setSuccess('가상계좌가 $100,000으로 초기화되었습니다.');}catch(e){setError(message(e));}finally{guard.current=false;setBusy(false);}}
 const a=view.loaded?.account,prices=marketPrices();
 return <><h1>포트폴리오</h1><AccountSummary view={view}/><section className="panel"><h2>보유종목</h2>{a?Object.keys(a.holdings).length?<div className="holdings">{Object.entries(a.holdings).map(([symbol,h])=>{const value=amount(prices[symbol],h.quantity);return <article className="holding" key={symbol}><a href={`#stock/${symbol}`}><strong>{symbol} →</strong></a><dl><dt>보유수량</dt><dd>{h.quantity}주</dd><dt>평균매입단가</dt><dd>${averageText(h)}</dd><dt>투자원금</dt><dd>{usd(h.cost)}</dd><dt>평가액</dt><dd>{usd(value)}</dd><dt>미실현손익</dt><dd>{usd(value-h.cost)} ({h.cost?((value-h.cost)/h.cost*100).toFixed(2):'0.00'}%)</dd></dl></article>;})}</div>:<p>보유종목이 없습니다. <a href="#market">시장에서 첫 가상매수를 시작하세요 →</a></p>:<p>계좌를 불러오지 못했습니다.</p>}</section>
 <section className="panel"><h2>거래내역 및 현금원장</h2><p>최초 가상입금 $100,000 · 수수료·세금·배당·환전 비용 0 · 환율손익 제외</p>{a?.trades.length?<div className="history">{[...a.trades].reverse().map(t=>{const entry=a.ledger.find(l=>l.tradeId===t.id)!;return <article key={t.id} className="history-row"><strong>{t.symbol} {t.side==='buy'?'매수':'매도'} {t.quantity}주</strong><small>{new Date(t.time).toLocaleString('ko-KR')} · {usd(t.price)} / 주</small><span>현금 변동 {usd(entry.delta)} · 체결 후 잔고 {usd(entry.balance)}</span></article>;})}</div>:<p>거래내역이 없습니다.</p>}</section>
 <section className="panel"><h2>가상계좌 초기화</h2><p>모든 가상 거래와 보유종목을 삭제하고 $100,000부터 다시 시작합니다. 관심종목은 유지됩니다.</p><button disabled={reset} onClick={()=>{resetToken.current=view.raw;setReset(true);setSuccess('');setError('');}}>계좌 전체 초기화</button>{reset&&<div role="dialog" aria-label="계좌 초기화 확인" className="confirmation"><p>되돌릴 수 없습니다. 계속하려면 ‘초기화’를 입력하세요.</p><input aria-label="초기화 확인 문구" value={phrase} disabled={busy} onChange={e=>setPhrase(e.target.value)}/><button disabled={phrase!=='초기화'||busy} onClick={confirmReset}>{busy?'저장 중…':'초기화 확정'}</button><button disabled={busy} onClick={()=>{setReset(false);setPhrase('');}}>초기화 취소</button></div>}{error&&<p role="alert">{error}</p>}{success&&<p role="status">{success}</p>}</section><p>이 계좌는 개인 로컬 데모입니다. 로그인·사용자별 계좌·기기 동기화를 지원하지 않습니다. localStorage는 DB 트랜잭션이나 보안 저장소가 아닙니다.</p></>;
}
