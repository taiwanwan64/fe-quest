from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-wrong-answer-feedback-repair-(v(\d+))',branch)
    req(m,'bad Subject B wrong-answer feedback repair branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x230000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function optionsOfV230(q){return Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);}
function answerOfV230(q){return Number(q?.a);}
function shapeV230(q,extra={}){const o=optionsOfV230(q);return {...extra,q:String(q?.q||''),options:o.map(String),a:answerOfV230(q),correct:String(o[answerOfV230(q)]??''),explain:String(q?.explain||q?.exp||''),hint:String(q?.hint||'')};}
function sourceRowsV230(){
  const algorithmPractice=[];
  for(const ex of B_EXERCISES)for(const [i,s] of (ex.steps||[]).entries())if(s.predict)algorithmPractice.push({q:s.predict,label:`${ex.id}:${i}`,family:'algorithmPractice',domain:ex.concept||''});
  const securityPractice=[];
  for(const sc of SECURITY_SCENARIOS)for(const [i,s] of (sc.steps||[]).entries())securityPractice.push({q:s,label:`${sc.id}:${i}`,family:'securityPractice',concept:sc.concept||''});
  const finalAlgorithm=B_EXAM_ALGO_ITEMS.map(q=>({q,label:q.id,family:'finalAlgorithm',domain:q.domain||''}));
  const compound=[];
  for(const set of B_COMPOUND_SETS)for(const [i,q] of (set.qs||[]).entries())compound.push({q,label:`${set.id}:${i}`,family:'compound'});
  return {algorithmPractice,securityPractice,finalAlgorithm,compound};
}
function feedbackCoverageV230(rows){
  let wrongSlots=0,covered=0,structured=0,keyed=0,correctBlank=0,selectedNamed=0,distinct=0;
  const bad=[];
  for(const row of rows){
    const q=row.q,opts=optionsOfV230(q),a=answerOfV230(q),arr=Array.isArray(q?.wrongFeedback)?q.wrongFeedback:[],map=q?.wrongFeedbackByText||{};
    const diagnoses=[];
    for(let i=0;i<opts.length;i++){
      if(i===a){if(!arr[i])correctBlank++;continue;}
      wrongSlots++;
      const f=arr[i];
      if(f)covered++;
      if(f&&typeof f==='object'&&String(f.diagnosis||'').trim()&&String(f.checkpoint||'').trim()&&String(f.nextCue||'').trim())structured++;
      if(map[String(opts[i])]&&typeof map[String(opts[i])]==='object')keyed++;
      if(f&&String(f.diagnosis||'').includes(`「${String(opts[i])}」`))selectedNamed++;
      if(f&&f.diagnosis)diagnoses.push(String(f.diagnosis));
      if(!f||typeof f!=='object'||!String(f.diagnosis||'').trim()||!String(f.checkpoint||'').trim()||!String(f.nextCue||'').trim())bad.push(`${row.label}:${i}`);
    }
    if(diagnoses.length===Math.max(0,opts.length-1)&&new Set(diagnoses).size===diagnoses.length)distinct++;
  }
  return {questions:rows.length,wrongSlots,covered,structured,keyed,correctBlank,selectedNamed,distinctQuestions:distinct,bad};
}
function fingerprintsV230(){
  const src=sourceRowsV230();
  return Object.fromEntries(Object.entries(src).map(([k,rows])=>[k,rows.map(r=>shapeV230(r.q,{label:r.label}))]));
}
function generatedRowsV230(){
  Math.random=seedRand(23001);
  const algorithmMini=B_EXERCISES.map(ex=>{const x=bMockCandidateFromExercise(ex);return x?shuffleBMockAnswer(x):null;}).filter(Boolean).map((q,i)=>({q,label:`bm:${i}`}));
  Math.random=seedRand(23002);
  const securityMini=[];for(const s of SECURITY_SCENARIOS)for(let i=0;i<(s.steps||[]).length;i++)securityMini.push({q:randomizeSecurityMockItem(s,i),label:`sm:${s.id}:${i}`});
  Math.random=seedRand(23003);
  const compoundRandom=[];for(const s of B_COMPOUND_SETS){const x=randomizeCompoundSet(s);for(const [i,q] of x.qs.entries())compoundRandom.push({q,label:`cr:${s.id}:${i}`});}
  Math.random=seedRand(23004);
  const finalAlgorithm=B_EXAM_ALGO_ITEMS.map((x,i)=>({q:makeFinalAlgoExam(x),label:`fa:${i}`}));
  Math.random=seedRand(23005);
  const finalSecurity=SECURITY_SCENARIOS.map((s,i)=>({q:makeFinalSecurity(s),label:`fs:${i}`}));
  return {algorithmMini,securityMini,compoundRandom,finalAlgorithm,finalSecurity};
}
function generatedFingerprintsV230(){
  const g=generatedRowsV230();return Object.fromEntries(Object.entries(g).map(([k,rows])=>[k,rows.map(r=>shapeV230(r.q,{label:r.label}))]));
}
function generatedCoverageV230(){const g=generatedRowsV230();return Object.fromEntries(Object.entries(g).map(([k,rows])=>[k,feedbackCoverageV230(rows)]));}
function sourceCoverageV230(){const s=sourceRowsV230();return Object.fromEntries(Object.entries(s).map(([k,rows])=>[k,feedbackCoverageV230(rows)]));}
function remediationCoverageV230(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
function uiContractV230(){
  const has=typeof SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC!=='undefined';
  if(!has)return {has:false};
  const ex=B_EXERCISES.find(x=>x.id==='stack_ops')||B_EXERCISES[0],pred=ex.steps.map(x=>x.predict).find(Boolean),wrong=pred.opts.findIndex((_,i)=>i!==pred.a),sample=subjectBChoiceFeedbackV230(pred,wrong);
  const sec=SECURITY_SCENARIOS[0],step=sec.steps[0],sw=step.options.findIndex((_,i)=>i!==step.a),secSample=subjectBChoiceFeedbackV230(step,sw);
  const full=subjectBChoiceFeedbackHtmlV230(sample,true),compact=subjectBChoiceFeedbackHtmlV230(sample,false);
  return {
    has:true,sample,secSample,
    fullLabels:['選んだ答えから見ると','ここだけ確認','次回の合図'].every(x=>full.includes(x)),
    compactHidesCheckpoint:!compact.includes('ここだけ確認')&&compact.includes('次回の合図'),
    traceWrapped:String(showBPrediction).includes('bPredictionChoiceFeedbackV230'),
    securityWrapped:String(answerSecDecision).includes('diagnosisHtml'),
    algorithmMockWrapped:String(renderBMockResult).includes('injectBMockReview'),
    securityMockWrapped:String(finishSecurityMock).includes('injectSecurityMockReview'),
    compoundWrapped:String(finishCompoundChallenge).includes('injectCompoundReview'),
    finalWrapped:String(renderBFinalResult).includes('injectFinalReview')
  };
}
const hasV230=typeof SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC!=='undefined';
console.log('__V230__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,hasV230,spec:hasV230?SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC:null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,domainSpec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,
  hubSource:String(subjectBHubRecommendation),sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),remediation:remediationCoverageV230(),
  fingerprints:fingerprintsV230(),generatedFingerprints:generatedFingerprintsV230(),sourceCoverage:sourceCoverageV230(),generatedCoverage:generatedCoverageV230(),ui:uiContractV230()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V230__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v230' and previous=='v229','v230 feedback repair expects v229 parent')
source=Path('audits/SUBJECT_B_WRONG_ANSWER_EXPLANATION_DIAGNOSTIC_AUDIT_v229.txt')
req(source.exists(),'v229 wrong-answer diagnosis audit missing')
st=source.read_text()
req('PASS — MEDIUM FINDING RECORDED' in st and 'subject_b_wrong_answer_feedback_not_choice_specific' in st,'v229 medium finding evidence drift')
manifest=json.loads(Path('_release/content-change-v230.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'v230 manifest parent/source drift')
req(manifest['source_priority_tier']=='medium' and manifest['quality_audit_marker']=='subject_b_wrong_answer_feedback_not_choice_specific','v230 manifest finding drift')
req(manifest['content_files']==['app/subject-b-wrong-answer-feedback-overrides-v230.txt'] and manifest['assembly_files']==['index.html'],'v230 approved file scope drift')
expected={
  '.github/subject-b-wrong-answer-feedback-repair/validate_repair.py',
  '.github/workflows/subject-b-wrong-answer-feedback-repair.yml',
  '_release/content-change-v230.json',
  'app/subject-b-wrong-answer-feedback-overrides-v230.txt',
  'index.html'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v230 repair source drift: '+repr(sorted(changed^expected)))
for path in [
  'app/base-stable.html','app/subject-b-security-overrides-v200.txt','app/subject-b-algorithm-overrides-v202.txt','app/subject-b-session-overrides-v205.txt',
  'app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt',
  'app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt','app/subject-b-algorithm-domain-progression-overrides-v227.txt'
]:
    req(Path(path).read_bytes()==subprocess.check_output(['git','show',parent+':'+path]),'preserved learner-facing source drift: '+path)

html,cand=runtime('_site/index.html')
_,par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['hasV230'] is True and par['hasV230'] is False,'v230 repair presence boundary')
req(cand['counts']==par['counts']==[20,16,4],'final counts drift')
req(cand['seconds']==par['seconds']==6000,'time limit drift')
req(cand['pool']==par['pool']==43,'algorithm pool drift')
req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift')
req(cand['floor']==par['floor']==4,'high-trace floor drift')
for key,label in [('orderSpec','v214 order'),('recoverySpec','v217 recovery'),('xpSpec','v219 XP'),('readinessSpec','v222 readiness'),('copySpec','v224 copy'),('domainSpec','v227 domain progression')]:
    req(cand[key]==par[key],label+' spec drift')
req(cand['hubSource']==par['hubSource'],'Subject B hub routing function changed')
req(cand['selectionSig']==par['selectionSig'],'1000-seed final selection/order drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(cand['remediation']==par['remediation'],'direct remediation coverage changed')
req(cand['remediation']['algorithm']==43 and not cand['remediation']['algoBad'],'algorithm remediation coverage drift')
req(cand['remediation']['security']==15 and not cand['remediation']['secBad'],'security remediation coverage drift')
req(cand['fingerprints']==par['fingerprints'],'authored prompt/options/correct/explanation/hint drift')
req(cand['generatedFingerprints']==par['generatedFingerprints'],'generated practice/final question content or randomization drift')

spec=cand['spec'] or {}
req(spec.get('policy')=='choice-specific-wrong-answer-diagnosis','v230 policy missing')
req(spec.get('finding')=='subject_b_wrong_answer_feedback_not_choice_specific','v230 finding marker missing')
req(spec.get('metadataKey')=='wrongFeedback' and spec.get('stableLookupKey')=='wrongFeedbackByText','v230 metadata contract drift')
req(spec.get('feedbackParts')==['diagnosis','checkpoint','nextCue'],'v230 feedback-part contract drift')
req(spec.get('immediatePracticeRevealsCorrectAnswer') is False and spec.get('postAnswerReviewShowsCheckpoint') is True,'v230 disclosure contract drift')
req(spec.get('covers')==['algorithm-trace','algorithm-mini-mock','compound','security-scenario','security-mini-mock','final-algorithm','final-security'],'v230 coverage-path contract drift')
for k in ['scoringChanged','correctAnswersChanged','questionSelectionChanged','questionOrderChanged','timingChanged','readinessThresholdChanged','domainProgressionChanged','remediationTargetsChanged','profileSchemaChanged']:
    req(spec.get(k) is False,'v230 protected contract changed: '+k)

src=cand['sourceCoverage']
expected_counts={'algorithmPractice':40,'securityPractice':45,'finalAlgorithm':43}
for name,count in expected_counts.items():req(src[name]['questions']==count,f'{name} count drift')
req(src['compound']['questions']>0,'compound source inventory empty')
for name,row in src.items():
    req(row['wrongSlots']>0,name+' wrong-slot inventory empty')
    req(row['covered']==row['wrongSlots'],name+' wrong-choice feedback coverage incomplete')
    req(row['structured']==row['wrongSlots'],name+' structured 3-part feedback incomplete')
    req(row['keyed']==row['wrongSlots'],name+' stable text-key lookup incomplete')
    req(row['selectedNamed']==row['wrongSlots'],name+' diagnosis does not name selected distractor')
    req(row['distinctQuestions']==row['questions'],name+' diagnoses are not distinct per distractor')
    req(not row['bad'],name+' bad feedback slots: '+repr(row['bad'][:10]))

gen=cand['generatedCoverage']
req(gen['algorithmMini']['questions']==len(cand['fingerprints']['algorithmPractice'])//2,'algorithm mini generated source count drift')
req(gen['securityMini']['questions']==45,'security mini generated inventory drift')
req(gen['finalAlgorithm']['questions']==43,'generated final algorithm inventory drift')
req(gen['finalSecurity']['questions']==15,'generated final security inventory drift')
for name,row in gen.items():
    req(row['covered']==row['wrongSlots'] and row['structured']==row['wrongSlots'] and row['keyed']==row['wrongSlots'],name+' shuffled/generated feedback remap incomplete')
    req(row['correctBlank']==row['questions'],name+' correct option incorrectly has wrong-answer feedback')
    req(not row['bad'],name+' generated bad feedback slots: '+repr(row['bad'][:10]))

ui=cand['ui']
req(ui.get('has') is True,'v230 UI contract missing')
req(ui.get('sample') and ui.get('secSample'),'v230 algorithm/security sample feedback missing')
req(ui.get('fullLabels') is True and ui.get('compactHidesCheckpoint') is True,'v230 immediate/review disclosure UI drift')
for k in ['traceWrapped','securityWrapped','algorithmMockWrapped','securityMockWrapped','compoundWrapped','finalWrapped']:
    req(ui.get(k) is True,'v230 learner-flow renderer not wired: '+k)
req('bchoice-feedback-v230' in html and 'bPredictionChoiceFeedbackV230' in html,'v230 feedback UI markers absent from built candidate')

fixture={
  'name':f'subject-b-wrong-answer-feedback-repair-{version}','version':version,'previous':previous,'sourceMain':parent,'learnerFacingChange':True,
  'findingResolved':'subject_b_wrong_answer_feedback_not_choice_specific','spec':spec,'sourceCoverage':src,'generatedCoverage':gen,
  'selectionSignature1000':cand['selectionSig'],'remediation':cand['remediation'],'ui':ui
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-wrong-answer-feedback-repair-v230.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

def rowline(name,row):
    return f"{name}: questions={row['questions']} / wrong choices={row['wrongSlots']} / structured feedback={row['structured']} / keyed={row['keyed']}"

audit=f'''FE QUEST v230 — Subject B Wrong-Answer Feedback Repair
=============================================================================

Result
------
PASS — NO FINDINGS
Previous: v229
Source main: {parent}
Learner-facing change in v230: yes

Resolved finding
----------------
subject_b_wrong_answer_feedback_not_choice_specific
v229 confirmed that Subject B had general correct-path explanations but no complete option-specific diagnosis metadata. v230 adds a three-part diagnosis for every wrong choice while preserving the original prompt, options, correct answer, scoring, routing, and practice selection.

Feedback contract
-----------------
Each wrong option now has:
1. diagnosis — names the selected distractor and identifies the likely reasoning break.
2. checkpoint — gives the minimum state / judgment point to reconstruct after the answer is known.
3. nextCue — gives one concise action to use on the next attempt.
Immediate guided practice shows diagnosis + next cue without the post-answer checkpoint. Submitted/review screens show all three parts.
The stable lookup is keyed by option text so feedback remains attached to the intended distractor after answer choices are shuffled.

Source coverage
---------------
{rowline('Algorithm TRACE prediction',src['algorithmPractice'])}
{rowline('Security scenario',src['securityPractice'])}
{rowline('Final algorithm pool',src['finalAlgorithm'])}
{rowline('Compound questions',src['compound'])}
Every source wrong-choice slot has a structured diagnosis, checkpoint, and next cue. The correct option has no wrong-answer diagnosis.

Generated / shuffled path proof
-------------------------------
{rowline('Algorithm mini mock',gen['algorithmMini'])}
{rowline('Security mini mock',gen['securityMini'])}
{rowline('Randomized compound',gen['compoundRandom'])}
{rowline('Generated final algorithm',gen['finalAlgorithm'])}
{rowline('Generated final security',gen['finalSecurity'])}
Feedback remapping remained complete after answer shuffling in every generated path.

Learner-flow wiring
-------------------
Algorithm TRACE: wrong prediction immediately shows distractor-specific diagnosis and next-attempt cue without revealing the post-answer checkpoint.
Security scenario: wrong first/retry choice receives distractor-specific diagnosis alongside the existing retry hint / explanation.
Algorithm mini mock: submitted wrong answers show the three-part diagnosis before the existing return-to-TRACE action.
Security mini mock: submitted wrong answers show the three-part diagnosis before the existing case-practice action.
Compound practice: submitted wrong answers keep the existing thinking-point/pitfall boxes and add the selected-choice diagnosis.
Final practice: wrong-answer review adds selected-choice diagnosis while keeping v217 recovery entry, reason chips, and remediation destinations intact.

Preserved contracts
-------------------
1000 deterministic final-session seeds matched v229 selection/order.
Authored and generated prompt/options/correct-answer fingerprints matched v229.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, v222 readiness/65% threshold, v224 copy, and v227 domain progression are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.
No profile schema migration; feedback is reconstructed from the current question source and is not persisted in learner history.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
The v229 medium finding is repaired. Use v231 for a post-repair learner-flow audit that exercises an actual wrong selection through immediate feedback, submitted review, remediation launch, and rerender/refresh boundaries before moving to another Subject B learning-quality frontier.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_WRONG_ANSWER_FEEDBACK_REPAIR_v230.txt').write_text(audit)
print('FEQUEST_V230_SUBJECT_B_WRONG_ANSWER_FEEDBACK_REPAIR_OK')
