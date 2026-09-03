const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'app/search-diagrams-v366.js'),'utf8');
const context={Set,Number,Array,escapeHtml:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')};
vm.createContext(context);vm.runInContext(source,context);
let count=0;function test(name,fn){fn();count++;process.stdout.write(`PASS ${name}\n`);}
test('diagram scope',()=>{assert.equal(context.coreTopicSearchDiagramViewV366('core_03_02'),'');assert.match(context.coreTopicSearchDiagramViewV366('core_03_03'),/search-figure-v366/);});
test('linear comparison',()=>{const html=context.coreTopicSearchDiagramViewV366('core_03_03');assert.match(html,/未整列でも使える/);assert.match(html,/6回比較/);assert.match(html,/O\(n\)/);});
test('binary range reduction',()=>{const html=context.coreTopicSearchDiagramViewV366('core_03_03');assert.match(html,/昇順に整列済みが前提/);assert.match(html,/添字0〜3を探索対象から外す/);assert.match(html,/2回比較/);});
test('linear trace marks checked and current',()=>{const html=context.searchTraceViewV366('linear_search',[3,5,8,12,20],12,{state:{i:2},focus:2});assert.match(html,/data-search-mode="linear"/);assert.equal((html.match(/is-checked/g)||[]).length,2);assert.match(html,/現在の i：2/);});
test('binary trace marks range',()=>{const html=context.searchTraceViewV366('binary_search_b',[2,5,8,12,16,21,30],21,{state:{low:4,high:6,mid:5},focus:5,found:5});assert.match(html,/data-search-low="4"/);assert.equal((html.match(/is-discarded/g)||[]).length,4);assert.match(html,/low/);assert.match(html,/mid/);assert.match(html,/high/);});
test('trace escapes values',()=>{const html=context.searchTraceViewV366('linear_search',['<x>'],`"target"`,{focus:0,state:{i:0}});assert.doesNotMatch(html,/<x>/);assert.match(html,/&lt;x&gt;/);assert.match(html,/&quot;target&quot;/);});
console.log(`PASS — V366 SEARCH MODEL ${count}/${count}`);
