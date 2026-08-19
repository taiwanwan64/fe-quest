from pathlib import Path
import base64,difflib,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-trace-overlap-repair-(v(\d+))',b)
    req(m,'bad v279 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function lines(v){if(Array.isArray(v))return v.map(String);if(typeof v==='string')return v.split(/\r?\n/).filter(Boolean);return [];}
function publicItem(x){return {id:x.id,domain:x.domain||'',level:x.level||'',format:x.format||'',title:x.title||'',context:x.context||'',code:lines(x.code),data:x.data||[],q:x.q||x.prompt||'',options:x.options||[],a:x.a,explain:x.explain||'',qualityAudit:x.qualityAudit||''};}
function finalSelectionSig(){const rows=[];for(let i=0;i<3000;i++){profile.bFinalStats={};Math.random=seedRand((0x279000+i)>>>0);rows.push(buildBFinal().map(x=>[x.kind,x.sourceId]));}return hashText(JSON.stringify(rows));}
const target=B_EXAM_ALGO_ITEMS.find(x=>x.id==='bexam_arr_03');
const finalExam=makeFinalAlgoExam(target);
const remediation=bFinalRemediationTarget(finalExam.studyMode,finalExam.sourceId,finalExam.domain);
const pos=[0,0,0,0];B_EXAM_ALGO_ITEMS.forEach(x=>pos[x.a]++);
console.log('__V279__'+Buffer.from(JSON.stringify({v:APP_VERSION,target:publicItem(target),items:B_EXAM_ALGO_ITEMS.map(publicItem),trace:B_EXERCISES.map(x=>({id:x.id,code:lines(x.code)})),contractAnswer:B_EXAM_ALGO_CONTRACTS['bexam_arr_03'],remediation,selectionSig:finalSelectionSig(),answerPositions:pos,banks:{trace:hashText(stable(B_EXERCISES)),security:hashText(stable(SECURITY_SCENARIOS))},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics(),spec:globalThis.SUBJECT_B_TRACE_OVERLAP_REPAIR_V279_SPEC||null})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V279__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing')
        return json.loads(base64.b64decode(m.group(1)))

def norm(lines):
    s='\n'.join(lines).lower();s=re.sub(r'//.*','',s);s=re.sub(r'["\'][^"\']*["\']','STR',s);s=re.sub(r'\b\d+(?:\.\d+)?\b','NUM',s);s=re.sub(r'\s+',' ',s).strip();return s

def line_norm(lines):
    out=[]
    for x in lines:
        x=re.sub(r'//.*','',x.lower());x=re.sub(r'\b\d+(?:\.\d+)?\b','NUM',x);x=re.sub(r'\s+',' ',x).strip()
        if x:out.append(x)
    return out

def overlaps(rt):
    pairs=[]
    for f in rt['items']:
        nf=norm(f['code']);lf=line_norm(f['code'])
        if not nf: continue
        for t in rt['trace']:
            nt=norm(t['code']);lt=line_norm(t['code'])
            if not nt: continue
            seq=difflib.SequenceMatcher(None,nf,nt).ratio();sf,st=set(lf),set(lt);jac=len(sf&st)/len(sf|st) if sf|st else 0
            row={'finalId':f['id'],'traceId':t['id'],'sequence':round(seq,3),'lineJaccard':round(jac,3),'finalLines':len(lf),'traceLines':len(lt),'exactNormalized':nf==nt}
            pairs.append(row)
    exact=[x for x in pairs if x['exactNormalized']]
    strong=[x for x in pairs if not x['exactNormalized'] and min(x['finalLines'],x['traceLines'])>=5 and x['sequence']>=0.90 and x['lineJaccard']>=0.60]
    pairs.sort(key=lambda x:(x['exactNormalized'],x['sequence'],x['lineJaccard']),reverse=True)
    return exact,strong,pairs[:20]

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v279','v278'),'expects v278')
source=Path('audits/SUBJECT_B_TRACE_OVERLAP_DETAIL_v278.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v278 detail audit missing')
manifest=json.loads(Path('_release/content-change-v279.json').read_text());req(manifest['parent_main_sha']==parent and manifest['allowed_question_ids']==['bexam_arr_03'],'manifest scope drift')
expected={'app/subject-b-trace-overlap-repair-overrides-v279.txt','_release/content-change-v279.json','index.html','.github/subject-b-trace-overlap-repair/validate_repair.py','.github/workflows/subject-b-trace-overlap-repair.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v279' and par['v']=='v278','versions');req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['banks']==par['banks'],'TRACE/security bank drift');req(cand['selectionSig']==par['selectionSig'],'3000-seed final source-id selection/order drift');req(cand['answerPositions']==par['answerPositions'],'answer-position balance drift');req(cand['remediation']==par['remediation'],'remediation mapping drift');req(cand['sem'].get('ok') is True,'semantic diagnostics failed')
par_items={x['id']:x for x in par['items']};cand_items={x['id']:x for x in cand['items']};req(set(par_items)==set(cand_items) and len(cand_items)==43,'item inventory drift');changed_ids=[x for x in cand_items if cand_items[x]!=par_items[x]];req(changed_ids==['bexam_arr_03'],'repair changed more than target: '+repr(changed_ids))
t=cand['target'];p=par['target'];req((t['id'],t['domain'],t['level'],t['format'],t['a'])==(p['id'],p['domain'],p['level'],p['format'],p['a'])==('bexam_arr_03','一次元配列','標準','実行回数',2),'identity/contract drift')
req(t['code']==['data ← [3, 1, 4, 1, 5]','score ← 0','for i ← 1 to 4','    diff ← data[i] - data[i-1]','    if diff > 0','        score ← score + diff','    endif','endfor','score を出力する'],'target code mismatch')
req(t['options']==['1回, score=4','2回, score=2','2回, score=7','3回, score=9'] and t['a']==2 and cand['contractAnswer']=='2回, score=7','target answer contract mismatch')
req('0→3→7' in t['explain'] and '実行される回数' in t['q'] and 'score' in t['q'],'target explanation/prompt mismatch')
req(cand['spec'] and cand['spec']['targetId']=='bexam_arr_03' and cand['spec']['selectionPolicyChanged'] is False,'v279 runtime spec missing')
exact,strong,top=overlaps(cand);req(not exact,'exact TRACE/final overlap remains: '+repr(exact));req(not strong,'strong TRACE/final overlap remains: '+repr(strong))
old_nf,old_nt=norm(p['code']),norm(next(x for x in par['trace'] if x['id']=='count_even')['code']);old_lf,old_lt=line_norm(p['code']),line_norm(next(x for x in par['trace'] if x['id']=='count_even')['code']);old_seq=difflib.SequenceMatcher(None,old_nf,old_nt).ratio();old_j=len(set(old_lf)&set(old_lt))/len(set(old_lf)|set(old_lt));new_pair=next(x for x in top if x['finalId']=='bexam_arr_03') if any(x['finalId']=='bexam_arr_03' for x in top) else None
# calculate exact repaired pair even if it falls outside top20
new_nf,new_nt=norm(t['code']),norm(next(x for x in cand['trace'] if x['id']=='count_even')['code']);new_lf,new_lt=line_norm(t['code']),line_norm(next(x for x in cand['trace'] if x['id']=='count_even')['code']);new_seq=difflib.SequenceMatcher(None,new_nf,new_nt).ratio();new_j=len(set(new_lf)&set(new_lt))/len(set(new_lf)|set(new_lt));req(round(old_seq,3)==0.932 and round(old_j,3)==0.778,'parent metric drift');req(new_seq<0.90 or new_j<0.60,'localized overlap threshold not cleared')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'approved content reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','targetId':'bexam_arr_03','oldOverlap':{'traceId':'count_even','sequence':round(old_seq,3),'lineJaccard':round(old_j,3)},'newOverlap':{'traceId':'count_even','sequence':round(new_seq,3),'lineJaccard':round(new_j,3)},'changedIds':changed_ids,'target':t,'remediation':cand['remediation'],'allExactPairs':exact,'allStrongPairs':strong,'topPairs':top,'selectionSignatureMatch3000':True,'semanticOK':True,'approvedContentReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-trace-overlap-repair-v279.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v279 — Subject B TRACE / Final Transfer-Overlap Repair
===================================================================

Result
------
PASS — NO FINDINGS
Previous release: v278
Source main: {parent}
Learner-facing change: yes, one final algorithm item (bexam_arr_03)

Repair
------
v278 localized the only v277 strong overlap to bexam_arr_03 ↔ count_even. The old final item used the same count-increment skeleton as the guided TRACE exercise. v279 keeps the one-dimensional-array, adjacent-comparison and conditional-tracing objective but changes the state path: each adjacent difference is computed, only positive differences are accumulated into score, and the learner must report both how many updates occurred and the final accumulated score.

Old overlap
-----------
count_even sequence similarity: {round(old_seq,3)}
count_even line Jaccard: {round(old_j,3)}

Repaired overlap
----------------
count_even sequence similarity: {round(new_seq,3)}
count_even line Jaccard: {round(new_j,3)}
Exact normalized overlap pairs across all 43×20 comparisons: 0
Strong overlap pairs at v277 thresholds across all 43×20 comparisons: 0

Repaired learner-facing item
----------------------------
Title: {t['title']}
Question: {t['q']}
Options: {json.dumps(t['options'],ensure_ascii=False)}
Correct: {t['options'][t['a']]}
Explanation: {t['explain']}

Preservation
------------
Only bexam_arr_03 changed among the 43 final algorithm items.
ID/domain/level/format/answer position are preserved: bexam_arr_03 / 一次元配列 / 標準 / 実行回数 / index 2.
TRACE exercise bank and all security scenarios are unchanged.
The existing remediation destination is unchanged: {json.dumps(cand['remediation'],ensure_ascii=False)}.
3000 deterministic final builds preserve source-id selection and order.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Approved-content-reference six-file byte equality: yes.

Decision
--------
Close the localized TRACE/final overlap finding. Do not rewrite other final items merely to reduce ordinary conceptual similarity; familiar structures are pedagogically useful. Future content work should require a concrete transfer, coverage, feedback or learner-friction signal before changing another question.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_TRACE_OVERLAP_REPAIR_v279.txt').write_text(audit);print(audit)
