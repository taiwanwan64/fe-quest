from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-mobile-tap-target-repair-(v(\d+))',branch)
    req(m is not None,'bad v268 repair branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x268000+i)>>>0);const rows=buildBFinal();h=hashText(String(h)+stable(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function optStats(rows){return rows.map(x=>({id:x.id||x.sourceId||null,n:Array.isArray(x.options)?x.options.length:null}));}
console.log('__V268__'+Buffer.from(JSON.stringify({
 v:APP_VERSION,
 spec:globalThis.SUBJECT_B_MOBILE_TAP_TARGET_V268_SPEC||null,
 banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},
 finalOptions:optStats(B_EXAM_ALGO_ITEMS),
 exercisePredictionOptions:B_EXERCISES.map(x=>({id:x.id,counts:(x.steps||[]).filter(s=>s.predict).map(s=>(s.predict.opts||[]).length)})),
 sig:finalSig(),
 contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],
 sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V268__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v268','v267'),'v268 repair expects v267 parent')
manifest=json.loads(Path('_release/content-change-v268.json').read_text())
req(manifest['parent_main_sha']==parent,'manifest parent mismatch')
req(manifest['source_quality_audit']=='audits/SUBJECT_B_MOBILE_ANSWER_TAP_READINESS_v267.txt','source audit mismatch')
source_text=Path(manifest['source_quality_audit']).read_text()
req('PASS — FINDINGS RECORDED' in source_text,'v267 tap audit did not record findings')

expected={
 'app/subject-b-mobile-tap-target-overrides-v268.txt',
 '_release/content-change-v268.json',
 'index.html',
 '.github/subject-b-mobile-tap-target-repair/validate_repair.py',
 '.github/workflows/subject-b-mobile-tap-target-repair.yml'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v268 source drift: '+repr(sorted(changed^expected)))

targets=[
 'bCompoundNext','bCompoundPrev','bCompoundSubmit','bFinalNext','bFinalSubmit',
 'bMockNext','bMockPrev','bMockSubmitTop','secMockNext','secMockPrev','secMockSubmitTop'
]
req(manifest['tap_target_repair']['targets']==targets and manifest['tap_target_repair']['target_count']==11,'manifest target set drift')
req(manifest['tap_target_repair']['minimum_height_px']==44,'manifest minimum-height drift')

source_fixture=json.loads(Path('_regression/subject-b-mobile-answer-tap-v267.fixture.json').read_text())
req(source_fixture['result']=='PASS — FINDINGS RECORDED','v267 regression result drift')
weak=source_fixture['summary']['weakTargets']
weak_ids=[str(x['target']).lstrip('#') for x in weak]
req(weak_ids==targets,'v267 weak target identity drift: '+repr(weak_ids))
req(all(float(x['estimatedHeightPx'])<40 for x in weak),'v267 source target no longer below warning floor')
req(source_fixture['summary']['smallTextTargets']==[],'v267 unexpectedly had small-text findings')
req(source_fixture['summary']['unstyledHooks']==[],'v267 unexpectedly had unstyled answer hooks')

app=Path('app/subject-b-mobile-tap-target-overrides-v268.txt').read_text()
req("policy:'narrow-eleven-control-min-height-repair'" in app,'repair policy marker missing')
req('min-height:44px' in app,'44px min-height repair missing')
req(not any(x in app for x in ['fetch(','XMLHttpRequest','sendBeacon','WebSocket']),'remote telemetry/network call added')
style_m=re.search(r'style\.textContent=`(.*?)`;',app,re.S); req(style_m,'runtime style block missing')
style_text=style_m.group(1)
style_ids=re.findall(r'#([A-Za-z][A-Za-z0-9_-]*)',style_text)
req(style_ids==targets,'runtime selector set is not the exact audited target set: '+repr(style_ids))
body_m=re.search(r'\{([^{}]+)\}',style_text,re.S); req(body_m,'runtime style declaration missing')
body=re.sub(r'\s+','',body_m.group(1))
req(body=='min-height:44px;','repair must change only min-height: '+body)
req('document.createElement' in app and "typeof document.createElement!=='function'" in app,'validation-runtime-safe style installation guard missing')

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v268' and par['v']=='v267','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'Subject B authored bank drift')
req(cand['finalOptions']==par['finalOptions'],'final option-shape drift')
req(cand['exercisePredictionOptions']==par['exercisePredictionOptions'],'TRACE prediction option-shape drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req(par['spec'] is None,'v267 unexpectedly contains v268 spec')
spec=cand['spec']; req(isinstance(spec,dict),'v268 runtime spec missing')
req(spec['targets']==targets,'runtime spec target set drift')
req(spec['warningFloorPx']==40 and spec['repairedMinHeightPx']==44,'runtime repair thresholds drift')
for key in ['answerChoiceSizingChanged','questionSelectionChanged','questionOrderChanged','scoringChanged','examCountdownChanged','readinessChanged','profileSchemaMigrationRequired','remoteTelemetry']:
    req(spec[key] is False,'preservation flag changed: '+key)

built=Path('_site/index.html').read_text()
req('feq-subject-b-mobile-tap-target-v268' in built,'built app missing v268 style installation')
for target in targets: req('#'+target in built,'built app missing repaired target '+target)
req('min-height:44px' in built,'built app missing 44px rule')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/approved-content reference mismatch')

fixture={
 'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS',
 'sourceWeakTargets':weak,'repairedTargets':targets,'minimumHeightPx':44,
 'exactSelectorSet':True,'declarationOnlyMinHeight':True,'answerChoiceSizingUnchanged':True,
 'authoredBanksMatchParent':True,'finalSignatureMatch':True,'semanticOK':True,
 'candidateApprovedContentSixFileByteEquality':True
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-mobile-tap-target-repair-v268.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v268 — Subject B Mobile Tap-Target Repair
=======================================================

Result
------
PASS — NO FINDINGS
Previous release: v267
Source main: {parent}
Learner-facing change in v268: yes — the 11 Subject B navigation/submit controls identified by v267 now have an explicit 44px minimum height.

Repair
------
v267 found that answer choices themselves were already adequate, but 11 navigation/submit controls fell below the audit's 40px warning floor. v268 changes only those exact element IDs. A single runtime style rule adds min-height:44px; no broad shared class such as .next or .bmock-next is globally modified.

Repaired controls
-----------------
{chr(10).join('- #'+x for x in targets)}

Validation
----------
Source v267 weak-target set: exactly 11 and identical to the v268 selector set.
All 11 source estimates were below 40px.
Repair selector set: exact audited IDs only.
Repair declaration: min-height:44px only.
Answer-choice sizing: unchanged.
No remote telemetry/network API added.

Regression
----------
Authored TRACE, final algorithm, compound and security banks: unchanged from v267.
Final algorithm option shapes and TRACE prediction option shapes: unchanged.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Scoring, exam countdown, readiness, profile schema and answer-choice sizing: unchanged.
Subject B semantic diagnostics: OK.
Candidate/approved-content-reference six-file byte equality: yes.

Decision
--------
The concrete mobile tap-target finding from v267 is repaired without redesigning the Subject B screens. Next run a post-repair audit that verifies the 11 controls remain covered after assembly and then move to interaction sequence/friction: unnecessary confirmations, backtracking and taps required to resume or finish practice.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_MOBILE_TAP_TARGET_REPAIR_v268.txt').write_text(audit)
print(audit)
