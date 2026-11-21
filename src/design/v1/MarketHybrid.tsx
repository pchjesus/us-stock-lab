import {CurrencyToggle} from '../../preferences';
import {instruments} from '../../data';
import {CatalogDiscovery} from '../../CatalogDiscovery';
import {MarketToolbar} from '../../MarketPanels';
import {Explorer,type MarketLabProps} from './MarketLab';

/**
 * Selected direction after market A/B/C design evaluation.
 * B is the default card surface. The dense listing adopts C's real column-based
 * comparison, with A's repeatable low-density navigation at larger catalog sizes.
 * Both views share one Explorer state for search, filters, sort and selection.
 */
export function MarketHybrid(props:MarketLabProps){
 return <div className="market-lab market-hybrid-page">
  <section className="market-hybrid-heading">
   <div><span className="market-lab-kicker">DISCOVER / US STOCK LAB</span>
    <h1>기업을 찾는 가장 편한 방식</h1>
    <p>카드로 쉽게 둘러보고, 종목이 많아지면 목록으로 빠르게 비교해봐.</p>
    <span className="market-hybrid-safe">{instruments.length}개 지원 종목 · 학습용 합성 시세 · 실제 현재가 아님</span>
   </div>
   <CurrencyToggle/>
  </section>
  <MarketToolbar view={props.view}/>
  <div className="market-discovery-modes" role="group" aria-label="종목 탐색 모드">
   <button aria-pressed={props.marketMode==='supported'} onClick={()=>props.setMarketMode('supported')}>모의투자 지원 종목</button>
   <button aria-pressed={props.marketMode==='catalog'} onClick={()=>props.setMarketMode('catalog')}>미국 종목 후보 탐색</button>
  </div>
  {props.marketMode==='catalog'?<div className="market-hybrid-catalog"><CatalogDiscovery key={props.accountKey} catalog={props.localCatalog} setCatalog={props.setLocalCatalog}/></div>:
   <Explorer variant="b" hybrid watch={props.watch} toggle={props.toggle} search={props.search} setSearch={props.setSearch} onlyWatch={props.onlyWatch} setOnlyWatch={props.setOnlyWatch}/>}
 </div>;
}
