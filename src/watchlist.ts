import {useEffect,useRef,useState} from 'react';
import {getAuthClient} from './auth';
import {readWatchlist,watchKey} from './storage';
export function useWatchlist(uid:string|null|undefined){
 const [value,setValue]=useState<string[]>([]),[owner,setOwner]=useState<typeof uid>(undefined),[error,setError]=useState('');const current=useRef(uid);current.current=uid;const busy=useRef(false);
 useEffect(()=>{let alive=true;setError('');async function load(){try{if(uid===undefined)return;let next:string[];if(uid){const r=await getAuthClient()!.from('watchlist_items').select('symbol');if(r.error)throw r.error;next=r.data.map(x=>x.symbol);}else next=readWatchlist();if(alive){setValue(next);setOwner(uid);}}catch{if(alive)setError('관심종목을 불러오지 못했습니다.');}}void load();const storage=()=>void load();window.addEventListener('focus',storage);window.addEventListener('storage',storage);return()=>{alive=false;window.removeEventListener('focus',storage);window.removeEventListener('storage',storage);};},[uid]);
 async function toggle(symbol:string){if(uid===undefined||busy.current)return;busy.current=true;const next=value.includes(symbol)?value.filter(s=>s!==symbol):[...value,symbol];try{if(uid){const c=getAuthClient()!;const r=value.includes(symbol)?await c.from('watchlist_items').delete().eq('user_id',uid).eq('symbol',symbol):await c.from('watchlist_items').upsert({user_id:uid,symbol});if(r.error)throw r.error;}else localStorage.setItem(watchKey,JSON.stringify(next));if(current.current===uid){setValue(next);setOwner(uid);setError('');}}catch{if(current.current===uid)setError('관심종목을 저장하지 못했습니다. 연결·저장 공간을 확인하세요.');}finally{busy.current=false;}}
 return {watch:owner===uid?value:[],toggle,error};
}
