import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch18-depth-v399.css','utf8');
for(const s of ['.ch18-depth-v399 p','.ch18-depth-v399 li','.ch18-note-v399','.ch18-card-v399>p','.ch18-table-v399 td','.lifecycle-v399 b','.adopter-v399 span','.core-compare-table td','.ipa92-coverage-extension td','.core-cue-think']){
 const i=css.indexOf(s);assert.ok(i>=0,s);assert.ok(css.slice(i).split('}')[0].includes('font-size:18px'),s);
}
for(const s of ['.adopter-v399 b','.support-v399>div','.primary-v399>div','.goalchain-v399 span']){
 const i=css.indexOf(s);assert.ok(i>=0,s);assert.ok(css.slice(i).split('}')[0].includes('font-size:16px'),s);
}
assert.match(css,/\.ch18-table-v399\{overflow-x:auto\}/);assert.match(css,/\.ch18-table-v399 table\{[^}]*min-width:760px/);
assert.match(css,/\.ipa92-coverage-extension\{[^}]*overflow-x:auto/);
assert.match(css,/@media\(max-width:680px\)[\s\S]*?\.bsc-v399\{grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:480px\)[\s\S]*?\.ppm-v399\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch18-depth-v399.css'));
assert.ok(fs.readFileSync('.github/workflows/validate-publication.yml','utf8').includes('check-ch18-readability-v377.mjs'));
console.log('PASS Chapter 18 body/table/card typography and narrow-layout containment (not physical mobile acceptance)');
