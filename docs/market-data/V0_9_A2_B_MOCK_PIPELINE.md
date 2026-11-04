# v0.9-A2-B1-1 오프라인 Mock 체크포인트

Massive Daily Ticker Summary와 Alpha Vantage TIME_SERIES_DAILY 형태를 참고한 가상 fixture만 처리한다. 실제 공급자 데이터, API 호출, 자격 증명이나 운영 연결은 없다. Massive fixture는 거래소·정규장·가격 기준·조정 버전과 종가 decimal 문자열을 명시한다. 이는 실제 JSON 숫자 토큰의 무손실 파서가 아니다. Alpha fixture의 거래소도 별도 명시된 가상 매핑이며 raw 가격만 허용한다. 독립적으로 주입된 달력과 매핑을 코어가 검증하며 fixture 사용은 실자료 권한을 부여하지 않는다.

B1-2 요청·credit 예산, B2 single-flight, Retry-After·재시도, 캐시·TTL과 전체 UI/Auth/release 회귀는 미구현·미실행이다. 실제 공급자 연결과 운영 사용은 별도 승인 및 검증이 필요하다.
