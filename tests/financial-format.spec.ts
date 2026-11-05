import {test,expect} from '@playwright/test';
import {koreanFinancialValue,financialValueText} from '../src/companyPresentation';
import {findCompanyProfile} from '../src/companyProfiles';
test('Korean dollar display uses exact decimal rounding without mutating observations',()=>{
 const cases:[string|null,'USD'|'USD/share',string][]=[['416161000000','USD','4,161.6억 달러'],['1000000000000','USD','1.0조 달러'],['999999999999','USD','1.0조 달러'],['99994999','USD','9,999.5만 달러'],['9999.99','USD','9,999.99달러'],['10000','USD','1.0만 달러'],['-125000000','USD','-1.3억 달러'],['0','USD','0달러'],['-0.00','USD','0.00달러'],['7.46','USD/share','7.46달러/주'],['123456789012345678901234','USD','123,456,789,012.3조 달러'],['1.000000000001','USD','1.000000000001달러'],[null,'USD','미제공'],['NaN','USD','미제공']];
 for(const [value,unit,expected] of cases)expect(koreanFinancialValue(value,unit)).toBe(expected);
 const f=findCompanyProfile('AAPL')!.financials.find(x=>x.value==='416161000000')!;const before=structuredClone(f);expect(koreanFinancialValue(f.value,f.unit)).toBe('4,161.6억 달러');expect(f).toEqual(before);expect(financialValueText(f)).toContain('정확값 416161000000 USD');
});
