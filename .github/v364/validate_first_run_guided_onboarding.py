from pathlib import Path
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import transform_js, transform_shell

checks=[]

def read(path):
    return (ROOT/path).read_text()

def sha(path):
    return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()

def check(name,condition):
    assert condition,name
    checks.append(name)
    print("PASS "+name)

source_path="app/first-run-guided-onboarding-v364.js"
source=read(source_path).strip()
previous_js=read("assets/app-v363.js")
expected_js=transform_js(previous_js,"v363","v364")
old_finish="document.getElementById('diagFinish')?.addEventListener('click',()=>{showScreen('home');refreshProfileUI();setTimeout(()=>document.getElementById('todayResumeBtn')?.click(),0)});"
new_finish="document.getElementById('diagFinish')?.addEventListener('click',()=>globalThis.finishGuidedDiagnosticV364());"
check("v363 contains the former automatic launch",expected_js.count(old_finish)==1)
expected_js=expected_js.replace(old_finish,new_finish,1)
for old,new in {
    '今日の期限はなし。「${weak}」を維持':'期限を迎えた復習問題はありません。「${weak}」の弱点問題で定着を確認します。',
    '今日の復習期限はなし。「${weak}」を補強':'期限を迎えた復習問題はありません。「${weak}」の弱点問題で定着を確認します。',
}.items():
    check("v363 contains former copy: "+old,expected_js.count(old)==1)
    expected_js=expected_js.replace(old,new,1)
expected_js=expected_js.rstrip()+"\n\n"+source+"\n"
js=read("assets/app-v364.js")
check("runtime is exact v363 transform plus bounded v364 onboarding",js==expected_js)
check("diagnostic finish no longer launches a daily task",old_finish not in js and new_finish in js and "autoLaunchAfterDiagnostic:false" in source)
check("diagnostic scoring remains inherited",source.count("function finishDiagnostic(")==0 and source.count("DIAG_QUESTIONS") == 0)
check("fresh navigation is locked",all(token in source for token in ("navigationLockedUntilDiagnostic:true","fequest-first-run-v364","!['home','diagnostic'].includes(id)")))
check("account is optional",all(token in source for token in ("accountRequired:false","ログインせずに始める","send-link")))
check("guided route reaches diagnostic then home",all(token in source for token in ("startDiagnosticFlow(false)","ensureTodayPlanSnapshot(true)","originalShowScreenV364('home'")))
check("existing learners bypass onboarding","firstRunExistingLearnerV364()" in source and "existingLearnerRouteChanged:false" in source)
check("clearer review copy is present",js.count("期限を迎えた復習問題はありません。")==2 and "今日の復習期限はなし" not in js and "今日の期限はなし" not in js)

previous_shell=transform_shell(read("app/base-shell-v363.html"),"v363","v364")
for old,new in {
    '目的を変えたいときだけ、ほかの演習を選べます。':'目的を変えたいときは、ほかの演習も選べます。',
    '診断結果を反映して学習を始める →':'ホーム画面へ →',
}.items():
    check("v363 shell contains former copy: "+old,previous_shell.count(old)==1)
    previous_shell=previous_shell.replace(old,new,1)
check("shell changes only release references and requested copy",read("app/base-shell-v364.html")==previous_shell)
check("production index selects v364",read("index.html")=="---\n---\n{% include_relative app/base-shell-v364.html %}\n")

css_marker="/* ===== v364: guided first-run onboarding ===== */"
css=read("assets/app-v364.css")
check("CSS inherits v363 and adds one onboarding layer",css.startswith(read("assets/app-v363.css").rstrip()+"\n\n"+css_marker) and css.count(css_marker)==1)
check("first-run desktop grid collapses to the guided route",all(token in css for token in (
    "body.fequest-first-run-v364 .app{grid-template-columns:minmax(0,1fr)!important}",
    "body.fequest-first-run-v364 header{grid-column:1!important}",
    "body.fequest-first-run-v364 .rightbar{display:none!important}",
)))
check("navigation and diagnostic back are hidden only during first run",all(token in css for token in ("body.fequest-first-run-v364 .sidebar{display:none!important}","body.fequest-first-run-v364 #diagnostic .screen-head .back{display:none!important}")))

manifest=json.loads(read("assets/asset-manifest-v364.json"))
check("manifest release ancestry",manifest["version"]=="v364" and manifest["previousVersion"]=="v363")
for key,path in (("assetManifestSha256","assets/asset-manifest-v363.json"),("shellSha256","app/base-shell-v363.html"),("cssSha256","assets/app-v363.css"),("jsSha256","assets/app-v363.js")):
    check("baseline hash "+path,manifest["sourceRelease"][key]==sha(path))
for asset in manifest["assets"]:
    check("asset hash "+asset["path"],asset["sha256"]==sha(asset["path"]) and asset["utf8Bytes"]==len((ROOT/asset["path"]).read_bytes()))
feature=manifest["guidedFirstRun"]
check("feature source hash",feature["sourceSha256"]==sha(source_path))
check("data boundaries unchanged",all(feature[key] is False for key in ("existingLearnerRouteChanged","diagnosticScoringChanged","profileSchemaChange","questionBankChange","cloudRuntimeChange")))
check("cloud activation is byte-contract unchanged",manifest["cloudActivation"]==json.loads(read("assets/asset-manifest-v363.json"))["cloudActivation"])
check("profile schema stays v5",js.count("const PROFILE_SCHEMA_VERSION = 5;")==1)
check("question bank stays 710","QUESTION_BANK.length===710" in js)
check("SW current version and precache",all(token in read("sw.js") for token in ("const APP_VERSION = 'v364';","fe-quest-v364-1","./assets/app-v364.js","./assets/app-v364.css","./assets/asset-manifest-v364.json")))
check("web manifest current version",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v364")

for label,command in (
    ("runtime JS syntax",["node","--check","assets/app-v364.js"]),
    ("v363 memory model remains green",["node",".github/v363/test_memory_health_unmeasured.cjs"]),
    ("v362 readiness model remains green",["node",".github/v362/test_complete_reset_readiness.cjs"]),
    ("v360 stack queue model remains green",["node",".github/v360/test_stack_queue_model.cjs"]),
):
    result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    if result.stdout:print(result.stdout)
    if result.stderr:print(result.stderr,file=sys.stderr)
    check(label,result.returncode==0)

print(f"PASS — V364 GUIDED FIRST RUN STATIC CONTRACT {len(checks)}/{len(checks)}")
