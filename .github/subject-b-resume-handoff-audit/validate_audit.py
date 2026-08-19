from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-resume-handoff-audit-(v(\d+))',branch)
    req(m is not None,'bad v272 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def scripts(path):
    html=Path(path).read_text(); return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
const names=['continueSubjectBFlow','launchSubjectBRecommendation','subjectBHubRecommendation','startBFinal','renderBFinalReadiness','saveBFinalResume','clearBFinalResume','showBFinalMenu','showBMockMenu','finishBExercise','finishCompoundChallenge','finishBMiniMock','finishSecurityMock','finishBFinal'];
const funcs={};for(const name of names){try{const f=eval(name);funcs[name]=typeof f==='function'?String(f):null;}catch(e){funcs[name]=null;}}
console.log('__V272__'+Buffer.from(JSON.stringify({v:APP_VERSION,funcs,banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V272__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))


def near(js,token,radius=650):
    out=[]
    for m in re.finditer(re.escape(token),js,re.I):
        lo=max(0,m.start()-radius); hi=min(len(js),m.end()+radius)
        out.append(re.sub(r'\s+',' ',js[lo:hi]).strip())
    return out[:16]


def function_meta(src):
    if not src:return {'present':False}
    return {'present':True,'chars':len(src),'showScreen':len(re.findall(r'\bshowScreen\s*\(',src)),'continueFlow':len(re.findall(r'\bcontinueSubjectBFlow\s*\(',src)),'launchRecommendation':len(re.findall(r'\blaunchSubjectBRecommendation\s*\(',src)),'hubRecommendation':len(re.findall(r'\bsubjectBHubRecommendation\s*\(',src)),'resumeTokens':len(re.findall(r'resume|再開|復帰',src,re.I))}


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v272','v271'),'v272 audit expects v271 parent')
source=Path('audits/SUBJECT_B_SHORT_PRACTICE_FLOW_DETAIL_v271.txt'); req(source.exists(),'v271 short-practice audit missing')
req('PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v271 evidence drift')
expected={'.github/subject-b-resume-handoff-audit/validate_audit.py','.github/workflows/subject-b-resume-handoff-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v272 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v272' and par['v']=='v271','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'audit-only Subject B bank drift')
req(cand['funcs']==par['funcs'],'audit-only resume/handoff function drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')

js=scripts('_site/index.html'); pjs=scripts('_site_parent/index.html')
completion_ids=['bNextExercise','bCompoundBackMenu','secMockBackList','bFinalBackMenu']
completion={x:near(js,x) for x in completion_ids}; pcompletion={x:near(pjs,x) for x in completion_ids}; req(completion==pcompletion,'completion binding drift')
resume_tokens=['saveBFinalResume','clearBFinalResume','bFinalResume','resume','再開']
resume={x:near(js,x) for x in resume_tokens}; presume={x:near(pjs,x) for x in resume_tokens}; req(resume==presume,'resume evidence drift')
meta={k:function_meta(v) for k,v in cand['funcs'].items()}

handoff={}
for ident,rows in completion.items():
    text=' '.join(rows)
    handoff[ident]={
      'matches':len(rows),
      'directContinue':bool(re.search(r'continueSubjectBFlow\s*\(',text)),
      'directRecommendation':bool(re.search(r'(?:launchSubjectBRecommendation|subjectBHubRecommendation)\s*\(',text)),
      'menuOnlySignals':sorted(set(re.findall(r'\b(showB(?:Mock|Final)Menu)\s*\(',text)))
    }

findings=[]
for ident,e in handoff.items():
    if e['matches'] and not e['directContinue'] and not e['directRecommendation'] and e['menuOnlySignals']:
        findings.append({'id':'subject_b_completion_handoff_returns_to_menu','severity':'Low','control':ident,'menuSignals':e['menuOnlySignals'],'summary':'A completion-oriented control appears to return to a Subject B menu without direct continuation/recommendation evidence.'})
# Resume is protective/productivity behavior; only record a medium finding if no save/clear evidence exists at all for the timed final.
resume_text=' '.join(sum(resume.values(),[]))
if not re.search(r'saveBFinalResume',resume_text) or not re.search(r'clearBFinalResume',resume_text):
    findings.append({'id':'subject_b_final_resume_lifecycle_not_located','severity':'Medium','summary':'The static audit could not locate both save and clear lifecycle evidence for the timed final resume path.'})
result='PASS — NO FINDINGS' if not findings else 'PASS — FINDINGS RECORDED'

fixture={'version':version,'previous':previous,'parent':parent,'result':result,'completionHandoff':handoff,'resumeEvidenceCounts':{k:len(v) for k,v in resume.items()},'functionMeta':meta,'findings':findings,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-resume-handoff-v272.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

handoff_txt='\n'.join(f"{k}: matches={v['matches']} / directContinue={v['directContinue']} / directRecommendation={v['directRecommendation']} / menuSignals={v['menuOnlySignals']}" for k,v in handoff.items())
resume_txt='\n'.join(f"{k}: matches={len(v)}" for k,v in resume.items())
find_txt='None.' if not findings else '\n'.join(f"{x['severity']} — {x['id']}: {x['summary']}" for x in findings)
audit=f'''FE QUEST v272 — Subject B Resume / Completion Handoff Audit
===============================================================

Result
------
{result}
Previous release: v271
Source main: {parent}
Learner-facing change in v272: none

Purpose
-------
v271 found no repeated confirmation friction in short practice and intentionally kept prediction/advance separation in TRACE. v272 inspects two places where a repeated extra tap could still matter every session without protecting an answer: completion-to-next-practice handoff and the timed final resume lifecycle.

Completion handoff evidence
---------------------------
{handoff_txt}

Timed final resume evidence
---------------------------
{resume_txt}

Findings
--------
{find_txt}

Interpretation
--------------
A result-screen control labelled “次の科目Bへ” should ideally enter the established continuation/recommendation route rather than merely bounce through another menu. Conversely, resume/save/clear behavior for the 100-minute final is protective and should not be simplified away. Static snippets are treated as routing evidence, not physical-device tap measurements.

Regression
----------
Captured handoff/resume functions and source snippets are unchanged from v271.
Subject B authored banks are unchanged.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Repair only a completion control that is concretely shown to stop at a redundant menu. Preserve the timed final resume lifecycle. If all completion controls already use the continuation/recommendation path, close this UX sequence and return to learner-facing content quality rather than adding more navigation machinery.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_RESUME_HANDOFF_v272.txt').write_text(audit); print(audit)
