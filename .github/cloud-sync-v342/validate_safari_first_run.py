from pathlib import Path
import importlib.util


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)

spec = importlib.util.spec_from_file_location('split_release_common', '.github/release/split_release_common.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

src = Path('assets/app-v341.js').read_text()
out = mod.transform_js(src, 'v341', 'v342')
selector = '#firstRunExperienceV340 input[type=date]{width:100%;min-width:0;max-width:100%;display:block;min-height:46px;'

checks = {
    'v342 transform keeps target version': "const APP_VERSION = 'v342';" in out,
    'Safari date input can shrink inside grid': selector in out,
    'date input keeps box sizing': 'box-sizing:border-box' in out[out.index(selector):out.index(selector)+320],
    'previous v341 source remains unchanged': selector not in src,
    'preview includes same Safari override': 'min-width:0!important;max-width:100%!important;display:block!important' in Path('v342-preview.html').read_text(),
    'production root remains v341': 'base-shell-v341.html' in Path('index.html').read_text() and 'base-shell-v342.html' not in Path('index.html').read_text(),
}

for name, ok in checks.items():
    req(ok, name)

print(f'PASS — {len(checks)}/{len(checks)} V342 SAFARI FIRST-RUN DATE CHECKS PASS')
