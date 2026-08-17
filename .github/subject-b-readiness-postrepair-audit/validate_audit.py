from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def context():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'], text=True).strip()
    m = re.fullmatch(r'subject-b-readiness-postrepair-audit-(v(\d+))', branch)
    req(m, 'bad Subject B readiness post-repair audit branch')
    version = m.group(1)
    return version, f'v{int(m.group(2))-1}'


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x223000+i)>>>0);h=hashText(h,buildBFinal().map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function progress(items,v){return Object.fromEntries(items.map(x=>[x.id,v]));}
function compoundRows(rates){return rates.map((rate,i)=>({rate,date:`2026-08-${17-i}`,id:`c${i}`,correct:rate>=67?2:rate>=33?1:0,total:3}));}
function setShort(a,s,c=[100,67,67]){profile.bMockHistory=[{rate:a,date:'2026-08-17'}];profile.securityMockHistory=[{rate:s,date:'2026-08-17'}];profile.bCompoundHistory=compoundRows(c);}
function base(){profile.settings={...(profile.settings||{}),examDate:''};profile.bProgress=progress(B_EXERCISES,100);profile.securityBProgress=progress(SECURITY_SCENARIOS,100);profile.bCompoundStats={};for(const s of B_COMPOUND_SETS.slice(0,3))profile.bCompoundStats[s.id]={seen:1,correct:2,lastSeen:'2026-08-17'};setShort(80,80);profile.bFinalHistory=[];delete profile.subjectBReadinessV222;}
function finalRow(rate,a,s,date='2026-08-17'){return {rate,correct:a+s,blank:0,algoCorrect:a,secCorrect:s,date,seconds:4200};}
function snap(name){const r=subjectBHubRecommendation();return {name,stage:r.stage,mode:r.mode,title:r.title,desc:r.desc,marker:profile.subjectBReadinessV222?structuredClone(profile.subjectBReadinessV222):null};}
function scenarios(){
 const o=[];
 base();setShort(65,65,[65,65,65]);o.push(snap('short_65'));
 base();setShort(64,80,[100,100,100]);o.push(snap('algo_64'));
 base();setShort(80,64,[100,100,100]);o.push(snap('security_64'));
 base();setShort(80,80,[64,64,64]);o.push(snap('compound_64'));
 base();profile.bFinalHistory=[finalRow(65,9,4)];o.push(snap('final_65'));
 base();profile.bFinalHistory=[finalRow(64,8,4)];o.push(snap('final_64'));
 base();profile.bFinalHistory=[finalRow(50,10,0)];o.push(snap('security_weak_final'));
 base();setShort(20,80,[100,100,100]);profile.bFinalHistory=[finalRow(40,4,4)];o.push(snap('algo_target_before'));profile.securityMockHistory.unshift({rate:100,date:'2026-08-18'});o.push(snap('after_unrelated'));profile.bMockHistory.unshift({rate:50,date:'2026-08-18'});o.push(snap('after_target_50'));profile.bMockHistory.unshift({rate:70,date:'2026-08-19'});o.push(snap('after_target_70'));
 base();setShort(90,90,[67,33,100]);profile.bFinalHistory=[finalRow(40,4,4)];o.push(snap('compound_before'));profile.bCompoundHistory.unshift({rate:67,date:'2026-08-18',id:'new67',correct:2,total:3});o.push(snap('compound_after_one_67'));
 base();profile.bFinalHistory=[finalRow(40,4,4)];const first=snap('marker_first');const m1=JSON.stringify(profile.subjectBReadinessV222);const second=snap('marker_second');const m2=JSON.stringify(profile.subjectBReadinessV222);const norm=normalizeProfileData(JSON.parse(JSON.stringify(profile)));o.push(first,second,{name:'marker_roundtrip',stable:m1===m2,preserved:JSON.stringify(norm.subjectBReadinessV222||null)===m2});profile.bFinalHistory=[finalRow(30,3,3,'2026-08-18')];const changed=snap('marker_changed_final');o.push(changed,{name:'marker_key_changed',changed:changed.marker?.firstFinalKey!==second.marker?.firstFinalKey});
 base();profile.bFinalHistory=[finalRow(90,14,4),finalRow(85,13,4,'2026-08-16')];profile.bMockHistory=[{rate:15,date:'2026-08-17'}];profile.securityMockHistory=[{rate:90,date:'2026-08-17'}];profile.bCompoundHistory=[{rate:80,date:'2026-08-17'}];o.push(snap('maintenance_algo_weak'));
 base();const old=examDaysRemaining;examDaysRemaining=()=>2;o.push(snap('exam_three_days'));examDaysRemaining=old;
 return o;
}
function coverage(){const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id)}).map(x=>x.sourceId);const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id)}).map(x=>x.sourceId);return {algorithm:algo.length,security:sec.length,algoBad,secBad};}
console.log('__V223__'+Buffer.from(JSON.stringify({v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,sem:validateSubjectBSemantics(),sig:selectionSignature(500),coverage:coverage(),scenarios:scenarios()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-5000:])
        m = re.search(r'__V223__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return html, json.loads(base64.b64decode(m.group(1)))


version, previous = context()
parent = subprocess.check_output(['git','rev-parse','origin/main'], text=True).strip()
req((version, previous) == ('v223','v222'), 'v223 audit expects v222 parent')
source = Path('audits/SUBJECT_B_READINESS_REPAIR_v222.txt')
req(source.exists(), 'v222 repair evidence missing')
source_text = source.read_text()
req('PASS — v221 MEDIUM FINDING RESOLVED' in source_text and 'Use v223 for a post-repair progression audit' in source_text, 'v222 evidence drift')
expected = {'.github/subject-b-readiness-postrepair-audit/validate_audit.py','.github/workflows/subject-b-readiness-postrepair-audit.yml'}
changed = set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v223 audit-only source drift: ' + repr(sorted(changed ^ expected)))
for path in ['app/base-stable.html','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt']:
    req(Path(path).read_bytes() == subprocess.check_output(['git','show',parent+':'+path]), 'learner-facing source drift: '+path)

html, cand = runtime('_site/index.html')
parent_html, par = runtime('_site_parent/index.html')
req(cand['v'] == version and par['v'] == previous, 'runtime versions')
req(cand['counts'] == par['counts'] == [20,16,4] and cand['seconds'] == par['seconds'] == 6000, 'final blueprint drift')
req(cand['pool'] == par['pool'] == 43 and len(cand['high']) == len(par['high']) == 15 and cand['floor'] == par['floor'] == 4, 'final pool/high-trace drift')
req(cand['orderSpec'] == par['orderSpec'] and cand['recoverySpec'] == par['recoverySpec'] and cand['xpSpec'] == par['xpSpec'] and cand['readinessSpec'] == par['readinessSpec'], 'Subject B policy spec drift')
req(cand['sig'] == par['sig'], '500-seed final selection/order drift')
req(cand['sem'].get('ok') is True and cand['scenarios'] == par['scenarios'], 'audit-only Subject B behavior drift')
cov = cand['coverage']
req(cov['algorithm'] == 43 and not cov['algoBad'] and cov['security'] == 15 and not cov['secBad'], 'remediation coverage drift')

base_source = Path('app/base-stable.html').read_text()
history = {
    'algorithm_newest_first': 'profile.bMockHistory=[attempt,...(profile.bMockHistory||[])].slice(0,20)' in base_source,
    'security_newest_first': 'profile.securityMockHistory=[attempt,...(profile.securityMockHistory||[])].slice(0,20)' in base_source,
    'compound_newest_first': 'profile.bCompoundHistory=[{date:localDateISO(0)' in base_source and '...(profile.bCompoundHistory||[])].slice(0,20)' in base_source,
}
req(all(history.values()), 'actual history storage is not newest-first')

R = {x['name']:x for x in cand['scenarios']}
req(R['short_65']['mode'] == 'final', '65% short-practice boundary should allow final')
req(R['algo_64']['mode'] == 'miniMock' and R['security_64']['mode'] == 'securityMock' and R['compound_64']['mode'] == 'compound', '64% weak-mode routing drift')
req(R['final_65']['mode'] == 'final' and R['final_64']['mode'] in {'miniMock','compound'}, 'first-final 64/65 boundary drift')
req(R['security_weak_final']['mode'] == 'securityMock', 'security-weak first final routing drift')
req(R['algo_target_before']['mode'] == R['after_unrelated']['mode'] == R['after_target_50']['mode'] == 'miniMock', 'targeted remediation lock/bypass drift')
req(R['after_target_70']['mode'] == 'final', 'passing targeted mini-mock did not unlock second final')
req(R['marker_roundtrip']['stable'] is True and R['marker_roundtrip']['preserved'] is True and R['marker_key_changed']['changed'] is True, 'readiness marker persistence/identity drift')
req(R['maintenance_algo_weak']['mode'] == 'miniMock' and R['exam_three_days']['mode'] != 'final', 'maintenance or exam-three-days behavior drift')
req(R['compound_before']['mode'] == 'compound', 'compound remediation target routing drift')

compound_gap = R['compound_after_one_67']['mode'] == 'compound' and '1回確認' in R['compound_after_one_67']['desc']
low = ['compound_remediation_window_message'] if compound_gap else []
finding = None
if low:
    finding = {
        'id':'compound_remediation_window_message','severity':'low',
        'summary':'Compound remediation uses a rolling three-attempt average while the first-final recovery copy says to check it once; one new 67% compound result can therefore still leave the second final locked.',
        'evidence':{'before':R['compound_before'],'after_one_new_67':R['compound_after_one_67'],'history_semantics':history}
    }

for token in ['gate-final-practice-by-demonstrated-short-practice-and-first-final-evidence','subjectBReadinessRateV222','subjectBFirstFinalTargetV222','profile.subjectBReadinessV222']:
    req(token in html and token in parent_html, 'v222 readiness integration token missing: '+token)
files = ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes() == (Path('_site_reference')/x).read_bytes() for x in files), 'candidate/reference six-file mismatch')

fixture = {
    'name':f'subject-b-readiness-postrepair-audit-{version}','version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':False,
    'readiness_spec':cand['readinessSpec'],'scenarios':cand['scenarios'],'history_semantics':history,'finding':finding,
    'runtime_preservation':{'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],'selection_signature_500_seeds_unchanged':True,'semantic_validator_ok':True},
    'remediation_coverage':cov,'candidate_reference_six_file_equal':True,'findings':{'high':[],'medium':[],'low':low},'status':'passed-low-finding-recorded' if low else 'passed-no-findings'
}
Path(f'_regression/subject-b-readiness-postrepair-audit-{version}.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2)+'\n')
result = 'PASS — LOW FINDING RECORDED' if low else 'PASS — NO FINDINGS'
extra = '''\nLow finding — compound_remediation_window_message\n--------------------------------------------------\nCompound readiness uses the average of the three newest compound attempts, while the first-final recovery copy says to check the compound problem once and aim for 65%. A qualifying pre-final window of 67%, 33%, 100% averages 67%; after one new 67% attempt, the newest three become 67%, 67%, 33% (56%), so the learner is still routed to compound practice despite completing one new attempt at or above the displayed target.\nThis is a guidance/expectation mismatch, not a readiness-engine failure. The rolling evidence is reasonable for a three-question set, but the copy should describe it accurately.\n''' if low else '\nNo findings were identified.\n'
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
The actual completion functions were checked to confirm algorithm, security, and compound histories are all stored newest-first, so v222's index-0 recency assumption is valid.

What passed
-----------
65% short-practice evidence allows final practice; 64% evidence routes to the matching short mode.
A 65% first final allows the second final; a lower first final routes to targeted practice.
Unrelated practice cannot unlock the second final. A targeted 50% mini-mock remains blocked; a later 70% targeted mini-mock unlocks it.
The readiness marker remains stable across rerenders, survives profile normalization, and refreshes when first-final identity changes.
Exam-three-days taper and post-two-final maintenance routing remain intact.
{extra}
Preserved contracts
-------------------
500 deterministic final-session seeds matched {previous} selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, and v222 readiness specs are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK. Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: {len(low)}

Decision
--------
Do not change learner-facing behavior in this audit release. {('Use v224 for a narrow compound-remediation copy/evidence-clarity repair.' if low else 'Move the next release to a different Subject B learning-quality frontier.')}
''')
print(f'FEQUEST_SUBJECT_B_READINESS_POSTREPAIR_AUDIT_OK version={version} high=0 medium=0 low={len(low)} selection=500 history=newest-first')
