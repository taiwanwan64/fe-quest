from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(v, m):
    if not v:
        raise AssertionError(m)


def context():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'], text=True).strip()
    m = re.fullmatch(r'subject-b-final-boundary-audit-(v(\d+))', branch)
    req(m, 'bad Subject B final boundary audit branch')
    version = m.group(1)
    previous = f"v{int(m.group(2))-1}"
    return version, previous


def dump(path, probe=False):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function __seeded(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function __resetFinalStats(){
  profile.bFinalStats={};
  B_EXAM_ALGO_ITEMS.forEach(q=>{profile.bFinalStats[`algo:${q.id}`]={seen:0,correct:0,lastSeen:null};});
  SECURITY_SCENARIOS.forEach(s=>{profile.bFinalStats[`sec:${s.id}`]={seen:0,correct:0,lastSeen:null};});
}
function __ids(items){return items.map(x=>`${x.kind}:${x.sourceId}`);}
function __summary(items){
  const algo=items.filter(x=>x?.kind==='algo'),sec=items.filter(x=>x?.kind==='security');
  const levels=algo.reduce((m,x)=>{m[x.level]=(m[x.level]||0)+1;return m;},{});
  const high=new Set(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]);
  return {
    total:items.length,algo:algo.length,sec:sec.length,
    std:levels['標準']||0,applied:levels['応用']||0,
    domains:new Set(algo.map(x=>x.domain)).size,
    unique:new Set(algo.map(x=>x.sourceId)).size,
    high:algo.filter(x=>high.has(x.sourceId)).length,
    log:sec.filter(x=>!!x.log).length,nonlog:sec.filter(x=>!x.log).length,
    q16:items[15]?.kind||null,q17:items[16]?.kind||null,
    transitions:items.slice(1).reduce((n,x,i)=>n+(x.kind!==items[i].kind?1:0),0)
  };
}
function __runMatched(n){
  let selectedSetMismatch=0,partitionMismatch=0,boundaryFailure=0,contractFailure=0;
  __resetFinalStats();
  for(let i=0;i<n;i++){
    const seed=(0x215100+i)>>>0;
    Math.random=__seeded(seed);
    const before=__buildBFinalBeforeV214();
    Math.random=__seeded(seed);
    const after=buildBFinal();
    const a=[...__ids(before)].sort(),b=[...__ids(after)].sort();
    if(JSON.stringify(a)!==JSON.stringify(b))selectedSetMismatch++;
    const expected=[...before.filter(x=>x.kind==='algo'),...before.filter(x=>x.kind==='security')];
    if(JSON.stringify(__ids(expected))!==JSON.stringify(__ids(after)))partitionMismatch++;
    const s=__summary(after);
    if(s.q16!=='algo'||s.q17!=='security'||s.transitions!==1)boundaryFailure++;
    if(s.total!==20||s.algo!==16||s.sec!==4||s.std!==8||s.applied!==8||s.domains!==10||s.unique!==16||s.high<4||s.log!==2||s.nonlog!==2)contractFailure++;
  }
  return {sessions:n,selectedSetMismatch,partitionMismatch,boundaryFailure,contractFailure};
}
function __runAdaptive(n){
  Math.random=__seeded(0x215200);
  __resetFinalStats();
  let boundaryFailure=0,contractFailure=0,minHigh=999,maxHigh=0;
  for(let i=0;i<n;i++){
    const items=buildBFinal(),s=__summary(items);
    minHigh=Math.min(minHigh,s.high);maxHigh=Math.max(maxHigh,s.high);
    if(s.q16!=='algo'||s.q17!=='security'||s.transitions!==1)boundaryFailure++;
    if(s.total!==20||s.algo!==16||s.sec!==4||s.std!==8||s.applied!==8||s.domains!==10||s.unique!==16||s.high<4||s.log!==2||s.nonlog!==2)contractFailure++;
    items.forEach(x=>{const k=`${x.kind==='security'?'sec':'algo'}:${x.sourceId}`;if(profile.bFinalStats[k]){profile.bFinalStats[k].seen++;profile.bFinalStats[k].lastSeen=`session-${i}`;}});
  }
  return {sessions:n,boundaryFailure,contractFailure,minHigh,maxHigh};
}
function __roundTripBoundary(){
  Math.random=__seeded(0x215300);__resetFinalStats();
  const items=buildBFinal();
  const answers=items.map((_,i)=>i%4);
  const flags=[15,16];
  const payload={version:1,appVersion:APP_VERSION,items,answers,flags,index:15,expiresAt:Date.now()+600000,startedAt:Date.now()-1000,savedAt:Date.now()};
  const s=JSON.parse(JSON.stringify(payload));
  const restoredItems=s.items,restoredAnswers=s.answers,restoredFlags=new Set(s.flags||[]);
  const q16={sourceId:restoredItems[15].sourceId,kind:restoredItems[15].kind,answer:restoredAnswers[15],flagged:restoredFlags.has(15)};
  const q17={sourceId:restoredItems[16].sourceId,kind:restoredItems[16].kind,answer:restoredAnswers[16],flagged:restoredFlags.has(16)};
  const details=restoredItems.map((item,i)=>({sourceId:item.sourceId,kind:item.kind,answer:restoredAnswers[i],q:i+1}));
  return {itemIdsPreserved:JSON.stringify(__ids(items))===JSON.stringify(__ids(restoredItems)),q16,q17,reviewQ16:details[15],reviewQ17:details[16]};
}
let probe=null;
if(%PROBE%){probe={matched:__runMatched(5000),adaptive:__runAdaptive(3000),roundTrip:__roundTripBoundary()};}
console.log('__BOUNDARY__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  finalCounts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],
  pool:B_EXAM_ALGO_ITEMS.length,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],
  floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  spec:globalThis.SUBJECT_B_FINAL_V214_SPEC||null,
  sem:validateSubjectBSemantics(),
  probe
})).toString('base64'));
'''.replace('%PROBE%', 'true' if probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / 'runtime.js'
        f.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(f)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime dump failed: ' + z.stderr[-5000:])
        m = re.search(r'__BOUNDARY__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime dump marker missing')
        return html, json.loads(base64.b64decode(m.group(1)))


version, previous = context()
parent = subprocess.check_output(['git','rev-parse','origin/main'], text=True).strip()
req(previous == 'v214', 'v215 boundary audit expects v214 parent')
source_audit = Path('audits/SUBJECT_B_FINAL_ORDER_REPAIR_v214.txt')
req(source_audit.exists(), 'v214 source repair audit missing')
source_text = source_audit.read_text()
req('PASS — v213 MEDIUM FINDING RESOLVED' in source_text and 'final_question_order_fidelity' in source_text, 'v214 source repair evidence drift')

# Audit-only source boundary: no learner-facing app or assembly file is committed before materialization.
tooling={
  '.github/subject-b-final-boundary-audit/validate_audit.py',
  '.github/workflows/subject-b-final-boundary-audit.yml',
}
committed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'], text=True).splitlines())
req(committed==tooling, 'v215 pre-release audit-only drift: '+repr(sorted(committed ^ tooling)))

candidate_html, candidate = dump('_site/index.html', probe=True)
parent_html, parent_rt = dump('_site_parent/index.html', probe=False)
req(candidate['v'] == version and parent_rt['v'] == previous, 'runtime versions')
req(candidate['finalCounts'] == parent_rt['finalCounts'] == [20,16,4], 'final count drift')
req(candidate['pool'] == parent_rt['pool'] == 43, 'algorithm pool drift')
req(candidate['high'] == parent_rt['high'] and len(candidate['high']) == 15, 'high-trace inventory drift')
req(candidate['floor'] == parent_rt['floor'] == 4, 'high-trace floor drift')
req(candidate['spec'] == parent_rt['spec'], 'v214 order spec drift')
req(candidate['sem'].get('ok') is True, 'Subject B semantic validation failed: '+repr(candidate['sem'].get('errors')))

spec=candidate['spec'] or {}
req(spec.get('policy')=='algorithm-then-security-presentation-order', 'v214 order policy missing')
req(spec.get('sourceAudit')=='v213-final_question_order_fidelity', 'v214 source audit link drift')
req(spec.get('selectedSetChanged') is False and spec.get('orderOnly') is True, 'v214 repair boundary drift')
req(spec.get('algorithmBlock')==16 and spec.get('securityBlock')==4, 'v214 block counts drift')

# Source-level positional integrity. These are the production paths that bind save/restore,
# navigation and review data to the same bFinalItems index.
source_contracts={
  'resume_payload':'items:bFinalItems,answers:bFinalAnswers,flags:[...bFinalFlags],index:bFinalIndex',
  'resume_items':'bFinalItems=s.items;',
  'resume_answers':'bFinalAnswers=s.answers;',
  'resume_flags':'bFinalFlags=new Set(s.flags||[]);',
  'resume_index':'bFinalIndex=Math.max(0,Math.min(19,Number(s.index)||0));',
  'nav_answers':"bFinalAnswers[i]!==null?'answered':''",
  'nav_flags':"bFinalFlags.has(i)?'flagged':''",
  'nav_index':'data-bfq=\\"${i}\\"',
  'details_map':'const details=bFinalItems.map((item,i)=>{',
  'details_answer':'const ans=bFinalAnswers[i],ok=ans===item.a;',
  'review_map':'a.details.map((d,i)=>',
  'review_q':'Q${i+1}',
}
missing=[name for name,token in source_contracts.items() if token not in candidate_html]
req(not missing, 'boundary positional source contract missing: '+repr(missing))
for name,token in source_contracts.items():
    req(token in parent_html, 'parent missing positional source contract '+name)

p=candidate['probe']
matched=p['matched']; adaptive=p['adaptive']; rt=p['roundTrip']
req(matched['selectedSetMismatch']==0, 'matched selected-set drift')
req(matched['partitionMismatch']==0, 'stable-partition drift')
req(matched['boundaryFailure']==0 and matched['contractFailure']==0, 'matched boundary/contract failure')
req(adaptive['boundaryFailure']==0 and adaptive['contractFailure']==0 and adaptive['minHigh']>=4, 'adaptive boundary/contract failure')
req(rt['itemIdsPreserved'] is True, 'resume round-trip item order drift')
req(rt['q16']['kind']=='algo' and rt['q17']['kind']=='security', 'round-trip Q16/Q17 type drift')
req(rt['q16']['answer']==3 and rt['q17']['answer']==0 and rt['q16']['flagged'] and rt['q17']['flagged'], 'round-trip answer/flag alignment drift')
req(rt['reviewQ16']['sourceId']==rt['q16']['sourceId'] and rt['reviewQ16']['answer']==rt['q16']['answer'] and rt['reviewQ16']['q']==16, 'review Q16 alignment drift')
req(rt['reviewQ17']['sourceId']==rt['q17']['sourceId'] and rt['reviewQ17']['answer']==rt['q17']['answer'] and rt['reviewQ17']['q']==17, 'review Q17 alignment drift')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files), 'candidate/reference six-file mismatch')

fixture={
  'name':f'subject-b-final-boundary-integrity-{version}',
  'version':version,
  'previous_version':previous,
  'parent_main_sha':parent,
  'learner_facing_change':False,
  'scope':'post-v214 Q16-to-Q17 resume/navigation/review index integrity',
  'runtime_preservation':{
    'final_counts':candidate['finalCounts'],'algorithm_pool':candidate['pool'],'high_trace_count':len(candidate['high']),
    'high_trace_floor':candidate['floor'],'semantic_validator_ok':True,'v214_spec_unchanged':True
  },
  'source_positional_contracts':{k:True for k in source_contracts},
  'probes':p,
  'candidate_reference_six_file_equal':True,
  'findings':{'high':[],'medium':[],'low':[]},
  'status':'passed'
}
Path(f'_regression/subject-b-final-boundary-integrity-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

Path(f'audits/SUBJECT_B_FINAL_BOUNDARY_INTEGRITY_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice Boundary Integrity Audit
========================================================================

Result
------
PASS
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Scope
-----
Post-repair audit of the Q16 algorithm -> Q17 security boundary introduced by v214. This release changes no learner-facing code. It checks that presentation order remains correct and that positional state survives save/resume, navigator use and result review without an off-by-one or source-ID mismatch.

Selection and order regression
------------------------------
Matched seed/history pairs: {matched['sessions']}.
Selected-set mismatches versus the pre-v214 selector: {matched['selectedSetMismatch']}.
Stable-partition mismatches: {matched['partitionMismatch']}.
Q16/Q17 boundary failures: {matched['boundaryFailure']}.
Structural/quota failures: {matched['contractFailure']}.

Adaptive-history stress
-----------------------
Sessions with seen-count updates: {adaptive['sessions']}.
Q16/Q17 boundary failures: {adaptive['boundaryFailure']}.
Structural/quota failures: {adaptive['contractFailure']}.
High-trace count: min {adaptive['minHigh']} / max {adaptive['maxHigh']} (floor remains 4).

Resume boundary alignment
-------------------------
The production save payload stores items, answers, flags and current index together. Restore reuses the saved items and answers arrays, reconstructs the flag Set, and clamps the saved index to 0..19.
Synthetic serialized round-trip at the boundary preserved item order: yes.
Q16 after round-trip: algorithm / source {rt['q16']['sourceId']} / answer-index {rt['q16']['answer']} / flagged yes.
Q17 after round-trip: security / source {rt['q17']['sourceId']} / answer-index {rt['q17']['answer']} / flagged yes.

Navigation and review alignment
-------------------------------
The production navigator derives button number, answered state, flag state and jump index from the same array index i.
finishBFinal derives each review detail from bFinalItems[i] and bFinalAnswers[i]. renderBFinalResult labels those details Q(i+1).
Synthetic boundary review mapping preserved Q16 and Q17 source IDs and answers: yes.
No off-by-one or Q16/Q17 cross-assignment was detected.

Preserved contracts
-------------------
100 minutes / 20 questions; 16 algorithm + 4 security; algorithm 標準8 / 応用8; ten domains; unique algorithm IDs.
43-item final algorithm pool; 15 high-trace items; sustained-trace floor 4.
Security 2 log + 2 non-log.
Subject B semantic validation: OK.
Candidate/reference generated six files byte-identical: yes.

Findings
--------
High: 0
Medium: 0
Low: 0

Decision
--------
The v214 order repair is stable across the Q16->Q17 boundary. Accept the repair without further Subject B order changes. The next release should not modify this path by default; move to another learner-value audit unless a real-use defect appears.
''')
print(f'FEQUEST_SUBJECT_B_FINAL_BOUNDARY_AUDIT version={version} matched={matched["sessions"]} adaptive={adaptive["sessions"]} status=passed')
