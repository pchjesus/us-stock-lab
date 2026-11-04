# UX2-A · 기업·ETF 상세 화면 통합

기준 브랜치 `codex/ui-v0.8-ux1-b2`, SHA `ae1a5f285d45a85b6c6e5b12eeea15649b35c61e`. 시작 시 작업 트리가 깨끗하고 GitHub 기준 HEAD가 일치함을 확인한 뒤 기존 checkout에서 `codex/ui-v0.8-ux2-a`를 생성했다. 운영 main 기준은 `51474c2904856e1668bacb815c7fd58ed83e177b`이며 main 병합·Pages 배포·운영 변경은 하지 않는다.

## 화면과 정보 계약

실제 앱의 `#stock/{symbol}`에 UX0의 상세 정보 구조를 적용했다. 공통 진입점은 `StockDetail`, 기업은 `CompanyDetail`, ETF는 별도 `EtfDetail`로 구성한다. 기존 8종목만 대상으로 하며 기업 5개와 ETF 3개를 서로 다른 정보 구조로 표시한다.

| 화면 | 기업 AAPL/MSFT/NVDA/AMZN/GOOGL | ETF VOO/QQQ/SCHD |
| --- | --- | --- |
| 개요 · 기본 선택 | 기업명·심볼·거래소·소개, 핵심 사업·수익구조·사업부·위험, 검증된 매출·영업이익·순이익 3개와 공식 매출 그래프 | 상품명·운용사·추종 지수/전략·분류·공식 상품 링크와 기존 설명 |
| 차트·거래 | 기존 외부 차트, 현재 계좌, 합성 주문 또는 허용 환경의 수기 Workspace | 같은 기존 차트·주문 기능 |
| 재무 / 상품정보 | 기존 8개 핵심 지표·연간/단독분기·재무건전성·현금흐름·배당 접근 | 보유종목·자산/업종·보수·분배금의 미제공/미확인 안내 |
| 근거 / 출처 | 전체 공시 목록과 전체 재무 관측의 값·기간·단위·원문·산식·입력 근거 펼침 | 기존 공식 발행사 페이지와 자료 확인 기준, 최신 수치 확인일 미확인 명시 |

기업 개요의 숫자는 기존 `latestFinancialFact`·`financialValueText`를 사용한다. 읽기 쉬운 기존 백만 USD 표시와 함께 정확값 펼침, 기간·단위·출처를 제공한다. 재무 탭에서도 정확값을 유지한다. `FinancialGraph`와 `companyPresentation`의 연간/직접 보고 단독분기 선택·누락/0/음수·비연속 기간 처리를 재사용한다. 기간 선택은 개요/재무 사이에 유지되며 종목 변경/새로고침은 기본 연간·개요로 시작한다.

기존 **219개 관측(200개 원문 근거·19개 계산값)**을 근거 탭에서 모두 펼쳐 볼 수 있다. superseded 관측도 제거하지 않는다. 각 항목의 ID·검증 상태·정확값·단위·회계기간·제출/확인일·공식 URL, 원문 evidence의 모든 필드와 계산식/입력 ID·값·기간·URL을 보존한다. 공식 재무 숫자와 편집된 사업 요약을 구분한다. 긴 회계 정의와 원문 근거만 접으며 자산·부채·자본·현금흐름·배당도 접근 가능하다.

ETF는 기업 재무 컴포넌트를 사용하지 않는다. 기존 발행사 설명/URL을 재사용하고 최신 구성·보수·분배금 확인은 수행하지 않았음을 표시한다. 없는 값을 0·무배당으로 대체하지 않고 구성비나 원형/도넛 그래프를 생성하지 않는다. 신규 API·카탈로그·DB 작업은 없다.

## 조작·생명주기·접근성

- 실제 `tablist`/`tab`/`tabpanel`, `aria-selected`/`aria-controls`/`aria-labelledby`, roving tabindex를 사용한다. 좌우 방향키·Home·End로 선택과 초점이 함께 이동한다. 선택 배경/굵기, 44px 이상 타깃, focus-visible, 기존 reduced-motion을 유지한다. 탭 변경은 hash를 변경하거나 화면을 강제로 스크롤하지 않는다. 종목 변경 시 새 제목에 초점을 두고 상세 시작으로 이동하되 열린 dialog의 초점을 빼앗지 않는다.
- `#stock/{symbol}`, `#learn/{symbol}`과 시장 복귀를 유지한다. 시세·주문 이동 링크는 차트·거래를 활성화한 뒤 실제 `.detail-order`로 스크롤/초점을 이동한다.
- 거래 Workspace는 첫 차트·거래 선택 시에만 mount하고 이후 숨겨진 패널에 유지한다. 탭 왕복으로 주문 수량·검토 팝업·수기 입력을 초기화하거나 주문을 실행하지 않는다. 계좌/사용자/종목 변경 시 기존 key와 소유권 경계를 따른다. 계좌 선택·사용자별 선호·Auth·서버 저장/복원 로직은 바꾸지 않는다.
- `ExternalQuotes`는 기존 기본 동작을 유지하는 선택적 `active` prop만 추가한다. 다른 탭으로 이동하면 기존 effect cleanup으로 script/iframe을 정리하고 차트 활성화를 해제한다. 제공자 선택은 유지하고 돌아올 때 자동으로 위젯을 요청하지 않는다. 기존 TradingView·네이버·토스증권·별도 창/모바일 새 탭·팝업 차단 대체 링크를 보존한다.
- 합성 모의 가격·외부 참고 시세·사용자 수기 가격을 구분한다. `OrderPanel`·수기 금융 처리와 주문 안내는 그대로 사용한다. 운영 수기 false 게이트를 유지한다.
- Tour의 주문 단계는 `stock-detail-tab` 로컬 이벤트로 AAPL 거래 탭을 실제 활성화한 뒤 두 animation frame 후 `.detail-order`를 측정한다. 종료 시 기존 경로·스크롤·초점과 원래 상세 탭도 복원한다. 7단계 흐름·도움말·알림은 유지한다.

주요 위험은 탭 숨김에 따른 주문 상태 소실·위젯 잔존·Tour 대상 부재·근거 접근 누락이었다. 기존 금융 상태를 옮기지 않고 거래 subtree 유지, 외부 위젯만 명시적 cleanup, Tour 탭 연결, 전체 관측 ID/내용 검사로 대응했다. 표시 컴포넌트 분리 이상의 금융/공유 상태 리팩터링은 필요하지 않았다.

## 이번 단계에서 실행한 검증

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true VITE_ENABLE_MANUAL_TRADING=false npm run build
npm test -- --workers=2
npm run test:auth -- --workers=2
NODE_ENV=production npx playwright test --config playwright.company-dev.config.ts --workers=2
npx playwright test --config playwright.release.config.ts --grep 'release defaults' --workers=1
git diff --check
```

| 검증 | 결과 |
| --- | --- |
| 변경 전 영향 기준선 | 10/10 PASS · 기준 B2 코드에서 실행 |
| 기업·계좌·신규 상세 영향 재검증 | 30/30 PASS |
| 기업 감사·외부 차트·도움말 영향 검사 | 28/28 PASS |
| 조작·자료 카드·학습·시장 시각·5기업 재무·Tour·상세 통합 영향 검사 | 92/92 PASS |
| 신규 상세 검사 | 14/14 PASS · 아래 7개 시나리오를 desktop/mobile에서 실행. 위 통합 및 최종 전체 회귀에 포함되며 별도 합산하지 않음 |
| 마지막 개요/키보드/5해상도 검사 | 6/6 PASS |
| 공식 그래프 개발 fixture | 2/2 PASS · 실제 0/음수·단독분기/YTD 배제 검사 |
| 인증·수기·배당·세금 fixture | 42/42 PASS · 수기 주문 검토/입력의 탭 왕복 보존 포함 |
| production 수기 false 게이트 | 1/1 PASS · 복원 로그인과 저장 수기 선호 보존, 네 탭 왕복 후 수기/배당/세금 RPC 0건 |
| 최종 TypeScript/Vite build | PASS · 정상화 후 최종 실행 1회 |
| 최종 전체 앱 UI 회귀 | 262/262 PASS · 실제 최종 Vite 산출물, 전체 실행 1회 |
| diff 공백 검사 | PASS |
| 금융 PostgreSQL/SQL | 이번 단계 NOT VERIFIED(별도 미실행). 금융·SQL 원본 불변으로 B2/G1의 기존 DB 검증 근거 재사용. 새 PASS로 계산하지 않음 |
| 실기기·스크린리더/WCAG 전체·운영 Auth·실시간 외부 위젯 가용성 | NOT VERIFIED · Chromium과 인증/요청 fixture 검증으로 범위 제한 |

신규 `stock-detail.spec.ts`의 7개 시나리오:

1. 5기업·3ETF 진입, 전용 화면/기본 탭·제목 초점·최근 실적 3개 대조.
2. 실제 키보드 탭 탐색·선택/패널 연결·공유 분기 선택·새로고침/종목 변경 기본 상태.
3. 전체 219개 관측 ID/값/단위/기간/URL, 200개 보고/19개 계산, 전체 입력/원문 필드 보존.
4. 세 ETF의 동일한 전용 구조, 네 미확인 항목·허위 0/구성 그래프 부재·공식 링크/거래/학습.
5. 주문 검토/수량의 탭 왕복 보존·원장 불변, 외부 script 정리·제공자 보존·복귀 시 자동 요청 없음.
6. 주문 이동 링크와 실제 7단계 Tour, 주문 Spotlight 측정·원래 재무 탭/초점 복귀·계좌 쓰기 없음.
7. 8종목×4패널×1440/1200/768/390/320px를 desktop/touch 양쪽에서 검사. 가로 넘침·탭 겹침·JS 오류/RPC 없음, 44px·키보드 포커스·reduced-motion 확인.

기존 테스트는 삭제하거나 건너뛰지 않았다. 재무/주문/근거가 새 탭으로 이동한 테스트는 `detail-navigation.ts`의 실제 탭 클릭으로 동등한 사용자 경로를 검사한다. 첫 영향 실행은 38 PASS/6 FAIL(ETF region 의미와 새로고침 후 주문 탭 경로), 첫 인증 실행은 38 PASS/4 FAIL(새로고침 후 주문 탭 경로)이었다. region 의미를 명시하고 실제 탭 진입을 보강한 후 해당 검사와 전체 회귀를 통과했다. 기능 제거·기대값 완화로 해결하지 않았다.

영향 UI 검사는 production React 동작으로, 최종 전체 회귀와 false 게이트는 실제 production 산출물로 검사했다. B2에서 알려진 개발 StrictMode의 기존 Modal 초점 복귀 제한은 남아 있다. 공통 Modal은 수정하지 않았고 production 도움말/Tour 초점 경로는 이번에 재검증했다. 최종 production 미해결 FAIL은 0건이다. 기존 auth 정적/동적 import 및 500KB 초과 chunk Vite 경고는 유지한다.

## 화면 증거

최종 production 산출물의 Chromium 캡처 12장이다. PC 1440×1000, 모바일 390×1000에서 상세 시작 또는 해당 근거/주문 영역을 촬영했다. 시계는 `2026-11-03T00:00:00Z`로 고정했고 재무값은 기존 검증 자료, 가격은 기존 로컬 합성 값이다. 최신 공시/실시간 시세를 새로 수집한 증거가 아니다. 외부 차트는 기본 비활성 상태로 촬영했다.

| 화면 | PC 1440px | 모바일 390px |
| --- | --- | --- |
| AAPL 개요 | [보기](ux2-a-captures/1440-AAPL-overview.png) | [보기](ux2-a-captures/390-AAPL-overview.png) |
| AAPL 재무 | [보기](ux2-a-captures/1440-AAPL-financials.png) | [보기](ux2-a-captures/390-AAPL-financials.png) |
| AAPL 근거·FCF 산식/입력 펼침 | [보기](ux2-a-captures/1440-AAPL-evidence.png) | [보기](ux2-a-captures/390-AAPL-evidence.png) |
| AAPL 차트·거래/주문 | [보기](ux2-a-captures/1440-AAPL-trade.png) | [보기](ux2-a-captures/390-AAPL-trade.png) |
| VOO 전용 개요 | [보기](ux2-a-captures/1440-VOO-overview.png) | [보기](ux2-a-captures/390-VOO-overview.png) |
| VOO 상품정보 미제공 | [보기](ux2-a-captures/1440-VOO-product.png) | [보기](ux2-a-captures/390-VOO-product.png) |

## 보존·운영·후속 판단

기준 SHA 대비 `accountStore`/`trading`/`serverAccount`/`manualAccount`/`auth`·배당/세금·합성 data·companyProfiles/companyData/companyFinancials/companyPresentation·marketData/treasuryData/marketInfo·헤더 지표·학습/ChartLab·supabase·.github 원본은 변경하지 않았다. 주문·원장·체결/합성 가격·수수료/세금/배당·금융 RPC/RLS/SQL·migration004~007과 운영 설정 변경은 없다. UI 생명주기 및 Tour 연결만 해당 컴포넌트에서 제한적으로 변경했다.

Pages는 `workflow_dispatch` 전용이고 finance/market push는 과거 전용 브랜치 필터에 한정된다. UX2-A는 대상이 아니며 schedule 등록도 없다. 개발 브랜치에만 `[skip ci]` 커밋·push하고 워크플로를 수동 실행하지 않는다. main 병합·배포·운영 DB/Auth/Cron 변경 없음. 롤백은 UI 커밋 revert로 가능하며 데이터 마이그레이션은 필요 없다.

개발 결과 검토 및 UX2-B 후속 진행 가능. 필수 UX2-A 기능의 미완료 차단 항목은 없다. UX2-B에서 기존 개발 StrictMode Modal 생명주기와 실기기/스크린리더 검증을 보완할 수 있다. ETF 최신 수치 검증·홈/학습 UX3·A4 검색·실제 종가·운영 금융 전환은 각 별도 범위이며 이 결과는 배포 승인이 아니다.
