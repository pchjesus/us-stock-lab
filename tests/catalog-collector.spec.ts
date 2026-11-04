import {test,expect} from '@playwright/test';
import {readFile,mkdtemp,rm,writeFile,mkdir,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {collectSecSnapshot,loadSecSnapshot,validateUserAgent} from '../scripts/catalog/collector.mjs';
import {normalizeSec,SEC_SOURCE} from '../src/catalog';

const fixture=await readFile('tests/fixtures/catalog/sec-fixture.json');
const agent='Catalog Development research@real-domain.io'; // Fixture only; no network request is made.
const response=(body:Uint8Array=fixture,options:ResponseInit={})=>new Response(body,{...options,headers:{'content-type':'application/json',...options.headers}});
async function scratch(fn:(root:string)=>Promise<void>){const root=await mkdtemp(join(tmpdir(),'catalog-test-'));try{await fn(root);}finally{await rm(root,{recursive:true,force:true});}}
const options=(root:string,fetchImpl:any,extra:any={})=>({root,userAgent:agent,fetchImpl,minRows:1,interval:0,...extra});

test('fixture snapshots are immutable, attributable and independently verified',async()=>scratch(async root=>{
 let requested='';const result=await collectSecSnapshot(options(root,async(url:string,init:any)=>{requested=url;expect(init.redirect).toBe('manual');expect(init.headers['user-agent']).toBe(agent);return response();},{clock:()=>Date.parse('2026-11-03T00:00:00Z')}));
 expect(requested).toBe(SEC_SOURCE);expect(result.manifest.sourceAsOf).toBeNull();expect(result.manifest.checkedAt).toBe('2026-11-03T00:00:00Z');expect(result.manifest.counts).toEqual({input:12,normalized:7,excluded:2,held:2,duplicates:1});
 const snapshot=await loadSecSnapshot(result.directory);expect(snapshot.issues.map((i:any)=>i.reason)).toEqual(['candidate-id-conflict','candidate-id-conflict','duplicate','invalid-cik','invalid-symbol']);expect(snapshot.entries.every((e:any)=>e.tradeEligible===false&&e.listingStatus==='unverified'&&e.securityType==='unknown')).toBe(true);
 const old=await readFile(join(result.directory,'raw.json'));await expect(collectSecSnapshot(options(root,async()=>response(),{clock:()=>Date.parse('2026-11-03T00:00:00Z')}))).rejects.toThrow();expect(await readFile(join(result.directory,'raw.json'))).toEqual(old);
 await writeFile(join(result.directory,'raw.json'),'modified');await expect(loadSecSnapshot(result.directory)).rejects.toThrow('integrity');
}));

test('rate limiting retries only 5xx, waits between attempts, and never retries 403/429',async()=>{
 for(const status of [403,429])await scratch(async root=>{let calls=0;await expect(collectSecSnapshot(options(root,async()=>{calls++;return response(fixture,{status});}))).rejects.toThrow();expect(calls).toBe(1);});
 await scratch(async root=>{let calls=0;await expect(collectSecSnapshot(options(root,async()=>{calls++;return response(fixture,{status:503,headers:{'retry-after':'3600'}});}))).rejects.toThrow('later retry');expect(calls).toBe(1);});
 await scratch(async root=>{let now=100000,calls=0;const times:number[]=[];const opts=options(root,async()=>{times.push(now);calls++;return response(fixture,{status:calls<3?503:200});},{clock:()=>now,delay:async(ms:number)=>{now+=ms;},interval:2000});await collectSecSnapshot(opts);expect(times).toEqual([100000,102000,104000]);});
 await scratch(async root=>{let now=100000;const times:number[]=[];const opts=options(root,async()=>{times.push(now);return response();},{clock:()=>now,delay:async(ms:number)=>{now+=ms;},interval:2000});await collectSecSnapshot(opts);await collectSecSnapshot(opts);expect(times).toEqual([100000,102000]);});
 await scratch(async root=>{let calls=0,now=100000;await expect(collectSecSnapshot(options(root,async()=>{calls++;return response(fixture,{status:503});},{clock:()=>now,delay:async(ms:number)=>{now+=ms;},interval:2000}))).rejects.toThrow('server error');expect(calls).toBe(3);});
});

test('loader rejects uncommitted directories and forged normalized output even with a matching hash',async()=>scratch(async root=>{
 const incomplete=join(root,'incomplete');await mkdir(incomplete);await writeFile(join(incomplete,'raw.json'),fixture);await expect(loadSecSnapshot(incomplete)).rejects.toThrow();
 const snapshot=await collectSecSnapshot(options(root,async()=>response()));const catalogPath=join(snapshot.directory,'catalog.json'),manifestPath=join(snapshot.directory,'manifest.json');
 const catalog=JSON.parse(await readFile(catalogPath,'utf8'));catalog.entries[0].tradeEligible=true;const forged=Buffer.from(JSON.stringify(catalog,null,2)+'\n');await writeFile(catalogPath,forged);
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));manifest.normalizedSha256=createHash('sha256').update(forged).digest('hex');await writeFile(manifestPath,JSON.stringify(manifest));
 await expect(loadSecSnapshot(snapshot.directory)).rejects.toThrow('normalization mismatch');
}));

test('concurrent collectors do not send overlapping requests or disturb a committed snapshot',async()=>scratch(async root=>{
 let begin!:()=>void,release!:()=>void,calls=0;const started=new Promise<void>(r=>begin=r),held=new Promise<void>(r=>release=r);
 const fake=async()=>{calls++;begin();await held;return response();};const first=collectSecSnapshot(options(root,fake));await started;
 await expect(collectSecSnapshot(options(root,fake))).rejects.toThrow('lock');release();const result=await first;
 expect(calls).toBe(1);expect((await loadSecSnapshot(result.directory)).manifest.sha256).toBe(result.manifest.sha256);
}));

test('a stalled response body is cancelled on timeout and a short snapshot fails the production threshold',async()=>scratch(async root=>{
 let cancelled=false;
 const stalled=async()=>new Response(new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelled=true;}}),{headers:{'content-type':'application/json'}});
 await expect(collectSecSnapshot(options(root,stalled,{timeout:50}))).rejects.toThrow('timed out');expect(cancelled).toBe(true);
 await expect(collectSecSnapshot(options(root,async()=>response(),{minRows:1000}))).rejects.toThrow('unexpectedly incomplete');
 const invalidRows={fields:['cik','name','ticker','exchange'],data:[...Array.from({length:1000},()=>[0,'invalid','A','NYSE']),[1,'valid','ONE','NYSE']]};
 await expect(collectSecSnapshot(options(root,async()=>response(Buffer.from(JSON.stringify(invalidRows))),{minRows:1000}))).rejects.toThrow('unexpectedly incomplete');
 expect((await readdir(root)).filter(n=>!n.startsWith('.'))).toEqual([]);
}));

test('bad, incomplete or unsafe responses cannot replace a successful snapshot',async()=>scratch(async root=>{
 let tick=Date.parse('2026-11-03T00:00:00Z');const ok=await collectSecSnapshot(options(root,async()=>response(),{clock:()=>tick++}));const manifest=await readFile(join(ok.directory,'manifest.json'));
 const invalid=[
  async()=>response(Buffer.from('{')),
  async()=>response(Buffer.from('{"fields":["changed"],"data":[]}')),
  async()=>response(Buffer.from('{"fields":["cik","name","ticker","exchange"],"data":[]}')),
  async()=>response(fixture,{status:302,headers:{location:'https://evil.invalid/'}}),
  async()=>response(fixture,{status:301,headers:{location:SEC_SOURCE}}),
  async()=>response(fixture,{headers:{'content-length':String(fixture.length+10)}}),
  async()=>response(fixture,{headers:{'content-length':'99999999'}}),
  async()=>response(Buffer.alloc(100),{headers:{'content-type':'text/html'}}),
  async()=>response(Buffer.alloc(100)),
  async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([123]));c.error(Error('interrupted'));}}),{headers:{'content-type':'application/json'}}),
  async()=>new Promise(()=>{})
 ];
 const messages=['Invalid UTF-8 or JSON','Invalid SEC schema','Empty SEC data','Redirect rejected','Redirect rejected','Incomplete response body','Invalid or oversized response length','Unexpected response content type','Response exceeds size limit','Response interrupted','timed out'];
 for(const [i,fake] of invalid.entries()){await expect(collectSecSnapshot(options(root,fake,{clock:()=>tick++,limit:i===8?80:20*1024*1024,timeout:50}))).rejects.toThrow(messages[i]);expect(await readFile(join(ok.directory,'manifest.json'))).toEqual(manifest);}
 expect((await loadSecSnapshot(ok.directory)).manifest.sha256).toBe(ok.manifest.sha256);expect((await readdir(root)).filter(n=>n.endsWith('.lock'))).toHaveLength(0);
}));

test('identity and lock fail closed before fetching, and invalid rows have explicit reasons',async()=>{
 for(const value of [undefined,'','Test example@example.com','Fake x@domain.io','person@localhost','person@sample.invalid','person@real-domain.io','Lab user@sample.test','Lab user@sample.example','Lab user@sub.example.org'])expect(()=>validateUserAgent(value)).toThrow('SEC_USER_AGENT');
 await scratch(async root=>{let calls=0;await expect(collectSecSnapshot({...options(root,async()=>{calls++;return response();}),userAgent:'Lab user@sample.test'})).rejects.toThrow('SEC_USER_AGENT');expect(calls).toBe(0);expect(await readdir(root)).toEqual([]);});
 await scratch(async root=>{await mkdir(join(root,'.sec-ingest.lock'));let calls=0;await expect(collectSecSnapshot(options(root,async()=>{calls++;return response();}))).rejects.toThrow('lock');expect(calls).toBe(0);});
 const raw={fields:['cik','name','ticker','exchange'],data:[[0,'Bad','A','NYSE'],[1,'Bad','A','NYSE!'],[2,'Bad','BAD SYMBOL','NYSE'],[9,'Bad\u0000name','B','NYSE'],[3,'Class A','ABC.A','NYSE'],[3,'Class B','ABC-B','NYSE'],[4,'One','SAME','NYSE'],[5,'Two','SAME','Nasdaq']]};
 const got=normalizeSec(raw,'2026-11-03T00:00:00Z',null,{includeIssues:true});expect(got.issues?.map(i=>i.reason)).toEqual(['invalid-cik','invalid-exchange','invalid-symbol','invalid-name']);expect(got.entries.map(e=>e.id)).toEqual(['NASDAQ:SAME','NYSE:ABC-B','NYSE:ABC.A','NYSE:SAME']);expect(got.entries.every(e=>!e.tradeEligible)).toBe(true);
 expect(()=>normalizeSec(raw,'2026-02-30T00:00:00Z',null)).toThrow();expect(()=>normalizeSec(raw,'2026-11-03T00:00:00Z','2026-02-30')).toThrow();
});
