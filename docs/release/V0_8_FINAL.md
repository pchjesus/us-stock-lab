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

**이 문서의 최초 커밋 시점: 로컬 통합 검증 PASS, main 반영/이번 Pages 배포는 아직 미실행.** 성공을 미리 기록하지 않는다. 승인된 순서는 개발 브랜치 커밋/push → 원격 HEAD 재확인 → PR/main 병합 → main 포함 확인 → 기존 Deploy Pages를 main ref로 수동 실행 → 완료/실제 사이트/정적 자산 확인이다. 실행 후 실제 SHA·PR·run ID/URL·결과를 이 절에 추가한다. 로컬 PASS는 GitHub CI PASS로 표시하지 않는다.

## 롤백 기준

이번 배포 직전 마지막 성공 Pages는 run [41562090798](https://github.com/pchjesus/us-stock-lab/actions/runs/41562090798), main SHA `51474c2904856e1668bacb815c7fd58ed83e177b`이다. 이전 성공 run의 SHA·산출물과 현재 사이트를 먼저 비교한다. 중대한 계좌/주문/false-gate 회귀·비밀 노출·주요 화면 불능이면 운영 DB를 변경하거나 임의 복구하지 않고 그 대상을 보고한다. 승인된 복구는 이 성공 run의 해당 커밋을 다시 배포하거나 정상 revert PR로 이전 앱 코드를 복원한 뒤 검증된 main을 배포한다. force push/hard reset/이력 삭제는 하지 않는다. 현재 main ref로 새 workflow를 실행하는 것은 이전 버전 롤백과 다르다.

## v0.9 방향

- 실제 SEC 수집과 이용 조건·최신성·식별자/상장 상태 검증을 선행하고 A5-B의 개인 로컬 탐색 UX/성능을 보완한다. 미검증 대량 카탈로그를 공개 번들에 자동 통합하지 않는다.
- 실제 전일 종가/참고 시세 작업은 합성 주문/원장과 별도 계약으로 설계·검증한다. 임의 실제 거래 종목 확대는 금지한다.
- 접근성 실기기/스크린리더·운영 Auth/메일 및 큰 번들 개선은 영향 경계를 정해 후속 검증한다.
- 금융 G1-C3 및004~007 운영 전환·수기 활성화는 별도 사용자 승인·DB/금융 검증 전까지 NO-GO를 유지한다.
