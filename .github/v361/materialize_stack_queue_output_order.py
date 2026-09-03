from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes, transform_js

PREVIOUS, TARGET = "v360", "v361"
SOURCE = ROOT / "app/stack-queue-output-order-v361.json"

result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)
js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
patch = json.loads(SOURCE.read_text())
assert patch["scope"] == "core_03_01"
assert len(patch["replacements"]) == 2
for replacement in patch["replacements"]:
    assert js.count(replacement["before"]) == 1
    js = js.replace(replacement["before"], replacement["after"], 1)
target["js"].write_text(js)
manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["stackQueueOutputOrder"] = {
    "scope": patch["scope"],
    "label": "残りを取り出す順",
    "stackAfterOnePop": ["B", "A"],
    "queueAfterOneDequeue": ["B", "C"],
    "operationLogicChange": False,
    "profileSchemaChange": False,
    "questionBankChange": False,
    "sourcePath": SOURCE.relative_to(ROOT).as_posix(),
    "sourceSha256": sha_bytes(SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"FEQUEST_V361_MATERIALIZED already={int(result['already_materialized'])}")
