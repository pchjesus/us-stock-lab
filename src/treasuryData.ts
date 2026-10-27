export type TreasuryStats={
 provider:'US Treasury FiscalData';asOfDebt:string;debtUsd:string;asOfRates:string;
 averageRates:{name:string;ratePct:string}[];fetchedAtUtc:string;sourceUrl:'https://fiscaldata.treasury.gov/';note:string
};
export function parseTreasuryStats(raw:unknown):TreasuryStats{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('재무부 데이터 오류');
 const v=raw as Record<string,unknown>;
 const date=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
 if(v.provider!=='US Treasury FiscalData'||v.sourceUrl!=='https://fiscaldata.treasury.gov/'||!date(v.asOfDebt)||!date(v.asOfRates)||typeof v.debtUsd!=='string'||!/^\d+(\.\d+)?$/.test(v.debtUsd)||!Array.isArray(v.averageRates)||!v.averageRates.length||v.averageRates.length>8||typeof v.fetchedAtUtc!=='string'||!Number.isFinite(Date.parse(v.fetchedAtUtc)))throw Error('재무부 데이터 검증 실패');
 const now=Date.now();
 if(Date.parse(v.asOfDebt as string)>now+86400000||Date.parse(v.asOfRates as string)>now+86400000||Date.parse(v.fetchedAtUtc as string)>now+300000)throw Error('재무부 기준시각 오류');
 const rates=(v.averageRates as unknown[]).map(r=>{
  if(!r||typeof r!=='object'||Array.isArray(r))throw Error('금리 형식 오류');
  const row=r as Record<string,unknown>;
  if(!['Treasury Bills','Treasury Notes','Treasury Bonds','Total Marketable'].includes(String(row.name))||typeof row.ratePct!=='string'||!/^\d{1,3}(\.\d+)?$/.test(row.ratePct)||Number(row.ratePct)>100)throw Error('금리 값 오류');
  return {name:String(row.name),ratePct:row.ratePct};
 });
 return {provider:'US Treasury FiscalData',sourceUrl:'https://fiscaldata.treasury.gov/',asOfDebt:v.asOfDebt as string,asOfRates:v.asOfRates as string,debtUsd:v.debtUsd,averageRates:rates,fetchedAtUtc:v.fetchedAtUtc,note:'월간 미국 국채 평균 조달금리이며 시장의 10년물 국채수익률이 아닙니다.'};
}
export async function fetchTreasuryStats(url:string):Promise<TreasuryStats>{
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||!parsed.hostname.endsWith('.supabase.co')||parsed.pathname!=='/functions/v1/treasury-stats')throw Error('재무부 조회 주소 오류');
 const r=await fetch(parsed.href,{signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('재무부 응답 실패');
 return parseTreasuryStats(await r.json());
}
