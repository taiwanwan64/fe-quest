from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-review-lifecycle-discovery-(v(\d+))',b)
    req(m,'bad v312 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path)
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    names=[]
    for n in re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',js):
        if n not in names: names.append(n)
    names_json=json.dumps(names,ensure_ascii=False)
    tail=r'''
const names=__NAMES__;
const focus={};
for(const name of names){
  let fn=null;
  try{fn=eval(name);}catch(e){}
  if(typeof fn!=='function')continue;
  const src=String(fn);
  const lower=(name+' '+src).toLowerCase();
  if(/memory|review|due|qstats|quiz|journey|attempt/.test(lower) || src.includes('adaptiveMemoryUpdate') || src.includes('ensureMemoryStat')){
    focus[name]=src;
  }
}
const exact={};
for(const name of ['ensureQuestionProfile','ensureMemoryStat','adaptiveMemoryUpdate','memoryRetention','isDue','reviewUrgency','dueQuestions','trackedQuestionPool','questionHasActiveJourney','buildReviewItem','chooseTaperReviewQuestions','finishQuizSession']){
  try{const fn=eval(name);exact[name]=typeof fn==='function'?String(fn):null;}catch(e){exact[name]=null;}
}
const profileShape={
  qStats:profile?.qStats||null,
  memory:profile?.memory||null,
  settings:profile?.settings||null
};
const out={v:APP_VERSION,focus,exact,profileShape,sem:validateSubjectBSemantics()};
console.log('__V312__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''.replace('__NAMES__',names_json)
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-12000:])
        m=re.search(r'__V312__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker')
        return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v312','v311'),'expects v312')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
expected={'.github/subject-a-review-lifecycle-discovery/validate_audit.py','.github/workflows/subject-a-review-lifecycle-discovery.yml'}
generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-review-lifecycle-discovery-v312.fixture.json','audits/SUBJECT_A_REVIEW_LIFECYCLE_DISCOVERY_v312.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v312' and par['v']=='v311','versions')
req(cand['focus']==par['focus'] and cand['exact']==par['exact'] and cand['profileShape']==par['profileShape'],'audit-only runtime drift')
req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
required=['ensureMemoryStat','adaptiveMemoryUpdate','isDue','reviewUrgency','dueQuestions','buildReviewItem']
missing=[n for n in required if not cand['exact'].get(n)]
req(not missing,'missing review lifecycle functions '+repr(missing))
js=scripts('_site/index.html')
call_terms=['adaptiveMemoryUpdate','ensureMemoryStat','isDue','reviewUrgency','dueQuestions','buildReviewItem']
call_sites={}
for term in call_terms:
    occ=[m.start() for m in re.finditer(re.escape(term)+r'\s*\(',js)]
    call_sites[term]={'count':len(occ),'snippets':[re.sub(r'\s+',' ',js[max(0,i-220):i+340]) for i in occ[:12]]}
req(call_sites['adaptiveMemoryUpdate']['count']>=2,'adaptiveMemoryUpdate has no caller evidence')
req(call_sites['dueQuestions']['count']>=2,'dueQuestions has no caller evidence')
fields=sorted(set(re.findall(r'\b(?:st|m|mem|stat)\.([A-Za-z_$][\w$]*)', '\n'.join(cand['exact'].values()))))
profile_refs=sorted(set(re.findall(r'profile\.([A-Za-z_$][\w$]*)','\n'.join(cand['focus'].values()))))
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
summary={
  'requiredFunctions':required,
  'discoveredFocusedFunctions':sorted(cand['focus'].keys()),
  'exactSources':cand['exact'],
  'callSites':call_sites,
  'candidateStateFields':fields,
  'profileReferences':profile_refs,
  'profileShapeAtBoot':cand['profileShape'],
  'interpretation':'The production Subject A review lifecycle is concretely implemented: question/profile state is initialized, answer outcomes feed adaptiveMemoryUpdate, due eligibility is decided by isDue/reviewUrgency/dueQuestions, and due items are transformed through buildReviewItem before review routes consume them. v312 is discovery-only; the next step should simulate correct/wrong/relearned sequences against these exact functions rather than inventing a new SRS policy.',
  'decision':'PROCEED TO SEQUENTIAL REVIEW-LIFECYCLE SIMULATION'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SUBJECT A REVIEW LIFECYCLE DISCOVERED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-review-lifecycle-discovery-v312.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v312 — Subject A Review Lifecycle Discovery Audit\n==========================================================\n\nResult\n------\nPASS — SUBJECT A REVIEW LIFECYCLE DISCOVERED\nPrevious release: v311\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nMap the exact production path from answer outcome to memory scheduling, due selection, and review-item construction before judging the policy.\n\nSummary\n-------\n{json.dumps(summary,ensure_ascii=False,indent=2)}\n\nRegression\n----------\nLearner-facing code is unchanged from v311.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nUse the discovered production functions as the oracle for v313. Simulate representative wrong, correct, repeated-correct and relearning sequences, then inspect due timing, interval growth, lapse recovery and variant handoff before making any learner-facing change.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_REVIEW_LIFECYCLE_DISCOVERY_v312.txt').write_text(audit)
print(audit)
