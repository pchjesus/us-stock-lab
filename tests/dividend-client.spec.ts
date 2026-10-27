import {test,expect} from '@playwright/test';
import {decodeManual,ManualDataError} from '../src/manualAccount';
import {dividendFixture} from './dividend-fixture';
import {fixture} from './manual-fixture';
test('ledger order replays a dividend funding the next buy; legacy accounts unchanged',()=>{
 const a=decodeManual(dividendFixture());expect(a.cash).toBe(1250);expect(a.gross).toBe(25000);expect(a.withheld).toBe(3750);expect(a.net).toBe(21250);expect(a.holdings.AAPL).toEqual({quantity:1002,cost:10020000});expect(a.realized).toBe(0);expect(decodeManual(fixture(true)).net).toBe(0);
});
test('dividend references, tax, cents and duplicate credits fail closed preserving original',()=>{
 for(const change of [(r:any)=>r.dividends[0].net_cents++,(r:any)=>r.dividends[0].withholding_cents--,(r:any)=>r.dividends[0].quantity++,(r:any)=>r.dividends.push(r.dividends[0]),(r:any)=>r.ledger[2].dividend_credit_id='missing',(r:any)=>r.dividend_events[0].amount_units++,(r:any)=>r.entitlements[0].eligible_quantity--,(r:any)=>r.dividends[0].account_id='B',(r:any)=>r.ledger[2].balance_cents++,(r:any)=>r.dividends[0].posted_at='2026-10-26T04:00:00Z']){
  const raw=dividendFixture();change(raw);try{decodeManual(raw);throw Error('accepted invalid');}catch(e){expect(e).toBeInstanceOf(ManualDataError);expect((e as ManualDataError).raw).toBe(raw);}
 }
});
