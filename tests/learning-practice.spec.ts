import {test,expect} from '@playwright/test';
import {lessons} from '../src/Learning';
import {resolveLearningRoute} from '../src/learningRoutes';
import {practiceMissions,lessonPracticeRoute} from '../src/learningPractice';
const accountKey='us-stock-lab.account.v1',watchKey='us-stock-lab.watchlist.v1';
const missionIds=Object.keys(practiceMissions) as (keyof typeof practiceMissions)[];
test('all ten unchanged lessons have a safe existing practice route and exact deep link',()=>{
 expect(missionIds).toHaveLength(10);
 expect(missionIds.sort()).toEqual(lessons.map(l=>l.id).sort());
 const routes=['stock/AAPL','stock/VOO','learn/AAPL','market','calendar','experience','news'];
 for(const id of missionIds){const item=practiceMissions[id];expect(item.title.length).toBeGreaterThan(5);expect(item.action.length).toBeGreaterThan(5);expect(item.tasks).toHaveLength(2);expect(routes).toContain(item.target.slice(1));expect(resolveLearningRoute('learn/lessons/'+id)).toEqual({kind:'lessons',lessonId:id});expect(lessonPracticeRoute(id)).toBe('#learn/lessons/'+id);}
 for(const path of ['learn/lessons/unknown','learn/lessons/stock/extra','learn/lessons/STOCK','learn/lab/AAPL'])expect(resolveLearningRoute(path)).toEqual({kind:'missing'});
});
test('lesson mission leads to real screen, displays guidance and restores the expanded lesson',async({page})=>{
 const errors:string[]=[],rpc:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',req=>{if(req.url().includes('/rest/v1/rpc/'))rpc.push(req.url());});
 const doc=JSON.stringify({version:1,generation:'ux5-b-protected',trades:[]}),watch='["AAPL","VOO"]';
 await page.addInitScript(({doc,watch})=>{localStorage.setItem('us-stock-lab.account.v1',doc);localStorage.setItem('us-stock-lab.watchlist.v1',watch);},{doc,watch});
 await page.goto('/#learn/lessons');
 for(const id of ['stock','diversification','fx'] as const){
  const card=page.locator('#lesson-'+id);await card.locator('.lesson').click();await expect(card.locator('.lesson')).toHaveAttribute('aria-expanded','true');
  const mission=practiceMissions[id],link=card.getByRole('region',{name:'학습 연계 실습 미션'}).getByRole('link',{name:mission.action+' →'});
  await expect(link).toHaveAttribute('href',mission.target);await link.click();await expect(page).toHaveURL(new RegExp('#'+mission.target.slice(1)+'$'));
  const banner=page.getByRole('complementary',{name:'학습 실습 복귀 안내'});
  await expect(banner).toContainText(mission.title);await expect(banner.getByRole('link',{name:'원래 수업으로 돌아가기 →'})).toHaveAttribute('href',lessonPracticeRoute(id));
  await banner.getByRole('link',{name:'원래 수업으로 돌아가기 →'}).click();
  await expect(page).toHaveURL(new RegExp('#learn/lessons/'+id+'$'));
  await expect(card.locator('.lesson')).toHaveAttribute('aria-expanded','true');await expect(card.locator('.lesson')).toBeFocused();await expect(card.getByRole('heading',{name:'이해도 확인'})).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('us-stock-lab.learning-practice.v1'))).toBeNull();
  if(id!=='fx')await card.locator('.lesson').click();
 }
 expect(await page.evaluate(k=>localStorage.getItem(k),accountKey)).toBe(doc);expect(await page.evaluate(k=>localStorage.getItem(k),watchKey)).toBe(watch);expect(errors).toEqual([]);expect(rpc).toEqual([]);
});
test('practice return is optional, dismissible and not shown for a different screen',async({page})=>{
 await page.goto('/#market');await expect(page.getByRole('complementary',{name:'학습 실습 복귀 안내'})).toHaveCount(0);
 await page.goto('/#learn/lessons');await page.locator('#lesson-rates .lesson').click();await page.locator('#lesson-rates').getByRole('region',{name:'학습 연계 실습 미션'}).getByRole('link').click();
 const banner=page.getByRole('complementary',{name:'학습 실습 복귀 안내'});await expect(banner).toBeVisible();
 await page.goto('/#news');await expect(banner).toHaveCount(0);
 await page.goto('/#calendar');await expect(page.getByRole('complementary',{name:'학습 실습 복귀 안내'})).toBeVisible();
 await page.getByRole('complementary',{name:'학습 실습 복귀 안내'}).getByRole('button',{name:'안내 닫기'}).click();
 await expect(page.getByRole('complementary',{name:'학습 실습 복귀 안내'})).toHaveCount(0);
 expect(await page.evaluate(()=>sessionStorage.getItem('us-stock-lab.learning-practice.v1'))).toBeNull();
});
test('landing shortcuts and mission controls are usable from 320px to desktop',async({page})=>{
 await page.goto('/#learn');
 const hub=page.getByRole('region',{name:'배운 내용을 실제 화면에서 연습해 보세요'});
 await expect(page.locator('.learning-choice')).toHaveCount(2);
 for(const href of ['#experience','#portfolio/analysis','#backtest'])await expect(hub.locator('a[href="'+href+'"]')).toBeVisible();
 await page.goto('/#learn/lessons/diversification');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  const card=page.locator('#lesson-diversification');
  await expect(card.locator('.lesson')).toHaveAttribute('aria-expanded','true');
  const link=card.getByRole('region',{name:'학습 연계 실습 미션'}).getByRole('link');
  await expect(link).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const box=await link.boundingBox();expect(box).not.toBeNull();expect(box!.height).toBeGreaterThanOrEqual(44);
 }
});
