from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-review-reason-route-post-repair-audit-(v(\d+))',branch)
    req(m,'bad Subject B review reason route post-repair audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function explicitMode(meta){const s=(meta||[]).join(' ');if(/複合問題/.test(s))return 'compound';if(/TRACE|トレース/.test(s))return 'trace';if(/セキュリティ演習/.test(s))return 'security';return null;}
function matrix(){
 const reasons=['トレースミス','コード理解','読み違い','知識不足','時間不足'];
 const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity),mismatches=[],rows=[];
 for(const d of [...algo,...sec])for(const reason of reasons){
   const meta=bFinalReviewReasonMeta(reason,d),route=subjectBFinalReviewTargetV243(d,reason),expected=explicitMode(meta);
   const row={kind:d.kind,sourceId:d.sourceId,reason,meta,route,expected};rows.push(row);if(expected&&expected!==route.mode)mismatches.push(row);
 }
 return {rows,mismatches,algoMismatch:mismatches.filter(x=>x.kind!=='security'),securityMismatch:mismatches.filter(x=>x.kind==='security')};
}
const m=matrix();
const baseRenderer=(typeof __renderBFinalResultBeforeV217==='function')?String(__renderBFinalResultBeforeV217):'';
const currentRenderer=String(renderBFinalResult);
console.log('__V244__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_REVIEW_REASON_ROUTE_V243_SPEC||null,matrix:m,baseRenderer,currentRenderer,sharedReasonChips:baseRenderer.includes("'トレースミス','コード理解','読み違い','知識不足','時間不足'"),repairWired:currentRenderer.includes('subjectBFinalReviewTargetV243')&&currentRenderer.includes('startCompoundChallenge'),bankHashes:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V244__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v244' and previous=='v243','v244 audit expects v243 parent')
expected={'.github/subject-b-review-reason-route-post-repair-audit/validate_audit.py','.github/workflows/subject-b-review-reason-route-post-repair-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v244 audit-only source drift: '+repr(sorted(changed^expected)))
cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['bankHashes']==par['bankHashes'],'audit-only content bank drift')
req(cand['contracts']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req((cand.get('spec') or {}).get('findingResolved')=='subject_b_review_reason_action_route_mismatch','v243 repair spec missing')
req(cand['matrix']['algoMismatch']==[],'v243 algorithm reason/action mismatch remains')
req(cand['repairWired'] is True,'v243 review-button compound wiring missing')
req(cand['sharedReasonChips'] is True,'security no longer shares the audited reason-chip set')

findings=[];sec=cand['matrix']['securityMismatch']
if sec:
    by_reason={}
    for x in sec: by_reason[x['reason']]=by_reason.get(x['reason'],0)+1
    findings.append(('Medium','subject_b_security_review_reason_action_route_mismatch',f"{len(sec)} security review reason/action combinations explicitly name a different practice mode from the existing security route: {by_reason}."))
priority={'High':3,'Medium':2,'Low':1};findings.sort(key=lambda x:-priority[x[0]])
result='PASS — NO FINDINGS' if not findings else f"PASS — {findings[0][0].upper()} FINDING RECORDED"
by_reason={r:sum(1 for x in sec if x['reason']==r) for r in sorted(set(x['reason'] for x in sec))}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'findings':[{'priority':p,'marker':m,'detail':d} for p,m,d in findings],'algorithmMismatchCount':len(cand['matrix']['algoMismatch']),'securityMismatchCount':len(sec),'securityMismatchByReason':by_reason,'repairWired':cand['repairWired'],'sharedReasonChips':cand['sharedReasonChips'],'bankHashes':cand['bankHashes'],'contracts':cand['contracts'],'semanticOK':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-review-reason-route-post-repair-audit-v244.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
find_text='none' if not findings else '\n'.join(f'- {p}: {m} — {d}' for p,m,d in findings)
code_meta=next(x for x in cand['matrix']['rows'] if x['kind']=='security' and x['reason']=='コード理解')
trace_meta=next(x for x in cand['matrix']['rows'] if x['kind']=='security' and x['reason']=='トレースミス')
audit=f'''FE QUEST v244 — Subject B Review Reason/Action Route Post-Repair Audit\n======================================================================\n\nResult\n------\n{result}\nPrevious release: v243\nSource main: {parent}\nLearner-facing change in v244: none\n\nAlgorithm post-repair flow\n--------------------------\nExplicit learner-copy / launched-route mismatches across 43 algorithm items × 5 reasons: {len(cand['matrix']['algoMismatch'])}\nv243 review-button route wiring to the reason-aware helper and compound challenge: yes\n\nSecurity reason-label check\n---------------------------\nThe same five reason chips are rendered for security review items: yes\nExplicit security learner-copy / launched-route mismatches: {len(sec)}\nMismatch by reason: {json.dumps(by_reason,ensure_ascii=False)}\nRepresentative security 「コード理解」: label {code_meta['meta'][0]} / existing route {code_meta['route']['mode']}\nRepresentative security 「トレースミス」: label {trace_meta['meta'][0]} / existing route {trace_meta['route']['mode']}\n\nRegression\n----------\nQuestion / TRACE / security / final-algorithm bank hashes vs v243: identical.\nFinal contract unchanged: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace 15 / floor 4.\nSubject B semantic diagnostics: OK.\n\nFindings\n--------\n{find_text}\n\nDecision\n--------\nThe v243 algorithm repair is confirmed. If the security finding is present, repair only the security-specific reason labels/chips so that visible advice matches the existing security remediation route; keep security target IDs, scoring, final selection, readiness and timing unchanged.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_REVIEW_REASON_ROUTE_POST_REPAIR_AUDIT_v244.txt').write_text(audit);print(audit)
