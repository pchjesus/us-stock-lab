import type {ReactNode} from 'react';

/**
 * UI v1 navigation layer. All hrefs use existing hash routes and only change presentation.
 * No account, order, learning, or market state is owned by this component.
 */
type IconName='home'|'compass'|'wallet'|'chart'|'book'|'flask'|'history'|'calendar'|'news'|'settings'|'menu'|'arrow'|'layers';
export function V1Icon({name,size=20}:{name:IconName;size?:number}){
 const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true as const};
 switch(name){
  case 'home':return <svg {...common}><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></svg>;
  case 'compass':return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.4 4.6-4.6 2.4 2.4-4.6z"/></svg>;
  case 'wallet':return <svg {...common}><rect x="3" y="6" width="18" height="15" rx="3"/><path d="M3 10h18M7 6V3h12"/><circle cx="17" cy="15.5" r="1" fill="currentColor" stroke="none"/></svg>;
  case 'chart':return <svg {...common}><path d="M3 20h18M5 16l5-5 4 3 6-8"/><path d="M16 6h4v4"/></svg>;
  case 'book':return <svg {...common}><path d="M12 5c-2-2-5-2-9-2v16c4 0 7 0 9 2 2-2 5-2 9-2V3c-4 0-7 0-9 2z"/><path d="M12 5v16"/></svg>;
  case 'flask':return <svg {...common}><path d="M9 3h6m-5 0v7l-6 9a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2l-6-9V3"/><path d="M7 16h10"/></svg>;
  case 'history':return <svg {...common}><path d="M3 12a9 9 0 1 1 3 6.7M3 17v-5h5"/><path d="M12 7v5l3 2"/></svg>;
  case 'calendar':return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></svg>;
  case 'news':return <svg {...common}><rect x="5" y="4" width="16" height="17" rx="2"/><path d="M9 9h8M9 13h8M9 17h5M3 7v11c0 1.7 1 3 2 3"/></svg>;
  case 'settings':return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2m-16-7 1.6 1.6m10.8 10.8 1.6 1.6m0-13-1.6 1.6M7.1 16.9l-1.6 1.6"/></svg>;
  case 'menu':return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
  case 'arrow':return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6"/></svg>;
  case 'layers':return <svg {...common}><path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></svg>;
 }
}
type NavEntry={href:string;label:string;icon:IconName;matches:(route:string)=>boolean};
const navigation:NavEntry[]=[
 {href:'#home',label:'홈',icon:'home',matches:r=>r==='home'},
 {href:'#market',label:'시장 탐색',icon:'compass',matches:r=>r==='market'||r==='indices'||r.startsWith('stock/')||r==='calendar'||r==='news'},
 {href:'#portfolio',label:'내 포트폴리오',icon:'wallet',matches:r=>r==='portfolio'},
 {href:'#portfolio/analysis',label:'분석실',icon:'chart',matches:r=>r==='portfolio/analysis'||r==='backtest'},
 {href:'#learn',label:'학습',icon:'book',matches:r=>r==='learn'||r.startsWith('learn/')}
];
const tools:NavEntry[]=[
 {href:'#experience',label:'체험실',icon:'flask',matches:r=>r==='experience'},
 {href:'#backtest',label:'백테스팅',icon:'history',matches:r=>r==='backtest'},
 {href:'#calendar',label:'경제 일정',icon:'calendar',matches:r=>r==='calendar'},
 {href:'#news',label:'뉴스·자료',icon:'news',matches:r=>r==='news'}
];
const settingsEntry:NavEntry={href:'#settings',label:'설정',icon:'settings',matches:r=>r==='settings'};
function NavLink({entry,route,compact=false}:{entry:NavEntry;route:string;compact?:boolean}){
 const active=entry.matches(route);
 return <a className={'v1-nav-link'+(active?' is-active':'')+(compact?' is-compact':'')} href={entry.href} aria-current={active?'page':undefined} title={entry.label}>
  <V1Icon name={entry.icon} size={compact?20:19}/><span>{compact?({'시장 탐색':'시장','내 포트폴리오':'내 투자','분석실':'분석'} as Record<string,string>)[entry.label]??entry.label:entry.label}</span>
 </a>;
}
export function V1Navigation({route,collapsed,onToggle}:{route:string;collapsed:boolean;onToggle:()=>void}){
 return <>
  <aside className="v1-sidebar" aria-label="US Stock Lab 메뉴">
   <div className="v1-sidebar-top">
    <a href="#home" className="v1-logo" aria-label="US Stock Lab 홈">
     <span className="v1-logo-mark" aria-hidden="true"><V1Icon name="layers" size={21}/></span>
     <span className="v1-logo-copy"><strong>US Stock Lab</strong><small>SIMULATED INVESTING</small></span>
    </a>
    <button type="button" className="v1-collapse-button" title={collapsed?'메뉴 펼치기':'메뉴 접기'} aria-label={collapsed?'메뉴 펼치기':'메뉴 접기'} aria-expanded={!collapsed} onClick={onToggle}><V1Icon name="menu" size={19}/></button>
   </div>
   <div className="v1-sidebar-scroll">
    <p className="v1-sidebar-label">워크스페이스</p>
    <nav aria-label="주요 메뉴" className="v1-desktop-primary">{navigation.map(e=><NavLink key={e.href} entry={e} route={route}/>)}</nav>
    <p className="v1-sidebar-label">연습과 자료</p>
    <nav aria-label="도구 및 자료" className="v1-desktop-tools">{tools.map(e=><NavLink key={e.href} entry={e} route={route}/>)}</nav>
    <p className="v1-sidebar-label">계정과 환경</p>
    <nav aria-label="계정 및 설정" className="v1-desktop-settings"><NavLink entry={settingsEntry} route={route}/></nav>
   </div>
   <div className="v1-sidebar-bottom">
    <span className="v1-demo-dot" aria-hidden="true"/>
    <div><strong>가상 투자 환경</strong><span>실제 거래·입출금 불가</span></div>
    <V1Icon name="layers" size={18}/>
   </div>
  </aside>
  <nav aria-label="모바일 주요 메뉴" className="v1-mobile-nav">{navigation.map(e=><NavLink key={e.href} entry={e} route={route} compact/>)}</nav>
 </>;
}
const breadcrumbs:Record<string,{category:string;description:string}>={
 home:{category:'대시보드',description:'내 가상자산과 시장을 한곳에서'},
 market:{category:'시장 탐색',description:'기업·ETF를 살펴보고 관심종목 관리'},
 portfolio:{category:'내 투자',description:'보유자산·거래내역·가상 현금원장'},
 'portfolio/analysis':{category:'포트폴리오 분석',description:'자산 구성·위험·수익률 분석'},
 backtest:{category:'백테스팅',description:'서로 다른 합성 투자 시나리오 비교'},
 learn:{category:'투자 학습',description:'개념 공부부터 실습·오답 복습까지'},
 experience:{category:'합성 체험실',description:'실제 계좌에 영향을 주지 않는 안전한 연습'},
 calendar:{category:'경제 캘린더',description:'경제 일정과 확인 가능한 출처'},
 news:{category:'시장 뉴스',description:'정보의 출처와 기준 시각 확인'},
 indices:{category:'시장 지표',description:'주요 지수·환율·경제 통계'},
 settings:{category:'설정',description:'표시 환경·계정·서비스 안내'}
};
export function V1PageContext({route,children}:{route:string;children?:ReactNode}){
 const detail=route.startsWith('stock/');
 const item=detail?{category:'종목 상세',description:'기업·ETF 정보와 출처 확인'}:route.startsWith('learn/')?{category:'학습·실습',description:'나에게 맞는 학습 경로'}:breadcrumbs[route]??{category:'워크스페이스',description:'가상 투자 학습'};
 return <section className="v1-page-context" aria-label="현재 화면 안내">
  <div><span className="v1-breadcrumb">US STOCK LAB <span aria-hidden="true">/</span> {item.category}</span><p>{item.description}</p></div>
  {children??<span className="v1-context-badge"><span aria-hidden="true"/> PAPER TRADING ONLY</span>}
 </section>;
}
