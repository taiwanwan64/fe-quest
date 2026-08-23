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
CLOUD_RUNTIME_INTRODUCED_AT=342
CLOUD_ACTIVATION_ENTRYPOINT='./cloud/activation-loader-v342.js'
CLOUD_PUBLIC_CONFIG_PATH='cloud/public-config-v342.js'
V343_ADAPTIVE_PRECISION_SOURCE='app/adaptive-precision-v343.js'
V344_LEARNING_OUTCOMES_SOURCE='app/learning-outcomes-v344.js'


def req(ok,msg):
    if not ok: raise AssertionError(msg)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def ident(path):
    p=Path(path);b=p.read_bytes();return {'path':p.as_posix(),'utf8_bytes':len(b),'sha256':sha_bytes(b)}
def version_number(version):
    m=re.fullmatch(r'v(\d+)',str(version));req(m is not None,'version must match vNNN')
    return int(m.group(1))
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
    # v342 introduced the current cloud implementation. Later app releases inherit the
    # same pinned runtime until a deliberately versioned cloud runtime supersedes it.
    return V342_CLOUD_RUNTIME_ASSETS if version_number(version)>=CLOUD_RUNTIME_INTRODUCED_AT else ()
def cloud_public_config(root,version):
    if version_number(version)<CLOUD_RUNTIME_INTRODUCED_AT:return {'enabled':False,'redirectTo':None}
    q=Path(root)/CLOUD_PUBLIC_CONFIG_PATH;req(q.exists(),'cloud public config missing')
    text=q.read_text()
    enabled=re.search(r'\benabled\s*:\s*true\b',text) is not None
    m=re.search(r"\bredirectTo\s*:\s*'([^']+)'",text)
    redirect=m.group(1) if m else None
    if enabled:req(redirect is not None and redirect.startswith('https://'),'enabled cloud config requires https redirect')
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
    if cloud_runtime_assets(version):
        app_tag=f'<script src="./assets/app-{version}.js"></script>'
        activation_tag=f'<script src="{CLOUD_ACTIVATION_ENTRYPOINT}"></script>'
        req(app_tag in out,'cloud-enabled release core app script tag missing')
        if activation_tag not in out:
            out=out.replace(app_tag,app_tag+'\n'+activation_tag,1)
        req(out.count(activation_tag)==1,'cloud activation loader must appear exactly once')
        req(out.index(app_tag)<out.index(activation_tag),'cloud activation must follow core application script')
    if version=='v344':
        report_anchor='      <div class="analytics-card analytics-priority-card">'
        req(report_anchor in out,'v344 analytics priority anchor missing')
        req('id="analyticsOutcomeReport"' not in out,'v344 learning outcome report unexpectedly already materialized')
        report='''      <div class="analytics-card v344-outcome-card" id="analyticsOutcomeReport">
        <div class="analytics-card-head"><div><h2>最近の学習レポート</h2><div class="sub">保存されている学習記録の範囲で、最近の成果と次の重点をまとめます。</div></div></div>
        <div class="v344-outcome-grid">
          <div class="v344-outcome-item"><span>学習ペース</span><b id="analyticsOutcomeActivity">0分 / 0日</b><small id="analyticsOutcomeActivityNote">直近7日の記録から集計します。</small></div>
          <div class="v344-outcome-item"><span>最近伸びた分野</span><b id="analyticsOutcomeGrowth">比較データを集めています</b><small id="analyticsOutcomeGrowthNote">保存済み回答の範囲で比較します。</small></div>
          <div class="v344-outcome-item"><span>次に伸ばすポイント</span><b id="analyticsOutcomeNext">演習データを集める</b><small id="analyticsOutcomeNextNote">現在の学習記録から案内します。</small></div>
        </div>
        <div class="v344-outcome-evidence-note">正答率の変化は「直近の保存済み回答」と「その前の保存済み回答」を比べます。今週と先週の完全な成績比較ではありません。</div>
      </div>
'''
        out=out.replace(report_anchor,report+report_anchor,1)
        req(out.count('id="analyticsOutcomeReport"')==1,'v344 learning outcome report must appear exactly once')
    return out
def replace_named_function(text,name,replacement):
    m=re.search(rf'\bfunction\s+{re.escape(name)}\s*\([^)]*\)\s*\{{',text)
    req(m is not None,'named function missing '+name)
    i=m.end()-1;depth=0;quote=None;escape=False
    while i<len(text):
        ch=text[i]
        if quote:
            if escape:escape=False
            elif ch=='\\':escape=True
            elif ch==quote:quote=None
        else:
            if ch in "'\"`":quote=ch
            elif ch=='{':depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:
                    end=i+1
                    return text[:m.start()]+replacement.strip()+text[end:]
        i+=1
    raise AssertionError('unterminated named function '+name)
def transform_css(text,previous,version):
    out=text
    if version=='v344':
        marker='/* ===== v344: bounded learning outcome report ===== */'
        req(marker not in out,'v344 learning outcome CSS unexpectedly already materialized')
        block='''

/* ===== v344: bounded learning outcome report ===== */
.v344-outcome-card{border-color:#d9e6ec;background:linear-gradient(180deg,#fff 0%,#fbfdfe 100%)}
.v344-outcome-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.v344-outcome-item{min-width:0;border:1px solid #e1e8ec;border-radius:15px;background:#fff;padding:13px}
.v344-outcome-item span{display:block;font-size:14px;color:var(--muted);font-weight:900;margin-bottom:5px}
.v344-outcome-item b{display:block;font-size:17px;line-height:1.45;color:#17324a;overflow-wrap:anywhere}
.v344-outcome-item small{display:block;font-size:14px;line-height:1.55;color:#5f7383;margin-top:5px}
.v344-outcome-evidence-note{font-size:14px;line-height:1.6;color:#667887;margin-top:10px}
@media(max-width:700px){.v344-outcome-grid{grid-template-columns:1fr}.v344-outcome-item{padding:12px}}
'''
        out=out.rstrip()+block+'\n'
        req(out.count(marker)==1,'v344 learning outcome CSS must appear exactly once')
    return out

def transform_js(text,previous,version,feature_source=None):
    old=f"const APP_VERSION = '{previous}';";new=f"const APP_VERSION = '{version}';"
    req(old in text,'previous APP_VERSION missing from split JS')
    out=text.replace(old,new,1)
    req(new in out,'target APP_VERSION missing from split JS')
    if version_number(version)>=CLOUD_RUNTIME_INTRODUCED_AT:
        # WebKit 301648: on iOS 26, padded date/time controls can calculate width:100%
        # wider than their containing block. v342 introduced this native-picker-preserving
        # correction; later releases must inherit it rather than reverting to percentage width.
        old_date='#firstRunExperienceV340 input[type=date]{width:100%;min-height:46px;'
        new_date='#firstRunExperienceV340 input[type=date]{width:auto;inline-size:auto;min-width:0;min-inline-size:0;max-width:100%;max-inline-size:100%;display:block;box-sizing:border-box;-webkit-min-logical-width:0;justify-self:stretch;align-self:stretch;overflow:hidden;min-height:46px;'
        if old_date in out:out=out.replace(old_date,new_date,1)
        req(new_date in out,'Safari first-run date sizing correction missing')
    if version=='v343':
        feature=feature_source if feature_source is not None else Path(V343_ADAPTIVE_PRECISION_SOURCE).read_text()
        req('V343_ADAPTIVE_PRECISION_SPEC' in feature,'v343 adaptive precision source marker missing')
        req('V343_ADAPTIVE_PRECISION_SPEC' not in out,'v343 adaptive precision unexpectedly already materialized')
        out=replace_named_function(out,'recommendedPrescription',feature)
        req(out.count('const V343_ADAPTIVE_PRECISION_SPEC=')==1,'v343 adaptive precision must be injected exactly once')
        req(out.count('function recommendedPrescription()')==1,'v343 recommended prescription replacement must be unique')
    if version=='v344':
        feature=feature_source if feature_source is not None else Path(V344_LEARNING_OUTCOMES_SOURCE).read_text()
        req('V344_LEARNING_OUTCOMES_SPEC' in feature,'v344 learning outcomes source marker missing')
        req('V344_LEARNING_OUTCOMES_SPEC' not in out,'v344 learning outcomes unexpectedly already materialized')
        out=replace_named_function(out,'renderLearningAnalytics',feature)
        req(out.count('const V344_LEARNING_OUTCOMES_SPEC=')==1,'v344 learning outcomes must be injected exactly once')
        req(out.count('function renderLearningAnalytics()')==1,'v344 analytics render replacement must be unique')
        req(out.count('function learningOutcomeReportDecisionV344(')==1,'v344 report decision helper must be unique')
    return out
def build_asset_manifest(root,previous,version,previous_manifest=None):
    root=Path(root);p=paths(root,version);shell_b=p['shell'].read_bytes();css_b=p['css'].read_bytes();js_b=p['js'].read_bytes()
    cloud_assets=cloud_runtime_assets(version)
    execution={
      'applicationScriptTagCount':2 if cloud_assets else 1,'scriptType':'classic','scriptRegion':'body',
      'currentScript':False,'documentWrite':False,'importMeta':False,'moduleSyntax':False,
      'orderPreserved':True,'assetRecoveryBootstrap':True,'recoveryMutatesLearningData':False,
      'cloudActivationEntrypoint':CLOUD_ACTIVATION_ENTRYPOINT[2:] if cloud_assets else None,
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
    if version=='v343':
        feature_path=root/V343_ADAPTIVE_PRECISION_SOURCE
        req(feature_path.exists(),'v343 adaptive precision source missing')
        feature_b=feature_path.read_bytes()
        result['adaptivePrecision']={
          'version':'v343','sourcePath':V343_ADAPTIVE_PRECISION_SOURCE,
          'utf8Bytes':len(feature_b),'sha256':sha_bytes(feature_b),'profileSchemaChange':False
        }
    if version=='v344':
        feature_path=root/V344_LEARNING_OUTCOMES_SOURCE
        req(feature_path.exists(),'v344 learning outcomes source missing')
        feature_b=feature_path.read_bytes()
        result['learningOutcomes']={
          'version':'v344','sourcePath':V344_LEARNING_OUTCOMES_SOURCE,
          'utf8Bytes':len(feature_b),'sha256':sha_bytes(feature_b),'profileSchemaChange':False,
          'evidenceBasis':'bounded-recorded-answers-and-calendar-activity'
        }
    if cloud_assets:
        cloud=[]
        for rel in cloud_assets:
            q=root/rel[2:];req(q.exists(),'cloud runtime asset missing '+rel)
            b=q.read_bytes();cloud.append({'path':rel[2:],'utf8Bytes':len(b),'sha256':sha_bytes(b)})
        public_config=cloud_public_config(root,version)
        result['cloudActivation']={
          'enabledByConfig':True,
          'defaultConfigEnabled':public_config['enabled'],
          'configuredRedirectTo':public_config['redirectTo'],
          'publicConfigSha256':public_config['sha256'],
          'entrypoint':CLOUD_ACTIVATION_ENTRYPOINT[2:],
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
    target['css'].write_text(transform_css(prev['css'].read_text(),previous,version))
    feature_source=None
    if version=='v343':feature_source=(root/V343_ADAPTIVE_PRECISION_SOURCE).read_text()
    elif version=='v344':feature_source=(root/V344_LEARNING_OUTCOMES_SOURCE).read_text()
    target['js'].write_text(transform_js(prev['js'].read_text(),previous,version,feature_source))
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
        for rel in cloud_assets:req((root/rel[2:]).exists(),'service worker cloud precache source missing '+rel)
        missing=[rel for rel in cloud_assets if f"'{rel}'" not in w]
        if missing:
            app_shell_start=w.find('const APP_SHELL = [');close=w.find('\n];',app_shell_start)
            req(app_shell_start>=0 and close>app_shell_start,'service worker app-shell closing anchor missing')
            before=w[:close].rstrip()
            if not before.endswith(','):before+=','
            addition='\n'+',\n'.join(f"  '{rel}'" for rel in missing)
            w=before+addition+w[close:]
        for rel in cloud_assets:req(w.count(f"'{rel}'")==1,'service worker cloud asset must be precached exactly once '+rel)
    for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]:req(token in w,'SW behavior '+token)
    target['sw'].write_text(w)
    return {'already_materialized':False,'files':target}
