import {ChartLab} from './ChartLab';
import {learningPath,learningUnits} from './learningFoundation';
import {LearningUnit} from './LearningUnit';
import {a2Units,correctedLessonText} from './learningA2';
import {p2Units} from './learningA2P2';
import {useEffect,useRef,useState} from 'react';
import {resolveLearningRoute} from './learningRoutes';
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
export function Learning({route='learn'}:{route?:string}){
 const [stage,setStage]=useState('전체'),[open,setOpen]=useState<string|null>(null);const root=useRef<HTMLDivElement>(null);const page=resolveLearningRoute(route);
 useEffect(()=>{if(document.querySelector('dialog[open]'))return;root.current?.scrollIntoView({block:'start',behavior:'instant'});root.current?.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});},[page.kind]);
 const titles={landing:'나에게 맞는 학습을 선택하세요',lessons:'한 걸음씩 배우는 투자',lab:'합성 차트로 연습하기',missing:'학습 화면을 찾을 수 없어요'};
 const descriptions={landing:'개념을 읽거나, 차트를 직접 관찰하거나. 오늘 필요한 배움부터 시작하세요.',lessons:'왕초보 → 기초 → 시장 이해 → 경제지표 → 투자 실습',lab:'종목과 기간을 선택하고 가격·지표의 움직임을 관찰하세요.',missing:'아래에서 기초 투자 수업 또는 차트 실습실로 이동하세요.'};
 return <div ref={root} className="learning-page" data-learning-view={page.kind}>
  {page.kind!=='landing'&&<a className="ui-link learning-back" href="#learn">← 학습 선택으로</a>}
  <div className="heading learning-heading"><div><p className="eyebrow">LEARN AT YOUR PACE</p><h1 id={'learning-title-'+page.kind} tabIndex={-1}>{titles[page.kind]}</h1><p>{descriptions[page.kind]}</p></div></div>
  {page.kind==='landing'||page.kind==='missing'?<div className="learning-choices">{[
   {href:'#learn/lessons',step:'01 · 이해하기',title:'기초 투자 수업',description:'주식·ETF부터 분산투자와 뉴스까지, 개념과 용어를 하나씩 익혀요.',detail:'10개 수업 · 단계별 개념과 직접 해보기',action:'투자 수업 시작하기 →'},
   {href:'#learn/lab',step:'02 · 관찰하기',title:'차트 실습실',description:'합성 캔들·선 차트와 SMA·RSI, 지지·저항 후보를 직접 살펴보세요.',detail:'8개 종목 시나리오 · 초급부터 고급까지',action:'차트 실습 시작하기 →'}
  ].map(item=><a className="panel learning-choice" key={item.href} href={item.href}><span className="eyebrow">{item.step}</span><h2>{item.title}</h2><p>{item.description}</p><small>{item.detail}</small><strong>{item.action}</strong></a>)}{page.kind==='landing'&&<section className="panel learning-path" aria-labelledby="learning-path-title"><h2 id="learning-path-title">처음이라면 · 추천 학습 순서</h2><p>순서는 안내입니다. 궁금한 단계부터 시작해도 괜찮아요.</p><ol>{learningPath.map((step,i)=><li key={step.title}><strong>{i+1}. {step.title}</strong><p>{step.goal}</p><small>{step.topics} · {step.feature}</small></li>)}</ol></section>}</div>:
   page.kind==='lab'?<><div className="learning-crosslinks"><a className="ui-link" href="#learn/lessons">개념이 궁금하다면 투자 수업 →</a></div><ChartLab symbol={page.symbol}/></>:
   <><div className="learning-crosslinks"><a className="ui-link" href="#learn/lab">차트에서 직접 관찰하기 →</a></div><section className="panel lesson-filter-panel" aria-labelledby="lesson-stage-title"><h2 id="lesson-stage-title">학습 단계</h2><div className="learning-filters lesson-stage-filters" role="group" aria-label="수업 단계">{stages.map((s,i)=><button key={s} id={'lesson-stage-'+i} aria-pressed={stage===s} onClick={()=>setStage(s)}>{s}</button>)}</div><p role="status" data-testid="lesson-filter-status">{stage} · {lessons.filter(l=>stage==='전체'||l.stage===stage).length}개 수업</p></section><div className="lesson-list">{lessons.filter(l=>stage==='전체'||l.stage===stage).map((l,i)=><section className="panel lesson-card" key={l.id} id={`lesson-${l.id}`}><p className="eyebrow">{l.stage} · LESSON {i+1}</p><button className="lesson" id={'lesson-toggle-'+l.id} aria-expanded={open===l.id} aria-controls={'lesson-body-'+l.id} onClick={()=>setOpen(open===l.id?null:l.id)}>{l.title}<span aria-hidden="true">{open===l.id?'−':'+'}</span></button><div className="lesson-body" id={'lesson-body-'+l.id} hidden={open!==l.id}><p>{l.id==='fx'||l.id==='dividend'?correctedLessonText[l.id].body:l.body}</p><p className="practice">직접 해보기: {l.id==='fx'||l.id==='dividend'?correctedLessonText[l.id].practice:l.practice}</p>{(l.id==='stock'||l.id==='etf')&&<LearningUnit key={l.id} unit={learningUnits[l.id]}/>} {(l.id==='fx'||l.id==='dividend')&&<LearningUnit key={l.id} unit={a2Units[l.id]}/>} {(l.id==='us-market'||l.id==='rates'||l.id==='macro')&&<LearningUnit key={l.id} unit={p2Units[l.id]}/>}</div></section>)}</div></>}
  <p className="learning-disclaimer">일반 학습 자료이며 특정 상품의 매수·매도 권유가 아닙니다. 차트는 학습용 합성 예시이며 실제 시세나 주문 가격이 아닙니다.</p>
 </div>;
}
