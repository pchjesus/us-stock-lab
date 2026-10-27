// Explicitly invoked by test-server.py after SQL produced a synthetic snapshot.
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {decodeManual} from '../src/manualAccount';
test('real migrated SQL snapshot independently replays through the shipping client',()=>{
 const path=process.env.AUDIT_SNAPSHOT_PATH;if(!path)throw Error('Run python3 scripts/test-server.py to produce isolated SQL data');
 const raw=JSON.parse(readFileSync(path,'utf8'))[2],a=decodeManual(raw);expect(a.cash).toBe(10025000);expect(a.realized).toBe(25000);expect(a.holdings).toEqual({});expect(a.orders).toHaveLength(4);expect(a.feePolicy?.version).toBe(2);expect(a.revision).toBe(5);
});

test('both independently trading owners replay SQL trade/dividend/policy history',()=>{
 const rows=JSON.parse(readFileSync(process.env.AUDIT_SNAPSHOT_PATH!,'utf8'));const accounts=rows.slice(0,2).map(decodeManual);expect(accounts[0].id).not.toBe(accounts[1].id);for(const a of accounts){expect(a.dividends.length).toBeGreaterThan(0);expect(a.cash).toBe(Number(a.ledger.at(-1).balance_cents));expect(a.net).toBeGreaterThan(0);}
});
test('extreme SQL orders and dividends replay signed intermediate P/L without rounding loss',()=>{
 const raw=JSON.parse(readFileSync(process.env.AUDIT_SNAPSHOT_PATH!,'utf8'))[3],a=decodeManual(raw);
 expect(a.cash).toBe(35331003);expect(a.realized).toBe(-7649999974668997);expect(a.gross).toBe(9000000000000000);expect(a.net).toBe(7650000000000000);expect(a.holdings).toEqual({});
 expect(BigInt(a.cash)).toBe(10000000n+BigInt(a.realized)+BigInt(a.net));
});
