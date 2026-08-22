from pathlib import Path

path=Path('v342-auth-test.html')
text=path.read_text(encoding='utf-8')

checks={
    'canonical test redirect': "https://taiwanwan64.github.io/fe-quest/v342-auth-test.html" in text,
    'noindex diagnostic page': 'noindex,nofollow,noarchive' in text,
    'pinned supabase sdk': './vendor/supabase/supabase-2.112.3.js' in text,
    'public config only': './cloud/public-config-v342.js' in text,
    'auth boundary only': './cloud/supabase/auth-boundary-v342.js' in text,
    'creates configured client': 'createConfiguredClient' in text,
    'uses auth boundary': 'createAuthBoundary' in text,
    'server verifies user': 'client.auth.getUser()' in text,
    'local scope signout via boundary': 'boundary.signOutThisDevice()' in text,
    'no service worker registration': 'serviceWorker.register' not in text,
    'no production runtime bootstrap': 'runtime-bootstrap-v342.js' not in text,
    'no sync engine': 'sync-engine-v342.js' not in text,
    'no learner writer': 'writeCurrentProfile' not in text and 'saveProfile' not in text,
    'no learner storage keys': 'fequest.profile' not in text.lower() and 'fequest.cloudSync' not in text,
    'no secret key literal': 'sb_secret_' not in text and 'service_role' not in text,
}

for name,ok in checks.items():
    print(('PASS' if ok else 'FAIL')+': '+name)

failed=[name for name,ok in checks.items() if not ok]
if failed:
    raise SystemExit('auth live test validation failed: '+', '.join(failed))
print(f'AUTH_LIVE_TEST_V342_PASS {sum(checks.values())}/{len(checks)}')
