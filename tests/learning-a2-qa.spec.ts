import {test,expect} from '@playwright/test';
import {learningUnits} from '../src/learningFoundation';
import {a2Units} from '../src/learningA2';
import {p2Units} from '../src/learningA2P2';
import {p3Units} from '../src/learningA2P3';
const units={...learningUnits,...a2Units,...p2Units,...p3Units};
test('all ten units retain supported sources and exactly one explained answer',()=>{expect(Object.keys(units)).toHaveLength(10);for(const unit of Object.values(units)){expect(unit.questions.length).toBeGreaterThanOrEqual(2);expect(unit.sources.length).toBeGreaterThan(0);for(const q of unit.questions){expect(q.options.filter(o=>o.correct)).toHaveLength(1);for(const o of q.options)expect(o.feedback.trim().length).toBeGreaterThan(15)}if(unit.table){expect(unit.table.headers.length).toBeGreaterThan(1);for(const row of unit.table.rows)expect(row).toHaveLength(unit.table.headers.length)}}});
test('all ten detailed lessons expose their heading and quiz with accessible controls',async({page})=>{await page.goto('/#learn/lessons');for(const id of Object.keys(units)){const card=page.locator('#lesson-'+id),button=card.locator('.lesson');await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-expanded','true');await expect(card.getByRole('heading',{name:'이해도 확인'})).toBeVisible();await expect(card.locator('fieldset')).toHaveCount(units[id as keyof typeof units].questions.length);await button.focus();await page.keyboard.press('Space');await expect(button).toHaveAttribute('aria-expanded','false')}});
