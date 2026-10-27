import {test,expect} from '@playwright/test';
test('interactive chart lab preserves lessons and works at each stage',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/#learn');const lab=page.getByRole('region',{name:'차트 실습실'});await expect(lab.getByRole('img',{name:'학습용 가상 캔들 차트'})).toBeVisible();await expect(lab.locator('canvas').first()).toBeVisible();
 for(const stage of ['초급','중급','고급']){await lab.getByRole('button',{name:stage,exact:true}).click();await expect(lab.getByRole('button',{name:stage,exact:true})).toHaveAttribute('aria-pressed','true');}
 await lab.getByRole('button',{name:'선 차트'}).click();await expect(lab.getByRole('img',{name:'학습용 가상 선 차트'})).toBeVisible();await lab.getByRole('button',{name:'캔들 차트'}).click();
 for(const n of [5,20,60]){const b=lab.getByRole('button',{name:`${n}봉 이동평균`});await b.click();await expect(b).toHaveAttribute('aria-pressed','true');await b.click();await expect(b).toHaveAttribute('aria-pressed','false');}
 await lab.getByRole('button',{name:'RSI(14)'}).click();await expect(lab.getByRole('img',{name:'학습용 RSI 차트'})).toBeVisible();await lab.getByRole('button',{name:'RSI(14)'}).click();await expect(lab.getByRole('img',{name:'학습용 RSI 차트'})).toHaveCount(0);
 await page.getByRole('button',{name:/주식이 뭐야/}).click();await expect(page.getByText(/개별 기업의 지분/)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
