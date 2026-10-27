/**
 * Read-only market observations. Never use these values as paper-order execution prices.
 * Provider HTTP, rates and freshness are independent from the USD-cent paper ledger.
 */
export type Freshness = 'daily_reference'|'end_of_day'|'delayed'|'realtime'|'stale'|'unknown';
export type ObservationStatus = 'verified'|'synthetic'|'pending'|'unavailable';
export interface SourceInfo {
  providerId:string;
  sourceName:string;
  sourceUrl:string;
  observedAtUtc:string;
  fetchedAtUtc:string;
  freshness:Freshness;
  status:ObservationStatus;
}
export interface FxReference extends SourceInfo {
  base:'USD';
  quote:'KRW';
  rateDecimal:string;
  observedOn:string;
  method:'blended';
}
export function fxEndpointConfig(enabled:unknown,baseUrl:unknown):string|null {
  if(enabled!=='true'||typeof baseUrl!=='string')return null;
  try {
    const url=new URL(baseUrl);
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')return null;
    if(!url.hostname.endsWith('.supabase.co'))return null;
    return url.origin+'/functions/v1/market-fx';
  }catch{return null;}
}
function record(value:unknown):value is Record<string,unknown> {
  return !!value&&typeof value==='object'&&!Array.isArray(value);
}
/** Reject malformed, future or implausible values rather than silently showing a fake quote. */
export function parseFxReference(value:unknown,now=new Date()):FxReference {
  if(!record(value))throw Error('환율 응답 형식 오류');
  const {base,quote,rateDecimal,observedOn,fetchedAtUtc,sourceName,sourceUrl,method}=value;
  if(base!=='USD'||quote!=='KRW'||method!=='blended'||sourceName!=='Frankfurter'||sourceUrl!=='https://frankfurter.dev/')
    throw Error('환율 공급자 검증 실패');
  if(typeof rateDecimal!=='string'||!/^\d{1,6}(\.\d{1,10})?$/.test(rateDecimal)||!Number.isFinite(Number(rateDecimal))||Number(rateDecimal)<100||Number(rateDecimal)>10000)
    throw Error('환율 값 검증 실패');
  if(typeof observedOn!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(observedOn)||new Date(observedOn+'T00:00:00Z').toISOString().slice(0,10)!==observedOn)
    throw Error('환율 기준일 오류');
  if(typeof fetchedAtUtc!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(fetchedAtUtc)||!Number.isFinite(Date.parse(fetchedAtUtc)))
    throw Error('환율 수집시각 오류');
  const observedMs=Date.parse(observedOn+'T00:00:00Z'),nowMs=now.getTime(),fetchedMs=Date.parse(fetchedAtUtc);
  if(!Number.isFinite(nowMs)||observedMs>nowMs+86_400_000||fetchedMs>nowMs+300_000||fetchedMs<observedMs)
    throw Error('환율 시간 검증 실패');
  const stale=nowMs-observedMs>10*86_400_000;
  return {
    base:'USD',quote:'KRW',rateDecimal,observedOn,method:'blended',
    providerId:'frankfurter-blended',sourceName:'Frankfurter',sourceUrl:'https://frankfurter.dev/',
    observedAtUtc:observedOn+'T00:00:00Z',fetchedAtUtc,
    freshness:stale?'stale':'daily_reference',status:stale?'unavailable':'verified'
  };
}
export async function fetchFxReference(endpoint:string,request:typeof fetch=fetch,now=new Date()):Promise<FxReference>{
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.pathname!=='/functions/v1/market-fx')
    throw Error('환율 서버 주소 오류');
  const result=await request(url.href,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!result.ok)throw Error('환율 서버 응답 오류 ('+result.status+')');
  return parseFxReference(await result.json(),now);
}
