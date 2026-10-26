import {test,expect} from '@playwright/test';
test('configured email OTP login/logout uses invited users and preserves local demo',async({page})=>{
 const user={id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',email:'friend@example.test',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:'2026-10-26T00:00:00Z'};
 const payload=Buffer.from(JSON.stringify({sub:user.id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
 let requests=0;
 await page.route('https://auth-test.invalid/**',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname.endsWith('/otp')){expect(route.request().postDataJSON().create_user).toBe(false);requests++;await route.fulfill({json:{}});}
 else if(url.pathname.endsWith('/verify')){await route.fulfill({json:{access_token:`e30.${payload}.test-signature`,refresh_token:'test-refresh-not-real',expires_in:3600,token_type:'bearer',user}});}
 else if(url.pathname.endsWith('/logout'))await route.fulfill({status:204});
 else if(url.pathname.endsWith('/user'))await route.fulfill({json:user});
 else await route.fulfill({status:400,json:{message:'unexpected test endpoint'}});
 });
 await page.goto('/#settings');await page.getByLabel('초대된 이메일').fill(user.email);await page.getByRole('button',{name:'로그인 링크 받기'}).click();await expect(page.getByRole('status')).toContainText('초대된 이메일이라면');
 await page.getByLabel('이메일 인증 코드 (메일에 코드가 있는 경우)').fill('123456');await page.getByRole('button',{name:'코드 확인',exact:true}).click();await expect(page.getByText(`로그인: ${user.email}`,{exact:true})).toBeVisible();
 await expect(page.getByText(/계좌 모드: 개인 로컬 데모/)).toBeVisible();await page.reload();await expect(page.getByText(`로그인: ${user.email}`,{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'로그아웃',exact:true}).click();await expect(page.getByLabel('초대된 이메일')).toBeVisible();expect(requests).toBe(1);
 await page.goto('/#portfolio');await expect(page.getByTestId('cash')).toHaveText('$100,000.00');
});
test('failed authentication never claims login success',async({page})=>{
 await page.route('https://auth-test.invalid/**',route=>route.fulfill({status:400,json:{error_code:'otp_expired',msg:'Code expired'}}));
 await page.goto('/#settings');await page.getByLabel('초대된 이메일').fill('friend@example.test');await page.getByRole('button',{name:'로그인 링크 받기'}).click();await expect(page.getByRole('alert')).toContainText('인증 요청을 완료하지 못했습니다');await expect(page.getByRole('button',{name:'로그아웃',exact:true})).toHaveCount(0);
});
test('magic-link callback opens settings and removes tokens from URL',async({page})=>{
 const user={id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',email:'callback@example.test',app_metadata:{},user_metadata:{},created_at:'2026-10-26T00:00:00Z'};
 const expires=Math.floor(Date.now()/1000)+3600;
 const payload=Buffer.from(JSON.stringify({sub:user.id,aud:'authenticated',role:'authenticated',exp:expires})).toString('base64url');
 await page.route('https://auth-test.invalid/**',route=>route.fulfill({json:user}));
 await page.goto(`/#access_token=e30.${payload}.test-signature&refresh_token=fake-test-refresh&token_type=bearer&expires_in=3600&expires_at=${expires}&type=magiclink`);
 await expect(page.getByText(`로그인: ${user.email}`,{exact:true})).toBeVisible();await expect(page).toHaveURL(/#settings$/);expect(page.url()).not.toContain('access_token');
});
test('expired magic link shows a clear failure without logging in',async({page})=>{
 await page.goto('/#error=access_denied&error_code=otp_expired&error_description=expired');
 await expect(page.getByRole('alert').filter({hasText:'로그인 링크를 확인하지 못했습니다'})).toBeVisible();
 await expect(page.getByRole('button',{name:'로그아웃',exact:true})).toHaveCount(0);await expect(page.getByLabel('초대된 이메일')).toBeVisible();
});
