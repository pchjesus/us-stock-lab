import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {demoIndicators} from './marketInfo';
export type DisplayCurrency='USD'|'KRW';
export const displayFx=demoIndicators.find(i=>i.id==='usdkrw')!;
export const preferenceKey=(uid:string|null|undefined)=>'us-stock.preferences.v1.'+(uid??'local');
export function formatDisplay(cents:number,currency:DisplayCurrency){
 if(!Number.isSafeInteger(cents))return '표시 범위 초과';
 if(currency==='USD'){const n=BigInt(Math.abs(cents));return (cents<0?'-':'')+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0}).format(n/100n)+'.'+String(n%100n).padStart(2,'0');}
 const rate=displayFx.value;if(rate===null||!Number.isSafeInteger(rate)||rate<=0)return '환율 미제공';
 const absolute=BigInt(Math.abs(cents));const won=(absolute*BigInt(rate)+50n)/100n;
 return new Intl.NumberFormat('ko-KR',{style:'currency',currency:'KRW',maximumFractionDigits:0}).format(cents<0?-won:won);
}
export function displayCents(decimal:string){const [whole,fraction='00']=decimal.split('.');return Number(BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0')));}
const CurrencyContext=createContext({currency:'USD' as DisplayCurrency,setCurrency:(_v:DisplayCurrency)=>{},format:(c:number)=>formatDisplay(c,'USD'),error:'',ready:true});
export function CurrencyProvider({uid,children}:{uid:string|null|undefined;children:ReactNode}){
 const key=preferenceKey(uid);const [state,setState]=useState({key:'',currency:'USD' as DisplayCurrency});const [error,setError]=useState('');
 useEffect(()=>{setError('');try{const value=localStorage.getItem(key);if(value!==null&&value!=='USD'&&value!=='KRW')throw Error();setState({key,currency:value==='KRW'?'KRW':'USD'});}catch{setState({key,currency:'USD'});setError('표시 설정을 복원하지 못해 USD로 표시합니다.');}},[key]);
 useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key===key||e.key===null){const v=e.newValue;setState({key,currency:v==='KRW'?'KRW':'USD'});}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[key]);
 const currency=state.key===key?state.currency:'USD';function setCurrency(value:DisplayCurrency){if(uid===undefined){setError('인증 상태 확인 후 표시 설정을 변경하세요.');return;}try{localStorage.setItem(key,value);setState({key,currency:value});setError('');}catch{setError('표시 설정을 저장하지 못했습니다. 기존 통화를 유지합니다.');}}
 return <CurrencyContext.Provider value={{currency,setCurrency,format:c=>formatDisplay(c,currency),error,ready:uid!==undefined}}>{children}</CurrencyContext.Provider>;
}
export const useCurrency=()=>useContext(CurrencyContext);
export function DisplaySettings({collapsed,setCollapsed}:{collapsed:boolean;setCollapsed:(v:boolean)=>void}){const c=useCurrency();return <section className="panel display-settings"><h2>화면 설정</h2><label>기본 표시 통화<select aria-label="기본 표시 통화" disabled={!c.ready} value={c.currency} onChange={e=>c.setCurrency(e.target.value as DisplayCurrency)}><option value="USD">USD · 달러</option><option value="KRW">KRW · 원화</option></select></label><p>거래·원장은 USD 기준입니다. KRW는 합성 환율 1 USD = {displayFx.value?.toLocaleString()}원 표시용 환산이며 환율손익이 아닙니다.</p><label>사이드바 기본 상태<select aria-label="사이드바 기본 상태" value={collapsed?'collapsed':'expanded'} onChange={e=>setCollapsed(e.target.value==='collapsed')}><option value="expanded">펼침</option><option value="collapsed">접힘</option></select></label><button onClick={()=>window.dispatchEvent(new Event('start-tutorial'))}>사용 방법 다시 보기</button><small>표시 통화는 이 기기에 계정별로 저장됩니다. 기기 간 설정 동기화는 지원하지 않습니다.</small>{c.error&&<p role="alert">{c.error}</p>}</section>;}
