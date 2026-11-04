import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {normalizeSec,searchCatalog,existingInstrument,normalizeSymbol} from '../src/catalog';
import {instruments} from '../src/data';
const fixture=JSON.parse(readFileSync('tests/fixtures/catalog/sec-fixture.json','utf8'));
const run=()=>normalizeSec(fixture,'2026-11-03T00:00:00Z',null);
test('deterministic normalization, classes, collisions and conservative classifications',()=>{
 const a=run();expect(JSON.stringify(a)).toBe(JSON.stringify(run()));expect(a.counts).toEqual({input:12,normalized:7,excluded:2,held:2,duplicates:1});
 expect(a.entries.filter(e=>e.cik==='0000000100').map(e=>e.symbol)).toEqual(['ABC.A','ABC.B']);
 expect(a.entries.some(e=>e.symbol==='CLASH')).toBe(false);expect(a.entries.every(e=>e.securityType==='unknown'&&e.listingStatus==='unverified'&&!e.tradeEligible)).toBe(true);
 expect(searchCatalog(a.entries,'abc.').map(e=>e.symbol)).toEqual(['ABC.A','ABC.B']);expect(searchCatalog(a.entries,'fixture adr')[0].symbol).toBe('ADR/X');expect(normalizeSymbol(' war-w ')).toBe('WAR-W');
});
test('reject missing or malformed source and keep existing trade contract separate',()=>{
 expect(()=>normalizeSec(null,'2026-11-03T00:00:00Z',null)).toThrow();expect(()=>normalizeSec({fields:[],data:[]},'2026-11-03T00:00:00Z',null)).toThrow();
 expect(instruments.map(i=>i.symbol)).toEqual(['AAPL','MSFT','NVDA','AMZN','GOOGL','VOO','QQQ','SCHD']);for(const i of instruments)expect(existingInstrument(i.symbol.toLowerCase())).toEqual(i);expect(existingInstrument('ABC.A')).toBeUndefined();
 expect(run().entries.every(e=>!('price' in e)&&!('candles' in e)&&!e.tradeEligible)).toBe(true);
});
