import {useEffect,useState} from 'react';
import {Modal} from './UiPanels';
import {kstTime,type Indicator,type MarketSnapshot} from './marketInfo';

const order=[['sp500','S&P 500'],['nasdaq','NASDAQ'],['dow','Dow Jones'],['usdkrw','USD/KRW'],['kospi','KOSPI'],['kosdaq','KOSDAQ']] as const;
export function headerIndicators(items:Indicator[],mode:MarketSnapshot['mode']):Indicator[]{
 return order.map(([id,name])=>{
  const source=items.find(item=>item.id===id);
  const pending=!source||source.status==='pending'||(mode==='official-pending'&&source.status==='synthetic');
  const value=!pending&&source&&Number.isFinite(source.value)?source.value:null;
  return {id,name,unit:source?.unit??(id==='usdkrw'?'원':'pt'),value,
   changePct:value!==null&&source&&Number.isFinite(source.changePct)?source.changePct:null,
   asOf:!pending&&source?.asOf&&Number.isFinite(Date.parse(source.asOf))?source.asOf:null,
   status:pending?'pending':source!.status};
 });
}
function IndicatorText({item,compact=false}:{item:Indicator;compact?:boolean}){
 if(compact)return <span className="v1-ticker-line">
  <span className="ticker-name">{item.name}</span>
  <strong>{item.value===null?'미제공':item.value.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
  <span className={item.changePct===null?'':item.changePct>0?'up':item.changePct<0?'down':''}>{item.changePct===null?'—':(item.changePct>0?'+':'')+item.changePct.toFixed(2)+'%'}</span>
 </span>;
 return <><span className="ticker-name">{item.name}</span><span className="ticker-numbers"><strong>{item.value===null?'미제공':item.value.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+item.unit}</strong><span className={item.changePct===null?'':item.changePct>0?'up':item.changePct<0?'down':''}>{item.changePct===null?'등락률 미제공':(item.changePct>0?'+':'')+item.changePct.toFixed(2)+'%'}</span></span><small>{item.status==='synthetic'?'합성 예시 · 자체 생성':item.status==='pending'?'연동 준비 중':'공식 · 출처명 미제공'} · {item.asOf?kstTime(item.asOf):'기준시각 미제공'}</small></>;
}
export function HeaderIndicators({indicators,mode,externalPaused=false,compact=false}:{indicators:Indicator[];mode:MarketSnapshot['mode'];externalPaused?:boolean;compact?:boolean}){
 const items=headerIndicators(indicators,mode);
 const [slide,setSlide]=useState({index:0,previous:null as number|null,serial:0});
 const [hover,setHover]=useState(false),[focus,setFocus]=useState(false),[open,setOpen]=useState(false);
 const paused=hover||focus||open||externalPaused;
 useEffect(()=>{if(paused)return;const timer=window.setInterval(()=>setSlide(s=>({index:(s.index+1)%6,previous:s.index,serial:s.serial+1})),5000);return()=>window.clearInterval(timer);},[paused]);
 useEffect(()=>{if(slide.previous===null)return;const timer=window.setTimeout(()=>setSlide(s=>({...s,previous:null})),400);return()=>window.clearTimeout(timer);},[slide.serial]);
 return <><button type="button" className={'header-ticker'+(compact?' v1-compact-ticker':'')} aria-label="주요 시장 지표 열기" aria-describedby="header-ticker-current" aria-haspopup="dialog" aria-expanded={open}
  onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} onClick={()=>setOpen(true)}>
  <span className="ticker-window">
   {slide.previous!==null&&<span className="ticker-slide ticker-exit" aria-hidden="true" key={'old'+slide.serial}><IndicatorText item={items[slide.previous]} compact={compact}/></span>}
   <span id="header-ticker-current" className={'ticker-slide '+(slide.serial?'ticker-enter':'')} key={'current'+slide.serial} data-testid="ticker-current"><IndicatorText item={items[slide.index]} compact={compact}/></span>
  </span></button>
  {open&&<Modal title="주요 시장 지표" close={()=>setOpen(false)}><div className="ticker-overview">{items.map(item=><article key={item.id}><IndicatorText item={item}/><a href="#indices" onClick={()=>setOpen(false)}>{item.name} 지표 화면 →</a></article>)}</div><p>이 지표판의 USD/KRW는 시장정보 모드의 값입니다. 합성 예시는 실제 환율이 아닙니다. 별도 일별 참고환율의 출처·기준일은 <a href="#indices" onClick={()=>setOpen(false)}>지표 화면</a>에서 확인하세요.</p></Modal>}
 </>;
}
