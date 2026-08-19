from pathlib import Path
import base64,difflib,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-trace-overlap-post-audit-(v(\d+))',b);req(m,'bad v280 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function lines(v){if(Array.isArray(v))return v.map(String);if(typeof v==='string')return v.split(/\r?\n/).filter(Boolean);return [];}
function item(x){return {id:x.id,domain:x.domain||'',level:x.level||'',format:x.format||'',title:x.title||'',context:x.context||'',code:lines(x.code),q:x.q||x.prompt||'',options:x.options||[],a:x.a,explain:x.explain||''};}
function sig(){const rows=[];for(let i=0;i<3000;i++){profile.bFinalStats={};Math.random=seedRand((0x280000+i)>>>0);rows.push(buildBFinal().map(x=>[x.kind,x.sourceId]));}return hashText(JSON.stringify(rows));}
const target=B_EXAM_ALGO_ITEMS.find(x=>x.id==='bexam_arr_03');const exam=makeFinalAlgoExam(target);const remediation=bFinalRemediationTarget(exam.studyMode,exam.sourceId,exam.domain);
console.log('__V280__'+Buffer.from(JSON.stringify({v:APP_VERSION,target:item(target),items:B_EXAM_ALGO_ITEMS.map(item),trace:B_EXERCISES.map(x=>({id:x.id,code:lines(x.code)})),remediation,selectionSig:sig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime '+z.stderr[-7000:]);m=re.search(r'__V280__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

def norm(lines):
    s='\n'.join(lines).lower();s=re.sub(r'//.*','',s);s=re.sub(r'["\'][^"\']*["\']','STR',s);s=re.sub(r'\b\d+(?:\.\d+)?\b','NUM',s);return re.sub(r'\s+',' ',s).strip()
def lnorm(lines):
    out=[]
    for x in lines:
        x=re.sub(r'//.*','',x.lower());x=re.sub(r'\b\d+(?:\.\d+)?\b','NUM',x);x=re.sub(r'\s+',' ',x).strip()
        if x:out.append(x)
    return out
def scan(rt):
    exact=[];strong=[];top=[]
    for f in rt['items']:
        nf=norm(f['code']);lf=lnorm(f['code'])
        if not nf: continue
        for t in rt['trace']:
            nt=norm(t['code']);lt=lnorm(t['code'])
            if not nt: continue
            seq=difflib.SequenceMatcher(None,nf,nt).ratio();sf,st=set(lf),set(lt);jac=len(sf&st)/len(sf|st) if sf|st else 0;row={'finalId':f['id'],'traceId':t['id'],'sequence':round(seq,3),'lineJaccard':round(jac,3),'finalLines':len(lf),'traceLines':len(lt)}
            if nf==nt: exact.append(row)
            elif min(len(lf),len(lt))>=5 and seq>=.90 and jac>=.60: strong.append(row)
            top.append(row)
    top.sort(key=lambda x:(x['sequence'],x['lineJaccard']),reverse=True);return exact,strong,top[:20]

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v280','v279'),'expects v279')
source=Path('audits/SUBJECT_B_TRACE_OVERLAP_REPAIR_v279.txt');req(source.exists() and 'PASS — NO FINDINGS' in source.read_text() and 'Strong overlap pairs at v277 thresholds across all 43×20 comparisons: 0' in source.read_text(),'v279 repair evidence missing')
expected={'.github/subject-b-trace-overlap-post-audit/validate_audit.py','.github/workflows/subject-b-trace-overlap-post-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v280' and par['v']=='v279','versions');req(cand['items']==par['items'] and cand['trace']==par['trace'],'audit-only content drift');req(cand['remediation']==par['remediation'],'remediation drift');req(cand['selectionSig']==par['selectionSig'],'3000-seed selection/order drift');req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
t=cand['target'];req(t['id']=='bexam_arr_03' and t['title']=='隣接差の正の増加量を累積' and t['a']==2 and t['options'][2]=='2回, score=7' and '0→3→7' in t['explain'],'repaired item drift')
exact,strong,top=scan(cand);req(not exact and not strong,'post-repair overlap regression')
trace=next(x for x in cand['trace'] if x['id']=='count_even');nf,nt=norm(t['code']),norm(trace['code']);lf,lt=lnorm(t['code']),lnorm(trace['code']);seq=difflib.SequenceMatcher(None,nf,nt).ratio();jac=len(set(lf)&set(lt))/len(set(lf)|set(lt));req(round(seq,3)==0.772 and round(jac,3)==0.308,'repaired pair metric drift')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','target':'bexam_arr_03','repairedPair':{'traceId':'count_even','sequence':round(seq,3),'lineJaccard':round(jac,3)},'exactPairs':exact,'strongPairs':strong,'topPairs':top,'selectionSignatureMatch3000':True,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-trace-overlap-post-v280.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v280 — Subject B TRACE / Final Transfer-Overlap Post-Repair Audit
============================================================================

Result
------
PASS — NO FINDINGS
Previous release: v279
Source main: {parent}
Learner-facing change in v280: none

Post-repair verification
------------------------
v279 repaired only bexam_arr_03. The repaired adjacent-difference / positive-difference accumulation path remains present with correct answer “2回, score=7” and the explanation still traces score as 0→3→7.

Overlap regression
------------------
Repaired bexam_arr_03 ↔ count_even sequence similarity: {round(seq,3)}
Repaired bexam_arr_03 ↔ count_even line Jaccard: {round(jac,3)}
Exact normalized pairs across all 43×20 final/TRACE comparisons: 0
Strong pairs at the v277 threshold: 0

Preservation
------------
All 43 final algorithm items and all 20 TRACE exercises are byte-behavior equivalent to v279.
Remediation mapping is unchanged.
3000 deterministic final builds preserve source-id selection and order.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Close the TRACE/final transfer-overlap sequence. The guided TRACE layer may intentionally teach familiar control structures, but final practice no longer contains a pair above the conservative strong-overlap threshold. Move to the next evidence-backed learner-facing quality frontier rather than rewriting structurally similar problems without a concrete signal.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_TRACE_OVERLAP_POST_AUDIT_v280.txt').write_text(audit);print(audit)
