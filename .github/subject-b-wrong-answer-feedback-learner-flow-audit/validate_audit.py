from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-wrong-answer-feedback-learner-flow-audit-(v(\d+))', branch)
    req(m, 'bad Subject B wrong-answer feedback learner-flow audit branch')
    version = m.group(1)
    return version, f'v{int(m.group(2)) - 1}'


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x231000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function text(v){return String(v??'').trim();}
function optionsOf(q){return Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);}
function answerIndexOf(q){return Number.isInteger(Number(q?.a))?Number(q.a):Number(q?.correct);}
function clone(v){return JSON.parse(JSON.stringify(v));}
function feedbackOf(q,selected){const f=subjectBChoiceFeedbackV230(q,selected);return f?clone(f):null;}
function fullHtml(f){return subjectBChoiceFeedbackHtmlV230(f,true);}
function compactHtml(f){return subjectBChoiceFeedbackHtmlV230(f,false);}
function sourcePrediction(exId,qText){const ex=B_EXERCISES.find(x=>x.id===exId);return ex?.steps?.map(x=>x.predict).filter(Boolean).find(p=>text(p.q)===text(qText))||null;}
function securitySource(scId,qText){const sc=SECURITY_SCENARIOS.find(x=>x.id===scId);return sc?.steps?.find(s=>text(s.q)===text(qText))||null;}
function finalSource(d){
  if(d?.kind==='security')return securitySource(d.sourceId,d.q);
  const exam=B_EXAM_ALGO_ITEMS.find(x=>x.id===d?.sourceId);
  if(exam)return exam;
  if(d?.studyMode==='trace')return sourcePrediction(d.sourceId,d.q);
  if(d?.studyMode==='compound'){
    const set=B_COMPOUND_SETS.find(x=>x.id===d.sourceId);
    return set?.qs?.find(q=>text(q.q)===text(d.q))||null;
  }
  return null;
}
function finalDetailFromGenerated(q,wrongText){
  const opts=optionsOf(q),a=answerIndexOf(q),selected=wrongText??opts.find((_,i)=>i!==a);
  return {
    sourceId:q.sourceId,kind:q.kind,format:bFinalFormatOf(q),domain:q.kind==='security'?(q.concept||'情報セキュリティ'):(q.domain||'擬似言語'),
    title:q.title,q:q.q,selected,correct:q.correctText||opts[a],ok:false,explain:q.explain,studyMode:q.studyMode
  };
}
function makeAttempt(detail){return {date:'2026-08-18',total:20,correct:0,blank:0,rate:0,seconds:300,algoCorrect:0,secCorrect:0,timeUp:false,details:[detail]};}

function traceImmediateUiProbe(){
  const ex=B_EXERCISES.find(x=>x.id==='stack_ops')||B_EXERCISES[0];
  const pred=ex.steps.map(x=>x.predict).find(Boolean);
  const a=answerIndexOf(pred),wrong=optionsOf(pred).findIndex((_,i)=>i!==a),buttons=optionsOf(pred).map((_,i)=>({onclick:null,dataset:{},disabled:false,classList:{add(){},remove(){},toggle(){},contains(){return false;}}}));
  let panel=null;
  const root={innerHTML:'',querySelectorAll(){return buttons;},insertAdjacentElement(_p,node){panel=node;},classList:{add(){},remove(){}}};
  const generic=new Map();
  const oldGet=document.getElementById,oldCreate=document.createElement,oldQuery=document.querySelectorAll;
  document.getElementById=(id)=>{
    if(id==='predictionOptions')return root;
    if(id==='bPredictionChoiceFeedbackV230')return panel;
    if(!generic.has(id))generic.set(id,dummy());
    return generic.get(id);
  };
  document.createElement=(tag)=>tag==='div'?{id:'',hidden:true,innerHTML:'',insertAdjacentHTML(){},classList:{add(){},remove(){}}}:dummy();
  document.querySelectorAll=()=>[];
  let error=null,afterWrong=null,afterCorrect=null;
  try{
    showBPrediction(pred);
    if(typeof buttons[wrong].onclick!=='function')throw new Error('wrong prediction button handler missing');
    buttons[wrong].onclick();
    afterWrong={hidden:panel?.hidden,html:panel?.innerHTML||''};
    if(typeof buttons[a].onclick!=='function')throw new Error('correct prediction button handler missing');
    buttons[a].onclick();
    afterCorrect={hidden:panel?.hidden,html:panel?.innerHTML||''};
  }catch(e){error=String(e&&e.stack||e);}
  finally{document.getElementById=oldGet;document.createElement=oldCreate;document.querySelectorAll=oldQuery;}
  const fb=feedbackOf(pred,wrong),correct=feedbackOf(pred,a);
  return {
    error,exercise:ex.id,selected:optionsOf(pred)[wrong],correctText:optionsOf(pred)[a],feedback:fb,correctFeedback:correct,
    afterWrong,afterCorrect,
    compactExpected:fb?compactHtml(fb):'',fullExpected:fb?fullHtml(fb):''
  };
}

function finalReviewUiProbe(seed=23101,sourceId=null,selectedText=null,clickRemediation=true){
  Math.random=seedRand(seed);
  const src=sourceId?B_EXAM_ALGO_ITEMS.find(x=>x.id===sourceId):B_EXAM_ALGO_ITEMS.find(x=>x.domain==='木構造')||B_EXAM_ALGO_ITEMS[0];
  const generated=makeFinalAlgoExam(src);
  const opts=optionsOf(generated),a=answerIndexOf(generated);
  const wrong=selectedText??opts.find((_,i)=>i!==a);
  const detail=finalDetailFromGenerated(generated,wrong),attempt=makeAttempt(detail);
  const anchor={inserts:[],insertAdjacentHTML(_p,h){this.inserts.push(h);}};
  const row={querySelector(sel){return sel==='.bfinal-review-e'?anchor:null;}};
  const study={dataset:{bfinalstudy:detail.studyMode,bfinalsource:detail.sourceId,bfinaldomain:detail.domain},onclick:null};
  const generic=new Map();
  const oldGet=document.getElementById,oldQuery=document.querySelectorAll,oldCreate=document.createElement;
  document.getElementById=(id)=>{if(!generic.has(id))generic.set(id,dummy());return generic.get(id);};
  document.querySelectorAll=(sel)=>{
    if(sel==='#bFinalReviewList .bfinal-review-item')return [row];
    if(sel==='[data-bfinalstudy]')return [study];
    if(sel==='[data-bfreason]')return [];
    return [];
  };
  document.createElement=()=>dummy();
  let renderError=null,launchError=null,launchedId=null;
  try{renderBFinalResult(attempt,0);}catch(e){renderError=String(e&&e.stack||e);}
  const beforeLaunch=currentB?.id||null;
  if(!renderError&&clickRemediation){
    try{
      if(typeof study.onclick!=='function')throw new Error('final remediation click handler missing');
      study.onclick();
      launchedId=currentB?.id||null;
    }catch(e){launchError=String(e&&e.stack||e);}
  }
  document.getElementById=oldGet;document.querySelectorAll=oldQuery;document.createElement=oldCreate;
  const source=finalSource(detail),fb=feedbackOf(source,detail.selected),target=bFinalRemediationTarget(detail.studyMode,detail.sourceId,detail.domain);
  return {
    seed,sourceId:detail.sourceId,domain:detail.domain,format:detail.format,selected:detail.selected,correct:detail.correct,
    feedback:fb,inserted:anchor.inserts,renderError,launchError,beforeLaunch,launchedId,target,
    wrapperSource:String(renderBFinalResult),targetSource:String(bFinalRemediationTarget)
  };
}

function rerenderProbe(){
  const first=finalReviewUiProbe(23111,null,null,false);
  const second=finalReviewUiProbe(23111,first.sourceId,first.selected,false);
  return {first,second,sameInserted:JSON.stringify(first.inserted)===JSON.stringify(second.inserted),sameFeedback:JSON.stringify(first.feedback)===JSON.stringify(second.feedback)};
}

function rebuildShuffleProbe(){
  let algoChecked=0,securityChecked=0,algoMismatch=[],securityMismatch=[];
  for(const src of B_EXAM_ALGO_ITEMS){
    const sourceOpts=optionsOf(src),a=answerIndexOf(src),wrongText=sourceOpts.find((_,i)=>i!==a),baseline=feedbackOf(src,wrongText);
    for(const seed of [23121,23122,23123]){
      Math.random=seedRand(seed+algoChecked);
      const q=makeFinalAlgoExam(src),idx=optionsOf(q).findIndex(x=>text(x)===text(wrongText)),fb=feedbackOf(q,idx);
      if(idx<0||JSON.stringify(fb)!==JSON.stringify(baseline))algoMismatch.push(`${src.id}:${seed}`);
    }
    algoChecked++;
  }
  for(const sc of SECURITY_SCENARIOS){
    Math.random=seedRand(23200+securityChecked);
    const q1=makeFinalSecurity(sc),opts=optionsOf(q1),a=answerIndexOf(q1),wrongText=opts.find((_,i)=>i!==a),base=feedbackOf(q1,wrongText);
    for(const seed of [23211,23212,23213]){
      Math.random=seedRand(seed+securityChecked);
      const q=makeFinalSecurity(sc),idx=optionsOf(q).findIndex(x=>text(x)===text(wrongText)),fb=feedbackOf(q,idx);
      if(idx<0||JSON.stringify(fb)!==JSON.stringify(base))securityMismatch.push(`${sc.id}:${seed}`);
    }
    securityChecked++;
  }
  return {algoChecked,securityChecked,algoMismatch,securityMismatch};
}

function statelessProbe(){
  const ex=B_EXERCISES.find(x=>x.id==='stack_ops')||B_EXERCISES[0],pred=ex.steps.map(x=>x.predict).find(Boolean),a=answerIndexOf(pred),wrong=optionsOf(pred).findIndex((_,i)=>i!==a);
  const before=JSON.stringify(profile),f1=feedbackOf(pred,wrong),middle=JSON.stringify(profile),f2=feedbackOf(pred,wrong),after=JSON.stringify(profile);
  return {sameFeedback:JSON.stringify(f1)===JSON.stringify(f2),profileUnchanged:before===middle&&middle===after};
}

function disclosureProbe(){
  let totalWrong=0,compactCheckpointLeak=0,correctFeedbackCount=0,selectedNameMiss=0;
  const rows=[];
  for(const ex of B_EXERCISES)for(const s of ex.steps||[])if(s.predict)rows.push(s.predict);
  for(const sc of SECURITY_SCENARIOS)for(const s of sc.steps||[])rows.push(s);
  for(const q of rows){
    const opts=optionsOf(q),a=answerIndexOf(q);
    if(subjectBChoiceFeedbackV230(q,a))correctFeedbackCount++;
    for(let i=0;i<opts.length;i++){
      if(i===a)continue;totalWrong++;
      const f=subjectBChoiceFeedbackV230(q,i),h=f?compactHtml(f):'';
      if(h.includes('ここだけ確認'))compactCheckpointLeak++;
      if(!f||!text(f.diagnosis).includes(`「${text(opts[i])}」`))selectedNameMiss++;
    }
  }
  return {questions:rows.length,totalWrong,compactCheckpointLeak,correctFeedbackCount,selectedNameMiss};
}

function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}

const has=typeof SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC!=='undefined';
const trace=has?traceImmediateUiProbe():null;
const review=has?finalReviewUiProbe():null;
const rerender=has?rerenderProbe():null;
const rebuild=has?rebuildShuffleProbe():null;
const stateless=has?statelessProbe():null;
const disclosure=has?disclosureProbe():null;
console.log('__V231__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,has,spec:has?SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC:null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,domainSpec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),coverage:remediationCoverage(),
  trace,review,rerender,rebuild,stateless,disclosure,
  wrapperEvidence:{
    prediction:String(showBPrediction).includes('bPredictionChoiceFeedbackV230'),
    final:String(renderBFinalResult).includes('injectFinalReview'),
    finalStudy:String(renderBFinalResult).includes('updateBFinalRecoveryEntryV217')||String(renderBFinalResult).includes('injectFinalReview')
  }
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-6000:])
        m = re.search(r'__V231__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return html, json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req(version == 'v231' and previous == 'v230', 'v231 feedback learner-flow audit expects v230 parent')
source = Path('audits/SUBJECT_B_WRONG_ANSWER_FEEDBACK_REPAIR_v230.txt')
req(source.exists(), 'v230 wrong-answer feedback repair evidence missing')
st = source.read_text()
req('PASS — NO FINDINGS' in st and 'Use v231 for a post-repair learner-flow audit' in st, 'v230 learner-flow audit handoff drift')
expected = {
    '.github/subject-b-wrong-answer-feedback-learner-flow-audit/validate_audit.py',
    '.github/workflows/subject-b-wrong-answer-feedback-learner-flow-audit.yml',
}
changed = set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v231 audit-only source drift: ' + repr(sorted(changed ^ expected)))
for path in [
    'app/base-stable.html','app/subject-b-security-overrides-v200.txt','app/subject-b-algorithm-overrides-v202.txt','app/subject-b-session-overrides-v205.txt',
    'app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt',
    'app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt','app/subject-b-algorithm-domain-progression-overrides-v227.txt',
    'app/subject-b-wrong-answer-feedback-overrides-v230.txt','index.html'
]:
    req(Path(path).read_bytes() == subprocess.check_output(['git','show',parent+':'+path]), 'learner-facing source drift: ' + path)

html, cand = runtime('_site/index.html')
_, cand_refresh = runtime('_site/index.html')
_, par = runtime('_site_parent/index.html')
req(cand['v'] == version and par['v'] == previous, 'runtime versions')
req(cand['has'] is True and par['has'] is True, 'v230 feedback runtime missing')
req(cand['spec'] == par['spec'] == cand_refresh['spec'], 'v230 feedback spec drift')
req(cand['counts'] == par['counts'] == [20,16,4], 'final counts drift')
req(cand['seconds'] == par['seconds'] == 6000, 'time limit drift')
req(cand['pool'] == par['pool'] == 43, 'algorithm pool drift')
req(cand['high'] == par['high'] and len(cand['high']) == 15, 'high-trace inventory drift')
req(cand['floor'] == par['floor'] == 4, 'high-trace floor drift')
for key,label in [('orderSpec','v214 order'),('recoverySpec','v217 recovery'),('xpSpec','v219 XP'),('readinessSpec','v222 readiness'),('copySpec','v224 copy'),('domainSpec','v227 domain progression')]:
    req(cand[key] == par[key], label + ' spec drift')
req(cand['selectionSig'] == par['selectionSig'], '1000-seed final selection/order drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic validation failed')
req(cand['coverage'] == par['coverage'], 'direct remediation coverage changed')
req(cand['coverage']['algorithm'] == 43 and not cand['coverage']['algoBad'], 'algorithm remediation coverage drift')
req(cand['coverage']['security'] == 15 and not cand['coverage']['secBad'], 'security remediation coverage drift')

for key in ['trace','review','rerender','rebuild','stateless','disclosure','wrapperEvidence']:
    req(cand[key] == par[key], 'audit-only behavior drift: ' + key)
    req(cand[key] == cand_refresh[key], 'runtime refresh boundary drift: ' + key)

trace = cand['trace']
req(not trace['error'], 'TRACE immediate feedback UI failed: ' + str(trace['error']))
req(trace['feedback'] and trace['correctFeedback'] is None, 'TRACE wrong/correct feedback selection drift')
req(trace['afterWrong'] and trace['afterWrong']['hidden'] is False, 'TRACE wrong selection did not reveal feedback panel')
req('選んだ答えから見ると' in trace['afterWrong']['html'] and '次回の合図' in trace['afterWrong']['html'], 'TRACE immediate feedback labels missing')
req('ここだけ確認' not in trace['afterWrong']['html'], 'TRACE immediate feedback leaked post-answer checkpoint')
req(trace['selected'] in trace['feedback']['diagnosis'], 'TRACE diagnosis does not name selected distractor')
req(trace['afterCorrect'] and trace['afterCorrect']['hidden'] is True, 'TRACE correct selection did not clear immediate wrong-answer panel')

review = cand['review']
req(not review['renderError'], 'final submitted review rendering failed: ' + str(review['renderError']))
req(review['feedback'] and len(review['inserted']) == 1, 'final submitted review feedback insertion missing')
inserted = review['inserted'][0]
req(all(x in inserted for x in ['選んだ答えから見ると','ここだけ確認','次回の合図']), 'final submitted review missing three-part feedback')
req(review['selected'] in review['feedback']['diagnosis'], 'final review diagnosis lost selected distractor')
req(not review['launchError'], 'final remediation click failed: ' + str(review['launchError']))
req(review['target']['mode'] == 'trace' and review['launchedId'] == review['target']['id'], 'final review remediation did not launch mapped TRACE target')

rerender = cand['rerender']
req(rerender['sameInserted'] is True and rerender['sameFeedback'] is True, 'submitted review changed across rerender')
req(not rerender['first']['renderError'] and not rerender['second']['renderError'], 'rerender probe rendering failed')

rebuild = cand['rebuild']
req(rebuild['algoChecked'] == 43 and rebuild['securityChecked'] == 15, 'refresh/rebuild inventory drift')
req(not rebuild['algoMismatch'] and not rebuild['securityMismatch'], 'feedback lost its distractor after shuffled rebuild')

stateless = cand['stateless']
req(stateless['sameFeedback'] is True and stateless['profileUnchanged'] is True, 'feedback lookup mutated learner profile or changed between calls')

disclosure = cand['disclosure']
req(disclosure['questions'] == 85 and disclosure['totalWrong'] == 255, 'guided practice disclosure inventory drift')
req(disclosure['compactCheckpointLeak'] == 0, 'immediate guided practice leaked checkpoint')
req(disclosure['correctFeedbackCount'] == 0, 'correct choices unexpectedly received wrong-answer diagnosis')
req(disclosure['selectedNameMiss'] == 0, 'a guided-practice diagnosis failed to name the selected distractor')
req(all(cand['wrapperEvidence'].values()), 'v230 learner-flow wrapper wiring evidence missing')

fixture = {
    'name': f'subject-b-wrong-answer-feedback-learner-flow-audit-{version}',
    'version': version,
    'previous': previous,
    'sourceMain': parent,
    'learnerFacingChange': False,
    'sourceRepair': 'audits/SUBJECT_B_WRONG_ANSWER_FEEDBACK_REPAIR_v230.txt',
    'traceImmediate': trace,
    'finalReview': review,
    'rerender': rerender,
    'rebuild': rebuild,
    'stateless': stateless,
    'disclosure': disclosure,
    'selectionSignature1000': cand['selectionSig'],
    'remediation': cand['coverage'],
    'finding': None,
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-wrong-answer-feedback-learner-flow-audit-v231.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')

audit = f'''FE QUEST v231 — Subject B Wrong-Answer Feedback Learner-Flow Audit
=============================================================================

Result
------
PASS — NO FINDINGS
Previous: v230
Source main: {parent}
Learner-facing change in v231: none

What was audited
----------------
v230 repaired the medium finding that Subject B wrong-answer feedback could not distinguish one distractor from another. v231 audits the repair as an actual learner flow rather than only checking metadata coverage: choose a wrong answer in guided TRACE, see immediate diagnosis, submit a wrong answer in final practice, see the complete review diagnosis, follow the remediation action, rerender the review, and reconstruct the question after a runtime refresh / reshuffle.
No learner-facing code or question data was changed in this release.

Immediate wrong-selection proof
-------------------------------
TRACE sample exercise: {trace['exercise']}
Selected distractor: {trace['selected']}
Wrong selection opened the v230 diagnosis panel: yes.
Immediate panel contains “選んだ答えから見ると” and “次回の合図”: yes.
Immediate panel hides the post-answer “ここだけ確認” checkpoint: yes.
Selecting the correct option clears the wrong-answer panel: yes.
The correct option has no wrong-answer diagnosis object: yes.
Across all 85 guided algorithm/security questions ({disclosure['totalWrong']} wrong-choice slots), checkpoint leaks: {disclosure['compactCheckpointLeak']}; correct-choice diagnosis count: {disclosure['correctFeedbackCount']}; selected-distractor naming misses: {disclosure['selectedNameMiss']}.

Submitted final-review proof
----------------------------
Final review sample source: {review['sourceId']} / {review['domain']} / {review['format']}
Selected distractor: {review['selected']}
The rendered wrong-answer row received one v230 feedback block after the existing explanation: yes.
The submitted review block contains all three parts — diagnosis, checkpoint, next cue: yes.
The diagnosis remains keyed to the selected distractor text after final-answer randomization: yes.
The existing review remediation button still resolved through bFinalRemediationTarget and launched TRACE target: {review['target']['id']}.
The v217 recovery entry and existing final-review structure remain untouched; v230 is additive after the existing explanation.

Rerender / refresh proof
------------------------
Rendering the same submitted review twice produced identical feedback: yes.
A second fresh Node runtime over the same candidate produced the same TRACE/review/rebuild probes: yes.
All 43 algorithm final sources were rebuilt under three deterministic shuffles with zero feedback-key mismatches.
All 15 security final sources were rebuilt under three deterministic shuffles with zero feedback-key mismatches.
Feedback lookup is stateless: repeated lookup produced the same object and did not mutate the learner profile.

Preserved contracts
-------------------
1000 deterministic final-session seeds matched v230 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, v222 readiness/65% threshold, v224 copy, v227 domain progression, and the complete v230 feedback spec are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.
No profile schema migration and no feedback history persistence were introduced.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
The v229-v231 wrong-answer feedback sequence is closed. The next Subject B learning-quality frontier should audit distractor plausibility and difficulty calibration: whether wrong options represent realistic reasoning mistakes, whether easy/standard/advanced labels separate meaningfully, and whether practice-to-final difficulty progression is smooth without changing scoring or the 65% readiness gate unless evidence supports a later repair.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_WRONG_ANSWER_FEEDBACK_LEARNER_FLOW_AUDIT_v231.txt').write_text(audit)
print('FEQUEST_V231_SUBJECT_B_WRONG_ANSWER_FEEDBACK_LEARNER_FLOW_AUDIT_OK')
