import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
for(const width of [1440,768,390])test(`prototype screens and interactions ${width}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:1000});const errors:string[]=[],requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('supabase.co'))requests.push(r.url());});mkdirSync('docs/ui/ux0-captures',{recursive:true});
 for(const route of ['home','stock','etf','learn','controls']){
  await page.goto('/prototype/ux0.html#'+route);await expect(page.locator('main h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.waitForTimeout(300);await page.screenshot({path:`docs/ui/ux0-captures/${width}-${route}.png`});
 }
 await page.goto('/prototype/ux0.html#stock');
 for(const symbol of ['AAPL','MSFT','NVDA','AMZN','GOOGL']){await page.getByLabel('기업 선택',{exact:true}).selectOption(symbol);await expect(page.getByRole('img',{name:'검증된 매출 실적 그래프'})).toBeVisible();}
 await page.getByLabel('기업 선택',{exact:true}).selectOption('AAPL');await page.getByRole('button',{name:'재무',exact:true}).click();await expect(page.getByText(/416161000000 USD/).first()).toBeVisible();await page.waitForTimeout(300);await page.screenshot({path:`docs/ui/ux0-captures/${width}-financial.png`});
 await page.getByRole('button',{name:'근거',exact:true}).click();await expect(page.getByRole('link',{name:/공식 원문/}).first()).toHaveAttribute('href',/^https:/);
 await page.getByRole('button',{name:'차트·거래',exact:true}).click();await expect(page.getByRole('button',{name:'주문 실행 연결 전'})).toBeDisabled();await page.waitForTimeout(300);await page.screenshot({path:`docs/ui/ux0-captures/${width}-trading.png`});
 const help=page.getByRole('button',{name:'현재 화면 도움말'});await help.click();const d=page.getByRole('dialog',{name:'도움말'});await expect(d.getByLabel('도움말 주제')).toHaveValue('stock');await page.waitForTimeout(300);await page.screenshot({path:`docs/ui/ux0-captures/${width}-help.png`});await page.keyboard.press('Escape');await expect(d).toHaveCount(0);await expect(help).toBeFocused();
 await help.click();await d.getByLabel('도움말 주제').selectOption('etf');await d.getByRole('button',{name:'7단계 안내 미리보기'}).click();for(let i=1;i<7;i++)await d.getByRole('button',{name:'다음',exact:true}).click();await expect(d.getByText('7/7 · 학습')).toBeVisible();await d.getByRole('button',{name:'도움말 닫기'}).click();
 await page.goto('/prototype/ux0.html#learn');await expect(page.getByRole('link',{name:'기초 투자 수업 열기 →'})).toHaveAttribute('href','../index.html#learn');await expect(page.getByRole('link',{name:'차트 실험실 열기 →'})).toHaveAttribute('href','../index.html#learn/AAPL');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/prototype/ux0.html#stock');expect(await page.locator('.content-view').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');expect(requests).toEqual([]);expect(errors).toEqual([]);
});
