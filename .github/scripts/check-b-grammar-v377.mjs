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
assert.equal((guide.match(/role="region" aria-label="[^"]+" tabindex="0"/g)||[]).length, 3);
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

// Independently authored nested-break example: only the inner loop exits.
// Bind the displayed code and six trace rows to an independent executable trace.
const nestedStart=guide.indexOf('<div class="b-grammar-card-v404" id="bGrammarNestedBreakV404">');
assert.ok(nestedStart>=0, 'nested-break teaching card exists');
const nested=guide.slice(nestedStart,guide.indexOf('</section>',nestedStart));
assert.ok(nested, 'nested-break teaching card');
const nestedCode=nested.match(/<pre class="b-grammar-code-v404">([\s\S]*?)<\/pre>/)?.[1];
assert.equal(nestedCode, "整数型: i, j, hits ← 0, rounds ← 0\nfor (i を 1 から 2 まで 1ずつ増やす)\n    for (j を 1 から 3 まで 1ずつ増やす)\n        if (j = 2)\n            break  // 内側のforだけを終了\n        endif\n        hits ← hits + 1\n    endfor\n    rounds ← rounds + 1  // 外側の本体は続く\nendfor\nhits, rounds を出力する");
assert.ok(nested.includes('ifは繰返しではない'));
assert.ok(nested.includes('最も内側のforやwhile'));
assert.ok(nested.includes('returnは関数から呼出し元へ戻る'));
assert.ok(nested.includes('出力はhits = 2、rounds = 2'));
let hits=0,rounds=0;const nestedRows=[];
for(let outer=1;outer<=2;outer++){
 let inner;
 for(inner=1;inner<=3;inner++){
  if(inner===2){nestedRows.push([outer,inner,hits,rounds]);break;}
  hits++;nestedRows.push([outer,inner,hits,rounds]);
 }
 rounds++;nestedRows.push([outer,inner,hits,rounds]);
}
assert.deepEqual([hits,rounds],[2,2]);
assert.deepEqual(nestedRows,[[1,1,1,0],[1,2,1,0],[1,2,1,1],[2,1,2,1],[2,2,2,1],[2,2,2,2]]);
const body=nested.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
const displayed=[...body.matchAll(/<tr><td>(\d+)<\/td><td>(\d+)<\/td><td>[^<]*<\/td><td>hits = (\d+)、rounds = (\d+)<\/td><\/tr>/g)].map(m=>m.slice(1).map(Number));
assert.deepEqual(displayed,nestedRows,'every displayed trace row matches the independent loop');
assert.equal((guide.match(/<table>/g)||[]).length,10,'existing nine plus one nested-break trace');
console.log('PASS nested break: skipped inner work, outer continuation, inner restart and six displayed states');
