# v0.6 참고 오픈소스·개발 커뮤니티 조사 및 후속 개발 근거
작성 2026-10-27. 출처 확인을 위한 링크 모음. 타사 API 라이선스 허가서가 **아님**.

## 1. 유사 프로젝트: 운영 방식별 비교

| 프로젝트/출처 | 실제 구현·공식 문서에서 확인된 방식 | 우리 적용 |
|---|---|---|
| [Ghostfolio](https://github.com/ghostfolio/ghostfolio) | 웹 UI와 거래 Activity에 날짜, 단가, 수량, 수수료, BUY/SELL/DIVIDEND/FEE, MANUAL/YAHOO dataSource 분리. PostgreSQL+cache. | **수동거래+별도 평가시세+현금 이벤트**라는 아키텍처 채택. Yahoo 시세를 우리 서버로 재배포할 수 있다는 근거는 아님 |
| [Portfolio Performance](https://www.portfolio-performance.info/en/) ([데이터 공급자 설명](https://help.portfolio-performance.info/en/how-to/downloading-historical-prices/), [온라인 갱신](https://help.portfolio-performance.info/en/reference/online/)) | 거래·배당·세금·수수료를 사람이 직접 기록. 과거 시세 수동/외부 공급자 교체. 무료 공급자들의 약관이 제한적으로 바뀌고 있음을 문서에 명시. | **거래가격은 불변, 평가시세는 별도 공급·수기 업데이트 가능**. 개별 종목 갱신 및 최신성 표기 |
| [Alpaca paper](https://github.com/alpacahq/user-docs/blob/master/content/trading-on-alpaca/paper-trading.md) | 호가로 모의체결·부분체결·재시도 모델. 문서상 **배당 시뮬레이션 미지원**. | 호가 기반 자동체결 대신 사람이 직접 관측한 가격 기록. 배당 독립 엔진 필수. Alpaca API는 실제 거래용 인터페이스도 있으므로 연결 금지 |
| [PAT0216/paper-trader](https://github.com/PAT0216/paper-trader/blob/main/docs/MANUAL.md) | 개인용 yfinance+FRED, 로컬 SQLite 캐시, 거래비용 모델, AWS scheduler. | 캐싱/스케줄/비용 로직만 패턴 참고. yfinance 조회 구현은 무단 재표시 권한을 주지 않음 |
| [Ghostfolio Importer](https://github.com/mitdesai/ghostfolio-importer) | 증권사 CSV 수동 입력/동기화, 중복 판정, Yahoo 없는 폐지종목 MANUAL 사용, 배당 미동기화 시 기록 분리. | 향후 CSV 임포트·수기 종목 fallback·중복 이력 보존에 참고 |
| [r/algotrading 토론 (2026-10-19)](https://www.reddit.com/r/algotrading/comments/1x9xvmi/platforms_to_use_for_testing_paper_trade/) | 사용자들이 무료 데이터 지연, 실시간 호가 구독, 시뮬레이션의 과도하게 낙관적인 체결·슬리피지를 지적. 이용 경험담이지 공식 사양이 아님. | 자동 보정을 신뢰하지 않고 입력 시각/외부가격 관측 시각 분리 및 교육용 성격 명시 |

## 2. 접근권과 데이터를 혼동하지 않는 기준
- [TradingView 위젯 공식 FAQ](https://www.tradingview.com/widget-docs/faq/data/): 웹사이트용 임베드 미국 주식시세는 거래소 규정 때문에 **지연**될 수 있다. 유료 TV 개인 요금제라도 임베드 실시간으로 바뀌지 않는다. 데이터 API/다운로드 기능이 없으며, 위젯 데이터를 주문서에 읽어들일 수 없음. [공식 Advanced Chart](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/)는 **화면 표시**에만 사용.
- [Yahoo Finance 공식 데이터 페이지](https://help.yahoo.com/kb/finance/article-exchanges-data-delays-sln2310.html): Yahoo Finance 표시 데이터를 재배포하지 말라고 명시. yfinance·크롤링·비공식 query1/query2 API를 우리 서버 시세 제공용으로 사용하는 것은 미승인.
- [Yahoo Finance 공식 Portfolio 설명](https://help.yahoo.com/kb/SLN36784.html): 사용자가 직접 보유종목·거래를 입력해 배당/현금흐름을 추적하는 접근법은 이미 상용 서비스에서도 쓰이고 있음.
- 네이버/토스는 **외부 링크**로 열 수 있으며, 표시에 접근 가능한 것과 응답 데이터를 수집·재호스팅할 권한은 별개이다. 공식 API/재표시 권한 미확보라 직접 크롤링 미적용.
- 기존 Frankfurter 공식 USD/KRW 참고환율은 표시용. 수기거래의 매수·매도가·비용/양도세용 법정환산 환율과 자동 합성하지 않는다.

## 3. 권장 UI·데이터 구분
1. 차트 영역: 기존 합성 분봉 또는 TradingView 공식 임베드 (지연·출처 명시); 로그인 사용자에게 가격을 프로그램으로 전달하지 않음.
2. 링크 영역: TradingView/네이버/토스 종목별 검증된 URL로 새 탭. 모바일 브라우저 복귀 UX 우선.
3. 매매 폼: `typedPriceUsd`, `quantity`, `sourceLabel`, `userObservedAtUtc` 입력. 서버의 `receivedAt`/`filledAt`는 별도 권위 있는 타임스탬프.
4. 수동 계좌 평가: **사용자가 갱신한 최신 기준가**만 사용; USD 센트·asOf·source와 데이터 나이 보관. 기준가가 없으면 보유평가/수익률은 '미제공', 절대 합성 가격 자동 대체 금지.
5. 연습 점수: 다른 유저의 소득이나 실제 거래 기록으로 오인 금지; 수기 가격으로 수익률·경쟁 순위를 계산하면 임의 입력의 조작 가능성을 밝힘.
6. 매도 후 거래 이력 불변: 사후 1분봉 가격 조회는 **검증 보조정보**로만, 기존 체결가·원장 자동 수정 금지.

## 4. 현재 코드 체크포인트·유의사항
- 최신 사용자 제출 SHA `192d3ce28ec13ed85403c587feb367f4b0ba224a`에서 수동 서버 계좌/RPC/원장만 구현; UI·운영 DB·배당 자동화는 미구현.
- 최종 SHA CI run `40437715015`은 빌드 + 일반78 + auth12 PASS이나 GitHub hosted PostgreSQL 기동 단계 실패. 2026-10-27 실제 psql readiness 재시도 보완 중, 격리 금융 SQL CI 전체 PASS 확인 전 운영 적용 금지.
- `tests/sql/manual.sql`의 초기 invalid input 테스트는 예외 블록이 자체 `raise exception`까지 삼킬 수 있었음. 기대 오류코드/메시지 검사로 보완. SQL 거절 테스트는 **실제 거절 원인까지 검사**해야 함.
- `manual_order`가 `rateBps`와 `minCents`를 클라이언트 입력으로 그대로 신뢰하는 것은 개인 기록 모드에서는 자기신고 수수료에 해당한다. 친구간 점수 비교·현실적 수수료 재현에는 취약. **서버 저장 수수료 정책 버전** 도입 및 사용자 임의 per-order fee 변경 여부 선택이 필요. 기본은 계좌별 고정 정책.
- `observedAt`은 과거 임의시각도 기록 가능. 사용자가 확인한 시각을 그 자체로 '거래소 검증된 호가시각'으로 제시하지 말 것. 서버 체결 시각은 신뢰.
- 수기 거래 계좌는 실제 시세를 검증하지 못하므로 엄밀히는 **사용자 자기신고 가격을 통한 모의 기록**이지 실시간 시장가 주문 시뮬레이션이 아님.

## 5. 다음 Codex 작업 범위 (B: UI + 클라이언트 경계)
- 먼저 격리 SQL CI PASS와 최신 main, AGENTS/SPEC 확인. 운영 DB migration 적용은 **B 통합·High 보안 리뷰 이후**.
- `src/manualAccount.ts`: 스냅샷 파싱, cash+positions+fees+realized+ledger replay 정합성 검증. 실패시 원본 보존, 미확정 ID를 사용자 단위로 저장해 동일 요청으로 재조회.
- `src/TradingUI.tsx` 및 종목 화면: 로그인 수기 계좌 선택(기존 합성 계좌 절대 혼합 금지), 수기 가격·정수 수량·매수/매도·출처/관측시각, 수수료/현금 계산 미리보기, 리뷰/확정, pending 상태·오류, 기존 서버 시장시간 게이트 유지.
- 수기 평가가격은 별도 사용자 입력·기준시각·보관. 마크 가격 미제공 시 수익률 미제공; 영속화·RLS 및 연동은 단계화하되 v0.6 최종 포함.
- TradingView 공식 임베드는 별도 독립 표시, 지원하지 않는 종목은 외부 링크/기존 합성 차트 fallback. 출처별 지연 정보가 명확할 때만 안내. 자동 가격 파싱/교차 도메인 스크래핑 금지.
- 개별 변경 테스트 → 기존 전체 UI/인증 → 격리 서버 SQL → High 리뷰. 통과 전 main/Pages/운영 DB 건드리지 않음.
