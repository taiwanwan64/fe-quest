import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync('assets/protected-flow-bridge-v376.js','utf8');
const values=value=>JSON.parse(JSON.stringify(value));
const serverOptions=Object.freeze(['same','same','third','last']);
const serverFeedback=Object.freeze(['feedback0','feedback1','feedback2','feedback3']);

function runtime(draws,answerIndex=0){
  let randomCalls=0,submitCalls=0,forgetCalls=0;
  const submitted=[],cleared=[];
  const math=Object.create(Math);
  math.random=()=>{assert.ok(randomCalls<draws.length,'unexpected extra shuffle');return draws[randomCalls++];};
  const provider={
    hasAccessCode:()=>true,
    loadCatalog:async()=>({items:[{id:'audit_fixture',sourcePool:'subject_a',concept:'fixture'}]}),
    hydrate:async ids=>({questions:ids.map(id=>({id,stem:'synthetic question',options:serverOptions,hint:'hint',renderContext:{fixture:true}}))}),
    clearHydrated:ids=>{cleared.push([...ids]);return ids.length;},
    submit:async(id,index)=>{
      submitCalls++;submitted.push({id,index});
      return Object.freeze({questionId:id,correct:index===answerIndex,answerIndex,explanation:'explanation',choiceExplanations:serverFeedback,postSubmit:Object.freeze({fixture:true})});
    },
    forgetAnswer:()=>{forgetCalls++;},
  };
  const ctx={console,Math:math,document:{readyState:'loading',addEventListener(){}},FEQUEST_PROTECTED_CONTENT:provider};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  return {flow:ctx.FEQUEST_V376_PROTECTED_FLOW,provider,submitted,cleared,counts:()=>({randomCalls,submitCalls,forgetCalls})};
}

const permutations=new Set(),answerPositions=new Set();
let checked=0;
for(let a=0;a<4;a++)for(let b=0;b<3;b++)for(let c=0;c<2;c++){
  const swaps=[a,b,c],map=[0,1,2,3];
  for(let i=3;i>0;i--){const j=swaps[3-i];[map[i],map[j]]=[map[j],map[i]];}
  permutations.add(map.join(','));
  for(let answer=0;answer<4;answer++){
    const r=runtime([(a+.5)/4,(b+.5)/3,(c+.5)/2],answer);
    const source={id:'audit_fixture',a:3,exp:'must not hydrate',choiceExplanations:['must not hydrate']};
    const [q]=await r.flow.prepareSubjectA([source,source]);
    assert.deepEqual(values(q.options),map.map(i=>serverOptions[i]));
    assert.equal(q.id,'audit_fixture');
    assert.equal(q.a,undefined);assert.equal(q.exp,undefined);assert.equal(q.choiceExplanations,undefined);
    assert.equal(Object.keys(q).some(k=>/map|answer/i.test(k)),false,'answer/map must not be public metadata');
    assert.deepEqual(values(q.renderContext),{fixture:true});
    for(let selected=0;selected<4;selected++){
      const result=await r.flow.gradeSubjectA(q,selected);
      assert.deepEqual(r.submitted.at(-1),{id:'audit_fixture',index:map[selected]});
      assert.equal(result.correct,map[selected]===answer);
      assert.equal(result.answerIndex,map.indexOf(answer));
      assert.deepEqual(values(result.choiceExplanations),map.map(i=>serverFeedback[i]));
      assert.equal(result.explanation,'explanation');assert.deepEqual(values(result.postSubmit),{fixture:true});
      answerPositions.add(result.answerIndex);checked++;
    }
    assert.deepEqual(r.counts(),{randomCalls:3,submitCalls:4,forgetCalls:4});
    assert.deepEqual([...serverOptions],['same','same','third','last']);
    assert.deepEqual([...serverFeedback],['feedback0','feedback1','feedback2','feedback3']);
    await assert.rejects(r.flow.gradeSubjectA({...q},0),/choice_map_missing/);
    for(const bad of [-1,4,.5,'0',null])await assert.rejects(r.flow.gradeSubjectA(q,bad),/choice_index_invalid/);
    r.flow.clearSubjectASession();
    await assert.rejects(r.flow.gradeSubjectA(q,0),/choice_map_missing/);
    assert.deepEqual(r.cleared,[['audit_fixture']]);
  }
}
assert.equal(permutations.size,24);assert.equal(answerPositions.size,4);assert.equal(checked,384);

// A fresh preparation expires the old object's map, while each retry retains its own order.
const r=runtime([.1,.2,.3,.7,.8,.9]);
const [old]=await r.flow.prepareSubjectA([{id:'audit_fixture'}]);
const [fresh]=await r.flow.prepareSubjectA([{id:'audit_fixture'}]);
await assert.rejects(r.flow.gradeSubjectA(old,0),/choice_map_missing/);
const one=await r.flow.gradeSubjectA(fresh,0),two=await r.flow.gradeSubjectA(fresh,0);
assert.deepEqual(values(one),values(two));
assert.deepEqual(r.submitted[0],r.submitted[1]);

// Failures still discard provider answer memory; malformed correct positions cannot reach the UI.
r.provider.submit=async()=>{throw new Error('synthetic network failure');};
await assert.rejects(r.flow.gradeSubjectA(fresh,0),/synthetic network failure/);
r.provider.submit=async()=>({answerIndex:4});
await assert.rejects(r.flow.gradeSubjectA(fresh,0),/answer_index_invalid/);
r.provider.submit=async()=>({answerIndex:0,choiceExplanations:[]});
assert.deepEqual(values((await r.flow.gradeSubjectA(fresh,0)).choiceExplanations),['','','','']);
assert.equal(r.counts().forgetCalls,5);
console.log('PASS Subject A: all24 option permutations ×4 correct positions ×4 selections =384 grading/feedback cases');
console.log('PASS duplicate text, hidden grading metadata, retries, cleanup, fresh-session isolation and provider failures');
