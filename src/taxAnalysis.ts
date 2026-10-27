// Independent educational KRW layer. Never mutates USD orders, cash or dividend journal.
import calendar from './market-calendar.json' with {type:'json'};
import {newYorkDate,usdCentsToKrw} from './paperFinance';
import {cents,type ManualState} from './manualAccount';
export const TAX_POLICY_VERSION='kr-overseas-2026-estimate-v1';
export const SETTLEMENT_VERSION='us-t1-conservative-2026-27-v1';
export type CostPolicy='fifo-v1'|'average-v1';
export type FxEvidence={date:string;rate:string;kind:'base'|'cross';provider:string;url:string;checkedAt:string;status:'user_entered'|'document_reviewed'};
export type TaxRecord={orderId:string;confirmedSettlement:string|null;settlementSource:string;feeDate?:string;fx:FxEvidence;feeFx:FxEvidence};
export type ExternalTax={year:number;netKrw:number;usedDeductionKrw:number};
export type TaxDocument={inputClass:'user_supplied';policy:CostPolicy;records:TaxRecord[];external:ExternalTax[]};
export const emptyTaxDocument=():TaxDocument=>({inputClass:'user_supplied',policy:'fifo-v1',records:[],external:[]});
export function day(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('날짜 형식 오류');return s;}
export function settlement(filledAt:string){
 const tradeDate=newYorkDate(filledAt),y=tradeDate.slice(0,4),years:any=calendar.years;
 if(!years[y]||tradeDate<calendar.start||tradeDate>calendar.end) return {tradeDate,expected:null,version:SETTLEMENT_VERSION,reason:'지원 결제 달력 범위 밖'};
 // NYSE holidays + additional Federal Reserve banking holidays, conservatively estimated.
 // This is NOT a claim that exchange and DTCC settlement calendars are identical.
 const banks=['2026-10-12','2026-11-11','2027-10-11','2027-11-11'];let date=new Date(tradeDate+'T12:00:00Z');
 for(let i=0;i<12;i++){date.setUTCDate(date.getUTCDate()+1);const d=date.toISOString().slice(0,10),year=years[d.slice(0,4)];if(!year)return {tradeDate,expected:null,version:SETTLEMENT_VERSION,reason:'연말 이후 결제 일정 미확인'};if(![0,6].includes(date.getUTCDay())&&!year.holidays[d]&&!banks.includes(d))return {tradeDate,expected:d,version:SETTLEMENT_VERSION,reason:'T+1 보수적 예상 · 거래소/은행 휴일 합집합, 실제 명세 확인 필요'};}
 throw Error('결제일 산정 실패');
}
function safe(n:bigint){const x=Number(n);if(!Number.isSafeInteger(x))throw Error('원화 계산 범위 초과');return x;}
function allocate(cost:bigint,q:bigint,total:bigint){if(q<1n||q>total)throw Error('세금 원가 수량 오류');return (cost*q*2n+total)/(total*2n);}
function fxMoney(value:number,fx:FxEvidence,date:string,now:Date,warnings:string[]){
 if(!fx||day(fx.date)!==date||!['base','cross'].includes(fx.kind)||!fx.provider.trim()||!['user_entered','document_reviewed'].includes(fx.status))throw Error('결제/지출 기준일과 환율 기준일 불일치 또는 근거 누락');
 const u=new URL(fx.url);if(u.protocol!=='https:'||u.username||u.password)throw Error('환율 출처 HTTPS URL 필요');
 if(!/(Z|[+-]\d{2}:\d{2})$/.test(fx.checkedAt)||!Number.isFinite(Date.parse(fx.checkedAt))||Date.parse(fx.checkedAt)>now.getTime()+300000||new Date(fx.checkedAt).toISOString().slice(0,10)<date)throw Error('환율 확인시각 오류');
 if(now.getTime()-Date.parse(fx.checkedAt)>90*86400000)warnings.push('90일 이상 지난 출처 확인: 원문 재확인 필요');
 if(/frankfurter/i.test(fx.provider+' '+fx.url)||/synthetic|합성/i.test(fx.provider))throw Error('참고/합성 환율은 세금 환율로 사용할 수 없습니다.');
 return BigInt(usdCentsToKrw(value,fx.rate));
}
export type TaxSale={orderId:string;symbol:string;tradeDate:string;settlementDate:string;year:number;proceedsKrw:number;acquisitionKrw:number;sellFeesKrw:number;buyFeesKrw:number;netKrw:number;buyEvidenceIds:string[]};
export function assertTaxDocumentShape(doc:any):asserts doc is TaxDocument{
 if(!doc||doc.inputClass!=='user_supplied'||!['fifo-v1','average-v1'].includes(doc.policy)||!Array.isArray(doc.records)||!Array.isArray(doc.external))throw Error('세금 문서 형식 오류');
 for(const r of doc.records){if(!r||typeof r.orderId!=='string'||!(r.confirmedSettlement===null||typeof r.confirmedSettlement==='string')||typeof r.settlementSource!=='string'||r.feeDate!==undefined&&typeof r.feeDate!=='string')throw Error('거래 근거 형식 오류');for(const key of ['fx','feeFx']){if(!r[key]||!['date','rate','kind','provider','url','checkedAt','status'].every(k=>typeof r[key][k]==='string'))throw Error('환율 근거 형식 오류');}}
 for(const e of doc.external)if(!e||![e.year,e.netKrw,e.usedDeductionKrw].every(Number.isSafeInteger))throw Error('외부 세금 입력 형식 오류');
}
export function analyzeTax(a:ManualState,doc:TaxDocument,year:number,now=new Date()){
 assertTaxDocumentShape(doc);
 if(doc.inputClass!=='user_supplied'||!['fifo-v1','average-v1'].includes(doc.policy)||!Number.isInteger(year)||year<2026||year>2027||!Array.isArray(doc.records)||!Array.isArray(doc.external))throw Error('세금 정책/연도 형식 오류');
 const byId=new Map<string,TaxRecord>();for(const r of doc.records){if(byId.has(r.orderId)||!a.orders.some(o=>o.id===r.orderId))throw Error('중복/다른 계좌의 세금 거래 참조');byId.set(r.orderId,r);}
 const lots:Record<string,{quantity:bigint;cost:bigint;fee:bigint;ids:string[]}[]>={},rows:TaxSale[]=[],missing:string[]=[],warnings:string[]=[];let blocked=false;
 for(const o of a.orders){const s=settlement(o.filled_at),r=byId.get(o.id);if(!r){missing.push(o.id);blocked=true;continue;}try{
  const date=r.confirmedSettlement?day(r.confirmedSettlement):s.expected;if(!date)throw Error(s.reason);if(date<s.tradeDate)throw Error('확인 결제일이 거래일보다 빠릅니다.');if(r.confirmedSettlement&&!r.settlementSource.trim())throw Error('확인 결제일 명세 근거 필요');
  if(!r.confirmedSettlement)warnings.push(s.reason);else warnings.push('결제일 사용자 확인 · 서버가 명세를 인증하지 않음');
  const quantity=BigInt(cents(o.quantity)),value=cents(Number(BigInt(cents(o.price_cents))*quantity));
  const principal=fxMoney(value,r.fx,date,now,warnings),fee=fxMoney(cents(o.fee_cents),r.feeFx,r.feeDate?day(r.feeDate):date,now,warnings);let list=lots[o.symbol]??=[];
  if(o.side==='buy'){
   if(doc.policy==='average-v1'&&list.length){const l=list[0];l.quantity+=quantity;l.cost+=principal+fee;l.fee+=fee;l.ids.push(o.id);}else list.push({quantity,cost:principal+fee,fee,ids:[o.id]});
  }else{
   let left=quantity,basis=0n,buyFee=0n;const ids:string[]=[];for(const l of list){if(!left)break;const n=left<l.quantity?left:l.quantity,c=allocate(l.cost,n,l.quantity);basis+=c;const cf=allocate(l.fee,n,l.quantity);buyFee+=cf;l.fee-=cf;ids.push(...l.ids);l.quantity-=n;l.cost-=c;left-=n;}
   if(left)throw Error('매수 환율/취득원가 누락 또는 보유 초과');lots[o.symbol]=list.filter(l=>l.quantity>0n);
   rows.push({orderId:o.id,symbol:o.symbol,tradeDate:s.tradeDate,settlementDate:date,year:Number(date.slice(0,4)),proceedsKrw:safe(principal),acquisitionKrw:safe(basis),sellFeesKrw:safe(fee),buyFeesKrw:safe(buyFee),netKrw:safe(principal-basis-fee),buyEvidenceIds:[...new Set(ids)]});
  }
 }catch(e){missing.push(o.id);warnings.push(e instanceof Error?e.message:'거래 근거 오류');blocked=true;}}
 let ext=0n,used=0n;const extYears=new Set<number>();for(const e of doc.external){if(!Number.isInteger(e.year)||e.year<2026||e.year>2027||extYears.has(e.year))throw Error('외부 입력 연도 중복/오류');extYears.add(e.year);const n=BigInt(cents(e.netKrw,true)),d=BigInt(cents(e.usedDeductionKrw));if(d>2500000n)throw Error('외부 공제 사용액 초과');if(e.year===year){ext=n;used=d;}}
 const selected=rows.filter(r=>r.year===year);let gains=0n,losses=0n,fees=0n;for(const r of selected){const n=BigInt(r.netKrw);if(n>=0)gains+=n;else losses+=n;fees+=BigInt(r.sellFeesKrw)+BigInt(r.buyFeesKrw);}
 if(used>(ext>0n?ext:0n))throw Error('외부 공제 사용액은 입력한 외부 순이익 범위 이내여야 합니다.');
 const net=gains+losses+ext,available=2500000n-used,remaining=net-used,deduction=remaining>0n?(remaining<available?remaining:available):0n,taxable=remaining>deduction?remaining-deduction:0n,national=(taxable*20n+50n)/100n,local=(taxable*2n+50n)/100n;
 return {policy:doc.policy,version:TAX_POLICY_VERSION,rows,missing:[...new Set(missing)],warnings:[...new Set(warnings)],provisional:true,calculable:!blocked,year,gainsKrw:safe(gains),lossesKrw:safe(losses),recognizedFeesKrw:safe(fees),externalKrw:safe(ext),netKrw:safe(net),deductionUsedElsewhere:safe(used),deductionKrw:safe(deduction),taxableKrw:safe(taxable),nationalKrw:safe(national),localKrw:safe(local),taxKrw:safe(national+local)};
}
