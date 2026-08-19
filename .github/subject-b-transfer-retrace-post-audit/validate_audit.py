from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-transfer-retrace-post-audit-(v(\d+))',branch)
    req(m is not None,'bad v263 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function domSnapshot(){
 const title=document.getElementById('bLabTitle'),meta=document.getElementById('bLabMeta'),code=document.getElementById('bCode');
 return {title:title?.textContent||'',meta:meta?.textContent||'',codeHtml:code?.innerHTML||''};
}
function snapCurrent(){return currentB?{id:currentB.id,title:currentB.title,variant:currentB.retraceVariantV262||null,code:currentB.code,hash:hashText(stable(currentB))}:null;}
function start(id,progress){
 profile.bProgress={...(profile.bProgress||{}),[id]:progress};
 const bankBefore=hashText(stable(B_EXERCISES)); let error=null;
 try{startBExercise(id);}catch(e){error=String(e?.message||e);}
 return {error,current:snapCurrent(),dom:domSnapshot(),bankBefore,bankAfter:hashText(stable(B_EXERCISES)),progressKeys:Object.keys(profile.bProgress||{}).sort()};
}
const first=start('loop_sum',0);
const repeat=start('loop_sum',100);
let finishError=null; try{finishBExercise();}catch(e){finishError=String(e?.message||e);}
const afterFinish={error:finishError,current:snapCurrent(),progress:{...(profile.bProgress||{})},progressKeys:Object.keys(profile.bProgress||{}).sort(),domainFocus:profile.subjectBAlgorithmDomainFocusV227||null};
const repeatAgain=start('loop_sum',100);
const nonPilot=start('count_even',100);
console.log('__V263__'+Buffer.from(JSON.stringify({v:APP_VERSION,first,repeat,afterFinish,repeatAgain,nonPilot,bankHash:hashText(stable(B_EXERCISES)),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V263__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))

version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v263','v262'),'v263 audit expects v262 parent')
source=Path('audits/SUBJECT_B_TRANSFER_RETRACE_PILOT_v262.txt'); req(source.exists(),'v262 pilot audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v262 validation evidence drift')
expected={'.github/subject-b-transfer-retrace-post-audit/validate_audit.py','.github/workflows/subject-b-transfer-retrace-post-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v263 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v263' and par['v']=='v262','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['bankHash']==par['bankHash'],'audit-only TRACE bank drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req(cand['first']==par['first'] and cand['repeat']==par['repeat'] and cand['afterFinish']==par['afterFinish'] and cand['repeatAgain']==par['repeatAgain'] and cand['nonPilot']==par['nonPilot'],'audit-only learner flow drift')

first,repeat,after,again,non=cand['first'],cand['repeat'],cand['afterFinish'],cand['repeatAgain'],cand['nonPilot']
req(first['error'] is None and first['current']['variant'] is None,'first exposure not authored')
req(repeat['error'] is None and repeat['current']['variant']=='loop_sum-alternate-values-v1','repeat did not enter alternate re-trace')
req(repeat['current']['id']=='loop_sum','variant must preserve canonical exercise id')
req(repeat['bankBefore']==repeat['bankAfter']==cand['bankHash'],'repeat leaked temporary bank substitution')
req('別の値で再トレース' in repeat['dom']['title'],'visible repeat label missing')
req('for i ← 2 to 5' in repeat['dom']['codeHtml'],'visible alternate code missing')
req('科目B' in repeat['dom']['meta'],'existing lab metadata disappeared')
req(after['error'] is None,'finishBExercise failed after variant')
req(after['current']['id']=='loop_sum' and after['current']['variant']=='loop_sum-alternate-values-v1','finish lost canonical currentB variant unexpectedly')
req(str(after['progress'].get('loop_sum')) in ('100','100.0'),'canonical loop_sum progress not retained')
req(not any('variant' in k.lower() or 'alternate' in k.lower() for k in after['progressKeys']),'variant-specific progress key leaked')
req(again['current']['hash']==repeat['current']['hash'],'repeat is not deterministic after completion lifecycle')
req(non['current']['id']=='count_even' and non['current']['variant'] is None,'non-pilot exercise unexpectedly variantized')
req(non['bankBefore']==non['bankAfter']==cand['bankHash'],'non-pilot start mutated bank')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','firstExposure':first,'completedRepeat':repeat,'afterFinish':after,'repeatAgain':again,'nonPilotRepeat':non,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-transfer-retrace-post-audit-v263.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v263 — Subject B Alternate-Value Re-Trace Post-Audit
====================================================================

Result
------
PASS — NO FINDINGS
Previous release: v262
Source main: {parent}
Learner-facing change in v263: none

End-to-end learner flow
-----------------------
The v262 pilot behaves as intended through the existing TRACE screen, not only in a data-level probe. A first loop_sum start still uses the authored exercise. A completed repeat binds currentB to the alternate-values clone while retaining the canonical id loop_sum. The learner-facing lab title contains “別の値で再トレース”, and the rendered code contains “for i ← 2 to 5”. Existing 科目B concept/level metadata remains visible.

Completion lifecycle
--------------------
finishBExercise completes normally while currentB is the alternate clone. Progress remains attached to the canonical loop_sum key; no variant-specific or alternate-specific profile key is created. Starting loop_sum again after completion produces the same deterministic alternate hash. The temporary B_EXERCISES substitution is fully restored after every start call.

Isolation
---------
count_even remains a non-pilot exercise and repeats with its authored values. The shared 20-item TRACE bank is unchanged. This confirms the v262 mechanism is locally scoped and can be expanded one exercise at a time without turning the whole TRACE bank into a randomized generator.

Regression
----------
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
The completed-repeat alternate-value mechanism is safe end to end. The next bounded improvement may extend the same pattern to count_even, where changing the input array and parity positions tests array traversal plus conditional counting. Keep the first exposure authored and use a deterministic static alternate rather than unrestricted random generation.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_TRANSFER_RETRACE_POST_AUDIT_v263.txt').write_text(audit); print(audit)
