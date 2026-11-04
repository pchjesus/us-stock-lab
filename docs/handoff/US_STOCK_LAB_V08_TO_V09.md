# US Stock Lab · v0.8 → v0.9 인수인계

## 1. 실제 main과 작업 기준

- 저장소: `pchjesus/us-stock-lab`.
- 원격 main 최신 조회값: **`4a1e9f7c74254ea58b6fb61d6f90f1277f4791fa`**, 조회시각 `2026-11-04T09:30:49+00:00`.
- 승인된 개발 시작점: `d8b8ba1e69599124a076721b68e2c64232c1cc6e`, 최종 앱 정리 `59e1367c5cdf8047d4577622587439a07802a7ef`, [PR #3](https://github.com/pchjesus/us-stock-lab/pull/3) merge가 위 main이다. 기존 main51474c2를 덮어쓰거나 이력을 삭제하지 않았다.
- 배포/앱 검증 기준은 위 SHA로 고정한다. 이 인수인계·배포 결과·실제 캡처를 담는 후속 커밋은 문서 전용이다. 문서 자체를 포함하는 미래 커밋 SHA를 미리 만들지 않으므로, **다음 작업은 원격 main을 다시 조회해 최신 문서 커밋까지 포함한 HEAD를 기준으로 시작**한다. 위 실제 조회 SHA가 조상이고 후속 차이가 문서뿐인지 확인한다. 최종 응답의 main HEAD와 이 조회 시점/앱 배포 SHA를 구분한다.

## 2. 실제 Pages 배포

- 앱 배포 SHA: **`4a1e9f7c74254ea58b6fb61d6f90f1277f4791fa`**, ref `main`.
- workflow: **Deploy Pages**, ID `396830197`, `.github/workflows/pages.yml`, `workflow_dispatch`.
- 실행: **[41807180809](https://github.com/pchjesus/us-stock-lab/actions/runs/41807180809)**. 2026-11-04T09:24:07Z~09:24:39Z, npm ci/build/artifact/Deploy 모두 **success**.
- URL: **https://pchjesus.github.io/us-stock-lab/**.
- 실제 HTTP200 및 HTML/JS2/CSS1의 SHA-256이 로컬 검증 빌드와4/4 일치한다. 앱 entry는 `assets/index-CLeqFcvG.js`이며 과거 배포의 `index-C-IrvOYb.js`와 다르다. 전체 해시는 [최종 기록](../release/V0_8_FINAL.md)에 있다.
- 운영 smoke **81/81 체크 PASS**: 5개 폭의 홈·8종목 검색·후보미가져옴·기업AAPL/ETF VOO4탭·학습랜딩/10수업/차트·포트폴리오·설정/로그인입력UI·수기disabled·PC7단계Tour. JS 오류/가로 넘침/금융·인증 쓰기 요청0. 실제 로그인/이메일/주문을 실행한 검증은 아니다.

## 3. 완료된 기능과 금융 경계

- UX0 레퍼런스와UX1 공통 토큰/컨트롤/문맥 도움말, UX2 기업5종/ETF3종의4탭, UX3 홈의 계좌/시장요약/관심/탐색·학습랜딩/수업/차트 분리.
- 기존8종목 **AAPL/MSFT/NVDA/AMZN/GOOGL/VOO/QQQ/SCHD**만 합성 모의 주문/가격/관심종목을 지원한다. 기존 계좌·원장·계산·합성 캔들·Auth/사용자 격리·서버 저장/로컬 복원 계약 불변이다.
- A4-C1/C2의 정규화·SEC 개발 수집기·스냅샷 로더, A5-A 오프라인 export·브라우저 개인 파일 import·검색/읽기 전용 상세를 제공한다. 후보는unknown/unverified/`tradeEligible=false`. 같은 티커도 금융 상세/기존 종목과 자동 연결하지 않는다. 후보 주문/가짜 가격/수익률/관심 편입 없음.
- 파일은32MiB/50,000후보 한도,50개씩 표시하며 메모리만 사용한다. 새로고침/사용자 변경/로그아웃 후 재가져오기 필요. 업로드·자동 저장·자동 SEC 수집 없음. 원본/큰 snapshot/import는Git제외work/에만 보관한다. 해시는 SEC 인증/현재 상장/재배포 권한 증명이 아니다.
- 계좌는 비로그인 로컬/로그인 사용자 서버로 구분하며 자동 이관하지 않는다. 실제 거래·증권계좌 연결·자금이동은 영구 금지한다.

## 4. Supabase 운영 상태

- 프로젝트 `vveljtqmujdzkzmoncjx`. 읽기 전용 migration 목록: foundation20261026135037, server_trading202610270001, order_hardening202610270002, market_hours202610270003.
- **금융 migration004~007은 미적용**이다. 이번 프론트엔드 배포에서 DB/스키마/RLS/RPC/Auth 제공자/SMTP/Cron을 변경하거나 운영 데이터에 쓰지 않았다.
- Pages는 계속 **`VITE_ENABLE_MANUAL_TRADING=false`**다. 저장된 수기 선호는 보존하고 선택을 disabled로 표시한다. 미적용 수기/배당/세금/신규 주문 RPC0을 local production gate로 검사했다. 수기/배당/세금 코드는 허용된 개발 fixture에서만 검증한다.
- URL/publishable key는 의도된 공개 설정이며 관리 secret과 다르다. 관리 토큰·service_role·실제 연락처/개인정보를 저장소/dist/로그/VITE 변수에 넣지 않는다.

## 5. 데이터 출처와 검증 상태

- 기업5종 공식 SEC 재무 **219관측/200원문근거/19계산값** 보존. 기간·단위·원문·제출/확인일·계산 입력을 유지한다. 미제공 분기 보간/임의TTM/미검증비율 계산 금지.
- ETF3종은 발행사 공식 상품 정보만 사용한다. 확인되지 않은 보유 구성비·총보수·분배금은미확인/미제공이다.
- 주문/차트학습/예시지수는 합성이다. 실제 참고환율·재무부 통계·외부 차트는 별도 출처/기준시각/오류/재조회 계약을 유지하며 합성 주문 가격과 혼합하지 않는다. 실제 참고 API 실응답 검증을 이번 hosted smoke로 주장하지 않는다.
- **실제 SEC 수집·배포 가능한 전체 미국 상장 카탈로그: NOT VERIFIED**. fixture export/import는 실제 공식 자료 성공이 아니다. 실제 담당자 식별 정보/SEC접근/이용권한·최신성·식별자/상장검증이 선행돼야 한다. Nasdaq 데이터 권한도 별도 확인이 필요하다.

## 6. 이번 검증과 남은 제한

이번에 새로 실행: production build PASS, 전체앱318/318, 인증/금융fixture52/52, release6/6, 시장/재무fixture4/4, UX0레퍼런스3/3 PASS(총383). GitHub 자동 CI의 결과와 구분한다. Pages workflow 자체 build/deploy는 별도로success다. 1440/1200/768/390/320px·키보드/터치/focus-visible/reduced-motion·외부실패/대체링크를 검사했다. 비밀 패턴/개인스냅샷 포함0, 기존 테스트 삭제/skip 없음.

남은 제한: Vite auth 정적/동적 import 및 큰 chunk 경고, 기존 개발 StrictMode 모달 초점 제한(공통/금융 모달을 리팩터링하지 않음). 이번 필수/운영 smoke 미해결FAIL은 없다. 실제 SEC·운영 Auth 로그인/메일·실기기·스크린리더/WCAG전체·금융 PostgreSQL 신규실행은 **NOT VERIFIED**. DB 소스 불변으로 기존 선행 DB근거를 재사용했으며 새 PASS로 합산하지 않는다.

이전 성공 배포: [41562090798](https://github.com/pchjesus/us-stock-lab/actions/runs/41562090798) / `51474c2904856e1668bacb815c7fd58ed83e177b`. 중대 문제 시 이 대상/산출물을 먼저 확인·보고하고 임의 DB복구/force push/hard reset은 하지 않는다. 승인 없는 workflow/운영 금융 전환은 금지한다.

## 7. v0.9 개발 로드맵

1. A5-B: 개인 로컬 탐색의 실제 사용성/파일 오류/성능을 필요에 따라 보완하고 거래/정보 경계를 계속 검사한다.
2. 실제 SEC 수집은 진짜 담당자 식별 정보와 허용 환경에서 별도 검증한다. 권리·최신성·식별자 검증 전에는 대량 공개 통합하지 않는다.
3. 실제 전일 종가·가격 수집은 합성 거래와 별도 데이터 계약으로 진행한다. 신규API/금융서버/거래 허용 확대는 이번 승인에 없다.
4. 운영Auth/메일·실기기/스크린리더·번들 개선은 요청 범위와 재현 근거를 정해 진행한다.
5. 금융 G1-C3·004~007 운영 적용·수기 활성화는 별도 승인/검증 전 **NO-GO**다.

## 8. 다음 Codex 작업 기준

기준 브랜치 **main**, 앱/배포 기준 SHA **`4a1e9f7c74254ea58b6fb61d6f90f1277f4791fa`**. 문서 전용 마감이 main에 추가되므로 시작 때 `git ls-remote origin refs/heads/main`을 조회하고 그 최신 SHA로 기준을 확정한다. 기존checkout/미커밋 작업을 보존하고 새worktree/저장소/파괴적초기화를 하지 않는다. 먼저 이 문서와 V0_8_FINAL.md, 다음 과제의 실제 의존 파일만 읽는다. 새 기능 목표는 사용자의 다음 요청으로 확정한다.

## 9. 다음 대화에 붙여 넣을 프롬프트

```text
US Stock Lab v0.8 인수인계 후 다음 작업을 시작한다.
Repository: pchjesus/us-stock-lab. 기존 checkout 사용, 새 worktree/저장소/파괴적 초기화 금지.
main 앱 통합·Pages 배포 기준: 4a1e9f7c74254ea58b6fb61d6f90f1277f4791fa.
Deploy Pages 성공 run: 41807180809, https://pchjesus.github.io/us-stock-lab/.
후속 문서 커밋이 있으므로 원격 main 최신 HEAD·부모·작업 트리를 다시 확인하고 최신 main SHA를 작업 기준으로 확정한다.
먼저 docs/handoff/US_STOCK_LAB_V08_TO_V09.md와 docs/release/V0_8_FINAL.md를 읽고, 다음 사용자 목표의 실제 의존 파일만 확인한다.
UX0~UX3·기업/ETF4탭·기존8종목·219재무관측·학습10수업/8차트·A4수집기/A5-A로컬후보탐색을 보존한다.
개인 후보는 조회만 가능하며 기존 금융 상세/주문/관심 목록과 심볼만으로 연결하지 않는다. 실제 SEC 전체 카탈로그는 아직 NOT VERIFIED다.
Supabase vveljtqmujdzkzmoncjx의004~007은 미적용이고 Pages 수기는false다. 운영DB/Auth/RLS/RPC/Cron·금융계산·기존8종목·거래허용을 임의 변경하지 않는다. 실거래/증권계좌 연결/자금이동은 금지한다.
이번 통합 로컬383건과 hosted81체크는PASS지만 실제SEC·운영Auth/메일·실기기/스크린리더·신규PostgreSQL검증은NOT VERIFIED다. 과거PASS를 새 검사로 표시하지 않는다.
다음 기능 개발·병합/배포 범위는 이번 새 사용자 요청에 따라 정하고 이전 배포 승인을 미래 변경에 자동 재사용하지 않는다.
```
