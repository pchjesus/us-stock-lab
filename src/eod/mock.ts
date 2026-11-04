/** Offline fictional fixtures only. Decimal strings are supplied explicitly, not parsed JSON numbers. */
import {normalizeEod,type Audience,type Calendar,type EodReadResult,type InputBar,type InstrumentIdentity,type LicenseRecord} from './core';
type Context={identity:InstrumentIdentity; calendar:Calendar; record:LicenseRecord|null; audience:Audience; now:string; expectedSession:string; fetchedAt:string; licenseRecordId:string; basis:InputBar['priceBasis']; adjustmentVersion:string};
type Obj=Record<string,unknown>;
const object=(v:unknown):v is Obj=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const fail=(reason:string):EodReadResult=>({status:'provider_error',reason,observation:null,lastKnown:null});
function bar(c:Context,date:string,close:unknown):InputBar {return {identity:c.identity,dataKind:'fixture',sessionDateET:date,closeDecimal:close as string,priceBasis:c.basis,adjustmentVersion:c.adjustmentVersion,feedScope:'offline-regular',sourceName:'fictional fixture',sourceUrl:null,observedAtUtc:null,fetchedAtUtc:c.fetchedAt,licenseRecordId:c.licenseRecordId,sessionType:'regular',continuity:'verified'}}
function run(c:Context,current:InputBar,previous:InputBar){return normalizeEod(current,previous,c.calendar,c.record,c.audience,c.now,c.expectedSession,c.identity)}
/** Two fictional daily summary objects with explicit session, exchange, basis and decimal string close. */
export function massiveMock(c:Context,current:unknown,previous:unknown):EodReadResult {
 const valid=(v:unknown):v is Obj=>object(v)&&v.status==='OK'&&v.symbol===c.identity.providerSymbol&&v.exchange===c.identity.exchange&&v.session==='regular'&&v.basis===c.basis&&v.adjustmentVersion===c.adjustmentVersion&&typeof v.date==='string'&&typeof v.close==='string';
 if(!valid(current)||!valid(previous))return fail('invalid_massive_fixture');
 return run(c,bar(c,current.date as string,current.close),bar(c,previous.date as string,previous.close));
}
/** Fictional TIME_SERIES_DAILY; only raw values, with independently trusted symbol and exchange mapping. */
export function alphaVantageMock(c:Context,payload:unknown):EodReadResult {
 if(!object(payload))return fail('invalid_response');
 if('Note' in payload)return fail('note');
 if('Information' in payload)return fail('information');
 if('Error Message' in payload)return fail('error');
 const meta=payload['Meta Data'],series=payload['Time Series (Daily)'];
 if(c.basis!=='raw'||!object(meta)||meta['2. Symbol']!==c.identity.providerSymbol||meta.exchange!==c.identity.exchange||!object(series))return fail('invalid_alpha_fixture');
 const dates=Object.keys(series).sort().reverse();
 if(dates.length<2||dates.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d+'T00:00:00Z'))||new Date(d+'T00:00:00Z').toISOString().slice(0,10)!==d||!object(series[d])||typeof (series[d] as Obj)['4. close']!=='string'))return fail('invalid_series');
 return run(c,bar(c,dates[0],(series[dates[0]] as Obj)['4. close']),bar(c,dates[1],(series[dates[1]] as Obj)['4. close']));
}
