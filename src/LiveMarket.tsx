import {useEffect,useRef,useState} from 'react';
/**
 * TradingView-owned display-only widgets. Never scrape DOM/iframe or pass hosted
 * quotes into paper-order, account valuation, portfolio or backtesting logic.
 * Exchange licensing determines delays and embed availability per symbol.
 */
export const stockSymbols:Readonly<Record<string,string>>={
 AAPL:'NASDAQ:AAPL',MSFT:'NASDAQ:MSFT',NVDA:'NASDAQ:NVDA',AMZN:'NASDAQ:AMZN',
 GOOGL:'NASDAQ:GOOGL',VOO:'AMEX:VOO',QQQ:'NASDAQ:QQQ',SCHD:'AMEX:SCHD'
};
export const indexSymbols=[
 {name:'S&P 500',symbol:'SP:SPX',url:'https://www.tradingview.com/symbols/SPX/'},
 {name:'Nasdaq Composite',symbol:'NASDAQ:IXIC',url:'https://www.tradingview.com/symbols/NASDAQ-IXIC/'},
 {name:'Dow Jones',symbol:'DJ:DJI',url:'https://www.tradingview.com/symbols/DJ-DJI/'},
 {name:'KOSPI',symbol:'KRX:KOSPI',url:'https://www.tradingview.com/symbols/KRX-KOSPI/'},
 {name:'KOSDAQ',symbol:'KRX:KOSDAQ',url:'https://www.tradingview.com/symbols/KRX-KOSDAQ/'}
] as const;
type WidgetType='ticker-tape'|'market-overview'|'advanced-chart';
const scriptURLs:Record<WidgetType,string>={
 'ticker-tape':'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js',
 'market-overview':'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js',
 'advanced-chart':'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
};
export function HostedWidget({type,config,height}:{type:WidgetType;config:Record<string,unknown>;height:number}){
 const ref=useRef<HTMLDivElement>(null),[failed,setFailed]=useState(false);
 const options=JSON.stringify(config);
 useEffect(()=>{
  const root=ref.current;if(!root)return;
  setFailed(false);
  const widget=document.createElement('div');
  widget.className='tradingview-widget-container__widget';
  widget.style.cssText='height:100%;width:100%';
  const script=document.createElement('script');
  script.type='text/javascript';script.async=true;script.src=scriptURLs[type];
  script.textContent=options;
  script.onerror=()=>setFailed(true);
  root.replaceChildren(widget,script);
  return()=>{script.onerror=null;root.replaceChildren();};
 },[type,options]);
 return <div className="tv-host" ref={ref} data-testid={'tv-'+type} aria-label={'TradingView 외부 '+type+' 시세 위젯'} style={{height,width:'100%',minWidth:0}}>
  {failed&&<p role="alert">외부 시세 위젯을 불러오지 못했습니다. 아래 TradingView 원문에서 확인해 주세요.</p>}
 </div>;
}
const info=<p className="tv-source-note">실제 시장 참고자료 · TradingView 호스팅 위젯 · 거래소별 지연·표시 제한 가능. 시세 갱신시각은 위젯에서 확인하세요. 아래 가상 주문/수익률은 <strong>별도의 합성가격</strong> 기준이며 이 위젯의 가격으로 체결되지 않습니다.</p>;
export function LiveTickerTape(){
 return <section className="panel live-market" data-testid="live-stock-board"><div className="section-title"><h2>미국주식·ETF 실제 시세 참고</h2><span>외부 위젯 · 지연 가능</span></div>
  {info}
  <HostedWidget type="ticker-tape" height={115} config={{
   symbols:Object.values(stockSymbols).map(s=>({proName:s,title:s.split(':')[1]})),
   showSymbolLogo:true,colorTheme:'light',isTransparent:true,displayMode:'adaptive',locale:'ko'
  }}/>
  <p><a href="https://www.tradingview.com/markets/stocks-usa/" target="_blank" rel="noopener noreferrer">TradingView 미국 주식시장 열기 ↗</a> · 원본 시세를 추출하거나 별도 API로 재배포하지 않습니다.</p>
  <small>TradingView 제공 위젯 및 시세 표시. 로고·출처표시 유지.</small>
 </section>;
}
export function LiveIndicesBoard(){
 return <section className="panel live-market" data-testid="live-index-board"><div className="section-title"><h2>미국·한국 주요 지수</h2><span>TradingView 외부 시세 · 지연 가능</span></div>
 {info}
 <HostedWidget type="market-overview" height={480} config={{
   colorTheme:'light',dateRange:'1M',showChart:true,locale:'ko',width:'100%',height:'100%',isTransparent:true,showSymbolLogo:false,
   tabs:[
    {title:'미국 주요 지수',symbols:indexSymbols.slice(0,3).map(i=>({s:i.symbol,d:i.name}))},
    {title:'한국 주요 지수',symbols:indexSymbols.slice(3).map(i=>({s:i.symbol,d:i.name}))}
   ]
 }}/>
 <div className="tv-index-links">{indexSymbols.map(item=><a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer">{item.name} 원문 ↗</a>)}</div>
 <small>일부 지수는 거래소 정책 때문에 임베드에 제공되지 않을 수 있습니다. 위젯 오류 시 원문에서 확인하세요.</small>
 </section>;
}
export function LiveStockChart({symbol}:{symbol:string}){
 const tv=stockSymbols[symbol];
 const [open,setOpen]=useState(false);
 if(!tv)return null;
 return <section className="panel live-market" data-testid="live-stock-chart">
   <div className="section-title"><h2>실제 시장 차트 · {symbol}</h2><span>TradingView · 지연 가능</span></div>
   {info}
   <button aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'외부 차트 접기':'실제 시장 차트 보기'}</button>
   {open&&<HostedWidget type="advanced-chart" height={420} config={{
     autosize:true,symbol:tv,interval:'D',timezone:'America/New_York',theme:'light',style:'1',locale:'ko',
     allow_symbol_change:false,hide_side_toolbar:true,hide_top_toolbar:false,withdateranges:true,
     save_image:false,backgroundColor:'#ffffff',gridColor:'rgba(46, 46, 46, 0.06)'
   }}/>}
   <p><a href={'https://www.tradingview.com/symbols/'+tv.replace(':','-')+'/'} target="_blank" rel="noopener noreferrer">{symbol} TradingView 원본 시세 ↗</a> · 실제 차트와 합성 매매 차트는 별개입니다.</p>
 </section>;
}
