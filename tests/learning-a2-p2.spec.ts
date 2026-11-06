import {test,expect} from '@playwright/test';
import {p2Units} from '../src/learningA2P2';

const ids=['us-market','rates','macro'] as const;
test('three expanded lessons explain hypothetical examples and each answer',async({page})=>{
 await page.goto('/#learn/lessons');
 for(const id of ids){const unit=p2Units[id],card=page.locator('#lesson-'+id);await card.locator('.lesson').click();
  for(const heading of ['핵심 개념','왜 중요할까요?','어디에 활용할까요?','숫자와 사례로 이해하기','헷갈리기 쉬운 점','직접 해보기','이해도 확인','참고 출처'])await expect(card.getByRole('heading',{name:heading,exact:true})).toBeVisible();
  expect(unit.questions.length).toBeGreaterThanOrEqual(2);
  for(let i=0;i<unit.questions.length;i++){const q=unit.questions[i],field=card.locator('fieldset').nth(i);expect(q.options.filter(o=>o.correct)).toHaveLength(1);for(let j=0;j<q.options.length;j++){await field.getByRole('radio').nth(j).check();await expect(field.getByRole('status')).toContainText(q.options[j].feedback)}}
  await expect(card.getByRole('link',{name:unit.practice.label})).toHaveAttribute('href',unit.practice.href);await expect(card.getByRole('link',{name:/합성 차트 실습실로 이동/})).toHaveAttribute('href','#learn/lab');
  for(const source of unit.sources)await expect(card.locator(`a[href="${source.url}"]`)).toHaveAttribute('target','_blank');
  if(id==='us-market'){await expect(card.getByRole('table')).toContainText('$0.20');await expect(card).toContainText('$1,001.00');await expect(card).toContainText('지정가·시간외 거래는 제공하지 않습니다');await expect(card).toContainText('다음 날 05:00')}
  if(id==='rates'){await expect(card).toContainText('$40,000');await expect(card).toContainText('$50,000');await expect(card).toContainText('공식 발표 일정이 아닙니다');await expect(card.locator('.learning-timeline li')).toHaveCount(3)}
  if(id==='macro'){await expect(card.getByRole('table')).toContainText('사업체조사');await expect(card).toContainText('0.2%포인트');await expect(card).toContainText('시간이 지났다는 이유로 실제 발표값이 생기지 않습니다')}
  await card.locator('.lesson').click();
 }
});
test('responsive lessons support keyboard, table scrolling, filters and do not write accounts',async({page})=>{
 const errors:string[]=[],rpc:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/rpc/'))rpc.push(r.url())});await page.goto('/#learn/lessons');const before=await page.evaluate(()=>JSON.stringify(localStorage));
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});for(const id of ids){const card=page.locator('#lesson-'+id),button=card.locator('.lesson');await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-expanded','true');const radio=card.getByRole('radio').first();await radio.focus();await page.keyboard.press('Space');await expect(radio).toBeChecked();await expect(radio).toHaveCSS('outline-width','3px');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width===320&&(id==='us-market'||id==='macro')){const region=card.getByRole('region',{name:p2Units[id].table!.caption});await region.focus();await expect(region).toBeFocused();for(let n=0;n<6;n++)await page.keyboard.press('ArrowRight');await expect.poll(()=>region.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0)}await button.focus();await page.keyboard.press('Space');await expect(button).toHaveAttribute('aria-expanded','false')}}
 await page.getByRole('button',{name:'시장 이해',exact:true}).click();await expect(page.locator('#lesson-rates')).toBeVisible();await expect(page.locator('#lesson-macro')).toHaveCount(0);expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);expect(errors).toEqual([]);expect(rpc).toEqual([]);
});
