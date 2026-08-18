from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-distractor-quality-learner-flow-audit-(v(\d+))',branch)
    req(m,'bad Subject B distractor quality learner-flow audit branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function text(v){return String(v??'').trim();}
function opts(q){return Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);}
function ai(q){return Number.isInteger(Number(q?.a))?Number(q.a):Number(q?.correct);}
function clone(v){return JSON.parse(JSON.stringify(v));}
function feedback(q,selected){const f=subjectBChoiceFeedbackV230(q,selected);return f?clone(f):null;}
function structured(f){return !!(f&&text(f.diagnosis)&&text(f.checkpoint)&&text(f.nextCue));}
function numericOnly(q){return opts(q).every(x=>/^-?\d+(?:\.\d+)?$/.test(text(x)));}
function targetSource(){
  const ex=B_EXERCISES.find(x=>x.id==='selection_sort_b');
  const pred=ex?.steps?.find(x=>x.predict?.q==='最終的なminPosは？')?.predict||null;
  return {ex,pred};
}
function signature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x234000+i)>>>0);const items=buildBFinal();const s=items.map(x=>`${x.kind}:${x.sourceId}`).join('|');for(let j=0;j<s.length;j++){h^=s.charCodeAt(j);h=Math.imul(h,16777619)>>>0;}}return h>>>0;}

function immediateTraceProbe(){
  const {ex,pred}=targetSource();
  const choices=opts(pred),a=ai(pred),wrong=choices.findIndex(x=>text(x)==='0');
  const buttons=choices.map(()=>({onclick:null,dataset:{},disabled:false,classList:{add(){},remove(){},toggle(){},contains(){return false;}}}));
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
    if(typeof buttons[wrong]?.onclick!=='function')throw new Error('target wrong handler missing');
    buttons[wrong].onclick();
    afterWrong={hidden:panel?.hidden,html:panel?.innerHTML||''};
    if(typeof buttons[a]?.onclick!=='function')throw new Error('target correct handler missing');
    buttons[a].onclick();
    afterCorrect={hidden:panel?.hidden,html:panel?.innerHTML||''};
  }catch(e){error=String(e&&e.stack||e);}
  finally{document.getElementById=oldGet;document.createElement=oldCreate;document.querySelectorAll=oldQuery;}
  const fb=feedback(pred,wrong),correctFb=feedback(pred,a);
  return {error,exercise:ex?.id,q:pred?.q,options:choices.map(text),correctIndex:a,correctText:text(choices[a]),wrongIndex:wrong,feedback:fb,correctFeedback:correctFb,afterWrong,afterCorrect,numericOnly:numericOnly(pred)};
}

function findMiniMockTarget(){
  const originalStats=clone(profile.bMockStats||{});
  let hit=null,sessions=0;
  for(let seed=23401;seed<23801&&!hit;seed++){
    sessions++;
    profile.bMockStats={};
    Math.random=seedRand(seed);
    const items=buildBMock();
    const q=items.find(x=>x.sourceId==='selection_sort_b'&&text(x.q)==='最終的なminPosは？');
    if(q)hit={seed,q};
  }
  profile.bMockStats=originalStats;
  if(!hit)return {sessions,found:false};
  const q=hit.q,i=opts(q).findIndex(x=>text(x)==='0'),f=feedback(q,i);
  return {sessions,found:true,seed:hit.seed,sourceId:q.sourceId,q:q.q,options:opts(q).map(text),correctText:text(q.correctText||opts(q)[ai(q)]),wrongIndex:i,feedback:f,numericOnly:numericOnly(q),studyMode:q.studyMode||'trace'};
}

function findFinalTraceTarget(){
  const original=clone(profile.bFinalStats||{});
  let hit=null,sessions=0;
  for(let seed=23901;seed<25901&&!hit;seed++){
    sessions++;
    profile.bFinalStats={};
    Math.random=seedRand(seed);
    const items=buildBFinal();
    const q=items.find(x=>x.sourceId==='selection_sort_b'&&text(x.q)==='最終的なminPosは？');
    if(q)hit={seed,q};
  }
  profile.bFinalStats=original;
  if(!hit)return {sessions,found:false};
  const q=hit.q,i=opts(q).findIndex(x=>text(x)==='0'),f=feedback(q,i);
  return {sessions,found:true,seed:hit.seed,sourceId:q.sourceId,kind:q.kind,studyMode:q.studyMode,q:q.q,options:opts(q).map(text),correctText:text(q.correctText||opts(q)[ai(q)]),wrongIndex:i,feedback:f,numericOnly:numericOnly(q)};
}

function shuffleStability(){
  const {pred}=targetSource();
  const base=feedback(pred,opts(pred).findIndex(x=>text(x)==='0'));
  const mismatches=[],samples=[];
  for(let seed=26001;seed<26101;seed++){
    Math.random=seedRand(seed);
    const item=bMockCandidateFromExercise(B_EXERCISES.find(x=>x.id==='selection_sort_b'));
    if(!item||text(item.q)!=='最終的なminPosは？')continue;
    const q=shuffleBMockAnswer(item),i=opts(q).findIndex(x=>text(x)==='0'),f=feedback(q,i);
    samples.push({seed,options:opts(q).map(text),index:i});
    if(i<0||JSON.stringify(f)!==JSON.stringify(base)||!numericOnly(q))mismatches.push(seed);
  }
  return {matchedTargetSamples:samples.length,mismatches,samples:samples.slice(0,8)};
}

function repeatedLookupStateless(){
  const {pred}=targetSource(),i=opts(pred).findIndex(x=>text(x)==='0');
  const before=JSON.stringify(profile),a=feedback(pred,i),mid=JSON.stringify(profile),b=feedback(pred,i),after=JSON.stringify(profile);
  return {same:JSON.stringify(a)===JSON.stringify(b),profileUnchanged:before===mid&&mid===after};
}

function allFeedbackCoverage(){
  const rows=[];
  for(const ex of B_EXERCISES)for(const s of ex.steps||[])if(s.predict)rows.push(s.predict);
  for(const sc of SECURITY_SCENARIOS)for(const s of sc.steps||[])rows.push(s);
  for(const q of B_EXAM_ALGO_ITEMS)rows.push(q);
  for(const set of B_COMPOUND_SETS)for(const q of set.qs||[])rows.push(q);
  let wrong=0,structuredCount=0,correctFeedback=0,missing=[];
  for(const q of rows){
    const o=opts(q),a=ai(q);if(feedback(q,a))correctFeedback++;
    for(let i=0;i<o.length;i++){if(i===a)continue;wrong++;const f=feedback(q,i);if(structured(f))structuredCount++;else missing.push(text(q.q)+':'+i);}
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

const source=targetSource();
console.log('__V234__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  repairSpec:globalThis.SUBJECT_B_DISTRACTOR_QUALITY_V233_SPEC||null,
  feedbackSpec:globalThis.SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC||null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,domainSpec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:signature(1000),remediation:remediationCoverage(),
  source:{exercise:source.ex?.id,q:source.pred?.q,options:opts(source.pred).map(text),a:ai(source.pred),feedback0:feedback(source.pred,opts(source.pred).findIndex(x=>text(x)==='0')),numericOnly:numericOnly(source.pred)},
  trace:immediateTraceProbe(),mini:findMiniMockTarget(),finalTrace:findFinalTraceTarget(),shuffle:shuffleStability(),stateless:repeatedLookupStateless(),feedbackCoverage:allFeedbackCoverage()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V234__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


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

html,cand=runtime('_site/index.html')
_,par=runtime('_site_parent/index.html')
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
req(mini['found'] is True,'target question never surfaced naturally in mini-mock search')
req(mini['sourceId']=='selection_sort_b' and mini['wrongIndex']>=0 and mini['correctText']=='3','mini-mock target contract drift')
req(mini['numericOnly'] is True and '[1,5,2,4]' not in mini['options'],'mini-mock answer-form shortcut remains')
req(mini['feedback']==s['feedback0'],'mini-mock shuffled 0 feedback drift')

finalt=cand['finalTrace']
req(finalt['found'] is True,'target question never surfaced naturally in trace-derived final search')
req(finalt['sourceId']=='selection_sort_b' and finalt['wrongIndex']>=0 and finalt['correctText']=='3','trace-derived final target contract drift')
req(finalt['numericOnly'] is True and '[1,5,2,4]' not in finalt['options'],'trace-derived final answer-form shortcut remains')
req(finalt['feedback']==s['feedback0'],'trace-derived final 0 feedback drift')

sh=cand['shuffle']
req(sh['matchedTargetSamples']>=10,'insufficient target shuffle samples')
req(not sh['mismatches'],'shuffle feedback/form mismatch: '+repr(sh['mismatches'][:10]))
req(cand['stateless']['same'] is True and cand['stateless']['profileUnchanged'] is True,'feedback lookup is not stateless across rerender/rebuild')
fc=cand['feedbackCoverage']
req(fc['questions']==173 and fc['wrong']==519 and fc['structured']==519 and fc['correctFeedback']==0 and not fc['missing'],'v230 feedback regression after v233')

fixture={
  'name':'subject-b-distractor-quality-learner-flow-audit-v234','version':version,'previous':previous,'sourceMain':parent,'learnerFacingChange':False,
  'target':s,'traceImmediate':trace,'miniMock':mini,'traceDerivedFinal':finalt,'shuffle':sh,'stateless':cand['stateless'],'feedbackCoverage':fc,
  'selectionSignature1000':cand['selectionSig'],'remediation':cand['remediation'],'findings':[]
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-distractor-quality-learner-flow-audit-v234.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v234 — Subject B Distractor Quality Post-Repair Learner-Flow Audit
=================================================================================

Result
------
PASS — NO FINDINGS
Previous: v233
Source main: {parent}
Learner-facing change in v234: none

What was audited
----------------
v233 replaced the single genuine learner-visible structural mismatch in selection_sort_b / 「最終的なminPosは？」: the array-shaped distractor [1,5,2,4] became numeric distractor 0. v234 audited the repaired question through the learner-visible TRACE, algorithm mini-mock, and trace-derived final paths, including shuffled choice-specific feedback and rebuild/rerender boundaries.

Source contract
---------------
Target options: {json.dumps(s['options'],ensure_ascii=False)}
Correct answer: 3 (index 2)
All four options are numeric answer forms: yes
Old array-shaped shortcut present: no
The 0 distractor retains three-part v230 feedback and diagnoses the stale initial minPos misconception.

TRACE immediate flow
--------------------
Wrong choice 0 shows selected-choice diagnosis + next-attempt cue: yes
Immediate feedback hides the post-answer checkpoint: yes
Choosing the correct answer clears the wrong-answer panel: yes
Correct choice receives no wrong-answer diagnosis: yes

Mini-mock flow
--------------
The repaired target surfaced naturally after {mini['sessions']} deterministic mini-mock session probe(s), seed {mini.get('seed')}.
Displayed options: {json.dumps(mini.get('options',[]),ensure_ascii=False)}
All displayed choices remain numeric: yes
The selected 0 feedback matches the source feedback after shuffle: yes

Trace-derived final flow
------------------------
The repaired target surfaced naturally after {finalt['sessions']} deterministic final-session probe(s), seed {finalt.get('seed')}.
Displayed options: {json.dumps(finalt.get('options',[]),ensure_ascii=False)}
All displayed choices remain numeric: yes
The selected 0 feedback matches the source feedback after final-path shuffling: yes

Shuffle / rebuild regression
----------------------------
Target-question shuffled samples checked: {sh['matchedTargetSamples']}
Feedback-to-0 mismatches: {len(sh['mismatches'])}
Repeated feedback lookup returns identical content and does not mutate profile state: yes
Across all Subject B source questions, structured v230 feedback remains {fc['structured']} / {fc['wrong']} wrong choices; correct-answer wrong-feedback count: {fc['correctFeedback']}.

Preserved contracts
-------------------
1000 deterministic final-session seeds match v233 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 order, v217 recovery, v219 XP, v222 readiness/65% threshold, v224 copy, v227 domain progression, v230 choice-specific feedback and v233 distractor repair are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
The v232-v234 distractor-quality sequence is closed. The learner-visible answer-form shortcut is gone in source, mini-mock and trace-derived final flows, and selected-choice feedback survives shuffling without state mutation. Keep the v232 Low difficulty-label structural-separation note advisory until stronger evidence based on learner performance or item response behavior exists. The next Subject B quality frontier should examine cognitive-demand progression and transfer: whether TRACE practice teaches state tracking that actually transfers to unseen final-style items rather than only rehearsing familiar patterns.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_DISTRACTOR_QUALITY_LEARNER_FLOW_AUDIT_v234.txt').write_text(audit)
print('FEQUEST_V234_SUBJECT_B_DISTRACTOR_QUALITY_LEARNER_FLOW_AUDIT_OK')
