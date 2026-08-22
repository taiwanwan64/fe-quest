from pathlib import Path
import json, shutil, sys, tempfile

sys.path.insert(0, str(Path('.github/release').resolve()))
from split_release_common import V342_CLOUD_RUNTIME_ASSETS, materialize_tree, req, sha_bytes

URL='https://taiwanwan64.github.io/fe-quest/'


def record(cases, name, condition):
    cases.append({'name': name, 'pass': bool(condition)})
    req(condition, name)

cases=[]
source_shell=Path('app/base-shell-v341.html').read_bytes()
source_css=Path('assets/app-v341.css').read_bytes()
source_js=Path('assets/app-v341.js').read_bytes()
source_sw=Path('sw.js').read_bytes()

with tempfile.TemporaryDirectory() as td:
    root=Path(td)/'repo'
    root.mkdir()
    for rel in ['index.html','manifest.webmanifest','sw.js']:
        shutil.copy2(rel,root/rel)
    for directory in ['app','assets','cloud','vendor']:
        shutil.copytree(directory,root/directory)

    result=materialize_tree(root,'v342','v341')
    p=result['files']
    shell=p['shell'].read_text(); sw=p['sw'].read_text(); manifest=json.loads(p['asset_manifest'].read_text())

    app_tag='<script src="./assets/app-v342.js"></script>'
    loader_tag='<script src="./cloud/activation-loader-v342.js"></script>'
    record(cases,'v342 shell inserts one activation loader after the core app script',shell.count(loader_tag)==1 and shell.index(app_tag)<shell.index(loader_tag))
    record(cases,'mechanical v342 CSS remains byte-identical to v341',p['css'].read_bytes()==source_css)
    generated_js=p['js'].read_text(); previous_js=source_js.decode()
    record(cases,'mechanical v342 app JS changes only APP_VERSION',generated_js==previous_js.replace("const APP_VERSION = 'v341';","const APP_VERSION = 'v342';",1))

    cloud=manifest.get('cloudActivation') or {}
    record(cases,'asset manifest declares same-origin fail-open cloud activation',cloud.get('sameOriginOnly') is True and cloud.get('defaultConfigEnabled') is True and manifest['executionContract'].get('cloudActivationFailOpen') is True)
    record(cases,'asset manifest records canonical production redirect',cloud.get('configuredRedirectTo')==URL)
    record(cases,'asset manifest records the pinned local Supabase SDK',cloud.get('sdk')=='vendor/supabase/supabase-2.112.3.js')
    expected=[x[2:] for x in V342_CLOUD_RUNTIME_ASSETS]
    record(cases,'asset manifest precache order equals the fixed runtime dependency list',cloud.get('precache')==expected)

    identities={x['path']:x for x in cloud.get('assets',[])}
    all_identity=True
    for rel in expected:
        b=(root/rel).read_bytes(); item=identities.get(rel) or {}
        all_identity=all_identity and item.get('utf8Bytes')==len(b) and item.get('sha256')==sha_bytes(b)
    record(cases,'every cloud activation asset identity matches the vendored source bytes',all_identity)

    config_path=root/'cloud/public-config-v342.js'
    config=config_path.read_text()
    record(cases,'asset manifest pins the exact activated public config bytes',cloud.get('publicConfigSha256')==sha_bytes(config_path.read_bytes()))

    sw_ok=all(sw.count(f"'./{rel}'")==1 for rel in expected)
    record(cases,'v342 service worker precaches every cloud runtime asset exactly once',sw_ok)
    record(cases,'v342 service worker keeps existing offline behavior',all(token in sw for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]))
    record(cases,'v342 service worker advances version without mutating source v341 worker',"const APP_VERSION = 'v342';" in sw and Path('sw.js').read_bytes()==source_sw)

    record(cases,'materialized v342 activates cloud only for the canonical Pages root',"enabled:true" in config and f"redirectTo:'{URL}'" in config)

    again=materialize_tree(root,'v342','v341')
    record(cases,'cloud-aware split materialization is idempotent',again['already_materialized'] is True and p['shell'].read_text()==shell and p['sw'].read_text()==sw)

record(cases,'current production v341 shell is unchanged by release-tooling validation',Path('app/base-shell-v341.html').read_bytes()==source_shell and 'activation-loader-v342.js' not in Path('app/base-shell-v341.html').read_text())

req(len(cases)==15,'expected 15 release activation cases')
req(all(x['pass'] for x in cases),'release activation contract failed')

report=f'''# FE QUEST v342 — Cloud-aware split release contract\n\nResult: **PASS — 15 / 15 RELEASE-ACTIVATION CASES PASS**\n\n- v342 mechanical materialization adds exactly one external cloud activation loader after the core app script\n- the existing 231KB+ CSS stays byte-identical and application JS changes only `APP_VERSION`\n- the v342 asset manifest records the pinned same-origin cloud dependency identities\n- Service Worker precache contains the activation loader, activated public config, sync UI, pinned Supabase SDK, and all cloud modules\n- the manifest records the exact activated public-config hash and canonical redirect `{URL}`\n- all existing offline/navigation/stale-while-revalidate behavior remains intact\n- materialization remains idempotent\n- the v341 production shell and Service Worker source remain untouched\n\nThis validates the distribution wiring for the activated v342 release candidate while keeping current production on v341 until the release gate is explicitly completed.\n'''
Path('audits/V342_RELEASE_CLOUD_ACTIVATION.md').write_text(report)
Path('_regression/release-cloud-activation-v342.fixture.json').write_text(json.dumps({
  'name':'release-cloud-activation-v342','result':'PASS','caseCount':15,
  'validatedCases':[x['name'] for x in cases],
  'cloudAssetCount':len(V342_CLOUD_RUNTIME_ASSETS),
  'sdk':'vendor/supabase/supabase-2.112.3.js',
  'defaultEnabled':True,'redirectTo':URL,'productionVersion':'v341'
},ensure_ascii=False,indent=2)+'\n')
print(report)
