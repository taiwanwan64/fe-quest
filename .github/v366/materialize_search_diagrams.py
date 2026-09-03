from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes, transform_js

PREVIOUS, TARGET = "v365", "v366"
JS_SOURCE = ROOT / "app/search-diagrams-v366.js"
CSS_SOURCE = ROOT / "app/search-diagrams-v366.css"
result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)

if not result["already_materialized"]:
    target["css"].write_text(previous["css"].read_text().rstrip() + "\n\n" + CSS_SOURCE.read_text().strip() + "\n")
    js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
    source = JS_SOURCE.read_text().strip()
    anchor = "function coreTopicArticleView(id){"
    assert js.count(anchor) == 1
    js = js.replace(anchor, source + "\n\n" + anchor, 1)
    mount = "      ${coreTopicLinkedListDiagramViewV365(id)}"
    assert js.count(mount) == 1
    js = js.replace(mount, mount + "\n      ${coreTopicSearchDiagramViewV366(id)}", 1)
    mock_visual = """    visual:{
      array:structuredClone(ex.array||null),arrayState:structuredClone(step.arrayState||null),"""
    assert js.count(mock_visual) == 1
    js = js.replace(mock_visual, """    visual:{
      searchMode:['linear_search','binary_search_b'].includes(ex.id)?ex.id:null,searchState:structuredClone(step.state||null),
      array:structuredClone(ex.array||null),arrayState:structuredClone(step.arrayState||null),""", 1)
    mock_array = """  if(v.array){const arr=v.arrayState||v.array;return `<div class=\"trace-array\">${arr.map((x,i)=>`<div class=\"trace-array-cell ${v.focus===i?'focus':''} ${v.found===i?'found':''}\">${escapeHtml(x)}<span class=\"trace-array-index\">${i}</span></div>`).join('')}</div>${v.target!==undefined?`<div class=\"visit-path\">target = ${escapeHtml(v.target)}</div>`:''}`;}"""
    assert js.count(mock_array) == 1
    mock_replacement = """  if(v.array){const arr=v.arrayState||v.array;if(v.searchMode)return searchTraceViewV366(v.searchMode,arr,v.target,{state:v.searchState||{},focus:v.focus,found:v.found});return `<div class=\"trace-array\">${arr.map((x,i)=>`<div class=\"trace-array-cell ${v.focus===i?'focus':''} ${v.found===i?'found':''}\">${escapeHtml(x)}<span class=\"trace-array-index\">${i}</span></div>`).join('')}</div>${v.target!==undefined?`<div class=\"visit-path\">target = ${escapeHtml(v.target)}</div>`:''}`;}"""
    js = js.replace(mock_array, mock_replacement, 1)
    lab_array = """  if(currentB.array){
    const arr=step.arrayState||currentB.array;
    v.innerHTML=`<div class=\"trace-array\">${"""
    assert js.count(lab_array) == 1
    lab_replacement = """  if(currentB.array){
    const arr=step.arrayState||currentB.array;
    if(currentB.id==='linear_search'||currentB.id==='binary_search_b'){
      v.innerHTML=searchTraceViewV366(currentB.id,arr,currentB.target,step);
      return;
    }
    v.innerHTML=`<div class=\"trace-array\">${"""
    js = js.replace(lab_array, lab_replacement, 1)
    target["js"].write_text(js)
    manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
        "version": PREVIOUS,
        "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
        "shellSha256": sha_bytes(previous["shell"].read_bytes()),
        "cssSha256": sha_bytes(previous["css"].read_bytes()),
        "jsSha256": sha_bytes(previous["js"].read_bytes()),
    })
    manifest["searchDiagrams"] = {
        "version": TARGET,
        "scope": ["core_03_03", "linear_search-trace", "binary_search_b-trace", "search-mini-mock"],
        "profileSchemaChange": False, "questionBankChange": False,
        "questionContractChange": False, "curriculumTextChange": False,
        "cloudRuntimeChange": False, "coreInteractionRequired": False,
        "traceProgressionChange": False,
        "presentation": ["linear-sequence", "binary-range", "low-mid-high", "discarded-range"],
        "jsSourcePath": JS_SOURCE.relative_to(ROOT).as_posix(),
        "jsSourceSha256": sha_bytes(JS_SOURCE.read_bytes()),
        "cssSourcePath": CSS_SOURCE.relative_to(ROOT).as_posix(),
        "cssSourceSha256": sha_bytes(CSS_SOURCE.read_bytes()),
    }
    target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"FEQUEST_V366_MATERIALIZED already={int(result['already_materialized'])}")
