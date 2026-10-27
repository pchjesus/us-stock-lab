import {test,expect} from '@playwright/test';
import {formatDisplay,preferenceKey} from '../src/preferences';
test('currency display rounding and isolated namespaces',()=>{
 expect(formatDisplay(Number.MAX_SAFE_INTEGER,'USD')).toBe('$90,071,992,547,409.91');expect(formatDisplay(-1,'USD')).toBe('-$0.01');expect(formatDisplay(10000000,'USD')).toBe('$100,000.00');expect(formatDisplay(10000000,'KRW')).toBe('₩136,000,000');expect(formatDisplay(149,'KRW')).toBe('₩2,026');expect(formatDisplay(-149,'KRW')).toBe('-₩2,026');expect(formatDisplay(Number.MAX_SAFE_INTEGER+1,'KRW')).toContain('표시 범위');expect(preferenceKey('a')).not.toBe(preferenceKey('b'));expect(preferenceKey(null)).not.toBe(preferenceKey('a'));
});
test('polished navigation, header, currency persistence and USD order boundary',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T14:00:00Z'));
 for(const width of [1440,768,390]){
 await page.setViewportSize({width,height:1000});await page.goto('/#settings');await page.getByLabel('기본 표시 통화').selectOption('KRW');await page.getByRole('link',{name:'◫ 홈',exact:true}).click();await expect(page.getByTestId('total-assets')).toHaveText('₩136,000,000');await page.reload();await expect(page.getByTestId('total-assets')).toHaveText('₩136,000,000');
 const heights=await page.locator('.header-actions > *').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));expect(new Set(heights).size).toBe(1);await expect(page.locator('.live-times')).toContainText('KST');await expect(page.locator('.live-times')).toContainText('ET');
 await page.goto('/#market');await expect(page.getByLabel('종목 검색')).toBeVisible();await expect(page.locator('.market-links a')).toHaveCount(4);await page.getByRole('link',{name:'지표',exact:true}).click();await expect(page).toHaveURL(/#indices$/);await page.reload();await expect(page.getByRole('button',{name:'S&P 500 추이 →',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'경제 캘린더',exact:true}).click();await expect(page.locator('.calendar-grid')).toBeVisible();await page.getByRole('link',{name:'뉴스',exact:true}).click();await expect(page.getByRole('heading',{name:'경제·금융 뉴스'})).toBeVisible();
 await page.goto('/#stock/AAPL');await expect(page.getByRole('heading',{name:/₩/})).toBeVisible();await page.getByRole('button',{name:'주문 검토',exact:true}).click();await expect(page.getByRole('dialog',{name:'가상 주문 확인'})).toContainText('(USD)');await expect(page.getByRole('dialog',{name:'가상 주문 확인'})).not.toContainText('₩');await page.getByRole('button',{name:'주문 취소',exact:true}).click();
 await page.goto('/#settings');await page.getByLabel('기본 표시 통화').selectOption('USD');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/ui-c-${width}.png`,fullPage:true});
 }
});
test('spotlight leaves actual target brightness unchanged',async({page})=>{
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:1000});await page.goto('/#home');await expect(page.getByTestId('cash')).toBeVisible();await page.getByRole('button',{name:'사용 방법',exact:true}).click();await expect(page.locator('.spotlight')).toBeVisible();await expect(page.locator('.spotlight-dialog')).toBeVisible();expect(await page.locator('.spotlight-dialog').evaluate(e=>getComputedStyle(e,'::backdrop').backgroundColor)).toBe('rgba(0, 0, 0, 0)');expect(await page.locator('.tour-shield').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
 // The spotlight ring is outside this inset clip. Native dialog has no dimming backdrop.
 const box=await page.locator('.balance').boundingBox();const clip={x:box!.x+10,y:box!.y+10,width:8,height:8};const during=await page.screenshot({clip});await page.keyboard.press('Escape');await page.waitForTimeout(100);const afterBox=await page.locator('.balance').boundingBox();const after=await page.screenshot({clip:{...clip,x:afterBox!.x+10,y:afterBox!.y+10}});expect(during.equals(after)).toBe(true);}
});
