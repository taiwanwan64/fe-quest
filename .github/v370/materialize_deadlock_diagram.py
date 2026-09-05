from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes, transform_js

PREVIOUS, TARGET = "v369", "v370"
JS_SOURCE = ROOT / "app/deadlock-diagram-v370.js"
CSS_SOURCE = ROOT / "app/deadlock-diagram-v370.css"
result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)

target["css"].write_text(previous["css"].read_text().rstrip() + "\n\n" + CSS_SOURCE.read_text().strip() + "\n")
js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
source = JS_SOURCE.read_text().strip()
anchor = "function coreTopicArticleView(id){"
assert js.count(anchor) == 1
js = js.replace(anchor, source + "\n\n" + anchor, 1)
mount = "      ${coreTopicSqlJoinDiagramViewV369(id)}"
assert js.count(mount) == 1
js = js.replace(mount, mount + "\n      ${coreTopicDeadlockDiagramViewV370(id)}", 1)
target["js"].write_text(js)
manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {"version": PREVIOUS,"assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),"shellSha256": sha_bytes(previous["shell"].read_bytes()),"cssSha256": sha_bytes(previous["css"].read_bytes()),"jsSha256": sha_bytes(previous["js"].read_bytes())})
manifest["deadlockDiagram"]={"version":TARGET,"scope":["core_09_06"],"profileSchemaChange":False,"questionBankChange":False,"questionContractChange":False,"curriculumTextChange":False,"progressionChange":False,"persistenceChange":False,"cloudRuntimeChange":False,"coreInteractionRequired":False,"presentation":["opposite-lock-order","held-resources","circular-wait","consistent-lock-order","rollback-recovery"],"jsSourcePath":JS_SOURCE.relative_to(ROOT).as_posix(),"jsSourceSha256":sha_bytes(JS_SOURCE.read_bytes()),"cssSourcePath":CSS_SOURCE.relative_to(ROOT).as_posix(),"cssSourceSha256":sha_bytes(CSS_SOURCE.read_bytes())}
target["asset_manifest"].write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
print(f"FEQUEST_V370_MATERIALIZED already={int(result['already_materialized'])}")
