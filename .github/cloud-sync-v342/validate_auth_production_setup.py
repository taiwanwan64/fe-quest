from pathlib import Path


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)

setup = Path('cloud/supabase/AUTH_PRODUCTION_SETUP_V342.md')
auth = Path('cloud/supabase/auth-boundary-v342.js')
config = Path('cloud/public-config-v342.js')
privacy = Path('privacy.html')
shell = Path('app/base-shell-v341.html')
for p in [setup, auth, config, privacy, shell]:
    req(p.exists(), f'missing {p}')

s = setup.read_text()
a = auth.read_text()
c = config.read_text()
p = privacy.read_text()
prod = shell.read_text()

checks = {
    'guide blocks activation until verified URL exists': 'DO NOT ENABLE CLOUD SYNC UNTIL EVERY REQUIRED ITEM IS VERIFIED' in s and 'Do not guess the GitHub Pages URL' in s,
    'guide requires exact HTTPS production root': '<FE_QUEST_PRODUCTION_URL>' in s and 'HTTPS only' in s,
    'guide configures Site URL': 'Site URL' in s and 'Additional Redirect URLs' in s,
    'guide uses RedirectTo token-hash Magic Link': '{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email' in s,
    'guide explicitly forbids nonexistent static callback route': 'Do not point the template at `/auth/confirm`' in s,
    'guide documents verifyOtp PKCE exchange': "verifyOtp({ token_hash, type: 'email' })" in s,
    'guide preserves explicit opt-in sync': 'Signed in but sync disabled: no learner data is uploaded automatically.' in s,
    'guide covers two-device adoption': 'Device/browser B' in s,
    'guide covers offline reconnect': 'Offline on A' in s,
    'guide covers stale-device conflict': 'stale client does not silently overwrite cloud state' in s,
    'guide covers both conflict choices': 'この端末のデータを使う' in s and 'クラウドのデータを使う' in s,
    'guide covers local-scope logout': 'only this device session/sync metadata is disabled' in s,
    'guide covers account deletion while preserving local data': 'delete account' in s and 'local learner data remains' in s,
    'guide preserves export and recovery': 'JSON export and Recovery Center remain usable independently' in s,
    'guide requires post-test advisors': 'Security Advisor and Performance Advisor' in s,
    'guide keeps release PR draft until acceptance': 'PR `#107`' in s and 'must remain draft/unmerged' in s,
    'guide forbids secret material in repository': 'never add `sb_secret_*`' in s and 'service-role keys' in s,
    'guide warns about link scanners': 'Email security scanners may prefetch one-time links' in s,
    'auth implementation matches PKCE token-hash callback': "flowType:'pkce'" in a and "callbackQuery:'token_hash+type=email'" in a and "client.auth.verifyOtp({token_hash:callback.tokenHash,type:callback.type})" in a,
    'auth implementation sends explicit emailRedirectTo': 'options.emailRedirectTo=redirectTo' in a,
    'current public config remains disabled': 'enabled:false' in c and 'redirectTo:null' in c,
    'privacy policy already discloses optional cloud sync': 'クラウド同期は任意です' in p,
    'v341 production shell stays cloud-free': 'activation-loader-v342.js' not in prod,
}

for name, value in checks.items():
    req(value, name)

for forbidden in ['sb_secret_', 'service_role_', 'SUPABASE_SERVICE_ROLE_KEY']:
    # Placeholder/warning words are allowed in the guide, but no credential-looking assignment/value is.
    req((forbidden + '=') not in s and ('"' + forbidden) not in s, f'guide appears to embed forbidden credential value: {forbidden}')

count = len(checks)
report = f'''# FE QUEST v342 — Auth production setup readiness\n\nResult: **PASS — {count} / {count} AUTH-PRODUCTION CHECKS PASS**\n\n- the hosted Supabase Auth steps are fixed behind one unresolved input: the exact production FE QUEST HTTPS URL\n- Site URL and Additional Redirect URL must use that exact canonical root\n- the Magic Link template returns `token_hash` + `type=email` to the same root through `{{{{ .RedirectTo }}}}`\n- the documented template matches the existing PKCE `verifyOtp` callback implementation\n- the guide explicitly avoids an `/auth/confirm` route that does not exist in the static PWA\n- live acceptance covers signed-out local study, explicit first sync, second device, offline reconnect, both conflict resolutions, logout, account deletion, export/recovery, and final Supabase advisors\n- current public config remains disabled and v341 production remains cloud-free\n- release PR #107 remains gated until real hosted Auth configuration and live acceptance pass\n\nNo production URL was guessed or activated by this change.\n'''
Path('audits').mkdir(exist_ok=True)
Path('audits/V342_AUTH_PRODUCTION_SETUP.md').write_text(report)
print(report)
