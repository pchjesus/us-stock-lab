# US Stock Lab — 시장 탐색 카드 밀도·확장성 패치 (2026-11-21)

## 사용자 의견과 설계 결정
- 기존 B>A/C 혼합 결과에서 상시 표시된 기업 상세 미리보기 패널이 화면 폭의 약 1/3을 점유하고 카드가 한 줄에 2개밖에 배치되지 않는 문제 지적.
- **상시 미리보기 패널 제거**, 필요할 때만 버튼으로 여는 키보드/ESC 대응 기본 브라우저 `<dialog>`로 전환. 카드 그리드가 전체 폭을 확보.
- 컨테이너 폭에 따라 1개(모바일), 2개(중간), 3개(넓은 데스크톱), 4개(매우 넓은 데스크톱/접힌 사이드바) 자동 조정. '3–4개 고정'이 아니라 폭에 맞춰 콘텐츠를 읽을 수 있게 구성.
- 카드/목록 보기 토글 유지. 마지막 보기 선호와 페이지당 표시 개수는 **표시 전용** browser localStorage로 기억.
- 지원 종목 화면 표시 개수 **12/24/48/96**. 시작/이전/다음/마지막 페이지 이동, 검색·섹터·정렬 변경 시 1페이지 복귀. 총 검색 결과/현재 표시 범위 명시.
- 기존 심볼 A–Z/Z–A·합성 가격/등락 정렬 외에 **관심종목 우선**, **산업군별** 정렬 추가. 키보드 `/`로 검색창 이동, 직접 필터 초기화, 모바일 압축 목록 유지.
- **시가총액은 합성 현재가로 계산하지 않음**. 검증된 시가총액 공급원과 기준일이 전혀 없으므로 '시총 높은/낮은 순' 옵션은 비활성화, 목록 컬럼은 '미제공'으로 표기. 향후 서버/외부 가격 + 신뢰할 수 있는 발행주식수 데이터, 종목 종류/시점 검증 후 활성화.
- **수천 종목의 지원**은 현 프로젝트 계약상 아직 아님. 모의투자 가능 종목은 8개. 로컬 SEC 후보의 읽기 전용 대량 카탈로그에서 별도로 25/50/100/200개씩 보기 지원, `catalogPage`는 기존 50개 기본과 서명/상장 미검증 규칙 유지. 대규모 원격 검색 및 시장데이터는 별도 엔지니어링.

## 격리와 보호
- 새로운 실험 URL: `?ui=v1&marketDensity=1#market`. 기존 `marketHybrid=1`, `marketLab=1`, 운영 기본 UI v1, 홈 A안은 수정하지 않음.
- 독립 실험 브랜치: `design/market-v2-density-20261121`, 부모 commit `90b977d37efb14aa2650debcb527b1754e0ff477`.
- 시세/금액/환율/포트폴리오/원장/거래/인증/DB/RLS/Supabase migrations/학습 기록/기존 실거래 금지 정책 변경 없음.
- 카드/목록 모두 같은 기존 `instruments`,`quote()`,`useCurrency()`, `watch`/`toggle`, 기업 상세 링크를 사용.
- 부드러운 220–400ms 진입/hover/보기 전환. 무한 반복 및 가짜 실시간 깜빡임 없음. `prefers-reduced-motion`에서 애니메이션 제거.
- 헤더·컨트롤·버튼 44px 목표, 키보드 포커스·다이얼로그 내 Escape/닫기·시맨틱 표·`aria-pressed` 유지.

## 검증
- 새로운 Playwright `tests/market-density.spec.ts`: UI 격리, 넓은 카드 그리드, dialog, 12/24/48/96, 정렬, 시총 비활성, 모바일 320–1920, 단축키/키보드, reduced motion, 후보 카탈로그 페이지, 시각적 캡처.
- 기존 market-hybrid, 시장 A/B/C, v1 design, 전체 UI/Auth/Release/UX0 회귀 테스트 유지.
- 운영 `main`에는 UI 코드를 병합하지 않고 필요할 경우 호스팅 전용 workflow만 별도 PR로 병합해 `/preview/ui-v2-market-density/`에 실험 제공.

## 디자인 근거 (APA 7)
디자인 깎기. (2026, November 12). *목록 표현·비교·탐색 방식 9종 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LIST_PRESENTATION_ATLAS_v0.1_20261112.md
디자인 깎기. (2026, November 13). *데이터 시각화·검색 경험 연구 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_DATA_VISUALIZATION_SEARCH_ATLAS_v0.1_20261113.md