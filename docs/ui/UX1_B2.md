# UX1-B2 · 자료 카드·버튼·링크

기준 `codex/ui-v0.8-ux1-b1` / `5a09ddf39d93a7c3c12dece0595517f83b849dfb`. GitHub 최신 HEAD 일치 확인 후 기존 checkout에서 `codex/ui-v0.8-ux1-b2`를 생성했다. main 병합·Pages 배포·Supabase 운영 변경은 하지 않는다.

## 구현

- 실제 USD/KRW 참고환율과 미국 재무부 통계에 같은 카드 구조를 적용했다. 제목/상태/기준일과 중립색 재조회 버튼을 상단에, 핵심 수치·관측/기준일·조회시각을 본문에, 설명·자료 제공자와 공식 출처를 하단에 배치한다. 모바일에서는 자연스럽게 줄바꿈한다.
- 환율은 기존 1 USD = KRW 표기와 소수 최대 4자리, 재무부 총부채는 기존 조 달러/소수 2자리, 평균 조달금리는 기존 항목명과 %/소수 2자리로 유지한다. 원본 날짜·조회시각의 KST 포맷, 제공자와 URL도 유지한다. 환율을 실시간 환전가격으로, 평균 조달금리를 시장 10년물 국채수익률로 해석하지 않도록 기존 설명을 보존한다.
- 정상 수신/조회 중/조회 실패/미제공을 텍스트와 배경으로 구분한다. 재조회는 ↻와 접근성 이름, 44px 타깃, 조회 중 회색 disabled와 이유를 제공한다. 신규 애니메이션은 추가하지 않는다.
- 지표 추이와 일정 상세는 실제 버튼 형태/팝업 안내로 구분한다. 공식 일정·뉴스 원문·공식 사이트·기업 SEC 원문·ETF 발행사 링크는 밑줄/외부 이동 표시·새 탭 안내와 44px 타깃을 적용한다. 기업 수치·섹션·그래프 및 ETF 구조는 변경하지 않는다.
- 외부 차트 제공자 선택 라벨과 보조 버튼·링크·새 탭 안내를 정렬하고 차트 열기 선택 상태를 aria-pressed로 표시한다. 기존 별도 창/팝업 차단 대체 경로, 위젯 생성/정리, 8종목 제공자 URL은 유지한다. 화면 내부 탐색 경로도 유지한다.

## 재조회 표시 정책과 요청 보존

| 상황 | 표시 | 요청·실패 계약 |
| --- | --- | --- |
| 첫 조회 | 조회 중, 수치 없음 | 기존 endpoint와 parser로 조회 |
| 성공 후 재조회 | 이전 성공 수치/기준일/조회시각 유지, ‘이전 조회 자료 · 재조회 중’ | 완료 전 중복 클릭 차단, 자동 재시도 없음 |
| 재조회 성공 | 응답의 수치와 기준일/조회시각으로 교체 | 새 자료를 받아야 갱신 완료 표시 |
| 조회 실패 | 수치 제거, 기존 오류 메시지와 다시 조회 안내 | 기존 실패 시 null 처리 보존. 실패한 값을 성공 자료로 남기지 않음 |
| 오래된 환율 응답 | 미제공과 원본 관측일, 현재 환율 수치 없음 | 기존 parser의 unavailable 판정 유지, 0으로 대체하지 않음 |
| 설정 비활성 | 연동 준비 중, 회색 버튼과 연결 준비 사유 | 요청 0건, 공식 사이트 링크는 이용 가능 |

기존 두 fetch 함수, endpoint 검증/feature flag, parser·타임아웃, effect cleanup의 오래된 응답 무시 방식은 그대로다. 카드별 로컬 loading/ref를 추가해 사용자 재조회 중 중복 클릭만 막는다. 새로운 API·주기 조회·요청 캐시·공유 상태·데이터 저장은 추가하지 않았다. production 최초 mount에서 카드별 요청 1건, 재조회 1회당 1건, 지표 팝업 열기/닫기는 추가 요청 0건을 검사한다. 같은 카드의 동시 재조회는 막고 이전 화면/이전 effect 응답은 기존 cleanup으로 무시한다.

## 영향과 위험 검토

상태 표시가 이전 값을 새 자료처럼 보이게 하거나 재조회 실패를 숨기는 위험은 상태/날짜 분리와 실패 시 기존 수치 제거로 대응한다. 중복 클릭과 늦은 응답은 지연 fixture 및 화면 왕복 후 역순 응답으로 검증한다. source-link의 44px 크기가 재무 본문이나 좁은 카드의 줄바꿈에 영향을 줄 수 있어 5개 폭과 기존 기업/ETF 화면 회귀를 실행한다.

금융 계산·원장·합성/체결 가격·배당/세금·기존 8종목·Auth·금융 RPC/RLS/SQL·수기 게이트·시장 시계·헤더 지표 슬라이더·도움말/Tour 구현은 변경하지 않았다. main/TradingUI/ChartLab/Learning, marketInfo/marketData/treasuryData, 금융/인증 소스, supabase와 .github는 기준 SHA 대비 변경 없음. 국소 표시 변경과 카드별 재조회 잠금으로 충분하며 대규모 리팩터링은 불필요하다. 반복 결함이나 공유 요청/상태 계층 변경이 생길 때 재검토한다.

## 검증

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true VITE_ENABLE_MANUAL_TRADING=false npm run build
npm test -- --workers=2
npm run test:auth -- --workers=2
npx playwright test --config playwright.release.config.ts --grep 'release defaults' --workers=1
```

| 항목 | 결과 |
| --- | --- |
| 변경 전 영향 기준선 | 8/8 PASS: 환율 표시·시장 UI·외부 제공자/팝업 |
| 시장·지표·차트·캘린더·자료 카드 통합 영향 검사 | 50/50 PASS |
| 신규 자료 카드 검사 | 16/16 PASS: 수치·단위·기준일/조회시각·출처, 요청 횟수, 중복 클릭, 로딩/실패/회복/미제공, 늦은 응답, 지표/일정/공식 링크·SEC 원문·뉴스 fixture, 5해상도·키보드/터치·reduced-motion |
| 비활성 설정 별도 smoke | 2/2 PASS: 두 카드 모두 사유 있는 disabled, 외부 출처 접근, 요청 0건 |
| 최종 TypeScript/Vite build | PASS · 최종 빌드 1회 |
| 최종 전체 앱 UI 회귀 | 248/248 PASS · 전체 실행 1회 |
| 인증·수기·배당·세금 fixture | 40/40 PASS |
| production 수기 false 게이트 | 1/1 PASS: 저장 선호 보존, 수기/배당/세금 RPC 0건 |
| 1440/1200/768/390/320px | 신규 카드의 헤더·버튼·링크 겹침 없음, 핵심 타깃 44px 이상, 가로 넘침/JS 예외 없음. 기존 전체 앱/기업·ETF·학습·계좌도 회귀 검사 |
| 금융 PostgreSQL/SQL | 이번 단계 미실행, 금융·DB 원본 불변으로 UX1-B1/G1 근거 재사용 |
| 실기기·스크린리더/WCAG 전체·운영 인증·최신 운영 외부 응답 | NOT VERIFIED. 로컬 Chromium과 고정 응답 fixture 사용 |

영향 검사는 최종 production React와 동일한 동작을 사용하고, 전체 회귀는 실제 최종 Vite 산출물에서 실행한다. 처음 개발 StrictMode 실행에서 기존 Modal의 effect 재실행에 따른 초점 복귀 실패 2건을 발견했다. Modal/도움말/Tour 코드는 변경하지 않았고 production React에서 초점 복귀를 재검증했다. 닫힌 details 안 링크는 접근성 트리에 없으므로 보이는 링크의 이름을 검사하고, 입력 원문 링크에도 새 탭 안내를 보강했다. 개발 StrictMode의 기존 모달 초점 복귀 제한은 잔존하며 이번 운영 UI 검증과 구분한다. 최종 production 검증의 미해결 FAIL은 0건. 기존 Vite auth 정적/동적 import 및 chunk 크기 경고는 유지한다.

## 화면 증거

최종 production 빌드의 실제 Chromium 캡처다. **값·기준일·조회시각·시장 시계는 고정 fixture(2026-10-27)를 사용하며 최신 운영 자료가 아니다.** 외부 차트는 기본 비활성 상태로 제공자 선택과 이동 UI만 촬영했다. 기능을 숨겨 캡처하지 않았다.

| 화면 | PC 1440px | 모바일 390px |
| --- | --- | --- |
| 환율 정상 | [보기](ux1-b2-captures/1440-fx.png) | [보기](ux1-b2-captures/390-fx.png) |
| 재무부 정상 | [보기](ux1-b2-captures/1440-treasury.png) | [보기](ux1-b2-captures/390-treasury.png) |
| 외부 차트 보조 조작 | [보기](ux1-b2-captures/1440-external-chart.png) | [보기](ux1-b2-captures/390-external-chart.png) |
| 재조회 중 이전 자료 유지 | — | [보기](ux1-b2-captures/390-refresh.png) |
| 조회 실패와 재시도 | — | [보기](ux1-b2-captures/390-error.png) |

## 운영·다음 단계

워크플로의 push 필터는 finance/market 과거 전용 브랜치만 대상으로 하고 Pages는 workflow_dispatch다. B2 브랜치는 CI push 대상이 아니고 schedule/Cron 트리거도 없다. `[skip ci]` 개발 커밋으로만 push하며 main·Pages·운영 DB/Auth/Cron·migration/RPC/RLS 변경 없음.

개발 결과 판정: Ready (개발 결과 검토 및 UX2 진행 가능). UX2의 기업 상세 4탭/ETF 구조 개편을 시작할 수 있다. 홈 정보 구조·학습 진입은 UX3, 전체 검색은 A4/A5, 실제 종가와 금융 운영 전환은 각 후속 단계로 유지한다. 이 판정은 운영 배포 승인이 아니다. 롤백은 B2 UI 커밋 revert로 가능하며 데이터 마이그레이션은 필요 없다.
