# UX5-A2-RC1 릴리스 준비 검수

## 판정: BLOCKED

모바일에서 재현한 초점 가림을 수정하고 자동 회귀를 실행했다. 다만 열 단원 전체 실제 화면의 사람이 읽는 검수와 19개 출처의 모든 주장·발행일·APA 7 완전 대조는 끝나지 않았다. 실기기·스크린리더는 별도 검증이 필요하다. 따라서 배포 가능 판정을 내리지 않는다.

## 수정과 검증 범위

320px 경제지표 단원에서 마지막 BLS 출처 링크에 키보드 초점을 주면 하단 고정 메뉴가 링크를 가렸다. 모바일 루트 스크롤의 하단 여백을 지정한 뒤, 열 단원 각각의 마지막 퀴즈 선택지와 출처 링크 초점이 320·390·768·1200·1440px에서 화면 안에 있고 다른 요소에 가리지 않는지 Chromium으로 확인했다. 320·390px 실제 캡처는 `ux5-a2-rc1-captures/`에 있다. 원래 10개 수업 데이터와 SHA 계약, 라우트 및 기존 테스트는 유지했다. 합성 가격·환율, 별도 참고환율, 계좌·수기 게이트·뉴스 및 일정 안내의 기존 QA 결과와 관련 테스트를 사용했다.

공식 URL 19개는 2026-11-08 재조회에서 HTTP 200이었다. SEC의 주문·배당·분산 설명, BEA의 CPI/PCE 범위, BLS의 가계·사업체 조사, 연준의 연방기금금리 설명 등 주요 원문을 확인했다. BEA의 CPI/PCE FAQ는 2010-11-03 게시·2018-07-26 수정으로 표시되며 참고문헌에 수정일을 반영했다. BLS 고용 요약은 수시 갱신 페이지여서 열람일을 명시했다. 연준 정책금리 페이지에는 2026-10-28 최종 갱신 표시가 있다. 다른 출처의 발행일과 각 교육 문장의 완전한 출처 대응은 NOT VERIFIED이며 날짜를 추정하지 않았다.

P1 #15 → P2 #16 → P3 #17 → QA #18은 요청된 base·HEAD를 유지하고 GitHub에서 Draft/OPEN·MERGEABLE로 표시된다. 이는 기능 및 콘텐츠에 대한 최종 승인과 다르다. main 병합과 Pages 배포는 수행하지 않았다.

## 테스트

Pages 플래그 build/TypeScript PASS. 변경 전 학습 영향 42건 PASS, 수정 후 새 키보드 초점 검사 2건 PASS 및 전체 UI 재실행 378건 PASS. Auth fixture 54건, UX0 3건 PASS. Release는 최초 빌드의 인증 설정 누락으로 1건 실패·5건 통과했고, 해당 1건을 모든 요청을 fixture가 가로채는 테스트 자격값으로 재실행하여 PASS. 공개 참고자료 관련 테스트도 최초 설정 누락으로 실패했으나 가짜 연결 설정과 테스트 응답으로 24건 및 전체 UI를 재실행하여 PASS. 기존 UX0 미커밋 캡처는 백업에서 복원했다. `git diff --check` PASS. 실제 운영 인증·DB·Pages, 실기기와 스크린리더는 NOT VERIFIED.

GitHub Actions: 기존 PR의 최종 체크 및 이 브랜치의 CI 결과는 별도로 확인해야 한다. 현재 판정은 BLOCKED를 유지한다.


## 2026-11-08 URL 응답·제목 점검

아래는 HTTP 응답과 페이지 제목의 확인 기록이며 각 페이지의 모든 교육 주장과 발행일 검증을 뜻하지 않는다.

- 200 · Personal Consumption Expenditures Price Index | U.S. Bureau of Economic Analysis (BEA) — https://www.bea.gov/data/personal-consumption-expenditures-price-index
- 200 · What accounts for the differences in the PCE price index and the Consumer Price Index? | U.S. Bureau of Economic Analysis (BEA) — https://www.bea.gov/help/faq/555
- 200 · Consumer Price Index Frequently Asked Questions : U.S. Bureau of Labor Statistics — https://www.bls.gov/cpi/questions-and-answers.htm
- 200 · Employment Situation Summary - 2026 M10 Results — https://www.bls.gov/news.release/empsit.nr0.htm
- 200 · The Fed - Economy at a Glance - Policy Rate — https://www.federalreserve.gov/economy-at-a-glance-policy-rate.htm
- 200 · Beginners’ Guide to Asset Allocation, Diversification, and Rebalancing | Investor.gov — https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset
- 200 · Introduction to Investing | Investor.gov — https://www.investor.gov/introduction-investing
- 200 · Social Media and Stock Tip Scams – Investor Alert | Investor.gov — https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/social-media-stock-scams
- 200 · Asset Allocation and Diversification | Investor.gov — https://www.investor.gov/introduction-investing/getting-started/asset-allocation
- 200 · Dividend | Investor.gov — https://www.investor.gov/introduction-investing/investing-basics/glossary/dividend
- 200 · Dollar Cost Averaging | Investor.gov — https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging
- 200 · Ex-Dividend Dates: When Are You Entitled to Stock and Cash Dividends | Investor.gov — https://www.investor.gov/introduction-investing/investing-basics/glossary/ex-dividend-dates
- 200 · Executing an Order | Investor.gov — https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/executing-order
- 200 · Types of Orders | Investor.gov — https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders
- 200 · International Investing | Investor.gov — https://www.investor.gov/introduction-investing/investing-basics/investment-products/international-investing
- 200 · Exchange-Traded Funds (ETFs) | Investor.gov — https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2
- 200 · Stocks - FAQs | Investor.gov — https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks
- 200 · Internet and Social Media Fraud | Investor.gov — https://www.investor.gov/protect-your-investments/fraud/types-fraud/internet-and-social-media-fraud
- 200 · Trading Information | Trading at NYSE — https://www.nyse.com/trade/trading-information

## 2026-11-12 통합 릴리스 재평가

사용자가 승인한 배포 기준에 따라 RC1의 BLOCKED 사유를 재평가한다. 실기기·스크린리더와 일부 출처 발행일·주장별 전체 대조는 미검증 잔여 위험으로 유지하며 통과로 표시하지 않는다. 중대한 사실 오류·접근 불가·원본 계약 파손·금융 회귀 또는 필수 검증 실패가 확인되면 배포를 중단한다. 최종 배포 및 운영 상태는 GitHub Actions와 실제 사이트에서 별도 확인한다.
