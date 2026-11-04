/** Offline, process-local fixed-window accounting. No transport or persistence. */
export type Cost={requests:number;credits:number};
export type WindowLimit={durationMs:number;anchorMs:number;requests?:number;credits?:number};
export type Scope={provider:string;plan:string;credentialScope:string};
type Usage={window:number;requests:number;credits:number};
const integer=(n:number)=>Number.isSafeInteger(n)&&n>=0;
function costValid(c:Cost){return c&&integer(c.requests)&&integer(c.credits)&&c.requests>0}
function scopeKey(s:Scope){if(!s||![s.provider,s.plan,s.credentialScope].every(x=>typeof x==='string'&&x.trim().length>0))throw Error('invalid_scope');return JSON.stringify([s.provider,s.plan,s.credentialScope])}
/** One instance owns one immutable policy for a provider/plan/credential scope. */
export class Budget {
 private readonly key:string; private readonly limits:WindowLimit[]; private usage:Usage[]; private ids=new Set<string>(); private lastTime:number|null=null;
 constructor(scope:Scope,limits:WindowLimit[]){this.key=scopeKey(scope);if(!Array.isArray(limits)||!limits.length||limits.some(w=>!integer(w.durationMs)||w.durationMs===0||!Number.isSafeInteger(w.anchorMs)||(w.requests===undefined&&w.credits===undefined)||(w.requests!==undefined&&!integer(w.requests))||(w.credits!==undefined&&!integer(w.credits))))throw Error('invalid_policy');this.limits=limits.map(w=>({...w}));this.usage=limits.map(()=>({window:NaN,requests:0,credits:0}))}
 /** Synchronous check-and-reserve: a successful ID is consumed exactly once, even after failure. */
 reserve(scope:Scope,id:string,cost:Cost,nowMs:number):{ok:boolean;reason:string}{
  if(scopeKey(scope)!==this.key)throw Error('scope_mismatch');
  if(typeof id!=='string'||!id.trim()||!costValid(cost)||!Number.isSafeInteger(nowMs))throw Error('invalid_reservation');
  if(this.lastTime!==null&&nowMs<this.lastTime)throw Error('clock_regression');
  if(this.ids.has(id))return {ok:false,reason:'duplicate'};
  const next=this.limits.map((w,i)=>{const window=Math.floor((nowMs-w.anchorMs)/w.durationMs);const old=this.usage[i];return old.window===window?{...old}:{window,requests:0,credits:0}});
  for(let i=0;i<next.length;i++){const u=next[i],w=this.limits[i];if(!Number.isSafeInteger(u.requests+cost.requests)||!Number.isSafeInteger(u.credits+cost.credits))throw Error('overflow');if(w.requests!==undefined&&u.requests+cost.requests>w.requests)return {ok:false,reason:'requests_limit'};if(w.credits!==undefined&&u.credits+cost.credits>w.credits)return {ok:false,reason:'credits_limit'}}
  this.usage=next.map(u=>({...u,requests:u.requests+cost.requests,credits:u.credits+cost.credits}));this.lastTime=nowMs;this.ids.add(id);return {ok:true,reason:'reserved'};
 }
}
/** The caller chooses batching and credit units; no provider capability is implied. */
export function estimateWork(symbols:number,sessions:number,sessionsPerRequest:number,creditMode:'request'|'symbol',creditUnits:number,symbolsPerRequest=1):Cost {
 if(!integer(symbols)||symbols===0||!integer(sessions)||sessions===0||!integer(sessionsPerRequest)||sessionsPerRequest===0||!integer(creditUnits)||!integer(symbolsPerRequest)||symbolsPerRequest===0||!['request','symbol'].includes(creditMode))throw Error('invalid_plan');
 const batches=Math.ceil(sessions/sessionsPerRequest),requests=Math.ceil(symbols/symbolsPerRequest)*batches,credits=(creditMode==='request'?requests:symbols*batches)*creditUnits;
 if(!integer(requests)||!integer(credits))throw Error('overflow');return {requests,credits};
}
