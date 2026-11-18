# US Stock Lab — UI v2 홈 디자인 비교 실험 (A/B/C)

상태: **운영 main 미병합 · UI v1 Stage6 보존 · 독립 실험 브랜치**.

- 기준 커밋: `eefe97d1457841b7cd0fe41bbf9a32a1e04d973a`
- 기준 브랜치: `baseline/ui-v1-stage6-20261118`
- 실험 브랜치: `design/home-v2-lab-20261118`
- 검토용 Draft PR: #34 → `design/ui-v1-rebuild`; 운영 main 변경 없음.
- 직접 미리보기: `https://pchjesus.github.io/us-stock-lab/preview/ui-v2-home/?ui=v1&homeLab=1#home` (Pages SUCCESS 후에만 접근 유효).
- 선택 쿼리: `homeVariant=a`, `b`, `c`; 선택은 URL의 보기 상태에만 저장.

## 목표

기능을 더하지 않고 같은 자산·시장·관심종목·학습 데이터를 세 가지 정보 위계로 보여준다.
사용자가 홈에서 **총자산 확인**, **시장 파악**, **관심종목 발견**, **다음 행동 선택**을 할 때 어느 배치가 자연스러운지 비교한다.

| 안 | 실제 섹션 읽기 순서 | 설계 가설 | 단점/검증할 위험 |
| --- | --- | --- | --- |
| A 자산 중심 | 자산→시장→관심→학습/자료 | 친숙한 계좌 중심 화면은 시작 부담이 적다 | 시장 맥락/다음 행동이 뒤로 밀릴 수 있다 |
| B 마켓 데스크 | 시장→자산/관심 2열→학습/자료 | 시장 지표와 내 계좌를 한눈에 비교한다 | 초보자에게 정보량이 많고 1차 자산 정보가 뒤로 밀린다 |
| C 간결한 시작 | 자산→학습/자료→관심→시장 | 다음 행동을 쉽게 찾을 수 있다 | 시장 요약을 바로 확인하기 어렵다 |

## Atlas 활용 근거

- **SRC-19 Dashboard**: 숫자를 많이 배치하는 것이 목적이 아니라 현황·다음 행동·상세 탐색 사이의 정보 위계를 정한다.
- **SRC-19 Split screen**: B에서 자산/관심종목을 비교. 작은 화면에서는 동일한 DOM/키보드 순서로 수직화한다.
- **SRC-19 Hero**: 기존에 제거한 대형 네이비 홍보 패널을 재도입하지 않는다. 비교 도구는 작고 명확한 조작 영역으로 둔다.
- **SRC-25 KPI card**: 총자산 및 시장 수치는 기존 `AccountSummary`/`HomeMarketSummary`만 사용한다. 새로운 숫자/시세/순위를 생성하지 않는다.
- **SRC-24 List**: 관심종목 행과 실제 상세 링크를 유지하여 비교 시 항목의 시인성과 조작만 평가한다.
- Atlas는 **설계의 후보와 주의점**이지 사용성 검증 결과가 아니다.

## 기술적 격리

- `?ui=v1&homeLab=1`일 때만 `HomeLab`을 렌더링한다. 기본 UI v1 및 레거시 홈은 바꾸지 않는다.
- 계좌·원장·금융 산식·시장 서비스·인증·DB·학습 완료/퀴즈·실제/합성 표시 원칙은 보존한다.
- 레이아웃 전환은 React 표시 상태와 `homeVariant` URL 쿼리만 변경한다.
- 기존 hash 라우트, 시계·시장 표시·포트폴리오·학습 접근을 유지한다.
- 가상 주문이나 계좌 초기화는 이 실험에서 하지 않는다. GitHub Pages의 같은 origin은 로그인 및 로컬 상태를 공유할 수 있다.
- 메인 코드 병합·운영 UI 기본값 변경은 사용자 승인 후 별도 검증한다.

## 자동검증 결과

[UI v2 Home Lab QA #44266855678](https://github.com/pchjesus/us-stock-lab/actions/runs/44266855678): **SUCCESS** (2026-11-18)
- production-flags build PASS
- 홈 실험 + 기존 디자인 집중검증 **52/52**
- 전체 UI **484/484**
- Auth **54/54**, Release **6/6**, UX0 **3/3**
- PC/모바일 A/B/C 비교 캡처 Actions artifact 업로드 확인
- 실제 물리 기기·스크린리더의 수동 점검 및 사용자 시안 선택은 아직 미실시

## 사용자 검토 질문

1. **총자산과 손익**을 찾기 쉬운가?
2. **합성 시세 및 기준일**을 실제 지표/실제 현재가로 오인하지 않는가?
3. **관심종목**을 살펴보고 상세로 이동하기 쉬운가?
4. **학습과 분석실**의 다음 행동이 분명한가?
5. **390px 모바일**과 1440px PC에서 가장 편한 안은 무엇인가?

## 참고문헌 (APA 7)

디자인 깎기. (2026, November 11). *UI 레이아웃·앱 첫 사용 경험 레퍼런스 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LAYOUT_FIRST_USE_ATLAS_v0.1_20261111.md

디자인 깎기. (2026, November 13). *데이터 시각화·검색 경험 18칸 연구 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_DATA_VISUALIZATION_SEARCH_ATLAS_v0.1_20261113.md
