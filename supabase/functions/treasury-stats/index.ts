// US Treasury public FiscalData API, read-only. No service role or user data.
const root='https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
const paths={
 debt:'/v2/accounting/od/debt_to_penny?fields=record_date,tot_pub_debt_out_amt&sort=-record_date&page%5Bsize%5D=1',
 rates:'/v2/accounting/od/avg_interest_rates?fields=record_date,security_desc,security_type_desc,avg_interest_rate_amt&filter=security_type_desc:eq:Marketable&sort=-record_date&page%5Bsize%5D=80'
} as const;
const heads={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Content-Type':'application/json','Cache-Control':'public,max-age=3600'};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
let saved:{until:number;payload:unknown}|null=null;
let pending:Promise<unknown>|null=null;
function validDate(s:unknown){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&Date.parse(s)<Date.now()+86400000;}
async function pull(key:keyof typeof paths){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 try{
  const response=await fetch(root+paths[key],{headers:{Accept:'application/json'},signal:controller.signal});
  if(!response.ok)throw Error('treasury http '+response.status);
  const data:unknown=await response.json();
  if(!obj(data)||!Array.isArray(data.data)||!data.data.length)throw Error('empty');
  return data.data as unknown[];
 }finally{clearTimeout(timer);}
}
async function load(){
 const [debt,rates]=await Promise.all([pull('debt'),pull('rates')]);
 const first=debt[0];
 if(!obj(first)||!validDate(first.record_date)||typeof first.tot_pub_debt_out_amt!=='string'||!/^\d+(\.\d+)?$/.test(first.tot_pub_debt_out_amt))throw Error('debt schema');
 const rows=rates.filter(obj).filter(r=>validDate(r.record_date)&&typeof r.security_desc==='string'&&typeof r.avg_interest_rate_amt==='string'&&/^\d+(\.\d+)?$/.test(r.avg_interest_rate_amt));
 const latest=rows[0]?.record_date;
 if(typeof latest!=='string')throw Error('rates schema');
 const selected=rows.filter(r=>r.record_date===latest&&['Treasury Bills','Treasury Notes','Treasury Bonds','Total Marketable'].includes(String(r.security_desc))).map(r=>({name:r.security_desc,ratePct:r.avg_interest_rate_amt}));
 if(!selected.length)throw Error('missing marketable rates');
 return {provider:'US Treasury FiscalData',asOfDebt:first.record_date,debtUsd:first.tot_pub_debt_out_amt,asOfRates:latest,averageRates:selected,fetchedAtUtc:new Date().toISOString(),sourceUrl:'https://fiscaldata.treasury.gov/',note:'월간 미국 국채 평균 조달금리이며 시장의 10년물 국채수익률이 아닙니다.'};
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:heads});
 if(req.method!=='GET'||new URL(req.url).search)return new Response(JSON.stringify({error:'invalid_request'}),{status:405,headers:heads});
 if(saved&&Date.now()<saved.until)return new Response(JSON.stringify(saved.payload),{headers:heads});
 if(!pending)pending=load().finally(()=>{pending=null;});
 try{const payload=await pending;saved={payload,until:Date.now()+21600000};return new Response(JSON.stringify(payload),{headers:heads});}
 catch{return new Response(JSON.stringify({error:'treasury_unavailable'}),{status:503,headers:{...heads,'Cache-Control':'no-store'}});}
});
