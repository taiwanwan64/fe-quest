import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('assets/bbook-ch01-grammar-v404.css', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const guides = html.match(/<details class="b-grammar-v404">[\s\S]*?<\/details>/g);
assert.equal(guides?.length, 1, 'one existing grammar guide, no duplicate');
const guide = guides[0];
assert.equal((guide.match(/<section class="b-grammar-section-v404">/g) || []).length, 8);
assert.equal((guide.match(/<h3>/g) || []).length, 8);
for (const term of ['未定義','代入','剰余（じょうよ）','not','コメント','境界値','引数（ひきすう）','戻り値','局所変数','大域変数','pointer','小数部分をどう扱うか','elseifは判定せず']) {
  assert.ok(guide.includes(term), term);
}
assert.ok(!guide.includes('f ← e + 2'), 'no undeclared example inputs');
assert.ok(!guide.includes('次の位置を指す添字'), 'pointer is not always next index');
assert.ok(!guide.includes('複数の文字を格納'), 'strings can have zero or one characters');
assert.ok(!/font-size:(?:1[0-7]|[0-9])px/.test(css), 'all guide text at least 18px');
assert.ok(css.includes('min-width:0;table-layout:fixed'));
assert.ok(css.includes('min-width:520px;table-layout:auto'));
assert.ok(css.includes('overflow-wrap:anywhere'));
assert.ok(css.includes(':focus-visible'));
assert.equal((guide.match(/role="region" aria-label="[^"]+" tabindex="0"/g)||[]).length, 2);
for (const table of guide.match(/<table>[\s\S]*?<\/table>/g)||[]) {
  assert.ok(table.includes('<caption>'), 'table caption');
  assert.ok(table.includes('scope="col"'), 'column headers');
}
assert.ok(html.includes('./assets/bbook-ch01-grammar-v404.css?v=bgrammar-184'));
assert.ok(sw.includes('"./assets/bbook-ch01-grammar-v404.css?v=bgrammar-184"'));
// These reference calculations validate independently authored teaching examples,
// not protected question grading or all Subject B bank coverage.
let a = 4; a = a + 3; const b = a * 2;
assert.deepEqual([a,b], [7,14]);
assert.ok(guide.includes('<td>14</td>'));
assert.deepEqual([7%3,2%3,0%3], [1,2,0]);
for (const [p,q,and,or,not] of [[true,true,true,true,false],[true,false,false,true,false],[false,true,false,true,true],[false,false,false,false,true]]) {
  assert.equal(p&&q, and); assert.equal(p||q, or); assert.equal(!p, not);
}
let n = 2, count = 0; while (n < 2) { count++; n++; }
assert.deepEqual([n,count], [2,0]);
n = 2; count = 0; do { count++; n++; } while (n < 2);
assert.deepEqual([n,count], [3,1]);
assert.ok(guide.includes('n = 2、count = 0') && guide.includes('n = 3、count = 1'));
let i, total = 0; const states = [];
for(i=2;i<=6;i+=2) { total+=i; states.push([i,total]); }
assert.deepEqual(states, [[2,2],[4,6],[6,12]]);
assert.deepEqual([i,total], [8,12]);
const down = []; for(i=7;i>=1;i-=3) down.push(i);
assert.deepEqual(down, [7,4,1]); assert.equal(i,-2);
const addFee = (price,fee) => price+fee;
assert.equal(addFee(12,3),15);
let globalCount = 10;
const localCount = () => { let count=2; count++; return count; };
assert.deepEqual([localCount(),globalCount], [3,10]);
n=1; total=0; while(n<=2){ total+=n; n++; }
assert.deepEqual([n,total], [3,3]);
assert.deepEqual([4,5,7,8,6].map(x => x>=5 && x<8), [false,true,true,false,true]);
console.log('PASS Subject B grammar: 8 sections, teaching examples, 18px and accessible table contracts');
