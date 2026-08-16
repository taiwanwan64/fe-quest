from pathlib import Path
import hashlib, json, re, subprocess

PARENT='846f91009dc61fdc86a1547577ead2e8daced355'
V180_VALIDATION_SOURCE='badb3bfa0304b2a0d8cd20c04f1fe6e1e0090bca'
WRAPPER_BYTES=19860; WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211; ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
METADATA_BYTES=859; METADATA_SHA='8b1b4889588abea7ff52609341350a21804aee026d95bec24ea70eb3e2f668e2'
INVENTORY_BYTES=17671; INVENTORY_SHA='b290a576691505999bc734197aba4623a80f2d055a1a48fe718e55cd6dbb3250'
BASE_BYTES=2991671; BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723; LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525; RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
FIXTURE='_regression/steady-state-diagnostic-architecture-v182.fixture.json'
AUDIT='audits/STEADY_STATE_DIAGNOSTIC_ARCHITECTURE_AUDIT_v182.txt'
FORBIDDEN='_regression/production-source-archive-boundary-v182.fixture.json'

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

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
    q=Path(p); req(len(q.read_bytes())==b and sha_file(q)==s,'stable identity '+p)
    req(q.read_bytes()==subprocess.check_output(['git','show',PARENT+':'+p]),'parent byte drift '+p)

spec=Path('app/runtime-release-diagnostic-spec.txt').read_text()
req('const releaseVersion=APP_VERSION;' in spec,'metadata not APP_VERSION-driven')
req(not re.search(r"['\"]v\d+['\"]",spec),'release literal embedded in stable metadata')
req(not re.search(r"['\"]runV\d+SelfCheck['\"]",spec),'adapter literal embedded in stable metadata')
req(not Path(FORBIDDEN).exists(),'v182 release-specific archive boundary forbidden')
req(not [p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)],'versioned adapter source residual')

inv=json.loads(Path('_regression/diagnostic-archive-inventory.fixture.json').read_text())
req(inv['archived_source_count']==58 and len(inv['archive_entries'])==58,'archive inventory count')
req(len([p for p in Path(inv['archive_root']).iterdir() if p.is_file()])==58,'physical diagnostic archive count')

idx=Path('index.html'); t=idx.read_text()
t=t.replace('<title>FE QUEST PWA v181</title>','<title>FE QUEST PWA v182</title>',1)
t=t.replace("const APP_VERSION = 'v181';","const APP_VERSION = 'v182';",1)
idx.write_text(t)
t=idx.read_text()
req('<title>FE QUEST PWA v182</title>' in t and "const APP_VERSION = 'v182';" in t,'v182 index shell')
req('{% include_relative app/runtime-release-diagnostic-spec.txt %}' in t,'stable metadata include missing')
req('{% include_relative app/runtime-release-adapter.txt %}' in t,'stable adapter include missing')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic self-check boot drift')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v182'
m['description']='基本情報技術者試験向けPWA。v182ではdiagnostic wrapper・release adapter・release metadata・archive inventoryの4モジュールをv181から完全byte-stableのまま維持し、APP_VERSIONだけでrunV182SelfCheckとretired adapter 22件を自動導出するsteady-state release cadenceを実証する。科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); w=sw.read_text()
w=w.replace("const APP_VERSION = 'v181';","const APP_VERSION = 'v182';",1)
w=w.replace("const CACHE_NAME = 'fe-quest-v181-1';","const CACHE_NAME = 'fe-quest-v182-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v182';" in w and 'fe-quest-v182-1' in w,'SW v182')
sw.write_text(w)

fx={
 'name':'steady-state-diagnostic-architecture-v182','version':'v182',
 'scope':'prove-four-diagnostic-architecture-modules-remain-byte-exact-across-ordinary-release',
 'parent_release':{'version':'v181','main_sha':PARENT},
 'stable_modules':[
   ident('app/runtime-diagnostic-wrapper.txt',parent_byte_identical=True),
   ident('app/runtime-release-adapter.txt',parent_byte_identical=True),
   ident('app/runtime-release-diagnostic-spec.txt',parent_byte_identical=True,version_source='APP_VERSION'),
   ident('_regression/diagnostic-archive-inventory.fixture.json',parent_byte_identical=True,archive_entry_count=58),
 ],
 'release_specific_diagnostic_architecture_changed_files':0,
 'expected_runtime':{'releaseVersion':'v182','currentReleaseAdapter':'runV182SelfCheck','retiredReleaseAdapterCount':22,'retiredReleaseAdapterRange':'runV160SelfCheck..runV181SelfCheck'},
 'diagnostic_archive':{'previous_count':58,'current_count':58,'growth':0},
 'release_specific_archive_boundary':{'path':FORBIDDEN,'exists':False},
 'production_versioned_adapter_source_count':0,
 'stable_base':ident('app/base-stable.html'),
 'stable_learning_module':ident('app/learning-patches.txt'),
 'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
 'validation':{'status':'pending'}
}
Path(FIXTURE).write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
Path(AUDIT).write_text(f'''FE QUEST v182 — Steady-State Diagnostic Architecture Audit\n===========================================================\n\nGoal\n----\nProve that an ordinary release can advance only the outer version shell while all four diagnostic architecture modules remain byte-exact to v181.\n\nPinned byte-stable modules\n--------------------------\nWrapper: {WRAPPER_BYTES:,} / {WRAPPER_SHA}\nRelease adapter: {ADAPTER_BYTES} / {ADAPTER_SHA}\nRelease metadata: {METADATA_BYTES} / {METADATA_SHA}\nArchive inventory: {INVENTORY_BYTES:,} / {INVENTORY_SHA}\nAll equal to v181 parent before materialization: yes\n\nExpected runtime\n----------------\nAPP_VERSION: v182\nreleaseVersion: v182\ncurrent adapter: runV182SelfCheck\nretired adapters: 22 (runV160SelfCheck through runV181SelfCheck)\nDiagnostic archive: 58 / growth 0\nRelease-specific diagnostic architecture changed files: 0\n\nValidation status\n-----------------\npending authoritative GitHub Pages/Jekyll runtime validation\n''')

stub=subprocess.check_output(['git','show',V180_VALIDATION_SOURCE+':tools/v180_runtime_stub.py']).decode()
Path('tools/v182_runtime_stub.py').write_text(stub)
print('FEQUEST_V182_SOURCE_MATERIALIZED wrapper-byte-stable=1 adapter-byte-stable=1 metadata-byte-stable=1 inventory-byte-stable=1 diagnostic-architecture-changed=0 retired-adapters=22 diagnostic-archive=58 archive-growth=0 release-boundary-created=0')
