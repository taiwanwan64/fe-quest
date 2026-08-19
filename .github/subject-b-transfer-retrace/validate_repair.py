from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-transfer-retrace-pilot-(v(\d+))',branch)
    req(m is not None,'bad v262 repair branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x262000+i)>>>0);const rows=buildBFinal();h=hashText(String(h)+stable(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function currentSnapshot(){return currentB?{id:currentB.id,title:currentB.title,desc:currentB.desc,code:currentB.code,steps:currentB.steps,variant:currentB.retraceVariantV262||null,hash:hashText(stable(currentB))}:null;}
function startProbe(id,completed){
 profile.bProgress={...(profile.bProgress||{}),[id]:completed?100:0};
 const authored=B_EXERCISES.find(x=>x.id===id); const authoredHash=hashText(stable(authored)); const bankBefore=hashText(stable(B_EXERCISES));
 let error=null; try{startBExercise(id);}catch(e){error=String(e?.message||e);}
 const bankAfter=hashText(stable(B_EXERCISES));
 return {id,completed,error,authoredHash,bankBefore,bankAfter,current:currentSnapshot()};
}
function predictionShape(ex){
 const ps=(ex?.steps||[]).filter(s=>s.predict).map(s=>s.predict);
 return {count:ps.length,rows:ps.map(p=>({q:p.q,opts:p.opts,a:p.a,correct:p.opts?.[p.a],unique:new Set(p.opts||[]).size,wrongFeedback:Array.isArray(p.wrongFeedback)?p.wrongFeedback.length:null,wrongFeedbackByText:p.wrongFeedbackByText?Object.keys(p.wrongFeedbackByText).length:null,explain:p.explain,hint:p.hint}))};
}
const authoredBankHash=hashText(stable(B_EXERCISES));
const first=startProbe('loop_sum',false);
const repeat=startProbe('loop_sum',true);
const repeatAgain=startProbe('loop_sum',true);
const nonPilotRepeat=startProbe('count_even',true);
const variantBuilder=globalThis.subjectBTransferRetraceVariantV262;
const variantShape=typeof variantBuilder==='function'?predictionShape(variantBuilder('loop_sum',B_EXERCISES.find(x=>x.id==='loop_sum'))):null;
console.log('__V262__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_TRANSFER_RETRACE_V262_SPEC||null,authoredBankHash,first,repeat,repeatAgain,nonPilotRepeat,variantShape,banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},sig:finalSig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V262__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))

version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v262','v261'),'v262 repair expects v261 parent')
manifest=json.loads(Path('_release/content-change-v262.json').read_text())
req(manifest['parent_main_sha']==parent,'manifest parent mismatch')
req(manifest['source_quality_audit']=='audits/SUBJECT_B_TRANSFER_RETRACE_DIAGNOSTIC_v260.txt','source audit mismatch')
req(manifest['hook_quality_audit']=='audits/SUBJECT_B_RETRACE_HOOK_DETAIL_AUDIT_v261.txt','hook audit mismatch')
expected={
 'app/subject-b-transfer-retrace-overrides-v262.txt','_release/content-change-v262.json','index.html',
 '.github/subject-b-transfer-retrace/validate_repair.py','.github/workflows/subject-b-transfer-retrace.yml'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v262 source drift: '+repr(sorted(changed^expected)))
app=Path('app/subject-b-transfer-retrace-overrides-v262.txt').read_text()
req("pilotIds:Object.freeze(['loop_sum'])" in app,'pilot id drift')
req('finally' in app and 'B_EXERCISES[index]=authored' in app,'bank restoration contract missing')
req('Math.random' not in app,'pilot must be deterministic, not random')
req(not any(x in app for x in ['fetch(','XMLHttpRequest','sendBeacon','WebSocket']),'remote telemetry/network call added')

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v262' and par['v']=='v261','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'authored banks drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req(cand['spec']['originalFirstExposure'] is True and cand['spec']['completedRepeatOnly'] is True and cand['spec']['deterministic'] is True,'runtime pilot spec drift')

first,repeat,repeat2,non=cand['first'],cand['repeat'],cand['repeatAgain'],cand['nonPilotRepeat']
req(first['error'] is None and repeat['error'] is None and repeat2['error'] is None and non['error'] is None,'start probe error')
req(first['bankBefore']==first['bankAfter']==cand['authoredBankHash'],'first exposure mutated shared bank')
req(repeat['bankBefore']==repeat['bankAfter']==cand['authoredBankHash'],'repeat mutated shared bank')
req(repeat2['bankBefore']==repeat2['bankAfter']==cand['authoredBankHash'],'second repeat mutated shared bank')
req(non['bankBefore']==non['bankAfter']==cand['authoredBankHash'],'non-pilot repeat mutated shared bank')
req(first['current']['hash']==first['authoredHash'] and first['current']['variant'] is None,'first exposure must remain authored')
req(first==par['first'],'first exposure differs from v261')
req(repeat['current']['id']=='loop_sum' and repeat['current']['variant']=='loop_sum-alternate-values-v1','completed repeat did not select variant')
req(repeat['current']['hash']!=repeat['authoredHash'],'completed repeat must differ from authored state path')
req(repeat['current']['code']==['sum ← 0','for i ← 2 to 5','    sum ← sum + i','endfor','sum を出力する'],'alternate code drift')
req(repeat['current']['hash']==repeat2['current']['hash'],'repeat variant must be deterministic')
req(non==par['nonPilotRepeat'],'non-pilot repeat behavior changed')

shape=cand['variantShape']; req(shape and shape['count']==2,'variant must have exactly two prediction checkpoints')
req(len(shape['rows'])==2,'variant prediction rows drift')
expected_correct=['i=3, sum=5','sum=14となり、その後for文を終了する']
req([r['correct'] for r in shape['rows']]==expected_correct,'variant correct answers drift')
for r in shape['rows']:
    req(len(r['opts'])==4 and r['unique']==4,'variant prediction must have four unique options')
    req(isinstance(r['a'],int) and 0<=r['a']<4,'variant answer index invalid')
    req(r['wrongFeedback']==4 and r['wrongFeedbackByText']==3,'variant wrong-answer feedback incomplete')
    req(bool(r['explain']) and bool(r['hint']),'variant explanation/hint missing')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/approved-content reference mismatch')

fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','pilotId':'loop_sum','firstExposure':first,'completedRepeat':repeat,'completedRepeatAgain':repeat2,'nonPilotRepeat':non,'variantPredictionShape':shape,'authoredBanksMatchParent':True,'finalSignatureMatch':True,'semanticOK':True,'candidateApprovedContentSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-transfer-retrace-v262.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v262 — Subject B Deterministic Alternate-Value Re-Trace Pilot
========================================================================

Result
------
PASS — NO FINDINGS
Previous release: v261
Source main: {parent}
Learner-facing change in v262: yes — after loop_sum has already been completed once, starting it again uses a clearly labeled alternate-value re-trace instead of replaying the identical 1–4 state path.

Repair
------
The original first exposure is untouched. On a completed repeat of loop_sum, startBExercise temporarily substitutes a deep-cloned variant in the matching B_EXERCISES slot, lets the existing start routine bind currentB and render it, and restores the authored shared-bank object in a finally block before returning. The repeat variant changes the loop from 1..4 to 2..5 while preserving the same concept and two intermediate-state prediction checkpoints.

Learner value
-------------
The second encounter now requires reconstructing sum under changed values rather than recalling the previous concrete states. The title explicitly says “別の値で再トレース” so the changed values are intentional rather than looking like a data inconsistency. This is a bounded pilot: only loop_sum changes on completed repeat, while all other TRACE exercises remain exactly as before.

Validation
----------
First loop_sum exposure: byte-behavior equivalent to v261 authored exercise.
Completed repeat: alternate marker present, code is 2..5, and currentB differs from authored exercise.
Second completed repeat: deterministic hash identical to the first alternate repeat.
Shared B_EXERCISES hash: unchanged before/after first start and both repeat starts.
Non-pilot count_even completed repeat: byte-behavior equivalent to v261.
Variant checkpoints: exactly 2; each has 4 unique options, one valid answer, explanation, hint, and choice-specific wrong-answer feedback.
Expected correct states: i=3, sum=5; then sum=14 and exit.

Regression
----------
Authored 20-item TRACE bank, final algorithm pool, compound bank and security bank: unchanged from v261.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Scoring, readiness, remediation targets, difficulty labels, exam timing, profile schema and remote telemetry: unchanged.
Subject B semantic diagnostics: OK.
Candidate/approved-content-reference six-file byte equality: yes.

Decision
--------
The pilot safely repairs the transfer gap for one foundational control-flow TRACE without disturbing first exposure or the shared exercise bank. Next run a learner-flow/post-repair audit. If clean, expand the same deterministic completed-repeat pattern to one array exercise (count_even) rather than broadly randomizing all TRACE content.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_TRANSFER_RETRACE_PILOT_v262.txt').write_text(audit); print(audit)
