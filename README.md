# US Stock Lab
미국주식 모의투자 및 투자 학습 웹앱 · v0.2

## 실행
Node.js 22.12 이상 (현재 검증: 24.19), npm 11.
```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```
테스트는 시스템 `/usr/bin/chromium`을 기본 사용합니다. 다른 위치는 `CHROMIUM_PATH`로 지정합니다. 브라우저가 없다면 `npx playwright install chromium` 후 설치된 실행 파일 경로를 지정하세요.

홈·시장·종목 상세·포트폴리오·학습·설정. 합성 주식/ETF 8종, 캔들차트, 검색, 관심종목 로컬 저장. Hash 경로로 정적 호스팅의 새로고침을 지원합니다. 모든 데이터는 합성이며 실시간/과거 실제 시세가 아닙니다. 가상자금 $100,000 로컬 계좌에서 정수 주식 시장가 매수/매도·부분매도와 가중평균 원가·실현/미실현손익을 제공합니다. 종목 상세의 추가매수 분석은 주문을 실행하지 않습니다. 수수료·세금·배당·환전 비용은 0이며 환율손익은 제외합니다. 거래 기록을 localStorage에 저장하고 재시작 시 재계산합니다. 계좌 초기화에는 확인 문구 입력이 필요합니다. 손상 데이터는 자동 삭제하지 않습니다. Web Locks 지원 브라우저와 보안 컨텍스트(HTTPS 또는 localhost)가 주문에 필요합니다. 이는 개인 데모이며 DB 트랜잭션·인증·사용자별 계좌를 대체하지 않습니다.

## 배포
실제 사이트: https://pchjesus.github.io/us-stock-lab/ — PC·모바일 접속 및 로그인 링크 복귀 검증 완료.
저장소는 Public입니다. GitHub Pages를 사용하려면 Settings → Pages → Build and deployment → Source를 GitHub Actions로 설정하고 Actions의 `Deploy Pages`를 수동 실행합니다. 성공한 배포 작업이 반환한 URL을 브라우저에서 검증해야 배포 완료입니다. Pages는 개발 브랜치에서도 수동 실행할 수 있으며, 실제 성공 URL과 검증 결과는 DEVLOG의 최신 기록을 확인합니다.

롤백: Pages의 이전 성공 워크플로를 재실행합니다. 테스트 스크린샷은 `test-results/`에 생성됩니다.

## v0.3 연결 준비
- v0.2 검증 후 main을 `b5332a7`로 fast-forward 통합. v0.3 및 실제 인증 검증 후 사용자 승인으로 main에 반영. GitHub Pages 보호 규칙에 따라 main에서 배포한다.
- 홈/시장: 미국 3지수·환율·KOSPI·KOSDAQ 합성 카드. 시장 하위 화면에 가상 경제 캘린더와 뉴스(미수집 빈 상태+공식 출처 링크). 일정/수치는 공식 발표가 아닌 교육용 예시. 학습은 10개 개념·5단계 필터. 데스크톱 종목 상세는 차트/정보와 주문/분석을 좌우 배치.
- `.env.example`에는 현재 Supabase 프로젝트의 공개 URL과 publishable key가 들어 있다. 이 두 값은 브라우저 빌드에 포함되는 공개 설정이다. Pages workflow도 같은 공개 설정으로 빌드한다. `service_role`, `sb_secret`, 관리 토큰은 소스·프론트엔드·VITE 변수에 넣지 않는다. 다른 프로젝트를 쓸 때는 로컬 `.env.local`의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 바꾸고 재빌드한다.
- 현재 연결 프로젝트: 조직 `meyqlbmzdshtfbulnotu`, ref `vveljtqmujdzkzmoncjx`, 리전 `ap-south-1`. 기존 프로젝트를 재사용하며 중복 프로젝트를 만들지 않는다.
- `supabase/migrations/202610260001_foundation.sql`은 기존 스키마가 비어 있음을 확인한 뒤 원격 프로젝트에 적용했고, 9개 테이블 및 RLS를 확인했다. v0.4-A는 제한된 주문 RPC만 사용하며 직접 금융 테이블 쓰기는 계속 차단한다. 로그인만으로 서버 계좌 생성·주문·동기화가 가능해지는 것은 아니다.
- Auth는 신규 가입 차단 완료. 앱은 초대 사용자에게 기본 로그인 링크를 요청(`shouldCreateUser:false`)하고 복귀 URL의 세션을 처리·제거한다. 프로젝트 무료 플랜/기본 메일 제공자는 템플릿 수정을 허용하지 않아 코드 표시는 강제하지 않는다. 코드가 포함된 메일은 코드 입력도 가능하다. SMTP 연동·유료 전환은 하지 않았다. 실제 메일 수신은 테스트 수신 주소가 정해진 뒤 별도 확인해야 한다. 기본 메일 제공자는 수신자/발송량 제한이 있으므로 친구 초대 전 확인 필요.
- 로그인/로그아웃은 설정 탭. 비로그인 로컬 계좌는 같은 브라우저에서 공유되고 로그인 후에는 사용자 서버 계좌로 전환됨. 기존 로컬 계좌를 자동 업로드하거나 로그인 사용자의 소유로 표시하지 않음.
- `npm test`: 무설정 fallback, KST 날짜/배너, 시장 빈 상태, 금융 및 PC/모바일 회귀. `npm run test:auth`: 가짜 인증 서버 응답을 사용한 설정 상태 로그인/로그아웃·실패 검증(실제 Supabase 검증과 다름).
- SQL 로컬 재현: 격리된 `postgres:17` 임시 컨테이너에 `tests/sql/bootstrap.sql` → migration → `tests/sql/rls.sql` 순서로 `psql -v ON_ERROR_STOP=1` 실행. bootstrap은 테스트 전용이므로 실제 Supabase에 적용하지 말 것.

## v0.4-A 서버 계좌
로그인 전 로컬 데모, 로그인 후 사용자별 서버 계좌입니다. 기존 로컬 거래/관심종목은 자동 이관하지 않으며 로그아웃하면 복원합니다. 서버 거래는 영구 저장하고 초기화 기능은 제공하지 않습니다. 미확정 주문은 같은 ID로 확인/재시도하세요. 계좌 새로고침/탭 포커스 및 15초 조회로 서버 상태를 반영합니다.

추가 migration은 202610270001/002 순서로 적용합니다(기존 프로젝트 적용 완료). 격리 SQL 검증은 기존 bootstrap → foundation → server_trading → hardening → tests/sql/server.sql, 이어 tests/sql/concurrency.py 순서입니다. `scripts/verify-server.py`는 `US_STOCK_LIVE_TEST=1` 명시 후 실행하는 실제 프로젝트 smoke이며, 관리 토큰은 환경으로만 전달합니다. 메일 미발송 임시 사용자만 만들고 finally에서 삭제합니다. 실행 앱을 TEST_BASE로 지정할 수 있습니다.
