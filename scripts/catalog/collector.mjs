import {mkdir,readFile,writeFile,rm,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {SEC_SOURCE} from '../../src/catalog.ts';
import {inspectSecSnapshot} from './inspect.mjs';

export const MAX_BYTES=20*1024*1024, TIMEOUT_MS=15000, INTERVAL_MS=2000, MAX_ATTEMPTS=3, MIN_ROWS=1000;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fail(message){throw Error(message);}
export function validateUserAgent(value){
 const contact=typeof value==='string'?value.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/):null;
 const domain=contact?.[0].split('@')[1].toLowerCase();
 const reserved=domain&&/(?:^|\.)(?:example\.(?:com|org|net)|example|test|invalid|localhost)$/.test(domain);
 if(typeof value!=='string'||value.length>256||!contact||reserved||value.replace(contact[0],'').trim().length<2||/[^\x20-\x7e]/.test(value)||/\b(example\.(com|org|net|test)|localhost|invalid|your[-_. ]|placeholder|fake)\b/i.test(value))fail('Set SEC_USER_AGENT to an identifying organization or developer and a real contact email.');
 return value;
}
async function bodyBytes(response,limit,signal){
 const contentType=response.headers.get('content-type')||'';
 if(!/^\s*(application|text)\/(?:[\w.+-]*\+)?json\s*(?:;|$)/i.test(contentType))fail('Unexpected response content type');
 const encoding=response.headers.get('content-encoding');if(encoding&&encoding.toLowerCase()!=='identity')fail('Unexpected compressed response');
 const length=response.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>limit))fail('Invalid or oversized response length');
 if(!response.body)fail('Missing response body');
 const reader=response.body.getReader();const chunks=[];let total=0;
 const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
 try{while(true){let chunk;try{chunk=await reader.read();}catch{fail('Response interrupted');}const {value,done}=chunk;if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();fail('Response exceeds size limit');}chunks.push(value);}}finally{signal.removeEventListener('abort',cancel);reader.releaseLock();}
 if(length!==null&&total!==Number(length))fail('Incomplete response body');
 return Buffer.concat(chunks,total);
}
async function attempt(fetchImpl,userAgent,timeout,limit){
 const controller=new AbortController();let timer;
 const timed=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('SEC request timed out'));controller.abort();},timeout);});
 try{return await Promise.race([(async()=>{
  let response;try{response=await fetchImpl(SEC_SOURCE,{method:'GET',headers:{'user-agent':userAgent,'accept':'application/json','accept-encoding':'identity'},redirect:'manual',signal:controller.signal});}catch{fail('SEC network request failed');}
  if(response.status>=300&&response.status<400)fail('Redirect rejected');
  if(response.status===403||response.status===429)fail('SEC access denied or rate limited');
  if(response.status>=500&&response.status<=599){if(response.headers.has('retry-after'))fail('SEC requested a later retry');const error=Error('SEC server error');error.retryable=true;throw error;}
  if(!response.ok)fail('SEC request failed with HTTP '+response.status);
  return bodyBytes(response,limit,controller.signal);
 })(),timed]);}finally{clearTimeout(timer);controller.abort();}
}
async function waitForSlot(root,clock,delay,interval){
 const path=join(root,'.last-request');let previous=null;
 try{const value=await readFile(path,'utf8');if(!/^\d+$/.test(value))fail('Invalid request interval record');previous=Number(value);if(!Number.isSafeInteger(previous))fail('Invalid request interval record');}catch(error){if(error.code!=='ENOENT')throw error;}
 let now=clock();if(!Number.isSafeInteger(now))fail('Invalid clock');if(previous!==null&&previous>now)fail('System clock moved backwards');
 if(previous!==null&&now-previous<interval){await delay(interval-(now-previous));now=clock();if(now-previous<interval)fail('Request interval not elapsed');}
 const temporary=join(root,'.last-request-'+randomUUID());
 try{await writeFile(temporary,String(now),{flag:'wx',mode:0o600});await rename(temporary,path);}finally{await rm(temporary,{force:true});}
}
// Test seams are injected explicitly; the CLI always uses the fixed conservative defaults.
export async function collectSecSnapshot({root,userAgent,fetchImpl=fetch,clock=Date.now,delay=sleep,timeout=TIMEOUT_MS,interval=INTERVAL_MS,maxAttempts=MAX_ATTEMPTS,limit=MAX_BYTES,minRows=MIN_ROWS}){
 validateUserAgent(userAgent);if(!root)fail('Snapshot root is required');
 await mkdir(root,{recursive:true,mode:0o700});const lock=join(root,'.sec-ingest.lock');
 try{await mkdir(lock,{mode:0o700});}catch(error){if(error.code==='EEXIST')fail('Another collection is running or a stale lock requires inspection');throw error;}
 let created=null;
 try{
  let bytes;
  for(let n=0;n<maxAttempts;n++){
   await waitForSlot(root,clock,delay,interval);
   try{bytes=await attempt(fetchImpl,userAgent,timeout,limit);break;}catch(error){if(!error.retryable||n===maxAttempts-1)throw error;}
  }
  const checkedAt=new Date(clock()).toISOString().replace(/\.\d{3}Z$/,'Z');
  const inspected=inspectSecSnapshot(bytes,checkedAt,null);
  if(inspected.counts.input<minRows||inspected.counts.normalized<minRows)fail('SEC data is empty or unexpectedly incomplete');
  const catalog=json({entries:inspected.entries,counts:inspected.counts,issues:inspected.issues});
  const manifest={version:1,status:'candidate-unverified',sourceUrl:SEC_SOURCE,checkedAt,sourceAsOf:null,sha256:inspected.sha256,byteLength:inspected.byteLength,normalizedSha256:sha(catalog),counts:inspected.counts,validation:'schema-and-normalization-passed; listing-and-security-type-unverified'};
  const name=checkedAt.replace(/[:-]/g,'')+'-'+inspected.sha256;const destination=join(root,name);
  await mkdir(destination,{mode:0o700});created=destination;
  await writeFile(join(destination,'raw.json'),bytes,{flag:'wx',mode:0o600});
  await writeFile(join(destination,'catalog.json'),catalog,{flag:'wx',mode:0o600});
  // The manifest is written last and is the commit marker for readers.
  await writeFile(join(destination,'manifest.json'),json(manifest),{flag:'wx',mode:0o600});
  created=null;return {directory:destination,manifest};
 }finally{if(created)await rm(created,{recursive:true,force:true});await rm(lock,{recursive:true,force:true});}
}
export async function loadSecSnapshot(directory){
 const [manifestBytes,raw,catalog]=await Promise.all(['manifest.json','raw.json','catalog.json'].map(file=>readFile(join(directory,file))));
 let manifest;try{manifest=JSON.parse(manifestBytes.toString('utf8'));}catch{fail('Invalid snapshot manifest');}
 if(manifest.version!==1||manifest.status!=='candidate-unverified'||manifest.sourceUrl!==SEC_SOURCE||manifest.sourceAsOf!==null||manifest.validation!=='schema-and-normalization-passed; listing-and-security-type-unverified')fail('Invalid snapshot metadata');
 if(raw.length!==manifest.byteLength||sha(raw)!==manifest.sha256||sha(catalog)!==manifest.normalizedSha256)fail('Snapshot integrity mismatch');
 const inspected=inspectSecSnapshot(raw,manifest.checkedAt,manifest.sourceAsOf);
 const expected=json({entries:inspected.entries,counts:inspected.counts,issues:inspected.issues});
 if(!catalog.equals(expected)||JSON.stringify(manifest.counts)!==JSON.stringify(inspected.counts))fail('Snapshot normalization mismatch');
 return {manifest,entries:inspected.entries,issues:inspected.issues};
}
