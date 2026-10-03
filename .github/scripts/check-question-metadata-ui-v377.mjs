import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assets/app-v377.js','utf8');
const loader=fs.readFileSync('cloud/activation-loader-v342.js','utf8');
const config=fs.readFileSync('cloud/public-config-v342.js','utf8');
function fn(name){
  const start=app.indexOf(`function ${name}(`),body=app.slice(start).match(/\)\s*\{/);
  assert.ok(start>=0&&body,name);
  let depth=0;
  for(let i=start+body.index+body[0].length-1;i<app.length;i++){
    if(app[i]==='{')depth++;
    else if(app[i]==='}'&&--depth===0)return app.slice(start,i+1);
  }
  throw Error('unclosed '+name);
}
const labels=['short','full'].map(kind=>({dataset:{subjectABankCount:kind},textContent:'loading'}));
const rowNodes=Array.from({length:6},()=>({textContent:'old count'}));
const rows=rowNodes.map((node,i)=>({dataset:{coreLesson:`core_06_0${i+1}`},querySelector:()=>node}));
const bank=JSON.parse(fs.readFileSync('assets/question-catalog-v376.json','utf8')).items.filter(q=>q.sourcePool==='subject_a');
const ctx={QUESTION_BANK:bank,console,rows,labels,
  document:{querySelectorAll:selector=>selector==='[data-subject-a-bank-count]'?labels:rows,createElement:()=>{throw Error('unexpected provider load');}},
  FEQUEST_PROTECTED_CONTENT:{version:'v376-provider-33-ipa92-v1-v35-bgap1',catalogTotal:1180},
  coreTopicLearningState:id=>({attempted:2,total:new Set(bank.filter(q=>q.coreTopicId===id&&!q.id.startsWith('challenge_cmp_')).map(q=>q.id)).size}),
  quizItems:[{id:'in-flight'}],profile:{sessions:[{total:12,correct:10}]}};
vm.createContext(ctx);
vm.runInContext(['isCoreTopicImmediatePracticeQuestion','coreTopicImmediatePracticeCountV377','refreshQuestionMetadataUIV377'].map(fn).join('\n'),ctx);
const profileBefore=JSON.stringify(ctx.profile),quizBefore=JSON.stringify(ctx.quizItems);
// Run the real synchronous metadata installer without starting cloud networking.
vm.runInContext(loader.replace("if(typeof document!=='undefined')Promise.resolve().then(()=>autoStart());",''),ctx);
assert.equal(labels[0].textContent,'問題バンク793問');
assert.equal(rowNodes[0].textContent,'テーマ演習 6問・バンク回答 2/6');
vm.runInContext(config,ctx);
assert.equal((await ctx.FEQUEST_IPA92_V35_PROVIDER_READY).ok,true);
assert.equal(labels[0].textContent,'問題バンク979問');
assert.equal(labels[1].textContent,'科目A 問題バンク：979問');
for(const [i,n] of [10,3,3,3,4,4].entries())assert.equal(rowNodes[i].textContent,`テーマ演習 ${n}問・バンク回答 2/${n}`);
// Reused provider and repeated metadata registration stay idempotent.
vm.runInContext(config,ctx);
await ctx.FEQUEST_IPA92_V35_PROVIDER_READY;
assert.equal(bank.length,979);
bank.push({...bank[0]});
ctx.refreshQuestionMetadataUIV377();
assert.equal(labels[0].textContent,'問題バンク979問','ignore duplicate IDs');
assert.equal(JSON.stringify(ctx.quizItems),quizBefore,'do not alter the in-flight quiz');
assert.equal(JSON.stringify(ctx.profile),profileBefore,'do not write learner history');
const html=fs.readFileSync('index.html','utf8');
assert.equal((html.match(/data-subject-a-bank-count=/g)||[]).length,2);
assert.ok(!html.includes('問題バンク710問')&&!html.includes('問題バンク：710問'));
console.log('PASS metadata UI: real delayed installers update 793→979, all Chapter 6 counts, reused provider, duplicate IDs, quiz/profile unchanged');
