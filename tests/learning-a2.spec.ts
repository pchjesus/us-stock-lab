import {test,expect} from '@playwright/test';
import {a2Units,correctedLessonText} from '../src/learningA2';

test('FX and dividend lessons show examples, accurate scope and feedback for every choice',async({page})=>{
 await page.goto('/#learn/lessons');
 for(const id of ['fx','dividend'] as const){
  const card=page.locator(`#lesson-${id}`); await card.locator('.lesson').click();
  await expect(card.locator('.lesson-body > p').first()).toHaveText(correctedLessonText[id].body);
  for(const heading of ['핵심 개념','왜 중요할까요?','어디에 활용할까요?','숫자와 사례로 이해하기','헷갈리기 쉬운 점','이해도 확인','참고 출처']) await expect(card.getByRole('heading',{name:heading,exact:true})).toBeVisible();
  for(let i=0;i<a2Units[id].questions.length;i++){
   const q=a2Units[id].questions[i], field=card.locator('fieldset').nth(i); expect(q.options.filter(o=>o.correct)).toHaveLength(1);
   for(let j=0;j<q.options.length;j++){await field.getByRole('radio').nth(j).check();await expect(field.getByRole('status')).toContainText(q.options[j].feedback)}
  }
  await expect(card.getByRole('link',{name:a2Units[id].practice.label})).toHaveAttribute('href',a2Units[id].practice.href);
  for(const source of a2Units[id].sources) await expect(card.locator(`a[href="${source.url}"]`)).toHaveAttribute('href',source.url);
  if(id==='fx'){await expect(card.getByRole('table')).toContainText('130,000원');await expect(card.getByRole('table')).toContainText('140,000원');await expect(card.getByRole('table')).toContainText('126,000원');await expect(card).toContainText('공개 참고환율은 별도');}
  else {await expect(card).toContainText('−$80');await expect(card).toContainText('−8%');await expect(card).toContainText('수기 기능이 비활성화');await expect(card).toContainText('배당락일');}
  await card.locator('.lesson').click();
 }
});

test('new lessons remain accessible on narrow screens without account or RPC changes',async({page})=>{
 const errors:string[]=[],rpc:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/rpc/'))rpc.push(r.url())});
 await page.goto('/#learn/lessons');const before=await page.evaluate(()=>JSON.stringify(localStorage));
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});for(const id of ['fx','dividend']){const card=page.locator(`#lesson-${id}`);const button=card.locator('.lesson');await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-expanded','true');const radio=card.getByRole('radio').first();await radio.focus();await page.keyboard.press('Space');await expect(radio).toBeChecked();await expect(radio).toHaveCSS('outline-width','3px');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await button.click()}}
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);expect(errors).toEqual([]);expect(rpc).toEqual([]);
});
