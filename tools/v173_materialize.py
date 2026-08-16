from pathlib import Path
import hashlib, json, shutil

PARENT_MAIN='6fee64d6225debb1f3cf2549b722ee18c0ee0556'
BASE_BYTES=3041328
BASE_SHA='1222c7ac30b6a227f0b5bfd4d7b5a4c380a18d47d55171cfaaeaa3c09dbfbd5a'
STABLE_BYTES=2991671
STABLE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEGACY_BYTES=49657
LEGACY_SHA='b7f6a3eea1e5c609844311ba9acfe17179df19e07b9c82354ff9ee87c6922f36'
LEARNING_BYTES=405723
LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525
RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
START=b'function runAppSelfCheck(){'
END=b'function runLessonUXAudit(){'
OLD_BASE=Path('app/base-v131.html')
ARCHIVE_BASE=Path('_regression/archive/learning-base/base-v131.html')
LEGACY_ARCHIVE=Path('_regression/archive/learning-base/runAppSelfCheck-v131.txt')


def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

def classify_ref(path):
    s=path.as_posix()
    if s in {'app/runtime-semantic-diagnostics.txt','app/runtime-diagnostic-wrapper.txt'}:
        return 'runtime-historical-provenance-literal'
    if s.startswith('_regression/'):
        return 'historical-regression-evidence'
    if s.startswith('audits/'):
        return 'historical-audit-documentation'
    if s=='manifest.webmanifest':
        return 'release-description'
    return 'UNCLASSIFIED'

def scan_refs():
    needle=b'app/base-v131.html'
    rows=[]
    skip_prefixes=('.git/','_site/','_site_reference/','_v173_reference_src/','tools/v173_','.github/workflows/v173-')
    for p in sorted(Path('.').rglob('*')):
        if not p.is_file(): continue
        s=p.as_posix()
        if s.startswith(skip_prefixes): continue
        if p.suffix.lower() in {'.png','.jpg','.jpeg','.gif','.zip','.ico','.pdf'}: continue
        try: b=p.read_bytes()
        except OSError: continue
        n=b.count(needle)
        if n: rows.append({'path':s,'occurrences':n,'classification':classify_ref(p)})
    return rows

# Capture the v172 physical-reference inventory before relocation. Temporary v173
# tooling/workflow files are deliberately excluded so the inventory measures product evidence.
pre_inventory=scan_refs()
req(not any(r['classification']=='UNCLASSIFIED' for r in pre_inventory),'unclassified base-v131 reference before relocation: '+repr(pre_inventory))

# Move the historical full base out of app byte-exact. The move is idempotent so a
# second workflow run on the materialized commit validates rather than mutates it.
ARCHIVE_BASE.parent.mkdir(parents=True,exist_ok=True)
if OLD_BASE.exists():
    req(len(OLD_BASE.read_bytes())==BASE_BYTES and sha_file(OLD_BASE)==BASE_SHA,'historical base identity before move')
    req(not ARCHIVE_BASE.exists(),'historical base archive already exists while app source still exists')
    shutil.move(OLD_BASE,ARCHIVE_BASE)
req(ARCHIVE_BASE.exists() and len(ARCHIVE_BASE.read_bytes())==BASE_BYTES and sha_file(ARCHIVE_BASE)==BASE_SHA,'historical base archive identity')
req(not OLD_BASE.exists(),'historical base remained under app')

base=ARCHIVE_BASE.read_bytes(); stable=Path('app/base-stable.html').read_bytes()
req(len(stable)==STABLE_BYTES and sha_bytes(stable)==STABLE_SHA,'stable active base identity')
req(base.count(START)==1 and base.count(END)==1,'historical base markers')
a=base.index(START); b=base.index(END,a); legacy=base[a:b]
req(len(legacy)==LEGACY_BYTES and sha_bytes(legacy)==LEGACY_SHA,'legacy range identity')
req(stable==base[:a]+base[b:],'stable base no longer exact historical projection')
req(LEGACY_ARCHIVE.exists() and LEGACY_ARCHIVE.read_bytes()==legacy,'legacy evaluator archive identity')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning identity')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'stable semantic runtime identity')

# Archive the v172 release adapter and create the v173 adapter.
old_adapter=Path('app/v172-block-00.txt')
arch_adapter=Path('_regression/archive/diagnostics/v172-block-00.txt')
if old_adapter.exists():
    req(not arch_adapter.exists(),'v172 adapter archive already exists while active source still exists')
    shutil.move(old_adapter,arch_adapter)
req(arch_adapter.exists() and not old_adapter.exists(),'v172 adapter archive boundary')
v173=Path('app/v173-block-00.txt')
v173_text="""// ===== FE QUEST v173 release adapter =====\n(() => {\n  function runV173SelfCheck(){return feqRunSelfCheck('v173','runV173SelfCheck');}\n  globalThis.runV173SelfCheck=runV173SelfCheck;\n})();\n"""
if v173.exists(): req(v173.read_text()==v173_text,'v173 adapter drift')
else: v173.write_text(v173_text)

# Advance only release-boundary metadata in the stable wrapper. Historical v131
# sourcePath provenance deliberately remains the original source path.
wpath=Path('app/runtime-diagnostic-wrapper.txt'); w=wpath.read_text()
repls=[
("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v172.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v173.fixture.json'"),
('archivedSourceCount:54','archivedSourceCount:55'),
("'runV170SelfCheck','runV171SelfCheck'])","'runV170SelfCheck','runV171SelfCheck','runV172SelfCheck'])"),
('retiredAdapters.length===12&&new Set(retiredAdapters).size===12','retiredAdapters.length===13&&new Set(retiredAdapters).size===13'),
('a.retiredAdapters===12&&','a.retiredAdapters===13&&'),
("s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v172.fixture.json'","s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v173.fixture.json'"),
('s.archivedSourceCount===54','s.archivedSourceCount===55')
]
for old,new in repls:
    if old in w: w=w.replace(old,new)
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v173.fixture.json'" in w,'wrapper fixture advance')
req('archivedSourceCount:55' in w and "'runV172SelfCheck'" in w,'wrapper archive/adapter advance')
req('retiredAdapters.length===13&&new Set(retiredAdapters).size===13' in w and 'a.retiredAdapters===13' in w,'wrapper adapter inventory checks')
req("f.sourcePath==='app/base-v131.html'" in w,'historical source provenance must remain original')
wpath.write_text(w)

# Advance the assembler without touching the stable base, learning module, or semantic runtime.
idx=Path('index.html'); s=idx.read_text()
s=s.replace('{% capture v172block %}{% include_relative app/v172-block-00.txt %}{% endcapture %}','{% capture v173block %}{% include_relative app/v173-block-00.txt %}{% endcapture %}')
s=s.replace('<title>FE QUEST PWA v172</title>','<title>FE QUEST PWA v173</title>')
s=s.replace("const APP_VERSION = 'v172';","const APP_VERSION = 'v173';")
s=s.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV172SelfCheck();','applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV173SelfCheck();')
s=s.replace('{{ v172block }}','{{ v173block }}')
req('{% include_relative app/base-stable.html %}' in s and 'app/base-v131.html' not in s,'production base dependency')
req('{% include_relative app/v173-block-00.txt %}' in s and 'v172-block-00.txt' not in s,'v173 adapter assembler')
req('<title>FE QUEST PWA v173</title>' in s and "const APP_VERSION = 'v173';" in s and 'runV173SelfCheck();' in s,'v173 assembler version')
idx.write_text(s)

manifest_path=Path('manifest.webmanifest'); manifest=json.loads(manifest_path.read_text())
manifest['name']='FE QUEST v173'
manifest['description']='基本情報技術者試験向けPWA。v173では、v172でproductionから独立済みの歴史的v131フルベースをリポジトリ参照棚卸し後にbuild-excluded regression archiveへbyte-exact移動する。productionは引き続き安定base-stable、learning-patches、semantic runtimeのみを使用し、real Jekyll生成HTMLとcanonical runtimeの同値、科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を検証する。'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js'); st=sw.read_text().replace("const APP_VERSION = 'v172';","const APP_VERSION = 'v173';",1).replace("const CACHE_NAME = 'fe-quest-v172-1';","const CACHE_NAME = 'fe-quest-v173-1';",1)
req("const APP_VERSION = 'v173';" in st and "fe-quest-v173-1" in st,'sw version')
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in st,'sw behavior '+token)
sw.write_text(st)

# Advance the diagnostic/provenance archive fixture by one adapter.
diag_prev=Path('_regression/production-source-archive-boundary-v172.fixture.json')
diag_new=Path('_regression/production-source-archive-boundary-v173.fixture.json')
d=json.loads(diag_prev.read_text())
d['name']='production-source-archive-boundary-v173'; d['version']='v173'; d['archived_source_count']=55
e={
  'name':'v172-block-00.txt','old_path':'app/v172-block-00.txt','archive_path':'_regression/archive/diagnostics/v172-block-00.txt',
  'utf8_bytes':len(arch_adapter.read_bytes()),'sha256':sha_file(arch_adapter)
}
entries=[x for x in d['archive_entries'] if x.get('name')!='v172-block-00.txt']+[e]
d['archive_entries']=entries
req(len(entries)==55,'diagnostic fixture entry count')
d['production_app_archival_residual_count']=0
diag_new.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Record the new physical historical-base boundary without rewriting v172/v131 evidence.
post_inventory=scan_refs()
req(not any(r['classification']=='UNCLASSIFIED' for r in post_inventory),'unclassified base-v131 reference after relocation: '+repr(post_inventory))
fx={
  'name':'production-base-archive-boundary-v173','version':'v173',
  'scope':'historical-v131-full-base-relocation-after-v172-stable-base-materialization',
  'policy':'byte-exact-archive-move-no-production-or-semantic-learning-change',
  'parent_release':{'version':'v172','main_sha':PARENT_MAIN},
  'historical_base':{
    'original_path':'app/base-v131.html','archive_path':ARCHIVE_BASE.as_posix(),'utf8_bytes':BASE_BYTES,'sha256':BASE_SHA,
    'original_path_present_after_move':False,'archive_byte_exact':True,'production_included':False
  },
  'stable_active_base':ident('app/base-stable.html',production_include_count=1),
  'legacy_evaluator_range':ident(LEGACY_ARCHIVE,assert_count=293,source_start_byte=a,source_end_byte=b),
  'stable_learning_module':ident('app/learning-patches.txt'),
  'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
  'reference_inventory_before_move':pre_inventory,
  'reference_inventory_after_move':post_inventory,
  'reference_policy':{
    'runtime_historical_provenance_literals_allowed':True,
    'historical_regression_and_audit_literals_allowed':True,
    'unclassified_reference_count_after_move':sum(1 for r in post_inventory if r['classification']=='UNCLASSIFIED'),
    'production_assembler_historical_base_include_count':s.count('{% include_relative app/base-v131.html %}'),
    'production_assembler_stable_base_include_count':s.count('{% include_relative app/base-stable.html %}')
  },
  'validation':{'status':'pending'}
}
Path('_regression/production-base-archive-boundary-v173.fixture.json').write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

print('FEQUEST_V173_SOURCE_MATERIALIZED base-archive=%d base-sha=%s stable=%d learning=%d runtime=%d diagnostic-archive=55 refs-pre=%d refs-post=%d' % (BASE_BYTES,BASE_SHA,STABLE_BYTES,LEARNING_BYTES,RUNTIME_BYTES,len(pre_inventory),len(post_inventory)))
