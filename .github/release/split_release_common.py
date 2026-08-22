from pathlib import Path
import hashlib,json,os,re,shutil,subprocess


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
    return out

def transform_js(text,previous,version):
    old=f"const APP_VERSION = '{previous}';";new=f"const APP_VERSION = '{version}';"
    req(old in text,'previous APP_VERSION missing from split JS')
    out=text.replace(old,new,1)
    req(new in out,'target APP_VERSION missing from split JS')
    return out

def build_asset_manifest(root,previous,version,previous_manifest=None):
    p=paths(root,version);shell_b=p['shell'].read_bytes();css_b=p['css'].read_bytes();js_b=p['js'].read_bytes()
    execution={
      'applicationScriptTagCount':1,'scriptType':'classic','scriptRegion':'body',
      'currentScript':False,'documentWrite':False,'importMeta':False,'moduleSyntax':False,
      'orderPreserved':True,'assetRecoveryBootstrap':True,'recoveryMutatesLearningData':False
    }
    return {
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
    for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]:req(token in w,'SW behavior '+token)
    target['sw'].write_text(w)
    return {'already_materialized':False,'files':target}
