import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const css = read('assets/ch22-strategy-v403.css');
const guides = html.match(/<details class="(?:subject-b-strategy-v403|b-strategy-mini-v403)">[\s\S]*?<\/details>/g) || [];
assert.equal(guides.length, 3, 'one guide for each Chapter 22 section');
const [exam, algorithm, security] = guides;
for (const text of ['100分','20問','16 + 4','1000点 / 600点','科目A・科目Bの双方','19問','正答率60％','Item Response Theory／項目応答理論','20問中12問正解なら合格','本試験の評価点や合格を保証しません']) assert.ok(exam.includes(text), text);
assert.ok(!exam.includes('3〜10択'), 'no unsupported fixed option-count range');
for (const text of ['擬似言語（ぎじげんご）','処理の手順','基本要素','処理の流れ','データ構造と手続','丸暗記する必要はありません']) assert.ok(algorithm.includes(text), text);
for (const text of ['ネットワーク・クラウド・データベース','状況をつかむ','証拠を拾う','問いに戻る','ログ（システムの動作記録）']) assert.ok(security.includes(text), text);
for (const guide of guides) {
  assert.ok(!/^<details[^>]*\sopen(?:\s|>)/.test(guide), 'guides default collapsed');
  const links = [...guide.matchAll(/<a\s+([^>]+)>/g)];
  assert.equal(links.length, 1, 'one official-source link per guide');
  for (const [, attrs] of links) {
    assert.match(attrs, /href="https:\/\/www\.ipa\.go\.jp\/shiken\//);
    assert.match(attrs, /rel="noopener noreferrer"/);
  }
}
const sizes = [...css.matchAll(/font-size:(\d+)px/g)].map(m => +m[1]);
assert.ok(sizes.length > 8 && sizes.every(n => n >= 16));
for (const selector of ['.subject-b-split-v403 span','.b-strategy-points-v403 b','.b-strategy-points-v403 span','.subject-b-source-note-v403','.b-strategy-mini-v403 .b-strategy-cue-v403']) {
  const body = css.slice(css.indexOf(selector)).match(/\{([^}]+)\}/)?.[1];
  assert.match(body || '', /font-size:18px/, selector);
}
assert.match(css, /summary\{font-size:18px;padding:13px 14px\}/, 'narrow summary remains 18px');
assert.ok(css.includes('@media(max-width:760px)') && css.includes('grid-template-columns:1fr'));
assert.ok(css.includes('focus-visible') && css.includes('text-decoration:underline'));
const catalog = JSON.parse(read('assets/question-catalog-v376.json'));
const gap = JSON.parse(read('assets/question-catalog-b-gap-v1.json'));
const items = [...catalog.items, ...gap.items];
const pools = {b_exercise:[40,20,2],b_security:[45,15,3],b_compound:[45,15,3],b_exam_algo:[50,50,1]};
for (const [pool,[count,parents,perParent]] of Object.entries(pools)) {
  const rows = items.filter(x=>x.sourcePool===pool);
  assert.equal(rows.length,count,pool);
  assert.equal(new Set(rows.map(x=>x.id)).size,count,`${pool} unique IDs`);
  const groups = new Map();
  for (const row of rows) groups.set(row.parentId,[...(groups.get(row.parentId)||[]),row.ordinal]);
  assert.equal(groups.size,parents,`${pool} parents`);
  for (const ordinals of groups.values()) assert.deepEqual(ordinals.sort((a,b)=>a-b),Array.from({length:perParent},(_,i)=>i+1));
}
const final = read('assets/protected-b-final-bridge-v376.js');
for (const declaration of ['const FINAL_SIZE=20;','const FINAL_ALGO_SIZE=16;','const FINAL_SECURITY_SIZE=4;']) assert.ok(final.includes(declaration));
assert.ok(html.includes('./assets/ch22-strategy-v403.css'));
assert.ok(read('sw.js').includes('"./assets/ch22-strategy-v403.css?v=ch22-183"'));
assert.ok(html.includes('href="./assets/ch22-strategy-v403.css?v=ch22-183"'));
assert.ok(html.includes('src="./assets/app-v377.js?v=bfinal-resume-190"'));
assert.ok(read('sw.js').includes('"./assets/app-v377.js?v=bfinal-resume-190"'));
console.log('PASS Chapter 22: 3 strategy guides, 18px main / 16px labels, official links, B metadata 40/45/45/50 and final 16+4; no protected content fixture');

