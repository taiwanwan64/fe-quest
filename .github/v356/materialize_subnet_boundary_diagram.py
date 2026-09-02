from pathlib import Path
import json
import sys


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str((ROOT / ".github/release").resolve()))

from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes


PREVIOUS = "v355"
TARGET = "v356"
JS_SOURCE = ROOT / "app/subnet-boundary-diagram-v356.js"
CSS_SOURCE = ROOT / "app/subnet-boundary-diagram-v356.css"
CSS_MARKER = "v356: subnet network/host boundary lesson diagram"


result = materialize_tree(ROOT, TARGET, PREVIOUS)
target = result["files"]
previous = paths(ROOT, PREVIOUS)

css_source = CSS_SOURCE.read_text().strip()
target["css"].write_text(previous["css"].read_text().rstrip() + "\n\n" + css_source + "\n")
if target["css"].read_text().count(CSS_MARKER) != 1:
    raise AssertionError("v356 subnet boundary CSS must be materialized exactly once")

js = target["js"].read_text()
source = JS_SOURCE.read_text().strip()
function_anchor = "function coreTopicArticleView(id){"
if "function coreTopicSubnetBoundaryDiagramViewV356(id)" not in js:
    if function_anchor not in js:
        raise AssertionError("core topic article anchor missing")
    js = js.replace(function_anchor, source + "\n\n" + function_anchor, 1)

old_mount = "      ${coreTopicCryptoSignatureDiagramViewV355(id)}"
new_mount = "      ${coreTopicCryptoSignatureDiagramViewV355(id)}\n      ${coreTopicSubnetBoundaryDiagramViewV356(id)}"
if new_mount not in js:
    if old_mount not in js:
        raise AssertionError("v355 key comparison mount anchor missing")
    js = js.replace(old_mount, new_mount, 1)
if js.count("function coreTopicSubnetBoundaryDiagramViewV356(id)") != 1:
    raise AssertionError("v356 subnet boundary renderer must be unique")
if js.count("${coreTopicSubnetBoundaryDiagramViewV356(id)}") != 1:
    raise AssertionError("v356 subnet boundary mount must be unique")
target["js"].write_text(js)

manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["subnetBoundaryDiagram"] = {
    "version": TARGET,
    "scope": "core-10-04-network-host-boundary-diagram",
    "profileSchemaChange": False,
    "questionBankChange": False,
    "curriculumTextChange": False,
    "cloudRuntimeChange": False,
    "interactionRequired": False,
    "jsSourcePath": JS_SOURCE.relative_to(ROOT).as_posix(),
    "jsSourceSha256": sha_bytes(JS_SOURCE.read_bytes()),
    "cssSourcePath": CSS_SOURCE.relative_to(ROOT).as_posix(),
    "cssSourceSha256": sha_bytes(CSS_SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

print(f"FEQUEST_V356_MATERIALIZED already={int(result['already_materialized'])} css-marker=1 diagram=1")
