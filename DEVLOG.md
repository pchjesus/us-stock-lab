# 개발 기록
## 2026-10-26 · Week 1
- README만 있던 초기 커밋에서 React/TS/Vite 및 Lightweight Charts 구성.
- 6개 기본 화면과 상세, 검색·관심종목 저장/해제·합성 캔들 구현. 가상계좌는 빈 상태로 명시.
- npm install / TypeScript 및 Vite build PASS. Chromium Playwright PC 1440×1000·모바일 390×844 총 4개 PASS: 화면 이동, 검색, 캔들 렌더링, hash 새로고침, 저장 복원/해제, 학습 펼침, 가로 넘침, 손상 데이터/중복/저장 실패. JS 런타임 오류 없음. 차트 스크린샷 생성 및 모바일 시각 확인.
- 기존 기능 회귀 대상은 README 외 없음. 초기 단일 앱이라 구조 리팩터링 불필요. 이후 계좌/주문 도입 시 별도 도메인 모듈 추출.
- GitHub API와 Cloudflare API 프록시 Forbidden. Pages 요금제/설정 미확인, 실제 배포 미완료. 환경 도메인 허용 초안 저장됨. 인증 승인 및 네트워크 적용 후 재개.

## 2026-10-26 · v0.2 로컬 가상매매
- 원격 main을 fetch하여 기준 b308309과 일치 확인, codex/paper-trading-v0.2에서 작업. 기존 탐색/차트/관심종목/학습 UI 유지.
- 순수 센트 정수/BigInt 계산, 가중평균·부분매도 원가 배분·실현/미실현손익, $100,000 초기자금. 검증된 합성 시장가 주문만 허용.
- 계좌 저장은 버전 있는 단일 체결 로그. 재생으로 현금/보유원가/원장 일관성 확보. Web Locks와 확인 시점 토큰으로 중복/오래된 확인 차단. 저장 성공 후 UI 갱신, 손상 원본 보존 및 문구 확인 초기화.
- 종목 상세 주문 검토/체결, 분석 전용 추가매수 시뮬레이터, 홈 계좌 요약, 포트폴리오 보유/손익/거래원장 연결. 개인 로컬 데모·비용 0 가정 안내.
- PASS: TypeScript/Vite build. 금융 단위 4사례를 두 프로젝트에서 8회 실행($100×10+$80×5=$93.33 표시, 잔고/수량/숫자 오류, 부분/전량매도, 중복 ID, 자산/원장 불변식, 복원/손상 거절).
- PASS: 기존 v0.1 PC·모바일 4회. 신규 PC·모바일 브라우저 12회(정상 매수/추가매수/부분·전량매도/분석, 확인 초기화/취소, 저장 실패, 중복 클릭, 손상 복구, 두 탭 충돌, 실제 Chromium 프로필 종료/재실행, 잠금 대기 로딩). 전체 20회 통과 후 추가 프로필/로딩 검증 포함 거래 테스트 12회 통과; 총 24개 테스트 조합 검증. 모바일 초기화 테스트의 조기 새로고침은 성공 상태 대기 조건으로 수정. PC·모바일 포트폴리오 스크린샷 생성, 모바일 시각 확인.
- 범위 내 국소 모듈 추가만 수행, 대규모 리팩터링 불필요. 후속: Supabase Auth/RLS 및 서버 원자적 주문·원장 처리. 배당 지급/환율손익·배포 재검증은 이번 범위 밖. 실제 매매 API 호출 없음.

## 2026-10-26 · v0.2 통합 / v0.3 기반
- 원격 v0.2 b5332a7에서 빌드·24개 금융/PC·모바일 회귀 PASS 후 main을 동일 SHA로 fast-forward·푸시. 이후 codex/supabase-market-v0.3에서만 확장.
- Supabase SDK·공개 env 예시·초대 이메일 OTP/로그아웃·미설정 fallback. 관리/서비스 키는 프론트 금지, 서버 전용 키 빌드 차단 확인. 인증 화면 지연 로드. 서버 계좌와 로컬 데모를 명시적으로 분리.
- 9개 테이블 SQL migration/RLS 준비. 실제 일회용 PostgreSQL 17에서 migration, 익명 비공개 데이터 차단, 두 사용자 격리, 금융 쓰기 차단, 중복 주문키·수량·교차 계좌 원장 FK 검증 PASS. 테스트 auth 스키마는 Supabase 전용 auth와 동등한 인터페이스의 로컬 fixture이며 실프로젝트 검증과 구분.
- 합성 한국/미국 6지표, 8종 교육용 가상 경제 일정, KST 날짜 기반 중요 이벤트 배너, 결과와 해설 구분, 뉴스 빈 상태/공식 출처 5개, 학습 10개 개념/5단계. 자동 RSS 수집·실제 지표/뉴스는 연동예정. 배당/환율 타입 경계 및 안내 유지.
- PASS: 빌드/타입, 금융/기존/신규 PC·모바일 총 32개; 별도 mock 인증 서버 기반 OTP/로그아웃·실패 4개; PostgreSQL SQL/RLS 검증. 시장 경계/빈 UI 8개 추가 재검증. 가상 데이터→공식 라벨 오표시 없음. 기존 학습 회귀 selector는 의도된 신규 제목에 맞춰 변경, 검증 내용 유지. 데스크톱 상세 좌우/모바일 단일 열, 가로 넘침/캘린더 스크린샷 확인.
- 사용자 조직 링크 meyqlbmzdshtfbulnotu 확인, 프로젝트 생성 요청 승인됨. 실제 관리 API 자격증명이 없어 프로젝트 생성·실서버 Auth·원격 migration은 아직 실행 못 함. 환경 설정에 SUPABASE_ACCESS_TOKEN 비밀값 요구 및 api.supabase.com 목적지, 공개 빌드 변수 요구 저장. 토큰은 채팅/앱 번들 금지. 사용자 등록 후 프로젝트 생성부터 재개.
- 대규모 리팩터링 없음. v0.3는 main 미병합, 실제 배포 미실행. 이후 서버 주문 RPC·로컬 계좌 이관은 별도 구현.


## 2026-10-26 · Supabase 원격 연결
- 기준 원격 브랜치 `codex/supabase-market-v0.3`가 요청 기준 SHA `07ce49087d092fac5321637d6ce866ba309aad38`에 있음을 확인했다. 현재 실행 컨테이너에는 `SUPABASE_ACCESS_TOKEN`과 다른 Supabase 환경 변수가 노출되지 않았지만, 연결된 Supabase 도구의 조직/프로젝트 조회 및 DB 작업은 성공했다.
- 조직의 기존 `us-stock-lab` 프로젝트(ref `vveljtqmujdzkzmoncjx`)를 재사용했다. 상태 `ACTIVE_HEALTHY`, 리전 `ap-south-1`; 새 프로젝트 생성이나 유료 업그레이드는 하지 않았다.
- 기존 public 스키마와 migration 이력이 비어 있음을 확인한 후 원격 migration `202610260001_foundation`을 적용했다. 9개 테이블, 모두 RLS 활성화, migration 이력 등록 확인. anon role로 published/unpublished 임시 market_events 2개를 조회해 공개 1개만 보이는 것 확인 후 임시 행 2개를 삭제하고 잔여 0개 확인.
- Supabase security advisor 결과 lint 없음. Performance advisor 정보: `paper_cash_ledger` 복합 FK 인덱스 권고 1건과 사용되지 않은 인덱스 2건. 금융 테이블 쓰기 권한은 anon/authenticated 모두 없음.
- 프로젝트 URL/publishable key는 공개 클라이언트 설정으로 `.env.example`과 Pages workflow에 연결했다. service_role, sb_secret, 관리 토큰은 추가하지 않았다. 공개 키가 실제 빌드에 포함되는 것은 의도된 동작.
- 신규 가입 제한·초대 이메일 설정·OTP 메일 템플릿·실제 로그인 검증은 미완료. 현재 Supabase 연결 도구는 Auth 프로젝트 설정 편집/초대 발송 기능을 제공하지 않는다. 실제 메일 발송은 사용자가 테스트 수신 이메일을 정한 뒤 진행해야 한다.
- 실제 앱 빌드/브라우저 테스트는 현재 실행 디렉터리에 저장소 checkout이 없어 재실행하지 않았다. 기존 32개+모의 인증 4개 결과는 이전 로컬 검증 기록이며 이번 원격 검증과 구분한다. Pages 배포도 실행하지 않았다. 개발 브랜치에만 반영한다.

## 2026-10-26 · 게시 후 실제 인증 검증 및 링크 로그인 보완
- 환경 게시 후 관리 토큰 바인딩/런타임 주입과 Management API 인증 성공. 원격 최신 01df7d5를 fast-forward로 받아 기존 프로젝트/원격 migration 적용 기록을 보존. ref vveljtqmujdzkzmoncjx의 9개 테이블 및 RLS/권한을 재확인했고 중복 생성/재적용하지 않음.
- Auth 신규 가입 차단 적용. 무료 플랜+기본 메일 제공자는 이메일 템플릿 수정을 HTTP 400으로 거절(유료 또는 custom SMTP 요구). 요금제/SMTP는 변경하지 않고 기본 로그인 링크를 지원하도록 SDK URL 세션 처리와 설정 화면 복귀·토큰 제거를 보완. 코드가 있는 메일의 OTP 입력도 유지.
- 실제 Auth 임시 사용자 2명으로 이메일 OTP 검증, REST 두 사용자 계좌/프로필/관심종목 격리, 익명 금융 읽기 차단, 타인 관심종목 쓰기/금융 잔고 변경 차단 PASS. Admin generate_link는 메일을 발송하지 않음. 실제 링크를 Chromium에서 열어 앱 복귀·URL 토큰 제거·로그아웃 PASS. 테스트 사용자와 관련 데이터 삭제 후 auth.users 0 확인.
- PASS: 현재 공개 연결 설정 빌드/타입, 금융/PC·모바일 회귀 32개, 모의 인증 4개, 별도 무설정 dev 서버 fallback 확인. 시장 UI 회귀는 미연결/연결 두 상태를 허용하도록 보완. 실제 메일 배달·친구 초대는 수신자 미지정으로 미실행.
- Auth production redirect는 GitHub Pages 사이트 경로, 로컬 개발/검증 포트만 허용. GitHub API에서 저장소 Public 및 Pages workflow 설정 확인, 가시성 변경은 수행하지 않음. main은 v0.2 유지, v0.3 개발 브랜치 수동 배포 예정.
- 로그인 링크 복귀/토큰 제거와 만료 링크 실패 표시를 자동 회귀에 추가: 모의 Auth PC·모바일 8개 PASS. 첫 개발 브랜치 Pages 실행 40341275998은 보호 규칙으로 runner 시작 전 거절됨. 사용자에게 main 병합/배포 승인을 받았으며 보호 규칙 변경 없이 main에서 배포 진행.

## 2026-10-26 KST · v0.3 main 배포 확인
- 사용자 승인 후 v0.3을 main에 fast-forward 통합. 배포 앱 SHA 590f4c5912298cd1994e9c39f799c9c3ad4b70c2. GitHub Actions Deploy Pages run 40342093140 성공(기존 보호 규칙 유지).
- 실제 URL https://pchjesus.github.io/us-stock-lab/ 에서 PC 1440×1000·모바일 390×844 HTTP 200, HTML/JS/CSS/캔들 로드, 화면 이동/해시 새로고침, 검색/관심종목 저장, 로컬 가상 주문/보유 복원, 시장정보·학습·연결된 인증 UI 확인. JS 런타임 오류 0, 가로 넘침 없음. 두 레이아웃 스크린샷 시각 확인.
- 실제 배포 사이트에서도 일회용 Auth 테스트 사용자로 Admin generate_link(메일 미발송) → 실제 Supabase 확인 링크 → 사이트 복귀 → URL 토큰 제거 → 로그아웃 PASS. 테스트 사용자/데이터 삭제 후 auth.users 0 확인. 일회용 4180 redirect 제거, production 및 표준 개발 URL 유지.
- 남은 범위: 실제 메일 발송/수신 및 친구 초대는 수신자 미지정으로 미검증. 기본 메일 제공자의 수신자/발송 제한은 custom SMTP 도입 시 별도 해결. 서버 계좌 주문/동기화·자동 RSS 수집·배당/환율손익은 기존 계획대로 후속 단계. 프로젝트/메일 서비스 유료 전환 없음.

## 2026-10-27 · v0.4-A
- 최신 main 0de6e9a에서 codex/server-paper-v0.4 생성. 추가 migration 202610270001/002를 이력 확인 후 기존 프로젝트에 적용(기존 금융 행 0 확인), RLS 보존. 중복 계좌/초기자금 차단·서버 합성 가격·원자적 주문/원장·안전 정수·멱등성/충돌 검사 및 원장 FK 인덱스.
- 로그인 후 서버 계좌/관심종목, 로그아웃 시 기존 로컬 원본 복원. 사용자별 pending ID 복원 및 읽기 재확인, 주문 JWT 사용자 고정. 서버 계좌 초기화/자동 이관 없음.
- 격리 PostgreSQL 17: $100×10+$80×5 평단 $93.33, 부분 원가/실현손익, 전량 원가 0, 거절 입력, 중복/충돌, 원장 불변식, A/B/익명/내부 함수 권한, trigger 강제 실패 전체 롤백 PASS. 별도 DB 세션 병렬 매수/매도 초과 방지와 동일 ID 1회 체결 PASS.
- 기존 PC·모바일/금융 32개 및 인증 8개 PASS. 실제 Supabase 두 임시 계정: 중복 동시 RPC, 계좌 1회 생성, 잘못된 JWT/수량, 직접 잔고 변경 거절, 계정/관심목록 격리 PASS. 실제 Chromium: 네트워크 단절 후 동일 ID 복원·재시도, 체결 후 응답 유실 재조회, 다른 기기 복원/로그아웃 PASS. 테스트 사용자와 cascade 데이터 정리.
- Security Advisor: 의도된 authenticated SECURITY DEFINER 경고 2건(주문/조회 RPC), 소유권/권한/search_path 검토 완료. 기타 중요 경고 없음. 모듈 번들 크기 경고는 UI Medium 단계 최적화 대상으로 남김. 실제 증권 API/유료 서비스 사용 없음.
- main fast-forward 및 Pages run 40348963309 성공. 배포 앱 326d5b06bffd864b4b37dfc1ed6df1b944a79472, 실제 URL https://pchjesus.github.io/us-stock-lab/.
- 배포된 앱에서도 PC 1440×1000·모바일 390×844로 실서버 주문/관심종목, 네트워크 불확실 주문 복원, 체결 후 응답 유실, 다른 기기 복원, 로그아웃 시 기존 로컬 MSFT 거래 복원 및 같은 브라우저 A→B 분리 PASS. 각 실행 후 임시 Auth 사용자/cascade 금융·관심종목 데이터 삭제.
- Medium 인수인계: UI 고도화와 번들 분할, 로컬 이관은 원본 보존 상태에서 사용자 요청/무결성 검증 설계부터 진행. 실제 이메일 전달·친구 초대는 별도 수신자 지정 필요. 새로운 유료 설정/실거래 연결 없음.

## 2026-10-27 · v0.4-B
- 기준 main 94b713d에서 codex/ui-market-v0.4-b. 기존 계좌/RPC/인증/원장 파일 변경 없음, TradingUI는 분석 진입 UI만 추가.
- 시장 분리/압축 지표·추이, 월간 캘린더/접근 가능한 native dialog 상세, 이벤트 알림(읽음/ID/사용자별 로컬 분리), NYSE 시계, 8개 chart period, 종목 메타데이터, 자산·섹터 분석, 7단계 읽기 전용 스포트라이트 및 접이식 sidebar.
- 지정 guided tour 참조 계약과 캐슬 index sidebar-collapsed 패턴 확인. NYSE 공식 2026/27 휴장 표와 조기폐장 주석 확인. 일정 표시 전용이며 서버 주문 차단은 미구현으로 명시.
- 기존 금융/UI 회귀 32개 중 신규 시장 진입 기대값 변경 반영. 새 OHLC/주문 가격 불변·DST/휴장/조기폐장·월 경계 및 1440/768/390 UI 검증. 시장 재진입 때 이전 지표 탭이 남는 실패를 종목 기본 복귀로 수정. 인증 회귀 8개 PASS.
- 최종 전체 40개 PASS(기존 32 + 새 UI/계산/알림 8), 인증 8 PASS. 추가 실제 chart 주기 UI 검증 진행. 실서버 smoke에서 원장/보유 불변 투어와 사용자별 알림 저장 분리 PASS, 임시 계정 모두 정리. 금융 RPC/인증/저장소 파일 및 SQL 변경 없음.
- 알림 archive를 사용자별로 보관하여 일정 창이 지난 뒤에도 조회 가능, 당일 발표 전/후/결과 확인 상태 구분. 관련 시장/UI 18개 및 알림 보관 2개 재검증 PASS. 분봉 생성에서 거래일별 NY 시간대 변환을 한 번만 계산하도록 변경해 OHLC 검증 비용을 줄임(값 불변). 1440/768/390 캘린더 시각 확인.
- 최종 Pages run 40356138013 성공, 배포 앱 d0824375635bbb1f0bc46178a21013d6c99b8f78. 실제 https://pchjesus.github.io/us-stock-lab/ PC·모바일 HTTP 200, JS/CSS/차트·탐색·관심종목·로컬 거래 복원 PASS(런타임 오류 0). 실서버 UI-B smoke도 투어 원장/보유 불변, 계정·알림 분리, 네트워크 불확실 재확인/다른 기기 복원 PASS. 임시 Auth 사용자와 cascade 데이터 삭제.
- 최종 신규 UI 10개/변경 시장 포함 18개 재검증, 알림 창 이후 보관 2개 검증 PASS. 서버 정규장 차단·실제 지수/뉴스 공급·기간 수익/배당·외부 Push·로그인 유도는 명시한 후속 범위. 2026~27 밖/임시 휴장 및 브라우저 시각은 표시 신뢰 한계로 유지.

## 2026-10-27 · v0.4-C
- 최신 main 1e8a2dc 기반 codex/ui-polish-v0.4-c. 금융 엔진/계좌 저장소/서버 RPC/인증/SQL 변경 없이 표시 context와 UI만 확장.
- 헤더 중앙 KST/ET·장 상태, 동일 높이 버튼, sidebar rail 정렬. 단일 시장 hash 메뉴 4개로 중첩 제거. 스포트라이트의 native backdrop/전체 shield dim을 제거하고 target 외곽 cutout만 적용.
- USD/KRW 표시 설정 및 계정별 기기 저장, 합성 환율/원장 USD 안내, 설정 메뉴와 주요 금액 표시 연결. 주문/체결·차트 USD 불변. 기존 profiles 스키마 변경 없이 사용자별 namespace 채택, 서버 preference 동기화는 보류.
- PASS: 빌드/타입, UI·금융 48개, 인증 8개. USD/KRW 양/음수 반올림·범위, 1440/768/390 메뉴/헤더 동일 높이/통화 복원·USD 주문 확인. 실제 target 배경 screenshot 픽셀 비교와 transparent backdrop 검증 PASS. 모바일 설정 시각 확인.
- 실제 Supabase 임시 A/B smoke PASS: 사용자별 KRW 복원/B USD 격리, 원래 USD-only RPC payload/체결 성공, 원장·계좌·로컬 보존 기존 회귀. 임시 사용자/cascade 데이터 정리. 유료 서비스/새 라이브러리 없음.
- 추가: USD 최대 안전 센트 금액도 BigInt 분리 형식화로 1센트 표시 손실 방지, 평균단가는 문자열에서 센트로 표시 변환. 엔진 원본 계산은 변경하지 않음. 1440/768/390 스포트라이트 clip 픽셀 동일 및 transparent backdrop 확인.
- 배포 앱 ac508ebd547ded66b9eaa0970fc666edb1eb838f, Pages run 40361863834 성공. 실제 https://pchjesus.github.io/us-stock-lab/ PC·모바일 HTTP 200, JS/CSS/chart/탐색/로컬 거래 및 서버 UIC A/B preference·USD-only 체결 검증 PASS. 런타임 오류 0, 임시 Auth 사용자/cascade 정리. 스포트라이트 3개 화면 크기 픽셀 비교 PASS. 접힌 rail 중심선 브라우저 실측 검증.

## 2026-10-27 · v0.4-D
- 원격 main 81c3e705 기준 codex/market-hours-v0.4-d. v0.4-C 구조·표시 통화·계좌/금융 계산 보존, 공통 2026~27 검증 일정과 서버/로컬/UI 게이트만 추가.
- 공식 NYSE hours-calendars/trading-information 확인, Nasdaq 현재 2026 휴장/조기폐장 표 대조. Nasdaq 2027 표는 미게시로 NYSE 공통 시장 일정 근거. 조기폐장 3일과 휴장 20일 명시, 2027-12-31 정상장(2028 새해 토요일 대체휴장 없음).
- PASS: TypeScript/Vite build, 금융·시간/기존 PC·모바일 58개, 인증/서버 오류·응답 유실 복구 12개. 가상시각으로 개장/마감 1초 경계·DST 2개년·KST 날짜·휴일/주말·범위 밖·누락·장외 로컬 저장 차단. 표시 통화와 USD 주문 계약·8주기 차트·캘린더/알림/튜토리얼 회귀, 모바일 시각 확인.
- PASS disposable PostgreSQL17: 기존 평단/부분/전량매도·원장/총자산·중복/동시 과매수/과매도·A/B RLS·서버 오류 롤백. 730일 UTC DST 정합, 장외 기존 ID 재조회/충돌, 계좌 잠금 대기 및 원장 기록 중 마감 시 전체 롤백, 누락/미검증·운영 중단 fail-closed. 테스트 시각은 격리 DB에만 교체, 컨테이너 제거.
- 실제 migration 이력/기존 함수 일치 확인 후 202610270003을 원자 적용·기록. 730일/조기폐장3일, 금융 데이터 건수 불변. 운영 clock_timestamp와 기존 SECURITY DEFINER/search_path/grants 유지, private schema/helper 접근 및 anon 주문 실행 불가 확인. 임시 Auth A/B로 실제 장외 동시/직접 RPC 거절·현금/원장 불변·JWT 거절·관심목록/표시통화·브라우저 시계 조작 무효·로그아웃 local 보존 PC/모바일 PASS, 테스트 사용자/cascade 정리.
- Security Advisor: ERROR 0 / WARN 3 / INFO 2. 기존 authenticated SECURITY DEFINER 2개는 소유권·실행권한·빈 search_path·직접쓰기 차단으로 검토. private 운영 테이블 RLS no-policy INFO 2개는 의도된 client 접근 불가. Auth 비밀번호 유출검사 비활성 WARN 1개: 초대 이메일 링크/OTP만 제공, 가입·익명 인증 차단, 비밀번호 계정 0 확인. 유료 설정 변경 없이 잔여 권고로 기록하며 비밀번호 인증 도입 전 재검토 필요.
- 대규모 리팩터링 불필요: 기존 금융 함수/저장 형식 유지, 시계·게이트 계약만 국소 분리. 실제 프로젝트는 검증 당시 장외이므로 장중 실제 서버 체결은 미검증(격리 DB 체결/경계/동시성은 PASS). 실제 증권/결제 API 호출 없음.
- 배포: 앱 00780ac4eb633e91494ad783c1599ff7a951cfd1을 main fast-forward·푸시, Pages run 40423800881 성공(npm ci/build/deploy). 실제 https://pchjesus.github.io/us-stock-lab/ PC·모바일 HTTP200, CSS/JS/차트8주기·탐색/새로고침·관심목록/알림/캘린더/튜토리얼/KRW·장외 주문 제한/분석 PASS, 런타임 오류0. 실제 사이트 Supabase A/B 장외 직접 RPC·시계 조작 무효/복원/로그아웃 로컬 보존 재검증 PASS, 임시 계정/cascade 정리. 후속 커밋은 이 검증 기록만 추가.

## 2026-10-27 · v0.5-A 데이터 공급자 조사·설계 (구현 전)
- 원격 최신 main `154a9f4714c472b85ec7711ca5ccc43e3b10cb9d` 인수인계 SHA와 동일 확인. AGENTS/SPEC/DEVLOG 및 data/marketInfo/accountStore/serverAccount/TradingUI/market-hours migration 관련 파일만 조회.
- Twelve Data/Massive/Alpha Vantage/Finnhub/FRED/KRX/Frankfurter/ECB 공식 자료 및 접근권·가격·지연·갱신 주기를 조사. 특히 무료 API 호출과 제3자 시세 표시 권리를 분리: 미국주식·지수/한국지수 친구 대상 표시 미승인. USD/KRW 일별 Frankfurter 우선 후보.
- 별도 개발 브랜치 `codex/market-data-v0.5-a-design`의 `docs/market-data/V0_5_A_PROVIDER_RESEARCH_AND_DESIGN_20261027.md`에 공급자 표·정규화 계약·보안 계층·영향 범위·단계별 테스트 게이트 문서화.
- 설계/문서만 변경. 소스코드·실제 시세/환율·Supabase DB/Functions·키/과금·main·Pages 변경 없음. 빌드/자동테스트/실제 API 요청/실서버 주문 검증은 수행하지 않았으므로 PASS 아님.

## 2026-10-27 · v0.5-A1/A2 개발 브랜치 1차 구현
- `codex/market-data-v0.5-a-implementation`에서 시장정보 전용 타입/환율 파서·Fetch 어댑터, 서버 읽기전용 `market-fx` Edge Function, 실제 참고환율 별도 카드, opt-in `VITE_ENABLE_MARKET_FX=false` 기본, mock 기반 Playwright 테스트 추가.
- 서버 원장/가격표/RPC/인증/RLS/시장시간 게이트와 금융 테스트는 변경하지 않음. 기존 UI 유지, 외부 시세를 주문 평가액에 혼합하지 않음. 주식·ETF 및 한국 지수의 권리 미승인 실데이터 호출·표시 없음.
- 전용 GitHub Actions 브랜치 검증 워크플로 추가(빌드·기존/신규 UI 금융·인증 테스트). 기록 시점의 CI PASS 상태는 **미확인**; 로컬 전체 소스 checkout이 불가하여 수동 전체 빌드/Playwright 재실행도 **미실행**. 외부 실제 환율 요청·Supabase Edge Function 배포·Pages/main 반영은 테스트 통과 확인까지 보류.

## 2026-10-27 · v0.5-A1/A2 CI 및 Edge Function 배포
- GitHub Actions run 40428677537 / head 814ba98: npm ci, npm run build PASS; npm test **66 PASS**, npm run test:auth **12 PASS**. 총 78개(PC·모바일 프로젝트 포함) 통과.
- Supabase 프로젝트 vveljtqmujdzkzmoncjx에 공개 읽기 전용 `market-fx` Edge Function version 1 ACTIVE 배포. verify_jwt=false, DB/금융 테이블 접근 없음. 함수 HTTP 실호출은 환경 접근 제한으로 **미검증**이며 실제 Frankfurter 응답 성공을 주장하지 않음.
- 앱 기능 플래그 VITE_ENABLE_MARKET_FX=false, GitHub Pages main 변경 없음. 따라서 실제 사이트에는 새 카드/실환율이 아직 배포되지 않음. 미검증 실데이터를 활성화하지 않음.

## 2026-10-27 · 공개사용 가능한 거시경제 데이터 추가
- 미국 재무부 FiscalData의 공개 API 이용 조건(표시·분석 서비스 개발 허용) 조사 후, 별도 `treasury-stats` Edge Function 및 UI 카드/검증 테스트 추가. 일별 연방 총부채와 월간 국채 유형별 평균 조달금리만 사용하며 **실시간 10년물 수익률로 표기하지 않음**.
- 네이버 증권 화면과 비공식 내부 시세 API 재호스팅은 약관/재표시 권리 미승인으로 배제. FRED는 시리즈별 저작권 구분이 필요하여 일괄 재배포 안 함. Frankfurter 일별 혼합 환율은 무료 캐시·재사용 허용 확인.
- 주가·합성 캔들·가격표·USD 센트 원장·장중 게이트 변경 없음. 두 외부 데이터 기능은 검증 전 opt-in OFF, main/Pages 미변경.

## 2026-10-27 · v0.6 수기 모의거래 / 금융 이벤트 엔진 기반
- 사용자 구상 승인: 네이버/토스/TradingView 등 외부가격을 사람이 보고 수기 입력 → 수량 결정 → 앱 내부 가상주문. 외부 DOM scraping 및 위젯 시세를 주문 시스템이 무단 활용하는 기능 없음.
- 해외주식 매매 250만원 공제/22% 추정, 미국 배당 원천징수 15% 기본 가정, ex-date 권리/지급일 개념과 계좌·배당분개 분리 확정. 공식 근거와 예외는 `docs/finance/V0_6_MANUAL_ORDER_TAX_DIVIDEND_DESIGN_20261027.md` 참조.
- 분리된 금융 순수 계산 `src/paperFinance.ts`, 테스트 `tests/paper-finance.spec.ts`, 브랜치 전용 빌드/회귀 Actions를 추가. 기존 서버 RPC, DB, 마이그레이션, 기존 계좌·주문 UI, 배포는 변경하지 않음.
- 배당 지급 자동화·공식 일정 수집·서버 수기 주문·세금 원장 결합은 **미구현**. 배당 자동 지급됐다는 주장 금지.

- 검증: GitHub Actions [40436100277](https://github.com/pchjesus/us-stock-lab/actions/runs/40436100277)에서 `npm ci`, `npm run build`, 일반 UI·금융 `78/78 PASS`, 별도 인증·복구 `12/12 PASS` (총 90회 PC/모바일 테스트). 신규 금융 계산 테스트 포함. 첫 실행의 VITE FX 플래그 누락으로 발생한 기존 시장테스트 2개 실패는 CI 설정 보정 후 재검증 완료.
- 이 개발 브랜치는 main/Pages/Supabase 금융 DB 미반영. 기존 시장 데이터 표시 플래그를 CI에 반영한 것은 검증 환경 변경이며 실서버 주문정책 변경 아님.

## 2026-10-27 · v0.6-A 수기 서버 체크포인트
- 최신 main e9c4ab1 및 기준 개발 브랜치 34c64c8 비교·설계/계약 확인. 기존 paperFinance 계산 기반 위에 별도 manual 계좌·주문·보유·원장과 manual_snapshot/manual_order 초안 추가. 기존 paper_order/paper_snapshot/시장 게이트/시세·UI 변경 없음.
- 운영 DB에 migration 미적용. 일회용 PostgreSQL17에서 수수료 포함 원가 140200센트, 부분매도 잔여원가 93467센트/실현 8212센트, 전량매도 현금10024645센트/누적수수료355센트/실현24645센트 정확값 PASS. 장외·재조회/충돌·잔고/수량/가격·A/B 읽기격리·직접쓰기 차단·중간 실패 전체 롤백·동시 과매수/중복ID/현금원장 일치 PASS. 기존 SQL 금융/RLS/DST730일/잠금 마감 회귀 PASS, 컨테이너 정리.
- 기존 UI 회귀 첫 실행은 기능 플래그 없이 빌드해 FX 표기 2개 실패(76 PASS). 테스트는 수정하지 않고 기존 CI와 같은 FX/통계 활성화 빌드로 재검증. 빌드/타입 PASS. CI에 격리 SQL 실행 추가.
- 이번 체크포인트는 v0.6 전체 완료가 아니다. 미완료와 재개 명령은 SPEC 마지막 절에 기록. 신규 UI/원장 replay·세금/공식 배당/Cron·실서버 보안/통합 검증 전 운영 DB·main·Pages 변경 금지.
- 최종 PASS: FX/통계 활성화 TypeScript/Vite 빌드, 일반 78개 + 인증·복구 12개(총90), 추가 격리 manual SQL 금융/동시성/롤백 검사. 신규 수기 UI와 실서버 적용·자동배당·세금 통합은 미구현/미검증.

## 2026-10-27 · v0.6-B/C
- 최신 기준 개발 브랜치 e3faa39 및 main e9c4ab1 확인. 금융/비교 설계 관련 절과 SPEC 계약 재사용. 기존 합성 금융/RPC/SQL 변경 없음.
- 수기 snapshot 엄격 정수/수수료·원가/현금·실현손익·주문/원장 replay 및 원본 오류 보존/다운로드. 사용자별 pending+고정 JWT·Web Locks·사전 token 검사·같은 ID 네트워크 복구, 저장 실패 미전송. 단계 커밋 c82a65e(client), 725130c(UI) 후 전체 회귀.
- 로그인 별도 계좌 모드·수기 주문/수수료/출처/관측시각·확인/체결·포트폴리오/원장·독립 평가가격/경과/미제공·오래됨/입력 복원. PC 좌우·모바일 단일열. TradingView 공식 위젯 opt-in/외부 링크, 가격 자동 추출 없음. VOO 네이버 링크는 미확인으로 숨기고 이유 표시. 토스 공개 경로 HTTP만 확인, 위젯 실제 라이브 데이터/지역별 외부 최종 화면은 미검증.
- 신규 영향 PASS: client 6개(PC/mobile 프로젝트), manual UI 8개(주문/수수료·평가/복원·중복 클릭·불확실 응답/장외 동일 ID·저장 실패·stale preflight·A/B 전환/로그아웃). 실제 모바일 screenshot 확인 후 새 폼 폭/평가 입력 배치 국소 개선. mock 복구 서버가 장외 상태를 초기화하던 fixture를 수정했으며 검증 약화 없음.
- 격리 PostgreSQL PASS: 기존/수기 금융·RLS·동시 주문·중복/원장·롤백·정규장/730일/DST/마감 대기. 운영 DB 접근/적용·main 병합·Pages 배포 없음. 수수료 서버 정책/독립 기기 revision CAS·실서버 통합 및 배당/세금 후속은 SPEC/기존 설계 문서에 유지.
- 최종 검증 PASS: TypeScript/Vite 활성화 빌드, 전체 일반84개(기존78+신규6), 인증/복구/UI22개(기존12+신규10), 총106개. 영수증 ID/요청 불일치 시 HTTP200이어도 성공 오표시/미확정 기록 삭제 없음·응답 원본 다운로드 테스트 추가. 최종 client 영향6개 재실행 PASS. 독립 기기 CAS/서버 수수료 정책 및 운영 미적용 상태는 잔여 High 검토 대상이며 실서버 수기 체결 PASS로 주장하지 않음.

## 2026-10-27 · v0.6-D
- 기준 5c9ac88 유지. 공식 배당 관리자 서버 allowlist·발행사/운용사 도메인·일정/상태/버전·정정 감사, 과거 filled_at 권리 산정, 계좌별 원자 지급·중복 제약·오류 재시도·private pg_cron 엔진 추가. 공식 공시 실제 seed 없음, SQL fixture는 격리 테스트 전용 가상 공시.
- 배당 현금원장/credit FK 추가, ledger 발생순서로 trade/dividend 재생. gross/15%/net/권리·지급 참조 검증, 과거 주문-only 호환·원본 보존. 수기 UI에 배당 일정/예상·완료/보류·오류/누적·출처·입금 알림 및 관리자 등록·수정·취소·중단/감사 연결. synthetic 금융/시세/계좌 불변, E/F 계약 유지.
- 영향 PASS: 기존 manual client6 + dividend client4, 배당 UI PC/mobile2. 격리SQL: 전날/배당락 당일 매수·매도/부분/전량매도·늦은 등록·DST NY 자정·정확 세금 반올림·0주·중복/병렬 실행·수기 주문 경쟁·오류 주입 전체 롤백/다른 계좌 정상 지급/재시도·관리자/RLS/직접쓰기 차단·정정/취소/중복/공식 출처/버전·중단/감사 검증.
- 실제 pg_cron PASS: disposable PostgreSQL17에서 1초 예약, 앱 미접속 자동 net85센트 지급, 반복 실행 credit1개, 서버 재시작 후 예약 복원/중복 없음. 독립 Cron fixture의 auth.users 누락과 초기 SQL 오류 출력 도구 문제를 수정 후 검증. 운영 DB clock/extension/Cron·migration·main·Pages 변경 없음. 설치 확인용 별도 probe 컨테이너 정리.
- 최종 PASS: 활성화 TypeScript/Vite build, 일반88 + 인증/UI24 = 112개(기존106 유지, 신규6). 배당 fixture로 입금 후 재매수 ledger 순서·tax/net/권리·참조·계좌/날짜·불일치 원본 보존 및 관리자 user_metadata 무시/서버 권한·PC/모바일 UI/알림 복원 검증. 마지막 snapshot 강화 후 전체 재실행 PASS. 격리 SQL 전체·실제 pg_cron 반복/재시작 재검증 PASS, 컨테이너 정리.
- 준비 migration 202610270005 및 Cron 운영 설치 스크립트만 커밋. 운영 등록/배포/실공시 검증은 미실행. 신뢰된 SQL로 관리자 allowlist bootstrap, 발행사/운용사 원문 검증 등록 후에만 실제 운영 정산 대상 생성. 기지급 금액 정정은 review/감사에 보류되며 자동 보정 분개 미지원(명시적 안전 정책). E/F 재개: 본 브랜치에서 기존 세금 설계·결제일 환율 계약 구현, 금융 High 검토·운영 승인 전 설치 SQL 실행 금지.

## 2026-10-27 · v0.6-E
- 기준 branch ac6690d/main e9c4ab1 확인, 기존 금융 설계 세금 절·직접 영향 파일만 조회. 공식 국세청 일반 국외주식20%/250만원/신고5월·일반 대금청산·증빙 비용, SEC T+1·Fed휴일 확인. 지방세/외화 조문 접근 실패 및 FIFO/평균·DTCC 완전 달력 미확정은 설계 E절에 정확히 기록, 법적 확정 주장 없음.
- 독립 원화 FIFO/평균·매수/매도/비용별 고정소수 FX·원가/손익·공제/국세/지방세·외부 손익/공제, 결제일/연말/은행 추가휴일·범위 밖 제한. 외부 손익에 이미 적용한 공제와 잔여 공제를 중복 차감하지 않도록 검산. 원화 매수비용 포함 후 추가 비용 공제 없음, 배당/미실현 제외, 기존 USD/배당 원장 불변.
- 202610270006은 자기신고 세금 문서의 append-only 이력·CAS/멱등/소유권·직접쓰기 차단만 추가, 운영 미적용. TaxPanel 입력/정책/상세·세후 성과 범위·보관/서버저장/이력·전송 유실 같은 ID·원본 보존. 확정 conflict는 원본초안 보존 후 최신버전 재조회. 실제 명세/환율 API 미확보 시 잠정, 기존 합성 환율 자동 대체 없음.
- 단계 커밋 2ce70ea(engine/client), 4f605a4(UI/evidence). 영향 PASS: 세금 계산10+store2, PC/mobile 세금 UI4(정확 ₩2,178 기대값, 정책 버전/원본/새로고침·USD잔고 불변/같은 ID 복구). 초기 UI fixture의 실제 buy filled_at에 맞게 예상 T+1 날짜 수정, 검증 약화 없음.
- 격리SQL PASS: tax 소유권/기록 불변·요청 충돌/정확 date·referenceFX거절/기존 cash/realized/fees 불변·2기기 CAS 및 같은 요청 중복. 기존 financial/RLS/dividend/concurrency 전체 PASS. 실제 격리pg_cron 무접속 net85센트 입금·반복/재시작 credit1개 PASS. 운영 DB/Cron·main/Pages 접근/적용 없음.
- 전체 회귀 중 기존 spotlight 픽셀 비교1회 실패(일반99 PASS). 테스트를 수정/삭제하지 않고 임시 좌표·PNG 진단 후 원본 복원: 1440/768/390 각2프로젝트의 대상크기·배경 픽셀6조건 동일 PASS, 원인 미확정·비재현. 원본 전체 일반 재실행100 PASS. 금융/세금 기능 실패로 분류하지 않으며 F에서 화면 테스트 안정성 확인 대상.
- 최종 문서 형식/정책·달력 버전 검사·손상 임시/미확정 저장 차단·원본 다운로드·외부 공제 중복 방지/세후 범위 검산을 보강. 원화 ₩2,178 검산 fixture의 USD잔고/배당 원장 불변, 송신 유실 같은 ID 복구·불변 정책 버전 PC/mobile PASS. 총 기대조합128(기존112+엔진10+store2+UI4), 마지막 빌드·일반100·인증/UI28 전체 재검증 후 기록 확정.
- 검증 확정 PASS: 최종 TypeScript/Vite build, 원본 일반100개 + 인증/복구/UI28개 = 총128개. 격리 PostgreSQL 전체 금융/RLS/배당/세금 CAS 및 실제 isolated pg_cron 반복·재시작 PASS. 공식 국세청 2026 게시/2025귀속 FAQ의 국내 통산 제한 범위 추가 확인·기록. 세금 원본 손상 형식은 UI 계산·저장 차단하며 미확정/실제 세법 미검증 한계는 유지. 운영 DB migration/Cron·main/Pages 미적용.

## 2026-10-27 · v0.6-F 금융·보안 통합 감사
- 기준 local/원격 branch7c65999, main e9c4ab1 유지. 위험도별 재현·수정·운영 전환/복구는 `docs/finance/V0_6_F_AUDIT_20261027.md`. Critical0, 재현 High4 해결(자기신고 수수료/독립기기 stale확인/JSON 원장 오염/정수 총액·누적 경계), Medium4 해결(정정 권리/중첩 세금 입력/FX UTC/spotlight 경합). Low 외부 페이지 최종 렌더링·권리 확인은 운영 제한 유지.
- additive007: 별도 finance_admins/계좌별 서버 정책 append-only, 신규 주문 policy참조·revision/CAS, 과거ID 조회·충돌 복구, 구형API 신규쓰기 차단. 배당이 revision도 갱신하며 gross/누적배당 상한 거절·원자 rollback. 새 공개 입력 크기/타입/권한 검사와 private execute 접근 회수. 원래 001~006 migration/과거 체결·원장·배당·세금 이력/paper_* 금융 불변.
- 클라이언트는 서버 정책 read-only/이력검증, 확정 CAS실패 입력 보존·재조회, 미확정 동일ID 유지, 지급 정정 권리 재생, 실현손익 중간 BigInt, FX 확인일 UTC 일치. 기존 spotlight 실패를 가상시계+DOM mutation으로 재현 후 scroll/다음frame 전 좌표 공개를 차단. 기존 픽셀/금융 테스트 삭제·약화 없음, 전면 리팩터링 보류.
- PASS: 최종 활성화 TypeScript/Vite build, 일반108 + 인증/UI30 = PC/mobile138개(기준128 유지), 최종 영향 수기UI12/감사8 재검증. SQL runner30개 PASS 검사 묶음 + 실제SQL→shipping client replay3개. 두 독립기기 연결 동일 revision에서1체결/1거절+A별도 동시주문, RLS/직접쓰기/SECURITY DEFINER ACL·빈search_path/NULL UID, 금융/배당/세금/정규장 전체 유지.
- PASS: populated004~006→007 전후 금융 해시 동일, 의도된 migration 실패 후 모든DDL/구형RPC 정의 rollback, clean install. gross1e16/누적 gross1e16 거절 후 잔고/revision/원장 불변, 별도 극단 SQL이력 cash35331003/realized-7649999974668997/net배당7650000000000000 정확 재생. 세금 외부 손익·공제 배분/앱 손익 ±300만원/원화 상한 BigInt 검산.
- 실제 격리 pg_cron3시나리오 PASS: 앱 없이 net85센트 지급/반복1회, 관리자 중단 중 지급 금지, DB 재시작 후 중단 유지·재개하면 미지급85센트 추가1회(최종cash9990170). 모든 일회용 컨테이너/임시 snapshot 정리. 외부링크 HTTP24/24, 민감 번들key 검출0. 외부 최종 화면/실시세 정확성·라이선스, 물리2기기/운영 Auth 및 실제 Supabase Advisor는 미검증.
- 운영 판단 NO-GO: 코드 격리 범위 미해결 High0이나 실제 migration이력/백업·복구/Advisor/초대2계정 기기 smoke/공시 원문/수수료 초기정책·관리자 UUID·Cron 준비 및 별도 사용자 승인이 필요. 새 프론트 비밀키 불필요, 관리키는 trusted operator 환경만. 운영검사 읽기SQL와 적용/중단·복구 체크리스트 준비. 이번 작업은 운영 DB migration/Cron·main/Pages·실제거래 변경 없음.
- 재개/검증 명령은 SPEC F절. 개발 브랜치만 커밋·일반 fast-forward push하며 다음 운영 실행은 정확 SHA를 기준으로 별도 결정한다.

## 2026-10-27 · v0.7-A1 차트 실습실 UI 체크포인트
- 기존 미추적 SMA/Wilder RSI 및 테스트를 보존하고 학습탭에 합성 캔들/선, 단계 선택, SMA 5·20·60과 별도 RSI 30·70 참고선을 연결했다. 기존 상세 차트와 금융 기능은 유지한다.
- 검증 PASS: 활성화 Vite/TypeScript 빌드, 지표 테스트 4회, 일반 PC·모바일 114회, 인증/UI 30회. 새 실습실 테스트는 단계·유형·지표 전환, 기존 학습 콘텐츠 및 모바일 폭을 검증한다.
- 미구현: 거래량, 지지·저항 실습, 종목 상세 차트 이전 및 실제 기업 사례. 운영 DB/Cron·main/Pages 변경 없음.

## 2026-10-27 · v0.7-A1b 단계별 차트 실습
- 초급 봉 선택/OHLC/가상 거래량, 중급 SMA 값·범례 및 지지/저항 가설선, 고급 RSI 선택 값·0~100 축을 연결. 단계 전환은 상위 지표를 숨기고 재진입 시 선택을 복원한다. 차트 이벤트 및 인스턴스는 effect cleanup으로 해제한다.
- 검증 PASS: TypeScript/Vite 빌드, 일반 PC·모바일 116회, 인증/UI 30회, 최종 차트 영향 검사 4회, React StrictMode 개발 서버 검사 4회. 선택 봉 계산값/결측, 가상 거래량, 터치/키보드, 후보선 화면 변화를 확인했다. 대상 테스트에서 데스크톱 터치 API를 잘못 호출한 설정을 수정해 재실행했다.
- 합성 금융/수기 주문·운영 DB/Cron/main/Pages 변경 없음. 종목 상세 차트 이전은 A1c, 실제 기업 데이터는 별도 후속 과제다.

## 2026-10-27 · v0.7-A1c 합성 차트 학습실 통합
- 종목 상세 차트를 학습실로 이동하고 재사용 가능한 외부 시세 링크·종목별 해시 진입을 추가. 기존 8종목/8주기 OHLC·SMA·RSI 및 마지막 봉 표시, 주기 저장/복원, 종목 변경 시 선택 봉과 후보선 초기화. 기존 합성 체결가격/수기 거래·금융 모델 불변.
- 검증 PASS: 활성화 TypeScript/Vite build, 일반 PC·모바일 118회, 인증/UI 30회, 최종 StrictMode PC·모바일 6회, git diff --check. 8종목·8주기 지표값, 선택 봉, 해시 이동/새로고침/뒤로 가기, 계좌 불변, 설정 저장 실패를 검증. 차트 이전에 따라 기존 테스트의 위치를 변경하고 렌더링·새로고침·스크린샷·설정 검사는 유지.
- 첫 병렬 전체 실행에서 개장 1초 전 테스트의 시계가 로딩 중 개장을 지나 실패해 해당 가상시계를 고정; 단독 전체 재실행 PASS. 인증 테스트 한 건은 병렬 부하 중 시간 초과, 별도 전체 재실행 PASS. TradingView·네이버·토스 대표 링크 HTTP 200, 최종 외부 화면/시세 정확성은 별도 미검증.
- 금융 SQL·Cron은 코드 변경 없어 재실행하지 않았고 기존 CI 워크플로 유지. 운영 DB/Cron·main/Pages 미변경. A2 실제 기업 사례/권리 검증과 B 기업정보 고도화는 후속.

## 2026-10-27 · v0.7-B0 외부 시세 중복 생성 정리
- 수기 모드의 숨겨진 ExternalQuotes 인스턴스만 조건부 제거. 합성·수기 모드 각각 DOM 1개 및 기존 외부 링크를 PC/모바일에서 검증. 기존 수기 주문 검토·확정·복구와 CSS 유지.
- PASS: 활성화 빌드, 일반 118회, 인증/UI 30회, git diff --check. 수기 모드에서 종목 정보와 학습실 링크가 CSS로 숨겨지는 문제는 B2 후속으로 유지. 운영 DB/Cron·main/Pages 변경 없음.

## 2026-10-27 · v0.7-B1 기업정보 데이터 계약
- B0 CI [40500830334](https://github.com/pchjesus/us-stock-lab/actions/runs/40500830334)의 completed/success 확인 후 구현 시작. 확인 HEAD f5862cb, 작업 트리 clean. 기존 코드는 재작성하지 않고 독립 데이터/검증 모듈과 테스트만 추가.
- SEC submissions의 공식 name/cik/tickers/sicDescription과 원문 10-K Item1/1A·사업부 정보를 수동 확인. source.checkedAt은 UTC 확인시각, 사용자 날짜는 2026-10-27 KST. 산업명은 SEC SIC 분류이며 현대적 산업 분석 라벨이 아니다. 한국어 사업·위험 요약은 원문 기반 편집 설명이다.
- 공식 원문/제출일: AAPL [2025-10-31](https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm), MSFT [2026-07-29](https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/msft-20260630.htm), NVDA [2026-02-25](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm), AMZN [2026-02-06](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm), GOOGL [2026-02-05](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm). SEC 프로필 URL/CIK와 원문 locator는 companyProfiles에 함께 보관.
- 재무 표의 개별 금액/단위/분기, 배당 일정·금액은 미확인으로 명시적으로 비워 두었다. 재무/배당 데이터는 원문 대조 후 출처·기간·정정 관계를 갖춰 추가해야 한다. 테스트의 100.10/20.03 등은 격리 가상 수치이며 실제 기업 보고값이 아니다.
- B2 준비: 최소 기업 프로필과 검증 API 사용 가능. 전체 실적 화면의 숫자 제공, 가격 의존 비율, ETF 실데이터는 별도 검증 필요. UI/금융/RPC/RLS/SQL/Cron·main/Pages 변경 없음. 전문 계산 재구성이나 추상화 확대는 보류.
- 최종 검증 PASS: `npm run build`, `npm test` 128회(첫 전체), `npm run test` 130회(정정 계산 이력 테스트 포함 최종 전체), `npm run test:auth` 30회, `git diff --check`. 최종 기업정보 전용 테스트는 6사례×PC/mobile 프로젝트=12회. 금융 코드/SQL 변경 없어 로컬 SQL·Cron 재실행은 생략했으며 B0 CI의 SQL·Cron 성공과 구분한다.

## 2026-10-27 · v0.7-B2 기업 상세 UI
- B1 공식 프로필 연결: 5개 기업의 사업·사업부·수익·위험/SEC 출처와 확인일, 미확인 지표·재무건전성·배당의 빈 상태, 연간/단독 분기 그래프. ETF 3종의 기존 정보와 VOO 링크 예외 유지. 수기 CSS 숨김 제거와 모드별 단일 외부 시세·주문 영역 분리, 합성 보유 평단/손익은 기존 평가 함수 사용.
- PASS: TypeScript/Vite 빌드, 일반 PC·모바일 132회, 인증/주문·복구 30회, 테스트 전용 검증 재무 fixture 그래프 PC·모바일 2회, 추가 기업·ETF 2회 및 수기 주문/320px 12회, git diff --check. 1440/768/390/320 폭과 공식 출처/빈 상태·사용자 전환/원장 불변을 확인. 검증 전 첫 회귀의 빌드 중 동시 페이지 reload 오류와 fixture 선택자/배치 오류는 원인 수정 후 재실행 통과.
- 원문 숫자·공식 배당 수집은 B3 후속, 역사적 주가와 ETF 실데이터는 미구현. SQL/RPC/DB·금융 계산 변경 없음, 로컬 SQL/Cron 미실행; 기존 CI 유지. 운영 DB/Cron·main/Pages 미변경.
