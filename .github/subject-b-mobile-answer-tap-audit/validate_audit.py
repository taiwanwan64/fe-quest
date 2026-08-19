from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-mobile-answer-tap-audit-(v(\d+))',branch)
    req(m is not None,'bad v267 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def scripts(path):
    html=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function optStats(rows){return rows.map(x=>({id:x.id||x.sourceId||null,n:Array.isArray(x.options)?x.options.length:null}));}
console.log('__V267__'+Buffer.from(JSON.stringify({v:APP_VERSION,finalOptions:optStats(B_EXAM_ALGO_ITEMS),exercisePredictionOptions:B_EXERCISES.map(x=>({id:x.id,counts:(x.steps||[]).filter(s=>s.predict).map(s=>(s.predict.opts||[]).length)})),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V267__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


def css_rules(path):
    html=Path(path).read_text()
    styles='\n'.join(re.findall(r'<style(?:\s[^>]*)?>(.*?)</style>',html,re.S|re.I))
    out=[]
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}',styles,re.S):
        out.append({'selector':re.sub(r'\s+',' ',m.group(1)).strip(),'body':re.sub(r'\s+',' ',m.group(2)).strip()})
    return out


def px_value(body,prop):
    m=re.search(r'(?:^|;)\s*'+re.escape(prop)+r'\s*:\s*([0-9.]+)\s*(px|rem|em)',body,re.I)
    if not m:return None
    v=float(m.group(1)); return v if m.group(2).lower()=='px' else v*16


def vertical_padding(body):
    m=re.search(r'(?:^|;)\s*padding\s*:\s*([^;]+)',body,re.I)
    if not m:return 0
    vals=re.findall(r'([0-9.]+)\s*(px|rem|em)',m.group(1))
    if not vals:return 0
    ps=[float(n)*(1 if u.lower()=='px' else 16) for n,u in vals]
    return ps[0]


def estimate(selector_terms,rules):
    matched=[]
    for r in rules:
        if any(term and term in r['selector'] for term in selector_terms): matched.append(r)
    bodies=';'.join(r['body'] for r in matched)
    fs=px_value(bodies,'font-size') or 16
    mh=px_value(bodies,'min-height') or 0
    lh=px_value(bodies,'line-height')
    py=vertical_padding(bodies)
    est=max(mh,(lh if lh is not None else fs*1.2)+2*py)
    return {'rules':matched[:20],'fontPx':round(fs,2),'minHeightPx':round(mh,2),'verticalPaddingPx':round(py,2),'estimatedHeightPx':round(est,2)}


def tag_classes(tag):
    m=re.search(r'\bclass=["\']([^"\']+)["\']',tag,re.I)
    if not m:return []
    return sorted(set(c for c in re.split(r'\s+',m.group(1).strip()) if c and '${' not in c))


def interaction_evidence(path):
    html=Path(path).read_text(); rules=css_rules(path)
    hooks=['data-bfopt','data-bmopt','data-copt','data-smopt']
    rows=[]
    for hook in hooks:
        tags=re.findall(r'<[^<>]{0,900}\b'+re.escape(hook)+r'\b[^<>]{0,900}>',html,re.I)
        classes=sorted(set(c for t in tags for c in tag_classes(t)))
        terms=['['+hook+']']+['.'+c for c in classes]
        rows.append({'hook':hook,'occurrences':len(tags),'classes':classes,'sampleTags':tags[:4],'style':estimate(terms,rules)})
    # Static Subject B buttons that control start/back/next/review flow.
    static=[]
    for tag in re.findall(r'<button\b[^>]{0,1200}>',html,re.I):
        mid=re.search(r'\bid=["\']([^"\']+)["\']',tag,re.I)
        if not mid:continue
        ident=mid.group(1)
        if not re.search(r'^(?:b|sec|compound).*(?:start|next|prev|back|review|action|continue|submit|finish)',ident,re.I):continue
        classes=tag_classes(tag); terms=['#'+ident]+['.'+c for c in classes]
        static.append({'id':ident,'classes':classes,'tag':tag,'style':estimate(terms,rules)})
    static=sorted({x['id']:x for x in static}.values(),key=lambda x:x['id'])
    return {'hooks':rows,'staticButtons':static,'ruleCount':len(rules)}


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v267','v266'),'v267 audit expects v266 parent')
source=Path('audits/SUBJECT_B_PSEUDOCODE_MOBILE_READINESS_v266.txt'); req(source.exists(),'v266 mobile readiness audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v266 mobile readiness evidence drift')
expected={'.github/subject-b-mobile-answer-tap-audit/validate_audit.py','.github/workflows/subject-b-mobile-answer-tap-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v267 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
ce,pe=interaction_evidence('_site/index.html'),interaction_evidence('_site_parent/index.html')
req(cand['v']=='v267' and par['v']=='v266','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['finalOptions']==par['finalOptions'] and cand['exercisePredictionOptions']==par['exercisePredictionOptions'],'audit-only option-shape drift')
req(ce==pe,'audit-only interaction DOM/CSS drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')

findings=[]
missing=[x['hook'] for x in ce['hooks'] if x['occurrences']==0]
if missing: findings.append({'id':'subject_b_answer_hook_not_located','severity':'Medium','hooks':missing,'summary':'Expected Subject B answer hooks were not located in the built source, so tap sizing cannot be treated as verified.'})
weak=[]; tiny=[]; unstyled=[]
for x in ce['hooks']:
    if not x['occurrences']:continue
    e=x['style']
    if not e['rules']:unstyled.append(x['hook'])
    elif e['estimatedHeightPx']<40:weak.append({'target':x['hook'],'estimatedHeightPx':e['estimatedHeightPx'],'classes':x['classes']})
    if e['rules'] and e['fontPx']<14:tiny.append({'target':x['hook'],'fontPx':e['fontPx'],'classes':x['classes']})
for x in ce['staticButtons']:
    e=x['style']
    if e['rules'] and e['estimatedHeightPx']<40:weak.append({'target':'#'+x['id'],'estimatedHeightPx':e['estimatedHeightPx'],'classes':x['classes']})
    if e['rules'] and e['fontPx']<14:tiny.append({'target':'#'+x['id'],'fontPx':e['fontPx'],'classes':x['classes']})
if unstyled: findings.append({'id':'subject_b_answer_hook_has_no_direct_style_evidence','severity':'Low','hooks':unstyled,'summary':'Some answer hooks have no matching attribute/class rule in the static stylesheet evidence; browser-default/inherited sizing should not be assumed verified.'})
if weak: findings.append({'id':'subject_b_interactive_target_under_40px_estimate','severity':'Medium','targets':weak,'summary':'One or more Subject B answer/navigation controls have a CSS-estimated height below the 40px audit warning floor.'})
if tiny: findings.append({'id':'subject_b_interactive_text_under_14px','severity':'Low','targets':tiny,'summary':'One or more Subject B answer/navigation controls have a CSS-estimated font size below 14px.'})
result='PASS — NO FINDINGS' if not findings else 'PASS — FINDINGS RECORDED'
summary={'answerHooks':[{k:v for k,v in x.items() if k!='sampleTags'} for x in ce['hooks']],'staticButtonCount':len(ce['staticButtons']),'staticButtons':ce['staticButtons'],'cssRuleCount':ce['ruleCount'],'weakTargets':weak,'smallTextTargets':tiny,'unstyledHooks':unstyled,'allFinalItemsHaveFourOptions':all(x['n']==4 for x in cand['finalOptions'] if x['n'] is not None),'allTracePredictionsHaveFourOptions':all(all(n==4 for n in x['counts']) for x in cand['exercisePredictionOptions'])}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'findings':findings,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-mobile-answer-tap-v267.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

def hook_line(x):
    e=x['style']; return f"{x['hook']}: occurrences={x['occurrences']} / classes={x['classes']} / css-rules={len(e['rules'])} / font≈{e['fontPx']}px / min-height={e['minHeightPx']}px / estimated-height≈{e['estimatedHeightPx']}px"
find_txt='None.' if not findings else '\n'.join(f"{x['severity']} — {x['id']}: {x['summary']}" for x in findings)
audit=f'''FE QUEST v267 — Subject B Mobile Answer / Tap Readiness Audit
==================================================================

Result
------
{result}
Previous release: v266
Source main: {parent}
Learner-facing change in v267: none

Purpose
-------
v266 confirmed pseudocode width already has responsive handling. v267 audits the next phone-first interaction layer: the answer controls used by Subject B short practice/final modes and the static start/back/next/review buttons. This is a source/CSS readiness audit, not a claim of physical-device hit testing.

Answer-hook evidence
--------------------
{chr(10).join(hook_line(x) for x in ce['hooks'])}
Static Subject B flow buttons located: {summary['staticButtonCount']}
All final algorithm option arrays remain four-choice: {summary['allFinalItemsHaveFourOptions']}
All TRACE prediction checkpoints remain four-choice: {summary['allTracePredictionsHaveFourOptions']}

Findings
--------
{find_txt}

Interpretation
--------------
Estimated control height is derived from matching selector/class rules using explicit min-height, line-height/font-size and vertical padding. The 40px threshold is an audit warning floor rather than a browser measurement or a formal accessibility certification. Unlike the first v267 attempt, a missing answer hook is itself recorded as a finding instead of being allowed to produce a false green result.

Regression
----------
Answer-option shapes and Subject B final contract are unchanged from v266.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If concrete undersized targets are recorded, repair only their shared option/action style. If the static evidence is clean, move next to interaction sequence: redundant confirmations, backtracking friction and the number of taps needed to resume/finish practice.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_MOBILE_ANSWER_TAP_READINESS_v267.txt').write_text(audit); print(audit)
