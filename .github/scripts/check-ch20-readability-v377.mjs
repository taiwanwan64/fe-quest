import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/ch20-depth-v401.css','utf8');
for(const s of ['.ch20-depth-v401 p','.ch20-depth-v401 li','.ch20-note-v401','.ch20-card-v401>p','.ch20-table-v401 td','.weighted-v401 td']){
 const i=css.indexOf(s);assert.ok(i>=0,s);assert.ok(css.slice(i).split('}')[0].includes('font-size:18px'),s);
}
assert.ok(css.includes('.beginner-term>span'));assert.ok(css.includes('.core-cue-think'));
assert.match(css,/\.ch20-table-v401\{overflow-x:auto\}/);
assert.ok(css.includes('.ch20-chart-v401 svg{display:block;width:100%;min-width:600px'));
assert.ok(css.includes('min-width:760px'));assert.ok(css.includes('overflow-wrap:anywhere'));
assert.match(css,/@media\(max-width:720px\)[\s\S]*?\.ch20-grid5-v401\{grid-template-columns:1fr/);
assert.ok(fs.readFileSync('sw.js','utf8').includes('./assets/ch20-depth-v401.css'));
assert.ok(fs.readFileSync('.github/workflows/validate-publication.yml','utf8').includes('check-ch20-readability-v377.mjs'));
console.log('PASS Chapter20: body/terms/cards/tables 18px; bounded narrow grids/tables/SVG (not physical mobile acceptance)');
