import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('assets/ch12-depth-v393.css','utf8');

for(const selector of ['.ch12-depth-v393 p','.ch12-depth-v393 li','.ch12-note-v393','.ch12-depth-v393 .ch12-helper-v393']){
  const start=css.indexOf(selector);
  assert.ok(start>=0,selector);
  const rule=css.slice(start).split('}')[0];
  assert.ok(rule.includes('font-size:18px'),selector);
}
for(const selector of ['.ch12-card-v393>p','.slcp-map-v393 span','.lifecycle5-v393 span','.design-steps-v393 span','.dfd-legend-v393 span','.oop-pillars-v393 span']){
  const start=css.indexOf(selector);
  assert.ok(start>=0,selector);
  const rule=css.slice(start).split('}')[0];
  assert.ok(rule.includes('font-size:18px'),selector);
}
for(const selector of ['.dev-tree-v393 td','.coupling-v393 td','.uml-v393 td','.coverage-v393 td']){
  const start=css.indexOf(selector);
  assert.ok(start>=0,selector);
  const rule=css.slice(start).split('}')[0];
  assert.ok(rule.includes('font-size:18px'),selector);
}
// Short diagram labels may remain compact, but never below 16px.
for(const selector of ['.ch12-depth-v393 small','.ch12-flow-v393 span','.dfd-shape-v393','.generalization-v393 span','.vmodel-v393 .step-v393']){
  const start=css.indexOf(selector);
  assert.ok(start>=0,selector);
  const rule=css.slice(start).split('}')[0];
  assert.match(rule,/font-size:(?:16|17|18|20|26|28)px/,selector);
}
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
console.log('PASS Chapter 12 body explanations/table text >=18px, compact labels >=16px, wide-table containment and responsive diagrams (not live mobile evidence)');
