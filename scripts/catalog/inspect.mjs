import {createHash} from 'node:crypto';
import {normalizeSec,SEC_SOURCE} from '../../src/catalog.ts';

// This function has no filesystem or network side effects.
export function inspectSecSnapshot(bytes,checkedAt,sourceAsOf=null){
 if(!Buffer.isBuffer(bytes)||bytes.length===0)throw Error('Empty SEC input');
 let raw;
 try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('Invalid UTF-8 or JSON');}
 const result=normalizeSec(raw,checkedAt,sourceAsOf,{includeIssues:true});
 if(result.counts.input===0)throw Error('Empty SEC data');
 const sha256=createHash('sha256').update(bytes).digest('hex');
 return {sourceUrl:SEC_SOURCE,checkedAt,sourceAsOf,sha256,byteLength:bytes.length,counts:result.counts,issues:result.issues,entries:result.entries};
}
