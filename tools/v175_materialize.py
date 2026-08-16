from pathlib import Path
import hashlib, json, shutil

PARENT_MAIN='08a3574af4d70ec366cf6f686792aa2e237dd6e2'
PARENT_TREE='410b471a7f28b6c7613f6f2a9eca06b56c55048a'
WRAPPER_BYTES=19860
WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
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

# v175's central invariant: the wrapper is not edited at all.
wrapper=Path('app/runtime-diagnostic-wrapper.txt')
req(wrapper.exists() and len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper drift before v175 materialization')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base drift')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning drift')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'stable semantic runtime drift')

# Archive the v174 thin adapter and create the v175 thin adapter.
old=Path('app/v174-block-00.txt'); arch=Path('_regression/archive/diagnostics/v174-block-00.txt')
if old.exists():
    req(not arch.exists(),'v174 adapter already archived while active copy exists')
    arch.parent.mkdir(parents=True,exist_ok=True); shutil.move(old,arch)
req(arch.exists() and not old.exists(),'v174 adapter archive boundary')
new=Path('app/v175-block-00.txt')
new_text="""// ===== FE QUEST v175 release adapter =====\n(() => {\n  function runV175SelfCheck(){return feqRunSelfCheck('v175','runV175SelfCheck');}\n  globalThis.runV175SelfCheck=runV175SelfCheck;\n})();\n"""
if new.exists(): req(new.read_text()==new_text,'v175 adapter drift')
else: new.write_text(new_text)

# Only the small release metadata module carries cadence-dependent wrapper metadata.
spec=Path('app/runtime-release-diagnostic-spec.txt'); s=spec.read_text()
repls=[
("releaseVersion:'v174'","releaseVersion:'v175'"),
("currentReleaseAdapter:'runV174SelfCheck'","currentReleaseAdapter:'runV175SelfCheck'"),
("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v174.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v175.fixture.json'"),
('archivedSourceCount:56','archivedSourceCount:57'),
('retiredReleaseAdapterCount:14','retiredReleaseAdapterCount:15'),
("'runV173SelfCheck'])","'runV173SelfCheck','runV174SelfCheck'])")
]
for a,b in repls:
    req(a in s,'release metadata token missing '+a); s=s.replace(a,b,1)
req("releaseVersion:'v175'" in s and "currentReleaseAdapter:'runV175SelfCheck'" in s and 'archivedSourceCount:57' in s and 'retiredReleaseAdapterCount:15' in s and "'runV174SelfCheck'" in s,'v175 release metadata')
spec.write_text(s)

# Release/archive fixture advances one adapter.
prev=Path('_regression/production-source-archive-boundary-v174.fixture.json')
out=Path('_regression/production-source-archive-boundary-v175.fixture.json')
d=json.loads(prev.read_text())
d['name']='production-source-archive-boundary-v175'; d['version']='v175'; d['archived_source_count']=57
entry={'name':'v174-block-00.txt','old_path':'app/v174-block-00.txt','archive_path':'_regression/archive/diagnostics/v174-block-00.txt','utf8_bytes':len(arch.read_bytes()),'sha256':sha_file(arch)}
d['archive_entries']=[x for x in d['archive_entries'] if x.get('name')!='v174-block-00.txt']+[entry]
req(len(d['archive_entries'])==57,'v175 diagnostic archive fixture count')
d['production_app_archival_residual_count']=0
out.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==57,'physical diagnostic archive count')

# Version shell only: assembler, manifest, service worker.
idx=Path('index.html'); t=idx.read_text()
t=t.replace('{% capture v174block %}{% include_relative app/v174-block-00.txt %}{% endcapture %}','{% capture v175block %}{% include_relative app/v175-block-00.txt %}{% endcapture %}',1)
t=t.replace('<title>FE QUEST PWA v174</title>','<title>FE QUEST PWA v175</title>',1)
t=t.replace("const APP_VERSION = 'v174';","const APP_VERSION = 'v175';",1)
t=t.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV174SelfCheck();','applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV175SelfCheck();',1)
t=t.replace('{{ v174block }}','{{ v175block }}',1)
req('{% include_relative app/runtime-release-diagnostic-spec.txt %}' in t and '{% include_relative app/runtime-diagnostic-wrapper.txt %}' in t,'release metadata/wrapper includes')
req('{% include_relative app/v175-block-00.txt %}' in t and 'v174-block-00.txt' not in t,'v175 adapter assembler')
idx.write_text(t)

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v175'
m['description']='基本情報技術者試験向けPWA。v175では、v174で安定化したdiagnostic wrapperを1 byteも変更せず、release固有metadata moduleと薄いadapterだけで通常のversion更新が成立することを検証する。科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); w=sw.read_text().replace("const APP_VERSION = 'v174';","const APP_VERSION = 'v175';",1).replace("const CACHE_NAME = 'fe-quest-v174-1';","const CACHE_NAME = 'fe-quest-v175-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v175';" in w and 'fe-quest-v175-1' in w,'SW version')
sw.write_text(w)

fx={
  'name':'stable-wrapper-release-cadence-v175','version':'v175','scope':'first-normal-release-after-v174-wrapper-metadata-extraction',
  'policy':'stable-wrapper-byte-identity-release-specific-metadata-only',
  'parent_release':{'version':'v174','main_sha':PARENT_MAIN,'tree':PARENT_TREE},
  'stable_wrapper':ident(wrapper,parent_utf8_bytes=WRAPPER_BYTES,parent_sha256=WRAPPER_SHA,byte_identical_to_parent=True,modified_by_release=False),
  'release_metadata_module':ident(spec,release_version='v175',retired_release_adapter_count=15,diagnostic_archive_count=57),
  'current_release_adapter':ident(new,name='runV175SelfCheck'),
  'archived_release_adapter':ident(arch,name='runV174SelfCheck'),
  'stable_base':ident('app/base-stable.html'),'stable_learning_module':ident('app/learning-patches.txt'),'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
  'validation':{'status':'pending'}
}
Path('_regression/stable-wrapper-release-cadence-v175.fixture.json').write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

Path('audits/STABLE_WRAPPER_CADENCE_AUDIT_v175.txt').write_text(f'''FE QUEST v175 — Stable Wrapper Release Cadence Audit\n=====================================================\n\nScope\n-----\nv175 is the first ordinary release after v174 extracted release-varying diagnostic metadata. app/runtime-diagnostic-wrapper.txt must remain byte-identical to v174 while the small release metadata module, thin adapter, archive fixture, and version shell advance to v175.\n\nPinned stable wrapper\n---------------------\nUTF-8 bytes: {WRAPPER_BYTES:,}\nSHA-256: {WRAPPER_SHA}\nChanged by v175: no\n\nRelease metadata\n----------------\nPath: app/runtime-release-diagnostic-spec.txt\nRelease: v175\nCurrent adapter: runV175SelfCheck\nRetired adapter inventory: 15 (runV160SelfCheck through runV174SelfCheck)\nDiagnostic/provenance archive count: 57\n\nValidation status\n-----------------\npending authoritative GitHub Actions validation\n''')

# Final guard: materializer itself did not modify wrapper.
req(len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper changed during v175 materialization')
print('FEQUEST_V175_SOURCE_MATERIALIZED wrapper-byte-stable=1 wrapper=%d release-metadata=%d retired-adapters=15 diagnostic-archive=57 base=%d learning=%d runtime=%d' % (WRAPPER_BYTES,len(spec.read_bytes()),BASE_BYTES,LEARNING_BYTES,RUNTIME_BYTES))
