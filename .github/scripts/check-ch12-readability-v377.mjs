import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('assets/ch12-depth-v393.css','utf8');

for(const selector of ['.ch12-depth-v393 p','.ch12-depth-v393 li','.ch12-note-v393']){
  const start=css.indexOf(selector);
  assert.ok(start>=0,selector);
  const rule=css.slice(start).split('}')[0];
  assert.ok(rule.includes('font-size:18px'),selector);
}
assert.match(css,/ch12-depth-v393 small,[\s\S]*?ch12-helper-v393\{font-size:16px/);
assert.match(css,/lifecycle5-v393 span\{[^}]*font-size:16px/);
assert.match(css,/design-steps-v393 span\{[^}]*font-size:16px/);
for(const selector of ['.dev-tree-v393','.coupling-v393','.uml-v393','.coverage-v393']){
  const start=css.indexOf(selector);
  assert.ok(start>=0,selector);
  const rule=css.slice(start).split('}')[0];
  assert.ok(rule.includes('overflow-x:auto'),selector);
}
assert.match(css,/dev-tree-v393 table\{[^}]*min-width:700px/);
assert.match(css,/coupling-v393 table\{[^}]*min-width:680px/);
assert.match(css,/uml-v393 table\{[^}]*min-width:600px/);
assert.match(css,/coverage-v393 table\{[^}]*min-width:760px/);
assert.match(css,/@media\(max-width:820px\)[\s\S]*?design-steps-v393\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:680px\)[\s\S]*?oop-pillars-v393,[\s\S]*?grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:480px\)[\s\S]*?dfd-legend-v393,[\s\S]*?grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch12-depth-v393.css'));
console.log('PASS Chapter 12 scoped text/data fonts, wide-table containment and responsive system-development diagrams (not live mobile evidence)');
