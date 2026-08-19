from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-handoff-post-audit-(v(\d+))',branch)
    req(m is not None,'bad v274 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def scripts(path):
    html=Path(path).read_text(); return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x274000+i)>>>0);const rows=buildBFinal();h=hashText(String(h)+stable(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function fsrc(name){try{const f=eval(name);return typeof f==='function'?String(f):null}catch(e){return null}}
console.log('__V274__'+Buffer.from(JSON.stringify({
 v:APP_VERSION,
 spec:globalThis.SUBJECT_B_FINAL_HANDOFF_V273_SPEC||null,
 banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},
 sig:finalSig(),
 resume:{save:fsrc('saveBFinalResume'),clear:fsrc('clearBFinalResume'),start:fsrc('startBFinal')},
 continuation:{continueFlow:fsrc('continueSubjectBFlow'),launch:fsrc('launchSubjectBRecommendation'),hub:fsrc('subjectBHubRecommendation')},
 contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],
 sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V274__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


def dispatch_probe():
    src=Path('app/subject-b-final-handoff-overrides-v273.txt').read_text()
    pre=r'''
const listeners=[];
let legacyMenu=0,continued=0;
const btn={dataset:{},addEventListener(type,handler,capture){listeners.push({type,handler,capture:!!capture});}};
const document={getElementById(id){return id==='bFinalBackMenu'?btn:null;}};
globalThis.document=document;
function continueSubjectBFlow(){continued++;}
// Model the already-existing legacy listener: it is registered before v273 and bubbles.
btn.addEventListener('click',()=>{legacyMenu++;},false);
'''
    tail=r'''
let prevented=0,stopped=0,stop=false;
const ev={preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;stop=true;}};
function dispatchClick(){
  const capture=listeners.filter(x=>x.type==='click'&&x.capture);
  const bubble=listeners.filter(x=>x.type==='click'&&!x.capture);
  for(const x of capture){x.handler(ev);if(stop)return;}
  for(const x of bubble){x.handler(ev);if(stop)return;}
}
dispatchClick();
console.log('__DISPATCH__'+Buffer.from(JSON.stringify({listeners:listeners.map(x=>({type:x.type,capture:x.capture})),legacyMenu,continued,prevented,stopped,dataset:btn.dataset,spec:globalThis.SUBJECT_B_FINAL_HANDOFF_V273_SPEC||null})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'dispatch.js'; p.write_text(pre+'\n'+src+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'dispatch probe failed: '+z.stderr[-4000:])
        m=re.search(r'__DISPATCH__([A-Za-z0-9+/=]+)',z.stdout); req(m,'dispatch probe marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v274','v273'),'v274 audit expects v273 parent')
source=Path('audits/SUBJECT_B_FINAL_HANDOFF_REPAIR_v273.txt'); req(source.exists(),'v273 handoff repair audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v273 repair audit not clean')
repair_fixture=json.loads(Path('_regression/subject-b-final-handoff-repair-v273.fixture.json').read_text())
req(repair_fixture['result']=='PASS — NO FINDINGS','v273 repair fixture not clean')
expected={'.github/subject-b-final-handoff-post-audit/validate_audit.py','.github/workflows/subject-b-final-handoff-post-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v274 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v274' and par['v']=='v273','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'audit-only Subject B bank drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['resume']==par['resume'],'timed-final resume lifecycle drift')
req(cand['continuation']==par['continuation'],'continuation/recommendation function drift')
req(cand['spec']==par['spec'],'v273 runtime handoff spec drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req(cand['spec']['targetId']=='bFinalBackMenu' and cand['spec']['destination']=='continueSubjectBFlow','assembled handoff target/destination drift')
req(cand['spec']['preventLegacyMenuHandler'] is True,'assembled legacy suppression flag drift')

probe=dispatch_probe()
req(len(probe['listeners'])==2,'expected legacy bubble + v273 capture listener')
req(probe['listeners'][0]=={'type':'click','capture':False},'legacy listener model should be registered first and bubble')
req(probe['listeners'][1]=={'type':'click','capture':True},'v273 listener should be capture-phase')
req(probe['continued']==1,'v273 continuation did not run exactly once')
req(probe['legacyMenu']==0,'legacy menu listener still ran despite capture interception')
req(probe['prevented']==1 and probe['stopped']==1,'capture handler did not prevent and stop exactly once')
req(probe['dataset'].get('feqFinalHandoffV273')=='1','v273 idempotence marker missing')

built=Path('_site/index.html').read_text(); parent_built=Path('_site_parent/index.html').read_text()
for text in ['SUBJECT_B_FINAL_HANDOFF_V273_SPEC',"getElementById('bFinalBackMenu')",'stopImmediatePropagation','continueSubjectBFlow();']:
    req(text in built and text in parent_built,'assembled v273 handoff code missing: '+text)

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')

fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','dispatchProbe':probe,'runtimeSpecStableFromV273':True,'timedFinalResumeFunctionsMatchParent':True,'continuationFunctionsMatchParent':True,'authoredBanksMatchParent':True,'finalSignatureMatch':True,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-final-handoff-post-audit-v274.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v274 — Subject B Final-Result Handoff Post-Repair Audit
==================================================================

Result
------
PASS — NO FINDINGS
Previous release: v273
Source main: {parent}
Learner-facing change in v274: none

Purpose
-------
v273 removed the redundant Subject B menu stop after the full final result. v274 verifies the repair after normal assembly and strengthens the interaction probe: a legacy bubbling click listener is registered first, then the v273 capture listener is installed, and a synthetic click is dispatched using DOM phase order.

Synthetic dispatch probe
------------------------
Listeners: {probe['listeners']}
Continuation calls: {probe['continued']}
Legacy menu calls: {probe['legacyMenu']}
preventDefault calls: {probe['prevented']}
stopImmediatePropagation calls: {probe['stopped']}
Idempotence marker present: {probe['dataset'].get('feqFinalHandoffV273')=='1'}

Regression
----------
The v273 handoff runtime spec is unchanged.
Timed-final save/clear/start resume functions are unchanged from v273.
Existing Subject B continuation/recommendation functions are unchanged.
Subject B authored TRACE, final algorithm, compound and security banks are unchanged.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
The interaction-friction sequence is closed. The final-result handoff now removes one demonstrated redundant menu stop while protective submit/exit confirmations, TRACE prediction pauses and timed-final resume behavior remain intact. Return development priority to learner-facing Subject B content and transfer quality rather than further navigation changes.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_FINAL_HANDOFF_POST_REPAIR_v274.txt').write_text(audit); print(audit)
