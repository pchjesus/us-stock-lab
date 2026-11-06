import {test,expect} from '@playwright/test';
import {p3Units} from '../src/learningA2P3';
const ids=['averaging','diversification','news'] as const;
test('P3 lessons show accurate hypothetical examples and explain every answer',async({page})=>{
 await page.goto('/#learn/lessons');
 for(const id of ids){const unit=p3Units[id],card=page.locator('#lesson-'+id);await card.locator('.lesson').click();
  for(const title of ['핵심 개념','왜 중요할까요?','어디에 활용할까요?','숫자와 사례로 이해하기','헷갈리기 쉬운 점','직접 해보기','이해도 확인','참고 출처'])await expect(card.getByRole('heading',{name:title,exact:true})).toBeVisible();
  expect(unit.questions.length).toBeGreaterThanOrEqual(2);for(let i=0;i<unit.questions.length;i++){const q=unit.questions[i],field=card.locator('fieldset').nth(i);expect(q.options.filter(o=>o.correct)).toHaveLength(1);for(let j=0;j<q.options.length;j++){expect(q.options[j].feedback.length).toBeGreaterThan(15);await field.getByRole('radio').nth(j).check();await expect(field.getByRole('status')).toContainText(q.options[j].feedback)}}
  await expect(card.getByRole('link',{name:unit.practice.label})).toHaveAttribute('href',unit.practice.href);if(unit.practice.extra)await expect(card.getByRole('link',{name:unit.practice.extra.label})).toHaveAttribute('href',unit.practice.extra.href);
  for(const source of unit.sources)await expect(card.locator(`a[href="${source.url}"]`)).toHaveAttribute('target','_blank');
  if(id==='averaging'){for(const value of ['$1,000','$400','$1,400','$93.33','$1,050','−$350'])await expect(card).toContainText(value);await expect(card).toContainText('빈 계좌에서도');}
  if(id==='diversification'){for(const value of ['−$300','−$160','$840'])await expect(card).toContainText(value);await expect(card).toContainText('관심종목 목록은 실제 보유·투자 비중이 아닙니다');}
  if(id==='news'){await expect(card).toContainText('실존 기업이나 사건이 아닌 가상 사례');await expect(card).toContainText('뉴스 자동 수집은 미구현');await expect(card.locator('.learning-timeline li')).toHaveCount(3)}
  await card.locator('.lesson').click();
 }
});
test('P3 lessons work across screen sizes and keyboard without account or RPC changes',async({page})=>{
 const errors:string[]=[],rpc:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/rpc/'))rpc.push(r.url())});await page.goto('/#learn/lessons');const before=await page.evaluate(()=>JSON.stringify(localStorage));
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});for(const id of ids){const card=page.locator('#lesson-'+id),button=card.locator('.lesson');await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-expanded','true');const radio=card.getByRole('radio').first();await radio.focus();await page.keyboard.press('Space');await expect(radio).toBeChecked();await expect(radio).toHaveCSS('outline-width','3px');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width===320){const region=card.getByRole('region',{name:p3Units[id].table!.caption});await region.focus();await expect(region).toBeFocused();for(let n=0;n<6;n++)await page.keyboard.press('ArrowRight');await expect.poll(()=>region.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0)}await button.focus();await page.keyboard.press('Space');await expect(button).toHaveAttribute('aria-expanded','false')}}
 await page.getByRole('button',{name:'투자 실습',exact:true}).click();await expect(page.locator('#lesson-averaging')).toBeVisible();await expect(page.locator('#lesson-news')).toHaveCount(0);expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);expect(errors).toEqual([]);expect(rpc).toEqual([]);
});
test('practice links lead to existing reading screens',async({page})=>{
 await page.goto('/#learn/lessons');await page.locator('#lesson-news .lesson').click();await page.getByRole('link',{name:'뉴스 화면과 공식 자료 확인 →'}).click();await expect(page).toHaveURL(/#news$/);await expect(page.getByRole('heading',{name:'공식 자료 바로가기'})).toBeVisible();
 await page.goto('/#learn/lessons');await page.locator('#lesson-news .lesson').click();await page.getByRole('link',{name:'기업 상세에서 근거 탭 확인 →'}).click();await expect(page).toHaveURL(/#stock\/AAPL$/);await page.getByRole('tab',{name:'근거',exact:true}).click();await expect(page.getByRole('tab',{name:'근거',exact:true})).toHaveAttribute('aria-selected','true');
 await page.goto('/#learn/lessons');await page.locator('#lesson-diversification .lesson').click();await page.getByRole('link',{name:'포트폴리오 살펴보기 →'}).click();await expect(page).toHaveURL(/#portfolio$/);await expect(page.getByRole('heading',{name:'포트폴리오',level:1})).toBeVisible();
});
