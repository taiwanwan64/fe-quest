from pathlib import Path
import hashlib, json

REG=Path('_regression')

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def info(path):
    p=Path(path); b=p.read_bytes()
    return {'path':str(p).replace('\\','/'),'utf8_bytes':len(b),'sha256':sha_bytes(b)}

plan_path=REG/'production-equivalence-plan-v169.fixture.json'
archive_path=REG/'production-source-archive-boundary-v169.fixture.json'
if not plan_path.exists() or not archive_path.exists():
    raise AssertionError('v169 materialized fixtures required before refinement')

v132=[f'app/v132-block-{i:02d}.txt' for i in range(8)]
quality=['app/v135-block-00.txt','app/v139-block-00.txt','app/v139-block-01.txt','app/v141-block-00.txt','app/v142-block-00.txt','app/v143-block-00.txt']

fragment_controls=[
    {'id':f'fragment-control-v132-{i:02d}','kind':'physical-fragment-control','family':'v132-style-cue-unit',
     'removed_paths':[p],'basis':'prove-physical-block-is-not-an-independent-syntactic-unit'}
    for i,p in enumerate(v132)
]
semantic=[
    {'id':'unit-v132-style-cue-pass','kind':'semantic-candidate','family':'v132-style-cue-unit',
     'removed_paths':v132,'basis':'remove-complete-syntactic-unit-for-runtime-equivalence-test'},
]
for p in quality:
    semantic.append({'id':'single-'+Path(p).stem,'kind':'semantic-candidate','family':'quality-write-chain',
                     'removed_paths':[p],'basis':'v168-q.qualityAudit-write-chain-review'})
semantic.append({'id':'group-quality-write-chain','kind':'semantic-candidate','family':'quality-write-chain',
                 'removed_paths':quality,'basis':'joint-counterfactual-control'})
variants=fragment_controls+semantic
v132_concat=b''.join(Path(p).read_bytes() for p in v132)
quality_concat=b''.join(Path(p).read_bytes() for p in quality)
plan={
 'name':'production-equivalence-plan-v169',
 'version':'v169',
 'scope':'v132-v144-consolidation-preflight-syntactic-unit-aware',
 'policy':'syntactic-unit-counterfactual-runtime-snapshot-no-production-removal',
 'source_inventory':info('_regression/production-patch-chain-v167.fixture.json'),
 'effect_inventory':info('_regression/production-patch-effects-v168.fixture.json'),
 'refinement':{
   'supersedes':'physical-block-equivalence-plan-from-initial-v169-run',
   'reason':'v132-block-00..07 form one JS syntactic unit; removing a physical fragment is not a valid semantic counterfactual',
   'v132_unit':{
      'paths':v132,'utf8_bytes':len(v132_concat),'sha256':sha_bytes(v132_concat),
      'opening_marker':'const SUBJECT_A_V132_STYLE_CUE_OVERRIDES=',
      'closing_application_marker':'Object.assign(q,patch);'
   },
   'quality_chain':{'paths':quality,'utf8_bytes':len(quality_concat),'sha256':sha_bytes(quality_concat)}
 },
 'baseline':{
   'generated_source':'_site/index.html','patch_count':47,'question_count':710,
   'snapshot_components':['canonical-full-question-bank','fequest-self-check','diagnostic-contract-data',
                          'diagnostic-data-provenance','selected-feq-run-global-surface','answer-and-cognitive-distributions']
 },
 'fragment_control_count':len(fragment_controls),
 'semantic_candidate_variant_count':len(semantic),
 'variant_count':len(variants),
 'variants':variants,
 'decision_policy':{
   'physical_fragment_syntax_failure_is_not_semantic_non_equivalence':True,
   'only_semantic_candidate_variants_can_drive_consolidation_decisions':True,
   'runtime_snapshot_equivalent_does_not_mean_automatic_removal':True,
   'non_equivalent_or_runtime_error_blocks_removal':True,
   'automatic_removal_authorized':False
 }
}
plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
archive=json.loads(archive_path.read_text())
archive['equivalence_plan_fixture']=info(plan_path)
archive_path.write_text(json.dumps(archive,ensure_ascii=False,indent=2)+'\n')
print(f"FEQUEST_V169_PLAN_REFINED fragment-controls={len(fragment_controls)} semantic-variants={len(semantic)} total={len(variants)} v132-unit-bytes={len(v132_concat)}")
