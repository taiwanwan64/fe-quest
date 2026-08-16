from pathlib import Path
import base64, hashlib, json, os, re, runpy, subprocess, tempfile


def req(v,m):
    if not v: raise AssertionError(m)
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def ident(p):
    p=Path(p); return {'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}
def extract_js(h): return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))
def context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-subject-b-content-staging',branch)
    req(m is not None,'Subject B content release branch must match vNNN-subject-b-content-staging')
    version=m.group(1); number=int(m.group(2)); return branch,version,number,f'v{number-1}'
def dump_runtime(html_path):
    html=Path(html_path).read_text(); js=extract_js(html)
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail="console.log('__FEQ_B__'+Buffer.from(JSON.stringify({version:APP_VERSION,questions:QUESTION_BANK,bExercises:B_EXERCISES,bCompoundSets:B_COMPOUND_SETS,securityScenarios:SECURITY_SCENARIOS,securityStepContracts:B_SECURITY_STEP_CONTRACTS,securityFirstContracts:B_SECURITY_FIRST_STEP_CONTRACTS,securityMockCount:SECURITY_MOCK_COUNT,securityMockQuotas:SECURITY_MOCK_QUOTAS,bFinalCount:B_FINAL_COUNT,bFinalAlgoCount:B_FINAL_ALGO_COUNT,bFinalSecCount:B_FINAL_SEC_COUNT,semantic:validateSubjectBSemantics()})).toString('base64'));"
    with tempfile.TemporaryDirectory() as td:
        rp=Path(td)/'dump.js'; rp.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(rp)],capture_output=True,text=True)
        req(z.returncode==0,'runtime dump failed '+z.stderr[-2000:])
        m=re.search(r'__FEQ_B__([A-Za-z0-9+/=]+)',z.stdout); req(m is not None,'Subject B runtime dump marker missing')
        return json.loads(base64.b64decode(m.group(1)).decode())
def changed_keys(a,b): return {k for k in set(a)|set(b) if a.get(k)!=b.get(k)}
def security_positions(scenarios):
    pos=[0,0,0,0]
    for s in scenarios:
        for q in s.get('steps',[]): pos[q['a']]+=1
    return pos
def level_counts(scenarios):
    out={}
    for s in scenarios: out[s['level']]=out.get(s['level'],0)+1
    return out

branch,version,number,previous=context()
manifest_path=Path(f'_release/content-change-{version}.json'); req(manifest_path.exists(),'Subject B content manifest missing')
manifest=json.loads(manifest_path.read_text())
req(manifest.get('schema_version')==1,'manifest schema')
req(manifest.get('release')==version and manifest.get('previous_release')==previous,'manifest release mismatch')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip(); req(manifest.get('parent_main_sha')==parent,'manifest parent mismatch')
allowed_ids=manifest.get('allowed_security_ids',[]); marker=manifest.get('quality_audit_marker')
req(len(allowed_ids)==len(set(allowed_ids)) and allowed_ids,'allowed security ids invalid')
req(isinstance(marker,str) and marker.startswith(version+'-'),'quality audit marker')
source_audit=Path(str(manifest.get('source_quality_audit',''))); source_tier=str(manifest.get('source_priority_tier',''))
req(source_audit.exists() and source_tier in {'high','medium'},'source quality audit declaration')

subject_b_tooling={'.github/workflows/subject-b-content-release-validate.yml','.github/subject-b-content-release/validate_content.py'}
committed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
expected=set(manifest.get('content_files',[]))|set(manifest.get('assembly_files',[]))|{manifest_path.as_posix()}
for p in subject_b_tooling:
    r=subprocess.run(['git','cat-file','-e',parent+':'+p],capture_output=True)
    if r.returncode!=0: expected.add(p)
req(committed==expected,'unexpected committed pre-release drift: '+repr(sorted(committed^expected)))

tooling_state=[]
for p in sorted(subject_b_tooling):
    q=Path(p); req(q.exists(),'Subject B content tooling missing '+p)
    req(version not in q.read_text(),'target version literal in Subject B content tooling '+p)
    r=subprocess.run(['git','show',parent+':'+p],capture_output=True)
    if r.returncode==0:
        req(q.read_bytes()==r.stdout,'Subject B content tooling drift '+p); tooling_state.append({**ident(p),'parent_byte_identical':True})
    else: tooling_state.append({**ident(p),'parent_byte_identical':False})

stable_paths=['app/runtime-diagnostic-wrapper.txt','app/runtime-release-adapter.txt','app/runtime-release-diagnostic-spec.txt','_regression/diagnostic-archive-inventory.fixture.json','app/base-stable.html','app/learning-patches.txt','app/runtime-semantic-diagnostics.txt','.github/workflows/release-validate.yml','.github/release/release_materialize.py','.github/release/prepare_reference.py','.github/release/release_validate.py','.github/release/runtime_stub.py','.github/workflows/content-release-validate.yml','.github/content-release/prepare_reference.py','.github/content-release/validate_content.py']
for p in stable_paths: req(Path(p).read_bytes()==subprocess.check_output(['git','show',parent+':'+p]),'stable parent drift '+p)

candidate=dump_runtime('_site/index.html'); parent_rt=dump_runtime('_site_parent/index.html')
req(candidate['version']==version and parent_rt['version']==previous,'runtime versions')
req(candidate['questions']==parent_rt['questions'],'Subject A QUESTION_BANK drift in Subject B-only release')
req(candidate['bExercises']==parent_rt['bExercises'],'B_EXERCISES drift in security-only release')
req(candidate['bCompoundSets']==parent_rt['bCompoundSets'],'B_COMPOUND_SETS drift in security-only release')

cs=candidate['securityScenarios']; ps=parent_rt['securityScenarios']
req(len(cs)==15 and len(ps)==15,'security scenario count')
cm={s['id']:s for s in cs}; pm={s['id']:s for s in ps}
req(len(cm)==15 and len(pm)==15 and [s['id'] for s in cs]==[s['id'] for s in ps],'security id/order drift')
changed=[sid for sid in cm if cm[sid]!=pm[sid]]
req(set(changed)==set(allowed_ids),'security scenario scope mismatch '+repr(sorted(set(changed)^set(allowed_ids))))
source=json.loads(source_audit.read_text()); review=source.get('manual_priority_review',{})
source_ids=set(review.get(source_tier,[])); req(source_ids and set(allowed_ids)<=source_ids,'repair id not in declared Subject B source priority queue')

for sid in allowed_ids:
    before,after=pm[sid],cm[sid]
    req(before.get('id')==after.get('id') and before.get('level')==after.get('level'),'preserved scenario field drift '+sid)
    req(after.get('qualityAudit')==marker,'quality audit marker '+sid)
    req(len(after.get('steps',[]))==3,'security step count '+sid)
    req([q.get('a') for q in before.get('steps',[])]==[q.get('a') for q in after.get('steps',[])],'answer-position drift '+sid)
    for i,q in enumerate(after.get('steps',[]),1):
        req(len(q.get('options',[]))==4 and len(set(map(str,q['options'])))==4,'four-choice structure '+sid+':'+str(i))
        req(isinstance(q.get('a'),int) and 0<=q['a']<4 and q.get('explain') and q.get('hint'),'security question shape '+sid+':'+str(i))

forbidden=['暗号','公開鍵','秘密鍵','デジタル署名','デジタル証明書','証明書','認証局','PKI','TLS','ハッシュ','ソルト','セキュアプロトコル']
for sid in allowed_ids:
    userf={k:v for k,v in cm[sid].items() if k not in {'id','qualityAudit'}}
    txt=json.dumps(userf,ensure_ascii=False)
    hit=[x for x in forbidden if x in txt]
    req(not hit,'out-of-scope technical security wording remains '+sid+': '+repr(hit))

preserve=manifest['preserve']
req(level_counts(cs)==preserve['security_level_distribution'],'security level distribution')
req(security_positions(cs)==preserve['security_answer_distribution'],'security answer distribution')
req(candidate['securityMockCount']==preserve['security_mock_count'],'security mock count')
req(candidate['securityMockQuotas']==preserve['security_mock_quotas'],'security mock quotas')
req([candidate['bFinalCount'],candidate['bFinalAlgoCount'],candidate['bFinalSecCount']]==preserve['final_counts'],'final practice counts')
req(candidate['semantic'].get('ok') is True,'Subject B semantic validator failed: '+repr(candidate['semantic'].get('errors')))

first_changed=changed_keys(candidate['securityFirstContracts'],parent_rt['securityFirstContracts'])
step_changed=changed_keys(candidate['securityStepContracts'],parent_rt['securityStepContracts'])
expected_steps={f'{sid}:{i}' for sid in allowed_ids for i in range(1,4)}
req(first_changed==set(allowed_ids),'first-step contract migration scope')
req(step_changed==expected_steps,'step contract migration scope')
for sid in allowed_ids:
    s=cm[sid]
    req(candidate['securityFirstContracts'][sid]==s['steps'][0]['options'][s['steps'][0]['a']],'first contract binding '+sid)
    for i,q in enumerate(s['steps'],1):
        req(candidate['securityStepContracts'][f'{sid}:{i}']==q['options'][q['a']],'step contract binding '+sid+':'+str(i))

fixture=Path(f'_regression/subject-b-security-repairs-{version}.fixture.json')
audit=Path(f'audits/SUBJECT_B_SECURITY_REPAIRS_{version}.txt')
release_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
fx={'name':f'subject-b-security-repairs-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'scope':'explicit-current-scope-subject-b-security-repair','manifest':ident(manifest_path),'source_quality_audit':ident(source_audit),'source_priority_tier':source_tier,'content_files':[ident(p) for p in manifest.get('content_files',[])],'changed_security_count':len(changed),'changed_security_ids':allowed_ids,'preserved_levels':{sid:cm[sid]['level'] for sid in allowed_ids},'preserved_answer_positions':{sid:[q['a'] for q in cm[sid]['steps']] for sid in allowed_ids},'security_level_distribution':level_counts(cs),'security_answer_distribution':security_positions(cs),'security_mock_count':candidate['securityMockCount'],'security_mock_quotas':candidate['securityMockQuotas'],'final_counts':[candidate['bFinalCount'],candidate['bFinalAlgoCount'],candidate['bFinalSecCount']],'subject_a_deep_identical_to_parent':True,'b_exercises_deep_identical_to_parent':True,'b_compound_sets_deep_identical_to_parent':True,'semantic_contract_migration':{'first_keys':sorted(first_changed),'step_keys':sorted(step_changed),'bindings_valid':True},'subject_b_content_release_tooling':tooling_state,'stable_release_and_subject_a_content_tooling_byte_identical_to_parent':True,'candidate_reference_six_file_byte_equality':all((Path('_site')/p).read_bytes()==(Path('_site_reference')/p).read_bytes() for p in release_files),'parent_runtime_comparison':True,'learner_facing_change':True,'copyright_policy':manifest.get('copyright_policy'),'status':'passed'}
req(fx['candidate_reference_six_file_byte_equality'],'candidate/reference output mismatch')
fixture.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
audit.write_text(f'''FE QUEST {version} — Subject B Security Scope Repair Audit\n=========================================================\n\nPrevious: {previous}\nParent main: {parent}\nChanged security scenarios: {len(changed)}\nSource audit: {source_audit.as_posix()} / tier={source_tier}\n\nChanged legacy IDs\n------------------\n'''+"\n".join(f'- {x}: level={cm[x]["level"]}, answers={"/".join(map(str,[q["a"] for q in cm[x]["steps"]]))}' for x in allowed_ids)+f'''\n\nIsolation proofs\n----------------\nSubject A QUESTION_BANK: deep-identical to parent\nB_EXERCISES: deep-identical to parent\nB_COMPOUND_SETS: deep-identical to parent\nSECURITY_SCENARIOS: exactly {len(changed)} declared IDs changed\nSemantic contract migration: exactly 4 first-step + 12 step contracts changed and rebound to new correct options\nOut-of-scope crypto/signature/certificate/PKI/secure-protocol mechanics in changed user-facing scenarios: absent\n\nInvariants\n----------\nSecurity scenarios: 15\nLevels: {json.dumps(level_counts(cs),ensure_ascii=False)}\nAnswer positions: {security_positions(cs)}\nSecurity mini mock: {candidate['securityMockCount']} / quotas {json.dumps(candidate['securityMockQuotas'],ensure_ascii=False)}\nFinal practice: total {candidate['bFinalCount']} / algorithm {candidate['bFinalAlgoCount']} / security {candidate['bFinalSecCount']}\nSubject B semantic validator: OK\nCandidate/reference six-file equality: yes\n\nPolicy\n------\nOriginal FE QUEST wording only. Attached Subject B books are used only for scope, structure and difficulty calibration.\n''')
print(f'FEQUEST_SUBJECT_B_CONTENT_RELEASE_OK version={version} changed-security={len(changed)} security-levels={level_counts(cs)} security-answers={"/".join(map(str,security_positions(cs)))} candidate-reference=1 parent-runtime-diff=1 contract-migration=1 source-tier={source_tier}')
