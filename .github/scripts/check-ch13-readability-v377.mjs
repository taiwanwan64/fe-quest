import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('assets/ch13-depth-v394.css','utf8');

for(const selector of ['.ch13-depth-v394 p','.ch13-depth-v394 li','.ch13-note-v394']){
  const start=css.indexOf(selector);
  assert.ok(start>=0,selector);
  const rule=css.slice(start).split('}')[0];
  assert.ok(rule.includes('font-size:18px'),selector);
}
assert.match(css,/ch13-depth-v394 small,[\s\S]*?ch13-helper-v394\{font-size:16px/);
assert.match(css,/waterfall-v394 b\{[^}]*font-size:18px/);
assert.match(css,/waterfall-v394 span\{[^}]*font-size:16px/);
assert.match(css,/agile-loop-v394 b\{[^}]*font-size:18px/);
assert.match(css,/agile-loop-v394 span\{[^}]*font-size:16px/);
assert.match(css,/agile-release-v394\{[^}]*font-size:18px/);
assert.match(css,/mashup-v394 b\{[^}]*font-size:18px/);
assert.match(css,/scrum-events-v394\{overflow-x:auto/);
assert.match(css,/scrum-events-v394 table\{[^}]*min-width:720px/);
assert.match(css,/config-items-v394\{overflow-x:auto/);
assert.match(css,/config-items-v394 table\{[^}]*min-width:720px/);
assert.match(css,/@media\(max-width:820px\)[\s\S]*?scrum-roles-v394,[\s\S]*?grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:680px\)[\s\S]*?engineering-map-v394,[\s\S]*?grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:480px\)[\s\S]*?agile-loop-v394\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch13-depth-v394.css'));
console.log('PASS Chapter 13 scoped text/card fonts, wide-table containment and responsive development-method diagrams (not live mobile evidence)');
