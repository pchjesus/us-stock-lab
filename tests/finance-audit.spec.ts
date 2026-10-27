import {test,expect} from '@playwright/test';
import {decodeManual} from '../src/manualAccount';
import {fixture} from './manual-fixture';
import {dividendFixture} from './dividend-fixture';
import {analyzeTax,emptyTaxDocument,settlement} from '../src/taxAnalysis';
test('tour waits for target scrolling before exposing a visible spotlight',async({page})=>{
 const time=new Date('2026-10-27T14:00:00Z');await page.clock.install({time});await page.clock.pauseAt(new Date(time.getTime()+1000));await page.goto('/#home');await expect(page.getByTestId('cash')).toBeVisible();await page.getByRole('button',{name:'사용 방법',exact:true}).click();
 await page.evaluate(()=>document.querySelector('main')!.appendChild(document.createComment('layout-mutation-audit')));
 await expect(page.locator('.spotlight')).toHaveCount(0,{timeout:600});
 await page.clock.runFor(220);await expect(page.locator('.spotlight')).toBeVisible();const b=await page.locator('.balance').boundingBox(),r=await page.locator('.spotlight').boundingBox();expect(r!.y).toBeCloseTo(b!.y,0);await page.keyboard.press('Escape');await page.clock.runFor(100);
});
test('fee policy snapshot tampering and corrected-paid entitlement fail closed',()=>{
 const legacy:any=structuredClone(fixture(true));delete legacy.revision;delete legacy.fee_policy;delete legacy.fee_policies;const old=decodeManual(legacy);expect(old.cash).toBe(9989990);expect(old.revision).toBeNull();expect(old.feePolicy).toBeNull();
 for(const change of [(r:any)=>r.fee_policy.rate_bps=0,(r:any)=>r.fee_policies[0].account_id='B',(r:any)=>{r.orders[0].fee_policy_version=1;r.orders[0].payload.rateBps=0;},(r:any)=>r.revision='9007199254740992']){const r=structuredClone(fixture(true));r.orders[0].fee_policy_version=1;change(r);expect(()=>decodeManual(r)).toThrow();}
 const r=dividendFixture();r.dividend_events[0].status='review';r.dividend_events[0].version=2;
 // A correction does not authorize a different historical entitlement quantity.
 r.entitlements[0].eligible_quantity=999;r.dividends[0].quantity=999;r.dividends[0].gross_cents=24975;r.dividends[0].withholding_cents=3746;r.dividends[0].net_cents=21229;r.ledger[2].delta_cents=r.ledger[2].balance_cents=21229;r.ledger[3].balance_cents=1229;r.cash='1229';expect(()=>decodeManual(r)).toThrow();
});
test('external account deduction is applied once for every allowed allocation',()=>{
 const a=decodeManual(fixture()),now=new Date('2026-11-03T00:00:00Z');
 for(const appNet of [-3000000,0,3000000]){
  const orders=[{id:'b',symbol:'AAPL',side:'buy',quantity:1,price_cents:1000000,fee_cents:0,filled_at:'2026-10-27T14:00:00Z'},{id:'s',symbol:'AAPL',side:'sell',quantity:1,price_cents:1000000+appNet/10,fee_cents:0,filled_at:'2026-10-27T14:00:00Z'}];
  const fx={date:'2026-10-28',rate:'1000',kind:'base' as const,provider:'user document',url:'https://www.smbs.biz/',checkedAt:'2026-10-28T00:00:00Z',status:'user_entered' as const};
  for(const net of [-3000000,0,2490000,2500000,2510000,10000000,Number.MAX_SAFE_INTEGER])for(const used of [0,Math.min(Math.max(0,net),1000000),Math.min(Math.max(0,net),2500000)]){
   const d={...emptyTaxDocument(),records:orders.map(o=>({orderId:o.id,confirmedSettlement:null,settlementSource:'',fx,feeFx:fx})),external:[{year:2026,netKrw:net,usedDeductionKrw:used}]};
   if(BigInt(net)+BigInt(appNet)>BigInt(Number.MAX_SAFE_INTEGER)){expect(()=>analyzeTax({...a,orders},d,2026,now)).toThrow();continue;}
   const r=analyzeTax({...a,orders},d,2026,now),base=BigInt(net)+BigInt(appNet)-2500000n,taxable=base>0n?base:0n;
   expect(r.calculable).toBe(true);expect(r.taxKrw).toBe(Number((taxable*20n+50n)/100n+(taxable*2n+50n)/100n));expect(r.deductionKrw+used).toBeLessThanOrEqual(2500000);
  }
 }
});

test('offset FX confirmation cannot predate its UTC evidence basis day',()=>{
 const a=decodeManual(fixture(true)),o=a.orders[0],date=settlement(o.filled_at).expected!;const fx={date,rate:'1300',kind:'base' as const,provider:'user document',url:'https://www.smbs.biz/',checkedAt:date+'T01:00:00+09:00',status:'user_entered' as const};
 const d={...emptyTaxDocument(),records:[{orderId:o.id,confirmedSettlement:null,settlementSource:'',fx,feeFx:fx}]};const r=analyzeTax(a,d,2026,new Date('2026-11-03T00:00:00Z'));expect(r.calculable).toBe(false);expect(r.warnings.some(w=>w.includes('확인시각'))).toBe(true);
});
