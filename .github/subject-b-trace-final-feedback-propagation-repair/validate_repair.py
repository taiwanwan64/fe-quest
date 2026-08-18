from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-trace-final-feedback-propagation-repair-(v(\d+))',branch)
    req(m,'bad Subject B trace-final feedback propagation repair branch')
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
function text(v){return String(v??'').trim();}
function opts(q){return Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);}
function ai(q){
  if(Number.isInteger(q?.a))return q.a;
  if(Number.isInteger(q?.correctIndex))return q.correctIndex;
  if(Number.isInteger(q?.answerIndex))return q.answerIndex;
  if(typeof q?.correctText==='string')return opts(q).map(text).indexOf(text(q.correctText));
  if(Number.isInteger(q?.correct))return q.correct;
  return -1;
}
function clone(v){return JSON.parse(JSON.stringify(v));}
function structured(f){return !!(f&&text(f.diagnosis)&&text(f.checkpoint)&&text(f.nextCue));}
function fb(q,selected){const f=subjectBChoiceFeedbackV230(q,selected);return f?clone(f):null;}
function forcedRandom(first){let n=0;return ()=>{n++;return n===1?first:((n*0.173)%1);};}
function sourcePred(ex,q){return (ex?.steps||[]).map(s=>s?.predict).filter(Boolean).find(p=>text(p.q)===text(q?.q))||null;}
function signature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x235000+i)>>>0);const items=buildBFinal();h=hashText(h,items.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function sourceFingerprint(){return B_EXERCISES.map(ex=>({id:ex.id,level:ex.level,steps:(ex.steps||[]).filter(s=>s.predict).map(s=>({q:s.predict.q,opts:opts(s.predict).map(text),a:ai(s.predict),wrongFeedback:s.predict.wrongFeedback,wrongFeedbackByText:s.predict.wrongFeedbackByText}))}));}
function traceFinalRows(){
  const rows=[];
  for(const ex of B_EXERCISES){
    for(const first of [0.01,0.99]){
      Math.random=forcedRandom(first);
      const q=makeFinalAlgoFromTrace(ex);
      if(!q)continue;
      const pred=sourcePred(ex,q),o=opts(q),a=ai(q),wrong=[];
      for(let i=0;i<o.length;i++)if(i!==a){
        const sourceIndex=pred?opts(pred).findIndex(x=>text(x)===text(o[i])):-1;
        const sourceFb=sourceIndex>=0?fb(pred,sourceIndex):null;
        const generatedFb=fb(q,i);
        wrong.push({i,text:text(o[i]),sourceIndex,sourceFb,generatedFb,match:JSON.stringify(sourceFb)===JSON.stringify(generatedFb),structured:structured(generatedFb)});
      }
      rows.push({exercise:ex.id,first,q:text(q.q),options:o.map(text),a,correctText:text(q.correctText||o[a]),sourceId:text(q.sourceId||ex.id),studyMode:text(q.studyMode||''),hasWrongFeedback:Array.isArray(q.wrongFeedback),hasWrongFeedbackByText:!!(q.wrongFeedbackByText&&typeof q.wrongFeedbackByText==='object'),wrong,correctFeedback:fb(q,a)});
    }
  }
  return rows;
}
function generatedFingerprint(rows){return rows.map(r=>({exercise:r.exercise,first:r.first,q:r.q,options:r.options,a:r.a,correctText:r.correctText,sourceId:r.sourceId,studyMode:r.studyMode}));}
function feedbackCoverage(){
  const rows=[];
  for(const ex of B_EXERCISES)for(const s of ex.steps||[])if(s.predict)rows.push(s.predict);
  for(const sc of SECURITY_SCENARIOS)for(const s of sc.steps||[])rows.push(s);
  for(const q of B_EXAM_ALGO_ITEMS)rows.push(q);
  for(const set of B_COMPOUND_SETS)for(const q of set.qs||[])rows.push(q);
  let wrong=0,structuredCount=0,correctFeedback=0,missing=[];
  for(const q of rows){const o=opts(q),a=ai(q);if(fb(q,a))correctFeedback++;for(let i=0;i<o.length;i++){if(i===a)continue;wrong++;const f=fb(q,i);if(structured(f))structuredCount++;else missing.push(text(q.q)+':'+i);}}
  return {questions:rows.length,wrong,structured:structuredCount,correctFeedback,missing};
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
const rows=traceFinalRows();
console.log('__V235__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  spec:globalThis.SUBJECT_B_TRACE_FINAL_FEEDBACK_V235_SPEC||null,
  v233Spec:globalThis.SUBJECT_B_DISTRACTOR_QUALITY_V233_SPEC||null,
  v230Spec:globalThis.SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC||null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,domainSpec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:signature(1000),sourceFingerprint:sourceFingerprint(),traceFinal:rows,generatedFingerprint:generatedFingerprint(rows),feedbackCoverage:feedbackCoverage(),remediation:remediationCoverage(),
  wrapperSource:String(makeFinalAlgoFromTrace)
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V235__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v235' and previous=='v234','v235 repair expects v234 parent')
source=Path('audits/SUBJECT_B_DISTRACTOR_QUALITY_LEARNER_FLOW_AUDIT_v234.txt')
req(source.exists(),'v234 learner-flow audit missing')
st=source.read_text()
req('PASS — MEDIUM FINDING RECORDED' in st and 'subject_b_trace_final_feedback_not_propagated' in st,'v234 finding evidence drift')

manifest=json.loads(Path('_release/content-change-v235.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'v235 manifest parent/source drift')
req(manifest['source_priority_tier']=='medium' and manifest['quality_audit_marker']=='subject_b_trace_final_feedback_not_propagated','v235 manifest finding drift')
req(manifest['allowed_question_ids']==[],'v235 repair is generator metadata only')
req(manifest['content_files']==['app/subject-b-trace-final-feedback-propagation-overrides-v235.txt'] and manifest['assembly_files']==['index.html'],'v235 manifest file scope drift')

expected={
  '.github/subject-b-trace-final-feedback-propagation-repair/validate_repair.py',
  '.github/workflows/subject-b-trace-final-feedback-propagation-repair.yml',
  '_release/content-change-v235.json',
  'app/subject-b-trace-final-feedback-propagation-overrides-v235.txt',
  'index.html'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v235 repair source drift: '+repr(sorted(changed^expected)))
for path in [
  'app/base-stable.html','app/subject-b-security-overrides-v200.txt','app/subject-b-algorithm-overrides-v202.txt','app/subject-b-session-overrides-v205.txt',
  'app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt',
  'app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt','app/subject-b-algorithm-domain-progression-overrides-v227.txt',
  'app/subject-b-wrong-answer-feedback-overrides-v230.txt','app/subject-b-distractor-quality-overrides-v233.txt'
]:
    req(Path(path).read_bytes()==subprocess.check_output(['git','show',parent+':'+path]),'preserved learner source drift: '+path)

cand=runtime('_site/index.html')
par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['spec'] is not None and par['spec'] is None,'v235 repair presence boundary')
req(cand['spec']['findingResolved']=='subject_b_trace_final_feedback_not_propagated','v235 repair spec finding drift')
req(cand['v233Spec']==par['v233Spec'] and cand['v230Spec']==par['v230Spec'],'v230/v233 spec drift')
req(cand['counts']==par['counts']==[20,16,4] and cand['seconds']==par['seconds']==6000,'final count/time drift')
req(cand['pool']==par['pool']==43,'algorithm pool drift')
req(cand['high']==par['high'] and len(cand['high'])==15 and cand['floor']==par['floor']==4,'high-trace contract drift')
for key,label in [('orderSpec','v214 order'),('recoverySpec','v217 recovery'),('xpSpec','v219 XP'),('readinessSpec','v222 readiness'),('copySpec','v224 copy'),('domainSpec','v227 domain progression')]:
    req(cand[key]==par[key],label+' drift')
req(cand['selectionSig']==par['selectionSig'],'1000-seed final selection/order drift')
req(cand['sourceFingerprint']==par['sourceFingerprint'],'source question/feedback metadata changed')
req(cand['generatedFingerprint']==par['generatedFingerprint'],'trace-final prompt/options/answer generation changed')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(cand['remediation']==par['remediation'],'remediation changed')
req(cand['remediation']['algorithm']==43 and not cand['remediation']['algoBad'],'algorithm remediation invalid')
req(cand['remediation']['security']==15 and not cand['remediation']['secBad'],'security remediation invalid')

rows=cand['traceFinal']; prow=par['traceFinal']
req(len(rows)==40 and len(prow)==40,'expected two trace-final probes for 20 exercises')
all_wrong=[w for r in rows for w in r['wrong']]
req(all(r['hasWrongFeedback'] and r['hasWrongFeedbackByText'] for r in rows),'trace-final feedback metadata missing after repair')
req(all(w['sourceIndex']>=0 and w['structured'] and w['match'] for w in all_wrong),'trace-final feedback remap incomplete')
req(all(r['correctFeedback'] is None for r in rows),'correct choices received wrong feedback')
parent_missing=sum(1 for r in prow if not r['hasWrongFeedback'] or not r['hasWrongFeedbackByText'])
req(parent_missing>0,'v234 parent no longer reproduces metadata propagation finding')

target=[r for r in rows if r['exercise']=='selection_sort_b' and r['q']=='最終的なminPosは？']
req(len(target)==1,'selection_sort_b target generated probe missing/duplicated')
tr=target[0]
req(set(tr['options'])=={'0','1','2','3'} and tr['correctText']=='3','selection_sort_b generated options/correct drift')
zero=[w for w in tr['wrong'] if w['text']=='0']
req(len(zero)==1 and zero[0]['structured'] and zero[0]['match'],'selection_sort_b 0 feedback did not propagate')
req('minPos' in zero[0]['generatedFb']['diagnosis'] and '0' in zero[0]['generatedFb']['diagnosis'],'selection_sort_b stale-minPos diagnosis drift')

cov=cand['feedbackCoverage']
req(cov['questions']==173 and cov['wrong']==519 and cov['structured']==519 and cov['correctFeedback']==0 and not cov['missing'],'source feedback coverage drift')
req(cand['spec']['generatedPromptChanged'] is False and cand['spec']['generatedOptionsChanged'] is False and cand['spec']['correctAnswerChanged'] is False,'v235 protected content flags drift')
req(cand['spec']['scoringChanged'] is False and cand['spec']['questionSelectionChanged'] is False and cand['spec']['questionOrderChanged'] is False,'v235 scoring/selection flags drift')
req(cand['spec']['timingChanged'] is False and cand['spec']['readinessThresholdChanged'] is False and cand['spec']['remediationTargetsChanged'] is False,'v235 protected flow flags drift')

fixture={
  'version':version,'previous':previous,'parent':parent,
  'findingResolved':cand['spec']['findingResolved'],
  'traceFinalGenerated':len(rows),'wrongSlotsPropagated':len(all_wrong),
  'parentRowsMissingMetadata':parent_missing,
  'target':{'exercise':'selection_sort_b','question':'最終的なminPosは？','options':tr['options'],'correct':'3','wrong':'0','feedback':zero[0]['generatedFb']},
  'sourceFeedbackCoverage':cov,
  'contracts':{'final':[20,16,4],'seconds':6000,'pool':43,'highTrace':15,'floor':4,'selectionSignature':cand['selectionSig']}
}
Path(f'_regression/subject-b-trace-final-feedback-propagation-repair-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST {version} — Subject B Trace-Final Feedback Propagation Repair
==========================================================================

Result
------
PASS — NO FINDINGS
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: yes, feedback metadata propagation only

Resolved finding
----------------
subject_b_trace_final_feedback_not_propagated

Repair
------
makeFinalAlgoFromTrace now carries wrongFeedback / wrongFeedbackByText from the selected TRACE prediction into the generated trace-final item.
Metadata is remapped by exact option text after answer shuffling, so each displayed wrong choice keeps the diagnosis/checkpoint/nextCue belonging to that choice.
No source question, prompt, option, correct answer, difficulty label, score, selection rule, timing rule or profile field changed.

Generated-path coverage
-----------------------
Trace-derived final probes: {len(rows)}
Wrong-choice slots checked: {len(all_wrong)}
Structured choice-specific feedback correctly propagated: {sum(1 for w in all_wrong if w['structured'] and w['match'])} / {len(all_wrong)}
Correct choices with wrong-feedback attached: {sum(1 for r in rows if r['correctFeedback'] is not None)}
v234 parent generated rows missing feedback metadata: {parent_missing} / {len(prow)}

selection_sort_b regression
---------------------------
Question: 最終的なminPosは？
Generated choices: {json.dumps(tr['options'],ensure_ascii=False)}
Correct answer: 3
Wrong choice 0 keeps the v233 stale-minPos diagnosis after generation/shuffling: yes

Source feedback coverage
------------------------
Subject B source questions: {cov['questions']}
Structured wrong-choice feedback: {cov['structured']} / {cov['wrong']}
Wrong-feedback attached to correct choices: {cov['correctFeedback']}

Preserved contracts
-------------------
1000 deterministic final-session seeds match {previous} selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 order, v217 recovery, v219 XP, v222 readiness/65% threshold, v224 copy, v227 domain progression, v230 feedback and v233 distractor repair remain unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
Use v236 for a post-repair learner-flow/regression audit. Exercise the selection_sort_b wrong choice 0 through TRACE, algorithm mini-mock and trace-derived final review, including shuffling and rerender boundaries. If clean, close the v232-v236 distractor/feedback propagation sequence and move to the next learner-value frontier.
'''
Path(f'audits/SUBJECT_B_TRACE_FINAL_FEEDBACK_PROPAGATION_REPAIR_{version}.txt').write_text(audit)
print(f'FEQUEST_SUBJECT_B_TRACE_FINAL_FEEDBACK_PROPAGATION_REPAIR_OK version={version} generated={len(rows)} wrong={len(all_wrong)} parent-missing={parent_missing}')
