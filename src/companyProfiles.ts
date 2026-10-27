import {validateCompany,type CompanyProfile} from './companyData';
// Manually reviewed SEC sources; Korean prose is an editorial summary, not a quote.
export const companyProfiles:CompanyProfile[]=[
 {
  "kind": "company",
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "cik": "0000320193",
  "industry": "Electronic Computers",
  "identitySourceId": "sec-profile",
  "profileSourceId": "annual-report",
  "business": [
   "iPhone, Mac, iPad 및 웨어러블 기기",
   "디지털 콘텐츠·클라우드·결제 등 서비스"
  ],
  "segments": [
   "Americas",
   "Europe",
   "Greater China",
   "Japan",
   "Rest of Asia Pacific"
  ],
  "revenueModel": "하드웨어 판매와 서비스 매출",
  "tenSecondSummary": "기기와 서비스를 결합하는 소비자 기술 기업.",
  "risks": [
   "치열한 경쟁과 제품 전환",
   "일부 부품의 단일·제한 공급원 의존"
  ],
  "summaryKind": "editorial-from-official",
  "sources": [
   {
    "id": "sec-profile",
    "url": "https://data.sec.gov/submissions/CIK0000320193.json",
    "form": "SEC-profile",
    "filedAt": null,
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "name, cik, tickers, sicDescription",
    "amends": null
   },
   {
    "id": "annual-report",
    "url": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm",
    "form": "10-K",
    "filedAt": "2025-10-31",
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "Item 1 Business; Item 1A Risk Factors; segment information",
    "amends": null
   }
  ],
  "financials": [],
  "financialCoverage": {"status":"not-reviewed","reason":"재무 수치는 원문 표·단위·기간을 개별 대조하기 전까지 미제공합니다."},
  "dividends": {
   "status": "not-reviewed",
   "reason": "공식 배당 일정·금액을 아직 대조하지 않았습니다. 무배당을 의미하지 않습니다."
  }
 },
 {
  "kind": "company",
  "symbol": "MSFT",
  "name": "MICROSOFT CORP",
  "cik": "0000789019",
  "industry": "Services-Prepackaged Software",
  "identitySourceId": "sec-profile",
  "profileSourceId": "annual-report",
  "business": [
   "Microsoft 365·Dynamics·LinkedIn",
   "Azure 클라우드, Windows 및 게임"
  ],
  "segments": [
   "Productivity and Business Processes",
   "Intelligent Cloud",
   "More Personal Computing"
  ],
  "revenueModel": "소프트웨어 구독·라이선스, 클라우드 사용량 및 기기·게임 매출",
  "tenSecondSummary": "업무 소프트웨어와 클라우드를 제공하는 기업.",
  "risks": [
   "제품·서비스 경쟁",
   "보안 위협과 사이버 공격"
  ],
  "summaryKind": "editorial-from-official",
  "sources": [
   {
    "id": "sec-profile",
    "url": "https://data.sec.gov/submissions/CIK0000789019.json",
    "form": "SEC-profile",
    "filedAt": null,
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "name, cik, tickers, sicDescription",
    "amends": null
   },
   {
    "id": "annual-report",
    "url": "https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/msft-20260630.htm",
    "form": "10-K",
    "filedAt": "2026-07-29",
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "Item 1 Business; Item 1A Risk Factors; segment information",
    "amends": null
   }
  ],
  "financials": [],
  "financialCoverage": {"status":"not-reviewed","reason":"재무 수치는 원문 표·단위·기간을 개별 대조하기 전까지 미제공합니다."},
  "dividends": {
   "status": "not-reviewed",
   "reason": "공식 배당 일정·금액을 아직 대조하지 않았습니다. 무배당을 의미하지 않습니다."
  }
 },
 {
  "kind": "company",
  "symbol": "NVDA",
  "name": "NVIDIA CORP",
  "cik": "0001045810",
  "industry": "Semiconductors & Related Devices",
  "identitySourceId": "sec-profile",
  "profileSourceId": "annual-report",
  "business": [
   "가속 컴퓨팅·GPU·네트워킹",
   "AI 소프트웨어와 자동차 플랫폼"
  ],
  "segments": [
   "Compute & Networking",
   "Graphics"
  ],
  "revenueModel": "컴퓨팅·네트워킹 플랫폼과 그래픽 제품·소프트웨어 판매",
  "tenSecondSummary": "가속 컴퓨팅 플랫폼과 그래픽 기술 기업.",
  "risks": [
   "변화하는 수출 통제",
   "빠른 기술 변화와 경쟁"
  ],
  "summaryKind": "editorial-from-official",
  "sources": [
   {
    "id": "sec-profile",
    "url": "https://data.sec.gov/submissions/CIK0001045810.json",
    "form": "SEC-profile",
    "filedAt": null,
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "name, cik, tickers, sicDescription",
    "amends": null
   },
   {
    "id": "annual-report",
    "url": "https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm",
    "form": "10-K",
    "filedAt": "2026-02-25",
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "Item 1 Business; Item 1A Risk Factors; segment information",
    "amends": null
   }
  ],
  "financials": [],
  "financialCoverage": {"status":"not-reviewed","reason":"재무 수치는 원문 표·단위·기간을 개별 대조하기 전까지 미제공합니다."},
  "dividends": {
   "status": "not-reviewed",
   "reason": "공식 배당 일정·금액을 아직 대조하지 않았습니다. 무배당을 의미하지 않습니다."
  }
 },
 {
  "kind": "company",
  "symbol": "AMZN",
  "name": "AMAZON COM INC",
  "cik": "0001018724",
  "industry": "Retail-Catalog & Mail-Order Houses",
  "identitySourceId": "sec-profile",
  "profileSourceId": "annual-report",
  "business": [
   "온라인·오프라인 상거래와 제3자 판매자 서비스",
   "AWS 클라우드·광고·구독"
  ],
  "segments": [
   "North America",
   "International",
   "AWS"
  ],
  "revenueModel": "상품 판매와 판매자·광고·구독·클라우드 서비스 매출",
  "tenSecondSummary": "상거래와 클라우드 서비스를 함께 운영하는 기업.",
  "risks": [
   "다양한 사업에서의 치열한 경쟁",
   "법률·규제와 운영 위험"
  ],
  "summaryKind": "editorial-from-official",
  "sources": [
   {
    "id": "sec-profile",
    "url": "https://data.sec.gov/submissions/CIK0001018724.json",
    "form": "SEC-profile",
    "filedAt": null,
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "name, cik, tickers, sicDescription",
    "amends": null
   },
   {
    "id": "annual-report",
    "url": "https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm",
    "form": "10-K",
    "filedAt": "2026-02-06",
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "Item 1 Business; Item 1A Risk Factors; segment information",
    "amends": null
   }
  ],
  "financials": [],
  "financialCoverage": {"status":"not-reviewed","reason":"재무 수치는 원문 표·단위·기간을 개별 대조하기 전까지 미제공합니다."},
  "dividends": {
   "status": "not-reviewed",
   "reason": "공식 배당 일정·금액을 아직 대조하지 않았습니다. 무배당을 의미하지 않습니다."
  }
 },
 {
  "kind": "company",
  "symbol": "GOOGL",
  "name": "Alphabet Inc.",
  "cik": "0001652044",
  "industry": "Services-Computer Programming, Data Processing, Etc.",
  "identitySourceId": "sec-profile",
  "profileSourceId": "annual-report",
  "business": [
   "Google 검색·YouTube·광고",
   "Google Cloud와 기타 기술 사업"
  ],
  "segments": [
   "Google Services",
   "Google Cloud",
   "Other Bets"
  ],
  "revenueModel": "광고, 클라우드 및 구독·플랫폼·기기 매출",
  "tenSecondSummary": "Google 서비스와 클라우드를 운영하는 지주회사.",
  "risks": [
   "광고 시장과 경쟁 변화",
   "규제·법률 절차 위험"
  ],
  "summaryKind": "editorial-from-official",
  "sources": [
   {
    "id": "sec-profile",
    "url": "https://data.sec.gov/submissions/CIK0001652044.json",
    "form": "SEC-profile",
    "filedAt": null,
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "name, cik, tickers, sicDescription",
    "amends": null
   },
   {
    "id": "annual-report",
    "url": "https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm",
    "form": "10-K",
    "filedAt": "2026-02-05",
    "checkedAt": "2026-10-27T12:16:42.166571+00:00",
    "verification": "verified",
    "locator": "Item 1 Business; Item 1A Risk Factors; segment information",
    "amends": null
   }
  ],
  "financials": [],
  "financialCoverage": {"status":"not-reviewed","reason":"재무 수치는 원문 표·단위·기간을 개별 대조하기 전까지 미제공합니다."},
  "dividends": {
   "status": "not-reviewed",
   "reason": "공식 배당 일정·금액을 아직 대조하지 않았습니다. 무배당을 의미하지 않습니다."
  }
 }
];
companyProfiles.forEach(validateCompany);
export function findCompanyProfile(symbol:string){return companyProfiles.find(p=>p.symbol===symbol)??null;}
