/** Read-only import contract. Flow is at period END; value is after that flow.
 * Optional returns are decimal holding-period returns (0.01 = 1%) for the same interval. */
export interface Observation {date:string;day:number;value:number;flow:number;benchmark:number|null;rf:number|null}
export interface History {currency:'USD'|'KRW';source:'user'|'synthetic';rows:Observation[]}
export type Metric={value:number;reason?:never}|{value:null;reason:string};
const missing=(reason:string):Metric=>({value:null,reason});
const metric=(v:number):Metric=>Number.isFinite(v)?{value:v}:missing('수치 범위를 벗어났습니다.');
const DAY=86400000;
function decimal(s:string,signed=true):number {
 if(!(signed?/^-?\d+(?:\.\d{1,2})?$/:/^\d+(?:\.\d{1,2})?$/).test(s))throw Error('평가액·현금흐름은 소수 둘째 자리까지의 금액이어야 합니다.');
 const negative=s.startsWith('-'),[a,b='']=s.replace('-','').split('.');const n=BigInt(a)*100n+BigInt(b.padEnd(2,'0'));if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('금액 범위 초과');return Number(negative?-n:n);
}
function rate(s:string):number|null {if(!s)return null;if(!/^-?(?:\d+)(?:\.\d+)?$/.test(s)||!Number.isFinite(Number(s))||Number(s)<-1||Number(s)>100)throw Error('구간 수익률은 -1~100 범위의 소수로 입력하세요.');return Number(s)}
export function parseHistory(text:string):History {
 if(text.length>2_000_000)throw Error('CSV는 2MB 이하만 지원합니다.');
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines[0]!=='date,currency,source,value,flow,benchmark_return,risk_free_return')throw Error('CSV 헤더가 안내된 계약과 다릅니다.');
 if(lines.length<3||lines.length>10002)throw Error('관측값은 2~10,000개가 필요합니다.');
 let currency='',source='';const rows:Observation[]=lines.slice(1).map((line,i)=>{
 const parts=line.split(',').map(s=>s.trim());if(parts.length!==7)throw Error('행 '+(i+2)+': 7개 열이 필요합니다. 쉼표 없는 숫자를 사용하세요.');
 const [date,c,s,v,f,b,rf]=parts;const day=Date.parse(date+'T00:00:00Z')/DAY;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(day)||new Date(day*DAY).toISOString().slice(0,10)!==date)throw Error('유효하지 않은 날짜: '+date);
 if(!['USD','KRW'].includes(c)||!['user','synthetic'].includes(s))throw Error('통화는 USD/KRW, source는 user/synthetic이어야 합니다.');
 if(i&&(c!==currency||s!==source))throw Error('서로 다른 통화나 실제 신고 자료·합성 자료를 혼합할 수 없습니다.');currency=c;source=s;
 return {date,day,value:decimal(v,false),flow:decimal(f),benchmark:rate(b),rf:rate(rf)};
 });
 rows.forEach((r,i)=>{if(i&&r.day<=rows[i-1].day)throw Error('날짜는 중복 없이 오름차순이어야 합니다.');if(i&&BigInt(r.value)-BigInt(r.flow)<0n)throw Error('입출금 전 평가액이 음수입니다. 현금흐름 시점을 확인하세요.');if(i&&BigInt(r.value)-BigInt(r.flow)>BigInt(Number.MAX_SAFE_INTEGER))throw Error('입출금 전 평가액 범위 초과');});
 let cumulative=BigInt(rows[0].value);for(const row of rows.slice(1)){cumulative+=BigInt(row.flow);if(cumulative>BigInt(Number.MAX_SAFE_INTEGER)||cumulative< -BigInt(Number.MAX_SAFE_INTEGER))throw Error('누적 순납입금 범위 초과');}
 if(rows[0].value<=0||rows[0].flow!==0||rows[0].benchmark!==null||rows[0].rf!==null)throw Error('첫 관측값은 양수 시작 평가액, flow=0, 선택 수익률은 빈칸이어야 합니다.');
 return {currency:currency as History['currency'],source:source as History['source'],rows};
}
const mean=(a:number[])=>a.reduce((s,v)=>s+v,0)/a.length;
const variance=(a:number[])=>{const m=mean(a);return a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)};
export function xirr(rows:Observation[]):Metric {
 const start=rows[0];const cash=rows.map((r,i)=>({t:(r.day-start.day)/365,c:i===0?-r.value:-r.flow+(i===rows.length-1?r.value:0)})).filter(r=>r.c!==0);
 const signs=cash.map(r=>Math.sign(r.c));const changes=signs.slice(1).reduce((n,s,i)=>n+(s!==signs[i]?1:0),0);
 if(changes!==1)return missing('현금흐름 부호가 여러 번 바뀌거나 회수액이 없어 XIRR의 유일성을 보장할 수 없습니다.');
 const scale=Math.max(...cash.map(r=>Math.abs(r.c)));const npv=(y:number)=>cash.reduce((s,r)=>s+(r.c/scale)*Math.exp(-y*r.t),0);
 let lo=-20,hi=20,a=npv(lo),b=npv(hi);if(!Number.isFinite(a)||!Number.isFinite(b)||a*b>0)return missing('지원 탐색 범위에서 XIRR 해를 찾지 못했습니다.');
 for(let i=0;i<200;i++){const mid=(lo+hi)/2,v=npv(mid);if(v*a>0){lo=mid;a=v}else hi=mid}
 const y=(lo+hi)/2;if(Math.abs(npv(y))>1e-8)return missing('XIRR 수렴을 검증하지 못했습니다.');return metric(Math.expm1(y));
}
export interface Performance {metrics:Record<string,Metric>;returns:number[];wealth:number[];drawdown:number[];benchmarkWealth:number[]|null;contributions:number[];regular:boolean}
export function analyze(history:History):Performance {
 const rows=history.rows,n=rows.length-1,years=(rows[n].day-rows[0].day)/365;
 const returns=rows.slice(1).map((r,i)=>rows[i].value>0?(r.value-r.flow)/rows[i].value-1:NaN);
 const valid=returns.every(Number.isFinite),wealth=[1],drawdown=[0],contributions=[rows[0].value];let peak=1;
 for(let i=0;i<n;i++){wealth.push(valid?wealth[i]*(1+returns[i]):NaN);peak=Math.max(peak,wealth[i+1]);drawdown.push(valid?wealth[i+1]/peak-1:NaN);contributions.push(contributions[i]+rows[i+1].flow)}
 const gap=rows[1].day-rows[0].day,regular=rows.slice(1).every((r,i)=>r.day-rows[i].day===gap),annual=365/gap;
 const enough=valid&&n>=2&&regular,why=!valid?'평가액 0 이후 구간 수익률을 계산할 수 없습니다.':!regular?'관측 간격이 달라 연환산 위험 지표를 제공하지 않습니다.':'최소 2개 구간 수익률이 필요합니다.';
 const m:Record<string,Metric>={CAGR:rows.slice(1).some(r=>r.flow!==0)?missing('외부 현금흐름이 있어 단순 CAGR을 제공하지 않습니다.'):metric((rows[n].value/rows[0].value)**(1/years)-1),TWR:valid?metric(wealth[n]-1):missing(why),XIRR:xirr(rows),MDD:valid?metric(Math.min(...drawdown)):missing(why)};
 m.Volatility=enough?metric(Math.sqrt(variance(returns)*annual)):missing(why);
 const benchmark=rows.slice(1).map(r=>r.benchmark),rf=rows.slice(1).map(r=>r.rf),haveBenchmark=benchmark.every(v=>v!==null),haveRf=rf.every(v=>v!==null);
 const excess=haveRf?returns.map((v,i)=>v-rf[i]!):[];
 const rfWhy=!haveRf?'모든 구간의 무위험수익률이 필요합니다.':why;
 const sd=enough&&haveRf?Math.sqrt(variance(excess)):0,down=enough&&haveRf?Math.sqrt(mean(excess.map(v=>Math.min(v,0)**2))):0;
 m.Sharpe=enough&&haveRf&&sd>0?metric(mean(excess)/sd*Math.sqrt(annual)):missing(sd===0&&enough&&haveRf?'초과수익률 표준편차가 0입니다.':rfWhy);
 m.Sortino=enough&&haveRf&&down>0?metric(mean(excess)/down*Math.sqrt(annual)):missing(down===0&&enough&&haveRf?'하방편차가 0입니다.':rfWhy);
 const mp=mean(returns),mb=haveBenchmark?mean(benchmark as number[]):0;const bm=benchmark as number[],active=haveBenchmark?returns.map((v,i)=>v-bm[i]):[],vb=enough&&haveBenchmark?variance(bm):0,vp=enough?variance(returns):0,cov=enough&&haveBenchmark?returns.reduce((s,v,i)=>s+(v-mp)*(bm[i]-mb),0)/(n-1):0;
 const bmWhy=!haveBenchmark?'모든 동일 구간의 벤치마크 수익률이 필요합니다.':why;
 m.Beta=enough&&haveBenchmark&&vb>0?metric(cov/vb):missing(enough&&haveBenchmark&&vb===0?'벤치마크 분산이 0입니다.':bmWhy);
 m.Correlation=enough&&haveBenchmark&&vb>0&&vp>0?metric(Math.max(-1,Math.min(1,cov/Math.sqrt(vb*vp)))):missing(enough&&haveBenchmark?'포트폴리오 또는 벤치마크 분산이 0입니다.':bmWhy);
 const te=enough&&haveBenchmark?Math.sqrt(variance(active)):0;
 m['Tracking Error']=enough&&haveBenchmark?metric(te*Math.sqrt(annual)):missing(bmWhy);
 m['Information Ratio']=enough&&haveBenchmark&&te>0?metric(mean(active)/te*Math.sqrt(annual)):missing(enough&&haveBenchmark&&te===0?'추적오차가 0입니다.':bmWhy);
 let benchmarkWealth:number[]|null=null;if(haveBenchmark){benchmarkWealth=[1];for(const b of bm)benchmarkWealth.push(benchmarkWealth.at(-1)!*(1+b));}
 return {metrics:m,returns,wealth,drawdown,benchmarkWealth,contributions,regular};
}
