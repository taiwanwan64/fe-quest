from pathlib import Path
import base64, hashlib, json, os, re, runpy, subprocess, tempfile


def req(v,m):
    if not v: raise AssertionError(m)

def sha_file(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def ident(p, **extra):
    p=Path(p)
    d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}
    d.update(extra)
    return d

def extract_js(h):
    return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
                     if x.strip() and not x.lstrip().startswith('{'))

def context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-content-staging',branch)
    req(m is not None,'content release branch must match vNNN-content-staging')
    version=m.group(1); number=int(m.group(2))
    return branch,version,number,f'v{number-1}'

def dump_runtime(html_path):
    html=Path(html_path).read_text()
    js=extract_js(html)
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''\nconst __feqDump = {\n  version: APP_VERSION,\n  questions: QUESTION_BANK,\n  bExercises: B_EXERCISES,\n  bCompoundSets: B_COMPOUND_SETS,\n  securityScenarios: SECURITY_SCENARIOS,\n  securityStepContracts: B_SECURITY_STEP_CONTRACTS,\n  securityFirstContracts: B_SECURITY_FIRST_STEP_CONTRACTS,\n  securityQuotas: SECURITY_MOCK_QUOTAS,\n  finalCount: B_FINAL_COUNT,\n  finalAlgoCount: B_FINAL_ALGO_COUNT,\n  finalSecurityCount: B_FINAL_SEC_COUNT\n};\nconsole.log('__FEQ_SB__'+Buffer.from(JSON.stringify(__feqDump)).toString('base64'));\n'''
    with tempfile.TemporaryDirectory() as td:
        rp=Path(td)/'dump.js'
        rp.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(rp)],capture_output=True,text=True)
        req(z.returncode==0,'runtime dump failed '+z.stderr[-2500:])
        m=re.search(r'__FEQ_SB__([A-Za-z0-9+/=]+)',z.stdout)
        req(m is not None,'Subject B dump marker missing')
        return json.loads(base64.b64decode(m.group(1)).decode())

branch,version,number,previous=context()
manifest_path=Path(f'_release/content-change-{version}.json')
req(manifest_path.exists(),'content manifest missing')
manifest=json.loads(manifest_path.read_text())
req(manifest.get('schema_version')==1,'manifest schema')
req(manifest.get('release')==version and manifest.get('previous_release')==previous,'manifest release mismatch')
req(manifest.get('policy')=='explicit-subject-b-security-scenario-overrides-only','Subject B policy mismatch')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(manifest.get('parent_main_sha')==parent,'manifest parent mismatch')

allowed=manifest.get('allowed_security_scenario_ids',[])
req(allowed and len(allowed)==len(set(allowed)),'allowed security IDs invalid')
req(set(allowed)==set(manifest.get('legacy_persistence_ids',[])),'legacy ID declaration mismatch')
source_path=Path(str(manifest.get('source_quality_audit','')))
req(source_path.exists(),'source Subject B audit missing')
source=json.loads(source_path.read_text())
req(set(allowed)==set(source.get('manual_priority_review',{}).get('high',[])),'repair IDs do not match v199 high queue')

# Subject A content-release proof remains physically unchanged.
for p in ['.github/content-release/prepare_reference.py','.github/content-release/validate_content.py']:
    q=Path(p); req(q.exists(),'Subject A content tooling missing '+p)
    req(q.read_bytes()==subprocess.check_output(['git','show',parent+':'+p]),'Subject A content proof drift '+p)

# Adopt the Subject B path once, without weakening the existing Subject A path.
workflow=Path('.github/workflows/content-release-validate.yml')
sbtool=Path('.github/content-release/validate_subject_b_content.py')
adoption=manifest.get('subject_b_validator_adoption') is True
req(workflow.exists() and sbtool.exists(),'Subject B content tooling missing')
workflow_parent=subprocess.check_output(['git','show',parent+':.github/workflows/content-release-validate.yml'])
sb_parent=subprocess.run(['git','show',parent+':.github/content-release/validate_subject_b_content.py'],capture_output=True)
if adoption:
    req(sb_parent.returncode!=0,'Subject B validator adoption declared after tool already existed')
    req(workflow.read_bytes()!=workflow_parent,'Subject B validator adoption did not update workflow')
    wt=workflow.read_text()
    req('validate_content.py' in wt and 'validate_subject_b_content.py' in wt,'workflow must preserve Subject A and route Subject B validator')
else:
    req(sb_parent.returncode==0 and sbtool.read_bytes()==sb_parent.stdout,'Subject B validator drift')
    req(workflow.read_bytes()==workflow_parent,'content workflow drift after adoption')

stable_paths=[
 'app/runtime-diagnostic-wrapper.txt',
 'app/runtime-release-adapter.txt',
 'app/runtime-release-diagnostic-spec.txt',
 '_regression/diagnostic-archive-inventory.fixture.json',
 'app/base-stable.html',
 'app/learning-patches.txt',
 'app/runtime-semantic-diagnostics.txt',
 '.github/workflows/release-validate.yml',
 '.github/release/release_materialize.py',
 '.github/release/prepare_reference.py',
 '.github/release/release_validate.py',
 '.github/release/runtime_stub.py'
]
for p in stable_paths:
    req(Path(p).read_bytes()==subprocess.check_output(['git','show',parent+':'+p]),'stable parent drift '+p)

committed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
expected=set(manifest.get('content_files',[]))|set(manifest.get('assembly_files',[]))|{manifest_path.as_posix()}
if adoption:
    expected|={workflow.as_posix(),sbtool.as_posix()}
req(committed==expected,'unexpected committed Subject B release drift: '+repr(sorted(committed^expected)))

candidate=dump_runtime('_site/index.html')
parent_rt=dump_runtime('_site_parent/index.html')
req(candidate['version']==version and parent_rt['version']==previous,'runtime versions')

# Unrelated learner content must be deep-identical.
req(candidate['questions']==parent_rt['questions'],'Subject A QUESTION_BANK drift')
req(candidate['bExercises']==parent_rt['bExercises'],'B_EXERCISES drift')
req(candidate['bCompoundSets']==parent_rt['bCompoundSets'],'B_COMPOUND_SETS drift')
req(len(candidate['questions'])==710 and len({q['id'] for q in candidate['questions']})==710,'Subject A question inventory')

cs=candidate['securityScenarios']; ps=parent_rt['securityScenarios']
req(len(cs)==15 and len(ps)==15,'SECURITY_SCENARIOS count')
cm={s['id']:s for s in cs}; pm={s['id']:s for s in ps}
req(len(cm)==15 and len(pm)==15 and list(cm)==list(pm),'security scenario ID/order drift')
changed=[sid for sid in cm if cm[sid]!=pm[sid]]
req(set(changed)==set(allowed),'security scenario change scope mismatch '+repr(sorted(set(changed)^set(allowed))))
for sid in allowed:
    req(cm[sid]['id']==pm[sid]['id'],'legacy security ID drift '+sid)
    req(cm[sid]['level']==pm[sid]['level'],'security level slot drift '+sid)

# Current Subject B security scope: management/case-study judgment, not excluded crypto/PKI mechanics.
excluded=re.compile(r'暗号|公開鍵|秘密鍵|デジタル署名|証明書|認証局|PKI|TLS|HTTPS|ハッシュ|ソルト',re.I)
for sid in allowed:
    visible={k:v for k,v in cm[sid].items() if k!='id'}
    req(not excluded.search(json.dumps(visible,ensure_ascii=False)),'out-of-scope security mechanics remain in '+sid)

# Preserve assessment structure and answer-position balance.
levels={k:sum(1 for s in cs if s.get('level')==k) for k in ['基礎','標準','応用']}
req(levels=={'基礎':4,'標準':8,'応用':3},'security level distribution '+repr(levels))
positions=[0,0,0,0]
for s in cs:
    req(len(s.get('steps',[]))==3,s['id']+': security step count')
    for i,q in enumerate(s['steps'],1):
        req(len(q.get('options',[]))==4 and len(set(map(str,q['options'])))==4,s['id']+f':{i}: four unique options')
        req(isinstance(q.get('a'),int) and 0<=q['a']<4 and q.get('explain'),s['id']+f':{i}: invalid answer/explanation')
        positions[q['a']]+=1
req(positions==[12,11,11,11],'security answer-position distribution '+repr(positions))
req(sum(len(s['steps']) for s in cs)==45,'security question count')

req(candidate['securityQuotas']=={'基礎':2,'標準':4,'応用':2},'security mini-mock quotas')
req(candidate['finalCount']==20 and candidate['finalAlgoCount']==16 and candidate['finalSecurityCount']==4,'final Subject B quotas')

# Contract migration is explicit and restricted to the same legacy IDs.
cstep=candidate['securityStepContracts']; pstep=parent_rt['securityStepContracts']
cfirst=candidate['securityFirstContracts']; pfirst=parent_rt['securityFirstContracts']
allowed_step={f'{sid}:{i}' for sid in allowed for i in (1,2,3)}
step_changed={k for k in set(cstep)|set(pstep) if cstep.get(k)!=pstep.get(k)}
first_changed={k for k in set(cfirst)|set(pfirst) if cfirst.get(k)!=pfirst.get(k)}
req(step_changed==allowed_step,'security step-contract migration scope '+repr(sorted(step_changed^allowed_step)))
req(first_changed==set(allowed),'security first-contract migration scope '+repr(sorted(first_changed^set(allowed))))
for s in cs:
    for i,q in enumerate(s['steps'],1):
        correct=q['options'][q['a']]
        req(cstep.get(f"{s['id']}:{i}")==correct,s['id']+f':{i}: contract does not match correct answer')
    req(cfirst.get(s['id'])==s['steps'][0]['options'][s['steps'][0]['a']],s['id']+': first contract mismatch')

release_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
same=all((Path('_site')/p).read_bytes()==(Path('_site_reference')/p).read_bytes() for p in release_files)
req(same,'candidate/reference output mismatch')

fixture=Path(f'_regression/subject-b-security-repairs-{version}.fixture.json')
audit=Path(f'audits/SUBJECT_B_SECURITY_REPAIRS_{version}.txt')
fx={
 'name':f'subject-b-security-repairs-{version}',
 'version':version,
 'previous_version':previous,
 'parent_main_sha':parent,
 'scope':'explicit-current-scope-subject-b-security-repair',
 'source_quality_audit':ident(source_path),
 'allowed_security_scenario_ids':allowed,
 'legacy_ids_preserved':True,
 'changed_security_scenario_ids':changed,
 'security_count':len(cs),
 'security_question_count':45,
 'security_levels':levels,
 'security_answer_positions':positions,
 'security_mock_quotas':candidate['securityQuotas'],
 'final':{'count':candidate['finalCount'],'algorithm':candidate['finalAlgoCount'],'security':candidate['finalSecurityCount']},
 'subject_a_question_bank_deep_identical':True,
 'b_exercises_deep_identical':True,
 'b_compound_sets_deep_identical':True,
 'semantic_contract_migration':{'step_keys':sorted(step_changed),'first_keys':sorted(first_changed)},
 'subject_a_content_release_proof_byte_identical':True,
 'subject_b_validator_adoption':adoption,
 'candidate_reference_six_file_byte_equality':same,
 'learner_facing_change':True,
 'copyright_policy':manifest.get('copyright_policy'),
 'status':'passed'
}
fixture.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
audit.write_text(f'''FE QUEST {version} — Subject B Security Scope Repair Audit
=======================================================

Scope
-----
Previous: {previous}
Parent main: {parent}
Changed legacy IDs: {", ".join(allowed)}
Scenario IDs and level slots preserved: yes
User-facing themes replaced with current-scope management/case-study content: yes

Engineering proof
-----------------
Subject A QUESTION_BANK deep-identical: yes
B_EXERCISES deep-identical: yes
B_COMPOUND_SETS deep-identical: yes
SECURITY_SCENARIOS changed only at manifest IDs: yes
Semantic-contract migration restricted to the same four IDs: yes
Subject A content-release validator/prepare-reference byte-identical: yes
Subject B validator adoption: {'yes' if adoption else 'no'}
Candidate/reference six-file equality: yes

Subject B invariants
--------------------
Security scenarios: 15
Security questions: 45
Levels: 基礎4 / 標準8 / 応用3
Answer positions: 12 / 11 / 11 / 11
Security mini-mock quotas: 基礎2 / 標準4 / 応用2
Final practice: algorithm16 + security4

Scope calibration
-----------------
The v199 audit identified these four scenarios as current-scope mismatches against the
attached 令和8年度 Subject B reference. The replacements use original FE QUEST wording and
focus on information-asset management, account lifecycle, physical security, and
incident escalation/evidence preservation. Excluded crypto/signature/certificate/PKI
mechanics are absent from the four learner-facing replacements.

Policy
------
Original FE QUEST wording only. Attached books are used only for scope, terminology,
emphasis and difficulty calibration.
''')
print(f'FEQUEST_SUBJECT_B_CONTENT_RELEASE_OK version={version} changed={len(changed)} security=15 questions=45 levels=4/8/3 answers=12/11/11/11 mock=2/4/2 final=16+4 candidate-reference=1')
