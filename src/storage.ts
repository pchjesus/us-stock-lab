import { instruments } from './data';
export const watchKey='us-stock-lab.watchlist.v1';
export function readWatchlist():string[]{try{const raw:unknown=JSON.parse(localStorage.getItem(watchKey)??'[]');return Array.isArray(raw)?[...new Set(raw.filter((v):v is string=>typeof v==='string'&&instruments.some(s=>s.symbol===v)))]:[];}catch{return [];}}
