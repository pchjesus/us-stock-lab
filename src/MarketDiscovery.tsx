import {useState} from 'react';
import {instruments,quote} from './data';
import {useCurrency} from './preferences';
import {metadata} from './uiData';
import {quoteLinks} from './ManualUI';
type Sector='전체'|'정보기술'|'경기소비재'|'커뮤니케이션'|'ETF';
const sectors:Sector[]=['전체','정보기술','경기소비재','커뮤니케이션','ETF'];
const mapping:Record<(typeof instruments)[number]['symbol'],Exclude<Sector,'전체'>>={AAPL:'정보기술',MSFT:'정보기술',NVDA:'정보기술',AMZN:'경기소비재',GOOGL:'커뮤니케이션',VOO:'ETF',QQQ:'ETF',SCHD:'ETF'};
export function MarketDiscovery({watch,toggle,search,setSearch,onlyWatch,setOnlyWatch}:{watch:readonly string[];toggle:(symbol:string)=>void;search:string;setSearch:(value:string)=>void;onlyWatch:boolean;setOnlyWatch:(value:boolean)=>void}){
 const currency=useCurrency();const [sector,setSector]=useState<Sector>('전체');
 const filtered=instruments.filter(s=>(sector==='전체'||mapping[s.symbol]===sector)&&(!onlyWatch||watch.includes(s.symbol))&&`${s.symbol} ${s.name}`.toLowerCase().includes(search.trim().toLowerCase()));
 return <section className="panel supported-discovery" aria-label="모의투자 지원 종목"><div className="section-title"><h2>기업과 ETF 탐색</h2><span aria-live="polite">{filtered.length}개</span></div>
 <p>모의투자 지원 8종목 · 아래 가격은 교육용 합성 시세이며 실제 시세가 아닙니다.</p>
 <div className="sector-rail" role="group" aria-label="섹터 선택" tabIndex={0}>{sectors.map(s=><button key={s} aria-pressed={sector===s} onClick={()=>setSector(s)}>{s}</button>)}</div>
 <p className="sector-source">표시 분류 기준일 2026-11-05 · 주식은 GICS 섹터, 펀드는 ETF로 구분 · <a href="https://www.spglobal.com/spdji/en/indices/equity/sp-500/" target="_blank" rel="noopener noreferrer">S&amp;P DJI 분류 참고 ↗<span className="sr-only"> (새 탭)</span></a></p>
 <div className="toolbar"><input aria-label="종목 검색" placeholder="종목명 또는 심볼 검색" value={search} onChange={e=>setSearch(e.target.value)}/><button aria-pressed={onlyWatch} onClick={()=>setOnlyWatch(!onlyWatch)}>★ 관심종목만</button><button onClick={()=>{setSearch('');setOnlyWatch(false);setSector('전체')}}>필터 초기화</button></div>
 {filtered.length?<div className="stocks">{filtered.map(s=>{const url=quoteLinks(s.symbol).TradingView;const q=quote(s);return <div className="stock discovery-stock" key={s.symbol} data-symbol={s.symbol}><a href={`#stock/${s.symbol}`} className="identity"><span className="avatar">{s.symbol.slice(0,2)}</span><span><strong>{s.name}</strong><small>{s.symbol} · {mapping[s.symbol]}</small><span className="discovery-description">{metadata[s.symbol].description}</span></span></a><div className="discovery-price" data-testid={`market-price-${s.symbol}`}><strong>{currency.format(Math.round(q.price*100))}</strong><small>교육용 합성 시세</small><small className={q.change>=0?'up':'down'}>{q.change>=0?'+':''}{q.change.toFixed(2)}%</small></div><div className="discovery-actions">{url?<a className="ui-link discovery-external" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${s.symbol} 외부 시세 확인 (새 탭)`}>외부 시세 확인 ↗</a>:<span>외부 시세 링크 미지원</span>}<button className="star" aria-label={`${s.symbol} 관심종목`} aria-pressed={watch.includes(s.symbol)} onClick={()=>toggle(s.symbol)}>{watch.includes(s.symbol)?'★':'☆'}</button></div></div>})}</div>:<div className="empty" role="status">조건에 맞는 종목이 없습니다. 필터를 초기화해 보세요.</div>}
 </section>;
}
