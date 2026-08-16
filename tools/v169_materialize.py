from pathlib import Path
import hashlib, json, re

ROOT=Path('.')
APP=ROOT/'app'
REG=ROOT/'_regression'
ARCH=REG/'archive'/'diagnostics'

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def info(path):
    p=Path(path); b=p.read_bytes()
    return {'path':str(p).replace('\\','/'),'utf8_bytes':len(b),'sha256':sha_bytes(b)}

src=Path('index.html').read_text()
if 'FE QUEST PWA v169' in src and (REG/'production-equivalence-plan-v169.fixture.json').exists() and (REG/'production-source-archive-boundary-v169.fixture.json').exists():
    print('FEQUEST_V169_SOURCE_ALREADY_MATERIALIZED')
    raise SystemExit(0)
req('FE QUEST PWA v168' in src and "const APP_VERSION = 'v168';" in src and 'runV168SelfCheck();' in src,'expected v168 assembler')
prev=json.loads((REG/'production-source-archive-boundary-v168.fixture.json').read_text())
req(prev['version']=='v168' and prev['archived_source_count']==50 and len(prev['archive_entries'])==50,'v168 archive fixture')

old_adapter=APP/'v168-block-00.txt'
req(old_adapter.exists(),'v168 adapter missing')
ARCH.mkdir(parents=True,exist_ok=True)
arch_adapter=ARCH/'v168-block-00.txt'
req(not arch_adapter.exists(),'v168 adapter already archived')
adapter_bytes=old_adapter.read_bytes()
arch_adapter.write_bytes(adapter_bytes)
old_adapter.unlink()
arch_entry={
    'name':'v168-block-00.txt',
    'old_path':'app/v168-block-00.txt',
    'archive_path':'_regression/archive/diagnostics/v168-block-00.txt',
    'utf8_bytes':len(adapter_bytes),
    'sha256':sha_bytes(adapter_bytes),
}

wp=APP/'runtime-diagnostic-wrapper.txt'
w=wp.read_text()
repls=[
 ("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v168.fixture.json'",
  "archiveBoundaryFixture:'_regression/production-source-archive-boundary-v169.fixture.json'"),
 ("archivedSourceCount:50","archivedSourceCount:51"),
 ("retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck','runV166SelfCheck','runV167SelfCheck'])",
  "retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck','runV166SelfCheck','runV167SelfCheck','runV168SelfCheck'])"),
 ("retiredAdapters.length===8&&new Set(retiredAdapters).size===8",
  "retiredAdapters.length===9&&new Set(retiredAdapters).size===9"),
 ("a.retiredAdapters===8&&a.presentStableWrapper===6",
  "a.retiredAdapters===9&&a.presentStableWrapper===6"),
 ("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v168.fixture.json'",
  "s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v169.fixture.json'"),
 ("s.archivedSourceCount===50","s.archivedSourceCount===51"),
]
for a,b in repls:
    req(w.count(a)==1,f'wrapper replacement cardinality: {a}')
    w=w.replace(a,b)
wp.write_text(w)

new_adapter=APP/'v169-block-00.txt'
req(not new_adapter.exists(),'v169 adapter already exists')
new_adapter.write_text("""// ===== FE QUEST v169 release adapter =====
(() => {
  function runV169SelfCheck(){return feqRunSelfCheck('v169','runV169SelfCheck');}
  globalThis.runV169SelfCheck=runV169SelfCheck;
})();
""")

src=src.replace("{% capture v168block %}{% include_relative app/v168-block-00.txt %}{% endcapture %}",
                "{% capture v169block %}{% include_relative app/v169-block-00.txt %}{% endcapture %}")
src=src.replace('<title>FE QUEST PWA v168</title>','<title>FE QUEST PWA v169</title>')
src=src.replace("const APP_VERSION = 'v168';","const APP_VERSION = 'v169';")
src=src.replace("applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV168SelfCheck();",
                "applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV169SelfCheck();")
src=src.replace("{{ diagnosticWrapper }}{{ v168block }}const CORE_A_TOPIC_TOTAL_QUESTION_COUNTS",
                "{{ diagnosticWrapper }}{{ v169block }}const CORE_A_TOPIC_TOTAL_QUESTION_COUNTS")
req('v168block' not in src and 'app/v168-block-00.txt' not in src,'retired adapter in assembler')
req(src.count('{% include_relative app/v169-block-00.txt %}')==1,'v169 include')
Path('index.html').write_text(src)

mp=Path('manifest.webmanifest')
m=json.loads(mp.read_text())
m['name']='FE QUEST v169'
m['description']='基本情報技術者試験向けPWA。v169ではv168で抽出した13個の統合候補に対し、生成済みproduction HTMLから候補blockだけを除いたcounterfactual runtimeを実行し、QUESTION_BANK・self-check・diagnostic data・global surfaceのcanonical snapshotをbaselineと比較する同値性ハーネスを追加した。学習パッチ自体は変更・削除せず、同値性が確認できた候補も次版以降の管理された統合実験対象としてのみ扱う。current-contract 71、科目A710問、browser UI 23、CI coverage 84/84、legacy 293 residual 0を維持。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

swp=Path('sw.js'); sw=swp.read_text()
req(sw.count("const APP_VERSION = 'v168';")==1 and sw.count("fe-quest-v168-1")==1,'v168 sw identity')
sw=sw.replace("const APP_VERSION = 'v168';","const APP_VERSION = 'v169';").replace("fe-quest-v168-1","fe-quest-v169-1")
swp.write_text(sw)

leaf=[f'app/v132-block-{i:02d}.txt' for i in range(7)]
quality=[
 'app/v135-block-00.txt','app/v139-block-00.txt','app/v139-block-01.txt',
 'app/v141-block-00.txt','app/v142-block-00.txt','app/v143-block-00.txt'
]
candidates=[]
for p in leaf:
    candidates.append({'id':'single-'+Path(p).stem,'family':'v132-leaf','removed_paths':[p],
                       'basis':'v168-patch-local-leaf-review'})
for p in quality:
    candidates.append({'id':'single-'+Path(p).stem,'family':'quality-write-chain','removed_paths':[p],
                       'basis':'v168-q.qualityAudit-write-chain-review'})
variants=candidates+[
 {'id':'group-v132-leaf-00-06','family':'v132-leaf','removed_paths':leaf,
  'basis':'joint-equivalence-required-before-consolidation'},
 {'id':'group-quality-write-chain','family':'quality-write-chain','removed_paths':quality,
  'basis':'joint-counterfactual-control'}
]
plan={
 'name':'production-equivalence-plan-v169',
 'version':'v169',
 'scope':'v132-v144-consolidation-preflight',
 'policy':'counterfactual-runtime-snapshot-no-production-removal',
 'source_inventory':info('_regression/production-patch-chain-v167.fixture.json'),
 'effect_inventory':info('_regression/production-patch-effects-v168.fixture.json'),
 'baseline':{
   'generated_source':'_site/index.html',
   'patch_count':47,
   'question_count':710,
   'snapshot_components':[
     'canonical-full-question-bank','fequest-self-check','diagnostic-contract-data',
     'diagnostic-data-provenance','selected-feq-run-global-surface',
     'answer-and-cognitive-distributions'
   ]
 },
 'candidate_families':{
   'v132_leaf_blocks':leaf,
   'quality_write_chain_blocks':quality,
 },
 'single_candidate_count':len(candidates),
 'variant_count':len(variants),
 'variants':variants,
 'decision_policy':{
   'runtime_snapshot_equivalent_does_not_mean_automatic_removal':True,
   'joint_group_equivalence_required_for_group_consolidation':True,
   'non_equivalent_or_runtime_error_blocks_removal':True,
   'next_step_for_equivalent_group':'controlled-source-removal-with-byte/runtime regression in a later release'
 }
}
(REG/'production-equivalence-plan-v169.fixture.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')

entries=list(prev['archive_entries'])+[arch_entry]
archive_fixture={
 'name':'production-source-archive-boundary-v169',
 'version':'v169',
 'archive_root':'_regression/archive/diagnostics',
 'archived_source_count':51,
 'production_app_archival_residual_count':0,
 'archive_entries':entries,
 'active_runtime':info('app/runtime-semantic-diagnostics.txt'),
 'stable_wrapper':info('app/runtime-diagnostic-wrapper.txt'),
 'release_adapter':{**info('app/v169-block-00.txt'),'allowed_global':'runV169SelfCheck'},
 'assembler':info('index.html'),
 'manifest':info('manifest.webmanifest'),
 'service_worker':info('sw.js'),
 'patch_chain_fixture':info('_regression/production-patch-chain-v167.fixture.json'),
 'patch_effect_fixture':info('_regression/production-patch-effects-v168.fixture.json'),
 'equivalence_plan_fixture':info('_regression/production-equivalence-plan-v169.fixture.json'),
 'policy':'historical-diagnostics-build-excluded-regression-archive'
}
(REG/'production-source-archive-boundary-v169.fixture.json').write_text(json.dumps(archive_fixture,ensure_ascii=False,indent=2)+'\n')
print(f"FEQUEST_V169_SOURCE_MATERIALIZED variants={len(variants)} candidates={len(candidates)} archive=51 runtime={Path('app/runtime-semantic-diagnostics.txt').stat().st_size}")
