# G1-C2 금융 migration 배포 안전성 — NO-GO

## G1-C2D 추가 검증 — 2026-11-02

`scripts/finance_migration_atomic.py`는 CLI 일반 배포와 다른 별도 도구다. 기본 실행은 파일 검증만 하며 DB에 연결하지 않는다. 004~007과 Foundation~003의 SHA-256, 파일 집합, CLI 2.122.0이 격리 DB에 기록한 `scripts/finance-migration-cli-statements.json`의 SHA-256을 고정한다. 고정된 파일과 CLI 문장 배열의 처음·마지막에 있는 정확한 transaction 경계만 제외해 실행하며, 원본 파일은 수정하지 않는다. 일반 SQL 문자열 치환이나 임의 migration을 지원하지 않는다. history에는 원본의 `begin`/`commit`을 포함한 CLI 문장 배열을 그대로 기록한다. 004~007의 version·name·statements는 격리 DB에서 실제 CLI 이력과 비교했다.

도구는 단일 트랜잭션에서 advisory lock과 migration history 배타 잠금을 획득하고, 정확한 Foundation·001~003 이력과 카탈로그 수·RLS, 기존 수기/배당 객체 부재를 점검한다. 004~007과 이력 INSERT를 차례로 수행하고 금융 테이블 권한·RLS, RPC 실행 권한, paper RPC와 현금·배당 원장 불변식을 확인한 뒤 커밋한다. 같은 도구의 동시 실행은 advisory lock으로 직렬화하며, history 잠금 동안 다른 history 조회는 대기할 수 있다. CLI나 다른 관리 작업이 **잠금 획득 전 이미 시작된 경우까지** 자동으로 배제하지 못하므로 실제 적용 전 다른 배포자를 중지해야 한다. 카탈로그 수 비교는 전체 정의의 동등성 검증이 아니다.

기본 점검과 격리 시험:

```sh
python3 scripts/finance_migration_atomic.py
python3 tests/test_finance_atomic_guard.py
python3 scripts/rehearse-cli-history.py /absolute/path/to/supabase
```

마지막 시험은 공식 CLI 2.122.0 Linux amd64 바이너리와 로컬 `postgres:17` 이미지가 필요하며 `--network none` 격리 컨테이너만 사용한다. 컴파일된 실제 도구 SQL과 psql 실행기를 대상으로 004·005·007 이전 실패, 007 history INSERT 실패, 중복 실행, 004·006 중간 RPC 비가시성, advisory lock, 최종 권한·RLS·원장, paper 보존을 확인했다. 커밋 전 연결 단절은 롤백됐고 커밋 후 확인 응답 전 단절은 적용된 상태에서도 실패/결과 불명으로 처리됐다. 어느 경우에도 자동 재시도하지 않았다. 기존 주문·수수료·배당·세금의 더 넓은 회귀는 G1-C1 결과를 재사용한다.

명시적 운영 승인 후에만 `--execute-production --project-ref vveljtqmujdzkzmoncjx` 옵션을 사용할 수 있으며, 대화형 터미널에 지정 문구를 입력해야 한다. 도구는 DB URL을 받지 않고 `db.vveljtqmujdzkzmoncjx.supabase.co:5432/postgres`와 `postgres` 역할, TLS `verify-full`을 강제한다. libpq 접속 환경 재정의는 제거하고 암호·인증서 위치만 전달하며 이를 로그에 쓰지 않는다. 직접 연결 및 TLS 검증은 운영에서 NOT VERIFIED이고, IPv6·DB 자격증명·CA가 준비되지 않으면 연결할 수 없다. 실제 운영 CLI list/dry-run, PostgreSQL/Supabase의 모든 운영 설정·service_role 권한 및 실제 사용자 환경도 NOT VERIFIED다.

오류·시간 초과·연결 손실 또는 커밋 응답 미수신은 **결과 불명**이다. 자동 재시도나 repair를 하지 말고 대상 DB의 migration history와 실제 스키마·권한·원장을 읽기 전용으로 대조한 후 복구 방안을 별도로 검토한다. 커밋 응답이 확인돼도 운영 상태의 독립 검증은 필요하다. 이 실험 도구는 아직 운영 대상 연결과 전체 서비스 경로에서 검증되지 않았으므로 **G1-C3 운영 적용 NO-GO**를 유지한다.

---

대상 프로젝트: `vveljtqmujdzkzmoncjx`. 004~007 운영 적용, DDL/DML, repair, 사용자 생성, Cron 등록 및 Pages 배포는 실행하지 않았다. 이 문서는 운영 실행 승인이 아니며, 검증된 운영 배포 도구도 아직 없다.

## 배포 접근법

기존 공식 CLI의 개별 migration 적용은 사용할 수 없다. 004~006 완료와 007 완료 사이에 인증 역할이 미완성 `manual_snapshot()`을 실행해 계좌를 생성할 수 있고, 본문 커밋 후 history 기록이 실패하면 일반 재시도도 실패한다. 기존 paper 기능을 보호할 수 있는 접근 차단과 장애 후 차단 유지가 검증되지 않았다.

선호하는 연구 방향은 **스키마와 migration 이력을 하나의 트랜잭션으로 처리하는 공식 지원 경로**다. 로컬 PostgreSQL 실험은 가능성을 보여 주지만 운영 방식으로 채택하지 않는다. 그 실험은 004~007 원본의 독립적인 `BEGIN`/`COMMIT`만 메모리 사본에서 제거하고, 원본 바이트를 포함하는 모의 history를 수기로 기록했다. 공식 CLI의 실행 및 이력 기록과 동일하다고 입증되지 않았고, SQL 변경이나 수기 이력 기록을 운영에서 승인한 적도 없다. 원본 파일은 바뀌지 않았다.

대안인 Data API 중지는 공식 문서상 자동 REST 엔드포인트를 막지만 paper API도 일시 중단하며, 모든 직접 DB·기타 서비스 경로와 기존 세션·전파 지연·실패 시 설정 유지까지 보장하지 않는다. 이 프로젝트에서 설정 변경이나 차단 해제를 시험하지 않았다. UI 숨김과 사용자 0명도 보안 게이트가 아니다. 관련 공식 문서: https://supabase.com/docs/guides/api/securing-your-api

## 격리 검증 및 결과

기존 G1-C1의 001~003 카탈로그 비교와 금융·RLS·동시성 회귀 결과를 재사용한다. 이번 실행에서 재현한 명령은 다음과 같다. Linux amd64 공식 CLI 2.122.0 바이너리 및 로컬 `postgres:17` 이미지가 필요하다.

```sh
python3 scripts/rehearse-cli-history.py /absolute/path/to/supabase
```

테스트는 바이너리 SHA256을 확인하고, 임의 이름의 `--network none --pull=never` 컨테이너 안에서만 CLI와 합성 DB를 사용한다. 운영 접속 인자를 받지 않는다. 모의 DB의 `db push --skip-vault --dry-run` 결과는 정확히 004~007이며 시험 상태는 변하지 않았다. CLI 도움말상 `db push`는 기본적으로 Vault 설정을 갱신할 수 있다.

| 상황 | 격리 결과 |
|---|---|
| 공식 CLI: 004·005·007 본문 실패 | 앞 단계의 스키마와 이력은 남는다. 005·007 실패 시 인증 역할의 수기 RPC를 실제 호출할 수 있다. |
| 공식 CLI: 004 본문 커밋 뒤 history INSERT 실패 | 004 스키마·권한은 남고 history는 없다. 실패 조건 제거 후 CLI 재시도는 중복 객체 오류로 중단된다. 자동 repair는 검증하지 않았다. |
| 공식 CLI: 본문 실패 조건 제거 후 재실행, 완료 후 중복 실행 | 격리 fixture에서 재실행이 완료됐고 완료 후 CLI 실행은 no-op이었다. 운영 자동 재시도 근거는 아니다. |
| 실험용 단일 트랜잭션: 004·005·007 전 실패 및 007 이력 INSERT 실패 | 모의 스키마와 history가 함께 롤백됐다. 원본 SQL·CLI 배포와 동일한 실행은 아니다. |
| 실험용 단일 트랜잭션 진행 중 다른 DB 세션 | 004와 006 지점에서 새 RPC와 모의 history가 보이지 않았고 기존 paper 잔액을 읽을 수 있었다. 커밋 뒤 최종 금융 RPC 권한, RLS 및 합성 잔액·원장이 일치했다. |

정상 적용 뒤 9개 금융 RPC의 anon/authenticated 실행 권한과 public 수기·배당 테이블 RLS를 확인했다. G1-C1에서는 별도 격리 금융 테스트로 주문·수수료·배당·세금·동시성 및 기존 paper 기능을 검증했다. 운영 인증 사용자 격리, 실제 기기 및 전체 외부 접근 경로는 NOT VERIFIED다.

## 운영 전 조건과 실패 대응

1. GitHub 개발 브랜치 SHA, 대상 프로젝트 ID, DB 대상 및 단일 배포자, Foundation·001~003 이력과 정확한 pending 004~007을 확인한다. 실제 운영에 연결한 CLI `migration list`와 `db push --dry-run`은 아직 NOT VERIFIED다. CLI 연결과 명령의 부작용을 확인하기 전 운영에서 실행하지 않는다.
2. 공식 지원되는 배포 방법 또는 실제 모든 접근 경로에 적용되는 차단 방법을 확정하고, 미완성 RPC 차단·paper 영향·장애 후 닫힘·재개를 별도의 격리 환경에서 검증한다. 실험용 역사 기록 방식을 운영에 복사하지 않는다.
3. 실패 시 후속 단계와 자동 재시도를 즉시 멈춘다. 차단 상태를 유지하면서 실제 스키마, 이력, RPC·RLS·GRANT와 원장 무결성을 읽기 전용으로 비교한다. 이력이 없어도 SQL이 이미 커밋됐을 수 있으므로 무조건적인 `repair`나 SQL 재실행을 하지 않는다. 상태별 복구 절차는 실제 이력과 객체를 확인한 뒤 별도로 검토한다.

## 판정 및 향후 승인 범위

**G1-C3 운영 적용 NO-GO.** 차단 경계와 이력 복구, 실제 운영 CLI 비교가 해결된 이후에만 프로젝트 `vveljtqmujdzkzmoncjx`의 금융 migration 004~007 적용 및 검증된 장애 대응 절차에 대한 별도 명시적 승인을 요청한다. 사용자·관리자 생성, Cron 등록, Pages 배포는 그 승인에 포함되지 않는다. 실거래·외부 증권사 연결·실자금 이동은 금지한다.
