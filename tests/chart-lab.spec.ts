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
 await expect(lab.getByRole('button',{name:'5봉 이동평균'})).toHaveCount(0);await expect(lab.getByRole('button',{name:'RSI(14)'})).toHaveCount(0);
 for(const [label,value] of [['시가',rows[0].open],['고가',rows[0].high],['저가',rows[0].low],['종가',rows[0].close]] as const)await expect(lab.getByTestId('selected-bar')).toContainText(`${label} ${value.toFixed(2)}`);expect(syntheticVolume(0)).toBe(151415);await expect(lab.getByTestId('selected-bar')).toContainText(syntheticVolume(0).toLocaleString('ko-KR'));
 await lab.getByRole('button',{name:'중급',exact:true}).click();await lab.getByRole('button',{name:'5봉 이동평균'}).click();await expect(lab.getByTestId('sma-5')).toContainText('자료 부족');
 if(test.info().project.name==='mobile')await slider.tap();await slider.focus();await page.keyboard.press('End');await expect(lab.getByTestId('selected-bar')).toContainText(`종가 ${rows[last].close.toFixed(2)}`);await expect(lab.getByTestId('sma-5')).toContainText(movingAverage(rows.map(r=>r.close),5)[last]!.toFixed(2));
 const beforeLine=await lab.locator('.chart').first().screenshot();await lab.getByLabel('지지 후보 USD').fill('210');await expect.poll(async()=>beforeLine.equals(await lab.locator('.chart').first().screenshot())).toBe(false);await expect(lab.getByLabel('지지 후보 USD')).toHaveValue('210');await lab.getByLabel('저항 후보 USD').fill('230');await expect(lab.getByLabel('저항 후보 USD')).toHaveValue('230');
 await lab.getByRole('button',{name:'고급',exact:true}).click();await lab.getByRole('button',{name:'RSI(14)'}).click();await expect(lab.getByTestId('rsi-value')).toContainText(wilderRsi(rows.map(r=>r.close))[last]!.toFixed(2));
 await lab.getByRole('button',{name:'초급',exact:true}).click();await expect(lab.getByTestId('sma-5')).toHaveCount(0);await expect(lab.getByRole('img',{name:'학습용 가상 RSI 차트'})).toHaveCount(0);await lab.getByRole('button',{name:'고급',exact:true}).click();await expect(lab.getByTestId('rsi-value')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/#settings');await page.goto('/#learn');await expect(lab.getByRole('img',{name:'학습용 가상 캔들 차트'})).toHaveCount(1);await page.reload();await expect(lab.getByRole('img',{name:'학습용 가상 캔들 차트'})).toHaveCount(1);
});
