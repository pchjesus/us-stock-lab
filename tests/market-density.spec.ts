import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {instruments,quote} from '../src/data';
import {catalogPage} from '../src/catalogImport';
import type {CatalogEntry} from '../src/catalog';
import {accountKey} from '../src/accountStore';

const route='/?ui=v1&marketDensity=1#market';
const accountFixture=JSON.stringify({version:1,generation:'density-readonly',trades:[]});

test('density revision is isolated from production, v1 and earlier market hybrid',async({page})=>{
 await page.goto('/#market');
 await expect(page.locator('.market-v3')).toHaveCount(0);
 await page.goto('/?ui=v1#market');
 await expect(page.locator('.market-v3')).toHaveCount(0);
 await page.goto('/?ui=v1&marketHybrid=1#market');
 await expect(page.locator('.market-hybrid-page')).toBeVisible();
 await expect(page.locator('.market-v3')).toHaveCount(0);
 await page.goto(route);
 await expect(page.locator('.market-v3')).toBeVisible();
 await expect(page.locator('.market-v3-card')).toHaveCount(8);
 await expect(page.locator('.market-v3-dialog')).not.toBeVisible();
 await expect(page.locator('.market-v3-results .market-lab-preview')).toHaveCount(0);
 await page.goto('/?ui=v1&marketDensity=1#home');
 await expect(page.locator('.market-v3')).toHaveCount(0);
 await expect(page.locator('.home-account')).toBeVisible();
});

test('3–4 column card grid uses liberated space and quick look is on-demand',async({page})=>{
 await page.goto(route);
 await page.setViewportSize({width:1920,height:1000});
 const cards=page.locator('.market-v3-card');
 await expect(cards).toHaveCount(instruments.length);
 const cols=await page.locator('.market-v3-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
 expect(cols).toBeGreaterThanOrEqual(3);
 const button=cards.first().getByRole('button',{name:/빠른 정보/});
 await button.click();
 const dialog=page.getByRole('dialog',{name:/애플/});
 await expect(dialog).toBeVisible();
 await expect(dialog).toContainText('시가총액 데이터 미연동');
 await expect(dialog.getByRole('link',{name:/종목 상세 보기/})).toHaveAttribute('href','#stock/AAPL');
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
 await expect(cards).toHaveCount(8);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 expect(overflow).toBeLessThanOrEqual(0);
});

test('page size can be selected and persisted without mutating the account',async({page})=>{
 await page.addInitScript(value=>localStorage.setItem('us-stock-lab.account.v1',value),accountFixture);
 await page.goto(route);
 const before=await page.evaluate(key=>localStorage.getItem(key),accountKey);
 const size=page.getByLabel('페이지당 표시 개수');
 await expect(size.locator('option')).toHaveCount(4);
 await expect(size).toHaveValue('24');
 for(const count of ['12','48','96']){
  await size.selectOption(count);
  await expect(size).toHaveValue(count);
  await expect(page.locator('.market-v3-card')).toHaveCount(8);
 }
 expect(await page.evaluate(key=>localStorage.getItem(key),accountKey)).toBe(before);
 await page.reload();
 await expect(page.getByLabel('페이지당 표시 개수')).toHaveValue('96');
});

test('single search, favorite-first sort and shared card/list controls remain functional',async({page})=>{
 await page.goto(route);
 await page.locator('.market-v3-card[data-symbol="NVDA"]').getByRole('button',{name:'NVDA 관심종목'}).click();
 await expect(page.locator('.market-v3-card[data-symbol="NVDA"]').getByRole('button',{name:'NVDA 관심종목'})).toHaveAttribute('aria-pressed','true');
 await page.getByLabel('결과 정렬').selectOption('favorite-first');
 await expect(page.locator('.market-v3-card').first()).toHaveAttribute('data-symbol','NVDA');
 const switcher=page.getByRole('group',{name:'종목 보기 방식'});
 await switcher.getByRole('button',{name:'목록'}).click();
 await expect(page.locator('.market-v3-list')).toBeVisible();
 await expect(page.locator('.market-v3-table tbody tr').first()).toHaveAttribute('data-symbol','NVDA');
 await expect(page.getByLabel('결과 정렬')).toHaveValue('favorite-first');
 await page.getByLabel('종목 검색').fill('MSFT');
 await expect(page.locator('.market-v3-table tbody tr')).toHaveCount(1);
 await switcher.getByRole('button',{name:'카드'}).click();
 await expect(page.locator('.market-v3-card')).toHaveCount(1);
 await expect(page.locator('.market-v3-card')).toHaveAttribute('data-symbol','MSFT');
 await expect(page.getByLabel('결과 정렬')).toHaveValue('favorite-first');
});

test('market capitalization is honestly unavailable; other numeric sort orders are accurate',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(route);
 await page.getByRole('group',{name:'종목 보기 방식'}).getByRole('button',{name:'목록'}).click();
 await expect(page.getByLabel('결과 정렬').locator('option[value="cap-desc"]')).toBeDisabled();
 await expect(page.getByLabel('결과 정렬').locator('option[value="cap-asc"]')).toBeDisabled();
 await expect(page.locator('.market-v3-table tbody tr')).toHaveCount(8);
 await expect(page.locator('.market-v3-table')).toContainText('시가총액');
 await expect(page.locator('.market-v3-table .market-v3-unavailable')).toHaveCount(8);
 await page.getByLabel('결과 정렬').selectOption('price-desc');
 const leader=[...instruments].sort((a,b)=>quote(b).price-quote(a).price)[0].symbol;
 await expect(page.locator('.market-v3-table tbody tr').first()).toHaveAttribute('data-symbol',leader);
});

test('responsive card/list and modal have no horizontal overflow from 320 to 1920',async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of [320,390,768,1024,1440,1920]){
  await page.setViewportSize({width,height:920});
  await page.goto(route);
  await expect(page.locator('.market-v3-card')).toHaveCount(8);
  const cols=await page.locator('.market-v3-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  if(width<=390)expect(cols).toBe(1);
  if(width===1920)expect(cols).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'card root overflow at '+width).toBeLessThanOrEqual(0);
  await page.getByRole('group',{name:'종목 보기 방식'}).getByRole('button',{name:'목록'}).click();
  await expect(page.locator('.market-v3-list')).toBeVisible();
  if(width<=710)await expect(page.locator('.market-v3-mobile-row')).toHaveCount(8);
  else await expect(page.locator('.market-v3-table')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'list root overflow at '+width).toBeLessThanOrEqual(0);
 }
 expect(errors).toEqual([]);
});

test('native quick view Escape and search shortcut support keyboard navigation',async({page})=>{
 await page.goto(route);
 await page.keyboard.press('/');
 await expect(page.getByLabel('종목 검색')).toBeFocused();
 await page.keyboard.type('NVDA');
 await expect(page.locator('.market-v3-card')).toHaveCount(1);
 await page.locator('.market-v3-card').first().getByRole('button',{name:/빠른 정보/}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
 await page.getByRole('button',{name:'필터 초기화'}).click();
 await expect(page.locator('.market-v3-card')).toHaveCount(8);
});

test('reduced-motion disables card and view-switch animations without hiding content',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(route);
 const card=page.locator('.market-v3-card').first();
 await expect(card).toBeVisible();
 expect(await card.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.getByRole('group',{name:'종목 보기 방식'}).getByRole('button',{name:'목록'}).click();
 const stage=page.locator('.market-v3-results');
 expect(await stage.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('local candidate pagination accepts bounded sizes without granting trade permissions',()=>{
 const entries=Array.from({length:1050},(_,i)=>({
  id:'test-'+i,symbol:'D'+String(i).padStart(5,'0'),name:'Demo '+i,exchange:'TEST',cik:String(i+1).padStart(10,'0')
 })) as unknown as CatalogEntry[];
 const results=catalogPage(entries,'D',3,200);
 expect(results.total).toBe(1050);expect(results.entries).toHaveLength(200);
 expect(results.entries[0].symbol).toBe('D00600');
 expect(catalogPage(entries,'D',0,999).entries).toHaveLength(50);
 expect(catalogPage(entries,'D',-3,25).entries[0].symbol).toBe('D00000');
 expect(catalogPage(entries,'',0,200).entries).toHaveLength(0);
});

test('capture desktop/mobile card and list designs',async({page},info)=>{
 mkdirSync('work/market-density/captures',{recursive:true});
 const width=info.project.name==='mobile'?390:1440;
 await page.setViewportSize({width,height:960});await page.goto(route);
 for(const mode of ['카드','목록'] as const){
  await page.getByRole('group',{name:'종목 보기 방식'}).getByRole('button',{name:mode}).click();
  await page.screenshot({path:'work/market-density/captures/'+info.project.name+'-'+width+'-'+mode+'.png',fullPage:true,animations:'disabled'});
 }
});
