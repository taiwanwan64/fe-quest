import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch19-depth-v400.css','utf8');
for(const s of ['.ch19-depth-v400 p','.ch19-depth-v400 li','.ch19-note-v400','.ch19-card-v400>p','.ch19-table-v400 td','.ec5-v400 td']){
 const i=css.indexOf(s);assert.ok(i>=0,s);assert.ok(css.slice(i).split('}')[0].includes('font-size:18px'),s);
}
assert.ok(css.includes('.beginner-term>span'));assert.ok(css.includes('.core-cue-think'));
assert.match(css,/\.ch19-table-v400\{overflow-x:auto\}/);
assert.match(css,/min-width:760px/);assert.match(css,/overflow-wrap:anywhere/);
assert.match(css,/@media\(max-width:680px\)[\s\S]*?\.ch19-grid4-v400\{grid-template-columns:1fr/);
assert.match(css,/@media\(max-width:480px\)[\s\S]*?\.longtail-v400\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch19-depth-v400.css'));
assert.ok(fs.readFileSync('.github/workflows/validate-publication.yml','utf8').includes('check-ch19-readability-v377.mjs'));
console.log('PASS Chapter19 body/terms/cards/tables 18px; contained narrow grids/tables (not physical mobile acceptance)');
