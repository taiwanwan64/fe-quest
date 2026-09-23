import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assets/app-v377.js','utf8');
const bridgeSource=fs.readFileSync('assets/protected-b-security-bridge-v376.js','utf8');
function functionSource(name){
  const start=app.indexOf(`function ${name}(`);
  assert.ok(start>=0,`missing ${name}`);
  let depth=0,body=false;
  for(let i=app.indexOf('{',start);i<app.length;i++){
    if(app[i]==='{'){depth++;body=true}
    if(app[i]==='}'&&--depth===0&&body)return app.slice(start,i+1);
  }
  throw new Error(`unclosed ${name}`);
}
// The selector is exercised with the actual public scenario metadata and log ID set.
const scenarioLine=app.match(/^const SECURITY_SCENARIOS=.*;$/m)?.[0];
const logLine=app.match(/^const B_FINAL_SECURITY_LOG_IDS_V376=.*;$/m)?.[0];
assert.ok(scenarioLine&&logLine);
const selectorContext={profile:{securityMockStats:{}},SECURITY_MOCK_COUNT:8,SECURITY_MOCK_QUOTAS:{'基礎':2,'標準':4,'応用':2},shuffled:rows=>[...rows],ensureSecurityMockStats(){}};
vm.createContext(selectorContext);
vm.runInContext([scenarioLine,logLine,...['securityAppliedStepIndex','securityScenarioSeen','sortSecurityScenarioPool','buildSecurityMock'].map(functionSource)].join('\n')+'\nthis.selected=buildSecurityMock();this.meta=SECURITY_SCENARIOS;',selectorContext);
const selected=selectorContext.selected,byId=new Map(selectorContext.meta.map(s=>[s.id,s]));
assert.equal(selected.length,8);
assert.equal(new Set(selected.map(x=>x.scenarioId)).size,8);
for(const [level,count] of Object.entries(selectorContext.SECURITY_MOCK_QUOTAS))assert.equal(selected.filter(x=>x.level===level).length,count);
assert.equal(selected.filter(x=>['ransomware','logs','password_spray','exfiltration'].includes(x.scenarioId)).length,2);
assert.ok(selected.every(x=>byId.get(x.scenarioId).steps.find(step=>step.id===x.questionId).ordinal>=2));

const ids=selected.map(x=>x.questionId),forgotten=[],cleared=[];
const provider={
  hasAccessCode:()=>true,
  loadCatalog:async()=>({items:selected.map(x=>({id:x.questionId,parentId:x.scenarioId,sourcePool:'b_security',level:x.level,ordinal:Number(x.questionId.at(-1)),concept:'ケース判断'}))}),
  hydrate:async requested=>({questions:requested.map(id=>{
    const row=selected.find(x=>x.questionId===id),log=['ransomware','logs','password_spray','exfiltration'].includes(row.scenarioId);
    return {id,sourcePool:'b_security',stem:`Question ${id}`,options:['0','1','2','3'],renderContext:{type:'security',parentId:row.scenarioId,title:'Scenario',incident:{title:'Incident',text:'Evidence'},log:log?'Log line':'',evidence:[]}};
  })}),
  submit:async(id,choice)=>({questionId:id,correct:choice===0,answerIndex:0,explanation:'Reason'}),
  forgetAnswer:id=>forgotten.push(id),clearHydrated:requested=>cleared.push(...requested),
};
const context={globalThis:{FEQUEST_PROTECTED_CONTENT:provider},document:{getElementById:()=>null},console,setTimeout};
vm.runInNewContext(bridgeSource,context);
const bridge=context.globalThis.FEQUEST_V376_B_SECURITY;
const packets=await bridge.startMiniMockSession(ids);
assert.equal(packets.length,8);
assert.equal(packets.filter(packet=>packet.log).length,2);
assert.ok(packets.every(packet=>!Object.hasOwn(packet,'answerIndex')));
const results=await bridge.gradeMiniMockSession([null,0,1,1,1,1,1,1]);
assert.equal(results[0].correct,false,'blank with answer index zero is wrong');
assert.equal(results[1].correct,true);
assert.equal(forgotten.length,8);
bridge.clear();
assert.equal(cleared.length,8);
await assert.rejects(bridge.gradeMiniMockSession(Array(8).fill(0)),/session_missing/);
let resumeHydration;
const originalHydrate=provider.hydrate;
provider.hydrate=()=>new Promise(resolve=>{resumeHydration=()=>resolve(originalHydrate(ids))});
const pending=bridge.startMiniMockSession(ids);
for(let i=0;i<20&&!resumeHydration;i++)await new Promise(resolve=>setImmediate(resolve));
assert.equal(typeof resumeHydration,'function');
bridge.clear();resumeHydration();
await assert.rejects(pending,/session_cancelled/);
assert.equal(bridge.state().miniMockQuestionIds.length,0);
console.log('PASS security mini mock: quotas, logs, protected hydrate, blank grade, cleanup and cancellation');
