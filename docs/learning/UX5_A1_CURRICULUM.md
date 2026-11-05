# UX5-A1 · 초보자 학습 기반

F2 `4c479da7eecdee5e15e4028e4a198195ea0576eb`에서 출발한다. 원본 10개 수업 배열·ID·제목·본문·실습과 기존 SHA-256 검사는 유지하고, `learningFoundation.ts`의 별도 자료로 stock/etf를 확장한다. 질문은 선택지별 정답 여부와 이유를 제공하며 답변은 화면 메모리에만 존재한다. 실제 주문을 발생시키지 않는다.

## 전체 경로 및 후속 콘텐츠

| 순서 | 학습 목표 | 내용과 연결 | 상태 |
| --- | --- | --- | --- |
| 주식·ETF | 소유 지분과 펀드, 손실·분산을 구분 | 시장·기업/ETF 상세, 합성 차트 | 주식·ETF 2단원 구현 |
| 시장·거래 | 가격, 거래 절차와 환율의 관계 이해 | 시장·차트·모의 주문 | 후속 설계 |
| 기업·재무 | 사업과 재무의 기간·출처 확인 | 기업 개요·재무·근거 | 후속 설계 |
| 차트 | 가격 표시와 지표의 의미·한계 관찰 | 합성 차트 실습실 | 기존 실습 연결, 설명 보완 예정 |
| 위험관리 | 분산·비용·손실 가능성 이해 | 관심종목·포트폴리오 | 후속 설계 |
| 종합 실습 | 정보 확인부터 판단 과정까지 복습 | 합성 모의투자·학습 화면 | 후속 설계 |

단원 구조는 개념·중요성·활용·수치/사례·오해/한계·직접 해보기·선택지별 피드백·출처로 구성한다. 주식 예시의 $100→$120/$80은 비용·배당 제외 가상 가격 차이이며, ETF 예시는 실제 구성이나 수익률이 아니다. ETF가 항상 분산되는 것은 아니고 비용·시장가격과 NAV 차이·손실 위험이 있다. 기존 ETF의 미확인 구성·보수·분배금을 임의 생성하지 않는다.

## 기존 10개 수업 감사 및 후속 수정 목록

- stock / etf: 기존 개념은 유지하고 이번 별도 단원에서 비용·손실·분산 한계를 확장했다.
- us-market: 가격에 기대와 금리 등이 영향을 줄 수 있다는 설명은 유지. 이후 거래시간·지연과 합성/외부 가격 구분을 보강한다.
- fx: “홈의 USD/KRW가 합성”이라는 실습은 표시 모드·공개 참고환율 카드와 혼동 가능. 합성 표시 환율과 별도 Frankfurter 참고자료, 환율손익 미계산을 구분하는 문구로 후속 정비한다.
- dividend: “배당 지급 기능 연동예정”은 수기 계좌용 확정 배당 처리 코드와 범위가 다를 수 있어 오래된 설명이다. 기본 합성 계좌와 제한된 수기 기능, 환경 게이트 및 운영 미확인 상태를 구분해 후속 수정한다. 현재 운영 배당 기능의 가용성을 이 코드만으로 주장하지 않는다.
- rates / macro: 합성 일정·예시값과 실제 발표 자료의 차이, 지표 해석의 한계를 후속 보강한다.
- averaging: 가격 변경 분석은 주문이 아니라는 경계를 유지하고 실제 차트 실습 경로를 재확인한다.
- diversification: 분산은 손실 방지가 아님을 유지하고 ETF 구성 중복·자산배분의 차이를 후속 보강한다.
- news: 합성 뉴스와 공식 링크·발행 시각의 구분을 후속 보강한다.
- 수기 계좌는 사용자 입력 가격의 별도 모의계좌이며 실거래가 아니다. 현재 수업에는 이에 대한 설명이 없으므로 기본 합성 계좌·참고 시세와 함께 후속 단원에서 구분한다.

## 참고문헌 (APA 7th)

U.S. Securities and Exchange Commission. (n.d.). *Introduction to investing*. Investor.gov. Retrieved November 5, 2026, from https://www.investor.gov/introduction-investing

U.S. Securities and Exchange Commission. (n.d.). *Exchange-traded funds (ETFs)*. Investor.gov. Retrieved November 5, 2026, from https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2

U.S. Securities and Exchange Commission. (n.d.). *Asset allocation and diversification*. Investor.gov. Retrieved November 5, 2026, from https://www.investor.gov/introduction-investing/getting-started/asset-allocation

위 세 공식 페이지를 직접 확인해 ETF의 비용과 NAV/거래가격 차이, 좁은 펀드의 분산 한계, 투자 손실 가능성을 반영했다. 금융 조언이나 투자 성과 보장이 아니다.
