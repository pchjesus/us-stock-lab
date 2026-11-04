# v0.9-A2-B1-1 오프라인 Mock 체크포인트

Massive Daily Ticker Summary와 Alpha Vantage TIME_SERIES_DAILY 형태를 참고한 가상 fixture만 처리한다. 실제 공급자 데이터, API 호출, 자격 증명이나 운영 연결은 없다. Massive fixture는 거래소·정규장·가격 기준·조정 버전과 종가 decimal 문자열을 명시한다. 이는 실제 JSON 숫자 토큰의 무손실 파서가 아니다. Alpha fixture의 거래소도 별도 명시된 가상 매핑이며 raw 가격만 허용한다. 독립적으로 주입된 달력과 매핑을 코어가 검증하며 fixture 사용은 실자료 권한을 부여하지 않는다.

B2 single-flight, Retry-After·재시도, 캐시·TTL과 전체 UI/Auth/release 회귀는 미구현·미실행이다. 실제 공급자 연결과 운영 사용은 별도 승인 및 검증이 필요하다.

## B1-2 예산

고정 시간 창의 시작 기준과 길이, 요청 및 credit 한도를 호출자가 명시한다. 공급자별 자정이나 실제 계약을 가정하지 않는다. 동일 공급자·플랜·자격 범위에는 하나의 Budget 인스턴스를 공유해야 한다. 동기 예약은 모든 창을 함께 확인하고 성공 시 한 번만 차감하며, 실패한 시도도 환급하지 않는다. 작업량 추정은 예약과 별도다. 가상 사례인 Massive 5회/분, Alpha Vantage 25회/일, Twelve Data 8 credits/분, Finnhub 60회/분은 권리나 현재 계약 보장이 아니다.

사용량과 예약 ID는 프로세스 메모리에만 존재해 재시작 시 사라진다. 여러 인스턴스·서버·Edge isolate의 공유 제한을 보장하지 않으며 운영용 제한기가 아니다. 큐·대기·재시도·공유 캐시는 구현하지 않았다.
