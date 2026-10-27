# US Stock Lab · v0.5-A 외부 위젯 및 시장정보 라이선스·반영 기록
날짜: 2026-10-27 / 브랜치: `codex/licensed-market-widgets-v0.5-a`

## 결정
- **네이버 증권**: 공개 화면을 조회할 수 있다는 것과 시세 자동수집·재게시 허용은 다르다. 공식 공개 주식 시세 API는 확인되지 않았으며, 네이버 증권의 데이터는 제3자 콘텐츠 제공사의 유료 공급 데이터를 포함. 개인 사용을 빌미로 비공식 JSON 크롤링 및 무단 재게시/주문 가격 연동 금지. 원문 링크는 가능.
- **TradingView**: 공식 웹사이트용 무료 hosted widget을 그대로 사용. [Getting started](https://www.tradingview.com/widget-docs/getting-started/), [Free widgets](https://www.tradingview.com/widget/), [Terms](https://www.tradingview.com/policies/), [Widget data FAQ](https://www.tradingview.com/widget-docs/faq/data/). 거래소 규정에 따라 주식/지수 데이터는 지연 및 임베드 제한; 로고·attribution·원본 링크 유지. **TradingView widget 데이터를 DOM/iframe/network에서 추출하거나 외부 시세를 paper_order/paper_prices/자산평가/백테스팅에 사용하는 것은 금지.**
- **8개 종목**: NASDAQ:AAPL,MSFT,NVDA,AMZN,GOOGL,QQQ, AMEX:VOO,SCHD. 공식 원본 링크/지표가 확인된 심볼만 사용. 사용자 선택 시 TradingView 전용 ticker tape, 종목 상세에서 정식 Advanced Chart를 지연 로드.
- **지수**: `SP:SPX`(S&P500), `NASDAQ:IXIC`(Nasdaq Composite, Nasdaq-100과 구분), `DJ:DJI`, `KRX:KOSPI`, `KRX:KOSDAQ`(개별 원본 페이지 존재). Market Overview 위젯에 두 탭 제공, 불가/제한 시 원본 링크. 한국 지수의 위젯 실제 표시 가능 여부는 브라우저에서 확인 전까지 확정 표시하지 않음. CFD `FOREXCOM:*`, 계산 지수 `TVC:*`로 원지수 대체 금지.
- **USD/KRW**: [Frankfurter API](https://frankfurter.dev/), [license](https://frankfurter.dev/license/). Blended 참고환율은 공식 원천 환율과 다르고 실시간 거래가격이 아님. 84개 중앙은행 자료의 원천 제공자 조건이 별도로 적용될 수 있다. 기존 market-fx read-only 함수는 API 호출/원천 검증/6시간 인스턴스 캐시/10일 이상 자료 거절. 실제 데이터값은 별도 카드만 표시하며 USD 센트 주문·현재 합성 1360원 KRW 평가에는 즉시 반영하지 않는다(향후 금융 검증 별도).
- **FRED**: 직접/API 소규모 비상업 목적은 가능하지만 지수별 저작권자 권리 별도. [FRED full terms](https://fred.stlouisfed.org/legal/terms/). SP500은 pre-approval required. 데이터 소유자의 별도 승인 없이 시장 전체 시세에 쓰지 않는다.
- **KRX OPEN API**: 공식적으로 무료 요청 가능하나 제3자 제공 약관 제한. 허가 없이 친구 대상 재게시 데이터 소스 미사용.
- **Massive/Twelve Data/Finnhub/Alpha Vantage/Stooq**: 자체 개인사용 계정의 외부 표시 권리 미확보. 크롤링/우회 미실행.

## 안전 계약
- UI 실제 외부 위젯은 사용자가 열었을 때만 로드하며 위젯 자체의 출처 표기 유지, CSS/React 외부 script 입력 값은 고정 whitelist의 종목 심볼. 계정 데이터를 위젯으로 전달하지 않는다.
- `src/LiveMarket.tsx` 외부 금융 데이터의 실행가격 읽기 코드 없음. `src/data.ts`, `src/accountStore.ts`, `src/serverAccount.ts`, `src/trading.ts`, `src/preferences.tsx` 및 Supabase `paper_order`/원장/가격/장운영시간 미변경.
- `VITE_ENABLE_MARKET_FX=true`는 실제 Supabase 함수 HTTP smoke 통과 후 Pages 빌드에 반영. 공급자 오류 시 실제값 없음, 합성값을 실제값으로 표시하지 않음.
- 페이지 변경 전 `npm run build`, `npm test`, `npm run test:auth` 와 외부 FX 실제 응답 검증 필수. GitHub Pages 공개 배포는 테스트 성공과 배포 실행 확인 후 PASS 표기.

## 참고 문헌 / 링크
1. NAVER. (n.d.). *증권정보 API 사용 가능 여부*. https://help.naver.com/service/5617/contents/176
2. TradingView. (n.d.). *Free financial widgets*. https://www.tradingview.com/widget/
3. TradingView. (n.d.). *Data questions*. https://www.tradingview.com/widget-docs/faq/data/
4. TradingView. (n.d.). *Terms of service*. https://www.tradingview.com/policies/
5. TradingView. (n.d.). *Data coverage*. https://www.tradingview.com/data-coverage/
6. Frankfurter. (n.d.). *License & terms*. https://frankfurter.dev/license/
7. Federal Reserve Bank of St. Louis. (n.d.). *Legal notices, information and disclaimers*. https://fred.stlouisfed.org/legal/terms/
8. 한국거래소. (n.d.). *KRX OPEN API*. https://openapi.krx.co.kr/
