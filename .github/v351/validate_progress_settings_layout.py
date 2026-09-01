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


shell_345 = (ROOT / "app/base-shell-v345.html").read_text()
shell_351_path = ROOT / "app/base-shell-v351.html"
shell_351 = shell_351_path.read_text()
css_345 = (ROOT / "assets/app-v345.css").read_text()
css_351_path = ROOT / "assets/app-v351.css"
css_351 = css_351_path.read_text()
css_source_path = ROOT / "app/progress-settings-layout-v351.css"
css_source = css_source_path.read_text().strip()
js_345 = (ROOT / "assets/app-v345.js").read_text()
js_351_path = ROOT / "assets/app-v351.js"
js_351 = js_351_path.read_text()
manifest = json.loads((ROOT / "assets/asset-manifest-v351.json").read_text())

check("production index selects v351 shell", "app/base-shell-v351.html" in (ROOT / "index.html").read_text())
check("shell title and split assets are v351", all(token in shell_351 for token in (
    "<title>FE QUEST PWA v351</title>",
    "./assets/app-v351.css",
    "./assets/app-v351.js",
)))
check("shell change is version-only", shell_351.replace("v351", "v345").replace("V351", "V345") == shell_345)
check("javascript change is version-only", js_351.replace("const APP_VERSION = 'v351';", "const APP_VERSION = 'v345';", 1) == js_345)
check("profile schema remains v5", js_351.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "PROFILE_SCHEMA_VERSION = 6" not in js_351)
check("question bank count contract remains", "QUESTION_BANK.length===710" in js_351)
check("cloud activation remains single and version-pinned", shell_351.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)
check("v351 css is exactly v345 plus the scoped source", css_351 == css_345.rstrip() + "\n\n" + css_source + "\n")
check("layout polish marker is unique", css_351.count("v351: progress / settings desktop layout polish") == 1)
check("wide plan viewport is expanded", "main:has(>#plan.active){max-width:1180px}" in css_351)
check("wide plan has bounded right rail", "minmax(390px,.78fr)" in css_351)
check("intermediate desktop collapses safely", "@media(min-width:721px) and (max-width:1449px)" in css_351)
check("cloud heading is protected from desktop character wrapping", "#plan .feq-sync-head h2" in css_351 and "white-space:nowrap" in css_351)
check("cloud email input uses available width", "#plan .feq-sync-email input{width:100%;min-width:0}" in css_351)
check("cloud email form is a single readable column", "#plan .feq-sync-email{display:grid;grid-template-columns:minmax(0,1fr)" in css_351)
check("PWA install card uses stable grid", "#pwaHealthCard .settings-install-card" in css_351 and "grid-template-columns:44px minmax(0,1fr)" in css_351)
check("PWA status cards have responsive one two three column contracts", all(token in css_351 for token in (
    "repeat(2,minmax(0,1fr))",
    "repeat(3,minmax(0,1fr))",
    "grid-template-columns:minmax(0,1fr)",
)))
check("mobile cloud heading can wrap normally", "@media(max-width:720px)" in css_351 and "#plan .feq-sync-head h2{white-space:normal}" in css_351)
check("manifest identifies v351", manifest.get("version") == "v351" and manifest.get("previousVersion") == "v345")
layout = manifest.get("layoutPolish") or {}
check("manifest records schema content and cloud boundaries", all((
    layout.get("version") == "v351",
    layout.get("scope") == "progress-settings-responsive-layout",
    layout.get("profileSchemaChange") is False,
    layout.get("learningContentChange") is False,
    layout.get("cloudRuntimeChange") is False,
    layout.get("sourcePath") == "app/progress-settings-layout-v351.css",
    layout.get("sourceSha256") == sha256(css_source_path),
)))
asset_rows = {row["path"]: row for row in manifest.get("assets", [])}
check("manifest css identity is current", asset_rows["assets/app-v351.css"]["sha256"] == sha256(css_351_path) and asset_rows["assets/app-v351.css"]["utf8Bytes"] == len(css_351_path.read_bytes()))
check("manifest js identity is current", asset_rows["assets/app-v351.js"]["sha256"] == sha256(js_351_path) and asset_rows["assets/app-v351.js"]["utf8Bytes"] == len(js_351_path.read_bytes()))
check("manifest shell identity is current", manifest["shell"]["sha256"] == sha256(shell_351_path) and manifest["shell"]["utf8Bytes"] == len(shell_351_path.read_bytes()))
sw = (ROOT / "sw.js").read_text()
check("service worker uses isolated v351 cache", all(token in sw for token in (
    "const APP_VERSION = 'v351';",
    "fe-quest-v351-1",
    "./assets/app-v351.css",
    "./assets/app-v351.js",
    "./assets/asset-manifest-v351.json",
)))

syntax = subprocess.run(["node", "--check", str(js_351_path)], capture_output=True, text=True)
check("v351 javascript syntax", syntax.returncode == 0)

print(f"PASS — V351 PROGRESS SETTINGS STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
