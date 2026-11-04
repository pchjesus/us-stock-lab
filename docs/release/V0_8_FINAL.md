# v0.8 최종 통합 검증·배포 기록

## 통합 기준과 범위

- 승인된 개발 기준: `codex/catalog-a5-a-readonly-discovery` / `d8b8ba1e69599124a076721b68e2c64232c1cc6e`.
- 변경 전 main: `51474c2904856e1668bacb815c7fd58ed83e177b`. 시작 시 원격 두 HEAD·부모·깨끗한 기존 checkout을 확인했다. main은 개발 HEAD의 조상이며 차이는10커밋/151파일이다.
- UX0 레퍼런스, UX1 공통 컨트롤/도움말, UX2 기업5종·ETF3종4탭, UX3 홈/학습 분리, A4 정규화/수집기/스냅샷 로더, A5-A 개인 로컬 후보 탐색을 모두 포함한다. 새 금융/시장 기능을 추가하지 않았다.
- 이번 정리는 README의 오래된 후보/A4·A5 미구현 설명을 수정하고 패키지/lock 버전을 `0.8.0`으로 일치시켰다. 사이드바의 `UI 후보`는 `모의투자`로 변경했다. 기존 릴리스/UX 문서는 역사 기록으로 보존한다.

## 사전 안전 감사

main 대비 `supabase/`, `.github/workflows/`, 합성 가격/8종목·trading·accountStore·serverAccount·manualAccount·chartIndicators·companyPresentation·Auth·watchlist·storage·preferences·taxStore 원본은 불변이다. TradingUI/ManualUI 변경은 표시·클래스·계좌 선택 위치·외부 차트 활성/cleanup 계약이며 기존 계산/체결·계좌 상태 소유권은 유지한다. 기업 원자료의219관측/200원문/19계산은 전체 회귀로 검사했다.

- 실제 거래·증권계좌 연결·자금이동 없음. 모의 주문은 기존8종목만 사용하며 신규 후보는 읽기 전용이다. 임의 `tradeEligible=true`, 동일 심볼/다른 CIK·거래소 주입을 거부/분리한다. 후보에 가격/수익률/주문/관심 편입/금융 상세 연결이 없다.
- Pages 수기 false 게이트에서 저장 선호는 보존하고 수기/배당/세금/신규 주문 RPC0을 검사했다. 기존 paper_snapshot 조회만 허용한다. 인증 fixture에서는 후보 탐색으로 추가 금융 RPC0, 계좌·관심종목·로컬 원장 원본 보존을 확인했다.
- Supabase 스킬을 적용한 **읽기 전용 list_migrations** 조회에서 foundation `20261026135037`, `202610270001`, `202610270002`, `202610270003`을 확인했다. 금융004~007은 없다. 이번 작업은 운영 DB 쓰기·migration·RLS/RPC·Auth 제공자/SMTP·Cron 변경/실행을 하지 않는다. 운영 Auth 로그인/메일과 실제 주문은 검증하지 않는다.
- 합성 주문/학습 가격과 실제 외부 참고 시세·공식 재무자료는 분리한다. 기간/단위/기준시각/원문을 보존하며 미제공 값을 보간하지 않는다. ETF 미확인 구성비/보수/분배금 및 실제 SEC 전체 카탈로그를 만들어내지 않는다.
- 실제 SEC 수집은 NOT VERIFIED. A4/A5 테스트는 고정 mock/fixture다. 개인 import는 세션 메모리에서만 읽으며 파일을 업로드/자동 저장/자동 수집하지 않는다. 해시는 출처 진위·상장 유효성·이용 권한의 인증이 아니다.
- tracked text와 dist의 GitHub/AWS/Supabase 관리 secret·service_role JWT·private key 패턴 발견0. 이메일 모양22건은 예약된 테스트 주소·mock fetch·보안 거부 fixture로 검토했다. 담당자 환경변수/비밀정보를 출력하거나 저장하지 않았다. publishable key와 URL은 의도된 공개 클라이언트 설정이다. 모든 비밀정보 유형을 포괄하는 외부 보안감사로 주장하지 않는다.
- Git에 원본 스냅샷/개인 import 파일0. dist는 index.html 및 JS2/CSS1이며 fixture 후보·개인 import·수집 담당자 주소가 포함되지 않는다.
- 기존 Deploy Pages는 **workflow_dispatch / Node24 / 수기 false / 시장 FX·Treasury true**이며 DB/Auth/Cron 단계가 없다. finance/market workflow는 과거 전용 브랜치 push만 대상으로 main/이번 개발 브랜치를 트리거하지 않는다. workflow 원본은 수정하지 않는다.

## 이번 통합에서 새로 실행한 검증

이전 개발 단계의 PASS를 아래 건수에 더하지 않는다. 환경은 Node24.19/npm11, Chromium154/Linux이며 모바일은 에뮬레이션이다.

| 검사 | 이번 결과 |
| --- | --- |
| Pages 동일 환경 TypeScript/Vite build | **PASS** · 수기 false, 공개 Supabase 설정·FX/Treasury true |
| 전체 PC/모바일 앱 | **318/318 PASS** · A4 오프라인 수집/정규화·A5 export/import/1만 후보·거래 차단·8종목/주문·기업/ETF·219관측/200근거/19계산·홈/시장/학습/차트·도움말/Tour 포함 |
| 인증·계좌 격리·서버/로컬·수기/배당/세금 fixture | **52/52 PASS** · 운영 Auth/DB와 분리된 mock |
| release false 게이트·전체 화면 matrix | **6/6 PASS** · 1440/1200/768/390/320px, 각13화면+지표 모달 |
| 별도 시장/재무 fixture | **4/4 PASS** · 로딩/실패/재조회·오래된/미제공 값, 연간/단독분기·0/음수/누적 제외 |
| UX0 독립 레퍼런스 | **3/3 PASS** · 1440/768/390px |
| diff·금융/DB/workflow 원본 비교·의존성/비밀 패턴·배포 포함 검사 | **PASS** |
| 실제 SEC 수집·전체 현재 상장 카탈로그 | **NOT VERIFIED** · 자료 없음, 실제 SEC 요청 미실행 |
| 운영 Auth/실제 이메일·운영 주문/금융 쓰기 | **NOT VERIFIED** · 금지/미실행 |
| 실기기·스크린리더/WCAG 전체 | **NOT VERIFIED** |
| PostgreSQL 무거운 검증 | **NOT VERIFIED** · 금융/DB 소스 불변으로 선행 근거 재사용, 이번 신규 실행 아님 |

총383건은 서로 다른 이번 실행 그룹의 건수이며 반복한 검사나 과거 PASS를 합산하지 않았다. 필수 미해결 FAIL0. 전 폭에서 기존/신규 테스트의 가로 넘침·키보드·터치·44px·focus-visible·reduced-motion·JS 오류/외부 API 실패/대체 링크 검증을 유지했다. 기존 테스트 삭제/skip/기대값 완화는 없다.

```sh
VITE_ENABLE_MANUAL_TRADING=false VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true npm run build
npm test -- --workers=2
npm run test:auth -- --workers=2
npx playwright test --config playwright.release.config.ts --workers=1
npm run test:ux0 -- --workers=2
git diff --check
```

빌드는 pages.yml의 공개 URL/publishable key까지 동일하게 명시해 실행했다. 별도 fixture4건은 기존 company-fixture/home-fixture를 로컬 개발 서버용 work/v08-final/playwright.fixtures.config.ts로 실행했다. Git 제외 `work/v08-final/`에 build/ui/auth/release/fixtures/ux0 로그, 보안 감사와 배포 근거를 보관한다. UX0 테스트가 다시 쓴 기존 캡처1장은 최초 HEAD 내용으로 복원해 역사적 캡처를 변경하지 않았다.

기존 Vite auth 정적/동적 import 및 큰 chunk 경고는 남아 있다. 이번 변경은 종속성 업그레이드/공통 Modal 리팩터링을 하지 않았다. 개발 StrictMode의 기존 모달 초점 제한은 역사 문서를 참조하며 production 회귀 결과와 혼동하지 않는다.

## main 반영·Pages 배포 상태

최초 준비 커밋에는 병합/배포를 미실행으로 기록했고, 아래는 실제 실행 후 확인한 결과다.

- 개발 통합 커밋: `59e1367c5cdf8047d4577622587439a07802a7ef`(기존d8b8ba1 + 최종 메타데이터/문서). 개발 브랜치에 커밋/push 후 원격 HEAD를 재확인했다.
- [PR #3](https://github.com/pchjesus/us-stock-lab/pull/3)을 정상 merge했다. 앱 통합 main: **`4a1e9f7c74254ea58b6fb61d6f90f1277f4791fa`**. 부모는 기존main51474c2와 검증개발59e1367이며, GitHub compare에서 검증개발 대비 변경파일0/behind0을 확인했다. force push/hard reset/이력 삭제 없음.
- 기존 **Deploy Pages** workflow ID **396830197** / `.github/workflows/pages.yml`, main ref의 위 통합 SHA를 `workflow_dispatch`로 실행했다. 연결 도구에는 dispatch 기능이 없어 인증된 GitHub CLI로 기존 workflow만 실행했다.
- run **[41807180809](https://github.com/pchjesus/us-stock-lab/actions/runs/41807180809)**, 2026-11-04T09:24:07Z 시작/09:24:39Z 완료, **success**. job126497011834에서 npm ci·npm run build·Pages artifact·Deploy 단계가 모두 success다. DB/Auth/Cron 단계는 없다. 자동 CI가 로컬383건을 실행한 것으로 표시하지 않는다.
- 배포 URL: **https://pchjesus.github.io/us-stock-lab/**. Pages 설정은 workflow/HTTPS enforced이며 실제 URL200을 확인했다. 아래4개 파일은 운영 응답200 및 로컬 검증 산출물과 SHA-256/바이트 일치를 확인했다.

| 실제 배포 파일 | SHA-256 |
| --- | --- |
| index.html | `9b8e3992d82c3824776983c653a52ff8538c04c3a31aec68d718d07fab4da097` |
| assets/index-CLeqFcvG.js | `91892090b6f4273594f4e2c489521cb83acbe178720ef457197348c24e9dfd46` |
| assets/AuthPanel-DgB3x1rM.js | `54501df397a312eff9ee22f776608139c6487c3b6ceaf86f3b59784c111b208d` |
| assets/index-xkRb6o46.css | `dfc17b7515ebb73bfa40ec42fcbeee0425cdd9bb587e67cabbf0d0a254912c0c` |

### 실제 운영 smoke

**81/81 체크 PASS** · 1440/1200/768/390/320px의 새 익명 브라우저 컨텍스트. 홈4영역/초기로컬계좌·3지수, 시장8종목/AAPL검색·후보미가져옴, AAPL기업/VOO ETF의4탭·키보드End/선택초점·학습링크, 학습랜딩/10수업/펼침·차트MSFT선택/새로고침, 포트폴리오/설정·로그인입력UI·수기선택disabled/사유를 확인했다. PC의 실제7단계Tour 종료 후 홈/초점 복귀도 확인했다. 매 단계 가로 넘침0, JS 오류0. 정상 UI 탐색에서 금융/인증 쓰기 요청0(안전 차단기에 걸린 요청도0)이며 실제 주문·로그인 링크 발송·운영 데이터 변경을 하지 않았다. 실제 Supabase Auth 로그인/메일·공식 환율/재무부 API의 실응답은 이 smoke의 검증 범위가 아니다. 외부 실패/대체 UI는 위 로컬 fixture 회귀로 검증했다.

TLS 검증은 비활성화하지 않았다. 관리환경 프록시CA를 브라우저 NSS에 준비하고 브라우저와 같은 명령 환경에서 실행해 검증했다. 최초 CA 오류는 환경 준비 문제였으며 운영 소스/사이트 인증서 설정을 바꾸지 않았다.

실제 사이트 캡처(합성 예시/빈 로컬 계좌, 실제 SEC 후보 없음): [1440 홈](v08-final-captures/1440-live-home.png) · [390 홈](v08-final-captures/390-live-home.png) · [1440 후보 없음](v08-final-captures/1440-live-catalog-empty.png) · [390 후보 없음](v08-final-captures/390-live-catalog-empty.png). 모바일은390px 폭의 전체 내용 캡처를 위해 세로 영역만 늘렸으며 실제5폭 smoke는1000px 높이에서 실행했다.

배포 결과/캡처/인수인계 마감은 **문서 전용 후속 커밋**으로 main에 반영한다. 이 문서의 위 SHA는 실제 앱 통합/배포/검증 기준이다. 후속 문서 커밋의 main HEAD와 Pages SHA가 달라도 앱 소스·lock·workflow·dist가 같은지 별도 compare로 확인하며 불필요하게 재배포하지 않는다. 최신 원격 main은 다음 작업 시작 시 반드시 다시 조회한다. 인수인계는 [US_STOCK_LAB_V08_TO_V09.md](../handoff/US_STOCK_LAB_V08_TO_V09.md)를 참조한다.

## 롤백 기준

이번 배포 직전 마지막 성공 Pages는 run [41562090798](https://github.com/pchjesus/us-stock-lab/actions/runs/41562090798), main SHA `51474c2904856e1668bacb815c7fd58ed83e177b`이다. 이전 성공 run의 SHA·산출물과 현재 사이트를 먼저 비교한다. 중대한 계좌/주문/false-gate 회귀·비밀 노출·주요 화면 불능이면 운영 DB를 변경하거나 임의 복구하지 않고 그 대상을 보고한다. 승인된 복구는 이 성공 run의 해당 커밋을 다시 배포하거나 정상 revert PR로 이전 앱 코드를 복원한 뒤 검증된 main을 배포한다. force push/hard reset/이력 삭제는 하지 않는다. 현재 main ref로 새 workflow를 실행하는 것은 이전 버전 롤백과 다르다.

## v0.9 방향

- 실제 SEC 수집과 이용 조건·최신성·식별자/상장 상태 검증을 선행하고 A5-B의 개인 로컬 탐색 UX/성능을 보완한다. 미검증 대량 카탈로그를 공개 번들에 자동 통합하지 않는다.
- 실제 전일 종가/참고 시세 작업은 합성 주문/원장과 별도 계약으로 설계·검증한다. 임의 실제 거래 종목 확대는 금지한다.
- 접근성 실기기/스크린리더·운영 Auth/메일 및 큰 번들 개선은 영향 경계를 정해 후속 검증한다.
- 금융 G1-C3 및004~007 운영 전환·수기 활성화는 별도 사용자 승인·DB/금융 검증 전까지 NO-GO를 유지한다.
