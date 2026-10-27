import {useEffect,useRef,useState} from 'react';
import {createChart,CandlestickSeries,LineSeries,ColorType} from 'lightweight-charts';
import {instruments} from './data';
import {chartRows} from './uiData';
import {movingAverage,wilderRsi} from './chartIndicators';

export function ChartLab(){
 const [stage,setStage]=useState('초급'),[kind,setKind]=useState<'캔들'|'선'>('캔들'),[mas,setMas]=useState<number[]>([]),[rsi,setRsi]=useState(false);
 const price=useRef<HTMLDivElement>(null),osc=useRef<HTMLDivElement>(null);const rows=chartRows(instruments[0],'일');
 useEffect(()=>{
  if(!price.current)return;
  const chart=createChart(price.current,{autoSize:true,height:300,layout:{background:{type:ColorType.Solid,color:'#fff'},textColor:'#687487',attributionLogo:true}});
  if(kind==='캔들')chart.addSeries(CandlestickSeries,{upColor:'#d94a53',downColor:'#3677d8',borderVisible:false}).setData(rows);
  else chart.addSeries(LineSeries,{color:'#3169d9'}).setData(rows.map(r=>({time:r.time,value:r.close})));
  for(const n of mas){const values=movingAverage(rows.map(r=>r.close),n);chart.addSeries(LineSeries,{color:n===5?'#d58b21':n===20?'#46a38b':'#8f65bd',lineWidth:2}).setData(rows.flatMap((r,i)=>values[i]===null?[]:[{time:r.time,value:values[i]!}]));}
  chart.timeScale().fitContent();return()=>chart.remove();
 },[kind,mas]);
 useEffect(()=>{
  if(!rsi||!osc.current)return;const chart=createChart(osc.current,{autoSize:true,height:180,layout:{background:{type:ColorType.Solid,color:'#fff'},textColor:'#687487',attributionLogo:true}});
  const values=wilderRsi(rows.map(r=>r.close));const series=chart.addSeries(LineSeries,{color:'#8f65bd'});series.setData(rows.flatMap((r,i)=>values[i]===null?[]:[{time:r.time,value:values[i]!}]));for(const level of [30,70])series.createPriceLine({price:level,color:'#aab4c2',lineWidth:1,lineStyle:2,axisLabelVisible:true,title:''});chart.timeScale().fitContent();return()=>chart.remove();
 },[rsi]);
 return <section className="panel" aria-label="차트 실습실"><h2>차트 실습실</h2><p>학습용 가상 차트 · 실제 주가 아님</p><div className="learning-filters">{['초급','중급','고급'].map(s=><button key={s} aria-pressed={stage===s} onClick={()=>setStage(s)}>{s}</button>)}</div><p>{stage==='초급'?'캔들은 시가·고가·저가·종가를 보여줍니다. 양봉과 음봉은 시가와 종가를 비교합니다.':stage==='중급'?'이동평균은 최근 봉의 종가 평균입니다. 추세를 살피는 데 도움이 되지만 가격보다 늦게 반응합니다.':'RSI는 최근 상승과 하락의 상대적인 크기입니다. 30과 70은 참고 기준이며 반전을 보장하지 않습니다.'}</p><div className="learning-filters">{(['캔들','선'] as const).map(k=><button key={k} aria-pressed={kind===k} onClick={()=>setKind(k)}>{k} 차트</button>)}</div><div ref={price} className="chart" role="img" aria-label={`학습용 가상 ${kind} 차트`}/><div className="learning-filters">{[5,20,60].map(n=><button key={n} aria-pressed={mas.includes(n)} onClick={()=>setMas(m=>m.includes(n)?m.filter(x=>x!==n):[...m,n])}>{n}봉 이동평균</button>)}<button aria-pressed={rsi} onClick={()=>setRsi(v=>!v)}>RSI(14)</button></div>{rsi&&<div ref={osc} className="chart" role="img" aria-label="학습용 RSI 차트"/>}<p>합성 가격은 수기 주문 가격이나 실제 시세로 사용하지 않습니다.</p></section>;
}
