import {test,expect} from '@playwright/test';
test('production FX flag shows real/reference separately while synthetic account stays unchanged',async({page})=>{
 await page.route('https://vveljtqmujdzkzmoncjx.supabase.co/functions/v1/market-fx',route=>route.fulfill({
  status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},
  body:JSON.stringify({base:'USD',quote:'KRW',method:'blended',sourceName:'Frankfurter',sourceUrl:'https://frankfurter.dev/',
   rateDecimal:'1420.1234',observedOn:'2026-10-27',fetchedAtUtc:'2026-10-27T00:00:00Z'})
 }));
 await page.clock.install({time:new Date('2026-10-27T02:00:00Z')});
 await page.goto('/#indices');
 const fx=page.getByTestId('fx-reference');
 await expect(fx).toContainText('1 USD = 1,420.1234 KRW');
 await expect(fx).toContainText('Frankfurter');
 await expect(page.locator('.market-indices section')).toHaveCount(6);
 await page.goto('/#home');
 await expect(page.getByTestId('total-assets')).toHaveText('$100,000.00');
 await page.goto('/#settings');
 await page.getByLabel('기본 표시 통화').selectOption('KRW');
 await page.goto('/#home');
 // v0.5-A displays real reference only: legacy portfolio KRW accounting remains synthetic.
 await expect(page.getByTestId('total-assets')).toHaveText('₩136,000,000');
});
