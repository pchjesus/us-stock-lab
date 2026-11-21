import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {accountKey} from '../src/accountStore';
import {watchKey} from '../src/storage';
import {instruments,quote} from '../src/data';

const url='/?ui=v1&marketHybrid=1#market';
const fixture=JSON.stringify({version:1,generation:'hybrid-layout-test',trades:[
 {id:'mh-aapl',symbol:'AAPL',side:'buy',quantity:2,price:12200,time:'2026-11-02T14:35:00Z'}
]});

test('hybrid is opt-in and the selected Home A, existing market A/B/C and production remain unchanged',async({page})=>{
 await page.goto('/#market');await expect(page.locator('.market-hybrid-page')).toHaveCount(0);
 await page.goto('/?marketHybrid=1#market');await expect(page.locator('.market-hybrid-page')).toHaveCount(0);
 await page.goto('/?ui=v1#market');await expect(page.locator('.market-hybrid-page')).toHaveCount(0);
 await page.goto('/?ui=v1&marketLab=1&marketVariant=b#market');
 await expect(page.locator('.market-lab-b .market-lab-card')).toHaveCount(8);
 await expect(page.locator('.market-hybrid-page')).toHaveCount(0);
 await page.goto(url);await expect(page.locator('.market-hybrid-page')).toBeVisible();
 await expect(page.locator('.market-lab-hybrid-explorer.market-lab-b')).toBeVisible();
 const modes=page.getByRole('group',{name:'종목 보기 방식'});
 await expect(modes.getByRole('button',{name:'카드'})).toHaveAttribute('aria-pressed','true');
 await expect(modes.getByRole('button',{name:'목록'})).toHaveAttribute('aria-pressed','false');
 await page.goto('/?ui=v1&marketHybrid=1#home');
 await expect(page.locator('.home-account')).toBeVisible();
 await expect(page.locator('.market-hybrid-page')).toHaveCount(0);
});

test('default B cards and compact list share exact search, sector filter and sort state',async({page})=>{
 await page.goto(url);
 const root=page.locator('.market-hybrid-page');
 const modes=page.getByRole('group',{name:'종목 보기 방식'});
 await expect(root.locator('.market-lab-card')).toHaveCount(8);
 await root.getByLabel('종목 검색').fill('a');
 await root.getByRole('group',{name:'섹터 선택'}).getByRole('button',{name:'정보기술'}).click();
 await expect(root.locator('.market-lab-card')).toHaveCount(2);
 await root.getByLabel('결과 정렬').selectOption('price-desc');
 await modes.getByRole('button',{name:'목록'}).click();
 await expect(modes.getByRole('button',{name:'목록'})).toHaveAttribute('aria-pressed','true');
 await expect(root.locator('.market-lab-terminal-body')).toBeVisible();
 await expect(root.getByLabel('종목 검색')).toHaveValue('a');
 await expect(root.getByLabel('결과 정렬')).toHaveValue('price-desc');
 await expect(root.getByRole('group',{name:'섹터 선택'}).getByRole('button',{name:'정보기술'})).toHaveAttribute('aria-pressed','true');
 await expect(root.locator('.market-lab-table tbody tr')).toHaveCount(2);
 await modes.getByRole('button',{name:'카드'}).click();
 await expect(root.locator('.market-lab-card')).toHaveCount(2);
 await expect(root.getByLabel('결과 정렬')).toHaveValue('price-desc');
 await expect(root.getByLabel('종목 검색')).toHaveValue('oo');
 const wanted=[...instruments].filter(s=>['AAPL','NVDA'].includes(s.symbol)).sort((a,b)=>quote(b).price-quote(a).price).map(s=>s.symbol);
 await expect(root.locator('.market-lab-card').first()).toHaveAttribute('data-symbol',wanted[0]);
});

test('list view persists by display-only localStorage key without affecting account/market data',async({page})=>{
 const errors:string[]=[],rpc:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('/rest/v1/rpc/'))rpc.push(r.url());});
 await page.addInitScript(value=>localStorage.setItem('us-stock-lab.account.v1',value),fixture);
 await page.goto(url);
 const before=await page.evaluate(key=>localStorage.getItem(key),accountKey);
 const modes=page.getByRole('group',{name:'종목 보기 방식'});
 await modes.getByRole('button',{name:'목록'}).click();
 await expect(page.locator('.market-lab-hybrid-explorer.market-lab-c')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('us-stock-lab.market-view-mode'))).toBe('list');
 await page.reload();
 await expect(page.locator('.market-lab-hybrid-explorer.market-lab-c')).toBeVisible();
 await expect(modes.getByRole('button',{name:'목록'})).toHaveAttribute('aria-pressed','true');
 await modes.getByRole('button',{name:'카드'}).click();
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('us-stock-lab.market-view-mode'))).toBe('cards');
 await expect(page.locator('.market-lab-hybrid-explorer.market-lab-b')).toBeVisible();
 expect(await page.evaluate(key=>localStorage.getItem(key),accountKey)).toBe(before);
 expect(rpc).toEqual([]);
 expect(errors).toEqual([]);
});

test('real watchlist, instrument detail, simulated labels and catalog read-only isolation are preserved',async({page})=>{
 await page.goto(url);
 const modes=page.getByRole('group',{name:'종목 보기 방식'});
 const first=page.locator('.market-lab-card[data-symbol="AAPL"]');
 await first.getByRole('button',{name:'AAPL 관심종목'}).click();
 await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'[]'),watchKey)).toContain('AAPL');
 await modes.getByRole('button',{name:'목록'}).click();
 await expect(page.locator('.market-lab-table tbody tr').filter({has:page.getByRole('link',{name:/AAPL/})}).getByRole('button',{name:'AAPL 관심종목'})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.market-lab-table')).toContainText('합성 가격');
 await expect(page.locator('.market-lab-table-disclaimer')).toContainText('실제 시세');
 await expect(page.getByRole('link',{name:/종목 상세 살펴보기/})).toHaveAttribute('href','#stock/AAPL');
 await page.getByRole('group',{name:'종목 탐색 모드'}).getByRole('button',{name:'미국 종목 후보 탐색'}).click();
 await expect(page.getByRole('region',{name:'미국 종목 후보 탐색'})).toContainText('읽습니다');
 await expect(page.locator('.market-lab-hybrid-explorer')).toHaveCount(0);
 await page.getByRole('group',{name:'종목 탐색 모드'}).getByRole('button',{name:'모의투자 지원 종목'}).click();
 await expect(page.locator('.market-lab-hybrid-explorer.market-lab-c')).toBeVisible();
});

test('320–1440px card and list stay within viewport; mobile switches to compact rows',async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto(url);
  const root=page.locator('.market-hybrid-page');
  const modes=page.getByRole('group',{name:'종목 보기 방식'});
  await modes.getByRole('button',{name:'카드'}).click();
  await expect(root.locator('.market-lab-card')).toHaveCount(8);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'card overflow at '+width).toBeLessThanOrEqual(0);
  await modes.getByRole('button',{name:'목록'}).click();
  await expect(root.locator('.market-lab-terminal-body')).toBeVisible();
  if(width<=710)await expect(root.locator('.market-lab-mobile-row')).toHaveCount(8);
  else await expect(root.locator('.market-lab-table')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'list overflow at '+width).toBeLessThanOrEqual(0);
 }
 expect(errors).toEqual([]);
});

test('animations are disabled in reduced-motion preference and controls remain keyboard reachable',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(url);
 const modes=page.getByRole('group',{name:'종목 보기 방식'});
 const button=modes.getByRole('button',{name:'목록'});
 await button.focus();await expect(button).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(button).toHaveAttribute('aria-pressed','true');
 const stage=page.locator('.market-lab-terminal-body');
 await expect(stage).toBeVisible();
 expect(await stage.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await modes.getByRole('button',{name:'카드'}).click();
 const card=page.locator('.market-lab-card').first();
 await expect(card).toBeVisible();
 expect(await card.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('capture selected market hybrid in both cards and compact list for visual comparison',async({page},info)=>{
 mkdirSync('work/market-hybrid/captures',{recursive:true});
 const width=info.project.name==='mobile'?390:1440;
 await page.setViewportSize({width,height:960});
 await page.goto(url);
 const modes=page.getByRole('group',{name:'종목 보기 방식'});
 for(const mode of ['카드','목록'] as const){
  await modes.getByRole('button',{name:mode}).click();
  await expect(page.locator('.market-lab-hybrid-explorer')).toBeVisible();
  await page.screenshot({path:'work/market-hybrid/captures/'+info.project.name+'-'+width+'-'+mode+'.png',fullPage:true,animations:'disabled'});
 }
});
