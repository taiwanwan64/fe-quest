from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-mock-composition-discovery-audit-(v(\d+))',b);req(m,'bad v300 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def clip(s,n=1800):
    s=re.sub(r'\s+',' ',s).strip();return s[:n]
def source_contexts(js,pat,limit=12,span=520):
    out=[]
    for m in re.finditer(pat,js,re.I):
        a=max(0,m.start()-span);b=min(len(js),m.end()+span);x=clip(js[a:b],span*2)
        if x not in out:out.append(x)
        if len(out)>=limit:break
    return out
def runtime(path,names):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];name_json=json.dumps(names,ensure_ascii=False)
    tail=f'''
const __names={name_json};
const __out={{}};
for(const n of __names){{try{{const v=eval(n);if(typeof v==='function')__out[n]={{type:'function',source:String(v).slice(0,5000)}};else if(Array.isArray(v))__out[n]={{type:'array',length:v.length,sample:v.slice(0,3)}};else if(v&&typeof v==='object')__out[n]={{type:'object',keys:Object.keys(v).slice(0,40),value:Object.fromEntries(Object.entries(v).slice(0,20))}};else __out[n]={{type:typeof v,value:v}};}}catch(e){{__out[n]={{type:'unresolved',error:String(e)}};}}}}
console.log('__V300__'+Buffer.from(JSON.stringify({{v:APP_VERSION,bank:QUESTION_BANK.length,core:QUESTION_BANK.filter(q=>q&&q.coreTopicId).length,names:__out,sem:validateSubjectBSemantics()}})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V300__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v300','v299'),'expects v299')
source=Path('audits/SUBJECT_A_CHOICE_FEEDBACK_POST_DETAIL_v299.txt');req(source.exists() and 'PASS — POST-DETAIL EVIDENCE CAPTURED' in source.read_text(),'v299 evidence missing')
expected={'.github/subject-a-mock-composition-discovery-audit/validate_audit.py','.github/workflows/subject-a-mock-composition-discovery-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
js=scripts('_site/index.html')
# Discover likely Subject A mock/exam declarations before assuming implementation names.
decl=set(re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(',js))
decl.update(re.findall(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=',js))
name_candidates=sorted(n for n in decl if re.search(r'(mock|exam|quiz|test)',n,re.I))
# Also include functions whose body contains QUESTION_BANK and sampling/shuffling language.
fn_blocks=[]
for m in re.finditer(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{',js):
    name=m.group(1);start=m.start();chunk=js[start:start+8000]
    if 'QUESTION_BANK' in chunk and re.search(r'(shuffle|slice|random|filter|mock|exam)',chunk,re.I):fn_blocks.append(name)
name_candidates=sorted(set(name_candidates+fn_blocks))[:160]
cand=runtime('_site/index.html',name_candidates);par=runtime('_site_parent/index.html',name_candidates)
req(cand['v']=='v300' and par['v']=='v299','versions');req(cand['bank']==par['bank'] and cand['core']==par['core'],'bank drift');req(cand['core']==550,'Subject A core bank count drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
resolved={k:v for k,v in cand['names'].items() if v.get('type')!='unresolved'}
interesting={}
for k,v in resolved.items():
    src=str(v.get('source',''))
    score=sum(x in src for x in ['QUESTION_BANK','60','shuffle','slice','filter','Math.random'])
    if v.get('type')=='function' and score:interesting[k]={'score':score,'source':clip(src,2600)}
summary={'declarationCandidates':name_candidates,'resolvedCount':len(resolved),'resolvedTypes':{k:v.get('type') for k,v in resolved.items()},'likelyCompositionFunctions':interesting,'sourceContexts':{'subjectAMock':source_contexts(js,r'科目A.{0,12}模試|模試.{0,12}科目A',10),'sixtyQuestions':source_contexts(js,r'60\s*問|60\s*questions?',10),'questionBankSampling':source_contexts(js,r'QUESTION_BANK.{0,180}(?:shuffle|slice|random|filter)|(?:shuffle|slice|random|filter).{0,180}QUESTION_BANK',12)},'bankCount':cand['bank'],'coreCount':cand['core']}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — MOCK COMPOSITION IMPLEMENTATION DISCOVERED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-composition-discovery-v300.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v300 — Subject A Mock Composition Discovery Audit
=============================================================

Result
------
PASS — MOCK COMPOSITION IMPLEMENTATION DISCOVERED
Previous release: v299
Source main: {parent}
Learner-facing change in v300: none

Reference basis
---------------
The supplied 令和8年度 problem book contains the 令和7年度公開問題 for Subject A and four separate 精選模擬問題 Subject A sets. This supports treating a mock as a broad mixed-session check rather than a single-topic drill. The book does not establish an FE QUEST-specific chapter quota, so v300 first discovers the actual production mock builder and its current sampling rules before judging or changing them.

Purpose
-------
Locate the concrete Subject A mock/exam declarations in the built production app, identify functions that sample QUESTION_BANK, and capture source evidence for question count, shuffling/filtering and any explicit composition rules. This is intentionally discovery-only so later changes are based on the real implementation rather than guessed function names.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing content changed.
Subject A bank remains {cand['core']} core questions.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use the discovered production builder in the next audit to simulate many Subject A mock sessions and measure chapter/category/question-format concentration. Only add balancing logic if repeated sessions show a concrete narrowness problem; do not impose invented official quotas.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_COMPOSITION_DISCOVERY_v300.txt').write_text(audit);print(audit)
