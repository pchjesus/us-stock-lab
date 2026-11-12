import {useRef,useState,type KeyboardEvent} from 'react';
import {applyTrade,emptyAccount,valuation,type Account,type Trade} from './trading';
import {buildAnalysis} from './portfolioAnalysis';
import {AnalysisContent} from './PortfolioAnalysis';
import {formatDisplay} from './preferences';
import {HistoryPanel} from './performance/HistoryPanel';

const prices:Record<string,number>={AAPL:10000,VOO:5000};
const format=(v:number)=>formatDisplay(v,'USD');
function trade(account:Account,symbol:string,side:'buy'|'sell',quantity:number):Account {
 const t:Trade={id:'example-'+account.trades.length,symbol,side,quantity,price:prices[symbol],time:'2026-01-02T15:00:00Z'};
 return applyTrade(account,t);
}
function preset(kind:'diverse'|'focused'):Account {
 const start=emptyAccount();
 return kind==='focused'?trade(start,'AAPL','buy',700):trade(trade(start,'AAPL','buy',300),'VOO','buy',600);
}
const tabs=[['trade','가상 매매'],['allocation','포트폴리오 분석'],['performance','성과·위험 분석']] as const;
type Tab=typeof tabs[number][0];
export function ExperienceLab(){
 const [tab,setTab]=useState<Tab>('trade'),[account,setAccount]=useState<Account>(emptyAccount),[symbol,setSymbol]=useState('AAPL'),[quantity,setQuantity]=useState('1'),[status,setStatus]=useState(''),[selection,setSelection]=useState<'own'|'diverse'|'focused'>('own');const buttons=useRef<(HTMLButtonElement|null)[]>([]);
 const selected=selection==='own'?account:preset(selection);const summary=valuation(account,prices);
 function execute(side:'buy'|'sell'){try{if(!/^[1-9]\d*$/.test(quantity)||!Number.isSafeInteger(Number(quantity)))throw Error('수량은 1 이상의 정수여야 합니다.');setAccount(trade(account,symbol,side,Number(quantity)));setStatus(side==='buy'?'예시 매수 완료':'예시 매도 완료')}catch(e){setStatus(e instanceof Error?e.message:'처리할 수 없습니다.')}}
 function keys(e:KeyboardEvent<HTMLButtonElement>,i:number){const next=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(next===null)return;e.preventDefault();setTab(tabs[next][0]);buttons.current[next]?.focus()}
 return <div className="experience-lab"><h1>합성 데이터 체험실</h1><p>정해진 예시 가격과 합성 과거 자료를 사용합니다. 체험 내용은 이 화면의 메모리에만 남고 실제 계좌·원장·사용자 CSV에 반영되지 않습니다.</p><div className="detail-tabs" role="tablist" aria-label="체험 단계">{tabs.map(([id,label],i)=><button key={id} ref={el=>{buttons.current[i]=el}} role="tab" id={'experience-tab-'+id} aria-controls={'experience-panel-'+id} aria-selected={tab===id} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={e=>keys(e,i)}>{i+1}. {label}</button>)}</div>
 <section role="tabpanel" id="experience-panel-trade" aria-labelledby="experience-tab-trade" hidden={tab!=='trade'}><div className="panel"><h2>1. 가상 매매 체험</h2><p>예시 계좌 $100,000 · AAPL $100 · VOO $50. 가격과 데이터는 모두 합성입니다.</p><div className="pa-summary"><div>현금<strong data-testid="experience-cash">{format(account.cash)}</strong></div><div>보유 평가액<strong data-testid="experience-value">{format(summary.value)}</strong></div><div>총자산<strong>{format(summary.total)}</strong></div></div><p>AAPL 보유 <strong data-testid="experience-aapl">{account.holdings.AAPL?.quantity??0}주</strong> · VOO 보유 <strong>{account.holdings.VOO?.quantity??0}주</strong></p><div className="experience-controls"><label>예시 종목<select value={symbol} onChange={e=>setSymbol(e.target.value)}><option value="AAPL">AAPL · $100</option><option value="VOO">VOO · $50</option></select></label><label>예시 수량<input value={quantity} inputMode="numeric" onChange={e=>setQuantity(e.target.value)}/></label><button onClick={()=>execute('buy')}>예시 매수</button><button onClick={()=>execute('sell')}>예시 매도</button><button onClick={()=>{setAccount(emptyAccount());setStatus('예시 계좌 초기화 완료')}}>예시 초기화</button></div><p role="status">{status}</p><p>매수 시 현금이 줄고 보유수량이 늘어납니다. 같은 가격의 예시이므로 체결 직후 총자산은 변하지 않습니다.</p></div></section>
 <section role="tabpanel" id="experience-panel-allocation" aria-labelledby="experience-tab-allocation" hidden={tab!=='allocation'}>{<><div className="panel"><h2>2. 예시 포트폴리오 선택</h2><p>체험 계좌 또는 두 합성 예시를 선택하고 비중 변경 실험을 해보세요.</p><div className="experience-controls">{([['own','내 체험 계좌'],['diverse','분산형 예시'],['focused','집중형 예시']] as const).map(([id,label])=><button key={id} aria-pressed={selection===id} onClick={()=>setSelection(id)}>{label}</button>)}</div></div><AnalysisContent key={selection+JSON.stringify(selected)} demo data={buildAnalysis(selected,prices)} format={format} owner="체험 전용"/></>}</section>
 <section role="tabpanel" id="experience-panel-performance" aria-labelledby="experience-tab-performance" hidden={tab!=='performance'}>{<><div className="panel"><h2>3. 성과·위험 예시</h2><p>아래 지표는 정해진 합성 CSV를 기존 분석 엔진으로 계산한 결과입니다. TWR과 MDD의 해설을 펼쳐보세요.</p><a className="ui-link" href="#portfolio/analysis">내 분석실로 이동 →</a></div><HistoryPanel initialExample/></>}</section></div>;
}
