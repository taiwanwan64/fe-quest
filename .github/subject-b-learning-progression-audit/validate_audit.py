from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-learning-progression-audit-(v(\d+))', branch)
    req(m, 'bad Subject B learning progression audit branch')
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
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x221000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function allProgress(items,value){return Object.fromEntries(items.map(x=>[x.id,value]));}
function baseScenario(){
  profile.settings={...(profile.settings||{}),examDate:''};
  profile.bProgress=allProgress(B_EXERCISES,100);
  profile.securityBProgress=allProgress(SECURITY_SCENARIOS,100);
  profile.bCompoundStats={};
  for(const s of B_COMPOUND_SETS.slice(0,3)) profile.bCompoundStats[s.id]={seen:1,correct:0,lastSeen:'2026-08-17'};
  profile.bCompoundHistory=[{rate:80,date:'2026-08-17'}];
  profile.securityMockHistory=[{rate:80,date:'2026-08-17'}];
  profile.bMockHistory=[{rate:80,date:'2026-08-17'}];
  profile.bFinalHistory=[];
}
function snapRec(name){const r=subjectBHubRecommendation();return {name,stage:r.stage,mode:r.mode,id:r.id||null,title:r.title,desc:r.desc};}
function recommendationProbe(){
  const out=[];
  baseScenario();profile.bProgress=allProgress(B_EXERCISES,0);profile.securityBProgress=allProgress(SECURITY_SCENARIOS,0);profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snapRec('new_learner'));
  baseScenario();profile.securityBProgress=allProgress(SECURITY_SCENARIOS,0);profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snapRec('algorithm_complete_security_unfinished'));
  baseScenario();profile.bCompoundStats={};profile.bCompoundHistory=[];profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snapRec('foundations_complete_no_compound'));
  baseScenario();profile.securityMockHistory=[];profile.bMockHistory=[];out.push(snapRec('three_compounds_no_security_mock'));
  baseScenario();profile.securityMockHistory=[{rate:0,date:'2026-08-17'}];profile.bMockHistory=[];out.push(snapRec('security_mock_zero_algorithm_mock_missing'));
  baseScenario();profile.securityMockHistory=[{rate:0,date:'2026-08-17'}];profile.bMockHistory=[{rate:0,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:0,date:'2026-08-17'}];out.push(snapRec('all_short_practice_zero_no_final'));
  baseScenario();profile.securityMockHistory=[{rate:100,date:'2026-08-17'}];profile.bMockHistory=[{rate:100,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:100,date:'2026-08-17'}];out.push(snapRec('all_short_practice_perfect_no_final'));
  baseScenario();profile.securityMockHistory=[{rate:20,date:'2026-08-17'}];profile.bMockHistory=[{rate:20,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:20,date:'2026-08-17'}];profile.bFinalHistory=[{rate:10,algoCorrect:1,secCorrect:1,date:'2026-08-17'}];out.push(snapRec('one_low_final_after_low_short_practice'));
  baseScenario();profile.bFinalHistory=[{rate:95,date:'2026-08-17'},{rate:90,date:'2026-08-16'}];profile.bMockHistory=[{rate:15,date:'2026-08-17'}];profile.securityMockHistory=[{rate:90,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:80,date:'2026-08-17'}];out.push(snapRec('maintenance_algorithm_weak'));
  baseScenario();profile.bFinalHistory=[{rate:95,date:'2026-08-17'},{rate:90,date:'2026-08-16'}];profile.bMockHistory=[{rate:90,date:'2026-08-17'}];profile.securityMockHistory=[{rate:15,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:80,date:'2026-08-17'}];out.push(snapRec('maintenance_security_weak'));
  baseScenario();profile.bFinalHistory=[{rate:95,date:'2026-08-17'},{rate:90,date:'2026-08-16'}];profile.bMockHistory=[{rate:90,date:'2026-08-17'}];profile.securityMockHistory=[{rate:80,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:15,date:'2026-08-17'}];out.push(snapRec('maintenance_compound_weak'));
  return out;
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
console.log('__V221__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(500),coverage:remediationCoverage(),recommendations:recommendationProbe()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-5000:])
        m = re.search(r'__V221__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return html, json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req(version == 'v221' and previous == 'v220', 'v221 progression audit expects v220 parent')
source = Path('audits/SUBJECT_B_FINAL_XP_POSTREPAIR_AUDIT_v220.txt')
req(source.exists(), 'v220 close-out evidence missing')
st = source.read_text()
req('PASS — NO FINDINGS' in st and 'Move v221 to a different Subject B learning-quality frontier.' in st, 'v220 close-out evidence drift')
expected = {
    '.github/subject-b-learning-progression-audit/validate_audit.py',
    '.github/workflows/subject-b-learning-progression-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v221 audit-only source drift: ' + repr(sorted(changed ^ expected)))
for path in ['app/base-stable.html','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt']:
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
req(cand['selectionSig'] == par['selectionSig'], '500-seed selection/order drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic validation failed')
req(cand['recommendations'] == par['recommendations'], 'audit-only recommendation behavior drift')
cov = cand['coverage']
req(cov['algorithm'] == 43 and not cov['algoBad'], 'algorithm remediation coverage drift')
req(cov['security'] == 15 and not cov['secBad'], 'security remediation coverage drift')

recs = {x['name']:x for x in cand['recommendations']}
req(recs['new_learner']['mode'] == 'trace' and recs['new_learner']['stage'] == 1, 'new learner progression drift')
req(recs['algorithm_complete_security_unfinished']['mode'] == 'security' and recs['algorithm_complete_security_unfinished']['stage'] == 2, 'security foundation progression drift')
req(recs['foundations_complete_no_compound']['mode'] == 'compound', 'compound gate drift')
req(recs['three_compounds_no_security_mock']['mode'] == 'securityMock', 'security mock gate drift')
req(recs['security_mock_zero_algorithm_mock_missing']['mode'] == 'miniMock', 'algorithm mock gate drift')
req(recs['all_short_practice_zero_no_final']['mode'] == 'final', 'observed zero-score readiness behavior changed')
req(recs['all_short_practice_perfect_no_final']['mode'] == 'final', 'observed perfect-score readiness behavior changed')
req(recs['one_low_final_after_low_short_practice']['mode'] == 'final', 'observed low-first-final behavior changed')
req(recs['maintenance_algorithm_weak']['mode'] == 'miniMock', 'maintenance algorithm weakness selection drift')
req(recs['maintenance_security_weak']['mode'] == 'securityMock', 'maintenance security weakness selection drift')
req(recs['maintenance_compound_weak']['mode'] == 'compound', 'maintenance compound weakness selection drift')
req(recs['all_short_practice_zero_no_final']['mode'] == recs['all_short_practice_perfect_no_final']['mode'], 'readiness sensitivity observation changed')

for token in ['function subjectBHubRecommendation(){','if(m.finalRuns<2&&finalAllowed){','const recent=[','直近の正答率が相対的に低い形式']:
    req(token in html, 'progression integration token missing: ' + token)
files = ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes() == (Path('_site_reference')/x).read_bytes() for x in files), 'candidate/reference six-file mismatch')

finding = {
    'id':'subject_b_progression_readiness_blindness',
    'severity':'medium',
    'summary':'Before the second final-practice run, progression is gated by completion/run counts rather than demonstrated short-practice or first-final performance.',
    'evidence':{
        'zero_short_practice_recommendation':recs['all_short_practice_zero_no_final'],
        'perfect_short_practice_recommendation':recs['all_short_practice_perfect_no_final'],
        'low_first_final_recommendation':recs['one_low_final_after_low_short_practice'],
        'maintenance_is_rate_sensitive':True,
    },
}
fixture = {
    'name':f'subject-b-learning-progression-audit-{version}',
    'version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':False,
    'recommendation_scenarios':cand['recommendations'],
    'finding':finding,
    'runtime_preservation':{
        'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],
        'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],
        'selection_signature_500_seeds_unchanged':True,'semantic_validator_ok':True,
    },
    'remediation_coverage':cov,'candidate_reference_six_file_equal':True,
    'findings':{'high':[],'medium':[finding['id']],'low':[]},'status':'passed-medium-finding-recorded',
}
Path(f'_regression/subject-b-learning-progression-audit-{version}.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')
Path(f'audits/SUBJECT_B_LEARNING_PROGRESSION_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Learning Progression / Recommendation Quality Audit
====================================================================================

Result
------
PASS — MEDIUM FINDING RECORDED
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

What was audited
----------------
The main Subject B next-step recommendation was exercised across foundation, compound, mini-mock, final-practice, and maintenance states.
The audit specifically varied short-practice scores and first-final performance while keeping completion/run counts comparable.

What works
----------
New learners are led to algorithm TRACE first, then unfinished security cases, then three compound sets, security mini-mock, algorithm mini-mock, and final practice.
After two final-practice runs, the maintenance recommendation is score-sensitive: the weakest of algorithm mini-mock, security mini-mock, and compound practice is selected.
The exam-3-days behavior remains separate from this audit and was not changed.

Medium finding — subject_b_progression_readiness_blindness
---------------------------------------------------------
Before the second final-practice run, readiness is determined by completion/run counts, not demonstrated performance.
With algorithm mini-mock = 0%, security mini-mock = 0%, and compound = 0%, the next recommendation is still the 100-minute final practice.
With those same three short-practice scores at 100%, the recommendation is also the 100-minute final practice.
After one very low final-practice result, the flow still recommends the second final-practice run rather than using the weak result to route the learner back to targeted short practice.
This is a learning-quality issue rather than a functional or data-integrity failure: the app has score-aware maintenance logic, but that evidence is only consulted after the two-run final-practice gate is satisfied.

Preserved contracts
-------------------
Algorithm remediation targets valid: {cov['algorithm']} / {cov['algorithm']}.
Security remediation targets valid: {cov['security']} / {cov['security']}.
500 deterministic final-session seeds matched v220 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4; v214 order, v217 recovery, and v219 XP-display policies are unchanged.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 1 — subject_b_progression_readiness_blindness
Low: 0

Decision
--------
Keep v221 audit-only. Do not repair the finding in this release.
Use v222 for a narrow readiness-aware recommendation repair: preserve the existing staged onboarding, but require performance evidence before escalating to 100-minute final practice and use a weak first-final result to route back to the most relevant short practice.
''')
print(f'FEQUEST_SUBJECT_B_LEARNING_PROGRESSION_AUDIT_OK version={version} parent={parent} finding={finding["id"]}')