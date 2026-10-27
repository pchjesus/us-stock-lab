import {useEffect,useState} from 'react';
import {marketSession,serverMarketState,sessionText} from './marketHours';
import type {LoadedAccount} from './accountStore';
export function useMarketGate(view:{userId:string|null|undefined;loaded:LoadedAccount|null}){
 const [tick,setTick]=useState(0);
 useEffect(()=>{const update=()=>setTick(n=>n+1);const timer=setInterval(update,1000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};},[]);
 void tick;
 if(view.userId===null)return marketSession();
 const market=serverMarketState(view.loaded?.market,view.loaded?.receivedAt,performance.now());
 const now=new Date(market.serverNow?Date.parse(market.serverNow)+Math.max(0,performance.now()-(view.loaded?.receivedAt??performance.now())):Date.now());
 return sessionText(market,now);
}
