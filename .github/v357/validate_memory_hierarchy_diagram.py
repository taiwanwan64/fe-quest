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


shell_356 = (ROOT / "app/base-shell-v356.html").read_text()
shell_357_path = ROOT / "app/base-shell-v357.html"
shell_357 = shell_357_path.read_text()
css_356 = (ROOT / "assets/app-v356.css").read_text()
css_357_path = ROOT / "assets/app-v357.css"
css_357 = css_357_path.read_text()
css_source_path = ROOT / "app/memory-hierarchy-diagram-v357.css"
css_source = css_source_path.read_text().strip()
js_356 = (ROOT / "assets/app-v356.js").read_text()
js_357_path = ROOT / "assets/app-v357.js"
js_357 = js_357_path.read_text()
js_source_path = ROOT / "app/memory-hierarchy-diagram-v357.js"
js_source = js_source_path.read_text().strip()
manifest = json.loads((ROOT / "assets/asset-manifest-v357.json").read_text())

check("production index selects v357 shell", "app/base-shell-v357.html" in (ROOT / "index.html").read_text())
check("shell title and split assets are v357", all(token in shell_357 for token in (
    "<title>FE QUEST PWA v357</title>",
    "./assets/app-v357.css",
    "./assets/app-v357.js",
)))
expected_shell = shell_356.replace("v356", "v357").replace("V356", "V357")
check("shell changes only by release version", shell_357 == expected_shell)

expected_css = css_356.rstrip() + "\n\n" + css_source + "\n"
check("v357 css is exactly v356 plus reviewed memory source", css_357 == expected_css)
check("memory hierarchy css marker is unique", css_357.count("v357: memory speed/capacity hierarchy lesson diagram") == 1)
check("four tier widths increase toward storage", all(token in css_source for token in (
    ".core-memory-level-register-v357{width:46%",
    ".core-memory-level-cache-v357{width:61%",
    ".core-memory-level-main-v357{width:79%",
    ".core-memory-level-storage-v357{width:100%",
)))
check("desktop and narrow hierarchy layouts are bounded", all(token in css_source for token in (
    ".core-memory-stage-v357{display:grid;grid-template-columns:72px minmax(0,1fr) 72px",
    "@media(max-width:640px)",
    ".core-memory-stage-v357{grid-template-columns:minmax(0,1fr)",
    "@media(max-width:390px)",
)))

expected_js = js_356.replace("const APP_VERSION = 'v356';", "const APP_VERSION = 'v357';", 1)
function_anchor = "function coreTopicArticleView(id){"
expected_js = expected_js.replace(function_anchor, js_source + "\n\n" + function_anchor, 1)
old_mount = "      ${coreTopicSubnetBoundaryDiagramViewV356(id)}"
new_mount = "      ${coreTopicSubnetBoundaryDiagramViewV356(id)}\n      ${coreTopicMemoryHierarchyDiagramViewV357(id)}"
expected_js = expected_js.replace(old_mount, new_mount, 1)
check("javascript change is limited to version, reviewed renderer, and mount", js_357 == expected_js)
check("memory renderer and mount are unique", js_357.count("function coreTopicMemoryHierarchyDiagramViewV357(id)") == 1 and js_357.count("${coreTopicMemoryHierarchyDiagramViewV357(id)}") == 1)
check("diagram is limited to memory devices lesson", "if(id!=='core_04_03')return '';" in js_source)
check("memory levels are complete and ordered", all(token in js_source for token in (
    "level('register','レジスタ'",
    "level('cache','キャッシュ'",
    "level('main','主記憶（RAM）'",
    "level('storage','補助記憶'",
)))
check("speed and capacity trends are explicit", all(token in js_source for token in (
    "CPUに近いほど高速・小容量",
    "下へ行くほど一般に低速",
    "上ほど高速、下ほど低速",
    "上ほど小容量、下ほど大容量",
)))
check("roles and persistence are explained", all(token in js_source for token in (
    "今すぐ使う値を保持",
    "よく使うデータを一時保持",
    "実行中のプログラムを保持",
    "大容量・電源断後も保持",
)))
check("diagram is explanatory without forced interaction", "<button" not in js_source and "onclick" not in js_source)
check("profile schema remains v5", js_357.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "PROFILE_SCHEMA_VERSION = 6" not in js_357)
check("question bank count contract remains", "QUESTION_BANK.length===710" in js_357)
check("cloud activation remains pinned", shell_357.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)

check("manifest identifies v357", manifest.get("version") == "v357" and manifest.get("previousVersion") == "v356")
diagram = manifest.get("memoryHierarchyDiagram") or {}
check("manifest records narrow non-data diagram boundary", all((
    diagram.get("version") == "v357",
    diagram.get("scope") == "core-04-03-memory-speed-capacity-hierarchy-diagram",
    diagram.get("profileSchemaChange") is False,
    diagram.get("questionBankChange") is False,
    diagram.get("curriculumTextChange") is False,
    diagram.get("cloudRuntimeChange") is False,
    diagram.get("interactionRequired") is False,
    diagram.get("jsSourceSha256") == sha256(js_source_path),
    diagram.get("cssSourceSha256") == sha256(css_source_path),
)))
asset_rows = {row["path"]: row for row in manifest.get("assets", [])}
check("manifest CSS identity is current", asset_rows["assets/app-v357.css"]["sha256"] == sha256(css_357_path))
check("manifest JS identity is current", asset_rows["assets/app-v357.js"]["sha256"] == sha256(js_357_path))
check("manifest shell identity is current", manifest["shell"]["sha256"] == sha256(shell_357_path))

sw = (ROOT / "sw.js").read_text()
check("service worker uses isolated v357 cache", all(token in sw for token in (
    "const APP_VERSION = 'v357';",
    "fe-quest-v357-1",
    "./assets/app-v357.css",
    "./assets/app-v357.js",
    "./assets/asset-manifest-v357.json",
)))
syntax = subprocess.run(["node", "--check", str(js_357_path)], capture_output=True, text=True)
check("v357 javascript syntax", syntax.returncode == 0)

print(f"PASS — V357 MEMORY HIERARCHY DIAGRAM STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
