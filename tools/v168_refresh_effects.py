from pathlib import Path
import hashlib, json
from v168_effect_lib import analyze_patch_effects

REG=Path('_regression')
AUD=Path('audits')

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def info(path):
    p=Path(path); b=p.read_bytes()
    return {'path':str(p).replace('\\','/'),'utf8_bytes':len(b),'sha256':sha_bytes(b)}

patch=json.loads((REG/'production-patch-chain-v167.fixture.json').read_text())
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

s=analysis['summary']
cats='\n'.join(f"- {k}: {v}" for k,v in s['effect_category_counts'].items())
defchains='\n'.join(f"- {x['symbol']}: {' -> '.join(x['blocks'])}" for x in analysis['definition_chains']) or '- none'
writechains='\n'.join(f"- {x['target']}: {' -> '.join(x['blocks'])}" for x in analysis['write_chains']) or '- none'
candidate_rows=[b for b in analysis['blocks'] if b['equivalence_test_candidate']]
candidates='\n'.join(f"- {b['path']}: {', '.join(b['roles'])}" for b in candidate_rows) or '- none'
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
A dependency edge means a later patch references a persistent symbol defined by an earlier patch, with the nearest prior patch definition selected as provider. Persistent symbols are named functions/classes/global exports plus uppercase or version-prefixed lexical declarations; ordinary local variables are deliberately excluded from cross-block dependency/write classification. Effect markers are lexical source markers and do not prove top-level execution. A patch-local leaf may still be consumed by base-v131 code or by runtime behavior not represented by patch-to-patch symbol edges. A rewrite-chain member may still perform required intermediate work.

Therefore v168 sets automatic_removal_candidate=false for every block. Any future consolidation must first create explicit generated-output/runtime equivalence tests for the candidate group being changed.

Release policy
--------------
No question text, choices, answers, cognitive-level labels, Profile Schema data, base learning source, v132-v144 learning blocks, or stable semantic runtime are changed in v168.
"""
AUD.mkdir(exist_ok=True)
(AUD/'PATCH_EFFECT_DEPENDENCY_AUDIT_v168.txt').write_text(audit)

archive_path=REG/'production-source-archive-boundary-v168.fixture.json'
archive=json.loads(archive_path.read_text())
archive['patch_effect_fixture']=info('_regression/production-patch-effects-v168.fixture.json')
archive_path.write_text(json.dumps(archive,ensure_ascii=False,indent=2)+'\n')

print(
    'FEQUEST_V168_EFFECTS_REFRESHED '
    f"edges={s['dependency_edges']} providers={s['dependency_provider_blocks']} effects={s['effect_marker_blocks']} "
    f"rewrite-review={s['rewrite_review_blocks']} leaf-review={s['patch_local_leaf_review_blocks']} "
    f"equivalence-candidates={s['equivalence_test_candidates']} automatic-removal=0"
)
