from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
checks = []


def check(name, condition):
    checks.append((name, bool(condition)))
    if not condition:
        raise AssertionError(name)


def read(path):
    return (ROOT / path).read_text()


def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


js_source_path = "app/critical-path-diagram-v359.js"
css_source_path = "app/critical-path-diagram-v359.css"
source = read(js_source_path).strip()
css = read(css_source_path).strip()
js = read("assets/app-v359.js")
shell = read("app/base-shell-v359.html")
manifest = json.loads(read("assets/asset-manifest-v359.json"))

check("production index selects v359", "app/base-shell-v359.html" in read("index.html"))
check("shell changes only by version", shell == read("app/base-shell-v358.html").replace("v358", "v359").replace("V358", "V359"))
check("stylesheet is exactly previous plus reviewed source", read("assets/app-v359.css") == read("assets/app-v358.css").rstrip() + "\n\n" + css + "\n")
check("CSS marker appears once", read("assets/app-v359.css").count("v359: critical path duration comparison lesson diagram") == 1)

expected_js = read("assets/app-v358.js").replace("const APP_VERSION = 'v358';", "const APP_VERSION = 'v359';", 1)
anchor = "function coreTopicArticleView(id){"
expected_js = expected_js.replace(anchor, source + "\n\n" + anchor, 1)
mount = "      ${coreTopicLogicAutomataTraceDiagramViewV358(id)}"
expected_js = expected_js.replace(mount, mount + "\n      ${coreTopicCriticalPathDiagramViewV359(id)}", 1)
check("runtime changes only by version renderer and mount", js == expected_js)
check("renderer appears once", js.count("function coreTopicCriticalPathDiagramViewV359(id)") == 1)
check("mount appears once", js.count("${coreTopicCriticalPathDiagramViewV359(id)}") == 1)

# Execute the actual renderer, including its non-target early-return boundary.
render = subprocess.run(["node", "-e", source + "\nconsole.log(JSON.stringify({target:coreTopicCriticalPathDiagramViewV359('core_14_04'),other:['core_02_02','core_02_04','core_04_03','core_14_05','',null].map(coreTopicCriticalPathDiagramViewV359)}))"], capture_output=True, text=True, check=True)
html = json.loads(render.stdout)
check("renderer is limited to target lesson", bool(html["target"]) and html["other"] == [""] * 6)
target = html["target"]
check("figure has accessible caption", 'aria-labelledby="coreCriticalPathCaptionV359"' in target and 'id="coreCriticalPathCaptionV359"' in target)
check("paths have accessible names", all(f'aria-labelledby="coreCpRoute{x}V359"' in target for x in "AB"))
check("parallel AND-join is explicit", "両方の作業が終わったら完了" in target and "どちらか一方を選ぶのではありません" in target and "両方の完了を待つ" in target)
check("task order and duration data match", all(token in target for token in ('data-days="3"><span>作業A1</span><b>3日</b>', 'data-days="4"><span>作業A2</span><b>4日</b>', 'data-days="2"><span>作業B1</span><b>2日</b>', 'data-days="3"><span>作業B2</span><b>3日</b>')))
check("path sums match lesson example", '3 + 4 = <b>7日</b>' in target and '2 + 3 = <b>5日</b>' in target)
check("whole duration is maximum not sum", "max(7, 5) = 7" in target and "12日としない" in target)
check("float and critical path are identified", 'data-route="A" data-duration="7" data-float="0"' in target and 'data-route="B" data-duration="5" data-float="2"' in target)
check("delay examples are correct and scoped", "Aが1日遅れると全体も8日" in target and "Bの遅れが合計2日以内" in target and "全体は7日のまま" in target)
check("resource and precedence assumptions are explicit", "同時に進める人員・設備" in target and "上の作業が終わってから次へ" in target and "節点自体に所要時間はありません" in target)
check("task count is not confused with duration", "作業数ではなく、時間の合計" in target)
check("diagram does not add controls or side effects", all(token not in source for token in ("<button", "onclick", "localStorage", "fetch(", "saveProfile", "addEventListener")))
check("parallel layout is preserved on small screens", "grid-template-columns:repeat(2,minmax(0,1fr))" in css and "@media(max-width:390px)" in css and ".core-cp-tasks-v359 li{flex-direction:column" in css)
check("profile schema stays v5", js.count("const PROFILE_SCHEMA_VERSION = 5;") == 1)
check("710 question contract preserved", "QUESTION_BANK.length===710" in js)
check("cloud activation remains pinned", shell.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)
check("manifest versions are current", manifest.get("version") == "v359" and manifest.get("previousVersion") == "v358")
diagram = manifest.get("criticalPathDiagram", {})
check("manifest records non-data scope", diagram.get("version") == "v359" and diagram.get("scope") == ["core-14-04-critical-path-comparison"] and all(diagram.get(key) is False for key in ("profileSchemaChange", "questionBankChange", "curriculumTextChange", "cloudRuntimeChange", "interactionRequired")))
check("renderer source hash matches", diagram.get("jsSourceSha256") == sha(js_source_path))
check("style source hash matches", diagram.get("cssSourceSha256") == sha(css_source_path))
assets = {row["path"]: row for row in manifest["assets"]}
for path in ("assets/app-v359.css", "assets/app-v359.js"):
    check("asset identity " + path, assets[path]["sha256"] == sha(path))
check("shell identity matches", manifest["shell"]["sha256"] == sha("app/base-shell-v359.html"))
check("SW version and precache updated", all(token in read("sw.js") for token in ("const APP_VERSION = 'v359';", "fe-quest-v359-1", "./assets/app-v359.css", "./assets/app-v359.js", "./assets/asset-manifest-v359.json")))
check("web manifest name updated", json.loads(read("manifest.webmanifest"))["name"] == "FE QUEST v359")
syntax = subprocess.run(["node", "--check", str(ROOT / "assets/app-v359.js")], capture_output=True, text=True)
check("runtime JS syntax passes", syntax.returncode == 0)

print(f"PASS — V359 CRITICAL PATH STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
