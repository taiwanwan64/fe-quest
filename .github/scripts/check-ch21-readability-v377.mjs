import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch21-depth-v402.css','utf8');
for(const s of ['.ch21-depth-v402 p','.ch21-depth-v402 li','.ch21-note-v402','.ch21-card-v402>p','.ch21-table-v402 td','.cyber-all-v402>div']){
 const i=css.indexOf(s);assert.ok(i>=0,s);assert.ok(css.slice(i).split('}')[0].includes('font-size:18px'),s);
}
for(const s of ['.beginner-term>span','.core-cue-think','.ch21-depth-v402 td'])assert.ok(css.includes(s));
assert.match(css,/\.ch21-table-v402\{overflow-x:auto\}/);
assert.ok(css.includes('min-width:760px'));assert.ok(css.includes('overflow-wrap:anywhere'));
assert.match(css,/@media\(max-width:720px\)[\s\S]*?\.ch21-grid4-v402\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch21-depth-v402.css'));
assert.ok(fs.readFileSync('.github/workflows/validate-publication.yml','utf8').includes('check-ch21-readability-v377.mjs'));
console.log('PASS Chapter21: 18px body/terms/cards/tables; bounded grids/tables (not physical mobile acceptance)');
