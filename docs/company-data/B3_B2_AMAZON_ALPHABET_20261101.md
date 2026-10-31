# B3-B2 Amazon·Alphabet 공식 재무자료 증거 (기준 2026-11-01)

기준 cfdade15a1552f5ab3ab9550493ab0225068e85c 및 B3-B1 CI [41217883068](https://github.com/pchjesus/us-stock-lab/actions/runs/41217883068) completed/success를 직접 확인했다. 기존 체크아웃/개발 브랜치를 사용하며 시작 시 작업 트리는 깨끗했다. 자료 확인일 2026-11-01(KST), 각 source.checkedAt에 실제 UTC 확인시각을 보존한다.

SEC submissions → 동일 accession 원문 visible inline XBRL → Company Facts → USD 정규화 → 기존 검증기/BigInt 계산 → 기존 CompanyDetail 순서로 대조했다. 공식 캐시는 /tmp/us-b3에만 저장한다. 서버/브라우저 자동수집, DB·금융 원장·main·Pages 변경 없음. 관련 정정 공시는 선택 기간의 제출 이력에서 발견되지 않았다. 원문 HTML SHA256/행 또는 주석 문장/context/rawValue/scale/unit/FY/FP/frame은 tests/fixtures/company-financial-evidence.json과 각 FinancialFact.evidence에 기록한다.

## 체크포인트 1 — Amazon

|form|제출일|종료일|공식 원문|
|---|---|---|---|
|10-K|2026-02-06|2025-12-31|[0001018724-26-000004](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm)|
|10-Q|2026-10-30|2026-09-30|[0001018724-26-000040](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000040/amzn-20260930.htm)|
|10-Q|2026-07-31|2026-06-30|[0001018724-26-000026](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026/amzn-20260630.htm)|
|10-Q|2026-04-30|2026-03-31|[0001018724-26-000014](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000014/amzn-20260331.htm)|
|10-Q|2025-10-31|2025-09-30|[0001018724-25-000123](https://www.sec.gov/Archives/edgar/data/1018724/000101872425000123/amzn-20250930.htm)|

FY2023/2024/2025의 연간 3개년 연결 GAAP 매출·영업이익·순이익·희석EPS·OCF·현금Capex 및 계산 FCF를 입력했다. 직접 보고된 단독 분기는 FY2025 Q3 및 FY2026 Q1/Q2/Q3다. Q4/누적값 전환/EPS 차감/TTM을 생성하지 않았다. North America/International/AWS 개별 수치가 아닌 차원 없는 연결 context와 Net sales를 사용한다.

현금 Capex는 PaymentsToAcquireProductiveAssets의 Purchases of property and equipment: 52,729 / 82,999 / 131,819 백만 USD. 금융리스 취득 642/854/2,911, 미지급 설비취득, 리스 원금상환과 구분한다. 괄호 지출 표시는 양수 payments 값으로 보존한다. 앱 FCF=OCF−총 현금취득액은 32,217 / 32,878 / 7,695 백만 USD다. 회사 발표 FY2025 FCF 11,194는 매각대금/인센티브 차감 후 Capex 128,320을 사용하므로 앱 139,514−131,819=7,695와 정의가 다르다. 회사 발표 FCF라고 표시하지 않는다.

2026-09-30 재무상태(백만 USD): 자산1,243,390, 자기자본613,601, 계산 총부채629,789, 현금·현금성55,783. 총부채는 원문에 별도 합계 태그가 없어 자산−자기자본으로 계산하고, 원문 구성항목 257,982+98,824+173,125+99,858과도 일치한다.

차입금은 장부가액 유동6,827+비유동173,125+별도 단기차입380=180,332 백만 USD(리스 제외)다. 장기 차입 원금180,887에서 할인/발행비용935를 뺀179,952와 차이를 구분한다. 단기차입380은 Accrued expenses and other에 포함된다는 본문 visible XBRL과 Company Facts에서 확인했다. CP·두 revolving facility는 원문에서 미인출을 확인했고 한도30,000/20,000을 부채로 더하지 않았다.

보고40개+계산5개(FCF3·총부채1·차입금1)=45개 관측을 추가했다. 양수 Capex, 기존 정정 공시/FCF 호환성과 잘못된 계산 입력 거절을 포함한 영향 테스트 **50/50 PASS**(desktop/mobile), build PASS. 원문 검증기 **159보고/15계산 PASS**(기존 세 기업119/10 포함). 이 체크포인트 통과 후 Alphabet 작업을 시작했다. 전체 테스트 결과는 DEVLOG 및 최종 보고에 별도로 기록한다.

## 체크포인트 2 — Alphabet

FY2023/2024/2025 연간 3개년과 FY2025 Q3·FY2026 Q1/Q2/Q3의 직접 보고 단독분기를 입력했다. 각 기업 최근10-Q4개는 Q4가 빠진 목록이며 연속4분기/TTM이라고 표시하지 않는다. Google Services/Google Cloud/Other Bets가 아닌 연결 Revenues를 사용한다.

|form|제출일|종료일|공식 원문|
|---|---|---|---|

|10-K|2026-02-05|2025-12-31|[0001652044-26-000018](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm)|
|10-Q|2026-10-29|2026-09-30|[0001652044-26-000084](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000084/goog-20260930.htm)|
|10-Q|2026-07-23|2026-06-30|[0001652044-26-000071](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm)|
|10-Q|2026-04-30|2026-03-31|[0001652044-26-000048](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000048/goog-20260331.htm)|
|10-Q|2025-10-30|2025-09-30|[0001652044-25-000091](https://www.sec.gov/Archives/edgar/data/1652044/000165204425000091/goog-20250930.htm)|

현금 Capex는 PaymentsToAcquirePropertyPlantAndEquipment의 Purchases of property and equipment: 32,251/52,535/91,447 백만 USD. 미지급 설비취득, 금융리스/비현금 투자와 구분한다. OCF101,746/125,299/164,713에서 차감한 FCF는69,495/72,764/73,266 백만 USD다.

2026-09-30 재무상태(백만 USD): 자산1,003,312=총부채325,763+자기자본677,549. 현금·현금성56,334와 시장성증권208,764를 구분한다. 차입금126,118=유동1,016+비유동125,102+공식 확인 CP0. 원금127,485−할인/발행비1,110−헤지회계 공정가치조정257=126,118과도 대조한다. 우선주19백만주/장부상 자본18,023을 차입금으로 더하지 않는다. CP0은 결측 대체가 아닌 원문 “no”의 공식 ixt:fixed-zero 변환과 Company Facts의0을 대조한 값이다.

### 연결 순이익·보통주 귀속·희석 EPS

GOOGL은 Class A, GOOG는 Class C이며 Class B도 존재한다. 앱 dilutedEps는 차원 없는 공시 **Consolidated 열**의 직접 보고값이다. 클래스별 EPS/각 주식의 투자수익률이 아니다. 예를 들어 FY2025 원문 Class A10.82/B10.81/C10.80/연결10.81이므로 앱은10.81을 보존하고 화면의 자료 범위에 연결 열임을 알린다.

Q3 FY2026 연결 순이익26,468−발생 우선주 배당298=보통주 귀속26,170 백만 USD. 기존 netIncome은26,468을 유지한다. 직접 보고 희석EPS는 연결2.12(클래스C2.11과 다름)다. Q3 희석 분자에는 우선주 배당 가산0, 전환주식 증가0이다. 9개월 누적은 연결 순이익201,239−우선주 배당384=보통주 귀속200,855이며, 희석 EPS 계산에는 if-converted 기준 가산384/주식증가24백만주(총분모12,324백만주)가 반영된다. 원문은 희석 효과가 있는 경우에만 가산/전환한다고 명시한다. 현금 지급 우선배당234와 발생/선언된298·384도 혼동하지 않는다. 이 누적 값들은 정의 설명용 근거이며 단독 분기 FinancialFact로 등록하지 않는다. NI/EPS를 나눠 자체 역산하거나 큰 기타손익을 영업이익으로 바꾸지 않는다.

보고41개+계산4개(FCF3·차입금1)=45개 관측을 추가했다. 두 기업 합계 보고81+계산9=90개, 기존3기업129개를 포함하면 **보고200+계산19=219개 관측**이다.

## 독립 대조 및 기존 자료 보존

각 원문 표의 독립 전사 기대값은 tests/amazon-alphabet-financials.spec.ts, 특화 정의·분자/분모·차입금 조정 문구와 HTML 해시는 tests/fixtures/amazon-alphabet-report-notes.json에 있다. 기존 AAPL/MSFT/NVDA 데이터·원문증거 배열을 JSON.stringify한 SHA256은 기준 커밋과 동일하다.

- 기존129개 데이터: `66b3bf9bf2e5bcf1a5bf65c46348cc9ad275d2e1cfbc53797c0c7f9074eda0cf`
- 기존119개 원문증거: `8cdf40a5abd481d72401f104635bc5add22eec5b15afe72c480860f0683a1b8f`

검증기는 전체25개 원문 전수, Company Facts 및 제출 이력 10개 JSON을 사용한다. 원문 해시/행·본문/context/축 없음/단위/scale/정규화값/연도/분기/frame/accession/form/filed를 대조하고 Decimal로19개 계산을 독립 검산한다. 기존 검사 삭제·태그 포괄 허용 없음. 본문 예외는 AMZN ShortTermBorrowings와 GOOGL fixed-zero CommercialPaper만 허용하며 원문 문장과 Company Facts도 모두 일치해야 한다. 앱 BigInt 검증의 신규 공식은 assets−equity 및 debtCurrent+debtNoncurrent+shortTermBorrowings 두 가지로 한정한다. 기존 정정 공시 입력을 재사용하는 FCF 계약은 유지한다.

영향 테스트60/60 PASS(각 PC/mobile30). 최종 전체 회귀와 신규 CI 실제 결과는 DEVLOG/완료 보고 참조. 검증 명령:

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true npm run build
npm test
npm run test:auth
npx playwright test --config playwright.company-dev.config.ts
python3 scripts/verify-company-evidence.py --cache-dir /tmp/us-b3
git diff --check
```

캐시는 개발 환경의 임시 파일이며 저장소에 원문 HTML/대형 JSON 전체를 넣지 않는다. 다른 환경에서는 해당 공식 캐시를 확보한 뒤 대조해야 한다. 기존 finance-safe CI는 유지하며 원문 캐시 검증 결과와 CI SQL/Cron 결과를 구분한다.

## 미제공과 B3-C 인계

- Q4/누락 분기, 분기 OCF·Capex·FCF, TTM은 생성하지 않는다.
- 모든 배당 날짜/금액 세트 미확인으로 dividends=not-reviewed 유지(무배당 의미 아님). 서버 계좌 배당 원장과 연결하지 않는다.
- 영업이익률 일괄 제공, PER/PBR/배당수익률, 실시간 가격·시세API 미제공.
- 기존 CompanyDetail·연간/분기 선택·계좌 상태 경계를 재사용한다. 수기·합성 주문/가격·학습실·외부 시세 링크를 변경하지 않는다.
- B3-C는5기업 통합 감사, 비교열/정정 우선순위·EPS 범위/Capex정의의 UI 명료성 등을 별도 검토한다. 이번 작업에서 통합 감사나 UI 개편/운영 반영을 수행하지 않는다.
