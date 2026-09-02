from pathlib import Path
import hashlib
import json
import subprocess


ROOT = Path(__file__).resolve().parents[2]
checks: list[tuple[str, bool]] = []


def check(name: str, condition: bool) -> None:
    checks.append((name, bool(condition)))
    if not condition:
        raise AssertionError(name)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


shell_357 = (ROOT / "app/base-shell-v357.html").read_text()
shell_358_path = ROOT / "app/base-shell-v358.html"
shell_358 = shell_358_path.read_text()
css_357 = (ROOT / "assets/app-v357.css").read_text()
css_358_path = ROOT / "assets/app-v358.css"
css_358 = css_358_path.read_text()
css_source_path = ROOT / "app/logic-automata-trace-diagram-v358.css"
css_source = css_source_path.read_text().strip()
js_357 = (ROOT / "assets/app-v357.js").read_text()
js_358_path = ROOT / "assets/app-v358.js"
js_358 = js_358_path.read_text()
js_source_path = ROOT / "app/logic-automata-trace-diagram-v358.js"
js_source = js_source_path.read_text().strip()
manifest = json.loads((ROOT / "assets/asset-manifest-v358.json").read_text())

check("production index selects v358 shell", "app/base-shell-v358.html" in (ROOT / "index.html").read_text())
check("shell title and split assets are v358", all(token in shell_358 for token in (
    "<title>FE QUEST PWA v358</title>",
    "./assets/app-v358.css",
    "./assets/app-v358.js",
)))
expected_shell = shell_357.replace("v357", "v358").replace("V357", "V358")
check("shell changes only by release version", shell_358 == expected_shell)

expected_css = css_357.rstrip() + "\n\n" + css_source + "\n"
check("v358 css is exactly v357 plus reviewed trace source", css_358 == expected_css)
check("trace diagram css marker is unique", css_358.count("v358: logic gate and automata trace lesson diagrams") == 1)
check("logic desktop and mobile flows are explicit", all(token in css_source for token in (
    ".core-logic-flow-v358{display:grid;grid-template-columns:minmax(120px,.75fr) 34px minmax(210px,1.35fr) 34px minmax(150px,.9fr)",
    "@media(max-width:720px)",
    ".core-logic-flow-v358{grid-template-columns:minmax(0,1fr)",
)))
check("automata desktop and mobile traces are explicit", all(token in css_source for token in (
    ".core-automata-trace-v358{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))",
    ".core-automata-trace-v358{grid-template-columns:1fr",
    "@media(max-width:390px)",
)))

expected_js = js_357.replace("const APP_VERSION = 'v357';", "const APP_VERSION = 'v358';", 1)
function_anchor = "function coreTopicArticleView(id){"
expected_js = expected_js.replace(function_anchor, js_source + "\n\n" + function_anchor, 1)
old_mount = "      ${coreTopicMemoryHierarchyDiagramViewV357(id)}"
new_mount = "      ${coreTopicMemoryHierarchyDiagramViewV357(id)}\n      ${coreTopicLogicAutomataTraceDiagramViewV358(id)}"
expected_js = expected_js.replace(old_mount, new_mount, 1)
check("javascript change is limited to version, reviewed renderer, and mount", js_358 == expected_js)
check("trace renderer and mount are unique", js_358.count("function coreTopicLogicAutomataTraceDiagramViewV358(id)") == 1 and js_358.count("${coreTopicLogicAutomataTraceDiagramViewV358(id)}") == 1)
check("diagrams are limited to logic and automata lessons", js_source.count("id==='core_02_02'") == 1 and js_source.count("id==='core_02_04'") == 1)
check("logic gate calculation is correct", all(token in js_source for token in (
    "(A OR B) AND (NOT B)",
    "1 OR 0 = 1",
    "NOT 0 = 1",
    "1 AND 1 = 1",
    "出力 = 1",
)))
check("logic diagram exposes intermediate values", all(token in js_source for token in (
    "x = 1",
    "y = 1",
    "ゲートごとの値を書き込む",
)))
check("automata rules and input sequence are correct", all(token in js_source for token in (
    "入力<code>1</code>でAとBを切り替え",
    "入力<code>0</code>では現在状態を維持",
    "<b>1 → 0 → 1</b>",
    "最終状態：A",
)))
check("automata trace contains A B B A in order", js_source.count("core-state-a-v358") == 2 and js_source.count("core-state-b-v358") == 2 and js_source.index("core-state-a-v358") < js_source.index("core-state-b-v358"))
check("diagrams are explanatory without forced interaction", "<button" not in js_source and "onclick" not in js_source)
check("profile schema remains v5", js_358.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "PROFILE_SCHEMA_VERSION = 6" not in js_358)
check("question bank count contract remains", "QUESTION_BANK.length===710" in js_358)
check("cloud activation remains pinned", shell_358.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)

check("manifest identifies v358", manifest.get("version") == "v358" and manifest.get("previousVersion") == "v357")
diagram = manifest.get("logicAutomataTraceDiagrams") or {}
check("manifest records narrow non-data diagram boundary", all((
    diagram.get("version") == "v358",
    diagram.get("scope") == ["core-02-02-logic-gate-trace", "core-02-04-automata-state-trace"],
    diagram.get("profileSchemaChange") is False,
    diagram.get("questionBankChange") is False,
    diagram.get("curriculumTextChange") is False,
    diagram.get("cloudRuntimeChange") is False,
    diagram.get("interactionRequired") is False,
    diagram.get("jsSourceSha256") == sha256(js_source_path),
    diagram.get("cssSourceSha256") == sha256(css_source_path),
)))
asset_rows = {row["path"]: row for row in manifest.get("assets", [])}
check("manifest CSS identity is current", asset_rows["assets/app-v358.css"]["sha256"] == sha256(css_358_path))
check("manifest JS identity is current", asset_rows["assets/app-v358.js"]["sha256"] == sha256(js_358_path))
check("manifest shell identity is current", manifest["shell"]["sha256"] == sha256(shell_358_path))

sw = (ROOT / "sw.js").read_text()
check("service worker uses isolated v358 cache", all(token in sw for token in (
    "const APP_VERSION = 'v358';",
    "fe-quest-v358-1",
    "./assets/app-v358.css",
    "./assets/app-v358.js",
    "./assets/asset-manifest-v358.json",
)))
syntax = subprocess.run(["node", "--check", str(js_358_path)], capture_output=True, text=True)
check("v358 javascript syntax", syntax.returncode == 0)

print(f"PASS — V358 LOGIC/AUTOMATA TRACE DIAGRAM STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
