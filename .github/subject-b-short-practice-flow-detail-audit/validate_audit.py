from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-short-practice-flow-detail-audit-(v(\d+))',branch)
    req(m is not None,'bad v271 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def scripts(path):
    html=Path(path).read_text(); return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
const names=['startBExercise','renderBStep','showBPrediction','finishBExercise','startCompoundChallenge','renderCompoundQuestion','askSubmitCompound','finishCompoundChallenge','startBMiniMock','renderBMockQuestion','askSubmitBMock','finishBMiniMock','startSecurityMock','renderSecurityMockQuestion','askSubmitSecurityMock','finishSecurityMock'];
const funcs={};for(const name of names){try{const f=eval(name);funcs[name]=typeof f==='function'?String(f):null;}catch(e){funcs[name]=null;}}
console.log('__V271__'+Buffer.from(JSON.stringify({v:APP_VERSION,funcs,banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V271__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))


def snippets(js,patterns,radius=420):
    out={}
    for key,pat in patterns.items():
        rows=[]
        for m in re.finditer(pat,js,re.I):
            lo=max(0,m.start()-radius); hi=min(len(js),m.end()+radius)
            rows.append(re.sub(r'\s+',' ',js[lo:hi]).strip())
        out[key]=rows[:12]
    return out


def summarize_function(src):
    if not src:return {'present':False}
    return {
      'present':True,
      'chars':len(src),
      'confirmCalls':len(re.findall(r'\bconfirm\s*\(',src)),
      'answerDataHooks':sorted(set(re.findall(r'data-([a-zA-Z0-9_-]*opt)',src))),
      'renderCalls':re.findall(r'\b(render[A-Z][A-Za-z0-9_]*)\s*\(',src),
      'finishCalls':re.findall(r'\b(finish[A-Z][A-Za-z0-9_]*)\s*\(',src),
      'indexMutations':re.findall(r'\b([A-Za-z][A-Za-z0-9_]*Index)\s*(?:\+\+|--|=)',src),
      'classAdds':re.findall(r'classList\.add\(["\']([^"\']+)',src),
      'classRemoves':re.findall(r'classList\.remove\(["\']([^"\']+)',src)
    }


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v271','v270'),'v271 audit expects v270 parent')
source=Path('audits/SUBJECT_B_INTERACTION_FRICTION_v270.txt'); req(source.exists(),'v270 interaction audit missing')
req('PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v270 interaction evidence drift')
expected={'.github/subject-b-short-practice-flow-detail-audit/validate_audit.py','.github/workflows/subject-b-short-practice-flow-detail-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v271 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v271' and par['v']=='v270','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'audit-only Subject B bank drift')
req(cand['funcs']==par['funcs'],'audit-only short-practice function drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')

js=scripts('_site/index.html'); pjs=scripts('_site_parent/index.html')
patterns={
 'traceNextControl':r'(?:bNextStep|bStepNext|traceNext|predictionNext)',
 'predictionControls':r'(?:predictionBox|data-predict|bPrediction)',
 'compoundControls':r'(?:bCompoundNext|bCompoundPrev|bCompoundSubmit|bCompoundExit)',
 'algorithmMiniMockControls':r'(?:bMockNext|bMockPrev|bMockSubmitTop|bMockExit|data-bmopt)',
 'securityMockControls':r'(?:secMockNext|secMockPrev|secMockSubmitTop|secMockExit|data-smopt)'
}
ev=snippets(js,patterns); pev=snippets(pjs,patterns); req(ev==pev,'audit-only short-practice binding drift')
fn={k:summarize_function(v) for k,v in cand['funcs'].items()}

# Derive conservative friction signals only where source evidence is explicit.
findings=[]
# Submission confirmation is expected for timed mocks/compound; only flag repeated confirmations inside the same submit helper.
for name in ['askSubmitCompound','askSubmitBMock','askSubmitSecurityMock']:
    row=fn.get(name,{})
    if row.get('confirmCalls',0)>1:
        findings.append({'id':'repeated_submission_confirmation','severity':'Low','function':name,'summary':'A short-practice submission helper contains multiple confirmation calls.'})
# Exit confirmation protects unsaved answers and is intentionally not a friction finding.
# Capture whether TRACE prediction and advancement appear as distinct controls; this is evidence for a follow-up, not automatically a defect.
trace_text=' '.join(ev['traceNextControl']+ev['predictionControls'])
trace_has_prediction=bool(re.search(r'prediction|predict',trace_text,re.I))
trace_has_next=bool(re.search(r'next|次',trace_text,re.I))
trace_distinct_step_evidence=trace_has_prediction and trace_has_next
result='PASS — DETAIL EVIDENCE CAPTURED' if not findings else 'PASS — FINDINGS RECORDED'

fixture={'version':version,'previous':previous,'parent':parent,'result':result,'functionStats':fn,'bindingSnippets':ev,'tracePredictionAndAdvanceEvidence':trace_distinct_step_evidence,'findings':findings,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-short-practice-flow-detail-v271.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

func_txt='\n'.join(f"{name}: present={row.get('present')} / confirm={row.get('confirmCalls',0)} / renderCalls={row.get('renderCalls',[])} / finishCalls={row.get('finishCalls',[])} / indexMutations={row.get('indexMutations',[])}" for name,row in fn.items())
bind_txt='\n'.join(f"{k}: matches={len(v)}" for k,v in ev.items())
find_txt='None.' if not findings else '\n'.join(f"{x['severity']} — {x['id']} ({x['function']}): {x['summary']}" for x in findings)
audit=f'''FE QUEST v271 — Subject B Short-Practice Flow Detail Audit
=================================================================

Result
------
{result}
Previous release: v270
Source main: {parent}
Learner-facing change in v271: none

Purpose
-------
v270 showed eight Subject-B-context confirmations, all around submit/exit paths, and no obvious repeated confirmation inside the named core functions. v271 narrows to high-frequency short-practice flows: TRACE, compound, algorithm mini mock and security mini mock. It captures submit helpers, answer/navigation bindings and whether TRACE prediction and advancement are represented as distinct interactions before any UX simplification is attempted.

Function evidence
-----------------
{func_txt}

Binding evidence
----------------
{bind_txt}
TRACE prediction + advance both represented in captured source: {trace_distinct_step_evidence}

Findings
--------
{find_txt}

Interpretation
--------------
Submission confirmation for a timed mini mock or a multi-question compound set is protective, especially when unanswered items remain. Exit confirmation is also protective because the current copy explicitly says answers are not saved. These are not treated as friction findings by default. TRACE may legitimately require a separate prediction choice and advance action because the pedagogical goal is to stop at an intermediate state; v271 records that structure without removing it automatically.

Regression
----------
Captured short-practice function sources and binding snippets are unchanged from v270.
Subject B authored banks are unchanged.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If no repeated-confirmation finding appears, keep the protective submit/exit confirmations. The next optimization should focus on resume/start routing and completion-to-next-practice handoff, where an extra menu stop can cost a tap every session without protecting learner work.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_SHORT_PRACTICE_FLOW_DETAIL_v271.txt').write_text(audit); print(audit)
