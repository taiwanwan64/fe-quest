from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(v, m):
    if not v:
        raise AssertionError(m)


def context():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'], text=True).strip()
    m = re.fullmatch(r'subject-b-final-order-(v(\d+))', branch)
    req(m, 'bad Subject B final order release branch')
    version = m.group(1)
    return version, f"v{int(m.group(2))-1}"


def dump(path, probe=False):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function __seeded(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function __setStats(seed=0){
  profile.bFinalStats={};
  B_EXAM_ALGO_ITEMS.forEach((q,i)=>{profile.bFinalStats[`algo:${q.id}`]={seen:(i*7+seed)%6,correct:0,lastSeen:null};});
  SECURITY_SCENARIOS.forEach((s,i)=>{profile.bFinalStats[`sec:${s.id}`]={seen:(i*5+seed)%4,correct:0,lastSeen:null};});
}
function __key(x){return `${x.kind}:${x.sourceId}`;}
function __summary(items){
  const algo=items.filter(x=>x.kind==='algo'),sec=items.filter(x=>x.kind==='security');
  const levels=algo.reduce((m,x)=>{m[x.level]=(m[x.level]||0)+1;return m;},{});
  const high=new Set(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]);
  let transitions=0;for(let i=1;i<items.length;i++)if(items[i].kind!==items[i-1].kind)transitions++;
  return {
    total:items.length,algo:algo.length,sec:sec.length,levels,
    domains:new Set(algo.map(x=>x.domain)).size,unique:new Set(algo.map(x=>x.sourceId)).size,
    high:algo.filter(x=>high.has(x.sourceId)).length,log:sec.filter(x=>!!x.log).length,nonlog:sec.filter(x=>!x.log).length,
    exactBlock:items.slice(0,16).every(x=>x.kind==='algo')&&items.slice(16).every(x=>x.kind==='security'),
    securityBefore17:items.slice(0,16).some(x=>x.kind==='security'),transitions
  };
}
function __paired(n){
  if(typeof globalThis.__buildBFinalBeforeV214!=='function')return null;
  let setMismatch=0,stablePartitionMismatch=0,contractFailure=0;
  for(let i=1;i<=n;i++){
    const seed=(0x214000+i)>>>0;
    __setStats(i);
    Math.random=__seeded(seed);
    const before=globalThis.__buildBFinalBeforeV214();
    __setStats(i);
    Math.random=__seeded(seed);
    const after=buildBFinal();
    const beforeKeys=before.map(__key),afterKeys=after.map(__key);
    const expected=before.filter(x=>x.kind==='algo').concat(before.filter(x=>x.kind==='security')).map(__key);
    if([...beforeKeys].sort().join('|')!==[...afterKeys].sort().join('|'))setMismatch++;
    if(expected.join('|')!==afterKeys.join('|'))stablePartitionMismatch++;
    const s=__summary(after);
    if(s.total!==20||s.algo!==16||s.sec!==4||s.levels['標準']!==8||s.levels['応用']!==8||s.domains!==10||s.unique!==16||s.high<4||s.log!==2||s.nonlog!==2||!s.exactBlock||s.transitions!==1)contractFailure++;
  }
  return {sessions:n,setMismatch,stablePartitionMismatch,contractFailure};
}
function __order(n){
  __setStats(0);Math.random=__seeded(0x214214);
  let exactBlock=0,securityBefore17=0,badContract=0,minHigh=999,maxHigh=0,transitionTotal=0,minTransitions=99,maxTransitions=0;
  for(let i=0;i<n;i++){
    const s=__summary(buildBFinal());
    if(s.exactBlock)exactBlock++;if(s.securityBefore17)securityBefore17++;
    if(s.total!==20||s.algo!==16||s.sec!==4||s.levels['標準']!==8||s.levels['応用']!==8||s.domains!==10||s.unique!==16||s.log!==2||s.nonlog!==2)badContract++;
    minHigh=Math.min(minHigh,s.high);maxHigh=Math.max(maxHigh,s.high);transitionTotal+=s.transitions;minTransitions=Math.min(minTransitions,s.transitions);maxTransitions=Math.max(maxTransitions,s.transitions);
  }
  return {sessions:n,exactBlock,securityBefore17,badContract,minHigh,maxHigh,avgTransitions:Math.round(transitionTotal/n*1000)/1000,minTransitions,maxTransitions};
}
const __probe=%PROBE%?{paired:__paired(2500),order:__order(20000)}:null;
console.log('__BFORDER__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,q:QUESTION_BANK,e:B_EXERCISES,b:B_COMPOUND_SETS,s:SECURITY_SCENARIOS,
  pool:B_EXAM_ALGO_ITEMS,contracts:B_EXAM_ALGO_CONTRACTS,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  spec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,sem:validateSubjectBSemantics(),probe:__probe
})).toString('base64'));
'''.replace('%PROBE%', 'true' if probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / 'runtime.js'
        f.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(f)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime dump failed: ' + z.stderr[-5000:])
        m = re.search(r'__BFORDER__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime dump marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = context()
req(version == 'v214' and previous == 'v213', 'v214 context expected')
parent = subprocess.check_output(['git','rev-parse','origin/main'], text=True).strip()
manifest_path = Path(f'_release/content-change-{version}.json')
req(manifest_path.exists(), 'content manifest missing')
mf = json.loads(manifest_path.read_text())
req(mf.get('schema_version') == 1, 'manifest schema')
req(mf.get('release') == version and mf.get('previous_release') == previous, 'manifest release context')
req(mf.get('parent_main_sha') == parent, 'manifest parent mismatch')
req(mf.get('change_type') == 'subject-b-final-order-fidelity-repair', 'change type')
req(mf.get('source_priority_tier') == 'medium', 'priority tier')
req(mf.get('allowed_question_ids') == [], 'question content must not change')

source_audit = Path(mf.get('source_quality_audit',''))
req(source_audit.exists(), 'source audit missing')
audit_text = source_audit.read_text()
req('PASS WITH MEDIUM FINDING' in audit_text, 'v213 source audit result')
req('final_question_order_fidelity' in audit_text, 'v213 order finding missing')
req('For v214' in audit_text and 'algorithm 16 + security 4' in audit_text, 'v214 repair direction missing')

tooling = {
  '.github/subject-b-final-order-release/validate_content.py',
  '.github/workflows/subject-b-final-order-release-validate.yml',
}
committed = set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'], text=True).splitlines())
expected = set(mf.get('content_files',[])) | set(mf.get('assembly_files',[])) | {manifest_path.as_posix()} | tooling
req(committed == expected, 'pre-release drift ' + repr(sorted(committed ^ expected)))

stable = [
  'app/base-stable.html','app/learning-patches.txt','app/learning-quality-overrides.txt',
  'app/subject-b-security-overrides-v200.txt','app/subject-b-algorithm-overrides-v202.txt','app/subject-b-session-overrides-v205.txt',
  'app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt',
  'audits/SUBJECT_B_FINAL_SESSION_EXPERIENCE_AUDIT_v213.txt',
  '.github/release/release_materialize.py','.github/release/prepare_reference.py','.github/release/release_validate.py','.github/release/runtime_stub.py',
  '.github/content-release/prepare_reference.py'
]
for p in stable:
    req(Path(p).read_bytes() == subprocess.check_output(['git','show',parent+':'+p]), 'stable drift '+p)

override_path = Path(mf['content_files'][0])
override = override_path.read_text()
req('__buildBFinalBeforeV214=buildBFinal' in override, 'v214 wrapper boundary missing')
req("const ordered=[...algo,...sec]" in override, 'stable block partition missing')
req('Math.random' not in override and 'shuffled(' not in override, 'v214 must not consume extra randomness')
for forbidden in ['B_EXAM_ALGO_ITEMS.push','B_EXAM_ALGO_ITEMS.splice','SECURITY_SCENARIOS.push','profile.schemaVersion','B_FINAL_HIGH_TRACE_FLOOR_V208=']:
    req(forbidden not in override, 'forbidden mutation token '+forbidden)

candidate = dump('_site/index.html', probe=True)
parent_rt = dump('_site_parent/index.html', probe=False)
req(candidate['v'] == version and parent_rt['v'] == previous, 'runtime versions')
for key,label in [('q','QUESTION_BANK'),('e','B_EXERCISES'),('b','compound'),('s','security'),('pool','final algorithm pool'),('contracts','algorithm contracts')]:
    req(candidate[key] == parent_rt[key], label+' changed')
req(candidate['counts'] == parent_rt['counts'] == [20,16,4], 'final counts drift')
req(candidate['seconds'] == parent_rt['seconds'] == 6000, 'time limit drift')
req(candidate['high'] == parent_rt['high'] and len(candidate['high']) == 15, 'high-trace inventory drift')
req(candidate['floor'] == parent_rt['floor'] == 4, 'high-trace floor drift')
req(candidate['sem'].get('ok') is True, 'Subject B semantic validation failed: '+repr(candidate['sem'].get('errors')))

spec = candidate.get('spec') or {}
req(spec.get('policy') == 'final-practice-algorithm-then-security-block-order', 'v214 spec policy')
req(spec.get('sourceAudit') == 'v213-final_question_order_fidelity', 'v214 spec source')
req(spec.get('algorithmBlockCount') == 16 and spec.get('securityBlockCount') == 4, 'v214 spec block counts')
req(spec.get('selectedSetChanged') is False and spec.get('selectorChanged') is False and spec.get('stablePartitionOnly') is True, 'v214 scope drift')

paired = candidate['probe']['paired']
order = candidate['probe']['order']
req(paired and paired['sessions'] == 2500, 'paired probe missing')
req(paired['setMismatch'] == 0, 'selected set changed under matched seed/history')
req(paired['stablePartitionMismatch'] == 0, 'output is not exact stable partition')
req(paired['contractFailure'] == 0, 'paired contract failure')
req(order['sessions'] == 20000 and order['exactBlock'] == 20000, '20k exact block order failure')
req(order['securityBefore17'] == 0, 'security appeared before Q17')
req(order['badContract'] == 0, '20k final contract failure')
req(order['minHigh'] >= 4, 'trace floor failure')
req(order['minTransitions'] == order['maxTransitions'] == 1 and order['avgTransitions'] == 1, 'type transition count drift')

html = Path('_site/index.html').read_text()
for token in ['id="bFinalTimer"','saveBFinalResume()','bFinalSeconds%15===0','id="bFinalFlag"','data-bfq=','トレースミス','コード理解','読み違い','知識不足','時間不足','data-bfinalstudy']:
    req(token in html, 'session UX/review token missing: '+token)

files = ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes() == (Path('_site_reference')/x).read_bytes() for x in files), 'candidate/reference six-file mismatch')

fixture = {
  'name':f'subject-b-final-order-repair-{version}',
  'version':version,'previous_version':previous,'parent_main_sha':parent,
  'learner_facing_change':True,
  'change_type':'presentation-order-only-stable-partition',
  'selected_question_set_changed':False,
  'question_content_changed':False,
  'saved_state_ids_changed':False,
  'time_limit_seconds':6000,
  'final_counts':[20,16,4],
  'algorithm_pool_count':43,'high_trace_count':15,'high_trace_floor':4,
  'paired_equivalence_probe':paired,
  'order_probe':order,
  'review_and_resume_contract_preserved':True,
  'subject_b_semantic_validator_ok':True,
  'finding_resolved':'final_question_order_fidelity',
  'status':'passed'
}
Path(f'_regression/subject-b-final-order-repair-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

Path(f'audits/SUBJECT_B_FINAL_ORDER_REPAIR_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice Question-Order Repair\n=====================================================================\n\nResult\n------\nPASS — v213 MEDIUM FINDING RESOLVED\nPrevious: {previous}\nSource main: {parent}\nLearner-facing change in {version}: presentation order only\n\nRepair\n------\nThe already-selected 20-question set is now presented as Q1-Q16 algorithm/programming followed by Q17-Q20 information security. The v213 full shuffle is not replaced with a new selector: v214 calls the existing selector once and performs a stable partition of its output. Relative random order inside the algorithm subset and inside the security subset is inherited from the existing shuffle. No additional Math.random call is introduced.\n\nSelection-equivalence proof\n---------------------------\nMatched seed/history pairs: {paired['sessions']}.\nSelected-set mismatches: {paired['setMismatch']}.\nStable-partition mismatches: {paired['stablePartitionMismatch']}.\nStructural/quota failures: {paired['contractFailure']}.\nTherefore the v214 presentation repair does not alter which 16 algorithm and 4 security questions are selected for the same RNG/history state.\n\n20,000-session order probe\n--------------------------\nExact Q1-Q16 algorithm + Q17-Q20 security: {order['exactBlock']} / {order['sessions']} (100%).\nSecurity before Q17: {order['securityBefore17']} / {order['sessions']}.\nType transitions: average {order['avgTransitions']} / min {order['minTransitions']} / max {order['maxTransitions']}.\nHigh-trace count: min {order['minHigh']} / max {order['maxHigh']}.\nStructural/security quota failures: {order['badContract']}.\n\nPreserved contracts\n-------------------\n100 minutes / 20 questions.\n16 algorithm + 4 security; algorithm 標準8 / 応用8; ten algorithm domains; unique algorithm IDs.\n43-item final algorithm pool; 15 high-trace items; sustained-trace floor 4.\nSecurity remains 2 log + 2 non-log.\nQuestion content, answer contracts, saved-state IDs, scoring, timer, 15-second resume checkpoint, free navigation, flag-for-review and result remediation remain unchanged.\nSubject B semantic validation: OK.\n\nFinding\n-------\nHigh: 0\nMedium: 0\nLow: 0\nResolved: final_question_order_fidelity\n\nDecision\n--------\nAccept the block-order repair. v215 should be audit-only by default: re-check post-repair whole-session behavior, especially resume/navigation/review index alignment across the Q16→Q17 boundary, before making any further learner-facing Subject B change.\n''')
print(f"FEQUEST_SUBJECT_B_FINAL_ORDER_REPAIR version={version} paired={paired['sessions']} exact={order['exactBlock']}/{order['sessions']}")
