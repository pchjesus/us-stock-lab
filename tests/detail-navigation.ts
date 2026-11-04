import type {Page} from '@playwright/test';
export async function openTrading(page:Page){await page.getByRole('tab',{name:'차트·거래',exact:true}).click();}
export async function openFinancials(page:Page){await page.getByRole('tab',{name:'재무',exact:true}).click();}
export async function openEvidence(page:Page){await page.getByRole('tab',{name:'근거',exact:true}).click();}
