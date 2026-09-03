from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes, transform_js

PREVIOUS, TARGET = "v364", "v365"
JS_SOURCE = ROOT / "app/linked-list-diagrams-v365.js"
CSS_SOURCE = ROOT / "app/linked-list-diagrams-v365.css"
result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)

if not result["already_materialized"]:
    target["css"].write_text(previous["css"].read_text().rstrip() + "\n\n" + CSS_SOURCE.read_text().strip() + "\n")
    js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
    source = JS_SOURCE.read_text().strip()
    anchor = "function coreTopicArticleView(id){"
    assert js.count(anchor) == 1
    js = js.replace(anchor, source + "\n\n" + anchor, 1)
    mount = "      ${coreTopicStackQueueDiagramViewV360(id)}"
    assert js.count(mount) == 1
    js = js.replace(mount, mount + "\n      ${coreTopicLinkedListDiagramViewV365(id)}", 1)
    start = js.index("  if(v.list){const visited=v.visited||[];return")
    end = js.index("\n  if(v.bits)", start)
    js = js[:start] + "  if(v.list)return linkedListTraceViewV365(v.list,v.currentNode,v.visited||[]);" + js[end:]
    visual_start = js.index("  if(currentB.list){", js.index("function renderBVisual(step){"))
    visual_end = js.index("\n  if(step.bits){", visual_start)
    js = js[:visual_start] + "  if(currentB.list){\n    v.innerHTML=linkedListTraceViewV365(currentB.list,step.currentNode,step.visited||[]);\n    return;\n  }\n" + js[visual_end:]
    target["js"].write_text(js)
    manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
        "version": PREVIOUS,
        "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
        "shellSha256": sha_bytes(previous["shell"].read_bytes()),
        "cssSha256": sha_bytes(previous["css"].read_bytes()),
        "jsSha256": sha_bytes(previous["js"].read_bytes()),
    })
    manifest["linkedListDiagrams"] = {
        "version": TARGET,
        "scope": ["core_03_01", "linked_list-trace", "linked_list-mini-mock"],
        "profileSchemaChange": False, "questionBankChange": False,
        "questionContractChange": False, "curriculumTextChange": False,
        "cloudRuntimeChange": False, "coreInteractionRequired": False,
        "traceProgressionChange": False,
        "presentation": ["logical-vs-memory-order", "insert-rewire", "next-field", "current-pointer"],
        "jsSourcePath": JS_SOURCE.relative_to(ROOT).as_posix(),
        "jsSourceSha256": sha_bytes(JS_SOURCE.read_bytes()),
        "cssSourcePath": CSS_SOURCE.relative_to(ROOT).as_posix(),
        "cssSourceSha256": sha_bytes(CSS_SOURCE.read_bytes()),
    }
    target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"FEQUEST_V365_MATERIALIZED already={int(result['already_materialized'])}")
