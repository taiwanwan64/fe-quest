from pathlib import Path
import hashlib, json, re, shutil, subprocess

PARENT_MAIN='32cc7c00e607a9f274fca7b7b4f226590d8c626e'
BASE_BYTES=2991671
BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723
LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525
RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
DIAG_ARCHIVE_COUNT=56
RETIRED_ADAPTERS=[f'runV{v}SelfCheck' for v in range(160,174)]


def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

def parent_file(path):
    return subprocess.check_output(['git','show',f'{PARENT_MAIN}:{path}'])

# Stable learner/runtime boundaries must not move in this release.
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base identity')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning identity')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'stable semantic runtime identity')
parent_wrapper=parent_file('app/runtime-diagnostic-wrapper.txt')
parent_wrapper_identity={'path_at_parent':'app/runtime-diagnostic-wrapper.txt','utf8_bytes':len(parent_wrapper),'sha256':sha_bytes(parent_wrapper)}

# Archive v173 adapter and materialize the thin v174 adapter.
old_adapter=Path('app/v173-block-00.txt')
arch_adapter=Path('_regression/archive/diagnostics/v173-block-00.txt')
v173_text="""// ===== FE QUEST v173 release adapter =====\n(() => {\n  function runV173SelfCheck(){return feqRunSelfCheck('v173','runV173SelfCheck');}\n  globalThis.runV173SelfCheck=runV173SelfCheck;\n})();\n"""
if old_adapter.exists():
    req(old_adapter.read_text()==v173_text,'v173 adapter drift before archive')
    req(not arch_adapter.exists(),'v173 archive already exists while active adapter remains')
    arch_adapter.parent.mkdir(parents=True,exist_ok=True)
    shutil.move(old_adapter,arch_adapter)
req(arch_adapter.exists() and arch_adapter.read_text()==v173_text and not old_adapter.exists(),'v173 adapter archive boundary')

v174=Path('app/v174-block-00.txt')
v174_text="""// ===== FE QUEST v174 release adapter =====\n(() => {\n  function runV174SelfCheck(){return feqRunSelfCheck('v174','runV174SelfCheck');}\n  globalThis.runV174SelfCheck=runV174SelfCheck;\n})();\n"""
if v174.exists(): req(v174.read_text()==v174_text,'v174 adapter drift')
else: v174.write_text(v174_text)

# Put all release-varying diagnostic metadata in one tiny module.
release_spec=Path('app/runtime-release-diagnostic-spec.txt')
retired_js=','.join(repr(x) for x in RETIRED_ADAPTERS)
spec_text=("// ===== FE QUEST release-specific diagnostic metadata =====\n"
           "globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC=Object.freeze({\n"
           "  modulePath:'app/runtime-release-diagnostic-spec.txt',\n"
           "  policy:'single-release-specific-diagnostic-metadata-module',\n"
           "  releaseVersion:'v174',\n"
           "  currentReleaseAdapter:'runV174SelfCheck',\n"
           "  archiveBoundaryFixture:'_regression/production-source-archive-boundary-v174.fixture.json',\n"
           f"  archivedSourceCount:{DIAG_ARCHIVE_COUNT},\n"
           f"  retiredReleaseAdapterCount:{len(RETIRED_ADAPTERS)},\n"
           f"  retiredReleaseAdapters:Object.freeze([{retired_js}])\n"
           "});\n")
if release_spec.exists(): req(release_spec.read_text()==spec_text,'release diagnostic spec drift')
else: release_spec.write_text(spec_text)

# One-time wrapper stabilization: replace all release-varying literals with releaseSpec reads.
wpath=Path('app/runtime-diagnostic-wrapper.txt'); w=wpath.read_text()
marker="  const releaseSpec=globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC;"
if marker not in w:
    req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v173.fixture.json'" in w,'parent wrapper fixture literal')
    req('archivedSourceCount:55' in w,'parent wrapper archive count')
    req("'runV172SelfCheck'" in w and 'retiredAdapters.length===13' in w and 'a.retiredAdapters===13' in w,'parent wrapper adapter inventory')
    anchor="  const currentCheck=(id,message,test,legacyAssertions=0)=>({id,message,test,legacyAssertions});\n"
    req(w.count(anchor)==1,'wrapper currentCheck anchor')
    w=w.replace(anchor,anchor+"  const releaseSpec=globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC;\n  if(!releaseSpec||!Object.isFrozen(releaseSpec)||!Array.isArray(releaseSpec.retiredReleaseAdapters)) throw new Error('FE QUEST release diagnostic metadata missing');\n",1)
    w=w.replace("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v173.fixture.json'","archiveBoundaryFixture:releaseSpec.archiveBoundaryFixture",1)
    w=w.replace('archivedSourceCount:55','archivedSourceCount:releaseSpec.archivedSourceCount',1)
    w,n=re.subn(r"retiredReleaseAdapters:Object\.freeze\(\[[^\n]*?\]\),","retiredReleaseAdapters:Object.freeze([...releaseSpec.retiredReleaseAdapters]),",w,count=1)
    req(n==1,'wrapper retired adapter list replacement')
    w=w.replace('retiredAdapters.length===13&&new Set(retiredAdapters).size===13','retiredAdapters.length===releaseSpec.retiredReleaseAdapterCount&&new Set(retiredAdapters).size===releaseSpec.retiredReleaseAdapterCount',1)
    w=w.replace('a.retiredAdapters===13&&','a.retiredAdapters===releaseSpec.retiredReleaseAdapterCount&&',1)
    w=w.replace("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v173.fixture.json'","s.archiveBoundaryFixture===releaseSpec.archiveBoundaryFixture",1)
    w=w.replace('s.archivedSourceCount===55','s.archivedSourceCount===releaseSpec.archivedSourceCount',1)
    coherence="a.exactInventory&&a.ok&&"
    req(w.count(coherence)>=1,'wrapper semantic coherence anchor')
    w=w.replace(coherence,coherence+"releaseSpec.releaseVersion===APP_VERSION&&releaseSpec.currentReleaseAdapter===('runV'+APP_VERSION.slice(1)+'SelfCheck')&&releaseSpec.retiredReleaseAdapters.length===releaseSpec.retiredReleaseAdapterCount&&",1)
    tail="  globalThis.feqRunSelfCheck=feqRunSelfCheck;\n})();\n"
    req(w.endswith(tail),'wrapper tail anchor')
    w=w[:-len(tail)]+"  globalThis.feqRunSelfCheck=feqRunSelfCheck;\n  delete globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC;\n})();\n"
    wpath.write_text(w)
else:
    req('releaseSpec.archiveBoundaryFixture' in w and 'releaseSpec.archivedSourceCount' in w and 'releaseSpec.retiredReleaseAdapterCount' in w,'materialized wrapper dynamic metadata reads')

w=wpath.read_text()
req(marker in w and 'delete globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC;' in w,'release metadata wrapper lifecycle')
for forbidden in ["production-source-archive-boundary-v174.fixture.json","archivedSourceCount:56","'runV173SelfCheck'",'retiredAdapters.length===14','a.retiredAdapters===14']:
    req(forbidden not in w,'release-specific literal remained in stable wrapper: '+forbidden)
req('retiredReleaseAdapters:Object.freeze([...releaseSpec.retiredReleaseAdapters])' in w,'dynamic retired adapter projection')

# Advance assembler/version and load release metadata immediately before the stable wrapper.
idx=Path('index.html'); s=idx.read_text()
if '{% capture releaseDiagnosticSpec %}' not in s:
    s=s.replace('{% capture diagnosticWrapper %}{% include_relative app/runtime-diagnostic-wrapper.txt %}{% endcapture %}',"{% capture releaseDiagnosticSpec %}{% include_relative app/runtime-release-diagnostic-spec.txt %}{% endcapture %}\n{% capture diagnosticWrapper %}{% include_relative app/runtime-diagnostic-wrapper.txt %}{% endcapture %}",1)
s=s.replace('{% capture v173block %}{% include_relative app/v173-block-00.txt %}{% endcapture %}','{% capture v174block %}{% include_relative app/v174-block-00.txt %}{% endcapture %}')
s=s.replace('<title>FE QUEST PWA v173</title>','<title>FE QUEST PWA v174</title>')
s=s.replace("const APP_VERSION = 'v173';","const APP_VERSION = 'v174';")
s=s.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV173SelfCheck();','applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV174SelfCheck();')
s=s.replace('{{ diagnosticDataFinalize }}{{ diagnosticWrapper }}{{ v173block }}','{{ diagnosticDataFinalize }}{{ releaseDiagnosticSpec }}{{ diagnosticWrapper }}{{ v174block }}')
req(s.count('{% include_relative app/runtime-release-diagnostic-spec.txt %}')==1,'release spec assembler include count')
req(s.count('{% include_relative app/runtime-diagnostic-wrapper.txt %}')==1,'wrapper assembler include count')
req('{% include_relative app/v174-block-00.txt %}' in s and 'v173-block-00.txt' not in s,'v174 adapter assembler')
req('<title>FE QUEST PWA v174</title>' in s and "const APP_VERSION = 'v174';" in s and 'runV174SelfCheck();' in s,'v174 assembler version')
idx.write_text(s)

manifest_path=Path('manifest.webmanifest'); manifest=json.loads(manifest_path.read_text())
manifest['name']='FE QUEST v174'
manifest['description']='基本情報技術者試験向けPWA。v174では、診断wrapperに毎リリース埋め込んでいたarchive fixture・archive件数・retired adapter一覧などを単一のrelease-specific metadata moduleへ分離し、runtime-diagnostic-wrapperをrelease非依存のstable層へ移行する。学習内容・科目A710問・stable base/learning/runtime・Profile Schema v5は変更せず、旧inline-metadata referenceとのcanonical runtime同値をreal Jekyll buildで検証する。'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); st=sw.read_text().replace("const APP_VERSION = 'v173';","const APP_VERSION = 'v174';",1).replace("const CACHE_NAME = 'fe-quest-v173-1';","const CACHE_NAME = 'fe-quest-v174-1';",1)
req("const APP_VERSION = 'v174';" in st and "fe-quest-v174-1" in st,'sw version')
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in st,'sw behavior '+token)
sw.write_text(st)

# Advance diagnostic provenance archive fixture by the v173 adapter only.
prev=Path('_regression/production-source-archive-boundary-v173.fixture.json')
new=Path('_regression/production-source-archive-boundary-v174.fixture.json')
d=json.loads(prev.read_text())
d['name']='production-source-archive-boundary-v174'; d['version']='v174'; d['archived_source_count']=DIAG_ARCHIVE_COUNT
e={'name':'v173-block-00.txt','old_path':'app/v173-block-00.txt','archive_path':'_regression/archive/diagnostics/v173-block-00.txt','utf8_bytes':len(arch_adapter.read_bytes()),'sha256':sha_file(arch_adapter)}
entries=[x for x in d['archive_entries'] if x.get('name')!='v173-block-00.txt']+[e]
d['archive_entries']=entries; d['production_app_archival_residual_count']=0
req(len(entries)==DIAG_ARCHIVE_COUNT,'diagnostic fixture entry count')
new.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Record the one-time wrapper stabilization boundary. Validation fills in equivalence evidence.
fx={
  'name':'stable-release-diagnostic-metadata-v174','version':'v174',
  'scope':'release-specific-diagnostic-metadata-extraction-from-stable-wrapper',
  'policy':'one-time-wrapper-stabilization-plus-single-small-release-metadata-module',
  'parent_release':{'version':'v173','main_sha':PARENT_MAIN},
  'parent_wrapper':parent_wrapper_identity,
  'stable_wrapper':ident(wpath,release_specific_literals_absent=True),
  'release_metadata_module':ident(release_spec,release_version='v174',current_adapter='runV174SelfCheck',retired_adapter_count=len(RETIRED_ADAPTERS),diagnostic_archive_count=DIAG_ARCHIVE_COUNT),
  'stable_base':ident('app/base-stable.html'),
  'stable_learning_module':ident('app/learning-patches.txt'),
  'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
  'assembler':{'release_metadata_include_count':s.count('{% include_relative app/runtime-release-diagnostic-spec.txt %}'),'stable_wrapper_include_count':s.count('{% include_relative app/runtime-diagnostic-wrapper.txt %}'),'current_adapter_include_count':s.count('{% include_relative app/v174-block-00.txt %}')},
  'release_metadata':{'archive_boundary_fixture':'_regression/production-source-archive-boundary-v174.fixture.json','archived_source_count':DIAG_ARCHIVE_COUNT,'retired_release_adapters':RETIRED_ADAPTERS,'retired_release_adapter_count':len(RETIRED_ADAPTERS)},
  'validation':{'status':'pending','reference_mode':'v174-old-inline-metadata-wrapper-derived-from-v173-parent','canonical_runtime_excluded_fields':['FEQUEST_SELF_CHECK.checkedAt']},
  'automatic_behavior_removal_authorized':False
}
Path('_regression/stable-release-diagnostic-metadata-v174.fixture.json').write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

print('FEQUEST_V174_SOURCE_MATERIALIZED wrapper=%d release-metadata=%d retired-adapters=%d diagnostic-archive=%d base=%d learning=%d runtime=%d' % (len(wpath.read_bytes()),len(release_spec.read_bytes()),len(RETIRED_ADAPTERS),DIAG_ARCHIVE_COUNT,BASE_BYTES,LEARNING_BYTES,RUNTIME_BYTES))
