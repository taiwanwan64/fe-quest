from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-readiness-learner-flow-audit-(v(\d+))', branch)
    req(m, 'bad Subject B readiness learner-flow audit branch')
    version = m.group(1)
    return version, f'v{int(m.group(2)) - 1}'


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x225000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function allProgress(items,value){return Object.fromEntries(items.map(x=>[x.id,value]));}
function compoundRows(rates,start=17){return rates.map((rate,i)=>({rate,date:`2026-08-${String(start-i).padStart(2,'0')}`,id:`c${start-i}`,correct:rate>=67?2:rate>=33?1:0,total:3}));}
function setShort(a,s,cRates=[80,80,80]){
  profile.bMockHistory=[{rate:a,date:'2026-08-17'}];
  profile.securityMockHistory=[{rate:s,date:'2026-08-17'}];
  profile.bCompoundHistory=compoundRows(cRates);
}
function baseScenario(){
  profile.settings={...(profile.settings||{}),examDate:''};
  profile.bProgress=allProgress(B_EXERCISES,100);
  profile.securityBProgress=allProgress(SECURITY_SCENARIOS,100);
  profile.bCompoundStats={};
  for(const s of B_COMPOUND_SETS.slice(0,3)) profile.bCompoundStats[s.id]={seen:1,correct:2,lastSeen:'2026-08-17'};
  setShort(80,80,[100,67,67]);
  profile.bFinalHistory=[];
  delete profile.subjectBReadinessV222;
}
function finalRow(rate,algoCorrect,secCorrect,date='2026-08-17'){return {rate,correct:algoCorrect+secCorrect,blank:0,algoCorrect,secCorrect,date,seconds:4200};}
function snap(name){const r=subjectBHubRecommendation();return {name,stage:r.stage,mode:r.mode,id:r.id||null,title:r.title,desc:r.desc,marker:profile.subjectBReadinessV222?structuredClone(profile.subjectBReadinessV222):null};}
function recommendationProbe(){
  const out=[];
  baseScenario();profile.bProgress=allProgress(B_EXERCISES,0);profile.securityBProgress=allProgress(SECURITY_SCENARIOS,0);profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snap('new_learner'));
  baseScenario();profile.securityBProgress=allProgress(SECURITY_SCENARIOS,0);profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snap('algorithm_complete_security_unfinished'));
  baseScenario();profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snap('foundations_complete_no_compound'));
  baseScenario();profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snap('three_compounds_no_security_mock'));
  baseScenario();profile.securityMockHistory=[{rate:80,date:'2026-08-17'}];profile.bMockHistory=[];out.push(snap('security_mock_done_algorithm_mock_missing'));

  baseScenario();setShort(65,65,[65,65,65]);out.push(snap('short_floor_exact'));
  baseScenario();setShort(64,80,[100,100,100]);out.push(snap('short_algo_64'));
  baseScenario();setShort(80,64,[100,100,100]);out.push(snap('short_security_64'));
  baseScenario();setShort(80,80,[64,64,64]);out.push(snap('short_compound_64'));

  baseScenario();profile.bFinalHistory=[finalRow(65,9,4)];out.push(snap('first_final_floor_exact'));
  baseScenario();setShort(20,80,[100,100,100]);profile.bFinalHistory=[finalRow(40,4,4)];const ab=snap('algo_target_before');profile.securityMockHistory.unshift({rate:100,date:'2026-08-18'});const au=snap('algo_after_unrelated');profile.bMockHistory.unshift({rate:50,date:'2026-08-18'});const af=snap('algo_after_fail');profile.bMockHistory.unshift({rate:70,date:'2026-08-19'});const ap=snap('algo_after_pass');out.push(ab,au,af,ap);
  baseScenario();setShort(90,30,[90,90,90]);profile.bFinalHistory=[finalRow(40,10,0)];const sb=snap('security_target_before');profile.bMockHistory.unshift({rate:100,date:'2026-08-18'});const su=snap('security_after_unrelated');profile.securityMockHistory.unshift({rate:50,date:'2026-08-18'});const sf=snap('security_after_fail');profile.securityMockHistory.unshift({rate:70,date:'2026-08-19'});const sp=snap('security_after_pass');out.push(sb,su,sf,sp);

  baseScenario();setShort(90,90,[67,33,100]);profile.bFinalHistory=[finalRow(40,4,4)];const cb=snap('compound_target_before');profile.securityMockHistory.unshift({rate:100,date:'2026-08-18'});const cu=snap('compound_after_unrelated');profile.bCompoundHistory.unshift({rate:67,date:'2026-08-18',id:'c18',correct:2,total:3});const c1=snap('compound_after_one_67');profile.bCompoundHistory.unshift({rate:100,date:'2026-08-19',id:'c19',correct:3,total:3});const c2=snap('compound_after_second_100');out.push(cb,cu,c1,c2);

  baseScenario();profile.bFinalHistory=[finalRow(40,4,4)];const stable1=snap('marker_stable_first');const marker1=JSON.stringify(profile.subjectBReadinessV222);const stable2=snap('marker_stable_second');const marker2=JSON.stringify(profile.subjectBReadinessV222);const normalized=normalizeProfileData(JSON.parse(JSON.stringify(profile)));out.push(stable1,stable2,{name:'marker_roundtrip',same:marker1===marker2,preserved:JSON.stringify(normalized.subjectBReadinessV222||null)===marker2});
  profile.bFinalHistory=[finalRow(30,3,3,'2026-08-18')];const changed=snap('marker_new_first_final');out.push(changed,{name:'marker_key_changed',changed:changed.marker?.firstFinalKey!==stable2.marker?.firstFinalKey});

  baseScenario();profile.bFinalHistory=[finalRow(90,14,4),finalRow(85,13,4,'2026-08-16')];profile.bMockHistory=[{rate:15,date:'2026-08-17'}];profile.securityMockHistory=[{rate:90,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:80,date:'2026-08-17'}];out.push(snap('maintenance_algorithm_weak'));
  baseScenario();const oldExam=examDaysRemaining;examDaysRemaining=()=>2;out.push(snap('exam_three_days'));examDaysRemaining=oldExam;
  return out;
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
console.log('__V225__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),coverage:remediationCoverage(),recommendations:recommendationProbe()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-5000:])
        m = re.search(r'__V225__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return html, json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req(version == 'v225' and previous == 'v224', 'v225 learner-flow audit expects v224 parent')
source = Path('audits/SUBJECT_B_READINESS_COPY_REPAIR_v224.txt')
req(source.exists(), 'v224 readiness copy repair evidence missing')
st = source.read_text()
req('PASS — v223 LOW FINDING RESOLVED' in st and 'Use v225 for a post-repair learner-flow audit' in st, 'v224 repair evidence drift')
expected = {
    '.github/subject-b-readiness-learner-flow-audit/validate_audit.py',
    '.github/workflows/subject-b-readiness-learner-flow-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v225 audit-only source drift: ' + repr(sorted(changed ^ expected)))
for path in ['app/base-stable.html','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt']:
    req(Path(path).read_bytes() == subprocess.check_output(['git','show',parent+':'+path]), 'learner-facing source drift: '+path)

html, cand = runtime('_site/index.html')
_, par = runtime('_site_parent/index.html')
req(cand['v'] == version and par['v'] == previous, 'runtime versions')
req(cand['counts'] == par['counts'] == [20,16,4], 'final counts drift')
req(cand['seconds'] == par['seconds'] == 6000, 'time limit drift')
req(cand['pool'] == par['pool'] == 43, 'algorithm pool drift')
req(cand['high'] == par['high'] and len(cand['high']) == 15, 'high-trace inventory drift')
req(cand['floor'] == par['floor'] == 4, 'high-trace floor drift')
req(cand['orderSpec'] == par['orderSpec'], 'v214 order spec drift')
req(cand['recoverySpec'] == par['recoverySpec'], 'v217 recovery spec drift')
req(cand['xpSpec'] == par['xpSpec'], 'v219 XP spec drift')
req(cand['readinessSpec'] == par['readinessSpec'], 'v222 readiness spec drift')
req(cand['copySpec'] == par['copySpec'], 'v224 readiness copy spec drift')
req(cand['selectionSig'] == par['selectionSig'], '1000-seed selection/order drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic validation failed')
req(cand['recommendations'] == par['recommendations'], 'audit-only learner-flow behavior drift')
cov = cand['coverage']
req(cov['algorithm'] == 43 and not cov['algoBad'], 'algorithm remediation coverage drift')
req(cov['security'] == 15 and not cov['secBad'], 'security remediation coverage drift')

R = {x['name']:x for x in cand['recommendations']}
req(R['new_learner']['mode'] == 'trace', 'new learner foundation route drift')
req(R['algorithm_complete_security_unfinished']['mode'] == 'security', 'security foundation route drift')
req(R['foundations_complete_no_compound']['mode'] == 'compound', 'compound onboarding route drift')
req(R['three_compounds_no_security_mock']['mode'] == 'securityMock', 'security mini-mock onboarding route drift')
req(R['security_mock_done_algorithm_mock_missing']['mode'] == 'miniMock', 'algorithm mini-mock onboarding route drift')
req(R['short_floor_exact']['mode'] == 'final', '65% short-practice boundary should allow final')
req(R['short_algo_64']['mode'] == 'miniMock', '64% algorithm evidence route drift')
req(R['short_security_64']['mode'] == 'securityMock', '64% security evidence route drift')
req(R['short_compound_64']['mode'] == 'compound', '64% compound evidence route drift')
req('直近3回' in R['short_compound_64']['desc'] and '平均' in R['short_compound_64']['desc'], 'pre-final compound evidence window is not explained')
req(R['first_final_floor_exact']['mode'] == 'final', '65% first-final boundary should allow second final')

req(R['algo_target_before']['mode'] == 'miniMock', 'algorithm remediation target drift')
req(R['algo_after_unrelated']['mode'] == 'miniMock', 'unrelated practice incorrectly unlocked algorithm remediation')
req(R['algo_after_fail']['mode'] == 'miniMock', 'failed algorithm remediation incorrectly unlocked final')
req(R['algo_after_pass']['mode'] == 'final', 'passing algorithm remediation did not unlock final')
req(R['security_target_before']['mode'] == 'securityMock', 'security remediation target drift')
req(R['security_after_unrelated']['mode'] == 'securityMock', 'unrelated practice incorrectly unlocked security remediation')
req(R['security_after_fail']['mode'] == 'securityMock', 'failed security remediation incorrectly unlocked final')
req(R['security_after_pass']['mode'] == 'final', 'passing security remediation did not unlock final')

req(R['compound_target_before']['mode'] == 'compound', 'compound remediation target drift')
req('直近3回' in R['compound_target_before']['desc'] and '平均' in R['compound_target_before']['desc'], 'first-final compound rolling-window copy missing')
req(R['compound_after_unrelated']['mode'] == 'compound', 'unrelated practice incorrectly unlocked compound remediation')
req(R['compound_after_one_67']['mode'] == 'compound', 'one 67% compound attempt should not bypass rolling-window gate')
req('直近3回' in R['compound_after_one_67']['desc'] and '平均' in R['compound_after_one_67']['desc'], 'compound remediation explanation disappeared after rerender')
req(R['compound_after_second_100']['mode'] == 'final', 'rolling compound evidence did not unlock final after sufficient remediation')

req(R['marker_roundtrip']['same'] is True and R['marker_roundtrip']['preserved'] is True, 'readiness marker rerender/normalization persistence drift')
req(R['marker_key_changed']['changed'] is True, 'readiness marker did not refresh for changed first-final identity')
req(R['maintenance_algorithm_weak']['mode'] == 'miniMock', 'post-two-final maintenance route drift')
req(R['exam_three_days']['mode'] != 'final', 'exam-three-days long-final taper was overridden')

for token in ['clarify-compound-readiness-evidence-window','SUBJECT_B_READINESS_COPY_V224_SPEC','gate-final-practice-by-demonstrated-short-practice-and-first-final-evidence','profile.subjectBReadinessV222']:
    req(token in html, 'readiness integration token missing: ' + token)
files = ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes() == (Path('_site_reference')/x).read_bytes() for x in files), 'candidate/reference six-file mismatch')

fixture = {
    'name':f'subject-b-readiness-learner-flow-audit-{version}',
    'version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':False,
    'readiness_spec':cand['readinessSpec'],'copy_spec':cand['copySpec'],'recommendation_scenarios':cand['recommendations'],
    'runtime_preservation':{
        'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],
        'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],
        'selection_signature_1000_seeds_unchanged':True,'semantic_validator_ok':True,
    },
    'remediation_coverage':cov,'candidate_reference_six_file_equal':True,
    'findings':{'high':[],'medium':[],'low':[]},'status':'passed-no-findings',
}
Path(f'_regression/subject-b-readiness-learner-flow-audit-{version}.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')
Path(f'audits/SUBJECT_B_READINESS_LEARNER_FLOW_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Readiness Learner-Flow Audit
=============================================================================

Result
------
PASS — NO FINDINGS
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

What was audited
----------------
The complete recommendation journey was exercised from a new learner through TRACE, security foundations, compound practice, both mini-mocks, pre-final readiness, the first final practice, targeted remediation, reassessment, and return to final practice.
The v224 compound evidence wording was tested inside the actual rolling-three-attempt remediation path, not only as a static string.

Learner-flow proof
------------------
Foundation order remains TRACE -> security -> compound -> security mini-mock -> algorithm mini-mock.
At the readiness boundary, 65% evidence allows final practice while 64% routes to the matching short mode.
A weak first final routes to the relevant algorithm, security, or compound practice. Unrelated work cannot unlock the second final, and a targeted result below 65% remains blocked.
For algorithm and security mini-mocks, a later passing targeted result unlocks final practice as intended.
For compound practice, a 67/33/100 window followed by a new 67% result remains below the rolling-three average threshold and stays in compound practice; the recommendation explicitly explains the recent-three-attempt average. A subsequent 100% result raises the rolling window enough to return to final practice.
The optional readiness marker remains stable across rerenders and profile normalization and refreshes when the first-final identity changes.
The exam-three-days taper and post-two-final maintenance route remain intact.

Preserved contracts
-------------------
1000 deterministic final-session seeds matched {previous} selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, v222 readiness calculation, and v224 compound evidence copy are unchanged.
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
The v221-v224 readiness progression and copy repair sequence is closed with no remaining learner-flow finding. Move the next release to a different Subject B learning-quality frontier rather than continuing to modify this route by default.
''')
print(f'FEQUEST_SUBJECT_B_READINESS_LEARNER_FLOW_AUDIT_OK version={version} high=0 medium=0 low=0 selection=1000')
