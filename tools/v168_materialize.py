from pathlib import Path
import hashlib, json, re
from v168_effect_lib import analyze_patch_effects

ROOT=Path('.')
APP=ROOT/'app'
REG=ROOT/'_regression'
ARCH=REG/'archive'/'diagnostics'
AUD=ROOT/'audits'

def req(v,m):
    if not v:
        raise AssertionError(m)

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def info(path):
    p=Path(path); b=p.read_bytes()
    return {'path':str(p).replace('\\','/'),'utf8_bytes':len(b),'sha256':sha_bytes(b)}

src=Path('index.html').read_text()
if 'FE QUEST PWA v168' in src and (REG/'production-patch-effects-v168.fixture.json').exists() and (REG/'production-source-archive-boundary-v168.fixture.json').exists():
    print('FEQUEST_V168_SOURCE_ALREADY_MATERIALIZED')
    raise SystemExit(0)

req('FE QUEST PWA v167' in src and "const APP_VERSION = 'v167';" in src and 'runV167SelfCheck();' in src,'expected v167 assembler')
prev=json.loads((REG/'production-source-archive-boundary-v167.fixture.json').read_text())
req(prev['version']=='v167' and prev['archived_source_count']==49 and len(prev['archive_entries'])==49,'v167 archive fixture')
patch=json.loads((REG/'production-patch-chain-v167.fixture.json').read_text())
req(patch['version']=='v167' and patch['patch_range']['block_count']==47 and len(patch['blocks'])==47,'v167 patch inventory fixture')

# Retire v167 release adapter into the build-excluded diagnostic archive.
old_adapter=APP/'v167-block-00.txt'
req(old_adapter.exists(),'v167 adapter source missing')
ARCH.mkdir(parents=True,exist_ok=True)
arch_adapter=ARCH/'v167-block-00.txt'
req(not arch_adapter.exists(),'v167 adapter already archived')
adapter_bytes=old_adapter.read_bytes()
arch_adapter.write_bytes(adapter_bytes)
old_adapter.unlink()
arch_entry={
    'name':'v167-block-00.txt',
    'old_path':'app/v167-block-00.txt',
    'archive_path':'_regression/archive/diagnostics/v167-block-00.txt',
    'utf8_bytes':len(adapter_bytes),
    'sha256':sha_bytes(adapter_bytes)
}

# Stable diagnostic wrapper: only release/archive bookkeeping advances.
wp=APP/'runtime-diagnostic-wrapper.txt'
w=wp.read_text()
repls=[
 ("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v167.fixture.json'",
  "archiveBoundaryFixture:'_regression/production-source-archive-boundary-v168.fixture.json'"),
 ("archivedSourceCount:49","archivedSourceCount:50"),
 ("retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck','runV166SelfCheck'])",
  "retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck','runV166SelfCheck','runV167SelfCheck'])"),
 ("retiredAdapters.length===7&&new Set(retiredAdapters).size===7",
  "retiredAdapters.length===8&&new Set(retiredAdapters).size===8"),
 ("a.retiredAdapters===7&&a.presentStableWrapper===6",
  "a.retiredAdapters===8&&a.presentStableWrapper===6"),
 ("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v167.fixture.json'",
  "s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v168.fixture.json'"),
 ("s.archivedSourceCount===49","s.archivedSourceCount===50"),
]
for a,b in repls:
    req(w.count(a)==1,f'wrapper replacement cardinality {a}')
    w=w.replace(a,b)
wp.write_text(w)

# Current release adapter.
new_adapter=APP/'v168-block-00.txt'
req(not new_adapter.exists(),'v168 adapter already exists')
new_adapter.write_text("""// ===== FE QUEST v168 release adapter =====
(() => {
  function runV168SelfCheck(){return feqRunSelfCheck('v168','runV168SelfCheck');}
  globalThis.runV168SelfCheck=runV168SelfCheck;
})();
""")

# Assembler release bookkeeping only; the active v132-v144 chain is preserved byte-for-byte.
src=src.replace("{% capture v167block %}{% include_relative app/v167-block-00.txt %}{% endcapture %}",
                "{% capture v168block %}{% include_relative app/v168-block-00.txt %}{% endcapture %}")
src=src.replace('<title>FE QUEST PWA v167</title>','<title>FE QUEST PWA v168</title>')
src=src.replace("const APP_VERSION = 'v167';","const APP_VERSION = 'v168';")
src=src.replace("applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV167SelfCheck();",
                "applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV168SelfCheck();")
src=src.replace("{{ diagnosticWrapper }}{{ v167block }}const CORE_A_TOPIC_TOTAL_QUESTION_COUNTS",
                "{{ diagnosticWrapper }}{{ v168block }}const CORE_A_TOPIC_TOTAL_QUESTION_COUNTS")
req('v167block' not in src and 'app/v167-block-00.txt' not in src,'retired adapter still in assembler')
req(src.count('{% include_relative app/v168-block-00.txt %}')==1,'v168 adapter include')
Path('index.html').write_text(src)

# Manifest and service worker release identity.
mp=Path('manifest.webmanifest')
m=json.loads(mp.read_text())
m['name']='FE QUEST v168'
m['description']='基本情報技術者試験向けPWA。v168ではv167で固定したv132〜v144・47個のproduction学習パッチを変更せず、patch間の宣言・参照・write chain・effect markerをsource-level dependency mapとして追加した。自動的な削除判定は行わず、統合候補は必ず同値性テスト対象として扱う。current-contract 71、科目A710問、browser UI 23、critical curriculum 56、remaining release sentinel 28、CI coverage 84/84、legacy 293 residual 0を維持。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

swp=Path('sw.js')
sw=swp.read_text()
req(sw.count("const APP_VERSION = 'v167';")==1 and sw.count("fe-quest-v167-1")==1,'v167 sw identity')
sw=sw.replace("const APP_VERSION = 'v167';","const APP_VERSION = 'v168';").replace("fe-quest-v167-1","fe-quest-v168-1")
swp.write_text(sw)

# Preserve every active learning block and exact v167 inventory identity.
for row in patch['blocks']:
    p=Path(row['path'])
    req(p.exists(),f'patch block missing {p}')
    req(p.stat().st_size==row['utf8_bytes'] and sha_file(p)==row['sha256'],f'patch block identity {p}')
req(Path(patch['base']['path']).stat().st_size==patch['base']['utf8_bytes'] and sha_file(patch['base']['path'])==patch['base']['sha256'],'base source identity')
rt=APP/'runtime-semantic-diagnostics.txt'
req(rt.stat().st_size==55525 and sha_file(rt)=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50','stable runtime identity')

# v168 adds a deterministic, conservative source-level effect/dependency map.
analysis=analyze_patch_effects(patch)
effect_fixture={
    'name':'production-patch-effects-v168',
    'version':'v168',
    'scope':'active-learning-patch-chain-v132-v144',
    'policy':'analysis-only-no-consolidation-no-automatic-removal',
    'source_inventory':info('_regression/production-patch-chain-v167.fixture.json'),
    'base':info('app/base-v131.html'),
    'patch_concat':{
        'utf8_bytes':patch['patch_range']['concat_utf8_bytes'],
        'sha256':patch['patch_range']['concat_sha256'],
    },
    **analysis,
}
effect_path=REG/'production-patch-effects-v168.fixture.json'
effect_path.write_text(json.dumps(effect_fixture,ensure_ascii=False,indent=2)+'\n')

# Human-readable audit is generated from the same deterministic fixture.
s=analysis['summary']
cats='\n'.join(f"- {k}: {v}" for k,v in s['effect_category_counts'].items())
defchains='\n'.join(f"- {x['symbol']}: {' -> '.join(x['blocks'])}" for x in analysis['definition_chains']) or '- none'
writechains='\n'.join(f"- {x['target']}: {' -> '.join(x['blocks'])}" for x in analysis['write_chains']) or '- none'
candidate_rows=[b for b in analysis['blocks'] if b['equivalence_test_candidate']]
candidates='\n'.join(f"- {b['path']}: {', '.join(b['roles'])}" for b in candidate_rows) or '- none'
AUD.mkdir(exist_ok=True)
audit=f"""FE QUEST v168 — Patch Effect / Dependency Audit
================================================

Scope
-----
v168 analyzes the already-frozen v132-v144 production learning patch chain without changing any learning block. This is source-level dependency/effect inventory only. It is not a semantic proof and it does not authorize removal of any block.

Source inventory
----------------
Patch source fixture: _regression/production-patch-chain-v167.fixture.json
Versions: {s['version_count']}
Blocks: {s['block_count']}
Patch concat bytes: {patch['patch_range']['concat_utf8_bytes']}
Patch concat SHA-256: {patch['patch_range']['concat_sha256']}
Base SHA-256: {patch['base']['sha256']}

Dependency/effect summary
-------------------------
Patch-to-patch dependency edges: {s['dependency_edges']}
Dependency provider blocks: {s['dependency_provider_blocks']}
Effect-marker-bearing blocks: {s['effect_marker_blocks']}
Rewrite-chain review blocks: {s['rewrite_review_blocks']}
Patch-local leaf review blocks: {s['patch_local_leaf_review_blocks']}
Repeated definition chains: {s['definition_chains']}
Repeated exact write chains: {s['write_chains']}
Equivalence-test candidates: {s['equivalence_test_candidates']}
Automatic removal candidates: {s['automatic_removal_candidates']}

Effect marker counts
--------------------
{cats}

Repeated definition chains
--------------------------
{defchains}

Repeated exact write chains
---------------------------
{writechains}

Blocks flagged for future equivalence testing
---------------------------------------------
{candidates}

Interpretation policy
---------------------
A dependency edge means a later patch references a symbol defined by an earlier patch, with the nearest prior patch definition selected as provider. Effect markers are lexical source markers and do not prove top-level execution. A patch-local leaf may still be consumed by base-v131 code or by runtime behavior not represented by patch-to-patch symbol edges. A rewrite-chain member may still perform required intermediate work.

Therefore v168 sets automatic_removal_candidate=false for every block. Any future consolidation must first create explicit generated-output/runtime equivalence tests for the candidate group being changed.

Release policy
--------------
No question text, choices, answers, cognitive-level labels, Profile Schema data, base learning source, v132-v144 learning blocks, or stable semantic runtime are changed in v168.
"""
(AUD/'PATCH_EFFECT_DEPENDENCY_AUDIT_v168.txt').write_text(audit)

# Archive/source boundary now includes retired v167 adapter and the new analysis fixture.
entries=list(prev['archive_entries'])+[arch_entry]
archive_fixture={
    'name':'production-source-archive-boundary-v168',
    'version':'v168',
    'archive_root':'_regression/archive/diagnostics',
    'archived_source_count':50,
    'production_app_archival_residual_count':0,
    'archive_entries':entries,
    'active_runtime':info('app/runtime-semantic-diagnostics.txt'),
    'stable_wrapper':info('app/runtime-diagnostic-wrapper.txt'),
    'release_adapter':{**info('app/v168-block-00.txt'),'allowed_global':'runV168SelfCheck'},
    'assembler':info('index.html'),
    'manifest':info('manifest.webmanifest'),
    'service_worker':info('sw.js'),
    'patch_chain_fixture':info('_regression/production-patch-chain-v167.fixture.json'),
    'patch_effect_fixture':info('_regression/production-patch-effects-v168.fixture.json'),
    'policy':'historical-diagnostics-build-excluded-regression-archive'
}
(REG/'production-source-archive-boundary-v168.fixture.json').write_text(json.dumps(archive_fixture,ensure_ascii=False,indent=2)+'\n')

print(
    'FEQUEST_V168_SOURCE_MATERIALIZED '
    f"patches={s['block_count']} edges={s['dependency_edges']} providers={s['dependency_provider_blocks']} "
    f"effects={s['effect_marker_blocks']} rewrite-review={s['rewrite_review_blocks']} "
    f"leaf-review={s['patch_local_leaf_review_blocks']} archive=50 runtime={rt.stat().st_size}"
)
