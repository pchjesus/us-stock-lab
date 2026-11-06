# UX5-A2-P2 시장·금리·경제지표 학습

P1의 환율·배당과 A1의 주식·ETF 확장을 보존하면서 `us-market`, `rates`, `macro`에 별도 구조화 단원을 연결했다. 원본 열 수업의 ID·단계·제목·본문·실습과 해시는 유지한다. P1 공통 컴포넌트의 표·순서 목록·선택지별 해설을 재사용하며 진도 저장은 없다.

시장 단원은 최근 체결가와 가상 호가, 10주 계산, 시장가·지정가와 체결 위험, ET/KST 및 시간외 거래의 개념을 설명한다. 이 앱은 합성 가격을 사용한 정규장 가상 시장가 주문만 제공한다. 금리 단원은 목표범위·시장금리·가상 차입 이자와 할인 경로를, 경제지표 단원은 CPI/PCE·고용 조사 및 가상의 예상/발표/이전 수치를 설명한다. 모든 수치 사례는 가상이고 일정은 합성 자료다. 공식 자료와 앱 기능을 혼동하지 않도록 출처와 한계를 표시한다.

## 참고문헌 (APA 7판)

U.S. Securities and Exchange Commission. (n.d.). *Types of orders*. Investor.gov. https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders

U.S. Securities and Exchange Commission. (n.d.). *Executing an order*. Investor.gov. https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/executing-order

New York Stock Exchange. (n.d.). *Trading information*. https://www.nyse.com/trade/trading-information

Board of Governors of the Federal Reserve System. (n.d.). *Policy rate*. https://www.federalreserve.gov/economy-at-a-glance-policy-rate.htm

U.S. Bureau of Labor Statistics. (n.d.). *Consumer price index: Frequently asked questions*. https://www.bls.gov/cpi/questions-and-answers.htm

U.S. Bureau of Economic Analysis. (n.d.). *Personal consumption expenditures price index*. https://www.bea.gov/data/personal-consumption-expenditures-price-index

U.S. Bureau of Economic Analysis. (n.d.). *How does the consumer price index differ from the PCE price index?* https://www.bea.gov/help/faq/555

U.S. Bureau of Labor Statistics. (n.d.). *The employment situation*. https://www.bls.gov/news.release/empsit.nr0.htm

## 검증

Pages 설정(공개 참고자료 true, 수기 거래 false) production build 및 TypeScript PASS. A1·P1·P2 수업, 해시·경로·ChartLab을 포함한 영향 테스트 32건, 전체 UI 366건, Auth 54건, release 6건, UX0 3건 PASS. 1440·768·390·320px에서 키보드, 표 가로 이동, 금융 RPC 및 로컬 데이터 보존을 확인했고 `ux5-a2-p2-captures/`에 1440·390px 캡처를 보관한다. `git diff --check` PASS.

UX0 최초 실행은 기존 4180 포트 충돌로 시작하지 못했다. 동일한 프로토타입 설정을 4186 포트로 바꿔 재실행하여 3건 통과했다. 기존 미커밋 UX0 캡처는 내용 그대로 복원했다. Auth 검사는 별도의 수기 활성 테스트 fixture를 사용한다. 실기기와 배포된 Pages는 검증하지 않았다.

공통 단원 컴포넌트와 표·순서 목록을 재사용하고 원본 데이터 계약을 유지했다. 이번에는 반복 결함이나 상태 소유권 변경 근거가 없어 추가 리팩터링을 보류하며, 단원 추가 시 분기 수정의 반복이 문제가 되면 재검토한다.
