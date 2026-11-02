import {test,expect} from '@playwright/test';

test('detail keeps the chart and order side by side on desktop and stacked on smaller screens',async({page})=>{
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:950});
  await page.goto('/#stock/AAPL');
  const chart=await page.getByLabel('외부 차트 패널').boundingBox();
  const order=await page.locator('#detail-order').boundingBox();
  expect(chart).not.toBeNull();expect(order).not.toBeNull();
  if(width===1440)expect(order!.x).toBeGreaterThan(chart!.x+chart!.width-2);
  else expect(order!.y).toBeGreaterThan(chart!.y+chart!.height-2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('external chart starts empty, creates one widget and cleans up on close and symbol change',async({page})=>{
 await page.route('https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',route=>route.fulfill({contentType:'application/javascript',body:"(()=>{const f=document.createElement('iframe');f.title='mock TradingView';document.currentScript.parentElement.appendChild(f);})()"}));
 await page.goto('/#stock/AAPL');
 const panel=page.getByLabel('외부 차트 패널');
 await expect(panel.locator('iframe')).toHaveCount(0);
 await page.getByRole('button',{name:'TradingView 공식 표시용 차트 열기'}).click();
 await expect(panel.locator('iframe')).toHaveCount(1);
 await page.getByRole('button',{name:'외부 차트 닫기'}).click();
 await expect(panel.locator('iframe')).toHaveCount(0);
 await page.getByRole('button',{name:'TradingView 공식 표시용 차트 열기'}).click();
 await expect(panel.locator('iframe')).toHaveCount(1);
 await page.goto('/#stock/MSFT');
 await expect(page.getByLabel('외부 차트 패널').locator('iframe')).toHaveCount(0);
});

test('provider selection uses explicit links and popup blocking gives a fallback',async({page})=>{
 await page.goto('/#stock/AAPL');
 const panel=page.getByLabel('외부 차트 패널');
 await page.getByLabel('외부 차트 제공자').selectOption('네이버');
 await expect(panel.getByRole('link',{name:/네이버 AAPL/})).toHaveAttribute('href','https://m.stock.naver.com/worldstock/stock/AAPL.O/total');
 await page.evaluate(()=>{window.open=()=>null;});
 await panel.getByRole('button',{name:'별도 창에서 열기'}).click();
 await expect(panel.getByRole('status')).toContainText('팝업이 차단');
 await expect(panel.getByRole('link',{name:/네이버 AAPL/})).toHaveAttribute('target','_blank');
});

test('opens the selected symbol in a separate browser page and handles widget errors',async({page})=>{
 await page.route('https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',route=>route.abort());
 await page.route('https://www.tradingview.com/symbols/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<title>fixture</title>'}));
 await page.goto('/#stock/MSFT');
 const panel=page.getByLabel('외부 차트 패널');
 await panel.getByRole('button',{name:'TradingView 공식 표시용 차트 열기'}).click();
 await expect(panel.getByRole('status')).toContainText('불러오지 못했습니다');
 const popupPromise=page.waitForEvent('popup');
 await panel.getByRole('button',{name:'별도 창에서 열기'}).click();
 const popup=await popupPromise;
 await popup.waitForURL('https://www.tradingview.com/symbols/NASDAQ-MSFT/');
 await expect(popup).toHaveURL('https://www.tradingview.com/symbols/NASDAQ-MSFT/');
 await popup.close();
});
