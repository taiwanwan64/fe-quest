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


shell_352 = (ROOT / "app/base-shell-v352.html").read_text()
shell_353_path = ROOT / "app/base-shell-v353.html"
shell_353 = shell_353_path.read_text()
css_352 = (ROOT / "assets/app-v352.css").read_text()
css_353_path = ROOT / "assets/app-v353.css"
css_353 = css_353_path.read_text()
css_source_path = ROOT / "app/core-twos-complement-diagram-v353.css"
css_source = css_source_path.read_text().strip()
js_352 = (ROOT / "assets/app-v352.js").read_text()
js_353_path = ROOT / "assets/app-v353.js"
js_353 = js_353_path.read_text()
js_source_path = ROOT / "app/core-twos-complement-diagram-v353.js"
js_source = js_source_path.read_text().strip()
manifest = json.loads((ROOT / "assets/asset-manifest-v353.json").read_text())

check("production index selects v353 shell", "app/base-shell-v353.html" in (ROOT / "index.html").read_text())
check("shell title and split assets are v353", all(token in shell_353 for token in (
    "<title>FE QUEST PWA v353</title>",
    "./assets/app-v353.css",
    "./assets/app-v353.js",
)))
expected_shell = shell_352.replace("v352", "v353").replace("V352", "V353")
check("shell changes only by release version", shell_353 == expected_shell)

expected_css = css_352.rstrip() + "\n\n" + css_source + "\n"
check("v353 css is exactly v352 plus reviewed diagram source", css_353 == expected_css)
check("diagram css marker is unique", css_353.count("v353: inline two's-complement lesson diagram") == 1)
check("signed values use one non-wrapping row", all(token in css_source for token in (
    ".core-twos-number-v353{display:flex",
    "flex-wrap:nowrap",
    ".core-twos-sign-v353",
    "white-space:nowrap",
)))
check("desktop and mobile diagram layouts are bounded", all(token in css_source for token in (
    "grid-template-columns:minmax(0,1fr) 64px minmax(0,1fr) 64px minmax(0,1fr)",
    "@media(max-width:720px)",
    ".core-twos-flow-v353{grid-template-columns:1fr",
    "@media(max-width:360px)",
)))

expected_js = js_352.replace("const APP_VERSION = 'v352';", "const APP_VERSION = 'v353';", 1)
function_anchor = "function coreTopicArticleView(id){"
expected_js = expected_js.replace(function_anchor, js_source + "\n\n" + function_anchor, 1)
old_mechanism = """    <section class=\"core-article-section\">
      <h2>仕組み</h2>
      <p>${politeCoreHtml(t.example)}</p>
    </section>

    ${CORE_A_OPTIONAL_DETAIL_TOPICS.has(id)?'':coreTopicSecondaryDepthView(id)}"""
new_mechanism = """    <section class=\"core-article-section\">
      <h2>仕組み</h2>
      <p>${politeCoreHtml(t.example)}</p>
      ${coreTopicInlineDiagramViewV353(id)}
    </section>

    ${CORE_A_OPTIONAL_DETAIL_TOPICS.has(id)?'':coreTopicSecondaryDepthView(id)}"""
expected_js = expected_js.replace(old_mechanism, new_mechanism, 1)
check("javascript change is limited to version and reviewed diagram mount", js_353 == expected_js)
check("diagram renderer and mount are unique", js_353.count("function coreTopicInlineDiagramViewV353(id)") == 1 and js_353.count("${coreTopicInlineDiagramViewV353(id)}") == 1)
check("diagram is limited to the negative-binary lesson", "if(id!=='core_01_05')return '';" in js_source)
check("plus and minus values use identical markup structure", all(token in js_source for token in (
    '<div class="core-twos-number-v353"><span class="core-twos-sign-v353">+5</span><code>0000 0101</code></div>',
    '<div class="core-twos-number-v353"><span class="core-twos-sign-v353">-5</span><code>1111 1011</code></div>',
)))
check("diagram is explanatory without forced interaction", "<button" not in js_source and "onclick" not in js_source)
check("profile schema remains v5", js_353.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "PROFILE_SCHEMA_VERSION = 6" not in js_353)
check("question bank count contract remains", "QUESTION_BANK.length===710" in js_353)
check("cloud activation remains pinned", shell_353.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)

check("manifest identifies v353", manifest.get("version") == "v353" and manifest.get("previousVersion") == "v352")
diagram = manifest.get("lessonDiagram") or {}
check("manifest records narrow non-data diagram boundary", all((
    diagram.get("version") == "v353",
    diagram.get("scope") == "core-01-05-inline-twos-complement-diagram",
    diagram.get("profileSchemaChange") is False,
    diagram.get("questionBankChange") is False,
    diagram.get("curriculumTextChange") is False,
    diagram.get("cloudRuntimeChange") is False,
    diagram.get("interactionRequired") is False,
    diagram.get("jsSourceSha256") == sha256(js_source_path),
    diagram.get("cssSourceSha256") == sha256(css_source_path),
)))
asset_rows = {row["path"]: row for row in manifest.get("assets", [])}
check("manifest CSS identity is current", asset_rows["assets/app-v353.css"]["sha256"] == sha256(css_353_path))
check("manifest JS identity is current", asset_rows["assets/app-v353.js"]["sha256"] == sha256(js_353_path))
check("manifest shell identity is current", manifest["shell"]["sha256"] == sha256(shell_353_path))

sw = (ROOT / "sw.js").read_text()
check("service worker uses isolated v353 cache", all(token in sw for token in (
    "const APP_VERSION = 'v353';",
    "fe-quest-v353-1",
    "./assets/app-v353.css",
    "./assets/app-v353.js",
    "./assets/asset-manifest-v353.json",
)))
syntax = subprocess.run(["node", "--check", str(js_353_path)], capture_output=True, text=True)
check("v353 javascript syntax", syntax.returncode == 0)

print(f"PASS — V353 INLINE LESSON DIAGRAM STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
