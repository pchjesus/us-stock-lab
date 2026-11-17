import {useState} from 'react';

/** UX5-B is a guided navigation exercise, not tracked learning progress. */
export const practiceMissions={
 stock:{title:'기업의 지분과 사업을 확인하기',target:'#stock/AAPL',action:'애플 기업 상세에서 실습 시작',tasks:['기업 소개와 공식 재무 정보의 기간을 찾아보세요.','합성 주가와 실제 기업 공시가 서로 다른 종류의 자료인지 확인하세요.'],reminder:'기업의 과거 실적은 미래 수익을 보장하지 않습니다.'},
 etf:{title:'ETF 상품의 구성과 한계 살펴보기',target:'#stock/VOO',action:'VOO 상품 정보에서 실습 시작',tasks:['VOO가 주식과 어떻게 다른 상품인지 살펴보세요.','ETF 내부 보유 비중처럼 확인되지 않은 정보는 추측하지 않는지 확인하세요.'],reminder:'ETF도 손실 위험이 있으며 모든 ETF가 충분히 분산되지는 않습니다.'},
 'us-market':{title:'합성 가격의 움직임 비교하기',target:'#learn/AAPL',action:'AAPL 차트 실습실로 이동',tasks:['차트 기간을 바꿔 종가와 캔들의 차이를 관찰하세요.','가상 가격 변화만으로 기업의 미래를 예측할 수 있는지 생각해 보세요.'],reminder:'차트 데이터는 실제 미국주식 과거 시세가 아닙니다.'},
 fx:{title:'표시 환율과 참고 환율 구별하기',target:'#market',action:'시장 화면에서 환율 실습 시작',tasks:['USD/KRW 표시를 전환해 합성 가격의 표기 변화를 확인하세요.','지표 화면의 공개 참고환율과 표시용 합성 환율이 같지 않다는 점을 확인하세요.'],reminder:'통화 전환은 표시 기능이며 실제 환전이나 환율손익 계산이 아닙니다.'},
 dividend:{title:'배당 정보의 확인 상태 살펴보기',target:'#stock/AAPL',action:'기업 상세에서 배당 안내 확인',tasks:['배당·분배 자료가 공식 확인인지 미제공인지 구별해 보세요.','가격 수익과 배당 수익의 차이를 생각해 보세요.'],reminder:'현재 기본 합성 계좌에서는 실제 배당이 지급되지 않습니다.'},
 rates:{title:'FOMC 일정의 정보 상태 확인하기',target:'#calendar',action:'경제 캘린더에서 실습 시작',tasks:['FOMC 항목을 찾아 무엇을 발표하는지 살펴보세요.','합성 예시 일정과 기관의 공식 자료를 구분해 보세요.'],reminder:'금리 발표만으로 주가의 방향을 확정할 수 없습니다.'},
 macro:{title:'경제지표의 예상·실제·이전값 구별하기',target:'#calendar',action:'경제 캘린더에서 지표 실습 시작',tasks:['CPI·PCE 또는 고용 항목의 자료 상태를 확인하세요.','발표값이 비어 있다면 실제 숫자를 임의로 추정하지 마세요.'],reminder:'이 앱의 경제 일정 예시는 실제 발표 결과를 대체하지 않습니다.'},
 averaging:{title:'추가 매수와 평균단가의 관계 확인하기',target:'#stock/AAPL',action:'AAPL 상세에서 추가 매수 분석 보기',tasks:['보유종목과 조건이 있다면 추가 매수 분석을 살펴보세요.','보유 주식이 없다면 수업의 가상 계산 표로 평균단가 변화를 확인하세요.'],reminder:'분석은 주문이 아니며 투자금을 늘리면 위험도 커질 수 있습니다.'},
 diversification:{title:'집중형·분산형 포트폴리오 비교하기',target:'#experience',action:'합성 포트폴리오 체험실 시작',tasks:['체험실에서 포트폴리오 구성 분석 단계로 이동하세요.','집중형과 분산형 예시의 보유 비중·HHI 차이를 확인하세요.'],reminder:'HHI는 집중도 지표로 시장 전체의 위험까지 측정하지 않습니다.'},
 news:{title:'뉴스의 출처와 근거 구분하기',target:'#news',action:'경제·금융 뉴스 화면에서 실습 시작',tasks:['자료가 제공된다면 출처와 발행 시각을 확인하세요.','뉴스가 미제공이라면 실제 보도가 있는 것처럼 가정하지 마세요.'],reminder:'제목·전망만으로 매매 결정을 확정하지 않습니다.'}
} as const;
export type MissionId=keyof typeof practiceMissions;
const SESSION_KEY='us-stock-lab.learning-practice.v1';
const MAX_AGE_MS=30*60*1000;
type ActivePractice={id:MissionId;startedAt:number};
const known=(id:string):id is MissionId=>Object.prototype.hasOwnProperty.call(practiceMissions,id);
export function lessonPracticeRoute(id:MissionId){return '#learn/lessons/'+id;}
export function beginLearningPractice(id:MissionId){try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({id,startedAt:Date.now()} satisfies ActivePractice));}catch{/* Direct navigation still works without storage. */}}
export function clearLearningPractice(){try{sessionStorage.removeItem(SESSION_KEY);}catch{/* storage unavailable */}}
export function currentLearningPractice():{id:MissionId;mission:typeof practiceMissions[MissionId]}|null{
 try{const raw=sessionStorage.getItem(SESSION_KEY);if(!raw)return null;
  const value=JSON.parse(raw) as Partial<ActivePractice>;
  if(typeof value.id!=='string'||!known(value.id)||typeof value.startedAt!=='number'||!Number.isFinite(value.startedAt)||value.startedAt>Date.now()+60_000||Date.now()-value.startedAt>MAX_AGE_MS){clearLearningPractice();return null;}
  return {id:value.id,mission:practiceMissions[value.id]};
 }catch{return null;}
}
export function GuidedPractice({lessonId}:{lessonId:MissionId}){
 const mission=practiceMissions[lessonId];
 return <section className="learning-guided-practice" aria-label="학습 연계 실습 미션">
  <p className="eyebrow">UX5-B · 읽고 직접 확인하기</p>
  <h3>{mission.title}</h3>
  <ol>{mission.tasks.map(task=><li key={task}>{task}</li>)}</ol>
  <p className="learning-mission-caution">{mission.reminder}</p>
  <a className="ui-link learning-mission-link" href={mission.target} onClick={()=>beginLearningPractice(lessonId)}>{mission.action} →</a>
  <small>읽기 전용 실습을 권장해요. 화면에서 수업으로 돌아온 뒤 아래 퀴즈를 풀어보세요. 실습 여부는 자동으로 평가하거나 저장하지 않습니다.</small>
 </section>;
}
export function PracticeReturn({route}:{route:string}){
 const [dismissed,setDismissed]=useState(false);
 const active=currentLearningPractice();
 if(dismissed||!active||active.mission.target.slice(1)!==route)return null;
 return <aside className="learning-practice-return panel" aria-label="학습 실습 복귀 안내">
  <div><p className="eyebrow">학습 실습 중</p><h2>{active.mission.title}</h2><p>{active.mission.tasks.join(' ')}</p></div>
  <div className="learning-practice-return-actions">
   <a className="ui-link" href={lessonPracticeRoute(active.id)} onClick={clearLearningPractice}>원래 수업으로 돌아가기 →</a>
   <button type="button" onClick={()=>{clearLearningPractice();setDismissed(true);}}>안내 닫기</button>
  </div>
 </aside>;
}
