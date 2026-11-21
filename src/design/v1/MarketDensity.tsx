import {CurrencyToggle} from '../../preferences';
import {instruments} from '../../data';
import {CatalogDiscovery} from '../../CatalogDiscovery';
import {MarketToolbar} from '../../MarketPanels';
import {type MarketLabProps} from './MarketLab';
import {MarketExplorerV3} from './MarketExplorerV3';

/**
 * Selected direction after market A/B/C design evaluation.
 * B is the default card surface. The dense listing adopts C's real column-based
 * comparison, with A's repeatable low-density navigation at larger catalog sizes.
 * Both views share one Explorer state for search, filters, sort and selection.
 */
export function MarketDensity(props:MarketLabProps){
 return <div className="market-lab market-hybrid-page market-density-page">
  <section className="market-density-toolbar" aria-label="시장 탐색 표시 설정">
   <div><strong>기업·ETF 탐색</strong><span>{instruments.length}개 지원 종목 · 학습용 합성 시세</span></div>
   <CurrencyToggle/>
  </section>
  <MarketToolbar view={props.view}/>
  <div className="market-discovery-modes" role="group" aria-label="종목 탐색 모드">
   <button aria-pressed={props.marketMode==='supported'} onClick={()=>props.setMarketMode('supported')}>모의투자 지원 종목</button>
   <button aria-pressed={props.marketMode==='catalog'} onClick={()=>props.setMarketMode('catalog')}>미국 종목 후보 탐색</button>
  </div>
  {props.marketMode==='catalog'?<div className="market-hybrid-catalog"><CatalogDiscovery key={props.accountKey} catalog={props.localCatalog} setCatalog={props.setLocalCatalog}/></div>:
   <MarketExplorerV3 watch={props.watch} toggle={props.toggle} search={props.search} setSearch={props.setSearch} onlyWatch={props.onlyWatch} setOnlyWatch={props.setOnlyWatch}/>}
 </div>;
}
