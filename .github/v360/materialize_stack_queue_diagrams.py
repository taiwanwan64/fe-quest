from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes, transform_js

PREVIOUS, TARGET = "v359", "v360"
JS_SOURCE = ROOT / "app/stack-queue-diagrams-v360.js"
CSS_SOURCE = ROOT / "app/stack-queue-diagrams-v360.css"

result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)
target["css"].write_text(previous["css"].read_text().rstrip() + "\n\n" + CSS_SOURCE.read_text().strip() + "\n")
js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
anchor = "function coreTopicArticleView(id){"
assert js.count(anchor) == 1
js = js.replace(anchor, JS_SOURCE.read_text().strip() + "\n\n" + anchor, 1)
mount = "      ${coreTopicCriticalPathDiagramViewV359(id)}"
assert js.count(mount) == 1
js = js.replace(mount, mount + "\n      ${coreTopicStackQueueDiagramViewV360(id)}", 1)
start, end = js.index("function dataStructureView(stack,queue){"), js.index("function sqlView(filtered){")
js = js[:start] + "function dataStructureView(stack,queue){\n  return stackQueueCardsV360(stack,queue);\n}\n" + js[end:]
start, end = js.index("  if(type==='stackqueue'){"), js.index("  if(type==='sql'){")
js = js[:start] + "  if(type==='stackqueue'){\n    renderStackQueueExperienceV360(stage);\n  }\n\n" + js[end:]
after = "render:()=>dataStructureView(['A','B'],['B','C'])"
assert js.count(after) == 1
js = js.replace(after, "render:()=>stackQueueAfterRemovalViewV360()", 1)
target["js"].write_text(js)
manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["stackQueueDiagrams"] = {
    "version": TARGET, "scope": ["core_03_01", "stackqueue"],
    "profileSchemaChange": False, "questionBankChange": False,
    "curriculumTextChange": False, "cloudRuntimeChange": False,
    "coreInteractionRequired": False,
    "legacyCompletion": "one successful POP and one successful DEQUEUE, unchanged",
    "demoStorage": "ephemeral closure only; reset preserves operation completion",
    "jsSourcePath": JS_SOURCE.relative_to(ROOT).as_posix(),
    "jsSourceSha256": sha_bytes(JS_SOURCE.read_bytes()),
    "cssSourcePath": CSS_SOURCE.relative_to(ROOT).as_posix(),
    "cssSourceSha256": sha_bytes(CSS_SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"FEQUEST_V360_MATERIALIZED already={int(result['already_materialized'])}")
