import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {quote,type Instrument} from './data';
import {findCompanyProfile} from './companyProfiles';
import {CompanyDetail} from './CompanyDetail';
import {EtfDetail} from './EtfDetail';
import {ExternalQuotes,ManualWorkspace} from './ManualUI';
import {OrderPanel,type AccountView} from './TradingUI';
import {OrderAccountContext} from './UiPanels';
import {useCurrency,CurrencyToggle} from './preferences';
import {metadata} from './uiData';
import {ValuationComparison} from './design/v1/ValuationComparison';
export type DetailTab='overview'|'trade'|'financials'|'evidence';
export const detailTabEvent='stock-detail-tab';
export function StockDetail({stock,account,manual,watched,toggleWatch,designV1=false,detailLabVariant}:{stock:Instrument;account:AccountView;manual:boolean;watched:boolean;toggleWatch:()=>void;designV1?:boolean;detailLabVariant?:'b'|'c'}){
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
 return <article ref={root} className={"stock-detail"+(designV1?" v1-stock-detail":"")+(detailLabVariant?" detail-lab-stock detail-lab-stock-"+detailLabVariant:"")} data-symbol={stock.symbol} data-kind={etf?'etf':'company'} aria-label={etf?'ETF 상세 화면':'기업 상세 화면'}>
  <a className="back ui-link" href="#market">← 시장</a>
  <div className="heading detail-heading"><div><p className="eyebrow">{stock.symbol} · {metadata[stock.symbol].exchange} · {stock.kind}</p><h1 tabIndex={-1}>{stock.name}</h1><p className="detail-summary">{profile?.tenSecondSummary??metadata[stock.symbol].description}</p></div><button aria-pressed={watched} onClick={toggleWatch}>{watched?'★ 관심종목 해제':'☆ 관심종목 등록'}</button></div>
  {designV1&&<section className="v1-detail-price" aria-label="합성 가격 및 변동률"><div><span className="v1-detail-price-label">교육용 합성 가격 · 실제 시세 아님</span><div className="v1-detail-price-value"><strong>{currency.format(Math.round(quote(stock).price*100))}</strong><span className={quote(stock).change>=0?'up':'down'}>{quote(stock).change>=0?'+':''}{quote(stock).change.toFixed(2)}%</span></div></div><div className="v1-detail-price-aside"><span>차트와 실제 자료는 구분해서 확인해요.</span><a className="ui-link" href="#detail-order" onClick={e=>{e.preventDefault();jumpToOrder();}}>차트·가상 주문 보기 →</a></div></section>}
  {detailLabVariant&&<section className="detail-lab-insight" aria-label={etf?'ETF 핵심 이해':'기업 핵심 이해'}>
   <div className="detail-lab-insight-head"><span>{detailLabVariant==='b'?'QUICK UNDERSTANDING · 핵심 파악':'RESEARCH SNAPSHOT · 분석 메모'}</span><p>공식 자료 기반 편집 요약 · 투자 추천 아님</p></div>
   <div className="detail-lab-insight-grid">
    <article><span className="detail-lab-insight-index">01</span><h2>{etf?'어떤 ETF인가?':'무슨 사업을 할까?'}</h2><p>{profile?profile.business.join(' · '):metadata[stock.symbol].description}</p></article>
    <article><span className="detail-lab-insight-index">02</span><h2>{etf?'확인할 항목':'어떻게 돈을 벌까?'}</h2><p>{profile?profile.revenueModel:'보유 자산 구성·총보수·추종 전략과 분배 정책을 공식 발행사 자료에서 확인해야 합니다.'}</p></article>
    <article><span className="detail-lab-insight-index">03</span><h2>{etf?'투자 전 유의점':'무엇을 조심해야 할까?'}</h2><p>{profile?profile.risks.join(' · '):'ETF도 시장 가격 변동 위험이 있습니다. 검증되지 않은 구성 비중·분배율을 추정하지 않습니다.'}</p></article>
   </div>
   <div className="detail-lab-disclosure"><span>가격: 교육용 합성값</span><span>기업: 공식 공시 기반 요약</span><span>거래: 가상 주문만 지원</span></div>
  </section>}
  <div className="detail-currency"><span>합성 가격 표시 통화</span><CurrencyToggle/></div>
  <div className="detail-shortcuts"><a className="ui-link detail-jump" href="#detail-order" onClick={e=>{e.preventDefault();jumpToOrder();}}>시세·주문으로 이동 ↓</a><a className="ui-link" href={`#learn/${stock.symbol}`}>차트 학습실에서 연습하기 →</a></div>
  <div role="tablist" aria-label={etf?'ETF 상세':'기업 상세'} className="detail-tabs">{tabs.map(([id,label],i)=><button key={id} ref={node=>{buttons.current[i]=node;}} role="tab" id={`stock-${stock.symbol}-tab-${id}`} aria-controls={`stock-${stock.symbol}-panel-${id}`} aria-selected={tab===id} tabIndex={tab===id?0:-1} data-detail-tab={id} onClick={()=>activate(id)} onKeyDown={e=>keydown(e,i)}>{label}</button>)}</div>
  {tabs.map(([id])=><section key={id} className="detail-panel" role="tabpanel" id={`stock-${stock.symbol}-panel-${id}`} aria-labelledby={`stock-${stock.symbol}-tab-${id}`} hidden={tab!==id} tabIndex={0}>
   {id==='trade'&&tradeVisited?<>
    <section className="panel price-boundary"><h2>{manual?'가격 종류를 구분하세요':'교육용 합성 가격 · 실제 시세 아님'}</h2><p className="synthetic-price">{manual&&'교육용 합성 가격 · 실제 시세 아님 · '}{currency.format(Math.round(quote(stock).price*100))} <span className={quote(stock).change>=0?'up':'down'}>{quote(stock).change.toFixed(2)}%</span></p><p>모의 주문·평가는 합성 계좌의 가격을 사용합니다. 외부 참고 시세는 주문에 자동 입력되지 않으며, 별도 수기 계좌는 사용자가 확인한 가격으로 기록합니다.</p></section>
    <div className="detail-layout"><div className="detail-chart"><ExternalQuotes key={stock.symbol} symbol={stock.symbol} active={tab==='trade'}/></div><div className="detail-order" id="detail-order" tabIndex={-1} aria-label="주문 영역"><OrderAccountContext manual={manual} uid={account.userId}/>{manual?<ManualWorkspace key={account.userId} uid={account.userId!} symbol={stock.symbol}/>:<OrderPanel key={stock.symbol+account.modeKey} stock={stock} view={account}/>}</div></div>
    <section className="panel detail-learning"><p>합성 시나리오는 학습용이며 실제 시세가 아닙니다.</p></section>
   </>:tab===id&&id!=='trade'?(etf?<EtfDetail stock={stock} section={id==='financials'?'product':id==='evidence'?'sources':'overview'}/>:profile?<CompanyDetail profile={profile} section={id==='financials'?'financials':id==='evidence'?'evidence':'overview'} period={period} onPeriodChange={setPeriod} evidenceId={evidenceId} onEvidence={id=>{setEvidenceId(id);activate('evidence')}}/>:<p>기업 자료 미제공</p>):null}{designV1&&id==='overview'&&!etf&&profile&&<ValuationComparison symbol={profile.symbol}/>}
  </section>)}
 </article>;
}
