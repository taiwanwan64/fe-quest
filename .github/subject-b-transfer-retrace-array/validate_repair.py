from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-transfer-retrace-array-(v(\d+))',branch)
    req(m is not None,'bad v264 repair branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x264000+i)>>>0);const rows=buildBFinal();h=hashText(String(h)+stable(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function snapCurrent(){return currentB?{id:currentB.id,title:currentB.title,desc:currentB.desc,concept:currentB.concept,level:currentB.level,code:currentB.code,steps:currentB.steps,variant262:currentB.retraceVariantV262||null,variant264:currentB.retraceVariantV264||null,hash:hashText(stable(currentB))}:null;}
function startProbe(id,completed){
 profile.bProgress={...(profile.bProgress||{}),[id]:completed?100:0};
 const authored=B_EXERCISES.find(x=>x.id===id); const authoredHash=hashText(stable(authored)); const bankBefore=hashText(stable(B_EXERCISES));
 let error=null; try{startBExercise(id);}catch(e){error=String(e?.message||e);}
 return {id,completed,error,authoredHash,bankBefore,bankAfter:hashText(stable(B_EXERCISES)),current:snapCurrent()};
}
function predictionShape(ex){const ps=(ex?.steps||[]).filter(s=>s.predict).map(s=>s.predict);return {count:ps.length,rows:ps.map(p=>({q:p.q,opts:p.opts,a:p.a,correct:p.opts?.[p.a],unique:new Set(p.opts||[]).size,wrongFeedback:Array.isArray(p.wrongFeedback)?p.wrongFeedback.length:null,wrongFeedbackByText:p.wrongFeedbackByText?Object.keys(p.wrongFeedbackByText).length:null,explain:p.explain,hint:p.hint}))};}
const authoredBankHash=hashText(stable(B_EXERCISES));
const countFirst=startProbe('count_even',false);
const countRepeat=startProbe('count_even',true);
const countRepeatAgain=startProbe('count_even',true);
const loopRepeat=startProbe('loop_sum',true);
const matrixRepeat=startProbe('matrix_sum',true);
const builder=globalThis.subjectBCountEvenRetraceVariantV264;
const variantShape=typeof builder==='function'?predictionShape(builder(B_EXERCISES.find(x=>x.id==='count_even'))):null;
console.log('__V264__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_TRANSFER_RETRACE_ARRAY_V264_SPEC||null,authoredBankHash,countFirst,countRepeat,countRepeatAgain,loopRepeat,matrixRepeat,variantShape,banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},sig:finalSig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V264__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))

version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v264','v263'),'v264 repair expects v263 parent')
manifest=json.loads(Path('_release/content-change-v264.json').read_text())
req(manifest['parent_main_sha']==parent,'manifest parent mismatch')
req(manifest['source_quality_audit']=='audits/SUBJECT_B_TRANSFER_RETRACE_POST_AUDIT_v263.txt','source audit mismatch')
req('PASS — NO FINDINGS' in Path(manifest['source_quality_audit']).read_text(),'v263 audit not clean')
expected={'app/subject-b-transfer-retrace-array-overrides-v264.txt','_release/content-change-v264.json','index.html','.github/subject-b-transfer-retrace-array/validate_repair.py','.github/workflows/subject-b-transfer-retrace-array.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v264 source drift: '+repr(sorted(changed^expected)))
app=Path('app/subject-b-transfer-retrace-array-overrides-v264.txt').read_text()
req("pilotId:'count_even'" in app,'count_even pilot id drift')
req('finally' in app and 'B_EXERCISES[index]=authored' in app,'bank restoration contract missing')
req('Math.random' not in app,'array repeat must be deterministic')
req(not any(x in app for x in ['fetch(','XMLHttpRequest','sendBeacon','WebSocket']),'remote telemetry/network call added')

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v264' and par['v']=='v263','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'authored banks drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req(cand['spec']['pilotId']=='count_even' and cand['spec']['originalFirstExposure'] is True and cand['spec']['completedRepeatOnly'] is True and cand['spec']['deterministic'] is True,'runtime array spec drift')

first,repeat,again,loop,matrix=cand['countFirst'],cand['countRepeat'],cand['countRepeatAgain'],cand['loopRepeat'],cand['matrixRepeat']
for x in [first,repeat,again,loop,matrix]: req(x['error'] is None,'start probe error '+x['id'])
for x in [first,repeat,again,loop,matrix]: req(x['bankBefore']==x['bankAfter']==cand['authoredBankHash'],'shared bank mutation leaked '+x['id'])
req(first['current']['hash']==first['authoredHash'] and first['current']['variant264'] is None,'count_even first exposure must remain authored')
req(first==par['countFirst'],'count_even first exposure differs from v263')
req(repeat['current']['id']=='count_even' and repeat['current']['variant264']=='count_even-alternate-array-v1','count_even repeat did not select alternate array')
req(repeat['current']['hash']!=repeat['authoredHash'],'count_even repeat must differ from authored state path')
req(repeat['current']['code'][0]=='data ← [4, 7, 9, 12, 15]','alternate array drift')
req(repeat['current']['code'][-1]=='count を出力する','alternate output line drift')
req(repeat['current']['hash']==again['current']['hash'],'count_even repeat variant must be deterministic')
req(loop==par['loopRepeat'],'v262 loop_sum completed repeat changed')
req(loop['current']['variant262']=='loop_sum-alternate-values-v1' and loop['current']['variant264'] is None,'v262 loop_sum marker lost')
req(matrix==par['matrixRepeat'],'non-pilot matrix_sum repeat changed')

shape=cand['variantShape']; req(shape and shape['count']==2,'array variant must have exactly two predictions')
expected_correct=['i=1, count=1','i=3, count=2']
req([r['correct'] for r in shape['rows']]==expected_correct,'array variant correct states drift')
for r in shape['rows']:
    req(len(r['opts'])==4 and r['unique']==4,'array prediction must have four unique options')
    req(isinstance(r['a'],int) and 0<=r['a']<4,'array prediction answer invalid')
    req(r['wrongFeedback']==4 and r['wrongFeedbackByText']==3,'array prediction wrong feedback incomplete')
    req(bool(r['explain']) and bool(r['hint']),'array prediction explanation/hint missing')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/approved-content reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','pilotId':'count_even','firstExposure':first,'completedRepeat':repeat,'completedRepeatAgain':again,'preservedLoopSumRepeat':loop,'nonPilotMatrixRepeat':matrix,'variantPredictionShape':shape,'authoredBanksMatchParent':True,'finalSignatureMatch':True,'semanticOK':True,'candidateApprovedContentSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-transfer-retrace-array-v264.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v264 — Subject B Deterministic Array Re-Trace Expansion
====================================================================

Result
------
PASS — NO FINDINGS
Previous release: v263
Source main: {parent}
Learner-facing change in v264: yes — after count_even has already been completed once, starting it again uses a clearly labeled alternate array [4, 7, 9, 12, 15] instead of replaying the same authored array.

Repair
------
The v262 completed-repeat mechanism is extended to one array/condition exercise. The first count_even exposure remains the authored exercise. A completed repeat uses a deep-cloned deterministic variant with the same canonical id and concept, but a different input array and state path. The shared B_EXERCISES slot is restored in a finally block immediately after the existing start routine binds currentB.

Transfer target
---------------
The alternate array changes both the values and the positions of matching elements. The learner must therefore re-evaluate data[i] mod 2 for each index instead of remembering the original count path. The final count is 2. Two prediction checkpoints specifically test (1) not incrementing count for odd 7 and (2) incrementing count for even 12.

Validation
----------
count_even first exposure: byte-behavior equivalent to v263.
count_even completed repeat: alternate marker present and input is [4, 7, 9, 12, 15].
Second completed repeat: deterministic hash identical to the first alternate repeat.
Shared B_EXERCISES: restored after every first/repeat/non-pilot start probe.
v262 loop_sum completed repeat: byte-behavior equivalent to v263 and retains its v262 marker.
Non-pilot matrix_sum completed repeat: byte-behavior equivalent to v263.
Array variant: exactly 2 prediction checkpoints; each has 4 unique options, one valid answer, explanation, hint, and choice-specific wrong-answer feedback.
Expected checkpoint states: i=1, count=1; i=3, count=2.

Regression
----------
Authored 20-item TRACE bank, final algorithm pool, compound bank and security bank: unchanged from v263.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Scoring, readiness, remediation targets, difficulty labels, exam timing, profile schema and remote telemetry: unchanged.
Subject B semantic diagnostics: OK.
Candidate/approved-content-reference six-file byte equality: yes.

Decision
--------
The transfer-learning pattern now covers one foundational loop accumulator and one array-plus-condition trace, while keeping all first exposures authored. Next perform a post-expansion audit focused on completion/progress isolation and the interaction between the nested v262/v264 start wrappers. If clean, stop expanding variants for now and return to a broader learner-facing Subject B UX/content frontier rather than parameterizing every exercise.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_TRANSFER_RETRACE_ARRAY_v264.txt').write_text(audit); print(audit)
