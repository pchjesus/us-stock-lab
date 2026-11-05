# UX4-F3b 경쟁관계와 비교 재무 기반

SEC 공식 공시를 2026-11-05에 직접 확인했다. NVIDIA FY2026 10-K의 Competition은 AMD를 GPU·가속 컴퓨팅 및 AI 관련 경쟁사로 명시한다. AMD FY2025 10-K의 Competition은 데이터센터 CPU·GPU·DPU·AI NIC 및 별도 그래픽 시장에서 NVIDIA와의 경쟁을 밝힌다. 이는 일부 제품의 경쟁관계이며 연결 매출 전체가 서로 동일한 사업이라는 뜻은 아니다. AMD는 읽기 전용 비교 대상일 뿐 앱의 8개 주문 가능 종목에 추가되지 않는다.

## 원문 대조

양사 10-K의 연결 기간 XBRL context `c-1`, USD 단위·scale 6을 직접 대조했다. 숫자는 보고된 백만 달러 금액을 USD 정수 문자열로 보존한다. SEC companyfacts에서도 accession·기간·금액을 교차 확인했다.

| 연결 지표 | NVDA FY2026: 2025-01-27~2026-01-25 | AMD FY2025: 2024-12-29~2025-12-27 |
| --- | ---: | ---: |
| 매출 | 215,938,000,000 USD | 34,639,000,000 USD |
| 영업이익 | 130,387,000,000 USD | 3,694,000,000 USD |
| 순이익 | 120,067,000,000 USD | 4,335,000,000 USD |
| 영업현금흐름 | 102,718,000,000 USD | 7,709,000,000 USD |

두 기간은 각각 364일이나 시작일과 종료일이 모두 다르고 종료일 차이는 29일이다. FY 이름도 다르다. **네 항목 모두 동일 기간 규모 비교 및 차액 산출 보류**다. 이는 비교 가능한 자료가 없다는 뜻이며 어느 기업의 우열이나 투자 추천이 아니다. 사업 범위·고객·제품·회계 판단도 다르므로 기간 정렬만으로 사업 경쟁력 비교가 성립하지 않는다.

AMD는 2026-02-04 제출된 10-K/A(0000002488-26-000021)의 설명에서 Client 매출 서술 중 출하량·평균판매가격의 전년 대비 증감 수치가 서로 바뀐 것을 수정했다고 밝혔다. 정정문은 해당 변경 외 다른 항목을 수정하지 않는다고 명시한다. 위 네 값은 원 10-K의 연결 재무제표 수치이며, Client 세부 증감률은 이번 데이터에 사용하지 않는다. 제출 목록에서 확인 시점 이후 해당 보고기간 관련 추가 10-K/A는 찾지 못했고 NVIDIA 해당 보고기간 10-K/A도 최근 제출 목록에서 확인되지 않았다. 향후 정정 가능성을 보장하지 않는다.

## 비교 계약

`src/peer/peerData.ts`는 기업 CIK·지표·정의·정확 decimal 문자열·USD·US GAAP·기간·FY·accession·XBRL concept/context/scale·원문·보고/검증 상태를 독립 저장한다. 기본 비교기는 고정된 신뢰 등록부와 입력의 전체 필드를 대조해 위조·수정된 관측을 거부한다. 외부에서 생성한 등록부는 신뢰 경계이며 원천 인증 기능이 아니다. 테스트용 가상 등록부는 가상 입력만 사용한다.

동일 지표·정의·통화·단위·회계 기준·연간 유형·실제 시작/종료일과 유효한 연간 길이(350~371일)가 모두 일치해야 BigInt 기반 정확한 USD 차액(왼쪽−오른쪽)을 허용한다. 다른 FY 명칭은 일치로 간주하지 않고 별도 경고한다. 누락·미검증·정정 전·잘못된 숫자·단위·기간·출처가 있으면 차액은 null이다. 0·음수는 실제 숫자로 보존하고 누락을 0으로 바꾸지 않는다. 배율·우열·추천은 제공하지 않는다. 차액 계산은 테스트용 동일 기간 가상 fixture로만 검증되었으며 실제 두 회사에 적용되지 않았다.

## 참고문헌 (APA 7th)

NVIDIA Corporation. (2026, February 25). *Annual report on Form 10-K for the fiscal year ended January 25, 2026*. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm

Advanced Micro Devices, Inc. (2026, February 4). *Annual report on Form 10-K for the fiscal year ended December 27, 2025*. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/2488/000000248826000018/amd-20251227.htm

Advanced Micro Devices, Inc. (2026, February 4). *Amendment No. 1 to annual report on Form 10-K/A*. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/2488/000000248826000021/amd-20251227.htm

U.S. Securities and Exchange Commission. (n.d.). *Company facts: Advanced Micro Devices, Inc.* Retrieved November 5, 2026, from https://data.sec.gov/api/xbrl/companyfacts/CIK0000002488.json

U.S. Securities and Exchange Commission. (n.d.). *Company facts: NVIDIA Corporation*. Retrieved November 5, 2026, from https://data.sec.gov/api/xbrl/companyfacts/CIK0001045810.json

U.S. Securities and Exchange Commission. (n.d.). *Submissions: Advanced Micro Devices, Inc.* Retrieved November 5, 2026, from https://data.sec.gov/submissions/CIK0000002488.json

U.S. Securities and Exchange Commission. (n.d.). *Submissions: NVIDIA Corporation*. Retrieved November 5, 2026, from https://data.sec.gov/submissions/CIK0001045810.json
