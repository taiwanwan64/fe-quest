from pathlib import Path
import hashlib, json, subprocess

ROOT=Path(__file__).resolve().parents[2];checks=[]
def check(name,condition): checks.append(name); assert condition,name
def read(path): return (ROOT/path).read_text()
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
source_path="app/backup-diagram-v372.js";style_path="app/backup-diagram-v372.css"
source,style=read(source_path).strip(),read(style_path).strip();js_371,js_372=read("assets/app-v371.js"),read("assets/app-v372.js");css_371,css_372=read("assets/app-v371.css"),read("assets/app-v372.css");shell_371,shell_372=read("app/base-shell-v371.html"),read("app/base-shell-v372.html");manifest=json.loads(read("assets/asset-manifest-v372.json"))
check("production index selects v372","app/base-shell-v372.html" in read("index.html"))
check("shell only changes release references",shell_372==shell_371.replace("v371","v372").replace("V371","V372"))
check("CSS is v371 plus reviewed source",css_372==css_371.rstrip()+"\n\n"+style+"\n")
check("CSS marker is unique",css_372.count("v372: backup scope and restore-chain comparison")==1)
expected=js_371.replace("const APP_VERSION = 'v371';","const APP_VERSION = 'v372';",1);anchor="function coreTopicArticleView(id){";expected=expected.replace(anchor,source+"\n\n"+anchor,1);mount="      ${coreTopicPagingDiagramViewV371(id)}";expected=expected.replace(mount,mount+"\n      ${coreTopicBackupDiagramViewV372(id)}",1)
start=expected.index("function backupView(mode){");end=expected.index("\nfunction devPipeline(",start)
expected=expected[:start]+"function backupView(mode){\n  return backupDiagramViewV372(mode==='full'?'overview':mode);\n}"+expected[end:]
check("runtime diff is limited to backup presentation",js_372==expected)
check("renderer and mount unique",js_372.count("function coreTopicBackupDiagramViewV372(id)")==1 and js_372.count("${coreTopicBackupDiagramViewV372(id)}")==1)
check("diagram targets backup lesson","if(id!=='core_06_03')return '';" in source)
check("no persistence or network added",all(token not in source for token in ("localStorage","sessionStorage","indexedDB","fetch(","saveProfile","profile.")))
check("figure is static and accessible",'aria-labelledby="backupCaptionV372"' in source and "<button" not in source)
check("scope and restore chains explicit",all(token in source for token in ("backupDiagramModelV372", "data-backup-method", "data-restore-day", "直近のフル", "直前のバックアップ", "復元テスト")))
check("responsive layout explicit",all(token in style for token in ("@media(max-width:700px)","@media(max-width:390px)","grid-template-columns:repeat(3,minmax(0,1fr))")))
check("profile schema and questions unchanged",js_372.count("const PROFILE_SCHEMA_VERSION = 5;")==1 and "QUESTION_BANK.length===710" in js_372)
check("cloud loader unchanged",shell_372.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
check("manifest versions",manifest["version"]=="v372" and manifest["previousVersion"]=="v371")
diagram=manifest["backupDiagram"]
check("manifest boundaries",diagram["scope"]==["core_06_03"] and all(diagram[key] is False for key in ("profileSchemaChange","questionBankChange","questionContractChange","curriculumTextChange","progressionChange","persistenceChange","cloudRuntimeChange","coreInteractionRequired")))
check("source hashes",diagram["jsSourceSha256"]==sha(source_path) and diagram["cssSourceSha256"]==sha(style_path))
assets={row["path"]:row for row in manifest["assets"]}
for path in ("assets/app-v372.js","assets/app-v372.css"): check("asset hash "+path,assets[path]["sha256"]==sha(path) and assets[path]["utf8Bytes"]==len((ROOT/path).read_bytes()))
check("shell hash",manifest["shell"]["sha256"]==sha("app/base-shell-v372.html"))
check("service worker uses isolated v372 cache",all(token in read("sw.js") for token in ("const APP_VERSION = 'v372';","fe-quest-v372-1","./assets/app-v372.js","./assets/app-v372.css","./assets/asset-manifest-v372.json")))
check("web manifest names v372",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v372")
check("runtime JavaScript syntax",subprocess.run(["node","--check",str(ROOT/"assets/app-v372.js")],capture_output=True).returncode==0)
model=subprocess.run(["node",str(ROOT/".github/v372/test_backup_model.cjs")],capture_output=True,text=True);check("backup renderer model remains green",model.returncode==0);print(model.stdout)
print(f"PASS — V372 BACKUP STATIC CONTRACT {len(checks)}/{len(checks)}")
for name in checks: print("PASS "+name)
