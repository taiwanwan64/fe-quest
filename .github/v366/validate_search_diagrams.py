from pathlib import Path
import hashlib, json, subprocess

ROOT = Path(__file__).resolve().parents[2]
checks=[]
def check(name,condition): checks.append(name); assert condition,name
def read(path): return (ROOT/path).read_text()
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()

source_path="app/search-diagrams-v366.js"; style_path="app/search-diagrams-v366.css"
source,style=read(source_path).strip(),read(style_path).strip();js=read("assets/app-v366.js");manifest=json.loads(read("assets/asset-manifest-v366.json"));shell=read("app/base-shell-v366.html")
check("production index selects v366","app/base-shell-v366.html" in read("index.html"))
check("shell only changes release references",shell==read("app/base-shell-v365.html").replace("v365","v366").replace("V365","V366"))
check("CSS is previous plus reviewed source",read("assets/app-v366.css")==read("assets/app-v365.css").rstrip()+"\n\n"+style+"\n")
check("CSS marker is unique",read("assets/app-v366.css").count("v366: linear and binary search diagrams and trace presentation")==1)
expected=read("assets/app-v365.js").replace("const APP_VERSION = 'v365';","const APP_VERSION = 'v366';",1)
anchor="function coreTopicArticleView(id){";expected=expected.replace(anchor,source+"\n\n"+anchor,1)
mount="      ${coreTopicLinkedListDiagramViewV365(id)}";expected=expected.replace(mount,mount+"\n      ${coreTopicSearchDiagramViewV366(id)}",1)
mock_visual="""    visual:{
      array:structuredClone(ex.array||null),arrayState:structuredClone(step.arrayState||null),"""
expected=expected.replace(mock_visual,"""    visual:{
      searchMode:['linear_search','binary_search_b'].includes(ex.id)?ex.id:null,searchState:structuredClone(step.state||null),
      array:structuredClone(ex.array||null),arrayState:structuredClone(step.arrayState||null),""",1)
mock_array="""  if(v.array){const arr=v.arrayState||v.array;return `<div class=\"trace-array\">${arr.map((x,i)=>`<div class=\"trace-array-cell ${v.focus===i?'focus':''} ${v.found===i?'found':''}\">${escapeHtml(x)}<span class=\"trace-array-index\">${i}</span></div>`).join('')}</div>${v.target!==undefined?`<div class=\"visit-path\">target = ${escapeHtml(v.target)}</div>`:''}`;}"""
mock_replacement="""  if(v.array){const arr=v.arrayState||v.array;if(v.searchMode)return searchTraceViewV366(v.searchMode,arr,v.target,{state:v.searchState||{},focus:v.focus,found:v.found});return `<div class=\"trace-array\">${arr.map((x,i)=>`<div class=\"trace-array-cell ${v.focus===i?'focus':''} ${v.found===i?'found':''}\">${escapeHtml(x)}<span class=\"trace-array-index\">${i}</span></div>`).join('')}</div>${v.target!==undefined?`<div class=\"visit-path\">target = ${escapeHtml(v.target)}</div>`:''}`;}"""
expected=expected.replace(mock_array,mock_replacement,1)
lab_array="""  if(currentB.array){
    const arr=step.arrayState||currentB.array;
    v.innerHTML=`<div class=\"trace-array\">${"""
lab_replacement="""  if(currentB.array){
    const arr=step.arrayState||currentB.array;
    if(currentB.id==='linear_search'||currentB.id==='binary_search_b'){
      v.innerHTML=searchTraceViewV366(currentB.id,arr,currentB.target,step);
      return;
    }
    v.innerHTML=`<div class=\"trace-array\">${"""
expected=expected.replace(lab_array,lab_replacement,1)
check("runtime diff is limited to search presentation",js==expected)
check("renderer and mount unique",js.count("function coreTopicSearchDiagramViewV366(id)")==1 and js.count("${coreTopicSearchDiagramViewV366(id)}")==1)
check("trace wired to lab and mock",js.count("searchTraceViewV366(")==3)
check("no persistence or network added",all(t not in source for t in ("localStorage","sessionStorage","indexedDB","fetch(","saveProfile","profile.")))
check("figure accessible and static",'aria-labelledby="searchCaptionV366"' in source and "<button" not in source)
check("comparison concepts explicit",all(t in source for t in ("未整列でも使える","昇順に整列済みが前提","O(n)","O(log n)","low","mid","high")))
check("trace values escaped","escapeHtml(value)" in source and "escapeHtml(target)" in source)
check("responsive layout explicit","@media(max-width:700px)" in style and "@media(max-width:390px)" in style)
check("profile schema and questions unchanged",js.count("const PROFILE_SCHEMA_VERSION = 5;")==1 and "QUESTION_BANK.length===710" in js)
check("answer contracts unchanged",all(t in js for t in ('"linear_search:1":"12"','"linear_search:2":"3"','"binary_search_b:1":"4"','"binary_search_b:2":"5"')))
check("cloud loader unchanged",shell.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
check("manifest versions",manifest["version"]=="v366" and manifest["previousVersion"]=="v365")
d=manifest["searchDiagrams"]
check("manifest boundaries",d["scope"]==["core_03_03","linear_search-trace","binary_search_b-trace","search-mini-mock"] and all(d[k] is False for k in ("profileSchemaChange","questionBankChange","questionContractChange","curriculumTextChange","cloudRuntimeChange","coreInteractionRequired","traceProgressionChange")))
check("source hashes",d["jsSourceSha256"]==sha(source_path) and d["cssSourceSha256"]==sha(style_path))
assets={a["path"]:a for a in manifest["assets"]}
for p in ("assets/app-v366.js","assets/app-v366.css"): check("asset hash "+p,assets[p]["sha256"]==sha(p))
check("shell hash",manifest["shell"]["sha256"]==sha("app/base-shell-v366.html"))
check("SW version and precache",all(t in read("sw.js") for t in ("const APP_VERSION = 'v366';","fe-quest-v366-1","./assets/app-v366.js","./assets/app-v366.css","./assets/asset-manifest-v366.json")))
check("web manifest name",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v366")
check("runtime JS syntax",subprocess.run(["node","--check",str(ROOT/"assets/app-v366.js")],capture_output=True).returncode==0)
model=subprocess.run(["node",str(ROOT/".github/v366/test_search_model.cjs")],capture_output=True,text=True);check("renderer model tests",model.returncode==0);print(model.stdout)
print(f"PASS — V366 SEARCH STATIC CONTRACT {len(checks)}/{len(checks)}")
for name in checks: print("PASS "+name)
