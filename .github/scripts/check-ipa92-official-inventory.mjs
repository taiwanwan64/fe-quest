import fs from 'node:fs';
import path from 'node:path';

const root='.github';
const files=fs.readdirSync(root)
  .filter(name=>/^ipa92-official-inventory-tranche\d+\.json$/.test(name))
  .sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
const allowed=new Set(['direct-covered','mixed-evidence','lesson-only','no-direct-evidence']);
const forbiddenKeys=new Set(['stem','options','answerIndex','answer_index','explanation','hint','choiceExplanations','choice_explanations']);
const expectedQuestionSnapshots=new Map([[1,987],[2,987],[3,987],[4,1003],[5,1003],[6,1003],[7,1003],[8,1003],[9,1003]]);

function fail(message){throw new Error(message)}
function scan(value,trail=[]){
  if(Array.isArray(value)){for(let i=0;i<value.length;i++)scan(value[i],[...trail,String(i)]);return}
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){
    if(forbiddenKeys.has(key))fail(`protected question field in public inventory ledger: ${[...trail,key].join('.')}`);
    scan(child,[...trail,key]);
  }
}
function validateFile(name){
  const full=path.join(root,name);
  const data=JSON.parse(fs.readFileSync(full,'utf8'));
  const match=name.match(/tranche(\d+)\.json$/);
  const tranche=Number(match?.[1]);
  if(!Number.isInteger(tranche)||tranche<1)fail(`invalid tranche filename: ${name}`);
  if(data.schemaVersion!==1)fail(`${name}: unexpected inventory schemaVersion`);
  if(data.authority?.organization!=='IPA'||data.authority?.syllabusVersion!=='9.2')fail(`${name}: unexpected syllabus authority/version`);
  const expectedQuestions=expectedQuestionSnapshots.get(tranche);
  if(expectedQuestions===undefined)fail(`${name}: production question snapshot has not been registered in validator`);
  if(data.productionSnapshot?.activeQuestions!==expectedQuestions)fail(`${name}: production question snapshot must be ${expectedQuestions}`);
  if(data.productionSnapshot?.activeLessons!==130)fail(`${name}: production lesson snapshot must remain 130 for this ledger generation`);
  if(!Array.isArray(data.findings)||data.findings.length===0)fail(`${name}: findings must be non-empty`);

  const ids=new Set();
  const counts={};
  const idPattern=new RegExp(`^FE92-T${tranche}-[A-Z0-9-]+$`);
  for(const item of data.findings){
    if(!idPattern.test(String(item.id||'')))fail(`${name}: invalid finding id: ${item.id}`);
    if(ids.has(item.id))fail(`${name}: duplicate finding id: ${item.id}`);
    ids.add(item.id);
    if(typeof item.section!=='string'||!item.section.includes('/'))fail(`${name}: invalid section: ${item.id}`);
    if(typeof item.officialFocus!=='string'||item.officialFocus.length<2)fail(`${name}: missing officialFocus: ${item.id}`);
    if(!Number.isInteger(item.questionHits)||item.questionHits<0)fail(`${name}: invalid questionHits: ${item.id}`);
    if(!Number.isInteger(item.lessonHits)||item.lessonHits<0)fail(`${name}: invalid lessonHits: ${item.id}`);
    if(!allowed.has(item.status))fail(`${name}: invalid status: ${item.id}:${item.status}`);
    if(item.status==='direct-covered'&&(item.questionHits<2||item.lessonHits<1))fail(`${name}: direct-covered lacks evidence: ${item.id}`);
    if(item.status==='lesson-only'&&(item.questionHits!==0||item.lessonHits<1))fail(`${name}: lesson-only evidence mismatch: ${item.id}`);
    if(item.status==='no-direct-evidence'&&(item.questionHits!==0||item.lessonHits!==0))fail(`${name}: no-direct-evidence mismatch: ${item.id}`);
    counts[item.status]=(counts[item.status]||0)+1;
  }

  const s=data.summary||{};
  if(s.findingCount!==data.findings.length)fail(`${name}: summary findingCount mismatch`);
  if(s.directCovered!==(counts['direct-covered']||0))fail(`${name}: summary directCovered mismatch`);
  if(s.mixedEvidence!==(counts['mixed-evidence']||0))fail(`${name}: summary mixedEvidence mismatch`);
  if(s.lessonOnly!==(counts['lesson-only']||0))fail(`${name}: summary lessonOnly mismatch`);
  if(s.noDirectEvidence!==(counts['no-direct-evidence']||0))fail(`${name}: summary noDirectEvidence mismatch`);
  if(s.inventoryComplete!==false||s.verifiedCoveredPromotions!==0)fail(`${name}: tranche must not claim completion/verification`);
  scan(data,[name]);
  console.log(`PASS ${name}: questions=${expectedQuestions} findings=${data.findings.length} direct=${counts['direct-covered']||0} mixed=${counts['mixed-evidence']||0} lessonOnly=${counts['lesson-only']||0} noDirect=${counts['no-direct-evidence']||0}`);
}

if(files.length<2)fail(`expected at least tranche1 and tranche2 ledgers, found ${files.length}`);
for(const file of files)validateFile(file);
console.log(`PASS IPA 9.2 official inventory ledgers: tranches=${files.length}`);
