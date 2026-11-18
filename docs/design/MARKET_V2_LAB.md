# US Stock Lab — 시장 탐색 대격변 1차 (독립 UI v2 실험)

## 상태 및 격리
- 기준점: `baseline/ui-v1-stage6-20261118` (`eefe97d`).
- 작업 브랜치: `design/market-v2-lab-20261118` (main/기존 v1/홈 A 시안 무변경).
- A안 **기존 UI v1 시장 탐색**을 대조군으로 보존. 사용자가 선택한 **홈 A안**은 이 실험의 변경 대상이 아니다.
- 데모 및 Pages 링크는 자동 CI 빌드·테스트·배포가 성공한 후 제공할 것.
- 실험 전용 쿼리: `?ui=v1&marketLab=1&marketVariant=a|b|c#market`.

## 세 가지 디자인
| 안 | 화면 패턴 | 정보 탐색/의사결정 | 핵심 구조 및 움직임 |
| --- | --- | --- | --- |
| A | 현행 기준 UI v1 | 기존 검색·필터·목록 | 원형 그대로 보존 |
| B | 디스커버리 스튜디오 | 초보자가 관심 기업의 맥락을 이해한 후 종목 상세로 이동 | 대형 검색창, 섹터 필터 칩, 카드 그리드, 선택 시 정보 패널, 카드 순차 등장/호버 상승/부드러운 강조 |
| C | 비교 데스크 | 같은 기준의 가격·등락을 정렬하며 여러 종목을 빠르게 비교 | 대비 높은 검색 영역, 표와 다열 정렬, 선택 요약, 모바일 행 카드, 데이터 패널 전환 |

## 중요 보존사항
- 8종목만 주문·학습 지원: AAPL/MSFT/NVDA/AMZN/GOOGL/VOO/QQQ/SCHD. 후보 카탈로그는 기존 로컬 데이터 가져오기 UI로 분리, 읽기 전용 유지.
- 합성 가격과 변동률은 `quote()`, 원화 표시는 기존 `CurrencyToggle`/`useCurrency()`, 관심종목은 기존 `toggleWatch`, 외부 시세 링크는 기존 `quoteLinks()` 사용.
- **실제 시장 가격, 새로운 가짜 등급/순위/뉴스, 가짜 차트나 수익률을 생성하지 않는다.** 확인 가능한 합성 데이터 기준일과 출처 경계를 유지.
- 계좌·원장·주문·인증·RLS·Supabase migration·분석/백테스트 계산·학습 원문과 진도 기록 수정 금지.
- 검색어/섹터/관심 필터 및 정렬은 화면 상태; URL에는 디자인 버전만 보관. 내 계좌 상태에 영향을 주지 않는다.

## 애니메이션 기준
- CSS `transform`/`opacity` 기반의 250–400ms 전환, 순차 등장 stagger <= 약 260ms; 과도한 반복/무한 모션 없음.
- 카드 hover/선택/초점 전환, 패널 입장, 필터 선택 색상, 단추 반응에 부드러운 ease-out 사용.
- 44px 이상 조작 영역, `aria-pressed`, `aria-sort`, 라이브 결과 상태, 키보드 초점, 모바일 320–1440px 테스트.
- `prefers-reduced-motion: reduce`에서 모션을 끄되 내용·조작 유지.

## 디자인 깎기 아틀라스 반영
- SRC-19 Dashboard/Sidebar·Split: A를 계층 기준, B는 탐색+선택 정보 2단 패널, C는 비교+정보 패널.
- SRC-24 Grid/Card vs Table: 발견(B)은 카드, 속성 비교(C)는 의미 있는 table 표제/정렬, 모바일은 간결한 행으로 전환.
- SRC-25 KPI: 동등하지 않은 숫자와 가짜 트렌드를 추가하지 않고 기존 합성 가격·변동률/기준일 표기.
- SRC-26 Search: 종목명/심볼 검색, 결과 0개, 필터 상태, 정렬·초기화를 연결.
- 이 적용은 설계 가설이며 정량적 사용성 향상 효과를 입증한 결과는 아니다.

## 검증 프로세스
- `npm run build`, `tests/market-v2-lab.spec.ts`, `tests/design-v1.spec.ts`, 전체 UI/Auth/Release/UX0 회귀검증.
- PC/모바일 3안 전부 Actions artifact 스크린샷.
- 사용자 승인 전 Draft 및 운영 main 미병합, 기존 홈과 v1 미리보기 경로 보존.

## 참고 (APA 7)
디자인 깎기. (2026, November 11). *UI 레이아웃·앱 첫 사용 경험 레퍼런스 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LAYOUT_FIRST_USE_ATLAS_v0.1_20261111.md
디자인 깎기. (2026, November 12). *목록 표현·비교·탐색 방식 9종 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LIST_PRESENTATION_ATLAS_v0.1_20261112.md
디자인 깎기. (2026, November 13). *데이터 시각화·검색 경험 18칸 연구 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_DATA_VISUALIZATION_SEARCH_ATLAS_v0.1_20261113.md