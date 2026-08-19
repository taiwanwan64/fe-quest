from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-interaction-friction-audit-(v(\d+))',branch)
    req(m is not None,'bad v270 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def scripts(path):
    html=Path(path).read_text(); return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
const names=['startBExercise','renderBStep','nextBStep','finishBExercise','showBPrediction','startCompoundChallenge','renderCompoundQuestion','finishCompoundChallenge','startBMiniMock','renderBMockQuestion','finishBMiniMock','startSecurityMock','renderSecurityMockQuestion','finishSecurityMock','startBFinal','renderBFinalQuestion','finishBFinal','continueSubjectBFlow','launchSubjectBRecommendation'];
const funcs={};for(const name of names){try{const f=eval(name);funcs[name]=typeof f==='function'?String(f):null;}catch(e){funcs[name]=null;}}
console.log('__V270__'+Buffer.from(JSON.stringify({v:APP_VERSION,funcs,banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V270__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))


def fn_stats(funcs):
    out={}
    for name,src in funcs.items():
        if not src:
            out[name]={'present':False}; continue
        out[name]={
            'present':True,
            'chars':len(src),
            'confirmCalls':len(re.findall(r'\bconfirm\s*\(',src)),
            'alertCalls':len(re.findall(r'\balert\s*\(',src)),
            'showScreenCalls':len(re.findall(r'\bshowScreen\s*\(',src)),
            'saveProfileCalls':len(re.findall(r'\bsaveProfile\s*\(',src)),
            'renderCalls':len(re.findall(r'\brender[A-Z][A-Za-z0-9_]*\s*\(',src)),
            'finishCalls':len(re.findall(r'\bfinish[A-Z][A-Za-z0-9_]*\s*\(',src))
        }
    return out


def button_inventory(path):
    html=Path(path).read_text(); rows=[]
    for m in re.finditer(r'<button\b([^>]*)>(.*?)</button>',html,re.S|re.I):
        attrs=m.group(1); mid=re.search(r'\bid=["\']([^"\']+)["\']',attrs,re.I)
        if not mid: continue
        ident=mid.group(1)
        if not re.search(r'^(?:b|sec|compound)',ident,re.I): continue
        if not re.search(r'(?:start|next|prev|back|submit|finish|continue|review|action)',ident,re.I): continue
        text=re.sub(r'<[^>]+>',' ',m.group(2)); text=re.sub(r'\s+',' ',text).strip()
        cls=re.search(r'\bclass=["\']([^"\']+)["\']',attrs,re.I)
        rows.append({'id':ident,'classes':cls.group(1).split() if cls else [],'text':text[:120]})
    return sorted({x['id']:x for x in rows}.values(),key=lambda x:x['id'])


def confirm_snippets(path):
    js=scripts(path); rows=[]
    for m in re.finditer(r'\bconfirm\s*\(',js):
        lo=max(0,m.start()-260); hi=min(len(js),m.start()+420); s=re.sub(r'\s+',' ',js[lo:hi]).strip()
        if re.search(r'bFinal|bMock|Compound|compound|SecurityMock|secMock|SubjectB|subjectB|科目B',s): rows.append(s)
    return rows


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v270','v269'),'v270 audit expects v269 parent')
source=Path('audits/SUBJECT_B_MOBILE_TAP_TARGET_POST_REPAIR_v269.txt'); req(source.exists(),'v269 post-repair audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v269 post-repair audit not clean')
expected={'.github/subject-b-interaction-friction-audit/validate_audit.py','.github/workflows/subject-b-interaction-friction-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v270 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v270' and par['v']=='v269','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'audit-only Subject B bank drift')
req(cand['funcs']==par['funcs'],'audit-only Subject B interaction function drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')

stats=fn_stats(cand['funcs']); buttons=button_inventory('_site/index.html'); pbuttons=button_inventory('_site_parent/index.html')
req(buttons==pbuttons,'audit-only Subject B button inventory drift')
confirms=confirm_snippets('_site/index.html'); pconfirms=confirm_snippets('_site_parent/index.html'); req(confirms==pconfirms,'audit-only confirmation-flow drift')

modes={
 'trace':['startBExercise','renderBStep','nextBStep','finishBExercise','showBPrediction'],
 'compound':['startCompoundChallenge','renderCompoundQuestion','finishCompoundChallenge'],
 'algorithmMiniMock':['startBMiniMock','renderBMockQuestion','finishBMiniMock'],
 'securityMock':['startSecurityMock','renderSecurityMockQuestion','finishSecurityMock'],
 'final':['startBFinal','renderBFinalQuestion','finishBFinal'],
 'recommendation':['continueSubjectBFlow','launchSubjectBRecommendation']
}
mode_rows={k:{'functions':v,'present':[x for x in v if stats.get(x,{}).get('present')],'missing':[x for x in v if not stats.get(x,{}).get('present')],'confirmCalls':sum(stats.get(x,{}).get('confirmCalls',0) for x in v),'showScreenCalls':sum(stats.get(x,{}).get('showScreenCalls',0) for x in v)} for k,v in modes.items()}

# Evidence-only audit: missing candidate names are recorded, not treated as product defects, because some flows may use different function names.
findings=[]
for mode,row in mode_rows.items():
    if row['confirmCalls']>=2:
        findings.append({'id':'subject_b_multiple_confirm_calls_in_named_flow','severity':'Low','mode':mode,'count':row['confirmCalls'],'summary':'The captured named functions for this mode contain at least two confirm() calls; inspect whether both are learner-necessary before changing behavior.'})
result='PASS — DETAIL EVIDENCE CAPTURED' if not findings else 'PASS — FINDINGS RECORDED'

fixture={'version':version,'previous':previous,'parent':parent,'result':result,'modeFunctionStats':mode_rows,'functionStats':stats,'buttons':buttons,'subjectBConfirmSnippets':confirms,'findings':findings,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-interaction-friction-v270.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

mode_txt='\n'.join(f"{k}: present={v['present']} / missing-candidate-names={v['missing']} / confirm()={v['confirmCalls']} / showScreen()={v['showScreenCalls']}" for k,v in mode_rows.items())
button_txt='\n'.join(f"{x['id']} | classes={' '.join(x['classes']) or '-'} | text={x['text'] or '(no static text)'}" for x in buttons) or 'No matching static Subject B flow buttons found.'
confirm_txt='\n'.join(f"[{i+1}] {s}" for i,s in enumerate(confirms)) or 'No Subject-B-context confirm() snippets were found by the static source scan.'
find_txt='None.' if not findings else '\n'.join(f"{x['severity']} — {x['id']} ({x['mode']}): {x['summary']}" for x in findings)
audit=f'''FE QUEST v270 — Subject B Interaction Friction Inventory Audit
===================================================================

Result
------
{result}
Previous release: v269
Source main: {parent}
Learner-facing change in v270: none

Purpose
-------
v269 closed the mobile tap-target repair. v270 inventories the existing Subject B interaction sequence before removing any steps: named start/render/finish functions, confirmation calls, screen transitions and static flow buttons. This is source evidence, not a claim about measured human tap time or physical-device behavior.

Mode function evidence
----------------------
{mode_txt}

Static Subject B flow buttons
-----------------------------
Count: {len(buttons)}
{button_txt}

Subject-B-context confirmation evidence
---------------------------------------
Count: {len(confirms)}
{confirm_txt}

Findings
--------
{find_txt}

Interpretation
--------------
A missing candidate function name does not itself mean a broken flow; the implementation may use a different name or inline handler. Likewise, a confirm() call is not automatically friction: confirmation is appropriate when it protects a timed exam submission or destructive action. The captured fixture preserves exact function sources and controls so the next detail audit can trace only concrete high-frequency learner paths.

Regression
----------
Subject B interaction function sources and static flow-button inventory: unchanged from v269.
Subject B authored banks: unchanged.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use this inventory to trace the highest-frequency short-practice paths first. Prioritize repeated per-question or per-session steps; preserve confirmations that protect a 100-minute final submission or loss of in-progress work. Do not redesign the screens without a demonstrated extra-step bottleneck.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_INTERACTION_FRICTION_v270.txt').write_text(audit); print(audit)
