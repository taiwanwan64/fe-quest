from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-remediation-difficulty-post-repair-audit-(v(\d+))', branch)
    req(m, 'bad Subject B remediation difficulty post-repair audit branch')
    return m.group(1), f'v{int(m.group(2)) - 1}'


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function tx(v){return String(v??'').trim();}
function rank(v){return ({'基礎':1,'標準':2,'応用':3})[tx(v)]||0;}
function domainFamily(domain){
  if(domain==='二次元配列')return '二次元配列';
  if(domain==='木構造')return '木構造';
  if(domain==='リスト')return 'リスト';
  if(domain==='一次元配列')return '配列';
  if(domain==='制御')return 'ループ';
  if(domain==='探索・整列')return null;
  if(domain==='スタック・キュー')return null;
  if(domain==='再帰・関数')return '再帰';
  if(domain==='オブジェクト指向')return 'オブジェクト';
  if(domain==='ビット列')return 'ビット列';
  return null;
}
function candidatesFor(domain){
  const f=domainFamily(domain);
  if(!f)return [];
  return B_EXERCISES.filter(x=>tx(x.concept).startsWith(f)).map(x=>({id:x.id,level:tx(x.level),concept:tx(x.concept)}));
}
function routeAudit(){
  const trace=Object.fromEntries(B_EXERCISES.map(x=>[x.id,x]));
  const source=Object.fromEntries(B_EXAM_ALGO_ITEMS.map(x=>[x.id,x]));
  const rows=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam).map(x=>{
    const s=source[x.sourceId],t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain),e=trace[t?.id];
    const fl=tx(s?.level),tl=tx(e?.level),candidates=candidatesFor(tx(s?.domain));
    return {id:x.sourceId,title:tx(s?.title),domain:tx(s?.domain),finalLevel:fl,targetMode:t?.mode||null,targetId:t?.id||null,targetLevel:tl,targetConcept:tx(e?.concept),delta:rank(fl)-rank(tl),sameOrEasier:candidates.filter(c=>rank(c.level)<=rank(fl))};
  });
  const invalid=rows.filter(x=>x.targetMode!=='trace'||!x.targetId||!x.targetLevel);
  const harder=rows.filter(x=>!invalid.includes(x)&&x.delta<0);
  const avoidable=harder.filter(x=>x.sameOrEasier.length>0);
  return {rows,invalid,harder,avoidable};
}
function finalSig(n){let h=2166136261>>>0;const mixes=[];for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x250000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));const m={標準:0,応用:0,security:0,other:0};for(const x of rows){if(x.kind==='security')m.security++;else if(x.level in m)m[x.level]++;else m.other++;}mixes.push(m);}return {signature:h>>>0,mixes};}
function minmax(mixes,key){const xs=mixes.map(x=>x[key]);return {min:Math.min(...xs),max:Math.max(...xs)};}
const a=routeAudit(), f=finalSig(2000);
console.log('__V250__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  spec:globalThis.SUBJECT_B_REMEDIATION_DIFFICULTY_V249_SPEC||null,
  audit:a,
  final:{signature:f.signature,mix:{standard:minmax(f.mixes,'標準'),advanced:minmax(f.mixes,'応用'),security:minmax(f.mixes,'security'),other:minmax(f.mixes,'other')}},
  banks:{questions:hashJson(QUESTION_BANK),trace:hashJson(B_EXERCISES),compound:hashJson(B_COMPOUND_SETS),security:hashJson(SECURITY_SCENARIOS),finalAlgorithm:hashJson(B_EXAM_ALGO_ITEMS)},
  contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],
  sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'runtime.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-7000:])
        m = re.search(r'__V250__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req((version, previous) == ('v250', 'v249'), 'v250 audit expects v249 parent')
source = Path('audits/SUBJECT_B_REMEDIATION_DIFFICULTY_REPAIR_v249.txt')
req(source.exists(), 'v249 repair evidence missing')
st = source.read_text()
req('PASS — NO FINDINGS' in st and 'bexam_mat_01' in st and 'bexam_mat_02' in st and 'matrix_sum（標準）' in st, 'v249 repair evidence drift')

expected = {
    '.github/subject-b-remediation-difficulty-post-repair-audit/validate_audit.py',
    '.github/workflows/subject-b-remediation-difficulty-post-repair-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v250 audit-only source drift: ' + repr(sorted(changed ^ expected)))

cand, par = runtime('_site/index.html'), runtime('_site_parent/index.html')
req(cand['v'] == 'v250' and par['v'] == 'v249', 'runtime versions')
req(cand['banks'] == par['banks'], 'audit-only bank drift')
req(cand['audit'] == par['audit'], 'audit-only remediation topology drift')
req(cand['final'] == par['final'], 'audit-only final behavior drift')
req(cand['contracts'] == par['contracts'] == [20, 16, 4, 6000, 43, 15, 4], 'final contract drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic diagnostics failed')
spec = cand.get('spec') or {}
req(spec.get('sourceFinding') == 'subject_b_remediation_target_harder_than_final_label', 'v249 repair spec missing')

rows = cand['audit']['rows']
by_id = {x['id']: x for x in rows}
req(len(rows) == 43 and not cand['audit']['invalid'], 'final→TRACE route validity drift')
for qid in ('bexam_mat_01', 'bexam_mat_02'):
    x = by_id[qid]
    req(x['finalLevel'] == '標準' and x['targetId'] == 'matrix_sum' and x['targetLevel'] == '標準', 'matrix repair regression: ' + qid)

harder = cand['audit']['harder']
expected_exceptions = {'bexam_tree_01', 'bexam_tree_05', 'bexam_list_02', 'bexam_list_03'}
req({x['id'] for x in harder} == expected_exceptions, 'remaining harder-label exception set drift')
req(not cand['audit']['avoidable'], 'a harder-labeled recovery route still bypasses an available same-domain same/easier TRACE target')
for x in harder:
    req(not x['sameOrEasier'], 'remaining exception has same/easier same-domain target: ' + x['id'])

mix = cand['final']['mix']
req(mix == {'standard': {'min': 8, 'max': 8}, 'advanced': {'min': 8, 'max': 8}, 'security': {'min': 4, 'max': 4}, 'other': {'min': 0, 'max': 0}}, 'final label mix drift')

fixture = {
    'version': version,
    'previous': previous,
    'parent': parent,
    'result': 'PASS — NO FINDINGS',
    'routeCount': len(rows),
    'invalidRoutes': len(cand['audit']['invalid']),
    'avoidableHarderRoutes': len(cand['audit']['avoidable']),
    'documentedCrossLayerExceptions': sorted(expected_exceptions),
    'matrixRepairsConfirmed': ['bexam_mat_01', 'bexam_mat_02'],
    'finalMix2000': mix,
    'bankHashes': cand['banks'],
    'finalSignature2000': cand['final']['signature'],
    'contracts': cand['contracts'],
    'semanticOK': True,
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-remediation-difficulty-post-repair-audit-v250.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')

audit = f'''FE QUEST v250 — Subject B Remediation Difficulty Post-Repair Audit
===================================================================

Result
------
PASS — NO FINDINGS
Previous release: v249
Source main: {parent}
Learner-facing change in v250: none

Purpose
-------
v249 repaired the actionable part of the v247 difficulty/practice-calibration finding. v250 verifies all 43 final algorithm recovery routes after that repair and distinguishes genuinely avoidable harder-label routes from cross-layer label differences for which no same-domain same-or-easier TRACE exercise exists.

Post-repair route evidence
--------------------------
Final algorithm recovery routes checked: {len(rows)}
Invalid TRACE routes: {len(cand['audit']['invalid'])}
Harder-labeled TRACE routes remaining: {len(harder)}
Avoidable harder-labeled routes with a same-domain same/easier TRACE alternative: {len(cand['audit']['avoidable'])}
Confirmed matrix repairs: bexam_mat_01 -> matrix_sum（標準）, bexam_mat_02 -> matrix_sum（標準）
Documented unavoidable cross-layer exceptions: {', '.join(sorted(expected_exceptions))}

Why the four exceptions remain
------------------------------
The two tree items route to tree_dfs（応用） and the two list items route to linked_list（応用）. In the current TRACE inventory those are the only same-domain exercises for their domains. Rerouting them to a different domain or changing labels solely to remove an audit count would reduce semantic fidelity.

Final-session regression
------------------------
2000 deterministic final sessions: 標準 8 / 応用 8 / security 4 in every session; other/unknown 0.
Question / TRACE / compound / security / final-algorithm banks: unchanged from v249.
Final-session selection/order/options signature: unchanged from v249.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.

Decision
--------
Close the static difficulty-label / practice-calibration repair sequence. The remaining four rows are documented cross-layer exceptions, not actionable route defects under the current authored inventory. The next evidence step should use learner-local performance rather than more static relabeling: capture and summarize accuracy and response time by practice layer/difficulty, then use those observations for adaptive recommendations without changing the published 基礎 / 標準 / 応用 labels prematurely.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_REMEDIATION_DIFFICULTY_POST_REPAIR_AUDIT_v250.txt').write_text(audit)
print(audit)
