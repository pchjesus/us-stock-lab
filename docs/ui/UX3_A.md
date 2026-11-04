# UX3-A · 홈 정보 위계·시장 요약 통합

기준은 `codex/ui-v0.8-ux2-a` / `e2ae827fdb8bd6e389e57f75720478a3dcc652fb`이며 부모는 `ae1a5f285d45a85b6c6e5b12eeea15649b35c61e`다. 시작 시 원격 기준 HEAD·운영 main `51474c2904856e1668bacb815c7fd58ed83e177b`, clean 작업 트리, UX3-A 브랜치 부재를 확인하고 기존 checkout에 `codex/ui-v0.8-ux3-a`를 생성했다. worktree·별도 저장소·파괴적 초기화는 사용하지 않았다.

## 실제 홈 구성

`#home`에서 다음 순서로 정보를 제공한다. `HomeDashboard`는 표시와 탐색만 담당하고 기존 Workspace가 계좌·관심종목·시장정보 상태를 계속 소유한다.

| 영역 | 실제 구현과 보존 계약 |
| --- | --- |
| 나의 모의투자 현황 | 기존 AccountSummary/AccountView를 그대로 렌더링한다. 총자산을 가장 크게, 현금·보유 평가액·총손익·미실현/실현·보유 평가수익률을 정렬한다. 로컬/서버 구분·자산 구성 분석·로딩/오류/계좌 다시 조회·인증 설정을 보존하고 #portfolio 상세 링크를 제공한다. 허용된 개발 환경의 수기 선택은 기존 ManualWorkspace로 분기한다. |
| 미국 시장 한눈에 | 기존 useMarketInfo 결과에서 S&P 500/NASDAQ/Dow 3개만 읽는다. 값·pt·등락 방향/비율·자료 상태·원래 기준시각을 표시하고 전체 지표/참고환율/재무부 통계의 #indices 진입을 제공한다. |
| 관심종목 | 기존 useWatchlist와 종목 행을 재사용한다. 이름·심볼·주식/ETF·합성 가격·등락·aria-pressed 관심 상태·해제를 유지한다. 빈 상태와 기존 8종목 검색/관심 추가를 #market으로 연결한다. 종목은 기존 #stock/{symbol}로 이동한다. |
| 학습·시장 자료와 중요 일정 | #learn/#calendar/#news/#indices 탐색 카드를 제공한다. 기존 ImportantBanner를 아래에 배치하고 중요도·발표 상태·원래 시각·설명·결과/예상·캘린더 이동·닫기 동작을 유지한다. |

밝은 배경·흰색 카드·파란색 총자산/이동 강조와 기존 UX0/UX1 토큰을 사용한다. 자산 숫자와 보조 수치를 먼저 보여 주고 중복 소개 문장은 줄였다. PC는 자산/보조값과 3개 시장 카드를 나란히, 작은 화면은 단일 열과 관심종목 가격의 별도 행으로 배치한다. 자산 변화·시장 추이 그래프를 새로 만들지 않는다. 자산 구성은 기존 Allocation의 실제 계좌 값 기반 분석만 사용한다.

## 수치·상태·요청 정책

- AccountSummary·valuation·통화 format/반올림·합성 가격·금융 계산은 수정하지 않았다. 홈과 포트폴리오가 같은 값/컴포넌트를 사용한다. 수기 자산을 합성 계좌에 섞거나 미제공 수기 평가가격을 합성 가격으로 채우지 않는다.
- `homeMarketIndicators`는 기존 3개 ID의 읽기 전용 표시 투영이다. 유효한 원래 기준시각과 유한한 값만 표시하고 null/잘못된 값·시각은 미제공이다. 공식 대기 모드의 합성 값은 숨긴다. 없는 지수/등락률을 0으로 채우지 않는다.
- 날짜를 현재 시각으로 바꾸지 않는다. 합성 예시에는 생성 기준을 표시하고 실제 지수가 아님을 설명한다. 과거 공식 자료 fixture도 원래 날짜의 자료로만 표시한다. 새로 수신되지 않은 값을 최신 자료라고 부르거나 현재값으로 연장하지 않는다. 실시간으로 갱신되지 않는 기준시각 자료임을 명시한다. 공식 데이터 수집과 새 freshness 기준은 추가하지 않았다.
- 홈에는 전체 IndicatorCards 대신 요약을 표시한다. 전체 6개 지표/추이 팝업·참고환율·재무부 카드는 기존 #indices에서 그대로 제공한다. 홈 요약은 네트워크 요청을 추가하지 않으며 참고 카드도 홈에서 자동 요청하지 않는다. #indices 진입 후 기존 카드별 mount/재조회·실패/복구·중복 클릭/응답 역전 계약을 유지한다.
- 헤더 6지표·5초 슬라이더·팝업·일시정지·reduced-motion·시장 시계는 수정하지 않았다. 홈 요약과 같은 원본 상태를 읽는다. 관심종목 추가는 기존 시장 검색/별, 해제는 홈의 별 또는 기존 상세 조작을 사용한다. 신규 검색 카탈로그·거래 허용 종목·저장 키는 추가하지 않는다.

## 위험과 검증 설계

주요 위험은 표시 재구성으로 계좌 계산/저장 경계가 달라지거나, 전체 지표 조작 접근을 잃거나, Tour 첫 계좌 Spotlight가 무효화되는 경우였다. 금융 컴포넌트·상태는 이동/복제하지 않고 그대로 연결했다. 지표는 실제 #indices 이동과 기존 팝업/자료 카드, 관심종목은 실제 #market 추가→홈 복원→기업/ETF 상세→해제로 검사한다.

기존 `.balance.account-summary`를 유지하여 Tour 첫 대상이 그대로 존재한다. 신규 검사는 계좌 요약과 Spotlight의 실제 위치/너비를 대조하고 7단계 전체 진행 후 원래 홈/초점과 금융 저장값 복귀를 확인한다. 로컬 계좌 fixture는 비영(非零) 실현·미실현손익을 포함해 모든 표시값을 비교하고, 서버 fixture는 로딩·실패·재조회와 서로 다른 두 사용자의 계좌/관심종목·로그아웃 후 로컬 복원을 검사한다.

홈 관련 표시 컴포넌트 분리와 scoped CSS로 충분했다. 상태 소유권 변경·금융 구조 리팩터링이 필요한 반복 결함 근거는 없으며 대규모 리팩터링은 불필요하다. 향후 공유 상태 변경이나 같은 경계의 반복 회귀 때 재검토한다.

## 검증 결과

이번 UX3-A에서 직접 실행한 결과만 기록한다. 이전 UX2-A/B2 PASS를 새 결과로 합산하지 않는다.

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true VITE_ENABLE_MANUAL_TRADING=false npm run build
npm test -- --workers=2
npm run test:auth -- --workers=2
NODE_ENV=production npx playwright test --config playwright.home-dev.config.ts --workers=2
npx playwright test --config playwright.release.config.ts --grep 'release defaults' --workers=1
git diff --check
```

| 검사 | 결과 |
| --- | --- |
| 변경 전 홈·관심종목·지표·통화·Tour 기준선 | 12/12 PASS |
| 홈/관심종목/지표/주문/자료 카드/헤더/도움말 영향 검사 | 102/102 PASS · production React 동작의 Vite 개발 서버 |
| 신규 홈 검사 | 16/16 PASS · 전체 회귀와 영향 검사에 포함, 별도 합산하지 않음 |
| 홈 시장 상태 개발 fixture | 2/2 PASS · 로딩→오류→재시도·미제공/잘못된 시각·과거 공식 자료 날짜 유지·JS 오류0 |
| 최종 인증·수기·배당·세금 UI fixture | 48/48 PASS · 신규 홈 서버4개/수기2개 포함 |
| 최종 TypeScript/Vite build | PASS · 정상화 후 최종 실행1회 |
| 최종 production 전체 앱 UI | 278/278 PASS · 실제 최종 Vite 산출물, 전체 실행1회 |
| production 수기 false 게이트 | 1/1 PASS · 복원 로그인·저장 수기 선호 보존·홈 서버계좌100,000 USD 확인, 수기/배당/세금 RPC0 |
| diff 공백 검사 | PASS |
| 금융 PostgreSQL/SQL | NOT VERIFIED · 이번 미실행. 금융/DB 소스 불변으로 UX2-A에서 참조한 B2/G1 선행 검증 근거 재사용 |
| 실제 모바일·스크린리더/WCAG 전체·운영 Auth·실시간 운영 자료 응답 | NOT VERIFIED · 로컬 Chromium/터치 에뮬레이션과 고정 인증/자료 fixture 사용 |

첫 영향 검사는 32 PASS/2 FAIL이었다. 새 7단계 위치 테스트가 `.learning-filters`의 여러 요소를 단일 요소로 가정한 문제였으며, 실제 Tour의 querySelector와 같은 첫 요소를 대조하도록 수정한 후 해당 2/2가 통과했다. 새 개발 fixture의 첫 2 FAIL은 production React의 useState가 동적 import default 아래에 노출되는 테스트 진입 문제였다. 실제 export를 확인해 기존 fixture의 createElement와 같은 interop 방식으로 수정한 뒤 2/2가 통과했다. 앱 기능/수치 기대값을 제거하거나 기존 테스트를 skip하지 않았다.

신규 `home.spec.ts`는 8개 시나리오를 desktop/mobile에서 검사한다: 표시 투영 경계, 전체 로컬 계좌 값/Allocation/통화·원장 보존, 손상 계좌 원본/재조회, 관심 추가/복원/해제와 기업/ETF 이동, 3개 지수 대조·전체 자료/공식 대기 이동, 중요 일정 닫기/탐색, 7단계 Tour 대상/상태, 5해상도 키보드/터치·44px·focus-visible·reduced-motion·넘침/겹침/JS 오류/RPC0. 별도 home-fixture는 Vite 모듈 주입을 사용하는 개발용 검사로 전용 config에서 실행한다. 기존 production 검사 제외 목록은 변경하지 않고 이 신규 개발 전용 파일만 분리했다.

인증 파일에는 홈 서버 로딩/실패/재조회·표시값, 실제 UI 로그아웃/다른 사용자 로그인과 저장 격리를 추가했다. 수기 파일에는 개발 허용 환경의 홈 Workspace/재조회/포트폴리오·새로고침을 추가했다. 기존 app/market 테스트는 새 빈 안내와 홈 요약→전체 지표의 실제 사용자 경로로 수정했으며 검증 의미를 축소하지 않았다.

기존 개발 StrictMode의 공통 Modal 초점 복귀 제한은 이번에 수정하지 않았다. 영향 UI 검사는 production React 동작으로, 최종 전체 회귀·수기 false 게이트는 실제 최종 Vite 산출물로 분리 검증했다. 기존 Vite auth 정적/동적 import 및500KB 초과 chunk 경고는 남아 있다. 최종 production 미해결 FAIL은0건이다. 실기기/스크린리더·운영 인증 결과와 혼동하지 않는다.

## 화면 증거

최종 production 빌드의 실제 Chromium 전체 페이지 캡처6장이다. PC는1440×1000 viewport에서 fullPage로, 모바일은390px 폭에서 문서 높이까지 viewport를 늘려 촬영했다(고정 하단 탐색이 전체 페이지 캡처 중간을 덮지 않도록 한 촬영 설정). 실제 화면/터치 검사는 별도로1000px 높이와 기존844/950px 높이에서 수행한다. 시계는 `2026-10-27T01:00:00Z`로 고정했다. 기본 화면은 기존 로컬 가상계좌100,000 USD/관심종목0이다. 관심종목 화면은 AAPL/VOO와 테스트용 로컬 거래3건(가상 AAPL3주 매수/1주 매도·VOO2주 매수)을 복원한 **fixture**다. 계좌 자산과 손익은 기존 계산 결과이며 사용자 실제 자산이나 투자 성과가 아니다. 시장 지수/가격/일정도 기존 합성 예시다. 원본 지표 기준시각을 현재 시각으로 바꾸지 않았다. 대기 화면은 기존 #indices에서 모드를 바꾸고 홈으로 복귀해 촬영했다. 실제 운영 자료를 새로 취득하지 않았고 캡처 과정의 참고 API는 고정 실패 응답으로 대체했다.

| 화면 | PC1440px | 모바일390px |
| --- | --- | --- |
| 기본 계좌·빈 관심종목 | [보기](ux3-a-captures/1440-home-empty.png) | [보기](ux3-a-captures/390-home-empty.png) |
| 계좌·관심종목 fixture와 중요 일정 | [보기](ux3-a-captures/1440-home.png) | [보기](ux3-a-captures/390-home.png) |
| 공식 연동 대기·미제공 | [보기](ux3-a-captures/1440-home-pending.png) | [보기](ux3-a-captures/390-home-pending.png) |

5개 폭의 자동 검사는 전체8종목 관심 목록·비영 계좌 값으로도 가로 넘침/조작 겹침/JS 오류·금융 RPC0을 확인했다. 링크·버튼의44px 타깃과 실제 키보드/터치 이동, focus-visible·reduced-motion도 검사했다.

## 운영·후속 범위

Pages는 workflow_dispatch 전용이고 finance/market push는 과거 전용 브랜치 필터만 가진다. UX3-A는 push 대상이 아니며 workflow 파일을 수정/수동 실행하지 않는다. 개발 브랜치에만 `[skip ci]` 커밋·push한다. main 병합·Pages 배포·운영 Supabase DB/Auth/Cron·금융 migration004~007/RPC/RLS 변경은 금지 범위로 유지한다.

기준 SHA 대비 TradingUI·trading/accountStore/serverAccount/manualAccount·Auth/watchlist·금융/합성 data·기업/ETF 상세·HeaderIndicators/UiPanels/ManualUI·marketInfo/marketData/treasuryData·학습/ChartLab·배당/세금·supabase·.github 소스 변경은 없다. MarketPanels는 홈 투영/표시만 추가했으며 기존 서비스·자료 카드·캘린더·뉴스·배너 구현은 그대로다.

개발 결과 판정: **Ready · UX3-B 진행 가능**. 필수 UX3-A 기능의 미완료 차단 항목은 없다. 기존 개발 StrictMode 모달 제한·실기기/스크린리더 검증은 후속 보완 가능하며 운영 배포 승인과 구분한다. 학습 랜딩/경로 분리·전체 검색 A4-C2/A5·실제 시세/종가·운영 금융 전환은 이번 구현에 포함하지 않는다. UI 커밋 revert로 복구할 수 있고 데이터 마이그레이션은 필요 없다.
