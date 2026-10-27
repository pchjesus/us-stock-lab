import {expect,test} from '@playwright/test';
import {
  brokerFeeCents,usdCentsToKrw,estimateAnnualCapitalGainsTax,
  dividendEligibleShares,projectDividend,newYorkDate,type ConfirmedCashDividend
} from '../src/paperFinance';

test('commission: 0.1%, minimum and exact cents',()=>{
 expect(brokerFeeCents(1_000_000,{rateBps:10,minCents:0})).toBe(1000);
 expect(brokerFeeCents(12500,{rateBps:7,minCents:10})).toBe(10);
 expect(brokerFeeCents(0,{rateBps:0,minCents:0})).toBe(0);
 expect(()=>brokerFeeCents(-1,{rateBps:10,minCents:0})).toThrow();
 expect(()=>brokerFeeCents(100,{rateBps:20000,minCents:0})).toThrow();
});
test('tax: 2.5 million won annual allowance only on realized KRW net gains',()=>{
 const win={year:2026,proceedsKrw:10_000_000,acquisitionKrw:7_000_000,deductibleFeesKrw:0};
 const a=estimateAnnualCapitalGainsTax([win],2026);
 expect(a.totalNetRealizedKrw).toBe(3_000_000);
 expect(a.deductionKrw).toBe(2_500_000);
 expect(a.taxableKrw).toBe(500_000);
 expect(a.nationalKrw).toBe(100_000);
 expect(a.localKrw).toBe(10_000);
 expect(a.totalTaxKrw).toBe(110_000);
 const b=estimateAnnualCapitalGainsTax([win,{year:2026,proceedsKrw:1_000_000,acquisitionKrw:1_500_000,deductibleFeesKrw:0}],2026);
 expect(b.totalTaxKrw).toBe(0);
 expect(estimateAnnualCapitalGainsTax([win],2027).totalTaxKrw).toBe(0);
 expect(estimateAnnualCapitalGainsTax([{...win,deductibleFeesKrw:100_000}],2026).totalTaxKrw).toBe(88_000);
});
test('KRW tax conversion: settlement FX fixed-point, unlike demo display rate',()=>{
 expect(usdCentsToKrw(10000,'1324.42')).toBe(132442);
 expect(usdCentsToKrw(1,'1324.42')).toBe(13);
 expect(()=>usdCentsToKrw(10000,'NaN')).toThrow();
});
const event:ConfirmedCashDividend={
 id:'AAPL:2026-10-29:cash',symbol:'AAPL',exDate:'2026-10-29',payDate:'2026-11-05',
 amountUnits:12537,sourceUrl:'https://investor.apple.com/',verified:true,type:'regular_cash'
};
const trades=[
 {symbol:'AAPL',side:'buy' as const,quantity:3,time:'2026-10-28T19:00:00Z'},
 {symbol:'AAPL',side:'sell' as const,quantity:1,time:'2026-10-29T14:00:00Z'},
 {symbol:'AAPL',side:'buy' as const,quantity:5,time:'2026-10-29T15:00:00Z'}
];
test('ex-date entitlement: selling on ex-date retains right, buying on it does not',()=>{
 expect(newYorkDate('2026-10-29T01:00:00Z')).toBe('2026-10-28');
 expect(dividendEligibleShares(trades,event)).toBe(3);
 const pending=projectDividend(trades,event,'2026-11-04');
 expect(pending).toMatchObject({eligibleShares:3,grossCents:376,withheldCents:56,netCents:320,due:false});
 expect(projectDividend(trades,event,'2026-11-05').due).toBe(true);
});
test('dividend fail-closed for incomplete source, invalid date, bad trade history',()=>{
 expect(()=>projectDividend(trades,{...event,verified:false as true},'2026-11-05')).toThrow();
 expect(()=>projectDividend(trades,{...event,payDate:'2026-10-26'},'2026-11-05')).toThrow();
 expect(()=>projectDividend(trades,event,'today')).toThrow();
 expect(()=>dividendEligibleShares([{symbol:'AAPL',side:'sell',quantity:1,time:'2026-10-28T19:00:00Z'}],event)).toThrow();
});
