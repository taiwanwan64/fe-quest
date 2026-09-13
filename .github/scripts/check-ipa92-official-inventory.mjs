import fs from 'node:fs';

const path='.github/ipa92-official-inventory-tranche1.json';
const data=JSON.parse(fs.readFileSync(path,'utf8'));
const allowed=new Set(['direct-covered','mixed-evidence','lesson-only','no-direct-evidence']);

function fail(message){throw new Error(message)}
if(data.schemaVersion!==1)fail('unexpected inventory schemaVersion');
if(data.authority?.organization!=='IPA'||data.authority?.syllabusVersion!=='9.2')fail('unexpected syllabus authority/version');
if(data.productionSnapshot?.activeQuestions!==987)fail('production question snapshot must remain 987 for this ledger');
if(data.productionSnapshot?.activeLessons!==130)fail('production lesson snapshot must remain 130 for this ledger');
if(!Array.isArray(data.findings)||data.findings.length===0)fail('findings must be non-empty');

const ids=new Set();
const counts={};
for(const item of data.findings){
  if(!/^FE92-T1-[A-Z0-9-]+$/.test(String(item.id||'')))fail(`invalid finding id: ${item.id}`);
  if(ids.has(item.id))fail(`duplicate finding id: ${item.id}`);
  ids.add(item.id);
  if(typeof item.section!=='string'||!item.section.includes('/'))fail(`invalid section: ${item.id}`);
  if(typeof item.officialFocus!=='string'||item.officialFocus.length<2)fail(`missing officialFocus: ${item.id}`);
  if(!Number.isInteger(item.questionHits)||item.questionHits<0)fail(`invalid questionHits: ${item.id}`);
  if(!Number.isInteger(item.lessonHits)||item.lessonHits<0)fail(`invalid lessonHits: ${item.id}`);
  if(!allowed.has(item.status))fail(`invalid status: ${item.id}:${item.status}`);
  if(item.status==='direct-covered'&&(item.questionHits<2||item.lessonHits<1))fail(`direct-covered lacks evidence: ${item.id}`);
  if(item.status==='lesson-only'&&(item.questionHits!==0||item.lessonHits<1))fail(`lesson-only evidence mismatch: ${item.id}`);
  if(item.status==='no-direct-evidence'&&(item.questionHits!==0||item.lessonHits!==0))fail(`no-direct-evidence mismatch: ${item.id}`);
  counts[item.status]=(counts[item.status]||0)+1;
}

const s=data.summary||{};
if(s.findingCount!==data.findings.length)fail('summary findingCount mismatch');
if(s.directCovered!==counts['direct-covered'])fail('summary directCovered mismatch');
if(s.mixedEvidence!==counts['mixed-evidence'])fail('summary mixedEvidence mismatch');
if(s.lessonOnly!==counts['lesson-only'])fail('summary lessonOnly mismatch');
if(s.noDirectEvidence!==counts['no-direct-evidence'])fail('summary noDirectEvidence mismatch');
if(s.inventoryComplete!==false||s.verifiedCoveredPromotions!==0)fail('tranche must not claim completion/verification');

const forbiddenKeys=new Set(['stem','options','answerIndex','answer_index','explanation','hint','choiceExplanations','choice_explanations']);
function scan(value,trail=[]){
  if(Array.isArray(value)){for(let i=0;i<value.length;i++)scan(value[i],[...trail,String(i)]);return}
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){
    if(forbiddenKeys.has(key))fail(`protected question field in public inventory ledger: ${[...trail,key].join('.')}`);
    scan(child,[...trail,key]);
  }
}
scan(data);
console.log(`PASS IPA 9.2 official tranche1 inventory: findings=${data.findings.length} direct=${counts['direct-covered']||0} mixed=${counts['mixed-evidence']||0} lessonOnly=${counts['lesson-only']||0} noDirect=${counts['no-direct-evidence']||0}`);
