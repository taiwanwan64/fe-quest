const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../..');
const js=fs.readFileSync(path.join(root,'assets/app-v363.js'),'utf8');
function functionBlock(name,next){
  const start=js.indexOf(`function ${name}(`);
  const end=js.indexOf(`function ${next}(`,start);
  assert.ok(start>0&&end>start,`${name} source is materialized`);
  return js.slice(start,end);
}

const nodes={};
function node(id){
  return nodes[id]||(nodes[id]={
    textContent:'',innerHTML:'',attributes:{},classes:new Set(),
    style:{values:{},setProperty(key,value){this.values[key]=String(value)}},
    classList:{toggle(name,force){force?nodes[id].classes.add(name):nodes[id].classes.delete(name)}},
    setAttribute(key,value){this.attributes[key]=String(value)}
  });
}
['memoryHealthRing','memoryHealthValue','memoryHealthCaption','memoryFreshCount','memorySoonCount','memoryDueCount','memoryHealthAdvice'].forEach(node);

const questions=[{id:'q1',weight:1},{id:'q2',weight:3}];
const profile={qStats:{}};
const context=vm.createContext({
  profile,
  ensureQuestionProfile:()=>{},
  trackedQuestionPool:()=>questions,
  memoryRetention:stat=>stat.retention,
  cognitiveWeight:q=>q.weight,
  isDue:()=>false,
  document:{getElementById:id=>nodes[id]||null}
});
vm.runInContext(functionBlock('memoryHealth','isDue')+functionBlock('renderMemoryHealth','renderReviewForecast'),context);

let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name)}

test('empty evidence has no synthetic retention',()=>{
  assert.deepEqual(JSON.parse(JSON.stringify(context.memoryHealth())),{attempted:0,avg:0,fresh:0,soon:0,due:0});
});

test('empty evidence renders a zero ring and unmeasured labels',()=>{
  context.renderMemoryHealth();
  assert.equal(nodes.memoryHealthRing.style.values['--memory-p'],'0');
  assert.equal(nodes.memoryHealthRing.classes.has('is-unmeasured'),true);
  assert.equal(nodes.memoryHealthRing.attributes['aria-label'],'記憶保持率は未計測です');
  assert.equal(nodes.memoryHealthValue.textContent,'未計測');
  assert.equal(nodes.memoryHealthCaption.textContent,'問題演習後に表示');
  assert.deepEqual(['memoryFreshCount','memorySoonCount','memoryDueCount'].map(id=>nodes[id].textContent),[0,0,0]);
});

test('measured retention calculation remains weighted',()=>{
  profile.qStats={q1:{attempts:1,retention:90},q2:{attempts:1,retention:70}};
  assert.deepEqual(JSON.parse(JSON.stringify(context.memoryHealth())),{attempted:2,avg:75,fresh:0,soon:1,due:1});
});

test('measured evidence restores percentage presentation',()=>{
  context.renderMemoryHealth();
  assert.equal(nodes.memoryHealthRing.style.values['--memory-p'],'75');
  assert.equal(nodes.memoryHealthRing.classes.has('is-unmeasured'),false);
  assert.equal(nodes.memoryHealthRing.attributes['aria-label'],'推定記憶保持率 75%');
  assert.equal(nodes.memoryHealthValue.textContent,'75%');
  assert.equal(nodes.memoryHealthCaption.textContent,'推定保持');
  assert.deepEqual(['memoryFreshCount','memorySoonCount','memoryDueCount'].map(id=>nodes[id].textContent),[0,1,1]);
});

test('zero-attempt placeholders remain unmeasured',()=>{
  profile.qStats={q1:{attempts:0,retention:100},q2:{}};
  assert.equal(context.memoryHealth().attempted,0);
  assert.equal(context.memoryHealth().avg,0);
});

console.log('PASS — V363 MEMORY HEALTH MODEL '+count+'/'+count);
