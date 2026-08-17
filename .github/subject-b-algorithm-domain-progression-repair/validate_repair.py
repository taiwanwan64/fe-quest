from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-algorithm-domain-progression-repair-(v(\d+))',branch)
    req(m,'bad Subject B algorithm-domain progression repair branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x227000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function allProgress(items,value){return Object.fromEntries(items.map(x=>[x.id,value]));}
function finalRow(rate,algoCorrect,secCorrect,date='2026-08-17'){return {rate,correct:algoCorrect+secCorrect,blank:0,algoCorrect,secCorrect,date,seconds:4200};}
function resetFirstFinal(){
  profile.settings={...(profile.settings||{}),examDate:''};
  profile.bProgress=allProgress(B_EXERCISES,100);
  profile.securityBProgress=allProgress(SECURITY_SCENARIOS,100);
  profile.bCompoundStats={};
  for(const s of B_COMPOUND_SETS.slice(0,3))profile.bCompoundStats[s.id]={seen:1,correct:3,lastSeen:'2026-08-17'};
  profile.bMockHistory=[{rate:20,date:'2026-08-17'}];
  profile.securityMockHistory=[{rate:90,date:'2026-08-17'}];
  profile.bCompoundHistory=[{rate:100,date:'2026-08-17'},{rate:100,date:'2026-08-16'},{rate:100,date:'2026-08-15'}];
  profile.bFinalHistory=[finalRow(40,4,4)];
  profile.bFinalStats={};
  profile.bFinalMistakeStats={};
  delete profile.subjectBReadinessV222;
  delete profile.subjectBAlgorithmDomainV227;
}
function addMistake(item,misses=1,seen=1){
  const d=makeFinalAlgoExam(item),key=bFinalMistakeKey(d);
  profile.bFinalStats[`algo:${d.sourceId}`]={seen,correct:Math.max(0,seen-misses),lastSeen:'2026-08-17'};
  profile.bFinalMistakeStats[key]={misses,last:'2026-08-17',lastReason:'コード理解',reasons:{'コード理解':misses}};
  return key;
}
function injectConcentrated(domain){
  const top=B_EXAM_ALGO_ITEMS.filter(x=>x.domain===domain).slice(0,3);
  const others=[];
  for(const d of Object.keys(B_EXAM_ALGO_ITEMS.reduce((m,x)=>(m[x.domain]=1,m),{}))){
    if(d===domain)continue;
    const item=B_EXAM_ALGO_ITEMS.find(x=>x.domain===d);
    if(item)others.push(item);
    if(others.length===5)break;
  }
  top.forEach(x=>addMistake(x,1,1));
  others.forEach(x=>addMistake(x,1,2));
}
function injectDiffuse(){
  B_EXAM_ALGO_ITEMS.filter(x=>x.domain==='木構造').slice(0,2).forEach(x=>addMistake(x,1,1));
  B_EXAM_ALGO_ITEMS.filter(x=>x.domain==='ビット列').slice(0,2).forEach(x=>addMistake(x,1,1));
  const used=new Set(['木構造','ビット列']);let n=0;
  for(const x of B_EXAM_ALGO_ITEMS){if(used.has(x.domain))continue;addMistake(x,1,2);used.add(x.domain);if(++n===4)break;}
}
function injectSparse(domain){
  const item=B_EXAM_ALGO_ITEMS.find(x=>x.domain===domain);addMistake(item,6,6);
}
function recSnap(){const r=subjectBHubRecommendation();return {stage:r.stage,mode:r.mode,id:r.id||null,title:r.title,kicker:r.kicker||'',desc:r.desc};}
function markerSnap(){const m=profile.subjectBAlgorithmDomainV227;return m?JSON.parse(JSON.stringify(m)):null;}
function concentratedProbe(domain){
  resetFirstFinal();injectConcentrated(domain);
  const first=recSnap(),marker=markerSnap(),second=recSnap();
  const normalized=normalizeProfileData(JSON.parse(JSON.stringify(profile)));
  const markerPreserved=JSON.stringify(normalized.subjectBAlgorithmDomainV227||null)===JSON.stringify(marker);
  let unrelated=null,afterTarget=null,low=null,pass=null,directBeforeHub=null;
  if(typeof subjectBMarkAlgorithmDomainTraceCompleteV227==='function'&&marker){
    const unrelatedId=B_EXERCISES.find(x=>x.id!==marker.targetId)?.id;
    subjectBMarkAlgorithmDomainTraceCompleteV227(unrelatedId);unrelated=recSnap();
    subjectBMarkAlgorithmDomainTraceCompleteV227(marker.targetId);afterTarget=recSnap();
    profile.bMockHistory.unshift({rate:64,date:'2026-08-18'});low=recSnap();
    profile.bMockHistory.unshift({rate:65,date:'2026-08-19'});pass=recSnap();
    resetFirstFinal();injectConcentrated(domain);
    const target=(typeof subjectBAlgorithmDomainContextV227==='function')?subjectBAlgorithmDomainContextV227()?.target:null;
    if(target){subjectBMarkAlgorithmDomainTraceCompleteV227(target.id);directBeforeHub=recSnap();}
  }
  return {domain,first,second,marker,markerPreserved,unrelated,afterTarget,low,pass,directBeforeHub};
}
function diffuseProbe(){resetFirstFinal();injectDiffuse();return {rec:recSnap(),marker:markerSnap(),evidence:typeof subjectBAlgorithmDomainEvidenceV227==='function'?subjectBAlgorithmDomainEvidenceV227():null};}
function sparseProbe(){resetFirstFinal();injectSparse('木構造');return {rec:recSnap(),marker:markerSnap(),evidence:typeof subjectBAlgorithmDomainEvidenceV227==='function'?subjectBAlgorithmDomainEvidenceV227():null};}
function securityProbe(){
  resetFirstFinal();profile.bMockHistory=[{rate:90,date:'2026-08-17'}];profile.securityMockHistory=[{rate:20,date:'2026-08-17'}];profile.bFinalHistory=[finalRow(40,12,0)];return recSnap();
}
function compoundProbe(){
  resetFirstFinal();profile.bMockHistory=[{rate:90,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:20,date:'2026-08-17'},{rate:20,date:'2026-08-16'},{rate:20,date:'2026-08-15'}];return recSnap();
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
const hasV227=typeof SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC!=='undefined';
console.log('__V227__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,hasV227,
  spec:hasV227?SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC:null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),coverage:remediationCoverage(),
  tree:concentratedProbe('木構造'),bit:concentratedProbe('ビット列'),diffuse:diffuseProbe(),sparse:sparseProbe(),security:securityProbe(),compound:compoundProbe()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V227__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v227' and previous=='v226','v227 domain progression repair expects v226 parent')
source=Path('audits/SUBJECT_B_ALGORITHM_DOMAIN_DIAGNOSIS_AUDIT_v226.txt')
req(source.exists(),'v226 algorithm-domain diagnosis evidence missing')
st=source.read_text()
req('PASS — MEDIUM FINDING RECORDED' in st and 'algorithm_domain_weakness_not_aggregated_for_progression' in st,'v226 medium finding evidence drift')
manifest=json.loads(Path('_release/content-change-v227.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'v227 content manifest parent/source drift')
req(manifest['source_priority_tier']=='medium' and manifest['quality_audit_marker']=='algorithm_domain_weakness_not_aggregated_for_progression','v227 manifest finding drift')
req(manifest['content_files']==['app/subject-b-algorithm-domain-progression-overrides-v227.txt'] and manifest['assembly_files']==['index.html'],'v227 approved file scope drift')
expected={
  '.github/subject-b-algorithm-domain-progression-repair/validate_repair.py',
  '.github/workflows/subject-b-algorithm-domain-progression-repair.yml',
  '_release/content-change-v227.json',
  'app/subject-b-algorithm-domain-progression-overrides-v227.txt',
  'index.html'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v227 repair source drift: '+repr(sorted(changed^expected)))
for path in ['app/base-stable.html','app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt']:
    req(Path(path).read_bytes()==subprocess.check_output(['git','show',parent+':'+path]),'preserved learner-facing source drift: '+path)

html,cand=runtime('_site/index.html')
_,par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['hasV227'] is True and par['hasV227'] is False,'v227 repair presence boundary')
req(cand['counts']==par['counts']==[20,16,4],'final counts drift')
req(cand['seconds']==par['seconds']==6000,'time limit drift')
req(cand['pool']==par['pool']==43,'algorithm pool drift')
req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift')
req(cand['floor']==par['floor']==4,'high-trace floor drift')
req(cand['orderSpec']==par['orderSpec'],'v214 order spec drift')
req(cand['recoverySpec']==par['recoverySpec'],'v217 recovery spec drift')
req(cand['xpSpec']==par['xpSpec'],'v219 XP spec drift')
req(cand['readinessSpec']==par['readinessSpec'],'v222 readiness spec drift')
req(cand['copySpec']==par['copySpec'],'v224 readiness copy spec drift')
req(cand['selectionSig']==par['selectionSig'],'1000-seed selection/order drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(cand['coverage']==par['coverage'],'direct remediation coverage changed')
req(cand['coverage']['algorithm']==43 and not cand['coverage']['algoBad'],'algorithm remediation coverage drift')
req(cand['coverage']['security']==15 and not cand['coverage']['secBad'],'security remediation coverage drift')

spec=cand['spec'] or {}
req(spec.get('policy')=='route-concentrated-first-final-algorithm-weakness-through-existing-domain-trace-before-generic-mini-mock','v227 policy missing')
req(spec.get('minTotalMistakes')==4 and spec.get('minDomainMistakes')==2 and spec.get('minDistinctItems')==2,'v227 evidence-count thresholds drift')
req(spec.get('minDomainErrorRatePercent')==75 and spec.get('minDomainMistakeSharePercent')==20 and spec.get('equalMistakeCountRateLeadPercent')==25,'v227 concentration thresholds drift')
req(spec.get('fallbackMode')=='miniMock' and spec.get('reusesExistingDomainLabels') is True and spec.get('reusesExistingRemediationTargets') is True,'v227 reuse/fallback contract drift')
req(spec.get('readinessThresholdChanged') is False and spec.get('questionSelectionChanged') is False and spec.get('scoringChanged') is False and spec.get('timingChanged') is False,'v227 protected contracts drift')
req(spec.get('securityRoutingChanged') is False and spec.get('directFinalRemediationChanged') is False,'v227 non-algorithm routing drift')

for domain,key in [('木構造','tree'),('ビット列','bit')]:
    row=cand[key];base=par[key]
    req(base['first']['mode']=='miniMock','parent concentrated scenario no longer generic: '+domain)
    req(row['first']['mode']=='trace' and row['first']['id'] and domain in row['first']['title'],'concentrated domain not routed to TRACE: '+domain)
    req(row['marker'] and row['marker']['domain']==domain and row['marker']['targetId']==row['first']['id'] and row['marker']['completed'] is False,'domain marker mismatch: '+domain)
    req(row['second']==row['first'],'domain recommendation not stable across rerender: '+domain)
    req(row['markerPreserved'] is True,'domain marker lost during normalization: '+domain)
    req(row['unrelated']==row['first'],'unrelated TRACE incorrectly satisfied focused remediation: '+domain)
    req(row['afterTarget']['mode']=='miniMock' and row['afterTarget']['title']=='アルゴリズム ミニ模試で準備','target TRACE did not return to existing mini-mock gate: '+domain)
    req(row['low']['mode']=='miniMock' and '65%以上' in row['low']['desc'],'sub-65 algorithm mini-mock unexpectedly unlocks final: '+domain)
    req(row['pass']['mode']=='final','65% algorithm mini-mock did not unlock existing final route: '+domain)
    req(row['directBeforeHub']['mode']=='miniMock','direct result-screen TRACE completion is redundantly recommended again: '+domain)

req(cand['tree']['first']['id']!=cand['bit']['first']['id'],'distinct domains collapse to one TRACE target')
req(cand['diffuse']['rec']==par['diffuse']['rec'] and cand['diffuse']['rec']['mode']=='miniMock','diffuse evidence must keep generic mini-mock fallback')
req(cand['diffuse']['marker'] is None and cand['diffuse']['evidence']['qualifies'] is False,'diffuse evidence incorrectly marked concentrated')
req(cand['sparse']['rec']==par['sparse']['rec'] and cand['sparse']['rec']['mode']=='miniMock','sparse evidence must keep generic mini-mock fallback')
req(cand['sparse']['marker'] is None and cand['sparse']['evidence']['qualifies'] is False,'single-item evidence incorrectly marked concentrated')
req(cand['security']==par['security'] and cand['security']['mode']=='securityMock','security first-final routing changed')
req(cand['compound']==par['compound'] and cand['compound']['mode']=='compound','compound first-final routing changed')

for token in ['SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC','subjectBAlgorithmDomainEvidenceV227','subjectBMarkAlgorithmDomainTraceCompleteV227','const _subjectBHubRecommendationV227=subjectBHubRecommendation;','const _finishBExerciseV227=finishBExercise;']:
    req(token in html,'v227 integration token missing: '+token)
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')

fixture={
  'name':f'subject-b-algorithm-domain-progression-repair-{version}',
  'version':version,'previous':previous,'sourceMain':parent,'learnerFacingChange':True,
  'resolvedFinding':'algorithm_domain_weakness_not_aggregated_for_progression','spec':spec,
  'concentratedScenarios':{'tree':cand['tree'],'bit':cand['bit']},
  'fallbackScenarios':{'diffuse':cand['diffuse'],'sparse':cand['sparse']},
  'preservedRoutes':{'security':cand['security'],'compound':cand['compound']},
  'runtimePreservation':{
    'finalCounts':cand['counts'],'timeLimitSeconds':cand['seconds'],'algorithmPool':cand['pool'],
    'highTraceCount':len(cand['high']),'highTraceFloor':cand['floor'],'selectionSignature1000Unchanged':True,'semanticValidatorOk':True
  },
  'remediationCoverage':cand['coverage'],'candidateReferenceSixFileEqual':True,
  'findings':{'high':[],'medium':[],'low':[]},'status':'passed-no-findings'
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-algorithm-domain-progression-repair-v227.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_REPAIR_v227.txt').write_text(f'''FE QUEST v227 — Subject B Algorithm Domain Progression Repair\n=============================================================================\n\nResult\n------\nPASS — NO FINDINGS\nPrevious: v226\nSource main: {parent}\nLearner-facing change in v227: yes\n\nResolved finding\n----------------\nalgorithm_domain_weakness_not_aggregated_for_progression\nThe first-final algorithm remediation route now uses the already-persisted per-item mistake evidence and existing ten-domain labels to identify a sufficiently concentrated weak domain. When the evidence is concentrated, the hub recommends the existing domain TRACE exercise before returning to the unchanged algorithm mini-mock readiness gate.\n\nConcentration boundary\n----------------------\nFocused routing requires at least 4 total algorithm mistakes, at least 2 mistakes across 2 distinct items in the leading domain, a domain error rate of at least 75%, at least 20% of total algorithm mistakes, and a clear lead over the second domain. Equal mistake counts require a 25-point error-rate lead. Sparse, single-item, tied, or diffuse evidence keeps the generic algorithm mini-mock recommendation.\n\nLearner-flow proof\n------------------\n木構造-heavy evidence -> {cand['tree']['first']['title']} / {cand['tree']['first']['id']}\nビット列-heavy evidence -> {cand['bit']['first']['title']} / {cand['bit']['first']['id']}\nThe targets are distinct and come from the existing final-result remediation map. Unrelated TRACE completion does not satisfy the focused step. Completing the recommended TRACE returns the learner to アルゴリズム ミニ模試で準備; 64% remains there and 65% returns to final practice through the unchanged v222 readiness calculation. Completing the same domain TRACE directly from the final-result review also counts, so the hub does not redundantly request it again.\n\nFallback proof\n--------------\nDiffuse/tied domain evidence -> generic algorithm mini-mock.\nSingle-item sparse evidence -> generic algorithm mini-mock.\nSecurity first-final routing -> unchanged.\nCompound first-final routing -> unchanged.\n\nPreserved contracts\n-------------------\n1000 deterministic final-session seeds matched v226 selection/order.\n100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.\nv214 final order, v217 recovery entry, v219 XP display, v222 readiness calculation and 65% threshold, and v224 compound evidence copy are unchanged.\nAlgorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.\nSubject B semantic validation: OK.\nCandidate/reference generated six release files byte-identical: yes.\n\nFindings summary\n----------------\nHigh: 0\nMedium: 0\nLow: 0\n\nDecision\n--------\nThe v226 medium finding is repaired inside a deliberately narrow recommendation boundary. Keep the domain-focused TRACE step advisory to progression and preserve the existing mini-mock/final readiness gate. The next release should audit the post-repair learner flow rather than broaden the taxonomy or alter scoring.\n''')
print('FEQUEST_SUBJECT_B_DOMAIN_PROGRESSION_REPAIR_OK version=v227 concentrated=2 fallback=2 selection=1000 candidate-reference=1 findings=0')
