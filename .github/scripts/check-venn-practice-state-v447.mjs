import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the shipped state handlers with DOM-shaped controls; this is not mobile layout QA.
const source=fs.readFileSync(process.argv[2]||'assets/first-impression-ux-v377.js','utf8');
function control(dataset={}){
  const classes=new Set();
  return {dataset,textContent:'',disabled:false,attributes:{},
    classList:{toggle(key,on){if(on)classes.add(key);else classes.delete(key);},remove(key){classes.delete(key);}},
    setAttribute(key,value){this.attributes[key]=value;}};
}
const ids=Object.fromEntries(['Formula','Explanation','PracticeStatus','PracticePrompt','Check','PracticeNext'].map(id=>['#ipa92Venn'+id,control()]));
const regionNames=['a','ab','b','outside'];
const regions=regionNames.map(vennRegion=>control({vennRegion}));
const shapes=regionNames.map(vennShape=>control({vennShape}));
const operationNames=['A','B','intersection','union','notA','notB','notIntersection','demorgan1','notUnion','demorgan2'];
const operations=operationNames.map(vennOperation=>control({vennOperation}));
const dialog={dataset:{},querySelector:key=>ids[key],querySelectorAll:key=>({'[data-venn-region]':regions,'[data-venn-shape]':shapes,'[data-venn-operation]':operations}[key]||[])};
const ctx=vm.createContext({document:{getElementById:()=>dialog}});
vm.runInContext(source.slice(source.indexOf('const VENN_DIALOG_ID='),source.indexOf('function protectedProvider'))+source.slice(source.indexOf('function vennSorted('),source.indexOf('function buildVennDialog(')),ctx);
const run=code=>vm.runInContext(code,ctx);
const chosen=()=>regions.filter(x=>x.attributes['aria-pressed']==='true').map(x=>x.dataset.vennRegion).sort();
const expected=[['a','ab'],['b','ab'],['ab'],['a','ab','b'],['b','outside'],['a','outside'],['a','b','outside'],['a','b','outside'],['outside'],['outside']];
operationNames.forEach((op,i)=>{run(`setVennOperation('${op}')`);assert.deepEqual(chosen(),expected[i].sort());assert.equal(ids['#ipa92VennCheck'].disabled,true);});
run('nextVennPractice()');
assert.equal(ids['#ipa92VennCheck'].disabled,false);
assert.equal(ids['#ipa92VennPracticeNext'].textContent,'次の練習へ');
run('checkVennPractice()');
assert.match(ids['#ipa92VennPracticeStatus'].textContent,/もう一度/);
run("handleVennRegion('ab');checkVennPractice()");
assert.match(ids['#ipa92VennPracticeStatus'].textContent,/^正解/);
run("handleVennRegion('ab')");
assert.doesNotMatch(ids['#ipa92VennPracticeStatus'].textContent,/正解/);
assert.deepEqual(chosen(),[]);
run('checkVennPractice()');
assert.match(ids['#ipa92VennPracticeStatus'].textContent,/もう一度/);
run("setVennOperation('union')");
assert.equal(ids['#ipa92VennCheck'].disabled,true);
assert.equal(ids['#ipa92VennPracticeNext'].textContent,'タップ練習を始める');
assert.doesNotMatch(ids['#ipa92VennPracticePrompt'].textContent,/タップしてください/);
run("handleVennRegion('outside')");
assert.match(ids['#ipa92VennExplanation'].textContent,/全体集合の中/);
// All six existing practice tasks, including multi-region answers and repeat-cycle behavior.
const practice=[['a','ab','b'],['b','outside'],['a','b','outside'],['outside'],['a','b','outside'],['ab']];
for(const answer of practice){
  run('nextVennPractice()');
  assert.deepEqual(chosen(),[]);
  for(const region of answer)run(`handleVennRegion('${region}')`);
  run('checkVennPractice()');
  assert.match(ids['#ipa92VennPracticeStatus'].textContent,/^正解/);
}
console.log('PASS Venn operations, practice grading, answer edits, mode reset and practice cycle');
