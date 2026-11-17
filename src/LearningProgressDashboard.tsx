import {useState} from 'react';
import {learningProgressStats,type LearningProgress} from './learningProgress';
import {lessonPracticeRoute,type MissionId} from './learningPractice';

export function LearningProgressDashboard({progress,lessonTitles,onReset,scope}:{progress:LearningProgress;lessonTitles:Record<MissionId,string>;onReset:()=>void;scope:'guest'|'signed-in'}){
 const [confirm,setConfirm]=useState(false);
 const stats=learningProgressStats(progress);
 return <section className="panel learning-progress-dashboard" aria-labelledby="learning-progress-title">
  <div className="learning-progress-header">
   <div><p className="eyebrow">UX5-C · 나의 학습 기록</p><h2 id="learning-progress-title">학습 현황</h2><p>{scope==='guest'?'비로그인 브라우저 기록':'이 로그인 사용자에게 연결된 브라우저 기록'} · 실제 계좌·서버에는 저장되지 않아요.</p></div>
   <a className="ui-link" href={progress.lastLesson?lessonPracticeRoute(progress.lastLesson):'#learn/lessons'}>{progress.lastLesson?'마지막 수업 이어하기 →':'첫 수업 시작하기 →'}</a>
  </div>
  <div className="learning-progress-metrics">
   <div><span>완료한 수업</span><strong>{stats.completed}/10</strong></div>
   <div><span>확인한 문제</span><strong>{stats.answered}/{stats.total}</strong></div>
   <div><span>현재 선택 정답률</span><strong>{stats.accuracy===null?'—':stats.accuracy+'%'}</strong></div>
   <div><span>복습할 오답</span><strong>{stats.wrong.length}개</strong></div>
  </div>
  <progress value={stats.completed} max={10} aria-label="수업 완료 진도">{stats.completed}/10</progress>
  {stats.wrong.length>0?<div className="learning-review-list"><h3>오답 다시 확인하기</h3><p>현재 틀린 선택지만 표시해요. 같은 문제를 다시 풀어 맞히면 목록에서 사라집니다.</p><ul>{stats.wrong.map(x=><li key={x.id+x.question}><a className="ui-link" href={lessonPracticeRoute(x.id)}>{lessonTitles[x.id]} · {x.question} →</a></li>)}</ul></div>:<p className="learning-no-review">현재 기록된 오답이 없어요. 아직 문제를 풀지 않았다면 수업에서 선택해 보세요.</p>}
  <div className="learning-progress-footer">
   {!confirm?<button type="button" onClick={()=>setConfirm(true)}>이 브라우저의 학습 기록 초기화</button>:<div role="group" aria-label="학습 기록 초기화 확인"><p>현재 학습 프로필의 수업 완료·퀴즈 답안이 삭제돼요. 삭제할까요?</p><button type="button" onClick={()=>{onReset();setConfirm(false)}}>삭제 확인</button><button type="button" onClick={()=>setConfirm(false)}>취소</button></div>}
   <small>정답률은 지금 선택한 답 중 정답 비율이며, 과거 시험 점수가 아닙니다. 브라우저 데이터를 삭제하면 기록을 복원할 수 없어요.</small>
  </div>
 </section>;
}
