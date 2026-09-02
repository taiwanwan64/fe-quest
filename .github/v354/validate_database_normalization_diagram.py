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


shell_353 = (ROOT / "app/base-shell-v353.html").read_text()
shell_354_path = ROOT / "app/base-shell-v354.html"
shell_354 = shell_354_path.read_text()
css_353 = (ROOT / "assets/app-v353.css").read_text()
css_354_path = ROOT / "assets/app-v354.css"
css_354 = css_354_path.read_text()
css_source_path = ROOT / "app/database-normalization-diagram-v354.css"
css_source = css_source_path.read_text().strip()
js_353 = (ROOT / "assets/app-v353.js").read_text()
js_354_path = ROOT / "assets/app-v354.js"
js_354 = js_354_path.read_text()
js_source_path = ROOT / "app/database-normalization-diagram-v354.js"
js_source = js_source_path.read_text().strip()
manifest = json.loads((ROOT / "assets/asset-manifest-v354.json").read_text())

check("production index selects v354 shell", "app/base-shell-v354.html" in (ROOT / "index.html").read_text())
check("shell title and split assets are v354", all(token in shell_354 for token in (
    "<title>FE QUEST PWA v354</title>",
    "./assets/app-v354.css",
    "./assets/app-v354.js",
)))
expected_shell = shell_353.replace("v353", "v354").replace("V353", "V354")
check("shell changes only by release version", shell_354 == expected_shell)

expected_css = css_353.rstrip() + "\n\n" + css_source + "\n"
check("v354 css is exactly v353 plus reviewed database diagram source", css_354 == expected_css)
check("database diagram css marker is unique", css_354.count("v354: database normalization before-and-after lesson diagram") == 1)
check("desktop comparison and mobile stacked layouts are bounded", all(token in css_source for token in (
    "grid-template-columns:minmax(0,1.05fr) 72px minmax(0,1.35fr)",
    "@media(max-width:820px)",
    ".core-dbnorm-flow-v354{grid-template-columns:1fr",
    "@media(max-width:480px)",
    ".core-dbnorm-after-grid-v354{grid-template-columns:1fr}",
)))
check("tables use fixed bounded layout", ".core-dbnorm-table-v354{width:100%;border-collapse:collapse;table-layout:fixed" in css_source)

expected_js = js_353.replace("const APP_VERSION = 'v353';", "const APP_VERSION = 'v354';", 1)
function_anchor = "function coreTopicArticleView(id){"
expected_js = expected_js.replace(function_anchor, js_source + "\n\n" + function_anchor, 1)
old_mount = "      ${coreTopicInlineDiagramViewV353(id)}"
new_mount = "      ${coreTopicInlineDiagramViewV353(id)}\n      ${coreTopicDatabaseDiagramViewV354(id)}"
expected_js = expected_js.replace(old_mount, new_mount, 1)
check("javascript change is limited to version, reviewed renderer, and mount", js_354 == expected_js)
check("database renderer and mount are unique", js_354.count("function coreTopicDatabaseDiagramViewV354(id)") == 1 and js_354.count("${coreTopicDatabaseDiagramViewV354(id)}") == 1)
check("diagram is limited to database design lesson", "if(id!=='core_09_03')return '';" in js_source)
check("before and after structures are explicit", all(token in js_source for token in (
    "正規化前",
    "正規化後",
    "受注明細を1表に保存",
    "注文・商品・明細に分割",
)))
check("normalized tables are exactly order product detail", all(js_source.count(token) == 1 for token in (
    '<caption><span>注文</span><small>注文そのもの</small></caption>',
    '<caption><span>商品</span><small>商品の基本情報</small></caption>',
    '<caption><span>注文明細</span><small>注文と商品を結ぶ</small></caption>',
)))
check("relationship keys are visible", js_source.count("注文ID 🔑") == 2 and js_source.count("商品ID 🔑") == 2)
check("diagram is explanatory without forced interaction", "<button" not in js_source and "onclick" not in js_source)
check("profile schema remains v5", js_354.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "PROFILE_SCHEMA_VERSION = 6" not in js_354)
check("question bank count contract remains", "QUESTION_BANK.length===710" in js_354)
check("cloud activation remains pinned", shell_354.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)

check("manifest identifies v354", manifest.get("version") == "v354" and manifest.get("previousVersion") == "v353")
diagram = manifest.get("databaseNormalizationDiagram") or {}
check("manifest records narrow non-data diagram boundary", all((
    diagram.get("version") == "v354",
    diagram.get("scope") == "core-09-03-database-normalization-diagram",
    diagram.get("profileSchemaChange") is False,
    diagram.get("questionBankChange") is False,
    diagram.get("curriculumTextChange") is False,
    diagram.get("cloudRuntimeChange") is False,
    diagram.get("interactionRequired") is False,
    diagram.get("jsSourceSha256") == sha256(js_source_path),
    diagram.get("cssSourceSha256") == sha256(css_source_path),
)))
asset_rows = {row["path"]: row for row in manifest.get("assets", [])}
check("manifest CSS identity is current", asset_rows["assets/app-v354.css"]["sha256"] == sha256(css_354_path))
check("manifest JS identity is current", asset_rows["assets/app-v354.js"]["sha256"] == sha256(js_354_path))
check("manifest shell identity is current", manifest["shell"]["sha256"] == sha256(shell_354_path))

sw = (ROOT / "sw.js").read_text()
check("service worker uses isolated v354 cache", all(token in sw for token in (
    "const APP_VERSION = 'v354';",
    "fe-quest-v354-1",
    "./assets/app-v354.css",
    "./assets/app-v354.js",
    "./assets/asset-manifest-v354.json",
)))
syntax = subprocess.run(["node", "--check", str(js_354_path)], capture_output=True, text=True)
check("v354 javascript syntax", syntax.returncode == 0)

print(f"PASS — V354 DATABASE NORMALIZATION DIAGRAM STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
