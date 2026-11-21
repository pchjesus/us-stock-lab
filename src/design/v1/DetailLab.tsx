import {useState} from 'react';
import type {Instrument} from '../../data';
import type {AccountView} from '../../TradingUI';
import {StockDetail} from '../../StockDetail';

type Variant='a'|'b'|'c';
const modes=[
 {id:'a',name:'기존 상세',role:'비교 기준 · UI v1의 기존 구조'},
 {id:'b',name:'쉽게 이해',role:'스토리형 · 기업·사업·위험을 먼저 이해'},
 {id:'c',name:'분석 데스크',role:'데이터형 · 수치·공식자료·거래 구분에 집중'}
] as const;

function initial():Variant {
 try{const mode=new URLSearchParams(location.search).get('detailVariant');return mode==='a'||mode==='c'?mode:'b';}
 catch{return 'b';}
}

/** Only the stock detail route renders this isolated UI experiment. All financial
 * content is provided by the original StockDetail/CompanyDetail/EtfDetail. */
export function DetailLab({stock,account,manual,watched,toggleWatch}:{
 stock:Instrument;account:AccountView;manual:boolean;watched:boolean;toggleWatch:()=>void;
}){
 const [variant,setVariant]=useState<Variant>(initial);
 const current=modes.find(x=>x.id===variant)!;
 function change(next:Variant){
  setVariant(next);
  try{
   const url=new URL(location.href);
   url.searchParams.set('detailVariant',next);
   history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }catch{/* compare buttons continue to work in memory */}
 }
 return <div className={'detail-lab detail-lab-'+variant} data-detail-variant={variant}>
  <section className="detail-lab-switch-panel" aria-label="종목 상세 디자인 실험">
   <div className="detail-lab-switch-intro">
    <span className="detail-lab-eyebrow">STOCK DETAIL · DESIGN LAB</span>
    <h2>기업 정보를 보는 세 가지 방법</h2>
    <p aria-live="polite">{current.role}</p>
   </div>
   <div className="detail-lab-mode-switch" role="group" aria-label="종목 상세 디자인 선택">
    {modes.map(x=><button type="button" key={x.id} aria-pressed={variant===x.id} onClick={()=>change(x.id)}>
     <span className="detail-lab-mode-key">{x.id.toUpperCase()}</span>{x.name}
    </button>)}
   </div>
  </section>
  <StockDetail key={stock.symbol+'-'+variant} stock={stock} account={account} manual={manual}
   watched={watched} toggleWatch={toggleWatch} designV1 detailLabVariant={variant==='a'?undefined:variant}/>
 </div>;
}
