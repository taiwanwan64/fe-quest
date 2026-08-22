from pathlib import Path
import re


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)

URL = 'https://taiwanwan64.github.io/fe-quest/'
TEST_URL = 'https://taiwanwan64.github.io/fe-quest/v342-auth-test.html'
TOKEN_LINK = '{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email'
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
    'guide records isolated live auth callback': TEST_URL in s,
    'guide requires exact HTTPS production root': 'HTTPS' in s and 'including the trailing slash' in s,
    'guide configures site and exact redirect URLs': 'Site URL' in s and 'Additional Redirect URLs' in s and s.count(URL) >= 5 and TEST_URL in s,
    'guide records hosted Auth mutation as manual gate': 'does not expose hosted Auth URL/template mutation' in s and 'must be saved manually' in s,
    'guide requires Confirm sign up PKCE template': 'Confirm sign up' in s and 'first request Supabase sends the **Confirm sign up** template' in s,
    'guide requires Magic link PKCE template': 'Magic link or OTP' in s and 'returning-user' in s,
    'both PKCE templates use RedirectTo token hash': s.count(TOKEN_LINK) >= 2,
    'guide forbids ConfirmationURL on FE QUEST PKCE paths': '{{ .ConfirmationURL }}' in s and 'must not be used' in s,
    'guide explicitly forbids nonexistent static callback route': 'Do not point these templates at `/auth/confirm`' in s,
    'guide documents verifyOtp PKCE exchange': "verifyOtp({ token_hash, type: 'email' })" in s,
    'guide explains automatic first-user creation': 'signInWithOtp({ shouldCreateUser: true })' in s,
    'guide live acceptance tests returning user': 'Existing confirmed email' in s,
    'guide live acceptance tests brand-new user': 'Brand-new email' in s and 'without falling back to hosted `/verify`' in s,
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
    'auth implementation allows first-user creation': 'const options={shouldCreateUser:true};' in a,
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
report = f'''# FE QUEST v342 — Auth production setup readiness\n\nResult: **PASS — {count} / {count} AUTH-PRODUCTION CHECKS PASS**\n\n- canonical production URL is `{URL}` and the isolated test callback is `{TEST_URL}`\n- both Confirm sign up and Magic link or OTP are required to use the same PKCE token-hash browser callback\n- new-user automatic signup is explicitly covered so the first login cannot silently fall back to hosted `/verify`\n- public v342 config remains publishable-key only and v341 production remains cloud-free\n- live acceptance covers both first-time and returning-user Auth before cloud sync promotion\n- release PR #107 remains gated until real acceptance tests pass\n'''
Path('audits').mkdir(exist_ok=True)
Path('audits/V342_AUTH_PRODUCTION_SETUP.md').write_text(report)
print(report)
