from pathlib import Path
p=Path('tools/v169_validate.py')
s=p.read_text()
start=s.index("plan=json.loads(Path('_regression/production-equivalence-plan-v169.fixture.json').read_text())")
end=s.index("changed=subprocess.check_output", start)
new=r'''plan=json.loads(Path('_regression/production-equivalence-plan-v169.fixture.json').read_text())
req(plan['version']=='v169' and plan['policy']=='syntactic-unit-counterfactual-runtime-snapshot-no-production-removal','equivalence plan')
req(plan['scope']=='v132-v144-consolidation-preflight-syntactic-unit-aware','equivalence scope')
req(plan['fragment_control_count']==8 and plan['semantic_candidate_variant_count']==8 and plan['variant_count']==16,'equivalence plan counts')
req(plan['refinement']['v132_unit']['paths']==[f'app/v132-block-{i:02d}.txt' for i in range(8)],'v132 syntactic unit')
req(plan['refinement']['v132_unit']['opening_marker']=='const SUBJECT_A_V132_STYLE_CUE_OVERRIDES=' and plan['refinement']['v132_unit']['closing_application_marker']=='Object.assign(q,patch);','v132 unit markers')
req(plan['refinement']['quality_chain']['paths']==['app/v135-block-00.txt','app/v139-block-00.txt','app/v139-block-01.txt','app/v141-block-00.txt','app/v142-block-00.txt','app/v143-block-00.txt'],'quality candidates')

result=json.loads(Path('_regression/production-equivalence-results-v169.fixture.json').read_text())
req(result['version']=='v169' and result['policy']=='measured-syntactic-unit-counterfactual-runtime-snapshot-no-production-removal','equivalence results')
req(result['plan']['sha256']==sha_file('_regression/production-equivalence-plan-v169.fixture.json'),'result plan identity')
req(result['baseline']['runtime_ok'] and result['baseline']['syntax_ok'] and result['baseline']['self_check_ok'],'baseline equivalence runtime')
summary=result['summary']
req(summary['fragment_control_count']==8 and summary['semantic_candidate_variants']==8,'result counts')
req(1<=summary['fragment_syntax_failures']<=8,'v132 physical-fragment controls did not produce measured syntax evidence')
req(summary['automatic_removal_authorized'] is False and result['decision']['automatic_removal_authorized'] is False,'no automatic removal')
ids={r['id'] for r in result['variants']}
req(ids=={v['id'] for v in plan['variants']} and len(result['variants'])==16,'variant set')
for r in result['variants']:
    req(r['baseline_snapshot_sha256']==result['baseline']['snapshot_sha256'],'baseline snapshot linkage')
semantic=[r for r in result['variants'] if r['kind']=='semantic-candidate']
controls=[r for r in result['variants'] if r['kind']=='physical-fragment-control']
req(len(semantic)==8 and len(controls)==8,'variant kinds')
req(sum(not r['syntax_ok'] for r in controls)==summary['fragment_syntax_failures'],'fragment syntax count reproducibility')
req(result['decision']['physical_v132_fragments']=='not-independent-removal-candidates','fragment decision')
'''
s=s[:start]+new+s[end:]
old="""summary=result['summary']
print('FEQUEST_V169_EQUIVALENCE_RESULT '
      f\"single=13 variants=15 equivalent={summary['equivalent_variants']} non-equivalent={summary['non_equivalent_variants']} \"
      f\"runtime-errors={summary['runtime_error_variants']} v132-group={int(summary['v132_leaf_group_equivalent'])} \"
      f\"quality-group={int(summary['quality_write_group_equivalent'])} automatic-removal=0\")
"""
new2="""summary=result['summary']
print('FEQUEST_V169_EQUIVALENCE_RESULT '
      f\"fragment-controls=8 fragment-syntax={summary['fragment_syntax_failures']} semantic=8 \"
      f\"equivalent={summary['semantic_equivalent_variants']} non-equivalent={summary['semantic_non_equivalent_variants']} \"
      f\"runtime-errors={summary['semantic_runtime_error_variants']} v132-unit={int(summary['v132_style_cue_unit_equivalent'])} \"
      f\"quality-group={int(summary['quality_write_group_equivalent'])} automatic-removal=0\")
"""
if old not in s:
    raise AssertionError('validator summary marker not found')
s=s.replace(old,new2)
p.write_text(s)
print('FEQUEST_V169_VALIDATOR_REFINED')
