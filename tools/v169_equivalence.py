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
if(!__feqSelf) throw new Error('snapshot self-check missing');
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
console.log('__FEQ_SNAPSHOT__ '+__feqCrypto.createHash('sha256').update(__feqRaw).digest('hex')+' '+Buffer.byteLength(__feqRaw,'utf8')+' '+(__feqSelf.ok?'1':'0'));
'''

def run_html(label,h):
    js=extract_js(h)
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'variant.js'
        p.write_text(STUB+'\n'+js+'\n'+SNAPSHOT_JS)
        syntax=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
        if syntax.returncode!=0:
            err=(syntax.stderr or syntax.stdout or '')[-1800:]
            return {'label':label,'syntax_ok':False,'runtime_ok':False,'self_check_ok':None,
                    'snapshot_sha256':None,'snapshot_utf8_bytes':None,
                    'error_kind':'syntax-error','error_sha256':sha_text(err),'error_tail':err}
        run=subprocess.run(['node',str(p)],capture_output=True,text=True)
        if run.returncode!=0:
            err=(run.stderr or run.stdout or '')[-1800:]
            return {'label':label,'syntax_ok':True,'runtime_ok':False,'self_check_ok':None,
                    'snapshot_sha256':None,'snapshot_utf8_bytes':None,
                    'error_kind':'runtime-error','error_sha256':sha_text(err),'error_tail':err}
        m=re.search(r'__FEQ_SNAPSHOT__\s+([0-9a-f]{64})\s+(\d+)\s+([01])',run.stdout)
        req(m is not None,f'snapshot marker missing: {label}')
        return {'label':label,'syntax_ok':True,'runtime_ok':True,'self_check_ok':m.group(3)=='1',
                'snapshot_sha256':m.group(1),'snapshot_utf8_bytes':int(m.group(2)),
                'error_kind':None,'error_sha256':None,'error_tail':''}

baseline=run_html('baseline',html)
req(baseline['runtime_ok'] and baseline['self_check_ok'],'baseline runtime/self-check failed')
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
    r.update({'id':variant['id'],'kind':variant['kind'],'family':variant['family'],'basis':variant['basis'],
              'removed_paths':removed,
              'equivalent_to_baseline':bool(r['runtime_ok'] and r['snapshot_sha256']==baseline['snapshot_sha256']),
              'baseline_snapshot_sha256':baseline['snapshot_sha256']})
    rows.append(r)

controls=[r for r in rows if r['kind']=='physical-fragment-control']
semantic=[r for r in rows if r['kind']=='semantic-candidate']
sem_equiv=[r for r in semantic if r['equivalent_to_baseline']]
sem_non=[r for r in semantic if not r['equivalent_to_baseline']]
sem_runtime_errors=[r for r in semantic if not r['runtime_ok']]
fragment_syntax=[r for r in controls if not r['syntax_ok']]
v132=next(r for r in semantic if r['id']=='unit-v132-style-cue-pass')
quality_group=next(r for r in semantic if r['id']=='group-quality-write-chain')

result={
 'name':'production-equivalence-results-v169',
 'version':'v169',
 'scope':'v132-v144-consolidation-preflight-syntactic-unit-aware',
 'policy':'measured-syntactic-unit-counterfactual-runtime-snapshot-no-production-removal',
 'plan':{'path':str(PLAN),'utf8_bytes':PLAN.stat().st_size,'sha256':hashlib.sha256(PLAN.read_bytes()).hexdigest()},
 'baseline':baseline,
 'summary':{
   'fragment_control_count':len(controls),
   'fragment_syntax_failures':len(fragment_syntax),
   'semantic_candidate_variants':len(semantic),
   'semantic_equivalent_variants':len(sem_equiv),
   'semantic_non_equivalent_variants':len(sem_non),
   'semantic_runtime_error_variants':len(sem_runtime_errors),
   'v132_style_cue_unit_equivalent':v132['equivalent_to_baseline'],
   'quality_write_group_equivalent':quality_group['equivalent_to_baseline'],
   'automatic_removal_authorized':False
 },
 'variants':rows,
 'decision':{
   'v132_style_cue_unit':'eligible-for-controlled-removal-experiment' if v132['equivalent_to_baseline'] else 'retain-active-syntactic-unit',
   'quality_write_chain':'eligible-for-controlled-removal-experiment' if quality_group['equivalent_to_baseline'] else 'retain-current-production-blocks',
   'physical_v132_fragments':'not-independent-removal-candidates',
   'automatic_removal_authorized':False,
   'reason':'only complete syntactic units are valid semantic counterfactuals; v169 still authorizes no production deletion'
 }
}
RESULT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')

lines=[
 'FE QUEST v169 — Syntactic-Unit Counterfactual Equivalence Preflight',
 '==================================================================',
 '',
 'Refinement',
 '----------',
 'The initial v169 exploratory run removed physical v132 files independently and correctly exposed syntax failures. Inspection showed that v132-block-00 through v132-block-07 are fragments of one JavaScript declaration/application unit, not eight independent statements. This authoritative pass separates physical-fragment controls from semantic candidates.',
 '',
 'Baseline',
 '--------',
 f"Snapshot SHA-256: {baseline['snapshot_sha256']}",
 f"Snapshot UTF-8 bytes: {baseline['snapshot_utf8_bytes']}",
 'Baseline self-check: ok',
 '',
 'Physical fragmentation controls',
 '-------------------------------',
 f"Controls: {len(controls)}",
 f"Syntax failures: {len(fragment_syntax)}",
 'These failures document source chunking only and are not counted as semantic non-equivalence decisions.',
 '',
 'Semantic candidates',
 '-------------------',
 f"Candidates/variants: {len(semantic)}",
 f"Equivalent: {len(sem_equiv)}",
 f"Non-equivalent: {len(sem_non)}",
 f"Runtime errors: {len(sem_runtime_errors)}",
 f"Complete v132 style-cue unit equivalent: {str(v132['equivalent_to_baseline']).lower()}",
 f"quality write-chain group equivalent: {str(quality_group['equivalent_to_baseline']).lower()}",
 '',
 'Variant detail',
 '--------------',
]
for r in rows:
    if r['kind']=='physical-fragment-control':
        status='SYNTAX_FRAGMENT_CONFIRMED' if not r['syntax_ok'] else ('EXECUTED_CONTROL' if r['runtime_ok'] else 'RUNTIME_ERROR_CONTROL')
    else:
        status='EQUIVALENT' if r['equivalent_to_baseline'] else ('RUNTIME_ERROR' if not r['runtime_ok'] else 'DIFFERENT_SNAPSHOT')
    lines.append(f"- {r['id']}: {status}")
lines += [
 '',
 'Decision',
 '--------',
 f"v132 style-cue unit: {result['decision']['v132_style_cue_unit']}",
 f"quality write chain: {result['decision']['quality_write_chain']}",
 'physical v132 fragments: not-independent-removal-candidates',
 'Automatic production removal authorized: false',
 '',
 'No production learning patch is removed or rewritten by v169.',
 ''
]
AUDIT.write_text('\n'.join(lines))
print('FEQUEST_V169_EQUIVALENCE_REFINED_OK '
      f"fragment-controls={len(controls)} fragment-syntax={len(fragment_syntax)} semantic={len(semantic)} "
      f"equivalent={len(sem_equiv)} non-equivalent={len(sem_non)} runtime-errors={len(sem_runtime_errors)} "
      f"v132-unit={int(v132['equivalent_to_baseline'])} quality-group={int(quality_group['equivalent_to_baseline'])} automatic-removal=0")
