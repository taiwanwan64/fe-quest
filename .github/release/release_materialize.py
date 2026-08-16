from pathlib import Path
import hashlib, json, os, re, subprocess

WRAPPER_BYTES=19860; WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211; ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
METADATA_BYTES=859; METADATA_SHA='8b1b4889588abea7ff52609341350a21804aee026d95bec24ea70eb3e2f668e2'
INVENTORY_BYTES=17671; INVENTORY_SHA='b290a576691505999bc734197aba4623a80f2d055a1a48fe718e55cd6dbb3250'
BASE_BYTES=2991671; BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723; LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525; RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

def release_context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-staging',branch)
    req(m is not None,'release branch must match vNNN-staging')
    version=m.group(1); number=int(m.group(2)); req(number>160,'release number too old')
    return branch,version,number,f'v{number-1}'

branch,version,number,previous=release_context()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()

stable=[
 ('app/runtime-diagnostic-wrapper.txt',WRAPPER_BYTES,WRAPPER_SHA),
 ('app/runtime-release-adapter.txt',ADAPTER_BYTES,ADAPTER_SHA),
 ('app/runtime-release-diagnostic-spec.txt',METADATA_BYTES,METADATA_SHA),
 ('_regression/diagnostic-archive-inventory.fixture.json',INVENTORY_BYTES,INVENTORY_SHA),
 ('app/base-stable.html',BASE_BYTES,BASE_SHA),
 ('app/learning-patches.txt',LEARNING_BYTES,LEARNING_SHA),
 ('app/runtime-semantic-diagnostics.txt',RUNTIME_BYTES,RUNTIME_SHA),
]
for p,b,s in stable:
    q=Path(p); req(q.exists() and len(q.read_bytes())==b and sha_file(q)==s,'stable identity '+p)
    req(q.read_bytes()==subprocess.check_output(['git','show',parent+':'+p]),'main byte drift '+p)

spec=Path('app/runtime-release-diagnostic-spec.txt').read_text()
req('const releaseVersion=APP_VERSION;' in spec,'release metadata not APP_VERSION-driven')
req(not re.search(r"['\"]v\d+['\"]",spec),'release literal embedded in stable metadata')
req(not re.search(r"['\"]runV\d+SelfCheck['\"]",spec),'adapter literal embedded in stable metadata')
req(not [p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)],'versioned adapter source residual')

inv=json.loads(Path('_regression/diagnostic-archive-inventory.fixture.json').read_text())
req(inv['archived_source_count']==58 and len(inv['archive_entries'])==58,'archive inventory count')
req(len([p for p in Path(inv['archive_root']).iterdir() if p.is_file()])==58,'physical diagnostic archive count')

idx=Path('index.html'); t=idx.read_text()
req(f'<title>FE QUEST PWA {previous}</title>' in t,f'previous title {previous} missing')
req(f"const APP_VERSION = '{previous}';" in t,f'previous APP_VERSION {previous} missing')
t=t.replace(f'<title>FE QUEST PWA {previous}</title>',f'<title>FE QUEST PWA {version}</title>',1)
t=t.replace(f"const APP_VERSION = '{previous}';",f"const APP_VERSION = '{version}';",1)
idx.write_text(t)
t=idx.read_text()
req(f'<title>FE QUEST PWA {version}</title>' in t and f"const APP_VERSION = '{version}';" in t,'target index shell')
req('{% include_relative app/runtime-release-diagnostic-spec.txt %}' in t,'stable metadata include missing')
req('{% include_relative app/runtime-release-adapter.txt %}' in t,'stable adapter include missing')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic self-check boot drift')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
req(m.get('name')==f'FE QUEST {previous}','previous manifest version mismatch')
m['name']=f'FE QUEST {version}'
m['description']=f'基本情報技術者試験向けPWA。{version}。科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持し、安定化したrelease architectureと検証工程で提供する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
req(mp.read_text().lstrip().startswith('{'),'manifest source must remain direct JSON')

sw=Path('sw.js'); w=sw.read_text()
req(not w.startswith('---'),'service worker must remain direct JavaScript')
req(f"const APP_VERSION = '{previous}';" in w and f"fe-quest-{previous}-1" in w,'previous service worker version mismatch')
w=w.replace(f"const APP_VERSION = '{previous}';",f"const APP_VERSION = '{version}';",1)
w=w.replace(f"const CACHE_NAME = 'fe-quest-{previous}-1';",f"const CACHE_NAME = 'fe-quest-{version}-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
sw.write_text(w)

fixture=Path(f'_regression/release-tooling-cadence-{version}.fixture.json')
audit=Path(f'audits/RELEASE_TOOLING_CADENCE_AUDIT_{version}.txt')
fx={
 'name':f'release-tooling-cadence-{version}',
 'version':version,
 'scope':'validate-versionless-release-tooling-against-mechanical-conventional-reference',
 'branch':branch,
 'parent_main_sha':parent,
 'previous_version':previous,
 'stable_modules':[ident(p,parent_byte_identical=True) for p,_,_ in stable[:4]],
 'release_specific_diagnostic_architecture_changed_files':0,
 'expected_runtime':{
   'releaseVersion':version,
   'currentReleaseAdapter':f'runV{number}SelfCheck',
   'retiredReleaseAdapterCount':number-160,
   'retiredReleaseAdapterRange':f'runV160SelfCheck..runV{number-1}SelfCheck'
 },
 'diagnostic_archive':{'previous_count':58,'current_count':58,'growth':0},
 'production_versioned_adapter_source_count':0,
 'outer_shell':{'strategy':'conventional-explicit-three-file','files':['index.html','manifest.webmanifest','sw.js']},
 'stable_base':ident('app/base-stable.html'),
 'stable_learning_module':ident('app/learning-patches.txt'),
 'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
 'validation':{'status':'pending'}
}
fixture.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
audit.write_text(f'''FE QUEST {version} — Release Tooling Cadence Audit\n====================================================\n\nTarget\n------\nBranch: {branch}\nVersion: {version}\nPrevious: {previous}\nParent main: {parent}\n\nCandidate\n---------\nVersionless workflow/tooling derives the target release from the staging branch name.\nOnly the conventional outer shell is materialized: index.html, manifest.webmanifest, sw.js.\nDiagnostic architecture modules remain byte-exact to parent main.\n\nExpected runtime\n----------------\nCurrent adapter: runV{number}SelfCheck\nRetired adapters: {number-160} (runV160SelfCheck through runV{number-1}SelfCheck)\nDiagnostic archive: 58 / growth 0\n\nValidation status\n-----------------\npending real GitHub Pages/Jekyll candidate/reference validation\n''')
print(f'FEQUEST_RELEASE_SOURCE_MATERIALIZED version={version} previous={previous} diagnostic-architecture-changed=0 retired-adapters={number-160} diagnostic-archive=58 archive-growth=0 outer-shell=conventional-three-file')
