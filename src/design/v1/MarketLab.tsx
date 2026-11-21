import {useMemo,useState,type CSSProperties} from 'react';
import {instruments,quote,asOf,type Instrument} from '../../data';
import {metadata} from '../../uiData';
import {useCurrency,CurrencyToggle} from '../../preferences';
import {quoteLinks} from '../../ManualUI';
import {MarketDiscovery} from '../../MarketDiscovery';
import {CatalogDiscovery} from '../../CatalogDiscovery';
import type {LocalCatalog} from '../../catalogImport';
import {MarketToolbar,type MarketView} from '../../MarketPanels';

type Variant='a'|'b'|'c';
type Sector='전체'|'정보기술'|'경기소비재'|'커뮤니케이션'|'ETF';
type SortField='name'|'price'|'change';
type Direction='asc'|'desc';
type MarketMode='supported'|'catalog';
export type MarketLabProps={
 watch:readonly string[];toggle:(symbol:string)=>void;
 search:string;setSearch:(text:string)=>void;
 onlyWatch:boolean;setOnlyWatch:(value:boolean)=>void;
 marketMode:MarketMode;setMarketMode:(value:MarketMode)=>void;
 localCatalog:LocalCatalog|null;setLocalCatalog:(value:LocalCatalog|null)=>void;
 accountKey:string;view:MarketView;
};
const sectors:readonly Sector[]=['전체','정보기술','경기소비재','커뮤니케이션','ETF'];
const sectorOf:Record<Instrument['symbol'],Exclude<Sector,'전체'>>={
 AAPL:'정보기술',MSFT:'정보기술',NVDA:'정보기술',AMZN:'경기소비재',
 GOOGL:'커뮤니케이션',VOO:'ETF',QQQ:'ETF',SCHD:'ETF'
};
const designs:readonly {id:Variant;label:string;short:string;description:string}[]=[
 {id:'a',label:'A · 기존 탐색',short:'기존 탐색',description:'UI v1 기준: 익숙한 검색·섹터 필터·종목 목록'},
 {id:'b',label:'B · 디스커버리',short:'디스커버리',description:'넓은 검색, 입체적인 종목 카드와 실시간이 아닌 합성 데이터 상세 미리보기'},
 {id:'c',label:'C · 비교 데스크',short:'비교 데스크',description:'금액·변동률을 같은 열에서 비교하고 정렬하는 데이터 중심 화면'}
];
function readVariant():Variant{
 try{const v=new URLSearchParams(location.search).get('marketVariant');return v==='b'||v==='c'?v:'a';}catch{return 'a';}
}
function symbolVisual(symbol:string){
 return symbol==='AAPL'?'AP':symbol==='MSFT'?'MS':symbol==='NVDA'?'NV':symbol==='AMZN'?'AM':symbol==='GOOGL'?'GO':symbol;
}
function Change({value}:{value:number}){
 return <span className={'market-lab-change '+(value>=0?'up':'down')}>{value>0?'+':''}{value.toFixed(2)}%</span>;
}
function Bookmark({symbol,watched,onToggle}:{symbol:string;watched:boolean;onToggle:()=>void}){
 return <button type="button" className="market-lab-save" aria-label={symbol+' 관심종목'} aria-pressed={watched}
  title={watched?'관심종목 해제':'관심종목 추가'} onClick={onToggle}>
  <svg viewBox="0 0 24 24" width="19" height="19" fill={watched?'currentColor':'none'} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 2.5 3.05 6.18 6.82.99-4.94 4.82 1.17 6.8L12 18.08l-6.1 3.21 1.17-6.8-4.94-4.82 6.82-.99z"/></svg>
 </button>;
}
function Preview({item,watch,toggle,compact=false}:{item:Instrument;watch:readonly string[];toggle:(symbol:string)=>void;compact?:boolean}){
 const currency=useCurrency();
 const q=quote(item);
 const url=quoteLinks(item.symbol).TradingView;
 return <section className={'market-lab-preview'+(compact?' is-compact':'')} aria-label="선택 종목 요약" key={item.symbol} tabIndex={-1}>
  <div className="market-lab-preview-top"><span className="market-lab-note">{item.kind==='ETF'?'ETF 상품':'기업'} · 읽기 전용 미리보기</span>
   <Bookmark symbol={item.symbol} watched={watch.includes(item.symbol)} onToggle={()=>toggle(item.symbol)}/></div>
  <div className="market-lab-preview-icon" aria-hidden="true">{symbolVisual(item.symbol)}</div>
  <h3>{item.name}</h3><p className="market-lab-preview-symbol">{item.symbol} · {metadata[item.symbol].exchange}</p>
  <p className="market-lab-preview-desc">{metadata[item.symbol].description}</p>
  <dl className="market-lab-preview-stats">
   <div><dt>합성 가격</dt><dd>{currency.format(Math.round(q.price*100))}</dd></div>
   <div><dt>합성 변동률</dt><dd><Change value={q.change}/></dd></div>
  </dl>
  <p className="market-lab-data-source">학습용 합성 시세 · 실제 현재가 아님 · 기준 {q.date}</p>
  <a className="market-lab-preview-link" href={'#stock/'+item.symbol}>종목 상세 살펴보기 <span aria-hidden="true">↗</span></a>
  {url&&<a className="market-lab-external" href={url} target="_blank" rel="noopener noreferrer" aria-label={item.symbol+' 외부 시세 확인 (새 탭)'}>외부 시세 확인 ↗</a>}
 </section>;
}
function StudioCard({item,watch,toggle,select,selected,index}:{item:Instrument;watch:readonly string[];toggle:(symbol:string)=>void;select:()=>void;selected:boolean;index:number}){
 const currency=useCurrency();const q=quote(item);
 return <article className={'market-lab-card'+(selected?' is-selected':'')} style={{'--lab-index':Math.min(index,8)} as CSSProperties} data-symbol={item.symbol}>
  <div className="market-lab-card-header"><span className="market-lab-avatar" aria-hidden="true">{symbolVisual(item.symbol)}</span>
   <Bookmark symbol={item.symbol} watched={watch.includes(item.symbol)} onToggle={()=>toggle(item.symbol)}/></div>
  <div className="market-lab-card-name"><a href={'#stock/'+item.symbol}>{item.name} <span aria-hidden="true">↗</span></a>
   <p>{item.symbol} <span aria-hidden="true">·</span> {sectorOf[item.symbol]}</p></div>
  <p className="market-lab-card-description">{metadata[item.symbol].description}</p>
  <div className="market-lab-card-stats"><div><span>교육용 합성 가격</span><strong>{currency.format(Math.round(q.price*100))}</strong></div><Change value={q.change}/></div>
  <div className="market-lab-card-footer"><span>기준 {q.date}</span><button type="button" aria-pressed={selected} onClick={select}>빠른 정보 <span aria-hidden="true">→</span></button></div>
 </article>;
}
export function Explorer({variant,watch,toggle,search,setSearch,onlyWatch,setOnlyWatch,hybrid=false}:Pick<MarketLabProps,'watch'|'toggle'|'search'|'setSearch'|'onlyWatch'|'setOnlyWatch'>&{variant:'b'|'c';hybrid?:boolean}){
 const [preferredMode,setPreferredMode]=useState<'b'|'c'>(()=>{
  if(!hybrid)return variant;
  try{return localStorage.getItem('us-stock-lab.market-view-mode')==='list'?'c':'b';}catch{return 'b';}
 });
 const display=hybrid?preferredMode:variant;
 const [page,setPage]=useState(0);
 const currency=useCurrency();
 const [sector,setSector]=useState<Sector>('전체');
 const [selectedSymbol,setSelectedSymbol]=useState<Instrument['symbol']>('AAPL');
 const [sort,setSort]=useState<SortField>('name');
 const [direction,setDirection]=useState<Direction>('asc');
 const filtered=useMemo(()=>{
  const q=search.trim().toLowerCase();
  return instruments.filter(item=>(sector==='전체'||sectorOf[item.symbol]===sector)
   &&(!onlyWatch||watch.includes(item.symbol))
   &&(item.name.toLowerCase().includes(q)||item.symbol.toLowerCase().includes(q)))
   .slice().sort((a,b)=>{
    const x=sort==='name'?a.symbol.localeCompare(b.symbol):sort==='price'?quote(a).price-quote(b).price:quote(a).change-quote(b).change;
    return (direction==='asc'?1:-1)*x;
   });
 },[sector,onlyWatch,search,watch,sort,direction]);
 const pageSize=display==='b'?24:50;
 const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
 const activePage=Math.min(page,pageCount-1);
 const visible=filtered.slice(activePage*pageSize,(activePage+1)*pageSize);
 const selected=visible.find(item=>item.symbol===selectedSymbol)??visible[0];
 function changeView(next:'b'|'c'){
  setPreferredMode(next);setPage(0);
  try{localStorage.setItem('us-stock-lab.market-view-mode',next==='b'?'cards':'list');}catch{/* No effect on account data if storage is unavailable. */}
 }
 function changeSort(next:SortField){setPage(0);
  if(next===sort)setDirection(value=>value==='asc'?'desc':'asc');
  else{setSort(next);setDirection(next==='name'?'asc':'desc');}
 }
 function reset(){setSearch('');setSector('전체');setOnlyWatch(false);setSort('name');setDirection('asc');setPage(0);}
 function selectAndReveal(symbol:Instrument['symbol']){
  setSelectedSymbol(symbol);
  // On narrow screens the inspector follows the card/list. Keep the action visible,
  // move keyboard focus to its result, and honor reduced-motion preferences.
  if(display==='b'&&window.matchMedia('(max-width:1330px)').matches){
   window.requestAnimationFrame(()=>{
    const panel=document.querySelector<HTMLElement>('.market-lab-b .market-lab-preview');
    panel?.focus({preventScroll:true});
    panel?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
   });
  }
 }
 return <section className={'market-lab-explorer market-lab-explorer-'+display+(hybrid?' market-lab-hybrid-explorer market-lab-'+display:'')} aria-label="모의투자 지원 종목">
  <div className="market-lab-search-pane">
   <div className="market-lab-search-heading"><div><span className="market-lab-kicker">{display==='b'?'EXPLORE / 01':'SCREEN / SCREENER'}</span><h2>{display==='b'?'관심 가는 기업부터 발견해봐':'8종목, 같은 기준으로 비교하기'}</h2><p>{display==='b'?'종목을 고르고 카드에서 핵심 정보를 살펴보세요.':'섹터·관심종목을 고른 뒤 원하는 수치 순으로 정렬하세요.'}</p></div><span className="market-lab-search-count">{filtered.length}<small> / {instruments.length} 종목</small></span></div>
   <label className="market-lab-search-field"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16.2 16.2 5 5"/></svg><span className="sr-only">종목 검색</span><input aria-label="종목 검색" placeholder="기업 이름 또는 AAPL 같은 심볼 검색" value={search} onChange={event=>{setSearch(event.target.value);setPage(0);}}/>{search&&<button type="button" aria-label="검색어 지우기" onClick={()=>{setSearch('');setPage(0);}}>×</button>}</label>
   <div className="market-lab-controls"><div className="market-lab-chips" role="group" aria-label="섹터 선택">{sectors.map(s=><button type="button" key={s} aria-pressed={sector===s} onClick={()=>{setSector(s);setPage(0);}}>{s}</button>)}</div>
    <div className="market-lab-secondary-controls"><button type="button" className="market-lab-watch-filter" aria-pressed={onlyWatch} onClick={()=>{setOnlyWatch(!onlyWatch);setPage(0);}}>☆ 관심종목만</button>
     <button type="button" className="market-lab-reset" onClick={reset}>초기화</button></div></div>
   <p className="market-lab-sector-source">분류 기준일 2026-11-05 · 주식은 GICS 분류 기준, ETF는 별도 표기 · <a target="_blank" rel="noopener noreferrer" href="https://www.spglobal.com/spdji/en/indices/equity/sp-500/">S&amp;P DJI 참고 ↗</a></p>
  </div>
  <div className="market-lab-results-header"><div><h3>{display==='b'?'둘러볼 종목':'종목 비교표'}</h3><p role="status" aria-live="polite">조건에 맞는 종목 {filtered.length}개{filtered.length>pageSize?' · '+(activePage*pageSize+1)+'–'+(activePage*pageSize+visible.length)+' 표시':''}</p></div>
   <div className="market-lab-result-tools">
   {hybrid&&<div className="market-lab-view-toggle" role="group" aria-label="종목 보기 방식">
    <button type="button" aria-pressed={display==='b'} onClick={()=>changeView('b')} title="기업 카드로 보기"><span aria-hidden="true">▦</span> 카드</button>
    <button type="button" aria-pressed={display==='c'} onClick={()=>changeView('c')} title="촘촘한 종목 목록으로 보기"><span aria-hidden="true">☷</span> 목록</button>
   </div>}
   <label className="market-lab-sort-label">정렬 <select aria-label="결과 정렬" value={sort+'-'+direction} onChange={e=>{const [next,dir]=e.target.value.split('-') as [SortField,Direction];setSort(next);setDirection(dir);setPage(0);}}>
    <option value="name-asc">심볼 A–Z</option><option value="name-desc">심볼 Z–A</option>
    <option value="price-desc">합성 가격 높은 순</option><option value="price-asc">합성 가격 낮은 순</option>
    <option value="change-desc">합성 변동률 높은 순</option><option value="change-asc">합성 변동률 낮은 순</option>
   </select></label></div></div>
  {filtered.length===0?<div className="market-lab-empty" role="status"><strong>조건에 맞는 종목이 없어</strong><p>검색어나 필터를 바꿔보면 돼.</p><button onClick={reset}>모든 종목 보기</button></div>:
   display==='b'?<div className="market-lab-studio-body">
    <div className="market-lab-card-grid" key={sector+'-'+onlyWatch+'-'+sort+'-'+direction}>{visible.map((item,index)=><StudioCard key={item.symbol} item={item} watch={watch} toggle={toggle} index={index} selected={item.symbol===selected?.symbol} select={()=>selectAndReveal(item.symbol)}/>)}</div>
    {selected&&<Preview item={selected} watch={watch} toggle={toggle}/>}
   </div>:
   <div className="market-lab-terminal-body"><div className="market-lab-table-panel">
    <div className="market-lab-table-scroll"><table className="market-lab-table"><caption className="sr-only">교육용 합성 종목 가격과 변동률 비교 · 실제 시세가 아님</caption><thead><tr>
     <th scope="col" aria-sort={sort==='name'?(direction==='asc'?'ascending':'descending'):undefined}><button onClick={()=>changeSort('name')}>종목 {sort==='name'?(direction==='asc'?'↑':'↓'):'↕'}</button></th>
     <th scope="col">종류</th><th scope="col" aria-sort={sort==='price'?(direction==='asc'?'ascending':'descending'):undefined}><button onClick={()=>changeSort('price')}>합성 가격 {sort==='price'?(direction==='asc'?'↑':'↓'):'↕'}</button></th>
     <th scope="col" aria-sort={sort==='change'?(direction==='asc'?'ascending':'descending'):undefined}><button onClick={()=>changeSort('change')}>합성 변동률 {sort==='change'?(direction==='asc'?'↑':'↓'):'↕'}</button></th>
     <th scope="col">관심</th><th scope="col">요약</th>
    </tr></thead><tbody>{visible.map(item=>{const q=quote(item);return <tr key={item.symbol} className={selected?.symbol===item.symbol?'is-selected':''}>
     <td><a href={'#stock/'+item.symbol} className="market-lab-table-name"><strong>{item.symbol}</strong><span>{item.name}</span></a></td>
     <td>{sectorOf[item.symbol]}</td><td className="market-lab-number">{currency.format(Math.round(q.price*100))}</td>
     <td className="market-lab-number"><Change value={q.change}/></td>
     <td><Bookmark symbol={item.symbol} watched={watch.includes(item.symbol)} onToggle={()=>toggle(item.symbol)}/></td>
     <td><button className="market-lab-select-row" type="button" aria-pressed={selected?.symbol===item.symbol} onClick={()=>setSelectedSymbol(item.symbol)}>보기 <span aria-hidden="true">↗</span></button></td>
    </tr>})}</tbody></table></div>
    <div className="market-lab-terminal-mobile">{visible.map(item=>{const q=quote(item);return <article key={item.symbol} className="market-lab-mobile-row">
     <a href={'#stock/'+item.symbol}><strong>{item.symbol}</strong><span>{item.name}</span></a>
     <div><strong>{currency.format(Math.round(q.price*100))}</strong><Change value={q.change}/></div>
     <div className="market-lab-mobile-row-actions"><Bookmark symbol={item.symbol} watched={watch.includes(item.symbol)} onToggle={()=>toggle(item.symbol)}/><button type="button" aria-pressed={selected?.symbol===item.symbol} onClick={()=>setSelectedSymbol(item.symbol)}>요약 보기 ↗</button></div>
    </article>})}</div>
    <p className="market-lab-table-disclaimer">학습용 합성 시세 · 실제 시세/수익률이 아닙니다 · 생성 기준 {asOf} · 합성 시세의 변동률은 투자 판단에 사용할 수 없습니다.</p>
   </div>{selected&&<Preview item={selected} watch={watch} toggle={toggle} compact/>}</div>}
 {filtered.length>pageSize&&<nav className="market-lab-pagination" aria-label="검색 결과 페이지">
  <button type="button" disabled={activePage===0} onClick={()=>setPage(Math.max(0,activePage-1))}>이전</button>
  <span role="status">{activePage+1} / {pageCount} 페이지</span>
  <button type="button" disabled={activePage>=pageCount-1} onClick={()=>setPage(Math.min(pageCount-1,activePage+1))}>다음</button>
 </nav>}
 </section>;
}
/** All variants are isolated from the v1 production market. Query-string choice is display-only. */
export function MarketLab(props:MarketLabProps){
 const [variant,setVariant]=useState<Variant>(readVariant);
 const selected=designs.find(item=>item.id===variant)!;
 function change(value:Variant){setVariant(value);try{const next=new URL(location.href);next.searchParams.set('marketVariant',value);history.replaceState(history.state,'',next.pathname+next.search+next.hash);}catch{/* UI selection still works if history is blocked */}}
 return <div className={'market-lab market-lab-'+variant} data-design-variant={variant}>
  <section className="market-lab-header" aria-label="시장 탐색 디자인 비교">
   <div className="market-lab-heading"><span className="market-lab-kicker">MARKET LAB · UI v2</span><h1>시장을 보는 세 가지 방식</h1><p>{selected.description}</p></div>
   <div className="market-lab-variant-pills" role="group" aria-label="시장 디자인 선택">{designs.map(item=><button key={item.id} type="button" aria-pressed={variant===item.id} onClick={()=>change(item.id)}><span>{item.id.toUpperCase()}</span>{item.short}</button>)}</div>
  </section>
  <div className="market-lab-context"><div><h2>기업·ETF 탐색</h2><p>모의투자 지원 8종목 · 학습용 합성 가격을 실제 현재가와 구분해줘.</p></div><CurrencyToggle/></div>
  <MarketToolbar view={props.view}/>
  <div className="market-discovery-modes" role="group" aria-label="종목 탐색 모드">
   <button aria-pressed={props.marketMode==='supported'} onClick={()=>props.setMarketMode('supported')}>모의투자 지원 종목</button>
   <button aria-pressed={props.marketMode==='catalog'} onClick={()=>props.setMarketMode('catalog')}>미국 종목 후보 탐색</button>
  </div>
  {props.marketMode==='catalog'?<div className="market-lab-catalog"><CatalogDiscovery key={props.accountKey} catalog={props.localCatalog} setCatalog={props.setLocalCatalog}/></div>:
   <div className="market-lab-stage" key={variant}>
    {variant==='a'?<MarketDiscovery watch={props.watch} toggle={props.toggle} search={props.search} setSearch={props.setSearch} onlyWatch={props.onlyWatch} setOnlyWatch={props.setOnlyWatch} designV1/>:
     <Explorer variant={variant} watch={props.watch} toggle={props.toggle} search={props.search} setSearch={props.setSearch} onlyWatch={props.onlyWatch} setOnlyWatch={props.setOnlyWatch}/>}
   </div>}
 </div>;
}
