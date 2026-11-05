import {test,expect} from '@playwright/test';
import {openFinancials} from './detail-navigation';
test('financial summary, statements and mobile comparison preserve evidence paths',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#stock/AAPL');await openFinancials(page);
 const before=await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'));
 await expect(page.locator('.financial-summary > .financial-metric')).toHaveCount(4);
 await expect(page.getByTestId('financial-revenue')).toContainText('416.1 십억 USD');
 await page.getByTestId('financial-revenue').getByText('정확값·원문·계산 근거',{exact:true}).click();
 await expect(page.getByTestId('financial-revenue').getByTestId('evidence-exact-value')).toContainText('416161000000');
 for(const width of [1440,1200,768,390,320]){
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const name of ['손익계산서','재무상태표','현금흐름표']){
   const region=page.getByRole('region',{name:name+' 기간 비교'});await expect(region).toBeVisible();await region.focus();await expect(region).toBeFocused();
   await expect(region.getByRole('columnheader').first()).toHaveText('항목');
   if(width<=390&&name!=='재무상태표'){expect(await region.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);await region.press('ArrowRight');}
  }
 }
 await page.getByRole('button',{name:'분기',exact:true}).click();await expect(page.getByTestId('financial-operatingCashFlow')).toContainText('공식 수치 미확인');
 expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(before);expect(errors).toEqual([]);
});
