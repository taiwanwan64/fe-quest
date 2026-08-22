from pathlib import Path
import hashlib
import importlib.util
import json
import re


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)

spec = importlib.util.spec_from_file_location('split_release_common', '.github/release/split_release_common.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

src = Path('assets/app-v341.js').read_text()
out = mod.transform_js(src, 'v341', 'v342')
cloud_path = Path('cloud/sync-ui-v342.css')
cloud_css = cloud_path.read_text()
preview = Path('v342-preview.html').read_text()
manifest = json.loads(Path('assets/asset-manifest-v342.json').read_text())
mobile_grid = '#firstRunExperienceV340 .v340-fields{grid-template-columns:minmax(0,1fr)!important;'
transformed_prefix = '#firstRunExperienceV340 input[type=date]{width:auto;inline-size:auto;min-width:0;min-inline-size:0;max-width:100%;max-inline-size:100%;display:block;box-sizing:border-box;-webkit-min-logical-width:0;justify-self:stretch;align-self:stretch;overflow:hidden;min-height:46px;'
override_selector = '#firstRunExperienceV340 input[type="date"]{'


def declaration(text, selector):
    start = text.index(selector) + len(selector)
    end = text.index('}', start)
    return text[start:end]


transformed_date = declaration(out, '#firstRunExperienceV340 input[type=date]{')
cloud_date = declaration(cloud_css, override_selector)
preview_date = declaration(preview, override_selector)
manifest_row = next(row for row in manifest['cloudActivation']['assets'] if row['path'] == 'cloud/sync-ui-v342.css')
cloud_bytes = cloud_path.read_bytes()

checks = {
    'v341 source still contains the original percentage-width date rule': '#firstRunExperienceV340 input[type=date]{width:100%;min-height:46px;' in src,
    'v342 transform keeps target version': "const APP_VERSION = 'v342';" in out,
    'v342 transform avoids WebKit 301648 percentage width trigger': transformed_prefix in out and 'width:100%' not in transformed_date and 'inline-size:100%' not in transformed_date,
    'v342 transform preserves native appearance': '-webkit-appearance:none' not in transformed_date and 'appearance:none' not in transformed_date,
    'cloud style clamps mobile grid min-content sizing': mobile_grid in cloud_css,
    'cloud date override uses intrinsic width plus logical clamps': 'width:auto!important' in cloud_date and 'inline-size:auto!important' in cloud_date and 'min-inline-size:0!important' in cloud_date and 'max-inline-size:100%!important' in cloud_date,
    'cloud date override adds WebKit logical minimum and stretch containment': '-webkit-min-logical-width:0!important' in cloud_date and 'justify-self:stretch!important' in cloud_date and 'align-self:stretch!important' in cloud_date,
    'cloud date override does not force percentage width': 'width:100%!important' not in cloud_date and 'inline-size:100%!important' not in cloud_date,
    'preview includes same mobile grid clamp': mobile_grid in preview,
    'preview uses same no-percentage native date containment': 'width:auto!important' in preview_date and 'inline-size:auto!important' in preview_date and '-webkit-min-logical-width:0!important' in preview_date and 'width:100%!important' not in preview_date,
    'preview carries a cache-identifiable WebKit fix marker': "badge.dataset.safariFix='webkit-301648'" in preview,
    'native date appearance remains intact in deployed overrides': '-webkit-appearance:none' not in cloud_css and '-webkit-appearance:none' not in preview and 'appearance:none' not in cloud_date and 'appearance:none' not in preview_date,
    'v342 asset manifest records current cloud stylesheet bytes': manifest_row['utf8Bytes'] == len(cloud_bytes),
    'v342 asset manifest records current cloud stylesheet hash': manifest_row['sha256'] == hashlib.sha256(cloud_bytes).hexdigest(),
    'production root remains v341': 'base-shell-v341.html' in Path('index.html').read_text() and 'base-shell-v342.html' not in Path('index.html').read_text(),
}

for name, ok in checks.items():
    req(ok, name)

print(f'PASS — {len(checks)}/{len(checks)} V342 SAFARI FIRST-RUN DATE CHECKS PASS')
print('WEBKIT_301648_WORKAROUND: percentage width removed from native date control; native appearance preserved')
