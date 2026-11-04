# A5-A · 개인 로컬 카탈로그 후보 탐색

기준 `codex/catalog-a4-c2-official-ingest` / `e1adab478f6ad1506bce16dfd591949bc9b8c0f8`에서 기존 checkout의 `codex/catalog-a5-a-readonly-discovery`로 작업했다. 원격 기준 HEAD·부모 `0ce25f124c6c863893760438096d435b26d99002`·깨끗한 작업 트리·신규 브랜치 부재를 확인했다. 운영 main은 `51474c2904856e1668bacb815c7fd58ed83e177b`로 유지한다.

## 제공 범위

`#market`의 기본 모드는 기존 **모의투자 지원 종목**이다. 기존 8종목의 이름/심볼 검색·관심종목·합성 가격/등락률·기업/ETF 상세·주문 범위는 그대로 사용한다. 별도의 **미국 종목 후보 탐색**에서 사용자가 직접 파일을 가져온 경우에만 후보를 검색한다. 배포 가능한 전체 SEC 카탈로그나 실제 전체 상장종목 검색을 제공하는 단계가 아니다.

후보는 회사명·심볼·거래소·CIK와 자료 출처/수집시각을 보여준다. 정확 심볼 → 부분 심볼 → 회사명 순으로 검색하며 대소문자만 정규화하고 이름·구두점·거래소별 ID·복수 클래스를 보존한다. 빈 검색은 검색어 안내, 검색 결과는 50개씩 페이지 분할하고 전체 후보/검색 일치/현재 표시 건수를 구분한다. 지연 가능한 검색 상태를 사용해 입력과 목록 갱신을 분리한다.

선택하면 읽기 전용 패널에 UTC/KST 수집시각, 원본 기준일 미확인, 증권 유형 `unknown`, 상장 상태 `unverified`, 거래 불가 사유를 표시한다. 숫자 10자리 CIK로만 SEC 발행인 조회 링크를 생성한다. 링크는 새 탭임을 표시한다. 후보의 가격·수익률·사업/재무/배당/ETF 구성 정보·주문·관심종목 버튼과 `#stock` 연결은 제공하지 않는다. AAPL처럼 기존 심볼과 같아도 금융 상세로 자동 연결하지 않는다.

## 오프라인 export

Node 24에서 A4-C2 수집기로 생성한 정상 스냅샷 디렉터리를 입력한다. export 자체는 네트워크를 요청하지 않는다.

```sh
npm run catalog:export -- work/catalog-snapshots/SNAPSHOT_DIRECTORY work/catalog-import.json
```

가상 fixture로 만든 스냅샷이면 반드시 `--fixture`를 붙인다.

```sh
npm run catalog:export -- work/fixture-snapshot work/fixture-import.json --fixture
```

`loadSecSnapshot`으로 원본·manifest·정규화 결과의 해시/크기/건수와 재정규화를 다시 검사한다. 통과한 후보·건수·고정 출처 URL·수집시각·원본 해시·검증 상태만 단일 JSON에 포함한다. 제외/보류 원자료와 담당자 식별 정보는 포함하지 않는다. 원본 기준일은 기존 SEC 계약대로 `null`이며 수집시각으로 대체하지 않는다.

버전 1, kind `us-stock-lab-local-catalog`, payload와 payload SHA-256으로 구성한다. 해시 입력은 UTF-8 `JSON.stringify(payload)`이고 바깥쪽 들여쓰기는 무관하다. 같은 입력/메타데이터/fixture 표시는 같은 출력이다. status는 `candidate-unverified`, validation은 `schema-and-normalization-passed; listing-and-security-type-unverified`이다. **SHA-256은 내용 일치 확인이며 SEC 발행 인증·최신성·상장 유효성·재배포 권한을 증명하지 않는다.** fixture 표시 역시 작성자의 메타데이터이며 인증 수단이 아니다.

실제 경로가 Git 제외 `work/` 안에 있는 출력만 허용한다. 부모 디렉터리가 있어야 하며 `wx`/0600으로 새 파일만 생성한다. 기존 출력과 원본 스냅샷을 덮어쓰지 않는다. 원본 검증/브라우저 계약 검사에 실패하면 출력하지 않는다. 디스크 쓰기 중 중단으로 새 파일이 불완전해진 경우 가져오기가 거부하며, 새 파일을 정리하고 다른 이름으로 다시 export한다. 운영 브라우저 번들에 파일이나 원본을 자동 포함하지 않는다.

## 브라우저 검증과 상태

파일 선택기에서 최대 **32MiB / 후보 50,000개**만 허용한다. UTF-8/JSON·버전·출처·검증 상태·UTC 날짜·원본/내보내기 해시 형식·건수 합계·필수 필드를 검사한다. 후보를 기존 `normalizeSec`로 다시 정규화해 ID/모든 필드가 일치하는지 대조한다. 중복 ID, 손상된 CIK/거래소/심볼, 누락 필드, 임의 `tradeEligible=true`, 유형/상장 검증 승격, 외부 출처 주입 및 해시 불일치는 거부한다. 일부 후보를 조용히 버리고 성공으로 처리하지 않는다.

검증 실패 시 이전 표시 자료도 해제하고 오류/다시 가져오기 안내를 보여준다. 검증 중 안내·자료 미가져옴·빈 검색·검색 결과 없음은 구분한다. 연속 파일 선택 및 화면 이탈 후 늦게 끝난 검증이 새 상태를 덮지 않도록 요청 순서를 검사한다.

파일은 세션 메모리에서만 읽는다. 같은 앱 안의 모드/화면 이동에서는 유지하지만 새로고침·탭 종료·로그인 사용자 변경·로그아웃·명시적 자료 해제 시 해제한다. 자동 영구저장·서버 업로드·SEC 요청·자동 재수집은 없다. 다시 가져오기 방법과 새로고침 시 해제를 화면에 명시한다. 파일 선택은 해당 브라우저 사용자의 선택이며 공개 배포나 업로드 권한을 부여하지 않는다.

## 금융·운영 경계

새 표시 컴포넌트는 주문/계좌/관심종목 함수에 접근하지 않는다. 기존 `instruments`, 합성 가격/캔들/원장·금융 계산·Auth·RPC/RLS/SQL·migration004~007은 불변이다. `tradeEligible=false`인 정규화 후보만 허용하며, 심볼 문자열로 금융 도메인에 연결하지 않는다. 운영 수기 거래는 계속 false이다. 실제 매매·증권계좌 연결·자금이동 기능은 없다.

Pages는 `workflow_dispatch`, finance/market push는 기존 과거 전용 브랜치만 대상이다. A5-A 브랜치는 해당하지 않는다. 개발 브랜치만 `[skip ci]` 커밋·push하며 main 병합·Pages 배포·workflow 수동 실행·운영 Supabase DB/Auth/Cron 변경·정기 수집을 하지 않는다. Nasdaq/SEC 이용 조건과 공개 재배포 불확실성은 [A4_C2.md](A4_C2.md) 그대로이며 대량 원본/개인 import 파일은 Git에 추가하지 않는다.

## 검증 및 화면

실제 SEC 데이터 사용 및 실제 수집은 **NOT VERIFIED**이다. 이번 테스트와 캡처는 고정 가상 fixture이며 화면에 **가상 fixture 자료 · 실제 SEC 자료 아님**을 표시한다. export 통합 fixture는 입력12 / 정규화7 / 제외2 / 보류2 / 중복1이고 실제 공식 자료 건수가 아니다. 1만 후보 fixture는 검색/페이지 성능만 검증한다.

| 검사 | 결과 및 근거 |
| --- | --- |
| 변경 전 관련 기준선 | **6/6 PASS** · 정규화/관심종목/기업·ETF 진입, desktop/mobile |
| 신규 export/import 영향 | **10/10 PASS** · 최종 검증 상태/경로/파일 선택 버튼 보강 후 실행 |
| export CLI | **PASS** · 가상 fixture12행→후보7, 제외2/보류2/중복1, 원본 불변·기존 출력/변조 원본 거부·반복 출력 동일 |
| 변조/잘못된 JSON/건수/날짜/출처/중복 ID/거래 권한 주입/크기·개수 상한 | **PASS** · 파일 전체 거부, 오류 후 정상 파일 재가져오기 |
| 검색/복수 클래스/동일 심볼·거래소 독립/50개 페이지 | **PASS** · 1만 후보 전체 시나리오 desktop2.6초/mobile2.5초, import+첫 검색10초 이내, 최대50행 DOM |
| 후보 금융 경계 | **PASS** · AAPL 심볼 충돌도 금융 상세/가격/주문/관심 조작 없음, 로컬 계좌·관심 원본 보존, 업로드/SEC 요청/금융 RPC0 |
| 인증·수기·배당·세금 UI | **52/52 PASS** · 모의 Auth, 후보 탐색 추가 RPC0·서버 관심/로컬 원장 보존·로그아웃 해제 포함 |
| production 수기 false 게이트 | **1/1 PASS** · 이전 수기 선호 보존, 후보 탐색 포함 수기/배당/세금/주문 RPC0, 기존 paper_snapshot만 허용 |
| 최종 TypeScript/Vite build | **PASS** · 정상화 후1회, 아래 flags 사용 |
| 메타데이터 추가 경계 검사 | **2/2 PASS** · 전체 회귀 후 앱 소스 변경 없이 이름/CIK 누락·검증 승격·기준일/버전 변조 거부의 추가 assertion 실행 |
| 최종 전체 앱 UI | **318/318 PASS** · 정상화 후 실제 production 산출물로1회, 신규10건 포함 |
| 화면·접근성 | **PASS** · Chromium desktop/touch 에뮬레이션, 1440/1200/768/390/320px, 44px·키보드·선택 초점·focus-visible·reduced-motion·가로 넘침/JS 오류0 |
| 번들/변경 범위/diff | **PASS** · import/fixture 후보·연락처 문자열은 dist에 없음, 금융/DB 소스 불변, git diff --check |
| 실제 SEC 수집·실제 전체 카탈로그 | **NOT VERIFIED** · 실제 데이터 없음, 외부 SEC 요청 미실행 |
| PostgreSQL 무거운 검증 | **NOT VERIFIED** · 금융/DB 불변으로 A4-C2가 참조한 선행 근거 재사용, 신규 실행 아님 |
| 운영 Auth·실기기·스크린리더/WCAG 전체 | **NOT VERIFIED** |

초기 영향 검사30 PASS/2 FAIL은 동일 AAPL의 첫 행 CIK를 특정 값으로 가정한 신규 테스트를 실제 이름 선택으로 수정했다. 최초 신규 인증2건은 서로 다른 설정의 Vite 서버를 동시에 실행하던 중 홈 진입부터 실패했다. 앱 코드 우회 없이 서버를 분리한 동일2건과 전체52건이 통과했으며, 당시 환경 원인은 확정하지 않았다. 최종 실패0이며 기존 테스트 삭제/skip/범위 축소는 없다. 기존 Vite auth 정적/동적 import 및 chunk 크기 경고는 남아 있다. 현재 화면 밖 대형 파일/실기기 성능은 위1만 fixture 에뮬레이션을 넘어 보장하지 않는다. 브라우저 무결성 검증에는 HTTPS 또는 localhost의 WebCrypto가 필요하다.

최종 실행 명령:

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true VITE_ENABLE_MANUAL_TRADING=false npm run build
npm test -- --workers=2
npm run test:auth -- --workers=2
npx playwright test --config playwright.release.config.ts --grep 'release defaults' --workers=1
git diff --check
```

수집/기준일을 고정한 fixture를 A4-C2 mock 수집→실제 catalog:export CLI→브라우저 파일 선택으로 처리했다. 캡처 파일의 payload SHA-256은 `cc88d1d3d70bd2b082ad4912434e0f21e457f503371c167e6ad320592af08a36`, 원본 fixture SHA-256은 `b631e9429fe9bedf76478550513e435d92809fd996ad8b0fa257590c076abac8`이다. 기준일은 null, 수집시각2026-11-03T00:00:00Z는 mock 고정 시각이다. 원본/내보내기 JSON은 work/a5-a 안에만 있고 Git/배포에는 포함하지 않는다.

production 캡처4장:

- [PC 1440px 지원8종목](a5-a-captures/1440-supported.png)
- [PC 1440px fixture 검색·상세](a5-a-captures/1440-fixture-discovery.png)
- [모바일 390px 지원8종목](a5-a-captures/390-supported.png)
- [모바일 390px fixture 검색·상세](a5-a-captures/390-fixture-discovery.png)

후보 캡처는 화면의 fixture 배너를 유지한다. 모바일 후보 캡처는 전체 내용을 읽을 수 있도록 같은390px 폭에서 세로 영역을 늘려 출력했으며 반응형/터치 검사는 별도의1000px 높이에서 수행했다. 캡처의 헤더 시장 지표는 기존 합성 예시이며 후보 시세가 아니다. 로그/보조 근거는 Git 제외 work/a5-a의 baseline.log, discovery-final-impact.log, auth-final.log, build-final.log, ui-final.log, release-final.log, metadata-boundaries.log, capture-evidence.json에 있다.

## 후속 단계

개인 로컬 자료 기반 A5-B 개선과 v0.9의 별도 승인된 작업은 진행할 수 있다. 실제 전체 카탈로그 공개 통합은 SEC 실수집 성공·출처/이용 권한·자료 최신성·증권 유형/상장 상태·식별자 검토가 필요하다. 후보 검색의 완성은 거래 허용이나 운영 배포 승인을 의미하지 않는다.
