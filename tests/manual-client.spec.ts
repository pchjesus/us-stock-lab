import {test,expect} from '@playwright/test';
import {decodeManual,preview,ManualDataError,readManualPending} from '../src/manualAccount';
import {fixture} from './manual-fixture';
test('manual snapshot replays fees/cash/basis and rejects tampering preserving original',()=>{
 const raw=fixture(true),a=decodeManual(raw);expect(a.cash).toBe(9989990);expect(a.fees).toBe(10);expect(a.holdings.AAPL).toEqual({quantity:1,cost:10010});
 const sale=preview(a,{...raw.orders[0].payload,side:'sell'} as any);expect(sale).toEqual({value:10000,fee:10,basis:10010,delta:9990,cash:9999980});
 for(const mutate of [(r:any)=>r.cash='9989991',(r:any)=>r.fees='0',(r:any)=>r.positions[0].cost='10000',(r:any)=>r.orders[0].fee_cents=0,(r:any)=>r.ledger[1].balance_cents=1,(r:any)=>r.orders.push(r.orders[0]),(r:any)=>r.orders[0].account_id='other',(r:any)=>r.ledger[1].order_id='other',(r:any)=>r.cash='9007199254740992',(r:any)=>r.cash=' ',(r:any)=>r.orders[0].price_cents=NaN]){const r=structuredClone(raw);mutate(r);try{decodeManual(r);throw Error('accepted invalid');}catch(e){expect(e).toBeInstanceOf(ManualDataError);expect((e as ManualDataError).raw).toBe(r);}}
 expect(raw.cash).toBe('9989990');
});
test('manual preview rejects input/cash/shares/fee errors and never uses synthetic price',()=>{
 const a=decodeManual(fixture()),o=fixture(true).orders[0].payload as any;
 for(const patch of [{quantity:0},{quantity:1.5},{priceCents:0},{priceCents:100000001},{rateBps:10001},{minCents:-1},{quantity:1000000},{side:'sell'},{source:''},{observedAt:'2026-10-27'},{symbol:'INVALID'}])expect(()=>preview(a,{...o,...patch})).toThrow();
 expect(preview(a,{...o,priceCents:8000,quantity:5}).cash).toBe(9959960);
});

test('pending records stay scoped by user and corrupt original is retained',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),rows=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>rows.get(k)??null}});
 try{const order=fixture(true).orders[0].payload;rows.set('us-stock.manual.pending.v1.A',JSON.stringify({id:'pendingA',order}));expect(readManualPending('A')?.id).toBe('pendingA');expect(readManualPending('B')).toBeNull();rows.set('us-stock.manual.pending.v1.A','broken');expect(()=>readManualPending('A')).toThrow(/원본/);expect(rows.get('us-stock.manual.pending.v1.A')).toBe('broken');}
 finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete (globalThis as any).localStorage;}
});
