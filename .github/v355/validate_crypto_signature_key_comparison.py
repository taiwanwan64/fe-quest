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


shell_354 = (ROOT / "app/base-shell-v354.html").read_text()
shell_355_path = ROOT / "app/base-shell-v355.html"
shell_355 = shell_355_path.read_text()
css_354 = (ROOT / "assets/app-v354.css").read_text()
css_355_path = ROOT / "assets/app-v355.css"
css_355 = css_355_path.read_text()
css_source_path = ROOT / "app/crypto-signature-key-comparison-v355.css"
css_source = css_source_path.read_text().strip()
js_354 = (ROOT / "assets/app-v354.js").read_text()
js_355_path = ROOT / "assets/app-v355.js"
js_355 = js_355_path.read_text()
js_source_path = ROOT / "app/crypto-signature-key-comparison-v355.js"
js_source = js_source_path.read_text().strip()
manifest = json.loads((ROOT / "assets/asset-manifest-v355.json").read_text())

check("production index selects v355 shell", "app/base-shell-v355.html" in (ROOT / "index.html").read_text())
check("shell title and split assets are v355", all(token in shell_355 for token in (
    "<title>FE QUEST PWA v355</title>",
    "./assets/app-v355.css",
    "./assets/app-v355.js",
)))
expected_shell = shell_354.replace("v354", "v355").replace("V354", "V355")
check("shell changes only by release version", shell_355 == expected_shell)

expected_css = css_354.rstrip() + "\n\n" + css_source + "\n"
check("v355 css is exactly v354 plus reviewed key-comparison source", css_355 == expected_css)
check("key comparison css marker is unique", css_355.count("v355: public-key encryption and digital-signature key comparison") == 1)
check("desktop aligned and mobile stacked layouts are bounded", all(token in css_source for token in (
    "grid-template-columns:minmax(0,1fr) 28px minmax(0,.8fr) 28px minmax(0,1fr)",
    "@media(max-width:820px)",
    ".core-keycompare-track-v355{grid-template-columns:1fr",
    "@media(max-width:480px)",
)))
check("public and private keys have distinct stable styles", all(token in css_source for token in (
    ".core-keycompare-key-v355.is-public",
    ".core-keycompare-key-v355.is-private",
    "word-break:keep-all",
)))

expected_js = js_354.replace("const APP_VERSION = 'v354';", "const APP_VERSION = 'v355';", 1)
function_anchor = "function coreTopicArticleView(id){"
expected_js = expected_js.replace(function_anchor, js_source + "\n\n" + function_anchor, 1)
old_mount = "      ${coreTopicDatabaseDiagramViewV354(id)}"
new_mount = "      ${coreTopicDatabaseDiagramViewV354(id)}\n      ${coreTopicCryptoSignatureDiagramViewV355(id)}"
expected_js = expected_js.replace(old_mount, new_mount, 1)
check("javascript change is limited to version, reviewed renderer, and mount", js_355 == expected_js)
check("comparison renderer and mount are unique", js_355.count("function coreTopicCryptoSignatureDiagramViewV355(id)") == 1 and js_355.count("${coreTopicCryptoSignatureDiagramViewV355(id)}") == 1)
check("diagram is limited to the two related security lessons", "if(id!=='core_11_02'&&id!=='core_11_03')return '';" in js_source)
check("encryption key direction is correct", all(token in js_source for token in (
    "受信者の公開鍵",
    "受信者の秘密鍵",
    "暗号文を送る",
    "目的：秘密に送る",
)))
check("signature key direction is correct", all(token in js_source for token in (
    "文書のハッシュへ署名",
    "署名者の秘密鍵",
    "署名者の公開鍵",
    "目的：本人・改ざん確認",
)))
check("signature is not described as document secrecy", "本文を秘密にする処理ではない" in js_source)
check("diagram is explanatory without forced interaction", "<button" not in js_source and "onclick" not in js_source)
check("profile schema remains v5", js_355.count("const PROFILE_SCHEMA_VERSION = 5;") == 1 and "PROFILE_SCHEMA_VERSION = 6" not in js_355)
check("question bank count contract remains", "QUESTION_BANK.length===710" in js_355)
check("cloud activation remains pinned", shell_355.count('<script src="./cloud/activation-loader-v342.js"></script>') == 1)

check("manifest identifies v355", manifest.get("version") == "v355" and manifest.get("previousVersion") == "v354")
diagram = manifest.get("cryptoSignatureKeyComparison") or {}
check("manifest records narrow non-data comparison boundary", all((
    diagram.get("version") == "v355",
    diagram.get("scope") == "core-11-02-and-11-03-key-direction-comparison",
    diagram.get("profileSchemaChange") is False,
    diagram.get("questionBankChange") is False,
    diagram.get("curriculumTextChange") is False,
    diagram.get("cloudRuntimeChange") is False,
    diagram.get("interactionRequired") is False,
    diagram.get("jsSourceSha256") == sha256(js_source_path),
    diagram.get("cssSourceSha256") == sha256(css_source_path),
)))
asset_rows = {row["path"]: row for row in manifest.get("assets", [])}
check("manifest CSS identity is current", asset_rows["assets/app-v355.css"]["sha256"] == sha256(css_355_path))
check("manifest JS identity is current", asset_rows["assets/app-v355.js"]["sha256"] == sha256(js_355_path))
check("manifest shell identity is current", manifest["shell"]["sha256"] == sha256(shell_355_path))

sw = (ROOT / "sw.js").read_text()
check("service worker uses isolated v355 cache", all(token in sw for token in (
    "const APP_VERSION = 'v355';",
    "fe-quest-v355-1",
    "./assets/app-v355.css",
    "./assets/app-v355.js",
    "./assets/asset-manifest-v355.json",
)))
syntax = subprocess.run(["node", "--check", str(js_355_path)], capture_output=True, text=True)
check("v355 javascript syntax", syntax.returncode == 0)

print(f"PASS — V355 CRYPTO SIGNATURE KEY COMPARISON STATIC CONTRACT {len(checks)}/{len(checks)}")
for name, _ in checks:
    print(f"PASS {name}")
