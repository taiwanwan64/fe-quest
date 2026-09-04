from pathlib import Path
import hashlib
import json
import subprocess


ROOT = Path(__file__).resolve().parents[2]
checks = []


def check(name, condition):
    checks.append(name)
    assert condition, name


def read(path):
    return (ROOT / path).read_text()


def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


source_path = "app/sort-mobile-alignment-v368.css"
source = read(source_path).strip()
css_367 = read("assets/app-v367.css")
css_368 = read("assets/app-v368.css")
js_367 = read("assets/app-v367.js")
js_368 = read("assets/app-v368.js")
shell_367 = read("app/base-shell-v367.html")
shell_368 = read("app/base-shell-v368.html")
manifest = json.loads(read("assets/asset-manifest-v368.json"))

check("production index selects v368", "app/base-shell-v368.html" in read("index.html"))
check("shell change is version-only", shell_368 == shell_367.replace("v367", "v368").replace("V367", "V368"))
check("javascript change is version-only", js_368 == js_367.replace("const APP_VERSION = 'v367';", "const APP_VERSION = 'v368';", 1))
check("CSS is v367 plus reviewed override", css_368 == css_367.rstrip() + "\n\n" + source + "\n")
check("CSS marker is unique", css_368.count("v368: align sort panel headings on mobile") == 1)
check("override is mobile-scoped", "@media(max-width:700px)" in source)
check("panels explicitly share full width", ".sort-compare-v367>.sort-panel-v367{width:100%}" in source)
check("headings use one-column mobile grid", "grid-template-columns:minmax(0,1fr)" in source)
check("title and label stay on one line", source.count("white-space:nowrap") == 2)
check("no learner interaction or data access added", all(token not in source for token in ("button", "localStorage", "indexedDB", "fetch(", "profile")))
check("sort implementation remains unique", js_368.count("function coreTopicSortDiagramViewV367(id)") == 1 and js_368.count("function sortTraceViewV367(") == 1)
check("profile schema and question count unchanged", js_368.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "QUESTION_BANK.length===710" in js_368)
check("sort answer contracts unchanged", all(token in js_368 for token in ('"bubble_sort_b:1":"[1,5,4,2]"', '"bubble_sort_b:2":"[1,4,2,5]"', '"selection_sort_b:1":"1"', '"selection_sort_b:2":"3"')))
check("manifest versions", manifest["version"] == "v368" and manifest["previousVersion"] == "v367")
layout = manifest["sortMobileAlignment"]
check("manifest scope and viewport", layout["scope"] == "core_03_03-sort-panel-mobile-heading-and-width" and layout["reportedViewportCssWidth"] == 402)
check("manifest safety boundaries", all(layout[key] is False for key in ("profileSchemaChange", "questionBankChange", "questionContractChange", "curriculumTextChange", "progressionChange", "persistenceChange", "cloudRuntimeChange")))
check("manifest source identity", layout["sourcePath"] == source_path and layout["sourceSha256"] == sha(source_path))
assets = {row["path"]: row for row in manifest["assets"]}
for path in ("assets/app-v368.css", "assets/app-v368.js"):
    check("asset hash " + path, assets[path]["sha256"] == sha(path) and assets[path]["utf8Bytes"] == len((ROOT / path).read_bytes()))
check("shell hash", manifest["shell"]["sha256"] == sha("app/base-shell-v368.html"))
check("service worker uses isolated v368 cache", all(token in read("sw.js") for token in ("const APP_VERSION = 'v368';", "fe-quest-v368-1", "./assets/app-v368.css", "./assets/app-v368.js", "./assets/asset-manifest-v368.json")))
check("web manifest names v368", json.loads(read("manifest.webmanifest"))["name"] == "FE QUEST v368")
check("cloud loader unchanged", shell_368.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)
check("runtime JavaScript syntax", subprocess.run(["node", "--check", str(ROOT / "assets/app-v368.js")], capture_output=True).returncode == 0)
model = subprocess.run(["node", str(ROOT / ".github/v367/test_sort_model.cjs")], capture_output=True, text=True)
check("v367 sort renderer model remains green", model.returncode == 0)
print(model.stdout)

print(f"PASS — V368 SORT MOBILE ALIGNMENT STATIC CONTRACT {len(checks)}/{len(checks)}")
for name in checks:
    print("PASS " + name)
