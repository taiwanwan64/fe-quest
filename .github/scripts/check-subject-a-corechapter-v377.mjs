import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assets/app-v377.js','utf8');
function functionSource(name){
  const start=app.indexOf(`function ${name}(`);
  assert.ok(start>=0,`missing ${name}`);
  let depth=0;
  // A default argument can contain braces (showScreen opts={}); start at the body.
  const body = app.slice(start).match(/\)\s*\{/);
  assert.ok(body, 'function body missing: ' + name);
  for(let i=start+body.index+body[0].length-1;i<app.length;i++){
    if(app[i]==='{')depth++;
    else if(app[i]==='}'&&--depth===0)return app.slice(start,i+1);
  }
  throw new Error(`unclosed ${name}`);
}
const names=['isCoreTopicImmediatePracticeQuestion','coreTopicImmediatePracticeCountV377','subjectAUniqueMetadataV376','subjectASpaceKnownOverlapV377','subjectAPickCoreChapterMetadataV377','selectSubjectAMetadataV376'];
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
const chapter6Curriculum = Array.from({length:6}, (_, i) => ({chapter:6, id:`core_06_0${i+1}`}));
const chapter6Bank = [...new Map(fs.readdirSync('assets')
  .filter(file => /^question-catalog.*\.json$/.test(file))
  .flatMap(file => JSON.parse(fs.readFileSync('assets/' + file, 'utf8')).items || [])
  .filter(item => item.coreTopicId?.startsWith('core_06_'))
  .map(item => [item.id, item])).values()];
assert.equal(chapter6Bank.length, 32, 'all current Chapter 6 metadata represented');
const chapter6Ctx = {QUESTION_BANK:chapter6Bank, CORE_A_CURRICULUM:chapter6Curriculum,
  CORE_A_CHAPTER_EXTRA_QUESTIONS:{}, subjectATrackedMetadataV376:() => [], globalThis:{}};
vm.createContext(chapter6Ctx);
vm.runInContext(names.map(functionSource).join('\n') + '\nthis.select=selectSubjectAMetadataV376;', chapter6Ctx);
for (let i=0; i<100; i++) {
  const selected = Array.from(chapter6Ctx.select('corechapter:6'));
  assert.equal(selected.length, 12, 'Chapter 6 entry label equals actual selection');
  assert.equal(new Set(selected.map(item => item.id)).size, 12);
  for (const topic of chapter6Curriculum) assert.ok(selected.some(item => item.coreTopicId === topic.id), topic.id);
  assert.ok(selected.some(item => item.angle === 'comparison' || item.angle === 'scenario'));
}
for (const [i, topic] of chapter6Curriculum.entries()) {
  const selected = Array.from(chapter6Ctx.select('coretopic:' + topic.id));
  assert.equal(selected.length, [10, 3, 3, 3, 4, 4][i], 'direct-practice count ' + topic.id);
  assert.equal(chapter6Ctx.coreTopicImmediatePracticeCountV377(topic.id), selected.length, 'displayed count equals actual selection');
  assert.ok(selected.every(item => !item.id.startsWith('challenge_cmp_')));
}
const delayedBank = chapter6Bank.filter(item => item.id.startsWith('coreq_'));
const delayedCtx = {QUESTION_BANK:delayedBank};
vm.createContext(delayedCtx);
vm.runInContext(functionSource('isCoreTopicImmediatePracticeQuestion') + '\n' + functionSource('coreTopicImmediatePracticeCountV377'), delayedCtx);
assert.equal(delayedCtx.coreTopicImmediatePracticeCountV377('core_06_01'), 3);
delayedBank.push(...chapter6Bank.filter(item => !item.id.startsWith('coreq_')));
assert.equal(delayedCtx.coreTopicImmediatePracticeCountV377('core_06_01'), 10, 'late metadata replaces the initial three-question count');
delayedBank.push({...chapter6Bank[0]}, {id:'extra-os', coreTopicId:'core_06_01'});
assert.equal(delayedCtx.coreTopicImmediatePracticeCountV377('core_06_01'), 10, 'unique IDs and session cap');
assert.ok(app.includes('テーマ演習 ${coreTopicImmediatePracticeCountV377(t.id)}問'));
assert.ok(app.includes('${coreTopicImmediatePracticeCountV377(activeLesson)}問で'));
const showScreenSource = functionSource('showScreen');
assert.ok(showScreenSource.indexOf('refreshCoreCourseProgress()') < showScreenSource.indexOf('renderLearningEntry()'), 'refresh cached course DOM on entry before early-returning recommendations');
const chapter7Curriculum = ['core_07_01', 'core_07_02'].map(id => ({chapter:7, id}));
const chapter7Metadata = [...new Map(fs.readdirSync('assets')
  .filter(file => /^question-catalog.*\.json$/.test(file))
  .flatMap(file => JSON.parse(fs.readFileSync('assets/' + file, 'utf8')).items || [])
  .filter(item => item.coreTopicId?.startsWith('core_07_'))
  .map(item => [item.id, item])).values()];
assert.equal(chapter7Metadata.length, 16);
const chapter7Bank = chapter7Metadata.filter(item => item.sourcePool === 'subject_a');
const chapter7Extras = chapter7Metadata.filter(item => item.sourcePool === 'chapter_extra');
assert.equal(chapter7Bank.length, 12);
assert.equal(chapter7Extras.length, 4);
const chapter7Ctx = {QUESTION_BANK:chapter7Bank, CORE_A_CURRICULUM:chapter7Curriculum,
  CORE_A_CHAPTER_EXTRA_QUESTIONS:{'7':chapter7Extras}, subjectATrackedMetadataV376:() => chapter7Metadata, globalThis:{}};
vm.createContext(chapter7Ctx);
vm.runInContext(names.map(functionSource).join('\n') + '\nthis.select=selectSubjectAMetadataV376;', chapter7Ctx);
for (let i=0; i<100; i++) {
  const selected = Array.from(chapter7Ctx.select('corechapter:7'));
  assert.equal(selected.length, 12);
  assert.equal(new Set(selected.map(item => item.id)).size, 12);
  for (const topic of chapter7Curriculum) assert.ok(selected.some(item => item.coreTopicId === topic.id));
  assert.ok(selected.some(item => item.id === 'chapterextra_07_01'), 'include the available DRAM/SRAM comparison');
}
for (const [i, topic] of chapter7Curriculum.entries()) {
  const selected = Array.from(chapter7Ctx.select('coretopic:' + topic.id));
  assert.equal(selected.length, [3, 7][i]);
  assert.equal(chapter7Ctx.coreTopicImmediatePracticeCountV377(topic.id), selected.length);
  assert.ok(selected.every(item => !item.id.startsWith('chapterextra_') && !item.id.startsWith('challenge_cmp_')));
}
const chapter8Curriculum = Array.from({length:4}, (_, i) => ({chapter:8, id:`core_08_0${i+1}`}));
const chapter8Metadata = [...new Map(fs.readdirSync('assets')
  .filter(file => /^question-catalog.*\.json$/.test(file))
  .flatMap(file => JSON.parse(fs.readFileSync('assets/' + file, 'utf8')).items || [])
  .filter(item => item.coreTopicId?.startsWith('core_08_'))
  .map(item => [item.id, item])).values()];
assert.equal(chapter8Metadata.length, 21);
assert.ok(chapter8Metadata.every(item => item.sourcePool === 'subject_a'));
const chapter8Ctx = {QUESTION_BANK:chapter8Metadata, CORE_A_CURRICULUM:chapter8Curriculum,
  CORE_A_CHAPTER_EXTRA_QUESTIONS:{}, subjectATrackedMetadataV376:() => chapter8Metadata, globalThis:{}};
vm.createContext(chapter8Ctx);
vm.runInContext(names.map(functionSource).join('\n') + '\nthis.select=selectSubjectAMetadataV376;', chapter8Ctx);
for (let i=0; i<100; i++) {
  const selected = Array.from(chapter8Ctx.select('corechapter:8'));
  assert.equal(selected.length, 12);
  assert.equal(new Set(selected.map(item => item.id)).size, 12);
  for (const topic of chapter8Curriculum) assert.ok(selected.some(item => item.coreTopicId === topic.id));
  assert.ok(selected.some(item => item.id.startsWith('challenge_cmp_')), 'include chapter comparison');
}
for (const [i, topic] of chapter8Curriculum.entries()) {
  const selected = Array.from(chapter8Ctx.select('coretopic:' + topic.id));
  assert.equal(selected.length, [3, 7, 5, 4][i]);
  assert.equal(chapter8Ctx.coreTopicImmediatePracticeCountV377(topic.id), selected.length);
  assert.ok(selected.every(item => !item.id.startsWith('challenge_cmp_')));
}
const chapter9Curriculum = Array.from({length:8}, (_,i)=>({chapter:9,id:`core_09_0${i+1}`}));
const chapter9Bank = [...new Map(fs.readdirSync('assets')
  .filter(file=>/^question-catalog.*\.json$/.test(file))
  .flatMap(file=>JSON.parse(fs.readFileSync('assets/'+file,'utf8')).items||[])
  .filter(item=>item.coreTopicId?.startsWith('core_09_'))
  .map(item=>[item.id,item])).values()];
assert.equal(chapter9Bank.length,44);
assert.ok(chapter9Bank.every(item=>item.sourcePool==='subject_a'));
const chapter9Ctx={QUESTION_BANK:chapter9Bank,CORE_A_CURRICULUM:chapter9Curriculum,
  CORE_A_CHAPTER_EXTRA_QUESTIONS:{},subjectATrackedMetadataV376:()=>chapter9Bank,globalThis:{}};
vm.createContext(chapter9Ctx);
vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;',chapter9Ctx);
for(let i=0;i<100;i++){
  const selected=Array.from(chapter9Ctx.select('corechapter:9'));
  assert.equal(selected.length,12);
  assert.equal(new Set(selected.map(item=>item.id)).size,12);
  for(const topic of chapter9Curriculum)assert.ok(selected.some(item=>item.coreTopicId===topic.id));
  assert.ok(selected.some(item=>item.id.startsWith('challenge_cmp_')),'Chapter 9 comparison guaranteed');
}
for(const [i,topic] of chapter9Curriculum.entries()){
  const selected=Array.from(chapter9Ctx.select('coretopic:'+topic.id));
  assert.equal(selected.length,[5,3,7,3,5,5,4,9][i]);
  assert.equal(chapter9Ctx.coreTopicImmediatePracticeCountV377(topic.id),selected.length);
  assert.ok(selected.every(item=>!item.id.startsWith('challenge_cmp_')));
}
const chapter10Curriculum=Array.from({length:10},(_,i)=>({chapter:10,id:'core_10_'+String(i+1).padStart(2,'0')}));
const chapter10Bank=[...new Map(fs.readdirSync('assets')
  .filter(file=>/^question-catalog.*\.json$/.test(file))
  .flatMap(file=>JSON.parse(fs.readFileSync('assets/'+file,'utf8')).items||[])
  .filter(item=>item.coreTopicId?.startsWith('core_10_'))
  .map(item=>[item.id,item])).values()];
assert.equal(chapter10Bank.length,62);
assert.equal(chapter10Bank.filter(item=>item.id.startsWith('challenge_cmp_')).length,6);
assert.ok(chapter10Bank.every(item=>item.sourcePool==='subject_a'));
const chapter10Ctx={QUESTION_BANK:chapter10Bank,CORE_A_CURRICULUM:chapter10Curriculum,
  CORE_A_CHAPTER_EXTRA_QUESTIONS:{},subjectATrackedMetadataV376:()=>chapter10Bank,globalThis:{}};
vm.createContext(chapter10Ctx);
vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;',chapter10Ctx);
for(let i=0;i<100;i++){
  const selected=Array.from(chapter10Ctx.select('corechapter:10'));
  assert.equal(selected.length,12);assert.equal(new Set(selected.map(item=>item.id)).size,12);
  for(const topic of chapter10Curriculum)assert.ok(selected.some(item=>item.coreTopicId===topic.id));
  assert.ok(selected.some(item=>item.id.startsWith('challenge_cmp_')),'Chapter 10 comparison guaranteed');
}
for(const [i,topic] of chapter10Curriculum.entries()){
  const selected=Array.from(chapter10Ctx.select('coretopic:'+topic.id));
  assert.equal(selected.length,[8,6,3,5,3,3,5,3,10,9][i]);
  assert.equal(chapter10Ctx.coreTopicImmediatePracticeCountV377(topic.id),selected.length);
  assert.ok(selected.every(item=>!item.id.startsWith('challenge_cmp_')));
}
const chapter11Curriculum=Array.from({length:8},(_,i)=>({chapter:11,id:'core_11_'+String(i+1).padStart(2,'0')}));
const chapter11Bank=[...new Map(fs.readdirSync('assets')
  .filter(file=>/^question-catalog.*\.json$/.test(file))
  .flatMap(file=>JSON.parse(fs.readFileSync('assets/'+file,'utf8')).items||[])
  .filter(item=>item.coreTopicId?.startsWith('core_11_'))
  .map(item=>[item.id,item])).values()];
assert.equal(chapter11Bank.length,38);
assert.equal(chapter11Bank.filter(item=>item.id.startsWith('challenge_cmp_')).length,4);
assert.ok(chapter11Bank.every(item=>item.sourcePool==='subject_a'));
const chapter11Ctx={QUESTION_BANK:chapter11Bank,CORE_A_CURRICULUM:chapter11Curriculum,
  CORE_A_CHAPTER_EXTRA_QUESTIONS:{},subjectATrackedMetadataV376:()=>chapter11Bank,globalThis:{}};
vm.createContext(chapter11Ctx);
vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;',chapter11Ctx);
for(let i=0;i<100;i++){
  const selected=Array.from(chapter11Ctx.select('corechapter:11'));
  assert.equal(selected.length,12);
  assert.equal(new Set(selected.map(item=>item.id)).size,12);
  for(const topic of chapter11Curriculum)assert.ok(selected.some(item=>item.coreTopicId===topic.id));
  assert.ok(selected.some(item=>item.id.startsWith('challenge_cmp_')),'Chapter 11 comparison guaranteed');
}
for(const [i,topic] of chapter11Curriculum.entries()){
  const selected=Array.from(chapter11Ctx.select('coretopic:'+topic.id));
  assert.equal(selected.length,[3,5,5,3,3,3,4,8][i]);
  assert.equal(chapter11Ctx.coreTopicImmediatePracticeCountV377(topic.id),selected.length);
  assert.ok(selected.every(item=>!item.id.startsWith('challenge_cmp_')));
}

const chapter12Curriculum=Array.from({length:8},(_,i)=>({chapter:12,id:'core_12_'+String(i+1).padStart(2,'0')}));
const chapter12Bank=[...new Map(fs.readdirSync('assets')
  .filter(file=>file.startsWith('question-catalog')&&file.endsWith('.json'))
  .flatMap(file=>JSON.parse(fs.readFileSync('assets/'+file,'utf8')).items||[])
  .filter(item=>item.coreTopicId?.startsWith('core_12_'))
  .map(item=>[item.id,item])).values()];
assert.equal(chapter12Bank.length,54);
assert.equal(chapter12Bank.filter(item=>item.id.startsWith('challenge_cmp_')).length,5);
assert.ok(chapter12Bank.every(item=>item.sourcePool==='subject_a'));
const chapter12Ctx={QUESTION_BANK:chapter12Bank,CORE_A_CURRICULUM:chapter12Curriculum,
  CORE_A_CHAPTER_EXTRA_QUESTIONS:{},subjectATrackedMetadataV376:()=>chapter12Bank,globalThis:{}};
vm.createContext(chapter12Ctx);
vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;',chapter12Ctx);
for(let i=0;i<100;i++){
  const selected=Array.from(chapter12Ctx.select('corechapter:12'));
  assert.equal(selected.length,12);
  assert.equal(new Set(selected.map(item=>item.id)).size,12);
  for(const topic of chapter12Curriculum)assert.ok(selected.some(item=>item.coreTopicId===topic.id));
  assert.ok(selected.some(item=>item.id.startsWith('challenge_cmp_')),'Chapter 12 comparison guaranteed');
}
for(const [i,topic] of chapter12Curriculum.entries()){
  const selected=Array.from(chapter12Ctx.select('coretopic:'+topic.id));
  assert.equal(selected.length,[3,7,7,8,7,6,4,7][i]);
  assert.equal(chapter12Ctx.coreTopicImmediatePracticeCountV377(topic.id),selected.length);
  assert.ok(selected.every(item=>!item.id.startsWith('challenge_cmp_')));
}

const chapter13Curriculum=Array.from({length:4},(_,i)=>({chapter:13,id:'core_13_'+String(i+1).padStart(2,'0')}));
const chapter13Metadata=[...new Map(fs.readdirSync('assets')
  .filter(file=>file.startsWith('question-catalog')&&file.endsWith('.json'))
  .flatMap(file=>JSON.parse(fs.readFileSync('assets/'+file,'utf8')).items||[])
  .filter(item=>item.coreTopicId?.startsWith('core_13_'))
  .map(item=>[item.id,item])).values()];
assert.equal(chapter13Metadata.length,30);
const chapter13Bank=chapter13Metadata.filter(item=>item.sourcePool==='subject_a');
const chapter13Extras=chapter13Metadata.filter(item=>item.sourcePool==='chapter_extra');
assert.equal(chapter13Bank.length,29);
assert.equal(chapter13Extras.length,1);
assert.equal(chapter13Bank.filter(item=>item.id.startsWith('challenge_cmp_')).length,1);
const chapter13Ctx={QUESTION_BANK:chapter13Bank,CORE_A_CURRICULUM:chapter13Curriculum,
  CORE_A_CHAPTER_EXTRA_QUESTIONS:{'13':chapter13Extras},subjectATrackedMetadataV376:()=>chapter13Metadata,globalThis:{}};
vm.createContext(chapter13Ctx);
vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;',chapter13Ctx);
for(let i=0;i<100;i++){
  const selected=Array.from(chapter13Ctx.select('corechapter:13'));
  assert.equal(selected.length,12);
  assert.equal(new Set(selected.map(item=>item.id)).size,12);
  for(const topic of chapter13Curriculum)assert.ok(selected.some(item=>item.coreTopicId===topic.id));
  assert.ok(selected.some(item=>item.id.startsWith('challenge_cmp_')||item.id.startsWith('chapterextra_')),'Chapter 13 comparison guaranteed');
}
for(const [i,topic] of chapter13Curriculum.entries()){
  const selected=Array.from(chapter13Ctx.select('coretopic:'+topic.id));
  assert.equal(selected.length,[10,4,4,4][i]);
  assert.equal(chapter13Ctx.coreTopicImmediatePracticeCountV377(topic.id),selected.length);
  assert.ok(selected.every(item=>!item.id.startsWith('challenge_cmp_')&&!item.id.startsWith('chapterextra_')));
}

console.log('PASS Subject A chapter/topic selection: 12 unique with full Chapter 3/4/6/7/8/9/10/11/12/13 coverage; Chapter 13 immediate practice=10/4/4/4 (topic 13-01 capped from 16 eligible metadata) and comparison guaranteed');
