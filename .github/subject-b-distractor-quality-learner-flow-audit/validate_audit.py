from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-distractor-quality-learner-flow-audit-(v(\d+))', branch)
    req(m, 'bad Subject B distractor quality learner-flow audit branch')
    version = m.group(1)
    return version, f'v{int(m.group(2)) - 1}'


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function forcedRandom(first){let n=0;return ()=>{n++;return n===1?first:((n*0.173)%1);};}
function text(v){return String(v??'').trim();}
function optionsOf(q){return Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);}
function answerIndex(q){
  if(Number.isInteger(q?.a))return q.a;
  if(Number.isInteger(q?.correctIndex))return q.correctIndex;
  if(Number.isInteger(q?.answerIndex))return q.answerIndex;
  if(typeof q?.correctText==='string')return optionsOf(q).map(text).indexOf(text(q.correctText));
  if(Number.isInteger(q?.correct))return q.correct;
  return Number(q?.correct);
}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function feedbackOf(q,selected){const f=subjectBChoiceFeedbackV230(q,selected);return f?clone(f):null;}
function structured(f){return !!(f&&text(f.diagnosis)&&text(f.checkpoint)&&text(f.nextCue));}
function numericOnly(q){return optionsOf(q).length===4&&optionsOf(q).every(x=>/^-?\d+(?:\.\d+)?$/.test(text(x)));}
function target(){
  const ex=B_EXERCISES.find(x=>x.id==='selection_sort_b');
  const pred=ex?.steps?.map(x=>x.predict).filter(Boolean).find(x=>text(x.q)==='最終的なminPosは？')||null;
  return {ex,pred};
}
function selectionSignature(n){
  let h=2166136261>>>0;
  for(let i=0;i<n;i++){
    profile.bFinalStats={};
    Math.random=seedRand((0x234000+i)>>>0);
    const a=buildBFinal(),s=a.map(x=>`${x.kind}:${x.sourceId}`).join('|');
    for(let j=0;j<s.length;j++){h^=s.charCodeAt(j);h=Math.imul(h,16777619)>>>0;}
  }
  return h>>>0;
}
function classList(){return {add(){},remove(){},toggle(){},contains(){return false;}};}
function traceImmediateProbe(){
  const {ex,pred}=target(),o=optionsOf(pred),a=answerIndex(pred),wrong=o.findIndex(x=>text(x)==='0');
  const buttons=[];let panel=null;
  const root={innerHTML:'',appendChild(node){buttons.push(node);return node;},querySelectorAll(){return buttons;},insertAdjacentElement(_p,node){panel=node;},classList:classList()};
  const generic=new Map();
  const oldGet=document.getElementById,oldCreate=document.createElement,oldQuery=document.querySelectorAll;
  document.getElementById=(id)=>{
    if(id==='predictionOptions')return root;
    if(id==='bPredictionChoiceFeedbackV230')return panel;
    if(!generic.has(id))generic.set(id,dummy());
    return generic.get(id);
  };
  document.createElement=(tag)=>{
    if(tag==='button')return {onclick:null,textContent:'',type:'button',className:'',dataset:{},disabled:false,classList:classList()};
    if(tag==='div')return {id:'',hidden:true,innerHTML:'',className:'',dataset:{},insertAdjacentHTML(){},classList:classList()};
    return dummy();
  };
  document.querySelectorAll=()=>[];
  let error=null,afterWrong=null,afterCorrect=null;
  try{
    showBPrediction(pred);
    if(typeof buttons[wrong]?.onclick!=='function')throw new Error('target wrong handler missing');
    buttons[wrong].onclick();
    afterWrong={hidden:panel?.hidden,html:panel?.innerHTML||''};
    if(typeof buttons[a]?.onclick!=='function')throw new Error('target correct handler missing');
    buttons[a].onclick();
    afterCorrect={hidden:panel?.hidden,html:panel?.innerHTML||''};
  }catch(e){error=String(e&&e.stack||e);}
  finally{document.getElementById=oldGet;document.createElement=oldCreate;document.querySelectorAll=oldQuery;}
  return {error,exercise:ex?.id,q:pred?.q,options:o.map(text),correctIndex:a,correctText:text(o[a]),wrongIndex:wrong,feedback:feedbackOf(pred,wrong),correctFeedback:feedbackOf(pred,a),afterWrong,afterCorrect,numericOnly:numericOnly(pred)};
}
function miniMockProbe(){
  const {ex}=target();
  Math.random=forcedRandom(.99);
  const candidate=bMockCandidateFromExercise(ex);
  if(!candidate)return {found:false};
  const q=shuffleBMockAnswer(candidate),i=optionsOf(q).findIndex(x=>text(x)==='0');
  return {found:text(q.q)==='最終的なminPosは？',sourceId:q.sourceId||ex.id,q:q.q,options:optionsOf(q).map(text),correctText:text(q.correctText||optionsOf(q)[answerIndex(q)]),wrongIndex:i,feedback:feedbackOf(q,i),numericOnly:numericOnly(q),studyMode:q.studyMode||'trace'};
}
function traceFinalProbe(){
  const {ex}=target();
  Math.random=forcedRandom(.99);
  const q=makeFinalAlgoFromTrace(ex);
  if(!q)return {found:false};
  const i=optionsOf(q).findIndex(x=>text(x)==='0');
  return {found:text(q.q)==='最終的なminPosは？',sourceId:q.sourceId||ex.id,kind:q.kind,studyMode:q.studyMode,q:q.q,options:optionsOf(q).map(text),correctText:text(q.correctText||optionsOf(q)[answerIndex(q)]),wrongIndex:i,feedback:feedbackOf(q,i),numericOnly:numericOnly(q),hasWrongFeedback:Array.isArray(q.wrongFeedback),hasWrongFeedbackByText:!!q.wrongFeedbackByText};
}
function shuffleProbe(){
  const {ex,pred}=target(),base=feedbackOf(pred,optionsOf(pred).findIndex(x=>text(x)==='0'));
  let checked=0;const mismatches=[];
  for(let seed=23420;seed<23520;seed++){
    Math.random=forcedRandom(.99);
    const candidate=bMockCandidateFromExercise(ex);
    if(!candidate||text(candidate.q)!=='最終的なminPosは？')continue;
    Math.random=seedRand(seed);
    const q=shuffleBMockAnswer(candidate),i=optionsOf(q).findIndex(x=>text(x)==='0'),f=feedbackOf(q,i);
    checked++;
    if(i<0||!numericOnly(q)||JSON.stringify(f)!==JSON.stringify(base))mismatches.push(seed);
  }
  return {checked,mismatches};
}
function statelessProbe(){
  const {pred}=target(),i=optionsOf(pred).findIndex(x=>text(x)==='0');
  const before=JSON.stringify(profile),a=feedbackOf(pred,i),mid=JSON.stringify(profile),b=feedbackOf(pred,i),after=JSON.stringify(profile);
  return {same:JSON.stringify(a)===JSON.stringify(b),profileUnchanged:before===mid&&mid===after};
}
function feedbackCoverage(){
  const rows=[];
  for(const ex of B_EXERCISES)for(const s of ex.steps||[])if(s.predict)rows.push(s.predict);
  for(const sc of SECURITY_SCENARIOS)for(const s of sc.steps||[])rows.push(s);
  for(const q of B_EXAM_ALGO_ITEMS)rows.push(q);
  for(const set of B_COMPOUND_SETS)for(const q of set.qs||[])rows.push(q);
  let wrong=0,structuredCount=0,correctFeedback=0;const missing=[];
  for(const q of rows){
    const o=optionsOf(q),a=answerIndex(q);if(feedbackOf(q,a))correctFeedback++;
    for(let i=0;i<o.length;i++){
      if(i===a)continue;wrong++;
      const f=feedbackOf(q,i);if(structured(f))structuredCount++;else missing.push(`${text(q.q)}:${i}`);
    }
  }
  return {questions:rows.length,wrong,structured:structuredCount,correctFeedback,missing};
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
const t=target(),sourceFeedback=feedbackOf(t.pred,optionsOf(t.pred).findIndex(x=>text(x)==='0'));
const trace=traceImmediateProbe(),mini=miniMockProbe(),finalTrace=traceFinalProbe();
const finalFeedbackMatches=JSON.stringify(finalTrace.feedback)===JSON.stringify(sourceFeedback);
console.log('__V234__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,repairSpec:globalThis.SUBJECT_B_DISTRACTOR_QUALITY_V233_SPEC||null,feedbackSpec:globalThis.SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC||null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,domainSpec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),remediation:remediationCoverage(),
  source:{exercise:t.ex?.id,q:t.pred?.q,options:optionsOf(t.pred).map(text),a:answerIndex(t.pred),feedback0:sourceFeedback,numericOnly:numericOnly(t.pred)},
  trace,mini,finalTrace,finalFeedbackMatches,shuffle:shuffleProbe(),stateless:statelessProbe(),feedbackCoverage:feedbackCoverage(),
  generatorEvidence:{traceFinalSource:String(makeFinalAlgoFromTrace),miniCandidateSource:String(bMockCandidateFromExercise)}
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V234__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v234' and previous=='v233','v234 learner-flow audit expects v233 parent')
source_audit=Path('audits/SUBJECT_B_DISTRACTOR_QUALITY_REPAIR_v233.txt')
req(source_audit.exists(),'v233 distractor repair evidence missing')
st=source_audit.read_text()
req('PASS — v232 learner-visible structural distractor finding repaired' in st and 'Use v234 for a post-repair learner-flow/regression audit' in st,'v233 audit handoff drift')
expected={
  '.github/subject-b-distractor-quality-learner-flow-audit/validate_audit.py',
  '.github/workflows/subject-b-distractor-quality-learner-flow-audit.yml'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v234 audit-only source drift: '+repr(sorted(changed^expected)))
for path in [
  'app/base-stable.html','app/subject-b-security-overrides-v200.txt','app/subject-b-algorithm-overrides-v202.txt','app/subject-b-session-overrides-v205.txt',
  'app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt',
  'app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt','app/subject-b-algorithm-domain-progression-overrides-v227.txt',
  'app/subject-b-wrong-answer-feedback-overrides-v230.txt','app/subject-b-distractor-quality-overrides-v233.txt'
]:
    req(Path(path).read_bytes()==subprocess.check_output(['git','show',parent+':'+path]),'audit-only learner source drift: '+path)

cand=runtime('_site/index.html')
par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['repairSpec']==par['repairSpec'],'v233 repair spec drift')
req(cand['feedbackSpec']==par['feedbackSpec'],'v230 feedback spec drift')
req(cand['counts']==par['counts']==[20,16,4],'final counts drift')
req(cand['seconds']==par['seconds']==6000,'time drift')
req(cand['pool']==par['pool']==43,'pool drift')
req(cand['high']==par['high'] and len(cand['high'])==15 and cand['floor']==par['floor']==4,'trace-floor drift')
for key,label in [('orderSpec','v214 order'),('recoverySpec','v217 recovery'),('xpSpec','v219 XP'),('readinessSpec','v222 readiness'),('copySpec','v224 copy'),('domainSpec','v227 domain progression')]:
    req(cand[key]==par[key],label+' drift')
req(cand['selectionSig']==par['selectionSig'],'1000-seed final selection/order drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(cand['remediation']==par['remediation'],'remediation changed')
req(cand['remediation']['algorithm']==43 and not cand['remediation']['algoBad'],'algorithm remediation invalid')
req(cand['remediation']['security']==15 and not cand['remediation']['secBad'],'security remediation invalid')

s=cand['source']
req(s['exercise']=='selection_sort_b' and s['q']=='最終的なminPosは？','target source missing')
req(s['options']==['1','2','3','0'] and s['a']==2 and s['numericOnly'] is True,'v233 target options/correct contract drift')
req(structured := bool(s['feedback0'] and s['feedback0'].get('diagnosis') and s['feedback0'].get('checkpoint') and s['feedback0'].get('nextCue')),'target 0 feedback incomplete')
req('minPos' in s['feedback0']['diagnosis'] and '0' in s['feedback0']['diagnosis'],'target stale-minPos diagnosis drift')

trace=cand['trace']
req(not trace['error'],'TRACE immediate UI probe failed: '+str(trace['error']))
req(trace['wrongIndex']>=0 and trace['correctText']=='3' and trace['numericOnly'] is True,'TRACE target option form drift')
req(trace['feedback']==s['feedback0'] and trace['correctFeedback'] is None,'TRACE selected/correct feedback routing drift')
req(trace['afterWrong'] and trace['afterWrong']['hidden'] is False,'TRACE wrong feedback not shown')
req('選んだ答えから見ると' in trace['afterWrong']['html'] and '次回の合図' in trace['afterWrong']['html'],'TRACE feedback labels missing')
req('ここだけ確認' not in trace['afterWrong']['html'],'TRACE immediate feedback leaked checkpoint')
req(trace['afterCorrect'] and trace['afterCorrect']['hidden'] is True and trace['afterCorrect']['html']=='','TRACE correct answer did not clear wrong panel')

mini=cand['mini']
req(mini['found'] is True,'forced target did not reach mini-mock candidate path')
req(mini['sourceId']=='selection_sort_b' and mini['wrongIndex']>=0 and mini['correctText']=='3','mini-mock target contract drift')
req(mini['numericOnly'] is True and '[1,5,2,4]' not in mini['options'],'mini-mock answer-form shortcut remains')
req(mini['feedback']==s['feedback0'],'mini-mock shuffled 0 feedback drift')

finalt=cand['finalTrace']
req(finalt['found'] is True,'forced target did not reach trace-derived final path')
req(finalt['sourceId']=='selection_sort_b' and finalt['wrongIndex']>=0 and finalt['correctText']=='3','trace-derived final target contract drift')
req(finalt['numericOnly'] is True and '[1,5,2,4]' not in finalt['options'],'trace-derived final answer-form shortcut remains')

sh=cand['shuffle']
req(sh['checked']==100 and not sh['mismatches'],'mini-mock shuffle feedback/form regression: '+repr(sh['mismatches'][:10]))
req(cand['stateless']['same'] is True and cand['stateless']['profileUnchanged'] is True,'feedback lookup mutates profile state')
fc=cand['feedbackCoverage']
req(fc['questions']==173 and fc['wrong']==519 and fc['structured']==519 and fc['correctFeedback']==0 and not fc['missing'],'source v230 feedback coverage regression')

findings=[]
if not cand['finalFeedbackMatches']:
    findings.append({
      'id':'subject_b_trace_final_feedback_not_propagated',
      'severity':'Medium',
      'summary':'Trace-derived final questions keep the repaired choices and correct answer but do not preserve the selected-wrong-choice feedback metadata from their TRACE source.'
    })

fixture={
  'name':'subject-b-distractor-quality-learner-flow-audit-v234','version':version,'previous':previous,'sourceMain':parent,'learnerFacingChange':False,
  'target':s,'traceImmediate':trace,'miniMock':mini,'traceDerivedFinal':finalt,'finalFeedbackMatchesSource':cand['finalFeedbackMatches'],
  'shuffle':sh,'stateless':cand['stateless'],'feedbackCoverage':fc,'selectionSignature1000':cand['selectionSig'],'remediation':cand['remediation'],'findings':findings
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-distractor-quality-learner-flow-audit-v234.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

result='PASS — MEDIUM FINDING RECORDED' if findings else 'PASS — NO FINDINGS'
final_feedback='matches source' if cand['finalFeedbackMatches'] else 'missing or mismatched against source'
audit=f'''FE QUEST v234 — Subject B Distractor Quality Post-Repair Learner-Flow Audit
=================================================================================

Result
------
{result}
Previous: v233
Source main: {parent}
Learner-facing change in v234: none

What was audited
----------------
v233 replaced the learner-visible answer-form shortcut in selection_sort_b / 「最終的なminPosは？」: [1,5,2,4] became numeric distractor 0. v234 follows that repaired wrong choice through TRACE, algorithm mini-mock, and the trace-derived final generator, including choice shuffling and selected-choice feedback.

Source / TRACE
--------------
Source options: {json.dumps(s['options'],ensure_ascii=False)}
Correct answer: 3 (index 2)
All four choices use the same numeric answer form: yes
Old array-shaped shortcut present: no
Choosing 0 in TRACE shows the v233 stale-minPos diagnosis and next-attempt cue: yes
Immediate TRACE feedback does not expose the post-answer checkpoint: yes
Choosing the correct answer clears the wrong-answer feedback panel: yes

Algorithm mini-mock
-------------------
The same second prediction was forced through the real bMockCandidateFromExercise + shuffleBMockAnswer path.
Displayed options: {json.dumps(mini['options'],ensure_ascii=False)}
All displayed choices remain numeric: yes
The selected 0 feedback matches the source feedback after shuffling: yes
100 additional shuffled target samples retained the 0-to-feedback mapping: yes

Trace-derived final
-------------------
The same second prediction was forced through makeFinalAlgoFromTrace.
Displayed options: {json.dumps(finalt['options'],ensure_ascii=False)}
All displayed choices remain numeric and the old array shortcut is absent: yes
Correct answer remains 3: yes
Selected 0 feedback: {final_feedback}
Generated item exposes wrongFeedback: {str(finalt['hasWrongFeedback']).lower()}
Generated item exposes wrongFeedbackByText: {str(finalt['hasWrongFeedbackByText']).lower()}

Finding
-------
'''
if findings:
    audit += '''Medium — subject_b_trace_final_feedback_not_propagated
The v233 distractor repair itself reaches the final-style trace generator correctly, but makeFinalAlgoFromTrace does not carry the v230/v233 selected-wrong-choice feedback metadata into the generated item. The question remains score-correct and the answer-form shortcut is gone, but a learner who chooses 0 in this trace-derived final path cannot reliably receive the precise stale-minPos diagnosis that is available in TRACE and mini-mock. This is a learning-feedback propagation defect, not a scoring or question-correctness defect.
'''
else:
    audit += 'No learner-flow findings.\n'
audit += f'''

Regression coverage
-------------------
Source Subject B questions with v230 feedback: {fc['questions']}
Structured wrong-choice feedback: {fc['structured']} / {fc['wrong']}
Wrong-feedback attached to correct choices: {fc['correctFeedback']}
Repeated feedback lookup mutates profile: no

Preserved contracts
-------------------
1000 deterministic final-session seeds match v233 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 order, v217 recovery, v219 XP, v222 readiness/65% threshold, v224 copy, v227 domain progression, v230 source feedback, and the v233 distractor repair are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.

Findings summary
----------------
High: 0
Medium: {1 if findings else 0}
Low: 0

Decision
--------
'''
if findings:
    audit += '''Use v235 for a narrow metadata-propagation repair around makeFinalAlgoFromTrace. Carry wrongFeedback / wrongFeedbackByText from the selected TRACE prediction into the generated final item by option text, preserving shuffled-option identity. Do not change prompts, choices, correct answers, scoring, final selection/order, timing, readiness, difficulty labels, or remediation. Follow with a v236 post-repair learner-flow audit. The earlier v232 Low difficulty-label separation note remains advisory and is not promoted by this finding.
'''
else:
    audit += 'The v232-v234 distractor-quality sequence is closed. Keep the v232 difficulty-label note advisory until stronger learner-performance evidence exists.\n'
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_DISTRACTOR_QUALITY_LEARNER_FLOW_AUDIT_v234.txt').write_text(audit)
print('FEQUEST_V234_SUBJECT_B_DISTRACTOR_QUALITY_LEARNER_FLOW_AUDIT_OK findings='+str(len(findings)))
