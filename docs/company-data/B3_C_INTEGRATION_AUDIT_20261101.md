# B3-C 재무정보 통합 감사 — 2026-11-01

기준 HEAD efe4b02579d31f9a82619db6477ee2dfd6e8dd2c, B3-B2 CI41223806332 completed/success 확인. 기존 체크아웃/개발 브랜치와 깨끗한 작업 트리에서 시작했다. 금융 RPC·RLS·SQL·운영 DB·Cron·main·Pages 변경 없음.

## 데이터 및 공식 근거

|기업|연간 FY|직접 보고 단독 분기 FY/Q|재무상태 기준일|보고/계산|
|---|---|---|---|---|
|AAPL|2023, 2024, 2025|2025 Q3, 2026 Q1, 2026 Q2, 2026 Q3|2026-06-27|41/4|
|MSFT|2024, 2025, 2026|2026 Q1, 2026 Q2, 2026 Q3, 2027 Q1|2026-09-30|39/3|
|NVDA|2024, 2025, 2026|2026 Q2, 2026 Q3, 2027 Q1, 2027 Q2|2026-07-26|39/3|
|AMZN|2023, 2024, 2025|2025 Q3, 2026 Q1, 2026 Q2, 2026 Q3|2026-09-30|40/5|
|GOOGL|2023, 2024, 2025|2025 Q3, 2026 Q1, 2026 Q2, 2026 Q3|2026-09-30|41/4|

219개 관측/200개 증거 전체를 보존했다. 원문 HTML25개와 SEC submissions/Company Facts10개 JSON 캐시(`/tmp/us-b3`)를 이번 실행에서 다시 대조했다. 각 보고값의 URL/accession/제출일/form/CIK/context/무차원 연결 기준/단위/scale/부호/회계기간/FY/FP/frame/행·본문/SHA256이 일치하며, **200보고/19계산 PASS**다. 계산은 앱 BigInt 외에 Python Decimal 및 별도 테스트 BigInt로 검산했다. 원문값 변경 없음.

전체 JSON.stringify 내용 SHA256:
- 219개 관측: `d751648e984a55870f88bf15d9395259eddb8b56a27f1a46e2b7bcfadffabf88`
- 200개 증거: `a076282d9929ba667b1f8be4d983e0ea94d9f16d8ab48cad9087e1ec063b4560`

개별 공식 URL/원문 해시/비교열과 정의는 B3_A_OFFICIAL_FINANCIALS_20261101.md, B3_B1_NVIDIA_20261101.md, B3_B2_AMAZON_ALPHABET_20261101.md 및 FinancialFact.evidence/증거 fixture에 있다. 선택 기간의 관련 정정 공시는 제출 목록에서 발견되지 않았다. 정정 fixture에서는 명시적 amends/supersedes, 기존 FCF 보존, 최신 유효값 우선 선택 검사를 유지한다. 원문 검증기는 현재 미검토 정정 공시를 발견하면 수용하지 않고 실패시킨다(미래 정정의 자동 수용 기능 없음).

## 발견·수정

|위험도|발견 사항|최소 수정/증거|
|---|---|---|
|Medium|SEC의 verified 보고값에서 evidence를 삭제해도 도메인 검증이 수용|accession이 있는 검증된 SEC 보고값은 evidence 필수. 5기업 삭제 회귀 모두 거절; 기존 비SEC 테스트 fixture·정정 계약 보존|
|Medium|원문 검증기가 계산 metric만 보고 기본 sum 연산; 중복 proof ID/다른 context CIK를 명시적으로 검사하지 않음|허용 공식·순서·입력 metric/status/unit/currency·Capex 부호 검사, proof 중복 ID 및 context CIK 검사 추가|
|Low|캐시 누락 시 traceback으로 실패 원인이 불명확|필요35개 파일 사전 검사 및 검증 미수행 오류, 빈 캐시 exit2 확인. 누락을 PASS로 처리하지 않음|
|Low|분기 막대를 같은 간격으로 배치해 누락 Q4를 쉽게 인식하기 어려움|실제 fiscal ordinal 차이에 간격·점선·미제공 라벨. 가상 데이터/막대·Q4/TTM 생성 없음|
|Low|긴 회계 설명이 모든 숫자 위에 상시 표시|핵심 차이는 항상 표시하고 전체 정의는 키보드 접근 가능한 details로 제공. 기존 출처·정확값·계산 입력 보존|
|Low|외부 재무부 조회 실패와 계좌 손상 알림이 공존하면 기존 테스트의 alert 선택자 충돌|손상 계좌 알림을 지정해 검증. 앱 알림/금융 기능을 숨기거나 테스트를 삭제하지 않음|

최신 투자지표는 선택 연간/단독분기 동일 기간을 사용하며 분기 OCF/FCF 결측은 미제공이다. 재무상태는 별도 시점 유지. SVG 막대 title/data-value와 숫자 목록이 같은 정확값을 사용하고 크기만 Number로 정규화한다(금융 계산에 사용하지 않음). 0은 기준선 점·높이0, 음수는 기준선 아래로 표시하는 fixture를 검증했다. USD/share와 USD 및 백만 USD/정확값 포맷 계약은 그대로다.

Apple/Microsoft 공식 연간·직접분기 기준, NVIDIA의 1월말 회계연도·분할 반영 EPS, Amazon gross cash Capex와 회사 net FCF 차이, Alphabet 연결 순이익/우선주 차감 보통주 이익·연결 EPS와 클래스별 EPS 차이를 유지한다. 기업별 핵심 범위는 화면에, 세부 정의는 펼침 영역 및 원문에 표시한다. 배당 날짜·주가 의존 지표/영업이익률은 새로 만들지 않았다.

## 재현 및 검증

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true npm run build
npm test
npm run test:auth
npx playwright test --config playwright.company-dev.config.ts
python3 scripts/verify-company-evidence.py --cache-dir /tmp/us-b3
git diff --check
```

캐시는 저장소에 포함하지 않는다. 다른 환경에서는 companyFinancials.json의 각 symbol/sources에서 `{symbol}-{accession}.htm`, companyCiks의 SEC `/submissions/CIK{10자리CIK}.json`→`{symbol}-submissions.json`, `/api/xbrl/companyfacts/CIK{CIK}.json`→`{symbol}-facts.json`을 준비한다. 공식 정책/요청 제한을 준수하고 원본 바이트 그대로 저장해야 해시를 비교할 수 있다. lxml은 개발용 Python 파서이며 앱 의존성이 아니다. 재확보 원본 해시가 다르면 자동 덮어쓰기·검증 성공 처리 없이 차이를 조사한다. 현재 검사 범위는 기준일2026-11-01이며 최신 공시 지속 수집을 뜻하지 않는다.

로컬 실제 결과: build PASS, 영향44/44, 최종 npm test190/190(기존178 보존), test:auth38/38(기존30 보존), dev fixture2/2, 원문200/계산19 PASS. 초기 전체 실행189 PASS/1 FAIL은 계좌 알림 선택자 충돌이며 최소 수정 후 전체190개를 재실행했다. 신규 CI 결과는 최종 보고에 별도 기록한다. 네 가지 viewport1440/768/390/320에서5기업·3ETF, 연간/분기·원문 링크·계산 펼침·모드 전환·외부 시세 단일 인스턴스·학습실 링크를 검사한다. 수기 화면도 인증 mock과 서버 snapshot fixture로 같은 폭/8종목에서 검사하고, 직접 입력가격 불변/신규 주문0건/합성 원장 미생성을 확인한다. 실제 운영 인증·물리 기기 검증과 구분한다.

## 잔여 위험 및 별도 판정

- 코드·재무데이터 통합: 최종 회귀/CI 통과 조건으로 PASS.
- main 병합 준비: 최종 CI 성공 조건으로 GO(코드 통합 관점). 원격 main35d37cd는 개발 HEAD의 조상이며 main 병합은 수행하지 않았다. Pages는 workflow_dispatch이며 병합과 배포는 별도다.
- GitHub Pages·운영 Supabase 배포 준비: **NO-GO**. SPEC v0.6-F의 운영004~007 migration 이력/충돌·백업·사후 금융 불변식·Security Advisor·관리자 allowlist·실운영 Cron 준비·두 초대 계정/기기 smoke·별도 사용자 승인 미완료를 그대로 보존한다. 이번 CI의 격리 DB/Cron PASS는 운영 적용을 뜻하지 않는다.
- 운영 환경·실제 물리기기·외부 사이트 가용성/시세 정확성은 이번 실행에서 미검증. 링크 주소/보존은 검사하지만 외부 데이터를 추출하거나 주문서에 주입하지 않는다.
- 정적 자료 기준일 이후 갱신, 미제공 분기/배당, 실제 세무 적합성/운영 v0.6-F 게이트는 후속 승인 작업이다. 신규 기능 또는 다음 버전 개발은 수행하지 않았다.

복구 기준: 이번 변경은 재무 원본·DB schema를 바꾸지 않으므로 개발 커밋을 revert하면 기준 efe4b02의 검증기/UI로 되돌릴 수 있다. 원본219개와 현금 원장은 변환/삭제하지 않는다. 시각 캡처는 GOOGL 분기 그래프4개 폭에서 확인했고, 전체8종목/두 모드는 DOM·동작·오류·가로 넘침 검사로 검증했다. 실제 물리 디바이스 검증을 뜻하지 않는다.
