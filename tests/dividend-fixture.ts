import {fixture} from './manual-fixture';
export function dividendFixture():any{
 const r:any=fixture(true),o=r.orders[0];o.payload={...o.payload,quantity:1000,rateBps:0};o.quantity=1000;o.fee_cents=0;o.observed_at=o.payload.observedAt='2026-10-26T13:59:00Z';o.received_at=o.filled_at='2026-10-26T14:00:00Z';
 const second=structuredClone(o);second.id='order2';second.request_id='request2';second.execution_seq=2;second.quantity=second.payload.quantity=2;second.observed_at=second.payload.observedAt='2026-10-27T13:59:00Z';second.received_at=second.filled_at='2026-10-27T14:00:00Z';r.orders.push(second);
 r.cash='1250';r.fees='0';r.positions=[{symbol:'AAPL',quantity:'1002',cost:'10020000'}];r.ledger[1].delta_cents=-10000000;r.ledger[1].balance_cents=0;
 r.dividend_events=[{id:'event1',symbol:'AAPL',kind:'regular_cash',announced:'2026-10-01',ex_date:'2026-10-27',record_date:'2026-10-27',pay_date:'2026-10-27',amount_units:2500,source_url:'https://investor.apple.com/test-fixture',verified_at:'2026-10-26T00:00:00Z',standard_tax:true,status:'confirmed',version:1}];
 r.entitlements=[{event_id:'event1',account_id:r.id,eligible_quantity:1000,event_version:1}];r.dividends=[{id:'credit1',event_id:'event1',account_id:r.id,event_version:1,quantity:1000,amount_units:2500,gross_cents:25000,withholding_cents:3750,net_cents:21250,posted_at:'2026-10-27T04:00:00Z'}];r.dividend_status=[{event_id:'event1',account_id:r.id,state:'paid'}];
 r.ledger.push({id:3,account_id:r.id,kind:'dividend',order_id:null,dividend_credit_id:'credit1',delta_cents:21250,balance_cents:21250},{id:4,account_id:r.id,kind:'trade',order_id:'order2',delta_cents:-20000,balance_cents:1250});return r;
}
