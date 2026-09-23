import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../../assets/lab-rebuild-v383.js',import.meta.url),'utf8');
const insertion='  cards();\n  const search=';
assert.ok(source.includes(insertion),'touch lab entry point changed');
const testSource=source.replace(insertion,`  globalThis.testLabs={
    scenarios,visual,
    search(value){target=value;searchLow=0;searchHigh=6;searchDone=false;},
    searchStep(){
      const mid=Math.floor((searchLow+searchHigh)/2),value=[1,3,5,7,9,11,13][mid];
      if(target===value)searchDone=true;
      else if(target<value)searchHigh=mid-1;
      else searchLow=mid+1;
      return searchDone;
    },
    subnet(prefix,octet){maskLength=prefix;lastOctet=octet;},
    transaction(step,finish){txStep=step;txFinish=finish;},
    cache(lines,read,hit){cacheLines=lines;cacheRead=read;cacheHit=hit;},
    paths(days){pathDays=days;}
  };
${insertion}`);
const context={
  document:{getElementById(id){return id==='labLessonGrid'?{querySelectorAll(){return []}}:null}},
  LAB_LESSON_IDS:[],LESSONS:{},console
};
context.globalThis=context;
vm.runInNewContext(testSource,context,{filename:'lab-rebuild-v383.js'});
const labs=context.testLabs;
assert.equal(Object.keys(labs.scenarios).length,34);
for(const [id,config] of Object.entries(labs.scenarios)){
  assert.ok(config.kind,`${id}: missing specific interaction`);
  const markup=labs.visual(config);
  assert.match(markup,/data-/,`${id}: missing interactive control`);
  assert.ok(!markup.includes('undefined'),`${id}: undefined text`);
}
for(const number of [1,3,5,7,9,11,13]){
  labs.search(number);
  let steps=0;
  while(!labs.searchStep() && ++steps<5){}
  assert.ok(steps<5,`binary search never found ${number}`);
}
for(const [prefix,octet,expected] of [[24,130,'192.168.1.0/24'],[25,130,'192.168.1.128/25'],[27,130,'192.168.1.128/27']]){
  labs.subnet(prefix,octet);
  assert.ok(labs.visual(labs.scenarios.subnet).includes(expected));
}
labs.transaction(1,'');
assert.match(labs.visual(labs.scenarios.transaction),/合計 <strong>170<\/strong>/);
labs.transaction(1,'rollback');
assert.match(labs.visual(labs.scenarios.transaction),/合計 <strong>200<\/strong>/);
labs.cache(['A'],'A',false);
assert.match(labs.visual(labs.scenarios.cache),/MISS/);
labs.cache(['A'],'A',true);
assert.match(labs.visual(labs.scenarios.cache),/HIT/);
labs.paths([1,1,5,5]);
assert.match(labs.visual(labs.scenarios.criticalpath),/クリティカルパス：B → D/);
console.log('34 touch labs and core simulation invariants verified');
