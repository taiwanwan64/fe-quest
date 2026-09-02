from pathlib import Path
import json
import sys


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str((ROOT / ".github/release").resolve()))

from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes


PREVIOUS = "v352"
TARGET = "v353"
JS_SOURCE = ROOT / "app/core-twos-complement-diagram-v353.js"
CSS_SOURCE = ROOT / "app/core-twos-complement-diagram-v353.css"
CSS_MARKER = "v353: inline two's-complement lesson diagram"


result = materialize_tree(ROOT, TARGET, PREVIOUS)
target = result["files"]
previous = paths(ROOT, PREVIOUS)

css_source = CSS_SOURCE.read_text().strip()
target["css"].write_text(previous["css"].read_text().rstrip() + "\n\n" + css_source + "\n")
if target["css"].read_text().count(CSS_MARKER) != 1:
    raise AssertionError("v353 lesson diagram CSS must be materialized exactly once")

js = target["js"].read_text()
source = JS_SOURCE.read_text().strip()
function_anchor = "function coreTopicArticleView(id){"
if "function coreTopicInlineDiagramViewV353(id)" not in js:
    if function_anchor not in js:
        raise AssertionError("core topic article anchor missing")
    js = js.replace(function_anchor, source + "\n\n" + function_anchor, 1)

old_mechanism = """    <section class=\"core-article-section\">
      <h2>仕組み</h2>
      <p>${politeCoreHtml(t.example)}</p>
    </section>

    ${CORE_A_OPTIONAL_DETAIL_TOPICS.has(id)?'':coreTopicSecondaryDepthView(id)}"""
new_mechanism = """    <section class=\"core-article-section\">
      <h2>仕組み</h2>
      <p>${politeCoreHtml(t.example)}</p>
      ${coreTopicInlineDiagramViewV353(id)}
    </section>

    ${CORE_A_OPTIONAL_DETAIL_TOPICS.has(id)?'':coreTopicSecondaryDepthView(id)}"""
if new_mechanism not in js:
    if old_mechanism not in js:
        raise AssertionError("core mechanism section anchor missing")
    js = js.replace(old_mechanism, new_mechanism, 1)
if js.count("function coreTopicInlineDiagramViewV353(id)") != 1:
    raise AssertionError("v353 lesson diagram renderer must be unique")
if js.count("${coreTopicInlineDiagramViewV353(id)}") != 1:
    raise AssertionError("v353 lesson diagram mount must be unique")
target["js"].write_text(js)

manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["lessonDiagram"] = {
    "version": TARGET,
    "scope": "core-01-05-inline-twos-complement-diagram",
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

print(f"FEQUEST_V353_MATERIALIZED already={int(result['already_materialized'])} css-marker=1 diagram=1")
