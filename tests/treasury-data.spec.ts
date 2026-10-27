import {test,expect} from '@playwright/test';
import {parseTreasuryStats} from '../src/treasuryData';
const sample={provider:'US Treasury FiscalData',sourceUrl:'https://fiscaldata.treasury.gov/',asOfDebt:'2026-10-26',debtUsd:'38000000000000.00',asOfRates:'2026-09-30',averageRates:[{name:'Treasury Bills',ratePct:'4.15'}],fetchedAtUtc:'2026-10-27T00:00:00Z'};
test('Treasury independently validates public monthly rates/debt without price execution',()=>{
 const v=parseTreasuryStats(sample);expect(v.averageRates[0].ratePct).toBe('4.15');
 for(const change of [{debtUsd:'foo'},{provider:'Yahoo'},{averageRates:[{name:'10-year spot',ratePct:'4.1'}]},{sourceUrl:'https://wrong.com'},{asOfRates:'2027-09-30'}]){
  expect(()=>parseTreasuryStats({...sample,...change})).toThrow();
 }
});
