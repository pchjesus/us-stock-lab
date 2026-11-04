import type {Instrument} from './data';
import {metadata} from './uiData';
export type EtfSection='overview'|'product'|'sources';
const issuers:Record<string,string>={VOO:'Vanguard',QQQ:'Invesco',SCHD:'Schwab'};
export function EtfDetail({stock,section}:{stock:Instrument;section:EtfSection}){
 const info=metadata[stock.symbol];
 const source=<a className="ui-link source-link" href={info.source} target="_blank" rel="noreferrer">{issuers[stock.symbol]} 공식 상품 페이지 ↗<span className="sr-only"> (새 탭)</span></a>;
 return <div role="region" className="etf-detail" aria-label="ETF 상품 안내">
  {section==='overview'?<><section className="panel"><p className="eyebrow">ETF · 여러 자산에 투자하는 상품</p><h2>{stock.name} · 상품 개요</h2><dl><dt>상품명</dt><dd>{stock.name} ({stock.symbol})</dd><dt>운용사</dt><dd>{issuers[stock.symbol]}</dd><dt>추종 지수·전략</dt><dd>{info.description}</dd><dt>분류</dt><dd>{info.industry}</dd><dt>거래소</dt><dd>{info.exchange}</dd></dl><p>기존 앱의 상품 소개입니다. 공식 상품 설명과 최신 운용 조건은 발행사 페이지에서 확인하세요.</p>{source}</section><section className="panel"><h2>ETF를 이해할 때</h2><p>기업의 매출·순이익 대신 투자 대상, 구성, 보수와 분배 정책을 살펴보세요. 분산된 상품도 시장과 추종 대상의 가격 변동 위험이 있습니다.</p><p>합성 모의 가격과 공식 상품 자료는 별개입니다. 확인되지 않은 비중이나 배당률을 추정하지 않습니다.</p></section></>:
   section==='product'?<section className="panel"><h2>ETF 상품정보</h2><p>현재 검증 자료에 없는 수치는 미확인/미제공으로 표시합니다. 0이나 비용·분배금이 없다는 뜻이 아닙니다.</p><div className="etf-product-grid">{[['보유종목','미제공','현재 검증된 보유종목 목록과 기준일이 없습니다.'],['자산·업종 구성','미제공','검증된 구성비가 없어 원형·도넛 그래프를 만들지 않습니다.'],['총보수','미확인','공식 최신 보수율과 적용 기준일을 확인해야 합니다.'],['분배금','미확인','공식 금액·주기·지급일이 미확인입니다. 무분배를 의미하지 않습니다.']].map(([label,status,note])=><article className="etf-missing" key={label}><h3>{label}</h3><strong>{status}</strong><p>{note}</p></article>)}</div>{source}<p>배당 여부·주기·수익률·지급액은 미연동입니다. 실제 값을 추정하지 않습니다.</p></section>:
   <section className="panel"><h2>ETF 공식 출처와 확인 기준</h2><p>자료 제공자: {issuers[stock.symbol]} · 기존 발행사 상품 페이지</p>{source}<p>상품 설명은 기존 앱 자료를 재사용합니다. 최신 보유종목·구성비·총보수·분배금의 자료 기준일과 확인일은 미확인입니다.</p><p>공식 페이지의 날짜·단위·적용 조건을 확인한 뒤 이용하세요. 이번 UI 변경에서 최신 자료를 새로 수집하지 않았습니다.</p><p>교육용 합성 가격·캔들은 US Stock Lab 자체 생성이며 공식 발행사 자료나 실제 시세가 아닙니다.</p><a className="ui-link" href="#news">뉴스·공식 출처 →</a></section>}
 </div>;
}
