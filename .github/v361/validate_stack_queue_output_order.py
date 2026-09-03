from pathlib import Path
import hashlib
import json
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

js = read("assets/app-v361.js")
expected = read("assets/app-v360.js").replace("const APP_VERSION = 'v360';", "const APP_VERSION = 'v361';", 1)
for before, after in [
    ("<span>残り（底 → 頂上）</span><code>A → B</code>", "<span>残りを取り出す順</span><code>B → A</code>"),
    ("<span>残り（先頭 → 末尾）</span><code>B → C</code>", "<span>残りを取り出す順</span><code>B → C</code>"),
]:
    assert expected.count(before) == 1
    expected = expected.replace(before, after, 1)
check("runtime changes only version and two result-card labels/orders", js == expected)
check("CSS is byte-identical to v360", sha("assets/app-v361.css") == sha("assets/app-v360.css"))
check("shell changes only release references", read("app/base-shell-v361.html") == read("app/base-shell-v360.html").replace("v360", "v361").replace("V360", "V361"))
check("production index selects v361", read("index.html") == "---\n---\n{% include_relative app/base-shell-v361.html %}\n")
check("profile schema stays v5", js.count("const PROFILE_SCHEMA_VERSION = 5;") == 1)
check("question bank stays 710", "QUESTION_BANK.length===710" in js)
manifest = json.loads(read("assets/asset-manifest-v361.json"))
check("manifest release ancestry", manifest["version"] == "v361" and manifest["previousVersion"] == "v360")
for key, path in [("assetManifestSha256", "assets/asset-manifest-v360.json"), ("shellSha256", "app/base-shell-v360.html"), ("cssSha256", "assets/app-v360.css"), ("jsSha256", "assets/app-v360.js")]:
    check("baseline hash " + path, manifest["sourceRelease"][key] == sha(path))
for asset in manifest["assets"]:
    check("asset hash " + asset["path"], asset["sha256"] == sha(asset["path"]) and asset["utf8Bytes"] == len((ROOT / asset["path"]).read_bytes()))
check("shell hash", manifest["shell"]["sha256"] == sha("app/base-shell-v361.html"))
patch = manifest["stackQueueOutputOrder"]
check("patch provenance", patch["sourcePath"] == "app/stack-queue-output-order-v361.json" and patch["sourceSha256"] == sha(patch["sourcePath"]))
check("manifest semantic contract", patch["scope"] == "core_03_01" and patch["label"] == "残りを取り出す順" and patch["stackAfterOnePop"] == ["B", "A"] and patch["queueAfterOneDequeue"] == ["B", "C"])
check("manifest unchanged boundaries", all(patch[k] is False for k in ("operationLogicChange", "profileSchemaChange", "questionBankChange")))
check("cloud assets unchanged", manifest["cloudActivation"] == json.loads(read("assets/asset-manifest-v360.json"))["cloudActivation"])
check("SW current version and precache", all(t in read("sw.js") for t in ("const APP_VERSION = 'v361';", "fe-quest-v361-1", "./assets/app-v361.js", "./assets/app-v361.css", "./assets/asset-manifest-v361.json")))
check("web manifest current version", json.loads(read("manifest.webmanifest"))["name"] == "FE QUEST v361")
for label, command in [
    ("runtime JS syntax", ["node", "--check", "assets/app-v361.js"]),
    ("unchanged v360 reducer and renderer tests", ["node", ".github/v360/test_stack_queue_model.cjs"]),
    ("v361 rendered order agrees with actual operations", ["node", ".github/v361/test_stack_queue_output_order.cjs"]),
]:
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    print(result.stdout)
    check(label, result.returncode == 0)
print(f"PASS — V361 OUTPUT ORDER STATIC CONTRACT {len(checks)}/{len(checks)}")
