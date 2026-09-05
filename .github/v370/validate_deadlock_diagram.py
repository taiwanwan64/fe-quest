from pathlib import Path
import hashlib, json, subprocess

ROOT=Path(__file__).resolve().parents[2];checks=[]
def check(name,condition): checks.append(name); assert condition,name
def read(path): return (ROOT/path).read_text()
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
source_path="app/deadlock-diagram-v370.js";style_path="app/deadlock-diagram-v370.css"
source,style=read(source_path).strip(),read(style_path).strip();js_369,js_370=read("assets/app-v369.js"),read("assets/app-v370.js");css_369,css_370=read("assets/app-v369.css"),read("assets/app-v370.css");shell_369,shell_370=read("app/base-shell-v369.html"),read("app/base-shell-v370.html");manifest=json.loads(read("assets/asset-manifest-v370.json"))
check("production index selects v370","app/base-shell-v370.html" in read("index.html"))
check("shell only changes release references",shell_370==shell_369.replace("v369","v370").replace("V369","V370"))
check("CSS is v369 plus reviewed source",css_370==css_369.rstrip()+"\n\n"+style+"\n")
check("CSS marker is unique",css_370.count("v370: database deadlock wait-cycle diagram")==1)
expected=js_369.replace("const APP_VERSION = 'v369';","const APP_VERSION = 'v370';",1);anchor="function coreTopicArticleView(id){";expected=expected.replace(anchor,source+"\n\n"+anchor,1);mount="      ${coreTopicSqlJoinDiagramViewV369(id)}";expected=expected.replace(mount,mount+"\n      ${coreTopicDeadlockDiagramViewV370(id)}",1)
check("runtime diff is limited to deadlock presentation",js_370==expected)
check("renderer and mount unique",js_370.count("function coreTopicDeadlockDiagramViewV370(id)")==1 and js_370.count("${coreTopicDeadlockDiagramViewV370(id)}")==1)
check("diagram targets exclusion-control lesson","if(id!=='core_09_06')return '';" in source)
check("no persistence or network added",all(token not in source for token in ("localStorage","sessionStorage","indexedDB","fetch(","saveProfile","profile.")))
check("figure is static and accessible",'aria-labelledby="deadlockCaptionV370"' in source and "<button" not in source)
check("deadlock concepts explicit",all(token in source for token in ("デッドロック","循環待ち","商品表を保持したまま","注文表を保持したまま")))
check("mutual waits explicit",source.count('data-deadlock-state="wait"')==2 and all(token in source for token in ("処理Bが保持中 → 待機","処理Aが保持中 → 待機")))
check("prevention and recovery explained",all(token in source for token in ("ロック順序を統一","片方をROLLBACK","循環を切る")))
check("responsive layout explicit",all(token in style for token in ("@media(max-width:700px)","@media(max-width:390px)","grid-template-columns:repeat(2,minmax(0,1fr))")))
check("profile schema and questions unchanged",js_370.count("const PROFILE_SCHEMA_VERSION = 5;")==1 and "QUESTION_BANK.length===710" in js_370)
check("cloud loader unchanged",shell_370.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
check("manifest versions",manifest["version"]=="v370" and manifest["previousVersion"]=="v369")
diagram=manifest["deadlockDiagram"]
check("manifest boundaries",diagram["scope"]==["core_09_06"] and all(diagram[key] is False for key in ("profileSchemaChange","questionBankChange","questionContractChange","curriculumTextChange","progressionChange","persistenceChange","cloudRuntimeChange","coreInteractionRequired")))
check("source hashes",diagram["jsSourceSha256"]==sha(source_path) and diagram["cssSourceSha256"]==sha(style_path))
assets={row["path"]:row for row in manifest["assets"]}
for path in ("assets/app-v370.js","assets/app-v370.css"): check("asset hash "+path,assets[path]["sha256"]==sha(path) and assets[path]["utf8Bytes"]==len((ROOT/path).read_bytes()))
check("shell hash",manifest["shell"]["sha256"]==sha("app/base-shell-v370.html"))
check("service worker uses isolated v370 cache",all(token in read("sw.js") for token in ("const APP_VERSION = 'v370';","fe-quest-v370-1","./assets/app-v370.js","./assets/app-v370.css","./assets/asset-manifest-v370.json")))
check("web manifest names v370",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v370")
check("runtime JavaScript syntax",subprocess.run(["node","--check",str(ROOT/"assets/app-v370.js")],capture_output=True).returncode==0)
model=subprocess.run(["node",str(ROOT/".github/v370/test_deadlock_model.cjs")],capture_output=True,text=True);check("deadlock renderer model remains green",model.returncode==0);print(model.stdout)
print(f"PASS — V370 DEADLOCK STATIC CONTRACT {len(checks)}/{len(checks)}")
for name in checks: print("PASS "+name)
