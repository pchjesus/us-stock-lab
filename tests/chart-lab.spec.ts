import {chartRows} from '../src/uiData';
import {instruments} from '../src/data';
import {movingAverage,wilderRsi} from '../src/chartIndicators';
import {syntheticVolume} from '../src/ChartLab';
import {test,expect} from '@playwright/test';
test('interactive chart lab preserves lessons and works at each stage',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/#learn');const lab=page.getByRole('region',{name:'차트 실습실'});await expect(lab.getByRole('img',{name:'학습용 가상 캔들 차트'})).toBeVisible();await expect(lab.locator('canvas').first()).toBeVisible();
 for(const stage of ['초급','중급','고급']){await lab.getByRole('button',{name:stage,exact:true}).click();await expect(lab.getByRole('button',{name:stage,exact:true})).toHaveAttribute('aria-pressed','true');}
 await lab.getByRole('button',{name:'선 차트'}).click();await expect(lab.getByRole('img',{name:'학습용 가상 선 차트'})).toBeVisible();await lab.getByRole('button',{name:'캔들 차트'}).click();
 for(const n of [5,20,60]){const b=lab.getByRole('button',{name:`${n}봉 이동평균`});await b.click();await expect(b).toHaveAttribute('aria-pressed','true');await b.click();await expect(b).toHaveAttribute('aria-pressed','false');}
 await lab.getByRole('button',{name:'RSI(14)'}).click();await expect(lab.getByRole('img',{name:'학습용 가상 RSI 차트'})).toBeVisible();await lab.getByRole('button',{name:'RSI(14)'}).click();await expect(lab.getByRole('img',{name:'학습용 가상 RSI 차트'})).toHaveCount(0);
 await page.getByRole('button',{name:/주식이 뭐야/}).click();await expect(page.getByText(/개별 기업의 지분/)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});

test('stages, selected values, missing indicators and candidate levels',async({page})=>{
 await page.goto('/#learn');const lab=page.getByRole('region',{name:'차트 실습실'}),slider=lab.getByLabel('봉 선택');const rows=chartRows(instruments[0],'일'),last=rows.length-1;
 await slider.focus();await page.keyboard.press('Home');await expect(lab.getByRole('button',{name:'5봉 이동평균'})).toHaveCount(0);await expect(lab.getByRole('button',{name:'RSI(14)'})).toHaveCount(0);
 for(const [label,value] of [['시가',rows[0].open],['고가',rows[0].high],['저가',rows[0].low],['종가',rows[0].close]] as const)await expect(lab.getByTestId('selected-bar')).toContainText(`${label} ${value.toFixed(2)}`);expect(syntheticVolume(0)).toBe(151415);await expect(lab.getByTestId('selected-bar')).toContainText(syntheticVolume(0).toLocaleString('ko-KR'));
 await lab.getByRole('button',{name:'중급',exact:true}).click();await lab.getByRole('button',{name:'5봉 이동평균'}).click();await expect(lab.getByTestId('sma-5')).toContainText('자료 부족');
 if(test.info().project.name==='mobile')await slider.tap();await slider.focus();await page.keyboard.press('End');await expect(lab.getByTestId('selected-bar')).toContainText(`종가 ${rows[last].close.toFixed(2)}`);await expect(lab.getByTestId('sma-5')).toContainText(movingAverage(rows.map(r=>r.close),5)[last]!.toFixed(2));
 const beforeLine=await lab.locator('.chart').first().screenshot();await lab.getByLabel('지지 후보 USD').fill('210');await expect.poll(async()=>beforeLine.equals(await lab.locator('.chart').first().screenshot())).toBe(false);await expect(lab.getByLabel('지지 후보 USD')).toHaveValue('210');await lab.getByLabel('저항 후보 USD').fill('230');await expect(lab.getByLabel('저항 후보 USD')).toHaveValue('230');
 await lab.getByRole('button',{name:'고급',exact:true}).click();await lab.getByRole('button',{name:'RSI(14)'}).click();await expect(lab.getByTestId('rsi-value')).toContainText(wilderRsi(rows.map(r=>r.close))[last]!.toFixed(2));
 await lab.getByRole('button',{name:'초급',exact:true}).click();await expect(lab.getByTestId('sma-5')).toHaveCount(0);await expect(lab.getByRole('img',{name:'학습용 가상 RSI 차트'})).toHaveCount(0);await lab.getByRole('button',{name:'고급',exact:true}).click();await expect(lab.getByTestId('rsi-value')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/#settings');await page.goto('/#learn');await expect(lab.getByRole('img',{name:'학습용 가상 캔들 차트'})).toHaveCount(1);await page.reload();await expect(lab.getByRole('img',{name:'학습용 가상 캔들 차트'})).toHaveCount(1);
});

test('all symbols and periods use the selected scenario without changing account data',async({page})=>{
 await page.goto('/#stock/AAPL');const account=await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'));await page.getByRole('link',{name:/차트 학습실에서 연습하기/}).click();const lab=page.getByRole('region',{name:'차트 실습실'});
 for(const stock of instruments){await lab.getByLabel('학습 종목').selectOption(stock.symbol);await expect(lab).toContainText(`${stock.symbol} 기반 학습용 합성 시나리오`);const rows=chartRows(stock,'일');await expect(lab.getByTestId('selected-bar')).toContainText(`종가 ${rows.at(-1)!.close.toFixed(2)}`);}
 await lab.getByRole('button',{name:'고급',exact:true}).click();await lab.getByRole('button',{name:'5봉 이동평균'}).click();await lab.getByRole('button',{name:'RSI(14)'}).click();
 for(const period of ['1분','5분','15분','30분','1시간','일','주','월'] as const){await lab.getByRole('button',{name:period,exact:true}).click();const rows=chartRows(instruments[7],period),last=rows.length-1,sma=movingAverage(rows.map(r=>r.close),5)[last],rsi=wilderRsi(rows.map(r=>r.close))[last];await expect(lab.getByTestId('selected-bar')).toContainText(`종가 ${rows[last].close.toFixed(2)}`);await expect(lab.getByTestId('sma-5')).toContainText(sma===null?'자료 부족':sma.toFixed(2));await expect(lab.getByTestId('rsi-value')).toContainText(rsi===null?'자료 부족':rsi.toFixed(2));}
 await page.reload();await expect(lab.getByLabel('학습 종목')).toHaveValue('SCHD');await expect(lab.getByRole('button',{name:'월',exact:true})).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(account);await page.evaluate(()=>{const save=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='chart.period')throw Error('storage blocked');save.call(this,k,v);};});await lab.getByRole('button',{name:'일',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('chart.period'))).toBe('월');await page.reload();await expect(lab.getByRole('button',{name:'월',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.goto('/#stock/MSFT');for(const provider of ['TradingView MSFT','네이버 MSFT','토스증권 MSFT'])await expect(page.getByRole('link',{name:new RegExp(provider)}).first()).toHaveAttribute('href',/^https:\/\//);await page.getByRole('link',{name:/차트 학습실에서 연습하기/}).click();await expect(lab.getByLabel('학습 종목')).toHaveValue('MSFT');await page.goBack();await expect(page.getByRole('heading',{name:'마이크로소프트',exact:true})).toBeVisible();await page.goForward();await expect(lab.getByLabel('학습 종목')).toHaveValue('MSFT');
});
