import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch14-depth-v395.css','utf8');
for(const selector of ['.ch14-depth-v395 p','.ch14-depth-v395 li','.ch14-note-v395','.ch14-card-v395>p','.ch14-table-v395 td','.formula-v395 span','.allocation-v395>div','.allocation-v395 b','.estimate-methods-v395 td','.fp-types-v395 b','.risk4-v395 span']){
 const i=css.indexOf(selector);assert.ok(i>=0,selector);
 assert.ok(css.slice(i).split('}')[0].includes('font-size:18px'),selector);
}
assert.match(css,/ch14-depth-v395 small,[\s\S]*?ch14-helper-v395\{font-size:16px/);
assert.match(css,/knowledge10-v395 span\{[^}]*font-size:16px/);
assert.match(css,/ch14-chart-scroll-v395\{overflow-x:auto/);
assert.match(css,/ch14-trend-chart-v395\{[^}]*width:460px;min-width:460px;height:300px;max-width:none/);
assert.match(css,/ch14-trend-chart-v395 text\{font-size:16px/);
assert.doesNotMatch(css,/\.trend-v395 \.plan/);
for(const [sel,width] of [['ch14-table-v395',720],['estimate-methods-v395',760]]){
 assert.ok(css.includes(`${sel}{overflow-x:auto}`));
 assert.match(css,new RegExp(`${sel} table\\{[^}]*min-width:${width}px`));
}
assert.match(css,/@media\(max-width:680px\)[\s\S]*?precedence-v395,[\s\S]*?grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:680px\)[\s\S]*?allocation-v395\{display:grid;grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:480px\)[\s\S]*?risk4-v395,[\s\S]*?grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch14-depth-v395.css'));
console.log('PASS Chapter 14 body/table fonts, fixed-size SVG labels, horizontal containment and narrow-layout rules (not real mobile acceptance)');
