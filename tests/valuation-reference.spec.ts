import {test,expect} from '@playwright/test';
import {snapshotMeta,valuationSnapshots,valuationDisplay,validatedValuationSnapshot,valuationMetricDescriptions} from '../src/valuationSnapshots';
import {companyProfiles} from '../src/companyProfiles';
import {instruments} from '../src/data';

const symbols=['AAPL','MSFT','NVDA','AMZN','GOOGL'] as const;
test('five companies have explicitly sourced dated reference ratios; ETFs and arbitrary symbols do not',()=>{
 expect(Object.keys(valuationSnapshots).sort()).toEqual([...symbols].sort());
 for(const symbol of symbols){
  const s=validatedValuationSnapshot(symbol);
  expect(s).not.toBeNull();
  expect(s!.company.source).toBe('https://stockanalysis.com/stocks/'+symbol.toLowerCase()+'/statistics/');
  expect(s!.industry.firms).toBeGreaterThan(1);
  expect(s!.industry.groupKind).toBe('illustrative-sector-match');
  for(const key of ['per','pbr','roe'] as const){
   expect(Number.isFinite(s!.company[key]!)).toBe(true);
   expect(Number.isFinite(s!.industry[key]!)).toBe(true);
   expect(valuationDisplay(key,s!.company[key])).not.toBe('미제공');
   expect(valuationMetricDescriptions[key].description.length).toBeGreaterThan(35);
  }
 }
 expect(companyProfiles.map(p=>p.symbol).sort()).toEqual([...symbols].sort());
 expect(instruments.filter(x=>x.kind==='ETF').map(x=>validatedValuationSnapshot(x.symbol))).toEqual([null,null,null]);
 expect(validatedValuationSnapshot('__proto__')).toBeNull();
 expect(validatedValuationSnapshot('AAPL/../NVDA')).toBeNull();
 expect(valuationDisplay('per',null)).toBe('미제공');
 expect(valuationDisplay('roe',NaN)).toBe('미제공');
 expect(snapshotMeta.companyDate).toBe('2026-11-17');
 expect(snapshotMeta.industryDate).toBe('2026-01');
 expect(snapshotMeta.companyDate).not.toBe(snapshotMeta.industryDate);
});
test('company PER, PBR, ROE and industry context show as separately dated references without altering virtual account',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const initial='{"version":1,"generation":"valuation-reference-only","trades":[]}';
 await page.addInitScript(raw=>localStorage.setItem('us-stock-lab.account.v1',raw),initial);
 for(const symbol of symbols){
  await page.goto('/?ui=v1#stock/'+symbol);
  const panel=page.getByRole('region',{name:'기업 가치평가 · 업계 참고'});
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('2026-11-17');
  await expect(panel).toContainText('2026-01');
  await expect(panel).toContainText('실제 시장자료 스냅샷');
  await expect(panel).toContainText('시점·집계방법이 달라');
  await expect(panel).toContainText('교육용 유사 산업군');
  await expect(panel.getByRole('link',{name:/기업 PER·PBR·ROE 원본/})).toHaveAttribute('href',valuationSnapshots[symbol].company.source);
  await expect(panel.getByRole('link',{name:/업계 PER/})).toHaveAttribute('href',snapshotMeta.industryPERSource);
  for(const metric of ['per','pbr','roe'] as const){
   await expect(panel.getByTestId('valuation-company-'+metric)).toHaveText(valuationDisplay(metric,valuationSnapshots[symbol].company[metric]));
   await expect(panel.getByTestId('valuation-industry-'+metric)).toHaveText(valuationDisplay(metric,valuationSnapshots[symbol].industry[metric]));
  }
  await expect(page.getByRole('region',{name:'합성 가격 및 변동률'})).toContainText('합성 가격');
  await expect(page.getByRole('tab',{name:'개요'})).toHaveAttribute('aria-selected','true');
 }
 for(const symbol of ['VOO','QQQ','SCHD']){await page.goto('/?ui=v1#stock/'+symbol);await expect(page.locator('.v1-valuation')).toHaveCount(0);}
 await page.goto('/#stock/AAPL');await expect(page.locator('.v1-valuation')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('us-stock-lab.account.v1'))).toBe(initial);
 expect(errors).toEqual([]);
});
test('valuation UI is readable on mobile and sourced ratios never enter account calculations',async({page})=>{
 await page.goto('/?ui=v1#stock/NVDA');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:850});
  const root=page.locator('.v1-valuation');
  await expect(root).toBeVisible();
  for(const metric of ['per','pbr','roe'] as const){await expect(root.getByTestId('valuation-'+metric)).toBeVisible();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 }
});
