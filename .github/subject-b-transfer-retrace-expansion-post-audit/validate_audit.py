from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-transfer-retrace-expansion-post-audit-(v(\d+))',branch)
    req(m is not None,'bad v265 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function snap(){return currentB?{id:currentB.id,title:currentB.title,variant262:currentB.retraceVariantV262||null,variant264:currentB.retraceVariantV264||null,hash:hashText(stable(currentB)),code:currentB.code}:null;}
function start(id,pct){profile.bProgress={...(profile.bProgress||{}),[id]:pct};const before=hashText(stable(B_EXERCISES));let error=null;try{startBExercise(id);}catch(e){error=String(e?.message||e);}return {id,pct,error,before,after:hashText(stable(B_EXERCISES)),current:snap()};}
function finish(label){let error=null;try{finishBExercise();}catch(e){error=String(e?.message||e);}return {label,error,current:snap(),bProgress:{...(profile.bProgress||{})},keys:Object.keys(profile.bProgress||{}).sort(),domainFocus:profile.subjectBAlgorithmDomainFocusV227||null,bank:hashText(stable(B_EXERCISES))};}
const bank0=hashText(stable(B_EXERCISES));
const loop1=start('loop_sum',100); const loopFinish=finish('loop');
const count1=start('count_even',100); const countFinish=finish('count');
const loop2=start('loop_sum',100); const count2=start('count_even',100);
const matrix=start('matrix_sum',100);
const firstLoop=start('loop_sum',0); const firstCount=start('count_even',0);
console.log('__V265__'+Buffer.from(JSON.stringify({v:APP_VERSION,bank0,loop1,loopFinish,count1,countFinish,loop2,count2,matrix,firstLoop,firstCount,bankEnd:hashText(stable(B_EXERCISES)),spec262:globalThis.SUBJECT_B_TRANSFER_RETRACE_V262_SPEC||null,spec264:globalThis.SUBJECT_B_TRANSFER_RETRACE_ARRAY_V264_SPEC||null,contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V265__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))

version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v265','v264'),'v265 audit expects v264 runtime parent')
source=Path('audits/SUBJECT_B_TRANSFER_RETRACE_ARRAY_v264.txt'); req(source.exists(),'v264 expansion audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v264 validation evidence drift')
expected={'.github/subject-b-transfer-retrace-expansion-post-audit/validate_audit.py','.github/workflows/subject-b-transfer-retrace-expansion-post-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v265 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v265' and par['v']=='v264','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['bank0']==cand['bankEnd']==par['bank0']==par['bankEnd'],'shared TRACE bank drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
for k in ['loop1','loopFinish','count1','countFinish','loop2','count2','matrix','firstLoop','firstCount']:
    req(cand[k]==par[k],'audit-only learner-flow drift '+k)

loop1,loopf,count1,countf,loop2,count2,matrix,firstLoop,firstCount=[cand[k] for k in ['loop1','loopFinish','count1','countFinish','loop2','count2','matrix','firstLoop','firstCount']]
for x in [loop1,count1,loop2,count2,matrix,firstLoop,firstCount]: req(x['error'] is None,'start error '+x['id'])
for x in [loop1,count1,loop2,count2,matrix,firstLoop,firstCount]: req(x['before']==x['after']==cand['bank0'],'temporary bank substitution leaked '+x['id'])
req(loop1['current']['variant262']=='loop_sum-alternate-values-v1' and loop1['current']['variant264'] is None,'loop_sum nested wrapper route wrong')
req(count1['current']['variant264']=='count_even-alternate-array-v1' and count1['current']['variant262'] is None,'count_even nested wrapper route wrong')
req(loop2['current']['hash']==loop1['current']['hash'],'loop_sum changed after count_even lifecycle')
req(count2['current']['hash']==count1['current']['hash'],'count_even changed after loop_sum lifecycle')
req(matrix['current']['variant262'] is None and matrix['current']['variant264'] is None,'non-pilot matrix_sum was variantized')
req(firstLoop['current']['variant262'] is None and firstLoop['current']['variant264'] is None,'loop_sum first exposure no longer authored')
req(firstCount['current']['variant262'] is None and firstCount['current']['variant264'] is None,'count_even first exposure no longer authored')
req(loopf['error'] is None and countf['error'] is None,'finishBExercise failed under nested wrapper variants')
req(str(loopf['bProgress'].get('loop_sum')) in ('100','100.0'),'loop_sum canonical progress missing')
req(str(countf['bProgress'].get('count_even')) in ('100','100.0'),'count_even canonical progress missing')
for f in [loopf,countf]: req(not any(re.search(r'variant|alternate|retrace',k,re.I) for k in f['keys']),'variant-specific progress key leaked')
req(loopf['bank']==countf['bank']==cand['bank0'],'finish lifecycle changed shared bank')
req(cand['spec262']['pilotIds']==['loop_sum'] and cand['spec264']['pilotId']=='count_even','nested pilot scope drift')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','loopRepeat':loop1,'loopFinish':loopf,'countRepeat':count1,'countFinish':countf,'loopRepeatAfterCount':loop2,'countRepeatAfterLoop':count2,'nonPilotMatrix':matrix,'firstLoop':firstLoop,'firstCount':firstCount,'sharedBankStable':True,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-transfer-retrace-expansion-post-audit-v265.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v265 — Subject B Re-Trace Expansion Post-Audit
==============================================================

Result
------
PASS — NO FINDINGS
Previous release: v264
Source main: {parent}
Learner-facing change in v265: none

Nested wrapper interaction
--------------------------
The two completed-repeat variants remain isolated even though v264 wraps the v262 startBExercise wrapper. A completed loop_sum still reaches only the v262 alternate-values variant. A completed count_even reaches only the v264 alternate-array variant. Switching loop_sum → count_even → loop_sum and count_even → loop_sum → count_even reproduces the same deterministic hashes, so one variant does not contaminate the other.

Completion / progress isolation
-------------------------------
finishBExercise succeeds for both alternate variants. Progress remains on the canonical loop_sum and count_even keys. No variant-, alternate-, or retrace-specific progress key is created. The shared 20-item B_EXERCISES bank hash is identical before and after every start and completion probe.

First exposure / non-pilot isolation
------------------------------------
Setting loop_sum or count_even back to an incomplete progress state restores the authored first exposure with no variant marker. matrix_sum remains fully authored on repeat. This confirms the expansion is bounded to two completed-repeat exercises rather than changing TRACE globally.

Regression
----------
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Close the current alternate-value re-trace expansion sequence at two exercises. It now covers a simple accumulator loop and an array-plus-condition traversal with safe, deterministic completed-repeat transfer while preserving authored first exposure. Do not parameterize all 20 TRACE exercises. The next Subject B work should move to a broader learner-facing UX/content-quality frontier where additional changes can produce more value than another variant generator.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_TRANSFER_RETRACE_EXPANSION_POST_AUDIT_v265.txt').write_text(audit); print(audit)
