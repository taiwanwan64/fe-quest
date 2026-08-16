from pathlib import Path
import hashlib, json

PARENT_MAIN='391d930f75e8a0997ab3ad486cf313f47e502800'
PARENT_TREE='a14223315c76ab5953d23510f8c9e56081fcf197'
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

def req(v,m):
    if not v: raise AssertionError(m)
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

# v177 proves both stable wrapper and stable adapter survive an ordinary release byte-for-byte.
wrapper=Path('app/runtime-diagnostic-wrapper.txt')
adapter=Path('app/runtime-release-adapter.txt')
req(wrapper.exists() and len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper drift')
req(adapter.exists() and len(adapter.read_bytes())==ADAPTER_BYTES and sha_file(adapter)==ADAPTER_SHA,'stable release adapter drift')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base drift')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning drift')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'semantic runtime drift')

# Release metadata advances. Archive count intentionally stays at 58: no per-release adapter source exists anymore.
spec=Path('app/runtime-release-diagnostic-spec.txt'); s=spec.read_text()
if "releaseVersion:'v176'" in s:
    repls=[
      ("releaseVersion:'v176'","releaseVersion:'v177'"),
      ("currentReleaseAdapter:'runV176SelfCheck'","currentReleaseAdapter:'runV177SelfCheck'"),
      ("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v176.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v177.fixture.json'"),
      ('retiredReleaseAdapterCount:16','retiredReleaseAdapterCount:17'),
      ("'runV175SelfCheck'])","'runV175SelfCheck','runV176SelfCheck'])")
    ]
    for a,b in repls:
        req(a in s,'release metadata token missing '+a); s=s.replace(a,b,1)
    spec.write_text(s)
s=spec.read_text()
for token in ["releaseVersion:'v177'","currentReleaseAdapter:'runV177SelfCheck'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v177.fixture.json'",'archivedSourceCount:58','retiredReleaseAdapterCount:17',"'runV176SelfCheck'"]:
    req(token in s,'v177 release metadata '+token)

# The archive-boundary fixture advances logically but its archive entries remain identical to v176.
prev=Path('_regression/production-source-archive-boundary-v176.fixture.json')
out=Path('_regression/production-source-archive-boundary-v177.fixture.json')
pd=json.loads(prev.read_text())
if out.exists():
    d=json.loads(out.read_text())
else:
    d=json.loads(prev.read_text())
    d['name']='production-source-archive-boundary-v177'; d['version']='v177'; d['archived_source_count']=58
    d['production_app_archival_residual_count']=0
    out.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
d=json.loads(out.read_text())
req(d['version']=='v177' and d['archived_source_count']==58 and len(d['archive_entries'])==58,'v177 archive fixture')
req(d['archive_entries']==pd['archive_entries'],'v177 must not add/remove diagnostic archive entries')
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==58,'physical diagnostic archive count must stay 58')

# No versioned production adapter/source may reappear.
versioned=[p for p in Path('app').iterdir() if p.is_file() and __import__('re').fullmatch(r'v\d+-block-\d+\.txt',p.name)]
req(not versioned,'versioned production source residual '+','.join(p.name for p in versioned))

# Version shell only. The dynamic self-check boot is deliberately unchanged.
idx=Path('index.html'); t=idx.read_text()
if '<title>FE QUEST PWA v176</title>' in t:
    t=t.replace('<title>FE QUEST PWA v176</title>','<title>FE QUEST PWA v177</title>',1)
    t=t.replace("const APP_VERSION = 'v176';","const APP_VERSION = 'v177';",1)
    idx.write_text(t)
t=idx.read_text()
req("<title>FE QUEST PWA v177</title>" in t and "const APP_VERSION = 'v177';" in t,'v177 assembler version')
req('{% include_relative app/runtime-release-adapter.txt %}' in t,'stable adapter include missing')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic self-check boot drift')
req('v177-block-00.txt' not in t,'versioned v177 adapter include forbidden')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v177'
m['description']='基本情報技術者試験向けPWA。v177では、stable diagnostic wrapperとversionless stable release adapterを1 byteも変更せず通常releaseを成立させる。versioned adapter archiveを増やさず、diagnostic archive 58を固定したままrunV177SelfCheckをAPP_VERSIONから生成する。科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); w=sw.read_text()
if "const APP_VERSION = 'v176';" in w:
    w=w.replace("const APP_VERSION = 'v176';","const APP_VERSION = 'v177';",1).replace("const CACHE_NAME = 'fe-quest-v176-1';","const CACHE_NAME = 'fe-quest-v177-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v177';" in w and 'fe-quest-v177-1' in w,'SW v177')
sw.write_text(w)

fxp=Path('_regression/stable-release-cadence-v177.fixture.json')
if not fxp.exists():
    fx={
      'name':'stable-release-cadence-v177','version':'v177','scope':'first-ordinary-release-with-byte-stable-wrapper-and-byte-stable-versionless-adapter',
      'policy':'advance-release-metadata-without-wrapper-adapter-or-archive-growth',
      'parent_release':{'version':'v176','main_sha':PARENT_MAIN,'tree':PARENT_TREE},
      'stable_wrapper':ident(wrapper,parent_byte_identical_expected=True),
      'stable_release_adapter':ident(adapter,parent_byte_identical_expected=True),
      'release_metadata_module':ident(spec,release_version='v177',retired_release_adapter_count=17,diagnostic_archive_count=58),
      'diagnostic_archive':{'previous_count':58,'current_count':58,'growth':0},
      'production_versioned_adapter_source_count':0,
      'stable_base':ident('app/base-stable.html'),'stable_learning_module':ident('app/learning-patches.txt'),'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
      'validation':{'status':'pending'}
    }
    fxp.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

audit=Path('audits/STABLE_RELEASE_CADENCE_AUDIT_v177.txt')
if not audit.exists():
    audit.write_text(f'''FE QUEST v177 — Stable Release Cadence Audit\n==============================================\n\nScope\n-----\nv177 is the first ordinary release after v176 introduced the versionless release adapter. Both app/runtime-diagnostic-wrapper.txt and app/runtime-release-adapter.txt must remain byte-identical to v176. No new versioned adapter source is created or archived, so the diagnostic archive must stay at 58 while the retired adapter contract advances to runV176SelfCheck.\n\nPinned stable wrapper\n---------------------\nUTF-8 bytes: {WRAPPER_BYTES:,}\nSHA-256: {WRAPPER_SHA}\nChanged by v177: no\n\nPinned stable release adapter\n-----------------------------\nUTF-8 bytes: {ADAPTER_BYTES}\nSHA-256: {ADAPTER_SHA}\nChanged by v177: no\nCurrent public adapter derived at runtime: runV177SelfCheck\nVersioned production adapter sources: 0\nRetired adapter inventory: 17 (runV160SelfCheck through runV176SelfCheck)\nDiagnostic/provenance archive count: 58 (growth 0)\n\nValidation status\n-----------------\npending authoritative GitHub Actions validation\n''')

req(len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'wrapper changed during materialization')
req(len(adapter.read_bytes())==ADAPTER_BYTES and sha_file(adapter)==ADAPTER_SHA,'adapter changed during materialization')
print('FEQUEST_V177_SOURCE_MATERIALIZED wrapper-byte-stable=1 adapter-byte-stable=1 stable-adapter=211 versioned-adapter-source=0 release-metadata=%d retired-adapters=17 diagnostic-archive=58 archive-growth=0 base=%d learning=%d runtime=%d' % (len(spec.read_bytes()),BASE_BYTES,LEARNING_BYTES,RUNTIME_BYTES))
