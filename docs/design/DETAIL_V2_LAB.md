# US Stock Lab — 종목 상세 대격변 실험 v2 (2026-11-21)

## 화면 선정 이유
시장 탐색 화면 v2.2는 사용자가 “이정도면 나쁘지 않다”라고 평가하여 채택 후보로 보존. 다음 연속 이동 화면인 기업·ETF 종목 상세를 비교 디자인한다. 선택 전까지 **A (현재 v1) vs B (스토리·이해 중심) vs C (데이터 분석 데스크)** 모두 지원한다.

## 실험 격리
- 기준 브랜치: `design/market-v2-density-20261121`, 커밋 `b0aec649a584cd491822ede4720d918a303392f7`
- 새 브랜치: `design/stock-detail-v2-lab-20261121`.
- 새 플래그: `?ui=v1&marketDensity=1&detailLab=1&detailVariant=a|b|c#stock/AAPL`.
- `detailLab` 플래그가 없는 기존 UI v1, 기존 시장 v2.2, 운영 main, 홈 A, 계좌·원장·인증은 그대로.
- UI만 실험, Draft PR 유지, 금융 기능/DB/마이그레이션 변경 금지.

## 화면 3안
| 안 | 목적 | 화면 패턴 | 배치 |
| --- | --- | --- | --- |
| A | 보존 대조군 | Stage 6 종목 상세 원형 | 제목→합성 가격→탭→원본 데이터 |
| B | 초심자 스토리형 | 따뜻한 흰 배경과 블루 포인트 | 회사 정체성·합성 가격 강조→사업/수익구조/위험 3개 요약→탭→공식 실적·근거 |
| C | 분석 데스크형 | 다크 네이비 기업 인식 헤더 | 간결한 가격 리본→밀도 높은 공시 편집 요약→뚜렷한 4개 탭→재무·업계 참고 지표 |

### 기존 코드/자료를 그대로 사용
- `StockDetail`, `CompanyDetail`, `EtfDetail`, `ValuationComparison`, 기존 `quote()`, `OrderPanel`, `ExternalQuotes`, `ManualWorkspace` **동일**.
- B/C의 “무슨 사업 / 어떻게 수익 / 주요 위험”은 `companyProfiles`의 공식 공시 기반 편집 요약 필드 (`business`, `revenueModel`, `risks`)를 그대로 읽음.
- ETF는 기존 발행사 설명과 함께 검증 없는 비용·분배금·구성비를 미확인으로 표시. 업계 비교는 기존 검증된 스냅샷만 사용.
- 합성 가격·변동률을 SEC 재무/업계 참고 지표 또는 실제 현재가와 **절대 혼동하지 않음**.
- 타이틀·탭의 역할 및 키보드 ArrowRight/ArrowLeft/Home/End, 주문 탭 지연 로딩, 기존 event, 계좌와 관심종목 저장 보존.

## UX 가설과 접근성
- 색상은 B 밝고 이해 중심, C 어두운 연구 중심. 320–1440px 반응형.
- 카드는 탭 진입 직후 보이도록 일관된 정보 계층; 필요 시 넓은 데스크톱에서 사업 소개와 최근 실적을 병렬로 제시.
- 250–350ms 변환, 지속 애니메이션·가짜 주식 실시간 점멸 없음. `prefers-reduced-motion` 지원.
- 명시적인 역할/ARIA·현재 선택 탭/고유 ID, A/B/C 비교 토글 유지.
- 사용성 가설로만 기록, 개인 실사용 선택 전까지 최적이라는 주장 금지.

## 테스트
- `npm run build`
- `tests/detail-v2-lab.spec.ts`: 기존/신규 라우트 격리, B 요약 내용, C 키보드·재무·주문, 3 ETF, 계좌 상태/원격 호출, 카드→상세→시장 복귀, 320–1440px 오버플로, 접근성 및 reduced motion, A/B/C PC·모바일 캡처.
- 기존 시장 v2.2/혼합/B/C/A, v1 설계, 전체 UI/Auth/Release/UX0 기존 검증 필수.
- Pages 미리보기는 별도 워크플로로 운영 main 코드를 변경하지 않고 `/preview/ui-v2-detail/`에 분리 배포.

## 참고 (APA 7)
디자인 깎기. (2026, November 11). *UI 레이아웃·앱 첫 사용 경험 레퍼런스 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_LAYOUT_FIRST_USE_ATLAS_v0.1_20261111.md

디자인 깎기. (2026, November 13). *데이터 시각화·검색 경험 연구 아틀라스 v0.1* [연구 노트]. GitHub. https://github.com/pchjesus/design-kkakgi/blob/main/references/UI_DATA_VISUALIZATION_SEARCH_ATLAS_v0.1_20261113.md
