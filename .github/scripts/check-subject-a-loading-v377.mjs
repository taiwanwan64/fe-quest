import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('assets/app-v377.js','utf8');
const start=source.indexOf('async function startQuiz(mode){');
const end=source.indexOf("document.querySelectorAll('.problem-mode button[data-mode]')",start);
assert.ok(start>=0&&end>start);

function fixture(mode){
  const nodes=new Map();
  const node=id=>{
    if(!nodes.has(id)){
      const classes=new Set(['show','picked']);
      nodes.set(id,{textContent:'OLD '+id,innerHTML:'OLD HTML',disabled:false,style:{display:'block'},
        classList:{add:token=>classes.add(token),remove:token=>classes.delete(token),contains:token=>classes.has(token)}});
    }
    return nodes.get(id);
  };
  let resolve,reject;
  const waiting=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const chips=[node('chip1'),node('chip2')];
  const context={document:{getElementById:node,querySelector:()=>node('actions'),querySelectorAll:()=>chips},
    ensureQuestionProfile(){},selectSubjectAMetadataV376:()=>Array.from({length:mode==='corechapter:5'?12:5},(_,i)=>({id:'metadata_'+i})),
    stopQuestionPacer(){},quizModeTitle:value=>value,configurePrescriptionUI(){},
    problemHub:node('hub'),quizResultScreen:node('result'),quizSession:node('session'),
    CORE_A_CURRICULUM:Array.from({length:4},()=>({chapter:5})),
    FEQUEST_V376_PROTECTED_FLOW:{prepareSubjectA:()=>waiting,reportSubjectAError:()=>{context.reported++;}},
    rendered:0,reported:0,renderQuizQuestion:()=>{context.rendered++;}};
  vm.createContext(context);
  vm.runInContext('let quizMode,quizItems,quizIndex,quizSelected,quizAnswered,quizCorrectCount,quizWrongCount,quizEarnedXp,quizPickedReason,quizRecoveredCount,sessionLog;\n'+source.slice(start,end),context);
  return {context,node,chips,resolve,reject,run:context.startQuiz(mode)};
}

for(const mode of ['coretopic:core_05_02','corechapter:5','mixed']){
  const f=fixture(mode);
  assert.equal(f.context.rendered,0,'render must wait for hydration');
  for(const id of ['quizCategory','quizDifficulty','quizResultTitle','quizExplanation','quizHint'])assert.equal(f.node(id).textContent,'','previous content cleared: '+id);
  assert.equal(f.node('quizQuestion').textContent,'問題を読み込み中…');
  assert.equal(f.node('quizOptions').innerHTML,'');
  assert.equal(f.node('quizSubmit').textContent,'読み込み中…');
  assert.equal(f.node('quizSubmit').disabled,true);
  for(const id of ['quizExplain','reasonBox'])assert.equal(f.node(id).classList.contains('show'),false);
  for(const id of ['variantBadge','rxTechnique','quizHintBtn'])assert.equal(f.node(id).style.display,'none');
  assert.ok(f.chips.every(chip=>!chip.classList.contains('picked')));
  assert.equal(f.node('quizCounter').textContent,mode==='corechapter:5'?'1 / 12':'1 / 5');
  f.resolve([{id:'hydrated'}]);
  assert.equal(await f.run,true);
  assert.equal(f.context.rendered,1,'render once after hydration');
}
const failure=fixture('corechapter:5');
failure.reject(new Error('synthetic hydration failure'));
assert.equal(await failure.run,false);
assert.equal(failure.context.reported,1);
assert.equal(failure.context.rendered,0,'failed hydration must not grade or render metadata');
assert.equal(failure.node('hub').style.display,'block');
assert.equal(failure.node('session').style.display,'none');
assert.equal(failure.node('quizSubmit').disabled,false);
console.log('PASS Subject A loading: previous content cleared before hydration, chapter/topic/mixed counts, success and error recovery');
