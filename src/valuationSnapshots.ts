/** Immutable educational reference snapshots. NOT live quotes and NEVER an input to virtual orders.
 * Company: Stock Analysis statistics (S&P Global Market Intelligence attributed on provider page), checked 2026-11-18.
 * Market ratios are a snapshot of 2026-11-17 NYSE/Nasdaq close; do not back-calculate from synthetic prices.
 * Peer grouping: Aswath Damodaran, US industry aggregates as of January 2026.
 * Comparison across Jan and Nov is illustrative only; no valuation ranking or price judgement is inferred.
 */
import type {CompanySymbol} from './companyData';
export type ValuationMetric='per'|'pbr'|'roe';
export const valuationMetricDescriptions={
 per:{label:'PER',fullName:'주가수익비율 (P/E)',description:'실제 주가와 최근 12개월 주당이익(EPS)을 비교한 배수입니다. 이익이 없거나 0 이하라면 통상 비교가 어렵습니다.',unit:'배'},
 pbr:{label:'PBR',fullName:'주가순자산비율 (P/B)',description:'실제 시장가격과 기업 장부상 주당 순자산의 비율입니다. 자사주 매입·무형자산·업종별 자본구조에 유의해야 합니다.',unit:'배'},
 roe:{label:'ROE',fullName:'자기자본이익률 (ROE)',description:'자기자본을 활용해 얼마나 이익을 냈는지의 비율입니다. 자사주 매입·차입금·자기자본 규모에 따라 크게 변할 수 있습니다.',unit:'%'}
} as const;
export const snapshotMeta={
 companyDate:'2026-11-17',
 companyChecked:'2026-11-18',
 industryDate:'2026-01',
 companyProvider:'Stock Analysis (S&P Global Market Intelligence 표기)',
 industryProvider:'NYU Stern · Aswath Damodaran',
 industryPERSource:'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/pedata.html',
 industryPBRSource:'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/pbvdata.html',
 industryROESource:'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/roe.html'
} as const;
interface Snapshot {
 symbol:CompanySymbol;
 company:{per:number|null;pbr:number|null;roe:number|null;source:string};
 industry:{name:string;groupKind:'illustrative-sector-match';firms:number;per:number|null;pbr:number|null;roe:number|null};
}
export const valuationSnapshots:Record<CompanySymbol,Snapshot>={
 AAPL:{symbol:'AAPL',company:{per:39.19,pbr:45.62,roe:142.26,source:'https://stockanalysis.com/stocks/aapl/statistics/'},industry:{name:'Computers/Peripherals',groupKind:'illustrative-sector-match',firms:36,per:81.13,pbr:34.08,roe:-0.17}},
 MSFT:{symbol:'MSFT',company:{per:26.43,pbr:7.99,roe:34.22,source:'https://stockanalysis.com/stocks/msft/statistics/'},industry:{name:'Software (System & Application)',groupKind:'illustrative-sector-match',firms:309,per:79.17,pbr:9.14,roe:29.62}},
 NVDA:{symbol:'NVDA',company:{per:19.66,pbr:16.47,roe:117.21,source:'https://stockanalysis.com/stocks/nvda/statistics/'},industry:{name:'Semiconductor',groupKind:'illustrative-sector-match',firms:66,per:100.18,pbr:13.31,roe:31.36}},
 AMZN:{symbol:'AMZN',company:{per:20.84,pbr:4.54,roe:27.42,source:'https://stockanalysis.com/stocks/amzn/statistics/'},industry:{name:'Retail (General)',groupKind:'illustrative-sector-match',firms:23,per:51.00,pbr:7.19,roe:26.05}},
 GOOGL:{symbol:'GOOGL',company:{per:14.63,pbr:5.22,roe:44.29,source:'https://stockanalysis.com/stocks/googl/statistics/'},industry:{name:'Advertising',groupKind:'illustrative-sector-match',firms:52,per:44.43,pbr:4.55,roe:-1.34}}
};
const finite=(n:number|null)=>n===null||(Number.isFinite(n)&&Math.abs(n)<100000);
export function validatedValuationSnapshot(symbol:string):Snapshot|null{
 const item=Object.hasOwn(valuationSnapshots,symbol)?valuationSnapshots[symbol as CompanySymbol]:undefined;
 if(!item||item.symbol!==symbol||!/^https:\/\/stockanalysis\.com\/stocks\/[a-z]+\/statistics\/$/.test(item.company.source))return null;
 if(!Number.isInteger(item.industry.firms)||item.industry.firms<2||!(['per','pbr','roe'] as const).every(k=>finite(item.company[k])&&finite(item.industry[k])))return null;
 return item;
}
export function valuationDisplay(metric:ValuationMetric,value:number|null):string{
 if(value===null||!Number.isFinite(value))return '미제공';
 return value.toFixed(2)+(metric==='roe'?'%':'배');
}
