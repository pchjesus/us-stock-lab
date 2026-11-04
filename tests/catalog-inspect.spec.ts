import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectSecSnapshot} from '../scripts/catalog/inspect.mjs';

test('offline SEC snapshot binds original bytes and preserves conservative catalog contract',()=>{
 const bytes=readFileSync('tests/fixtures/catalog/sec-fixture.json'),time='2026-11-03T00:00:00Z';
 const a=inspectSecSnapshot(bytes,time),b=inspectSecSnapshot(bytes,time);
 expect(a).toEqual(b);expect(a.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
 expect(a.byteLength).toBe(bytes.length);expect(a.sourceAsOf).toBeNull();
 const dated=inspectSecSnapshot(bytes,time,'2026-10-31');expect(dated.sourceAsOf).toBe('2026-10-31');expect(dated.checkedAt).toBe(time);expect(dated.sha256).toBe(a.sha256);
 expect(a.counts).toEqual({input:12,normalized:7,excluded:2,held:2,duplicates:1});
 expect(a.entries.every((e:any)=>e.securityType==='unknown'&&e.listingStatus==='unverified'&&!e.tradeEligible)).toBe(true);
 expect(()=>inspectSecSnapshot(Buffer.from('{'),time)).toThrow();
 expect(()=>inspectSecSnapshot(Buffer.from('{"fields":["changed"],"data":[]}'),time)).toThrow();
});
