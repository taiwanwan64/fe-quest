const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const js=fs.readFileSync(path.join(root,'assets/app-v362.js'),'utf8');
const start=js.indexOf('function subjectAPracticeEvidenceV362(){');
const end=js.indexOf('function calcReadiness(){',start);
assert.ok(start>0&&end>start,'v362 readiness source is materialized');
const source=js.slice(start,end);
const profile={
  diagnosticCompleted:false,diagnosticScores:{},qStats:{},mockHistory:[],
  bProgress:{},securityBProgress:{},bFinalHistory:[]
};
const context=vm.createContext({
  profile,
  safeObject:v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},
  lessonCompletionAverage:()=>0,
  sortedSkills:()=>Array.from({length:8},(_,i)=>['cat'+i,50]),
  recentQuizRate:()=>0,
  subjectACognitiveEvidence:()=>0,
  recentAverageRate:()=>0,
  objectCompletion:()=>0,
  B_EXERCISES:[],SECURITY_SCENARIOS:[],
  memoryHealth:()=>({attempted:0,avg:0})
});
vm.runInContext(source,context);
const plain=x=>JSON.parse(JSON.stringify(x));
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name)}
test('fresh neutral priors are not counted as practice evidence',()=>{
  assert.equal(context.subjectAPracticeEvidenceV362(),false);
  assert.deepEqual(plain(context.readinessComponents()),{
    lesson:0,aPractice:0,aMock:0,bTraining:0,bExam:0,memoryEvidence:0,cognitive:0
  });
});
test('completed diagnostic counts as evidence',()=>{
  profile.diagnosticCompleted=true;
  assert.equal(context.subjectAPracticeEvidenceV362(),true);
  assert.equal(context.readinessComponents().aPractice,18);
  profile.diagnosticCompleted=false;
});
test('diagnostic score payload counts as evidence',()=>{
  profile.diagnosticScores={'基礎理論':70};
  assert.equal(context.subjectAPracticeEvidenceV362(),true);
  profile.diagnosticScores={};
});
test('an actual question attempt counts as evidence',()=>{
  profile.qStats={q1:{attempts:1,correct:0}};
  assert.equal(context.subjectAPracticeEvidenceV362(),true);
  assert.equal(context.readinessComponents().aPractice,18);
});
test('zero-attempt question placeholders remain no evidence',()=>{
  profile.qStats={q1:{attempts:0,correct:0},q2:{}};
  assert.equal(context.subjectAPracticeEvidenceV362(),false);
  assert.equal(context.readinessComponents().aPractice,0);
});
console.log('PASS — V362 COMPLETE RESET READINESS MODEL '+count+'/'+count);
