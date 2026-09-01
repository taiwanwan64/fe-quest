from pathlib import Path
import json
import sys


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str((ROOT / ".github/release").resolve()))

from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes


PREVIOUS = "v345"
TARGET = "v351"
SOURCE = ROOT / "app/progress-settings-layout-v351.css"
MARKER = "v351: progress / settings desktop layout polish"


result = materialize_tree(ROOT, TARGET, PREVIOUS)
target = result["files"]
source = SOURCE.read_text().strip()
css = target["css"].read_text()

if MARKER not in css:
    css = css.rstrip() + "\n\n" + source + "\n"
    target["css"].write_text(css)

if target["css"].read_text().count(MARKER) != 1:
    raise AssertionError("v351 layout source must be materialized exactly once")

previous = paths(ROOT, PREVIOUS)
manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["layoutPolish"] = {
    "version": TARGET,
    "scope": "progress-settings-responsive-layout",
    "profileSchemaChange": False,
    "learningContentChange": False,
    "cloudRuntimeChange": False,
    "sourcePath": SOURCE.relative_to(ROOT).as_posix(),
    "sourceSha256": sha_bytes(SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

print(f"FEQUEST_V351_MATERIALIZED already={int(result['already_materialized'])} css-marker=1")
