import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {quote,type Instrument} from './data';
import {findCompanyProfile} from './companyProfiles';
import {CompanyDetail} from './CompanyDetail';
import {EtfDetail} from './EtfDetail';
import {ExternalQuotes,ManualWorkspace} from './ManualUI';
import {OrderPanel,type AccountView} from './TradingUI';
import {OrderAccountContext} from './UiPanels';
import {useCurrency} from './preferences';
import {metadata} from './uiData';
export type DetailTab='overview'|'trade'|'financials'|'evidence';
export const detailTabEvent='stock-detail-tab';
export function StockDetail({stock,account,manual,watched,toggleWatch}:{stock:Instrument;account:AccountView;manual:boolean;watched:boolean;toggleWatch:()=>void}){
 const [tab,setTab]=useState<DetailTab>('overview'),[tradeVisited,setTradeVisited]=useState(false),[period,setPeriod]=useState<'annual'|'quarter'>('annual');
 const [evidenceId,setEvidenceId]=useState<string|null>(null);const root=useRef<HTMLElement>(null);const buttons=useRef<(HTMLButtonElement|null)[]>([]);const currency=useCurrency();
 const profile=findCompanyProfile(stock.symbol),etf=stock.kind==='ETF';
 const tabs=[['overview','개요'],['trade','차트·거래'],['financials',etf?'상품정보':'재무'],['evidence',etf?'출처':'근거']] as const;
 function activate(next:DetailTab){if(next==='trade')setTradeVisited(true);setTab(next);}
 useEffect(()=>{
  const requested=(event:Event)=>{const detail=(event as CustomEvent<{symbol:string;tab:DetailTab}>).detail;if(detail?.symbol===stock.symbol&&tabs.some(([id])=>id===detail.tab))activate(detail.tab);};
  window.addEventListener(detailTabEvent,requested);
  if(!document.querySelector('dialog[open]')){root.current?.scrollIntoView({block:'start',behavior:'instant'});root.current?.querySelector('h1')?.focus({preventScroll:true});}
  return()=>window.removeEventListener(detailTabEvent,requested);
 },[stock.symbol]);
 function keydown(event:KeyboardEvent<HTMLButtonElement>,index:number){
  const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
  if(next===null)return;event.preventDefault();activate(tabs[next][0]);buttons.current[next]?.focus({preventScroll:true});
 }
 function jumpToOrder(){activate('trade');requestAnimationFrame(()=>{const target=document.getElementById('detail-order');target?.scrollIntoView({block:'start',behavior:'instant'});target?.focus({preventScroll:true});});}
 return <article ref={root} className="stock-detail" data-symbol={stock.symbol} data-kind={etf?'etf':'company'} aria-label={etf?'ETF 상세 화면':'기업 상세 화면'}>
  <a className="back ui-link" href="#market">← 시장</a>
  <div className="heading detail-heading"><div><p className="eyebrow">{stock.symbol} · {metadata[stock.symbol].exchange} · {stock.kind}</p><h1 tabIndex={-1}>{stock.name}</h1><p className="detail-summary">{profile?.tenSecondSummary??metadata[stock.symbol].description}</p></div><button aria-pressed={watched} onClick={toggleWatch}>{watched?'★ 관심종목 해제':'☆ 관심종목 등록'}</button></div>
  <div className="detail-shortcuts"><a className="ui-link detail-jump" href="#detail-order" onClick={e=>{e.preventDefault();jumpToOrder();}}>시세·주문으로 이동 ↓</a><a className="ui-link" href={`#learn/${stock.symbol}`}>차트 학습실에서 연습하기 →</a></div>
  <div role="tablist" aria-label={etf?'ETF 상세':'기업 상세'} className="detail-tabs">{tabs.map(([id,label],i)=><button key={id} ref={node=>{buttons.current[i]=node;}} role="tab" id={`stock-${stock.symbol}-tab-${id}`} aria-controls={`stock-${stock.symbol}-panel-${id}`} aria-selected={tab===id} tabIndex={tab===id?0:-1} data-detail-tab={id} onClick={()=>activate(id)} onKeyDown={e=>keydown(e,i)}>{label}</button>)}</div>
  {tabs.map(([id])=><section key={id} className="detail-panel" role="tabpanel" id={`stock-${stock.symbol}-panel-${id}`} aria-labelledby={`stock-${stock.symbol}-tab-${id}`} hidden={tab!==id} tabIndex={0}>
   {id==='trade'&&tradeVisited?<>
    <section className="panel price-boundary"><h2>{manual?'가격 종류를 구분하세요':'교육용 합성 가격 · 실제 시세 아님'}</h2><p className="synthetic-price">{manual&&'교육용 합성 가격 · 실제 시세 아님 · '}{currency.format(Math.round(quote(stock).price*100))} <span className={quote(stock).change>=0?'up':'down'}>{quote(stock).change.toFixed(2)}%</span></p><p>모의 주문·평가는 합성 계좌의 가격을 사용합니다. 외부 참고 시세는 주문에 자동 입력되지 않으며, 별도 수기 계좌는 사용자가 확인한 가격으로 기록합니다.</p></section>
    <div className="detail-layout"><div className="detail-chart"><ExternalQuotes key={stock.symbol} symbol={stock.symbol} active={tab==='trade'}/></div><div className="detail-order" id="detail-order" tabIndex={-1} aria-label="주문 영역"><OrderAccountContext manual={manual} uid={account.userId}/>{manual?<ManualWorkspace key={account.userId} uid={account.userId!} symbol={stock.symbol}/>:<OrderPanel key={stock.symbol+account.modeKey} stock={stock} view={account}/>}</div></div>
    <section className="panel detail-learning"><p>합성 시나리오는 학습용이며 실제 시세가 아닙니다.</p></section>
   </>:tab===id&&id!=='trade'?(etf?<EtfDetail stock={stock} section={id==='financials'?'product':id==='evidence'?'sources':'overview'}/>:profile?<CompanyDetail profile={profile} section={id==='financials'?'financials':id==='evidence'?'evidence':'overview'} period={period} onPeriodChange={setPeriod} evidenceId={evidenceId} onEvidence={id=>{setEvidenceId(id);activate('evidence')}}/>:<p>기업 자료 미제공</p>):null}
  </section>)}
 </article>;
}
