import {test,expect} from '@playwright/test';
import {movingAverage,wilderRsi} from '../src/chartIndicators';

test('SMA uses complete windows without changing its input',()=>{
 const values=Array.from({length:65},(_,i)=>i+1),before=values.slice();
 for(const period of [5,20,60]){const result=movingAverage(values,period);expect(result.slice(0,period-1)).toEqual(Array(period-1).fill(null));expect(result[period-1]).toBe((period+1)/2);expect(result[64]).toBe((65+(66-period))/2);}
 expect(values).toEqual(before);expect(movingAverage(values,20)).toEqual(movingAverage(values,20));
 for(const p of [0,-1,1.5])expect(()=>movingAverage(values,p)).toThrow();expect(()=>movingAverage([1,NaN],5)).toThrow();
});
test('Wilder RSI uses initial averages and recursive smoothing',()=>{
 const values=[44.34,44.09,44.15,43.61,44.33,44.83,45.10,45.42,45.84,46.08,45.89,46.03,45.61,46.28,46.28,46.00,46.03,46.41,46.22,45.64,46.21];const before=values.slice();const result=wilderRsi(values);
 expect(result.slice(0,14)).toEqual(Array(14).fill(null));expect(result[14]).toBeCloseTo(70.4641,3);expect(result[15]).toBeCloseTo(66.2496,3);expect(result[16]).toBeCloseTo(66.4809,3);expect(values).toEqual(before);
 expect(wilderRsi(Array.from({length:15},(_,i)=>i))[14]).toBe(100);expect(wilderRsi(Array.from({length:15},(_,i)=>15-i))[14]).toBe(0);expect(wilderRsi(Array(15).fill(10))[14]).toBe(50);expect(wilderRsi(Array(14).fill(1))).toEqual(Array(14).fill(null));
 expect(()=>wilderRsi([1,Infinity])).toThrow();expect(()=>wilderRsi([1],0)).toThrow();expect(wilderRsi(values)).toEqual(result);
});
