import type {CompanyProfile,FinancialFact} from './companyData';
import {financialValueText} from './companyPresentation';
export function FinancialGraph({profile,series,basis}:{profile:CompanyProfile;series:FinancialFact[];basis:'annual'|'quarter'}){
 const ordinal=(f:FinancialFact)=>f.period.fiscalYear*(basis==='quarter'?4:1)+(f.period.quarter??0);
 let gap=0;const bars=series.map((f,i)=>{const missing=i>0&&ordinal(f)-ordinal(series[i-1])>1;if(missing)gap+=32;return {f,missing,x:i*74+gap+16};});
 const width=Math.max(160,series.length*74+gap),max=Math.max(...series.map(f=>Math.abs(Number(f.value))),1);
 return <div aria-label="매출 실적 그래프"><p>매출액 · USD · {basis==='annual'?'연간':'단독 분기'} · 미제공 분기는 보간하지 않습니다.</p>
 {bars.some(b=>b.missing)&&<p role="note">비연속 기간 · 점선 사이 기간은 미제공이며 연속 4분기·TTM이 아닙니다.</p>}
 <svg role="img" aria-label="검증된 매출 실적 그래프" viewBox={`0 0 ${width} 170`} style={{width:'100%',maxHeight:220}}>
 <line x1="0" x2={width} y1="72" y2="72" stroke="#aab4c2"/><text x="0" y="68" fontSize="10">0</text>
 {bars.map(({f,missing,x})=>{const value=Number(f.value),height=Math.abs(value)/max*52;return <g key={f.id} data-value={f.value}>
 <title>{`FY${f.period.fiscalYear}${f.period.quarter?' Q'+f.period.quarter:''}: ${f.value} USD`}</title>
 {missing&&<g aria-label="중간 기간 미제공"><line x1={x-30} x2={x-30} y1="10" y2="125" stroke="#64748b" strokeDasharray="3 3"/><text x={x-30} y="160" fontSize="9" textAnchor="middle">미제공</text></g>}
 <rect x={x} y={value>=0?72-height:72} width="36" height={height} fill={value<0?'#b33939':'#3169d9'}/>{value===0&&<circle cx={x+18} cy="72" r="2" fill="#3169d9"/>}
 <text x={x+18} y="138" fontSize="11" textAnchor="middle">FY{f.period.fiscalYear}{f.period.quarter&&<tspan x={x+18} dy="13">{` Q${f.period.quarter}`}</tspan>}</text>
 </g>;})}</svg>
 {series.map(f=><p key={f.id}>FY{f.period.fiscalYear}{f.period.quarter?` Q${f.period.quarter}`:''} · {f.period.start}~{f.period.end} · {financialValueText(f)} <a className="ui-link source-link" target="_blank" rel="noreferrer" href={profile.sources.find(s=>s.id===f.sourceId)!.url}>공식 출처 ↗<span className="sr-only"> (새 탭)</span></a></p>)}
 </div>;
}
