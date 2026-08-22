from pathlib import Path
import re


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)

URL = 'https://taiwanwan64.github.io/fe-quest/'
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
    'guide records the exact canonical production URL': URL in s and '<FE_QUEST_PRODUCTION_URL>' not in s,
    'guide requires exact HTTPS production root': 'HTTPS only' in s and 'including the trailing slash' in s,
    'guide configures Site URL and redirect URL to the same root': 'Site URL' in s and 'Additional Redirect URLs' in s and s.count(URL) >= 5,
    'guide records hosted Auth mutation as manual gate': 'does not expose hosted Auth URL/template mutation' in s and 'must be saved manually' in s,
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
    'public config is activated for exact canonical root': 'enabled:true' in c and f"redirectTo:'{URL}'" in c,
    'public config uses expected Supabase project and publishable key only': "url:'https://gkvgxnkoypypikxtyeoz.supabase.co'" in c and re.search(r"publishableKey:'sb_publishable_[A-Za-z0-9_-]+'", c) is not None,
    'privacy policy already discloses optional cloud sync': 'クラウド同期は任意です' in p,
    'v341 production shell stays cloud-free': 'activation-loader-v342.js' not in prod,
}

for name, value in checks.items():
    req(value, name)

for forbidden in ['sb_secret_', 'service_role_', 'SUPABASE_SERVICE_ROLE_KEY']:
    req((forbidden + '=') not in s and ('"' + forbidden) not in s, f'guide appears to embed forbidden credential value: {forbidden}')
    req(forbidden not in c, f'public config embeds forbidden credential marker: {forbidden}')

count = len(checks)
report = f'''# FE QUEST v342 — Auth production setup readiness\n\nResult: **PASS — {count} / {count} AUTH-PRODUCTION CHECKS PASS**\n\n- canonical production URL is resolved as `{URL}`\n- public v342 config is activated for that exact root using the Supabase publishable key only\n- v341 production remains cloud-free, so this activation does not change the current released app\n- hosted Supabase Site URL, Additional Redirect URL, and Magic Link template remain an explicit manual Dashboard gate because the connected management tool does not expose those Auth mutations\n- the Magic Link contract returns `token_hash` + `type=email` to the static root through `{{{{ .RedirectTo }}}}` and matches the existing PKCE `verifyOtp` implementation\n- live acceptance still covers signed-out local study, explicit first sync, second device, offline reconnect, both conflict resolutions, logout, account deletion, export/recovery, and final Supabase advisors\n- release PR #107 remains gated until hosted Auth settings and real acceptance tests pass\n\nThe production URL is no longer guessed or unresolved.\n'''
Path('audits').mkdir(exist_ok=True)
Path('audits/V342_AUTH_PRODUCTION_SETUP.md').write_text(report)
print(report)
