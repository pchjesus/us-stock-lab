# US Stock Lab v0.6 — 직접 입력 모의거래 / 수수료 / 예상 세금 / 배당 설계
작성: 2026-10-27 · 상태: **설계 + 분리된 순수 계산 모듈** / 서버 가상거래 변경 미착수
기준 main: `e9c4ab18c8756b40282c27cbdd9c631689bd8579`

## 0. 목적과 한계
- 개인 및 3~4인 초대형 모의투자. 절대 실제 증권계좌/현금/주문망 연결 금지.
- 사용자가 외부 TradingView/네이버증권/토스증권에서 가격을 **보고** 수기로 USD 가격·정수 수량을 기입한다. 외부 사이트의 DOM/비공식 내부 API를 자동으로 추출하지 않는다.
- 기존 서버 모드(`paper_prices` 합성시장가/기존 원장)는 이미 사용자 데이터가 있으므로 그대로 유지. 신규 거래 모드는 별도 계좌 세대 및 서버 RPC로 구현한다.
- '수기 참고 체결가'는 실제 거래소 체결·최우선호가·자동 보정 가격이 아니다. 분봉을 나중에 조회해서 이력을 조용히 수정하지 않는다.
- 과세는 **한국 거주자 일반 과세계좌의 2026년 단순화 예상치**, 실제 세무신고가 아니다. 계좌 밖 거래·타 금융소득·다른 증권사/외환 거래 내역은 포함하지 않음.

## 1. UX
- 종목 상세: 좌측 공식 TradingView **표시용 위젯**(지연 표기, 약관 확인) 또는 외부 종목 URL; 우측 '직접 가격 입력' 거래 카드. 모바일은 외부 링크→돌아오기 중심.
- 사용자가 출처(TradingView/네이버/토스/직접확인/기타), 확인 시각(KST / ET 및 UTC 변환), 입력 USD 단가(센트), 수량을 직접 입력. 확인 모달에는 수기 입력/가상주문 고지.
- 외부 페이지를 임의 iframe으로 강제 삽입하지 않는다. 브라우저 팝업 차단, X-Frame-Options, CSP를 존중한다.
- 1~2분 지연 허용은 사용자 기록상의 수기 거래로만 표현. 급등락 구간 오차를 자동 보정하지 않음. 주문 시각은 **서버 수신/체결시각** 별도 저장, 관측시각은 주장하지 않은 서버 시간이 아님.
- 수수료 유형: 기본 0% (기존 합성 계좌만), 신규 수기모드 추천 0.1% 또는 0.25%, 최소 수수료 개별 설정(0.07% 등 1bp 정밀도); 매수·매도 양쪽, SEC/FINRA 규정비용은 연도·거래량에 따라 별도 버전 계약 없으면 0/미포함 명시.
- 포트폴리오: 평단/평가손익/실현손익/현금, 누적 수수료, 연간 *예상* 양도세, 배당 총액/원천세/순입금 분리. 수기 모드의 현재가는 '최근 사용자가 갱신한 기준가격', 시각과 경과 함께 표시. 장기간 미갱신이면 최신 평가처럼 표시하지 않음.

## 2. 금융·세금 계약
- 내부 USD 센트 `bigint`, KRW 원 단위 정수, 수수료 및 15% 원천징수 round half-up cents. 가격/수량은 유효성·허용 상한·계좌 잔고·시장 게이트 서버가 검증.
- 매수 총현금감소 = 가격×주수 + 매수 수수료. 매입원가에 수수료 포함. 매도 실현손익 = 매도금액 - 매도수수료 - 매도대응 취득원가. 포트폴리오 평균원가 분배와 별도로 세법상 취득원가 계산 방식(FIFO/이동평균 등) 실제 증권사 신고방식 확인 필요.
- 연간 해외주식 양도세 단순계산:
  `예상과세표준=max(0, Σ(양도가액-취득가액-비용) KRW - 2,500,000)`
  `예상소득세=과세표준×20%; 예상지방세=과세표준×2%`.
  세액은 원 단위 단순 반올림의 교육용 추정. 매도 때 세액을 원장에서 즉시 공제하지 않는다. 전년도 귀속분의 납부안내는 통상 다음 해 5월(휴일 이월 가능).
- **원화 환산은 매수·매도 결제일 환율을 각각 사용**해야 함. 현재 USD/KRW 표시용 Frankfurter 혼합 기준환율은 거래 결제일 국세청 신고 기준율의 대체물이 아니다. 공식 결제일 기준 환율·증권사 명세 확보 전 세금 숫자를 '미확정 추정치'로 표시.
- 국내 과세대상 주식과 손익통산 및 공제 중복 사용, 투자자의 거주자 지위·금융소득종합과세·특별 분리과세 등은 앱 단독으로 완결할 수 없음.
- 미국 배당 원천징수: 한국 거주 일반 개인의 W-8BEN 등 조약적용된 통상 현금배당 **15% 가정**. MLP·REIT 일부·특수 배당·원천지 등에 예외 존재. 한미 조약에 따른 원천징수는 미국 측이며, 국내 연 금융소득 >2,000만원 등 별도 세법 판단 필요.
- 수기모드에 독립 수수료 버전(`rate_bps`, `min_fee_cents`, `effective_at`) 부여. 변경 후 과거 거래 재계산 금지.

## 3. 배당 권리 및 자동 지급
- **배당락일(exDate) 전에 보유한 수량**으로 권리 확정(미국 거래일, America/New_York). exDate 장중 신규매수는 미자격, exDate 이후 매도해도 기존 권리는 유지. 대규모 특별배당·due bill·분할·주식배당은 일반 규칙 적용 금지, 운영자 검토 대기.
- 확정 공식 공시에서 `symbol,ex_date,record_date,pay_date,USD per share(소수 4자리 이상),announcement/source URL,revision/version,status=confirmed` 저장. ETF 분배금 금액을 전기와 똑같이 추정해 자동 지급하지 않는다. 종목별 기업 IR·ETF 운용사 원문을 우선하며 API의 자동 수집 권한은 별도 확인.
- 지급일: `gross=eligible_shares×per_share`, 원천세 별도 원장, `net=gross-tax`를 USD 가상현금에 가산. 15% 모델은 기본값이며 특별 종목 예외 플래그.
- **브라우저가 닫혀 있어도 입금**: Supabase Cron + 신뢰된 서버 함수/DB 트랜잭션으로 지급일 정해진 ET 시간 이후 정산, 정지/실패 시 재시도. 서버 스케줄 지연 가능하므로 '지급일 처리 / 최대 다음 재시도 시 반영'으로 문구 정직하게 표기.
- **멱등성**: `unique(account_id,dividend_event_id)` 및 원자적 `insert ... on conflict do nothing` 뒤 1회만 현금/세금 ledger 반영. 계정 잠금; 실패 시 전체 롤백. 데이터 수정 공시는 신규 revision/정정 이벤트 별도 저장, 이미 지급한 항목 사후 무단 수정 불허.
- 권리 계산은 **배당락 전날까지 체결된 거래 로그**를 재생한다. 현재 보유수량만으로 역산하면 배당락 이후 매도 사용자에게 누락이 생김.
- 권리 발생(예정/확정) → 배당락일 권리 기록 → 지급 예정 → 지급 완료(가상 원장/알림) → 정정 필요의 상태 구분.
- 차후 DRIP(배당 자동재투자) 선택: 지급 분개 후 별도 사용자 의사에 따른 신규 모의주문만, 기본 자동 매수 금지.

## 4. DB 초안 — **마이그레이션 미실행**
신규 일반 합성 `paper_accounts`의 원장 계약을 변경하지 말고 수기 거래 계정 버전 2 스키마 및 새 RPC를 따로 설계.
- `manual_accounts`(user_id FK, starting USD cash, fee_policy, tax jurisdiction, status)
- `manual_orders`(account_id,request_id unique, symbol, user_price_cents, fee_cents, value_cents, price_source_label, observed_at_utc, filled_at_utc, version, side, quantity)
- `manual_positions`(account_id, symbol, quantity, usd_basis_cents, ...)
- `manual_ledger`(entry_id, account_id, order_id nullable, dividend_credit_id nullable, kind, usd_delta_cents, balance_cents, ...)
- `dividend_events`(source official, source_time, ex/pay dates, share amount units, confirmed, retracted/exception flags, version)
- `dividend_entitlements`(account_id,event_id,eligible_quantity,recorded_at)
- `dividend_credits`(account_id,event_id UNIQUE,gross_cents,withholding_cents,net_cents,posted_at)
- `fx_settlement_quotes`(rate_date, source licensed, KRW per USD fixed-point, fetched/validated timestamps, immutable used snapshot).
- 새 금융 테이블 user-linked RLS (owner only SELECT; NO direct client INSERT/UPDATE), RPC `security definer` 최소 권한, immutable/explicit search_path, server auth.uid assertion. Scheduled server function secret-only, no public write and no publishable privileged code.

## 5. 개발단계 및 배포 게이트
1. **v0.6-A 현재**: 독립 순수 계산 `src/paperFinance.ts` 및 테스트. 실서버 DB/원장/UI/Pages 변경 없음.
2. v0.6-B: 새 서버 계좌 모드, 소유권·RLS/멱등성/장시간 확인·수기 가격+수수료 원장, 오류/회귀. SQL migration은 격리 DB에서 먼저 검증.
3. v0.6-C: TradingView 공식 위젯 또는 외부 서비스 링크, 수기 주문 UI 및 표시기준가/시각. 모바일·접근성 테스트.
4. v0.6-D: 배당 확정 공시 입력/검증, 배당권리 스냅샷, Cron 자동지급, 실패 재시도/중복/정정/계좌격리 시나리오, 지급 확인 알림.
5. v0.6-E: 정식 세금 예측/연도별 KRW 환산/외환 결제일 증빙/수수료 연혁/실현·배당 구분 및 세후 수익률, 사용자별 세금 설정. 계산 근거를 언제든 확인 가능한 상세 명세 UI.
6. 마지막 High finance+security review: 기존 v0.5-A 80개 회귀 테스트, 새 서버 PostgreSQL/트랜잭션+RLS 테스트, 장중/장외/조기폐장, 2명 계좌 분리, 2개 탭 동시 클릭, 서버 재시작/cron 중복 지급/오류 정정, 모바일 UI; main 반영 전 PASS 요구.

## 참고 기준 (APA 7th, URL)
- 국세청. (2026). *2025년 귀속 양도소득세 신고 안내 및 국외주식 세액계산*. https://nts.go.kr/nts/na/ntt/selectNttInfo.do?mi=&nttSn=1350890
- 국세청. (n.d.). *신고납부기한*. https://ems.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7708&mi=2309
- National Tax Service. (n.d.). *국외주식 양도소득세 세율*. https://sc.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7711&mi=2312
- U.S. Securities and Exchange Commission. (n.d.). *Ex-dividend dates: When are you entitled to stock and cash dividends*. https://www.investor.gov/introduction-investing/investing-basics/glossary/ex-dividend-dates-when-are-you-entitled-stock-and
- United States & Republic of Korea. (1976). *Convention for the avoidance of double taxation, Article 12 (Dividends)*. https://www.forvismazars.com/kr/en/insights/korean-insights/korea-tax-treaty/the-united-states-of-america-korea-tax-treaty
- Supabase. (n.d.). *Scheduling Edge Functions*. https://supabase.com/docs/guides/functions/schedule-functions

## B/C 수수료 정책 High 검토안 (운영 RPC 변경 없음)
- 현재 manual_order의 rateBps/minCents는 자기신고 값이다. 브라우저 검증은 조작 방지가 아니며 UI는 실제 증권사 고정 요율/친구간 공정 순위로 표현하지 않는다. 거래 payload의 과거 수수료는 불변 유지.
- 후속 서버 계약: manual_fee_policies(id,account_id,version,rate_bps,min_fee_cents,effective_at,created_at) append-only, unique(account_id,version). 계좌에 current_fee_policy_id FK. 자기 계좌만 SELECT, 금융 클라이언트 직접 쓰기 금지. 사용자 정책 변경은 별도 제한 RPC에서 계좌 잠금·검증·새 버전 삽입; 과거 정책 UPDATE/DELETE 금지.
- 새 주문은 fee_policy_id/version만 전달, 서버가 계좌 소유권/정책 버전 일치·유효시각 검증 후 fee 산출. 주문에 적용 정책과 실제 fee 불변 저장. 정책 변경 이후 오래된 확인은 policy_conflict로 재검토. 기존 ID 재조회는 정책 변경/장외에도 기존 체결 반환. 기존 자기신고 주문 재계산·강제 이관 금지.
- High 집중 검증: 정책 변경/주문 경쟁, 두 기기의 stale review(CAS 계좌 revision) 차단, 최소수수료가 매도대금을 넘는 경우, 수수료 상한/원가 분배·JS 안전 범위, snapshot replay와 배당 원장 통합. 현재 클라이언트는 Web Locks+사전 snapshot 비교로 협력하는 탭을 직렬화하지만, 독립 기기의 사전조회 이후 발생하는 경쟁까지 CAS로 차단하지는 못한다. 서버 잔고/수량 잠금 검증은 유지된다.
- 배당 D·양도세 E 계약은 위 2~5절 전체를 그대로 유지. 정책/배당/환율 migration은 격리 통합 검증 및 High 리뷰 후에만 운영 적용.

## E 공식 근거 확인 기록 · 2026-10-27 (적용 모델: 2026 / 2027은 잠정 비교)
- 국세청 공식 세율 안내: https://sc.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7711&mi=2312 — 본문 국외주식등(소득세법104①12) 외국법인 일반 주식 20%, 중소기업 내국법인 국외상장 예외 10% 구분 확인. 외국법인을 일반 10% 대상으로 오인하지 않는다.
- 국세청 주식 세액 흐름: https://sc.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7709 — 취득가액+양도비용 필요경비, 주식 장기보유공제 미적용, 연간 기본공제 250만원 확인. https://sc.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7708 — 국외주식 예정신고 면제/다음 해5.1~5.31확정, 토·일·공휴일·근로자의 날 다음 날 이월 확인.
- 국세청 개요/계산요령: https://sc.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7707 및 https://sc.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=8639 — 원칙 대금청산일, 실제 증빙 취득가액/필요경비 일반 원칙 확인. 이 문서가 모든 해외주식 원가/외환 예외를 확정하는 근거는 아니다.
- SEC 공식 T+1: https://www.sec.gov/resources-for-investors/investor-alerts-bulletins/new-t1-settlement-cycle-what-investors-need-know-investor-bulletin — 대부분 broker-dealer 거래가2024-05-28부터 T+1, 예외 있음 확인.
- 미 연준 은행 휴일: https://www.federalreserve.gov/aboutthefed/k8.htm — 2026~2030표, Columbus/Veterans Day 및 토요일 휴일 때 연방은행이 직전 금요일 영업하는 규칙 확인. 기존 NYSE 달력과 다르다. DTCC 완전한 결제 달력은 미검증이므로 NYSE+은행 추가휴일 합집합을 **보수적 예상**(us-t1-conservative-2026-27-v1)으로만 사용한다. 실제 명세의 결제일을 별도 기록, 2027말 이후는 미확인 처리.
- 미확정: 지방세법103조의3·소득세법시행령162/178조의5 조문 접속이 실패하여 2026 개정·외화환산 상세·지방2%·FIFO/평균의 법적 적용을 이번 실행에서 완전 검증했다고 주장하지 않는다. 기존20%+2% 일반 모델은 **교육용 가정**. 국내/국외 과세대상 주식의 통산/공제 공유는 모든 국내주식을 포함한다는 뜻이 아니며 대주주/비상장/예외·거주기간·명세에 따른 전문 검토 필요. FIFO와 이동평균은 독립 정책 선택으로 비교하며 확정 신고 방식으로 표시하지 않는다.
- 환율: 서울외국환중개 https://www.smbs.biz/ 의 고시 기준율/증권사 법정 환산 명세를 사용자 근거로 기록할 수 있다. 이번 환경에서 상세 고시 페이지 접속 실패·공식 API/재배포 권한 미확보, 자동 조회 없음. Frankfurter/1360원 대체 금지. 고시기관·기준/재정 종류·금액·기준일·URL·확인시각을 필수 기록하고 document_reviewed도 사용자 확인일 뿐 서버 인증이 아니다. 지출일이 다른 비용은 별도 feeDate/feeFx, 과거 기록은 append-only 버전.
- 연말 귀속은 기본 뉴욕 예상 결제 날짜 기준. 한국 신고용 실질 결제·귀속일과 차이가 있으면 명세 근거 confirmedSettlement 기록 후 계산, 미확인이면 잠정. USD 평균원가·실현손익/현금·배당과 독립, 매수비용 원가 포함+매도비용 별도 1회 차감. 배당/미실현은 양도세에서 제외.
- 외부 입력은 연간 기본공제 전 순양도차익과 그 범위 내 이미 사용한 공제. 외부 사용공제를 합산소득에서 한 번 반영하고 남은250만원 한도만 추가 공제하여 중복 사용 방지. 기납부세액/타 소득·외국납부세액공제/금융소득종합과세는 계산하지 않는다. 추정 연간 합산세액은 실제 미납세액이 아니다.
