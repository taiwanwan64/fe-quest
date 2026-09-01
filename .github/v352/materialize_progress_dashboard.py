from pathlib import Path
import json
import sys


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str((ROOT / ".github/release").resolve()))

from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes


PREVIOUS = "v351"
TARGET = "v352"
CSS_SOURCE = ROOT / "app/progress-dashboard-layout-v352.css"
HTML_SOURCE = ROOT / "app/progress-dashboard-v352.html"
CSS_MARKER = "v352: learning-priority progress dashboard"


result = materialize_tree(ROOT, TARGET, PREVIOUS)
target = result["files"]
previous = paths(ROOT, PREVIOUS)

css_source = CSS_SOURCE.read_text().strip()
target["css"].write_text(previous["css"].read_text().rstrip() + "\n\n" + css_source + "\n")
if target["css"].read_text().count(CSS_MARKER) != 1:
    raise AssertionError("v352 dashboard CSS must be materialized exactly once")

shell = target["shell"].read_text()
start_marker = '      <div class="plan-screen-grid">'
if start_marker not in shell:
    start_marker = '      <div class="plan-screen-grid plan-dashboard-grid"'
end_marker = '    </section>\n\n\n    <!-- LEARNING ANALYTICS -->'
start = shell.index(start_marker)
end = shell.index(end_marker, start)
shell = shell[:start] + HTML_SOURCE.read_text().rstrip() + "\n" + shell[end:]
target["shell"].write_text(shell)

js = target["js"].read_text()
helper_anchor = "setPlanDetailsOpen(false);"
helper = """function openPlanDataFoldV352(){
  setPlanDetailsOpen(true);
  const fold=document.getElementById('planDataFold');
  if(fold)fold.open=true;
}
"""
if "function openPlanDataFoldV352()" not in js:
    js = js.replace(helper_anchor, helper + helper_anchor, 1)
old_callback = "showScreen('plan');setTimeout(()=>document.getElementById('pwaHealthCard')?.scrollIntoView?.({behavior:'smooth',block:'center'}),80)"
new_callback = "showScreen('plan');openPlanDataFoldV352();setTimeout(()=>document.getElementById('pwaHealthCard')?.scrollIntoView?.({behavior:'smooth',block:'center'}),80)"
js = js.replace(old_callback, new_callback)
if js.count("openPlanDataFoldV352();setTimeout") != 2:
    raise AssertionError("v352 recovery notices must open the data fold before scrolling")
target["js"].write_text(js)

manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["dashboardLayout"] = {
    "version": TARGET,
    "scope": "learning-priority-progress-dashboard",
    "profileSchemaChange": False,
    "learningContentChange": False,
    "cloudRuntimeChange": False,
    "cssSourcePath": CSS_SOURCE.relative_to(ROOT).as_posix(),
    "cssSourceSha256": sha_bytes(CSS_SOURCE.read_bytes()),
    "htmlSourcePath": HTML_SOURCE.relative_to(ROOT).as_posix(),
    "htmlSourceSha256": sha_bytes(HTML_SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

print(f"FEQUEST_V352_MATERIALIZED already={int(result['already_materialized'])} css-marker=1")
