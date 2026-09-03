const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(root, 'assets/app-v361.js'), 'utf8');
const source = js.slice(js.indexOf('function stackQueueInitialStateV360(){'), js.indexOf('function coreTopicArticleView(id){'));
const context = vm.createContext({escapeHtml: s => String(s)});
vm.runInContext(source, context);
const html = context.coreTopicStackQueueDiagramViewV360('core_03_01');
const results = html.match(/<div class="sq-results-v360">([\s\S]*?)<\/div>/)[1];
const cards = [...results.matchAll(/<section><h4>(.*?)<\/h4><b>(.*?)<\/b><span>(.*?)<\/span><code>(.*?)<\/code><\/section>/g)];
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
test('both comparison cards use remaining removal order', () => {
  assert.equal(cards.length, 2);
  assert.deepEqual(cards.map(c => c[3]), ['残りを取り出す順', '残りを取り出す順']);
});
for (const [i, op, first, rest] of [[0, 'pop', 'C', ['B','A']], [1, 'dequeue', 'A', ['B','C']]]) {
  test(op + ' displayed first and remaining values match the actual reducer', () => {
    const start = context.stackQueueInitialStateV360();
    let result = context.stackQueueApplyV360(start, op);
    assert.equal(result.event.value, first);
    assert.equal(cards[i][2], first + ' が出る');
    const outputs = [];
    while (true) {
      result = context.stackQueueApplyV360(result.state, op);
      if (!result.event) break;
      outputs.push(result.event.value);
    }
    assert.deepEqual(outputs, rest);
    assert.equal(cards[i][4], outputs.join(' → '));
    assert.equal(start.stack.join(''), 'ABC');
    assert.equal(start.queue.join(''), 'ABC');
  });
}
test('comparison no longer mixes storage directions with removal order', () => {
  assert.ok(!results.includes('底 → 頂上'));
  assert.ok(!results.includes('先頭 → 末尾'));
  assert.ok(!results.includes('<code>A → B</code>'));
});
test('full removal explanation and lesson scope remain unchanged', () => {
  assert.ok(html.includes('スタック：C → B → A<br>キュー：A → B → C'));
  assert.equal(context.coreTopicStackQueueDiagramViewV360('core_14_04'), '');
});
console.log('PASS — V361 OUTPUT ORDER MODEL ' + count + '/' + count);
