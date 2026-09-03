from pathlib import Path
import hashlib, json, subprocess
ROOT = Path(__file__).resolve().parents[2]
checks=[]
def check(name,condition): checks.append(name); assert condition,name
def read(path): return (ROOT/path).read_text()
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
source_path="app/linked-list-diagrams-v365.js"; style_path="app/linked-list-diagrams-v365.css"
source,style=read(source_path).strip(),read(style_path).strip();js=read("assets/app-v365.js");manifest=json.loads(read("assets/asset-manifest-v365.json"));shell=read("app/base-shell-v365.html")
check("production index selects v365","app/base-shell-v365.html" in read("index.html"))
check("shell only changes release references",shell==read("app/base-shell-v364.html").replace("v364","v365").replace("V364","V365"))
check("CSS is previous plus reviewed source",read("assets/app-v365.css")==read("assets/app-v364.css").rstrip()+"\n\n"+style+"\n")
check("CSS marker is unique",read("assets/app-v365.css").count("v365: linked-list diagrams and trace presentation")==1)
expected=read("assets/app-v364.js").replace("const APP_VERSION = 'v364';","const APP_VERSION = 'v365';",1)
anchor="function coreTopicArticleView(id){";expected=expected.replace(anchor,source+"\n\n"+anchor,1)
mount="      ${coreTopicStackQueueDiagramViewV360(id)}";expected=expected.replace(mount,mount+"\n      ${coreTopicLinkedListDiagramViewV365(id)}",1)
start=expected.index("  if(v.list){const visited=v.visited||[];return");end=expected.index("\n  if(v.bits)",start);expected=expected[:start]+"  if(v.list)return linkedListTraceViewV365(v.list,v.currentNode,v.visited||[]);"+expected[end:]
start=expected.index("  if(currentB.list){",expected.index("function renderBVisual(step){"));end=expected.index("\n  if(step.bits){",start);expected=expected[:start]+"  if(currentB.list){\n    v.innerHTML=linkedListTraceViewV365(currentB.list,step.currentNode,step.visited||[]);\n    return;\n  }\n"+expected[end:]
check("runtime diff is limited to linked-list presentation",js==expected)
check("renderer and mount unique",js.count("function coreTopicLinkedListDiagramViewV365(id)")==1 and js.count("${coreTopicLinkedListDiagramViewV365(id)}")==1)
check("trace wired to lab and mock",js.count("linkedListTraceViewV365(")==3)
check("no persistence or network added",all(t not in source for t in ("localStorage","sessionStorage","indexedDB","fetch(","saveProfile","profile.")))
check("figure accessible and explanatory",'aria-labelledby="llCaptionV365"' in source and "<button" not in source)
check("orders and insertion explicit","A → D → C" in source and "A → C → D" in source and source.index("B.next ← C")<source.index("A.next ← B"))
check("next and current pointer explicit","next: ${escapeHtml(next)}" in source and "現在の p" in source)
check("trace values escaped","escapeHtml(node?.value??'')" in source and "escapeHtml(nodeId)" in source)
check("responsive layout explicit","@media(max-width:700px)" in style and "@media(max-width:390px)" in style)
check("profile schema and questions unchanged",js.count("const PROFILE_SCHEMA_VERSION = 5;")==1 and "QUESTION_BANK.length===710" in js)
check("answer contracts unchanged",'"linked_list:1":"12"' in js and '"linked_list:2":"21"' in js)
check("cloud loader unchanged",shell.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
check("manifest versions",manifest["version"]=="v365" and manifest["previousVersion"]=="v364")
d=manifest["linkedListDiagrams"];check("manifest boundaries",d["scope"]==["core_03_01","linked_list-trace","linked_list-mini-mock"] and all(d[k] is False for k in ("profileSchemaChange","questionBankChange","questionContractChange","curriculumTextChange","cloudRuntimeChange","coreInteractionRequired","traceProgressionChange")))
check("source hashes",d["jsSourceSha256"]==sha(source_path) and d["cssSourceSha256"]==sha(style_path))
assets={a["path"]:a for a in manifest["assets"]}
for p in ("assets/app-v365.js","assets/app-v365.css"): check("asset hash "+p,assets[p]["sha256"]==sha(p))
check("shell hash",manifest["shell"]["sha256"]==sha("app/base-shell-v365.html"))
check("SW version and precache",all(t in read("sw.js") for t in ("const APP_VERSION = 'v365';","fe-quest-v365-1","./assets/app-v365.js","./assets/app-v365.css","./assets/asset-manifest-v365.json")))
check("web manifest name",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v365")
check("runtime JS syntax",subprocess.run(["node","--check",str(ROOT/"assets/app-v365.js")],capture_output=True).returncode==0)
model=subprocess.run(["node",str(ROOT/".github/v365/test_linked_list_model.cjs")],capture_output=True,text=True);check("renderer model tests",model.returncode==0);print(model.stdout)
print(f"PASS — V365 LINKED LIST STATIC CONTRACT {len(checks)}/{len(checks)}")
for name in checks: print("PASS "+name)
