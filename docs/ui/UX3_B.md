# UX3-B · 학습 랜딩·투자 수업·차트 실습실 분리

기준 브랜치 `codex/ui-v0.8-ux3-a`, SHA `9b770c2bc2e92e84e1d226d2ef1e55d146973dbc`와 부모 `e2ae827fdb8bd6e389e57f75720478a3dcc652fb`, 원격 HEAD/main `51474c2904856e1668bacb815c7fd58ed83e177b`, clean 작업 트리·신규 브랜치 부재를 확인했다. 기존 checkout에서 `codex/ui-v0.8-ux3-b`를 생성했다. worktree/새 저장소·초기화는 사용하지 않았다.

## 실제 경로와 화면

| 경로 | 실제 내용 | 도움말 |
| --- | --- | --- |
| `#learn` | 기초 투자 수업 / 차트 실습실의 두 선택 카드. PC2열·모바일1열 | 학습 |
| `#learn/lessons` | 기존10개 수업,6개 단계 선택(전체 포함), 제목/펼침/본문/직접 해보기 | 학습 |
| `#learn/lab` | 기본 AAPL 차트 실습실 | 차트 실습실 |
| `#learn/{symbol}` | 기존 AAPL/MSFT/NVDA/AMZN/GOOGL/VOO/QQQ/SCHD의 합성 차트 | 차트 실습실 |
| 그 밖의 `#learn/...` | 학습 화면 없음과 실제 수업/차트 이동 카드. 임의 AAPL fallback 없음 | 학습 |

`learningRoutes`가 정확한 경로만 해석하고 Learning과 ContextHelp가 같은 판정을 사용한다. 새 이름과8개 심볼은 충돌하지 않는다. 각 하위 화면은 학습 선택으로 돌아갈 수 있고 수업↔차트도 직접 이동할 수 있다. 홈/사이드바의 기존 `#learn`, 기업·ETF의 `#learn/{symbol}` 링크는 그대로다.

현재 운영 Learning/main과 관련 링크·테스트를 조사한 결과 **lesson 쿼리·단계 필터 URL·개별 lesson URL을 해석하는 기존 구현은 없었다.** 기존 수업 ID와 `lesson-{id}` DOM 식별자는 있었으므로 그대로 보존한다. 구현되지 않았던 쿼리/필터를 지원했다고 간주하거나 불필요한 호환 어댑터를 추가하지 않았다. UX0 독립 제안의 기존 앱 링크도 기본 `#learn`과 `#learn/AAPL`이었다.

## 수업과 차트 보존

수업의 주식·ETF·미국 시장·환율·배당·금리·경제지표·물타기/불타기·분산투자·뉴스10개 배열을 변경하지 않았다. 기준 커밋에서 추출한 ID/stage/title/body/practice 전체 JSON의 SHA256은 `cb7cdd8b24864e45ea8adbdb9d4c59ee5269b9ab99632a75c1efd0de895afa7d`이며 신규 검사에서 대조한다. 단계 분류·제목·본문·직접 해보기의 의미나 문구 수정은 없다.

단계는 기존 aria-pressed 선택을 유지하고 선택 단계/수업 수를 표시한다. 각 수업은 기존 section ID와 하나만 펼치는 동작을 유지한다. 버튼은 aria-expanded/aria-controls와 안정적인 ID를 제공하고 본문은 hidden으로 공개 여부를 구분한다. 필터 후 다시 돌아와도 기존 open 선택을 유지한다. 학습 하위 경로를 오갈 때 단계/수업 선택은 같은 Learning의 메모리에 유지하고, 다른 전역 화면으로 나가거나 새로고침하면 기존처럼 기본 상태로 시작한다. 새 저장 키는 만들지 않았다.

**ChartLab·chartIndicators·uiData·data 소스는 수정하지 않았다.** 캔들/선·모든8개 기간·초급/중급/고급·SMA5/20/60·Wilder RSI14·지지/저항 후보·봉 선택/OHLC·가상 거래량·native 종목 선택과 chart.period 저장/실패 처리를 그대로 사용한다. 종목 변경 시 봉 선택/후보선은 초기화하고 난이도/차트 모양/지표 선택/기간은 기존 같은 ChartLab 인스턴스에 유지한다. 실습실을 나가면 기존 cleanup의 chart.remove가 실행되고 돌아오면 저장 기간과 기본 난이도로 새로 mount한다. 실제 autoSize ResizeObserver1개/가격+RSI2개가 화면 이동 후0개로 정리되는 것을 검사한다. 라이브러리 내부 canvas observer 전체 개수와 혼동하지 않는다.

신규 코드는 표시·탐색과 수업 UI만 분리한다. 차트는 학습용 합성 예시이며 실제 시세나 주문가격이 아님을 유지한다. 가짜 장식 그래프·신규 시세/API·금융 계산/상태/저장 계층을 추가하지 않는다.

## 접근성과 Tour

기존 토큰·밝은 배경·흰색 카드·중립 선택/파란 링크를 사용한다. 전체 카드는 실제 anchor이며 동작 설명과 이동 표시를 제공한다. 수업 단계/확장은 실제 버튼으로 키보드 Enter/Space, focus-visible, 선택 배경/굵기를 제공한다. 긴 제목·문구는 줄바꿈하고 주요 조작은44px 이상이다. 기존 짧은 차트 기간 버튼의 너비가44px 미만인 경우만 학습 화면 범위에서 최소 너비를 보완했다. 새 애니메이션 없이 reduced-motion을 유지한다.

화면 종류가 바뀌면 새 제목에 초점을 두고 학습 화면 시작으로 이동한다. 열린 dialog의 초점을 빼앗지 않고 같은 실습실의 종목 변경에서는 select 초점을 유지한다.

Tour3단계는 기존 `#learn/AAPL`의 실제 `.chart`를 유지한다. 7단계만 `#learn/lessons`의 `.lesson-stage-filters`로 변경해 실제 수업 단계 선택을 안내한다. 나머지 단계·주문 탭 활성화·대상 스크롤/측정·원래 경로/초점/스크롤 복원은 유지한다. 공통 Modal·금융 모달·Tour 생명주기를 리팩터링하지 않았다.

주요 위험은 새 경로를 심볼로 오인하는 것, 화면 전환 시 차트 리소스 잔존, 수업 원문/ID 소실, Tour 마지막 대상 부재였다. 정확한 route 판정·기존 ChartLab 재사용·내용 해시/전체 UI 대조·실제7개 대상 위치 검사로 대응했다. 상태 소유권을 바꾸는 대규모 리팩터링은 불필요하며 공유 상태 변경이나 동일 원인 반복 회귀 때 재검토한다.

## 이번 단계 검증

이전 UX3-A 결과를 새 PASS로 합산하지 않는다.

```sh
VITE_ENABLE_MARKET_FX=true VITE_ENABLE_TREASURY_STATS=true VITE_ENABLE_MANUAL_TRADING=false npm run build
npm test -- --workers=2
npm run test:auth -- --workers=2
npx playwright test --config playwright.release.config.ts --grep 'release defaults' --workers=1
git diff --check
```

| 검사 | 결과 |
| --- | --- |
| 변경 전 학습·차트·도움말·Tour 기준선 | 10/10 PASS |
| 기존 경로를 새 실제 사용자 이동으로 바꾼 영향 검사 | 56/56 PASS |
| 짧은 버튼/차트 cleanup 보완 후 해당 검사 | 4/4 PASS |
| 최종 학습·계산·조작·도움말·Tour 통합 영향 | 50/50 PASS · production React 동작의 Vite 개발 서버 |
| 신규 학습 시나리오 | 14/14 PASS ·7개×desktop/mobile, 통합/전체 합계에 포함되며 중복 합산하지 않음 |
| 인증 상태의 학습 이동 | 2/2 PASS · 계좌/관심종목 보존, 학습 이동으로 추가 금융 RPC0 |
| 최종 인증·수기·배당·세금 UI fixture | 50/50 PASS · 신규 학습 이동의 사용자 상태/RPC 검사2개 포함 |
| 최종 TypeScript/Vite build | PASS · 정상화 후 최종1회 |
| 최종 production 전체 앱 UI | 292/292 PASS · 최종 Vite 산출물, 전체 실행1회 |
| production 수기 false 게이트 | 1/1 PASS · 랜딩/수업/기본·종목 실습실 포함, 저장 선호 보존·수기/배당/세금 RPC0 |
| git diff --check | PASS |
| 금융 PostgreSQL/SQL | NOT VERIFIED · 이번 미실행. 금융/DB 원본 불변으로 UX3-A에서 참조한 B2/G1 선행 검증 근거 재사용 |
| 실기기·스크린리더/WCAG 전체·운영 Auth·실시간 운영 자료 | NOT VERIFIED · Chromium desktop/touch 및 인증 fixture로 범위 제한 |

신규 `learning-navigation.spec.ts`는 정확한 route/도움말 분류와 수업 원문 해시, 실제 두 카드·뒤로/앞으로/새로고침·잘못된 경로,10개 수업/ID/모든 단계/본문/실습/접기,8개 종목 직접 URL·새로고침·기간, 종목 변경의 상태 경계/observer 정리, 모든7개 Tour 위치와 종료/건너뛰기/ESC 복원,5개 폭의44px·키보드/터치·focus-visible/reduced-motion·넘침/겹침/JS 오류·계좌/관심종목 원본과 익명 금융 RPC0을 검사한다. 기존 차트 검사는 SMA/RSI/OHLC·실제0/자료 부족·모든 종목/기간·후보선 변화를 계속 검사한다.

첫 신규 실행은10PASS/4FAIL이었다. 실제 짧은 기간 버튼의 너비44px 미만을 scoped CSS로 보완했다. cleanup 검사도 모든 canvas observer를 chart 수와 동일하다고 가정한 계측을 autoSize container observer로 바로잡았다. 기존 차트 구현은 수정하지 않았다. 해당4/4 재검증 PASS. 기존 테스트의 범위/수치 기대값을 삭제·완화하거나 skip하지 않았다.

영향 UI는 production React 동작으로, 최종 전체 앱과 false 게이트는 실제 최종 Vite 산출물에서 검사했다. 최종 production 미해결 FAIL은0건이다. 기존 개발 StrictMode의 공통 Modal 초점 복귀 제한과 Vite auth 정적/동적 import·500KB 초과 chunk 경고는 이번 범위에서 수정하지 않았다. production 결과와 개발 환경의 기존 제한을 구분한다.

## 화면 증거

최종 production 산출물의 실제 Chromium 캡처6장이다. PC는1440×1000 viewport의 fullPage, 모바일은390px 폭에서 문서 높이로 viewport를 늘려 고정 하단 탐색이 캡처 중간을 덮지 않도록 촬영했다. 실제 자동/터치 검사는 별도로844/950/1000px 높이와5개 폭에서 수행한다. 시계는 `2026-11-03T00:00:00Z`로 고정했다. 수업은 기존 원문, 차트/지수는 기존 합성 예시다. 실습 캡처는 AAPL·일·고급·SMA5/20/60·RSI14와 사용자가 입력할 수 있는 후보210/230의 **시연 상태**이며 실제 투자 신호·시세가 아니다. 새 시장 자료나 개인 금융 데이터를 수집하지 않았다.

| 화면 | PC1440px | 모바일390px |
| --- | --- | --- |
| 학습 랜딩 | [보기](ux3-b-captures/1440-landing.png) | [보기](ux3-b-captures/390-landing.png) |
| 투자 수업·ETF 펼침 | [보기](ux3-b-captures/1440-lessons.png) | [보기](ux3-b-captures/390-lessons.png) |
| 차트 실습실·기존 지표/후보선 | [보기](ux3-b-captures/1440-lab.png) | [보기](ux3-b-captures/390-lab.png) |

## 운영·다음 단계

Pages는 workflow_dispatch 전용이며 finance/market push는 과거 전용 브랜치만 대상으로 한다. UX3-B는 해당 필터 대상이 아니고 schedule 등록도 없다. 개발 브랜치에만 `[skip ci]` 커밋·push하며 승인 없는 workflow 실행·main 병합·Pages 배포·운영 Supabase DB/Auth/Cron 변경을 하지 않는다. 금융 migration004~007·RPC/RLS·원장/체결·배당/세금·운영 수기 false 게이트도 그대로다.

기준 대비 ChartLab/chartIndicators/uiData/data·TradingUI/금융 저장/계산·Auth/watchlist·시장자료/헤더 슬라이더·홈/기업/ETF 상세·ManualUI/배당/세금·supabase/.github 소스는 불변이다. main은 Learning에 route를 전달하는 부분, ContextHelp는 학습 route 분류, UiPanels는 Tour7단계 경로/대상만 변경했다. 공통 Modal과 Tour 복원/측정 로직은 그대로다.

개발 결과: **Ready · A4-C2 진행 가능**. 필수 UX3-B 기능의 미완료 차단 항목은 없다. 기존 개발 StrictMode 제한과 실기기/스크린리더 확인은 후속 보완 대상이다. A4-C2의 카탈로그 자료 취득/검증과 A5 검색·실제 시세·운영 금융 전환은 이번에 수행하지 않는다. UI 커밋 revert로 복구할 수 있고 데이터 마이그레이션은 없다. 개발 검토와 운영 반영 승인은 별개다.
