// Read-only public daily FX reference. No user/finance table access or privileged keys.
// Deploy with verify_jwt=false ONLY for this harmless, public observation endpoint.
const upstream='https://api.frankfurter.dev/v2/rate/USD/KRW';
const origin='https://frankfurter.dev/';
type Reference={base:'USD';quote:'KRW';rateDecimal:string;observedOn:string;fetchedAtUtc:string;sourceName:'Frankfurter';sourceUrl:typeof origin;method:'blended'};
let cache:{value:Reference;until:number}|null=null;
let inFlight:Promise<Reference>|null=null;
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Vary':'Origin'};
function respond(body:unknown,status:number,ttl=0){
 return new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':ttl?'public, max-age='+ttl:'no-store'}});
}
async function retrieve():Promise<Reference>{
 const abort=new AbortController();
 const timer=setTimeout(()=>abort.abort(),7500);
 try {
  const response=await fetch(upstream,{signal:abort.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('upstream '+response.status);
  const data:unknown=await response.json();
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('format');
  const row=data as Record<string,unknown>;
  if(row.base!=='USD'||row.quote!=='KRW'||typeof row.date!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(row.date)
     ||typeof row.rate!=='number'||!Number.isFinite(row.rate)||row.rate<100||row.rate>10000)
    throw Error('invalid reference');
  const day=Date.parse(row.date+'T00:00:00Z'),now=Date.now();
  if(!Number.isFinite(day)||new Date(day).toISOString().slice(0,10)!==row.date||day>now+86400000||now-day>10*86400000)throw Error('stale date');
  return {base:'USD',quote:'KRW',rateDecimal:String(row.rate),observedOn:row.date,
    fetchedAtUtc:new Date().toISOString(),sourceName:'Frankfurter',sourceUrl:origin,method:'blended'};
 }finally{clearTimeout(timer);}
}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='GET')return respond({error:'method_not_allowed'},405);
 if(new URL(req.url).search)return respond({error:'query_not_supported'},400);
 const now=Date.now();
 if(cache&&now<cache.until)return respond(cache.value,200,3600);
 if(!inFlight)inFlight=retrieve().finally(()=>{inFlight=null;});
 try {
  const value=await inFlight;
  cache={value,until:Date.now()+6*60*60*1000};
  return respond(value,200,3600);
 }catch{
  // No silent substitution with synthetic or stale data.
  return respond({error:'fx_unavailable',message:'기준환율을 현재 확인할 수 없습니다.'},503);
 }
});
