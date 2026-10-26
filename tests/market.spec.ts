import {test,expect} from '@playwright/test';
import {authConfig} from '../src/auth';
import {demoEvents,demoIndicators,demoMarketService,pendingOfficialService,importantEvent,eventPhase,kstTime} from '../src/marketInfo';
test('KST event day boundaries and explicit result versus interpretation',()=>{
 const e={...demoEvents[0],scheduledAt:'2026-10-26T18:00:00Z'}; // Oct 27 03:00 KST
 expect(importantEvent([e],new Date('2026-10-26T00:00:00Z'))?.label).toBe('예정');
 expect(importantEvent([e],new Date('2026-10-26T15:00:00Z'))?.label).toBe('오늘 발표');
 expect(importantEvent([{...e,actual:'2.5%'}],new Date('2026-10-27T15:00:00Z'))?.label).toBe('결과 요약');
 expect(importantEvent([e],new Date('2026-10-27T15:00:00Z'))?.label).toBe('발표 결과 확인 중');
 expect(importantEvent([e],new Date('2026-10-30T00:00:00Z'))).toBeNull();
 expect(eventPhase({...e,actual:'2.5%'},new Date('2026-10-26T16:00:00Z'))).toBe('오늘');
 expect(eventPhase({...e,actual:'2.5%'},new Date('2026-10-26T19:00:00Z'))).toBe('발표완료');
 expect(eventPhase(e,new Date('2026-10-27T15:00:00Z'))).toBe('발표 대기');expect(kstTime(e.scheduledAt)).toContain('03:00');
});
test('demo source boundaries never label mock as official or invent news',async()=>{
 expect(demoIndicators).toHaveLength(6);expect(demoEvents).toHaveLength(8);expect(demoEvents.every(e=>e.status==='synthetic')).toBe(true);
 const first=await demoMarketService.load();first.events.length=0;expect((await demoMarketService.load()).events).toHaveLength(8);
 expect(first.news).toHaveLength(0);expect(await pendingOfficialService.load()).toEqual({indicators:[],events:[],news:[],mode:'official-pending'});
});
test('authentication configuration rejects absent or server keys',()=>{
 expect(authConfig(undefined,undefined)).toBeNull();expect(authConfig('http://example.com','sb_publishable_not_a_real_key_123')).toBeNull();
 expect(authConfig('https://example.supabase.co','sb_secret_NOT_FOR_BROWSER')).toBeNull();
 const jwt=(role:string)=>'e30.'+btoa(JSON.stringify({role}))+'.signature';expect(authConfig('https://example.supabase.co',jwt('service_role'))).toBeNull();
 expect(authConfig('https://example.supabase.co',jwt('anon'))).not.toBeNull();
});
test('market cards, calendar, empty news and beginner lessons render responsively',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('.market-indices section')).toHaveCount(6);
 for(const card of await page.locator('.market-indices section').all()){await expect(card).toContainText('합성 예시');await expect(card).toContainText('기준');}
 await expect(page.getByText('보합 0.00%',{exact:true})).toBeVisible();
 await page.goto('/#calendar');await expect(page.locator('.event-list article')).toHaveCount(8);await expect(page.getByText(/아래 일정·값은 모두 교육용 가상/)).toBeVisible();
 await page.screenshot({path:`test-results/${test.info().project.name}-calendar.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/#news');await expect(page.getByRole('heading',{name:'수신된 뉴스가 없습니다'})).toBeVisible();await expect(page.locator('.source-links a')).toHaveCount(5);
 await page.getByLabel('시장정보 모드').selectOption('official-pending');await page.goto('/#calendar');await expect(page.getByText(/공식 경제 일정 연동예정/)).toBeVisible();await page.goto('/#market');await page.getByRole('link',{name:'지표',exact:true}).click();await expect(page.getByText(/현재 수신된 지표가 없습니다/)).toBeVisible();
 await page.goto('/#learn');await expect(page.locator('.lesson')).toHaveCount(10);await page.getByRole('button',{name:'왕초보',exact:true}).click();await expect(page.locator('.lesson')).toHaveCount(2);await page.getByRole('button',{name:/ETF가 뭐야/}).click();await expect(page.getByText(/한 바구니/)).toBeVisible();
 await page.goto('/#settings');await expect(page.getByRole('heading',{name:'로그인 및 연결'})).toBeVisible();await expect(page.getByTestId('auth-unconfigured').or(page.getByLabel('초대된 이메일'))).toBeVisible();await expect(page.getByText(/계좌 모드:/)).toBeVisible();expect(errors).toEqual([]);
});
