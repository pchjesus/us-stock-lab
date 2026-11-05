import {ManualWorkspace} from './ManualUI';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {instruments,quote,asOf,type Instrument} from './data';
import {useWatchlist} from './watchlist';
import {useAccount,Portfolio,type AccountView} from './TradingUI';
const AuthPanel=React.lazy(()=>import('./AuthPanel').then(module=>({default:module.AuthPanel})));
import {Learning} from './Learning';
import {StockDetail} from './StockDetail';
import {CatalogDiscovery} from './CatalogDiscovery';
import {MarketDiscovery} from './MarketDiscovery';
import type {LocalCatalog} from './catalogImport';
import {HomeDashboard} from './HomeDashboard';
import {useMarketInfo,IndicatorCards,MarketToolbar,CalendarPanel,NewsPanel} from './MarketPanels';
import {AccountModeControl,HeaderTools} from './UiPanels';
import {CurrencyProvider,DisplaySettings,useCurrency,displayFx} from './preferences';
import './style.css';
const manualTradingEnabled=import.meta.env.VITE_ENABLE_MANUAL_TRADING==='true';
const tabs=[['home','홈','◫'],['market','시장','↗'],['portfolio','포트폴리오','▤'],['learn','학습','◷'],['settings','설정','⚙']] as const;
const money=(v:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);
function routeFromLocation(){const hash=location.hash.slice(1);return hash.includes('access_token=')||hash.startsWith('error=')||new URLSearchParams(location.search).has('code')?'settings':hash||'home';}
function App(){const account=useAccount();return <CurrencyProvider uid={account.userId}><Workspace account={account}/></CurrencyProvider>;}
function Workspace({account}:{account:AccountView}){const [manualOwner,setManualOwner]=useState('');const manual=manualTradingEnabled&&!!account.userId&&manualOwner===account.userId;useEffect(()=>{try{setManualOwner(account.userId&&localStorage.getItem('manual.mode.'+account.userId)==='manual'?account.userId:'');}catch{setManualOwner('');}},[account.userId]);const currency=useCurrency();const money=(dollars:number)=>currency.format(Math.round(dollars*100));const info=useMarketInfo();const [search,setSearch]=useState('');const [onlyWatch,setOnlyWatch]=useState(false);const [route,setRoute]=useState(routeFromLocation);const [collapsed,setCollapsed]=useState(()=>{try{return localStorage.getItem('sidebar.collapsed')==='true';}catch{return false;}});const {watch,toggle:toggleWatch,error:watchError}=useWatchlist(account.userId);const [notice,setNotice]=useState('');
useEffect(()=>{const update=()=>setRoute(routeFromLocation());window.addEventListener('hashchange',update);return()=>{window.removeEventListener('hashchange',update);};},[]);
useEffect(()=>{if(!location.hash.includes('access_token=')&&!location.hash.startsWith('#error=')&&!new URLSearchParams(location.search).has('code'))return;
 const callbackError=location.hash.startsWith('#error=');
 void import('./auth').then(m=>m.getAuthClient()?.auth.getSession()).then(result=>{if(callbackError||result?.error||!result?.data.session)setNotice('로그인 링크를 확인하지 못했습니다. 새 링크를 요청하세요.');location.hash='settings';}).catch(()=>{setNotice('로그인 링크 처리 중 연결 오류가 발생했습니다.');location.hash='settings';});
},[]);

function toggle(symbol:string){void toggleWatch(symbol);}
const selected=instruments.find(s=>route===`stock/${s.symbol}`);const current=selected||['indices','calendar','news'].includes(route)?'market':route.startsWith('learn/')?'learn':route;
const [marketMode,setMarketMode]=useState<'supported'|'catalog'>('supported');const [localCatalog,setLocalCatalog]=useState<LocalCatalog|null>(null);useEffect(()=>{setLocalCatalog(null);},[account.userId]);
useEffect(()=>{if(route!=='market')setMarketMode('supported');},[route]);
const accountControls=<AccountModeControl manual={manual} uid={account.userId} enabled={manualTradingEnabled} onChange={mode=>{setManualOwner(mode==='manual'?account.userId??'':'');try{if(account.userId)localStorage.setItem('manual.mode.'+account.userId,mode);}catch{setNotice('계좌 모드 보관 실패');}}}/>;
function rows(list:readonly Instrument[]){return <div className="stocks">{list.map(s=>{const q=quote(s);return <div className="stock" key={s.symbol}><a href={`#stock/${s.symbol}`} className="identity"><span className="avatar">{s.symbol.slice(0,2)}</span><span><strong>{s.name}</strong><small>{s.symbol} · {s.kind}</small></span></a><div className="price"><strong>{money(q.price)}</strong><small className={q.change>=0?'up':'down'}>{q.change>=0?'+':''}{q.change.toFixed(2)}%</small></div><button className="star" aria-label={`${s.symbol} 관심종목`} aria-pressed={watch.includes(s.symbol)} onClick={()=>toggle(s.symbol)}>{watch.includes(s.symbol)?'★':'☆'}</button></div>})}</div>}
return <div className={"app ui-foundation "+(collapsed?"collapsed":"")}><aside><button className="collapse-toggle" aria-label="사이드바 접기 펼치기" aria-expanded={!collapsed} onClick={()=>{setCollapsed(!collapsed);try{localStorage.setItem("sidebar.collapsed",String(!collapsed));}catch{setNotice("사이드바 상태 저장 실패");}}}>☰</button><a className="brand" href="#home"><span className="logo">U</span>US Stock Lab</a><p className="eyebrow">나의 투자 연습실</p><nav>{tabs.map(([id,label,icon])=><a key={id} href={`#${id}`} title={label} aria-label={icon+" "+label} aria-current={current===id?'page':undefined}><span>{icon}</span>{label}</a>)}</nav><div className="side-note">작게 배우고<br/>차근차근 투자하기<span>v0.8 · 모의투자</span></div></aside><div className="workspace"><header><HeaderTools route={route} view={account} uid={account.userId} events={info.data?.events??[]} indicators={info.data?.indicators??[]} marketMode={info.mode}/></header><main><div className="source">가격·지수는 학습용 합성 데이터 · 실제 시세 아님 · 생성 기준 {asOf}</div>{notice&&<p role="alert">{notice}</p>}{watchError&&<p role="alert">{watchError}</p>}{currency.error&&route!=="settings"&&<p role="alert">{currency.error}</p>}{currency.currency==="KRW"&&<div className="currency-note">KRW 표시 · 합성 환율 1 USD = {displayFx.value?.toLocaleString()}원 · 주문/체결/원장은 USD 기준</div>}
{route==='home'&&<HomeDashboard account={account} manual={manual} market={info} watchCount={watch.length} watchRows={rows(instruments.filter(s=>watch.includes(s.symbol)))}/>}
{['market','indices'].includes(route)&&<><h1>시장</h1><p>궁금한 기업과 ETF를 찾아보세요.</p><MarketToolbar view={info}/>{route==='indices'?<IndicatorCards view={info}/>:<><div className="market-discovery-modes" role="group" aria-label="종목 탐색 모드"><button aria-pressed={marketMode==='supported'} onClick={()=>setMarketMode('supported')}>모의투자 지원 종목</button><button aria-pressed={marketMode==='catalog'} onClick={()=>setMarketMode('catalog')}>미국 종목 후보 탐색</button></div>{marketMode==='catalog'?<CatalogDiscovery key={account.userId??'local'} catalog={localCatalog} setCatalog={setLocalCatalog}/>:<MarketDiscovery watch={watch} toggle={toggle} search={search} setSearch={setSearch} onlyWatch={onlyWatch} setOnlyWatch={setOnlyWatch}/>}</>}</>}
{selected&&<StockDetail key={selected.symbol} stock={selected} account={account} manual={manual} watched={watch.includes(selected.symbol)} toggleWatch={()=>toggle(selected.symbol)}/>}
{route==='portfolio'&&<><h1>포트폴리오</h1>{accountControls}{manual?<ManualWorkspace key={account.userId} uid={account.userId!}/>:<Portfolio key={account.modeKey} view={account}/>}</>}
{(route==='learn'||route.startsWith('learn/'))&&<Learning route={route}/>}
{route==='calendar'&&<CalendarPanel view={info}/>}
{route==='news'&&<NewsPanel view={info}/>}
{route==='settings'&&<><h1>설정 및 서비스 안내</h1>{accountControls}<DisplaySettings collapsed={collapsed} setCollapsed={value=>{try{localStorage.setItem("sidebar.collapsed",String(value));setCollapsed(value);}catch{setNotice("사이드바 상태 저장 실패");}}}/><React.Suspense fallback={<p role="status">로그인 화면 불러오는 중…</p>}><AuthPanel/></React.Suspense><section className="panel"><h2>데이터 안내</h2><p>종목 가격·캔들·지수·환율은 모두 자체 생성한 합성 데모입니다. 실제 시세나 과거 시장 기록이 아닙니다.</p><p>생성 기준: {asOf} · 차트는 2026년 6~9월 합성 구간</p><h2>안전한 연습 공간</h2><p>실제 증권계좌 연결, 실거래, 자금이동 기능은 제공하지 않습니다. 개인정보와 실제 계좌 정보를 입력하지 마세요.</p><h2>브라우저 저장</h2><p>비로그인 로컬 데모는 이 브라우저에 저장됩니다. 로그인하면 사용자별 서버 계좌와 관심종목을 복원합니다. 사이트 데이터 삭제는 로컬 데모에 영향을 주며 서버 거래 기록은 유지됩니다.</p><h2>차트 라이브러리</h2><p><a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView 공식 사이트 ↗</a> Lightweight Charts™ · Apache 2.0</p></section></>}
{!selected&&!tabs.some(t=>t[0]===route)&&!['indices','calendar','news'].includes(route)&&!route.startsWith('learn/')&&<section className="panel"><h1>화면을 찾을 수 없어요</h1><a href="#home">홈으로 이동</a></section>}
<footer>US Stock Lab · 학습용 데모 · 실제 거래 불가</footer></main></div></div>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
