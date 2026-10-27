/** Educational indicators over chronological closing prices. Missing warm-up values are null. */
export function movingAverage(values: readonly number[], period: number): (number | null)[] {
 if (!Number.isInteger(period) || period < 1 || values.some(v => !Number.isFinite(v))) throw new Error('Invalid moving average input');
 let sum = 0;
 return values.map((value, index) => {
  sum += value;
  if (index >= period) sum -= values[index - period];
  return index + 1 >= period ? sum / period : null;
 });
}

/** Wilder RSI: the first value requires period price changes (period + 1 prices). */
export function wilderRsi(values: readonly number[], period = 14): (number | null)[] {
 if (!Number.isInteger(period) || period < 1 || values.some(v => !Number.isFinite(v))) throw new Error('Invalid RSI input');
 const result: (number | null)[] = values.map(() => null);
 if (values.length <= period) return result;
 let gain = 0, loss = 0;
 for (let i = 1; i <= period; i++) { const change = values[i] - values[i - 1]; gain += Math.max(change, 0); loss += Math.max(-change, 0); }
 gain /= period; loss /= period;
 const score = () => loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
 result[period] = score();
 for (let i = period + 1; i < values.length; i++) { const change = values[i] - values[i - 1]; gain = (gain * (period - 1) + Math.max(change, 0)) / period; loss = (loss * (period - 1) + Math.max(-change, 0)) / period; result[i] = score(); }
 return result;
}
