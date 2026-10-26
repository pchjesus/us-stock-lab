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
저장소는 Public입니다. GitHub Pages를 사용하려면 Settings → Pages → Build and deployment → Source를 GitHub Actions로 설정하고 Actions의 `Deploy Pages`를 수동 실행합니다. 성공한 배포 작업이 반환한 URL을 브라우저에서 검증해야 배포 완료입니다. 현재 실제 Pages 배포는 아직 실행하지 않았습니다.

롤백: Pages의 이전 성공 워크플로를 재실행합니다. 테스트 스크린샷은 `test-results/`에 생성됩니다.

## v0.3 연결 준비
- v0.2 검증 후 main을 `b5332a7`로 fast-forward 통합. v0.3 개발은 `codex/supabase-market-v0.3`.
- 홈/시장: 미국 3지수·환율·KOSPI·KOSDAQ 합성 카드. 시장 하위 화면에 가상 경제 캘린더와 뉴스(미수집 빈 상태+공식 출처 링크). 일정/수치는 공식 발표가 아닌 교육용 예시. 학습은 10개 개념·5단계 필터. 데스크톱 종목 상세는 차트/정보와 주문/분석을 좌우 배치.
- `.env.example`에는 현재 Supabase 프로젝트의 공개 URL과 publishable key가 들어 있다. 이 두 값은 브라우저 빌드에 포함되는 공개 설정이다. Pages workflow도 같은 공개 설정으로 빌드한다. `service_role`, `sb_secret`, 관리 토큰은 소스·프론트엔드·VITE 변수에 넣지 않는다. 다른 프로젝트를 쓸 때는 로컬 `.env.local`의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 바꾸고 재빌드한다.
- 현재 연결 프로젝트: 조직 `meyqlbmzdshtfbulnotu`, ref `vveljtqmujdzkzmoncjx`, 리전 `ap-south-1`. 기존 프로젝트를 재사용하며 중복 프로젝트를 만들지 않는다.
- `supabase/migrations/202610260001_foundation.sql`은 기존 스키마가 비어 있음을 확인한 뒤 원격 프로젝트에 적용했고, 9개 테이블 및 RLS를 확인했다. 주문 RPC는 없으므로 브라우저의 금융 데이터 쓰기를 모두 차단한다. 로그인만으로 서버 계좌 생성·주문·동기화가 가능해지는 것은 아니다.
- Auth 설정(신규 가입 비활성화·초대 이메일 OTP·메일 템플릿)은 아직 미설정이다. 설정 후 실제 이메일 발송 검증은 사용자가 테스트 수신 주소를 정한 뒤 수행한다. 앱은 `shouldCreateUser:false`로 이메일+메일 코드 로그인을 요청하며 자동 회원가입/URL 세션 수신은 하지 않는다.
- 로그인/로그아웃은 설정 탭. 로그인 여부와 별개로 로컬 계좌는 같은 브라우저에서 공유됨. 기존 로컬 계좌를 자동 업로드하거나 로그인 사용자의 소유로 표시하지 않음.
- `npm test`: 무설정 fallback, KST 날짜/배너, 시장 빈 상태, 금융 및 PC/모바일 회귀. `npm run test:auth`: 가짜 인증 서버 응답을 사용한 설정 상태 로그인/로그아웃·실패 검증(실제 Supabase 검증과 다름).
- SQL 로컬 재현: 격리된 `postgres:17` 임시 컨테이너에 `tests/sql/bootstrap.sql` → migration → `tests/sql/rls.sql` 순서로 `psql -v ON_ERROR_STOP=1` 실행. bootstrap은 테스트 전용이므로 실제 Supabase에 적용하지 말 것.
