# UX5-A2-P1 환율·배당 학습

원본 10개 수업 데이터와 해시는 그대로 두고 `learningA2.ts`의 별도 표시 설명과 상세 단원을 연결했다. 기존 단원 컴포넌트에 표와 순서 있는 일정 표현을 선택적으로 추가했다. 주식·ETF 수업 및 기존 경로와 퀴즈도 유지한다.

환율 단원은 가상의 달러 평가액과 환율을 곱하는 표로 가격 변화와 환율 변화의 차이를 보여준다. USD/KRW 표시 토글의 1,360원은 합성값이며 Frankfurter 공개 참고환율은 별도 자료다. 실제 환전, 환율손익, 환전비용을 계산하지 않는다. 배당 단원은 10주 × $2, 배당수익률과 가격 손실을 함께 고려한 총수익의 가상 사례, 발표·배당락·지급 순서를 보여준다. 특별배당 등 일정 예외가 있으며 배당과 주가 조정은 보장되지 않는다. 기본 합성 계좌에는 배당 지급이 없고 Pages 설정에서 별도 수기 기능은 꺼져 있다.

표의 숫자는 모두 가상이다. 배당 계산은 재투자·세금·비용을 제외한다. 퀴즈의 선택별 해설은 화면에서만 유지하며 진도를 저장하지 않는다. 후속 수업 감사와 우선순위는 [UX5_A2_AUDIT.md](UX5_A2_AUDIT.md)를 참고한다.

## 참고문헌 (APA 7판)

U.S. Securities and Exchange Commission. (n.d.). *Dividend*. Investor.gov. https://www.investor.gov/introduction-investing/investing-basics/glossary/dividend

U.S. Securities and Exchange Commission. (n.d.). *Ex-dividend dates: When are you entitled to stock and cash dividends*. Investor.gov. https://www.investor.gov/introduction-investing/investing-basics/glossary/ex-dividend-dates

U.S. Securities and Exchange Commission. (n.d.). *International investing*. Investor.gov. https://www.investor.gov/introduction-investing/investing-basics/investment-products/international-investing

U.S. Securities and Exchange Commission. (n.d.). *Stocks - FAQs*. Investor.gov. https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks

## 검증

Pages 설정(공개 참고자료 true, 수기 거래 false)으로 TypeScript·production build PASS. 학습 영향 검사 22건, 전체 UI 362건, 인증/수기 fixture 54건, release 6건, UX0 3건 PASS. 보강한 신규 수업 검사 4건 PASS: 320px 표의 키보드 가로 이동 포함. 1440/390px 실제 Chromium 캡처는 `ux5-a2-p1-captures/`에 보존했다.

전체 UI 및 인증 검사는 데스크톱·모바일 프로젝트로 실행했다. 인증 테스트는 별도의 수기 활성 테스트 fixture를 사용하며 공개 Pages 설정을 변경하지 않는다. 기존 UX0 미커밋 캡처 두 개는 실행 후 원본으로 복원했다.
