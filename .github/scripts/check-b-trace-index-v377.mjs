import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/app-v377.js','utf8');
const start=source.indexOf('function renderBVisual(step){');
assert(start>=0);
const fn=source.slice(start,source.indexOf('function showBPrediction()',start));
const visual={innerHTML:''};
const ctx={document:{getElementById:id=>{assert.equal(id,'bVisual');return visual}},currentB:{},escapeHtml:x=>String(x),searchTraceViewV366:()=> 'search-view',sortTraceViewV367:()=> 'sort-view'};
vm.createContext(ctx);vm.runInContext(fn,ctx);
for(const id of ['array_max','array_reverse','count_even']){
 ctx.currentB={id,array:[101,202,303]};
 ctx.renderBVisual({focus:1});
 assert.deepEqual([...visual.innerHTML.matchAll(/trace-array-index">([^<]+)/g)].map(x=>x[1]),['1','2','3']);
 assert(/trace-array-cell focus *">202/.test(visual.innerHTML),'zero-based focus must still highlight the second value');
 assert(!/trace-array-cell focus *">101/.test(visual.innerHTML));
 ctx.renderBVisual({arrayState:[909,808,707],focus:2});assert(/trace-array-cell focus *">707/.test(visual.innerHTML));
}
ctx.currentB={matrix:[[101,102,103],[201,202,203]]};ctx.renderBVisual({matrixFocus:[1,2]});
assert.deepEqual([...visual.innerHTML.matchAll(/trace-matrix-index">([^<]+)/g)].map(x=>x[1]),['1,1','1,2','1,3','2,1','2,2','2,3']);
assert(visual.innerHTML.includes('trace-matrix-cell focus">203'),'matrix highlight stays zero-based internally');
for(const id of ['linear_search','binary_search_b']){ctx.currentB={id,array:[101]};ctx.renderBVisual({});assert.equal(visual.innerHTML,'search-view');}
for(const id of ['bubble_sort_b','selection_sort_b']){ctx.currentB={id,array:[101]};ctx.renderBVisual({});assert.equal(visual.innerHTML,'sort-view');}
console.log('PASS: B trace array/matrix labels are one-based; internal highlight and dedicated search/sort renderers unchanged');
