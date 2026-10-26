import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test,expect,chromium,type Page} from '@playwright/test';
import {marketPrices,accountKey} from '../src/accountStore';
const price=marketPrices().AAPL;
async function order(page:Page,side:'buy'|'sell',qty:string){await page.getByLabel('주문 유형',{exact:true}).selectOption(side);await page.getByLabel('주문 수량',{exact:true}).fill(qty);await page.getByRole('button',{name:'주문 검토',exact:true}).click();await page.getByRole('button',{name:'체결 확정',exact:true}).click();}
const cash=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
test('buy, additional buy, simulation, partial/full sell and confirmed reset survive restart',async({page,context})=>{
 await page.goto('/#stock/AAPL');await order(page,'buy','10');await expect(page.getByRole('status')).toContainText('체결되고 저장');
 await page.reload();await expect(page.getByText(/보유 10주/)).toBeVisible();await page.getByLabel('추가매수 가격',{exact:true}).fill('80');await page.getByLabel('추가매수 수량',{exact:true}).fill('5');
 await expect(page.getByTestId('simulation')).toContainText('15주');expect(JSON.parse((await page.evaluate(k=>localStorage.getItem(k),accountKey))!).trades).toHaveLength(1);
 await order(page,'buy','5');await expect(page.getByRole('status')).toContainText('체결되고 저장');await order(page,'sell','5');await expect(page.getByRole('status')).toContainText('체결되고 저장');
 await page.goto('/#portfolio');await expect(page.getByTestId('cash')).toHaveText(cash(10000000-price*10));await expect(page.locator('.holding')).toContainText('10주');await expect(page.locator('.history-row')).toHaveCount(3);
 await page.screenshot({path:`test-results/${test.info().project.name}-portfolio.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const restored=await context.browser()!.newContext({storageState:await context.storageState()});const restarted=await restored.newPage();await restarted.goto('http://127.0.0.1:4173/#portfolio');await expect(restarted.getByTestId('cash')).toHaveText(cash(10000000-price*10));await restored.close();
 await page.goto('/#stock/AAPL');await order(page,'sell','10');await expect(page.getByRole('status')).toContainText('체결되고 저장');await page.goto('/#portfolio');await expect(page.getByTestId('total-assets')).toHaveText('$100,000.00');await expect(page.locator('.holding')).toHaveCount(0);
 await page.getByRole('button',{name:'계좌 전체 초기화',exact:true}).click();await expect(page.getByRole('button',{name:'초기화 확정',exact:true})).toBeDisabled();await page.getByRole('button',{name:'초기화 취소',exact:true}).click();await expect(page.locator('.history-row')).toHaveCount(4);
 await page.getByRole('button',{name:'계좌 전체 초기화',exact:true}).click();await page.getByLabel('초기화 확인 문구').fill('초기화');await page.getByRole('button',{name:'초기화 확정',exact:true}).click();await expect(page.getByRole('status')).toContainText('초기화되었습니다');await page.reload();await expect(page.getByTestId('cash')).toHaveText('$100,000.00');await expect(page.locator('.history-row')).toHaveCount(0);
});
test('input rejection, storage failure and duplicate click never commit twice',async({page})=>{
 await page.goto('/#stock/AAPL');await page.getByLabel('주문 수량',{exact:true}).fill('0');await page.getByRole('button',{name:'주문 검토',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();
 await order(page,'buy','100000');await expect(page.getByRole('alert')).toContainText('부족');await page.getByRole('button',{name:'주문 취소'}).click();
 await order(page,'sell','1');await expect(page.getByRole('alert')).toContainText('초과');await page.getByRole('button',{name:'주문 취소'}).click();
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota');};});await order(page,'buy','2');await expect(page.getByRole('alert')).toContainText('반영하지 않았습니다');await expect(page.getByText('가상 주문이 체결되고 저장되었습니다.')).toHaveCount(0);
 expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBeNull();await page.reload();
 await page.getByLabel('주문 수량',{exact:true}).fill('2');await page.getByRole('button',{name:'주문 검토',exact:true}).click();await page.getByRole('button',{name:'체결 확정',exact:true}).evaluate((el:HTMLButtonElement)=>{el.click();el.click();});await expect(page.getByRole('status')).toContainText('체결되고 저장');
 expect(JSON.parse((await page.evaluate(k=>localStorage.getItem(k),accountKey))!).trades).toHaveLength(1);
 await page.goto('/#portfolio');await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota');};});await page.getByRole('button',{name:'계좌 전체 초기화',exact:true}).click();await page.getByLabel('초기화 확인 문구').fill('초기화');await page.getByRole('button',{name:'초기화 확정',exact:true}).click();await expect(page.getByRole('alert')).toContainText('반영하지 않았습니다');await page.reload();await expect(page.locator('.holding')).toContainText('2주');
});
test('corrupt data preserved, blocked orders and explicit recovery',async({page})=>{
 await page.goto('/');await page.evaluate(k=>localStorage.setItem(k,'broken account'),accountKey);await page.reload();await expect(page.getByRole('alert')).toContainText('손상');
 await page.goto('/#stock/AAPL');await expect(page.getByRole('button',{name:'주문 검토',exact:true})).toBeDisabled();expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe('broken account');
 await page.goto('/#portfolio');await page.getByRole('button',{name:'계좌 전체 초기화',exact:true}).click();await page.getByLabel('초기화 확인 문구').fill('초기화');await page.getByRole('button',{name:'초기화 확정',exact:true}).click();await expect(page.getByTestId('cash')).toHaveText('$100,000.00');
});
test('two tabs reject stale confirmed orders',async({page,context})=>{
 await page.goto('/#stock/AAPL');await page.getByRole('button',{name:'주문 검토',exact:true}).click();
 const other=await context.newPage();await other.goto('/#stock/AAPL');await order(other,'buy','1');await expect(other.getByRole('status')).toContainText('체결되고 저장');
 await page.getByRole('button',{name:'체결 확정',exact:true}).click();await expect(page.getByRole('alert')).toContainText('변경');expect(JSON.parse((await page.evaluate(k=>localStorage.getItem(k),accountKey))!).trades).toHaveLength(1);
});

test('real Chromium profile restart preserves the account',async()=>{
 const profile=mkdtempSync(join(tmpdir(),'stock-lab-profile-'));
 const options={executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],headless:true};
 let browser=await chromium.launchPersistentContext(profile,options);
 try{
 let tab=await browser.newPage();await tab.goto('http://127.0.0.1:4173/#stock/AAPL');await order(tab,'buy','3');await expect(tab.getByRole('status')).toContainText('체결되고 저장');
 await browser.close();browser=await chromium.launchPersistentContext(profile,options);tab=await browser.newPage();await tab.goto('http://127.0.0.1:4173/#portfolio');
 await expect(tab.getByTestId('cash')).toHaveText(cash(10000000-price*3));await expect(tab.locator('.holding')).toContainText('3주');await expect(tab.locator('.history-row')).toHaveCount(1);
 }finally{await browser.close();rmSync(profile,{recursive:true,force:true});}
});
test('pending storage lock shows loading and prevents repeat confirmation',async({page})=>{
 await page.goto('/#stock/AAPL');
 await page.evaluate(async key=>{
 const w=window as typeof window & {releaseTestLock?:()=>void};
 await new Promise<void>(ready=>{void navigator.locks.request(key,()=>new Promise<void>(release=>{w.releaseTestLock=release;ready();}));});
 },accountKey);
 await page.getByRole('button',{name:'주문 검토',exact:true}).click();await page.getByRole('button',{name:'체결 확정',exact:true}).click();await expect(page.getByRole('button',{name:'저장 중…',exact:true})).toBeDisabled();
 await page.evaluate(()=>{(window as typeof window & {releaseTestLock?:()=>void}).releaseTestLock?.();});await expect(page.getByRole('status')).toContainText('체결되고 저장');
});
