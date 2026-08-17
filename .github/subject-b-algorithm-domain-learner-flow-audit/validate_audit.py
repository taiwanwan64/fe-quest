from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-algorithm-domain-learner-flow-audit-(v(\d+))',branch)
    req(m,'bad Subject B algorithm-domain learner-flow audit branch')
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
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x228000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
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
  const used=new Set([domain]);let n=0;
  top.forEach(x=>addMistake(x,1,1));
  for(const x of B_EXAM_ALGO_ITEMS){
    if(used.has(x.domain))continue;
    addMistake(x,1,2);used.add(x.domain);if(++n===5)break;
  }
}
function injectDiffuse(){
  const domains=['木構造','ビット列','制御','一次元配列'];
  for(const domain of domains){
    const rows=B_EXAM_ALGO_ITEMS.filter(x=>x.domain===domain).slice(0,2);
    rows.forEach(x=>addMistake(x,1,1));
  }
}
function injectSparse(domain){
  const item=B_EXAM_ALGO_ITEMS.find(x=>x.domain===domain);addMistake(item,6,6);
}
function recSnap(name){const r=subjectBHubRecommendation();return {name,stage:r.stage,mode:r.mode,id:r.id||null,title:r.title,kicker:r.kicker||'',desc:r.desc};}
function markerSnap(){const m=profile.subjectBAlgorithmDomainV227;return m?JSON.parse(JSON.stringify(m)):null;}
function focusedFlow(domain){
  resetFirstFinal();injectConcentrated(domain);
  const first=recSnap('focused_first'),marker=markerSnap();
  const second=recSnap('focused_rerender');
  const normalized=normalizeProfileData(JSON.parse(JSON.stringify(profile)));
  const normalizedMarker=normalized.subjectBAlgorithmDomainV227||null;
  const unrelatedId=B_EXERCISES.find(x=>x.id!==marker?.targetId)?.id||null;
  if(unrelatedId)subjectBMarkAlgorithmDomainTraceCompleteV227(unrelatedId);
  const unrelated=recSnap('after_unrelated_trace');
  if(marker?.targetId)subjectBMarkAlgorithmDomainTraceCompleteV227(marker.targetId);
  const afterTarget=recSnap('after_target_trace');
  profile.bMockHistory.unshift({rate:64,date:'2026-08-18'});
  const after64=recSnap('after_mini_64');
  profile.bMockHistory.unshift({rate:65,date:'2026-08-19'});
  const after65=recSnap('after_mini_65');

  resetFirstFinal();injectConcentrated(domain);
  const directTarget=subjectBAlgorithmDomainContextV227()?.target||null;
  if(directTarget)subjectBMarkAlgorithmDomainTraceCompleteV227(directTarget.id);
  const directReviewCompletion=recSnap('direct_review_completion');
  return {domain,first,second,marker,normalizedMarker,unrelated,afterTarget,after64,after65,directTarget,directReviewCompletion};
}
function refreshProbe(){
  resetFirstFinal();injectConcentrated('木構造');
  const before=recSnap('refresh_before'),oldMarker=markerSnap();
  profile.bFinalHistory=[finalRow(35,3,4,'2026-08-18')];
  profile.bFinalStats={};profile.bFinalMistakeStats={};injectConcentrated('ビット列');
  const after=recSnap('refresh_after'),newMarker=markerSnap();
  return {before,oldMarker,after,newMarker};
}
function fallbackProbe(){
  resetFirstFinal();injectDiffuse();const diffuse={rec:recSnap('diffuse'),marker:markerSnap(),evidence:subjectBAlgorithmDomainEvidenceV227()};
  resetFirstFinal();injectSparse('木構造');const sparse={rec:recSnap('sparse'),marker:markerSnap(),evidence:subjectBAlgorithmDomainEvidenceV227()};
  return {diffuse,sparse};
}
function boundaryProbe(){
  resetFirstFinal();injectConcentrated('木構造');profile.bFinalHistory=[finalRow(65,9,4)];const firstFinal65=recSnap('first_final_65');
  resetFirstFinal();injectConcentrated('木構造');profile.bMockHistory=[{rate:90,date:'2026-08-17'}];profile.securityMockHistory=[{rate:20,date:'2026-08-17'}];profile.bFinalHistory=[finalRow(40,12,0)];const security=recSnap('security');
  resetFirstFinal();injectConcentrated('木構造');profile.bMockHistory=[{rate:90,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:20,date:'2026-08-17'},{rate:20,date:'2026-08-16'},{rate:20,date:'2026-08-15'}];const compound=recSnap('compound');
  resetFirstFinal();injectConcentrated('木構造');const oldExam=examDaysRemaining;examDaysRemaining=()=>2;const taper=recSnap('exam_two_days');examDaysRemaining=oldExam;
  resetFirstFinal();injectConcentrated('木構造');profile.bFinalHistory=[finalRow(90,14,4),finalRow(85,13,4,'2026-08-16')];profile.bMockHistory=[{rate:20,date:'2026-08-17'}];const maintenance=recSnap('two_final_maintenance');
  profile.bProgress=allProgress(B_EXERCISES,0);profile.securityBProgress=allProgress(SECURITY_SCENARIOS,0);profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];profile.bFinalHistory=[];profile.bFinalStats={};profile.bFinalMistakeStats={};delete profile.subjectBReadinessV222;delete profile.subjectBAlgorithmDomainV227;const newLearner=recSnap('new_learner');
  return {firstFinal65,security,compound,taper,maintenance,newLearner};
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
function functionEvidence(){
  return {
    hubWrapsDomainContext:String(subjectBHubRecommendation).includes('subjectBAlgorithmDomainContextV227'),
    finishMarksFocusedTrace:String(finishBExercise).includes('subjectBMarkAlgorithmDomainTraceCompleteV227'),
    markerFunctionPresent:typeof subjectBMarkAlgorithmDomainTraceCompleteV227==='function'
  };
}
console.log('__V228__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  spec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),coverage:remediationCoverage(),functionEvidence:functionEvidence(),
  tree:focusedFlow('木構造'),bit:focusedFlow('ビット列'),refresh:refreshProbe(),fallback:fallbackProbe(),boundary:boundaryProbe()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V228__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v228' and previous=='v227','v228 learner-flow audit expects v227 parent')
source=Path('audits/SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_REPAIR_v227.txt')
req(source.exists(),'v227 domain progression repair evidence missing')
st=source.read_text()
req('PASS — NO FINDINGS' in st and 'next release should audit the post-repair learner flow' in st,'v227 post-repair audit handoff drift')
expected={
  '.github/subject-b-algorithm-domain-learner-flow-audit/validate_audit.py',
  '.github/workflows/subject-b-algorithm-domain-learner-flow-audit.yml'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v228 audit-only source drift: '+repr(sorted(changed^expected)))
for path in ['app/base-stable.html','app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt','app/subject-b-algorithm-domain-progression-overrides-v227.txt']:
    req(Path(path).read_bytes()==subprocess.check_output(['git','show',parent+':'+path]),'learner-facing source drift: '+path)

html,cand=runtime('_site/index.html')
_,par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
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
req(cand['spec']==par['spec'],'v227 domain progression spec drift')
req(cand['selectionSig']==par['selectionSig'],'1000-seed selection/order drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(cand['coverage']==par['coverage'],'direct remediation coverage changed')
req(cand['functionEvidence']==par['functionEvidence'],'domain integration function surface drift')
req(cand['tree']==par['tree'] and cand['bit']==par['bit'] and cand['refresh']==par['refresh'] and cand['fallback']==par['fallback'] and cand['boundary']==par['boundary'],'audit-only learner-flow behavior drift')
req(cand['coverage']['algorithm']==43 and not cand['coverage']['algoBad'],'algorithm remediation coverage drift')
req(cand['coverage']['security']==15 and not cand['coverage']['secBad'],'security remediation coverage drift')
req(all(cand['functionEvidence'].values()),'v227 learner-flow integration function evidence missing')

for domain,key,target in [('木構造','tree','tree_dfs'),('ビット列','bit','bit_mask')]:
    row=cand[key]
    req(row['first']['mode']=='trace' and row['first']['id']==target and domain in row['first']['title'],'focused first recommendation drift: '+domain)
    req(row['second']['mode']=='trace' and row['second']['id']==target,'focused recommendation unstable on rerender: '+domain)
    req(row['marker'] and row['marker']['domain']==domain and row['marker']['targetId']==target and row['marker']['completed'] is False,'focused marker mismatch: '+domain)
    req(row['normalizedMarker']==row['marker'],'focused marker lost during profile normalization: '+domain)
    req(row['unrelated']['mode']=='trace' and row['unrelated']['id']==target,'unrelated TRACE incorrectly satisfied focused remediation: '+domain)
    req(row['afterTarget']['mode']=='miniMock' and row['afterTarget']['title']=='アルゴリズム ミニ模試で準備','focused TRACE did not return to mini-mock gate: '+domain)
    req(row['after64']['mode']=='miniMock','64% mini-mock incorrectly unlocked final after focused TRACE: '+domain)
    req(row['after65']['mode']=='final','65% mini-mock did not unlock final after focused TRACE: '+domain)
    req(row['directTarget'] and row['directTarget']['mode']=='trace' and row['directTarget']['id']==target,'direct review target mismatch: '+domain)
    req(row['directReviewCompletion']['mode']=='miniMock','direct final-review TRACE completion was redundantly requested again: '+domain)

refresh=cand['refresh']
req(refresh['before']['mode']=='trace' and refresh['oldMarker']['domain']=='木構造','refresh setup drift')
req(refresh['after']['mode']=='trace' and refresh['newMarker']['domain']=='ビット列' and refresh['after']['id']=='bit_mask','new first-final identity did not refresh focused domain route')
req(refresh['oldMarker']['firstFinalKey']!=refresh['newMarker']['firstFinalKey'],'domain marker first-final identity did not change')

fallback=cand['fallback']
req(fallback['diffuse']['rec']['mode']=='miniMock' and fallback['diffuse']['marker'] is None and fallback['diffuse']['evidence']['qualifies'] is False,'diffuse evidence should keep generic algorithm mini-mock')
req(fallback['sparse']['rec']['mode']=='miniMock' and fallback['sparse']['marker'] is None and fallback['sparse']['evidence']['qualifies'] is False,'single-item sparse evidence should keep generic algorithm mini-mock')

b=cand['boundary']
req(b['firstFinal65']['mode']=='final','65% first-final boundary should bypass focused remediation')
req(b['security']['mode']=='securityMock','security first-final routing changed')
req(b['compound']['mode']=='compound','compound first-final routing changed')
req(b['taper']['mode']!='final' and b['taper']['mode']!='trace','exam-three-days taper should not enter final or focused TRACE')
req(b['maintenance']['mode']!='trace','post-two-final maintenance should not enter focused first-final TRACE')
req(b['newLearner']['mode']=='trace','new learner foundation route drift')

fixture={
  'name':f'subject-b-algorithm-domain-learner-flow-audit-{version}',
  'version':version,'previous':previous,'sourceMain':parent,'learnerFacingChange':False,
  'sourceRepair':'audits/SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_REPAIR_v227.txt',
  'treeFlow':cand['tree'],'bitFlow':cand['bit'],'markerRefresh':cand['refresh'],'fallbacks':cand['fallback'],'boundaries':cand['boundary'],
  'functionEvidence':cand['functionEvidence'],'selectionSignature1000':cand['selectionSig'],'coverage':cand['coverage'],
  'findings':{'high':[],'medium':[],'low':[]},'status':'passed'
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-algorithm-domain-learner-flow-audit-v228.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v228 — Subject B Algorithm Domain Learner-Flow Audit
=============================================================================

Result
------
PASS — NO FINDINGS
Previous: v227
Source main: {parent}
Learner-facing change in v228: none

What was audited
----------------
The v227 focused-domain progression repair was exercised as an end-to-end learner route rather than only as a repair contract. The audit covered concentrated 木構造 and ビット列 evidence, marker persistence, unrelated practice, completion of the recommended TRACE, the unchanged 65% mini-mock readiness boundary, direct completion from final-result review, first-final identity refresh, fallback behavior, tapering, maintenance, and untouched foundation routing.

Focused learner-flow proof
--------------------------
木構造-heavy evidence -> 木構造のTRACEで弱点補強 / tree_dfs.
ビット列-heavy evidence -> ビット列のTRACEで弱点補強 / bit_mask.
Repeated hub rendering keeps the same focused recommendation, and the optional v227 marker survives profile normalization.
An unrelated TRACE does not satisfy the focused step. Completing the recommended TRACE returns to アルゴリズム ミニ模試で準備; 64% remains blocked and 65% returns to final practice through the unchanged v222 readiness gate.
Completing the same domain TRACE directly from final-result review is recognized, so the hub does not ask for the identical focused TRACE again.
When the first-final identity changes and weakness moves from 木構造 to ビット列, the marker refreshes and the next recommendation follows the new domain.

Fallback and boundary proof
---------------------------
Diffuse/tied evidence stays on the generic algorithm mini-mock.
Single-item sparse evidence stays on the generic algorithm mini-mock.
A first final at exactly 65% proceeds to final practice without focused remediation.
Security and compound first-final routes remain unchanged.
The exam-three-days taper does not enter a 100-minute final or the focused first-final TRACE route.
Post-two-final maintenance does not re-enter focused first-final TRACE.
A new learner still starts from the ordinary TRACE foundation path.

Preserved contracts
-------------------
1000 deterministic final-session seeds matched v227 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, v222 readiness calculation and 65% threshold, v224 compound evidence copy, and v227 domain concentration policy are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
The v226-v228 algorithm-domain diagnosis and focused-progression sequence is closed with no learner-flow finding. Do not broaden the domain taxonomy or weaken the evidence threshold by default. Move the next Subject B release to a different learning-quality frontier, preferably the learning value of post-answer explanations and wrong-answer review: whether the learner can identify the exact reasoning break, reconstruct the trace, and know what to do differently on the next attempt.
'''
Path('audits/SUBJECT_B_ALGORITHM_DOMAIN_LEARNER_FLOW_AUDIT_v228.txt').write_text(audit)

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')
print('FEQUEST_SUBJECT_B_ALGORITHM_DOMAIN_LEARNER_FLOW_AUDIT_OK version=v228 findings=0 selection-seeds=1000 algorithm-remediation=43 security-remediation=15')
