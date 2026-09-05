from pathlib import Path
import hashlib, json, subprocess

ROOT=Path(__file__).resolve().parents[2];checks=[]
def check(name,condition): checks.append(name); assert condition,name
def read(path): return (ROOT/path).read_text()
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
source_path="app/sql-join-diagram-v369.js";style_path="app/sql-join-diagram-v369.css"
source,style=read(source_path).strip(),read(style_path).strip();js_368,js_369=read("assets/app-v368.js"),read("assets/app-v369.js");css_368,css_369=read("assets/app-v368.css"),read("assets/app-v369.css");shell_368,shell_369=read("app/base-shell-v368.html"),read("app/base-shell-v369.html");manifest=json.loads(read("assets/asset-manifest-v369.json"))
check("production index selects v369","app/base-shell-v369.html" in read("index.html"))
check("shell only changes release references",shell_369==shell_368.replace("v368","v369").replace("V368","V369"))
check("CSS is v368 plus reviewed source",css_369==css_368.rstrip()+"\n\n"+style+"\n")
check("CSS marker is unique",css_369.count("v369: SQL INNER JOIN and LEFT OUTER JOIN result diagram")==1)
expected=js_368.replace("const APP_VERSION = 'v368';","const APP_VERSION = 'v369';",1);anchor="function coreTopicArticleView(id){";expected=expected.replace(anchor,source+"\n\n"+anchor,1);mount="      ${coreTopicSortDiagramViewV367(id)}";expected=expected.replace(mount,mount+"\n      ${coreTopicSqlJoinDiagramViewV369(id)}",1)
check("runtime diff is limited to SQL join presentation",js_369==expected)
check("renderer and mount unique",js_369.count("function coreTopicSqlJoinDiagramViewV369(id)")==1 and js_369.count("${coreTopicSqlJoinDiagramViewV369(id)}")==1)
check("diagram targets SQL lesson","if(id!=='core_09_07')return '';" in source)
check("no persistence or network added",all(token not in source for token in ("localStorage","sessionStorage","indexedDB","fetch(","saveProfile","profile.")))
check("figure is static and accessible",'aria-labelledby="sqlJoinCaptionV369"' in source and "<button" not in source)
check("join concepts explicit",all(token in source for token in ("INNER JOIN","LEFT OUTER JOIN","employee.dept_id = department.dept_id","NULL","左表を残す")))
check("result cardinalities explicit",source.count("<p><b>2行</b>")==1 and source.count("<p><b>3行</b>")==1)
check("unmatched rows explained",all(token in source for token in ("dept_id = 10, 20","上田さんも残り","総務部（dept_id = 40）は結果に追加されません")))
check("responsive layout explicit",all(token in style for token in ("@media(max-width:820px)","@media(max-width:700px)","@media(max-width:390px)")))
check("profile schema and questions unchanged",js_369.count("const PROFILE_SCHEMA_VERSION = 5;")==1 and "QUESTION_BANK.length===710" in js_369)
check("cloud loader unchanged",shell_369.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
check("manifest versions",manifest["version"]=="v369" and manifest["previousVersion"]=="v368")
diagram=manifest["sqlJoinDiagram"]
check("manifest boundaries",diagram["scope"]==["core_09_07"] and all(diagram[key] is False for key in ("profileSchemaChange","questionBankChange","questionContractChange","curriculumTextChange","progressionChange","persistenceChange","cloudRuntimeChange","coreInteractionRequired")))
check("source hashes",diagram["jsSourceSha256"]==sha(source_path) and diagram["cssSourceSha256"]==sha(style_path))
assets={row["path"]:row for row in manifest["assets"]}
for path in ("assets/app-v369.js","assets/app-v369.css"): check("asset hash "+path,assets[path]["sha256"]==sha(path) and assets[path]["utf8Bytes"]==len((ROOT/path).read_bytes()))
check("shell hash",manifest["shell"]["sha256"]==sha("app/base-shell-v369.html"))
check("service worker uses isolated v369 cache",all(token in read("sw.js") for token in ("const APP_VERSION = 'v369';","fe-quest-v369-1","./assets/app-v369.js","./assets/app-v369.css","./assets/asset-manifest-v369.json")))
check("web manifest names v369",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v369")
check("runtime JavaScript syntax",subprocess.run(["node","--check",str(ROOT/"assets/app-v369.js")],capture_output=True).returncode==0)
model=subprocess.run(["node",str(ROOT/".github/v369/test_sql_join_model.cjs")],capture_output=True,text=True);check("SQL join renderer model remains green",model.returncode==0);print(model.stdout)
print(f"PASS — V369 SQL JOIN STATIC CONTRACT {len(checks)}/{len(checks)}")
for name in checks: print("PASS "+name)
