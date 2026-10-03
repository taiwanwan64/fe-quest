import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch9-depth-v390.css','utf8');
for(const selector of ['.ch9-helper-v390','.ch9-note-v390','.data-models-v390 span','.key-rules-v390 span','.norm-steps-v390 span','.dbms-functions-v390 span','.index-row-v390 span','.acid-grid-v390 span']){
  const rule=css.slice(css.indexOf(selector)).split('}')[0];
  assert.ok(rule.includes('font-size:18px'),selector);
}
assert.match(css,/ch9-depth-v390 small\{[^}]*font-size:16px/);
assert.match(css,/ch9-depth-v390 code\{[^}]*font-size:18px;[^}]*overflow-wrap:anywhere/);
assert.match(css,/ch9-depth-v390 pre code\{white-space:pre-wrap/);
assert.ok(css.includes('#lesson:has(.ch9-depth-v390) table td{font-size:18px'));
assert.match(css,/ch9-table-wrap-v377\{[^}]*max-width:100%;overflow-x:auto/);
assert.ok(css.includes('@media(max-width:480px)'));
assert.match(css,/ch9-depth-v390 small\{font-size:16px!important/);
assert.match(css,/deadlock-figure-v370\) small\{font-size:16px!important/);
assert.match(css,/deadlock-figure-v370\) :is\(p,code\)\{font-size:18px!important;line-height:1.65!important/);
assert.match(css,/deadlock-figure-v370\) :is\(span,small,b,strong,em,h3,h4\)\{font-size:16px/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch9-depth-v390.css'));
console.log('PASS Chapter 9 scoped prose/data typography and wrapping (not live mobile evidence)');
