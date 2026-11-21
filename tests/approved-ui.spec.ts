import {test,expect} from '@playwright/test';
test('approved UI is the default from the root and across the investment journey',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.ui-foundation.ui-v1')).toBeVisible();await expect(page.locator('.home-account')).toBeVisible();
 await page.goto('/#market');await expect(page.locator('.market-v3')).toBeVisible();await expect(page.locator('.market-v3-card')).toHaveCount(8);
 await page.getByRole('group',{name:'종목 보기 방식'}).getByRole('button',{name:'목록'}).click();await expect(page.locator('.market-v3-list')).toBeVisible();
 await page.getByRole('group',{name:'종목 보기 방식'}).getByRole('button',{name:'카드'}).click();
 await page.locator('.market-v3-card[data-symbol="AAPL"] a[href="#stock/AAPL"]').click();
 await expect(page.locator('.stock-workspace-v3')).toBeVisible();await expect(page.locator('.detail-lab')).toHaveCount(0);
 for(const tab of ['개요','차트·거래','재무','근거']){await page.getByRole('tab',{name:tab,exact:true}).click();await expect(page.getByRole('tabpanel',{name:tab,exact:true})).toBeVisible();}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);
 await page.goto('/#stock/VOO');await expect(page.locator('.stock-workspace-v3 .sw-etf')).toBeVisible();
 await page.goto('/#learn');await expect(page.locator('.ui-foundation.ui-v1')).toBeVisible();
 await page.goto('/#portfolio');await expect(page.getByRole('heading',{name:'포트폴리오',exact:true})).toBeVisible();
 await page.goto('/#settings');await expect(page.getByRole('heading',{name:'설정 및 서비스 안내'})).toBeVisible();
 expect(errors).toEqual([]);
});
test('explicit historical UI remains accessible without changing production defaults',async({page})=>{
 await page.goto('/?ui=v1#stock/AAPL');await expect(page.locator('.v1-stock-detail')).toBeVisible();await expect(page.locator('.stock-workspace-v3')).toHaveCount(0);
 await page.goto('/?ui=legacy#market');await expect(page.locator('.ui-foundation.ui-v1')).toHaveCount(0);
 await page.goto('/#market');await expect(page.locator('.market-v3')).toBeVisible();
});
