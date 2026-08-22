from pathlib import Path
import base64
import hashlib
import importlib.util
import json
import re
import runpy
import subprocess
import tempfile


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


def has_decl(decl, name, value):
    return f'{name}:{value}' in {part.strip() for part in decl.split(';') if part.strip()}


def runtime_snapshot(js_text):
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
const crypto=require('crypto');
const __safariSafe=f=>{try{return {ok:true,value:f()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const __safari={
  version:APP_VERSION,
  questionCount:QUESTION_BANK.length,
  questionHash:crypto.createHash('sha256').update(JSON.stringify(QUESTION_BANK)).digest('hex'),
  answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),
  cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length),
  subjectB:__safariSafe(()=>validateSubjectBSemantics()),
  today:__safariSafe(()=>buildTodayTasks().map(t=>({type:t.type||null,title:t.title||null,minutes:Number(t.minutes)||0}))),
  firstRun:__safariSafe(()=>firstRunNeedsSetupV340()),
  contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0}
};
console.log('__SAFARI_RELEASE__'+Buffer.from(JSON.stringify(__safari)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'runtime.js'
        p.write_text(stub + '\n' + js_text + '\n' + tail)
        check = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
        req(check.returncode == 0, 'Safari release Node syntax ' + check.stderr[-5000:])
        run = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(run.returncode == 0, 'Safari release Node runtime ' + run.stderr[-10000:])
        marker = re.search(r'__SAFARI_RELEASE__([A-Za-z0-9+/=]+)', run.stdout)
        req(marker is not None, 'Safari release runtime marker missing')
        return json.loads(base64.b64decode(marker.group(1)))


transformed_date = declaration(out, '#firstRunExperienceV340 input[type=date]{')
cloud_date = declaration(cloud_css, override_selector)
preview_date = declaration(preview, override_selector)
manifest_row = next(row for row in manifest['cloudActivation']['assets'] if row['path'] == 'cloud/sync-ui-v342.css')
cloud_bytes = cloud_path.read_bytes()
base_runtime = runtime_snapshot(src)
target_runtime = runtime_snapshot(out)

checks = {
    'v341 source still contains the original percentage-width date rule': '#firstRunExperienceV340 input[type=date]{width:100%;min-height:46px;' in src,
    'v342 transform keeps target version': "const APP_VERSION = 'v342';" in out,
    'v342 transform avoids WebKit 301648 percentage width trigger': transformed_prefix in out and not has_decl(transformed_date, 'width', '100%') and not has_decl(transformed_date, 'inline-size', '100%'),
    'v342 transform preserves native appearance': not has_decl(transformed_date, '-webkit-appearance', 'none') and not has_decl(transformed_date, 'appearance', 'none'),
    'cloud style clamps mobile grid min-content sizing': mobile_grid in cloud_css,
    'cloud date override uses intrinsic width plus logical clamps': has_decl(cloud_date, 'width', 'auto!important') and has_decl(cloud_date, 'inline-size', 'auto!important') and has_decl(cloud_date, 'min-inline-size', '0!important') and has_decl(cloud_date, 'max-inline-size', '100%!important'),
    'cloud date override adds WebKit logical minimum and stretch containment': has_decl(cloud_date, '-webkit-min-logical-width', '0!important') and has_decl(cloud_date, 'justify-self', 'stretch!important') and has_decl(cloud_date, 'align-self', 'stretch!important'),
    'cloud date override does not force percentage width': not has_decl(cloud_date, 'width', '100%!important') and not has_decl(cloud_date, 'inline-size', '100%!important'),
    'preview includes same mobile grid clamp': mobile_grid in preview,
    'preview uses same no-percentage native date containment': has_decl(preview_date, 'width', 'auto!important') and has_decl(preview_date, 'inline-size', 'auto!important') and has_decl(preview_date, '-webkit-min-logical-width', '0!important') and not has_decl(preview_date, 'width', '100%!important'),
    'preview carries a cache-identifiable WebKit fix marker': "badge.dataset.safariFix='webkit-301648'" in preview,
    'native date appearance remains intact in deployed overrides': '-webkit-appearance:none' not in cloud_css and '-webkit-appearance:none' not in preview and not has_decl(cloud_date, 'appearance', 'none!important') and not has_decl(preview_date, 'appearance', 'none!important'),
    'v342 asset manifest records current cloud stylesheet bytes': manifest_row['utf8Bytes'] == len(cloud_bytes),
    'v342 asset manifest records current cloud stylesheet hash': manifest_row['sha256'] == hashlib.sha256(cloud_bytes).hexdigest(),
    'production root remains v341': 'base-shell-v341.html' in Path('index.html').read_text() and 'base-shell-v342.html' not in Path('index.html').read_text(),
    'question content hash is unchanged by v342 Safari transform': base_runtime['questionHash'] == target_runtime['questionHash'],
    '710 questions and answer distribution are preserved': target_runtime['questionCount'] == 710 and target_runtime['answerDistribution'] == [178,178,177,177],
    'cognitive distribution is preserved': target_runtime['cognitiveDistribution'] == [166,323,221],
    'Subject B semantics are preserved': target_runtime['subjectB']['ok'] and target_runtime['subjectB']['value'].get('ok') is True,
    'fresh first-run and today plan generation are preserved': target_runtime['firstRun']['ok'] and target_runtime['firstRun']['value'] is True and target_runtime['today']['ok'] and len(target_runtime['today']['value']) > 0,
    'runtime contract failures remain zero': (target_runtime.get('contracts') or {}).get('count',0) == 0,
}

for name, ok in checks.items():
    req(ok, name)

print(f'PASS — {len(checks)}/{len(checks)} V342 SAFARI FIRST-RUN + RELEASE REGRESSION CHECKS PASS')
print('WEBKIT_301648_WORKAROUND: percentage width removed from native date control; native appearance preserved')
print('RELEASE_REGRESSION: questions=710 answers=178/178/177/177 cognitive=166/323/221 SubjectB=PASS runtimeFailures=0')
