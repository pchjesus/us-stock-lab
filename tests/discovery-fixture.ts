import {normalizeSec,SEC_SOURCE} from '../src/catalog';
import {CATALOG_VALIDATION,payloadHash} from '../src/catalogImport';
export async function discoveryFixture(size=6){
 const rows:any[]=[[123,'Fixture conflicting Apple','AAPL','NYSE'],[100,'Fixture Class A','ABC.A','NYSE'],[100,'Fixture Class B','ABC-B','NYSE'],[200,'Fixture alternate venue','AAPL','Nasdaq'],[201,'Fixture name AAPL','ZZZ','NYSE'],[202,'Fixture partial','AAPLX','NYSE']];
 for(let i=rows.length;i<size;i++)rows.push([i+1000,'Fixture company '+i,'FIX'+i,'Nasdaq']);
 const checkedAt='2026-11-03T00:00:00Z',result=normalizeSec({fields:['cik','name','ticker','exchange'],data:rows},checkedAt,null);
 const payload={status:'candidate-unverified',validation:CATALOG_VALIDATION,sourceUrl:SEC_SOURCE,checkedAt,sourceAsOf:null,rawSha256:'a'.repeat(64),counts:result.counts,fixture:true,entries:result.entries};
 return {version:1,kind:'us-stock-lab-local-catalog',payload,sha256:await payloadHash(payload)};
}
