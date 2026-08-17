from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-algorithm-domain-diagnosis-audit-(v(\d+))', branch)
    req(m, 'bad Subject B algorithm-domain diagnosis audit branch')
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
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x226000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function allProgress(items,value){return Object.fromEntries(items.map(x=>[x.id,value]));}
function domainInventory(){
  const counts={};
  for(const x of B_EXAM_ALGO_ITEMS) counts[x.domain]=(counts[x.domain]||0)+1;
  return counts;
}
function domainRemediation(){
  const ex=new Set(B_EXERCISES.map(x=>x.id));
  const out={};
  for(const domain of Object.keys(domainInventory())){
    const item=B_EXAM_ALGO_ITEMS.find(x=>x.domain===domain);
    const d=makeFinalAlgoExam(item);
    const t=bFinalRemediationTarget(d.studyMode,d.sourceId,d.domain);
    out[domain]={sourceId:d.sourceId,mode:t.mode,id:t.id||null,valid:t.mode==='trace'&&ex.has(t.id)};
  }
  return out;
}
function baseFirstFinal(){
  profile.settings={...(profile.settings||{}),examDate:''};
  profile.bProgress=allProgress(B_EXERCISES,100);
  profile.securityBProgress=allProgress(SECURITY_SCENARIOS,100);
  profile.bCompoundStats={};
  for(const s of B_COMPOUND_SETS.slice(0,3)) profile.bCompoundStats[s.id]={seen:1,correct:3,lastSeen:'2026-08-17'};
  profile.bMockHistory=[{rate:20,date:'2026-08-17'}];
  profile.securityMockHistory=[{rate:90,date:'2026-08-17'}];
  profile.bCompoundHistory=[{rate:100,date:'2026-08-17'},{rate:100,date:'2026-08-16'},{rate:100,date:'2026-08-15'}];
  profile.bFinalHistory=[{rate:40,correct:8,blank:0,algoCorrect:4,secCorrect:4,date:'2026-08-17',seconds:4200}];
  profile.bFinalMistakeStats={};
  delete profile.subjectBReadinessV222;
}
function injectDomainMistakes(domain){
  const items=B_EXAM_ALGO_ITEMS.filter(x=>x.domain===domain);
  if(!items.length)return [];
  const keys=[];
  for(const item of items.slice(0,Math.min(3,items.length))){
    const d=makeFinalAlgoExam(item);
    const key=bFinalMistakeKey(d);
    profile.bFinalMistakeStats[key]={misses:6,last:'2026-08-17',lastReason:'コード理解',reasons:{'コード理解':6}};
    keys.push(key);
  }
  return keys;
}
function recommendationSnapshot(domain){
  baseFirstFinal();
  const keys=injectDomainMistakes(domain);
  const normalized=normalizeProfileData(JSON.parse(JSON.stringify(profile)));
  const preserved=keys.every(k=>normalized.bFinalMistakeStats&&normalized.bFinalMistakeStats[k]&&Number(normalized.bFinalMistakeStats[k].misses)>=1);
  const r=subjectBHubRecommendation();
  return {domain,keys,preserved,mode:r.mode,id:r.id||null,title:r.title,desc:r.desc,text:`${r.title} ${r.desc}`};
}
function functionEvidence(){
  let src='';
  try{src+=subjectBHubRecommendation.toString();}catch(e){}
  try{if(typeof _subjectBHubRecommendationV222==='function')src+='\n'+_subjectBHubRecommendationV222.toString();}catch(e){}
  return {mentionsMistakeStats:src.includes('bFinalMistakeStats'),mentionsDomain:src.includes('.domain')||src.includes('domain')};
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
const tree=recommendationSnapshot('木構造');
const bit=recommendationSnapshot('ビット列');
console.log('__V226__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),coverage:remediationCoverage(),
  domains:domainInventory(),domainTargets:domainRemediation(),tree,bit,functionEvidence:functionEvidence()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-5000:])
        m = re.search(r'__V226__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req(version == 'v226' and previous == 'v225', 'v226 domain diagnosis audit expects v225 parent')
source = Path('audits/SUBJECT_B_READINESS_LEARNER_FLOW_AUDIT_v225.txt')
req(source.exists(), 'v225 learner-flow evidence missing')
st = source.read_text()
req('PASS — NO FINDINGS' in st and 'different Subject B learning-quality frontier' in st, 'v225 closure evidence drift')
expected = {
    '.github/subject-b-algorithm-domain-diagnosis-audit/validate_audit.py',
    '.github/workflows/subject-b-algorithm-domain-diagnosis-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v226 audit-only source drift: ' + repr(sorted(changed ^ expected)))
for path in ['app/base-stable.html','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt']:
    req(Path(path).read_bytes() == subprocess.check_output(['git','show',parent+':'+path]), 'learner-facing source drift: '+path)

cand = runtime('_site/index.html')
par = runtime('_site_parent/index.html')
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
req(cand['domains'] == par['domains'] and cand['domainTargets'] == par['domainTargets'], 'domain inventory/remediation drift')
req(cand['tree'] == par['tree'] and cand['bit'] == par['bit'], 'audit-only domain scenario behavior drift')

expected_domains=['制御','一次元配列','二次元配列','再帰・関数','木構造','オブジェクト指向','リスト','スタック・キュー','ビット列','探索・整列']
req(set(cand['domains']) == set(expected_domains), 'algorithm domain inventory drift: '+repr(cand['domains']))
req(sum(cand['domains'].values()) == 43 and all(cand['domains'][d] > 0 for d in expected_domains), 'domain pool coverage incomplete')
req(all(cand['domainTargets'][d]['valid'] for d in expected_domains), 'domain remediation map has invalid target')
req(cand['domainTargets']['木構造']['id'] != cand['domainTargets']['ビット列']['id'], 'tree/bit direct remediation targets unexpectedly collapse')
req(cand['tree']['preserved'] and cand['bit']['preserved'], 'domain-specific final mistake evidence not preserved by normalization')
req(cand['tree']['mode'] == cand['bit']['mode'] == 'miniMock', 'expected broad algorithm remediation route changed')
req(cand['tree']['title'] == cand['bit']['title'], 'aggregate-identical learners unexpectedly receive different broad titles')
req('木構造' not in cand['tree']['text'] and 'ビット列' not in cand['bit']['text'], 'domain label already surfaced in broad recommendation')
cov = cand['coverage']
req(cov['algorithm'] == 43 and not cov['algoBad'], 'algorithm direct remediation coverage drift')
req(cov['security'] == 15 and not cov['secBad'], 'security remediation coverage drift')

fixture = {
    'name': f'subject-b-algorithm-domain-diagnosis-audit-{version}',
    'version': version,
    'previous': previous,
    'sourceMain': parent,
    'learnerFacingChange': False,
    'domainInventory': cand['domains'],
    'domainTargets': cand['domainTargets'],
    'treeScenario': cand['tree'],
    'bitScenario': cand['bit'],
    'functionEvidence': cand['functionEvidence'],
    'selectionSignature1000': cand['selectionSig'],
    'coverage': cov,
    'finding': {
        'id': 'algorithm_domain_weakness_not_aggregated_for_progression',
        'severity': 'Medium',
        'summary': 'Domain-specific final mistakes are persisted and have valid direct TRACE destinations, but the progression recommendation collapses distinct algorithm weaknesses to the same generic algorithm mini-mock.'
    }
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-algorithm-domain-diagnosis-audit-v226.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2)+'\n')

audit = f'''FE QUEST v226 — Subject B Algorithm Domain Diagnosis Audit
=============================================================================

Result
------
PASS — MEDIUM FINDING RECORDED
Previous: v225
Source main: {parent}
Learner-facing change in v226: none

What was audited
------------------
The audit moved beyond the closed v221-v225 readiness route and tested whether algorithm weakness can be diagnosed at the ten-domain level rather than only as one aggregate algorithm score.
It inventoried the 43 final-practice algorithm items, verified each item's domain-specific direct remediation target, injected persistent mistake histories concentrated in two clearly different domains, and compared the resulting top-level progression recommendation under otherwise identical learning evidence.

Domain evidence proof
---------------------
Algorithm final-practice pool: 43 items across all 10 domains.
Domain counts: {json.dumps(cand['domains'], ensure_ascii=False, sort_keys=True)}
Every domain has a valid TRACE remediation destination through the existing final-result remediation mapping.
Direct target example — 木構造: {cand['domainTargets']['木構造']['id']}
Direct target example — ビット列: {cand['domainTargets']['ビット列']['id']}
Those targets are distinct, so the app already possesses enough curriculum structure to send an individual wrong answer to a domain-relevant TRACE exercise.
Domain-concentrated bFinalMistakeStats survived profile normalization in both probes.

Progression behavior proof
--------------------------
The learners had identical foundation completion, short-practice rates, and a 40% first final with algorithm weakness. Their only meaningful difference was persistent wrong-answer evidence concentrated in 木構造 versus ビット列.
木構造-heavy recommendation: mode={cand['tree']['mode']} / title={cand['tree']['title']}
ビット列-heavy recommendation: mode={cand['bit']['mode']} / title={cand['bit']['title']}
The two recommendations are identical and neither surfaces the weak domain. The current readiness layer therefore reacts to aggregate algorithm performance but does not aggregate the already-persisted per-item/domain evidence into the next-study recommendation.

Medium finding
--------------
algorithm_domain_weakness_not_aggregated_for_progression
Distinct algorithm-domain weakness patterns collapse to the same generic algorithm mini-mock at the progression layer. This is not a scoring or correctness defect: direct wrong-answer remediation remains precise and valid. The learning-efficiency gap is that a learner who repeatedly misses, for example, 木構造 is not preferentially routed to the existing 木構造 TRACE target when the hub decides what to study next.

Recommended repair boundary
---------------------------
Use v227 for a narrow domain-aware progression repair. Reuse existing B_EXAM_ALGO_ITEMS domain labels, bFinalMistakeStats, and B_FINAL_DOMAIN_REMEDIATION targets rather than creating a parallel taxonomy. Prefer a domain-specific TRACE recommendation only when evidence is sufficiently concentrated; keep the generic algorithm mini-mock as the fallback when evidence is sparse or diffuse. Do not change scoring, question selection, the 65% readiness gate, security routing, or the direct final-result remediation buttons.

Preserved contracts
-------------------
1000 deterministic final-session seeds matched v225 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, v222 readiness calculation, and v224 compound evidence copy are unchanged.
Algorithm direct remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 1
Low: 0

Decision
--------
Publish v226 as an audit-only release with the Medium finding recorded. Repair only the domain-aware progression gap in v227, then perform a short post-repair audit.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_ALGORITHM_DOMAIN_DIAGNOSIS_AUDIT_v226.txt').write_text(audit)
print('FEQUEST_SUBJECT_B_ALGORITHM_DOMAIN_DIAGNOSIS_AUDIT_OK version='+version+' high=0 medium=1 low=0 domains=10 pool=43')
