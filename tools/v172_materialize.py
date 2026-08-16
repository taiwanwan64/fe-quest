from pathlib import Path
import hashlib, json, re, copy

PARENT_MAIN='fccf3f55c476f0d46b89363e786be6dca37af0dc'
BASE_BYTES=3041328
BASE_SHA='1222c7ac30b6a227f0b5bfd4d7b5a4c380a18d47d55171cfaaeaa3c09dbfbd5a'
LEGACY_BYTES=49657
LEGACY_SHA='b7f6a3eea1e5c609844311ba9acfe17179df19e07b9c82354ff9ee87c6922f36'
LEARNING_BYTES=405723
LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525
RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
START=b'function runAppSelfCheck(){'
END=b'function runLessonUXAudit(){'


def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p, **extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

base_path=Path('app/base-v131.html')
req(base_path.exists(),'base-v131 missing')
base=base_path.read_bytes()
req(len(base)==BASE_BYTES and sha_bytes(base)==BASE_SHA,'base-v131 identity')
req(base.count(START)==1 and base.count(END)==1,'legacy base markers must be unique')
a=base.index(START); b=base.index(END,a)
legacy=base[a:b]
req(len(legacy)==LEGACY_BYTES and sha_bytes(legacy)==LEGACY_SHA,'legacy evaluator range identity')
stable_bytes=base[:a]+base[b:]
req(START not in stable_bytes and stable_bytes.count(END)==1,'stable base legacy evaluator stripping')
req(len(stable_bytes)==BASE_BYTES-LEGACY_BYTES,'stable base byte arithmetic')
stable_path=Path('app/base-stable.html')
stable_path.write_bytes(stable_bytes)

base_archive=Path('_regression/archive/learning-base')
base_archive.mkdir(parents=True,exist_ok=True)
legacy_archive=base_archive/'runAppSelfCheck-v131.txt'
if legacy_archive.exists(): req(legacy_archive.read_bytes()==legacy,'legacy evaluator archive mismatch')
else: legacy_archive.write_bytes(legacy)
req(len(legacy_archive.read_bytes())==LEGACY_BYTES and sha_file(legacy_archive)==LEGACY_SHA,'legacy evaluator archive identity')

old_adapter=Path('app/v171-block-00.txt')
arch_adapter=Path('_regression/archive/diagnostics/v171-block-00.txt')
if old_adapter.exists():
    raw=old_adapter.read_bytes()
    if arch_adapter.exists(): req(arch_adapter.read_bytes()==raw,'v171 adapter archive mismatch')
    else: arch_adapter.write_bytes(raw)
    old_adapter.unlink()
req(arch_adapter.exists(),'v171 adapter archive missing')

adapter=Path('app/v172-block-00.txt')
adapter.write_text("// ===== FE QUEST v172 release adapter =====\n(() => {\n  function runV172SelfCheck(){return feqRunSelfCheck('v172','runV172SelfCheck');}\n  globalThis.runV172SelfCheck=runV172SelfCheck;\n})();\n")

wrapper=Path('app/runtime-diagnostic-wrapper.txt')
w=wrapper.read_text()
w=w.replace("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v171.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v172.fixture.json'")
w=w.replace('archivedSourceCount:53','archivedSourceCount:54')
w=w.replace("'runV170SelfCheck'])","'runV170SelfCheck','runV171SelfCheck'])")
w=w.replace('retiredAdapters.length===11','retiredAdapters.length===12')
w=w.replace('new Set(retiredAdapters).size===11','new Set(retiredAdapters).size===12')
w=w.replace('a.retiredAdapters===11','a.retiredAdapters===12')
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v172.fixture.json'" in w,'wrapper fixture')
req('archivedSourceCount:54' in w,'wrapper archive count')
req("'runV171SelfCheck'" in w,'wrapper retired adapter')
req('retiredAdapters.length===12' in w and 'new Set(retiredAdapters).size===12' in w and 'a.retiredAdapters===12' in w,'wrapper retired cardinality')
wrapper.write_text(w)

idx=Path('index.html')
s=idx.read_text()
old_projection='''{% capture base %}{% include_relative app/base-v131.html %}{% endcapture %}\n{% assign legacyStartParts = base | split: "function runAppSelfCheck(){" %}\n{% assign productionBaseHead = legacyStartParts | first %}\n{% assign legacyTail = legacyStartParts | last %}\n{% assign legacyEndParts = legacyTail | split: "function runLessonUXAudit(){" %}\n{% assign productionBaseTail = legacyEndParts | last %}\n{% assign lessonUxHead = "function runLessonUXAudit(){" %}\n{% capture productionBase %}{{ productionBaseHead }}{{ lessonUxHead }}{{ productionBaseTail }}{% endcapture %}'''
stable_capture='{% capture productionBase %}{% include_relative app/base-stable.html %}{% endcapture %}'
if old_projection in s: s=s.replace(old_projection,stable_capture,1)
req(stable_capture in s,'stable base capture')
req('legacyStartParts' not in s and 'legacyEndParts' not in s,'dynamic legacy stripping residual')
req('{% include_relative app/base-v131.html %}' not in s,'production assembler still includes base-v131')
s=s.replace('{% capture v171block %}{% include_relative app/v171-block-00.txt %}{% endcapture %}','{% capture v172block %}{% include_relative app/v172-block-00.txt %}{% endcapture %}')
s=s.replace('<title>FE QUEST PWA v171</title>','<title>FE QUEST PWA v172</title>')
s=s.replace("const APP_VERSION = 'v171';","const APP_VERSION = 'v172';")
s=s.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV171SelfCheck();','applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV172SelfCheck();')
s=s.replace('{{ v171block }}','{{ v172block }}')
req('{% include_relative app/v172-block-00.txt %}' in s and 'v171-block-00.txt' not in s,'v172 adapter include')
req("<title>FE QUEST PWA v172</title>" in s and "const APP_VERSION = 'v172';" in s,'v172 version replacements')
idx.write_text(s)

manifest_path=Path('manifest.webmanifest')
manifest=json.loads(manifest_path.read_text())
manifest['name']='FE QUEST v172'
manifest['description']='基本情報技術者試験向けPWA。v172では、従来index assemblerがapp/base-v131.htmlからrelease-only legacy runAppSelfCheck() evaluatorを毎build除外していた処理を、byte-exactな安定production base app/base-stable.htmlへmaterializeする。base-v131はimmutable evidenceとして保持し、49,657バイトのlegacy evaluator rangeをbuild-excluded regression archiveへbyte-exact保存。real Jekyllで旧Liquid projectionとstable base buildのgenerated HTML完全一致およびcanonical runtime snapshot同値を検証し、科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js')
sw_text=sw.read_text().replace("const APP_VERSION = 'v171';","const APP_VERSION = 'v172';",1).replace("const CACHE_NAME = 'fe-quest-v171-1';","const CACHE_NAME = 'fe-quest-v172-1';",1)
req("const APP_VERSION = 'v172';" in sw_text and "fe-quest-v172-1" in sw_text,'sw version')
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in sw_text,'sw behavior '+token)
sw.write_text(sw_text)

learn=Path('app/learning-patches.txt')
req(learn.exists() and len(learn.read_bytes())==LEARNING_BYTES and sha_file(learn)==LEARNING_SHA,'stable learning unchanged')
rt=Path('app/runtime-semantic-diagnostics.txt')
req(rt.exists() and len(rt.read_bytes())==RUNTIME_BYTES and sha_file(rt)==RUNTIME_SHA,'semantic runtime unchanged')

base_fx={
  'name':'production-base-stabilization-v172',
  'version':'v172',
  'scope':'materialized-production-base-after-release-only-legacy-evaluator-exclusion',
  'policy':'byte-exact-liquid-projection-to-stable-physical-base-no-semantic-rewrite',
  'parent_release':{'version':'v171','main_sha':PARENT_MAIN},
  'historical_base':ident(base_path,role='immutable-evidence-retained-in-app',production_included=False),
  'legacy_range':ident(legacy_archive,start_marker=START.decode(),end_marker=END.decode(),assert_count=293,source_path='app/base-v131.html',source_start_byte=a,source_end_byte=b),
  'stable_active_base':ident(stable_path,materialization='base-prefix-plus-end-marker-and-tail',production_include_count=1,legacy_evaluator_function_count=0),
  'byte_arithmetic':{'historical_base_utf8_bytes':len(base),'excluded_legacy_utf8_bytes':len(legacy),'stable_base_utf8_bytes':len(stable_bytes),'exact_subtraction':len(stable_bytes)==len(base)-len(legacy)},
  'production_assembler':{'dynamic_legacy_split_count':0,'stable_base_include_count':1,'historical_base_include_count':0},
  'validation':{'status':'pending','built_html_byte_exact':None,'canonical_runtime_snapshot_equal':None},
  'automatic_semantic_deletion_authorized':False
}
base_fx_path=Path('_regression/production-base-stabilization-v172.fixture.json')
base_fx_path.write_text(json.dumps(base_fx,ensure_ascii=False,indent=2)+'\n')

parent_fx=json.loads(Path('_regression/production-source-archive-boundary-v171.fixture.json').read_text())
fx=copy.deepcopy(parent_fx)
fx['name']='production-source-archive-boundary-v172'; fx['version']='v172'; fx['archived_source_count']=54
entry={'name':'v171-block-00.txt','old_path':'app/v171-block-00.txt','archive_path':'_regression/archive/diagnostics/v171-block-00.txt','utf8_bytes':len(arch_adapter.read_bytes()),'sha256':sha_file(arch_adapter)}
if not any(e.get('name')=='v171-block-00.txt' for e in fx['archive_entries']): fx['archive_entries'].append(entry)
req(len(fx['archive_entries'])==54,'diagnostic archive fixture count')
fx['active_runtime']=ident(rt)
fx['stable_wrapper']=ident(wrapper)
fx['release_adapter']=ident(adapter,allowed_global='runV172SelfCheck')
fx['assembler']=ident(idx)
fx['manifest']=ident(manifest_path)
fx['service_worker']=ident(sw)
fx['stable_learning_module']=ident(learn,source_fragment_count=47)
fx['stable_base']=ident(stable_path,legacy_evaluator_excluded=True)
fx['base_stabilization_fixture']=ident(base_fx_path)
fx['learning_source_boundary_fixture']=ident('_regression/production-learning-source-boundary-v171.fixture.json')
fx['policy']='historical-diagnostics-build-excluded-regression-archive-plus-stable-learning-and-base-production-sources'
archive_fx=Path('_regression/production-source-archive-boundary-v172.fixture.json')
archive_fx.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==54,'physical diagnostic archive count')
req(len([p for p in Path('_regression/archive/learning-patches').iterdir() if p.is_file()])==48,'learning archive count')
req(len([p for p in base_archive.iterdir() if p.is_file()])>=1,'base provenance archive count')
req(base_path.exists() and len(base_path.read_bytes())==BASE_BYTES and sha_file(base_path)==BASE_SHA,'historical base preserved')
req(stable_path.exists() and sha_file(stable_path)==sha_bytes(stable_bytes),'stable base materialized')
req(not old_adapter.exists() and adapter.exists(),'release adapter boundary')
print(f'FEQUEST_V172_SOURCE_MATERIALIZED base-stable={len(stable_bytes)} base-sha={sha_bytes(stable_bytes)} legacy={len(legacy)} diagnostic-archive=54 learning=405723 runtime=55525')
