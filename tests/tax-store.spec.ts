import {test,expect} from '@playwright/test';
import {decodeTaxVersions,TaxDataError} from '../src/taxStore';
import {decodeManual} from '../src/manualAccount';
import {fixture} from './manual-fixture';
import {emptyTaxDocument} from '../src/taxAnalysis';
test('tax history validates account/version/id and retains mismatched raw without mutation',()=>{
 const a=decodeManual(fixture()),raw=[{version:1,policy_version:'kr-overseas-2026-estimate-v1',calendar_version:'us-t1-conservative-2026-27-v1',request_id:'r1',account_id:a.id,document:emptyTaxDocument(),created_at:'2026-10-27T00:00:00Z'}],before=JSON.stringify(raw);expect(decodeTaxVersions(raw,a)).toBe(raw);
 for(const change of [(v:any)=>v[0].account_id='B',(v:any)=>v[0].version=2,(v:any)=>v.push({...v[0],version:2}),(v:any)=>v[0].document.policy='unknown',(v:any)=>v[0].created_at='bad']){const r=structuredClone(raw);change(r);try{decodeTaxVersions(r,a);throw Error('accepted invalid');}catch(e){expect(e).toBeInstanceOf(TaxDataError);expect((e as TaxDataError).raw).toBe(r);}}
 expect(JSON.stringify(raw)).toBe(before);
});
