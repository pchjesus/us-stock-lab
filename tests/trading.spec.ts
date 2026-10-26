import {test,expect} from '@playwright/test';
import {applyTrade,emptyAccount,averageText,simulate,valuation,parseQuantity,parseCents,allocatedCost,type Trade} from '../src/trading';
import {decodeAccount} from '../src/accountStore';
let id=0;
const trade=(side:'buy'|'sell',quantity:number,price:number):Trade=>({id:String(++id),symbol:'AAPL',side,quantity,price,time:'2026-10-26T00:00:00Z'});
test('weighted average, partial allocation, realized P&L and liquidation',()=>{
 let a=applyTrade(emptyAccount(),trade('buy',10,10000));a=applyTrade(a,trade('buy',5,8000));
 expect(a.holdings.AAPL).toEqual({quantity:15,cost:140000});expect(averageText(a.holdings.AAPL)).toBe('93.33');
 a=applyTrade(a,trade('sell',5,11000));expect(a.holdings.AAPL).toEqual({quantity:10,cost:93333});expect(a.realized).toBe(8333);
 a=applyTrade(a,trade('sell',10,11000));expect(a.holdings.AAPL).toBeUndefined();expect(a.realized).toBe(25000);expect(a.cash).toBe(10025000);
 expect(a.ledger.reduce((cash,e)=>cash+e.delta,10000000)).toBe(a.cash);expect(a.ledger.at(-1)?.balance).toBe(a.cash);
});
test('reject overdraft, oversell, duplicate and invalid values without mutation',()=>{
 const initial=emptyAccount();expect(()=>applyTrade(initial,trade('buy',1001,10000))).toThrow(/부족/);
 const t=trade('buy',10,10000);const a=applyTrade(initial,t);const before=JSON.stringify(a);
 expect(()=>applyTrade(a,t)).toThrow(/중복/);expect(()=>applyTrade(a,trade('sell',11,10000))).toThrow(/초과/);
 for(const invalid of [0,-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1]){
 expect(()=>applyTrade(a,trade('buy',invalid,10000))).toThrow();expect(()=>applyTrade(a,trade('buy',1,invalid))).toThrow();}
 expect(()=>applyTrade(a,trade('buy',2,Number.MAX_SAFE_INTEGER))).toThrow(/범위/);expect(JSON.stringify(a)).toBe(before);expect(initial.trades).toHaveLength(0);
 for(const text of ['','0','-1','1.5','NaN','Infinity','1e2',' 1'])expect(()=>parseQuantity(text)).toThrow();
 for(const text of ['','0','-1','1.001','NaN','Infinity','1e2'])expect(()=>parseCents(text)).toThrow();
 expect(parseCents('0.01')).toBe(1);expect(parseQuantity('10')).toBe(10);
});
test('marked asset conservation and simulator reuse without execution',()=>{
 let a=emptyAccount();a=applyTrade(a,trade('buy',10,10000));expect(valuation(a,{AAPL:10000}).total).toBe(10000000);
 expect(valuation(a,{AAPL:12000}).unrealized).toBe(20000);a=applyTrade(a,trade('sell',3,12000));
 const v=valuation(a,{AAPL:12000});expect(v.total).toBe(10020000);expect(v.profit).toBe(v.unrealized+v.realized);
 const before=JSON.stringify(a);const s=simulate({quantity:10,cost:100000},8000,5,10000);
 expect(averageText(s)).toBe('93.33');expect(s.needed).toBe(40000);expect(s.unrealized).toBe(10000);expect(JSON.stringify(a)).toBe(before);
 expect(allocatedCost(1,1,2)).toBe(1);expect(allocatedCost(0,1,1)).toBe(0);
});
test('restore by replay and reject corrupt account history',()=>{
 const t=trade('buy',2,10000);const doc={version:1,generation:'test',trades:[t]};const raw=JSON.stringify(doc);
 expect(decodeAccount(raw).account).toEqual(applyTrade(emptyAccount(),t));
 for(const invalid of ['bad','null','{}',JSON.stringify({...doc,version:9}),JSON.stringify({...doc,trades:[t,t]}),JSON.stringify({...doc,trades:[{...t,symbol:'UNKNOWN'}]}),JSON.stringify({...doc,trades:[{...t,quantity:-1}]}),JSON.stringify({...doc,trades:[trade('sell',1,10000)]})])expect(()=>decodeAccount(invalid)).toThrow(/손상/);
 expect(decodeAccount(null).account.cash).toBe(10000000);
});
