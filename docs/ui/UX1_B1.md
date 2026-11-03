# UX1-B1 · 핵심 조작 UI

기준 브랜치 `codex/ui-v0.8-ux1-a`, 기준 SHA `3e5fad8e469c492edc3f5ef573156097abf2be19`. GitHub 원격 HEAD 일치 확인 후 기존 checkout에서 `codex/ui-v0.8-ux1-b1` 생성. main 병합·Pages 배포·운영 변경은 포함하지 않는다.

## 구현

- 전역 상단 계좌 모드 패널을 포트폴리오 제목 바로 아래와 설정으로 옮겼다. `Workspace`의 기존 `manualOwner`, 사용자별 `manual.mode.{uid}` 선호, 로그인/계좌 소유권, 수기 활성화 조건 및 오류 메시지를 유지한다. 표시 컴포넌트는 별도 계좌 상태나 저장소를 만들지 않는다.
- 종목 주문 영역 첫 카드에 현재 계좌 유형과 브라우저 로컬/사용자 서버를 표시한다. 수기 계좌는 별도 모의계좌임을 표시하고 포트폴리오·설정으로 이동하는 링크를 제공한다. 홈의 기존 계좌 요약과 수기 Workspace도 보존한다.
- `VITE_ENABLE_MANUAL_TRADING=false`이면 수기 option은 disabled이며 선택 불가 사유를 select 설명과 연결한다. 저장된 수기 선호는 지우지 않는다. true 환경에서도 비로그인 수기 선택은 계속 disabled다.
- 차트 실습실 제목·설명과 학습 종목 select를 같은 그룹으로 정렬한다. native select에 기존 8종목의 이름·심볼을 함께 표시하고 너비/44px 높이/포커스를 보강했다. 기존 `#learn/{symbol}`, 종목별 합성 데이터 갱신, 기간 저장·복원 계약을 유지한다. 신규 카탈로그 후보는 연결하지 않는다.
- 차트 기간(1분~월), 학습 난이도, 차트 모양에 보이는 그룹 라벨과 접근성 이름을 제공한다. 이동평균·RSI도 관련 선택끼리 묶고, 지지·저항 후보 입력과 봉 슬라이더를 정렬했다. 기존 난이도별 표시 조건과 다시 고급으로 전환했을 때의 선택 유지 동작을 보존한다.
- `aria-pressed` 선택은 중립 배경·테두리·굵은 글자로 구분한다. 관심종목 선택·해제도 같은 규칙이다. 주문 검토/체결 확정은 브랜드 파란색, 계좌 초기화/확정은 위험색, 일반/취소/분석 버튼은 중립색이다. disabled는 회색이며 기존 제한 설명과 확인 문구를 유지한다.
- 핵심 화면 이동 링크에는 밑줄·방향 표시·44px 타깃을 적용한다. 기존 외부 차트·공식 출처의 링크와 새 창 표시를 유지하고 설정의 라이브러리 링크에 공식 사이트/외부 이동 표시를 보강했다. 외부 자료 카드·출처/재조회 버튼 전체 정리는 B2에 남긴다.
- 작은 화면에서는 그룹과 확인 버튼을 줄바꿈한다. 키보드 Tab/Enter/Space·native select 방향키·3px focus-visible·reduced-motion을 유지한다.

## 위험과 보존

주요 위험은 계좌 UI 이동 중 상태 소유자 변경, 저장 선호 유실, 사용자 A의 수기 상태가 B에게 노출되는 문제, disabled보다 primary/danger 스타일이 우선하는 문제, 좁은 화면의 조작 겹침이다. 기존 상태/키/게이트를 그대로 두고 순수 표시 컴포넌트만 분리했으며, 사용자 전환·재시작·원장/초안 복원·버튼 색/높이·레이아웃을 실제 Chromium으로 검사한다.

금융 주문·원장·합성 가격·수수료/세금/배당 계산, 인증 구현, 서버 저장/복원, 기존 8종목, SQL/RPC/RLS/migration, 운영 설정과 기업 재무 원본은 변경하지 않았다. 관련 소스와 `.github`, `supabase`의 기준 SHA 대비 diff가 없다. 이번 검증에서 리팩터링이 필요한 반복 결함 근거는 없으며 대규모 구조 변경은 보류한다. 재검토 계기는 계좌 상태 소유권 변경 또는 동일 경계의 반복 회귀다.

## 검증

최종 빌드 옵션은 기존 CI와 같은 참고환율/재무부 true, 수기 false다.

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true VITE_ENABLE_MANUAL_TRADING=false npm run build
npm test -- --workers=2
npm run test:auth -- --workers=2
npx playwright test --config playwright.release.config.ts --workers=1
```

| 항목 | 결과·근거 |
| --- | --- |
| 변경 전 기준선 | build PASS, 관련 차트·도움말·paper·UI 36/36 PASS |
| 변경 후 영향 검사 | 차트·도움말·paper·신규 조작 UI 34/34 PASS |
| 최종 TypeScript/Vite | PASS |
| 최종 전체 앱 UI 회귀 | 232/232 PASS (최종 전체 실행 1회; 앞선 실패 원인 수정 후 재실행) |
| 모의 인증·수기·배당·세금 | 40/40 PASS. 새 경로로 계좌 선택 후 기존 검증을 유지하고 사용자별 기본 선호/수기 초안 복원 검사를 추가 |
| false 게이트와 저장 수기 선호 | 1/1 PASS. 복원된 로그인 세션에서도 합성 계좌, 수기 disabled, 수기·배당·세금 RPC 0건, 저장 수기 선호 보존 |
| 5해상도 전체 화면 | 5/5 PASS. 1440/1200/768/390/320px, 홈·시장·8종목·포트폴리오·학습·설정 및 지표 모달에서 넘침/페이지 예외 없음 |
| 신규 조작 검사 | PC/터치 프로젝트 각각 1440/1200/768/390/320px: 홈·시장·기업/ETF 주문·포트폴리오·학습·설정의 가로 넘침 없음, 핵심 조작 44px 이상·상호 겹침 없음. native 8종목 이름·심볼, 방향키/hash, Enter/Space 선택·focus ring, 기간/관심종목 재시작 복원, primary/neutral/danger/disabled 구분 |
| 기존 기능 | 전체 회귀로 주문·원장·가격/지표 수치·학습·hash/새로고침·관심종목·도움말·알림·지표 타이머 확인. 인증 fixture에서 주문 중복/실패/복구·사용자 격리·수기/배당/세금 UI 보존 |
| PostgreSQL/SQL | 이번 단계 미실행. 금융·DB 원본 불변으로 UX1-A/G1의 기존 근거 재사용 |
| 운영 인증·실제 모바일·스크린리더/WCAG 전체 | NOT VERIFIED. 브라우저 터치 에뮬레이션과 fixture 검증이며 실제 운영 주문/사용자 생성 없음 |

최초 네트워크 미허용 셸에서는 Git 프록시 연결 및 preview 시작이 실패했고, 실행 환경의 지원되는 네트워크 권한을 사용한 뒤 정상 진행했다. 초기 JSX 이동의 닫는 괄호 오류는 TypeScript가 검출해 수정했다. 캡처 검토 후 모바일 후보 입력 라벨 정렬을 보강하고 최종 빌드/전체 UI로 재검증했다. 기존 Vite의 auth 정적/동적 import 및 500kB chunk 경고는 기준선에도 있으며 이번 범위에서는 변경하지 않았다. 첫 전체 실행의 3종×PC/모바일 6건 실패는 외부 환율/재무부 실패 시 복수 alert에 대한 선택자, popup 첫 요청의 page.route 범위, 라이브 환율 응답 의존에서 발생했다. 관심종목 alert 지정·popup context mock·고정 시각 환율 fixture로 검증을 보강했다. 실패 파일 20/20 재검증 및 최종 전체 232/232 PASS, 기능/테스트 삭제 없음. 미해결 FAIL: 0건.

## 대표 캡처

실제 로컬 Chromium 앱. PC 1440px와 터치 모바일 390px의 뷰포트 캡처다. 합성 데이터·가상계좌이며 시계는 캡처 실행 시각이다. 전체 내용은 스크롤로 접근하며 기존 금융/학습 기능을 캡처에 맞춰 제거하지 않았다.

| 화면 | PC | 모바일 |
| --- | --- | --- |
| 포트폴리오·계좌 유형 | [1440px](ux1-b1-captures/1440-portfolio.png) | [390px](ux1-b1-captures/390-portfolio.png) |
| 차트 종목·기간·난이도 | [1440px](ux1-b1-captures/1440-learn.png) | [390px](ux1-b1-captures/390-learn.png) |
| 현재 주문 계좌·주문 | [1440px](ux1-b1-captures/1440-order.png) | [390px](ux1-b1-captures/390-order.png) |

## 운영·후속 판정

GitHub 최신 워크플로에서 Pages는 `workflow_dispatch`뿐이고 finance/market 검증 push는 각 과거 전용 브랜치만 대상으로 한다. B1 push 대상 workflow나 schedule/Cron 트리거가 없다. workflow 파일 변경·수동 dispatch·Cron 등록 없이 개발 브랜치에 `[skip ci]` 커밋으로만 push한다.

B1 개발 결과 검토 판정: Ready (개발 브랜치 결과 검토 및 UX1-B2 진행). B2의 외부 자료 카드·출처/재조회 버튼 정리를 이어갈 수 있다. UX2 기업 4탭, UX3 홈/학습 정보 구조, A4/A5 전체 검색, v0.9-D 실제 전일 종가와 G1-C3 금융 운영 전환은 범위 밖이다. 운영 출시 승인을 의미하지 않으며 main/Pages/DB/Auth/Cron 변경 없음. 되돌리기는 개발 브랜치의 B1 UI 커밋 revert로 가능하며 데이터 마이그레이션은 필요 없다.
