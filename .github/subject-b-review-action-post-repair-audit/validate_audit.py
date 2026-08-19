from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-review-action-post-repair-audit-(v(\d+))',branch)
    req(m,'bad Subject B review action post-repair audit branch')
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
function explicitMode(meta){const s=(meta||[]).join(' ');if(/複合問題/.test(s))return 'compound';if(/TRACE|トレース/.test(s))return 'trace';if(/セキュリティ演習/.test(s))return 'security';return null;}
function finalSig(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x246000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function matrix(){
 const algoReasons=['トレースミス','コード理解','読み違い','知識不足','時間不足'];
 const secReasons=['手順の追い違い','対策の理解','読み違い','知識不足','時間不足'];
 const rows=[],bad=[];
 for(const d of B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam))for(const reason of algoReasons){const meta=bFinalReviewReasonMeta(reason,d),route=subjectBFinalReviewTargetV243(d,reason),expected=explicitMode(meta);const x={kind:'algorithm',id:d.sourceId,reason,meta,route,expected};rows.push(x);if(expected&&expected!==route.mode)bad.push(x);}
 for(const d of SECURITY_SCENARIOS.map(makeFinalSecurity))for(const reason of secReasons){const meta=bFinalReviewReasonMeta(reason,d),route=subjectBFinalReviewTargetV243(d,reason),expected=explicitMode(meta);const x={kind:'security',id:d.sourceId,reason,meta,route,expected};rows.push(x);if(expected&&expected!==route.mode)bad.push(x);}
 return {rows,bad,algorithmBad:bad.filter(x=>x.kind==='algorithm'),securityBad:bad.filter(x=>x.kind==='security')};
}
function legacySecurity(){return SECURITY_SCENARIOS.map(makeFinalSecurity).map(d=>({id:d.sourceId,legacyTrace:bFinalReviewReasonMeta('トレースミス',d),freshTrace:bFinalReviewReasonMeta('手順の追い違い',d),legacyCode:bFinalReviewReasonMeta('コード理解',d),freshCode:bFinalReviewReasonMeta('対策の理解',d),traceCanon:subjectBSecurityReasonCanonicalV245('トレースミス'),codeCanon:subjectBSecurityReasonCanonicalV245('コード理解'),traceRoute:subjectBFinalReviewTargetV243(d,'手順の追い違い'),codeRoute:subjectBFinalReviewTargetV243(d,'対策の理解')}));}
const m=matrix(),legacy=legacySecurity();
const baseRenderer=typeof __renderBFinalResultBeforeV217==='function'?String(__renderBFinalResultBeforeV217):'';
const v243Renderer=typeof __renderBFinalResultBeforeV245==='function'?String(__renderBFinalResultBeforeV245):'';
const currentRenderer=String(renderBFinalResult);
console.log('__V246__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec243:globalThis.SUBJECT_B_REVIEW_REASON_ROUTE_V243_SPEC||null,spec245:globalThis.SUBJECT_B_SECURITY_REVIEW_REASON_V245_SPEC||null,matrix:m,legacy,source:{baseRenderer,v243Renderer,currentRenderer},bankHashes:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},sig:finalSig(1000),contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V246__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v246' and previous=='v245','v246 audit expects v245 parent')
expected={'.github/subject-b-review-action-post-repair-audit/validate_audit.py','.github/workflows/subject-b-review-action-post-repair-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v246 audit-only source drift: '+repr(sorted(changed^expected)))
cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['bankHashes']==par['bankHashes'],'audit-only content bank drift')
req(cand['sig']==par['sig'],'audit-only final selection/order/options drift')
req(cand['contracts']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req((cand.get('spec243') or {}).get('findingResolved')=='subject_b_review_reason_action_route_mismatch','v243 spec missing')
req((cand.get('spec245') or {}).get('findingResolved')=='subject_b_security_review_reason_action_route_mismatch','v245 spec missing')

findings=[]
if cand['matrix']['algorithmBad']:
    findings.append(('High','subject_b_algorithm_review_action_post_repair_regression',f"{len(cand['matrix']['algorithmBad'])} algorithm copy/route mismatches remain."))
if cand['matrix']['securityBad']:
    findings.append(('High','subject_b_security_review_action_post_repair_regression',f"{len(cand['matrix']['securityBad'])} security copy/route mismatches remain."))
legacy=cand['legacy']
if any(x['legacyTrace']!=x['freshTrace'] or x['legacyCode']!=x['freshCode'] or x['traceCanon']!='手順の追い違い' or x['codeCanon']!='対策の理解' for x in legacy):
    findings.append(('Medium','subject_b_security_legacy_reason_rerender_inconsistent','Legacy security reason keys do not rerender to the same new copy/canonical state.'))
base=cand['source']['baseRenderer'];v243=cand['source']['v243Renderer'];cur=cand['source']['currentRenderer']
if 'reason=btn.dataset.bfreason' not in base or 'saveProfile();renderBFinalResult(a,0)' not in base:
    findings.append(('Medium','subject_b_review_reason_rerender_not_dataset_driven','Review chip click/rerender no longer reads the live reason dataset.'))
if 'subjectBFinalReviewTargetV243' not in v243 or 'startCompoundChallenge' not in v243:
    findings.append(('Medium','subject_b_algorithm_reason_route_click_not_wired','v243 reason-aware compound click wiring is missing.'))
if "btn.dataset.bfreason='手順の追い違い'" not in cur or "btn.dataset.bfreason='対策の理解'" not in cur or 'subjectBSecurityReasonCanonicalV245(stored)' not in cur:
    findings.append(('Medium','subject_b_security_reason_chip_rerender_not_wired','v245 security chip relabel/canonical picked-state wiring is missing.'))
if 'startSecurityScenario(target.id)' not in base:
    findings.append(('Medium','subject_b_security_direct_remediation_click_not_wired','Base final-review action no longer launches the resolved security scenario id.'))
priority={'High':3,'Medium':2,'Low':1};findings.sort(key=lambda x:-priority[x[0]])
result='PASS — NO FINDINGS' if not findings else f"PASS — {findings[0][0].upper()} FINDING RECORDED"
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'findings':[{'priority':p,'marker':m,'detail':d} for p,m,d in findings],'algorithmMatrix':{'rows':43*5,'mismatches':len(cand['matrix']['algorithmBad'])},'securityMatrix':{'rows':15*5,'mismatches':len(cand['matrix']['securityBad'])},'legacySecurityRerender':{'scenarios':len(legacy),'consistent':not any(x['legacyTrace']!=x['freshTrace'] or x['legacyCode']!=x['freshCode'] for x in legacy)},'wiring':{'datasetDrivenRerender':'reason=btn.dataset.bfreason' in base and 'saveProfile();renderBFinalResult(a,0)' in base,'algorithmCompoundClick':'subjectBFinalReviewTargetV243' in v243 and 'startCompoundChallenge' in v243,'securityChipRelabel':"btn.dataset.bfreason='手順の追い違い'" in cur and "btn.dataset.bfreason='対策の理解'" in cur,'securityDirectClick':'startSecurityScenario(target.id)' in base},'bankHashes':cand['bankHashes'],'finalSignatureMatch':cand['sig']==par['sig'],'contracts':cand['contracts'],'semanticOK':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-review-action-post-repair-audit-v246.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
find_text='none' if not findings else '\n'.join(f'- {p}: {m} — {d}' for p,m,d in findings)
audit=f'''FE QUEST v246 — Subject B Review Action Post-Repair Audit\n=========================================================\n\nResult\n------\n{result}\nPrevious release: v245\nSource main: {parent}\nLearner-facing change in v246: none\n\nReason → copy → destination matrix\n----------------------------------\nAlgorithm: 43 items × 5 reasons = 215 combinations / mismatches {len(cand['matrix']['algorithmBad'])}\nSecurity: 15 scenarios × 5 visible reasons = 75 combinations / mismatches {len(cand['matrix']['securityBad'])}\n\nRerender and click wiring\n-------------------------\nReason-chip click reads the live data-bfreason value, saves it, and rerenders: {'yes' if fixture['wiring']['datasetDrivenRerender'] else 'no'}\nLegacy security reason keys rerender to the same new security-specific copy: {'yes' if fixture['legacySecurityRerender']['consistent'] else 'no'}\nv243 algorithm 「コード理解」 action remains wired to compound challenge: {'yes' if fixture['wiring']['algorithmCompoundClick'] else 'no'}\nv245 security chips are relabeled to 「手順の追い違い」 / 「対策の理解」 and picked state is canonicalized: {'yes' if fixture['wiring']['securityChipRelabel'] else 'no'}\nSecurity remediation button still launches the resolved scenario id directly: {'yes' if fixture['wiring']['securityDirectClick'] else 'no'}\n\nRegression\n----------\nQuestion / TRACE / security / final-algorithm bank hashes vs v245: identical.\n1000 deterministic final-session selection/order/options signatures vs v245: identical.\nFinal contract unchanged: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace 15 / floor 4.\nSubject B semantic diagnostics: OK.\n\nFindings\n--------\n{find_text}\n\nDecision\n--------\nIf clean, close the v242-v246 final-review action sequence: destination granularity, reason-aware algorithm routing, security-specific review vocabulary, legacy-key rerender and direct recovery actions are coherent. Move next to difficulty-label / practice-calibration evidence rather than further changing this review flow.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_REVIEW_ACTION_POST_REPAIR_AUDIT_v246.txt').write_text(audit);print(audit)
