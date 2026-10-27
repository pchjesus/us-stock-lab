import {useEffect,useMemo,useRef,useState} from 'react';
import {createChart,CandlestickSeries,LineSeries,HistogramSeries,ColorType} from 'lightweight-charts';
import {instruments} from './data';
import {chartRows} from './uiData';
import {movingAverage,wilderRsi} from './chartIndicators';

const colors:Record<number,string>={5:'#d58b21',20:'#238675',60:'#8053ae'};
export function syntheticVolume(index:number){return 120000+((index*7919+31415)%180000);}
export function ChartLab(){
 const [stage,setStage]=useState('초급'),[kind,setKind]=useState<'캔들'|'선'>('캔들'),[mas,setMas]=useState<number[]>([]),[rsi,setRsi]=useState(false),[selected,setSelected]=useState(0),[support,setSupport]=useState(''),[resistance,setResistance]=useState('');
 const price=useRef<HTMLDivElement>(null),osc=useRef<HTMLDivElement>(null);const rows=useMemo(()=>chartRows(instruments[0],'일'),[]);
 const averages=useMemo(()=>Object.fromEntries([5,20,60].map(n=>[n,movingAverage(rows.map(r=>r.close),n)])),[rows]);const rsis=useMemo(()=>wilderRsi(rows.map(r=>r.close)),[rows]);
 const activeMas=stage==='초급'?[]:mas,activeRsi=stage==='고급'&&rsi;
 useEffect(()=>{
  if(!price.current)return;
  const chart=createChart(price.current,{autoSize:true,height:360,layout:{background:{type:ColorType.Solid,color:'#fff'},textColor:'#687487',attributionLogo:true}});
  const series=kind==='캔들'?chart.addSeries(CandlestickSeries,{upColor:'#d94a53',downColor:'#3677d8',borderVisible:false}):chart.addSeries(LineSeries,{color:'#3169d9'});
  if(kind==='캔들')series.setData(rows);else series.setData(rows.map(r=>({time:r.time,value:r.close})));
  const volume=chart.addSeries(HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'volume'});volume.priceScale().applyOptions({scaleMargins:{top:.8,bottom:0}});volume.setData(rows.map((r,i)=>({time:r.time,value:syntheticVolume(i),color:r.close>=r.open?'#e4a6a9':'#a9bee5'})));
  for(const n of activeMas){const values=averages[n];chart.addSeries(LineSeries,{color:colors[n],lineWidth:2}).setData(rows.flatMap((r,i)=>values[i]===null?[]:[{time:r.time,value:values[i]!}]));}
  if(stage!=='초급')for(const [value,title] of [[support,'지지 후보'],[resistance,'저항 후보']]){const n=Number(value);if(value!==''&&Number.isFinite(n)&&n>0)series.createPriceLine({price:n,color:'#6b7280',lineWidth:1,lineStyle:2,axisLabelVisible:true,title});}
  chart.subscribeClick(p=>{if(p.time!==undefined){const i=rows.findIndex(r=>r.time===p.time);if(i>=0)setSelected(i);}});chart.timeScale().fitContent();return()=>chart.remove();
 },[kind,mas,stage,support,resistance,rows,averages]);
 useEffect(()=>{
  if(!activeRsi||!osc.current)return;const chart=createChart(osc.current,{autoSize:true,height:180,layout:{background:{type:ColorType.Solid,color:'#fff'},textColor:'#687487',attributionLogo:true}});
  const series=chart.addSeries(LineSeries,{color:'#8053ae',autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})});series.setData(rows.flatMap((r,i)=>rsis[i]===null?[]:[{time:r.time,value:rsis[i]!}]));for(const level of [30,70])series.createPriceLine({price:level,color:'#aab4c2',lineWidth:1,lineStyle:2,axisLabelVisible:true,title:''});chart.timeScale().fitContent();return()=>chart.remove();
 },[activeRsi,rows,rsis]);
 const bar=rows[selected];
 return <section className="panel" aria-label="차트 실습실"><h2>차트 실습실</h2><p>학습용 가상 차트 · 실제 주가 아님 · 가상 거래량</p><div className="learning-filters">{['초급','중급','고급'].map(s=><button key={s} aria-pressed={stage===s} onClick={()=>setStage(s)}>{s}</button>)}</div><p>{stage==='초급'?'시가·고가·저가·종가를 살펴보고 선과 캔들을 전환하세요. 종가가 시가 이상이면 양봉, 낮으면 음봉입니다. 거래량은 거래된 수량이지만 이 그래프는 가상 수치입니다. 가격과 거래량은 항상 같은 방향으로 움직이지 않습니다.':stage==='중급'?'종가의 최근 봉 평균을 켜고 가격과 비교하세요. 이동평균은 추세를 살피는 참고 자료지만 과거 값을 평균하므로 후행하며 교차가 방향을 보장하지 않습니다. 지지·저항 후보는 직접 선택한 가설입니다.':'이동평균과 RSI를 함께 살펴보세요. RSI는 0~100 사이의 상승·하락 강도입니다. 70 이상 과매수, 30 이하 과매도는 관행적 기준이며 강한 추세에서는 오래 유지되어 반전을 보장하지 않습니다.'}</p><div className="learning-filters">{(['캔들','선'] as const).map(k=><button key={k} aria-pressed={kind===k} onClick={()=>setKind(k)}>{k} 차트</button>)}</div><div ref={price} className="chart" role="img" aria-label={`학습용 가상 ${kind} 차트`}/><label>봉 선택 <input aria-label="봉 선택" type="range" min="0" max={rows.length-1} value={selected} onChange={e=>setSelected(Number(e.target.value))}/></label><p data-testid="selected-bar">{String(bar.time)} · 시가 {bar.open.toFixed(2)} · 고가 {bar.high.toFixed(2)} · 저가 {bar.low.toFixed(2)} · 종가 {bar.close.toFixed(2)} · {bar.close>=bar.open?'양봉':'음봉'} · 가상 거래량 {syntheticVolume(selected).toLocaleString('ko-KR')}</p>
 {stage!=='초급'&&<><div className="learning-filters">{[5,20,60].map(n=><button key={n} aria-pressed={mas.includes(n)} onClick={()=>setMas(m=>m.includes(n)?m.filter(x=>x!==n):[...m,n])}>{n}봉 이동평균</button>)}</div>{activeMas.map(n=><p key={n} data-testid={`sma-${n}`}><span style={{color:colors[n]}}>●</span> {n}봉 이동평균: {averages[n][selected]===null?'자료 부족':averages[n][selected]!.toFixed(2)}</p>)}<label>지지 후보 USD <input type="number" min="0" value={support} onChange={e=>setSupport(e.target.value)}/></label> <label>저항 후보 USD <input type="number" min="0" value={resistance} onChange={e=>setResistance(e.target.value)}/></label><p>후보선은 학습자가 입력한 가설이며 확정적인 매매 신호가 아닙니다.</p></>}
 {stage==='고급'&&<><button aria-pressed={rsi} onClick={()=>setRsi(v=>!v)}>RSI(14)</button>{activeRsi&&<><div ref={osc} className="chart" role="img" aria-label="학습용 가상 RSI 차트"/><p data-testid="rsi-value">RSI(14): {rsis[selected]===null?'자료 부족':rsis[selected]!.toFixed(2)}</p></>}</>}
 <p>직접 해보기: 봉을 선택해 가격과 지표가 어떻게 달라지는지 비교하세요. 합성 가격은 실제 시세나 수기 주문 가격이 아닙니다.</p></section>;
}
