const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'app/linked-list-diagrams-v365.js'),'utf8');
const context={Set,escapeHtml:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')};
vm.createContext(context);vm.runInContext(source,context);
let count=0;function test(name,fn){fn();count++;process.stdout.write(`PASS ${name}\n`);}
test('core diagram is limited to data structures',()=>{assert.equal(context.coreTopicLinkedListDiagramViewV365('core_03_02'),'');assert.match(context.coreTopicLinkedListDiagramViewV365('core_03_01'),/data-ll-diagram="core"/);});
test('logical order differs from memory order',()=>{const h=context.coreTopicLinkedListDiagramViewV365('core_03_01');assert.deepEqual([...h.matchAll(/data-ll-node="([^"]+)"/g)].map(x=>x[1]),['A','C','D']);assert.ok(h.includes('番地順は A → D → C')&&h.includes('<b>A → C → D</b>'));});
test('insertion preserves the old successor first',()=>{const h=context.coreTopicLinkedListDiagramViewV365('core_03_01');assert.ok(h.indexOf('B.next ← C')<h.indexOf('A.next ← B'));assert.ok(h.includes('A.next ← B.next'));});
test('trace exposes next fields and current p',()=>{const h=context.linkedListTraceViewV365([{id:'A',value:5},{id:'B',value:7},{id:'C',value:9}],'B',['A','B']);assert.deepEqual([...h.matchAll(/<code>next: ([^<]+)<\/code>/g)].map(x=>x[1]),['B','C','null']);assert.ok(h.includes('data-ll-current="B"'));assert.equal((h.match(/ visited/g)||[]).length,2);});
test('null pointer is explicit',()=>{const h=context.linkedListTraceViewV365([{id:'A',value:1}],null,['A']);assert.ok(h.includes('data-ll-current="null"')&&h.includes('null（末尾まで到達）'));});
test('trace escapes without mutation',()=>{const list=[{id:'<A>',value:'<&>'}],before=JSON.stringify(list),h=context.linkedListTraceViewV365(list,'<A>',[]);assert.equal(JSON.stringify(list),before);assert.ok(!h.includes('<A>')&&h.includes('&lt;A&gt;')&&h.includes('&lt;&amp;&gt;'));});
console.log(`PASS — V365 LINKED LIST MODEL ${count}/${count}`);
