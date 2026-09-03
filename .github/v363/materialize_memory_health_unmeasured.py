from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, replace_named_function, sha_bytes, transform_js

PREVIOUS, TARGET = "v362", "v363"
SOURCE = ROOT / "app/memory-health-unmeasured-v363.js"
MARKER = "// FEQUEST_V363_RENDER_MEMORY_HEALTH"

result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)

source = SOURCE.read_text().strip()
memory_source, render_source = [part.strip() for part in source.split(MARKER, 1)]
assert memory_source.startswith("function memoryHealth()")
assert render_source.startswith("function renderMemoryHealth()")

js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
js = replace_named_function(js, "memoryHealth", memory_source)
js = replace_named_function(js, "renderMemoryHealth", render_source)
target["js"].write_text(js)

old_ring = '<div class="memory-ring" id="memoryHealthRing"><div><b id="memoryHealthValue">100%</b><span>推定保持</span></div></div>'
new_ring = '<div class="memory-ring is-unmeasured" id="memoryHealthRing" role="img" aria-label="記憶保持率は未計測です"><div><b id="memoryHealthValue">未計測</b><span id="memoryHealthCaption">問題演習後に表示</span></div></div>'
shell = target["shell"].read_text()
if old_ring in shell:
    assert shell.count(old_ring) == 1
    shell = shell.replace(old_ring, new_ring, 1)
else:
    assert shell.count(new_ring) == 1
target["shell"].write_text(shell)

css_patch = """

/* ===== v363: unmeasured memory-health state ===== */
.memory-ring.is-unmeasured{--memory-p:0}
.memory-ring.is-unmeasured b{font-size:18px;line-height:1.2}
.memory-ring.is-unmeasured span{margin:4px auto 0;font-size:9px;line-height:1.3;white-space:nowrap}
@media(max-width:720px){
  .memory-ring.is-unmeasured b{font-size:16px}
  .memory-ring.is-unmeasured span{font-size:8px}
}
"""
css = target["css"].read_text()
if "v363: unmeasured memory-health state" in css:
    css = css.split("\n\n/* ===== v363: unmeasured memory-health state ===== */", 1)[0]
target["css"].write_text(css.rstrip() + css_patch)

manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["memoryHealthUnmeasured"] = {
    "version": TARGET,
    "scope": ["memory-health", "fresh-profile", "complete-reset"],
    "emptyEvidenceAverage": 0,
    "emptyEvidenceLabel": "未計測",
    "emptyEvidenceCaption": "問題演習後に表示",
    "measuredRetentionUnchanged": True,
    "readinessCalculationChange": False,
    "resetPersistenceChange": False,
    "profileSchemaChange": False,
    "questionBankChange": False,
    "cloudRuntimeChange": False,
    "sourcePath": SOURCE.relative_to(ROOT).as_posix(),
    "sourceSha256": sha_bytes(SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"FEQUEST_V363_MATERIALIZED already={int(result['already_materialized'])}")
