from pathlib import Path
import hashlib, json, re, subprocess

PARENT_MAIN='5b33fd69705aaf87532050e5981ee568d8d41dd1'
PARENT_TREE='200127682bde447f9ac51d85480a005638d4afe7'
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
OLD_BOUNDARY='_regression/production-source-archive-boundary-v178.fixture.json'
FORBIDDEN_BOUNDARY='_regression/production-source-archive-boundary-v179.fixture.json'

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
req(wrapper.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-diagnostic-wrapper.txt']),'wrapper differs from v178 parent')
req(adapter.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-release-adapter.txt']),'adapter differs from v178 parent')
req(invp.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':'+STABLE_INVENTORY]),'inventory differs from v178 parent')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base drift')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning drift')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'stable semantic runtime drift')

inv=json.loads(invp.read_text())
req(inv['name']=='diagnostic-archive-inventory-stable' and inv['schema_version']==1,'stable inventory schema')
req(inv['archived_source_count']==58 and len(inv['archive_entries'])==58 and inv['production_app_archival_residual_count']==0,'stable inventory counts')
physical=[p for p in Path(inv['archive_root']).iterdir() if p.is_file()]
req(len(physical)==58,'physical diagnostic archive count')
for item in inv['archive_entries']:
    p=Path(item['archive_path']); req(p.exists(),'archive missing '+p.as_posix())
    req(len(p.read_bytes())==item['utf8_bytes'] and sha_file(p)==item['sha256'],'archive identity '+p.as_posix())

refs=[]
for raw in subprocess.check_output(['git','ls-files','-z']).split(b'\0'):
    if not raw: continue
    p=Path(raw.decode())
    if not p.is_file(): continue
    try: text=p.read_text()
    except UnicodeDecodeError: continue
    if OLD_BOUNDARY in text:
        if p.as_posix()=='app/runtime-release-diagnostic-spec.txt': cls='production-release-metadata'
        elif p.as_posix().startswith('_regression/'): cls='regression-evidence'
        elif p.as_posix().startswith('audits/'): cls='historical-audit'
        else: cls='tooling-or-documentation'
        refs.append({'path':p.as_posix(),'classification':cls,'occurrences':text.count(OLD_BOUNDARY)})

spec=Path('app/runtime-release-diagnostic-spec.txt'); s=spec.read_text()
if "releaseVersion:'v178'" in s:
    repls=[
      ("releaseVersion:'v178'","releaseVersion:'v179'"),
      ("currentReleaseAdapter:'runV178SelfCheck'","currentReleaseAdapter:'runV179SelfCheck'"),
      ("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v178.fixture.json'","archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json'"),
      ('retiredReleaseAdapterCount:18','retiredReleaseAdapterCount:19'),
      ("'runV177SelfCheck'])","'runV177SelfCheck','runV178SelfCheck'])")
    ]
    for a,b in repls:
        req(a in s,'release metadata token missing '+a); s=s.replace(a,b,1)
    spec.write_text(s)
s=spec.read_text()
for token in ["releaseVersion:'v179'","currentReleaseAdapter:'runV179SelfCheck'","archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json'",'archivedSourceCount:58','retiredReleaseAdapterCount:19',"'runV178SelfCheck'"]:
    req(token in s,'v179 release metadata '+token)
req(OLD_BOUNDARY not in s,'v178 compact boundary still used by production metadata')
req(not Path(FORBIDDEN_BOUNDARY).exists(),'v179 release-specific archive boundary must not exist')

versioned=[p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)]
req(not versioned,'versioned production source residual '+','.join(p.name for p in versioned))

idx=Path('index.html'); t=idx.read_text()
if '<title>FE QUEST PWA v178</title>' in t:
    t=t.replace('<title>FE QUEST PWA v178</title>','<title>FE QUEST PWA v179</title>',1)
    t=t.replace("const APP_VERSION = 'v178';","const APP_VERSION = 'v179';",1)
    idx.write_text(t)
t=idx.read_text()
req("<title>FE QUEST PWA v179</title>" in t and "const APP_VERSION = 'v179';" in t,'v179 assembler version')
req('{% include_relative app/runtime-release-adapter.txt %}' in t,'stable adapter include missing')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic self-check boot drift')
req('v179-block-00.txt' not in t,'versioned v179 adapter forbidden')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v179'
m['description']='基本情報技術者試験向けPWA。v179ではrelease-specific diagnostic archive boundaryを廃止し、release metadataが58件のversionless stable archive inventoryを直接参照する。stable wrapper・stable release adapter・stable archive inventory・diagnostic archive 58・科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); w=sw.read_text()
if "const APP_VERSION = 'v178';" in w:
    w=w.replace("const APP_VERSION = 'v178';","const APP_VERSION = 'v179';",1).replace("const CACHE_NAME = 'fe-quest-v178-1';","const CACHE_NAME = 'fe-quest-v179-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v179';" in w and 'fe-quest-v179-1' in w,'SW v179')
sw.write_text(w)

dep={
  'name':'direct-stable-diagnostic-archive-inventory-v179','version':'v179',
  'scope':'ordinary-release-without-release-specific-diagnostic-archive-boundary-fixture',
  'parent_release':{'version':'v178','main_sha':PARENT_MAIN,'tree':PARENT_TREE},
  'searched_literal':OLD_BOUNDARY,
  'pre_migration_references':refs,
  'pre_migration_reference_count':sum(x['occurrences'] for x in refs),
  'stable_wrapper':ident(wrapper,parent_byte_identical_expected=True),
  'stable_release_adapter':ident(adapter,parent_byte_identical_expected=True),
  'stable_diagnostic_archive_inventory':ident(invp,archive_entry_count=58,parent_byte_identical_expected=True),
  'release_metadata_module':ident(spec,release_version='v179',retired_release_adapter_count=19,diagnostic_archive_count=58,archive_boundary_fixture=STABLE_INVENTORY),
  'release_specific_archive_boundary':{'path':FORBIDDEN_BOUNDARY,'exists':False,'created':False},
  'diagnostic_archive':{'previous_count':58,'current_count':58,'growth':0},
  'production_versioned_adapter_source_count':0,
  'stable_base':ident('app/base-stable.html'),
  'stable_learning_module':ident('app/learning-patches.txt'),
  'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
  'validation':{'status':'pending','reference_mode':'counterfactual-compact-v179-boundary'}
}
Path('_regression/direct-stable-diagnostic-archive-inventory-v179.fixture.json').write_text(json.dumps(dep,ensure_ascii=False,indent=2)+'\n')

Path('audits/DIRECT_STABLE_DIAGNOSTIC_ARCHIVE_INVENTORY_AUDIT_v179.txt').write_text(f'''FE QUEST v179 — Direct Stable Diagnostic Archive Inventory Audit\n================================================================\n\nScope\n-----\nv179 removes the ordinary-release-specific diagnostic archive boundary fixture. Production release metadata points directly at the versionless stable 58-entry diagnostic archive inventory.\n\nPinned stable architecture\n--------------------------\nWrapper: {WRAPPER_BYTES:,} bytes / {WRAPPER_SHA}\nRelease adapter: {ADAPTER_BYTES} bytes / {ADAPTER_SHA}\nStable archive inventory: {INVENTORY_BYTES:,} bytes / {INVENTORY_SHA}\nAll changed by v179: no\n\nArchive cadence\n---------------\nStable inventory path: {STABLE_INVENTORY}\nPhysical diagnostic archive: 58\nArchive growth: 0\nRelease-specific v179 archive boundary created: no\nProduction release metadata archiveBoundaryFixture: {STABLE_INVENTORY}\n\nValidation status\n-----------------\npending authoritative candidate/reference GitHub Pages validation\n''')

print('FEQUEST_V179_SOURCE_MATERIALIZED wrapper-byte-stable=1 adapter-byte-stable=1 inventory-byte-stable=1 stable-inventory=%d stable-inventory-sha=%s release-boundary-created=0 retired-adapters=19 diagnostic-archive=58 archive-growth=0 release-metadata=%d' % (len(invp.read_bytes()),sha_file(invp),len(spec.read_bytes())))
