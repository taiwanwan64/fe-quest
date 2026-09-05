from pathlib import Path
import hashlib, json, subprocess

ROOT=Path(__file__).resolve().parents[2];checks=[]
def check(name,condition): checks.append(name); assert condition,name
def read(path): return (ROOT/path).read_text()
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
source_path="app/paging-diagram-v371.js";style_path="app/paging-diagram-v371.css"
source,style=read(source_path).strip(),read(style_path).strip();js_370,js_371=read("assets/app-v370.js"),read("assets/app-v371.js");css_370,css_371=read("assets/app-v370.css"),read("assets/app-v371.css");shell_370,shell_371=read("app/base-shell-v370.html"),read("app/base-shell-v371.html");manifest=json.loads(read("assets/asset-manifest-v371.json"))
check("production index selects v371","app/base-shell-v371.html" in read("index.html"))
check("shell only changes release references",shell_371==shell_370.replace("v370","v371").replace("V370","V371"))
check("CSS is v370 plus reviewed source",css_371==css_370.rstrip()+"\n\n"+style+"\n")
check("CSS marker is unique",css_371.count("v371: paging map and demand-page replacement diagram")==1)
expected=js_370.replace("const APP_VERSION = 'v370';","const APP_VERSION = 'v371';",1);anchor="function coreTopicArticleView(id){";expected=expected.replace(anchor,source+"\n\n"+anchor,1);mount="      ${coreTopicDeadlockDiagramViewV370(id)}";expected=expected.replace(mount,mount+"\n      ${coreTopicPagingDiagramViewV371(id)}",1)
check("runtime diff is limited to paging presentation",js_371==expected)
check("renderer and mount unique",js_371.count("function coreTopicPagingDiagramViewV371(id)")==1 and js_371.count("${coreTopicPagingDiagramViewV371(id)}")==1)
check("diagram targets OS lesson","if(id!=='core_06_01')return '';" in source)
check("no persistence or network added",all(token not in source for token in ("localStorage","sessionStorage","indexedDB","fetch(","saveProfile","profile.")))
check("figure is static and accessible",'aria-labelledby="pagingCaptionV371"' in source and "<button" not in source)
check("paging model and all four stages present",all(token in source for token in ("function pagingDiagramModelV371()", 'data-paging-step="fault"', 'data-paging-step="replace"', 'data-paging-step="load"', 'data-paging-step="resume"')))
check("conditional writeback and spare frame explained",all(token in source for token in ("未反映の変更があれば","空き枠があれば置換は不要","主記憶の容量が増えるわけではない","スラッシング")))
check("responsive layout explicit",all(token in style for token in ("@media(max-width:700px)","@media(max-width:390px)","grid-template-columns:repeat(2,minmax(0,1fr))")))
check("profile schema and questions unchanged",js_371.count("const PROFILE_SCHEMA_VERSION = 5;")==1 and "QUESTION_BANK.length===710" in js_371)
check("cloud loader unchanged",shell_371.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
check("manifest versions",manifest["version"]=="v371" and manifest["previousVersion"]=="v370")
diagram=manifest["pagingDiagram"]
check("manifest boundaries",diagram["scope"]==["core_06_01"] and all(diagram[key] is False for key in ("profileSchemaChange","questionBankChange","questionContractChange","curriculumTextChange","progressionChange","persistenceChange","cloudRuntimeChange","coreInteractionRequired")))
check("source hashes",diagram["jsSourceSha256"]==sha(source_path) and diagram["cssSourceSha256"]==sha(style_path))
assets={row["path"]:row for row in manifest["assets"]}
for path in ("assets/app-v371.js","assets/app-v371.css"): check("asset hash "+path,assets[path]["sha256"]==sha(path) and assets[path]["utf8Bytes"]==len((ROOT/path).read_bytes()))
check("shell hash",manifest["shell"]["sha256"]==sha("app/base-shell-v371.html"))
check("service worker uses isolated v371 cache",all(token in read("sw.js") for token in ("const APP_VERSION = 'v371';","fe-quest-v371-1","./assets/app-v371.js","./assets/app-v371.css","./assets/asset-manifest-v371.json")))
check("web manifest names v371",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v371")
check("runtime JavaScript syntax",subprocess.run(["node","--check",str(ROOT/"assets/app-v371.js")],capture_output=True).returncode==0)
model=subprocess.run(["node",str(ROOT/".github/v371/test_paging_model.cjs")],capture_output=True,text=True);check("paging renderer model remains green",model.returncode==0);print(model.stdout)
print(f"PASS — V371 PAGING STATIC CONTRACT {len(checks)}/{len(checks)}")
for name in checks: print("PASS "+name)
