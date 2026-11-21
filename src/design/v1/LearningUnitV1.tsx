import {useRef,useState,type KeyboardEvent} from 'react';
import type {LearningUnit as Unit} from '../../learningFoundation';
import {GuidedPractice,type MissionId} from '../../learningPractice';

type Step='concept'|'example'|'practice'|'quiz';
const steps:{id:Step;label:string;hint:string}[]=[
 {id:'concept',label:'개념',hint:'읽고 이해하기'},
 {id:'example',label:'사례',hint:'숫자로 살펴보기'},
 {id:'practice',label:'실습',hint:'직접 확인하기'},
 {id:'quiz',label:'퀴즈',hint:'이해도 확인'}
];

/** Presentation-only course reader. All unit text and existing progress callbacks are reused.
 * Each route renders only the selected lesson, preventing ten expanded lectures from growing the page. */
export function LearningUnitV1({unit,lessonId,savedAnswers,completed,onAnswer,onCompletion}:{
 unit:Unit;lessonId:MissionId;savedAnswers?:Record<string,string>;completed:boolean;
 onAnswer:(id:MissionId,question:string,answer:string)=>void;
 onCompletion:(id:MissionId,completed:boolean)=>void;
}){
 const [step,setStep]=useState<Step>('concept');
 const buttons=useRef<(HTMLButtonElement|null)[]>([]);
 const current=steps.findIndex(x=>x.id===step);
 const answered=unit.questions.filter(q=>q.options.some(o=>o.text===savedAnswers?.[q.question])).length;
 function change(e:KeyboardEvent<HTMLButtonElement>,i:number){
  const k=e.key;const next=k==='ArrowRight'?(i+1)%steps.length:k==='ArrowLeft'?(i+steps.length-1)%steps.length:k==='Home'?0:k==='End'?steps.length-1:-1;
  if(next<0)return;e.preventDefault();setStep(steps[next].id);buttons.current[next]?.focus();
 }
 return <div className="v1-unit-reader">
  <nav className="v1-unit-stepper" aria-label="수업 내용 단계">
   <div className="v1-unit-tabs" role="tablist" aria-label="학습 단계 선택">
    {steps.map((item,i)=><button type="button" key={item.id} ref={node=>{buttons.current[i]=node;}} role="tab" id={'v1-unit-'+lessonId+'-'+item.id}
     aria-controls={'v1-unit-'+lessonId+'-panel'} aria-selected={step===item.id} tabIndex={step===item.id?0:-1}
     className={step===item.id?'is-current':''} onClick={()=>setStep(item.id)} onKeyDown={e=>change(e,i)}>
      <span className="v1-step-number" aria-hidden="true">{i+1}</span><span className="v1-step-words"><strong>{item.label}</strong><small>{item.hint}</small></span>
     </button>)}
   </div>
  </nav>
  <div className="v1-unit-section" id={'v1-unit-'+lessonId+'-panel'} role="tabpanel" aria-labelledby={'v1-unit-'+lessonId+'-'+step} tabIndex={0} key={step}>
   {step==='concept'&&<div className="v1-reader-content">
    <div className="v1-reader-intro"><span className="v1-reader-eyebrow">01 · 이해하기</span><h3>이 수업의 핵심 개념</h3><p>{unit.concept}</p></div>
    <div className="v1-reader-essentials">
     <section><span className="v1-mini-label">WHY</span><h4>왜 중요할까?</h4><p>{unit.importance}</p></section>
     <section><span className="v1-mini-label">HOW</span><h4>어디에 활용할까?</h4><p>{unit.application}</p></section>
    </div>
    <section className="v1-reader-note"><span aria-hidden="true">!</span><div><h4>헷갈리기 쉬운 점</h4><p>{unit.misunderstanding}</p></div></section>
   </div>}
   {step==='example'&&<div className="v1-reader-content">
    <div className="v1-reader-intro"><span className="v1-reader-eyebrow">02 · 사례로 익히기</span><h3>숫자와 사례로 이해하기</h3><p>{unit.example}</p></div>
    {unit.table&&<section className="v1-reader-table-section"><h4>{unit.table.caption}</h4><div className="v1-reader-table-scroll" role="region" aria-label={unit.table.caption} tabIndex={0}>
     <table><caption>{unit.table.caption}</caption><thead><tr>{unit.table.headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{unit.table.rows.map((row,i)=><tr key={i}><th scope="row">{row[0]}</th>{row.slice(1).map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table>
    </div></section>}
    {unit.timeline&&<section className="v1-reader-timeline"><h4>{unit.timeline.caption}</h4><ol>{unit.timeline.steps.map((item,i)=><li key={i}><strong>{item.title}</strong><p>{item.text}</p></li>)}</ol></section>}
    {!unit.table&&!unit.timeline&&<p className="v1-reader-reassurance">이 사례는 개념 이해를 돕는 예시입니다. 실제 투자 결과나 가격이 아닙니다.</p>}
   </div>}
   {step==='practice'&&<div className="v1-reader-content">
    <div className="v1-reader-intro"><span className="v1-reader-eyebrow">03 · 실제 화면에서 확인하기</span><h3>직접 연습해 보세요</h3><p>{unit.practice.text}</p></div>
    <div className="v1-reader-practice-links"><a className="v1-reader-primary" href={unit.practice.href}>{unit.practice.label}</a>{unit.practice.extra&&<a className="v1-reader-secondary" href={unit.practice.extra.href}>{unit.practice.extra.label}</a>}<a className="v1-reader-secondary" href="#learn/lab">합성 차트 실습실 열기 →</a></div>
    <GuidedPractice lessonId={lessonId}/>
   </div>}
   {step==='quiz'&&<div className="v1-reader-content">
    <div className="v1-reader-intro"><span className="v1-reader-eyebrow">04 · 이해도 확인</span><h3>얼마나 이해했는지 확인해요</h3><p>문제 {answered}/{unit.questions.length}개 응답 · 선택한 답은 기존 브라우저 학습 기록에 보관돼요.</p></div>
    <div className="v1-reader-questions">{unit.questions.map((q,i)=>{
     const selected=q.options.findIndex(o=>o.text===savedAnswers?.[q.question]);
     const choice=selected>=0?q.options[selected]:null;
     return <fieldset key={q.question} className="v1-reader-question" data-review={choice&&!choice.correct?'incorrect':undefined}>
      <legend><span className="v1-question-number">{String(i+1).padStart(2,'0')}</span> {q.question}</legend>
      <div className="v1-reader-options">{q.options.map((option,j)=><label key={option.text} className={selected===j?'is-selected':''}>
       <input type="radio" name={'v1-'+lessonId+'-'+i} checked={selected===j} onChange={()=>onAnswer(lessonId,q.question,option.text)}/><span>{option.text}</span>
      </label>)}</div>
      {choice&&<p className="v1-reader-feedback" role="status"><strong>{choice.correct?'맞았어요. ':'다시 생각해 보세요. '}</strong>{choice.feedback}</p>}
     </fieldset>;
    })}</div>
    <div className="v1-reader-completion"><button type="button" aria-pressed={completed} onClick={()=>onCompletion(lessonId,!completed)}>{completed?'완료 표시 취소':'이 수업 학습 완료로 표시'}</button><p>완료 표시는 직접 선택한 기록이며 퀴즈 정답이나 실습 완료를 자동으로 인증하지 않습니다.</p></div>
   </div>}
  </div>
  <div className="v1-reader-controls">
   <button type="button" onClick={()=>setStep(steps[current-1].id)} disabled={current===0}>← 이전 내용</button>
   <span aria-label={'학습 단계 '+(current+1)+' / '+steps.length}>{current+1} / {steps.length}</span>
   {current<steps.length-1?<button type="button" className="v1-reader-next" onClick={()=>setStep(steps[current+1].id)}>{steps[current+1].label}으로 계속 →</button>:<button type="button" className="v1-reader-next" onClick={()=>setStep('concept')}>처음부터 복습하기 ↺</button>}
  </div>
  <details className="v1-reader-sources"><summary>참고 자료 · 출처 {unit.sources.length}개</summary><ul>{unit.sources.map(x=><li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.label} ↗<span className="sr-only"> (새 탭)</span></a></li>)}</ul></details>
 </div>;
}
