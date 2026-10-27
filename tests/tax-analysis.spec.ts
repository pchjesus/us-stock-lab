import {test,expect} from '@playwright/test';
import {analyzeTax,settlement,emptyTaxDocument,type TaxDocument,type TaxRecord} from '../src/taxAnalysis';
const now=new Date('2027-02-01T00:00:00Z');
function order(id:string,side:string,price:number,quantity=1,date='2026-10-26T14:00:00Z',fee=0,symbol='AAPL'){return {id,side,symbol,quantity,price_cents:price,fee_cents:fee,filled_at:date};}
function evidence(o:any,rate='1000'):TaxRecord{const date=settlement(o.filled_at).expected!;const fx={date,rate,kind:'base' as const,provider:'사용자 확인 고시',url:'https://www.smbs.biz/',checkedAt:'2027-02-01T00:00:00Z',status:'document_reviewed' as const};return {orderId:o.id,confirmedSettlement:null,settlementSource:'',feeDate:date,fx:{...fx},feeFx:{...fx}};}
function run(orders:any[],doc?:TaxDocument,year=2026){return analyzeTax({orders} as any,doc??{...emptyTaxDocument(),records:orders.map(o=>evidence(o))},year,now);}
test('deduction boundaries 249/250/251, losses, symbols, year and external deduction share',()=>{
 for(const [price,net,tax] of [[259000,2490000,0],[260000,2500000,0],[261000,2510000,2200]]){const a=run([order('b','buy',10000),order('s','sell',price)]);expect(a.netKrw).toBe(net);expect(a.taxKrw).toBe(tax);expect(a.calculable).toBe(true);}
 const orders=[order('b','buy',10000),order('s','sell',261000),order('b2','buy',10000,1,undefined,0,'MSFT'),order('s2','sell',9000,1,undefined,0,'MSFT')];expect(run(orders).netKrw).toBe(2500000);expect(run([order('b','buy',10000),order('s','sell',9000)]).taxKrw).toBe(0);
 const doc={...emptyTaxDocument(),records:orders.map(o=>evidence(o)),external:[{year:2026,netKrw:1000000,usedDeductionKrw:1000000}]};expect(run(orders,doc).taxKrw).toBe(220000);
 const boundary=[order('b','buy',10000),order('s','sell',261000,1,'2026-12-31T15:00:00Z')];expect(run(boundary,undefined,2026).netKrw).toBe(0);expect(run(boundary,undefined,2027).netKrw).toBe(2510000);
});
test('FIFO/average costs include buy fees once; partial/full sales and FX direction',()=>{
 const orders=[order('b','buy',100,10,undefined,1),order('b2','buy',200,10,undefined,1),order('s','sell',300,10,undefined,1),order('s2','sell',300,10,undefined,1)];const before=JSON.stringify(orders),doc={...emptyTaxDocument(),records:orders.map(o=>evidence(o))};
 const fifo=run(orders,doc),average=run(orders,{...doc,policy:'average-v1'});expect(fifo.rows.map(r=>r.acquisitionKrw)).toEqual([10010,20010]);expect(average.rows.map(r=>r.acquisitionKrw)).toEqual([15010,15010]);expect(fifo.netKrw).toBe(29960);expect(average.netKrw).toBe(29960);expect(fifo.recognizedFeesKrw).toBe(40);expect(JSON.stringify(orders)).toBe(before);
 const fxOrders=[order('b','buy',10000),order('s','sell',9000)],fxDoc={...emptyTaxDocument(),records:[evidence(fxOrders[0]),evidence(fxOrders[1],'1300')]};expect(run(fxOrders,fxDoc).netKrw).toBe(17000);
});
test('T+1 weekend, holiday, bank-only holiday, DST and December 31 range',()=>{
 for(const [at,expected] of [['2026-10-23T14:00:00Z','2026-10-26'],['2026-11-25T15:00:00Z','2026-11-27'],['2026-12-31T15:00:00Z','2027-01-04'],['2026-03-06T15:00:00Z','2026-03-09'],['2026-03-09T13:30:00Z','2026-03-10'],['2026-10-09T14:00:00Z','2026-10-13'],['2026-11-10T15:00:00Z','2026-11-12']])expect(settlement(at).expected).toBe(expected);
 expect(settlement('2027-12-31T15:00:00Z').expected).toBeNull();expect(settlement('2028-01-03T15:00:00Z').expected).toBeNull();
});
test('missing/mismatched/invalid/reference FX block tax; stale sources warn, rounding exact',()=>{
 const orders=[order('b','buy',101),order('s','sell',102)];let doc={...emptyTaxDocument(),records:orders.map(o=>evidence(o,'1360.5'))};expect(run(orders,doc).netKrw).toBe(14);
 for(const patch of [{date:'2026-10-28'},{rate:'NaN'},{rate:'0'},{provider:'Frankfurter'},{url:'javascript:alert(1)'},{checkedAt:'invalid'}]){const bad=structuredClone(doc);Object.assign(bad.records[0].fx,patch);expect(run(orders,bad).calculable).toBe(false);}
 expect(run(orders,emptyTaxDocument()).calculable).toBe(false);doc=structuredClone(doc);doc.records.forEach(r=>{r.fx.checkedAt=r.feeFx.checkedAt='2026-10-28T00:00:00Z';});expect(run(orders,doc).warnings.some(w=>w.includes('90일'))).toBe(true);
});
test('independent expense-date FX includes purchase cost once and excludes dividend tax',()=>{
 const orders=[order('b','buy',10000,1,'2026-10-26T14:00:00Z',100),order('s','sell',10000,1,'2026-10-27T14:00:00Z',100)],records=orders.map(o=>evidence(o));records[0].feeDate='2026-10-28';records[0].feeFx={...records[0].feeFx,date:'2026-10-28',rate:'1200'};records[1].fx.rate='1100';records[1].feeDate='2026-10-29';records[1].feeFx={...records[1].feeFx,date:'2026-10-29',rate:'1300'};
 const d={...emptyTaxDocument(),records},a=analyzeTax({orders,gross:100000,withheld:15000,net:85000} as any,d,2026,now);expect(a.calculable).toBe(true);expect(a.rows[0].acquisitionKrw).toBe(101200);expect(a.rows[0].netKrw).toBe(7500);expect(a.recognizedFeesKrw).toBe(2500);expect(a.taxKrw).toBe(0);
 expect(()=>run(orders,{...d,external:[{year:2026,netKrw:0,usedDeductionKrw:1000}]})).toThrow(/외부 공제/);
});
