# UX4-F2 섹터·지원 종목 탐색

시장 화면의 지원 8종목을 섹터 레일, 이름/심볼 검색과 관심종목 필터의 AND 조건으로 탐색한다. 표시 전용 분류는 2026-11-05 기준 AAPL/MSFT/NVDA 정보기술, AMZN 경기소비재, GOOGL 커뮤니케이션, VOO/QQQ/SCHD ETF다. [S&P DJI S&P 500](https://www.spglobal.com/spdji/en/indices/equity/sp-500/)은 GICS 분류의 참고 출처이며 이 페이지 하나만으로 각 종목의 시점별 분류를 독립 검증한 것은 아니다. 분류는 사용자가 지정한 고정 표시 매핑이며 미래 분류 변경 시 검토가 필요하다. SEC 후보에는 적용하지 않는다.

지원 종목 목록은 이름·심볼·분류·기존 설명과 관심종목 및 외부 시세 링크를 제공한다. 기존 TradingView 링크 매핑을 상세 거래 탭과 공유하며 외부 시세를 수집하거나 주문에 전달하지 않는다. 홈 관심종목 행, 금융 데이터 및 SEC 후보 가져오기/검색/검증은 유지한다. 섹터 상태와 검색 조건 초기화를 제공한다.

## 검증과 화면

- 공개 참고자료 true·수기 false production build: PASS. 신규·홈·SEC 후보·외부 차트 영향 검사 38/38 PASS.
- 체크포인트 전체 앱 330/330, Auth fixture 52/52, release 6/6, UX0 3/3 PASS. 330은 F1의 326에 신규 desktop/mobile 섹터 테스트 4개 실행이 더해진 값이다.
- 전체 회귀 이후 분류 출처 링크의 터치 높이를 44px로 보완하고 최종 build, 섹터 검사 4/4, release 6/6과 diff 검사를 다시 실행했다. 다른 전체 UI/Auth/UX0 검사는 해당 단일 CSS 보완 이전 체크포인트에서 실행했다.
- [1440px 화면](ux4-f2-captures/1440-sector.png) · [390px 화면](ux4-f2-captures/390-sector.png). Chromium에서 확인했다. 실기기·스크린리더 실사용은 NOT VERIFIED.
- UX0 검사에서 기존 미커밋 캡처는 사본으로 복원했으며 이 변경에 포함하지 않았다. 실제 시세 API, 운영 DB와 배포는 사용하지 않았다.
