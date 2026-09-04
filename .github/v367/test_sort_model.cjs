const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'app/sort-diagrams-v367.js'),'utf8');
const context={Set,Number,Array,escapeHtml:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')};
vm.createContext(context);vm.runInContext(source,context);
let count=0;function test(name,fn){fn();count++;process.stdout.write(`PASS ${name}\n`);}
test('diagram scope',()=>{assert.equal(context.coreTopicSortDiagramViewV367('core_03_02'),'');assert.match(context.coreTopicSortDiagramViewV367('core_03_03'),/sort-figure-v367/);});
test('bubble pass',()=>{const html=context.coreTopicSortDiagramViewV367('core_03_03');assert.match(html,/\[2, 4, 1, 5\]/);assert.match(html,/最大値5が右端に確定/);assert.equal((html.match(/i = [012]/g)||[]).length,3);});
test('selection pass',()=>{const html=context.coreTopicSortDiagramViewV367('core_03_03');assert.match(html,/minPos = 3/);assert.match(html,/\[1, 2, 5, 4\]/);assert.match(html,/最小値1が左端に確定/);});
test('bubble trace marks adjacent cells',()=>{const html=context.sortTraceViewV367('bubble_sort_b',[1,5,4,2],{line:1,state:{i:1},focus:1});assert.match(html,/data-sort-mode="bubble"/);assert.match(html,/data-sort-i="1"/);assert.equal((html.match(/is-compare/g)||[]).length,2);assert.match(html,/data\[1\] と data\[2\]/);});
test('bubble complete fixes right edge',()=>{const html=context.sortTraceViewV367('bubble_sort_b',[1,4,2,5],{line:6,state:{i:2},focus:-1});assert.match(html,/data-sort-complete="true"/);assert.equal((html.match(/is-fixed/g)||[]).length,1);assert.match(html,/右端の5が確定/);});
test('selection trace tracks j and minPos',()=>{const html=context.sortTraceViewV367('selection_sort_b',[4,2,5,1],{line:2,state:{j:2,minPos:1},focus:2});assert.match(html,/data-sort-j="2"/);assert.match(html,/data-sort-min-pos="1"/);assert.equal((html.match(/is-candidate/g)||[]).length,1);assert.equal((html.match(/is-scan/g)||[]).length,1);assert.match(html,/添字1（値2）/);});
test('selection complete fixes left edge',()=>{const html=context.sortTraceViewV367('selection_sort_b',[1,2,5,4],{line:8,state:{j:3,minPos:3},focus:-1});assert.match(html,/data-sort-complete="true"/);assert.equal((html.match(/is-fixed/g)||[]).length,1);assert.doesNotMatch(html,/>minPos</);assert.match(html,/添字0に最小値1を確定/);});
test('trace escapes values',()=>{const html=context.sortTraceViewV367('bubble_sort_b',['<x>','&y'],{line:1,state:{i:0},focus:0});assert.doesNotMatch(html,/<x>/);assert.match(html,/&lt;x&gt;/);assert.match(html,/&amp;y/);});
console.log(`PASS — V367 SORT MODEL ${count}/${count}`);
