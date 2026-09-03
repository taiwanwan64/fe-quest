from pathlib import Path
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
checks = []

def read(path):
    return (ROOT / path).read_text()

def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()

def check(name, condition):
    assert condition, name
    checks.append(name)
    print("PASS " + name)

def replace_function(text, name, replacement):
    match = re.search(rf"\bfunction\s+{re.escape(name)}\s*\([^)]*\)\s*\{{", text)
    assert match
    i, depth, quote, escape = match.end()-1, 0, None, False
    while i < len(text):
        char = text[i]
        if quote:
            if escape: escape = False
            elif char == "\\": escape = True
            elif char == quote: quote = None
        else:
            if char in "'\"`": quote = char
            elif char == "{": depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return text[:match.start()] + replacement.strip() + text[i+1:]
        i += 1
    raise AssertionError("unterminated " + name)

source_path = "app/complete-reset-readiness-v362.js"
source = read(source_path).strip()
previous = read("assets/app-v361.js")
expected = previous.replace("const APP_VERSION = 'v361';", "const APP_VERSION = 'v362';", 1)
expected = replace_function(expected, "readinessComponents", source)
js = read("assets/app-v362.js")

check("runtime changes only version and readiness calculation", js == expected)
check("full reset implementation is byte-identical", re.search(r"function resetLearningProfileCandidateV333\(\)[\s\S]*?globalThis\.installLearningDataResetV333=installLearningDataResetV333;", js).group() == re.search(r"function resetLearningProfileCandidateV333\(\)[\s\S]*?globalThis\.installLearningDataResetV333=installLearningDataResetV333;", previous).group())
check("neutral adaptive skill priors stay 50", all(f"'{name}': 50" in js for name in ("基礎理論","コンピュータ","データベース","ネットワーク","セキュリティ","アルゴリズム","マネジメント","ストラテジ")))
check("CSS is byte-identical", sha("assets/app-v362.css") == sha("assets/app-v361.css"))
check("shell changes only release references", read("app/base-shell-v362.html") == read("app/base-shell-v361.html").replace("v361","v362").replace("V361","V362"))
check("production index selects v362", read("index.html") == "---\n---\n{% include_relative app/base-shell-v362.html %}\n")
check("profile schema stays v5", js.count("const PROFILE_SCHEMA_VERSION = 5;") == 1)
check("question bank stays 710", "QUESTION_BANK.length===710" in js)

manifest = json.loads(read("assets/asset-manifest-v362.json"))
check("manifest release ancestry", manifest["version"] == "v362" and manifest["previousVersion"] == "v361")
for key,path in (("assetManifestSha256","assets/asset-manifest-v361.json"),("shellSha256","app/base-shell-v361.html"),("cssSha256","assets/app-v361.css"),("jsSha256","assets/app-v361.js")):
    check("baseline hash "+path, manifest["sourceRelease"][key] == sha(path))
for asset in manifest["assets"]:
    check("asset hash "+asset["path"], asset["sha256"] == sha(asset["path"]) and asset["utf8Bytes"] == len((ROOT/asset["path"]).read_bytes()))
check("shell hash", manifest["shell"]["sha256"] == sha("app/base-shell-v362.html"))
feature = manifest["completeResetReadiness"]
check("feature source hash", feature["sourceSha256"] == sha(source_path))
check("fresh dashboard contract", feature["freshSubjectAPractice"] == 0 and feature["freshReadiness"] == 0 and feature["neutralSkillPriorPreserved"] == 50)
check("persistence and data boundaries unchanged", all(feature[key] is False for key in ("resetPersistenceChange","profileSchemaChange","questionBankChange","cloudRuntimeChange")))
check("cloud runtime unchanged", manifest["cloudActivation"] == json.loads(read("assets/asset-manifest-v361.json"))["cloudActivation"])
check("SW current version and precache", all(token in read("sw.js") for token in ("const APP_VERSION = 'v362';","fe-quest-v362-1","./assets/app-v362.js","./assets/app-v362.css","./assets/asset-manifest-v362.json")))
check("web manifest current version", json.loads(read("manifest.webmanifest"))["name"] == "FE QUEST v362")
for label,command in (
    ("runtime JS syntax",["node","--check","assets/app-v362.js"]),
    ("fresh evidence model",["node",".github/v362/test_complete_reset_readiness.cjs"]),
    ("unchanged stack queue model",["node",".github/v360/test_stack_queue_model.cjs"]),
):
    result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    print(result.stdout)
    check(label,result.returncode==0)
print(f"PASS — V362 COMPLETE RESET STATIC CONTRACT {len(checks)}/{len(checks)}")
