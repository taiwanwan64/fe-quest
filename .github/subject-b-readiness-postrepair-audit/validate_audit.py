from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-readiness-postrepair-audit-(v(\d+))', branch)
    req(m, 'bad Subject B readiness post-repair audit branch')
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
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x223000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function allProgress(items,value){return Object.fromEntries(items.map(x=>[x.id,value]));}
function compoundRows(rates){return rates.map((rate,i)=>({rate,date:`2026-08-${17-i}`,id:`c${i}`,correct:rate>=67?2:rate>=33?1:0,total:3}));}
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
  baseScenario();setShort(65,65,[65,65,65]);out.push(snap('short_floor_exact'));
  baseScenario();setShort(64,80,[100,100,100]);out.push(snap('short_algo_64'));
  baseScenario();setShort(80,64,[100,100,100]);out.push(snap('short_security_64'));
  baseScenario();setShort(80,80,[64,64,64]);out.push(snap('short_compound_64'));
  baseScenario();profile.bFinalHistory=[finalRow(65,9,4)];out.push(snap('first_final_floor_exact'));
  baseScenario();profile.bFinalHistory=[finalRow(64,8,4)];out.push(snap('first_final_64_algo'));
  baseScenario();profile.bFinalHistory=[finalRow(50,10,0)];out.push(snap('first_final_security_weak'));
  baseScenario();setShort(20,80,[100,100,100]);profile.bFinalHistory=[finalRow(40,4,4)];const before=snap('first_final_algo_target_before');profile.securityMockHistory.unshift({rate:100,date:'2026-08-18'});const unrelated=snap('first_final_after_unrelated');profile.bMockHistory.unshift({rate:50,date:'2026-08-18'});const fail=snap('first_final_after_target_fail');profile.bMockHistory.unshift({rate:70,date:'2026-08-19'});const pass=snap('first_final_after_target_pass');out.push(before,unrelated,fail,pass);
  baseScenario();setShort(90,90,[67,33,100]);profile.bFinalHistory=[finalRow(40,4,4)];const cb=snap('compound_target_before');profile.bCompoundHistory.unshift({rate:67,date:'2026-08-18',id:'new67',correct:2,total:3});const ca=snap('compound_target_after_one_67');out.push(cb,ca);
  baseScenario();profile.bFinalHistory=[finalRow(40,4,4)];const stable1=snap('marker_stable_first');const marker1=JSON.stringify(profile.subjectBReadinessV222);const stable2=snap('marker_stable_second');const marker2=JSON.stringify(profile.subjectBReadinessV222);const normalized=normalizeProfileData(JSON.parse(JSON.stringify(profile)));out.push(stable1,stable2,{name:'marker_roundtrip',same:marker1===marker2,preserved:JSON.stringify(normalized.subjectBReadinessV222||null)===marker2});
  profile.bFinalHistory=[finalRow(30,3,3,'2026-08-18')];const changed=snap('marker_new_first_final');out.push(changed,{name:'marker_key_changed',changed:changed.marker?.firstFinalKey!==stable2.marker?.firstFinalKey});
  baseScenario();profile.bFinalHistory=[finalRow(90,14,4),finalRow(85,13,4,'2026-08-16')];profile.bMockHistory=[{rate:15,date:'2026-08-17'}];profile.securityMockHistory=[{rate:90,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:80,date:'2026-08-17'}];out.push(snap('maintenance_algorithm_weak'));
  baseScenario();const oldExam=examDaysRemaining;examDaysRemaining=()=>2;out.push(snap('exam_three_days'));examDaysRemaining=oldExam;
  return out;
}
function historySemantics(){
  return {
    algo:String(finishBMiniMock).includes('profile.bMockHistory=[attempt,...'),
    security:String(finishSecurityMock).includes('profile.securityMockHistory=[attempt,...'),
    compound:String(finishCompoundChallenge).includes('profile.bCompoundHistory=[{date:localDateISO(0)')&&String(finishCompoundChallenge).includes('...(profile.bCompoundHistory||[])')
  };
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
console.log('__V223__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,sem:validateSubjectBSemantics(),selectionSig:selectionSignature(500),coverage:remediationCoverage(),recommendations:recommendationProbe(),history:historySemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-5000:])
        m = re.search(r'__V223__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return html, json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req(version == 'v223' and previous == 'v222', 'v223 readiness post-repair audit expects v222 parent')
source = Path('audits/SUBJECT_B_READINESS_REPAIR_v222.txt')
req(source.exists(), 'v222 readiness repair evidence missing')
st = source.read_text()
req('PASS — v221 MEDIUM FINDING RESOLVED' in st and 'Use v223 for a post-repair progression audit' in st, 'v222 repair evidence drift')
expected = {
    '.github/subject-b-readiness-postrepair-audit/validate_audit.py',
    '.github/workflows/subject-b-readiness-postrepair-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v223 audit-only source drift: ' + repr(sorted(changed ^ expected)))
for path in ['app/base-stable.html','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt']:
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
req(cand['selectionSig'] == par['selectionSig'], '500-seed selection/order drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic validation failed')
req(cand['recommendations'] == par['recommendations'], 'audit-only readiness behavior drift')
req(cand['history'] == par['history'] == {'algo':True,'security':True,'compound':True}, 'history newest-first semantics drift')
cov = cand['coverage']
req(cov['algorithm'] == 43 and not cov['algoBad'], 'algorithm remediation coverage drift')
req(cov['security'] == 15 and not cov['secBad'], 'security remediation coverage drift')

R = {x['name']:x for x in cand['recommendations']}
req(R['short_floor_exact']['mode'] == 'final', '65% short-practice boundary should allow final')
req(R['short_algo_64']['mode'] == 'miniMock', '64% algorithm short evidence should route to algorithm mini-mock')
req(R['short_security_64']['mode'] == 'securityMock', '64% security short evidence should route to security mini-mock')
req(R['short_compound_64']['mode'] == 'compound', '64% compound evidence should route to compound practice')
req(R['first_final_floor_exact']['mode'] == 'final', '65% first final should allow second final')
req(R['first_final_64_algo']['mode'] in {'miniMock','compound'}, '64% first final should route to algorithm-side practice')
req(R['first_final_security_weak']['mode'] == 'securityMock', 'security-weak first final should route to security practice')
req(R['first_final_algo_target_before']['mode'] == 'miniMock', 'algorithm target selection drift')
req(R['first_final_after_unrelated']['mode'] == 'miniMock', 'unrelated practice incorrectly unlocked second final')
req(R['first_final_after_target_fail']['mode'] == 'miniMock', 'below-floor targeted practice incorrectly unlocked second final')
req(R['first_final_after_target_pass']['mode'] == 'final', 'passing targeted practice did not unlock second final')
req(R['marker_roundtrip']['same'] is True and R['marker_roundtrip']['preserved'] is True, 'readiness marker rerender/normalization persistence drift')
req(R['marker_key_changed']['changed'] is True, 'readiness marker did not refresh for changed first-final identity')
req(R['maintenance_algorithm_weak']['mode'] == 'miniMock', 'post-two-final maintenance routing drift')
req(R['exam_three_days']['mode'] != 'final', 'exam-three-days long-final taper was overridden')

compound_before = R['compound_target_before']
compound_after = R['compound_target_after_one_67']
req(compound_before['mode'] == 'compound', 'compound-target first-final routing drift')
compound_message_gap = compound_after['mode'] == 'compound' and '1回確認' in compound_after['desc']
low = []
if compound_message_gap:
    low.append('compound_remediation_window_message')

for token in ['gate-final-practice-by-demonstrated-short-practice-and-first-final-evidence','subjectBReadinessRateV222','subjectBFirstFinalTargetV222','profile.subjectBReadinessV222']:
    req(token in html, 'v222 readiness integration token missing: ' + token)
files = ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes() == (Path('_site_reference')/x).read_bytes() for x in files), 'candidate/reference six-file mismatch')

finding = None
if low:
    finding = {
        'id':'compound_remediation_window_message',
        'severity':'low',
        'summary':'Compound remediation uses a rolling three-attempt average while the learner-facing first-final recovery message says to check it once; a new 67% compound attempt can therefore still leave the second final locked.',
        'evidence':{
            'before':compound_before,
            'after_one_new_67':compound_after,
            'history_policy':'newest-first; compound readiness rate averages the first three history entries',
        },
    }
fixture = {
    'name':f'subject-b-readiness-postrepair-audit-{version}',
    'version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':False,
    'readiness_spec':cand['readinessSpec'],'recommendation_scenarios':cand['recommendations'],'history_semantics':cand['history'],
    'runtime_preservation':{
        'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],
        'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],
        'selection_signature_500_seeds_unchanged':True,'semantic_validator_ok':True,
    },
    'remediation_coverage':cov,'candidate_reference_six_file_equal':True,
    'finding':finding,
    'findings':{'high':[],'medium':[],'low':low},
    'status':'passed-low-finding-recorded' if low else 'passed-no-findings',
}
Path(f'_regression/subject-b-readiness-postrepair-audit-{version}.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')
result = 'PASS — LOW FINDING RECORDED' if low else 'PASS — NO FINDINGS'
finding_text = '''\nLow finding — compound_remediation_window_message\n--------------------------------------------------\nCompound readiness intentionally uses the average of the three newest compound attempts, but the first-final recovery copy says to check the compound problem once and aim for 65%.\nA realistic qualifying pre-final window of 67%, 33%, 100% averages 67%. After a weak first final targets compound practice, one new 67% result changes the rolling window to 67%, 67%, 33% (56%), so the app still recommends compound practice even though the learner completed one new attempt at or above the displayed 65% target.\nThis is a guidance/expectation mismatch rather than a readiness-engine failure; the rolling evidence itself is defensible for a three-question set.\n''' if low else '\nNo findings were identified.\n'
Path(f'audits/SUBJECT_B_READINESS_POSTREPAIR_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Readiness Post-Repair Progression Audit
=============================================================================

Result
------
{result}
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

What was audited
----------------
The v222 readiness repair was exercised at the 64/65% boundaries, across algorithm/security/compound weak modes, after weak and passing first-final results, through unrelated and targeted remediation attempts, across profile normalization, inside the exam-three-days taper, and after two final-practice runs.
History recency semantics were also checked against the actual completion functions so the v222 use of history index 0 is grounded in newest-first storage.

What passed
-----------
65% short-practice evidence allows final practice; 64% evidence routes to the matching short mode.
A 65% first final allows the second final; a lower first final routes to targeted practice.
Unrelated practice cannot unlock the second final. Targeted practice below 65% remains blocked; a later passing targeted mini-mock unlocks it.
The recommendation marker remains stable across rerenders, survives profile normalization, and refreshes when the first-final identity changes.
Algorithm, security, and compound histories are all written newest-first, matching the v222 index-0 recency assumption.
The exam-three-days taper and post-two-final maintenance routing remain intact.
{finding_text}
Preserved contracts
-------------------
500 deterministic final-session seeds matched {previous} selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, and v222 readiness specs are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: {len(low)}

Decision
--------
Do not change learner-facing behavior in this audit release. {('Use v224 for a narrow copy/evidence-clarity repair of the compound remediation message.' if low else 'Move the next release to a different Subject B learning-quality frontier.')}
''')
print(f'FEQUEST_SUBJECT_B_READINESS_POSTREPAIR_AUDIT_OK version={version} high=0 medium=0 low={len(low)} selection=500 history=newest-first')
