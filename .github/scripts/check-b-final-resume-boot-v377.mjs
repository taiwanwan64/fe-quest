import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assets/app-v377.js','utf8');
const start=app.indexOf('function bootResilientUiStateV377(){');
const end=app.indexOf('\nwindow.FEQUEST_BOOT_OK = true;',start);
assert.ok(start>=0&&end>start);
const boot=app.slice(start,end);
const hydrateStart=app.indexOf('async function hydrateBFinalResumeV435(saved,remain){');
const hydrateEnd=app.indexOf('\nfunction restoreBFinalResume()',hydrateStart);
assert.ok(hydrateStart>=0&&hydrateEnd>hydrateStart);
const hydrate=app.slice(hydrateStart,hydrateEnd);
const saved={questionIds:Array.from({length:20},(_,i)=>'qa_'+i),optionMaps:Array.from({length:20},()=>[2,0,3,1]),answers:[0,1,2,3,0,...Array(15).fill(null)],flags:[2],index:5,startedAt:100};

function context(readyState){
  const listeners=[];const calls=[];const profile={xp:120,history:[]};
  const c=vm.createContext({document:{readyState,addEventListener:(name,fn,options)=>listeners.push({name,fn,options}),getElementById:()=>({classList:{remove:value=>calls.push(['remove',value])}})},profile,calls,Date,Math,Set,Error,
    bFinalBridgeV376:()=>{const bridge=c.FEQUEST_V376_B_FINAL;if(!bridge)throw new Error('v376_b_final_bridge_missing');return bridge;},
    restoreResilientUiState:()=>{c.bFinalBridgeV376();calls.push(['restore']);},
    bFinalProtectedItemV376:(packet,map)=>({id:packet.questionId,map:[...map]}),
    renderBFinalQuestion:()=>calls.push(['render']),startBFinalTimer:()=>calls.push(['timer']),saveBFinalResume:()=>calls.push(['save']),
    showAppNotice:(...args)=>calls.push(['notice',...args]),bFinalReleaseExamRuntimeV430:()=>calls.push(['release']),bFinalClearProtectedV376:()=>calls.push(['clear']),
    bFinalItems:[],bFinalAnswers:[],bFinalFlags:new Set(),bFinalIndex:0,bFinalSeconds:0,bFinalStartedAt:0,lastBFinalAttempt:{},B_FINAL_SECONDS:6000});
  const install=()=>{c.FEQUEST_V376_B_FINAL={startSession:async ids=>ids.map((id,i)=>({questionId:id,kind:i<16?'algo':'security'})),reportError:error=>calls.push(['report',error.message])};};
  return {c,listeners,calls,install};
}
const legacy=context('loading');
assert.throws(()=>vm.runInContext('restoreResilientUiState();',legacy.c),/bridge_missing/,'reproduce original script-order failure');
const delayed=context('loading');
const profileBefore=JSON.stringify(delayed.c.profile);
vm.runInContext(boot,delayed.c);
assert.equal(delayed.calls.length,0);
assert.equal(delayed.listeners.length,1);
assert.equal(delayed.listeners[0].name,'DOMContentLoaded');
assert.equal(delayed.listeners[0].options.once,true);
delayed.install();delayed.listeners[0].fn();
assert.equal(delayed.calls.filter(x=>x[0]==='restore').length,1);
assert.equal(JSON.stringify(delayed.c.profile),profileBefore);
for(const state of ['interactive','complete']){const x=context(state);x.install();vm.runInContext(boot,x.c);assert.equal(x.calls.length,1);assert.equal(x.listeners.length,0);}
vm.runInContext(hydrate,delayed.c);
assert.equal(await delayed.c.hydrateBFinalResumeV435(saved,5400),true);
assert.deepEqual(Array.from(delayed.c.bFinalAnswers),saved.answers);
assert.equal(delayed.c.bFinalIndex,5);
assert.equal(delayed.c.bFinalSeconds,5400);
assert.deepEqual(Array.from(delayed.c.bFinalFlags),[2]);
assert.deepEqual(Array.from(delayed.c.bFinalItems[0].map),saved.optionMaps[0]);
assert.equal(delayed.calls.filter(x=>x[0]==='timer').length,1);
assert.equal(JSON.stringify(delayed.c.profile),profileBefore);
for(const kind of ['missing','network','order']){
  const x=context('complete');if(kind!=='missing')x.install();
  if(kind==='network')x.c.FEQUEST_V376_B_FINAL.startSession=async()=>{throw new Error('network failure');};
  if(kind==='order')x.c.FEQUEST_V376_B_FINAL.startSession=async()=>Array.from({length:20},()=>({kind:'security'}));
  const before=JSON.stringify(saved);vm.runInContext(hydrate,x.c);
  assert.equal(await x.c.hydrateBFinalResumeV435(saved,5400),false,kind);
  assert.equal(JSON.stringify(saved),before,'keep retry metadata');
  assert.equal(x.calls.some(v=>v[0]==='timer'||v[0]==='save'),false);
  assert.equal(x.calls.filter(v=>v[0]==='release').length,1);
  assert.ok(x.calls.some(v=>v[0]==='notice'&&v[1]==='warning'));
}
console.log('PASS final resume cold boot: original race reproduced; delayed/immediate boot, preserved answers/order/flags/time, no profile writes, safe missing/network/order failures');
