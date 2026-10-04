import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch15-depth-v396.css','utf8');
for(const selector of ['.ch15-depth-v396 p','.ch15-depth-v396 li','.ch15-note-v396','.ch15-card-v396>p','.ch15-table-v396 td','.ch15-flow-v396 span','.pdca-v396 span','.migration-v396 .metric','.desk-types-v396 td','.audit-flow-v396 b','.audit-flow-v396 span','.segregation-v396 span']){
 const i=css.indexOf(selector);assert.ok(i>=0,selector);
 assert.ok(css.slice(i).split('}')[0].includes('font-size:18px'),selector);
}
assert.match(css,/ch15-depth-v396 small,[\s\S]*?ch15-helper-v396\{font-size:16px/);
assert.match(css,/\.ch15-depth-v396 \.beginner-term>span,[\s\S]*?font-size:18px/);
assert.match(css,/\.ch15-depth-v396 \.ipa92-coverage-extension\{[^}]*overflow-x:auto/);
assert.match(css,/\.ch15-depth-v396 \.ipa92-coverage-extension table\{[^}]*min-width:640px/);
assert.match(css,/\.ch15-depth-v396 \.ipa92-coverage-extension td,[\s\S]*?font-size:18px/);
for(const [sel,width] of [['ch15-table-v396',720],['desk-types-v396',760]]){
 assert.ok(css.includes(`${sel}{overflow-x:auto}`));
 assert.match(css,new RegExp(`${sel} table\\{[^}]*min-width:${width}px`));
}
assert.match(css,/@media\(max-width:680px\)[\s\S]*?ch15-grid3-v396,[\s\S]*?grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:480px\)[\s\S]*?audit-flow-v396\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch15-depth-v396.css'));
console.log('PASS Chapter 15 body/table typography, horizontal containment and narrow-layout rules (not real mobile acceptance)');
