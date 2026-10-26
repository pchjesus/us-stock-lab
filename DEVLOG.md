# 개발 기록
## 2026-10-26 · Week 1
- README만 있던 초기 커밋에서 React/TS/Vite 및 Lightweight Charts 구성.
- 6개 기본 화면과 상세, 검색·관심종목 저장/해제·합성 캔들 구현. 가상계좌는 빈 상태로 명시.
- npm install / TypeScript 및 Vite build PASS. Chromium Playwright PC 1440×1000·모바일 390×844 총 4개 PASS: 화면 이동, 검색, 캔들 렌더링, hash 새로고침, 저장 복원/해제, 학습 펼침, 가로 넘침, 손상 데이터/중복/저장 실패. JS 런타임 오류 없음. 차트 스크린샷 생성 및 모바일 시각 확인.
- 기존 기능 회귀 대상은 README 외 없음. 초기 단일 앱이라 구조 리팩터링 불필요. 이후 계좌/주문 도입 시 별도 도메인 모듈 추출.
- GitHub API와 Cloudflare API 프록시 Forbidden. Pages 요금제/설정 미확인, 실제 배포 미완료. 환경 도메인 허용 초안 저장됨. 인증 승인 및 네트워크 적용 후 재개.
