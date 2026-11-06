# UX5-A2-P3 평균단가·분산투자·뉴스

10개 원본 수업 ID·단계·제목·본문·실습 및 해시를 보존한다. 상세 단원은 기존 데이터를 ID로 합치는 국소 매핑으로 연결하고 표·목록·퀴즈를 재사용한다. 링크를 선택해도 주문은 실행하지 않고 진도는 저장하지 않는다.

평균단가는 가상 10주 × $100과 5주 × $80의 가중 평균, $70 현재가의 평가손실을 보여준다. 별도의 교육 표는 빈 계좌에서도 볼 수 있으며 기존 분석기는 계좌 등 조건에 의존한다. 분산 예시는 $1,000의 두 포트폴리오에서 가정된 수익률을 적용하며 미래 결과나 실제 ETF 구성이 아니다. 뉴스 사례는 가상 기업의 발표 주장과 해석·전망을 구분하며 공식 공시 확인과 미구현된 뉴스 자동 수집을 별도로 설명한다.

완성된 열 단원: 주식, ETF, 미국주식 시장, 환율, 배당, 금리, 경제지표, 평균단가, 분산투자, 뉴스. A2-QA에서는 전체 단원의 개념·표기·연결 경로와 접근성을 통합 점검하고, UX5-C에서는 진도·복습 설계를 다룬다.

## 참고문헌 (APA 7판)

U.S. Securities and Exchange Commission. (n.d.). *Dollar cost averaging*. Investor.gov. https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging

U.S. Securities and Exchange Commission. (n.d.). *Asset allocation and diversification*. Investor.gov. https://www.investor.gov/introduction-investing/getting-started/asset-allocation

U.S. Securities and Exchange Commission. (n.d.). *Beginners’ guide to asset allocation, diversification, and rebalancing*. Investor.gov. https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset

U.S. Securities and Exchange Commission. (n.d.). *Social media and stock tip scams – investor alert*. Investor.gov. https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/social-media-stock-scams

U.S. Securities and Exchange Commission. (n.d.). *Internet and social media fraud*. Investor.gov. https://www.investor.gov/protect-your-investments/fraud/types-fraud/internet-and-social-media-fraud

## 검증

Pages 설정(공개 참고자료 true, 수기 거래 false) production build 및 TypeScript PASS. A1·P1·P2·P3와 해시·경로·ChartLab 영향 검사 38건, 전체 UI 372건, Auth 54건, Release 6건, UX0 3건 PASS. 1440·768·390·320px에서 표·키보드·포커스·가로 이동과 학습 중 로컬 데이터 보존 및 금융 RPC 0건을 확인했다. 1440·390px Chromium 캡처는 `ux5-a2-p3-captures/`에 보관한다. `git diff --check` PASS.

Auth는 별도의 수기 활성 테스트 fixture이며 Pages 설정을 바꾸지 않는다. UX0 실행 후 기존 미커밋 캡처 두 개를 원본으로 복원했다. 실기기, 실제 보조기술 및 배포된 Pages는 검증하지 않았다.

반복되던 단원별 조건문을 기존 ID와 컴포넌트를 유지하는 단순 매핑으로 통합했다. 추가적인 상태·금융 로직 리팩터링은 이번 범위에서 필요하지 않았다. A2-QA에서 열 단원의 연결과 읽기 경험을 통합 검토할 때 다시 평가한다.
