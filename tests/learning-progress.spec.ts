import {test,expect} from '@playwright/test';
import {answerLessonQuestion,emptyLearningProgress,learningProgressStats,learningUnitsById,parseLearningProgress,progressKey,setLessonCompletion,visitLesson} from '../src/learningProgress';
const guest=progressKey(null);
test('versioned learning progress sanitizes corrupted data, foreign questions and outdated answers',()=>{
 const first=learningUnitsById.stock.questions[0];const selected=first.options.find(o=>o.correct)!.text;
 let p=emptyLearningProgress();p=visitLesson(p,'stock');p=answerLessonQuestion(p,'stock',first.question,selected);p=setLessonCompletion(p,'stock',true);
 expect(learningProgressStats(p)).toMatchObject({completed:1,answered:1,correct:1});
 expect(parseLearningProgress(JSON.stringify(p))).toEqual(p);
 expect(progressKey('abc')).not.toBe(guest);expect(progressKey('abc')).not.toBe(progressKey('def'));
 expect(parseLearningProgress('{')).toEqual(emptyLearningProgress());
 expect(parseLearningProgress(JSON.stringify({...p,version:77}))).toEqual(emptyLearningProgress());
 const dirty={...p,completed:['stock','stock','fake'],lastLesson:'fake',answers:{stock:{[first.question]:selected,'altered question':'old option'},fake:{wrong:'yes'}}};
 expect(parseLearningProgress(JSON.stringify(dirty))).toMatchObject({completed:['stock'],lastLesson:null,answers:{stock:{[first.question]:selected}}});
 const outdated={...p,answers:{stock:{[first.question]:'deleted option'}}};
 expect(learningProgressStats(parseLearningProgress(JSON.stringify(outdated))).answered).toBe(0);
 const wrong=first.options.find(o=>!o.correct)!.text;expect(learningProgressStats(answerLessonQuestion(p,'stock',first.question,wrong)).wrong).toHaveLength(1);
});
test('wrong answer, local persistence, correction, manual completion, resume, and reset',async({page})=>{
 const errors:string[]=[],rpc:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',req=>{if(/\/rest\/v1\/rpc\//.test(req.url()))rpc.push(req.url());});
 await page.addInitScript(()=>{localStorage.setItem('us-stock-lab.account.v1',JSON.stringify({version:1,generation:'progress-unchanged',trades:[]}));localStorage.setItem('us-stock-lab.watchlist.v1','["AAPL","VOO"]');});
 await page.goto('/#learn/lessons');
 const lesson=page.locator('#lesson-stock');await lesson.locator('.lesson').click();
 await lesson.locator('fieldset').first().getByRole('radio').last().check();
 await expect(lesson.locator('fieldset').first().getByRole('status')).toContainText('다시 생각해 보세요.');
 expect(await page.evaluate(key=>localStorage.getItem(key),guest)).toContain('stock');
 await page.goto('/#learn');const dash=page.getByRole('region',{name:'학습 현황'});
 await expect(dash).toContainText('0/10');await expect(dash).toContainText('복습할 오답');await expect(dash).toContainText('0%');
 await expect(dash.getByRole('link',{name:/주식이 뭐야.*가상 주식/})).toBeVisible();
 await page.reload();await expect(dash).toContainText('0%');
 await dash.getByRole('link',{name:/주식이 뭐야.*가상 주식/}).click();
 await expect(page).toHaveURL(/#learn\/lessons\/stock$/);await expect(lesson.locator('.lesson')).toHaveAttribute('aria-expanded','true');
 await expect(lesson.locator('.lesson')).toBeFocused();
 await lesson.locator('fieldset').first().getByRole('radio').first().check();
 await expect(lesson.locator('fieldset').first().getByRole('status')).toContainText('맞았어요.');
 await lesson.getByRole('button',{name:'이 수업 학습 완료로 표시'}).click();
 await expect(lesson.getByRole('button',{name:'완료 표시 취소'})).toHaveAttribute('aria-pressed','true');
 await page.goto('/#learn');await expect(dash).toContainText('1/10');await expect(dash).toContainText('100%');await expect(dash).toContainText('현재 기록된 오답이 없어요.');
 await dash.getByRole('link',{name:'마지막 수업 이어하기 →'}).click();await expect(lesson.locator('.lesson')).toHaveAttribute('aria-expanded','true');
 await page.goto('/#learn');await dash.getByRole('button',{name:'이 브라우저의 학습 기록 초기화'}).click();await dash.getByRole('button',{name:'취소'}).click();
 await expect(dash).toContainText('1/10');await dash.getByRole('button',{name:'이 브라우저의 학습 기록 초기화'}).click();await dash.getByRole('button',{name:'삭제 확인'}).click();
 await expect(dash).toContainText('0/10');expect(await page.evaluate(key=>localStorage.getItem(key),guest)).toBeNull();
 expect(await page.evaluate(()=>[localStorage.getItem('us-stock-lab.account.v1'),localStorage.getItem('us-stock-lab.watchlist.v1')])).toEqual([JSON.stringify({version:1,generation:'progress-unchanged',trades:[]}), '["AAPL","VOO"]']);
 expect(errors).toEqual([]);expect(rpc).toEqual([]);
});
test('progress dashboard and controls remain usable on narrow viewports',async({page})=>{
 await page.goto('/#learn');for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  const dashboard=page.getByRole('region',{name:'학습 현황'});
  await expect(dashboard).toBeVisible();await expect(dashboard.getByRole('link',{name:'첫 수업 시작하기 →'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const b=await dashboard.getByRole('button',{name:'이 브라우저의 학습 기록 초기화'}).boundingBox();expect(b).not.toBeNull();expect(b!.height).toBeGreaterThanOrEqual(44);
 }
});
