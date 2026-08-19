from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-mobile-tap-target-post-audit-(v(\d+))',branch)
    req(m is not None,'bad v269 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x269000+i)>>>0);const rows=buildBFinal();h=hashText(String(h)+stable(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
console.log('__V269__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_MOBILE_TAP_TARGET_V268_SPEC||null,banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},sig:finalSig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V269__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


def style_probe():
    src=Path('app/subject-b-mobile-tap-target-overrides-v268.txt').read_text()
    pre=r'''
const appended=[];
const document={
 head:{appendChild(x){appended.push(x);}},
 documentElement:{appendChild(x){appended.push(x);}},
 createElement(tag){return {tagName:String(tag),id:'',textContent:''};},
 getElementById(id){return appended.find(x=>x.id===id)||null;}
};
globalThis.document=document;
'''
    tail=r'''
console.log('__STYLE__'+Buffer.from(JSON.stringify({n:appended.length,rows:appended.map(x=>({tagName:x.tagName,id:x.id,textContent:x.textContent})),spec:globalThis.SUBJECT_B_MOBILE_TAP_TARGET_V268_SPEC||null})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'probe.js'; p.write_text(pre+'\n'+src+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'style probe failed: '+z.stderr[-3000:])
        m=re.search(r'__STYLE__([A-Za-z0-9+/=]+)',z.stdout); req(m,'style probe marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v269','v268'),'v269 audit expects v268 parent')
source=Path('audits/SUBJECT_B_MOBILE_TAP_TARGET_REPAIR_v268.txt'); req(source.exists(),'v268 repair audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v268 repair audit not clean')
expected={'.github/subject-b-mobile-tap-target-post-audit/validate_audit.py','.github/workflows/subject-b-mobile-tap-target-post-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v269 audit-only source drift: '+repr(sorted(changed^expected)))

targets=[
 'bCompoundNext','bCompoundPrev','bCompoundSubmit','bFinalNext','bFinalSubmit',
 'bMockNext','bMockPrev','bMockSubmitTop','secMockNext','secMockPrev','secMockSubmitTop'
]
repair=json.loads(Path('_regression/subject-b-mobile-tap-target-repair-v268.fixture.json').read_text())
req(repair['result']=='PASS — NO FINDINGS','v268 repair fixture not clean')
req(repair['repairedTargets']==targets and repair['minimumHeightPx']==44,'v268 repair fixture target contract drift')

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v269' and par['v']=='v268','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'audit-only Subject B bank drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['spec']==par['spec'],'v268 tap-target runtime spec changed during v269 audit')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req(cand['spec']['targets']==targets and cand['spec']['repairedMinHeightPx']==44,'assembled v268 tap-target spec drift')

probe=style_probe(); req(probe['n']==1,'v268 repair must install exactly one style element in synthetic DOM')
row=probe['rows'][0]; req(row['tagName']=='style' and row['id']=='feq-subject-b-mobile-tap-target-v268','installed style identity drift')
style_ids=re.findall(r'#([A-Za-z][A-Za-z0-9_-]*)',row['textContent'])
req(style_ids==targets,'installed runtime selector set drift: '+repr(style_ids))
body_m=re.search(r'\{([^{}]+)\}',row['textContent'],re.S); req(body_m,'installed style declaration missing')
req(re.sub(r'\s+','',body_m.group(1))=='min-height:44px;','installed runtime declaration drift')

cand_html=Path('_site/index.html').read_text(); par_html=Path('_site_parent/index.html').read_text()
for target in targets:
    req('#'+target in cand_html and '#'+target in par_html,'assembled repair selector missing '+target)
req('feq-subject-b-mobile-tap-target-v268' in cand_html,'assembled repair style marker missing')
req('min-height:44px' in cand_html,'assembled 44px rule missing')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','repairedTargets':targets,'runtimeStyleProbe':probe,'runtimeSpecStableFromV268':True,'authoredBanksMatchParent':True,'finalSignatureMatch':True,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-mobile-tap-target-post-audit-v269.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v269 — Subject B Mobile Tap-Target Post-Repair Audit
==================================================================

Result
------
PASS — NO FINDINGS
Previous release: v268
Source main: {parent}
Learner-facing change in v269: none

Purpose
-------
v268 added an exact-ID 44px minimum height to the 11 Subject B navigation/submit controls identified by v267. v269 verifies that the repair survives normal app assembly and that the runtime style installer emits exactly the intended selector/declaration without widening its scope.

Runtime installation probe
--------------------------
Installed style elements: {probe['n']}
Style element id: {row['id']}
Repaired selector count: {len(style_ids)}
Selectors identical to v267 finding set: yes
Declaration: min-height:44px only
Runtime spec stable from v268 to v269: yes

Regression
----------
Subject B authored TRACE, final algorithm, compound and security banks: unchanged from v268.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
The mobile tap-target repair is closed. Do not enlarge or redesign these controls further without device evidence. The next useful frontier is interaction friction: count the taps and confirmation steps required to start, move through, resume and finish each Subject B practice mode, and only remove friction that is demonstrated by the existing flow.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_MOBILE_TAP_TARGET_POST_REPAIR_v269.txt').write_text(audit); print(audit)
