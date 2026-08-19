from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-review-reason-route-repair-(v(\d+))',branch)
    req(m,'bad Subject B review reason route repair branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function finalSig(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x243000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function routes(){
 const reasons=['','トレースミス','コード理解','読み違い','知識不足','時間不足'];
 const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam).map(d=>({sourceId:d.sourceId,base:bFinalRemediationTarget(d.studyMode,d.sourceId,d.domain),routes:Object.fromEntries(reasons.map(r=>[r||'(none)',globalThis.subjectBFinalReviewTargetV243?subjectBFinalReviewTargetV243(d,r):bFinalRemediationTarget(d.studyMode,d.sourceId,d.domain)])),meta:bFinalReviewReasonMeta('コード理解',d)}));
 const security=SECURITY_SCENARIOS.map(makeFinalSecurity).map(d=>({sourceId:d.sourceId,base:bFinalRemediationTarget(d.studyMode,d.sourceId,d.concept||'情報セキュリティ'),code:globalThis.subjectBFinalReviewTargetV243?subjectBFinalReviewTargetV243(d,'コード理解'):bFinalRemediationTarget(d.studyMode,d.sourceId,d.concept||'情報セキュリティ')}));
 return {algo,security};
}
const r=routes();
console.log('__V243__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_REVIEW_REASON_ROUTE_V243_SPEC||null,routes:r,render:String(renderBFinalResult),bankHashes:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},sig:finalSig(1000),contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V243__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v243' and previous=='v242','v243 repair expects v242 parent')
source=Path('audits/SUBJECT_B_REMEDIATION_TARGET_GRANULARITY_AUDIT_v242.txt');req(source.exists(),'v242 audit missing')
st=source.read_text();req('PASS — MEDIUM FINDING RECORDED' in st and 'subject_b_review_reason_action_route_mismatch' in st,'v242 finding evidence drift')
manifest=json.loads(Path('_release/content-change-v243.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'manifest parent/source drift')
req(manifest['source_priority_tier']=='medium' and manifest['quality_audit_marker']=='subject_b_review_reason_action_route_mismatch','manifest finding drift')
req(manifest['content_files']==['app/subject-b-review-reason-route-overrides-v243.txt'] and manifest['assembly_files']==['index.html'],'manifest scope drift')
expected={'app/subject-b-review-reason-route-overrides-v243.txt','_release/content-change-v243.json','index.html','.github/subject-b-review-reason-route-repair/validate_repair.py','.github/workflows/subject-b-review-reason-route-repair.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v243 source drift: '+repr(sorted(changed^expected)))
override=Path('app/subject-b-review-reason-route-overrides-v243.txt').read_text();req("reason==='コード理解'" in override and "return {mode:'compound',id:null}" in override and 'startCompoundChallenge()' in override,'reason-aware compound repair missing')
req('bFinalRemediationTarget=function' not in override and 'saveProfile' not in override,'base remediation/persistence must remain untouched')

cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['bankHashes']==par['bankHashes'],'question/practice bank drift')
req(cand['sig']==par['sig'],'final selection/order/options drift')
req(cand['contracts']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
spec=cand.get('spec') or {};req(spec.get('findingResolved')=='subject_b_review_reason_action_route_mismatch' and spec.get('affectedReason')=='コード理解','v243 spec drift')
algo=cand['routes']['algo'];req(len(algo)==43,'algorithm route inventory drift')
req(all(x['meta'][0]=='複合問題で確認' for x in algo),'code-understanding learner copy drift')
req(all(x['routes']['コード理解']=={'mode':'compound','id':None} for x in algo),'code-understanding route mismatch remains')
for x in algo:
    for reason in ['(none)','トレースミス','読み違い','知識不足','時間不足']:
        req(x['routes'][reason]==x['base'],f"non-target reason route changed: {x['sourceId']} {reason}")
sec=cand['routes']['security'];req(len(sec)==15 and all(x['code']==x['base'] and x['base']['mode']=='security' for x in sec),'security route drift')
req('subjectBFinalReviewTargetV243' in cand['render'] and 'startCompoundChallenge' in cand['render'],'render click repair not wired')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference byte mismatch')

fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','findingResolved':'subject_b_review_reason_action_route_mismatch','algorithmCodeUnderstandingRoutes':sum(1 for x in algo if x['routes']['コード理解']=={'mode':'compound','id':None}),'algorithmInventory':len(algo),'nonTargetReasonsPreserved':True,'securityRoutesPreserved':True,'bankHashes':cand['bankHashes'],'finalSignatureMatch':cand['sig']==par['sig'],'contracts':cand['contracts'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-review-reason-route-repair-v243.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_REVIEW_REASON_ROUTE_REPAIR_v243.txt').write_text(f'''FE QUEST v243 — Subject B Review Reason/Action Route Repair\n===========================================================\n\nResult\n------\nPASS — NO FINDINGS\nPrevious release: v242\nSource main: {parent}\nResolved finding: subject_b_review_reason_action_route_mismatch\nLearner-facing change: algorithm final-review route for 「コード理解」 only\n\nRepair\n------\nv242 confirmed that all 43 algorithm review cards could say 「複合問題で確認」 after the learner selected 「コード理解」 while the button still launched the domain TRACE route.\nv243 keeps that existing learner-facing advice and makes the action match it: all 43 algorithm final items now launch the existing 複合問題 practice when lastReason is 「コード理解」.\nAll other review reasons retain the existing item-specific remediation route. Security review routing is unchanged. The base bFinalRemediationTarget mapping is unchanged.\n\nCoverage\n--------\nAlgorithm code-understanding routes aligned: 43 / 43\nOther algorithm reason routes preserved: yes\nSecurity routes preserved: 15 / 15\n\nRegression\n----------\nQuestion / TRACE / security / final-algorithm banks vs v242: identical.\n1000 deterministic final-session selection/order/option signatures vs v242: identical.\nFinal contract: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace 15 / floor 4.\nSubject B semantic diagnostics: OK.\nCandidate/reference six release files byte-identical: yes\n\nDecision\n--------\nProceed to a v244 post-repair learner-flow audit that verifies the actual review-button destination after reason changes and checks security reason labels separately, without broadening the repair unless learner-visible evidence supports it.\n''')
print(Path('audits/SUBJECT_B_REVIEW_REASON_ROUTE_REPAIR_v243.txt').read_text())
