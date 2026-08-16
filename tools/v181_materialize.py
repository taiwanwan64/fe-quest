from pathlib import Path
import hashlib, json, re, subprocess

PARENT_MAIN='00aa8cad9c4a4c2d1ede729635e47d89bd59a6b6'
PARENT_TREE='1243b55ff8071b75ce19bbfe5d6bd3145a760013'
V180_VALIDATION_SOURCE='badb3bfa0304b2a0d8cd20c04f1fe6e1e0090bca'
WRAPPER_BYTES=19860
WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211
ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
INVENTORY_BYTES=17671
INVENTORY_SHA='b290a576691505999bc734197aba4623a80f2d055a1a48fe718e55cd6dbb3250'
PARENT_METADATA_BYTES=855
PARENT_METADATA_SHA='1198b6dc92617027da4e3be2b35de3dc7daebb7671ddaa2848a5ccfbbda4615c'
STABLE_METADATA_BYTES=859
STABLE_METADATA_SHA='8b1b4889588abea7ff52609341350a21804aee026d95bec24ea70eb3e2f668e2'
BASE_BYTES=2991671
BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723
LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525
RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
STABLE_INVENTORY='_regression/diagnostic-archive-inventory.fixture.json'
FORBIDDEN_BOUNDARY='_regression/production-source-archive-boundary-v181.fixture.json'
FIXTURE='_regression/stable-release-diagnostic-metadata-v181.fixture.json'
AUDIT='audits/STABLE_RELEASE_DIAGNOSTIC_METADATA_AUDIT_v181.txt'

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

wrapper=Path('app/runtime-diagnostic-wrapper.txt'); adapter=Path('app/runtime-release-adapter.txt'); invp=Path(STABLE_INVENTORY); spec=Path('app/runtime-release-diagnostic-spec.txt')
req(len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper drift')
req(len(adapter.read_bytes())==ADAPTER_BYTES and sha_file(adapter)==ADAPTER_SHA,'stable adapter drift')
req(len(invp.read_bytes())==INVENTORY_BYTES and sha_file(invp)==INVENTORY_SHA,'stable inventory drift')
req(len(spec.read_bytes())==PARENT_METADATA_BYTES and sha_file(spec)==PARENT_METADATA_SHA,'v180 release metadata parent drift')
req(wrapper.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-diagnostic-wrapper.txt']),'wrapper differs from v180 parent')
req(adapter.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-release-adapter.txt']),'adapter differs from v180 parent')
req(invp.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':'+STABLE_INVENTORY]),'inventory differs from v180 parent')
req(spec.read_bytes()==subprocess.check_output(['git','show',PARENT_MAIN+':app/runtime-release-diagnostic-spec.txt']),'metadata differs from v180 parent before migration')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base drift')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning drift')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'semantic runtime drift')
req(not Path(FORBIDDEN_BOUNDARY).exists(),'v181 release-specific archive boundary forbidden')

candidate="""// ===== FE QUEST stable release diagnostic metadata =====
(() => {
  const releaseVersion=APP_VERSION;
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
spec.write_text(candidate)
req(len(spec.read_bytes())==STABLE_METADATA_BYTES and sha_file(spec)==STABLE_METADATA_SHA,'stable release metadata candidate identity')
s=spec.read_text()
for token in ['const releaseVersion=APP_VERSION','const releaseNumber=Number(releaseVersion.slice(1))','Array.from({length:releaseNumber-160}',"currentReleaseAdapter:`runV${releaseNumber}SelfCheck`",'retiredReleaseAdapterCount:retiredReleaseAdapters.length',"archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json'"]:
    req(token in s,'stable metadata token '+token)
req(not re.search(r"['\"]v181['\"]",s),'v181 literal embedded in stable metadata')
req(len(re.findall(r"['\"]runV\d+SelfCheck['\"]",s))==0,'explicit adapter literal embedded in stable metadata')

versioned=[p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)]
req(not versioned,'versioned production source residual')

idx=Path('index.html'); t=idx.read_text()
if '<title>FE QUEST PWA v180</title>' in t:
    t=t.replace('<title>FE QUEST PWA v180</title>','<title>FE QUEST PWA v181</title>',1)
    t=t.replace("const APP_VERSION = 'v180';","const APP_VERSION = 'v181';",1)
    idx.write_text(t)
t=idx.read_text()
req('<title>FE QUEST PWA v181</title>' in t and "const APP_VERSION = 'v181';" in t,'v181 index version')
req('{% capture releaseDiagnosticSpec %}{% include_relative app/runtime-release-diagnostic-spec.txt %}{% endcapture %}' in t,'release metadata include missing')
req('{% include_relative app/runtime-release-adapter.txt %}' in t,'stable adapter include missing')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic self-check boot drift')
req('v181-block-00.txt' not in t,'versioned v181 adapter forbidden')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v181'
m['description']='基本情報技術者試験向けPWA。v181ではrelease diagnostic metadataがAPP_VERSIONを唯一のversion sourceとして利用し、metadata module自体を通常releaseでbyte-stable化する。stable wrapper・stable release adapter・stable archive inventory・diagnostic archive 58・科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); w=sw.read_text()
if "const APP_VERSION = 'v180';" in w:
    w=w.replace("const APP_VERSION = 'v180';","const APP_VERSION = 'v181';",1).replace("const CACHE_NAME = 'fe-quest-v180-1';","const CACHE_NAME = 'fe-quest-v181-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v181';" in w and 'fe-quest-v181-1' in w,'SW v181')
sw.write_text(w)

inv=json.loads(invp.read_text())
req(inv['archived_source_count']==58 and len(inv['archive_entries'])==58,'archive inventory count')
req(len([p for p in Path(inv['archive_root']).iterdir() if p.is_file()])==58,'physical diagnostic archive count')

fx={
  'name':'stable-release-diagnostic-metadata-v181','version':'v181',
  'scope':'use-app-version-as-single-version-source-and-freeze-release-metadata-module',
  'parent_release':{'version':'v180','main_sha':PARENT_MAIN,'tree':PARENT_TREE},
  'stable_wrapper':ident(wrapper,parent_byte_identical_expected=True),
  'stable_release_adapter':ident(adapter,parent_byte_identical_expected=True),
  'stable_diagnostic_archive_inventory':ident(invp,archive_entry_count=58,parent_byte_identical_expected=True),
  'release_metadata_module':ident(spec,version_source='APP_VERSION',expected_release_version='v181',derived_current_adapter='runV181SelfCheck',derived_retired_adapter_count=21,explicit_release_version_literals=0,explicit_adapter_literals=0,future_byte_stable_expected=True),
  'release_specific_archive_boundary':{'path':FORBIDDEN_BOUNDARY,'exists':False,'created':False},
  'diagnostic_archive':{'previous_count':58,'current_count':58,'growth':0},
  'production_versioned_adapter_source_count':0,
  'stable_base':ident('app/base-stable.html'),
  'stable_learning_module':ident('app/learning-patches.txt'),
  'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
  'validation':{'status':'pending','reference_mode':'literal-v181-version-source-same-derived-algorithm'}
}
Path(FIXTURE).write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
Path(AUDIT).write_text(f'''FE QUEST v181 — Stable Release Diagnostic Metadata Audit\n=========================================================\n\nScope\n-----\nv181 changes the release diagnostic metadata version source from an embedded release literal to APP_VERSION. The module should become byte-stable for ordinary releases after v181.\n\nStable metadata candidate\n-------------------------\nPath: app/runtime-release-diagnostic-spec.txt\nBytes: {STABLE_METADATA_BYTES}\nSHA-256: {STABLE_METADATA_SHA}\nVersion source: APP_VERSION\nEmbedded v181 literals: 0\nExplicit adapter literals: 0\nExpected runtime current adapter: runV181SelfCheck\nExpected retired adapters: 21 (runV160SelfCheck through runV180SelfCheck)\n\nPinned boundaries\n-----------------\nWrapper: {WRAPPER_BYTES:,} / {WRAPPER_SHA}\nRelease adapter: {ADAPTER_BYTES} / {ADAPTER_SHA}\nArchive inventory: {INVENTORY_BYTES:,} / {INVENTORY_SHA}\nDiagnostic archive: 58 / growth 0\nRelease-specific archive boundary: none\n\nValidation status\n-----------------\npending authoritative candidate/reference GitHub Pages validation\n''')

# Reuse the proven v180 runtime stub verbatim for v181 validation.
stub=subprocess.check_output(['git','show',V180_VALIDATION_SOURCE+':tools/v180_runtime_stub.py']).decode()
Path('tools/v181_runtime_stub.py').write_text(stub)

# Generate the v181 validator from the proven v180 validator, then tighten it for the APP_VERSION-driven stable module.
v=subprocess.check_output(['git','show',V180_VALIDATION_SOURCE+':tools/v180_validate.py']).decode()
v=v.replace('from v180_runtime_stub import STUB','from v181_runtime_stub import STUB')
v=v.replace("PARENT='cd65d500ab0eab81cf44a975a138025eac7b950d'",f"PARENT='{PARENT_MAIN}'")
v=v.replace('v180','v181').replace('V180','V181')
v=v.replace("FIXTURE=Path('_regression/derived-release-diagnostic-metadata-v181.fixture.json')", "FIXTURE=Path('_regression/stable-release-diagnostic-metadata-v181.fixture.json')")
v=v.replace("AUDIT=Path('audits/DERIVED_RELEASE_DIAGNOSTIC_METADATA_AUDIT_v181.txt')", "AUDIT=Path('audits/STABLE_RELEASE_DIAGNOSTIC_METADATA_AUDIT_v181.txt')")
v=v.replace("for token in [\"const releaseVersion='v181'\",", "for token in ['const releaseVersion=APP_VERSION',")
v=v.replace("req(spec.count(\"'v181'\")==1,'candidate must have exactly one v181 literal')", "req(not re.search(r\"['\\\"]v181['\\\"]\",spec),'candidate metadata must not embed v181 literal')")
v=v.replace('range(160,180)', 'range(160,181)')
v=v.replace('retiredAdapters!==20','retiredAdapters!==21')
v=v.replace('retired-adapter-inventory=20','retired-adapter-inventory=21')
v=v.replace("'derived_retired_adapter_count':20", "'derived_retired_adapter_count':21")
v=v.replace("derived_retired_adapter_count':20", "derived_retired_adapter_count':21")
v=v.replace('Derived retired adapters: 20', 'Derived retired adapters: 21')
v=v.replace('retired-adapters=20', 'retired-adapters=21')
v=v.replace("'release_version_literal':'v181'", "'version_source':'APP_VERSION'")
v=v.replace("'reference_mode':'explicit-array-v181-release-metadata'", "'reference_mode':'literal-v181-version-source-same-derived-algorithm'")
v=v.replace('explicit-array reference', 'literal-version reference')
v=v.replace('derived/explicit metadata canonical runtime differs','APP_VERSION/literal-version metadata canonical runtime differs')
v=v.replace('generated_html_equal_after_release_metadata_module_normalization', 'generated_html_equal_after_release_metadata_module_normalization')
# Pin the new stable module identity in validation.
anchor="req(len(INV.read_bytes())==INVENTORY_BYTES and sha_file(INV)==INVENTORY_SHA,'stable inventory identity')"
insert=anchor+"\nreq(len(specp.read_bytes())==859 and sha_file(specp)=='8b1b4889588abea7ff52609341350a21804aee026d95bec24ea70eb3e2f668e2','stable release metadata identity')"
req(anchor in v,'validator anchor missing'); v=v.replace(anchor,insert,1)
# The generated candidate must contain no release-specific literal and the runtime must expose 21 retired adapters.
req("const releaseVersion=APP_VERSION" in v,'validator APP_VERSION assertion missing')
req('range(160,181)' in v,'validator retired range missing')
req('retiredAdapters!==21' in v,'validator retired count missing')
Path('tools/v181_validate_generated.py').write_text(v)

print('FEQUEST_V181_SOURCE_MATERIALIZED wrapper-byte-stable=1 adapter-byte-stable=1 inventory-byte-stable=1 stable-release-metadata=1 metadata-bytes=%d metadata-sha=%s embedded-version-literals=0 retired-adapters=21 diagnostic-archive=58 archive-growth=0 release-boundary-created=0' % (len(spec.read_bytes()),sha_file(spec)))
