import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('assets/ch11-depth-v392.css','utf8');

for(const selector of ['.ch11-depth-v392 p','.ch11-depth-v392 li','.ch11-note-v392']){
  const start=css.indexOf(selector);
  assert.ok(start>=0,selector);
  const rule=css.slice(start).split('}')[0];
  assert.ok(rule.includes('font-size:18px'),selector);
}
assert.match(css,/ch11-depth-v392 small,[\s\S]*?ch11-helper-v392\{font-size:16px/);
assert.match(css,/ch11-depth-v392 code\{font-size:18px;white-space:normal;overflow-wrap:anywhere/);
assert.match(css,/risk-process-v392 span\{[^}]*font-size:16px/);
assert.match(css,/risk-response-v392 span\{[^}]*font-size:16px/);
assert.match(css,/permission-v392\{overflow-x:auto/);
assert.match(css,/permission-v392 table\{[^}]*min-width:560px/);
assert.match(css,/permission-v392 td\{[^}]*font-size:18px/);
const bodyRule=css.slice(css.indexOf('/* Explanations in cards')).split('}')[0];
for(const selector of ['.ch11-card-v392>span','.ch11-card-v392>p','.attack-list-v392 span','.key-compare-v392 span','.auth-factors-v392 span'])assert.ok(bodyRule.includes(selector),selector);
assert.ok(bodyRule.includes('font-size:18px'),'card explanations must use body text size');
assert.match(css,/@media\(max-width:760px\)[\s\S]*?risk-process-v392,[\s\S]*?repeat\(2,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:680px\)[\s\S]*?attack-list-v392,[\s\S]*?grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:480px\)[\s\S]*?risk-response-v392\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch11-depth-v392.css'));
console.log('PASS Chapter 11 scoped text/data fonts, wide-table containment and responsive security diagrams (not live mobile evidence)');

assert.match(css, /p\.ch11-helper-v392\{font-size:18px/, 'Helper paragraphs remain readable body text');
assert.ok(css.includes('#lesson .risk-process-v392 span,\n#lesson .risk-response-v392 span,'), 'Risk card explanations use the 18px override');
