from pathlib import Path
import json, os, runpy, traceback

p=Path('.github/subject-b-final-security-rotation-repair/validate_repair.py')
t=p.read_text()
old="  '.github/workflows/subject-b-final-security-rotation-repair.yml'\n}"
new="  '.github/workflows/subject-b-final-security-rotation-repair.yml',\n  '.github/subject-b-trace-final-feedback-propagation-repair/validate_repair.py'\n}"
if old not in t:
    raise SystemExit('v239 alias expected-set patch marker missing')
t=t.replace(old,new,1)

old="    Math.random=seedRand((seed+s*104729)>>>0);const items=buildBFinal(),sec=secSummary(items);"
new="    const q=globalThis.subjectBFinalSecurityQuotaV239?subjectBFinalSecurityQuotaV239():null;Math.random=seedRand((seed+s*104729)>>>0);const items=buildBFinal(),sec=secSummary(items);"
if old not in t:
    raise SystemExit('v239 cohort quota probe marker missing')
t=t.replace(old,new,1)

old="    rows.push({coverage:seen.size,logs:sec.logs,cases:sec.cases,ids:sec.ids,unique:sec.unique,block:items.slice(0,16).every(x=>x.kind==='algo')&&items.slice(16).every(x=>x.kind==='security')});"
new="    rows.push({coverage:seen.size,logs:sec.logs,cases:sec.cases,ids:sec.ids,unique:sec.unique,quota:q,block:items.slice(0,16).every(x=>x.kind==='algo')&&items.slice(16).every(x=>x.kind==='security')});"
if old not in t:
    raise SystemExit('v239 cohort row probe marker missing')
t=t.replace(old,new,1)

needle="req(par['rotation']['all15By5']==0,'parent v238 gap not reproduced')"
insert="Path('audits/V239_QUOTA_DIAGNOSTIC.json').write_text(json.dumps({'inventory':cand.get('inventory'),'candidateRotation':cand.get('rotation'),'parentRotation':par.get('rotation'),'spec':cand.get('spec'),'wrapperSource':cand.get('wrapperSource'),'buildReadOnly':cand.get('buildReadOnly')},ensure_ascii=False,indent=2)+'\\n'); "+needle
if needle not in t:
    raise SystemExit('v239 diagnostic write marker missing')
t=t.replace(needle,insert,1)

p.write_text(t)
os.environ['GITHUB_REF_NAME']='subject-b-final-security-rotation-repair-v239'
try:
    runpy.run_path(str(p),run_name='__main__')
except Exception:
    detail=traceback.format_exc()
    Path('audits').mkdir(exist_ok=True)
    Path('audits/V239_VALIDATION_DIAGNOSTIC.txt').write_text(detail)
    print(detail)
    print('V239_DIAGNOSTIC_CAPTURED')
