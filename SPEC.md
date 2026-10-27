# US Stock Lab 계약
- 화면: 홈/시장/상세/포트폴리오/학습/설정. 모바일 하단 탐색, 데스크톱 사이드 탐색.
- 합성 지수·환율은 2026-10-23 생성 기준 고정 예시. 주식/ETF 일봉은 2026-06~09 구간의 결정론적 합성 OHLC. 가격/등락은 차트 마지막 두 캔들에서 파생.
- 입력: 이름/심볼 대소문자 무시 검색. 관심종목은 localStorage `us-stock-lab.watchlist.v1`, 알려진 심볼 배열만 복원하고 중복 제거. 손상 시 빈 목록, 쓰기 실패 시 기존 상태와 경고 유지. 타 탭 변경 시 재로드.
- 브라우저→정적 파일, 브라우저→localStorage 구조. 서버·시세·브로커·결제 API 없음. 비밀정보/로그인 없음. v0.2 가상 거래기록은 브라우저에만 저장.
- 향후 경계는 data.ts의 VirtualAccount, OrderRequest, Position, FxRate, CorporateAction 타입. 주문 ID 중복 방지, 금액 최소단위 문자열/수량 decimal 문자열을 서버에서 검증하고 원자적 트랜잭션으로 처리할 예정. data.ts 타입은 미래 서버 계약 예시이며, 현재 실행 모델은 trading.ts의 Account/Trade.
- 향후 Supabase Auth 사용자 ID로 계좌 소유권 검증 및 RLS, 서버 주문 검증 필요. v0.2는 평단/실현·평가손익을 로컬에서 구현. 환손익, 배당/분할, 기술지표는 미구현.
- 학습 탭은 독립 UI. 향후 선택형 튜토리얼을 화면/단계 ID 기반으로 추가 가능. 현재 자동 튜토리얼 없음.
- 저장소와 데모 배포는 공개 접근 가능하다. 저장소 공개 여부와 앱의 Supabase 인증·RLS는 별개다.

## v0.2 로컬 가상매매
- `trading.ts`: 저장/React/시세 의존성 없는 순수 계산. `accountStore.ts`: 합성 가격 검증·주문 잠금·저장/복원. `TradingUI.tsx`: 주문 검토/확정·분석·포트폴리오. 기존 탐색/차트/관심종목 유지.
- 자금 10,000,000센트($100,000), 양수 안전 정수 주수. 모든 체결 가격/총원가는 센트 정수, 곱셈·원가 배분 중간 계산은 BigInt. 부동소수점은 수익률과 화면 형식화에만 사용.
- 가중평균은 총원가/수량으로 보존하고 표시 시 센트 반올림. 부분매도 원가는 총원가×매도수량/보유수량을 센트 half-up 반올림, 잔여 원가는 보유분으로 이월. 전량매도 원가 0. 현금+평가액-최초자금=실현+미실현손익.
- `us-stock-lab.account.v1` 한 JSON에 버전·계좌 세대 ID·체결 내역 저장. 내역을 재생해 계좌와 현금원장 재구성: 중복 ID, 알 수 없는 종목, 잘못된 금액·수량, 잔고 부족과 초과매도 기록은 복원 거절. 원본은 유지하고 확인 후 초기화만 허용.
- 매 주문 저장 직전 최신 원본과 확인 당시 원본 비교. Web Locks로 협력하는 탭의 주문/초기화 직렬화. 오래된 확인과 중복 ID 거절. 저장 성공 후에만 UI 반영. localStorage 단일 키 쓰기는 서버 트랜잭션·보안·외부 수정 방지를 제공하지 않음. 사용자 직접 변조된 유효 기록의 진위는 보장하지 않음.
- 주문은 저장소 경계에서 현재 등록된 8개 합성 종목 가격을 취득하며 UI가 가격을 지정하지 못함. 거래 일시는 로컬 실행 시각, 가격 시점은 기존 합성 차트 마지막 날.
- 초기화는 ‘초기화’ 입력과 확정 필요. 계좌 세대 변경으로 이전 확인의 주문 거절. 관심종목 키는 유지. 쓰기/읽기 실패는 명시적 오류, 성공 오표시 없음.
- 분석은 현재 보유분과 입력 가격/수량을 `averageBuy`로 합산. 잔고 제약 없는 분석이며 거래를 저장하지 않음. 수수료·세금·배당·환전 비용 0, 배당 처리/환율손익 미구현.
- 후속 서버 이전 시 decimal/최소단위 정수 계약, Auth 사용자 소유권·RLS, 주문 멱등키·서버 가격 검증·원자적 주문/원장 갱신 필요. 실매매 API 영구 금지.

## v0.3 인증·정보 기반
- v0.2 계산/저장 형식 그대로 보존. main 통합 SHA b5332a73cdfb45850d07e3167d5cfa52ecb0cb5a. v0.3는 개발 브랜치 검증 후 사용자 승인으로 main에 통합·Pages 배포.
- 인증: Supabase SDK, 초대 사용자 이메일 로그인 링크·선택적 OTP·로그아웃. URL/공개 키 없거나 잘못되면 미연결 표시. 서버 키 빌드 거절 및 브라우저 초기화 거절. 인증 상태·로딩·실패와 로컬 데모 계좌 상태 분리. 15초 요청 timeout. 세션은 SDK 저장소에 유지. 관리 토큰은 브라우저에 절대 사용하지 않음.
- SQL: profiles, paper_accounts, paper_positions, paper_orders, paper_cash_ledger, watchlist_items, market_events, market_news, learning_articles. 사용자 정보/관심종목은 자기 행만, 계좌/보유/주문/원장은 자기 계좌만 읽기, 금융 테이블 client 쓰기 권한과 정책 없음. 공개 정보는 published 행만 읽기, client 게시 불가. 주문 멱등키, account/order 복합 FK와 단일 초기자금 원장 제약. Auth 신규 가입 차단 원격 설정 완료. 기본 메일 제공자 제약과 실제 수신 여부는 별도 확인 필요.
- 서버 계좌 생성/원자 주문 RPC, 로컬→서버 계좌 이관·관심종목 동기화는 후속 단계. 현재 로그인은 로컬 데이터 소유권을 바꾸지 않음. 후속 이관은 사용자 확인·서버 재검증 후 별도 계좌로 가져오고 로컬 원본 보존 예정.
- marketInfo.ts의 타입/MarketInfoService와 demo/pendingOfficial 어댑터. 지표마다 UTC 기준시점·출처상태·등락 구분. 캘린더 UTC 저장/KST 표시, 발표시간 경과만으로 발표완료를 가정하지 않음. 결과가 있어야 완료. 중요 배너는 KST 전날/당일/다음날 상태와 결과/해설 구분; 이후 이벤트가 없으면 빈 상태.
- 8개 가상 이벤트는 실제 공식 일정/발표 결과가 아님. source URL은 기관 일정 참고 링크. 뉴스 예시 기사/가짜 발행시각 없음. NewsItem은 제목/출처/UTC 발행시각/URL/짧은 요약. 공식 수집은 서버 RSS 파싱·라이선스 확인·캐싱·수정발표 검증 후 어댑터 교체 필요. BLS/Fed RSS 및 BEA/FRED/KRX 출처 목록만 준비, 자동 수집은 미연동.
- 학습은 고정 lesson ID+단계+한 개념+실습 안내로 10개 구성. 향후 튜토리얼 ID 연결 가능. 배당/환율손익은 타입 경계·안내만 제공, 실행/계산 기능 미구현.

## v0.4-A 서버 가상매매
- 인증 전 로컬 원본/키 보존, 인증 후 사용자 전용 서버 계좌·관심종목. 사용자 전환 시 계좌/주문 UI 소유자 키 변경으로 이전 데이터 숨김. 계좌는 focus/15초 조회, 타 기기는 로그인/새로고침으로 복원. 자동 로컬 이관 금지: 향후 사용자 요청+원장 재검증+별도 승인 단계로 구현.
- paper_snapshot/paper_order RPC만 authenticated에 실행 허용. auth.uid 소유권 강제, 서버 가격표 8개 합성 종목, 계좌당 행 잠금, 사용자당 계좌 1개/초기자금 1회, account/request 고유키. 원가 배분은 numeric half-up 센트 반올림, 전량 매도 시 보유 행 삭제. 현금/보유/주문/원장 동일 트랜잭션. 정수/최대 수량/JS 안전 금액 범위 검증.
- 주문은 사용자 JWT를 요청에 고정. 불확실한 네트워크 결과는 사용자별 pending ID를 보존하고 동일 키로 재조회/재제출. 가격/소유자를 브라우저가 전달하지 않음. 직접 금융/가격 쓰기 차단. 서버 계좌 초기화는 제공하지 않음(거래 내역 보존).
- Security Advisor의 authenticated SECURITY DEFINER 경고 2건은 제한 RPC에 대한 의도된 경고. 안전한 빈 search_path, 완전 수식 테이블, 내부 helper 실행 회수, auth.uid 검사 및 RLS/직접쓰기 차단 테스트로 검토. 그 외 중요 lint 없음. 현금원장 FK 복합 인덱스 추가.
- 무료 기존 프로젝트와 인증 정책 유지. 후속 데이터 계약(환율·배당·분할·시세 기간·알림/튜토리얼)은 유지, 이번 버전 계산은 USD·비용 0.

## v0.4-B UI·시장정보
- 금융 서버/인증/원장 로직과 RPC는 변경하지 않음. 시장 기본 종목/지표 분리, 합성 지표 시계열(종료값 정합)과 기간 선택. 종목 상세 검증 가능한 발행사/거래소·상품 메타데이터, 미연동 배당/뉴스는 추정 없음.
- 월간 42칸 KST 캘린더, 인접 월/오늘/선택 날짜, 날짜 목록→이벤트 modal. native dialog 포커스·ESC·스크롤 잠금/복원. 알림은 배너와 같은 event ID+단계 키로 중복 방지, 읽음은 local/사용자 ID별 브라우저 저장(기기간 읽음 동기화는 후속). 가격/배당/Web Push는 생성하지 않음.
- NYSE 공식 hours-calendars 2026~2027 표/조기폐장 주석을 확인한 미국장 표시. NY→KST Intl DST 자동 적용, 브라우저 시계 변화 감지, 범위 밖·예외 휴장 불확실성 표시. 서버 거래 차단과 무관.
- 1/5/15/30분·1시간은 최근 5개 합성 거래일의 별도 minute 경로를 생성하여 일봉 OHLC와 정확히 일치. 주/월은 일봉 OHLC 집계. 주기는 브라우저 저장, 주문 가격/서버 가격표 불변.
- 자산/현금·주식/ETF·섹터 구성, ETF 별도 범주, 비중 표시 largest remainder로 합계 100.00%, 실현/미실현 및 종목 손익. 현재 보유분 교육용 집중도/미보유 영역 안내만 제공.
- 실제 UI 스포트라이트 7단계 투어: 화면 전환만 허용, shield/native modal로 쓰기 입력 차단, missing target fallback, 종료 시 hash/scroll/focus 복원. 사이드바 icon rail·저장/복원, 모바일 하단 탐색 유지.
- 후속 계약 보존: 서버 기준 정규장 외 주문 차단(High), 실제 시세/지수/환율 공급자, 배당락/수령/달력/원장·분할, 오늘/기간별/종목별 수익과 스냅샷, 환율손익 분해, 실제 산업구성, 적립식/매수후보유/리밸런싱 백테스트, 가격 알림/외부 Push, 신규 계정 개설 안내. 비로그인 주문 로그인 유도는 최종 안정화까지 보류. 분봉 이외 장기 실제 과거 데이터·배당 기록을 만들어내지 않음.

## v0.4-C 표시 설정·UI 정리
- 단일 시장 상위 분류: #market 종목, #indices 지표, #calendar 경제 캘린더, #news 뉴스. 새로고침 시 hash 상태 복원, 기본 종목 진입. 기존 중첩 종목/지표 버튼 래퍼 제거.
- 헤더 중앙 장 상태·현재 KST/ET 시각·운영/카운트다운, 동일 44px 우측 알림/계정/사용 방법. 좁은 폭에서는 2행 이상 압축 배치. 접힌 sidebar 80px rail의 햄버거/브랜드/48px nav 중심선 정렬, 모바일 기존 탐색 유지.
- 스포트라이트는 transparent native dialog backdrop + transparent 입력 차단 shield + target 외곽 shadow cutout. 대상 배경은 원래 밝기 유지, 대상 부재 시 전체 dim fallback. 기존 포커스/ESC/scroll 복원·7단계·읽기 전용 유지.
- CurrencyProvider는 표시 전용. 원본 거래/원장/수량/평단/손익 계산은 USD 센트 유지, KRW는 앱 합성 USD/KRW 1360 기준 원 단위 half-up BigInt 환산. 환율손익/실환율 기능이 아님. 홈/포트폴리오/시세/분석·원장 표시 전환, 주문 확인/입력과 차트 축은 USD 명시 유지. 지수 pt와 환율 비율은 통화 환산 대상이 아님.
- 통화 설정은 us-stock.preferences.v1.{local|userId}로 이 기기에 저장. 사용자 전환 시 namespace 즉시 분리, 인증 확인 중 저장 차단. profiles에 preference 컬럼이 없어 서버 동기화는 이번 무-migration 범위에서 보류. localStorage 저장 실패 시 이전 표시 유지/오류 안내. 설정에서 통화/기존 sidebar 상태/튜토리얼 진입 제공.
- High 후속: 서버 정규장 외 주문 차단은 여전히 미구현. 기존 합성/예외 휴장/브라우저 시계 한계·실제 데이터/Push·로그인 유도 보류 계약 유지.

## v0.4-D 정규장 주문 게이트
- 공통 계약 `market-calendar.json`: NYSE 공식 2026~27 표와 Nasdaq 현재 게시 2026 표 대조(2027은 NYSE 근거). America/New_York 09:30 이상~16:00 미만. 2026-11-27/12-24, 2027-11-26만 13:00 조기폐장. 휴일·주말·범위 밖·누락/미검증 일정은 신규 체결 차단. 프리/애프터·예약 주문 없음.
- `202610270003_market_hours`: 기존 RPC·금융 데이터 보존. 비노출 `paper_private`에 730일 일정/운영 중단 singleton과 권한 상승 없는 내부 판정 함수. client schema usage/table/function 권한 없음, RLS no-policy는 의도된 owner-only 차단. 공개 API는 기존 paper_order/paper_snapshot만 사용.
- paper_order는 기존 계좌 잠금·소유권·센트/numeric 계산 유지. 기존 ID의 재조회/내용 충돌은 장외에도 먼저 처리. 신규 주문은 잠금 후 서버 clock_timestamp 검사, 원장/응답 구성 후 최종 마감 검사로 지연 발생 시 전체 롤백. 클라이언트 시각/타임존/가격/소유자 입력 없음. snapshot은 장외 조회·계좌 초기화 허용, market 상태를 부가 반환.
- 운영자가 신뢰된 SQL Editor에서만 `update paper_private.market_control set enabled=false,reason='임시 휴장 확인 중' where id=true;`로 신규 체결 중단. 공식 상태 확인 후 enabled=true로 복구. 진행 중 주문의 shared row lock 해제 뒤 중단 적용, 이후 신규 체결 차단. 예외 휴장 자동 수집은 없으므로 운영자 확인 필요. 누락 일자 복구/연장도 검토된 migration으로만 수행. 프론트 롤백 시에도 서버 게이트는 유지.
- 로컬은 동일 계약으로 Web Lock 획득 후·저장 직전 검증. 기존 기록 복원/초기화는 시간 제한 없음. 브라우저 시각 조작 가능성을 명시하며 서버 보안과 동일시하지 않음. 테스트 시각 주입은 disposable DB 함수 교체/Playwright에서만 수행, 운영 코드에 우회 매개변수·버튼·GUC 없음.
- UI: 중앙 KST/ET·헤더 유지. 로컬은 브라우저 기준, 로그인 계좌는 snapshot의 서버 상태+monotonic 경과로 조기 차단(30초 경과/조회 실패 제한, 기존 15초 poll/focus 갱신). 최종 체결은 항상 서버 재검증. 장외 신규 검토 제한·기존 불확실 ID 재확인 허용. 분석·조회·차트·관심종목 및 USD/KRW 표시 전용 계약 유지.
- 검증: `python3 scripts/build-market-migration.py --check`, `python3 scripts/test-server.py`(Docker disposable PostgreSQL17), npm test/test:auth. 운영 DB 시각 변경 금지. 실제 smoke는 당시 장외 차단/격리만 검증하고 장중 체결·경계/장애/동시성은 격리 DB에서 결정론적으로 검증한다.

## v0.5-A 공급자 설계 (미구현)
- 승인된 설계: `docs/market-data/V0_5_A_PROVIDER_RESEARCH_AND_DESIGN_20261027.md`. 서비스 내 주식·ETF·지수의 외부 표시 권한 확인 전 실제 데이터 활성화 금지.
- 실제 시장정보·환율은 서버 관리형 별도 데이터 계층으로 구현하고 출처/관측/수집 시각/실시간성/권리/지연·오류를 표시. 합성값을 실제로 오표시하지 않으며 라이선스 미검증 시 fail-closed.
- v0.5-A에서는 기존 paper_prices, paper_order, paper_snapshot, USD 센트 금융 원장, 계좌 소유권/RLS/멱등성/시장시간 게이트 및 합성 계좌 손익을 변경하지 않음. USD/KRW 일별 기준율은 표시용이며 실시간 환전율/환차익이 아님.
- 본 항목은 설계만 반영. 운영 DB migration·공급자 인증키·Edge Function·실제 시세/환율 연동 및 코드 테스트는 미실행.

## v0.5-A 구현 브랜치 (운영 미반영)
- `src/marketData.ts`: 데이터 provenance/freshness 타입, Frankfurter 일별 USD/KRW 기준환율 유효성 검사와 서버 읽기 전용 클라이언트. 실제 주문가격 전달 불가.
- `supabase/functions/market-fx/index.ts`: 외부 Frankfurter v2 blended USD/KRW를 서버에서 조회, 10일 이상 오래된/잘못된 응답 거부, 인스턴스 내 6시간 성공 캐시, 타임아웃·503 오류. DB/계좌/민감키 호출 없음. 실제 배포는 별도 검증 필요.
- `MarketPanels.tsx`: 기존 합성 지표·가상 주문·USD 센트 원장 보존하면서 실제 참고환율을 별도 카드로 표시. `VITE_ENABLE_MARKET_FX=true`이고 서버 함수가 배포된 경우에만 읽기 수행. 미설정·오류·오래된 환율은 실값 표시하지 않음.
- FX 카드의 실제 값은 **읽기 전용**이다. KRW 표시 환율 1360원은 v0.4-C 합성 그대로 유지. '실제 원화 평가' 및 체결가 전환은 v0.5-B 이후 별도 금융 High 검증 필요.
- 공급자의 무료 실험 가능성과 제3자 가격/차트 재표시 권리는 별개이며, 권리 미승인 미국주식·한국지수 가격을 실제 시세로 공개하지 않는다.

## v0.6 직접 입력 모의거래·거래비용·세금·배당 — 설계 및 순수 계산 기반 (구현중)
- 확정 설계: `docs/finance/V0_6_MANUAL_ORDER_TAX_DIVIDEND_DESIGN_20261027.md`.
- `src/paperFinance.ts` 에 USD 센트 수수료(요율 basis points, 최소수수료), USD/KRW 고정소수점 환산, KRW 연간 순실현 양도차익 기본공제 250만원+국세 20%/지방세 2% 단순 **예상치**, 미국 주식 일반 배당의 ex-date 보유권리 및 기본 15% 원천세·지급일 예정액 **계산만 구현**.
- 이 모듈은 기존 `trading.ts`, `paper_order`, `paper_prices`, `paper_snapshot`, RLS, 원장, 장 게이트와 연결되지 않는다. 지금은 수기 주문·수수료 공제·배당금 입금 **동작하지 않음**. 자동 배당에는 확정 공시/서버 Cron/원자적 멱등 분개가 필수.
- v0.4/v0.5 기존 계좌는 비용 0·합성 체결가·합성 평가 상태 그대로 보존. 수기모드는 **계좌 분리** 후 검증되어야만 실제 사용 가능.

## v0.6-A 수기 주문 서버 체크포인트 — 운영 미적용
- `202610270004_manual_trading.sql`은 격리 DB에서만 검증한 초안. 별도 manual_accounts/orders/positions/ledger, 사용자당 초기자금 1회. 기존 paper_* RPC/자산/저장 형식은 변경하지 않는다.
- manual_order(request UUID, JSON)의 필수 8필드: symbol, side, quantity, priceCents, rateBps, minCents, source, observedAt(offset 포함). 사용자 소유자 지정 불가, 양수 정수·상한·출처·관측시각·잔고/보유 검증. 수수료 규칙은 요청과 함께 동결 기록, 매수 원가 포함/매도 실현손익 차감. 서버 수신·체결시각 별도 기록. manual_snapshot은 조회와 계좌 초기화 제공.
- 계좌 행 잠금, 요청별 멱등/내용 충돌, 기존 서버 시장시간 helper 사용·쓰기 전/후 마감 검사, 원자적 현금/포지션/주문/원장. 금융 직접 쓰기 금지·자기 행 SELECT RLS. 외부 시세/합성 평가값을 이 계좌에 공급하지 않는다.
- **전체 v0.6 미완료**: 서버 응답 재생 검증/프론트 어댑터·불확실 주문 복구·설정/주문 UI·외부 링크/평가가격·수수료/세금 화면·공식 세법 재검증·배당 공시 관리자/권리/Cron/멱등 지급/정정 감사/알림·신규 전체 통합 및 High 보안 검토가 남았다. 이 단계에서는 신규 기능을 화면에 정상 기능처럼 표시하지 않는다. 운영 migration 적용·main 병합·Pages 배포 없음.
- 재개: 이 브랜치에서 `VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true npm run build`, `npm test`, `npm run test:auth`, `python3 scripts/test-server.py`. 다음은 수기 원장 replay 검증/서버 클라이언트와 모드 분리 UI(B/C), 이어 공식 배당 입력/정정 및 서버 예약 지급(D), 세금/환율 증빙(E), 최종 통합/금융 High 검증(F). 운영 반영은 사용자 확인 후 별도 수행.

## v0.6-B/C 수기 클라이언트·UI (운영 미적용)
- manualAccount.ts는 JSON 정수·행 소유 계좌 ID·주문/원장 중복·순서 검증 후 현금/보유원가/평단의 기초값·실현손익/수수료/초기자금·거래 원장을 재생 검증한다. 불일치 원본은 ManualDataError.raw로 보존, UI에서 명시적 내려받기 가능. 서버/과거 기록 자동 수정 없음.
- 사용자별 pending ID+전체 요청을 전송 전에 저장. Web Locks로 협력 탭 직렬화, 신규 전송 전 snapshot token 비교. 응답 유실 후 동일 ID 재조회/재제출만 허용. unknown/충돌/검증실패는 pending 보존, 명확한 P0001 거절만 해제. 저장 실패 시 미전송. JWT를 요청 사용자에 고정, 컴포넌트 사용자 키/해제 가드로 이전 응답 노출 차단.
- 로그인한 사용자만 별도 수기 모드를 선택. home/detail/portfolio 계좌 영역을 분리하고 합성 원장/주문 함수는 변경하지 않음. 수기 가격/정수 주수/매수·매도/출처/offset 관측시각/자기신고 수수료(bp·최소 USD), 미리보기/검토/확정/취소/복구 제공. 장외에는 신규 주문 제한, 기존 ID 복구와 조회 허용. 서버 미적용 시 명시적 조회 실패·주문 차단.
- 모드·입력·평가가격은 manual 전용 사용자별 브라우저 키, 로그아웃/다른 사용자에 노출하지 않음. 평가가격은 별도 출처·관측시각 및 경과/24시간 오래됨 표시, 미제공 시 해당 평가/총액 미제공. 합성 시세/실환율 자동 대입 없음. 표시 통화와 무관하게 이 계좌 금액은 명시적 USD. 평가가격·draft의 기기 간 동기화는 후속.
- PC는 외부 시세/수기 주문 좌우, 모바일 단일 열. TradingView 공식 Advanced Chart script는 명시적 열기 후 로드, 사용자 가격 입력과 독립·지연/실패 안내 및 제공자 링크. 네이버 NASDAQ .O/SCHD.K는 종목 제목 확인, VOO 경로 미확인으로 연결하지 않음. 토스 8개 ISIN 공개 경로 HTTP200 확인(앱/지역/인증에 따른 최종 화면은 별도). 외부 DOM/내부 API/위젯 가격 추출 없음. 실시간 위젯 시세 정확성·권리 및 모든 외부 페이지 최종 렌더링 검증은 완료로 주장하지 않음.
- 수수료 정책 High 검토안은 기존 설계 문서 마지막 절: 계좌별 append-only 정책/version·서버 계산/정책 충돌·과거 수수료 보존. 현재 RPC는 자기신고 정책이며 조작 방지·친구간 공정 순위를 보장하지 않음. 독립 기기 stale review 원자 차단은 서버 revision/CAS 추가 필요. 이번 단계 SQL/RPC 변경/운영 migration/main/Pages 없음.
- 후속 D(배당): 공식 공시·관리자 검증/정정/권리 스냅샷/Cron·멱등 원자 지급·감사/알림. 후속 E(세금): 공식 근거 재검증/결제일 환율/연도·원화 취득원가·손익통산·공제/세후 분석. 기존 전체 v0.6 계약 보존, B/C UI는 배당/세금 완료로 표시하지 않음.

## v0.6-D 확정 배당·권리·예약 지급 (격리 검증 / 운영 미적용)
- `202610270005_manual_dividends.sql`: 별도 dividend_events/entitlements/credits/delivery_status와 private 관리자 allowlist·운영 중단·감사 테이블. `paper_*` 금융 원장/주문은 변경하지 않는다. 공식 공시는 실데이터 seed 없이 관리자 원문 검증으로만 등록한다. 8종목 발행사/운용사 HTTPS 도메인 제한, 지원 정규 거래일 ex-date 확인, 일자/단위/확인시각 및 버전 검사. 일반 regular_cash+표준 15% 검증만 자동 확정 가능, 특별/주식/due-bill/비표준 과세는 review.
- 관리자 권한은 서버 private.dividend_admins의 auth.uid allowlist. 브라우저/user_metadata 판단 없음. 공개 관리 RPC는 서버 권한 재검사·빈 search_path·일반 사용자의 직접 쓰기 차단. draft/confirmed/review/cancelled, 미지급 수정은 새 버전/감사, 지급 완료 이벤트 수정은 경제 필드 유지+review+요청 원문 감사. 보정 입금은 자동 생성하지 않는다. 일반 사용자는 확정 공시 및 자기 지급 참조 공시만 조회.
- 권리는 filled_at의 America/New_York 날짜가 ex-date보다 앞선 전체 거래 이력으로 재구성한다. ex-day 매수 제외/매도 권리 유지, 현 보유와 분리·늦은 등록 복원. 서버만 entitlement를 기록하며 버전 변경 시 미지급 권리를 재계산한다.
- private.settle_dividends: pg_try_advisory_xact_lock으로 중첩 scheduler 직렬화, 이벤트/운영 상태·계좌 잠금, 계좌별 subtransaction. 실패 시 권리/credit/잔고/원장 전부 롤백 후 SQLSTATE만 오류 기록, 다음 실행 재시도. 실패 계좌와 다른 계좌 지급 독립. 지급일 00:00 ET 이후 5분 주기 정책. gross=round(amount_units×quantity/100) 센트, withholding=round(gross×15/100), net=gross-tax(positive half-up). 0주/0원은 무입금 상태. UNIQUE(account,event)+ledger credit unique로 1회 지급. 실제 posted_at 별도. 공개 지급 RPC/프론트 민감키 없음.
- 운영 준비 SQL `supabase/operations/dividend-cron.sql`: pg_cron 설정된 DB의 신뢰된 owner가 5분 작업 등록, 관리자는 UI에서 운영 중단/재개(감사) 가능. 이번 실행에서 운영 extension/migration/Cron·main/Pages 적용 금지. 테스트 `python3 scripts/test-dividend-cron.py`는 disposable PostgreSQL17에 pg_cron 설치·1초 예약·브라우저 없는 자동 입금·반복·서버 재시작 검증 후 제거한다. 가상시계는 stock_test의 private fixture에서만 교체, 운영 시각 변경/공개 우회 없음.
- manual_ledger dividend_credit_id/FK/kind 추가. 클라이언트는 ledger ID 순으로 funding/trade/dividend를 재생, 지급 참조·세전/원천세/세후·권리수량/버전·계좌·지급일 확인. 배당 후 자금으로 매수 가능. 기존 trade-only snapshot 호환, 불일치 원본 보존/성공 오표시 금지. 현금/포지션/실현손익/거래 수수료 재생 검증 유지.
- 사용자 UI: 공식 일정/권리/예상 gross-tax-net·입금 예정/실제시각·오류/보류·누적 세전/세후·원천세·종목/출처·입금 알림. 새 로그인/기기에서 서버 snapshot으로 복원, synthetic 경제 발표로 변환하지 않음. 관리자 등록·확정·선택 수정/취소·중단/재개·감사 화면. 알림은 원장 기반 지급 요약이며 Web Push/이메일/기기별 읽음 동기화는 미구현.
- v0.6-E: 공식 세법/결제일 환율/연도별 양도차익·세액/세후 분석. F: 전체 수기·정책/CAS·배당·세금 금융/보안 High 검토 및 사용자 확인 후 운영 반영. 기지급 정정의 보정 분개는 수동 검토/별도 설계 대상으로 유지, 묵시적 재입금 금지.

## v0.6-E 원화 세금·결제·세후 분석 (운영 미적용)
- taxAnalysis.ts 독립 BigInt 엔진: USD 원장/평단·수수료·배당 수정 없음. 매수별 원화 원가+매수비용 포함, 매도비용 1회 차감, FIFO/이동평균 잠정 정책 분리, 일부/전량 원가 배분·연도별 이익/손실/경비 집계. 배당·원천세·미실현은 양도세에서 제외. 외부 공제 전 손익/이미 사용한 공제는 해당 외부이익 내에서만 입력, 연간250만원 공제 중복 방지. 국세20/지방2 모델은 교육용 가정·원 단위 half-up이며 실제 기납부/다른 세율 예외는 미반영.
- 일반 T+1은 기존 NYSE+추가 연방은행 Columbus/Veterans 휴일의 보수적 합집합, us-t1-conservative-2026-27-v1. 거래/결제 달력이 동일하다고 가정하지 않는다. 2026-12-31→2027-01-04 예상, 2027말 이후 미확인. 서버 filled_at/뉴욕 거래일 보존, 증권사 명세에 따른 confirmedSettlement·근거 별도 기록. 실제 한국 신고 귀속일이 뉴욕 예상일과 다를 수 있어 연말 명세 확인 필수.
- 법정 환율 API/이용권한 미확보로 자동 FX 없음. 사용자 입력 date/rate(6자리 고정소수)/기준·재정 종류/기관/HTTPS원문/확인시각/자기신고 확인상태 기록. 결제일·수수료 지출일과 각 FX 기준일 일치 필요. 누락/오류/Frankfurter·합성 환율 거절, 90일 경과 확인은 재확인 경고. 모든 결과 잠정치, 사용자 원문 확인은 서버 공인 인증이 아니다.
- manual_tax_documents + manual_tax_snapshot/save(202610270006 초안): 기존 계좌/금융/배당 원장 쓰기 없음, 자기 계좌 RLS/SELECT-only·인증 UID 강제·빈 search_path. 문서 전체 append-only 정책/달력 버전+출처 스냅샷, 계좌 잠금+expected_version CAS+request 멱등/내용 충돌, 과거 버전 정정은 새 버전만. 서버가 원문 진위/세액을 인증하지 않는다. 정책/달력 버전 불일치·원본 응답 불일치는 오류 보존.
- 수기 전용 TaxPanel: 연도/정책/외부 입력·거래별 예상/확인 결제일·각 비용 FX 근거·실현 상세·공제/국세/지방세/합계·이력/정정·임시 보관·동일 ID 복구. 확정 거절은 초안 보존 후 최신 revision 재조회, 불확실한 전송은 입력 잠금·같은 ID 유지, 저장소 손상은 원본 보존/새 저장 차단. 앱 원화 매매 성과의 예상세 전/후는 외부 입력 없을 때만 표시; USD 배당/원천세/순입금과 분리, 기납부 미반영 참고부채이며 현금 미차감. 현재 전체 총수익률/금융소득종합과세/외국납부세액공제는 별도 검토.
- 공식 확인 URL·확인일·적용 범위/미확정 항목은 기존 금융 설계 E절. 국세청20%/250만원·5월신고/일반 대금청산 원칙 및 SEC T+1·Fed 은행휴일은 확인. 지방세 조문/외화환산 조문·FIFO/평균 법적 적합성·완전 DTCC 달력은 이번 환경에서 완전 확인하지 못해 잠정 제한. 2027 선택은2026 가정 모델 비교이며 해당 연도 개정 미검증.
- F 재개: 본 브랜치에서 수수료 서버 정책/주문 다기기 revision CAS, 법정 외화환산·원가/국내통산 예외/한국 귀속일·결제 달력/합법 FX출처, 전체 RLS/배당/세금 통합 High 감사. 운영 migration/Cron·main/Pages 적용은 사용자 승인 전 금지. 검증 명령: `VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true npm run build`, `npm test`, `npm run test:auth`, `python3 scripts/test-server.py`, `python3 scripts/test-dividend-cron.py`.

## v0.6-F 금융·보안 감사 (격리 검증 / 운영 전환 별도 승인)
- 감사 근거/위험 목록/적용·복구 절차: `docs/finance/V0_6_F_AUDIT_20261027.md`. 이전 B/C의 자기신고 수수료·서버 CAS 미구현 계약은 본 절로 대체한다. 기존 체결·배당·세금 문서 원본과 paper_* 계좌는 변경하지 않는다.
- 007 migration: 계좌별 append-only manual_fee_policies와 별도 private.finance_admins, 초기 예시10bp/최소0. 정책 변경은 승인 allowlist+expected_version+감사 사유. 과거 주문의 정책 version은 NULL 그대로, 신규 주문만 확정 정책 참조. 개인 사용자의 임의 수수료 변경/직접 테이블 쓰기 금지.
- manual_order_v2는 계좌 잠금 후 서버 revision/CAS·활성 정책·JSON 타입/8KB·안전 gross 검사 후 기존 시장 gate/원자 금융 계산을 실행한다. 주문/배당/정책 변경이 revision을 증가시킨다. 기존 ID는 오래된 revision·장외에도 같은 payload 재조회, 다른 내용 충돌 유지. 구형 manual_order는 기존 ID 조회만 허용하여 신규 쓰기 우회 차단. 내부 execute 함수의 클라이언트 권한 회수/빈 search_path 유지.
- manual_snapshot에 revision/현재 정책/정책 이력 추가. 클라이언트는 정책/수수료/현금·원장·배당 권리를 재생 검증. 구형 snapshot 조회는 유지하되 신규 주문 차단. 서버 확정 거절은 입력 보존·최신 계좌 갱신, 미확정은 같은 ID/pending 보존. 수수료는 서버 정책 read-only.
- 배당은 현재 현금뿐 아니라 누적 gross/withholding/net의 센트 안전 상한도 검사하고 초과 지급은 계좌별 전체 롤백/error·재시도 상태. 큰 수수료로 순금액만 안전해지는 gross 초과 주문도 거절. 실현손익 중간 차감 BigInt. 과거 지급 자동 보정·원장 수정 없음.
- 세금 저장2MB/중첩 타입·크기·외부 공제 한도, 환율 확인일 UTC 검증 보강. 외부 공제 전 순이익/공제 사용분을 분리하고 연250만원 공제를 한 번만 적용한다. FIFO/평균 및 한국 세법·명세 미확정 범위는 E의 교육용 잠정 모델로 유지. USD 배당/매매와 KRW 세액 혼합 금지.
- spotlight는 scroll/다음 프레임 후에만 대상 좌표를 공개하여 기존 간헐 픽셀 실패의 경합 수정. 기존 UI 전체 재설계 없음.
- 게이트: disposable PostgreSQL17의 기존 금융/RLS/중복·동시 주문/배당·세금 검사, v2 2사용자·2독립 연결 CAS, 실제 SQL snapshot→클라이언트 replay, populated004→007 금융 해시 보존/실패 rollback, clean install, 실제 격리 pg_cron 자동/반복/중단/재시작/재개 검증. 독립 연결 검사는 실제 두 물리 기기/운영 Auth 검증을 대신하지 않는다.
- 운영 DB migration·실운영 Cron·main·Pages는 이번 실행에서 금지. 실제 Advisor/운영 이력·백업/두 초대 계정 기기 smoke와 별도 사용자 승인 전 운영 전환 NO-GO. 공개 프론트의 새 비밀키 불필요, DB/관리 키는 trusted operator 환경에만 보관. 단계별 전환/중단·복구는 감사 문서 참조.
- 재검증: `VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true npm run build`, `npm test`, `npm run test:auth`, `python3 scripts/test-server.py`, `python3 scripts/test-dividend-cron.py`. `supabase/operations/finance-audit-check.sql`은 별도 승인된 설치 뒤 읽기 전용 운영 검사 준비물이며 Advisor 대체가 아니다.

## v0.7-A1 차트 실습실 UI 체크포인트
- 학습 상단에서 자체 합성 일봉 차트, 초급·중급·고급 설명, 선/캔들, 5·20·60봉 SMA와 별도 RSI(14) 표시를 제공한다. RSI 30·70은 참고선이며 매매 신호가 아니다. 차트는 생성 후 해제하며 실제 시세나 수기 주문에 전달하지 않는다.
- 기존 종목 상세 합성 차트와 금융 데이터 계약은 유지한다. 거래량, 지지·저항 실습과 종목별 차트 이전은 후속 단계다.

## v0.7-A1b 단계별 차트 실습
- 초급은 가상 OHLC·양봉/음봉·결정론적 가상 거래량과 마우스 차트 선택 및 키보드/터치 봉 선택을 제공한다. 가격과 거래량의 방향은 필연적으로 일치하지 않는다.
- 중급부터 5/20/60봉 SMA의 범례·선택 봉 값과 사용자 지정 지지/저항 후보선을 제공한다. 고급에서는 별도 RSI(14) 패널·0~100 축·30/70 참고선과 선택 봉 값을 추가한다. 낮은 단계에서는 상위 지표를 숨기고 재진입 시 기존 선택을 복원한다.
- 모든 데이터는 학습용 합성이며 주문·실제 시세와 분리한다. 종목 상세 차트 이전은 A1c 후속이다.

## v0.7-A1c 합성 차트 학습실 통합
- 종목 상세의 합성 차트를 학습탭으로 이전하고 기존 외부 시세 확인 컴포넌트 및 종목별 학습실 링크를 제공한다. 확인되지 않은 네이버 VOO 링크는 계속 숨긴다. 외부 가격 추출·새 시세 API 없음.
- `#learn/{symbol}`은 8개 기존 합성 시나리오를 선택하며 새로고침·뒤로 가기를 지원한다. 1·5·15·30분, 1시간, 일·주·월은 기존 chartRows와 chart.period 설정을 사용한다. 선택 종목/주기의 마지막 봉을 초기 표시하고 SMA/RSI를 해당 봉으로 계산한다. 분봉 시각은 뉴욕 현지 시각이다.
- 종목 전환 시 선택 봉과 지지·저항 후보를 초기화하고 지표의 표시 선택은 유지한다. 저장 실패 시 기존 차트 주기 보관값을 보존한다. 실제 시세·수기 주문가격과 합성 학습 데이터는 독립이다.
- 기존 금융 계산·원장·RPC·DB는 변경하지 않는다. 실제 기업 사례(A2)와 상세 기업 분석(B)은 후속이다.

## v0.7-B0 외부 시세 중복 생성 정리
- 종목 상세의 외부 시세는 합성 모드에서만 생성하며, 수기 모드는 ManualWorkspace의 기존 인스턴스를 사용한다. 기존 수기 상세 CSS와 금융 흐름은 그대로 유지한다.
