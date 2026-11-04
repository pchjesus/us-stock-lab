# US Stock Lab

미국 주식 모의투자·투자 학습 웹앱 · v0.8

사이트: https://pchjesus.github.io/us-stock-lab/

v0.8 앱 통합 main `4a1e9f7`의 Pages 배포와 실제 사이트 smoke를 확인했습니다. 이번 통합의 검증·main 반영·실제 배포 상태는 [v0.8 최종 기록](docs/release/V0_8_FINAL.md)을 확인하세요. 과거 [R1 검증](docs/release/V0_8_R1.md)과 UX/A4/A5 문서는 각 개발 시점의 기록입니다.

실제 증권계좌 연결·실거래·자금이동 기능은 없습니다. 주문 가격·학습 차트·예시 지수는 **합성 데이터이며 실제 시세가 아닙니다.** 공식 재무자료·일별 참고환율·재무부 통계·외부 참고 시세는 각각 출처/기준일/상태를 표시하고 모의 주문 가격과 분리합니다.

## 현재 화면

| 경로 | 기능 |
| --- | --- |
| `#home` | 나의 모의투자 현황 → 미국3지수 요약 → 관심종목 → 학습·시장정보·중요 일정 |
| `#market` | 모의투자 지원8종목 검색·관심종목 / 개인 로컬 카탈로그 후보 탐색 |
| `#stock/{symbol}` | 기업5종의 개요·차트/거래·재무·근거, ETF3종의 개요·차트/거래·상품정보·출처 |
| `#portfolio` | 계좌 유형·보유종목·손익·거래내역·현금원장·로컬 초기화 |
| `#learn` | 기초 투자 수업 / 차트 실습실 선택 |
| `#learn/lessons` | 기존10수업·5단계 필터·접기/펼치기·직접 해보기 |
| `#learn/lab`, `#learn/{symbol}` | 합성 캔들/선·기간·난이도·SMA·Wilder RSI·지지/저항·봉 선택 |
| `#indices`, `#calendar`, `#news` | 전체 지표/추이·실제 참고환율·재무부 통계·경제 일정·뉴스 출처 |
| `#settings` | 표시 설정·계좌 모드 확인·초대 사용자 로그인/로그아웃·데이터 안내 |

Hash 경로는 정적 호스팅의 직접 접근·새로고침을 지원합니다. 헤더 시장 시계·6개 지표 슬라이더·알림·문맥 도움말·7단계 Tour를 제공합니다. 외부 차트는 TradingView·네이버·토스증권 링크와 팝업 차단 대체 링크를 유지합니다. 외부 API/차트 실패 시 오류·미제공 상태와 재조회/대체 경로를 표시하며 데이터를 만들어내지 않습니다.

AAPL·MSFT·NVDA·AMZN·GOOGL의 공식 재무219관측(200원문 근거·19계산값)을 기간·단위·원문·계산 입력과 함께 제공합니다. 검증되지 않은 분기/비율·ETF 구성비/총보수/분배금을 추정하지 않습니다.

## 모의투자와 읽기 전용 후보의 경계

모의투자 지원 종목은 **AAPL, MSFT, NVDA, AMZN, GOOGL, VOO, QQQ, SCHD**입니다. 기존 합성 가격·정수 주식 시장가 매수/매도·부분매도·가중평균 원가·실현/미실현손익·추가매수 분석을 유지합니다. 합성 계좌는 최초 가상자금 $100,000, 수수료·세금·배당·환전 비용0이며 환율손익을 포함하지 않습니다. USD가 주문/원장 기준이고 KRW는 표시용 환산입니다.

로그인 전에는 브라우저 로컬 계좌, 로그인 후에는 사용자별 서버 계좌/관심종목을 사용합니다. 로컬 기록을 서버로 자동 이관하지 않습니다. 서버 주문·계좌 격리는 기존 제한된 paper RPC와 RLS가 담당합니다. 손상된 로컬 기록은 자동 삭제하지 않으며 초기화에는 확인 문구가 필요합니다. 서버 기록은 앱에서 초기화하지 않습니다. 안전한 로컬 주문에는 Web Locks와 HTTPS/localhost가 필요합니다.

**A4-C1/C2와 A5-A는 구현됐지만 실제 SEC 전체 카탈로그는 아직 확보·검증되지 않았습니다.** A4는 정규화·개발용 공식 수집기·스냅샷 검증이고, A5-A는 사용자가 직접 만든 파일만 가져오는 개인 로컬 탐색입니다. 배포 번들에 전체 카탈로그를 포함하거나 브라우저에서 SEC를 자동 수집하지 않습니다.

후보 파일은 구조/크기/건수/해시/정규화와 거래 불가 상태를 검사합니다(최대32MiB·50,000후보, 결과50개씩). 세션 메모리에서만 읽으며 업로드·자동 영구저장·자동 재수집은 없습니다. 새로고침·로그인 사용자 변경·로그아웃 시 다시 가져와야 합니다. 후보는 가격/수익률·주문·관심종목 편입을 제공하지 않으며, 기존8종목과 심볼이 같아도 자동 연결하지 않습니다. 해시는 무결성 확인일 뿐 SEC 인증·상장 유효성·재배포 권한 증명이 아닙니다. 가상 fixture는 실제 자료가 아니라고 표시합니다.

자세한 계약: [A4-C1](docs/catalog/A4_C1.md) · [A4-C2](docs/catalog/A4_C2.md) · [A5-A](docs/catalog/A5_A.md).

## 실행 및 검증

Node.js24(검증 환경24.19), npm11을 사용합니다.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test -- --workers=2
npm run test:auth -- --workers=2
npx playwright test --config playwright.release.config.ts --workers=1
```

테스트는 `/usr/bin/chromium`을 기본 사용하며 다른 경로는 `CHROMIUM_PATH`로 지정합니다. 인증/수기/배당/세금 테스트는 고정 fixture이며 운영 Auth/DB 검증을 대신하지 않습니다. 실제 실행한 최신 결과와 미검증 범위는 최종 기록에서 구분합니다.

개인 스냅샷의 브라우저 가져오기 파일 생성(Node24, 네트워크 요청 없음):

```sh
npm run catalog:export -- work/catalog-snapshots/SNAPSHOT_DIRECTORY work/catalog-import.json
```

가상 fixture 스냅샷에는 `--fixture`를 붙입니다. 기존 파일은 덮어쓰지 않습니다. 실제 수집 명령 `npm run catalog:collect`는 실제 연락 가능한 개발자 식별 정보를 `SEC_USER_AGENT`에 로컬로 설정하고 SEC Fair Access와 접근/이용 조건을 확인한 경우에만 사용합니다. 가짜/예시 연락처로 실제 요청하지 않습니다. 원본·대량 스냅샷·개인 import 파일은 Git 제외 `work/`에 보관합니다.

## 운영 금융 제한과 공개 설정

운영 프로젝트는 `vveljtqmujdzkzmoncjx`입니다. Foundation 및001~003 migration이 적용돼 있으며 금융004~007은 미적용입니다. 이번 프론트엔드 배포는 DB·RLS/RPC·Auth 제공자/SMTP·Cron을 변경하거나 migration을 실행하지 않습니다.

**운영 Pages는 `VITE_ENABLE_MANUAL_TRADING=false`입니다.** 저장된 수기 선호를 지우지 않으면서 선택을 비활성화하고 미적용 수기/배당/세금 RPC를 호출하지 않습니다. 해당 기능의 코드는 허용된 개발 환경의 fixture 검증을 위해 보존하며 운영 활성화는 별도 승인·금융 검증 대상입니다.

`.env.example`과 Pages workflow의 Supabase URL·publishable key는 브라우저용 공개 설정입니다. `service_role`, `sb_secret_`, 관리 토큰·실제 연락처·개인정보를 소스/프론트엔드/VITE 변수/공개 로그에 넣지 않습니다. Auth는 기존 초대 사용자 로그인 링크/선택적 코드 입력을 사용하며 로컬 기록과 사용자별 서버 기록을 구분합니다. 실제 운영 로그인·메일 수신은 별도 검증 범위입니다.

## 배포와 복구

GitHub Pages Source는 GitHub Actions이며 기존 **Deploy Pages**(`.github/workflows/pages.yml`)를 검증된 **main ref**에서 수동 실행합니다. workflow는 Node24·수기 false·기존 시장 참고자료 설정으로 프론트엔드만 빌드/배포합니다. 금융 검증/Cron workflow를 대신 실행하지 않습니다. 성공 workflow와 실제 사이트의 자산/동작 확인 전에는 배포 성공으로 기록하지 않습니다.

중대한 회귀가 발견되면 운영 DB를 임의 변경하지 않습니다. 이전 성공 Pages run의 대상 SHA와 산출물을 확인하고 승인된 복구 절차로만 재배포합니다. 이번 릴리스의 실제 이전 성공 run·롤백 기준·배포 결과는 [최종 기록](docs/release/V0_8_FINAL.md), 다음 작업 기준은 [v0.9 인수인계](docs/handoff/US_STOCK_LAB_V08_TO_V09.md)에 기록합니다.
