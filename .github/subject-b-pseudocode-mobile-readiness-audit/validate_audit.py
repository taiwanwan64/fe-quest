from pathlib import Path
import base64, json, os, re, runpy, statistics, subprocess, tempfile, unicodedata


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-pseudocode-mobile-readiness-audit-(v(\d+))',branch)
    req(m is not None,'bad v266 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def scripts(path):
    html=Path(path).read_text(); return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function lines(v){return Array.isArray(v)?v.map(String):typeof v==='string'?v.split(/\r?\n/).filter(Boolean):[];}
function row(id,kind,high,code){const xs=lines(code);return {id,kind,highTrace:!!high,lines:xs,maxChars:xs.reduce((m,s)=>Math.max(m,s.length),0),totalChars:xs.reduce((n,s)=>n+s.length,0)};}
const traceRows=B_EXERCISES.map(x=>row(x.id,'trace',false,x.code));
const high=new Set(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]);
const finalRows=B_EXAM_ALGO_ITEMS.map(x=>row(x.id,'final',high.has(x.id),x.code));
const funcs={};
for(const name of ['startBExercise','renderBFinalQuestion','renderBMockQuestion','renderCompoundQuestion']){try{const f=eval(name);funcs[name]=typeof f==='function'?String(f):null;}catch(e){funcs[name]=null;}}
console.log('__V266__'+Buffer.from(JSON.stringify({v:APP_VERSION,traceRows,finalRows,funcs,contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V266__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))


def display_units(s):
    total=0
    for ch in str(s):
        if ch=='\t': total+=4
        else: total+=2 if unicodedata.east_asian_width(ch) in ('W','F','A') else 1
    return total


def css_evidence(path):
    html=Path(path).read_text()
    styles='\n'.join(re.findall(r'<style(?:\s[^>]*)?>(.*?)</style>',html,re.S|re.I))
    rules=[]
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}',styles,re.S):
        selector=re.sub(r'\s+',' ',m.group(1)).strip(); body=re.sub(r'\s+',' ',m.group(2)).strip()
        if re.search(r'code|b-final|bfinal|b-lab|trace|pseudo',selector,re.I) or re.search(r'code|b-final|bfinal|b-lab|trace|pseudo',body,re.I):
            rules.append({'selector':selector[-500:],'body':body[:1200]})
    relevant='\n'.join(r['selector']+'{'+r['body']+'}' for r in rules)
    support={
      'overflowX':bool(re.search(r'overflow-x\s*:\s*(auto|scroll)',relevant,re.I)),
      'wrapPolicy':bool(re.search(r'white-space\s*:\s*(pre-wrap|normal|break-spaces)|overflow-wrap\s*:|word-break\s*:',relevant,re.I)),
      'nowrap':bool(re.search(r'white-space\s*:\s*(pre|nowrap)',relevant,re.I)),
      'smallFontRules':[]
    }
    for r in rules:
        for n,u in re.findall(r'font-size\s*:\s*([0-9.]+)\s*(px|rem|em)',r['body'],re.I):
            val=float(n); px=val if u.lower()=='px' else val*16
            if px<12: support['smallFontRules'].append({'selector':r['selector'],'value':n+u})
    ids={}
    for target in ['bCode','bFinalCode','bMockCode','compoundCode']:
        m=re.search(r'<[^>]*\bid=["\']'+re.escape(target)+r'["\'][^>]*>',html,re.I)
        if m: ids[target]=m.group(0)
    media=[]
    for m in re.finditer(r'@media\s*([^\{]+)\{',styles,re.I):
        chunk=styles[m.start():min(len(styles),m.start()+5000)]
        if re.search(r'code|b-final|b-lab|b-code',chunk,re.I): media.append(re.sub(r'\s+',' ',chunk[:1800]))
    return {'rules':rules[:80],'support':support,'ids':ids,'media':media[:20]}

version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v266','v265'),'v266 audit expects v265 parent')
source=Path('audits/SUBJECT_B_TRANSFER_RETRACE_EXPANSION_POST_AUDIT_v265.txt'); req(source.exists(),'v265 closure audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v265 closure evidence drift')
expected={'.github/subject-b-pseudocode-mobile-readiness-audit/validate_audit.py','.github/workflows/subject-b-pseudocode-mobile-readiness-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v266 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html'); css=css_evidence('_site/index.html'); pcss=css_evidence('_site_parent/index.html')
req(cand['v']=='v266' and par['v']=='v265','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['traceRows']==par['traceRows'] and cand['finalRows']==par['finalRows'] and cand['funcs']==par['funcs'],'audit-only Subject B source drift')
req(css==pcss,'audit-only pseudocode CSS/DOM drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')

all_rows=[]
for r in cand['traceRows']+cand['finalRows']:
    rr=dict(r); xs=rr.pop('lines'); rr['maxDisplayUnits']=max([display_units(x) for x in xs] or [0]); rr['longestLine']=max(xs,key=display_units) if xs else ''; all_rows.append(rr)
trace=[r for r in all_rows if r['kind']=='trace']; final=[r for r in all_rows if r['kind']=='final']; high=[r for r in final if r['highTrace']]
longest=sorted(all_rows,key=lambda r:(-r['maxDisplayUnits'],-r['maxChars'],r['id']))[:12]

def med(rows,key): return statistics.median([r[key] for r in rows]) if rows else 0
summary={
 'traceCount':len(trace),'finalCount':len(final),'highTraceCount':len(high),
 'traceMaxDisplayUnits':max(r['maxDisplayUnits'] for r in trace),'finalMaxDisplayUnits':max(r['maxDisplayUnits'] for r in final),'highTraceMaxDisplayUnits':max(r['maxDisplayUnits'] for r in high),
 'traceMedianMaxDisplayUnits':med(trace,'maxDisplayUnits'),'finalMedianMaxDisplayUnits':med(final,'maxDisplayUnits'),'highTraceMedianMaxDisplayUnits':med(high,'maxDisplayUnits'),
 'rowsOver48Units':sum(1 for r in all_rows if r['maxDisplayUnits']>48),'rowsOver64Units':sum(1 for r in all_rows if r['maxDisplayUnits']>64),
 'cssRuleCount':len(css['rules']),'overflowXSupport':css['support']['overflowX'],'wrapPolicy':css['support']['wrapPolicy'],'nowrapPresent':css['support']['nowrap'],'smallFontRules':css['support']['smallFontRules'],
 'domTargets':css['ids'],'mobileMediaEvidenceCount':len(css['media'])
}
long_risk=max(summary['finalMaxDisplayUnits'],summary['traceMaxDisplayUnits'])>48
no_adaptation=not (summary['overflowXSupport'] or summary['wrapPolicy'])
small_font=bool(summary['smallFontRules'])
findings=[]
if long_risk and no_adaptation: findings.append({'id':'pseudocode_mobile_width_policy_missing','severity':'Medium','summary':'Long pseudocode lines exist, but no code-related horizontal-scroll or wrap policy was detected in the built stylesheet.'})
if small_font: findings.append({'id':'pseudocode_sub12px_rule','severity':'Low','summary':'At least one code-related CSS rule uses an estimated font size below 12px.'})
result='PASS — NO FINDINGS' if not findings else 'PASS — FINDINGS RECORDED'
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'longestRows':longest,'cssEvidence':css,'rendererFunctions':cand['funcs'],'findings':findings,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-pseudocode-mobile-readiness-v266.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

def fmt(r): return f"{r['kind']} | {r['id']} | high={r['highTrace']} | max={r['maxDisplayUnits']} display units / {r['maxChars']} chars | {r['longestLine']}"
find_txt='None.' if not findings else '\n'.join(f"{x['severity']} — {x['id']}: {x['summary']}" for x in findings)
audit=f'''FE QUEST v266 — Subject B Pseudocode Mobile Readiness Audit
=================================================================

Result
------
{result}
Previous release: v265
Source main: {parent}
Learner-facing change in v266: none

Purpose
-------
v265 closed the alternate-value re-trace sequence. v266 moves to a broader learner-facing frontier: whether increasingly realistic pseudocode remains readable in the phone-first PWA. This is a static/responsive readiness audit, not a claim of physical-device visual testing.

Content width inventory
-----------------------
TRACE exercises: {summary['traceCount']}
Final algorithm items: {summary['finalCount']}
High-TRACE final items: {summary['highTraceCount']}
TRACE max line width: {summary['traceMaxDisplayUnits']} display units; median per-item maximum: {summary['traceMedianMaxDisplayUnits']}
Final max line width: {summary['finalMaxDisplayUnits']} display units; median per-item maximum: {summary['finalMedianMaxDisplayUnits']}
High-TRACE final max line width: {summary['highTraceMaxDisplayUnits']} display units; median per-item maximum: {summary['highTraceMedianMaxDisplayUnits']}
Items with a line over 48 display units: {summary['rowsOver48Units']}
Items with a line over 64 display units: {summary['rowsOver64Units']}

Longest code lines
------------------
{chr(10).join(fmt(r) for r in longest)}

Responsive code-style evidence
------------------------------
Relevant code/mobile CSS rules captured: {summary['cssRuleCount']}
Detected code-related overflow-x auto/scroll policy: {summary['overflowXSupport']}
Detected code-related wrapping policy: {summary['wrapPolicy']}
Detected code-related pre/nowrap usage: {summary['nowrapPresent']}
Detected code-related sub-12px font rules: {json.dumps(summary['smallFontRules'],ensure_ascii=False)}
Detected code target tags: {json.dumps(summary['domTargets'],ensure_ascii=False)}
Mobile media-query evidence chunks mentioning code/Subject B: {summary['mobileMediaEvidenceCount']}

Findings
--------
{find_txt}

Interpretation
--------------
Display units count full-width Japanese characters approximately twice an ASCII character. They are a content-width signal, not a pixel-perfect browser measurement. The audit deliberately accepts either horizontal scrolling or safe wrapping as a responsive policy, and separately flags very small code text. Exact selectors, CSS bodies, renderer sources and the longest-line inventory are preserved in the regression fixture so a follow-up can repair only the demonstrated bottleneck.

Regression
----------
All TRACE/final algorithm content and renderer function sources are unchanged from v265.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use the captured CSS and line-width evidence for the next step. If the responsive policy is already adequate, do not redesign the code viewer solely because lines are long; instead audit real interaction density/tap flow. If width adaptation is missing or code text is too small, make a narrowly scoped mobile pseudocode readability repair before adding more complex Subject B content.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_PSEUDOCODE_MOBILE_READINESS_v266.txt').write_text(audit); print(audit)
