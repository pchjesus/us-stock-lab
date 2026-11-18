import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {accountKey} from '../src/accountStore';
import {quote,instruments} from '../src/data';

const base='/?ui=v1&marketLab=1';
const demo=JSON.stringify({version:1,generation:'market-lab-visual-only',trades:[
 {id:'ml-aapl',symbol:'AAPL',side:'buy',quantity:2,price:12200,time:'2026-11-02T14:35:00Z'}
]});

test('market v2 is opt-in; production and v1 market retain original discovery',async({page})=>{
 await page.goto('/#market');
 await expect(page.locator('.market-lab')).toHaveCount(0);
 await expect(page.locator('.supported-discovery')).toBeVisible();
 await page.goto('/?marketLab=1#market');
 await expect(page.locator('.market-lab')).toHaveCount(0);
 await page.goto('/?ui=v1#market');
 await expect(page.locator('.market-lab')).toHaveCount(0);
 await expect(page.locator('.v1-discovery-panel')).toBeVisible();
 await page.goto(base+'#market');
 await expect(page.locator('.market-lab-a')).toBeVisible();
 await expect(page.getByRole('group',{name:'시장 디자인 선택'}).getByRole('button')).toHaveCount(3);
 await expect(page.locator('.v1-discovery-panel')).toBeVisible();
 await page.goto('/?ui=v1&marketLab=1#home');
 await expect(page.locator('.market-lab')).toHaveCount(0);
 await expect(page.locator('.home-account')).toBeVisible();
});

test('B card studio filters real supported synthetic instruments, preserves records and shows sources',async({page})=>{
 const errors:string[]=[],rpc:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('/rest/v1/rpc/'))rpc.push(r.url());});
 await page.addInitScript(value=>localStorage.setItem('us-stock-lab.account.v1',value),demo);
 await page.goto(base+'&marketVariant=b#market');
 const root=page.locator('.market-lab-b');
 await expect(root).toBeVisible();
 const before=await page.evaluate(key=>localStorage.getItem(key),accountKey);
 const cards=root.locator('.market-lab-card');
 await expect(cards).toHaveCount(8);
 await expect(root.getByRole('region',{name:'모의투자 지원 종목'})).toContainText('실제');
 await expect(root.locator('.market-lab-preview')).toContainText('실제 현재가 아님');
 await expect(root.locator('.market-lab-card').first()).toContainText('교육용 합성 가격');
 await root.getByLabel('종목 검색').fill('NVDA');
 await expect(cards).toHaveCount(1);
 await expect(cards.first()).toHaveAttribute('data-symbol','NVDA');
 await root.getByRole('button',{name:'빠른 정보'}).click();
 await expect(root.getByRole('region',{name:'선택 종목 요약'})).toContainText('엔비디아');
 await expect(root.getByRole('link',{name:/종목 상세 살펴보기/})).toHaveAttribute('href','#stock/NVDA');
 const nvda=quote(instruments.find(x=>x.symbol==='NVDA')!);
 await expect(root.locator('.market-lab-preview')).toContainText(nvda.change.toFixed(2)+'%');
 await root.getByLabel('종목 검색').fill('');
 await root.getByRole('group',{name:'섹터 선택'}).getByRole('button',{name:'ETF'}).click();
 await expect(cards).toHaveCount(3);
 await root.getByLabel('결과 정렬').selectOption('price-desc');
 const expectedTop=[...instruments].filter(s=>s.kind==='ETF').sort((a,b)=>quote(b).price-quote(a).price)[0].symbol;
 await expect(cards.first()).toHaveAttribute('data-symbol',expectedTop);
 await root.getByRole('button',{name:'초기화'}).click();
 await expect(cards).toHaveCount(8);
 expect(await page.evaluate(key=>localStorage.getItem(key),accountKey)).toBe(before);
 expect(rpc).toEqual([]);expect(errors).toEqual([]);
});

test('C comparison table sorts numbers and preserves click-through and watch toggle',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'&marketVariant=c#market');
 const root=page.locator('.market-lab-c');
 const table=root.locator('.market-lab-table');
 await expect(table.locator('tbody tr')).toHaveCount(8);
 await expect(table.locator('caption')).toContainText('실제 시세가 아님');
 await table.getByRole('button',{name:/합성 가격/}).click();
 await expect(table.locator('th').nth(2)).toHaveAttribute('aria-sort','descending');
 const expected=[...instruments].sort((a,b)=>quote(b).price-quote(a).price)[0].symbol;
 await expect(table.locator('tbody tr').first()).toContainText(expected);
 await table.getByRole('button',{name:/합성 변동률/}).click();
 await expect(table.locator('th').nth(3)).toHaveAttribute('aria-sort','descending');
 await table.locator('tbody tr').first().getByRole('button',{name:/보기/}).click();
 const symbol=await table.locator('tbody tr').first().locator('.market-lab-table-name strong').innerText();
 await expect(root.getByRole('region',{name:'선택 종목 요약'})).toContainText(symbol);
 await expect(root.getByRole('link',{name:/종목 상세 살펴보기/})).toHaveAttribute('href','#stock/'+symbol);
 const pressed=await root.locator('.market-lab-preview .market-lab-save').getAttribute('aria-pressed');
 await root.locator('.market-lab-preview .market-lab-save').click();
 await expect(root.locator('.market-lab-preview .market-lab-save')).toHaveAttribute('aria-pressed',pressed==='true'?'false':'true');
 expect(errors).toEqual([]);
});

test('variant switch, currency setting, catalog mode and route state remain intact',async({page})=>{
 await page.goto(base+'&marketVariant=b#market');
 const switcher=page.getByRole('group',{name:'시장 디자인 선택'});
 await switcher.getByRole('button',{name:/C 비교 데스크/}).click();
 await expect(page.locator('.market-lab-c')).toBeVisible();
 await expect(page).toHaveURL(/marketVariant=c#market$/);
 await page.reload();
 await expect(page.locator('.market-lab-c')).toBeVisible();
 await page.getByRole('group',{name:'종목 탐색 모드'}).getByRole('button',{name:'미국 종목 후보 탐색'}).click();
 await expect(page.getByRole('region',{name:'미국 종목 후보 탐색'})).toContainText('개인 로컬 카탈로그');
 await expect(page.locator('.market-lab-explorer')).toHaveCount(0);
 await page.getByRole('group',{name:'종목 탐색 모드'}).getByRole('button',{name:'모의투자 지원 종목'}).click();
 await expect(page.locator('.market-lab-c .market-lab-terminal-body')).toBeVisible();
 await switcher.getByRole('button',{name:/A 기존 탐색/}).click();
 await expect(page.locator('.market-lab-a .v1-discovery-panel')).toBeVisible();
 await expect(page.getByLabel('종목 검색')).toBeVisible();
 await page.goto('/?ui=v1#market');
 await expect(page.locator('.market-lab')).toHaveCount(0);
});

test('responsive market styles remain readable without document overflow on 320–1440px and collapse rail',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const variant of ['a','b','c'] as const){
   await page.goto(base+'&marketVariant='+variant+'#market');
   const root=page.locator('.market-lab-'+variant);
   await expect(root).toBeVisible();
   await expect(page.getByRole('group',{name:'시장 디자인 선택'}).getByRole('button')).toHaveCount(3);
   if(variant==='b'||variant==='c'){
    await expect(root.getByLabel('종목 검색')).toBeVisible();
    await expect(root.getByRole('group',{name:'섹터 선택'}).getByRole('button')).toHaveCount(5);
   }
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   expect(overflow,variant+' overflow at '+width).toBeLessThanOrEqual(0);
  }
  if(width>900){
   await page.getByRole('button',{name:'메뉴 접기'}).click();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'collapsed overflow at '+width).toBeLessThanOrEqual(0);
  }
 }
 expect(errors).toEqual([]);
});

test('reduced motion disables entry sequences without removing result cards or focus',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(base+'&marketVariant=b#market');
 const card=page.locator('.market-lab-card').first();
 await expect(card).toBeVisible();
 expect(await card.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 const button=card.getByRole('button',{name:/빠른 정보/});
 await button.focus();await expect(button).toBeFocused();
 await page.getByRole('group',{name:'시장 디자인 선택'}).getByRole('button',{name:/C 비교 데스크/}).click();
 await expect(page.locator('.market-lab-table')).toBeVisible();
 const stage=page.locator('.market-lab-stage');
 expect(await stage.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('create distinct review captures for A/B/C market layouts',async({page},info)=>{
 mkdirSync('work/market-v2/captures',{recursive:true});
 const width=info.project.name==='mobile'?390:1440;
 await page.setViewportSize({width,height:960});
 for(const variant of ['a','b','c'] as const){
  await page.goto(base+'&marketVariant='+variant+'#market');
  await expect(page.locator('.market-lab-'+variant)).toBeVisible();
  if(variant==='b')await expect(page.locator('.market-lab-card')).toHaveCount(8);
  if(variant==='c')await expect(page.locator('.market-lab-mobile-row').first()).toBeAttached();
  await page.screenshot({path:'work/market-v2/captures/'+info.project.name+'-'+width+'-'+variant+'.png',fullPage:true,animations:'disabled'});
 }
});
