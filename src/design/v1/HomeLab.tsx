import {useState,type ReactNode} from 'react';
import {HomeDashboard} from '../../HomeDashboard';
import {AccountSummary,type AccountView} from '../../TradingUI';
import {ManualWorkspace} from '../../ManualUI';
import {HomeMarketSummary,ImportantBanner,type MarketView} from '../../MarketPanels';

type Variant='a'|'b'|'c';
type Props={account:AccountView;manual:boolean;market:MarketView;watchCount:number;watchRows:ReactNode};
const choices:readonly {id:Variant;label:string;detail:string}[]=[
 {id:'a',label:'A · 자산 중심',detail:'검증된 UI v1: 자산 → 시장 → 관심종목 → 자료'},
 {id:'b',label:'B · 마켓 데스크',detail:'시장부터 읽고 계좌와 관심종목을 나란히 비교'},
 {id:'c',label:'C · 간결한 시작',detail:'자산 다음에 필요한 행동을 먼저 보여주는 미니멀 홈'}
];
function readVariant():Variant{
 try{const value=new URLSearchParams(location.search).get('homeVariant');return value==='b'||value==='c'?value:'a';}
 catch{return 'a';}
}
function ExperimentalLayout({account,manual,market,watchCount,watchRows,variant}:Props&{variant:'b'|'c'}){
 const accountSection=<section key="account" className="home-section home-account" aria-labelledby="home-account-title">
  <div className="home-section-title"><h2 id="home-account-title">나의 모의투자 현황</h2><a className="ui-link" href="#portfolio">포트폴리오 자세히 →</a></div>
  {manual?<ManualWorkspace key={account.userId} uid={account.userId!}/>:<AccountSummary view={account}/>}
 </section>;
 const marketSection=<section key="market" className="home-section home-market" aria-labelledby="home-market-title">
  <div className="home-section-title"><h2 id="home-market-title">미국 시장 한눈에</h2><a className="ui-link" href="#indices">전체 지표·참고환율·재무부 →</a></div>
  <HomeMarketSummary view={market}/>
 </section>;
 const watchSection=<section key="watch" className="panel home-section home-watchlist" aria-labelledby="home-watch-title">
  <div className="home-section-title"><h2 id="home-watch-title">관심종목 <span>{watchCount}개</span></h2><a className="ui-link" href="#market">8종목 검색·관심 추가 →</a></div>
  <p className="home-note">기업·ETF의 교육용 합성 가격 · 실제 현재가가 아닙니다.</p>
  {watchCount?watchRows:<div className="home-empty"><strong>아직 담은 관심종목이 없어요</strong><p>시장에서 기업·ETF를 살펴보고 ☆을 눌러 추가하세요.</p><a className="ui-link" href="#market">기업·ETF 둘러보기 →</a></div>}
 </section>;
 const exploreSection=<section key="explore" className="home-section home-explore" aria-labelledby="home-explore-title">
  <div className="home-section-title"><h2 id="home-explore-title">배우고, 시장을 살펴보세요</h2></div>
  <div className="home-explore-grid">{[['#learn','투자 학습','기초 개념부터 차트 연습까지'],['#calendar','경제 캘린더','중요 발표 일정과 상태 확인'],['#news','뉴스·공식 자료','뉴스 수신 상태와 공식 출처'],['#indices','전체 시장 지표','6개 지표·실제 참고환율·재무부 통계']].map(([href,title,note])=><a className="home-explore-link" href={href} key={href}><strong>{title} <span aria-hidden="true">→</span></strong><span>{note}</span></a>)}</div>
  <div className="home-important"><ImportantBanner view={market}/></div>
 </section>;
 const sections=variant==='b'?[marketSection,accountSection,watchSection,exploreSection]:[accountSection,exploreSection,watchSection,marketSection];
 return <div className="home-dashboard home-v2-layout">{sections}</div>;
}
/** UI-only design comparison: URL state changes never mutate account or market storage. */
export function HomeLab(props:Props){
 const [variant,setVariant]=useState<Variant>(readVariant);
 const selected=choices.find(choice=>choice.id===variant)!;
 function change(next:Variant){
  setVariant(next);
  try{const url=new URL(location.href);url.searchParams.set('homeVariant',next);history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
  catch{/* The selector remains operable even when URL replacement is blocked. */}
 }
 return <div className={'home-lab home-lab-'+variant}>
  <section className="home-lab-switcher" aria-label="홈 디자인 실험">
   <div className="home-lab-intro"><div><span className="home-lab-kicker">HOME DESIGN LAB · UI v2</span><h1>홈 화면 세 가지 방향</h1><p>{selected.detail}</p></div><span className="home-lab-state">비교용 디자인 · 실제 거래 없음</span></div>
   <div className="home-lab-options" role="group" aria-label="홈 디자인 선택">
    {choices.map(choice=><button key={choice.id} type="button" onClick={()=>change(choice.id)} aria-pressed={choice.id===variant}>{choice.label}</button>)}
   </div>
  </section>
  {variant==='a'?<HomeDashboard {...props}/>:<ExperimentalLayout {...props} variant={variant}/>}
 </div>;
}
