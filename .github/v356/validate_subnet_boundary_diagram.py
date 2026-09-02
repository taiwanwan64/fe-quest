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


shell_355 = (ROOT / "app/base-shell-v355.html").read_text()
shell_356_path = ROOT / "app/base-shell-v356.html"
shell_356 = shell_356_path.read_text()
css_355 = (ROOT / "assets/app-v355.css").read_text()
css_356_path = ROOT / "assets/app-v356.css"
css_356 = css_356_path.read_text()
css_source_path = ROOT / "app/subnet-boundary-diagram-v356.css"
css_source = css_source_path.read_text().strip()
js_355 = (ROOT / "assets/app-v355.js").read_text()
js_356_path = ROOT / "assets/app-v356.js"
js_356 = js_356_path.read_text()
js_source_path = ROOT / "app/subnet-boundary-diagram-v356.js"
js_source = js_source_path.read_text().strip()
manifest = json.loads((ROOT / "assets/asset-manifest-v356.json").read_text())

check("production index selects v356 shell", "app/base-shell-v356.html" in (ROOT / "index.html").read_text())
check("shell title and split assets are v356", all(token in shell_356 for token in (
    "<title>FE QUEST PWA v356</title>",
    "./assets/app-v356.css",
    "./assets/app-v356.js",
)))
expected_shell = shell_355.replace("v355", "v356").replace("V355", "V356")
check("shell changes only by release version", shell_356 == expected_shell)

expected_css = css_355.rstrip() + "\n\n" + css_source + "\n"
check("v356 css is exactly v355 plus reviewed subnet source", css_356 == expected_css)
check("subnet diagram css marker is unique", css_356.count("v356: subnet network/host boundary lesson diagram") == 1)
check("26-to-6 boundary grid is explicit", css_source.count("grid-template-columns:minmax(0,26fr) 4px minmax(0,6fr)") == 2)
check("desktop and narrow row layouts are bounded", all(token in css_source for token in (
    ".core-subnet-binary-row-v356{display:grid;grid-template-columns:104px minmax(0,1fr)",
    "@media(max-width:720px)",
    ".core-subnet-binary-row-v356{grid-template-columns:1fr",
    "@media(max-width:480px)",
    "@media(max-width:360px)",
)))

expected_js = js_355.replace("const APP_VERSION = 'v355';", "const APP_VERSION = 'v356';", 1)
function_anchor = "function coreTopicArticleView(id){"
expected_js = expected_js.replace(function_anchor, js_source + "\n\n" + function_anchor, 1)
old_mount = "      ${coreTopicCryptoSignatureDiagramViewV355(id)}"
new_mount = "      ${coreTopicCryptoSignatureDiagramViewV355(id)}\n      ${coreTopicSubnetBoundaryDiagramViewV356(id)}"
expected_js = expected_js.replace(old_mount, new_mount, 1)
check("javascript change is limited to version, reviewed renderer, and mount", js_356 == expected_js)
check("subnet renderer and mount are unique", js_356.count("function coreTopicSubnetBoundaryDiagramViewV356(id)") == 1 and js_356.count("${coreTopicSubnetBoundaryDiagramViewV356(id)}") == 1)
check("diagram is limited to subnet mask lesson", "if(id!=='core_10_04')return '';" in js_source)
check("CIDR and mask values are correct", all(token in js_source for token in (
    "192.168.1.130/26",
    "255.255.255.192",
    "26bit ＋ 6bit",
    "32 − 26 = 6",
)))
check("network calculation is correct", all(token in js_source for token in (
    "192.168.1.128",
    "ホスト部をすべて0にする",
    "境界より左の26bitはそのまま残します",
)))
check("three binary rows share matching prefixes", js_source.count("<span>11000000</span><em>.</em><span>10101000</span><em>.</em><span>00000001</span><em>.</em><span>10</span>") == 2)
check("mask binary has 26 ones and 6 zeros by grouped representation", "<span>11111111</span><em>.</em><span>11111111</span><em>.</em><span>11111111</span><em>.</em><span>11</span>','<span>000000</span>" in js_source)
check("diagram is explanatory without forced interaction", "<button" not in js_source and "onclick" not in js_source)
check("profile schema remains v5", js_356.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "PROFILE_SCHEMA_VERSION = 6" not in js_356)
check("question bank count contract remains", "QUESTION_BANK.length===710" in js_356)
check("cloud activation remains pinned", shell_356.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)

check("manifest identifies v356", manifest.get("version") == "v356" and manifest.get("previousVersion") == "v355")
diagram = manifest.get("subnetBoundaryDiagram") or {}
check("manifest records narrow non-data diagram boundary", all((
    diagram.get("version") == "v356",
    diagram.get("scope") == "core-10-04-network-host-boundary-diagram",
    diagram.get("profileSchemaChange") is False,
    diagram.get("questionBankChange") is False,
    diagram.get("curriculumTextChange") is False,
    diagram.get("cloudRuntimeChange") is False,
    diagram.get("interactionRequired") is False,
    diagram.get("jsSourceSha256") == sha256(js_source_path),
    diagram.get("cssSourceSha256") == sha256(css_source_path),
)))
asset_rows = {row["path"]: row for row in manifest.get("assets", [])}
check("manifest CSS identity is current", asset_rows["assets/app-v356.css"]["sha256"] == sha256(css_356_path))
check("manifest JS identity is current", asset_rows["assets/app-v356.js"]["sha256"] == sha256(js_356_path))
check("manifest shell identity is current", manifest["shell"]["sha256"] == sha256(shell_356_path))

sw = (ROOT / "sw.js").read_text()
check("service worker uses isolated v356 cache", all(token in sw for token in (
    "const APP_VERSION = 'v356';",
    "fe-quest-v356-1",
    "./assets/app-v356.css",
    "./assets/app-v356.js",
    "./assets/asset-manifest-v356.json",
)))
syntax = subprocess.run(["node", "--check", str(js_356_path)], capture_output=True, text=True)
check("v356 javascript syntax", syntax.returncode == 0)

print(f"PASS — V356 SUBNET BOUNDARY DIAGRAM STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
