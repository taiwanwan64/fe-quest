from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(v, m):
    if not v:
        raise AssertionError(m)


def context():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'], text=True).strip()
    m = re.fullmatch(r'subject-b-final-rotation-audit-(v(\d+))', branch)
    req(m, 'bad Subject B final rotation audit branch')
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
function __initStats(highSeen){
  profile.bFinalStats={};
  const high=new Set(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]);
  B_EXAM_ALGO_ITEMS.forEach(q=>{profile.bFinalStats[`algo:${q.id}`]={seen:highSeen&&high.has(q.id)?80:0,correct:0,lastSeen:null};});
  SECURITY_SCENARIOS.forEach(s=>{profile.bFinalStats[`sec:${s.id}`]={seen:0,correct:0,lastSeen:null};});
}
function __runScenario(n,mode,seed){
  Math.random=__seeded(seed);
  __initStats(mode==='adversarial');
  const high=new Set(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]);
  const added=[...(globalThis.SUBJECT_B_FINAL_POOL_V211_IDS||[])];
  const counts=Object.fromEntries(B_EXAM_ALGO_ITEMS.map(q=>[q.id,0]));
  const formats={};
  let minHigh=999,maxHigh=0,totalHigh=0,badContract=0,badSecurity=0;
  for(let i=0;i<n;i++){
    const items=buildBFinal();
    const algo=items.filter(x=>x.kind==='algo'),sec=items.filter(x=>x.kind==='security');
    const levels=algo.reduce((m,x)=>{m[x.level]=(m[x.level]||0)+1;return m;},{});
    const hc=algo.filter(x=>high.has(x.sourceId)).length;
    minHigh=Math.min(minHigh,hc);maxHigh=Math.max(maxHigh,hc);totalHigh+=hc;
    if(items.length!==20||algo.length!==16||sec.length!==4||levels['標準']!==8||levels['応用']!==8||new Set(algo.map(x=>x.domain)).size!==10||new Set(algo.map(x=>x.sourceId)).size!==16)badContract++;
    if(sec.filter(x=>!!x.log).length!==2||sec.filter(x=>!x.log).length!==2)badSecurity++;
    algo.forEach(x=>{counts[x.sourceId]++;formats[x.format]=(formats[x.format]||0)+1;});
    if(mode==='adaptive'){
      algo.forEach(x=>{const k=`algo:${x.sourceId}`;profile.bFinalStats[k].seen++;profile.bFinalStats[k].lastSeen=`session-${i}`;});
    }
  }
  const peerRows=added.map(id=>{
    const q=B_EXAM_ALGO_ITEMS.find(x=>x.id===id);
    const others=B_EXAM_ALGO_ITEMS.filter(x=>x.domain===q.domain&&x.level===q.level&&x.id!==id).map(x=>x.id);
    const avgOthers=others.length?others.reduce((s,k)=>s+counts[k],0)/others.length:0;
    return {id,domain:q.domain,level:q.level,count:counts[id],peerIds:others,peerCounts:others.map(k=>counts[k]),ratioToPeerAverage:avgOthers?Math.round((counts[id]/avgOthers)*1000)/1000:null};
  });
  const highCounts=[...high].map(id=>counts[id]).filter(x=>Number.isFinite(x));
  return {sessions:n,minHigh,maxHigh,avgHigh:Math.round(totalHigh/n*1000)/1000,badContract,badSecurity,counts,formats,peerRows,highExposure:{min:Math.min(...highCounts),max:Math.max(...highCounts)},addedSelected:added.every(id=>counts[id]>0)};
}
let probe=null;
if(%PROBE%){
  probe={
    staticEqual:__runScenario(2000,'static',0x212001),
    adaptive:__runScenario(4000,'adaptive',0x212002),
    adversarial:__runScenario(1200,'adversarial',0x212003)
  };
}
console.log('__ROT__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  pool:B_EXAM_ALGO_ITEMS,
  contracts:B_EXAM_ALGO_CONTRACTS,
  finalCounts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],
  domains:B_FINAL_ALGO_DOMAINS,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],
  floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  added:[...(globalThis.SUBJECT_B_FINAL_POOL_V211_IDS||[])],
  spec:globalThis.SUBJECT_B_FINAL_V211_SPEC||null,
  sem:validateSubjectBSemantics(),
  probe
})).toString('base64'));
'''.replace('%PROBE%', 'true' if probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / 'runtime.js'
        f.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(f)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime dump failed: ' + z.stderr[-4000:])
        m = re.search(r'__ROT__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime dump marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = context()
parent = subprocess.check_output(['git','rev-parse','origin/main'], text=True).strip()
req(previous == 'v211', 'v212 audit expects v211 parent')
source_fixture = json.loads(Path('_regression/subject-b-final-pool-density-v211.fixture.json').read_text())
req(source_fixture.get('status') == 'passed' and source_fixture.get('algorithm_pool',{}).get('candidate') == 43, 'v211 source fixture')

candidate = dump('_site/index.html', probe=True)
parent_rt = dump('_site_parent/index.html', probe=False)
req(candidate['v'] == version and parent_rt['v'] == previous, 'runtime versions')
req(candidate['pool'] == parent_rt['pool'], 'algorithm pool changed during audit-only release')
req(candidate['contracts'] == parent_rt['contracts'], 'algorithm contracts changed during audit-only release')
req(candidate['finalCounts'] == parent_rt['finalCounts'] == [20,16,4], 'final counts drift')
req(candidate['high'] == parent_rt['high'] and len(candidate['high']) == 15, 'high-trace inventory drift')
req(candidate['floor'] == parent_rt['floor'] == 4, 'high-trace floor drift')
req(candidate['added'] == ['bexam_obj_04','bexam_bit_05','bexam_tree_05'], 'v211 added ids drift')
req(candidate['sem'].get('ok') is True, 'Subject B semantic validation failed: ' + repr(candidate['sem'].get('errors')))

items = {q['id']:q for q in candidate['pool']}
for qid in candidate['added']:
    q = items[qid]
    req(len(q.get('options',[])) == 4 and len(set(q['options'])) == 4, qid + ' option quality')
    req(0 <= q.get('a',-1) <= 3 and q.get('explain') and len(q.get('code',[])) >= 6, qid + ' content completeness')
req(len({items[x]['title'] for x in candidate['added']}) == 3, 'new title duplication')

p = candidate['probe']
for name in ['staticEqual','adaptive','adversarial']:
    s = p[name]
    req(s['badContract'] == 0 and s['badSecurity'] == 0, name + ' final contract failure')
    req(s['minHigh'] >= 4 and s['addedSelected'], name + ' trace floor/starvation')

adaptive_rows = p['adaptive']['peerRows']
max_dev = max(abs((r['ratioToPeerAverage'] or 1)-1) for r in adaptive_rows)
if max_dev > 0.50:
    severity='Medium'; finding='new_item_rotation_concentration'
elif max_dev > 0.30:
    severity='Low'; finding='new_item_rotation_watch'
else:
    severity='None'; finding=None

fixture = {
  'name':f'subject-b-final-post-expansion-rotation-{version}',
  'version':version,
  'previous_version':previous,
  'parent_main_sha':parent,
  'learner_facing_change':False,
  'pool_unchanged_from_v211':True,
  'algorithm_pool_count':43,
  'high_trace_count':15,
  'high_trace_floor':4,
  'added_ids':candidate['added'],
  'new_item_quality':{
    'complete_four_option_items':True,
    'semantic_contracts_ok':True,
    'qualitative_overlap_review':{
      'bexam_obj_04':'extends shared-reference concept from one mutation to three dependent mutations and a third alias',
      'bexam_bit_05':'extends bit operations into a four-stage dependent AND/shift/XOR/OR chain',
      'bexam_tree_05':'shares BFS theme with an applied item but adds simultaneous cumulative-value and queue-state tracking at standard difficulty'
    }
  },
  'probes':p,
  'adaptive_peer_max_absolute_ratio_deviation':round(max_dev,3),
  'finding':{'severity':severity,'id':finding},
  'subject_b_semantic_validator_ok':True,
  'status':'passed'
}
Path(f'_regression/subject-b-final-post-expansion-rotation-{version}.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2)+'\n')

rows='\n'.join(f"  {r['id']}: {r['count']} selections; same-cell peers {r['peerCounts']}; ratio {r['ratioToPeerAverage']}" for r in adaptive_rows)
result = 'PASS' if severity == 'None' else f'PASS WITH {severity.upper()} WATCH'
finding_text = 'No new rotation finding.' if not finding else f'{severity.upper()} — {finding}: adaptive same-domain/same-level exposure differs materially from peer average; keep the pool stable and audit before more growth.'
Path(f'audits/SUBJECT_B_FINAL_POST_EXPANSION_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice Post-Expansion Audit
===================================================================

Result
------
{result}
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Scope
-----
Audit the 43-item final algorithm pool after the v211 three-item expansion. No question, selector, saved-state ID, final-session quota or sustained-trace floor is changed in this release.

Runtime preservation
--------------------
Algorithm pool: 43 / unchanged from v211.
High-trace inventory: 15 / unchanged.
Sustained-trace floor: 4 / unchanged.
Final practice: 20 = 16 algorithm + 4 security; algorithm 標準8 / 応用8; ten domains; unique algorithm IDs; security 2 log + 2 non-log.
Subject B semantic validation: OK.

New-item quality review
-----------------------
bexam_obj_04: the shared-reference concept overlaps bexam_obj_01, but increases the trace from one mutation to three dependent mutations and introduces a third alias. This is a meaningful density increase rather than a duplicate question.
bexam_bit_05: combines four dependent operations (AND, logical shift, XOR, OR); it is materially denser than the existing isolated/short bit-operation items.
bexam_tree_05: intentionally reuses breadth-first traversal, but asks for both accumulated value and queue state at an intermediate point. It remains simpler than the applied BFS item and is appropriate as a standard sustained-trace variant.

Deterministic rotation probes
-----------------------------
Static equal-history: {p['staticEqual']['sessions']} sessions; high-trace min {p['staticEqual']['minHigh']} / max {p['staticEqual']['maxHigh']} / avg {p['staticEqual']['avgHigh']}; structural failures {p['staticEqual']['badContract']}; security failures {p['staticEqual']['badSecurity']}.
Adaptive history with seen-count increments: {p['adaptive']['sessions']} sessions; high-trace min {p['adaptive']['minHigh']} / max {p['adaptive']['maxHigh']} / avg {p['adaptive']['avgHigh']}; structural failures {p['adaptive']['badContract']}; security failures {p['adaptive']['badSecurity']}.
Adversarial high-trace-seen: {p['adversarial']['sessions']} sessions; high-trace min {p['adversarial']['minHigh']} / max {p['adversarial']['maxHigh']} / avg {p['adversarial']['avgHigh']}; structural failures {p['adversarial']['badContract']}; security failures {p['adversarial']['badSecurity']}.
All three v211 additions were selected in every probe family: yes.

Adaptive same-cell exposure for the new items
---------------------------------------------
{rows}
Maximum absolute ratio deviation from same-domain/same-level peer average: {round(max_dev,3)}.

Finding
-------
{finding_text}

Decision
--------
The v211 expansion is accepted unless the watch above is present. Do not add more Subject B final-algorithm items in v213 by default. If no watch is present, the next useful audit should move from pool quantity to whole-session learner experience: time pressure, question-order transitions and review usefulness. If a rotation watch is present, v213 should address exposure balance before further content growth.
''')
print(f'FEQUEST_SUBJECT_B_FINAL_POST_EXPANSION_AUDIT version={version} severity={severity} maxdev={max_dev:.3f}')
