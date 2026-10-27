# US Stock Lab — v0.5-A 데이터 공급자 조사·전환 설계
> 2026-10-27 (KST) · **설계만 확정, 실제 공급자/시세 연동 및 운영 DB 변경 미실행**
>
> 기준 main `154a9f4714c472b85ec7711ca5ccc43e3b10cb9d`. GitHub compare 결과 동일. 개인 개발 후 친구 3~4인 비공개 파일럿. 실거래·실증권계좌 연결·자금이동 영구 금지.

## 1. 현재 코드에 근거한 상태
- `src/data.ts`: AAPL/MSFT/NVDA/AMZN/GOOGL/VOO/QQQ/SCHD의 결정론적 합성 OHLC 및 마지막 캔들 가격. 8주기 차트는 표시 전용.
- `src/marketInfo.ts`: `Indicator`, `MarketInfoService`, demo/pendingOfficial 경계 존재. 기존 `DataStatus`는 synthetic/official/pending만으로 지연·권리·오류 표현 부족.
- `src/accountStore.ts`: 비인증 로컬 거래는 `marketPrices()` 합성 USD 센트. 브라우저 잠금/장시간 확인/원본 유지.
- `src/serverAccount.ts`: `paper_snapshot`이 `prices`를 반환하고 브라우저에서 원장을 재생 검증. `paper_order` 요청에 가격을 포함하지 않음. 응답 유실 시 동일 주문 ID로 재확인.
- `supabase/migrations/202610270003_market_hours.sql`: `paper_order`는 서버의 `public.paper_prices.price_cents`를 직접 읽으며 서버 시각·시장 일정 검증, 계좌 행 잠금·금융 원장을 동일 트랜잭션으로 처리.
- `src/TradingUI.tsx`: 시장/체결/계좌 평가 및 합성 가격 표시가 현재 서로 연결됨. 신규 '실제 시장정보'를 무심코 이 경로에 주입하면 기존 합성원가에 시장가격을 혼합하게 됨.
- **결정**: v0.5-A에서 서버 `paper_prices`, `paper_order`, `paper_snapshot`, 현금원장, RLS, 인증, 로컬 기록 포맷은 변경하지 않는다.

## 2. 공식 제공자 후보 및 약관 (확인일 2026-10-27)
| 대상 | 후보/공식 근거 | 무료 이용한도·갱신 | 3~4명 친구 앱 외부 표시·저장 판단 | 상태 |
|---|---|---|---|---|
| 미국 주식·ETF | Twelve Data Basic [1-3] | 8 API credits/min 및 800/day, 미국 주식·ETF 실시간 일부 거래소만 포함(시장전체 통합시세 아님) | Basic은 **internal non-display**. 외부 표시/재분배는 별도 사용권 필요; 무료 친구 웹앱 재표시 허용으로 간주 불가 | 미승인 |
| 미국 주식·ETF | Massive(구 Polygon) Stocks Basic [4-5] | 무료 5 requests/min, end-of-day, 2년 이력 | Individual 약관은 개인 사용. 사용자/타인에게 보여주면 재배포이며 Business 승인 필요 | 미승인 |
| 미국 주식·ETF | Alpha Vantage [6] | 표준 무료 25 requests/day, 기본 종가; 미국 실시간·15분 지연은 유료 | 외부 표시 계약/캐시 권한 불명확. 승인 전 사용 불가 | 미검증 |
| 미국 주식·ETF | Finnhub [7] | 무료 개인용 제한 API | 친구 대상 외부 표시·저장 권한 공식 확정 전 보류. 상용/배포 권리 미가정 | 미검증 |
| S&P 500·Dow·Nasdaq Composite | FRED API [8-9] | 일별 지수/경제 시계열 | 각각의 원천 소유자 권리가 적용. SP500은 Copyrighted: Pre-Approval Required. Nasdaq·Dow도 시리즈별 확인. FRED 무료=지수 재배포 허가 아님 | 미승인 |
| KOSPI·KOSDAQ | KRX OPEN API [10-12] | 일별, 10,000 req/day; 인증키·활용 승인. 실시간 아님 | 약관 제6조 비상업적, 제10조 출처표시, 제11조 '제3자에게 제공할 수 없다'. 친구 표시 허가 없이는 미활성 | 미승인 |
| USD/KRW 일별 기준 | Frankfurter v2 [13-15] | 무료·키 불필요·일 단위 중앙은행 기준율; 공개 API에 일일 호출 총량 제한 없고 남용 방지 rate limit | blended rate는 자체 집계로 재사용 가능하다고 명시. **특정 중앙은행 직결 provider rate는 원천 약관을 따라야 함**. 내부 규정 확인 후 표기 | 1순위 |
| 기준환율 원천 | ECB [16] | 통상 영업일 유럽 시간 오후 갱신. EUR 기준 USD·KRW | 매매 실행가격 아님; 정보 제공용 기준율. 데이터 사용권·출처표기 준수 | 참고 |

**중요**: 공급자가 API 호출을 허용하는 것과 다른 사용자에게 시세/차트를 게시할 권리는 별개이다. GitHub Pages URL은 공개 접근 가능하고 Auth 초대 제한만으로 공급자 라이선스 문제를 해소하지 않는다. 유료 플랜 자동 결제/유료 업그레이드 금지. 공급자 이용약관·캐시 보존기간·거래소별 feed·표시지역·외부 사용자 수 범위를 승인 기록으로 남긴 뒤 활성화한다.

## 3. 데이터 계약과 UI
기존 타입을 파괴하지 않고 별도 도메인 모듈(예: `src/marketData/`)에 정규화:
- `kind`: equity | etf | index | fx
- `symbol`, `currency`, `priceDecimal` (정수 센트 적용은 체결 엔진에서만), `ohlc?`, `interval`
- `observedAtUtc` (시장 관측 시간), `fetchedAtUtc` (수집 시각), `sourceName`, `sourceUrl`, `providerId`, `feedScope`
- `freshness`: realtime_claimed | delayed | end_of_day | daily_reference | stale | unknown
- `delayMinutes?`, `asOfSession?`, `verifiedDisplayRight`: boolean, `licenseRecordId?`
- `status`: licensed | synthetic | unavailable | stale | pending (현재 `marketInfo.ts` 타입과 호환 어댑터)
- `fx`: base USD, quote KRW, 기준일, rateDecimal (계산용 decimal string), method blended/ECB, source

UI 문구 원칙:
1. **합성**, **실제·지연**, **실제·전일 종가**, **중앙은행 기준환율**, **갱신 중단/지연**을 구분. 관측시각과 수집시각 분리.
2. 장중이라도 EOD 데이터를 실시간으로 표시하지 않는다. Nasdaq Composite(종합지수)와 Nasdaq-100/QQQ를 혼동하지 않는다. ETF 가격을 S&P 500 지수로 대체하지 않는다.
3. 시장 실제 가격과 가상 주문 합성 체결가격을 나란히 표시할 경우 출처·기준시각과 차이를 명시. 실제 시세처럼 보이는 가상 체결 표기 금지.
4. 권리 미승인·응답 지연·레이트리밋·휴장·이상치면 공식값 대신 **데이터 미제공/이전값·관측시점** 표시. 합성 데이터로 묵시적 대체 금지. 데모 모드일 때만 합성 배지.
5. UI 정보 위계·접이식 사이드바·8주기·튜토리얼 보존. 결측 기간에 캔들을 생성하거나 타 시세와 보간 금지.

## 4. 서버 관리형 공급 구조
```
[외부 공급자 (권리확인된 데이터만)]
           |
           v
[Supabase Edge Function: ingestion adapter / validation]
           |
           v
[분리된 읽기전용 시장 관측치 캐시 + source/license metadata]
           |
           v
[React MarketInfoService / 기존 chart adapters]
           X
[public.paper_prices -> paper_order -> 현금원장]
```
- v0.5-A 변경 범위는 **시장정보 전용**. 기존 가격표·RPC·거래 테이블과 DB trigger 연결 금지.
- 제안: Supabase Edge Functions + 프로젝트 서버 비밀값 + 소수 정기 수집(Cron 또는 제어된 호출) + 읽기 전용 캐시. 외부 API 비밀값 브라우저/Pages/workflow 로그에 저장 금지. public 읽기 권한은 라이선스로 승인된 필드/사용자 범위에만.
- 최소 저장소 후보: `market_observations`(symbol/type/interval/observedAt/source/value/ohlc/status), `market_ingestion_runs`(성공·오류/조회수/시각) 및 관리자 관리 권리 메타데이터. **아직 migration 작성/적용하지 않음**. 라이선스 저장 기간 조건 승인 전 원문/대량 시계열 저장 금지.
- 시스템 부하: FX 1일 1~2회 조회/캐시, EOD는 거래일 이후만, 분봉/실시간은 적절한 권리·예산 확인 후. 클라이언트 새로고침 1회당 원천 API 1회 호출하는 fan-out 금지. rate-limit/backoff, 요청 동시성 잠금, TTL/ETag, 마지막 성공 시간 모니터링.
- Supabase Free Edge Functions 기본 무료 월 500,000 호출(2026-10-27 문서 기준)이지만 DB/cron 및 공급자 별도 제약이 우선. 무료 한도 초과/권한 미확인 시 기능 중지(fail-closed).

## 5. v0.5-A 구현 범위 제안(순서)
A1. 확정된 권리/출처별 카드와 상태 관리; 합성 표시 계속 유지. 타사 시세가 없을 때도 UI 정상 작동.
A2. Frankfurter v2 **USD/KRW 일별 기준환율** 읽기 전용 어댑터, 원천/기준일/수집시각 표기와 캐시, 날짜·휴일 테스트. blended vs ECB provider 직접 조회 권리 검토 후 선택. 환율이 없는 경우 기존 합성 1360원과 혼합하지 않고 '기준환율 이용 불가' 표시.
A3. 미국 주식·ETF 공급자 인터페이스 및 fixture/Mock 기반 테스트. 외부 표시 승인 이전에는 실제 데이터 UI 기능 플래그 OFF, 외부 API 인증키/운영 DB/금융 계산 변화 없음.
A4. KRX·미국 지수는 공개 source 링크·라이선스 검증 기록까지만. 허가·정합성 확인 전 값 미활성화.
A5. 기존 합성 모드 유지 + 1440/768/390 PC·모바일 라벨/차트/로그인/주문 회귀검증.

**명시적 제외**: paper_prices 실가격 전환, 실제 주문체결가격 변경, 서버 현금원장/지분 재평가, 계좌 초기화/원금 재기준화, 배당/주식분할/환차익, 뉴스 자동 수집, 실시간 websocket, 친구 초대 활성화.

## 6. v0.5-B 이상의 금융 전환 핵심 선결 조건
기존 사용자 체결기록은 **합성 체결 원가**로 만들어졌다. `paper_prices`만 실제 시장가격으로 변경하면 인위적인 손익이 생기므로 금지. 미래 실제 가격 기반 모의투자를 시작한다면:
- 새 모의계좌 가격체계(version/price-regime) 분리 또는 명시적으로 동의받은 새 계좌 시작 정책을 별도 설계한다. 기존 계좌·주문·원장은 삭제/변조 금지.
- 화면 실제시세, 주문 미리보기, 서버 snapshot, 실제 체결 기록이 같은 승인된 관측치와 timestamp를 지칭하는지 검증. 서버가 유효시각·가격·거래 가능 상태를 원자 검증하고 client price는 무시.
- 지연시세/EOD 시세를 '현실적인 장중 체결'로 포장하지 않는다. 지연 길이에 따른 주문 허용·거부 정책과 시가/종가/체결가의 차이를 합의한 뒤 변경.
- 환율 기반 KRW 평가는 USD 자산 × 해당 기준일 환율의 표시만; 환차익 분해는 거래별 FX basis/현금흐름 정의 후 별도 버전에서 수행.

## 7. 테스트 및 승인 게이트
- 데이터: 정상/결측/빈값/오래된 값/역순 캔들/비숫자/음수/0/통화 혼동/소수 정밀도/타임존/DST/주말/휴장/수정 발표/중복 시간/공급자 오류/401/403/429/5xx/timeout.
- 법적 표시: 권리 OFF에는 제3자 가격 화면·cache API 제공 불가; 출처·라이선스 식별자·asOf 필수; 합성↔실제 자동 오표시 금지.
- 금융 불변: 기존 58 테스트 + 인증/복구 12 경로에서 주문/계좌 결과 기존과 동일; 서버 `paper_prices`, migration `202610270003`, owner/RLS/idempotency/시장시간 안전성 변동 없음.
- 통합: API 키가 없어도 기존 UI/합성 기능 작동, FX 실패해도 USD 원장·가격 안전, 로그인/로그아웃/사용자 A/B 데이터 분리, 브라우저 사용자 타임존 바뀌어도 관측 기준시각 고정.
- CI: `npm run build`, `npm test`, `npm run test:auth` 등 저장소 실제 스크립트 확인 후 실행, 필요 시 Edge 함수 mock contract test. 미실행/미확인 결과는 PASS로 기록하지 않는다.
- 배포: 개발 브랜치에서 기능·검증 완료 후 main/Pages 별도 결정. **이 설계 커밋에서는 운영 서비스·DB·시세·키·요금제 변경 없음.**

## 8. 공식·원천 자료 (APA 7th 형태, 2026-10-27 조회)
1. Twelve Data. (n.d.). *Individual pricing*. https://twelvedata.com/pricing
2. Twelve Data. (2026). *Terms of use*. https://twelvedata.com/terms
3. Twelve Data. (n.d.). *US equities market data*. https://support.twelvedata.com/en/articles/9935903-us-equities-market-data
4. Massive. (n.d.). *Stock market API*. https://www.massive.com/stocks
5. Massive. (n.d.). *How can I redistribute Massive's market data?* https://massive.com/knowledge-base/article/how-can-i-redistribute-massives-market-data
6. Alpha Vantage. (n.d.). *Support*. https://www.alphavantage.co/support/
7. Finnhub. (n.d.). *Terms of service*. https://finnhub.io/terms-of-service
8. Federal Reserve Bank of St. Louis. (n.d.). *FRED API terms of use*. https://fred.stlouisfed.org/docs/api/terms_of_use.html
9. Federal Reserve Bank of St. Louis. (n.d.). *S&P 500 (SP500)*. https://fred.stlouisfed.org/series/SP500
10. 한국거래소. (2025). *KRX OPEN API 서비스 이용약관*. https://openapi.krx.co.kr/contents/OPP/INFO/OPPINFO002.jsp
11. 한국거래소. (n.d.). *KRX OPEN API 서비스 목록*. https://openapi.krx.co.kr/contents/OPP/INFO/service/OPPINFO004.cmd
12. 한국거래소. (n.d.). *서비스 이용방법*. https://openapi.krx.co.kr/contents/OPP/INFO/OPPINFO003.jsp
13. Frankfurter. (n.d.). *Exchange rate and currency data API*. https://frankfurter.dev/
14. Frankfurter. (n.d.). *License & terms*. https://frankfurter.dev/license/
15. Frankfurter. (n.d.). *API FAQ*. https://frankfurter.dev/
16. European Central Bank. (n.d.). *Euro foreign exchange reference rates*. https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
17. Supabase. (n.d.). *Edge Function invocations*. https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations
