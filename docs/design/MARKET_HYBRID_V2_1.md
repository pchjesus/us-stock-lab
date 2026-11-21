# US Stock Lab — Market UI Hybrid v2.1

## 결정과 목표
사용자 직접 평가: **B > C > A**. B는 한눈에 들어오는 카드형 가독성, C는 빠른 비교 및 정렬, A는 종목이 훨씬 많아졌을 때의 압축된 훑어보기 장점. 선택: **B를 기본 카드 모드**로 두고 상단의 **카드 / 목록 2상태 토글**로 C의 비교표와 A의 높은 정보 밀도를 결합한다.

## 구현 설계
- `?ui=v1&marketHybrid=1#market`만 새로운 통합 화면 사용. 기본 `?ui=v1#market`, 홈 A, 기존 시장 A/B/C 실험, 레거시 운영 앱은 변경하지 않음.
- 카드 모드 기본, 사용자 선택은 별도의 표시 전용 localStorage 키 `us-stock-lab.market-view-mode`에 `cards`/`list` 저장. 로그인/계좌/원장 저장소와 격리.
- 카드↔목록 전환 시 검색어, 섹터, 관심종목만 보기, 정렬, 선택 종목 상태를 같은 Explorer에서 유지. 카드와 목록은 같은 합성 시세/심볼/현행 상세 페이지 링크 사용.
- 카드 24개, 목록 50개씩 페이지 표시(필터 결과와 분리). 현재 지원 종목은 정확히 8개이므로 페이지 조작기는 나타나지 않음.
- 데이터가 추가될 때 24/50씩 실제 DOM 렌더링 규모 제한. **서버 검색·인덱싱·가상 스크롤과 시세 데이터 확장은 아직 구현하지 않음**. 수백~수천 종목은 추후 API/인덱스/가상화 등 별도 성능 설계 필수.
- C의 비교표는 기존의 의미 있는 열 제목, 가격·변동률 정렬, 모바일 압축행, 선택 정보 패널을 유지하되, 짙은 남색 대신 B의 밝은 톤으로 통일.
- 정보 불변: 합성 시세 및 표시 통화, 가격/변동률, 데이터 기준일, 관심종목 원격/로컬 동작, SEC 후보 로컬 카탈로그 구분, 공식/합성 데이터 경계, 실거래 금지.

## 움직임
- 보기 전환 시 약 310ms ease-out 페이드·상하 미세 이동, 개별 카드 등장/호버/저장 강조는 기존 B 애니메이션 재사용.
- 불필요한 무한 루프·가짜 시세 점멸 없음; `prefers-reduced-motion`에서 등장 애니메이션 끄기.
- 영역 레이블·필터 `aria-pressed`, 표 정렬 `aria-sort`, 44px 조작 영역 및 모바일 320px 가로 넘침 방지.

## 배포 및 검증 원칙
- 작업 브랜치 `design/market-v2-hybrid-20261121`는 `design/market-v2-lab-20261118`의 검증된 실험 상태에서 분기.
- 별도 PR Draft. 기존 홈 A 결정과 Stage6 기준 브랜치 유지, main UI 코드 미변경.
- Playwright: 신규 `tests/market-hybrid.spec.ts` + 기존 `market-v2-lab.spec.ts` + `design-v1.spec.ts` + 전체 UI/Auth/Release/UX0. 배포 전 CI 성공 필수.
- 사용자 시안 평가 후 기존 B/C/A UI를 정리할지 결정하며 그전까지는 기존 프리뷰 비교도 보존.

## 참고문헌 (APA 7)
디자인 깎기. (2026, November 11). *UI 레이아웃·앱 첫 사용 경험 레퍼런스 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LAYOUT_FIRST_USE_ATLAS_v0.1_20261111.md
디자인 깎기. (2026, November 12). *목록 표현·비교·탐색 방식 9종 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LIST_PRESENTATION_ATLAS_v0.1_20261112.md