from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile,hashlib

def req(v,m):
    if not v: raise AssertionError(m)
def ident(p):
    p=Path(p); b=p.read_bytes(); return {'path':p.as_posix(),'utf8_bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def ctx():
    b=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-subject-b-algorithm-content-staging',b); req(m,'bad branch')
    v=m.group(1); return v,f'v{int(m.group(2))-1}'
def dump(p):
    h=Path(p).read_text(); js='\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail="console.log('__BA__'+Buffer.from(JSON.stringify({v:APP_VERSION,q:QUESTION_BANK,e:B_EXERCISES,c:B_PREDICTION_CONTRACTS,b:B_COMPOUND_SETS,s:SECURITY_SCENARIOS,am:B_MOCK_COUNT,aq:B_MOCK_QUOTAS,sm:SECURITY_MOCK_COUNT,sq:SECURITY_MOCK_QUOTAS,fc:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],spec:globalThis['SUBJECT_B_ALGORITHM_V'+APP_VERSION.slice(1)+'_SPEC']||null,sem:validateSubjectBSemantics()})).toString('base64'));"
    with tempfile.TemporaryDirectory() as td:
        f=Path(td)/'x.js'; f.write_text(stub+'\n'+js+'\n'+tail); z=subprocess.run(['node',str(f)],capture_output=True,text=True)
        req(z.returncode==0,'runtime dump '+z.stderr[-2500:]); m=re.search(r'__BA__([A-Za-z0-9+/=]+)',z.stdout); req(m,'dump marker')
        return json.loads(base64.b64decode(m.group(1)))
def levels(xs):
    o={}
    for x in xs:o[x['level']]=o.get(x['level'],0)+1
    return o
def positions(es):
    o=[0,0,0,0]
    for e in es:
        for st in e.get('steps',[]):
            if st.get('predict'):o[st['predict']['a']]+=1
    return o
def secpos(ss):
    o=[0,0,0,0]
    for s in ss:
        for q in s['steps']:o[q['a']]+=1
    return o

version,previous=ctx(); mp=Path(f'_release/content-change-{version}.json'); req(mp.exists(),'manifest missing'); mf=json.loads(mp.read_text())
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(mf.get('schema_version')==1 and mf.get('release')==version and mf.get('previous_release')==previous and mf.get('parent_main_sha')==parent,'manifest context')
ids=mf.get('allowed_exercise_ids',[]); req(len(ids)==6 and len(set(ids))==6,'allowed ids'); marker=mf.get('quality_audit_marker',''); req(marker.startswith(version+'-'),'marker')
sa=Path(mf.get('source_quality_audit','')); src=json.loads(sa.read_text()); req(mf.get('source_priority_tier')=='medium','tier')
for path in [('prediction_authenticity','medium_ids'),('explanation_feedback','medium_ids'),('manual_priority_review','medium')]: req(set(ids)==set(src[path[0]][path[1]]),'source Medium queue '+path[0])

tooling={'.github/workflows/subject-b-algorithm-content-release-validate.yml','.github/subject-b-algorithm-content-release/validate_content.py'}
committed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); expected=set(mf['content_files'])|set(mf['assembly_files'])|{mp.as_posix()}
for p in tooling:
    if subprocess.run(['git','cat-file','-e',parent+':'+p],capture_output=True).returncode: expected.add(p)
req(committed==expected,'pre-release drift '+repr(sorted(committed^expected)))
for p in tooling:
    req(Path(p).exists() and version not in Path(p).read_text(),'tooling target literal/missing '+p)
stable=['app/base-stable.html','app/learning-patches.txt','app/runtime-semantic-diagnostics.txt','app/runtime-diagnostic-wrapper.txt','app/runtime-release-adapter.txt','app/runtime-release-diagnostic-spec.txt','_regression/diagnostic-archive-inventory.fixture.json','.github/workflows/release-validate.yml','.github/release/release_materialize.py','.github/release/prepare_reference.py','.github/release/release_validate.py','.github/release/runtime_stub.py','.github/workflows/content-release-validate.yml','.github/content-release/prepare_reference.py','.github/content-release/validate_content.py','.github/workflows/subject-b-content-release-validate.yml','.github/subject-b-content-release/validate_content.py','app/subject-b-security-overrides-v200.txt']
for p in stable:req(Path(p).read_bytes()==subprocess.check_output(['git','show',parent+':'+p]),'stable drift '+p)

c=dump('_site/index.html'); p=dump('_site_parent/index.html'); pr=mf['preserve']
req(c['v']==version and p['v']==previous,'versions'); req(c['q']==p['q'],'Subject A drift'); req(c['b']==p['b'],'compound drift'); req(c['s']==p['s'],'security drift')
cm={x['id']:x for x in c['e']}; pm={x['id']:x for x in p['e']}; req([x['id'] for x in c['e']]==[x['id'] for x in p['e']],'exercise order')
changed=[x for x in cm if cm[x]!=pm[x]]; req(set(changed)==set(ids),'exercise scope '+repr(changed))
for x in cm:
    if x not in ids:req(cm[x]==pm[x],'unaffected '+x)
keys={f'{x}:{i}' for x in ids for i in (1,2)}; ck={k for k in set(c['c'])|set(p['c']) if c['c'].get(k)!=p['c'].get(k)}; req(ck==keys,'contract scope')
for x in ids:
    a,b=pm[x],cm[x]; req(a['id']==b['id'] and a['level']==b['level'],'id/level '+x)
    ap=[s['predict'] for s in a['steps'] if s.get('predict')]; bp=[s['predict'] for s in b['steps'] if s.get('predict')]; req(len(ap)==len(bp)==2 and [q['a'] for q in ap]==[q['a'] for q in bp],'pair/answer '+x)
    req(bp[0]['q']!=bp[1]['q'] and bp[0]['explain']!=bp[1]['explain'],'paired duplicate '+x)
    for i,q in enumerate(bp,1): req(len(q['opts'])==4 and len(set(map(str,q['opts'])))==4 and q.get('hint') and len(q.get('explain',''))>=45 and c['c'][f'{x}:{i}']==str(q['opts'][q['a']]),'checkpoint '+x+':'+str(i))
req(len(c['e'])==pr['exercise_count'] and sum(bool(s.get('predict')) for e in c['e'] for s in e['steps'])==pr['prediction_steps'],'exercise totals')
req(all(sum(bool(s.get('predict')) for s in e['steps'])==pr['prediction_steps_per_exercise'] for e in c['e']),'2 checkpoints/exercise')
req(levels(c['e'])==pr['exercise_level_distribution'] and positions(c['e'])==pr['prediction_answer_distribution'],'exercise distributions')
req(len(c['b'])==pr['compound_set_count'] and sum(len(x.get('qs',[])) for x in c['b'])==pr['compound_question_count'],'compound structure')
req(c['am']==pr['algorithm_mock_count'] and c['aq']==pr['algorithm_mock_quotas'],'algorithm mock')
req(len(c['s'])==pr['security_scenario_count'] and sum(len(x['steps']) for x in c['s'])==pr['security_question_count'] and levels(c['s'])==pr['security_level_distribution'] and secpos(c['s'])==pr['security_answer_distribution'],'security invariants')
req(c['sm']==pr['security_mock_count'] and c['sq']==pr['security_mock_quotas'] and c['fc']==pr['final_counts'],'security mock/final')
req(c['sem'].get('ok') is True,'semantic '+repr(c['sem'].get('errors')))
sp=c.get('spec') or {}; req(sp.get('policy')=='intermediate-state-prediction-authenticity' and set(sp.get('legacyIds',[]))==set(ids) and set(sp.get('contractKeys',[]))==keys and sp.get('qualityAudit')==marker,'runtime spec'); req(p.get('spec') is None,'parent spec')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference')

fx={'name':f'subject-b-algorithm-repairs-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'changed_exercise_ids':ids,'changed_exercise_count':6,'unaffected_exercises_deep_identical_to_parent':True,'subject_a_deep_identical_to_parent':True,'b_compound_sets_deep_identical_to_parent':True,'security_scenarios_deep_identical_to_parent':True,'exercise_count':len(c['e']),'prediction_steps':pr['prediction_steps'],'exercise_level_distribution':levels(c['e']),'prediction_answer_distribution':positions(c['e']),'semantic_contract_migration':{'keys':sorted(ck),'bindings_valid':True},'algorithm_mock_quotas':c['aq'],'security_mock_quotas':c['sq'],'final_counts':c['fc'],'subject_b_semantic_validator_ok':True,'candidate_reference_six_file_byte_equality':True,'source_quality_audit':ident(sa),'learner_facing_change':True,'status':'passed'}
Path(f'_regression/subject-b-algorithm-repairs-{version}.fixture.json').write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_ALGORITHM_REPAIRS_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Algorithm Intermediate-State Repair Audit\n\nPASSED\nPrevious: {previous}\nChanged IDs: {', '.join(ids)}\n\nIsolation: Subject A unchanged; unaffected B_EXERCISES 14/14 unchanged; B_COMPOUND_SETS unchanged; SECURITY_SCENARIOS unchanged.\nInvariants: B_EXERCISES={len(c['e'])}, checkpoints={pr['prediction_steps']}, levels={levels(c['e'])}, answer positions={positions(c['e'])}.\nSemantic contracts: exactly 12 declared keys migrated and rebound. Subject B semantic validation: OK.\nMocks/final: algorithm {c['am']} quotas {c['aq']}; security {c['sm']} quotas {c['sq']}; final {c['fc']}.\nCandidate/reference six-file equality: yes.\nPedagogy: paired checkpoints now require distinct intermediate-state tracking and explanations reconstruct state transitions rather than repeating one immediate operation.\nPolicy: Original FE QUEST wording only; references used only for scope, structure and difficulty calibration.\n''')
print('FEQUEST_SUBJECT_B_ALGORITHM_CONTENT_RELEASE_OK',version,'changed=6','answers='+('/'.join(map(str,positions(c['e'])))))