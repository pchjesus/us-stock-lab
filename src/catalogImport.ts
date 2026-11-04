import {normalizeSec,SEC_SOURCE,type CatalogEntry} from './catalog.ts';
export const CATALOG_VALIDATION='schema-and-normalization-passed; listing-and-security-type-unverified';
export const IMPORT_MAX_BYTES=32*1024*1024,IMPORT_MAX_ENTRIES=50000;
export interface CatalogPayload {status:'candidate-unverified';validation:typeof CATALOG_VALIDATION;sourceUrl:string;checkedAt:string;sourceAsOf:null;rawSha256:string;counts:{input:number;normalized:number;excluded:number;held:number;duplicates:number};fixture:boolean;entries:CatalogEntry[]}
export interface LocalCatalog {version:1;kind:'us-stock-lab-local-catalog';payload:CatalogPayload;sha256:string}
export async function payloadHash(payload:unknown){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload))))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function parseCatalogImport(bytes:Uint8Array):Promise<LocalCatalog>{
 if(!bytes.length||bytes.byteLength>IMPORT_MAX_BYTES)throw Error('파일 크기는 32MiB 이하여야 합니다.');
 let data:any;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('올바른 UTF-8 JSON 파일이 아닙니다.');}
 const p=data?.payload;
 if(data?.version!==1||data.kind!=='us-stock-lab-local-catalog'||!p||p.status!=='candidate-unverified'||p.validation!==CATALOG_VALIDATION||typeof p.fixture!=='boolean'||p.sourceUrl!==SEC_SOURCE||p.sourceAsOf!==null||typeof p.rawSha256!=='string'||!/^[a-f0-9]{64}$/.test(data.sha256)||!Array.isArray(p.entries)||p.entries.length>IMPORT_MAX_ENTRIES)throw Error('카탈로그 형식 또는 메타데이터가 올바르지 않습니다.');
 if(!/^[a-f0-9]{64}$/.test(p.rawSha256))throw Error('원본 해시가 올바르지 않습니다.');
 const counts=p.counts;if(!counts||!['input','normalized','excluded','held','duplicates'].every(k=>Number.isSafeInteger(counts[k])&&counts[k]>=0)||counts.normalized!==p.entries.length||counts.input!==counts.normalized+counts.excluded+counts.held+counts.duplicates)throw Error('자료 건수가 일치하지 않습니다.');
 const rows=p.entries.map((e:any)=>{if(!e||typeof e.cik!=='string'||!/^\d{10}$/.test(e.cik)||Number(e.cik)<1)throw Error('CIK가 올바르지 않습니다.');return [Number(e.cik),e.name,e.symbol,e.exchange];});
 const normalized=normalizeSec({fields:['cik','name','ticker','exchange'],data:rows},p.checkedAt,null);
 if(normalized.entries.length!==p.entries.length||normalized.counts.held||normalized.counts.duplicates||normalized.counts.excluded)throw Error('중복 ID 또는 잘못된 후보가 있습니다.');
 const expected=new Map(normalized.entries.map(e=>[e.id,e]));
 for(const entry of p.entries){const e=expected.get(entry.id);if(!e||Object.keys(entry).length!==Object.keys(e).length||Object.entries(e).some(([k,v])=>entry[k]!==v))throw Error('후보의 거래 권한 또는 검증 상태가 올바르지 않습니다.');}
 if(await payloadHash(p)!==data.sha256)throw Error('파일 무결성 해시가 일치하지 않습니다.');
 return data as LocalCatalog;
}
export function catalogPage(entries:readonly CatalogEntry[],query:string,page:number){
 const q=query.trim().toLocaleUpperCase('en-US');if(!q)return {total:0,entries:[] as CatalogEntry[]};
 const buckets:CatalogEntry[][]=[[],[],[]];for(const e of entries){const s=e.symbol.toUpperCase();if(s===q)buckets[0].push(e);else if(s.includes(q))buckets[1].push(e);else if(e.name.toLocaleUpperCase('en-US').includes(q))buckets[2].push(e);}
 const all=buckets.flat();return {total:all.length,entries:all.slice(page*50,page*50+50)};
}
