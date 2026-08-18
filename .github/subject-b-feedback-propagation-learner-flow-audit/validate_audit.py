from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-feedback-propagation-learner-flow-audit-(v(\d+))',branch)
    req(m,'bad v236 learner-flow audit branch')
    v=m.group(1)
    return v,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function forcedRandom(first){let n=0;return ()=>{n++;return n===1?first:((n*0.173)%1);};}
function text(v){return String(v??'').trim();}
function opts(q){return Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);}
function ai(q){if(Number.isInteger(q?.a))return q.a;if(Number.isInteger(q?.correctIndex))return q.correctIndex;if(Number.isInteger(q?.answerIndex))return q.answerIndex;if(typeof q?.correctText==='string')return opts(q).map(text).indexOf(text(q.correctText));if(Number.isInteger(q?.correct))return q.correct;return -1;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function fb(q,s){const f=subjectBChoiceFeedbackV230(q,s);return f?clone(f):null;}
function structured(f){return !!(f&&text(f.diagnosis)&&text(f.checkpoint)&&text(f.nextCue));}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function signature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x236000+i)>>>0);const x=buildBFinal();h=hashText(h,x.map(q=>`${q.kind}:${q.sourceId}`).join('|'));}return h>>>0;}
function target(){const ex=B_EXERCISES.find(x=>x.id==='selection_sort_b');const pred=(ex?.steps||[]).map(s=>s?.predict).filter(Boolean).find(p=>text(p.q)==='最終的なminPosは？')||null;return {ex,pred};}
function srcPred(ex,q){return (ex?.steps||[]).map(s=>s?.predict).filter(Boolean).find(p=>text(p.q)===text(q?.q))||null;}
function htmlEvidence(q,selected){const f=fb(q,selected),compact=subjectBChoiceFeedbackHtmlV230(f,false),full=subjectBChoiceFeedbackHtmlV230(f,true);return {f,compactOk:!!(f&&compact.includes(text(f.diagnosis))&&compact.includes('次回の合図')&&!compact.includes('ここだけ確認')),fullOk:!!(f&&full.includes(text(f.diagnosis))&&full.includes('次回の合図')&&full.includes('ここだけ確認'))};}
function mini(seed){const {ex}=target();for(const first of [0.01,0.99]){Math.random=forcedRandom(first);const base=bMockCandidateFromExercise(ex);if(!base||text(base.q)!=='最終的なminPosは？')continue;Math.random=seedRand(seed);return shuffleBMockAnswer(base);}return null;}
function traceFinal(){const {ex}=target();for(const first of [0.01,0.99]){Math.random=forcedRandom(first);const q=makeFinalAlgoFromTrace(ex);if(q&&text(q.q)==='最終的なminPosは？')return q;}return null;}
function mini100(){const base=fb(target().pred,'0'),bad=[];for(let seed=23601;seed<23701;seed++){const q=mini(seed);if(!q||JSON.stringify(fb(q,'0'))!==JSON.stringify(base)||fb(q,text(q.correctText||opts(q)[ai(q)]))!==null)bad.push(seed);}return bad;}
function allTraceFinal(){const rows=[];for(const ex of B_EXERCISES){for(const first of [0.01,0.99]){Math.random=forcedRandom(first);const q=makeFinalAlgoFromTrace(ex);if(!q)continue;const src=srcPred(ex,q),o=opts(q),a=ai(q),wrong=[];for(let i=0;i<o.length;i++)if(i!==a){const s=text(o[i]),sf=src?fb(src,s):null,gf=fb(q,s);wrong.push({structured:structured(gf),match:JSON.stringify(sf)===JSON.stringify(gf)});}rows.push({hasArray:Array.isArray(q.wrongFeedback),hasMap:!!q.wrongFeedbackByText,correctFeedback:fb(q,text(q.correctText||o[a])),wrong});}}return rows;}
function sourceCoverage(){const rows=[];for(const ex of B_EXERCISES)for(const s of ex.steps||[])if(s.predict)rows.push(s.predict);for(const sc of SECURITY_SCENARIOS)for(const s of sc.steps||[])rows.push(s);for(const q of B_EXAM_ALGO_ITEMS)rows.push(q);for(const set of B_COMPOUND_SETS)for(const q of set.qs||[])rows.push(q);let wrong=0,ok=0,correct=0;for(const q of rows){const o=opts(q),a=ai(q);if(fb(q,text(o[a])))correct++;for(let i=0;i<o.length;i++)if(i!==a){wrong++;if(structured(fb(q,text(o[i]))))ok++;}}return {questions:rows.length,wrong,structured:ok,correctFeedback:correct};}
function remediation(){const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);return {algorithm:algo.length,security:sec.length,algoBad:algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).length,secBad:sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).length};}
const {ex,pred}=target(),sourceView=htmlEvidence(pred,'0'),m=mini(23688),f=traceFinal(),r=f?clone(f):null,reviewSrc=f?srcPred(ex,f):null,rows=allTraceFinal(),cov=sourceCoverage();
const before=JSON.stringify(profile);htmlEvidence(pred,'0');const after=JSON.stringify(profile);
console.log('__V236__'+Buffer.from(JSON.stringify({
 v:APP_VERSION,v235:globalThis.SUBJECT_B_TRACE_FINAL_FEEDBACK_V235_SPEC||null,v233:globalThis.SUBJECT_B_DISTRACTOR_QUALITY_V233_SPEC||null,v230:globalThis.SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC||null,
 counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
 order:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recovery:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xp:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,readiness:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copy:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,domain:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,
 sem:validateSubjectBSemantics(),sig:signature(1000),remediation:remediation(),cov,profileUnchanged:before===after,miniBad:mini100(),rows,
 source:{options:opts(pred).map(text),a:ai(pred),correct:text(opts(pred)[ai(pred)]),view:sourceView},
 mini:m?{options:opts(m).map(text),correct:text(m.correctText||opts(m)[ai(m)]),view:htmlEvidence(m,'0')}:null,
 final:f?{options:opts(f).map(text),correct:text(f.correctText||opts(f)[ai(f)]),sourceId:f.sourceId,studyMode:f.studyMode,hasArray:Array.isArray(f.wrongFeedback),hasMap:!!f.wrongFeedbackByText,view:htmlEvidence(f,'0')}:null,
 rerender:r?{view:htmlEvidence(r,'0')}:null,
 review:{sourceResolved:!!reviewSrc,view:reviewSrc?htmlEvidence(reviewSrc,'0'):null,selectedTextContract:html.includes("selected:ans===null?null:item.options[ans]"),wrapper:String(renderBFinalResult).includes('injectFinalReview(attempt)')}
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V236__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v236','v235'),'v236 expects v235 parent')
source=Path('audits/SUBJECT_B_TRACE_FINAL_FEEDBACK_PROPAGATION_REPAIR_v235.txt')
req(source.exists() and 'PASS — NO FINDINGS' in source.read_text(),'v235 repair evidence missing/drifted')
expected={'.github/subject-b-feedback-propagation-learner-flow-audit/validate_audit.py','.github/workflows/subject-b-distractor-quality-learner-flow-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v236 audit-only source drift: '+repr(sorted(changed^expected)))
for path in ['app/base-stable.html','app/subject-b-security-overrides-v200.txt','app/subject-b-algorithm-overrides-v202.txt','app/subject-b-session-overrides-v205.txt','app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt','app/subject-b-algorithm-domain-progression-overrides-v227.txt','app/subject-b-wrong-answer-feedback-overrides-v230.txt','app/subject-b-distractor-quality-overrides-v233.txt','app/subject-b-trace-final-feedback-propagation-overrides-v235.txt']:
    req(Path(path).read_bytes()==subprocess.check_output(['git','show',parent+':'+path]),'learner source drift: '+path)

c=runtime('_site/index.html');p=runtime('_site_parent/index.html')
req(c['v']=='v236' and p['v']=='v235','runtime version drift')
req(c['v235']==p['v235'] and c['v235']['findingResolved']=='subject_b_trace_final_feedback_not_propagated','v235 spec drift')
req(c['v233']==p['v233'] and c['v230']==p['v230'],'v230/v233 spec drift')
req(c['counts']==p['counts']==[20,16,4] and c['seconds']==p['seconds']==6000 and c['pool']==p['pool']==43,'final contract drift')
req(c['high']==p['high'] and len(c['high'])==15 and c['floor']==p['floor']==4,'high-trace drift')
for k in ['order','recovery','xp','readiness','copy','domain']:req(c[k]==p[k],k+' drift')
req(c['sig']==p['sig'],'1000-seed selection/order drift')
req(c['sem'].get('ok') is True,'Subject B semantic validation failed')
req(c['remediation']==p['remediation']=={'algorithm':43,'security':15,'algoBad':0,'secBad':0},'remediation drift')

s=c['source'];req(s['options']==['1','2','3','0'] and s['a']==2 and s['correct']=='3','selection_sort_b source drift')
base=s['view']['f'];req(structured:=bool(base and base.get('diagnosis') and base.get('checkpoint') and base.get('nextCue')),'source feedback incomplete')
req('minPos' in base['diagnosis'] and '0' in base['diagnosis'],'stale-minPos diagnosis drift')
req(s['view']['compactOk'] and s['view']['fullOk'],'TRACE feedback presentation drift')
req(c['mini'] and set(c['mini']['options'])=={'0','1','2','3'} and c['mini']['correct']=='3' and c['mini']['view']['f']==base and c['mini']['view']['fullOk'],'mini-mock flow drift')
req(c['miniBad']==[],'100-shuffle mini feedback mapping drift')
req(c['final'] and set(c['final']['options'])=={'0','1','2','3'} and c['final']['correct']=='3','trace-final target drift')
req(c['final']['sourceId']=='selection_sort_b' and c['final']['studyMode']=='trace' and c['final']['hasArray'] and c['final']['hasMap'],'trace-final identity/metadata drift')
req(c['final']['view']['f']==base and c['final']['view']['fullOk'],'trace-final feedback drift')
req(c['rerender']['view']['f']==base and c['rerender']['view']['fullOk'],'serialized rerender feedback drift')
req(c['review']['sourceResolved'] and c['review']['selectedTextContract'] and c['review']['wrapper'],'final result review contract drift')
req(c['review']['view']['f']==base and c['review']['view']['fullOk'],'final result review feedback drift')
rows=c['rows'];wrong=[w for r in rows for w in r['wrong']]
req(len(rows)==40 and len(wrong)==120,'trace-final coverage count drift')
req(all(r['hasArray'] and r['hasMap'] and r['correctFeedback'] is None for r in rows),'trace-final metadata/correct-slot drift')
req(all(w['structured'] and w['match'] for w in wrong),'trace-final feedback propagation drift')
req(c['cov']=={'questions':173,'wrong':519,'structured':519,'correctFeedback':0},'source feedback coverage drift')
req(c['profileUnchanged'],'feedback render mutated profile')

fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','sequenceClosed':'v232-v236 distractor/feedback propagation','target':{'question':'最終的なminPosは？','sourceOptions':s['options'],'miniOptions':c['mini']['options'],'traceFinalOptions':c['final']['options'],'correct':'3','wrong':'0','feedback':base},'learnerFlow':{'miniShuffleSamples':100,'traceFinalProbes':len(rows),'traceFinalWrongSlots':len(wrong),'serializedRerenderPreserved':True,'finalReviewPreserved':True},'sourceFeedbackCoverage':c['cov'],'contracts':{'final':[20,16,4],'seconds':6000,'pool':43,'highTrace':15,'floor':4,'selectionSignature':c['sig']}}
Path(f'_regression/subject-b-feedback-propagation-learner-flow-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_FEEDBACK_PROPAGATION_LEARNER_FLOW_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Feedback Propagation Post-Repair Learner-Flow Audit
=================================================================================

Result
------
PASS — NO FINDINGS
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Sequence closure
----------------
The v232-v236 distractor / choice-specific feedback propagation sequence is clean and closed.
v233 removed the learner-visible answer-form shortcut in selection_sort_b / 「最終的なminPosは？」.
v235 repaired TRACE-derived final metadata propagation found by v234.
{version} confirms the repaired choice and diagnosis survive TRACE, algorithm mini-mock, TRACE-derived final generation, serialized rerender, and final result review.

Target learner flow
-------------------
Source / TRACE options: {json.dumps(s['options'],ensure_ascii=False)}
Correct answer: 3
Wrong choice 0 keeps the stale-minPos diagnosis: yes
Immediate TRACE presentation keeps the checkpoint hidden: yes
Full post-answer presentation includes diagnosis + checkpoint + next-attempt cue: yes
Algorithm mini-mock preserves the same feedback across 100 / 100 shuffled samples: yes
TRACE-derived final preserves wrongFeedback / wrongFeedbackByText and the same selected-0 diagnosis: yes
JSON serialize/clone rerender preserves it: yes
Final result review resolves the TRACE source by sourceId + question text and selected answer text: yes

Full regression coverage
------------------------
TRACE-derived final probes: {len(rows)}
Wrong-choice slots checked: {len(wrong)} / {len(wrong)} structured and source-matched
Source Subject B questions: {c['cov']['questions']}
Structured source wrong-choice feedback: {c['cov']['structured']} / {c['cov']['wrong']}
Wrong-feedback attached to correct choices: {c['cov']['correctFeedback']}
Feedback rendering mutates profile: no

Preserved contracts
-------------------
1000 deterministic final-session seeds match {previous} selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 order, v217 recovery, v219 XP, v222 readiness/65% threshold, v224 copy, v227 domain progression, v230 feedback, v233 distractor repair and v235 propagation repair are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
Close the v232-v236 distractor / wrong-answer-feedback propagation sequence. Keep the earlier v232 difficulty-label separation note advisory only; do not change difficulty labels or the 65% readiness threshold from a structural code-length proxy alone. Move next to a new learner-value frontier.
''')
print('FEQUEST_SUBJECT_B_FEEDBACK_PROPAGATION_LEARNER_FLOW_AUDIT_OK',version,'traceFinal',len(rows),'wrong',len(wrong),'sourceFeedback',c['cov']['structured'])
