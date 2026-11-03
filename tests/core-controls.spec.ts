import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {instruments} from '../src/data';

async function checkControls(page:Page){
 const boxes=await page.locator('.chart-lab,.account-mode,.order-account,.confirmation,.heading,.trade-form').locator('button,select,input').evaluateAll(es=>es.map(e=>{
  const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
 }).filter(r=>r.width&&r.height));
 for(const box of boxes){expect(box.height,`${box.label}: target height`).toBeGreaterThanOrEqual(44);expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(page.viewportSize()!.width+1);}
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
  const a=boxes[i],b=boxes[j];expect(a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1,`${a.label} / ${b.label} overlap`).toBe(true);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

test('account controls live in portfolio/settings and order context links reach them',async({page})=>{
 for(const route of ['home','market','learn','learn/MSFT','calendar','news','indices']){await page.goto('/#'+route);await expect(page.getByLabel('계좌 화면 모드')).toHaveCount(0);}
 for(const route of ['portfolio','settings']){
  await page.goto('/#'+route);const section=page.getByRole('region',{name:'계좌 유형 선택'});
  await expect(section.getByLabel('계좌 화면 모드')).toHaveValue('synthetic');
  await expect(section.locator('option[value="manual"]')).toHaveJSProperty('disabled',true);
  await expect(section).toContainText('기존 합성 계좌 · 브라우저 로컬');await expect(section).toContainText('공개 준비 중이므로 선택할 수 없습니다');
  if(route==='portfolio')expect(await section.evaluate(e=>!!(e.compareDocumentPosition(document.querySelector('.account-summary')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 }
 await page.goto('/#stock/AAPL');const context=page.getByRole('region',{name:'현재 주문 계좌'});
 await expect(page.getByLabel('계좌 화면 모드')).toHaveCount(0);await expect(context).toContainText('기존 합성 계좌 · 브라우저 로컬');
 await context.getByRole('link',{name:'포트폴리오에서 변경 →'}).click();await expect(page.getByLabel('계좌 화면 모드')).toBeVisible();
 await page.goBack();await context.getByRole('link',{name:'계좌 설정 →'}).click();await expect(page).toHaveURL(/#settings$/);await page.reload();await expect(page.getByLabel('계좌 화면 모드')).toHaveValue('synthetic');
});

test('native symbol select, keyboard groups, neutral selection and chart restoration',async({page})=>{
 await page.goto('/#learn/AAPL');const lab=page.getByRole('region',{name:'차트 실습실'}),select=lab.getByLabel('학습 종목');
 await expect(select).toHaveJSProperty('tagName','SELECT');await expect(select.locator('option')).toHaveCount(8);
 expect(await select.locator('option').allTextContents()).toEqual(instruments.map(s=>`${s.name} · ${s.symbol}`));
 const before=await lab.getByTestId('selected-bar').textContent();await select.focus();await select.press('ArrowDown');await select.press('Enter');
 await expect(page).toHaveURL(/#learn\/MSFT$/);await expect(select).toHaveValue('MSFT');await expect(lab.getByTestId('selected-bar')).not.toHaveText(before!);
 const advanced=lab.getByRole('group',{name:'학습 난이도'}).getByRole('button',{name:'고급',exact:true});await advanced.focus();await advanced.press('Space');await expect(advanced).toHaveAttribute('aria-pressed','true');await expect(advanced).toHaveCSS('font-weight','750');await expect(advanced).toHaveCSS('outline-width','3px');
 for(const [group,name] of [['차트 모양','선 차트'],['차트 기간','월'],['이동평균 표시','5봉 이동평균'],['RSI 표시','RSI(14)']]){const button=lab.getByRole('group',{name:group,exact:true}).getByRole('button',{name,exact:true});await button.focus();await button.press('Enter');await expect(button).toHaveAttribute('aria-pressed','true');await expect(button).toHaveCSS('background-color','rgb(228, 233, 241)');}
 await expect(lab.getByRole('img',{name:'학습용 가상 선 차트'})).toBeVisible();await expect(lab.getByRole('img',{name:'학습용 가상 RSI 차트'})).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});await expect(advanced).toHaveCSS('transition-duration','0s');await checkControls(page);
 await page.reload();await expect(select).toHaveValue('MSFT');await expect(lab.getByRole('button',{name:'월',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('watchlist toggle and links preserve saved choices; primary and danger actions differ',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T14:00:00Z'));await page.goto('/#market');const star=page.getByRole('button',{name:'AAPL 관심종목',exact:true});
 await star.click();await expect(star).toHaveAttribute('aria-pressed','true');await page.reload();await expect(star).toHaveAttribute('aria-pressed','true');await page.goto('/#stock/AAPL');
 const toggle=page.getByRole('button',{name:'★ 관심종목 해제',exact:true});await expect(toggle).toHaveCSS('background-color','rgb(228, 233, 241)');await toggle.press('Enter');await expect(page.getByRole('button',{name:'☆ 관심종목 등록',exact:true})).toHaveAttribute('aria-pressed','false');
 const review=page.getByRole('button',{name:'주문 검토',exact:true});await expect(review).toBeEnabled();await expect(review).toHaveCSS('background-color','rgb(49, 91, 211)');await review.click();
 const cancel=page.getByRole('button',{name:'주문 취소',exact:true});await expect(cancel).toHaveCSS('background-color','rgb(255, 255, 255)');await cancel.click();
 await page.goto('/#portfolio');const reset=page.getByRole('button',{name:'계좌 전체 초기화'});await expect(reset).toHaveCSS('color','rgb(161, 40, 51)');await reset.click();const confirm=page.getByRole('button',{name:'초기화 확정'});await expect(confirm).toBeDisabled();await expect(confirm).toHaveCSS('background-color','rgb(237, 240, 245)');await page.getByRole('button',{name:'초기화 취소'}).click();
 await page.goto('/#market');await expect(star).toHaveAttribute('aria-pressed','false');await page.reload();await expect(star).toHaveAttribute('aria-pressed','false');
});

test('core controls fit 1440/1200/768/390/320px with desktop and touch input',async({page},testInfo)=>{
 test.setTimeout(90000);mkdirSync('work/ux1-b1/captures',{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,1200,768,390,320]){
  await page.setViewportSize({width,height:950});
  for(const route of ['home','market','stock/AAPL','stock/VOO','portfolio','learn/AAPL','settings']){
   await page.goto('/#'+route);await expect(page.getByTestId('ticker-current')).toBeVisible();
   if(route==='learn/AAPL'){
    const advanced=page.getByRole('group',{name:'학습 난이도'}).getByRole('button',{name:'고급',exact:true});if(testInfo.project.name==='mobile')await advanced.tap();else await advanced.click();
    await page.getByRole('button',{name:'5봉 이동평균',exact:true}).click();await page.getByRole('button',{name:'RSI(14)',exact:true}).click();
   }
   await checkControls(page);
   if([1440,390].includes(width)&&['portfolio','learn/AAPL','stock/AAPL'].includes(route)){
    const region=page.locator(route==='learn/AAPL'?'.chart-lab':route==='portfolio'?'.account-mode':'.order-account');
    await region.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.evaluate(()=>scrollBy(0,-16));
    await page.screenshot({path:`work/ux1-b1/captures/${testInfo.project.name}-${width}-${route.replace('/','-')}.png`});
   }
  }
 }
 expect(errors).toEqual([]);
});
