from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import transform_js

checks=[]

def read(path):
    return (ROOT/path).read_text()

def sha(path):
    return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()

def check(name,condition):
    assert condition,name
    checks.append(name)
    print("PASS "+name)

def function_block(text,name):
    match=re.search(rf"\bfunction\s+{re.escape(name)}\s*\([^)]*\)\s*\{{",text)
    assert match,name
    i,depth,quote,escape=match.end()-1,0,None,False
    while i<len(text):
        char=text[i]
        if quote:
            if escape: escape=False
            elif char=="\\": escape=True
            elif char==quote: quote=None
        else:
            if char in "'\"`": quote=char
            elif char=="{": depth+=1
            elif char=="}":
                depth-=1
                if depth==0: return text[match.start():i+1]
        i+=1
    raise AssertionError("unterminated "+name)

def replace_function(text,name,replacement):
    old=function_block(text,name)
    return text.replace(old,replacement.strip(),1)

source_path="app/memory-health-unmeasured-v363.js"
source=read(source_path).strip()
memory_source,render_source=[part.strip() for part in source.split("// FEQUEST_V363_RENDER_MEMORY_HEALTH",1)]
previous=read("assets/app-v362.js")
expected=transform_js(previous,"v362","v363")
expected=replace_function(expected,"memoryHealth",memory_source)
expected=replace_function(expected,"renderMemoryHealth",render_source)
js=read("assets/app-v363.js")

check("runtime changes only release version and two memory-health functions",js==expected)
check("empty memory evidence is numeric zero", "if(!attempted.length) return {attempted:0,avg:0,fresh:0,soon:0,due:0};" in function_block(js,"memoryHealth"))
check("unmeasured display is evidence-gated",all(token in function_block(js,"renderMemoryHealth") for token in ("const measured=h.attempted>0","measured?h.avg+'%':'未計測'","measured?'推定保持':'問題演習後に表示'","classList.toggle('is-unmeasured',!measured)")))
check("measured retention algorithm remains unchanged",function_block(js,"memoryHealth").replace("avg:0","avg:100").replace("  // An empty evidence set has no retention rate. Keep the numeric fallback at\n  // zero for downstream calculations; the dashboard presents it as unmeasured.\n","")==function_block(transform_js(previous,"v362","v363"),"memoryHealth"))
check("readiness calculation remains byte-identical after version transform",function_block(js,"readinessComponents")==function_block(transform_js(previous,"v362","v363"),"readinessComponents") and function_block(js,"calcReadiness")==function_block(transform_js(previous,"v362","v363"),"calcReadiness"))
check("full reset implementation remains byte-identical",function_block(js,"resetLearningProfileCandidateV333")==function_block(previous,"resetLearningProfileCandidateV333"))
check("profile schema stays v5",js.count("const PROFILE_SCHEMA_VERSION = 5;")==1)
check("question bank stays 710","QUESTION_BANK.length===710" in js)

old_ring='<div class="memory-ring" id="memoryHealthRing"><div><b id="memoryHealthValue">100%</b><span>推定保持</span></div></div>'
new_ring='<div class="memory-ring is-unmeasured" id="memoryHealthRing" role="img" aria-label="記憶保持率は未計測です"><div><b id="memoryHealthValue">未計測</b><span id="memoryHealthCaption">問題演習後に表示</span></div></div>'
expected_shell=read("app/base-shell-v362.html").replace("v362","v363").replace("V362","V363")
check("baseline shell contains one old ring",expected_shell.count(old_ring)==1)
expected_shell=expected_shell.replace(old_ring,new_ring,1)
check("shell changes only release references and memory-ring initial state",read("app/base-shell-v363.html")==expected_shell)
check("production index selects v363",read("index.html")=="---\n---\n{% include_relative app/base-shell-v363.html %}\n")

css_patch="""

/* ===== v363: unmeasured memory-health state ===== */
.memory-ring.is-unmeasured{--memory-p:0}
.memory-ring.is-unmeasured b{font-size:18px;line-height:1.2}
.memory-ring.is-unmeasured span{margin:4px auto 0;font-size:9px;line-height:1.3;white-space:nowrap}
@media(max-width:720px){
  .memory-ring.is-unmeasured b{font-size:16px}
  .memory-ring.is-unmeasured span{font-size:8px}
}
"""
check("CSS changes only unmeasured ring presentation",read("assets/app-v363.css")==read("assets/app-v362.css").rstrip()+css_patch)
check("unmeasured caption cannot wrap", ".memory-ring.is-unmeasured span{margin:4px auto 0;font-size:9px;line-height:1.3;white-space:nowrap}" in read("assets/app-v363.css"))

manifest=json.loads(read("assets/asset-manifest-v363.json"))
check("manifest release ancestry",manifest["version"]=="v363" and manifest["previousVersion"]=="v362")
for key,path in (("assetManifestSha256","assets/asset-manifest-v362.json"),("shellSha256","app/base-shell-v362.html"),("cssSha256","assets/app-v362.css"),("jsSha256","assets/app-v362.js")):
    check("baseline hash "+path,manifest["sourceRelease"][key]==sha(path))
for asset in manifest["assets"]:
    check("asset hash "+asset["path"],asset["sha256"]==sha(asset["path"]) and asset["utf8Bytes"]==len((ROOT/asset["path"]).read_bytes()))
check("shell hash",manifest["shell"]["sha256"]==sha("app/base-shell-v363.html"))
feature=manifest["memoryHealthUnmeasured"]
check("feature source hash",feature["sourceSha256"]==sha(source_path))
check("empty evidence contract",feature["emptyEvidenceAverage"]==0 and feature["emptyEvidenceLabel"]=="未計測" and feature["emptyEvidenceCaption"]=="問題演習後に表示")
check("data and calculation boundaries unchanged",feature["measuredRetentionUnchanged"] is True and all(feature[key] is False for key in ("readinessCalculationChange","resetPersistenceChange","profileSchemaChange","questionBankChange","cloudRuntimeChange")))
check("cloud runtime unchanged",manifest["cloudActivation"]==json.loads(read("assets/asset-manifest-v362.json"))["cloudActivation"])
check("SW current version and precache",all(token in read("sw.js") for token in ("const APP_VERSION = 'v363';","fe-quest-v363-1","./assets/app-v363.js","./assets/app-v363.css","./assets/asset-manifest-v363.json")))
check("web manifest current version",json.loads(read("manifest.webmanifest"))["name"]=="FE QUEST v363")

for label,command in (
    ("runtime JS syntax",["node","--check","assets/app-v363.js"]),
    ("memory-health semantic model",["node",".github/v363/test_memory_health_unmeasured.cjs"]),
    ("v362 readiness model remains green",["node",".github/v362/test_complete_reset_readiness.cjs"]),
    ("v360 stack queue model remains green",["node",".github/v360/test_stack_queue_model.cjs"]),
):
    result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    print(result.stdout)
    if result.stderr: print(result.stderr,file=sys.stderr)
    check(label,result.returncode==0)

print(f"PASS — V363 MEMORY HEALTH STATIC CONTRACT {len(checks)}/{len(checks)}")
