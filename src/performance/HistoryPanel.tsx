import {useRef,useState} from 'react';
import {analyze,parseHistory,type History,type Metric} from './core';
const help:Record<string,string>={
 CAGR:'입출금이 없는 기간의 기하 연평균 성장률: (종료/시작)^(365/일수)−1. 입출금이 있으면 미제공합니다.',
 TWR:'각 구간 (평가액−당일 말 입출금)/직전 평가액−1을 연결한 기간 수익률입니다. 투자 시점의 영향을 제거합니다.',
 XIRR:'초기 투자, 외부 입출금, 마지막 회수액을 실제 날짜/365로 할인한 순현재가치가 0인 연 수익률입니다. 복수 해 가능성은 미제공합니다.',
 MDD:'입출금을 제거한 TWR 지수의 고점 대비 최대 하락률입니다. 관측 사이의 하락은 포착하지 못합니다.',
 Volatility:'등간격 구간 수익률의 표본 표준편차 × √(365/구간일수). 정규성이나 미래 위험을 보장하지 않습니다.',
 Sharpe:'구간별 (수익률−무위험수익률)의 평균/표본 표준편차 × √연 구간수입니다. 무위험수익률이 필요합니다.',
 Sortino:'무위험수익률을 목표로 한 평균 초과수익률/하방편차 × √연 구간수. 하방편차는 모든 구간의 min(초과수익률,0) 제곱 평균의 제곱근입니다.',
 Beta:'동일 구간 포트폴리오·벤치마크 수익률의 표본 공분산/벤치마크 분산입니다. 무위험수익률을 차감하지 않는 시장모형 기울기입니다.',
 Correlation:'같은 구간의 두 수익률 간 상관계수입니다. 인과관계와 미래 동조성을 보장하지 않습니다.',
 'Tracking Error':'포트폴리오−벤치마크 구간 수익률 차이의 표본 표준편차를 연환산합니다.',
 'Information Ratio':'구간 초과성과 평균/추적오차 표준편차 × √연 구간수입니다. 벤치마크 선택에 민감합니다.'
};
const minorText=(v:number)=>{const n=BigInt(Math.abs(v));return (v<0?'-':'')+String(n/100n)+'.'+String(n%100n).padStart(2,'0')};
const percent=new Set(['CAGR','TWR','XIRR','MDD','Volatility','Tracking Error']);
function valueText(name:string,m:Metric){return m.value===null?'미제공':percent.has(name)?(m.value*100).toFixed(2)+'%':m.value.toFixed(3)}
function Chart({title,dates,series}:{title:string;dates:string[];series:{name:string;values:number[]}[]}){
 const all=series.flatMap(s=>s.values);if(all.some(v=>!Number.isFinite(v)))return <p>{title}: 계산 범위를 초과해 그래프를 표시하지 않습니다.</p>;
 const low=Math.min(0,...all),high=Math.max(...all,0),span=high-low||1;
 return <section className="performance-chart"><h3>{title}</h3><svg viewBox="0 0 640 210" role="img" aria-label={title+' · 상세 표에서 날짜와 값을 확인할 수 있습니다.'}><line x1="20" x2="620" y1={170-(0-low)/span*140} y2={170-(0-low)/span*140} stroke="#c3cbd6"/>{series.map((s,j)=><polyline key={s.name} fill="none" stroke={j?'#70869e':'#2563eb'} strokeWidth="2" points={s.values.map((v,i)=>(20+i/(dates.length-1)*600)+','+(170-(v-low)/span*140)).join(' ')}/>)}<text x="20" y="200">{dates[0]}</text><text x="620" y="200" textAnchor="end">{dates.at(-1)}</text><text x="20" y="15">{high.toLocaleString(undefined,{maximumFractionDigits:2})}</text><text x="20" y="180">{low.toLocaleString(undefined,{maximumFractionDigits:2})}</text></svg><p>{series.map(s=>s.name).join(' / ')} · 파랑 / 회색</p></section>
}
export function HistoryPanel(){
 const [history,setHistory]=useState<History|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);const request=useRef(0);
 async function load(file:File|undefined){if(!file)return;const seq=++request.current;setHistory(null);setError('');setBusy(true);try{if(file.size>2_000_000)throw Error('파일은 2MB 이하만 지원합니다.');const h=parseHistory(await file.text());if(seq===request.current)setHistory(h)}catch(e){if(seq===request.current)setError(e instanceof Error?e.message:'읽기 실패')}finally{if(seq===request.current)setBusy(false)}}
 const result=history?analyze(history):null;
 return <section className="panel performance-panel" aria-labelledby="history-title"><h2 id="history-title">과거 수익·위험 분석</h2><p>사용자가 제공한 자료만 이 브라우저 메모리에서 분석합니다. 계좌·원장에 반영하거나 서버에 업로드하지 않습니다. 표시 통화 토글로 변환하지 않습니다.</p>
 <details><summary>CSV 형식과 계산 기준</summary><p>첫 행 헤더는 아래와 같아야 합니다. 평가액은 당일 말 외부 입출금 반영 후 금액입니다. flow는 입금 양수·출금 음수이며 내부 매매·배당 재투자는 외부 현금흐름이 아닙니다. 장중 흐름은 일말 흐름으로 임의 취급하지 말고 이 계약에 맞는 평가 자료를 준비하세요.</p><pre>date,currency,source,value,flow,benchmark_return,risk_free_return</pre><p>통화 USD 또는 KRW, source는 user(실제 자료라고 사용자가 신고·미검증) 또는 synthetic(합성)으로 통일하세요. 날짜는 YYYY-MM-DD 오름차순이며 중복·누락 금액은 거부합니다. 첫 행은 양수 평가액, flow=0, 두 선택 수익률은 빈칸입니다.</p><p>선택 수익률은 직전 날짜~현재 날짜의 같은 통화·출처 기준 총수익률이며 0.01은 1%입니다. 무위험 연 이율이 아닌 해당 구간 보유수익률을 입력하세요. 통화·기간·출처 정합성은 사용자 신고이며 외부 검증은 없습니다. 비어 있는 선택값을 0으로 채우지 않습니다. 숫자는 쉼표·인용부호 없이 입력합니다.</p><pre>{'2023-01-01,USD,synthetic,1000,0,,\n2024-01-01,USD,synthetic,1100,0,0.08,0.03\n2024-12-31,USD,synthetic,1045,0,-0.02,0.03'}</pre><p>수익률은 금액에서 환산된 부동소수점으로 계산합니다. 365일 연환산, 표본 분산 사용. 불규칙한 날짜는 TWR·XIRR·MDD와 입출금 없는 CAGR을 지원하고 연환산 위험 지표는 미제공합니다. 1년 미만의 연환산 수치는 특히 불안정합니다.</p></details>
 <label className="performance-upload">과거 평가액 CSV<input aria-label="과거 평가액 CSV" type="file" accept=".csv,text/csv" onChange={e=>void load(e.target.files?.[0])}/></label><button type="button" onClick={()=>{request.current++;setHistory(null);setError('');setBusy(false)}}>가져온 자료 지우기</button>{busy&&<p role="status">읽는 중…</p>}{error&&<p role="alert">{error}</p>}
 {history&&result&&<><p role="status">{history.source==='synthetic'?'합성 자료 · 실제 투자 성과 아님':'사용자 신고 자료 · 진위 및 정확성 미검증'} · {history.currency} · {history.rows[0].date}~{history.rows.at(-1)!.date} · {history.rows.length}개 관측</p><div className="pa-summary">{['TWR','XIRR','MDD','Volatility'].map(name=><article key={name}><h3>{name}</h3><strong>{valueText(name,result.metrics[name])}</strong>{result.metrics[name].value===null&&<p>{result.metrics[name].reason}</p>}<details><summary>{name} 해설</summary><p>{help[name]}</p></details></article>)}</div>
 <Chart title={'평가액과 누적 순납입금 ('+history.currency+')'} dates={history.rows.map(r=>r.date)} series={[{name:'평가액',values:history.rows.map(r=>r.value/100)},{name:'시작 평가액+누적 순입금',values:result.contributions.map(v=>v/100)}]}/>
 <Chart title="Drawdown (%) · 현금흐름 조정" dates={history.rows.map(r=>r.date)} series={[{name:'고점 대비 하락률',values:result.drawdown.map(v=>v*100)}]}/>
 {result.benchmarkWealth&&<Chart title="현금흐름 조정 성장 지수 (시작 100)" dates={history.rows.map(r=>r.date)} series={[{name:'포트폴리오 TWR',values:result.wealth.map(v=>v*100)},{name:'벤치마크',values:result.benchmarkWealth.map(v=>v*100)}]}/>}
 <details><summary>상세 성과·벤치마크·위험 지표</summary><dl>{Object.entries(result.metrics).map(([name,m])=><div key={name}><dt>{name}</dt><dd>{valueText(name,m)}{m.value===null&&' · '+m.reason}</dd><dd>{help[name]}</dd></div>)}</dl></details>
 <details><summary>날짜별 원본 및 계산값</summary><div className="pa-table-wrap" role="region" aria-label="과거 성과 데이터 표" tabIndex={0}><table><caption>통화 {history.currency} · 구간 수익률은 소수 · 입출금은 일말 기준</caption><thead><tr>{['날짜','평가액','외부 현금흐름','구간 수익률','Drawdown'].map(x=><th key={x} scope="col">{x}</th>)}</tr></thead><tbody>{history.rows.map((r,i)=><tr key={r.date}><th scope="row">{r.date}</th><td>{minorText(r.value)}</td><td>{minorText(r.flow)}</td><td>{i&&Number.isFinite(result.returns[i-1])?result.returns[i-1].toFixed(6):'해당 없음'}</td><td>{Number.isFinite(result.drawdown[i])?(result.drawdown[i]*100).toFixed(2)+'%':'미제공'}</td></tr>)}</tbody></table></div></details><p>단위화 수익률과 금액 곡선은 의미가 다릅니다. 관측 간격 사이의 손실은 확인하지 못하며 과거 성과는 미래 수익·위험을 보장하지 않습니다.</p></>}
 </section>
}
