import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/app-v377.js','utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)+start.length));
const helpers=extract('function bTraceClearFeedbackV377(','function bTraceApplyPacketV376(');
const apply=extract('function bTraceApplyPacketV376(','function bTraceRecordStudyPositionV376(');
const predict=extract('async function bTraceShowPredictionV376(','function traceNextRecommendation(');
assert(apply.startsWith('function bTraceApplyPacketV376('));
assert(predict.startsWith('async function bTraceShowPredictionV376('));
function setup(ordinal=1){
 const nodes=new Map(),classes=()=>({add(){},remove(){}});
 const el=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',style:{},classList:classes(),children:[],replaceChildren(){this.children=[]},appendChild(x){this.children.push(x)},querySelectorAll(){return this.children}});return nodes.get(id)};
 const packet={parentId:'synthetic-parent',questionId:'synthetic-question',ordinal,stem:'Synthetic prediction',options:['one','two','three','four'],hint:'Synthetic hint',traceSegment:{code:['synthetic line'],steps:[{state:{value:1}}]}};
 let grades=0,saves=0,nexts=0,wrong=false,failed=false;
 const resolved=[];
 const feedback='Synthetic explanation <b>plain text</b>';
 const bridge={state:()=>({resolvedOrdinals:resolved}),grade:async()=>{grades++;if(failed)throw Error('synthetic transport error');if(wrong)return {correct:false};resolved.push(ordinal);return {correct:true,explanation:feedback,tail:ordinal===2?{...packet,phase:'tail'}:null}},next:async()=>{nexts++;return {...packet,ordinal:2}},reportError(){}};
 const c={document:{getElementById:el,createElement:()=>({className:'',textContent:'',disabled:false,classList:classes()})},currentB:null,bTracePacketV376:packet,bTraceGradeBusyV376:false,bTraceFinalResultV376:null,bStepIndex:0,bPredictionSatisfied:true,lastBState:{},profile:{xp:120},escapeHtml:x=>x,popToast:x=>c.toast=x,setTimeout:fn=>fn(),performance:{now:()=>0},bTraceGenericTitleV376:()=> 'Synthetic trace',resetBView:()=>{el('bTraceMessage').textContent='Initial instructions';el('predictionBox').classList.remove('show')},bTraceBridgeV376:()=>bridge,bTraceRecordStudyPositionV376(){},saveProfile:()=>{saves++;return true},finishBExercise(){},studyActiveV373:null};
 vm.createContext(c);vm.runInContext(helpers+'\n'+apply+'\n'+predict,c);
 return {c,el,packet,feedback,counts:()=>({grades,saves,nexts}),wrong:()=>wrong=true,correct:()=>wrong=false,fail:()=>failed=true};
}
for(const ordinal of [1,2]){
 const t=setup(ordinal);await t.c.bTraceShowPredictionV376();
 await t.el('predictionOptions').children[0].onclick();
 assert.equal(t.el('bTraceMessage').textContent,t.feedback,'grade explanation must survive packet reset (ordinal '+ordinal+')');
 assert.equal(t.c.profile.xp,125);
 assert.equal(t.el('bTraceMessage').innerHTML,'','explanation uses textContent only');
 assert.deepEqual(t.counts(),{grades:1,saves:1,nexts:ordinal===1?1:0});
 t.c.bTraceApplyPacketV376(t.packet);
 assert.equal(t.el('bTraceMessage').textContent,'Initial instructions','new session must not retain earlier feedback');
}
const wrong=setup();wrong.wrong();await wrong.c.bTraceShowPredictionV376();await wrong.el('predictionOptions').children[2].onclick();
assert.equal(wrong.c.profile.xp,120);assert.equal(wrong.counts().nexts,0);assert.equal(wrong.c.bPredictionSatisfied,false);
assert(wrong.el('predictionOptions').children.every(x=>!x.disabled));assert.equal(wrong.c.toast,'ヒント：Synthetic hint');
wrong.correct();await wrong.el('predictionOptions').children[0].onclick();assert.equal(wrong.c.profile.xp,125);assert.equal(wrong.el('bTraceMessage').textContent,wrong.feedback);
const failure=setup();failure.fail();await failure.c.bTraceShowPredictionV376();await failure.el('predictionOptions').children[0].onclick();assert.equal(failure.c.profile.xp,120);assert.equal(failure.counts().saves,0);assert.equal(failure.c.bTraceGradeBusyV376,false);
assert(failure.el('predictionOptions').children.every(x=>!x.disabled));
const cached=setup(2);await cached.c.bTraceShowPredictionV376();await cached.el('predictionOptions').children[0].onclick();cached.c.bTracePacketV376=cached.packet;await cached.c.bTraceShowPredictionV376();await cached.el('predictionOptions').children[0].onclick();assert.equal(cached.c.profile.xp,125);assert.equal(cached.counts().grades,1);assert.equal(cached.el('bTraceMessage').textContent,cached.feedback);
console.log('PASS: protected B trace explanations survive ordinal/tail transitions; retry, XP, checkpoint and plain-text contracts preserved');

