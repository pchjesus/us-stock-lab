import {test,expect} from '@playwright/test';
test('verified annual and quarterly fixture graph excludes cumulative facts',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{
  const reactPath='/node_modules/.vite/deps/react.js',domPath='/node_modules/.vite/deps/react-dom_client.js',viewPath='/src/CompanyDetail.tsx',profilesPath='/src/companyProfiles.ts',contractPath='/src/companyData.ts';
  const React=await import(/* @vite-ignore */ reactPath),dom=await import(/* @vite-ignore */ domPath),view=await import(/* @vite-ignore */ viewPath),profiles=await import(/* @vite-ignore */ profilesPath),contract=await import(/* @vite-ignore */ contractPath);
  const p=structuredClone(profiles.companyProfiles[0]);p.financialCoverage={status:'partial',reason:'synthetic test only'};
  const create=(id:string,value:string,period:any)=>({id,metric:'revenue',value,unit:'USD',currency:'USD',period,sourceId:'annual-report',status:'verified',missingReason:null,supersedes:null,origin:{kind:'reported'}});
  p.financials=[create('year','100',{fiscalYear:2025,quarter:null,basis:'annual',start:'2024-09-29',end:'2025-09-27'}),create('quarter','25',{fiscalYear:2025,quarter:2,basis:'quarter',start:'2024-12-29',end:'2025-03-29'}),create('cumulative','999',{fiscalYear:2025,quarter:2,basis:'ytd',start:'2024-09-29',end:'2025-03-29'})];contract.validateCompany(p);
  const root=document.createElement('div');root.id='fixture-company';document.querySelector('main')!.appendChild(root);(dom.createRoot??dom.default.createRoot)(root).render((React.createElement??React.default.createElement)(view.CompanyDetail,{profile:p}));
 });const root=page.locator('#fixture-company');await expect(root.getByRole('img',{name:'검증된 매출 실적 그래프'})).toBeVisible();const graph=root.getByLabel('매출 실적 그래프',{exact:true});await expect(graph).toContainText('100 USD');await expect(graph).not.toContainText('999');await root.getByRole('button',{name:'분기',exact:true}).click();await expect(graph).toContainText('25 USD');await expect(graph).not.toContainText('999');
});
