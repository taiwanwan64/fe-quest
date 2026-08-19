from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-remediation-difficulty-detail-audit-(v(\d+))',branch)
    req(m,'bad Subject B remediation difficulty detail audit branch')
    return m.group(1),f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function tx(v){return String(v??'').trim();}
function rank(v){return ({'基礎':1,'標準':2,'応用':3})[tx(v)]||0;}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
const traceById=Object.fromEntries(B_EXERCISES.map(x=>[x.id,x]));
const sourceById=Object.fromEntries(B_EXAM_ALGO_ITEMS.map(x=>[x.id,x]));
const rows=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam).map(x=>{
  const src=sourceById[x.sourceId],t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain),ex=traceById[t?.id];
  const finalLevel=tx(src?.level),targetLevel=tx(ex?.level);
  return {id:x.sourceId,title:tx(src?.title),domain:tx(src?.domain),format:tx(src?.format),studyMode:tx(x.studyMode),finalLevel,targetMode:t?.mode||null,targetId:t?.id||null,targetLevel,targetConcept:tx(ex?.concept),delta:rank(finalLevel)-rank(targetLevel)};
});
const harder=rows.filter(x=>x.targetMode==='trace'&&x.targetId&&x.targetLevel&&x.delta<0);
const inventory=B_EXERCISES.map(x=>({id:x.id,level:tx(x.level),concept:tx(x.concept),title:tx(x.title||x.name||x.desc).slice(0,80)}));
console.log('__V248__'+Buffer.from(JSON.stringify({v:APP_VERSION,rows,harder,inventory,hashes:{ex:hashJson(B_EXERCISES),algo:hashJson(B_EXAM_ALGO_ITEMS)},sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V248__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v248','v247'),'v248 audit expects v247 parent')
source=Path('audits/SUBJECT_B_DIFFICULTY_PRACTICE_CALIBRATION_AUDIT_v247.txt')
req(source.exists(),'v247 evidence missing')
st=source.read_text();req('subject_b_remediation_target_harder_than_final_label' in st and '6 final items' in st,'v247 calibration finding drift')
expected={'.github/subject-b-remediation-difficulty-detail-audit/validate_audit.py','.github/workflows/subject-b-remediation-difficulty-detail-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v248 audit-only source drift: '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v248' and par['v']=='v247','runtime versions')
req(cand['hashes']==par['hashes'],'audit-only bank drift')
req(cand['rows']==par['rows'] and cand['inventory']==par['inventory'],'audit-only calibration topology drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
req(len(cand['harder'])==6,'v247 finding count drift')

harder=cand['harder']; inventory=cand['inventory']
by_level={k:[x for x in inventory if x['level']==k] for k in ['基礎','標準','応用']}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','harder':harder,'traceInventory':inventory,'traceLevelCounts':{k:len(v) for k,v in by_level.items()},'semanticOK':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-remediation-difficulty-detail-audit-v248.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
harder_text='\n'.join(f"- {x['id']} / {x['domain']} / {x['title']} — final={x['finalLevel']} -> TRACE {x['targetId']} ({x['targetConcept']}, {x['targetLevel']}); studyMode={x['studyMode']}" for x in harder)
inv_text='\n'.join(f"- {x['id']}: {x['level']} / {x['concept']}" for x in inventory)
audit=f'''FE QUEST v248 — Subject B Remediation Difficulty Detail Audit
================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v247
Source main: {parent}
Learner-facing change in v248: none

Purpose
-------
v247 found six final algorithm items whose default recovery route points to a TRACE exercise carrying a harder static label. v248 does not change learner behavior. It records the exact affected items and the complete TRACE exercise inventory so the next repair can be narrow and evidence-based rather than relabeling or rerouting broadly.

Affected final→TRACE rows
-------------------------
{harder_text}

TRACE exercise inventory
------------------------
{inv_text}

Regression
----------
TRACE and final-algorithm bank hashes vs v247: identical.
All 43 final→TRACE topology rows vs v247: identical.
Subject B semantic diagnostics: OK.

Decision
--------
Use the affected rows and TRACE inventory to choose the narrowest repair. Prefer a same-domain target at the same or easier authored level when one exists. Do not change final selection, scoring, timing, readiness, or difficulty labels merely to make the labels line up. If no same-domain same/easier target exists for an affected row, keep the route and treat the cross-layer label comparison as non-equivalent rather than forcing a misleading relabel.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_REMEDIATION_DIFFICULTY_DETAIL_AUDIT_v248.txt').write_text(audit);print(audit)
