import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assets/app-v377.js','utf8');
const bridgeSource=fs.readFileSync('assets/protected-b-trace-bridge-v376.js','utf8');
assert.match(app,/const B_MOCK_QUOTAS=\{'基礎':2,'標準':4,'応用':2\}/);
assert.match(app,/const B_MOCK_SECONDS=40\*60/);
assert.match(app,/await bTraceBridgeV376\(\)\.startMiniMockSession/);
assert.match(app,/await bTraceBridgeV376\(\)\.gradeMiniMockSession/);
assert.doesNotMatch(app,/function bMockCandidateFromExercise\(\)\{return undefined;\}/);

const levels=['基礎','基礎','標準','標準','標準','標準','応用','応用'];
const ids=levels.map((_,i)=>`b_exercise_test_${i+1}`);
const forgotten=[],cleared=[],submitted=[];
const provider={
  hasAccessCode:()=>true,
  loadCatalog:async()=>({items:ids.map((id,i)=>({id,parentId:`test_${i+1}`,ordinal:1,level:levels[i],sourcePool:'b_exercise'}))}),
  hydrate:async requested=>({questions:requested.map(id=>({id,sourcePool:'b_exercise',stem:`Question ${id}`,options:['0','1','2','3'],renderContext:{traceSegment:{steps:[{line:0,state:{x:1}}]}}}))}),
  submit:async(id,choice)=>{submitted.push([id,choice]);return {questionId:id,correct:choice===0,answerIndex:0,explanation:'Explanation'}},
  forgetAnswer:id=>forgotten.push(id),
  clearHydrated:requested=>cleared.push(...requested),
};
const context={globalThis:{FEQUEST_PROTECTED_CONTENT:provider},document:{getElementById:()=>null},console,setTimeout};
vm.runInNewContext(bridgeSource,context);
const bridge=context.globalThis.FEQUEST_V376_B_TRACE;
const packets=await bridge.startMiniMockSession(ids);
assert.equal(packets.length,8);
assert.equal(packets[0].stem,'Question b_exercise_test_1');
assert.equal(Object.hasOwn(packets[0],'answerIndex'),false);
const results=await bridge.gradeMiniMockSession([null,0,1,1,1,1,1,1]);
assert.equal(results.length,8);
assert.equal(results[0].blank,true);
assert.equal(results[0].correct,false,'unanswered question with answer index zero must be wrong');
assert.equal(results[1].correct,true);
assert.equal(submitted[0][1],0);
assert.equal(forgotten.length,8);
bridge.clear();
assert.equal(cleared.length,8);
assert.equal(bridge.state().miniMockQuestionIds.length,0);
await assert.rejects(bridge.gradeMiniMockSession(Array(8).fill(0)),/session_missing/);
await assert.rejects(bridge.startMiniMockSession(ids.slice(0,7)),/question_count_invalid/);
let resumeHydration;
const originalHydrate=provider.hydrate;
provider.hydrate=()=>new Promise(resolve=>{resumeHydration=()=>resolve(originalHydrate(ids))});
const pending=bridge.startMiniMockSession(ids);
for(let i=0;i<20&&!resumeHydration;i++)await new Promise(resolve=>setImmediate(resolve));
assert.equal(typeof resumeHydration,'function');
bridge.clear();
resumeHydration();
await assert.rejects(pending,/session_cancelled/);
assert.equal(bridge.state().miniMockQuestionIds.length,0);
console.log('PASS Subject B mini mock: 8 hydrated, blank grading, cleanup and invalid session');
