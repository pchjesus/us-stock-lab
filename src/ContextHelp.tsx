import {resolveLearningRoute} from './learningRoutes';
export const helpTopics={
 home:{label:'홈',text:'내 자산과 관심종목을 먼저 확인하세요. 로그인 전 로컬 기록과 로그인 후 서버 계좌는 서로 다릅니다.'},
 market:{label:'시장·종목 검색',text:'이름이나 심볼로 기존 지원 종목을 찾아보세요. 별표로 관심종목을 관리할 수 있어요. 검색 가능 여부가 거래 허용을 뜻하지는 않습니다.'},
 indices:{label:'주요 지표·환율',text:'지표마다 합성 예시인지 공식 연동 대기인지 확인하세요. 실제 참고환율은 출처와 기준일이 있는 일별 참고값이며 실시간 환율이 아닙니다.'},
 stock:{label:'개별 기업·ETF',text:'기업은 사업과 재무를, ETF는 상품의 투자 대상을 살펴보세요. 공식 재무자료와 합성 주가는 서로 다른 자료입니다. 외부 차트 가격은 주문에 자동 입력되지 않습니다.'},
 portfolio:{label:'포트폴리오',text:'보유종목과 거래·현금 기록을 확인하세요. 합성 가격으로 평가한 값과 실제 투자 성과는 다릅니다. 수기 계좌는 별도 승인 전 비활성 상태입니다.'},
 learn:{label:'학습',text:'원하는 난이도와 주제부터 시작하세요. 개념을 읽고 실습 안내를 따라가며 익힐 수 있어요.'},
 lab:{label:'차트 실습실',text:'학습용 합성 차트에서 기간과 지표를 바꾸며 관찰하세요. 차트의 표시 주기를 바꿔도 모의 주문가격은 바뀌지 않습니다.'},
 calendar:{label:'경제 캘린더·뉴스',text:'일정의 합성 표시와 공식 참고 출처를 구분하세요. 발표 시간이 지났다는 이유만으로 실제 결과가 채워지지는 않습니다. 미제공 뉴스는 추정하지 않습니다.'},
 settings:{label:'설정·계정',text:'로그인 상태와 표시 통화를 확인하세요. 로그인 전 로컬 계좌는 자동으로 서버에 옮겨지지 않습니다. 원화 표시는 주문·원장의 USD 계산과 별도입니다.'}
} as const;
export type HelpTopic=keyof typeof helpTopics;
export function helpTopicForRoute(route:string):HelpTopic {
 if(route==='learn'||route.startsWith('learn/'))return resolveLearningRoute(route).kind==='lab'?'lab':'learn';
 if(route.startsWith('stock/'))return 'stock';
 if(route==='calendar'||route==='news')return 'calendar';
 return route in helpTopics?route as HelpTopic:'home';
}
