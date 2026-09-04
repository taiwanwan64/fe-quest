from pathlib import Path
import hashlib, json, subprocess

ROOT = Path(__file__).resolve().parents[2]
checks=[]
def check(name,condition): checks.append(name); assert condition,name
def read(path): return (ROOT/path).read_text()
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()

source_path="app/sort-diagrams-v367.js"; style_path="app/sort-diagrams-v367.css"
source,style=read(source_path).strip(),read(style_path).strip();js=read("assets/app-v367.js");manifest=json.loads(read("assets/asset-manifest-v367.json"));shell=read("app/base-shell-v367.html")
check("production index selects v367","app/base-shell-v367.html" in read("index.html"))
check("shell only changes release references",shell==read("app/base-shell-v366.html").replace("v366","v367").replace("V366","V367"))
check("CSS is previous plus reviewed source",read("assets/app-v367.css")==read("assets/app-v366.css").rstrip()+"\n\n"+style+"\n")
check("CSS marker is unique",read("assets/app-v367.css").count("v367: bubble and selection sort diagrams and trace presentation")==1)
expected=read("assets/app-v366.js").replace("const APP_VERSION = 'v366';","const APP_VERSION = 'v367';",1)
anchor="function coreTopicArticleView(id){";expected=expected.replace(anchor,source+"\n\n"+anchor,1)
mount="      ${coreTopicSearchDiagramViewV366(id)}";expected=expected.replace(mount,mount+"\n      ${coreTopicSortDiagramViewV367(id)}",1)
mock_visual="""      searchMode:['linear_search','binary_search_b'].includes(ex.id)?ex.id:null,searchState:structuredClone(step.state||null),
      array:structuredClone(ex.array||null),arrayState:structuredClone(step.arrayState||null),"""
expected=expected.replace(mock_visual,"""      searchMode:['linear_search','binary_search_b'].includes(ex.id)?ex.id:null,searchState:structuredClone(step.state||null),
      sortMode:['bubble_sort_b','selection_sort_b'].includes(ex.id)?ex.id:null,sortState:structuredClone(step.state||null),sortLine:step.line,sortMessage:step.msg,
      array:structuredClone(ex.array||null),arrayState:structuredClone(step.arrayState||null),""",1)
mock_array="""  if(v.array){const arr=v.arrayState||v.array;if(v.searchMode)return searchTraceViewV366(v.searchMode,arr,v.target,{state:v.searchState||{},focus:v.focus,found:v.found});return `<div class=\"trace-array\">${arr.map((x,i)=>`<div class=\"trace-array-cell ${v.focus===i?'focus':''} ${v.found===i?'found':''}\">${escapeHtml(x)}<span class=\"trace-array-index\">${i}</span></div>`).join('')}</div>${v.target!==undefined?`<div class=\"visit-path\">target = ${escapeHtml(v.target)}</div>`:''}`;}"""
mock_replacement="""  if(v.array){const arr=v.arrayState||v.array;if(v.searchMode)return searchTraceViewV366(v.searchMode,arr,v.target,{state:v.searchState||{},focus:v.focus,found:v.found});if(v.sortMode)return sortTraceViewV367(v.sortMode,arr,{state:v.sortState||{},focus:v.focus,line:v.sortLine,msg:v.sortMessage});return `<div class=\"trace-array\">${arr.map((x,i)=>`<div class=\"trace-array-cell ${v.focus===i?'focus':''} ${v.found===i?'found':''}\">${escapeHtml(x)}<span class=\"trace-array-index\">${i}</span></div>`).join('')}</div>${v.target!==undefined?`<div class=\"visit-path\">target = ${escapeHtml(v.target)}</div>`:''}`;}"""
expected=expected.replace(mock_array,mock_replacement,1)
lab_search="""    if(currentB.id==='linear_search'||currentB.id==='binary_search_b'){
      v.innerHTML=searchTraceViewV366(currentB.id,arr,currentB.target,step);
      return;
    }"""
expected=expected.replace(lab_search,lab_search+"""
    if(currentB.id==='bubble_sort_b'||currentB.id==='selection_sort_b'){
      v.innerHTML=sortTraceViewV367(currentB.id,arr,step);
      return;
    }""",1)
check("runtime diff is limited to sort presentation",js==expected)
check("renderer and mount unique",js.count("function coreTopicSortDiagramViewV367(id)")==1 and js.count("${coreTopicSortDiagramViewV367(id)}")==1)
check("trace wired to lab and mock",js.count("sortTraceViewV367(")==3)
check("no persistence or network added",all(t not in source for t in ("localStorage","sessionStorage","indexedDB","fetch(","saveProfile","profile.")))
check("figure accessible and static",'aria-labelledby="sortCaptionV367"' in source and "<button" not in source)
check("comparison concepts explicit",all(t in source for t in ("隣同士","minPos","1回では全体が完成するとは限らない","O(n²)")))
check("trace values escaped","escapeHtml(value)" in source and "escapeHtml(status)" in source)
check("responsive layout explicit","@media(max-width:700px)" in style and "@media(max-width:390px)" in style)
check("profile schema and questions unchanged",js.count("const PROFILE_SCHEMA_VERSION = 5;")==1 and "QUESTION_BANK.length===710" in js)
check("answer contracts unchanged",all(t in js for t in ('"bubble_sort_b:1":"[1,5,4,2]"','"bubble_sort_b:2":"[1,4,2,5]"','"selection_sort_b:1":"1"','"selection_sort_b:2":"3"')))
check("cloud loader unchanged",shell.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
check("manifest versions",manifest["version"]=="v367" and manifest["previousVersion"]=="v366")
d=manifest["sortDiagrams"]
check("manifest boundaries",d["scope"]==["core_03_03","bubble_sort_b-trace","selection_sort_b-trace","sort-mini-mock"] and all(d[k] is False for k in ("profileSchemaChange","questionBankChange","questionContractChange","curriculumTextChange","cloudRuntimeChange","coreInteractionRequired","traceProgressionChange")))
check("source hashes",d["jsSourceSha256"]==sha(source_path) and d["cssSourceSha256"]==sha(style_path))
assets={a["path"]:a for a in manifest["assets"]}
for p in ("assets/app-v367.js","assets/app-v367.css"): check("asset hash "+p,assets[p]["sha256"]==sha(p))
check("shell hash",manifest["shell"]["sha256"]==sha("app/base-shell-v367.html"))
check("SW version and precache",all(t in read("sw.js") for t in ("const APP_VERSION = 'v367';","fe-quest-v367-1","./assets/app-v367.js","./assets/app-v367.css","./assets/asset-manifest-v367.json")))
check("web manifest name",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v367")
check("runtime JS syntax",subprocess.run(["node","--check",str(ROOT/"assets/app-v367.js")],capture_output=True).returncode==0)
model=subprocess.run(["node",str(ROOT/".github/v367/test_sort_model.cjs")],capture_output=True,text=True);check("renderer model tests",model.returncode==0);print(model.stdout)
print(f"PASS — V367 SORT STATIC CONTRACT {len(checks)}/{len(checks)}")
for name in checks: print("PASS "+name)
