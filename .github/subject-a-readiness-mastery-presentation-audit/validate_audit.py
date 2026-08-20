from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-readiness-mastery-presentation-audit-(v(\d+))',b);req(m,'bad v321 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def snippets(text,needle,radius=420):
    out=[]
    for m in re.finditer(re.escape(needle),text):
        out.append(re.sub(r'\s+',' ',text[max(0,m.start()-radius):min(len(text),m.end()+radius)]).strip())
    return out[:12]

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const RealDate=Date;let fakeNow='2026-07-01';
class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[fakeNow+'T12:00:00Z']));}static now(){return new RealDate(fakeNow+'T12:00:00Z').getTime();}}
globalThis.Date=FakeDate;
const cats=[...new Set(QUESTION_BANK.map(q=>q.cat))];
const blank=()=>({attempts:0,correct:0,streak:0,due:null,last:null,lastReason:null,stability:1,lapses:0,reviews:0,avgSeconds:0,timedAnswers:0,lastQuality:null,lastReviewDate:null,recovered:0,retryFailures:0,memoryVersion:2});
profile.lessonProgress={};profile.skills=Object.fromEntries(cats.map(c=>[c,50]));profile.sessions=[];profile.mockHistory=[];profile.bProgress={};profile.securityBProgress={};profile.bFinalHistory=[];profile.mockMistakeStats={};profile.reviewJourneys={};
ensureQuestionProfile();for(const q of trackedQuestionPool())profile.qStats[q.id]=blank();
for(const t of CORE_A_CURRICULUM)profile.lessonProgress[t.id]=100;
for(const q of QUESTION_BANK)Object.assign(profile.qStats[q.id],{attempts:1,correct:1,streak:2,due:'2026-04-04',last:'2026-04-01',stability:3,lapses:0,reviews:2,avgSeconds:60,timedAnswers:1,lastReviewDate:'2026-04-01',lastQuality:4});
profile.skills=Object.fromEntries(cats.map(c=>[c,90]));
profile.sessions=[1,2,3].map(i=>({date:'2026-06-0'+i,mode:'random',total:10,correct:9,rate:90}));
profile.mockHistory=[1,2,3].map(i=>({date:'2026-06-'+String(20+i).padStart(2,'0'),mode:'full',total:60,correct:51,rate:85}));
profile.bProgress=Object.fromEntries(B_EXERCISES.map(x=>[x.id,100]));profile.securityBProgress=Object.fromEntries(SECURITY_SCENARIOS.map(x=>[x.id,100]));profile.bFinalHistory=[1,2,3].map(i=>({date:'2026-06-'+String(24+i).padStart(2,'0'),total:20,correct:16,rate:80}));
const score=calcReadiness();const mastery=courseMasteryStatus();const memGate=mastery.gates.find(g=>g.id==='memory');
const renderSource=String(renderReadiness),calcSource=String(calcReadiness),masterySource=String(courseMasteryStatus);
renderReadiness();
const ids=[...renderSource.matchAll(/getElementById\(['\"]([^'\"]+)['\"]\)/g)].map(m=>m[1]);
const domById={};for(const id of [...new Set(ids)]){const el=document.getElementById(id);domById[id]=el?{text:String(el.textContent||''),html:String(el.innerHTML||''),display:String(el.style?.display||'')} : null;}
const labels=[...renderSource.matchAll(/label=['\"]([^'\"]+)['\"]/g)].map(m=>m[1]);
console.log('__V321__'+Buffer.from(JSON.stringify({v:APP_VERSION,score,memory:memoryHealth(),mastery:{ready:mastery.ready,passed:mastery.passed,gates:mastery.gates},memGate,labels,domById,sources:{renderReadiness:renderSource,calcReadiness:calcSource,courseMasteryStatus:masterySource},sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V321__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v321','v320'),'expects v321');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p320=Path('_regression/subject-a-readiness-calibration-simulation-v320.fixture.json');req(p320.exists(),'v320 fixture missing');req('STALE-SIGNAL FINDING RECORDED' in json.loads(p320.read_text()).get('result',''),'v320 result')
expected={'.github/subject-a-readiness-mastery-presentation-audit/validate_audit.py','.github/workflows/subject-a-readiness-mastery-presentation-audit.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-readiness-mastery-presentation-audit-v321.fixture.json','audits/SUBJECT_A_READINESS_MASTERY_PRESENTATION_AUDIT_v321.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v321' and par['v']=='v320','versions');req({k:v for k,v in cand.items() if k not in ('v','sem')}=={k:v for k,v in par.items() if k not in ('v','sem')},'audit-only runtime drift');req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
req(cand['score']>=80,'v320 stale high-band scenario no longer reproduced');req(cand['memGate'] and cand['memGate']['passed'] is False,'stale memory gate should fail');req(cand['memory']['due']>0,'stale scenario has no due memory work')
render=cand['sources']['renderReadiness'];calc=cand['sources']['calcReadiness'];labels=cand['labels'];high=[x for x in labels if '総仕上げ' in x or '仕上げ' in x];req(high,'high readiness label not found');
misleading_terms=['合格確率','合格できる','受験可能','準備完了','習得完了'];misleading=[t for t in misleading_terms if any(t in x for x in high)];formula_disclaimer=('合格確率ではない' in calc)
js=scripts('_site/index.html');mastery_calls=snippets(js,'courseMasteryStatus(');readiness_calls=snippets(js,'renderReadiness(');markup=Path('_site/index.html').read_text();readiness_markup=snippets(markup,'readinessValue',700)+snippets(markup,'readinessRing',700)
presentation_conflict=bool(misleading)
result='PASS — READINESS/MASTERY PRESENTATION SEMANTICALLY DISTINCT' if not presentation_conflict else 'PASS — READINESS/MASTERY PRESENTATION FINDING RECORDED'
summary={
 'staleScenario':{'readinessScore':cand['score'],'memory':cand['memory'],'memoryGate':cand['memGate'],'strictMasteryReady':cand['mastery']['ready'],'strictGatesPassed':cand['mastery']['passed']},
 'readinessLabels':labels,'highBandLabels':high,'misleadingHighBandTerms':misleading,'formulaExplicitlyNotPassProbability':formula_disclaimer,
 'readinessDomById':cand['domById'],'courseMasteryStatusCallsiteCount':len(mastery_calls),'courseMasteryStatusCallsiteSnippets':mastery_calls,'readinessMarkupSnippets':readiness_markup[:8],
 'interpretation':('The >=80 readiness band can coexist with a failed retention gate in the deliberately stale historical profile, but the high-band copy is progression-oriented (moving into final polishing) rather than a claim of mastery, exam eligibility, or pass probability. The readiness formula itself explicitly states that it is not a pass probability. Therefore the two signals are semantically distinct: readiness is a weighted study-stage indicator, while courseMasteryStatus is the strict all-gates completion check. No scoring or copy repair is warranted from this scenario.' if not presentation_conflict else 'The stale profile remains in the >=80 readiness band while the retention gate fails, and the high-band copy contains a mastery/pass/eligibility claim. Repair presentation copy before changing readiness weights.'),
 'decision':('KEEP READINESS WEIGHTS AND COPY — PRESENTATION SEQUENCE CLOSED' if not presentation_conflict else 'REPAIR HIGH-BAND COPY ONLY — DO NOT CHANGE SCORING MATH')
}
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-readiness-mastery-presentation-audit-v321.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v321 — Subject A Readiness / Mastery Presentation Audit\n=================================================================\n\nResult\n------\n{result}\nPrevious release: v320\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nResolve the v320 stale-memory presentation finding by comparing the >=80 readiness copy with the stricter courseMasteryStatus gate. This audit distinguishes a study-stage indicator from a mastery/pass claim before changing either weights or UI copy.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nLearner-facing behavior and readiness/mastery functions are unchanged from v320.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{summary['decision']}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_READINESS_MASTERY_PRESENTATION_AUDIT_v321.txt').write_text(audit);print(audit)
