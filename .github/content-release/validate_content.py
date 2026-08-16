from pathlib import Path
from html.parser import HTMLParser
import base64, hashlib, json, os, re, runpy, subprocess, tempfile


def req(v,m):
    if not v: raise AssertionError(m)
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def ident(p):
    p=Path(p); return {'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}
def extract_js(h): return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))
def context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-content-staging',branch)
    req(m is not None,'content release branch must match vNNN-content-staging')
    version=m.group(1); number=int(m.group(2)); return branch,version,number,f'v{number-1}'

def dump_runtime(html_path):
    html=Path(html_path).read_text()
    js=extract_js(html)
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail="console.log('__FEQ_QB__'+Buffer.from(JSON.stringify({version:APP_VERSION,questions:QUESTION_BANK})).toString('base64'));"
    with tempfile.TemporaryDirectory() as td:
        rp=Path(td)/'dump.js'; rp.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(rp)],capture_output=True,text=True)
        req(z.returncode==0,'runtime dump failed '+z.stderr[-2000:])
        m=re.search(r'__FEQ_QB__([A-Za-z0-9+/=]+)',z.stdout)
        req(m is not None,'question dump marker missing')
        return json.loads(base64.b64decode(m.group(1)).decode())

branch,version,number,previous=context()
manifest_path=Path(f'_release/content-change-{version}.json')
req(manifest_path.exists(),'content manifest missing')
manifest=json.loads(manifest_path.read_text())
req(manifest.get('schema_version')==1,'manifest schema')
req(manifest.get('release')==version and manifest.get('previous_release')==previous,'manifest release mismatch')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(manifest.get('parent_main_sha')==parent,'manifest parent mismatch')

allowed_ids=manifest.get('allowed_question_ids',[])
allowed_fields=set(manifest.get('allowed_changed_question_fields',[]))
req(len(allowed_ids)==len(set(allowed_ids)) and allowed_ids,'allowed ids invalid')
req(allowed_fields=={'q','options','exp','hint','choiceExps','qualityAudit'},'allowed fields policy drift')

# Only explicitly scoped content plus the generic content-release adoption tooling may be committed before materialization.
committed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
tooling={'.github/workflows/content-release-validate.yml','.github/content-release/prepare_reference.py','.github/content-release/validate_content.py'}
expected_committed=set(manifest.get('content_files',[]))|set(manifest.get('assembly_files',[]))|{manifest_path.as_posix()}
for p in tooling:
    r=subprocess.run(['git','cat-file','-e',parent+':'+p],capture_output=True)
    if r.returncode!=0: expected_committed.add(p)
req(committed==expected_committed,'unexpected committed pre-release drift: '+repr(sorted(committed^expected_committed)))

# Content-release tooling must be versionless; on later content releases it must be byte-identical to parent.
tooling_state=[]
for p in sorted(tooling):
    q=Path(p); req(q.exists(),'content tooling missing '+p)
    txt=q.read_text(); req(version not in txt,'target version literal in content tooling '+p)
    r=subprocess.run(['git','show',parent+':'+p],capture_output=True)
    if r.returncode==0:
        req(q.read_bytes()==r.stdout,'content tooling drift '+p)
        tooling_state.append({**ident(p),'parent_byte_identical':True})
    else:
        tooling_state.append({**ident(p),'parent_byte_identical':False})

# Standard release architecture/tooling remains untouched.
stable_paths=[
'app/runtime-diagnostic-wrapper.txt','app/runtime-release-adapter.txt','app/runtime-release-diagnostic-spec.txt',
'_regression/diagnostic-archive-inventory.fixture.json','app/base-stable.html','app/learning-patches.txt',
'app/runtime-semantic-diagnostics.txt','.github/workflows/release-validate.yml','.github/release/release_materialize.py',
'.github/release/prepare_reference.py','.github/release/release_validate.py','.github/release/runtime_stub.py']
for p in stable_paths:
    req(Path(p).read_bytes()==subprocess.check_output(['git','show',parent+':'+p]),'stable parent drift '+p)

candidate=dump_runtime('_site/index.html')
parent_rt=dump_runtime('_site_parent/index.html')
req(candidate['version']==version and parent_rt['version']==previous,'runtime versions')
cq=candidate['questions']; pq=parent_rt['questions']
req(len(cq)==710 and len(pq)==710,'question count')
cm={q['id']:q for q in cq}; pm={q['id']:q for q in pq}
req(len(cm)==710 and len(pm)==710 and set(cm)==set(pm),'question id set')

changed=[]; changed_fields={}
for qid in cm:
    if cm[qid]!=pm[qid]:
        changed.append(qid)
        fields={k for k in set(cm[qid])|set(pm[qid]) if cm[qid].get(k)!=pm[qid].get(k)}
        changed_fields[qid]=sorted(fields)
req(set(changed)==set(allowed_ids),'question change scope mismatch '+repr(sorted(set(changed)^set(allowed_ids))))
for qid in allowed_ids:
    fields=set(changed_fields[qid]); req(fields and fields<=allowed_fields,'unapproved field drift '+qid+': '+repr(sorted(fields)))
    a,b=pm[qid],cm[qid]
    for k in ['id','a','cognitiveLevel','cat','concept']:
        req(a.get(k)==b.get(k),'preserved question field drift '+qid+' '+k)
    req(len(b.get('options',[]))==4 and len(b.get('choiceExps',[]))==4,'four-choice structure '+qid)
    req(b.get('qualityAudit')=='v189-high-severity-repair' if version=='v189' else bool(b.get('qualityAudit')),'quality audit marker '+qid)

answers=[sum(1 for q in cq if q['a']==i) for i in range(4)]
cognitive=[sum(1 for q in cq if q.get('cognitiveLevel')==k) for k in ['想起','適用','判断']]
req(answers==manifest['preserve']['answer_distribution'],'answer distribution')
req(cognitive==manifest['preserve']['cognitive_distribution'],'cognitive distribution')

# v188 high-priority queue is the source of this repair batch when available.
audit188=Path('_regression/subject-a-quality-audit-v188.fixture.json')
if audit188.exists():
    old=json.loads(audit188.read_text())
    high=set(old.get('manual_review_queue',{}).get('high_ids',[]))
    req(set(allowed_ids)<=high,'repair id not in v188 high queue')

# Targeted anti-cue checks for the two flagged short-answer cases.
for qid in ['challenge_v92_12_06','strat-06']:
    if qid in cm:
        lens=[len(str(x)) for x in cm[qid]['options']]
        correct=lens[cm[qid]['a']]
        req(correct>=min(lens)*0.70,'correct option remains conspicuously short '+qid)

fixture=Path(f'_regression/subject-a-repairs-{version}.fixture.json')
audit=Path(f'audits/SUBJECT_A_REPAIRS_{version}.txt')
fx={
 'name':f'subject-a-repairs-{version}',
 'version':version,
 'previous_version':previous,
 'parent_main_sha':parent,
 'scope':'explicit-high-severity-subject-a-content-repair',
 'manifest':ident(manifest_path),
 'content_files':[ident(p) for p in manifest.get('content_files',[])],
 'changed_question_count':len(changed),
 'changed_question_ids':allowed_ids,
 'changed_fields':changed_fields,
 'answer_distribution':answers,
 'cognitive_distribution':{'想起':cognitive[0],'適用':cognitive[1],'判断':cognitive[2]},
 'question_count':len(cq),
 'unique_ids':len(cm),
 'content_release_tooling':tooling_state,
 'standard_release_architecture_byte_identical_to_parent':True,
 'candidate_reference_six_file_byte_equality':all((Path('_site')/p).read_bytes()==(Path('_site_reference')/p).read_bytes() for p in ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']),
 'parent_runtime_comparison':True,
 'learner_facing_change':True,
 'copyright_policy':manifest.get('copyright_policy'),
 'status':'passed'
}
req(fx['candidate_reference_six_file_byte_equality'],'candidate/reference output mismatch')
fixture.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
audit.write_text(f'''FE QUEST {version} — Subject A High-Severity Repair Audit\n=========================================================\n\nScope\n-----\nPrevious: {previous}\nParent main: {parent}\nChanged questions: {len(changed)}\nAllowed fields: {', '.join(sorted(allowed_fields))}\n\nChanged IDs\n-----------\n'''+"\n".join(f'- {x}: {", ".join(changed_fields[x])}' for x in allowed_ids)+f'''\n\nInvariants\n----------\nQuestions: 710 / unique 710\nAnswer distribution: {answers}\nCognitive distribution: 想起{cognitive[0]} / 適用{cognitive[1]} / 判断{cognitive[2]}\nStandard release architecture/tooling: byte-identical to parent\nCandidate/reference six-file equality: yes\nParent/candidate runtime question diff restricted to manifest IDs: yes\n\nPolicy\n------\nOriginal FE QUEST wording only. Attached books are used only for scope, terminology, emphasis and difficulty calibration.\n''')
print(f'FEQUEST_CONTENT_RELEASE_OK version={version} changed={len(changed)} answers={"/".join(map(str,answers))} cognitive={"/".join(map(str,cognitive))} candidate-reference=1 parent-runtime-diff=1')
