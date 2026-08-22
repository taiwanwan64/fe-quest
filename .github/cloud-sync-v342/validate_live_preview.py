from pathlib import Path
import hashlib
import json
import subprocess


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

root = Path('.')
preview = root / 'v342-preview.html'
shell = root / 'app/base-shell-v342.html'
css = root / 'assets/app-v342.css'
js = root / 'assets/app-v342.js'
manifest_path = root / 'assets/asset-manifest-v342.json'
prod_index = root / 'index.html'
prod_shell = root / 'app/base-shell-v341.html'
evidence = root / 'audits/V342_LIVE_AUTH_ACCEPTANCE.md'

for p in [preview, shell, css, js, manifest_path, prod_index, prod_shell, evidence]:
    req(p.exists(), f'missing {p}')

p = preview.read_text()
s = shell.read_text()
i = prod_index.read_text()
e = evidence.read_text()
m = json.loads(manifest_path.read_text())

checks = {
    'production root still includes v341 shell only': 'base-shell-v341.html' in i and 'base-shell-v342.html' not in i,
    'preview includes v342 shell': 'base-shell-v342.html' in p,
    'preview adds noindex runtime marker': 'noindex,nofollow,noarchive' in p,
    'preview visibly warns private browsing only': 'シークレット / プライベートブラウズ専用' in p,
    'v342 shell title is correct': '<title>FE QUEST PWA v342</title>' in s,
    'v342 shell loads core before cloud activation': s.find('./assets/app-v342.js') >= 0 and s.find('./cloud/activation-loader-v342.js') > s.find('./assets/app-v342.js'),
    'candidate manifest is v342': m.get('version') == 'v342' and m.get('previousVersion') == 'v341',
    'candidate cloud activation enabled': m.get('cloudActivation', {}).get('enabledByConfig') is True,
    'candidate redirect is canonical production root': m.get('cloudActivation', {}).get('configuredRedirectTo') == 'https://taiwanwan64.github.io/fe-quest/',
    'returning-user live Auth evidence recorded': 'Returning-user path' in e and '22:47:03 JST' in e,
    'brand-new-user live Auth evidence recorded': 'Brand-new-user path' in e and '22:52:38 JST' in e,
    'production shell stays cloud-free': 'activation-loader-v342.js' not in prod_shell.read_text(),
}

asset_rows = {row['path']: row for row in m['assets']}
checks['preview CSS matches candidate manifest'] = sha256(css) == asset_rows['assets/app-v342.css']['sha256']
checks['preview JS matches candidate manifest'] = sha256(js) == asset_rows['assets/app-v342.js']['sha256']
checks['preview shell matches candidate manifest'] = sha256(shell) == m['shell']['sha256']

for name, ok in checks.items():
    req(ok, name)

# A preview PR may add unused v342 artifacts, but it must never mutate the active
# production routing/PWA files. This keeps / on v341 until live acceptance finishes.
try:
    changed = subprocess.check_output(
        ['git', 'diff', '--name-only', 'origin/main...HEAD'],
        text=True,
    ).splitlines()
except Exception:
    changed = []
for forbidden in ['index.html', 'sw.js', 'manifest.webmanifest']:
    req(forbidden not in changed, f'live preview must not modify production file: {forbidden}')

count = len(checks) + 3
print(f'PASS — {count}/{count} V342 LIVE PREVIEW CHECKS PASS')
