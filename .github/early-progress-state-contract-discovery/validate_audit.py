from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'early-progress-state-contract-discovery-(v(\d+))',b);req(m,'bad v327 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];names=sorted(set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',js)))
    tail=r'''
const names=__NAMES__;
const rules={
 lesson:[/lesson/i,/complete|progress|done|finish|master/i],
 answer:[/answer|attempt|question|mistake/i,/profile|history|push|save/i],
 subjectB:[/subjectB|bFinal|bMini|bSecurity|trace/i,/profile|history|performance|attempt|result/i],
 review:[/review|due|retention|srs|schedule/i,/profile|journey|history|queue|push|save/i],
 calendar:[/streak|calendar|session|studyLog|daily/i,/profile|history|push|save|date/i],
 persist:[/save|persist|atomic|storage|profile/i,/localStorage|setItem|saveProfile|commit|revision/i]
};
const out={};for(const k of Object.keys(rules))out[k]=[];
for(const n of names){let f,s;try{f=eval(n);if(typeof f!=='function')continue;s=String(f)}catch(e){continue}
  for(const [k,rs] of Object.entries(rules)){if(rs.every(r=>r.test(n+'\n'+s))){let score=0;for(const token of ['profile.','.push(','localStorage.setItem','saveProfile','reviewJourney','subjectB','completed','history','streak'])if(s.includes(token))score++;out[k].push({name:n,score,source:s.slice(0,3000)});}}
}
for(const k of Object.keys(out))out[k].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)),out[k]=out[k].slice(0,8);
const profileShape={keys:Object.keys(profile).sort(),settings:Object.keys(profile.settings||{}).sort(),lessonKeys:Object.keys(profile.lessons||profile.lessonProgress||{}).slice(0,10),subjectBKeys:Object.keys(profile.subjectBPerformanceV254||{}).sort(),reviewJourneyKeys:Object.keys(profile.reviewJourney||{}).sort()};
const exact={};for(const n of ['saveProfile','markLessonComplete','completeLesson','recordAnswer','recordQuestionResult','recordSubjectBPerformance','recordSubjectBResponse','scheduleReview','recordStudyDay','updateStreak']){try{const f=eval(n);exact[n]=typeof f==='function'?String(f).slice(0,5000):null}catch(e){exact[n]=null}}
console.log('__V327__'+Buffer.from(JSON.stringify({v:APP_VERSION,profileShape,exact,candidates:out,sem:validateSubjectBSemantics()})).toString('base64'));
'''.replace('__NAMES__',json.dumps(names))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V327__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v327','v326'),'expects v327');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p326=Path('_regression/first-run-onboarding-discovery-v326.fixture.json');req(p326.exists(),'v326 fixture missing');req(json.loads(p326.read_text()).get('result')=='PASS — FRESH RUNTIME PRODUCES ACTIONABLE FIRST-DAY PLAN','v326 result')
expected={'.github/early-progress-state-contract-discovery/validate_audit.py','.github/workflows/early-progress-state-contract-discovery.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/early-progress-state-contract-discovery-v327.fixture.json','audits/EARLY_PROGRESS_STATE_CONTRACT_DISCOVERY_v327.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v327' and par['v']=='v326','versions');req(cand['profileShape']==par['profileShape'] and cand['exact']==par['exact'] and cand['candidates']==par['candidates'],'audit-only state-contract drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
counts={k:len(v) for k,v in cand['candidates'].items()};core=['lesson','answer','subjectB','review','persist'];resolved={k:counts.get(k,0)>0 for k in core};result='PASS — EARLY-PROGRESS MUTATION SURFACES RESOLVED' if all(resolved.values()) else 'FINDING — EARLY-PROGRESS MUTATION SURFACE INCOMPLETE'
summary={'profileShape':cand['profileShape'],'exactNamedFunctions':{k:v for k,v in cand['exact'].items() if v},'candidateCounts':counts,'coreResolved':resolved,'candidates':cand['candidates'],'interpretation':'This is a discovery audit, not a fabricated first-week simulation. It inventories the production mutation/persistence surfaces that can legitimately create lesson progress, answer history, Subject B performance, review state and saved profile state. The next simulation should mutate early-use state only through the strongest resolved production routes (or their direct state contracts if an event handler owns the mutation), then rebuild the today plan after each state transition.','decision':'PROCEED TO CONTROLLED EARLY-USE STATE-TRANSITION SIMULATION' if all(resolved.values()) else 'RUN A NARROW DETAIL AUDIT FOR UNRESOLVED MUTATION CATEGORIES BEFORE SIMULATION'}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/early-progress-state-contract-discovery-v327.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v327 — Early-Progress State Contract Discovery\n========================================================\n\nResult\n------\n{result}\nPrevious release: v326\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nResolve the canonical production state-transition surfaces needed to model the first several uses after v326 established that a fresh profile gets an actionable first-day plan. This audit deliberately avoids hand-editing learner state or claiming a real seven-day learning outcome.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and the discovered state contracts are unchanged from v326.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{summary['decision']}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EARLY_PROGRESS_STATE_CONTRACT_DISCOVERY_v327.txt').write_text(audit);print(audit)
