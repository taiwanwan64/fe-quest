from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-security-review-reason-label-repair-(v(\d+))',branch)
    req(m,'bad Subject B security review reason label repair branch')
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
function finalSig(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x245000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function reviewAudit(){
 const legacy=['トレースミス','コード理解'],fresh=['手順の追い違い','対策の理解'];
 const security=SECURITY_SCENARIOS.map(makeFinalSecurity).map(d=>({
   id:d.sourceId,
   route:Object.fromEntries([...legacy,...fresh].map(r=>[r,subjectBFinalReviewTargetV243(d,r)])),
   meta:Object.fromEntries([...legacy,...fresh].map(r=>[r,bFinalReviewReasonMeta(r,d)]))
 }));
 const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam).map(d=>({id:d.sourceId,trace:bFinalReviewReasonMeta('トレースミス',d),code:bFinalReviewReasonMeta('コード理解',d),codeRoute:subjectBFinalReviewTargetV243(d,'コード理解')}));
 const canon=typeof globalThis.subjectBSecurityReasonCanonicalV245==='function'?globalThis.subjectBSecurityReasonCanonicalV245:(r=>r);
 return {security,algo,canonical:{trace:canon('トレースミス'),code:canon('コード理解'),freshTrace:canon('手順の追い違い'),freshCode:canon('対策の理解')}};
}
const a=reviewAudit();
console.log('__V245__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_SECURITY_REVIEW_REASON_V245_SPEC||null,audit:a,renderer:String(renderBFinalResult),metaSource:String(bFinalReviewReasonMeta),bankHashes:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},sig:finalSig(1000),contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V245__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v245' and previous=='v244','v245 repair expects v244 parent')
source=Path('audits/SUBJECT_B_REVIEW_REASON_ROUTE_POST_REPAIR_AUDIT_v244.txt');req(source.exists(),'v244 audit missing')
st=source.read_text();req('PASS — MEDIUM FINDING RECORDED' in st and 'subject_b_security_review_reason_action_route_mismatch' in st and 'Explicit security learner-copy / launched-route mismatches: 30' in st,'v244 finding evidence drift')
manifest=json.loads(Path('_release/content-change-v245.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'manifest parent/source drift')
req(manifest['source_priority_tier']=='medium' and manifest['quality_audit_marker']=='subject_b_security_review_reason_action_route_mismatch','manifest finding drift')
req(manifest['content_files']==['app/subject-b-security-review-reason-label-overrides-v245.txt'] and manifest['assembly_files']==['index.html'],'manifest scope drift')
expected={'app/subject-b-security-review-reason-label-overrides-v245.txt','_release/content-change-v245.json','index.html','.github/subject-b-security-review-reason-label-repair/validate_repair.py','.github/workflows/subject-b-security-review-reason-label-repair.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v245 source drift: '+repr(sorted(changed^expected)))
override=Path('app/subject-b-security-review-reason-label-overrides-v245.txt').read_text()
for token in ["'トレースミス':'手順の追い違い'","'コード理解':'対策の理解'","btn.dataset.bfreason='手順の追い違い'","btn.dataset.bfreason='対策の理解'","セキュリティ演習で手順確認","セキュリティ演習で対策確認"]: req(token in override,'v245 label/copy contract missing: '+token)
req('saveProfile' not in override and 'bFinalRemediationTarget=function' not in override,'repair must not alter persistence/base remediation')

cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['bankHashes']==par['bankHashes'],'question/practice bank drift')
req(cand['sig']==par['sig'],'final selection/order/options drift')
req(cand['contracts']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
spec=cand.get('spec') or {};req(spec.get('findingResolved')=='subject_b_security_review_reason_action_route_mismatch','v245 spec drift')
req(cand['audit']['canonical']=={'trace':'手順の追い違い','code':'対策の理解','freshTrace':'手順の追い違い','freshCode':'対策の理解'},'legacy/new reason canonicalization drift')
sec=cand['audit']['security'];req(len(sec)==15,'security inventory drift')
for x in sec:
    req(all(v=={'mode':'security','id':x['id']} for v in x['route'].values()),'security target route drift: '+x['id'])
    req(x['meta']['トレースミス']==x['meta']['手順の追い違い'] and x['meta']['コード理解']==x['meta']['対策の理解'],'legacy/new security copy mismatch: '+x['id'])
    req(x['meta']['手順の追い違い'][0]=='セキュリティ演習で手順確認' and x['meta']['対策の理解'][0]=='セキュリティ演習で対策確認','security action copy not route-aligned: '+x['id'])
algo=cand['audit']['algo'];req(len(algo)==43,'algorithm inventory drift')
req(all(x['trace']==par['audit']['algo'][i]['trace'] and x['code']==par['audit']['algo'][i]['code'] and x['codeRoute']==par['audit']['algo'][i]['codeRoute'] for i,x in enumerate(algo)),'algorithm review behavior drift')
req("btn.textContent='手順の追い違い'" in cand['renderer'] and "btn.textContent='対策の理解'" in cand['renderer'],'security chip relabel not wired to review renderer')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference byte mismatch')

fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','findingResolved':'subject_b_security_review_reason_action_route_mismatch','securityScenarios':len(sec),'legacyReasonKeysReadable':True,'newVisibleReasons':['手順の追い違い','対策の理解'],'securityRoutesPreserved':True,'algorithmReviewBehaviorPreserved':True,'bankHashes':cand['bankHashes'],'finalSignatureMatch':cand['sig']==par['sig'],'contracts':cand['contracts'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-security-review-reason-label-repair-v245.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_SECURITY_REVIEW_REASON_LABEL_REPAIR_v245.txt').write_text(f'''FE QUEST v245 — Subject B Security Review Reason Label Repair\n==============================================================\n\nResult\n------\nPASS — NO FINDINGS\nPrevious release: v244\nSource main: {parent}\nResolved finding: subject_b_security_review_reason_action_route_mismatch\nLearner-facing change: security final-review reason labels/action copy only\n\nRepair\n------\nv244 found 30 explicit copy/route mismatches: all 15 security scenarios showed 「TRACEで1行ずつ確認」 for 「トレースミス」 and 「複合問題で確認」 for 「コード理解」 even though the correct destination remained the scenario-specific security exercise.\nv245 changes only the security review vocabulary: 「トレースミス」 is displayed/stored going forward as 「手順の追い違い」 and 「コード理解」 as 「対策の理解」. Their action copy now says 「セキュリティ演習で手順確認」 / 「セキュリティ演習で対策確認」.\nExisting stored legacy reason keys remain readable and map to the new security-specific wording, so no profile migration is required.\n\nCoverage\n--------\nSecurity scenarios validated: 15 / 15\nLegacy + new security reason keys resolve to the same security-specific action copy: yes\nSecurity target IDs/routes preserved: 15 / 15\nAlgorithm review reason behavior preserved: 43 / 43\n\nRegression\n----------\nQuestion / TRACE / security / final-algorithm banks vs v244: identical.\n1000 deterministic final-session selection/order/options signatures vs v244: identical.\nFinal contract: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace 15 / floor 4.\nSubject B semantic diagnostics: OK.\nCandidate/reference six release files byte-identical: yes\n\nDecision\n--------\nProceed to v246 post-repair learner-flow audit across algorithm/security reason chips, rerender after reason selection, and direct destination action. If clean, close the v242-v246 review-action sequence and move to another learner-value frontier.\n''')
print(Path('audits/SUBJECT_B_SECURITY_REVIEW_REASON_LABEL_REPAIR_v245.txt').read_text())
