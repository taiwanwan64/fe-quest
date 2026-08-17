from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-readiness-repair-(v(\d+))',branch)
    req(m,'bad Subject B readiness repair branch')
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
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x222000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function allProgress(items,value){return Object.fromEntries(items.map(x=>[x.id,value]));}
function setShort(a,s,c){
  profile.bMockHistory=[{rate:a,date:'2026-08-17'}];
  profile.securityMockHistory=[{rate:s,date:'2026-08-17'}];
  profile.bCompoundHistory=[0,1,2].map(i=>({rate:c,date:'2026-08-17',id:'c'+i}));
}
function baseScenario(){
  profile.settings={...(profile.settings||{}),examDate:''};
  profile.bProgress=allProgress(B_EXERCISES,100);
  profile.securityBProgress=allProgress(SECURITY_SCENARIOS,100);
  profile.bCompoundStats={};
  for(const s of B_COMPOUND_SETS.slice(0,3)) profile.bCompoundStats[s.id]={seen:1,correct:2,lastSeen:'2026-08-17'};
  setShort(80,80,80);
  profile.bFinalHistory=[];
  delete profile.subjectBReadinessV222;
}
function finalRow(rate,algoCorrect,secCorrect){return {rate,correct:algoCorrect+secCorrect,blank:0,algoCorrect,secCorrect,date:'2026-08-17',seconds:4200};}
function snapRec(name){const r=subjectBHubRecommendation();return {name,stage:r.stage,mode:r.mode,id:r.id||null,title:r.title,desc:r.desc,marker:profile.subjectBReadinessV222||null};}
function recommendationProbe(){
  const out=[];
  baseScenario();profile.bProgress=allProgress(B_EXERCISES,0);profile.securityBProgress=allProgress(SECURITY_SCENARIOS,0);profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snapRec('new_learner'));
  baseScenario();profile.securityBProgress=allProgress(SECURITY_SCENARIOS,0);profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snapRec('algorithm_complete_security_unfinished'));
  baseScenario();profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snapRec('foundations_complete_no_compound'));
  baseScenario();profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snapRec('three_compounds_no_security_mock'));
  baseScenario();profile.securityMockHistory=[{rate:0,date:'2026-08-17'}];profile.bMockHistory=[];out.push(snapRec('security_mock_zero_algorithm_mock_missing'));
  baseScenario();setShort(0,0,0);out.push(snapRec('all_short_practice_zero_no_final'));
  baseScenario();setShort(100,100,100);out.push(snapRec('all_short_practice_perfect_no_final'));
  baseScenario();setShort(80,40,75);out.push(snapRec('security_short_practice_weak_no_final'));
  baseScenario();setShort(80,80,50);out.push(snapRec('compound_short_practice_weak_no_final'));
  baseScenario();setShort(20,20,20);profile.bFinalHistory=[finalRow(10,1,1)];out.push(snapRec('one_low_final_before_remediation'));
  profile.bMockHistory.unshift({rate:50,date:'2026-08-17'});out.push(snapRec('one_low_final_after_failed_remediation'));
  profile.bMockHistory.unshift({rate:70,date:'2026-08-17'});out.push(snapRec('one_low_final_after_passing_remediation'));
  baseScenario();setShort(80,80,80);profile.bFinalHistory=[finalRow(50,12,0)];out.push(snapRec('one_low_final_security_weak'));
  baseScenario();setShort(80,80,80);profile.bFinalHistory=[finalRow(65,9,4)];out.push(snapRec('one_floor_final_allows_second_final'));
  baseScenario();profile.bFinalHistory=[finalRow(90,14,4),finalRow(85,13,4)];profile.bMockHistory=[{rate:15,date:'2026-08-17'}];profile.securityMockHistory=[{rate:90,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:80,date:'2026-08-17'}];out.push(snapRec('maintenance_algorithm_weak'));
  baseScenario();const oldExam=examDaysRemaining;examDaysRemaining=()=>2;out.push(snapRec('exam_three_days_preserved'));examDaysRemaining=oldExam;
  return out;
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
console.log('__V222__'+Buffer.from(JSON.stringify({
 v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
 pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
 orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
 readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,sem:validateSubjectBSemantics(),selectionSig:selectionSignature(500),coverage:remediationCoverage(),recommendations:recommendationProbe()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V222__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v222' and previous=='v221','v222 readiness repair expects v221 parent')
source=Path('audits/SUBJECT_B_LEARNING_PROGRESSION_AUDIT_v221.txt');req(source.exists(),'v221 progression audit evidence missing')
st=source.read_text();req('PASS — MEDIUM FINDING RECORDED' in st and 'subject_b_progression_readiness_blindness' in st,'v221 finding evidence drift')
manifest=json.loads(Path('_release/content-change-v222.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'v222 content manifest parent/source drift')
req(manifest['quality_audit_marker']=='subject_b_progression_readiness_blindness' and manifest['source_priority_tier']=='medium','v222 manifest audit marker drift')
req(manifest['content_files']==['app/subject-b-readiness-overrides-v222.txt'] and manifest['assembly_files']==['index.html'],'v222 approved file scope drift')
expected={
 '.github/subject-b-readiness-repair/validate_repair.py','.github/workflows/subject-b-readiness-repair.yml',
 '_release/content-change-v222.json','app/subject-b-readiness-overrides-v222.txt','index.html'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'v222 repair source drift: '+repr(sorted(changed^expected)))
for path in ['app/base-stable.html','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt']:
    req(Path(path).read_bytes()==subprocess.check_output(['git','show',parent+':'+path]),'preserved learner-facing source drift: '+path)
html,cand=runtime('_site/index.html');_,par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions');req(cand['counts']==par['counts']==[20,16,4],'final counts drift');req(cand['seconds']==par['seconds']==6000,'time limit drift');req(cand['pool']==par['pool']==43,'algorithm pool drift');req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift');req(cand['floor']==par['floor']==4,'high-trace floor drift');req(cand['orderSpec']==par['orderSpec'],'v214 order spec drift');req(cand['recoverySpec']==par['recoverySpec'],'v217 recovery spec drift');req(cand['xpSpec']==par['xpSpec'],'v219 XP spec drift');req(cand['selectionSig']==par['selectionSig'],'500-seed selection/order drift');req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(par['readinessSpec'] is None,'parent unexpectedly contains v222 readiness repair');spec=cand['readinessSpec'] or {};req(spec.get('policy')=='gate-final-practice-by-demonstrated-short-practice-and-first-final-evidence','v222 readiness policy missing');req(spec.get('shortPracticeFloor')==65 and spec.get('firstFinalFloor')==65,'v222 readiness floors drift');req(spec.get('preservesFoundationOrder') is True and spec.get('preservesExamThreeDayRule') is True and spec.get('preservesMaintenanceRouting') is True,'v222 preservation policy drift');req(spec.get('questionSelectionChanged') is False and spec.get('scoringChanged') is False and spec.get('timingChanged') is False,'v222 scope drift')
cov=cand['coverage'];req(cov['algorithm']==43 and not cov['algoBad'],'algorithm remediation coverage drift');req(cov['security']==15 and not cov['secBad'],'security remediation coverage drift')
C={x['name']:x for x in cand['recommendations']};P={x['name']:x for x in par['recommendations']}
req(C['new_learner']['mode']=='trace' and C['algorithm_complete_security_unfinished']['mode']=='security','foundation progression drift');req(C['foundations_complete_no_compound']['mode']=='compound' and C['three_compounds_no_security_mock']['mode']=='securityMock' and C['security_mock_zero_algorithm_mock_missing']['mode']=='miniMock','staged onboarding drift')
req(P['all_short_practice_zero_no_final']['mode']=='final','v221 zero-score evidence no longer reproducible');req(C['all_short_practice_zero_no_final']['mode']=='miniMock','zero-score readiness gate not repaired');req(C['all_short_practice_perfect_no_final']['mode']=='final','ready learner incorrectly blocked');req(C['security_short_practice_weak_no_final']['mode']=='securityMock','security readiness routing failed');req(C['compound_short_practice_weak_no_final']['mode']=='compound','compound readiness routing failed')
req(P['one_low_final_before_remediation']['mode']=='final','v221 low-first-final evidence no longer reproducible');req(C['one_low_final_before_remediation']['mode']=='miniMock','weak first final did not route to targeted algorithm practice');req(C['one_low_final_before_remediation']['marker'] is not None and C['one_low_final_before_remediation']['marker']['targetMode']=='miniMock','first-final remediation marker missing');req(C['one_low_final_after_failed_remediation']['mode']=='miniMock','below-floor remediation incorrectly unlocked second final');req(C['one_low_final_after_passing_remediation']['mode']=='final','passing remediation did not unlock second final');req(C['one_low_final_security_weak']['mode']=='securityMock','security-weak first final did not route to security practice');req(C['one_floor_final_allows_second_final']['mode']=='final','first-final floor boundary drift')
req(C['maintenance_algorithm_weak']['mode']==P['maintenance_algorithm_weak']['mode']=='miniMock','maintenance score routing changed');req(C['exam_three_days_preserved']['mode']==P['exam_three_days_preserved']['mode'] and C['exam_three_days_preserved']['mode']!='final','exam-three-days behavior changed')
for token in ['SUBJECT_B_READINESS_V222_SPEC','const _subjectBHubRecommendationV222=subjectBHubRecommendation;','profile.subjectBReadinessV222','{{ subjectBReadinessV222 }}']:
    req(token in html,'v222 integration token missing: '+token)
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')
fixture={'name':f'subject-b-readiness-repair-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':True,'resolved_finding':'subject_b_progression_readiness_blindness','readiness_spec':spec,'recommendation_scenarios':cand['recommendations'],'runtime_preservation':{'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'selection_signature_500_seeds_unchanged':True,'semantic_validator_ok':True},'remediation_coverage':cov,'candidate_reference_six_file_equal':True,'findings':{'high':[],'medium':[],'low':[]},'status':'passed-v221-medium-resolved'}
Path(f'_regression/subject-b-readiness-repair-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_READINESS_REPAIR_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Readiness-Aware Recommendation Repair
============================================================================

Result
------
PASS — v221 MEDIUM FINDING RESOLVED
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: yes
Resolved: subject_b_progression_readiness_blindness

Repair
------
The existing staged onboarding remains intact through algorithm TRACE, security cases, three compound sets, security mini-mock, and algorithm mini-mock.
Before the first 100-minute final practice, the weakest short-practice result must now reach 65%.
A weak first final-practice result below 65% now routes to a relevant short-practice mode. The app records only a small optional recommendation marker so that the learner must actually complete that targeted practice after the first final; the latest targeted score must reach 65% before the second final is recommended.

Behavior proof
--------------
0% / 0% / 0% short-practice evidence no longer escalates to final practice; it routes to short practice.
100% / 100% / 100% still escalates to final practice.
Security-only and compound-only weak evidence route to their matching short modes.
A 10% first final routes to targeted algorithm practice in the probe; a failed 50% remediation stays in practice, while a subsequent 70% remediation unlocks the second final.
A security-weak first final routes to the security mini-mock.
The existing 65% first-final floor boundary allows the second final.

Preserved contracts
-------------------
Foundation ordering unchanged; exam-3-days behavior unchanged; post-two-final maintenance routing unchanged.
Algorithm remediation targets valid: {cov['algorithm']} / {cov['algorithm']}.
Security remediation targets valid: {cov['security']} / {cov['security']}.
500 deterministic final-session seeds matched v221 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4; v214 order, v217 recovery, and v219 XP-display policies are unchanged.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
Resolve the v221 Medium finding with this narrow recommendation-only repair. Use v223 for a post-repair progression audit before expanding Subject B scope again.
''')
print(f'FEQUEST_SUBJECT_B_READINESS_REPAIR_OK version={version} parent={parent}')
