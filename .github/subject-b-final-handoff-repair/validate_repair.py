from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-handoff-repair-(v(\d+))',branch)
    req(m is not None,'bad v273 repair branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x273000+i)>>>0);const rows=buildBFinal();h=hashText(String(h)+stable(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function fsrc(name){try{const f=eval(name);return typeof f==='function'?String(f):null}catch(e){return null}}
console.log('__V273__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_FINAL_HANDOFF_V273_SPEC||null,banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},sig:finalSig(),resume:{save:fsrc('saveBFinalResume'),clear:fsrc('clearBFinalResume'),start:fsrc('startBFinal')},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V273__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


def handoff_probe():
    src=Path('app/subject-b-final-handoff-overrides-v273.txt').read_text()
    pre=r'''
const registrations=[];
const btn={dataset:{},addEventListener(type,handler,capture){registrations.push({type,handler,capture});}};
const document={getElementById(id){return id==='bFinalBackMenu'?btn:null;}};
globalThis.document=document;
let continued=0;function continueSubjectBFlow(){continued++;}
'''
    tail=r'''
let prevented=0,stopped=0;
const r=registrations[0];
if(r)r.handler({preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}});
console.log('__HANDOFF__'+Buffer.from(JSON.stringify({registrations:registrations.map(x=>({type:x.type,capture:x.capture})),dataset:btn.dataset,continued,prevented,stopped,spec:globalThis.SUBJECT_B_FINAL_HANDOFF_V273_SPEC||null})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'probe.js'; p.write_text(pre+'\n'+src+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'handoff probe failed: '+z.stderr[-4000:])
        m=re.search(r'__HANDOFF__([A-Za-z0-9+/=]+)',z.stdout); req(m,'handoff probe marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v273','v272'),'v273 repair expects v272 parent')
manifest=json.loads(Path('_release/content-change-v273.json').read_text())
req(manifest['parent_main_sha']==parent,'manifest parent mismatch')
req(manifest['source_quality_audit']=='audits/SUBJECT_B_RESUME_HANDOFF_v272.txt','source audit mismatch')
source_fixture=json.loads(Path('_regression/subject-b-resume-handoff-v272.fixture.json').read_text())
req(source_fixture['result']=='PASS — FINDINGS RECORDED','v272 source fixture not findings state')
req(source_fixture['findings']==[{'id':'subject_b_completion_handoff_returns_to_menu','severity':'Low','control':'bFinalBackMenu','menuSignals':['showBMockMenu'],'summary':'A completion-oriented control appears to return to a Subject B menu without direct continuation/recommendation evidence.'}],'v272 finding identity drift')

expected={
 'app/subject-b-final-handoff-overrides-v273.txt',
 '_release/content-change-v273.json',
 'index.html',
 '.github/subject-b-final-handoff-repair/validate_repair.py',
 '.github/workflows/subject-b-final-handoff-repair.yml'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v273 source drift: '+repr(sorted(changed^expected)))

app=Path('app/subject-b-final-handoff-overrides-v273.txt').read_text()
req("targetId:'bFinalBackMenu'" in app and "destination:'continueSubjectBFlow'" in app,'handoff target/destination marker missing')
req("getElementById('bFinalBackMenu')" in app,'exact button lookup missing')
req("addEventListener('click'" in app and re.search(r'\},\s*true\s*\);',app),'capture listener missing')
req('stopImmediatePropagation' in app and 'preventDefault' in app and 'continueSubjectBFlow();' in app,'legacy-handler interception or continuation call missing')
req('showBMockMenu(' not in app,'repair must not route back through old menu')
req(not any(x in app for x in ['fetch(','XMLHttpRequest','sendBeacon','WebSocket']),'remote telemetry/network call added')

probe=handoff_probe()
req(probe['registrations']==[{'type':'click','capture':True}],'handoff listener is not one capture click listener')
req(probe['dataset'].get('feqFinalHandoffV273')=='1','idempotence dataset marker missing')
req((probe['continued'],probe['prevented'],probe['stopped'])==(1,1,1),'capture handler behavior drift: '+repr(probe))
spec=probe['spec']; req(spec['targetId']=='bFinalBackMenu' and spec['destination']=='continueSubjectBFlow','probe spec drift')

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v273' and par['v']=='v272','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'Subject B authored bank drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['resume']==par['resume'],'timed final resume lifecycle function drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req(par['spec'] is None,'v272 unexpectedly contains v273 spec')
req(cand['spec']['preventLegacyMenuHandler'] is True,'runtime spec interception flag drift')
for key in ['timedFinalResumeChanged','questionSelectionChanged','questionOrderChanged','scoringChanged','examCountdownChanged','readinessChanged','profileSchemaMigrationRequired','remoteTelemetry']:
    req(cand['spec'][key] is False,'preservation flag changed: '+key)

built=Path('_site/index.html').read_text(); req('SUBJECT_B_FINAL_HANDOFF_V273_SPEC' in built and "getElementById('bFinalBackMenu')" in built,'built app missing v273 handoff repair')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/approved-content reference mismatch')

fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','sourceFinding':source_fixture['findings'][0],'probe':probe,'timedFinalResumeFunctionsMatchParent':True,'authoredBanksMatchParent':True,'finalSignatureMatch':True,'semanticOK':True,'candidateApprovedContentSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-final-handoff-repair-v273.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v273 — Subject B Final-Result Direct Handoff Repair
================================================================

Result
------
PASS — NO FINDINGS
Previous release: v272
Source main: {parent}
Learner-facing change in v273: yes — “次の科目Bへ” on the final result now enters the existing Subject B continuation/recommendation route directly instead of first returning through the Subject B menu.

Repair
------
Source finding: subject_b_completion_handoff_returns_to_menu
Target: #bFinalBackMenu only
Destination: continueSubjectBFlow()
Implementation: one capture-phase click listener; preventDefault() and stopImmediatePropagation() suppress the legacy showBMockMenu() listener before it runs.
Idempotence marker: data-feq-final-handoff-v273

Synthetic interaction probe
---------------------------
Registered listeners: {probe['registrations']}
Continuation calls after one synthetic click: {probe['continued']}
preventDefault calls: {probe['prevented']}
stopImmediatePropagation calls: {probe['stopped']}

Regression
----------
Timed-final save/clear/start resume functions: unchanged from v272.
Subject B authored TRACE, final algorithm, compound and security banks: unchanged.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Scoring, countdown, readiness and profile schema: unchanged.
Subject B semantic diagnostics: OK.
Candidate/approved-content-reference six-file byte equality: yes.

Decision
--------
The demonstrated redundant menu stop is removed narrowly. Next run a post-repair handoff audit. If clean, close this interaction-friction sequence and return development priority to learner-facing Subject B content/transfer quality rather than further navigation changes.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_FINAL_HANDOFF_REPAIR_v273.txt').write_text(audit); print(audit)
