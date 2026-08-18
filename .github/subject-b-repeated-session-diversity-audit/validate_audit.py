from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-repeated-session-diversity-audit-(v(\d+))',branch)
    req(m,'bad Subject B repeated-session diversity audit branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function levels(){return SECURITY_SCENARIOS.reduce((m,x)=>{const k=x.level||'unknown';m[k]=(m[k]||0)+1;return m;},{});}
function securityIds(){return SECURITY_SCENARIOS.map(x=>({id:x.id,level:x.level}));}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function mark(stats,key,day){const s=stats[key]||(stats[key]={seen:0,correct:0,lastSeen:''});s.seen=(s.seen||0)+1;s.lastSeen=`2026-10-${String(day).padStart(2,'0')}`;}
function simulate(keyStyle,sessions=6,seed=0x238777){
  profile.bFinalStats={};
  const seen=new Set(),rows=[];
  for(let s=0;s<sessions;s++){
    Math.random=seedRand((seed+s*104729)>>>0);
    const items=buildBFinal(),sec=items.filter(x=>x.kind==='security'),ids=sec.map(x=>x.sourceId),lv=sec.reduce((m,x)=>(m[x.level]=(m[x.level]||0)+1,m),{});
    ids.forEach(id=>{seen.add(id);mark(profile.bFinalStats,keyStyle==='prefixed'?`sec:${id}`:id,s+1);});
    rows.push({ids,levels:lv,coverage:seen.size});
  }
  return rows;
}
function cohorts(style){const out=[];for(let i=0;i<100;i++)out.push(simulate(style,6,(0x238000+i)>>>0));return {all15By5:out.filter(x=>x[4].coverage===SECURITY_SCENARIOS.length).length,all15By6:out.filter(x=>x[5].coverage===SECURITY_SCENARIOS.length).length,example:out[0]};}
const baseSource=(typeof __buildBFinalBeforeV208==='function')?String(__buildBFinalBeforeV208):null;
const algoSeenSource=(typeof bFinalAlgoSeen==='function')?String(bFinalAlgoSeen):null;
const finishSource=(typeof finishBFinal==='function')?String(finishBFinal):null;
console.log('__V238__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,levels:levels(),security:securityIds(),
  sources:{baseBuild:baseSource,currentBuild:String(buildBFinal),algoSeen:algoSeenSource,finish:finishSource,makeSecurity:String(makeFinalSecurity)},
  prefixed:cohorts('prefixed'),plain:cohorts('plain'),
  sem:validateSubjectBSemantics(),counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,highCount:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V238__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v238' and previous=='v237','v238 diagnosis expects v237 parent')
expected={'.github/subject-b-repeated-session-diversity-audit/validate_audit.py'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v238 audit-only source drift: '+repr(sorted(changed^expected)))

cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['levels']==par['levels'] and cand['security']==par['security'],'audit-only security inventory drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(cand['counts']==[20,16,4] and cand['seconds']==6000 and cand['pool']==43 and cand['highCount']==15 and cand['floor']==4,'final contract drift')

levels=cand['levels']; src=cand['sources']; pref=cand['prefixed']; plain=cand['plain']
source_blob='\n'.join(x or '' for x in src.values())
uses_prefixed='sec:' in source_blob
uses_stats='bFinalStats' in source_blob
fixed_level_quota=bool(re.search(r'(基礎|標準)',src['baseBuild'] or ''))

audit=f'''FE QUEST {version} — Subject B Final Security Rotation Diagnosis Audit
=====================================================================

Result
------
PASS — DIAGNOSIS RECORDED
Previous release: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Security inventory
------------------
Scenario count: {len(cand['security'])}
Level counts: {json.dumps(levels,ensure_ascii=False,sort_keys=True)}
Scenario inventory: {json.dumps(cand['security'],ensure_ascii=False)}

Selector / persistence diagnosis
--------------------------------
Baseline final selector source available: {'yes' if src['baseBuild'] else 'no'}
finishBFinal source available: {'yes' if src['finish'] else 'no'}
Selector-related source contains bFinalStats: {'yes' if uses_stats else 'no'}
Selector-related source contains literal sec: key prefix: {'yes' if uses_prefixed else 'no'}
Baseline selector contains explicit Japanese level label: {'yes' if fixed_level_quota else 'no'}

Six-session simulation using v237 prefixed stat keys (sec:<id>)
--------------------------------------------------------------
All 15 covered by session 5: {pref['all15By5']} / 100
All 15 covered by session 6: {pref['all15By6']} / 100
Example cohort: {json.dumps(pref['example'],ensure_ascii=False)}

Six-session simulation using plain scenario-id stat keys
---------------------------------------------------------
All 15 covered by session 5: {plain['all15By5']} / 100
All 15 covered by session 6: {plain['all15By6']} / 100
Example cohort: {json.dumps(plain['example'],ensure_ascii=False)}

Relevant runtime source
-----------------------
__buildBFinalBeforeV208:
{src['baseBuild'] or '(unavailable)'}

bFinalAlgoSeen:
{src['algoSeen'] or '(unavailable)'}

finishBFinal:
{src['finish'] or '(unavailable)'}

Decision
--------
Use the exact selector and persistence source above to distinguish a real production rotation constraint from a v237 audit-key artifact before changing learner-facing selection. If the gap is structural, repair only the security rotation boundary and preserve four security questions, algorithm selection/order, scoring, difficulty labels, readiness threshold and remediation.
'''
Path('audits').mkdir(exist_ok=True)
Path(f'audits/SUBJECT_B_FINAL_SECURITY_ROTATION_DIAGNOSIS_AUDIT_{version}.txt').write_text(audit)
Path('_regression').mkdir(exist_ok=True)
Path(f'_regression/subject-b-final-security-rotation-diagnosis-audit-{version}.fixture.json').write_text(json.dumps({'version':version,'previous':previous,'parent':parent,'levels':levels,'prefixed':pref,'plain':plain,'sources':src},ensure_ascii=False,indent=2))
print(audit)
