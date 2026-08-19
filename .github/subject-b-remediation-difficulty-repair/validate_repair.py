from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-remediation-difficulty-repair-(v(\d+))',branch)
    req(m,'bad Subject B remediation difficulty repair branch')
    return m.group(1),f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function tx(v){return String(v??'').trim();}
function rank(v){return ({'基礎':1,'標準':2,'応用':3})[tx(v)]||0;}
function sig(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x249000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function routes(){
 const trace=Object.fromEntries(B_EXERCISES.map(x=>[x.id,x])),source=Object.fromEntries(B_EXAM_ALGO_ITEMS.map(x=>[x.id,x]));
 return B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam).map(x=>{const s=source[x.sourceId],t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain),e=trace[t?.id];const fl=tx(s?.level),tl=tx(e?.level);return {id:x.sourceId,domain:tx(s?.domain),finalLevel:fl,targetMode:t?.mode||null,targetId:t?.id||null,targetLevel:tl,targetConcept:tx(e?.concept),delta:rank(fl)-rank(tl)};});
}
function domainCandidates(domain){
 const prefix=domain==='二次元配列'?'二次元配列':domain==='木構造'?'木構造':domain==='リスト'?'リスト':null;
 if(!prefix)return [];
 return B_EXERCISES.filter(x=>tx(x.concept).startsWith(prefix)).map(x=>({id:x.id,level:tx(x.level),concept:tx(x.concept)}));
}
const r=routes(),hard=r.filter(x=>x.targetMode==='trace'&&x.targetId&&x.targetLevel&&x.delta<0);
const exceptions=hard.map(x=>({...x,candidates:domainCandidates(x.domain),sameOrEasier:domainCandidates(x.domain).filter(c=>rank(c.level)<=rank(x.finalLevel))}));
console.log('__V249__'+Buffer.from(JSON.stringify({v:APP_VERSION,spec:globalThis.SUBJECT_B_REMEDIATION_DIFFICULTY_V249_SPEC||null,routes:r,hard,exceptions,banks:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},sig:sig(2000),contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V249__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v249','v248'),'v249 repair expects v248 parent')
source=Path('audits/SUBJECT_B_REMEDIATION_DIFFICULTY_DETAIL_AUDIT_v248.txt');req(source.exists(),'v248 evidence missing')
st=source.read_text();req('PASS — DETAIL EVIDENCE CAPTURED' in st and 'bexam_mat_01' in st and 'bexam_mat_02' in st and 'matrix_sum: 標準' in st,'v248 evidence drift')
manifest=json.loads(Path('_release/content-change-v249.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'manifest parent/source drift')
req(manifest['quality_audit_marker']=='subject_b_remediation_target_harder_than_final_label','manifest finding drift')
req(manifest['content_files']==['app/subject-b-remediation-difficulty-overrides-v249.txt'] and manifest['assembly_files']==['index.html'],'manifest scope drift')
expected={'app/subject-b-remediation-difficulty-overrides-v249.txt','_release/content-change-v249.json','index.html','.github/subject-b-remediation-difficulty-repair/validate_repair.py','.github/workflows/subject-b-remediation-difficulty-repair.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v249 source drift: '+repr(sorted(changed^expected)))

override=Path('app/subject-b-remediation-difficulty-overrides-v249.txt').read_text()
for token in ['bexam_mat_01','bexam_mat_02',"id:'matrix_sum'",'no-same-domain-same-or-easier-trace-target-in-current-inventory']:
    req(token in override,'v249 override contract missing: '+token)
req('QUESTION_BANK' not in override and 'B_EXAM_ALGO_ITEMS.push' not in override and 'B_EXERCISES.push' not in override,'v249 repair must not mutate question/practice banks')

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['banks']==par['banks'],'question/practice bank drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['contracts']==par['contracts']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
spec=cand.get('spec') or {};req(spec.get('sourceFinding')=='subject_b_remediation_target_harder_than_final_label','v249 spec drift')

before={x['id']:x for x in par['routes']};after={x['id']:x for x in cand['routes']}
diff=[k for k in after if before[k]!=after[k]]
req(set(diff)=={'bexam_mat_01','bexam_mat_02'},'unexpected remediation topology changes: '+repr(diff))
for qid in diff:
    req(before[qid]['targetId']=='matrix_find' and before[qid]['targetLevel']=='応用','v248 matrix source route drift: '+qid)
    req(after[qid]['targetId']=='matrix_sum' and after[qid]['targetLevel']=='標準' and after[qid]['finalLevel']=='標準','v249 matrix repair failed: '+qid)
req(len(par['hard'])==6 and len(cand['hard'])==4,'harder-label count must improve 6→4')
remaining={x['id'] for x in cand['hard']};req(remaining=={'bexam_tree_01','bexam_tree_05','bexam_list_02','bexam_list_03'},'remaining exception set drift')
for x in cand['exceptions']:
    req(not x['sameOrEasier'],'remaining harder-label route has an available same-domain same/easier TRACE alternative: '+x['id'])

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference byte mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','findingResolvedForAvailableAlternatives':True,'repairedIds':diff,'harderBefore':len(par['hard']),'harderAfter':len(cand['hard']),'documentedExceptions':sorted(remaining),'allExceptionsLackSameDomainSameOrEasierTarget':True,'bankHashes':cand['banks'],'finalSignatureMatch':cand['sig']==par['sig'],'contracts':cand['contracts'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-remediation-difficulty-repair-v249.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_REMEDIATION_DIFFICULTY_REPAIR_v249.txt').write_text(f'''FE QUEST v249 — Subject B Remediation Difficulty Repair\n========================================================\n\nResult\n------\nPASS — NO FINDINGS\nPrevious release: v248\nSource main: {parent}\nLearner-facing change in v249: yes — two standard two-dimensional-array final items now recover to the same-domain standard TRACE exercise matrix_sum instead of the advanced matrix_find exercise.\n\nRepair\n------\n- bexam_mat_01: matrix_find（応用） → matrix_sum（標準）\n- bexam_mat_02: matrix_find（応用） → matrix_sum（標準）\n\nRemaining cross-layer label mismatches\n--------------------------------------\nFour rows remain: bexam_tree_01, bexam_tree_05, bexam_list_02, bexam_list_03. Their domains currently have no same-domain TRACE exercise at the same or easier authored level, so v249 intentionally preserves their semantically closest recovery routes rather than forcing a misleading relabel or cross-domain detour.\n\nRegression\n----------\nOnly the two intended final→TRACE route rows changed across all 43 final algorithm items.\nQuestion / TRACE / security / final-algorithm banks: unchanged.\n2000 deterministic final sessions: selection/order/options unchanged.\nFinal contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.\nSubject B semantic diagnostics: OK.\nCandidate/reference six-file byte equality: yes.\n\nDecision\n--------\nThe actionable part of the v247 calibration finding is repaired. Keep the four unavoidable cross-layer exceptions documented until a new same-domain TRACE exercise is intentionally authored; do not change difficulty labels just to eliminate an audit count. Follow with a post-repair audit, then move to learner-local calibration (accuracy and response-time evidence).\n''')
print('FEQUEST_SUBJECT_B_REMEDIATION_DIFFICULTY_REPAIR_OK')
