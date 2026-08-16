from pathlib import Path
import hashlib, json, re, subprocess

PARENT_MAIN='bc55752aaae3bafb7a561b84be7a07e68222c557'
PARENT_TREE='573dd00565daa0b36635b101ae30981c1e85584f'
WRAPPER_BYTES=19860
WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211
ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
BASE_BYTES=2991671
BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723
LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525
RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
OLD_BOUNDARY='_regression/production-source-archive-boundary-v177.fixture.json'
NEW_BOUNDARY='_regression/production-source-archive-boundary-v178.fixture.json'
STABLE_INVENTORY='_regression/diagnostic-archive-inventory.fixture.json'

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

# Stable production architecture stays pinned byte-for-byte.
wrapper=Path('app/runtime-diagnostic-wrapper.txt'); adapter=Path('app/runtime-release-adapter.txt')
req(wrapper.exists() and len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper drift')
req(adapter.exists() and len(adapter.read_bytes())==ADAPTER_BYTES and sha_file(adapter)==ADAPTER_SHA,'stable adapter drift')
req(wrapper.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-diagnostic-wrapper.txt']),'wrapper differs from v177 parent')
req(adapter.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-release-adapter.txt']),'adapter differs from v177 parent')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base drift')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning drift')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'semantic runtime drift')

# Capture pre-migration dependency inventory for the v177 release-boundary fixture.
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

# Freeze the 58-entry diagnostic provenance inventory once, using v177 as the authority.
prev=Path(OLD_BOUNDARY); req(prev.exists(),'v177 archive boundary fixture missing')
pd=json.loads(prev.read_text())
req(pd['version']=='v177' and pd['archived_source_count']==58 and len(pd['archive_entries'])==58,'v177 archive authority invalid')
req(pd['production_app_archival_residual_count']==0,'v177 archival residual')
archive_dir=Path(pd['archive_root'])
physical=[p for p in archive_dir.iterdir() if p.is_file()]
req(len(physical)==58,'physical diagnostic archive count must be 58')
for item in pd['archive_entries']:
    p=Path(item['archive_path'])
    req(p.exists(),'archive entry missing '+p.as_posix())
    req(len(p.read_bytes())==item['utf8_bytes'] and sha_file(p)==item['sha256'],'archive identity drift '+p.as_posix())

stable_path=Path(STABLE_INVENTORY)
stable={
  'name':'diagnostic-archive-inventory-stable',
  'schema_version':1,
  'scope':'versionless-byte-pinned-diagnostic-provenance-inventory',
  'policy':'ordinary releases reference this inventory instead of duplicating all archive entries',
  'authority':{'release':'v177','path':OLD_BOUNDARY,'utf8_bytes':len(prev.read_bytes()),'sha256':sha_file(prev)},
  'archive_root':pd['archive_root'],
  'archived_source_count':58,
  'production_app_archival_residual_count':0,
  'archive_entries':pd['archive_entries']
}
if stable_path.exists():
    req(json.loads(stable_path.read_text())==stable,'stable inventory drift')
else:
    stable_path.write_text(json.dumps(stable,ensure_ascii=False,indent=2)+'\n')
stable=json.loads(stable_path.read_text())
req(stable['archive_entries']==pd['archive_entries'],'stable inventory differs from v177 authority')

# v178 keeps only a compact release-specific boundary proof pointing at the stable inventory.
compact={
  'name':'production-source-archive-boundary-v178',
  'version':'v178',
  'scope':'compact-release-boundary-reference-to-stable-diagnostic-inventory',
  'policy':'no-per-release-archive-entry-duplication',
  'stable_inventory_path':STABLE_INVENTORY,
  'stable_inventory_utf8_bytes':len(stable_path.read_bytes()),
  'stable_inventory_sha256':sha_file(stable_path),
  'archived_source_count':58,
  'production_app_archival_residual_count':0,
  'embedded_archive_entry_count':0,
  'diagnostic_archive_growth':0
}
Path(NEW_BOUNDARY).write_text(json.dumps(compact,ensure_ascii=False,indent=2)+'\n')

# Release metadata advances but archive count remains fixed at 58.
spec=Path('app/runtime-release-diagnostic-spec.txt'); s=spec.read_text()
repls=[
  ("releaseVersion:'v177'","releaseVersion:'v178'"),
  ("currentReleaseAdapter:'runV177SelfCheck'","currentReleaseAdapter:'runV178SelfCheck'"),
  ("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v177.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v178.fixture.json'"),
  ('retiredReleaseAdapterCount:17','retiredReleaseAdapterCount:18'),
  ("'runV176SelfCheck'])","'runV176SelfCheck','runV177SelfCheck'])")
]
if "releaseVersion:'v177'" in s:
    for a,b in repls:
        req(a in s,'release metadata token missing '+a); s=s.replace(a,b,1)
    spec.write_text(s)
s=spec.read_text()
for token in ["releaseVersion:'v178'","currentReleaseAdapter:'runV178SelfCheck'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v178.fixture.json'",'archivedSourceCount:58','retiredReleaseAdapterCount:18',"'runV177SelfCheck'"]:
    req(token in s,'v178 release metadata '+token)

# No versioned production adapter/source may reappear.
versioned=[p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)]
req(not versioned,'versioned production source residual '+','.join(p.name for p in versioned))

# Version shell only; dynamic self-check boot stays unchanged.
idx=Path('index.html'); t=idx.read_text()
if '<title>FE QUEST PWA v177</title>' in t:
    t=t.replace('<title>FE QUEST PWA v177</title>','<title>FE QUEST PWA v178</title>',1)
    t=t.replace("const APP_VERSION = 'v177';","const APP_VERSION = 'v178';",1)
    idx.write_text(t)
t=idx.read_text()
req("<title>FE QUEST PWA v178</title>" in t and "const APP_VERSION = 'v178';" in t,'v178 assembler version')
req('{% include_relative app/runtime-release-adapter.txt %}' in t,'stable adapter include missing')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic self-check boot drift')
req('v178-block-00.txt' not in t,'versioned v178 adapter forbidden')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v178'
m['description']='基本情報技術者試験向けPWA。v178では、58件のdiagnostic archive inventoryをversionless stable fixtureへ固定し、release固有archive boundaryを小さな参照証明へ縮小する。stable wrapper・stable release adapter・diagnostic archive 58・科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); w=sw.read_text()
if "const APP_VERSION = 'v177';" in w:
    w=w.replace("const APP_VERSION = 'v177';","const APP_VERSION = 'v178';",1).replace("const CACHE_NAME = 'fe-quest-v177-1';","const CACHE_NAME = 'fe-quest-v178-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v178';" in w and 'fe-quest-v178-1' in w,'SW v178')
sw.write_text(w)

# Declarative dependency/equivalence evidence.
dep={
  'name':'diagnostic-archive-inventory-dependency-v178','version':'v178',
  'searched_literal':OLD_BOUNDARY,
  'pre_migration_references':refs,
  'reference_count':sum(x['occurrences'] for x in refs),
  'stable_inventory':ident(stable_path,archive_entry_count=58),
  'compact_release_boundary':ident(NEW_BOUNDARY,embedded_archive_entry_count=0),
  'physical_archive_count':58,
  'archive_growth':0
}
Path('_regression/diagnostic-archive-inventory-dependency-v178.fixture.json').write_text(json.dumps(dep,ensure_ascii=False,indent=2)+'\n')

fx={
  'name':'stable-diagnostic-archive-inventory-v178','version':'v178',
  'scope':'first-release-with-versionless-diagnostic-archive-inventory-and-compact-release-boundary',
  'parent_release':{'version':'v177','main_sha':PARENT_MAIN,'tree':PARENT_TREE},
  'stable_wrapper':ident(wrapper,parent_byte_identical_expected=True),
  'stable_release_adapter':ident(adapter,parent_byte_identical_expected=True),
  'stable_diagnostic_archive_inventory':ident(stable_path,archive_entry_count=58,expected_future_byte_stable=True),
  'compact_release_boundary':ident(NEW_BOUNDARY,embedded_archive_entry_count=0),
  'release_metadata_module':ident(spec,release_version='v178',retired_release_adapter_count=18,diagnostic_archive_count=58),
  'diagnostic_archive':{'previous_count':58,'current_count':58,'growth':0},
  'production_versioned_adapter_source_count':0,
  'stable_base':ident('app/base-stable.html'),
  'stable_learning_module':ident('app/learning-patches.txt'),
  'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
  'validation':{'status':'pending','reference_mode':'full-v178-boundary-copy-from-stable-inventory'}
}
Path('_regression/stable-diagnostic-archive-inventory-v178.fixture.json').write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

Path('audits/STABLE_DIAGNOSTIC_ARCHIVE_INVENTORY_AUDIT_v178.txt').write_text(f'''FE QUEST v178 — Stable Diagnostic Archive Inventory Audit\n===========================================================\n\nScope\n-----\nv178 freezes the unchanged 58-entry diagnostic provenance inventory into one versionless stable fixture. The release-specific archive boundary becomes a compact pointer/proof and no longer duplicates 58 archive entries.\n\nStable production boundaries\n----------------------------\nWrapper: {WRAPPER_BYTES:,} bytes / {WRAPPER_SHA}\nRelease adapter: {ADAPTER_BYTES} bytes / {ADAPTER_SHA}\nBoth changed by v178: no\n\nStable diagnostic archive inventory\n-----------------------------------\nPath: {STABLE_INVENTORY}\nUTF-8 bytes: {len(stable_path.read_bytes()):,}\nSHA-256: {sha_file(stable_path)}\nEntries: 58\nAuthority: {OLD_BOUNDARY}\nPhysical diagnostic archive: 58\nArchive growth: 0\n\nCompact v178 boundary\n---------------------\nPath: {NEW_BOUNDARY}\nUTF-8 bytes: {len(Path(NEW_BOUNDARY).read_bytes()):,}\nEmbedded archive entries: 0\n\nValidation status\n-----------------\npending authoritative candidate/reference GitHub Pages validation\n''')

print('FEQUEST_V178_SOURCE_MATERIALIZED wrapper-byte-stable=1 adapter-byte-stable=1 stable-inventory=%d stable-inventory-sha=%s compact-boundary=%d embedded-entries=0 retired-adapters=18 diagnostic-archive=58 archive-growth=0 release-metadata=%d' % (len(stable_path.read_bytes()),sha_file(stable_path),len(Path(NEW_BOUNDARY).read_bytes()),len(spec.read_bytes())))
