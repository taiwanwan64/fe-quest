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


shell_351 = (ROOT / "app/base-shell-v351.html").read_text()
shell_352_path = ROOT / "app/base-shell-v352.html"
shell_352 = shell_352_path.read_text()
html_source_path = ROOT / "app/progress-dashboard-v352.html"
html_source = html_source_path.read_text().rstrip()
css_351 = (ROOT / "assets/app-v351.css").read_text()
css_352_path = ROOT / "assets/app-v352.css"
css_352 = css_352_path.read_text()
css_source_path = ROOT / "app/progress-dashboard-layout-v352.css"
css_source = css_source_path.read_text().strip()
js_351 = (ROOT / "assets/app-v351.js").read_text()
js_352_path = ROOT / "assets/app-v352.js"
js_352 = js_352_path.read_text()
manifest = json.loads((ROOT / "assets/asset-manifest-v352.json").read_text())

check("production index selects v352 shell", "app/base-shell-v352.html" in (ROOT / "index.html").read_text())
check("shell title and split assets are v352", all(token in shell_352 for token in (
    "<title>FE QUEST PWA v352</title>",
    "./assets/app-v352.css",
    "./assets/app-v352.js",
)))

expected_shell = shell_351.replace("v351", "v352").replace("V351", "V352")
start_marker = '      <div class="plan-screen-grid">'
end_marker = '    </section>\n\n\n    <!-- LEARNING ANALYTICS -->'
start = expected_shell.index(start_marker)
end = expected_shell.index(end_marker, start)
expected_shell = expected_shell[:start] + html_source + "\n" + expected_shell[end:]
check("shell change is the reviewed dashboard fragment plus versioning", shell_352 == expected_shell)

ids = (
    "examPaceCard", "todayAllocationCard", "weekPlanCard", "reviewForecastCard",
    "readinessCard", "memoryHealthCard", "roadmapCard", "learningSettingsCard",
    "planDataFold", "pwaHealthCard",
)
check("dashboard card IDs remain unique", all(shell_352.count(f'id="{item}"') == 1 for item in ids))
order = [shell_352.index(f'id="{item}"') for item in ids]
top_order = [shell_352.index(f'id="{item}"') for item in ("examPaceCard", "todayAllocationCard", "weekPlanCard", "reviewForecastCard")]
check("dashboard follows learning-decision order before technical data", top_order == sorted(top_order) and max(order[:-2]) < order[-2] < order[-1])
check("week and review forecast are adjacent cards", shell_352.index('id="reviewForecastCard"') > shell_352.index('id="weekPlanCard"'))
check("lower dashboard uses two balanced semantic columns", shell_352.count('class="plan-dashboard-column"') == 2 and shell_352.index('id="readinessCard"') < shell_352.index('id="learningSettingsCard"') < shell_352.index('id="memoryHealthCard"') < shell_352.index('id="roadmapCard"'))
check("technical cards are progressively disclosed", '<details class="plan-data-fold" id="planDataFold">' in shell_352 and '<details class="plan-data-fold" id="planDataFold" open>' not in shell_352)
check("verbose readiness detail is progressively disclosed", '<details class="readiness-detail-fold">' in shell_352 and '<details class="readiness-detail-fold" open>' not in shell_352)
check("cloud insertion anchor stays inside the data grid", shell_352.index('class="plan-data-grid"') < shell_352.index('id="pwaHealthCard"') < shell_352.index("<!-- LEARNING ANALYTICS -->"))

expected_js = js_351.replace("const APP_VERSION = 'v351';", "const APP_VERSION = 'v352';", 1)
helper_anchor = "setPlanDetailsOpen(false);"
helper = """function openPlanDataFoldV352(){
  setPlanDetailsOpen(true);
  const fold=document.getElementById('planDataFold');
  if(fold)fold.open=true;
}
"""
expected_js = expected_js.replace(helper_anchor, helper + helper_anchor, 1)
old_callback = "showScreen('plan');setTimeout(()=>document.getElementById('pwaHealthCard')?.scrollIntoView?.({behavior:'smooth',block:'center'}),80)"
new_callback = "showScreen('plan');openPlanDataFoldV352();setTimeout(()=>document.getElementById('pwaHealthCard')?.scrollIntoView?.({behavior:'smooth',block:'center'}),80)"
expected_js = expected_js.replace(old_callback, new_callback)
check("javascript change is limited to version and data-fold recovery access", js_352 == expected_js)
check("recovery actions open collapsed data tools", js_352.count("openPlanDataFoldV352();setTimeout") == 2)
check("profile schema remains v5", js_352.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "PROFILE_SCHEMA_VERSION = 6" not in js_352)
check("question bank count contract remains", "QUESTION_BANK.length===710" in js_352)
check("cloud activation remains single and version-pinned", shell_352.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)
check("cloud UI still mounts before app data", "mountBeforeId:'pwaHealthCard'" in (ROOT / "cloud/sync-ui-v342.js").read_text())

check("v352 css is exactly v351 plus the scoped source", css_352 == css_351.rstrip() + "\n\n" + css_source + "\n")
check("dashboard CSS marker is unique", css_352.count("v352: learning-priority progress dashboard") == 1)
check("wide dashboard uses equal columns", "grid-template-columns:repeat(2,minmax(0,1fr))" in css_source)
check("week and forecast cards share comparison layout", "#plan #weekPlanCard," in css_source and "#plan #reviewForecastCard" in css_source)
check("technical data is folded below the dashboard", "#plan .plan-data-fold" in css_source and "#plan .plan-data-grid" in css_source)
check("desktop and mobile layouts are bounded", "@media(min-width:1101px)" in css_source and "@media(max-width:1100px)" in css_source and "@media(max-width:720px)" in css_source)

check("manifest identifies v352", manifest.get("version") == "v352" and manifest.get("previousVersion") == "v351")
layout = manifest.get("dashboardLayout") or {}
check("manifest records unchanged data and learning boundaries", all((
    layout.get("version") == "v352",
    layout.get("scope") == "learning-priority-progress-dashboard",
    layout.get("profileSchemaChange") is False,
    layout.get("learningContentChange") is False,
    layout.get("cloudRuntimeChange") is False,
    layout.get("cssSourcePath") == "app/progress-dashboard-layout-v352.css",
    layout.get("cssSourceSha256") == sha256(css_source_path),
    layout.get("htmlSourcePath") == "app/progress-dashboard-v352.html",
    layout.get("htmlSourceSha256") == sha256(html_source_path),
)))
asset_rows = {row["path"]: row for row in manifest.get("assets", [])}
check("manifest CSS identity is current", asset_rows["assets/app-v352.css"]["sha256"] == sha256(css_352_path))
check("manifest JS identity is current", asset_rows["assets/app-v352.js"]["sha256"] == sha256(js_352_path))
check("manifest shell identity is current", manifest["shell"]["sha256"] == sha256(shell_352_path))

sw = (ROOT / "sw.js").read_text()
check("service worker uses isolated v352 cache", all(token in sw for token in (
    "const APP_VERSION = 'v352';",
    "fe-quest-v352-1",
    "./assets/app-v352.css",
    "./assets/app-v352.js",
    "./assets/asset-manifest-v352.json",
)))
syntax = subprocess.run(["node", "--check", str(js_352_path)], capture_output=True, text=True)
check("v352 javascript syntax", syntax.returncode == 0)

print(f"PASS — V352 PROGRESS DASHBOARD STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
