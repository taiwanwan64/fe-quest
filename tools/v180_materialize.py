from pathlib import Path
import hashlib, json, re, subprocess

PARENT_MAIN='cd65d500ab0eab81cf44a975a138025eac7b950d'
PARENT_TREE='7d701728391e12ba4191bb9fa701b8621d88aa7d'
WRAPPER_BYTES=19860
WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211
ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
INVENTORY_BYTES=17671
INVENTORY_SHA='b290a576691505999bc734197aba4623a80f2d055a1a48fe718e55cd6dbb3250'
BASE_BYTES=2991671
BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723
LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525
RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
STABLE_INVENTORY='_regression/diagnostic-archive-inventory.fixture.json'
FORBIDDEN_BOUNDARY='_regression/production-source-archive-boundary-v180.fixture.json'
FIXTURE='_regression/derived-release-diagnostic-metadata-v180.fixture.json'
AUDIT='audits/DERIVED_RELEASE_DIAGNOSTIC_METADATA_AUDIT_v180.txt'

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

wrapper=Path('app/runtime-diagnostic-wrapper.txt'); adapter=Path('app/runtime-release-adapter.txt'); invp=Path(STABLE_INVENTORY)
req(len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper drift')
req(len(adapter.read_bytes())==ADAPTER_BYTES and sha_file(adapter)==ADAPTER_SHA,'stable adapter drift')
req(len(invp.read_bytes())==INVENTORY_BYTES and sha_file(invp)==INVENTORY_SHA,'stable inventory drift')
req(wrapper.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-diagnostic-wrapper.txt']),'wrapper differs from v179 parent')
req(adapter.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-release-adapter.txt']),'adapter differs from v179 parent')
req(invp.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':'+STABLE_INVENTORY]),'inventory differs from v179 parent')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base drift')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning drift')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'semantic runtime drift')

inv=json.loads(invp.read_text())
req(inv['archived_source_count']==58 and len(inv['archive_entries'])==58 and inv['production_app_archival_residual_count']==0,'stable inventory counts')
physical=[p for p in Path(inv['archive_root']).iterdir() if p.is_file()]
req(len(physical)==58,'physical diagnostic archive count')
for item in inv['archive_entries']:
    p=Path(item['archive_path']); req(p.exists(),'archive missing '+p.as_posix())
    req(len(p.read_bytes())==item['utf8_bytes'] and sha_file(p)==item['sha256'],'archive identity '+p.as_posix())
req(not Path(FORBIDDEN_BOUNDARY).exists(),'v180 release-specific archive boundary forbidden')

candidate="""// ===== FE QUEST derived release diagnostic metadata =====
(() => {
  const releaseVersion='v180';
  const releaseNumber=Number(releaseVersion.slice(1));
  if(!Number.isInteger(releaseNumber)||releaseNumber<160) throw new Error('FE QUEST release version invalid');
  const retiredReleaseAdapters=Object.freeze(Array.from({length:releaseNumber-160},(_,i)=>`runV${160+i}SelfCheck`));
  globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC=Object.freeze({
    modulePath:'app/runtime-release-diagnostic-spec.txt',
    policy:'single-release-specific-diagnostic-metadata-module',
    releaseVersion,
    currentReleaseAdapter:`runV${releaseNumber}SelfCheck`,
    archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json',
    archivedSourceCount:58,
    retiredReleaseAdapterCount:retiredReleaseAdapters.length,
    retiredReleaseAdapters
  });
})();
"""
spec=Path('app/runtime-release-diagnostic-spec.txt'); spec.write_text(candidate)
s=spec.read_text()
for token in ["const releaseVersion='v180'",'Array.from({length:releaseNumber-160}',"currentReleaseAdapter:`runV${releaseNumber}SelfCheck`",'retiredReleaseAdapterCount:retiredReleaseAdapters.length',"archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json'"]:
    req(token in s,'derived metadata token '+token)
for forbidden in ["'runV160SelfCheck'","'runV179SelfCheck'",'retiredReleaseAdapterCount:20']:
    req(forbidden not in s,'explicit retired adapter metadata remained '+forbidden)

versioned=[p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)]
req(not versioned,'versioned production source residual')

idx=Path('index.html'); t=idx.read_text()
if '<title>FE QUEST PWA v179</title>' in t:
    t=t.replace('<title>FE QUEST PWA v179</title>','<title>FE QUEST PWA v180</title>',1)
    t=t.replace("const APP_VERSION = 'v179';","const APP_VERSION = 'v180';",1)
    idx.write_text(t)
t=idx.read_text()
req('<title>FE QUEST PWA v180</title>' in t and "const APP_VERSION = 'v180';" in t,'v180 index version')
req('{% include_relative app/runtime-release-adapter.txt %}' in t,'stable adapter include missing')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic self-check boot drift')
req('v180-block-00.txt' not in t,'versioned v180 adapter forbidden')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v180'
m['description']='基本情報技術者試験向けPWA。v180ではreleaseVersionからcurrent/retired diagnostic adapter metadataを自動導出し、releaseごとに伸びる静的adapter配列を廃止する。stable wrapper・stable release adapter・stable archive inventory・diagnostic archive 58・科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); w=sw.read_text()
if "const APP_VERSION = 'v179';" in w:
    w=w.replace("const APP_VERSION = 'v179';","const APP_VERSION = 'v180';",1).replace("const CACHE_NAME = 'fe-quest-v179-1';","const CACHE_NAME = 'fe-quest-v180-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v180';" in w and 'fe-quest-v180-1' in w,'SW v180')
sw.write_text(w)

if not Path(FIXTURE).exists():
    fx={
      'name':'derived-release-diagnostic-metadata-v180','version':'v180',
      'scope':'derive-release-adapter-inventory-from-single-release-version-literal',
      'parent_release':{'version':'v179','main_sha':PARENT_MAIN,'tree':PARENT_TREE},
      'stable_wrapper':ident(wrapper,parent_byte_identical_expected=True),
      'stable_release_adapter':ident(adapter,parent_byte_identical_expected=True),
      'stable_diagnostic_archive_inventory':ident(invp,archive_entry_count=58,parent_byte_identical_expected=True),
      'release_metadata_module':ident(spec,release_version_literal='v180',derived_current_adapter='runV180SelfCheck',derived_retired_adapter_count=20,explicit_retired_adapter_literals=0),
      'release_specific_archive_boundary':{'path':FORBIDDEN_BOUNDARY,'exists':False,'created':False},
      'diagnostic_archive':{'previous_count':58,'current_count':58,'growth':0},
      'production_versioned_adapter_source_count':0,
      'stable_base':ident('app/base-stable.html'),
      'stable_learning_module':ident('app/learning-patches.txt'),
      'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
      'validation':{'status':'pending','reference_mode':'explicit-array-v180-release-metadata'}
    }
    Path(FIXTURE).write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

if not Path(AUDIT).exists():
    Path(AUDIT).write_text(f'''FE QUEST v180 — Derived Release Diagnostic Metadata Audit\n==========================================================\n\nScope\n-----\nv180 derives currentReleaseAdapter, retiredReleaseAdapterCount, and retiredReleaseAdapters from one releaseVersion literal.\n\nPinned stable architecture\n--------------------------\nWrapper: {WRAPPER_BYTES:,} bytes / {WRAPPER_SHA}\nRelease adapter: {ADAPTER_BYTES} bytes / {ADAPTER_SHA}\nStable archive inventory: {INVENTORY_BYTES:,} bytes / {INVENTORY_SHA}\nAll changed by v180: no\n\nExpected derived contract\n-------------------------\nreleaseVersion: v180\ncurrentReleaseAdapter: runV180SelfCheck\nretiredReleaseAdapterCount: 20\nretiredReleaseAdapters: runV160SelfCheck through runV179SelfCheck\nExplicit retired adapter literals in release metadata source: 0\nDiagnostic archive: 58 / growth 0\nRelease-specific archive boundary: none\n\nValidation status\n-----------------\npending authoritative candidate/reference GitHub Pages validation\n''')

print('FEQUEST_V180_SOURCE_MATERIALIZED wrapper-byte-stable=1 adapter-byte-stable=1 inventory-byte-stable=1 derived-metadata=1 explicit-retired-literals=0 retired-adapters=20 diagnostic-archive=58 archive-growth=0 release-boundary-created=0 release-metadata=%d' % len(spec.read_bytes()))
