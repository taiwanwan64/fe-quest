from pathlib import Path
import json, os, re, subprocess


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    b=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-adaptive-recommendation-hook-audit-(v(\d+))',b)
    req(m,'bad v256 audit branch');return m.group(1),f'v{int(m.group(2))-1}'


def extract_js(path):
    html=Path(path).read_text();return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))


def nearest_fn(js,pos):
    chunk=js[max(0,pos-24000):pos];hits=[]
    for pat in [r'function\s+([A-Za-z_$][\w$]*)\s*\(',r'([A-Za-z_$][\w$]*)\s*=\s*function\s*\(',r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>']:
        hits.extend((m.start(),m.group(1)) for m in re.finditer(pat,chunk))
    return max(hits)[1] if hits else '(unresolved)'


def compact(s,n=900):
    s=re.sub(r'\s+',' ',s).strip();return s[:n]+('…' if len(s)>n else '')


def evidence(js):
    terms=['学習分析','次に伸ば','伸ばす','弱点','苦手','おすすめ','推奨','準備度','科目B','復習']
    hits=[];seen=set()
    for term in terms:
        for m in re.finditer(re.escape(term),js):
            fn=nearest_fn(js,m.start());ctx=compact(js[max(0,m.start()-650):min(len(js),m.start()+1000)])
            key=(term,fn,ctx[:260])
            if key in seen:continue
            seen.add(key);hits.append({'term':term,'function':fn,'context':ctx})
    names=[]
    for pat in [r'function\s+([A-Za-z_$][\w$]*)\s*\(',r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>']:
        names.extend(m.group(1) for m in re.finditer(pat,js))
    likely=sorted({n for n in names if re.search(r'(?:analysis|analytics|insight|recommend|weak|progress|readiness|home|next|coach)',n,re.I)})
    ranked=sorted(hits,key=lambda x:(0 if re.search(r'(?:analysis|analytics|insight|recommend|weak|progress|readiness|home|next|coach)',x['function'],re.I) else 1,terms.index(x['term']),x['function']))
    return {'likelyFunctions':likely,'hits':ranked[:80],'counts':{t:sum(1 for x in hits if x['term']==t) for t in terms}}


version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v256','v255'),'v256 expects v255 parent')
source=Path('audits/SUBJECT_B_LOCAL_PERFORMANCE_POST_INSTRUMENTATION_AUDIT_v255.txt');req(source.exists(),'v255 evidence missing')
st=source.read_text();req('PASS — NO FINDINGS' in st and 'minimum-evidence thresholds' in st and 'recommendations' in st,'v255 handoff drift')
expected={'.github/subject-b-adaptive-recommendation-hook-audit/validate_audit.py','.github/workflows/subject-b-adaptive-recommendation-hook-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v256 audit-only source drift: '+repr(sorted(changed^expected)))
cand=evidence(extract_js('_site/index.html'));par=evidence(extract_js('_site_parent/index.html'));req(cand==par,'audit-only recommendation-hook evidence drift')
req(cand['hits'],'no learner-facing recommendation/analysis evidence found')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','likelyFunctions':cand['likelyFunctions'],'termCounts':cand['counts'],'hits':cand['hits']}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-adaptive-recommendation-hook-audit-v256.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
lines=[]
for i,x in enumerate(cand['hits'][:35],1):lines.append(f"[{i}] term={x['term']} / function={x['function']}\n    {x['context']}")
audit=f'''FE QUEST v256 — Subject B Adaptive Recommendation Hook Audit
===============================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v255
Source main: {parent}
Learner-facing change in v256: none

Purpose
-------
v255 closed the local performance instrumentation safety sequence. v256 locates existing learner-facing analysis/recommendation surfaces before any adaptive use of subjectBPerformanceV254, so the next change can extend one established surface rather than adding a competing dashboard or intrusive prompt.

Likely analysis / recommendation functions
------------------------------------------
{', '.join(cand['likelyFunctions']) if cand['likelyFunctions'] else 'none identified by function name'}

Term occurrence counts
----------------------
{json.dumps(cand['counts'],ensure_ascii=False,sort_keys=True)}

Source neighborhoods
--------------------
{chr(10).join(lines)}

Decision
--------
Choose the narrowest existing learner-facing analysis/recommendation function that already owns “what to do next” guidance. The next implementation should add only a conservative Subject B local-evidence hint when enough observations exist; otherwise render exactly the current guidance. Require a minimum sample before comparing authored difficulty/layer performance, prefer accuracy first and response time only as a secondary signal, never present personal timing as a new difficulty label, and keep scoring/readiness/exam behavior unchanged.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_ADAPTIVE_RECOMMENDATION_HOOK_AUDIT_v256.txt').write_text(audit);print(audit)
