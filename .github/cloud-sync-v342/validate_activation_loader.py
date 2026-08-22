from pathlib import Path
import base64, hashlib, json, re, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)

loader = Path('cloud/activation-loader-v342.js')
config = Path('cloud/public-config-v342.js')
vendor = Path('vendor/supabase/supabase-2.112.3.js')
vendor_manifest = Path('vendor/supabase/manifest-v342.json')
shell = Path('app/base-shell-v341.html')
for p in [loader, config, vendor, vendor_manifest, shell]:
    req(p.exists(), f'missing {p}')

program = loader.read_text() + r'''
;(async()=>{
const A=globalThis.FEQUEST_CLOUD_ACTIVATION_V342;const cases=[];const ok=(name,cond)=>cases.push({name,pass:Boolean(cond)});
const enabled={enabled:true,provider:'supabase',url:'https://example.supabase.co',publishableKey:'sb_publishable_abcdefghijklmnopqrstuvwxyz0123456789',redirectTo:'https://example.com/fe-quest/'};
let scripts=[],styles=[],runtimeCalls=0,startCalls=0;
let l=A.createActivationLoader({config:{enabled:false},loadScript:async p=>{scripts.push(p)},loadStyle:async p=>{styles.push(p)}});
let r=await l.start();ok('disabled config loads zero cloud assets',r.ok&&r.status==='disabled'&&scripts.length===0&&styles.length===0);

// Config discovery is the only load allowed before opt-in activation.
delete globalThis.FEQUEST_PUBLIC_CLOUD_CONFIG_V342;scripts=[];styles=[];
l=A.createActivationLoader({loadScript:async p=>{scripts.push(p);if(p===A.ACTIVATION_SPEC.configPath)globalThis.FEQUEST_PUBLIC_CLOUD_CONFIG_V342={enabled:false}},loadStyle:async p=>styles.push(p)});
r=await l.start();ok('missing global config loads only the fixed same-origin config asset',r.ok&&r.status==='disabled'&&scripts.length===1&&scripts[0]===A.ACTIVATION_SPEC.configPath&&styles.length===0);
delete globalThis.FEQUEST_PUBLIC_CLOUD_CONFIG_V342;

scripts=[];styles=[];runtimeCalls=0;startCalls=0;
l=A.createActivationLoader({config:enabled,loadScript:async p=>scripts.push(p),loadStyle:async p=>styles.push(p),runtimeFactory:opts=>{runtimeCalls++;return {ok:true,status:'ready',start:async()=>{startCalls++;return {ok:true,status:'started'}},stop:()=>true}}});
r=await l.start();
ok('enabled activation loads sync UI stylesheet exactly once',r.ok&&styles.length===1&&styles[0]===A.ACTIVATION_SPEC.stylePath);
ok('pinned local SDK is the first executable cloud dependency',scripts[0]==='./vendor/supabase/supabase-2.112.3.js');
ok('cloud modules load sequentially in declared dependency order',JSON.stringify(scripts)===JSON.stringify([A.ACTIVATION_SPEC.sdkPath,...A.ACTIVATION_SPEC.modulePaths]));
ok('runtime assembly happens only after all fixed cloud scripts load',runtimeCalls===1&&scripts.length===1+A.ACTIVATION_SPEC.modulePaths.length);
ok('validated runtime is started exactly once',r.status==='started'&&startCalls===1);

scripts=[];styles=[];const failAt=A.ACTIVATION_SPEC.modulePaths[2];
l=A.createActivationLoader({config:enabled,loadStyle:async p=>styles.push(p),loadScript:async p=>{scripts.push(p);if(p===failAt)throw new Error('simulated asset failure')},runtimeFactory:()=>{runtimeCalls++;return {ok:true,start:async()=>({ok:true})}} ,warn:()=>{}});
r=await l.start();ok('asset failure fails open and stops before later cloud modules',!r.ok&&r.status==='asset-load-failed'&&r.asset===failAt&&scripts.at(-1)===failAt&&scripts.length<1+A.ACTIVATION_SPEC.modulePaths.length);

scripts=[];styles=[];startCalls=0;
l=A.createActivationLoader({config:enabled,loadScript:async p=>scripts.push(p),loadStyle:async p=>styles.push(p),runtimeFactory:()=>({ok:true,start:async()=>{startCalls++;return {ok:true,status:'started'}},stop:()=>true})});
const p1=l.start(),p2=l.start();await Promise.all([p1,p2]);ok('activation start is single-flight',p1===p2&&startCalls===1);

l=A.createActivationLoader({config:enabled,loadScript:async()=>{},loadStyle:async()=>{},runtimeFactory:()=>({ok:false,status:'sdk-missing',start:async()=>({ok:false})})});
r=await l.start();ok('runtime not-ready result remains fail-open',!r.ok&&r.status==='sdk-missing');

l=A.createActivationLoader({config:enabled,loadScript:async()=>{},loadStyle:async()=>{}});l.stop();r=await l.start();ok('stopped activation cannot start later',!r.ok&&r.status==='stopped');
let rejected=0;for(const bad of ['https://cdn.example/x.js','../secret.js','/root.js']){try{A.localAssetPath(bad)}catch(_){rejected++}}ok('activation asset validator rejects external and traversal paths',rejected===3);
ok('activation spec contains no runtime CDN URL',[A.ACTIVATION_SPEC.configPath,A.ACTIVATION_SPEC.stylePath,A.ACTIVATION_SPEC.sdkPath,...A.ACTIVATION_SPEC.modulePaths].every(x=>x.startsWith('./')&&!x.includes('http')));

console.log('__ACTIVATION__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''

with tempfile.TemporaryDirectory() as td:
    p = Path(td) / 'activation.js'
    p.write_text(program)
    chk = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
    req(chk.returncode == 0, 'loader node syntax ' + chk.stderr[-8000:])
    run = subprocess.run(['node', str(p)], capture_output=True, text=True)
    req(run.returncode == 0, 'loader runtime ' + run.stderr[-12000:])
    marker = re.search(r'__ACTIVATION__([A-Za-z0-9+/=]+)', run.stdout)
    req(marker is not None, 'activation marker missing')
    data = json.loads(base64.b64decode(marker.group(1)))

req(data['allPassed'], 'activation cases failed ' + repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count'] >= 12, 'activation coverage too small')

src = loader.read_text()
current_config = config.read_text()
prod = shell.read_text()
manifest = json.loads(vendor_manifest.read_text())
vendor_bytes = vendor.read_bytes()
actual_sha = hashlib.sha256(vendor_bytes).hexdigest()

req("sdkPath:'./vendor/supabase/supabase-2.112.3.js'" in src, 'pinned SDK path missing')
req(manifest['version'] == '2.112.3' and manifest['sha256'] == actual_sha, 'vendored SDK manifest/hash mismatch')
req(manifest['runtimeExternalCdnRequired'] is False, 'vendored SDK unexpectedly requires external CDN')
req('fetch(' not in src, 'activation loader must not own cloud transport fetch')
for forbidden in ['saveProfile(', 'writeCurrentProfile(', 'localStorage.setItem(', 'indexedDB']:
    req(forbidden not in src, f'activation loader touches learner persistence: {forbidden}')
req('enabled:false' in current_config, 'current public config must remain production-disabled')
req('activation-loader-v342.js' not in prod and 'supabase-2.112.3.js' not in prod, 'v341 production shell must remain cloud-free')

report = f'''# FE QUEST v342 — Cloud activation loader validation\n\nResult: **PASS — {data['count']} / {data['count']} ACTIVATION-LOADER CASES PASS**\n\n- disabled public config loads no SDK, sync UI, or cloud runtime modules\n- absent config is discovered only through the fixed same-origin `public-config-v342.js` path\n- enabled activation loads the same-origin UI stylesheet, pinned Supabase 2.112.3 UMD bundle, then cloud modules in deterministic dependency order\n- runtime assembly/start occurs only after every required script has loaded\n- any asset/runtime failure is fail-open; FE QUEST local study is not blocked\n- activation is single-flight and cannot restart after explicit stop\n- external URLs and path traversal are rejected by the activation asset validator\n- vendored SDK SHA-256 matches `vendor/supabase/manifest-v342.json`: `{actual_sha}`\n- activation loader contains no direct fetch or learner-profile persistence mutation\n- current config remains disabled and v341 production shell remains cloud-free\n\nThe next release-tooling slice may insert only `cloud/activation-loader-v342.js` into the v342 candidate shell and precache its fixed dependency set. Actual cloud activation still requires a verified production redirect URL and Supabase Auth dashboard configuration.\n'''
Path('audits').mkdir(exist_ok=True)
Path('audits/V342_CLOUD_ACTIVATION_LOADER.md').write_text(report)
Path('_regression').mkdir(exist_ok=True)
Path('_regression/cloud-activation-loader-v342.fixture.json').write_text(json.dumps({
    'name':'cloud-activation-loader-v342','result':'PASS','caseCount':data['count'],
    'validatedCases':[x['name'] for x in data['cases']],
    'sdkVersion':'2.112.3','sdkSha256':actual_sha,'sameOriginOnly':True,
    'defaultEnabled':False,'productionLoaded':False
}, ensure_ascii=False, indent=2) + '\n')
print(report)
