import {useDeferredValue,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {instruments,quote,asOf,type Instrument} from '../../data';
import {metadata} from '../../uiData';
import {useCurrency} from '../../preferences';
import {quoteLinks} from '../../ManualUI';

type Sector='전체'|'정보기술'|'경기소비재'|'커뮤니케이션'|'ETF'|'기타';
type View='cards'|'list';
type Sort='symbol-asc'|'symbol-desc'|'price-desc'|'price-asc'|'change-desc'|'change-asc'|'sector-asc'|'favorite-first';
type QuoteRow={item:Instrument;price:number;change:number;date:string;sector:Sector};
const pageSizes=[12,24,48,96] as const;
const options:readonly {value:Sort;label:string}[]=[
 {value:'symbol-asc',label:'심볼 A–Z'}, {value:'symbol-desc',label:'심볼 Z–A'},
 {value:'favorite-first',label:'관심종목 우선'},{value:'sector-asc',label:'산업군별'},
 {value:'price-desc',label:'합성 가격 높은 순'}, {value:'price-asc',label:'합성 가격 낮은 순'},
 {value:'change-desc',label:'합성 변동률 높은 순'}, {value:'change-asc',label:'합성 변동률 낮은 순'}
];
function sectorOf(item:Instrument):Sector{
 if(item.kind==='ETF')return 'ETF';
 if(item.sector==='기술'||item.sector==='반도체')return '정보기술';
 if(item.sector==='소비재')return '경기소비재';
 if(item.sector==='커뮤니케이션')return '커뮤니케이션';
 return '기타';
}
function readMode():View{
 try{return localStorage.getItem('us-stock-lab.market-view-mode')==='list'?'list':'cards';}catch{return 'cards';}
}
function readPageSize():number{
 try{const n=Number(localStorage.getItem('us-stock-lab.market-page-size.v1'));return pageSizes.includes(n as (typeof pageSizes)[number])?n:24;}catch{return 24;}
}
function remember(key:string,value:string){try{localStorage.setItem(key,value);}catch{/* display settings should work in memory if browser storage is blocked */}}
function symbolAvatar(symbol:string){return symbol==='AAPL'?'AP':symbol==='MSFT'?'MS':symbol==='NVDA'?'NV':symbol==='AMZN'?'AM':symbol==='GOOGL'?'GO':symbol;}
function Change({value}:{value:number}){
 return <span className={'market-v3-change '+(value>=0?'up':'down')}>{value>0?'+':''}{value.toFixed(2)}%</span>;
}
function Star({symbol,watch,toggle}:{symbol:string;watch:readonly string[];toggle:(symbol:string)=>void}){
 const watched=watch.includes(symbol);
 return <button className="market-v3-star" type="button" aria-pressed={watched} aria-label={symbol+' 관심종목'} title={watched?'관심 해제':'관심 추가'} onClick={()=>toggle(symbol)}>
  <svg viewBox="0 0 24 24" width="19" height="19" fill={watched?'currentColor':'none'} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 2.5 3.05 6.18 6.82.99-4.94 4.82 1.17 6.8L12 18.08l-6.1 3.21 1.17-6.8-4.94-4.82 6.82-.99z"/></svg>
 </button>;
}
function DiscoveryCard({row,watch,toggle,onPreview,index}:{row:QuoteRow;watch:readonly string[];toggle:(symbol:string)=>void;onPreview:()=>void;index:number}){
 const currency=useCurrency();
 const {item}=row;
 return <article className="market-v3-card" data-symbol={item.symbol} style={{'--v3-stagger':Math.min(index,8)} as CSSProperties}>
  <div className="market-v3-card-top"><span className="market-v3-avatar" aria-hidden="true">{symbolAvatar(item.symbol)}</span><Star symbol={item.symbol} watch={watch} toggle={toggle}/></div>
  <div className="market-v3-card-heading"><a href={'#stock/'+item.symbol}>{item.name}<span aria-hidden="true"> ↗</span></a><p>{item.symbol} · {row.sector}</p></div>
  <p className="market-v3-card-desc">{metadata[item.symbol]?.description??'자세한 기업 설명은 검증 후 제공됩니다.'}</p>
  <div className="market-v3-card-metric"><div><small>학습용 합성 가격</small><strong>{currency.format(Math.round(row.price*100))}</strong></div><Change value={row.change}/></div>
  <div className="market-v3-card-bottom"><small>기준 {row.date}</small><button type="button" onClick={onPreview} aria-label={item.symbol+' 빠른 정보'}>빠른 정보 <span aria-hidden="true">↗</span></button></div>
 </article>;
}
function QuickPreview({row,watch,toggle,onClose}:{row:QuoteRow;watch:readonly string[];toggle:(symbol:string)=>void;onClose:()=>void}){
 const currency=useCurrency(),url=quoteLinks(row.item.symbol).TradingView;
 return <div className="market-v3-quick-content">
  <div className="market-v3-quick-header"><div><span className="market-v3-kicker">QUICK LOOK · 읽기 전용</span><h2 id="market-v3-preview-title">{row.item.name}</h2><p>{row.item.symbol} · {metadata[row.item.symbol]?.exchange??'거래소 미확인'} · {row.sector}</p></div>
   <button type="button" className="market-v3-close" aria-label="미리보기 닫기" autoFocus onClick={onClose}>✕</button></div>
  <p className="market-v3-quick-desc">{metadata[row.item.symbol]?.description??'기업 상세 정보를 확인해 주세요.'}</p>
  <dl className="market-v3-quick-metrics"><div><dt>교육용 합성 가격</dt><dd>{currency.format(Math.round(row.price*100))}</dd></div><div><dt>합성 변동률</dt><dd><Change value={row.change}/></dd></div></dl>
  <p className="market-v3-quick-note">합성 시세 · 실제 현재가 아님 · 생성 기준 {row.date} · 시가총액 데이터 미연동</p>
  <div className="market-v3-quick-actions"><a href={'#stock/'+row.item.symbol} onClick={onClose}>종목 상세 보기 ↗</a>
   <Star symbol={row.item.symbol} watch={watch} toggle={toggle}/></div>
  {url&&<a className="market-v3-quick-external" href={url} target="_blank" rel="noopener noreferrer" aria-label={row.item.symbol+' 외부 시세 확인 (새 탭)'}>외부 실제 시세 확인 ↗</a>}
 </div>;
}
export function MarketExplorerV3({watch,toggle,search,setSearch,onlyWatch,setOnlyWatch}:{
 watch:readonly string[];toggle:(symbol:string)=>void;search:string;setSearch:(value:string)=>void;onlyWatch:boolean;setOnlyWatch:(value:boolean)=>void;
}){
 const currency=useCurrency();
 const [mode,setMode]=useState<View>(readMode);
 const [sector,setSector]=useState<Sector>('전체');
 const [sort,setSort]=useState<Sort>('symbol-asc');
 const [pageSize,setPageSize]=useState(readPageSize);
 const [page,setPage]=useState(0);
 const [preview,setPreview]=useState<QuoteRow|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const searchInput=useRef<HTMLInputElement>(null);
 const resultsAnchor=useRef<HTMLDivElement>(null);
 const deferred=useDeferredValue(search);
 const rows=useMemo<QuoteRow[]>(()=>instruments.map(item=>{
  const q=quote(item);return {item,price:q.price,change:q.change,date:q.date,sector:sectorOf(item)};
 }),[]);
 const sectors=useMemo(()=>['전체',...new Set(rows.map(r=>r.sector))] as Sector[],[rows]);
 const filtered=useMemo(()=>{
  const q=deferred.trim().toLocaleLowerCase();
  const result=rows.filter(r=>(sector==='전체'||r.sector===sector)&&(!onlyWatch||watch.includes(r.item.symbol))
   &&(r.item.symbol.toLocaleLowerCase().includes(q)||r.item.name.toLocaleLowerCase().includes(q)));
  return result.sort((a,b)=>{
   let d=0;
   switch(sort){
    case 'symbol-asc':d=a.item.symbol.localeCompare(b.item.symbol);break;
    case 'symbol-desc':d=b.item.symbol.localeCompare(a.item.symbol);break;
    case 'price-desc':d=b.price-a.price;break;
    case 'price-asc':d=a.price-b.price;break;
    case 'change-desc':d=b.change-a.change;break;
    case 'change-asc':d=a.change-b.change;break;
    case 'sector-asc':d=a.sector.localeCompare(b.sector,'ko');break;
    case 'favorite-first':d=Number(watch.includes(b.item.symbol))-Number(watch.includes(a.item.symbol));break;
   }
   return d||a.item.symbol.localeCompare(b.item.symbol);
  });
 },[rows,deferred,sector,onlyWatch,watch,sort]);
 const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
 const currentPage=Math.min(page,pageCount-1);
 const visible=filtered.slice(currentPage*pageSize,(currentPage+1)*pageSize);
 const start=filtered.length?currentPage*pageSize+1:0;
 const end=filtered.length?currentPage*pageSize+visible.length:0;
 function view(next:View){setMode(next);setPage(0);remember('us-stock-lab.market-view-mode',next);}
 function reset(){setSearch('');setSector('전체');setSort('symbol-asc');setOnlyWatch(false);setPage(0);}
 function quickLook(row:QuoteRow){setPreview(row);dialog.current?.showModal();}
 function closePreview(){dialog.current?.close();}
 function changePage(next:number){
  setPage(Math.max(0,Math.min(pageCount-1,next)));
  resultsAnchor.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }
 useEffect(()=>{
  function shortcut(event:KeyboardEvent){
   const active=document.activeElement;const tag=active?.tagName;
   if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.repeat&&
    !['INPUT','TEXTAREA','SELECT'].includes(tag??'')&&!active?.getAttribute('contenteditable')?.includes('true')){
    event.preventDefault();searchInput.current?.focus();
   }
  }
  window.addEventListener('keydown',shortcut);return()=>window.removeEventListener('keydown',shortcut);
 },[]);
 return <section className="market-v3" aria-label="모의투자 지원 종목">
  <div className="market-v3-search-panel">
   <div className="market-v3-search-heading"><div><span className="market-v3-kicker">DISCOVER · STOCKS & ETFs</span><h2>관심 가는 기업부터 찾아봐</h2><p>카드로 둘러보고, 많은 종목은 목록으로 빠르게 비교할 수 있어.</p></div>
    <div className="market-v3-count" aria-label={instruments.length+'개 지원 종목 중 '+filtered.length+'개 검색 결과'}><strong>{filtered.length}</strong><span> / {instruments.length}개</span></div></div>
   <label className="market-v3-searchbox"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16.2 16.2 5 5"/></svg>
    <span className="sr-only">종목 검색</span><input ref={searchInput} aria-label="종목 검색" placeholder="회사 이름이나 심볼 검색 ( / )" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
    {search&&<button type="button" aria-label="검색어 지우기" onClick={()=>{setSearch('');setPage(0);searchInput.current?.focus();}}>✕</button>}</label>
   <div className="market-v3-filters"><div role="group" aria-label="섹터 선택" className="market-v3-sectors">{sectors.map(s=><button key={s} type="button" aria-pressed={sector===s} onClick={()=>{setSector(s);setPage(0);}}>{s}</button>)}</div>
    <div className="market-v3-filter-actions"><button type="button" aria-pressed={onlyWatch} onClick={()=>{setOnlyWatch(!onlyWatch);setPage(0);}}>☆ 관심종목만</button><button type="button" onClick={reset}>필터 초기화</button></div></div>
   <p className="market-v3-sector-source">교육용 합성 시세 · 실제 시장가격 아님 · 생성 기준 {asOf} · 섹터 분류 <a href="https://www.spglobal.com/spdji/en/indices/equity/sp-500/" target="_blank" rel="noopener noreferrer">S&amp;P DJI 참고 ↗</a></p>
  </div>
  <div className="market-v3-results-header" ref={resultsAnchor}>
   <div><h3>종목 탐색</h3><p role="status" aria-live="polite">{filtered.length.toLocaleString()}개 중 {start}–{end}개 표시</p></div>
   <div className="market-v3-result-controls">
    <div className="market-v3-view-switch" role="group" aria-label="종목 보기 방식">
     <button type="button" aria-pressed={mode==='cards'} onClick={()=>view('cards')}><span aria-hidden="true">▦</span> 카드</button>
     <button type="button" aria-pressed={mode==='list'} onClick={()=>view('list')}><span aria-hidden="true">☷</span> 목록</button>
    </div>
    <label className="market-v3-control-label">정렬 <select aria-label="결과 정렬" value={sort} onChange={e=>{setSort(e.target.value as Sort);setPage(0);}}>
     {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
     <option disabled value="cap-desc">시가총액 높은 순 · 데이터 연동 대기</option>
     <option disabled value="cap-asc">시가총액 낮은 순 · 데이터 연동 대기</option>
    </select></label>
    <label className="market-v3-control-label">표시 <select aria-label="페이지당 표시 개수" value={pageSize} onChange={e=>{const n=Number(e.target.value);setPageSize(n);setPage(0);remember('us-stock-lab.market-page-size.v1',String(n));}}>
     {pageSizes.map(n=><option key={n} value={n}>{n}개씩 보기</option>)}</select></label>
   </div>
  </div>
  <p className="market-v3-data-note">시가총액 정렬은 검증된 실제 시가총액 자료 연동 후 활성화돼. 합성 주가로 시가총액을 만들지 않아.</p>
  {visible.length===0?<div className="market-v3-empty" role="status"><strong>검색 결과가 없어</strong><p>검색어나 산업군 필터를 바꿔보자.</p><button onClick={reset}>모두 보기</button></div>:
   <div className="market-v3-results" key={mode}>
    {mode==='cards'?<div className="market-v3-grid" data-testid="market-v3-card-grid">
     {visible.map((row,index)=><DiscoveryCard key={row.item.symbol} row={row} watch={watch} toggle={toggle} onPreview={()=>quickLook(row)} index={index}/>)}
    </div>:
    <div className="market-v3-list" data-testid="market-v3-list">
     <div className="market-v3-table-wrap"><table className="market-v3-table"><caption className="sr-only">지원 종목 비교표 · 가격과 변동률은 교육용 합성값이며 시가총액은 제공되지 않음</caption><thead><tr>
      <th scope="col">종목</th><th scope="col">분야</th><th scope="col">합성 가격</th><th scope="col">합성 변동률</th><th scope="col">시가총액</th><th scope="col">관심</th><th scope="col">정보</th>
     </tr></thead><tbody>{visible.map(row=><tr key={row.item.symbol} data-symbol={row.item.symbol}><td><a href={'#stock/'+row.item.symbol}><strong>{row.item.symbol}</strong><span>{row.item.name}</span></a></td>
      <td>{row.sector}</td><td className="market-v3-numeric">{currency.format(Math.round(row.price*100))}</td><td><Change value={row.change}/></td>
      <td className="market-v3-unavailable">미제공</td><td><Star symbol={row.item.symbol} watch={watch} toggle={toggle}/></td>
      <td><button type="button" className="market-v3-view-details" onClick={()=>quickLook(row)} aria-label={row.item.symbol+' 빠른 정보'}>보기 ↗</button></td></tr>)}</tbody></table></div>
     <div className="market-v3-mobile-list">{visible.map(row=><article key={row.item.symbol} className="market-v3-mobile-row" data-symbol={row.item.symbol}>
      <a href={'#stock/'+row.item.symbol}><strong>{row.item.symbol}</strong><span>{row.item.name}</span></a>
      <div><strong>{currency.format(Math.round(row.price*100))}</strong><Change value={row.change}/></div>
      <div className="market-v3-mobile-actions"><Star symbol={row.item.symbol} watch={watch} toggle={toggle}/><button type="button" onClick={()=>quickLook(row)} aria-label={row.item.symbol+' 빠른 정보'}>빠른 정보 ↗</button></div>
     </article>)}</div>
    </div>}
   </div>}
  {filtered.length>pageSize&&<nav className="market-v3-pagination" aria-label="검색 결과 페이지">
   <button type="button" onClick={()=>changePage(0)} disabled={currentPage===0}>처음</button>
   <button type="button" onClick={()=>changePage(currentPage-1)} disabled={currentPage===0}>이전</button>
   <span aria-live="polite">{currentPage+1} / {pageCount} 페이지</span>
   <button type="button" onClick={()=>changePage(currentPage+1)} disabled={currentPage===pageCount-1}>다음</button>
   <button type="button" onClick={()=>changePage(pageCount-1)} disabled={currentPage===pageCount-1}>마지막</button>
  </nav>}
  <dialog ref={dialog} className="market-v3-dialog" aria-labelledby="market-v3-preview-title" onClose={()=>setPreview(null)}
   onClick={e=>{if(e.target===e.currentTarget)closePreview();}}>
   {preview&&<QuickPreview row={preview} watch={watch} toggle={toggle} onClose={closePreview}/>}
  </dialog>
 </section>;
}
