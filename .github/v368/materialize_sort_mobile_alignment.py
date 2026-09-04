from pathlib import Path
import json
import sys


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes


PREVIOUS, TARGET = "v367", "v368"
SOURCE = ROOT / "app/sort-mobile-alignment-v368.css"
MARKER = "v368: align sort panel headings on mobile"

result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)
source = SOURCE.read_text().strip()

if MARKER not in target["css"].read_text():
    target["css"].write_text(target["css"].read_text().rstrip() + "\n\n" + source + "\n")

if target["css"].read_text().count(MARKER) != 1:
    raise AssertionError("v368 mobile alignment source must be materialized exactly once")

manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["sortMobileAlignment"] = {
    "version": TARGET,
    "scope": "core_03_03-sort-panel-mobile-heading-and-width",
    "reportedViewportCssWidth": 402,
    "profileSchemaChange": False,
    "questionBankChange": False,
    "questionContractChange": False,
    "curriculumTextChange": False,
    "progressionChange": False,
    "persistenceChange": False,
    "cloudRuntimeChange": False,
    "sourcePath": SOURCE.relative_to(ROOT).as_posix(),
    "sourceSha256": sha_bytes(SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

print(f"FEQUEST_V368_MATERIALIZED already={int(result['already_materialized'])} css-marker=1")
