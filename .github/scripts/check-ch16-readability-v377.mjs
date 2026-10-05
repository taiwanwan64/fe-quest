import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch16-depth-v397.css','utf8');
for(const selector of ['.ch16-depth-v397 p','.ch16-depth-v397 li','.ch16-note-v397','.ch16-card-v397>p','.ch16-table-v397 td','.hosting4-v397 td','.ch16-flow-v397 span','.bi-pipeline-v397 span','.strategy-pyramid-v397>div','.ea4-v397 b']){
 const i=css.indexOf(selector);assert.ok(i>=0,selector);assert.ok(css.slice(i).split('}')[0].includes('font-size:18px'),selector);
}
assert.match(css,/ch16-depth-v397 small,[\s\S]*?ch16-helper-v397\{font-size:16px/);
assert.match(css,/\.ch16-depth-v397 \.beginner-term>span,[\s\S]*?font-size:18px/);
assert.match(css,/\.ch16-depth-v397 \.ipa92-coverage-extension\{[^}]*overflow-x:auto/);
assert.match(css,/\.ch16-depth-v397 \.ipa92-coverage-extension table\{[^}]*min-width:640px/);
assert.match(css,/\.ch16-depth-v397 \.ipa92-coverage-extension td,[\s\S]*?font-size:18px/);
assert.match(css,/hosting4-v397\{overflow-x:auto\}/);assert.match(css,/hosting4-v397 table\{[^}]*min-width:800px/);
assert.match(css,/@media\(max-width:680px\)[\s\S]*?ch16-grid4-v397\{grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:480px\)[\s\S]*?three-v-v397\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch16-depth-v397.css'));
assert.ok(fs.readFileSync('.github/workflows/validate-publication.yml','utf8').includes('check-ch16-readability-v377.mjs'));
console.log('PASS Chapter 16 body/table/card typography and narrow-layout containment (not physical mobile acceptance)');
