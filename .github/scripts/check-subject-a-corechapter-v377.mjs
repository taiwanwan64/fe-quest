import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assets/app-v377.js','utf8');
function functionSource(name){
  const start=app.indexOf(`function ${name}(`);
  assert.ok(start>=0,`missing ${name}`);
  let depth=0;
  for(let i=app.indexOf('{',start);i<app.length;i++){
    if(app[i]==='{')depth++;
    else if(app[i]==='}'&&--depth===0)return app.slice(start,i+1);
  }
  throw new Error(`unclosed ${name}`);
}
const names=['isCoreTopicImmediatePracticeQuestion','subjectAUniqueMetadataV376','subjectASpaceKnownOverlapV377','subjectAPickCoreChapterMetadataV377','selectSubjectAMetadataV376'];
const curriculum=Array.from({length:5},(_,i)=>({chapter:3,id:`core_03_0${i+1}`}));
const bank=curriculum.flatMap((topic,i)=>Array.from({length:5},(_,j)=>({id:`${topic.id}_${j}`,coreTopicId:topic.id,angle:i===3&&j===0?'scenario':'knowledge'})));
const catalog=JSON.parse(fs.readFileSync('assets/question-catalog-v376.json','utf8'));
const publishedBank=catalog.items.filter(item=>curriculum.some(topic=>topic.id===item.coreTopicId));
for(const source of [bank,publishedBank]){
  const ctx={QUESTION_BANK:source,CORE_A_CURRICULUM:curriculum,CORE_A_CHAPTER_EXTRA_QUESTIONS:{},subjectATrackedMetadataV376:()=>[],globalThis:{}};
  vm.createContext(ctx);
  vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;',ctx);
  for(let i=0;i<100;i++){
    const selected=Array.from(ctx.select('corechapter:3'));
    assert.equal(selected.length,12,'chapter check must match the 12-question label');
    assert.equal(new Set(selected.map(item=>item.id)).size,12,'no repeated question IDs');
    for(const topic of curriculum)assert.ok(selected.some(item=>item.coreTopicId===topic.id),`missing ${topic.id}`);
    assert.ok(selected.some(item=>item.angle==='scenario'),'include a cross-topic scenario when available');
    const pair=['coreq_03_05_2','coreq_03_05_3'].map(id=>selected.findIndex(item=>item.id===id));
    if(pair.every(index=>index>=0))assert.ok(Math.abs(pair[0]-pair[1])>1,'do not place overlapping JSON questions together');
  }
}

const chapter4Curriculum=Array.from({length:6},(_,i)=>({chapter:4,id:`core_04_0${i+1}`}));
const chapter4PublishedBank=catalog.items.filter(item=>chapter4Curriculum.some(topic=>topic.id===item.coreTopicId));
assert.ok(chapter4PublishedBank.length>=18,'chapter 4 public catalog must include the six core topics');
const chapter4Ctx={QUESTION_BANK:chapter4PublishedBank,CORE_A_CURRICULUM:chapter4Curriculum,CORE_A_CHAPTER_EXTRA_QUESTIONS:{},subjectATrackedMetadataV376:()=>[],globalThis:{}};
vm.createContext(chapter4Ctx);
vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;',chapter4Ctx);
for(let i=0;i<100;i++){
  const selected=Array.from(chapter4Ctx.select('corechapter:4'));
  assert.equal(selected.length,12,'chapter 4 check must match the 12-question label');
  assert.equal(new Set(selected.map(item=>item.id)).size,12,'chapter 4 check must not repeat question IDs');
  for(const topic of chapter4Curriculum)assert.ok(selected.some(item=>item.coreTopicId===topic.id),`chapter 4 check missing ${topic.id}`);
  assert.ok(selected.some(item=>item.angle==='scenario'),'chapter 4 check should include a scenario question when available');
}

const extensions=['assets/question-catalog-ipa92-v1-v6.json','assets/question-catalog-ipa92-v28.json']
  .flatMap(path=>JSON.parse(fs.readFileSync(path,'utf8')).items.filter(item=>item.coreTopicId==='core_03_05'));
const topicCtx={QUESTION_BANK:[...publishedBank,...extensions],CORE_A_CURRICULUM:curriculum,CORE_A_CHAPTER_EXTRA_QUESTIONS:{},subjectATrackedMetadataV376:()=>[],globalThis:{}};
vm.createContext(topicCtx);
vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;',topicCtx);
for(let i=0;i<100;i++){
  const selected=Array.from(topicCtx.select('coretopic:core_03_05'));
  const pair=['coreq_03_05_2','coreq_03_05_3'].map(id=>selected.findIndex(item=>item.id===id));
  assert.ok(pair.every(index=>index>=0)&&Math.abs(pair[0]-pair[1])>1,'space overlapping JSON questions in topic practice');
  assert.equal(selected.length,6,'topic practice matches the six-question label and excludes its chapter comparison');
  assert.ok(selected.every(item=>!item.id.startsWith('challenge_cmp_')),'chapter comparisons belong to the chapter check');
}
console.log('PASS Subject A chapter/topic selection: 12 chapter questions, every topic including all six Chapter 4 topics, no immediate comparison, and spaced JSON overlap');
