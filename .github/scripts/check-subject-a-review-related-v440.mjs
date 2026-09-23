import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('assets/app-v377.js','utf8');
const catalog=JSON.parse(fs.readFileSync('assets/question-catalog-v376.json','utf8'));
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
const groups=new Map();
for(const item of catalog.items.filter(item=>item.sourcePool==='subject_a'&&item.concept)){
  const key=`${item.cat}:${item.concept}`;
  groups.set(key,[...(groups.get(key)||[]),item]);
}
const group=[...groups.values()].find(items=>items.length>=6);
assert.ok(group,'public catalog must have at least one group of six related questions');
const bank=group.slice(0,6);
const profile={settings:{variantReview:false},qStats:Object.fromEntries(bank.slice(0,4).map((item,i)=>[item.id,{due:`2020-01-0${i+1}`,attempts:2,correct:0}])),skills:{},dailyPlans:{}};
const names=['subjectATrackedMetadataV376','subjectAUniqueMetadataV376','subjectAStatV376','subjectAIsDueMetadataV376','subjectAMetadataWeakScoreV376','subjectAPickWeakMetadataV376','subjectAPickDueMetadataV376','subjectAIsRelatedReviewMetadataV440','subjectAReviewRelatedMetadataV440','selectSubjectAMetadataV376'];
const ctx={profile,QUESTION_BANK:bank,CORE_A_CHAPTER_EXTRA_QUESTIONS:{},localDateISO:()=> '2026-09-23',globalThis:{studyActiveV373:{date:'2026-09-23',task:{lane:'review',slot:0,questionLimit:4}}}};
vm.createContext(ctx);
vm.runInContext(names.map(functionSource).join('\n')+'\nthis.select=selectSubjectAMetadataV376;this.related=subjectAIsRelatedReviewMetadataV440;',ctx);
const ids=rows=>Array.from(rows,item=>item.id);
const original=ids(ctx.select('review'));
assert.deepEqual(original,bank.slice(0,4).map(item=>item.id));
profile.settings.variantReview=true;
const rotated=ids(ctx.select('review'));
assert.equal(rotated.length,4);
assert.equal(new Set(rotated).size,4);
assert.equal(rotated[0],original[0]);
assert.equal(rotated[2],original[2]);
assert.notEqual(rotated[1],original[1]);
assert.notEqual(rotated[3],original[3]);
assert.ok(rotated.every(id=>bank.some(item=>item.id===id)));
assert.ok(rotated.every((id,i)=>i%2===0||ctx.related(bank[i],bank.find(item=>item.id===id))));
const budget=ids(ctx.select('budget:review'));
assert.equal(budget.length,4);
assert.equal(budget[0],original[0]);
assert.equal(budget[2],original[2]);
profile.dailyPlans['2026-09-23']={blockProgressV373:{0:{remainingIds:budget}}};
assert.deepEqual(ids(ctx.select('budget:review')),budget,'resume preserves the saved actual IDs');
delete profile.dailyPlans['2026-09-23'];
profile.settings.variantReview=false;
assert.deepEqual(ids(ctx.select('budget:review')),original,'disabled setting retains original due IDs');
console.log('PASS Subject A review: catalog related IDs, due retention, toggle and resume');
