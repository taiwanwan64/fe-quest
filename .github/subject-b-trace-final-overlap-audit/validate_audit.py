from pathlib import Path
import base64,difflib,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-b-trace-final-overlap-audit-(v(\d+))',b);req(m,'bad v277 branch');return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function lines(v){if(Array.isArray(v))return v.map(String);if(typeof v==='string')return v.split(/\r?\n/).filter(Boolean);return [];}
console.log('__V277__'+Buffer.from(JSON.stringify({v:APP_VERSION,trace:B_EXERCISES.map(x=>({id:x.id,title:String(x.title||''),code:lines(x.code)})),final:B_EXAM_ALGO_ITEMS.map(x=>({id:x.id,domain:String(x.domain||''),level:String(x.level||''),code:lines(x.code),q:String(x.q||x.prompt||'')})),banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),sec:hashText(stable(SECURITY_SCENARIOS))},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-8000:]);m=re.search(r'__V277__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

def norm(lines):
    s='\n'.join(lines).lower();s=re.sub(r'//.*','',s);s=re.sub(r'["\'][^"\']*["\']','STR',s);s=re.sub(r'\b\d+(?:\.\d+)?\b','NUM',s);s=re.sub(r'\s+',' ',s).strip();return s

def line_norm(lines):
    out=[]
    for x in lines:
        x=re.sub(r'//.*','',x.lower());x=re.sub(r'\b\d+(?:\.\d+)?\b','NUM',x);x=re.sub(r'\s+',' ',x).strip()
        if x:out.append(x)
    return out

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v277','v276'),'expects v276')
source=Path('audits/SUBJECT_B_SECURITY_OPTION_CUE_v276.txt');req(source.exists() and 'PASS — NO FINDINGS' in source.read_text(),'v276 closure missing')
expected={'.github/subject-b-trace-final-overlap-audit/validate_audit.py','.github/workflows/subject-b-trace-final-overlap-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v277' and par['v']=='v276','versions');req(cand['banks']==par['banks'] and cand['trace']==par['trace'] and cand['final']==par['final'],'content drift');req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
pairs=[]
for f in cand['final']:
    nf=norm(f['code']);lf=line_norm(f['code'])
    if not nf:continue
    for t in cand['trace']:
        nt=norm(t['code']);lt=line_norm(t['code'])
        if not nt:continue
        seq=difflib.SequenceMatcher(None,nf,nt).ratio();sf=set(lf);st=set(lt);jac=len(sf&st)/len(sf|st) if sf|st else 0
        pairs.append({'finalId':f['id'],'domain':f['domain'],'traceId':t['id'],'sequence':round(seq,3),'lineJaccard':round(jac,3),'finalLines':len(lf),'traceLines':len(lt),'exactNormalized':nf==nt})
pairs.sort(key=lambda x:(x['exactNormalized'],x['sequence'],x['lineJaccard']),reverse=True);exact=[x for x in pairs if x['exactNormalized']];strong=[x for x in pairs if not x['exactNormalized'] and min(x['finalLines'],x['traceLines'])>=5 and x['sequence']>=0.90 and x['lineJaccard']>=0.60]
findings=[]
if exact:findings.append({'id':'final_trace_exact_normalized_code_overlap','severity':'Medium','pairs':[(x['finalId'],x['traceId']) for x in exact],'summary':'A final algorithm item has code identical to a TRACE exercise after only literal/comment normalization.'})
if strong:findings.append({'id':'final_trace_strong_code_overlap','severity':'Low','pairs':[(x['finalId'],x['traceId'],x['sequence'],x['lineJaccard']) for x in strong],'summary':'One or more final items remain highly similar to a TRACE exercise after literal normalization, which may reduce unseen-transfer value.'})
result='PASS — NO FINDINGS' if not findings else 'PASS — FINDINGS RECORDED';top=pairs[:20]
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'exactPairs':exact,'strongPairs':strong,'topPairs':top,'findings':findings,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch');Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-trace-final-overlap-v277.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
top_txt='\n'.join(f"{x['finalId']} ↔ {x['traceId']}: sequence={x['sequence']} / lineJaccard={x['lineJaccard']} / lines={x['finalLines']}:{x['traceLines']} / exact={x['exactNormalized']}" for x in top);find_txt='None.' if not findings else '\n'.join(f"{x['severity']} — {x['id']}: {x['summary']}" for x in findings)
audit=f'''FE QUEST v277 — Subject B TRACE / Final Transfer-Overlap Audit
================================================================

Result
------
{result}
Previous release: v276
Source main: {parent}
Learner-facing change in v277: none

Purpose
-------
v275 found healthy boundary-state coverage and v276 found no systematic security-choice shortcut cue. v277 checks a different transfer risk: whether exam-like final algorithm items are so close to the guided TRACE exercises that a learner can recognize a memorized program instead of tracing an unfamiliar one.

Method
------
All 43 final algorithm code blocks are compared with all 20 TRACE exercise code blocks. Numeric literals and comments are normalized before comparison so simple value changes do not hide structural overlap. Two signals are recorded: whole-code SequenceMatcher similarity and normalized line-set Jaccard similarity. Exact normalized equality is a Medium finding; a non-exact pair is a Low finding only when both have at least five code lines, sequence similarity is at least 0.90, and line Jaccard is at least 0.60.

Top similarities
----------------
{top_txt}

Findings
--------
{find_txt}

Interpretation
--------------
Some similarity is pedagogically desirable: learners should meet familiar control structures and data structures. This audit flags only unusually close code reuse. A finding does not automatically mean the final item should be made obscure; the repair should preserve the same tested concept while changing the execution path, data shape, or state transition enough to require fresh tracing.

Regression
----------
All 20 TRACE exercises, 43 final algorithm items, and 15 security scenarios are unchanged from v276.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If exact or strong overlap is found, inspect only those pairs and repair the smallest high-value final item rather than expanding the bank indiscriminately. If no strong overlap appears, retain the current separation between guided TRACE learning and final transfer practice.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_TRACE_FINAL_OVERLAP_v277.txt').write_text(audit);print(audit)
