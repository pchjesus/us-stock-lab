# UX1-A 공통 UI·문맥 도움말 통합

기준 `c35879cb9638b0d68b99087e01369439516a4c37`, 작업 브랜치 `codex/ui-v0.8-ux1-a`. 운영 앱 소스에 통합했으며 main 병합·Pages 배포는 하지 않는다.

## 적용한 변경

- `.app.ui-foundation` 범위에 UX0 표면/테두리/강조색 토큰, 44px 컨트롤, 선택·비활성·primary·danger 공통 클래스, 3px focus-visible, Select·period/난이도 그룹 스타일을 적용했다. UX0의 전역 CSS를 복사하지 않았다. 위험 버튼의 화면별 클래스 전환 등 개별 버튼 정리는 UX1-B에 남긴다.
- 헤더는 브랜드/현재 화면 주제, 주요 지표, 미국장 상태·KST/ET, 알림·계정·?·기존 사용 방법을 유지한다. 큰 화면은 세 열, 좁은 PC/태블릿은 두 열, 모바일은 세로 배치한다. 계좌 모드 위치와 화면 본문은 기존 그대로다.
- 모바일 보조 글씨와 지표 기준시각을 12px, 중요 설명·수치를 14px 이상 중심으로 보강했다. 작은 달력 칸의 긴 일정은 기존 잘림·목록 진입 방식 유지. 모든 화면에 대한 접근성 적합성을 인증한 것은 아니다.
- 도움말은 기존 Modal을 재사용한다. 열 때 현재 hash에서 9개 주제 중 하나를 선택하고 사용자가 주제를 바꿀 수 있다. `learn/{symbol}`은 차트 실습실, `stock/{symbol}`은 기업·ETF, calendar/news는 경제 캘린더·뉴스다. 합성 가격·공식 재무·일별 참고환율·미제공·모의 주문가격을 선택형 설명으로 제공한다.
- ‘직접 따라 해보기’는 도움말을 먼저 unmount해 focus/스크롤 잠금 cleanup을 마친 후 기존 Tour를 실행한다. 동시에 열린 모달은 하나다. 기존 화면 이동·Spotlight·이전/다음·건너뛰기·ESC·종료 후 hash/scroll/focus 복원을 유지한다. 원래 ‘사용 방법’ 버튼도 그대로 접근 가능하다.
- 도움말·알림·Tour 중 배경 슬라이더를 정지하고 닫으면 5초 타이머를 재개한다. 지표 자체 hover/focus/팝업 정지와 400ms 세로 전환·reduced-motion은 유지한다. 외부 일시정지 prop 외 지표 정규화 로직 변경 없음.

## 검증과 범위

영향 검증 36/36, 모의 인증/금융 UI 38/38 PASS. 인증 콜백 토큰 제거, 알림 읽음 상태, 기존 실제 7단계 Tour, 계좌·원장 격리 검증이 포함된다. 신규 도움말 검사는 경로별 주제·전환·ESC·focus 복귀·원래 계좌 문서 불변·운영 RPC 0회, help→Tour 전체 진행/ESC 복원, 5해상도 무겹침과 수기 비활성, reduced-motion, 배경 타이머 정지를 검사한다.

최종 빌드는 기존 CI의 참고환율·재무부 옵션 true와 수기 false로 실행한다:

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true VITE_ENABLE_MANUAL_TRADING=false npm run build
npm test
npm run test:auth
```

최종 TypeScript/Vite build PASS, `npm test` 224/224 PASS(최종 전체 실행 1회), `npm run test:auth` 38/38 PASS, `git diff --check` PASS. 미해결 FAIL 없음. 기존 금융 PostgreSQL/SQL 검사는 금융 소스 변경이 없어 G1 검증 근거를 재사용한다. 실제 운영 인증·Windows/모바일 실기기·스크린리더와 WCAG 전체 감사는 NOT VERIFIED다.

기존 8종목·가격 생성·실행·계좌·배당·세금·원장·SQL·RPC·공식 재무 데이터 변경 없음. UI 테스트의 인증과 거래는 fixture/로컬 데모이며 운영 사용자 생성이나 운영 주문은 하지 않았다. UX0 미리보기도 보존한다.

기존 GitHub push workflow는 finance/market의 특정 브랜치만 대상으로 한다. 새 UX1-A 브랜치는 대상이 아니며 Pages는 workflow_dispatch뿐이다. 커밋에 `[skip ci]`를 함께 사용하며 Cron 등록 CI나 Pages를 실행하지 않는다.

## 화면 증거

실제 로컬 앱 Chromium 캡처. 5개 해상도에 두 프로젝트를 적용해 헤더/도움말 20장을 생성했으며 대표 7장만 보존했다. 캡처의 시계는 로컬 실행 당시 브라우저 시각이고 지표·가격은 합성 예시다.

| 화면 | 증거 |
| --- | --- |
| PC 헤더 | [1440px](ux1-a-captures/1440-header.png) / [1200px](ux1-a-captures/1200-header.png) |
| 태블릿 | [768px](ux1-a-captures/768-header.png) |
| 모바일 | [390px](ux1-a-captures/390-header.png) / [320px](ux1-a-captures/320-header.png) |
| 도움말 | [1440px](ux1-a-captures/1440-help.png) / [390px](ux1-a-captures/390-help.png) |

UX1-B에서는 계좌 모드 위치·화면별 버튼/링크를 정리한다. 기업/ETF 탭은 UX2, 홈/학습 진입은 UX3로 유지한다. v0.9-D 실제 종가·신규 카탈로그 거래 활성화는 이번 UI 승인 범위 밖이다. 대규모 리팩터링은 보류하고 이번에는 표시와 모달 전환 경계만 국소 변경했다.
