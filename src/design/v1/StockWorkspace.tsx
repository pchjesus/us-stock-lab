import {useEffect,useMemo,useRef,useState,type KeyboardEvent} from 'react';
import {instruments,quote,type Instrument} from '../../data';
import {findCompanyProfile} from '../../companyProfiles';
import {currentFinancialFacts,latestFinancialFact,koreanFinancialValue} from '../../companyPresentation';
import {metrics,type CompanyProfile,type FinancialFact,type Metric} from '../../companyData';
import {snapshotMeta,validatedValuationSnapshot,valuationDisplay,valuationMetricDescriptions} from '../../valuationSnapshots';
import {ExternalQuotes,ManualWorkspace} from '../../ManualUI';
import {OrderPanel,type AccountView} from '../../TradingUI';
import {OrderAccountContext} from '../../UiPanels';
import {useCurrency,CurrencyToggle} from '../../preferences';
import {metadata} from '../../uiData';
import {PeerComparison} from '../../peer/PeerComparison';
import {detailTabEvent,type DetailTab} from '../../StockDetail';

type Period='annual'|'quarter';
const names:Record<Metric,string>={revenue:'매출액',operatingIncome:'영업이익',netIncome:'순이익',dilutedEps:'희석 EPS',assets:'자산',liabilities:'부채',equity:'자기자본',cashAndEquivalents:'현금 및 현금성자산',debt:'차입금',operatingCashFlow:'영업현금흐름',capitalExpenditure:'자본적지출',freeCashFlow:'잉여현금흐름 (FCF)',debtCurrent:'유동 차입금',debtNoncurrent:'비유동 차입금',commercialPaper:'기업어음',shortTermBorrowings:'단기 차입금'};
const descriptions:Partial<Record<Metric,string>>={revenue:'상품과 서비스를 팔아 벌어들인 금액',operatingIncome:'본업의 비용을 차감하고 남긴 이익',netIncome:'영업 외 손익과 세금까지 반영한 이익',operatingCashFlow:'영업활동으로 실제 유입·유출된 현금',freeCashFlow:'영업현금흐름에서 설비 투자를 차감한 금액'};
const groups=[
 {label:'손익',title:'손익계산서',basis:'duration',fields:['revenue','operatingIncome','netIncome','dilutedEps']},
 {label:'재무상태',title:'재무상태표',basis:'instant',fields:['assets','liabilities','equity','cashAndEquivalents','debt','debtCurrent','debtNoncurrent','commercialPaper','shortTermBorrowings']},
 {label:'현금흐름',title:'현금흐름표',basis:'duration',fields:['operatingCashFlow','capitalExpenditure','freeCashFlow']}
] as const;
const fiscal=(f:FinancialFact)=>'FY'+f.period.fiscalYear+(f.period.quarter?' Q'+f.period.quarter:'');
const dates=(f:FinancialFact)=>f.period.basis==='instant'?f.period.end:f.period.start+' ~ '+f.period.end;
const basisName=(f:FinancialFact)=>({annual:'연간',quarter:'단독 분기',instant:'시점 잔액',ytd:'연초 누적'}[f.period.basis]);
const value=(f:FinancialFact|undefined)=>f?koreanFinancialValue(f.value,f.unit):'미제공';
const origin=(f:FinancialFact)=>f.origin.kind==='reported'?'공식 보고값':'계산값';
const periodKey=(f:FinancialFact)=>[f.period.basis,f.period.start,f.period.end,f.period.fiscalYear,f.period.quarter].join('|');
function Source({href,children}:{href:string;children:React.ReactNode}){return <a className="sw-link" href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a>}
function PeriodSwitch({period,setPeriod}:{period:Period;setPeriod:(p:Period)=>void}){return <div className="sw-segment" role="group" aria-label="실적 기간">{(['annual','quarter'] as const).map(p=><button key={p} type="button" aria-pressed={period===p} onClick={()=>setPeriod(p)}>{p==='annual'?'연간':'분기'}</button>)}</div>}
function FactPlot({profile,metric,period,onFact,instant=false}:{profile:CompanyProfile;metric:Metric;period:Period;onFact:(id:string)=>void;instant?:boolean}){
 const facts=currentFinancialFacts(profile).filter(f=>f.metric===metric&&f.period.basis===(instant?'instant':period)).sort((a,b)=>a.period.end.localeCompare(b.period.end)).slice(-8);
 const max=Math.max(1,...facts.map(f=>Math.abs(Number(f.value))));const hasNegative=facts.some(f=>Number(f.value)<0);const left=hasNegative?50:0;const scale=hasNegative?50:100;
 return <div className="sw-plot" aria-label={names[metric]+' 추이'}>
  <div className="sw-plot-title"><span>{names[metric]}</span><strong>{value(facts.at(-1))}</strong><small>{facts.length?fiscal(facts.at(-1)!)+ ' · '+dates(facts.at(-1)!):'선택 기간의 검증값 없음'}</small></div>
  {facts.length?<><div className="sw-bars" role="group" aria-label="기간별 공식 재무 수치">{facts.map(f=>{const n=Number(f.value),width=Math.abs(n)/max*scale;return <button className="sw-bar-row" type="button" key={f.id} onClick={()=>onFact(f.id)} title={f.value+' '+f.unit+' · '+dates(f)}>
   <span className="sw-bar-label">{fiscal(f)}{instant&&<small>{f.period.end}</small>}</span><span className="sw-bar-track" style={{background:hasNegative?'linear-gradient(to right, transparent 49.8%, #bac3cf 49.8%, #bac3cf 50.2%, transparent 50.2%)':undefined}}><span className={'sw-bar-fill '+(n<0?'negative':'')} style={{width:width+'%',left:(n<0?left-width:left)+'%'}}/></span><span className="sw-bar-number">{value(f)}</span>
  </button>})}</div><p className="sw-caption">0 기준 동일 축 · {instant?'시점별 잔액':period==='annual'?'회계연도별':'단독 분기별'} 관측값만 표시. 기간이 연속되지 않을 수 있어. 막대를 누르면 정확값·원문 근거를 확인할 수 있어.</p></>:<div className="sw-empty">검증된 자료가 아직 없어. 다른 기간으로 대체하지 않아.</div>}
 </div>;
}
function Ratios({profile}:{profile:CompanyProfile}){
 const s=validatedValuationSnapshot(profile.symbol);
 return <section className="sw-sheet sw-ratios"><div className="sw-section-head"><div><h2>가치평가 참고</h2><p>기업 {snapshotMeta.companyDate} · 유사 산업 {snapshotMeta.industryDate}</p></div><span className="sw-tag">고정 스냅샷</span></div>
 {s?<><div className="sw-ratio-grid">{(['per','pbr','roe'] as const).map(k=><div key={k}><span>{valuationMetricDescriptions[k].label} · {valuationMetricDescriptions[k].fullName}</span><strong>{valuationDisplay(k,s.company[k])}</strong><small>유사 산업 {valuationDisplay(k,s.industry[k])}</small><details><summary>의미</summary><p>{valuationMetricDescriptions[k].description}</p></details></div>)}</div><details className="sw-disclosure"><summary>비교 기준 및 자료 출처</summary><p>{s.industry.name} · {s.industry.firms}개 기업. 동일 경쟁사 집단이 아니며 시점과 집계방법이 서로 달라 직접 순위를 매기거나 투자 판단에 사용하지 않아.</p><p>기업 PER은 최근 12개월 수익, PBR·ROE는 제공자 집계값. 산업 PER은 Trailing PE, PBR은 PBV, ROE는 비조정 ROE.</p><div className="sw-links"><Source href={s.company.source}>{snapshotMeta.companyProvider}</Source><Source href={snapshotMeta.industryPERSource}>산업 PER</Source><Source href={snapshotMeta.industryPBRSource}>산업 PBR·ROE</Source></div></details></>:<p>검증된 지표 미제공 · 합성 가격으로 계산하지 않아.</p>}</section>;
}
function Overview({profile,period,setPeriod,onFact,financials}:{profile:CompanyProfile;period:Period;setPeriod:(p:Period)=>void;onFact:(id:string)=>void;financials:()=>void}){
 const [metric,setMetric]=useState<Metric>('revenue');const source=profile.sources.find(s=>s.id===profile.profileSourceId);
 return <div className="sw-overview">
  <section className="sw-sheet sw-performance"><div className="sw-section-head"><div><h2>실적 한눈에 보기</h2><p>공식 재무 관측값 · 달러 · 축약값 반올림</p></div><PeriodSwitch period={period} setPeriod={setPeriod}/></div>
   <div className="sw-kpis">{(['revenue','operatingIncome','netIncome'] as const).map(m=>{const f=latestFinancialFact(profile,m,period);return <button type="button" key={m} aria-pressed={metric===m} onClick={()=>setMetric(m)}><span>{names[m]}</span><strong>{value(f)}</strong><small>{f?fiscal(f)+' · '+origin(f):'공식 수치 미확인'}</small></button>})}</div>
   <FactPlot profile={profile} metric={metric} period={period} onFact={onFact}/><button type="button" className="sw-text-button" onClick={financials}>전체 재무제표 보기 →</button>
  </section>
  <section className="sw-sheet sw-business"><div className="sw-section-head"><div><h2>기업을 이해하기</h2><p>공시 기반 편집 요약</p></div></div><p className="sw-lede">{profile.tenSecondSummary}</p><h3>무엇을 판매할까?</h3><ul>{profile.business.map(t=><li key={t}>{t}</li>)}</ul><h3>수익은 어디서 나올까?</h3><p>{profile.revenueModel}</p><details><summary>사업부 및 분류</summary><ul>{profile.segments.map(t=><li key={t}>{t}</li>)}</ul><p>{profile.industry} · SEC SIC 분류</p></details><div className="sw-risk"><h3>주의해서 볼 위험</h3><ul>{profile.risks.map(t=><li key={t}>{t}</li>)}</ul></div>{source&&<p className="sw-caption">공시 제출 {source.filedAt??'미확인'} · <Source href={source.url}>원문</Source></p>}</section>
  <Ratios profile={profile}/>
 </div>;
}
function Financials({profile,period,setPeriod,onFact}:{profile:CompanyProfile;period:Period;setPeriod:(p:Period)=>void;onFact:(id:string)=>void}){
 const [group,setGroup]=useState(0),[metric,setMetric]=useState<Metric>('revenue');const g=groups[group];const instant=g.basis==='instant';
 const selected=currentFinancialFacts(profile).filter(f=>(g.fields as readonly Metric[]).includes(f.metric)&&f.period.basis===(instant?'instant':period));
 const sample=[...new Map(selected.map(f=>[periodKey(f),f])).values()].sort((a,b)=>b.period.end.localeCompare(a.period.end)).slice(0,4);
 return <div className="sw-financials">
 <section className="sw-sheet"><div className="sw-section-head"><div><h2>재무 분석</h2><p>공식 공시 · {profile.financialAsOf??'자료 기준일 미확인'}</p></div><PeriodSwitch period={period} setPeriod={setPeriod}/></div>
 <div className="sw-subnav" role="group" aria-label="재무제표 종류">{groups.map((x,i)=><button type="button" key={x.label} aria-pressed={i===group} onClick={()=>{setGroup(i);setMetric(x.fields[0])}}>{x.label}</button>)}</div>
 <div className="sw-section-head"><h3>{g.title}</h3><label className="sw-field">그래프 항목<select value={metric} onChange={e=>setMetric(e.target.value as Metric)}>{g.fields.map(m=><option key={m} value={m}>{names[m]}</option>)}</select></label></div>
 <FactPlot profile={profile} metric={metric} period={period} instant={instant} onFact={onFact}/>
 <div className="sw-table-scroll" tabIndex={0} role="region" aria-label={g.title+' 기간 비교'}><table className="sw-table"><caption>{g.title} · {instant?'시점 잔액 (연간/분기 토글과 별개)':period==='annual'?'연간':'단독 분기'} · 검증된 최대 4개 기간</caption><thead><tr><th scope="col">항목</th>{sample.map(f=><th key={periodKey(f)} scope="col">{fiscal(f)}<small>{dates(f)}</small></th>)}</tr></thead><tbody>{g.fields.map(m=><tr key={m}><th scope="row">{names[m]}{descriptions[m]&&<small>{descriptions[m]}</small>}</th>{sample.map(a=>{const f=selected.find(f=>f.metric===m&&periodKey(f)===periodKey(a));return <td key={periodKey(a)}>{f?<button className="sw-cell" onClick={()=>onFact(f.id)} title={f.value+' '+f.unit}>{value(f)}<small>{origin(f)}</small></button>:<span className="sw-muted">미제공</span>}</td>})}</tr>)}</tbody></table>{!sample.length&&<p className="sw-empty">선택한 기간의 자료 미제공</p>}</div><p className="sw-caption">수치는 표시용 반올림. 셀을 누르면 정확한 값·단위·공시·계산 근거가 열려. 미제공은 0이 아니야.</p>
 <details className="sw-disclosure"><summary>회계 기준·기업별 정의</summary><p>{profile.financialCoverage.reason}</p><p>{profile.symbol==='GOOGL'?'EPS: 공시 연결 열이며 클래스별 값과 다를 수 있음':profile.symbol==='AMZN'?'앱 FCF: 현금 설비취득 총액 차감, 회사 발표 정의와 다름':profile.symbol==='NVDA'?'공시 분할 반영 EPS 및 NVIDIA 회계연도 기준':'공식 연간·직접 보고 단독 분기 기준'}</p></details></section>
 {profile.symbol==='NVDA'&&<section className="sw-sheet"><h2>비교 연구</h2><PeerComparison/></section>}
 <section className="sw-sheet"><h2>배당 내역</h2>{profile.dividends.status==='not-reviewed'?<><p className="sw-empty">공식 배당 자료 미확인 · 무배당을 의미하지 않아.</p><p>{profile.dividends.reason}</p></>:profile.dividends.entries.map(d=><p key={d.id}>주당 {d.amountPerShare} USD · 배당락 {d.exDate} · 기준일 {d.recordDate} · 지급일 {d.paymentDate} {profile.sources.find(s=>s.id===d.sourceId)&&<Source href={profile.sources.find(s=>s.id===d.sourceId)!.url}>원문</Source>}</p>)}</section>
 </div>;
}
function Evidence({profile,selected,onFact}:{profile:CompanyProfile;selected:string|null;onFact:(id:string)=>void}){
 const [scope,setScope]=useState<'facts'|'filings'>('facts'),[query,setQuery]=useState(''),[metric,setMetric]=useState(''),[year,setYear]=useState(''),[kind,setKind]=useState(''),[old,setOld]=useState(true),[page,setPage]=useState(0),[form,setForm]=useState('');
 const current=profile.financials.find(f=>f.id===selected);const source=profile.sources.find(s=>s.id===current?.sourceId);const replaced=useMemo(()=>new Set(profile.financials.flatMap(f=>f.supersedes?[f.supersedes]:[])),[profile]);
 const q=query.trim().toLowerCase();const facts=profile.financials.filter(f=>(!metric||f.metric===metric)&&(!year||String(f.period.fiscalYear)===year)&&(!kind||f.origin.kind===kind)&&(old||!replaced.has(f.id))&&(!q||(names[f.metric]+' '+f.id+' '+fiscal(f)+' '+f.value).toLowerCase().includes(q)));
 const filings=profile.sources.filter(s=>(!form||s.form===form)&&(!year||s.filedAt?.startsWith(year))&&(!q||(s.form+' '+s.locator+' '+s.id+' '+s.filedAt).toLowerCase().includes(q)));
 const total=scope==='facts'?facts.length:filings.length;const pages=Math.max(1,Math.ceil(total/25));const active=Math.min(page,pages-1);
 function reset(){setQuery('');setMetric('');setYear('');setKind('');setForm('');setOld(true);setPage(0)}
 useEffect(()=>{if(selected){setScope('facts');reset()}},[selected]);
 return <section className="sw-sheet sw-evidence"><div className="sw-section-head"><div><h2>자료 라이브러리</h2><p>원문·관측값·정정 이력 · 검증 범위 {profile.financialAsOf??'미확인'}</p></div></div><div className="sw-subnav" role="group" aria-label="근거 종류"><button aria-pressed={scope==='facts'} onClick={()=>{setScope('facts');reset()}}>재무 관측값 {profile.financials.length}</button><button aria-pressed={scope==='filings'} onClick={()=>{setScope('filings');reset()}}>공시 문서 {profile.sources.length}</button></div>
 {current&&scope==='facts'&&<section className="sw-inspector" aria-label="선택한 관측값"><span className="sw-tag">{origin(current)} · {current.status}{replaced.has(current.id)?' · 정정 전':''}</span><h3>{names[current.metric]}</h3><strong>{current.value??'미제공'} {current.unit}</strong><p>{fiscal(current)} · {basisName(current)} · {dates(current)}</p><p className="sw-caption">관측 ID {current.id}{current.supersedes?' · 대체한 관측 '+current.supersedes:''}</p>{source&&<><p>공시 {source.form} · 제출 {source.filedAt??'미확인'} · 확인 {source.checkedAt} · {source.accession??source.id}</p><Source href={source.url}>공식 원문 열기</Source></>}{current.missingReason&&<p>{current.missingReason}</p>}
 {current.origin.kind==='calculated'?<div><h4>계산식 · {current.origin.formula}</h4>{current.origin.inputIds.map(id=>{const f=profile.financials.find(x=>x.id===id);return <button className="sw-input-fact" key={id} onClick={()=>onFact(id)}>{f?names[f.metric]+' · '+f.value+' '+f.unit:id} →</button>})}</div>:current.evidence&&<details><summary>원문 필드 전체</summary><dl>{Object.entries(current.evidence).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v===null?'미제공':String(v)}</dd></div>)}</dl></details>}</section>}
 <div className="sw-evidence-tools"><label className="sw-field sw-search">검색<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}} placeholder={scope==='facts'?'항목·관측 ID·정확값':'공시 종류·원문 위치'}/></label>
 <label className="sw-field">연도<select value={year} onChange={e=>{setYear(e.target.value);setPage(0)}}><option value="">전체</option>{[...new Set(scope==='facts'?profile.financials.map(f=>String(f.period.fiscalYear)):profile.sources.flatMap(s=>s.filedAt?[s.filedAt.slice(0,4)]:[]))].sort().reverse().map(y=><option key={y}>{y}</option>)}</select></label>
 {scope==='facts'?<><label className="sw-field">항목<select value={metric} onChange={e=>{setMetric(e.target.value);setPage(0)}}><option value="">전체</option>{metrics.map(m=><option key={m} value={m}>{names[m]}</option>)}</select></label><label className="sw-field">값의 종류<select value={kind} onChange={e=>{setKind(e.target.value);setPage(0)}}><option value="">전체</option><option value="reported">보고값</option><option value="calculated">계산값</option></select></label><label className="sw-check"><input type="checkbox" checked={old} onChange={e=>{setOld(e.target.checked);setPage(0)}}/> 정정 전 포함</label></>:<label className="sw-field">공시 유형<select value={form} onChange={e=>{setForm(e.target.value);setPage(0)}}><option value="">전체</option>{[...new Set(profile.sources.map(s=>s.form))].map(f=><option key={f}>{f}</option>)}</select></label>}<button onClick={reset}>초기화</button></div>
 <p role="status" className="sw-caption">{total}건 · {total?active*25+1:0}–{Math.min(total,(active+1)*25)} 표시</p>
 <div className="sw-records">{scope==='facts'?facts.slice(active*25,(active+1)*25).map(f=><button key={f.id} data-fact-id={f.id} data-selected={selected===f.id} onClick={()=>onFact(f.id)}><span><strong>{names[f.metric]}</strong><small>{fiscal(f)} · {basisName(f)} · {origin(f)}{replaced.has(f.id)?' · 정정 전':''}</small></span><span>{value(f)} →</span></button>):filings.slice(active*25,(active+1)*25).map(s=><article key={s.id}><div><strong>{s.form}</strong><p>{s.locator}</p><small>제출 {s.filedAt??'미확인'} · 확인 {s.checkedAt} · {s.verification}{s.amends?' · 정정 대상 '+s.amends:''}</small></div><Source href={s.url}>공식 문서</Source></article>)}</div>
 {!total&&<div className="sw-empty">일치하는 자료가 없어.</div>}{pages>1&&<div className="sw-page-controls"><button disabled={active===0} onClick={()=>setPage(active-1)}>이전</button><span>{active+1} / {pages}</span><button disabled={active===pages-1} onClick={()=>setPage(active+1)}>다음</button></div>}
 </section>;
}
function EtfWorkspace({stock,tab}:{stock:Instrument;tab:DetailTab}){
 const info=metadata[stock.symbol];const issuer=({VOO:'Vanguard',QQQ:'Invesco',SCHD:'Schwab'} as Record<string,string>)[stock.symbol];
 return <section className="sw-sheet sw-etf"><h2>{tab==='overview'?'ETF 투자 구조':tab==='financials'?'상품 데이터':'공식 발행사 자료'}</h2>
 {tab==='overview'?<><p className="sw-lede">{info.description}</p><dl className="sw-etf-def"><div><dt>운용사</dt><dd>{issuer}</dd></div><div><dt>분류</dt><dd>{info.industry}</dd></div><div><dt>거래소</dt><dd>{info.exchange}</dd></div></dl><h3>확인해야 할 사항</h3><p>추종 전략, 실제 자산 구성, 총보수, 분배금과 위험을 함께 확인해. ETF도 가격 변동 위험이 있어.</p></>:tab==='financials'?<div className="sw-etf-def">{['보유종목','자산·업종 비중','총보수','분배금'].map(t=><div key={t}><span>{t}</span><strong>미확인</strong><small>검증된 최신 기준일·수치 없음</small></div>)}</div>:<p>발행사 공식 상품 페이지. 기존 설명 재사용이며 최신 보유종목과 보수, 분배금 기준일을 새로 검증하지 않았어.</p>}
 <p className="sw-caption">미확인 수치를 0으로 해석하지 않아. 합성 가격은 발행사의 공식 시장 자료가 아니야.</p><Source href={info.source}>{issuer} 공식 상품 페이지</Source></section>;
}
export function StockWorkspace({stock,account,manual,watched,toggleWatch}:{stock:Instrument;account:AccountView;manual:boolean;watched:boolean;toggleWatch:()=>void}){
 const [tab,setTab]=useState<DetailTab>('overview'),[period,setPeriod]=useState<Period>('annual'),[selected,setSelected]=useState<string|null>(null),[visited,setVisited]=useState(false);
 const refs=useRef<(HTMLButtonElement|null)[]>([]),panel=useRef<HTMLDivElement>(null);
 const profile=findCompanyProfile(stock.symbol),etf=stock.kind==='ETF',currency=useCurrency(),q=quote(stock);
 const tabs=[['overview','개요'],['trade','차트·거래'],['financials',etf?'상품정보':'재무'],['evidence',etf?'출처':'근거']] as const;
 function activate(t:DetailTab){setTab(t);if(t==='trade')setVisited(true)}
 function onFact(id:string){setSelected(id);activate('evidence');requestAnimationFrame(()=>panel.current?.scrollIntoView({block:'start',behavior:'auto'}))}
 useEffect(()=>{const listener=(e:Event)=>{const d=(e as CustomEvent<{symbol:string;tab:DetailTab}>).detail;if(d?.symbol===stock.symbol&&tabs.some(([id])=>id===d.tab))activate(d.tab)};window.addEventListener(detailTabEvent,listener);return()=>window.removeEventListener(detailTabEvent,listener)},[stock.symbol]);
 function keys(e:KeyboardEvent<HTMLButtonElement>,i:number){const next=e.key==='ArrowRight'?(i+1)%4:e.key==='ArrowLeft'?(i+3)%4:e.key==='Home'?0:e.key==='End'?3:null;if(next!==null){e.preventDefault();activate(tabs[next][0]);refs.current[next]?.focus()}}
 return <article className="stock-workspace-v3" data-symbol={stock.symbol} aria-label={etf?'ETF 상세 화면':'기업 상세 화면'}>
 <div className="sw-topline"><a href="#market">← 종목 탐색</a><label className="sw-symbol-select">종목 이동<select value={stock.symbol} onChange={e=>{location.hash='stock/'+e.target.value}}>{instruments.map(s=><option key={s.symbol} value={s.symbol}>{s.symbol} · {s.name}</option>)}</select></label></div>
 <div className="sw-identity"><div className="sw-mark" aria-hidden="true">{stock.symbol.slice(0,2)}</div><div className="sw-title"><span>{stock.symbol} · {metadata[stock.symbol].exchange} · {stock.kind}</span><h1>{stock.name}</h1><p>{metadata[stock.symbol].industry}</p></div><button className="sw-watch" aria-pressed={watched} onClick={toggleWatch}>{watched?'★':'☆'} 관심종목</button>
 <div className="sw-price"><span>교육용 합성 가격 · 실제 시세 아님</span><div><strong>{currency.format(Math.round(q.price*100))}</strong><b className={q.change>=0?'up':'down'}>{q.change>=0?'+':''}{q.change.toFixed(2)}%</b></div><small>합성 기준 {q.date}</small></div></div>
 <div className="sw-nav"><div role="tablist" aria-label={etf?'ETF 상세':'기업 상세'}>{tabs.map(([id,label],i)=><button ref={el=>{refs.current[i]=el}} role="tab" key={id} id={'sw-tab-'+id} aria-controls={'sw-panel-'+id} aria-selected={tab===id} tabIndex={tab===id?0:-1} onKeyDown={e=>keys(e,i)} onClick={()=>activate(id)}>{label}</button>)}</div><CurrencyToggle/></div>
 <div ref={panel} className="sw-content">
 {tabs.map(([id])=><section key={id} role="tabpanel" id={'sw-panel-'+id} aria-labelledby={'sw-tab-'+id} hidden={tab!==id} className="sw-tabpanel">
 {id==='trade'?visited&&<div className="sw-trade"><div className="sw-trade-chart"><div className="sw-trade-heading"><h2>차트 작업 공간</h2><a href={'#learn/'+stock.symbol}>차트 학습실 ↗</a></div><ExternalQuotes symbol={stock.symbol} active={tab==='trade'}/></div><div className="sw-sheet sw-order" id="detail-order" tabIndex={-1} aria-label="주문 영역"><div className="sw-section-head"><h2>가상 거래</h2><span className="sw-tag">실거래 불가</span></div><p>합성 계좌 가격 또는 별도 수기 계좌의 확인 가격을 사용해. 외부 차트 가격은 자동 입력되지 않아.</p><OrderAccountContext manual={manual} uid={account.userId}/>{manual?<ManualWorkspace key={account.userId} uid={account.userId!} symbol={stock.symbol}/>:<OrderPanel key={stock.symbol+account.modeKey} stock={stock} view={account}/>}</div></div>:tab===id?(etf?<EtfWorkspace stock={stock} tab={id}/>:profile?id==='overview'?<Overview profile={profile} period={period} setPeriod={setPeriod} onFact={onFact} financials={()=>activate('financials')}/>:id==='financials'?<Financials profile={profile} period={period} setPeriod={setPeriod} onFact={onFact}/>:<Evidence profile={profile} selected={selected} onFact={onFact}/>:<p>기업 자료 미제공</p>):null}
 </section>)}
 </div><p className="sw-footer">US Stock Lab · 합성 시세 / 공식 재무 자료 / 외부 참고 지표를 구분하며 투자 추천·실거래를 제공하지 않아.</p>
 </article>
}
