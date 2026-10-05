import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch17-depth-v398.css','utf8');
for(const s of ['.ch17-depth-v398 p','.ch17-depth-v398 li','.ch17-note-v398','.ch17-card-v398>p','.ch17-table-v398 td','.portfolio-v398 b','.core-compare-table td','.ipa92-coverage-extension td']){
 const i=css.indexOf(s);assert.ok(i>=0,s);assert.ok(css.slice(i).split('}')[0].includes('font-size:18px'),s);
}
assert.match(css,/\.privacy-flow-v398 span\{[^}]*font-size:16px/);
assert.match(css,/\.ch17-table-v398\{overflow-x:auto\}/);
assert.match(css,/\.ch17-table-v398 table\{[^}]*min-width:760px/);
assert.match(css,/\.ipa92-coverage-extension\{[^}]*overflow-x:auto/);
assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.docs-v398,[\s\S]*?grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:560px\)[\s\S]*?\.green-v398\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch17-depth-v398.css'));
assert.ok(fs.readFileSync('.github/workflows/validate-publication.yml','utf8').includes('check-ch17-readability-v377.mjs'));
console.log('PASS Chapter 17 body/table/card typography and narrow-layout containment (not physical mobile acceptance)');
