from pathlib import Path
import hashlib, json, shutil

PARENT_MAIN='f61e6032aad53109284b9a24ba43191e4447944d'
PARENT_TREE='9c00a408580de94fdab252e10d2cbb4860cb4d41'
WRAPPER_BYTES=19860
WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
BASE_BYTES=2991671
BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723
LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525
RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
ADAPTER_TEXT="""// ===== FE QUEST stable release adapter =====\n(() => {\n  const adapterName='runV'+APP_VERSION.slice(1)+'SelfCheck';\n  globalThis[adapterName]=function(){return feqRunSelfCheck(APP_VERSION,adapterName);};\n})();\n"""
ADAPTER_BYTES=211
ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'

def req(v,m):
    if not v: raise AssertionError(m)
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

# Stable architecture sources must remain pinned.
wrapper=Path('app/runtime-diagnostic-wrapper.txt')
req(wrapper.exists() and len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper drift')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base drift')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning drift')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'stable semantic runtime drift')

# Retire the final versioned thin adapter into regression provenance.
old=Path('app/v175-block-00.txt'); arch=Path('_regression/archive/diagnostics/v175-block-00.txt')
if old.exists():
    req(not arch.exists(),'v175 adapter already archived while active copy exists')
    arch.parent.mkdir(parents=True,exist_ok=True); shutil.move(old,arch)
req(arch.exists() and not old.exists(),'v175 adapter archive boundary')

# Materialize one versionless stable adapter. It derives the public current-adapter name from APP_VERSION.
stable=Path('app/runtime-release-adapter.txt')
if stable.exists(): req(stable.read_text()==ADAPTER_TEXT,'stable adapter drift')
else: stable.write_text(ADAPTER_TEXT)
req(len(stable.read_bytes())==ADAPTER_BYTES and sha_file(stable)==ADAPTER_SHA,'stable adapter identity')
req(not Path('app/v176-block-00.txt').exists(),'versioned v176 adapter must not exist')

# Release-specific metadata advances; stable wrapper does not.
spec=Path('app/runtime-release-diagnostic-spec.txt'); s=spec.read_text()
if "releaseVersion:'v175'" in s:
    repls=[
      ("releaseVersion:'v175'","releaseVersion:'v176'"),
      ("currentReleaseAdapter:'runV175SelfCheck'","currentReleaseAdapter:'runV176SelfCheck'"),
      ("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v175.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v176.fixture.json'"),
      ('archivedSourceCount:57','archivedSourceCount:58'),
      ('retiredReleaseAdapterCount:15','retiredReleaseAdapterCount:16'),
      ("'runV174SelfCheck'])","'runV174SelfCheck','runV175SelfCheck'])")
    ]
    for a,b in repls:
        req(a in s,'release metadata token missing '+a); s=s.replace(a,b,1)
    spec.write_text(s)
s=spec.read_text()
for token in ["releaseVersion:'v176'","currentReleaseAdapter:'runV176SelfCheck'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v176.fixture.json'",'archivedSourceCount:58','retiredReleaseAdapterCount:16',"'runV175SelfCheck'"]:
    req(token in s,'v176 release metadata '+token)

# Release/archive fixture advances exactly one archived adapter.
prev=Path('_regression/production-source-archive-boundary-v175.fixture.json')
out=Path('_regression/production-source-archive-boundary-v176.fixture.json')
d=json.loads(prev.read_text())
d['name']='production-source-archive-boundary-v176'; d['version']='v176'; d['archived_source_count']=58
entry={'name':'v175-block-00.txt','old_path':'app/v175-block-00.txt','archive_path':'_regression/archive/diagnostics/v175-block-00.txt','utf8_bytes':len(arch.read_bytes()),'sha256':sha_file(arch)}
d['archive_entries']=[x for x in d['archive_entries'] if x.get('name')!='v175-block-00.txt']+[entry]
req(len(d['archive_entries'])==58,'v176 diagnostic archive fixture count')
d['production_app_archival_residual_count']=0
out.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==58,'physical diagnostic archive count')

# Version shell: switch assembler from a versioned adapter include to the stable adapter include.
idx=Path('index.html'); t=idx.read_text()
if 'app/v175-block-00.txt' in t:
    t=t.replace('{% capture v175block %}{% include_relative app/v175-block-00.txt %}{% endcapture %}','{% capture stableReleaseAdapter %}{% include_relative app/runtime-release-adapter.txt %}{% endcapture %}',1)
    t=t.replace('<title>FE QUEST PWA v175</title>','<title>FE QUEST PWA v176</title>',1)
    t=t.replace("const APP_VERSION = 'v175';","const APP_VERSION = 'v176';",1)
    t=t.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV175SelfCheck();',"applyV143LateFixes();window.FEQUEST_SELF_CHECK=globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']();",1)
    t=t.replace('{{ v175block }}','{{ stableReleaseAdapter }}',1)
    idx.write_text(t)
t=idx.read_text()
req('{% include_relative app/runtime-release-adapter.txt %}' in t and 'v175-block-00.txt' not in t and 'v176-block-00.txt' not in t,'stable adapter assembler')
req("<title>FE QUEST PWA v176</title>" in t and "const APP_VERSION = 'v176';" in t,'v176 assembler version')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic current-adapter boot')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v176'
m['description']='基本情報技術者試験向けPWA。v176では、versioned thin release adapterをversionless stable adapterへ置き換え、APP_VERSIONからcurrent self-check名を導出する。stable wrapper・科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持し、versioned adapterをproductionから除外する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); w=sw.read_text()
if "const APP_VERSION = 'v175';" in w:
    w=w.replace("const APP_VERSION = 'v175';","const APP_VERSION = 'v176';",1).replace("const CACHE_NAME = 'fe-quest-v175-1';","const CACHE_NAME = 'fe-quest-v176-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v176';" in w and 'fe-quest-v176-1' in w,'SW v176')
sw.write_text(w)

fx={
  'name':'stable-release-adapter-v176','version':'v176','scope':'versionless-current-release-adapter-materialization',
  'policy':'derive-current-adapter-name-from-app-version-with-zero-versioned-production-adapter-source',
  'parent_release':{'version':'v175','main_sha':PARENT_MAIN,'tree':PARENT_TREE},
  'stable_wrapper':ident(wrapper,expected_unchanged=True),
  'stable_release_adapter':ident(stable,derived_global_expression="runV + APP_VERSION.slice(1) + SelfCheck",expected_future_byte_stable=True),
  'retired_versioned_adapter':ident(arch,name='runV175SelfCheck'),
  'release_metadata_module':ident(spec,release_version='v176',retired_release_adapter_count=16,diagnostic_archive_count=58),
  'production_versioned_adapter_source_count':0,
  'stable_base':ident('app/base-stable.html'),'stable_learning_module':ident('app/learning-patches.txt'),'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
  'validation':{'status':'pending','reference_mode':'counterfactual-versioned-v176-adapter'}
}
Path('_regression/stable-release-adapter-v176.fixture.json').write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

Path('audits/STABLE_RELEASE_ADAPTER_AUDIT_v176.txt').write_text(f'''FE QUEST v176 — Stable Release Adapter Audit\n==============================================\n\nScope\n-----\nv176 replaces the per-release app/vXXX-block-00.txt production adapter with one versionless app/runtime-release-adapter.txt. The stable adapter derives the expected public runV{{version}}SelfCheck global name from APP_VERSION and delegates to feqRunSelfCheck without changing the stable diagnostic wrapper.\n\nPinned stable wrapper\n---------------------\nUTF-8 bytes: {WRAPPER_BYTES:,}\nSHA-256: {WRAPPER_SHA}\nChanged by v176: no\n\nCandidate stable adapter\n------------------------\nPath: app/runtime-release-adapter.txt\nUTF-8 bytes: {ADAPTER_BYTES}\nSHA-256: {ADAPTER_SHA}\nVersioned production adapter sources: 0\nCurrent public adapter derived at runtime: runV176SelfCheck\nRetired adapter inventory: 16 (runV160SelfCheck through runV175SelfCheck)\nDiagnostic/provenance archive count: 58\n\nValidation status\n-----------------\npending authoritative candidate/reference GitHub Pages validation\n''')

req(len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper changed during v176 materialization')
print('FEQUEST_V176_SOURCE_MATERIALIZED wrapper-byte-stable=1 stable-adapter=%d versioned-adapter-source=0 release-metadata=%d retired-adapters=16 diagnostic-archive=58 base=%d learning=%d runtime=%d' % (ADAPTER_BYTES,len(spec.read_bytes()),BASE_BYTES,LEARNING_BYTES,RUNTIME_BYTES))
