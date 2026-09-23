import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assets/app-v377.js','utf8');
const catalog=JSON.parse(fs.readFileSync('assets/question-catalog-v376.json','utf8'));
function source(name){
  const start=app.indexOf(`function ${name}(`);
  assert.ok(start>=0,`missing ${name}`);
  let depth=0;
  for(let i=app.indexOf('{',start);i<app.length;i++){
    if(app[i]==='{')depth++;
    else if(app[i]==='}'&&--depth===0)return app.slice(start,i+1);
  }
  throw new Error(`unclosed ${name}`);
}
const QUESTION_BANK=catalog.items.filter(item=>item.sourcePool==='subject_a');
const first=QUESTION_BANK.find(item=>item.cat&&item.cognitiveLevel);
assert.ok(first);
const profile={qStats:{},skills:{[first.cat]:80},mockHistory:[],bProgress:{},securityBProgress:{},bFinalHistory:[]};
const ctx={QUESTION_BANK,profile,COGNITIVE_WEIGHTS:{'想起':.8,'適用':1,'判断':1.25},ensureQuestionProfile(){},safeObject:value=>value&&typeof value==='object'?value:{},memoryRetention:()=>100,lessonCompletionAverage:()=>70,sortedSkills:()=>[[first.cat,80]],recentQuizRate:()=>80,recentAverageRate:()=>0,diagnosticOverallRateV377:()=>80,B_EXERCISES:[],SECURITY_SCENARIOS:[],objectCompletion:()=>0,memoryHealth:()=>({attempted:0})};
vm.createContext(ctx);
vm.runInContext(['cognitiveLevelEvidence','categoryCognitiveEvidence','subjectACognitiveEvidence','subjectAPracticeEvidenceV362','readinessComponents'].map(source).join('\n')+'\nthis.evaluate=readinessComponents;this.cognitiveEvidence=subjectACognitiveEvidence;',ctx);
// The screening result remains capped before normal question practice.
assert.equal(ctx.cognitiveEvidence(),null);
assert.equal(ctx.evaluate().aPractice,20);
profile.qStats[first.id]={attempts:1,correct:1};
const evidence=ctx.cognitiveEvidence();
assert.ok(evidence>0&&evidence<=100);
assert.equal(ctx.evaluate().cognitive,evidence);
assert.ok(ctx.evaluate().aPractice>52,'previously the cognitive component was fixed to zero');
profile.qStats[first.id]={attempts:1,correct:0};
assert.ok(ctx.cognitiveEvidence()<evidence,'an incorrect answer lowers the measured evidence');
profile.qStats={};
assert.equal(ctx.cognitiveEvidence(),null,'unused metadata never grants readiness');
console.log('PASS Subject A readiness: no practice, real catalog evidence, correct/wrong contrast');
