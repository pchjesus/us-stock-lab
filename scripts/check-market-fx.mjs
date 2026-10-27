// Public read-only Edge Function live smoke: never accesses accounts or privileged keys.
const endpoint='https://vveljtqmujdzkzmoncjx.supabase.co/functions/v1/market-fx';
const response=await fetch(endpoint,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
if(!response.ok)throw new Error('FX endpoint HTTP '+response.status);
const j=await response.json();
if(j.base!=='USD'||j.quote!=='KRW'||j.method!=='blended'||j.sourceName!=='Frankfurter'||j.sourceUrl!=='https://frankfurter.dev/'||typeof j.rateDecimal!=='string'||!/^\d+(\.\d+)?$/.test(j.rateDecimal)||Number(j.rateDecimal)<100||Number(j.rateDecimal)>10000)
 throw new Error('Invalid FX reference payload');
if(typeof j.observedOn!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(j.observedOn)||!Number.isFinite(Date.parse(j.fetchedAtUtc)))throw new Error('FX timestamp validation failure');
const age=Date.now()-Date.parse(j.observedOn+'T00:00:00Z');
if(age< -86400000||age>10*86400000)throw new Error('Stale FX reference');
console.log('FX read-only endpoint PASS · observedOn='+j.observedOn+' · provider='+j.sourceName);
