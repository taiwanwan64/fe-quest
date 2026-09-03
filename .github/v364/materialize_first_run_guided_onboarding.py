from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".github/release"))
from split_release_common import build_asset_manifest, materialize_tree, paths, sha_bytes, transform_css, transform_js, transform_shell

PREVIOUS, TARGET = "v363", "v364"
SOURCE = ROOT / "app/first-run-guided-onboarding-v364.js"

result = materialize_tree(ROOT, TARGET, PREVIOUS)
target, previous = result["files"], paths(ROOT, PREVIOUS)

js = transform_js(previous["js"].read_text(), PREVIOUS, TARGET)
old_finish = "document.getElementById('diagFinish')?.addEventListener('click',()=>{showScreen('home');refreshProfileUI();setTimeout(()=>document.getElementById('todayResumeBtn')?.click(),0)});"
new_finish = "document.getElementById('diagFinish')?.addEventListener('click',()=>globalThis.finishGuidedDiagnosticV364());"
assert js.count(old_finish) == 1
js = js.replace(old_finish, new_finish, 1)

copy_changes = {
    '今日の期限はなし。「${weak}」を維持': '期限を迎えた復習問題はありません。「${weak}」の弱点問題で定着を確認します。',
    '今日の復習期限はなし。「${weak}」を補強': '期限を迎えた復習問題はありません。「${weak}」の弱点問題で定着を確認します。',
}
for old, new in copy_changes.items():
    assert js.count(old) == 1, old
    js = js.replace(old, new, 1)

source = SOURCE.read_text().strip()
assert source.startswith('// FE QUEST v364')
js = js.rstrip() + "\n\n" + source + "\n"
target["js"].write_text(js)

shell = transform_shell(previous["shell"].read_text(), PREVIOUS, TARGET)
shell_changes = {
    '目的を変えたいときだけ、ほかの演習を選べます。': '目的を変えたいときは、ほかの演習も選べます。',
    '診断結果を反映して学習を始める →': 'ホーム画面へ →',
}
for old, new in shell_changes.items():
    assert shell.count(old) == 1, old
    shell = shell.replace(old, new, 1)
target["shell"].write_text(shell)

css_patch = r'''

/* ===== v364: guided first-run onboarding ===== */
body.fequest-first-run-v364 .sidebar{display:none!important}
body.fequest-first-run-v364 main{margin-left:0!important;max-width:760px!important;padding-bottom:36px!important}
body.fequest-first-run-v364 header .mobile-stats,
body.fequest-first-run-v364 header .stat-chip,
body.fequest-first-run-v364 header #aiFab{display:none!important}
body.fequest-first-run-v364 #home>*:not(#firstRunGuidedV364){display:none!important}
body.fequest-first-run-v364 #diagnostic .screen-head .back{display:none!important}
body.fequest-first-run-v364 #diagnostic .screen-head{justify-content:center}
body.fequest-first-run-v364 #diagnostic .screen-head>div{width:100%;text-align:center}
.first-run-guided-v364{width:100%;box-sizing:border-box;margin:0 auto;padding:26px;border:1px solid rgba(88,204,2,.3);border-radius:22px;background:linear-gradient(180deg,#fff 0%,#f7fff1 100%);box-shadow:0 10px 32px rgba(22,45,12,.09)}
.first-run-guided-v364 .v364-step,#diagnostic .v364-diagnostic-step{margin-bottom:7px;color:#3f8f13;font-size:13px;font-weight:1000;letter-spacing:.04em}
.first-run-guided-v364 h1{margin:0 0 9px;font-size:28px;line-height:1.35}
.first-run-guided-v364 .v364-lead{margin:0;color:var(--muted,#657080);font-size:15px;line-height:1.75}
.v364-account-form{display:grid;gap:9px;margin-top:22px}
.v364-label{display:block;margin-bottom:2px;font-size:14px;font-weight:900}
.v364-account-form input,.v364-field input[type=date]{width:100%;min-width:0;min-height:50px;box-sizing:border-box;border:1px solid #d8dee8;border-radius:13px;background:#fff;padding:0 13px;color:inherit;font:inherit}
.v364-primary,.v364-secondary{width:100%;min-height:52px;border-radius:14px;font:inherit;font-weight:1000;cursor:pointer}
.v364-primary{border:0;background:#58cc02;color:#fff;box-shadow:0 4px 0 #46a302}
.v364-primary:active{transform:translateY(2px);box-shadow:0 2px 0 #46a302}
.v364-primary:disabled{cursor:wait;opacity:.56;transform:none;box-shadow:0 3px 0 #8fcf6c}
.v364-secondary{margin-top:13px;border:1px solid #cfd9e3;background:#fff;color:#496171}
.v364-account-help,.v364-help{margin-top:7px;color:var(--muted,#657080);font-size:13px;line-height:1.6}
.v364-account-status{min-height:21px;margin-top:12px;padding:10px 12px;border-radius:11px;background:#f2f7fa;color:#4d6575;font-size:13px;font-weight:800;line-height:1.55}
.v364-account-status.is-error{background:#fff1f1;color:#b42318}
.v364-account-status.is-success{background:#effbe9;color:#2f7b17}
.v364-privacy{margin:13px 0 0;text-align:center;color:var(--muted,#657080);font-size:12px;line-height:1.5}
.v364-privacy a{color:#327cb1;font-weight:850}
.v364-account-signed-in{display:flex;align-items:center;gap:12px;margin-top:22px;padding:15px;border:1px solid #cfe8c2;border-radius:15px;background:#f3ffed}
.v364-account-icon{display:grid;width:34px;height:34px;place-items:center;border-radius:50%;background:#58cc02;color:#fff;font-weight:1000}
.v364-account-signed-in b,.v364-account-signed-in span{display:block}
.v364-account-signed-in>div>span{margin-top:2px;color:#527064;font-size:13px}
.v364-account-signed-in+.v364-primary{margin-top:18px}
.v364-settings-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:16px;margin-top:22px}
.v364-field{min-width:0}
.v364-minutes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
.v364-minute{min-height:50px;border:1px solid #d8dee8;border-radius:13px;background:#fff;color:inherit;font:inherit;font-weight:900;cursor:pointer}
.v364-minute[aria-pressed=true]{border-color:#58cc02;background:#efffe6;color:#277608;box-shadow:inset 0 0 0 1px #58cc02}
.v364-error{display:none;margin-top:12px;padding:10px 12px;border-radius:11px;background:#fff1f1;color:#b42318;font-size:13px;font-weight:800}
.v364-error.show{display:block}
.v364-settings-fields~.v364-primary{display:block;width:min(100%,460px);margin:20px auto 0}
@media(max-width:720px){
  body.fequest-first-run-v364 header{justify-content:flex-start}
  body.fequest-first-run-v364 main{padding:18px 14px 30px!important}
  .first-run-guided-v364{padding:21px 17px;border-radius:18px}
  .first-run-guided-v364 h1{font-size:24px}
  .first-run-guided-v364 .v364-lead{font-size:14px}
  .v364-settings-fields{grid-template-columns:1fr;gap:17px}
  .v364-minute{min-height:50px;font-size:14px}
  body.fequest-first-run-v364 #diagnostic{padding-bottom:20px}
}
'''
css = transform_css(previous["css"].read_text(), PREVIOUS, TARGET)
target["css"].write_text(css.rstrip() + css_patch)

manifest = build_asset_manifest(ROOT, PREVIOUS, TARGET, {
    "version": PREVIOUS,
    "assetManifestSha256": sha_bytes(previous["asset_manifest"].read_bytes()),
    "shellSha256": sha_bytes(previous["shell"].read_bytes()),
    "cssSha256": sha_bytes(previous["css"].read_bytes()),
    "jsSha256": sha_bytes(previous["js"].read_bytes()),
})
manifest["guidedFirstRun"] = {
    "version": TARGET,
    "scope": ["fresh-profile", "optional-account", "study-settings", "diagnostic-finish", "copy-clarity"],
    "route": ["account-or-skip", "study-settings", "diagnostic", "home"],
    "navigationLockedUntilDiagnostic": True,
    "autoLaunchAfterDiagnostic": False,
    "existingLearnerRouteChanged": False,
    "diagnosticScoringChanged": False,
    "profileSchemaChange": False,
    "questionBankChange": False,
    "cloudRuntimeChange": False,
    "sourcePath": SOURCE.relative_to(ROOT).as_posix(),
    "sourceSha256": sha_bytes(SOURCE.read_bytes()),
}
target["asset_manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"FEQUEST_V364_MATERIALIZED already={int(result['already_materialized'])}")
