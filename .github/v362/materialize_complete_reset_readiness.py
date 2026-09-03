from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, replace_named_function, sha_bytes, transform_js

PREVIOUS, TARGET = "v361", "v362"
SOURCE = ROOT / "app/complete-reset-readiness-v362.js"

result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)
js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
source = SOURCE.read_text().strip()
assert source.count("function readinessComponents()") == 1
assert "function subjectAPracticeEvidenceV362()" in source
js = replace_named_function(js, "readinessComponents", source)
target["js"].write_text(js)

manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["completeResetReadiness"] = {
    "version": TARGET,
    "scope": ["full-reset", "readiness-components", "readiness-breakdown"],
    "freshSubjectAPractice": 0,
    "freshReadiness": 0,
    "neutralSkillPriorPreserved": 50,
    "resetPersistenceChange": False,
    "profileSchemaChange": False,
    "questionBankChange": False,
    "cloudRuntimeChange": False,
    "sourcePath": SOURCE.relative_to(ROOT).as_posix(),
    "sourceSha256": sha_bytes(SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"FEQUEST_V362_MATERIALIZED already={int(result['already_materialized'])}")
