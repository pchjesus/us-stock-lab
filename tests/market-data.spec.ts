import {expect,test} from '@playwright/test';
import {fxEndpointConfig,parseFxReference,fetchFxReference} from '../src/marketData';
const valid={base:'USD',quote:'KRW',rateDecimal:'1420.1234',observedOn:'2026-10-26',fetchedAtUtc:'2026-10-27T00:00:00Z',sourceName:'Frankfurter',sourceUrl:'https://frankfurter.dev/',method:'blended'};
const now=new Date('2026-10-27T02:00:00Z');
test('FX endpoint is opt-in and only accepted on Supabase origin',()=>{
 expect(fxEndpointConfig('false','https://demo.supabase.co/')).toBeNull();
 expect(fxEndpointConfig('true','https://example.com/')).toBeNull();
 expect(fxEndpointConfig('true','http://demo.supabase.co/')).toBeNull();
 expect(fxEndpointConfig('true','https://demo.supabase.co/')).toBe('https://demo.supabase.co/functions/v1/market-fx');
});
test('daily reference validates source, value and UTC metadata',()=>{
 const v=parseFxReference(valid,now);expect(v.rateDecimal).toBe(valid.rateDecimal);
 expect(v.freshness).toBe('daily_reference');expect(v.status).toBe('verified');
 for(const patch of [{quote:'USD'},{method:'ECB'},{rateDecimal:'NaN'},{rateDecimal:'0'},{sourceUrl:'https://evil.test'},{observedOn:'2026-10-30'},{fetchedAtUtc:'2026-10-30T00:00:00Z'}]){
  expect(()=>parseFxReference({...valid,...patch},now)).toThrow();
 }
 expect(parseFxReference({...valid,observedOn:'2026-10-11'},now).status).toBe('unavailable');
});
test('FX request rejects upstream failure and never fabricates a rate',async()=>{
 const ok=async()=>new Response(JSON.stringify(valid),{status:200});
 const got=await fetchFxReference('https://demo.supabase.co/functions/v1/market-fx',ok as typeof fetch,now);
 expect(got.rateDecimal).toBe('1420.1234');
 await expect(fetchFxReference('https://demo.supabase.co/functions/v1/market-fx',(async()=>new Response('',{status:503})) as typeof fetch,now)).rejects.toThrow('503');
 await expect(fetchFxReference('https://demo.supabase.co/functions/v1/market-fx',(async()=>new Response('{}',{status:200})) as typeof fetch,now)).rejects.toThrow();
});

test('FX reference unavailable by default does not relabel demo quotes',async({page})=>{
 await page.goto('/#indices');
 await expect(page.getByTestId('fx-reference')).toContainText('연동 준비 중');
 await expect(page.locator('.market-indices section')).toHaveCount(6);
 await expect(page.getByTestId('fx-reference')).not.toContainText('1 USD =');
});
