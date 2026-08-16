from pathlib import Path
import hashlib, json, re, subprocess, tempfile
from v169_runtime_stub import STUB

def req(v,m):
    if not v: raise AssertionError(m)
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()

PLAN=Path('_regression/production-equivalence-plan-v169.fixture.json')
RESULT=Path('_regression/production-equivalence-results-v169.fixture.json')
AUDIT=Path('audits/EQUIVALENCE_PREFLIGHT_AUDIT_v169.txt')
plan=json.loads(PLAN.read_text())
html=Path('_site/index.html').read_text()

def extract_js(h):
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
    return '\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))

SNAPSHOT_JS=r'''
const __feqCrypto=require('crypto');
function __feqCanon(v){
  if(v===null||typeof v!=='object') return v;
  if(Array.isArray(v)) return v.map(__feqCanon);
  const o={};
  for(const k of Object.keys(v).sort()){
    const x=v[k];
    if(typeof x==='function'||typeof x==='undefined') continue;
    o[k]=__feqCanon(x);
  }
  return o;
}
const __feqSelf=globalThis.FEQUEST_SELF_CHECK;
if(!__feqSelf||!__feqSelf.ok) throw new Error('snapshot self-check not ok');
const __feqPayload={
  appVersion:APP_VERSION,
  questionBank:__feqCanon(QUESTION_BANK),
  selfCheck:__feqCanon(__feqSelf),
  diagnosticContractData:__feqCanon(globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA),
  diagnosticDataProvenance:__feqCanon(globalThis.FEQ_DIAGNOSTIC_DATA_PROVENANCE),
  globalSurface:Object.keys(globalThis).filter(k=>/^(?:feq|runV)/.test(k)).sort(),
  answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),
  cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length)
};
const __feqRaw=JSON.stringify(__feqCanon(__feqPayload));
console.log('__FEQ_SNAPSHOT__ '+__feqCrypto.createHash('sha256').update(__feqRaw).digest('hex')+' '+Buffer.byteLength(__feqRaw,'utf8'));
'''

def run_html(label,h):
    js=extract_js(h)
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'variant.js'
        p.write_text(STUB+'\n'+js+'\n'+SNAPSHOT_JS)
        syntax=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
        if syntax.returncode!=0:
            err=(syntax.stderr or syntax.stdout or '')[-3000:]
            return {'label':label,'syntax_ok':False,'runtime_ok':False,'snapshot_sha256':None,'snapshot_utf8_bytes':None,
                    'error_kind':'syntax-error','error_sha256':sha_text(err),'error_tail':err}
        run=subprocess.run(['node',str(p)],capture_output=True,text=True)
        if run.returncode!=0:
            err=(run.stderr or run.stdout or '')[-3000:]
            return {'label':label,'syntax_ok':True,'runtime_ok':False,'snapshot_sha256':None,'snapshot_utf8_bytes':None,
                    'error_kind':'runtime-error','error_sha256':sha_text(err),'error_tail':err}
        m=re.search(r'__FEQ_SNAPSHOT__\s+([0-9a-f]{64})\s+(\d+)',run.stdout)
        req(m is not None,f'snapshot marker missing: {label}')
        return {'label':label,'syntax_ok':True,'runtime_ok':True,'snapshot_sha256':m.group(1),
                'snapshot_utf8_bytes':int(m.group(2)),'error_kind':None,'error_sha256':None,'error_tail':''}

baseline=run_html('baseline',html)
req(baseline['runtime_ok'],'baseline runtime failed')
rows=[]
for variant in plan['variants']:
    vh=html
    removed=[]
    for pstr in variant['removed_paths']:
        text=Path(pstr).read_text()
        count=vh.count(text)
        req(count==1,f'generated block cardinality {pstr}: {count}')
        vh=vh.replace(text,'',1)
        removed.append({'path':pstr,'utf8_bytes':len(text.encode()),'sha256':sha_text(text)})
    r=run_html(variant['id'],vh)
    r.update({'id':variant['id'],'family':variant['family'],'basis':variant['basis'],
              'removed_paths':removed,
              'equivalent_to_baseline':bool(r['runtime_ok'] and r['snapshot_sha256']==baseline['snapshot_sha256']),
              'baseline_snapshot_sha256':baseline['snapshot_sha256']})
    rows.append(r)

equiv_rows=[r for r in rows if r['equivalent_to_baseline']]
non_rows=[r for r in rows if not r['equivalent_to_baseline']]
runtime_errors=[r for r in rows if not r['runtime_ok']]
single=[r for r in rows if r['id'].startswith('single-')]
groups=[r for r in rows if r['id'].startswith('group-')]
v132_group=next(r for r in groups if r['id']=='group-v132-leaf-00-06')
quality_group=next(r for r in groups if r['id']=='group-quality-write-chain')

result={
 'name':'production-equivalence-results-v169',
 'version':'v169',
 'scope':'v132-v144-consolidation-preflight',
 'policy':'measured-counterfactual-runtime-snapshot-no-production-removal',
 'plan':{'path':str(PLAN),'utf8_bytes':PLAN.stat().st_size,'sha256':hashlib.sha256(PLAN.read_bytes()).hexdigest()},
 'baseline':baseline,
 'summary':{
   'single_candidate_count':len(single),
   'variant_count':len(rows),
   'equivalent_variants':len(equiv_rows),
   'non_equivalent_variants':len(non_rows),
   'runtime_error_variants':len(runtime_errors),
   'v132_leaf_group_equivalent':v132_group['equivalent_to_baseline'],
   'quality_write_group_equivalent':quality_group['equivalent_to_baseline'],
   'automatic_removal_authorized':False
 },
 'variants':rows,
 'decision':{
   'v132_leaf_group':'eligible-for-controlled-removal-experiment' if v132_group['equivalent_to_baseline'] else 'retain-pending-further-analysis',
   'quality_write_chain':'retain-current-production-blocks' if not quality_group['equivalent_to_baseline'] else 'eligible-for-controlled-removal-experiment',
   'automatic_removal_authorized':False,
   'reason':'v169 measures startup/runtime-state equivalence only; production source removal requires a separate controlled release'
 }
}
RESULT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')

lines=[
 'FE QUEST v169 — Counterfactual Runtime Equivalence Preflight',
 '============================================================',
 '',
 'Scope',
 '-----',
 'v169 does not remove or rewrite any v132-v144 learning patch. It executes generated production HTML as a baseline, then removes candidate block text only in temporary counterfactual copies and compares canonical runtime snapshots.',
 '',
 'Snapshot components',
 '-------------------',
 '- canonical full QUESTION_BANK',
 '- FEQUEST_SELF_CHECK',
 '- FEQ_DIAGNOSTIC_CONTRACT_DATA',
 '- FEQ_DIAGNOSTIC_DATA_PROVENANCE',
 '- selected feq/runV global surface',
 '- answer and cognitive-level distributions',
 '',
 'Results',
 '-------',
 f"Baseline snapshot SHA-256: {baseline['snapshot_sha256']}",
 f"Baseline snapshot UTF-8 bytes: {baseline['snapshot_utf8_bytes']}",
 f"Single candidates: {len(single)}",
 f"Total variants including two joint groups: {len(rows)}",
 f"Equivalent variants: {len(equiv_rows)}",
 f"Non-equivalent variants: {len(non_rows)}",
 f"Runtime-error variants: {len(runtime_errors)}",
 f"v132 leaf joint group equivalent: {str(v132_group['equivalent_to_baseline']).lower()}",
 f"quality write-chain joint group equivalent: {str(quality_group['equivalent_to_baseline']).lower()}",
 '',
 'Variant detail',
 '--------------',
]
for r in rows:
    status='EQUIVALENT' if r['equivalent_to_baseline'] else ('RUNTIME_ERROR' if not r['runtime_ok'] else 'DIFFERENT_SNAPSHOT')
    lines.append(f"- {r['id']}: {status}")
lines += [
 '',
 'Decision policy',
 '---------------',
 f"v132 leaf group: {result['decision']['v132_leaf_group']}",
 f"quality write chain: {result['decision']['quality_write_chain']}",
 'Automatic production removal authorized: false',
 '',
 'This is a runtime snapshot equivalence preflight, not a proof that hidden future behavior can never depend on a removed lexical declaration. Any source deletion must occur in a later release with the same full regression suite plus an exact source-diff allowlist.',
 ''
]
AUDIT.write_text('\n'.join(lines))
print('FEQUEST_V169_EQUIVALENCE_OK '
      f"single={len(single)} variants={len(rows)} equivalent={len(equiv_rows)} non-equivalent={len(non_rows)} "
      f"runtime-errors={len(runtime_errors)} v132-group={int(v132_group['equivalent_to_baseline'])} quality-group={int(quality_group['equivalent_to_baseline'])} automatic-removal=0")
