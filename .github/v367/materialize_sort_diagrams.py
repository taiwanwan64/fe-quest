from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes, transform_js

PREVIOUS, TARGET = "v366", "v367"
JS_SOURCE = ROOT / "app/sort-diagrams-v367.js"
CSS_SOURCE = ROOT / "app/sort-diagrams-v367.css"
result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)

if not result["already_materialized"]:
    target["css"].write_text(previous["css"].read_text().rstrip() + "\n\n" + CSS_SOURCE.read_text().strip() + "\n")
    js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
    source = JS_SOURCE.read_text().strip()
    anchor = "function coreTopicArticleView(id){"
    assert js.count(anchor) == 1
    js = js.replace(anchor, source + "\n\n" + anchor, 1)
    mount = "      ${coreTopicSearchDiagramViewV366(id)}"
    assert js.count(mount) == 1
    js = js.replace(mount, mount + "\n      ${coreTopicSortDiagramViewV367(id)}", 1)
    mock_visual = """      searchMode:['linear_search','binary_search_b'].includes(ex.id)?ex.id:null,searchState:structuredClone(step.state||null),
      array:structuredClone(ex.array||null),arrayState:structuredClone(step.arrayState||null),"""
    assert js.count(mock_visual) == 1
    js = js.replace(mock_visual, """      searchMode:['linear_search','binary_search_b'].includes(ex.id)?ex.id:null,searchState:structuredClone(step.state||null),
      sortMode:['bubble_sort_b','selection_sort_b'].includes(ex.id)?ex.id:null,sortState:structuredClone(step.state||null),sortLine:step.line,sortMessage:step.msg,
      array:structuredClone(ex.array||null),arrayState:structuredClone(step.arrayState||null),""", 1)
    mock_array = """  if(v.array){const arr=v.arrayState||v.array;if(v.searchMode)return searchTraceViewV366(v.searchMode,arr,v.target,{state:v.searchState||{},focus:v.focus,found:v.found});return `<div class=\"trace-array\">${arr.map((x,i)=>`<div class=\"trace-array-cell ${v.focus===i?'focus':''} ${v.found===i?'found':''}\">${escapeHtml(x)}<span class=\"trace-array-index\">${i}</span></div>`).join('')}</div>${v.target!==undefined?`<div class=\"visit-path\">target = ${escapeHtml(v.target)}</div>`:''}`;}"""
    assert js.count(mock_array) == 1
    mock_replacement = """  if(v.array){const arr=v.arrayState||v.array;if(v.searchMode)return searchTraceViewV366(v.searchMode,arr,v.target,{state:v.searchState||{},focus:v.focus,found:v.found});if(v.sortMode)return sortTraceViewV367(v.sortMode,arr,{state:v.sortState||{},focus:v.focus,line:v.sortLine,msg:v.sortMessage});return `<div class=\"trace-array\">${arr.map((x,i)=>`<div class=\"trace-array-cell ${v.focus===i?'focus':''} ${v.found===i?'found':''}\">${escapeHtml(x)}<span class=\"trace-array-index\">${i}</span></div>`).join('')}</div>${v.target!==undefined?`<div class=\"visit-path\">target = ${escapeHtml(v.target)}</div>`:''}`;}"""
    js = js.replace(mock_array, mock_replacement, 1)
    lab_search = """    if(currentB.id==='linear_search'||currentB.id==='binary_search_b'){
      v.innerHTML=searchTraceViewV366(currentB.id,arr,currentB.target,step);
      return;
    }"""
    assert js.count(lab_search) == 1
    js = js.replace(lab_search, lab_search + """
    if(currentB.id==='bubble_sort_b'||currentB.id==='selection_sort_b'){
      v.innerHTML=sortTraceViewV367(currentB.id,arr,step);
      return;
    }""", 1)
    target["js"].write_text(js)
    manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
        "version": PREVIOUS,
        "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
        "shellSha256": sha_bytes(previous["shell"].read_bytes()),
        "cssSha256": sha_bytes(previous["css"].read_bytes()),
        "jsSha256": sha_bytes(previous["js"].read_bytes()),
    })
    manifest["sortDiagrams"] = {
        "version": TARGET,
        "scope": ["core_03_03", "bubble_sort_b-trace", "selection_sort_b-trace", "sort-mini-mock"],
        "profileSchemaChange": False, "questionBankChange": False,
        "questionContractChange": False, "curriculumTextChange": False,
        "cloudRuntimeChange": False, "coreInteractionRequired": False,
        "traceProgressionChange": False,
        "presentation": ["adjacent-comparison", "minimum-position", "swap-timing", "fixed-boundary"],
        "jsSourcePath": JS_SOURCE.relative_to(ROOT).as_posix(),
        "jsSourceSha256": sha_bytes(JS_SOURCE.read_bytes()),
        "cssSourcePath": CSS_SOURCE.relative_to(ROOT).as_posix(),
        "cssSourceSha256": sha_bytes(CSS_SOURCE.read_bytes()),
    }
    target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"FEQUEST_V367_MATERIALIZED already={int(result['already_materialized'])}")
