import {instruments} from './data';
export type LearningRoute={kind:'landing'}|{kind:'lessons'}|{kind:'lab';symbol:string}|{kind:'missing'};
export function resolveLearningRoute(route:string):LearningRoute{
 if(route==='learn')return {kind:'landing'};
 if(route==='learn/lessons')return {kind:'lessons'};
 if(route==='learn/lab')return {kind:'lab',symbol:instruments[0].symbol};
 const symbol=route.startsWith('learn/')?route.slice('learn/'.length):'';
 return instruments.some(stock=>stock.symbol===symbol)?{kind:'lab',symbol}:{kind:'missing'};
}
