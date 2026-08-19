from pathlib import Path
import base64,difflib,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-trace-overlap-detail-audit-(v(\d+))',b)
    req(m,'bad v278 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function lines(v){if(Array.isArray(v))return v.map(String);if(typeof v==='string')return v.split(/\r?\n/).filter(Boolean);return [];}
const finalItem=B_EXAM_ALGO_ITEMS.find(x=>x.id==='bexam_arr_03');
const traceItem=B_EXERCISES.find(x=>x.id==='count_even');
const finalExam=makeFinalAlgoExam(finalItem);
const remediation=bFinalRemediationTarget(finalExam.studyMode,finalExam.sourceId,finalExam.domain);
const tracePred=(traceItem.steps||[]).filter(s=>s.predict).map(s=>s.predict);
console.log('__V278__'+Buffer.from(JSON.stringify({v:APP_VERSION,finalItem:{id:finalItem.id,domain:finalItem.domain,level:finalItem.level,format:finalItem.format,title:finalItem.title||'',context:finalItem.context||'',code:lines(finalItem.code),data:finalItem.data||[],q:finalItem.q||'',options:finalItem.options||[],a:finalItem.a,explain:finalItem.explain||''},traceItem:{id:traceItem.id,title:traceItem.title||'',desc:traceItem.desc||'',code:lines(traceItem.code),predictions:tracePred},remediation,banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),sec:hashText(stable(SECURITY_SCENARIOS))},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-8000:])
        m=re.search(r'__V278__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing')
        return json.loads(base64.b64decode(m.group(1)))

def norm(lines):
    s='\n'.join(lines).lower();s=re.sub(r'//.*','',s);s=re.sub(r'["\'][^"\']*["\']','STR',s);s=re.sub(r'\b\d+(?:\.\d+)?\b','NUM',s);s=re.sub(r'\s+',' ',s).strip();return s

def line_norm(lines):
    out=[]
    for x in lines:
        x=re.sub(r'//.*','',x.lower());x=re.sub(r'\b\d+(?:\.\d+)?\b','NUM',x);x=re.sub(r'\s+',' ',x).strip()
        if x:out.append(x)
    return out

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v278','v277'),'expects v277')
source=Path('audits/SUBJECT_B_TRACE_FINAL_OVERLAP_v277.txt');req(source.exists() and 'PASS — FINDINGS RECORDED' in source.read_text() and 'bexam_arr_03 ↔ count_even' in source.read_text(),'v277 overlap evidence missing')
expected={'.github/subject-b-trace-overlap-detail-audit/validate_audit.py','.github/workflows/subject-b-trace-overlap-detail-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v278' and par['v']=='v277','versions');req(cand['banks']==par['banks'],'bank drift');req(cand['finalItem']==par['finalItem'] and cand['traceItem']==par['traceItem'] and cand['remediation']==par['remediation'],'detail drift');req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
f,t=cand['finalItem'],cand['traceItem'];nf,nt=norm(f['code']),norm(t['code']);lf,lt=line_norm(f['code']),line_norm(t['code']);seq=difflib.SequenceMatcher(None,nf,nt).ratio();sf,st=set(lf),set(lt);jac=len(sf&st)/len(sf|st) if sf|st else 0
req(round(seq,3)==0.932 and round(jac,3)==0.778,'v277 pair metric drift')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','pair':{'sequence':round(seq,3),'lineJaccard':round(jac,3),'final':f,'trace':t,'remediation':cand['remediation']},'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-trace-overlap-detail-v278.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
def numbered(lines): return '\n'.join(f'{i+1:02d}: {x}' for i,x in enumerate(lines))
pred='\n'.join(f"P{i+1}: {p.get('q','')} | correct={p.get('opts',[None]*4)[p.get('a',0)]}" for i,p in enumerate(t['predictions']))
audit=f'''FE QUEST v278 — Subject B TRACE / Final Strong-Overlap Detail Audit
=====================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v277
Source main: {parent}
Learner-facing change in v278: none

Target pair
-----------
Final: {f['id']} / {f['domain']} / {f['level']} / {f['format']} / {f['title']}
TRACE: {t['id']} / {t['title']}
Normalized sequence similarity: {round(seq,3)}
Normalized line Jaccard: {round(jac,3)}
Current remediation destination from the final item: {json.dumps(cand['remediation'],ensure_ascii=False)}

Final item code
---------------
{numbered(f['code'])}

Final item prompt / options
---------------------------
Context: {f['context']}
Question: {f['q']}
Options: {json.dumps(f['options'],ensure_ascii=False)}
Correct: {f['options'][f['a']]}
Explanation: {f['explain']}

TRACE exercise code
-------------------
{numbered(t['code'])}

TRACE prediction checkpoints
----------------------------
{pred}

Interpretation
--------------
The v277 Low finding is real and localized. This detail capture exists so the repair can change the final item's execution path rather than merely substitute literals. The repair should preserve the same one-dimensional-array / conditional-accumulation learning objective and current remediation domain while introducing a genuinely different state transition, such as accumulating a value derived from qualifying elements instead of incrementing a counter. It must not copy any attached-book proprietary problem text.

Repair boundary for v279
------------------------
Repair only bexam_arr_03. Keep its id, domain, level and answer-position contract unless a validated content release deliberately updates the contract. Preserve the 43-item final algorithm pool, 15 high-TRACE inventory, high-TRACE floor 4, selection policy, remediation mapping, scoring and timing. After repair, rerun the all-43-by-20 normalized overlap audit and require no exact or strong pair at the v277 thresholds.

Regression
----------
All learner-facing content is unchanged from v277.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_TRACE_OVERLAP_DETAIL_v278.txt').write_text(audit);print(audit)
