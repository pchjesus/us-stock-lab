import {ChartLab} from './ChartLab';
import {useState} from 'react';
interface Lesson {id:string;stage:string;title:string;body:string;practice:string}
export const lessons:Lesson[]=[
 {id:'stock',stage:'왕초보',title:'주식이 뭐야?',body:'주식은 회사의 작은 지분입니다. 회사가 성장하면 가치가 오를 수 있지만, 손실을 볼 수도 있어요. 주식과 ETF를 비교할 때 주식은 개별 기업의 지분이라는 점을 기억하세요.',practice:'시장 화면에서 아는 회사 하나를 찾아보세요.'},
 {id:'etf',stage:'왕초보',title:'ETF가 뭐야?',body:'ETF는 여러 자산을 한 바구니에 담아 거래소에서 사고파는 펀드예요. 한 종목으로 여러 기업에 나누어 투자할 수 있지만, 모든 ETF가 넓게 분산된 것은 아니며 원금 손실 위험이 있어요.',practice:'VOO와 QQQ의 분류를 확인해 보세요.'},
 {id:'us-market',stage:'기초',title:'미국주식은 어떻게 움직여?',body:'회사의 이익, 앞으로의 성장 기대, 금리, 투자자의 판단이 가격에 영향을 줘요. 가격이 올랐다고 회사가 항상 좋아진 것은 아니에요.',practice:'차트의 하루 가격 범위를 살펴보세요.'},
 {id:'fx',stage:'기초',title:'환율이 왜 중요해?',body:'환율은 서로 다른 돈을 바꾸는 비율이에요. 달러 가격이 같아도 달러가 원화보다 비싸지면 원화로 본 자산가치가 커질 수 있어요. 이 앱은 아직 환율손익을 계산하지 않아요.',practice:'홈의 USD/KRW가 합성 데이터인지 확인하세요.'},
 {id:'dividend',stage:'기초',title:'배당이 뭐야?',body:'회사가 이익 일부를 주주에게 나누어 주는 것이 배당이에요. 반드시 주는 것은 아니고 금액도 바뀔 수 있어요. 배당락일 전후에는 주가도 조정될 수 있어요. 현재 배당 지급 기능은 연동예정이에요.',practice:'배당과 주가 상승이 서로 다른 수익 원천임을 기억하세요.'},
 {id:'rates',stage:'시장 이해',title:'금리랑 주식은 무슨 관계야?',body:'금리는 돈을 빌리는 비용이에요. 금리가 높아지면 기업 비용과 투자자의 기대 수익 기준이 달라질 수 있어요. 금리 한 가지로 주가 방향을 단정할 수는 없어요.',practice:'캘린더에서 FOMC가 무엇을 발표하는지 확인하세요.'},
 {id:'macro',stage:'경제지표',title:'CPI, PCE, 고용지표가 뭐야?',body:'CPI와 PCE는 물가 변화를 서로 다른 방식으로 재요. 고용지표는 일자리와 실업 상황을 보여줘요. 숫자만 보지 말고 예상과의 차이, 이전 값 수정도 함께 읽으세요.',practice:'캘린더에서 실제·예상·이전 값을 구분해 보세요.'},
 {id:'averaging',stage:'투자 실습',title:'물타기/불타기가 뭐야?',body:'보유 중인 주식을 더 낮은 가격에 사면 물타기, 높은 가격에 사면 불타기라고 불러요. 평균가격은 바뀌지만 투자금과 위험도 함께 늘어나요. 손실 회복이 보장되지는 않아요.',practice:'종목 상세의 분석에서 가격만 바꿔 보세요. 분석은 주문하지 않아요.'},
 {id:'diversification',stage:'시장 이해',title:'분산투자가 왜 필요해?',body:'여러 기업과 자산에 나누어 투자하면 한 회사에 문제가 생겼을 때 영향을 줄일 수 있어요. 시장 전체가 함께 하락하는 위험은 남아요.',practice:'서로 다른 분야의 종목을 관심종목에 담아보세요.'},
 {id:'news',stage:'경제지표',title:'뉴스는 어떻게 읽어야 해?',body:'제목만 보지 말고 출처, 발행 시각, 사실과 해석을 구분하세요. 전망은 가능성이지 확정된 결과가 아니에요. 원문을 확인하고 다른 설명도 비교하세요.',practice:'뉴스 화면에서 공식 자료 링크를 찾아보세요.'}
];
const stages=['전체','왕초보','기초','시장 이해','경제지표','투자 실습'];
export function Learning(){const [stage,setStage]=useState('전체');const [open,setOpen]=useState<string|null>(null);return <><ChartLab/><h1>한 걸음씩 배우는 투자</h1><p>왕초보 → 기초 → 시장 이해 → 경제지표 → 투자 실습</p><div className="learning-filters">{stages.map(s=><button key={s} aria-pressed={stage===s} onClick={()=>setStage(s)}>{s}</button>)}</div>{lessons.filter(l=>stage==='전체'||l.stage===stage).map((l,i)=><section className="panel" key={l.id} id={`lesson-${l.id}`}><p className="eyebrow">{l.stage} · LESSON {i+1}</p><button className="lesson" aria-expanded={open===l.id} onClick={()=>setOpen(open===l.id?null:l.id)}>{l.title}<span>{open===l.id?'−':'+'}</span></button>{open===l.id&&<><p>{l.body}</p><p className="practice">직접 해보기: {l.practice}</p></>}</section>)}<small>일반 학습 자료이며 특정 상품의 매수·매도 권유가 아닙니다.</small></>;}
