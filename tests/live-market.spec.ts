import {test,expect} from '@playwright/test';
import {stockSymbols,indexSymbols} from '../src/LiveMarket';
test('hosted display symbols are exact real underlyings, not CFD lookalikes',()=>{
 expect(Object.keys(stockSymbols).sort()).toEqual(['AAPL','AMZN','GOOGL','MSFT','NVDA','QQQ','SCHD','VOO']);
 expect(indexSymbols.map(s=>s.symbol)).toEqual(['SP:SPX','NASDAQ:IXIC','DJ:DJI','KRX:KOSPI','KRX:KOSDAQ']);
 expect(indexSymbols.some(s=>s.symbol.startsWith('TVC:')||s.symbol.startsWith('FOREXCOM:'))).toBe(false);
});
test('real market widgets are user-loaded, attributed and independent of paper prices',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://s3.tradingview.com/external-embedding/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* hosted widget loading fixture */'}));
 await page.goto('/#market');
 await expect(page.getByTestId('live-stock-board')).toBeVisible();
 await expect(page.getByTestId('live-stock-board')).toContainText('별도의 합성가격');
 await expect(page.getByTestId('tv-ticker-tape')).toHaveCount(0);
 await page.getByRole('button',{name:'8개 종목 실제 시장 시세 보기'}).click();
 await expect(page.getByTestId('tv-ticker-tape')).toHaveCount(1);
 await page.getByRole('button',{name:'외부 시세 접기'}).click();
 await expect(page.getByTestId('tv-ticker-tape')).toHaveCount(0);
 await page.goto('/#indices');
 await page.getByRole('button',{name:'미국·한국 지수 실제 시장 시세 보기'}).click();
 await expect(page.getByTestId('tv-market-overview')).toHaveCount(1);
 await expect(page.getByRole('link',{name:'KOSPI 원문'})).toHaveAttribute('href','https://www.tradingview.com/symbols/KRX-KOSPI/');
 await page.goto('/#stock/VOO');
 await expect(page.locator('.detail-order')).toContainText('합성 가격');
 await expect(page.getByTestId('tv-advanced-chart')).toHaveCount(0);
 await page.getByRole('button',{name:'실제 시장 차트 보기'}).click();
 await expect(page.getByTestId('tv-advanced-chart')).toHaveCount(1);
 await expect(page.locator('.detail-order')).toContainText('합성 가격');
 expect(errors).toEqual([]);
});

test('licensed actual event and news widgets never replace synthetic demo fixtures',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://s3.tradingview.com/external-embedding/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* embed fixture */'}));
 await page.goto('/#calendar');
 await expect(page.getByTestId('live-economic-calendar')).toContainText('교육용 합성 일정');
 await expect(page.locator('.event-list article')).toHaveCount(8);
 await page.getByRole('button',{name:'실제 FOMC·CPI·PCE 등 경제 일정 보기'}).click();
 await expect(page.getByTestId('tv-events')).toHaveCount(1);
 await page.goto('/#news');
 await expect(page.getByRole('heading',{name:'수신된 뉴스가 없습니다'})).toBeVisible();
 await page.getByRole('button',{name:'실제 금융 뉴스 보기'}).click();
 await expect(page.getByTestId('tv-timeline')).toHaveCount(1);
 expect(errors).toEqual([]);
});
