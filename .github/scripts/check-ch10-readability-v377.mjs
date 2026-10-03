import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch10-depth-v391.css','utf8');
for(const selector of ['.ch10-helper-v391','.ch10-note-v391','.ch10-card-v391>p','.net-3-v391 span','.osi-table-v391 td']){
  const rule=css.slice(css.indexOf(selector)).split('}')[0];
  assert.ok(rule.includes('font-size:18px'),selector);
}
assert.match(css,/ch10-depth-v391 small\{font-size:16px!important/);
assert.match(css,/ch10-depth-v391 code\{[^}]*font-size:18px;[^}]*overflow-wrap:anywhere/);
assert.ok(css.includes('#lesson:has(.ch10-depth-v391) table :is(th,td){font-size:18px'));
assert.match(css,/ch10-table-wrap-v377\{[^}]*max-width:100%;overflow-x:auto/);
assert.match(css,/core-subnet-binary-v356\{[^}]*max-width:100%;overflow-x:auto/);
assert.match(css,/core-subnet-binary-row-v356\{grid-template-columns:160px minmax\(0,1fr\);min-width:720px/);
assert.match(css,/core-subnet-bitline-v356 :is\(span,em\)\{font-size:18px!important/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch10-depth-v391.css'));
console.log('PASS Chapter 10 scoped text/data fonts, wide-table containment and preserved subnet boundary geometry (not live mobile evidence)');
