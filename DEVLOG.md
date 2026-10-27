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
