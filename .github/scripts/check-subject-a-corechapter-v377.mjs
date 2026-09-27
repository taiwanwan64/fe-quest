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
const names=['subjectAUniqueMetadataV376','subjectAPickCoreChapterMetadataV377','selectSubjectAMetadataV376'];
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
  }
}
console.log('PASS Subject A chapter check: fixture and public catalog, 12 unique questions, every topic, and scenario coverage');
