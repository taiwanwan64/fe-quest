from pathlib import Path
import hashlib,json,os,re,shutil,subprocess


V342_CLOUD_RUNTIME_ASSETS=(
  './cloud/activation-loader-v342.js',
  './cloud/public-config-v342.js',
  './cloud/sync-ui-v342.css',
  './vendor/supabase/supabase-2.112.3.js',
  './cloud/sync-contract-v342.js',
  './cloud/sync-state-v342.js',
  './cloud/sync-engine-v342.js',
  './cloud/supabase/transport-v342.js',
  './cloud/supabase/auth-boundary-v342.js',
  './cloud/production-adapter-v342.js',
  './cloud/reconciliation-v342.js',
  './cloud/local-reconciliation-adapter-v342.js',
  './cloud/sync-controller-v342.js',
  './cloud/sync-ui-v342.js',
  './cloud/runtime-bootstrap-v342.js'
)


def req(ok,msg):
    if not ok: raise AssertionError(msg)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def ident(path):
    p=Path(path);b=p.read_bytes();return {'path':p.as_posix(),'utf8_bytes':len(b),'sha256':sha_bytes(b)}
def release_context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-staging',branch)
    req(m is not None,'release branch must match vNNN-staging')
    version=m.group(1);number=int(m.group(2));req(number>=342,'split release tooling starts at v342')
    return branch,version,number,f'v{number-1}'

def paths(root,version):
    root=Path(root)
    return {
      'index':root/'index.html',
      'shell':root/f'app/base-shell-{version}.html',
      'css':root/f'assets/app-{version}.css',
      'js':root/f'assets/app-{version}.js',
      'asset_manifest':root/f'assets/asset-manifest-{version}.json',
      'manifest':root/'manifest.webmanifest',
      'sw':root/'sw.js'
    }
def source_is_split(root,version):
    p=paths(root,version)
    if not p['index'].exists():return False
    return f'{{% include_relative app/base-shell-{version}.html %}}' in p['index'].read_text()
def cloud_runtime_assets(version):
    return V342_CLOUD_RUNTIME_ASSETS if version=='v342' else ()
def cloud_public_config(root,version):
    if version!='v342':return {'enabled':False,'redirectTo':None}
    q=Path(root)/'cloud/public-config-v342.js';req(q.exists(),'v342 public cloud config missing')
    text=q.read_text()
    enabled=re.search(r'\benabled\s*:\s*true\b',text) is not None
    m=re.search(r"\bredirectTo\s*:\s*'([^']+)'",text)
    redirect=m.group(1) if m else None
    if enabled:req(redirect is not None and redirect.startswith('https://'),'enabled v342 cloud config requires https redirect')
    return {'enabled':enabled,'redirectTo':redirect,'sha256':sha_bytes(q.read_bytes())}
def transform_shell(text,previous,version):
    replacements=[
      (f'<title>FE QUEST PWA {previous}</title>',f'<title>FE QUEST PWA {version}</title>'),
      (f'./assets/app-{previous}.css',f'./assets/app-{version}.css'),
      (f'./assets/app-{previous}.js',f'./assets/app-{version}.js'),
      (f'FEQUEST_ASSET_RECOVERY_{previous.upper()}',f'FEQUEST_ASSET_RECOVERY_{version.upper()}'),
      (f'fequestAssetRecovery{previous.upper()}',f'fequestAssetRecovery{version.upper()}')
    ]
    out=text
    for a,b in replacements:
        if a in out:out=out.replace(a,b)
    req(f'<title>FE QUEST PWA {version}</title>' in out,'target shell title')
    req(f'./assets/app-{version}.css' in out and f'./assets/app-{version}.js' in out,'target shell asset refs')
    req(f'FEQUEST_ASSET_RECOVERY_{version.upper()}_START' in out,'target recovery bootstrap marker')
    if version=='v342':
        app_tag=f'<script src="./assets/app-{version}.js"></script>'
        activation_tag='<script src="./cloud/activation-loader-v342.js"></script>'
        req(app_tag in out,'v342 core app script tag missing before cloud activation insertion')
        req(activation_tag not in out,'v342 cloud activation loader unexpectedly already present')
        out=out.replace(app_tag,app_tag+'\n'+activation_tag,1)
        req(out.index(app_tag)<out.index(activation_tag),'v342 cloud activation must follow core application script')
    return out
def transform_js(text,previous,version):
    old=f"const APP_VERSION = '{previous}';";new=f"const APP_VERSION = '{version}';"
    req(old in text,'previous APP_VERSION missing from split JS')
    out=text.replace(old,new,1)
    req(new in out,'target APP_VERSION missing from split JS')
    if version=='v342':
        # WebKit 301648: on iOS 26, padded date/time controls can calculate width:100%
        # wider than their containing block. Preserve the native picker, but avoid percentage
        # width on the date control itself and let the already-clamped grid contain it.
        old_date='#firstRunExperienceV340 input[type=date]{width:100%;min-height:46px;'
        new_date='#firstRunExperienceV340 input[type=date]{width:auto;inline-size:auto;min-width:0;min-inline-size:0;max-width:100%;max-inline-size:100%;display:block;box-sizing:border-box;-webkit-min-logical-width:0;justify-self:stretch;align-self:stretch;overflow:hidden;min-height:46px;'
        req(old_date in out,'v342 first-run date style anchor missing')
        out=out.replace(old_date,new_date,1)
        req(new_date in out,'v342 Safari first-run date sizing hotfix missing')
    return out
def build_asset_manifest(root,previous,version,previous_manifest=None):
    root=Path(root);p=paths(root,version);shell_b=p['shell'].read_bytes();css_b=p['css'].read_bytes();js_b=p['js'].read_bytes()
    cloud_assets=cloud_runtime_assets(version)
    execution={
      'applicationScriptTagCount':2 if cloud_assets else 1,'scriptType':'classic','scriptRegion':'body',
      'currentScript':False,'documentWrite':False,'importMeta':False,'moduleSyntax':False,
      'orderPreserved':True,'assetRecoveryBootstrap':True,'recoveryMutatesLearningData':False,
      'cloudActivationEntrypoint':'cloud/activation-loader-v342.js' if cloud_assets else None,
      'cloudActivationFailOpen':True if cloud_assets else None
    }
    result={
      'version':version,
      'previousVersion':previous,
      'strategy':'versioned-split-shell-classic-script-stylesheet',
      'sourceRelease':previous_manifest or {'version':previous},
      'shell':{'sourcePath':p['shell'].relative_to(root).as_posix(),'utf8Bytes':len(shell_b),'sha256':sha_bytes(shell_b)},
      'assets':[
        {'path':p['css'].relative_to(root).as_posix(),'kind':'style','utf8Bytes':len(css_b),'sha256':sha_bytes(css_b)},
        {'path':p['js'].relative_to(root).as_posix(),'kind':'classic-script','utf8Bytes':len(js_b),'sha256':sha_bytes(js_b)}
      ],
      'executionContract':execution
    }
    if cloud_assets:
        cloud=[]
        for rel in cloud_assets:
            q=root/rel[2:];req(q.exists(),'v342 cloud runtime asset missing '+rel)
            b=q.read_bytes();cloud.append({'path':rel[2:],'utf8Bytes':len(b),'sha256':sha_bytes(b)})
        public_config=cloud_public_config(root,version)
        result['cloudActivation']={
          'enabledByConfig':True,
          'defaultConfigEnabled':public_config['enabled'],
          'configuredRedirectTo':public_config['redirectTo'],
          'publicConfigSha256':public_config['sha256'],
          'entrypoint':'cloud/activation-loader-v342.js',
          'sdk':'vendor/supabase/supabase-2.112.3.js',
          'sameOriginOnly':True,
          'precache':[x['path'] for x in cloud],
          'assets':cloud
        }
    return result
def materialize_tree(root,version,previous):
    root=Path(root);prev=paths(root,previous);target=paths(root,version)
    req(source_is_split(root,previous) or source_is_split(root,version),'root is not recognized split distribution')
    if source_is_split(root,version):
        # Idempotent rerun after the materialized source was already committed.
        for key in ['shell','css','js','asset_manifest','manifest','sw']: req(target[key].exists(),'materialized target missing '+key)
        return {'already_materialized':True,'files':target}

    for key in ['shell','css','js','asset_manifest','manifest','sw']:
        req(prev[key].exists(),'previous split file missing '+prev[key].as_posix())
    previous_manifest=json.loads(prev['asset_manifest'].read_text())
    req(previous_manifest.get('version')==previous,'previous asset manifest version')

    target['shell'].parent.mkdir(parents=True,exist_ok=True);target['css'].parent.mkdir(parents=True,exist_ok=True)
    target['shell'].write_text(transform_shell(prev['shell'].read_text(),previous,version))
    shutil.copyfile(prev['css'],target['css'])
    target['js'].write_text(transform_js(prev['js'].read_text(),previous,version))
    target['asset_manifest'].write_text(json.dumps(build_asset_manifest(root,previous,version,{
      'version':previous,
      'assetManifestSha256':sha_bytes(prev['asset_manifest'].read_bytes()),
      'shellSha256':sha_bytes(prev['shell'].read_bytes()),
      'cssSha256':sha_bytes(prev['css'].read_bytes()),
      'jsSha256':sha_bytes(prev['js'].read_bytes())
    }),ensure_ascii=False,indent=2)+'\n')
    target['index'].write_text(f'---\n---\n{{% include_relative app/base-shell-{version}.html %}}\n')

    m=json.loads(target['manifest'].read_text());req(m.get('name')==f'FE QUEST {previous}','previous web manifest mismatch')
    m['name']=f'FE QUEST {version}'
    m['description']=f'基本情報技術者試験向けPWA。{version}。ローカルファーストの適応学習・復旧・分割配信構造を維持する。'
    target['manifest'].write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

    w=target['sw'].read_text();req(f"const APP_VERSION = '{previous}';" in w and f"fe-quest-{previous}-1" in w,'previous service worker version')
    w=w.replace(f"const APP_VERSION = '{previous}';",f"const APP_VERSION = '{version}';",1)
    w=w.replace(f"const CACHE_NAME = 'fe-quest-{previous}-1';",f"const CACHE_NAME = 'fe-quest-{version}-1';",1)
    for old,new in [
      (f"'./assets/app-{previous}.css'",f"'./assets/app-{version}.css'"),
      (f"'./assets/app-{previous}.js'",f"'./assets/app-{version}.js'"),
      (f"'./assets/asset-manifest-{previous}.json'",f"'./assets/asset-manifest-{version}.json'")
    ]:
        req(old in w,'previous SW asset ref missing '+old);w=w.replace(old,new,1)
    cloud_assets=cloud_runtime_assets(version)
    if cloud_assets:
        anchor="  './apple-touch-icon.png'\n];"
        req(anchor in w,'service worker app-shell anchor missing for v342 cloud precache')
        for rel in cloud_assets:req((root/rel[2:]).exists(),'service worker cloud precache source missing '+rel)
        lines=',\n'.join(f"  '{rel}'" for rel in cloud_assets)
        w=w.replace(anchor,"  './apple-touch-icon.png',\n"+lines+'\n];',1)
    for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]:req(token in w,'SW behavior '+token)
    target['sw'].write_text(w)
    return {'already_materialized':False,'files':target}
