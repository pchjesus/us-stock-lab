import type {Page} from '@playwright/test';
import {applyTrade,emptyAccount} from '../src/trading';
import {marketPrices,accountKey} from '../src/accountStore';
import {marketState} from '../src/marketHours';

export async function homeAuthFixture(page:Page,{hold=false,fail=false}={}){
 const users=['00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000012'].map((id,i)=>({id,aud:'authenticated',role:'authenticated',email:`home-${i}@example.invalid`,app_metadata:{},user_metadata:{},created_at:'2026-10-26T00:00:00Z'}));
 const sessions=users.map(user=>{const payload=Buffer.from(JSON.stringify({sub:user.id,aud:'authenticated',role:'authenticated',exp:2208988800})).toString('base64url');return {access_token:`e30.${payload}.test`,refresh_token:'fixture-refresh',expires_at:2208988800,expires_in:99999999,token_type:'bearer',user};});
 const accounts=[applyTrade(emptyAccount(),{id:'server-A',symbol:'AAPL',side:'buy',quantity:4,price:10000,time:'2026-10-27T14:00:00Z'}),applyTrade(emptyAccount(),{id:'server-B',symbol:'SCHD',side:'buy',quantity:6,price:2000,time:'2026-10-27T14:00:00Z'})];
 const watched=[['AAPL'],['SCHD']],calls:string[]=[];let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);const state={hold,fail};
 const local=JSON.stringify({version:1,generation:'home-auth-local',trades:[{id:'local-home',symbol:'VOO',side:'buy',quantity:1,price:10000,time:'2026-10-27T14:00:00Z'}]});
 await page.addInitScript(({session,local,accountKey})=>{if(!localStorage.getItem('home-auth-fixture-seeded')){localStorage.setItem('sb-auth-test-auth-token',JSON.stringify(session));localStorage.setItem(accountKey,local);localStorage.setItem('home-auth-fixture-seeded','true');}},{session:sessions[0],local,accountKey});
 await page.route('https://auth-test.invalid/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname;calls.push(path);const index=request.headers().authorization?.includes(sessions[1].access_token)?1:0;
  if(path.endsWith('/paper_snapshot')){if(state.hold)await held;if(state.fail)return route.fulfill({status:503,json:{message:'fixture snapshot unavailable'}});const a=accounts[index];return route.fulfill({json:{id:'home-'+index,cash:String(a.cash),realized:String(a.realized),positions:Object.entries(a.holdings).map(([symbol,h])=>({symbol,quantity:String(h.quantity),cost:String(h.cost)})),trades:a.trades,prices:marketPrices(),market:{...marketState(new Date('2026-10-27T14:00:00Z')),serverNow:'2026-10-27T14:00:00Z'}}});}
  if(path.endsWith('/user'))return route.fulfill({json:users[index]});
  if(path.endsWith('/logout'))return route.fulfill({status:204});
  if(path.endsWith('/otp'))return route.fulfill({json:{}});
  if(path.endsWith('/verify')){const selected=users.findIndex(u=>u.email===request.postDataJSON().email);return route.fulfill({json:sessions[selected<0?0:selected]});}
  if(path.includes('watchlist_items')){if(request.method()==='POST'){const body=request.postDataJSON();if(!watched[index].includes(body.symbol))watched[index].push(body.symbol);}if(request.method()==='DELETE'){const symbol=url.searchParams.get('symbol')?.replace(/^eq\./,'');watched[index]=watched[index].filter(s=>s!==symbol);}return route.fulfill({json:request.method()==='GET'?watched[index].map(symbol=>({symbol})):[]});}
  return route.fulfill({status:404,json:{message:'unexpected home fixture endpoint'}});
 });
 return {users,accounts,local,calls,watched,state,release:()=>{state.hold=false;release();}};
}
