import {getAuthClient} from './auth';
import {cents,type ManualState} from './manualAccount';
import {analyzeTax,TAX_POLICY_VERSION,SETTLEMENT_VERSION,type TaxDocument} from './taxAnalysis';
export type TaxVersion={version:number;document:TaxDocument;request_id:string;account_id:string;created_at:string};
export class TaxDataError extends Error {constructor(public raw:unknown){super('세금 기록 응답 불일치 · 원본 보존');}}
export function decodeTaxVersions(raw:any,a:ManualState):TaxVersion[]{try{
 if(!Array.isArray(raw))throw Error('세금 기록 응답 형식 오류 · 원본 보존');let v=0;const ids=new Set();
 for(const r of raw){if(r.account_id!==a.id||r.policy_version!==TAX_POLICY_VERSION||r.calendar_version!==SETTLEMENT_VERSION||cents(r.version)!==++v||typeof r.request_id!=='string'||ids.has(r.request_id)||!Number.isFinite(Date.parse(r.created_at)))throw Error('세금 기록 버전/계좌 불일치 · 원본 보존');ids.add(r.request_id);analyzeTax(a,r.document,2026);}
 return raw;
}catch{throw new TaxDataError(raw);}}
async function client(uid:string){const c=getAuthClient();if(!c)throw Error('서버 연결 미설정');const s=await c.auth.getSession();if(s.error||s.data.session?.user.id!==uid)throw Error('세금 기록 인증 변경');return {c,jwt:s.data.session.access_token};}
export async function loadTax(uid:string,a:ManualState){const {c,jwt}=await client(uid);const r=await c.rpc('manual_tax_snapshot').setHeader('Authorization','Bearer '+jwt);if(r.error)throw Error('세금 기록 서버 미적용 또는 조회 실패');return decodeTaxVersions(r.data,a);}
export class TaxSaveError extends Error {constructor(message:string,public definitive=false){super(message);}}
export async function saveTax(uid:string,a:ManualState,requestId:string,version:number,document:TaxDocument){analyzeTax(a,document,2026);const {c,jwt}=await client(uid);const r=await c.rpc('manual_tax_save',{p_request_id:requestId,p_expected_version:version,p_document:document}).setHeader('Authorization','Bearer '+jwt);if(r.error){const known=r.error.code==='P0001'&&['tax_revision_conflict','invalid_tax_document','invalid_tax_fx','invalid_settlement','tax_fx_date_mismatch','tax_fee_date_mismatch','missing_tax_fx','reference_fx_not_tax','invalid_external_tax','duplicate_tax_year','duplicate_tax_order','tax_order_ownership','tax_document_limit'].includes(r.error.message);throw new TaxSaveError(known?'세금 저장 거절: '+r.error.message+' · 원본 초안 보존, 최신 버전을 조회해 재검토하세요.':'세금 기록 저장 미확정: '+r.error.message+' · 같은 저장 ID로 재확인하세요.',known);}const rows=decodeTaxVersions(r.data,a);if(!rows.some(r=>r.request_id===requestId&&JSON.stringify(r.document)===JSON.stringify(document))) {
 // jsonb key order is not stable; compare parsed content, not serialized key order.
 const row=rows.find(r=>r.request_id===requestId);if(!row||JSON.stringify(canonical(row.document))!==JSON.stringify(canonical(document)))throw Error('저장 영수증 불일치 · 같은 ID 보존');
 }return rows;}
function canonical(v:any):any {if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
