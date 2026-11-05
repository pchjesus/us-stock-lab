import {useState,useEffect} from 'react';
import {FinancialGraph} from './FinancialGraph';
import {currentFinancialFacts,financialSeries,latestFinancialFact,financialValueText} from './companyPresentation';
import {findCompanyProfile} from './companyProfiles';
import type {CompanyProfile,FinancialFact,Metric} from './companyData';
const descriptions:Partial<Record<Metric,string>>={revenue:'상품과 서비스에서 발생한 매출입니다.',operatingIncome:'본업의 영업이익입니다. 영업이익률은 매출 대비 비율이며 업종과 회계 기준에 따라 비교에 주의하세요.',netIncome:'비용과 세금 등을 반영한 순이익입니다.',dilutedEps:'희석 가능 주식을 고려한 주당 순이익입니다.',assets:'기업이 보유한 자산입니다.',liabilities:'기업의 의무와 부채입니다.',equity:'자산에서 부채를 차감한 자기자본입니다.',cashAndEquivalents:'현금과 단기 현금성 자산입니다.',debt:'공시에 표시된 차입금입니다.',operatingCashFlow:'영업활동에서 발생한 현금흐름입니다.',capitalExpenditure:'설비 등에 사용한 자본적지출입니다.',freeCashFlow:'영업현금흐름에서 자본적지출을 차감한 계산값입니다.'};
const labels:Partial<Record<Metric,string>>={revenue:'매출액',operatingIncome:'영업이익',netIncome:'순이익',dilutedEps:'희석 EPS',assets:'자산',liabilities:'부채',equity:'자기자본',cashAndEquivalents:'현금 및 현금성자산',debt:'차입금',operatingCashFlow:'영업현금흐름',capitalExpenditure:'자본적지출',freeCashFlow:'FCF'};
labels.debtCurrent='유동 term debt (1년 내 상환분)';labels.debtNoncurrent='비유동 term debt';labels.commercialPaper='Commercial paper';labels.shortTermBorrowings='단기 차입금';
const basisLabel={annual:'연간',quarter:'단독 분기',ytd:'연초 누적',instant:'시점'} as const;
export type CompanySection='overview'|'financials'|'evidence';
type Period='annual'|'quarter';
function periodText(f:FinancialFact){return `FY${f.period.fiscalYear}${f.period.quarter?` Q${f.period.quarter}`:''} · ${basisLabel[f.period.basis]} · ${f.period.basis==='instant'?f.period.end:f.period.start+'~'+f.period.end}`;}
function SourceLink({profile,id,label='출처 ↗'}:{profile:CompanyProfile;id:string|null;label?:string}){
 const s=profile.sources.find(s=>s.id===id);
 return s?<a className="ui-link source-link" href={s.url} target="_blank" rel="noreferrer">{label}<span className="sr-only"> (새 탭)</span></a>:<span>공식 원문 미제공</span>;
}
function PeriodControls({period,onChange}:{period:Period;onChange:(p:Period)=>void}){
 return <div className="learning-filters company-periods" role="group" aria-label="실적 기간"><button aria-pressed={period==='annual'} onClick={()=>onChange('annual')}>연간</button><button aria-pressed={period==='quarter'} onClick={()=>onChange('quarter')}>분기</button></div>;
}
function FactEvidence({profile,f}:{profile:CompanyProfile;f:FinancialFact}){
 const s=profile.sources.find(s=>s.id===f.sourceId);
 return <div className="fact-evidence">
  <p>관측 ID {f.id} · {f.status} · {f.origin.kind==='reported'?'공식 보고값':'계산값'}{profile.financials.some(x=>x.supersedes===f.id)&&' · 정정 전 관측'}{f.supersedes&&` · 대체한 관측 ${f.supersedes}`}</p>
  <p>{periodText(f)} · 통화 {f.currency} · 단위 {f.unit}</p>
  <p data-testid="evidence-exact-value">정확값 {f.value===null?'미제공':f.value} {f.unit}{f.missingReason&&` · ${f.missingReason}`}</p>
  <p>공시 {s?.accession??s?.id??'미제공'} · 제출 {s?.filedAt??'미제공'} · 확인 {s?.checkedAt??'미제공'}</p>
  <SourceLink profile={profile} id={f.sourceId} label="공식 원문 ↗"/>
  {f.origin.kind==='calculated'?<div><p>계산식: {f.origin.formula}</p>{f.origin.inputIds.map(id=>{
   const input=profile.financials.find(x=>x.id===id);
   return input?<div key={id} className="evidence-input"><p>입력 {id} · {labels[input.metric]} · {financialValueText(input)}</p><p>{periodText(input)}</p><SourceLink profile={profile} id={input.sourceId} label="입력 원문 ↗"/></div>:<p key={id}>입력 {id} 미제공</p>;
  })}</div>:f.evidence?<details><summary>원문 필드 전체</summary><dl className="evidence-grid">{Object.entries(f.evidence).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value===null?'미제공':String(value)}</dd></div>)}</dl></details>:<p>원문 상세 근거 미제공</p>}
 </div>;
}
function MetricCard({profile,metric,f,compact=false}:{profile:CompanyProfile;metric:Metric;f:FinancialFact|undefined;compact?:boolean}){
 const value=f?financialValueText(f):'공식 수치 미확인';
 return <div className="financial-metric" data-observation-id={f?.id} data-testid={(compact?'overview-':'financial-')+metric}><strong>{labels[metric]}</strong>
  <p className="financial-value">{compact?value.split(' · 정확값 ')[0]:f?shortValue(f):value}</p>
  {compact&&value.includes(' · 정확값 ')&&<details><summary>정확값 보기</summary><p>{value}</p></details>}
  {f&&<p className="financial-period">{periodText(f)} · {f.origin.kind==='reported'?'공식 보고':'계산'}</p>}
  {f&&<SourceLink profile={profile} id={f.sourceId}/>}
  {!compact&&<><small>{descriptions[metric]}</small>{f&&<details><summary>정확값·원문·계산 근거</summary><p>{value}</p><FactEvidence profile={profile} f={f}/></details>}</>}
 </div>;
}
function shortValue(f:FinancialFact){
 if(f.value===null)return '미제공';
 if(f.unit!=='USD')return `${f.value} ${f.unit}`;
 const negative=f.value.startsWith('-'),whole=BigInt(f.value.replace('-','').split('.')[0]);
 const unit=whole>=1000000000n?1000000000n:whole>=1000000n?1000000n:1n;
 if(unit===1n)return `${f.value} USD`;
 return `${negative?'-':''}${(whole/unit).toLocaleString('en-US')}.${whole%unit*10n/unit} ${unit===1000000000n?'십억':'백만'} USD`;
}
function ComparisonFact({profile,f,onEvidence}:{profile:CompanyProfile;f:FinancialFact;onEvidence?:(id:string)=>void}){
 const [opened,setOpened]=useState(false);
 return <details data-observation-id={f.id} onToggle={event=>setOpened(event.currentTarget.open)}><summary>{shortValue(f)}</summary>{opened&&<><FactEvidence profile={profile} f={f}/><button onClick={()=>onEvidence?.(f.id)}>근거 확인</button></>}</details>;
}
const statements:{title:string;description:string;metrics:Metric[];instant?:boolean}[]=[
 {title:'손익계산서',description:'얼마를 벌고, 비용을 뺀 뒤 얼마가 남았는지 확인합니다.',metrics:['revenue','operatingIncome','netIncome','dilutedEps']},
 {title:'재무상태표',description:'특정 날짜에 보유한 자산과 갚아야 할 부채, 자기자본입니다. 기간 실적과 구분하세요.',metrics:['assets','liabilities','equity','cashAndEquivalents','debt'],instant:true},
 {title:'현금흐름표',description:'회계상 이익과 별도로 실제 영업 현금의 유입과 투자를 확인합니다.',metrics:['operatingCashFlow','capitalExpenditure','freeCashFlow']}
];
function FinancialStatements({profile,period,onEvidence}:{profile:CompanyProfile;period:Period;onEvidence?:(id:string)=>void}){
 const facts=currentFinancialFacts(profile);
 return <section id="company-health" className="panel financial-statements"><h2>재무제표별 비교</h2><p>미제공은 0이 아닙니다. 축약 금액은 표시용이며 정확값은 상세에서 확인하세요.</p>
 {statements.map(group=>{
 const selected=facts.filter(f=>group.metrics.includes(f.metric)&&f.period.basis===(group.instant?'instant':period));
 const keys=[...new Set(selected.map(f=>`${f.period.start ?? ''}|${f.period.end}|${f.period.fiscalYear}|${f.period.quarter??''}`))].sort().reverse().slice(0,3);
 return <section className="financial-statement" key={group.title}><h3>{group.title}</h3><p>{group.description}</p>
 {!keys.length?<p>선택한 기간의 검증된 비교 자료 미제공</p>:<><p className="financial-table-hint">최근 확인된 최대 3개 기간 · {group.instant?'시점 잔액':period==='annual'?'연간':'단독 분기'} · 기간이 연속되지 않을 수 있습니다. 모바일에서는 표를 좌우로 이동하세요.</p>
 <div className="financial-table-scroll" tabIndex={0} role="region" aria-label={group.title+' 기간 비교'}><table style={{minWidth:keys.length>1?620:0}}><caption>{group.title} · 검증된 기간별 관측값</caption><thead><tr><th scope="col">항목</th>{keys.map(key=>{const f=selected.find(f=>`${f.period.start??''}|${f.period.end}|${f.period.fiscalYear}|${f.period.quarter??''}`===key)!;return <th scope="col" key={key}>FY{f.period.fiscalYear}{f.period.quarter?` Q${f.period.quarter}`:''}<span>{group.instant?f.period.end:`${f.period.start}~${f.period.end}`}</span></th>})}</tr></thead>
 <tbody>{group.metrics.map(metric=><tr key={metric}><th scope="row">{labels[metric]}</th>{keys.map(key=>{const f=selected.find(f=>f.metric===metric&&`${f.period.start??''}|${f.period.end}|${f.period.fiscalYear}|${f.period.quarter??''}`===key);return <td key={key}>{f?<><ComparisonFact profile={profile} f={f} onEvidence={onEvidence}/><small>{f.origin.kind==='reported'?'공식 보고값':'계산값'}</small></>:<span>미제공</span>}</td>})}</tr>)}</tbody></table></div></>}
 <details className="financial-definitions"><summary>항목 설명과 최근값 상세</summary><div className="financial-detail-list">{group.metrics.map(metric=>{const f=latestFinancialFact(profile,metric,period);return <details key={metric} data-testid={['revenue','operatingIncome','netIncome','operatingCashFlow'].includes(metric)?undefined:'financial-'+metric} data-observation-id={f?.id}><summary><strong>{labels[metric]}</strong><span>{f?shortValue(f):'공식 수치 미확인'}</span></summary><p>{descriptions[metric]}</p>{f?<><p>{periodText(f)}</p><FactEvidence profile={profile} f={f}/></>:<p>선택한 기간의 공식 수치 미확인 · 다른 기간으로 대체하지 않습니다.</p>}</details>})}</div></details>
 </section>})}</section>;
}
export function CompanyDetail({profile,section='overview',period:controlledPeriod,onPeriodChange,evidenceId,onEvidence}:{profile:CompanyProfile;section?:CompanySection;period?:Period;onPeriodChange?:(p:Period)=>void;evidenceId?:string|null;onEvidence?:(id:string)=>void}){
 const [localPeriod,setLocalPeriod]=useState<Period>('annual');const period=controlledPeriod??localPeriod;
 const change=onPeriodChange??setLocalPeriod;const series=financialSeries(profile,period);const latest=(metric:Metric)=>latestFinancialFact(profile,metric,period);
 const source=profile.sources.find(s=>s.id===profile.profileSourceId)!;
 const [form,setForm]=useState(''),[fileYear,setFileYear]=useState(''),[search,setSearch]=useState(''),[year,setYear]=useState(''),[metric,setMetric]=useState(''),[origin,setOrigin]=useState(''),[includeOld,setIncludeOld]=useState(true);
 useEffect(()=>{setForm('');setFileYear('');setSearch('');setYear('');setMetric('');setOrigin('');setIncludeOld(true)},[profile.symbol]);
 useEffect(()=>{if(section!=='evidence'||!evidenceId)return;setSearch('');setYear('');setMetric('');setOrigin('');setIncludeOld(true);requestAnimationFrame(()=>{const item=[...document.querySelectorAll<HTMLDetailsElement>('[data-fact-id]')].find(e=>e.dataset.factId===evidenceId);if(item){item.open=true;item.scrollIntoView({block:'center'});item.querySelector<HTMLElement>('summary')?.focus()}})},[section,evidenceId,profile.symbol]);
 const sources=profile.sources.filter(s=>(!form||s.form===form)&&(!fileYear||s.filedAt?.startsWith(fileYear)));
 const facts=profile.financials.filter(f=>(!search||`${labels[f.metric]??f.metric} ${f.id}`.toLowerCase().includes(search.toLowerCase()))&&(!year||String(f.period.fiscalYear)===year)&&(!metric||f.metric===metric)&&(!origin||f.origin.kind===origin)&&(includeOld||!profile.financials.some(x=>x.supersedes===f.id)));

 if(section==='evidence')return <div aria-label="기업 분석" className="company-detail company-evidence">
  <section className="panel"><h2>공식 자료와 편집 요약</h2><p>기업 소개·사업·위험은 공식 공시 기반 편집 요약이며 원문 문장을 그대로 옮긴 자료나 투자 추천이 아닙니다. 재무 수치는 검증된 보고값과 입력값·산식이 확인된 계산값을 구분합니다.</p>
   <p>공식 자료 확인 · 기준 공시 제출 {source.filedAt} · 확인 {source.checkedAt}</p><SourceLink profile={profile} id={source.id} label={`공식 ${source.form} 원문 ↗`}/>
   <h3>회계 기준·기업별 정의</h3><p>{profile.financialCoverage.reason}</p>{profile.financialAsOf&&<p>재무 자료 기준일 {profile.financialAsOf}</p>}
  </section>
  <section className="panel"><h2>SEC·발행사 자료 목록</h2><div className="evidence-filters"><label>공시 유형<select value={form} onChange={e=>setForm(e.target.value)}><option value="">전체</option>{[...new Set(profile.sources.map(s=>s.form))].map(v=><option key={v}>{v}</option>)}</select></label><label>제출연도<select value={fileYear} onChange={e=>setFileYear(e.target.value)}><option value="">전체</option>{[...new Set(profile.sources.flatMap(s=>s.filedAt?[s.filedAt.slice(0,4)]:[]))].sort().reverse().map(v=><option key={v}>{v}</option>)}</select></label><button onClick={()=>{setForm('');setFileYear('')}}>초기화</button></div><p role="status">{sources.length}건</p>{sources.length===0&&<p>일치하는 공시가 없습니다.</p>}{sources.map(s=><details key={s.id} data-source-id={s.id}><summary>{s.form} · 제출 {s.filedAt??'미제공'}</summary><p>제출 {s.filedAt??'미제공'} · 확인 {s.checkedAt} · 공시 {s.accession??'미제공'}</p><p>{s.locator}</p>{s.amends&&<p>정정 대상 {s.amends}</p>}<SourceLink profile={profile} id={s.id} label="공식 자료 원문 ↗"/></details>)}</section>
  <section className="panel"><h2>전체 재무 관측값과 근거</h2><p>{profile.financials.length}개 관측 · 보고값 {profile.financials.filter(f=>f.origin.kind==='reported').length}개 · 계산값 {profile.financials.filter(f=>f.origin.kind==='calculated').length}개. 정정 전 값도 보존하며 최신 카드와 구분합니다.</p>
   <div className="evidence-filters"><label>항목명 또는 관측 ID 검색<input value={search} onChange={e=>setSearch(e.target.value)}/></label><label>회계연도<select value={year} onChange={e=>setYear(e.target.value)}><option value="">전체</option>{[...new Set(profile.financials.map(f=>f.period.fiscalYear))].sort((a,b)=>b-a).map(v=><option key={v}>{v}</option>)}</select></label><label>재무 항목<select value={metric} onChange={e=>setMetric(e.target.value)}><option value="">전체</option>{[...new Set(profile.financials.map(f=>f.metric))].map(v=><option key={v} value={v}>{labels[v]??v}</option>)}</select></label><label>자료 성격<select value={origin} onChange={e=>setOrigin(e.target.value)}><option value="">전체</option><option value="reported">공식 보고값</option><option value="calculated">계산값</option></select></label><label><input type="checkbox" checked={includeOld} onChange={e=>setIncludeOld(e.target.checked)}/>정정 전 관측 포함</label><button onClick={()=>{setSearch('');setYear('');setMetric('');setOrigin('');setIncludeOld(true)}}>전체 초기화</button></div><p role="status">{facts.length}건</p>{facts.length===0&&<p>일치하는 재무 관측값이 없습니다.</p>}{facts.map(f=><details key={f.id} data-fact-id={f.id}><summary>{labels[f.metric]} · {periodText(f)} · {f.value??'미제공'} {f.unit} · {f.origin.kind==='reported'?'보고값':'계산값'}</summary><FactEvidence profile={profile} f={f}/></details>)}
  </section>
 </div>;
 return <div aria-label="기업 분석" className="company-detail">
  {section==='overview'&&<section id="company-overview" className="panel"><p className="eyebrow">공식 공시 기반 편집 요약 · 투자 추천 아님</p><h2>기업 개요 · {profile.name} · {profile.symbol}</h2>
   <div className="company-intro-grid"><div><h3>핵심 사업</h3>{profile.business.map(v=><p key={v}>{v}</p>)}<h3>수익구조</h3><p>{profile.revenueModel}</p><details><summary>사업부 자세히</summary>{profile.segments.map(v=><p key={v}>{v}</p>)}<p>{profile.industry} · SEC SIC 분류</p></details></div>
   <div><h3>주요 위험요인</h3><ul>{profile.risks.map(v=><li key={v}>{v}</li>)}</ul></div></div>
  </section>}
  <section id="company-metrics" className="panel"><div className="section-title"><h2>{section==='overview'?'최근 확인 실적':'핵심 투자지표'}</h2><PeriodControls period={period} onChange={change}/></div><p>{period==='annual'?'최근 확인 연간 실적':'최근 확인 단독 분기 실적'} · 기간 실적과 시점 잔액을 구분합니다.</p>
   {section==='financials'&&<details><summary>회계 기준·기업별 정의</summary><p>{profile.financialCoverage.reason}</p><p>{profile.symbol==='GOOGL'?'EPS: 공시 연결 열 · 클래스별 값과 다를 수 있음':profile.symbol==='AMZN'?'앱 FCF: 현금 설비취득 총액 차감 · 회사 발표 정의와 다름':profile.symbol==='NVDA'?'공시의 분할 반영 EPS · NVIDIA 회계연도 기준':'공식 연간·직접 보고 단독 분기 기준'}</p>{profile.financialAsOf&&<p>재무 자료 기준일 {profile.financialAsOf}</p>}</details>}
   <div className={'financial-metrics-grid '+(section==='overview'?'overview-metrics':'financial-summary')}>{(section==='overview'?['revenue','operatingIncome','netIncome']:['revenue','operatingIncome','netIncome','operatingCashFlow']).map(metric=><MetricCard key={metric} profile={profile} metric={metric as Metric} f={latest(metric as Metric)} compact={section==='overview'}/>)}</div>
   {section==='financials'&&<div className="evidence-jumps">{(['revenue','operatingIncome','netIncome','operatingCashFlow'] as Metric[]).map(m=>{const f=latest(m);return f&&<button key={m} onClick={()=>onEvidence?.(f.id)}>{labels[m]} 근거 확인</button>})}</div>}
   {section==='financials'&&<p>영업이익률: 미제공 · 산식과 원문 검증 후 제공</p>}
  </section>
  <section id="company-results" className="panel"><h2>공식 매출 추이 · {period==='annual'?'연간':'단독 분기'}</h2>{series.length?<FinancialGraph profile={profile} series={series} basis={period}/>:<p>공식 실적 자료가 아직 입력되지 않았습니다. 연초 누적값은 단독 분기와 섞지 않습니다.</p>}</section>
  {section==='financials'&&<><FinancialStatements profile={profile} period={period} onEvidence={onEvidence}/>
   <section id="company-dividends" className="panel"><h2>배당 정보</h2>{profile.dividends.status==='not-reviewed'?<><p>공식 배당 자료 미확인 · 무배당을 의미하지 않습니다.</p><p>{profile.dividends.reason}</p></>:profile.dividends.entries.map(d=><p key={d.id}>주당 {d.amountPerShare} USD · 배당락 {d.exDate} · 기준일 {d.recordDate} · 지급일 {d.paymentDate} <SourceLink profile={profile} id={d.sourceId} label="공식 출처 ↗"/></p>)}<small>기업 공시와 수기 계좌 배당 원장은 별도 자료입니다.</small></section></>}
 </div>;
}
export function CompanyInfo({symbol}:{symbol:string}){const p=findCompanyProfile(symbol);return p?<CompanyDetail key={symbol} profile={p}/>:null;}
