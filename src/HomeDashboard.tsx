import type {ReactNode} from 'react';
import {AccountSummary,type AccountView} from './TradingUI';
import {ManualWorkspace} from './ManualUI';
import {HomeMarketSummary,ImportantBanner,type MarketView} from './MarketPanels';

export function HomeDashboard({account,manual,market,watchCount,watchRows}:{account:AccountView;manual:boolean;market:MarketView;watchCount:number;watchRows:ReactNode}){
 return <div className="home-dashboard">
  <div className="heading home-heading"><div><p className="eyebrow">MY INVESTMENT LAB</p><h1>오늘도 한 걸음, 투자 연습</h1></div></div>
  <section className="home-section home-account" aria-labelledby="home-account-title">
   <div className="home-section-title"><h2 id="home-account-title">나의 모의투자 현황</h2><a className="ui-link" href="#portfolio">포트폴리오 자세히 →</a></div>
   {manual?<ManualWorkspace key={account.userId} uid={account.userId!}/>:<AccountSummary view={account}/>}
  </section>
  <section className="home-section" aria-labelledby="home-market-title">
   <div className="home-section-title"><h2 id="home-market-title">미국 시장 한눈에</h2><a className="ui-link" href="#indices">전체 지표·참고환율·재무부 →</a></div>
   <HomeMarketSummary view={market}/>
  </section>
  <section className="panel home-section home-watchlist" aria-labelledby="home-watch-title">
   <div className="home-section-title"><h2 id="home-watch-title">관심종목 <span>{watchCount}개</span></h2><a className="ui-link" href="#market">8종목 검색·관심 추가 →</a></div>
   <p className="home-note">기업·ETF의 교육용 합성 가격 · 실제 현재가가 아닙니다.</p>
   {watchCount?watchRows:<div className="home-empty"><strong>아직 담은 관심종목이 없어요</strong><p>시장에서 기업·ETF를 살펴보고 ☆을 눌러 추가하세요.</p><a className="ui-link" href="#market">기업·ETF 둘러보기 →</a></div>}
  </section>
  <section className="home-section home-explore" aria-labelledby="home-explore-title">
   <div className="home-section-title"><h2 id="home-explore-title">배우고, 시장을 살펴보세요</h2></div>
   <div className="home-explore-grid">{[['#learn','투자 학습','기초 개념부터 차트 연습까지'],['#calendar','경제 캘린더','중요 발표 일정과 상태 확인'],['#news','뉴스·공식 자료','뉴스 수신 상태와 공식 출처'],['#indices','전체 시장 지표','6개 지표·실제 참고환율·재무부 통계']].map(([href,title,note])=><a className="home-explore-link" href={href} key={href}><strong>{title} <span aria-hidden="true">→</span></strong><span>{note}</span></a>)}</div>
   <div className="home-important"><ImportantBanner view={market}/></div>
  </section>
 </div>;
}
