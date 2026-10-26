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
GitHub Pages: 비공개 저장소를 지원하는 계정 요금제인지 먼저 확인하고 Settings → Pages → Source를 GitHub Actions로 설정합니다. Actions의 `Deploy Pages`를 수동 실행합니다. 성공한 배포 작업이 반환한 URL을 실제 브라우저에서 검증해야 배포 완료입니다. 저장소 공개 전환 금지.

Pages를 사용할 수 없으면 Cloudflare Pages에서 이 비공개 저장소만 연결하고 빌드 `npm run build`, 출력 `dist`, Node 24로 설정합니다. 계정 연결 승인이 필요합니다. 배포 사이트는 별도 접근 통제가 없다면 공개되므로 민감정보를 넣지 않습니다. 해시 라우팅으로 별도 SPA rewrite는 불필요합니다.

현재 GitHub/Cloudflare API는 환경 프록시의 Forbidden 응답으로 접근 불가. 실제 배포 URL 없음. Git HTTPS 접근과 API 접근 권한은 별개입니다. 환경 설정의 API 도메인 허용을 저장·적용한 뒤 인증과 Pages 지원 요금제를 확인해야 합니다.

롤백: Pages의 이전 성공 워크플로를 재실행하거나 Cloudflare에서 이전 배포로 되돌립니다. 테스트 스크린샷은 `test-results/`에 생성됩니다.
