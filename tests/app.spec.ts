import {test,expect} from '@playwright/test';
test('navigation, search, chart, persistence and lessons',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'오늘도 한 걸음, 투자 연습'})).toBeVisible();
 await page.getByRole('link',{name:'↗ 시장',exact:true}).click();await page.getByRole('textbox',{name:'종목 검색'}).fill('aapl');
 await expect(page.locator('.stock')).toHaveCount(1);await page.getByRole('button',{name:'AAPL 관심종목',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'★ 관심종목만',exact:true}).click();await expect(page.locator('.stock')).toHaveCount(1);
 await page.locator('.identity').click();await page.getByRole('link',{name:/차트 학습실에서 연습하기/}).click();await expect(page.getByText(/AAPL 기반 학습용 합성 시나리오/)).toBeVisible();await expect(page.locator('canvas').first()).toBeVisible();
 await page.screenshot({path:`test-results/${test.info().project.name}-chart.png`,fullPage:true});await page.reload();await expect(page.getByLabel('학습 종목')).toHaveValue('AAPL');await page.goto('/#stock/AAPL');await expect(page.getByRole('heading',{name:'애플',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'★ 관심종목 해제'}).click();await page.reload();await expect(page.getByRole('button',{name:'☆ 관심종목 등록'})).toBeVisible();
 for(const [nav,title] of [['▤ 포트폴리오','포트폴리오'],['◷ 학습','한 걸음씩 배우는 투자'],['⚙ 설정','설정 및 서비스 안내']]){await page.getByRole('link',{name:nav,exact:true}).click();await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();}
 await page.getByRole('link',{name:'◷ 학습',exact:true}).click();await page.getByRole('button',{name:/주식이 뭐야/}).click();await expect(page.getByText(/개별 기업의 지분/)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('invalid storage and failed writes are safe',async({page})=>{
 await page.goto('/');await page.evaluate(()=>localStorage.setItem('us-stock-lab.watchlist.v1','bad json'));await page.reload();await expect(page.getByText('아직 담은 종목이 없어요.')).toBeVisible();
 await page.evaluate(()=>localStorage.setItem('us-stock-lab.watchlist.v1',JSON.stringify(['AAPL','AAPL','INVALID',3])));await page.reload();await expect(page.locator('.stock')).toHaveCount(1);
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('quota');};});await page.getByRole('button',{name:'AAPL 관심종목',exact:true}).click();await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');await expect(page.getByRole('button',{name:'AAPL 관심종목',exact:true})).toHaveAttribute('aria-pressed','true');
});
