from pathlib import Path
import hashlib, json, re

ROOT=Path('.')

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p, **extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d
def req(v,m):
    if not v: raise AssertionError(m)

patch_path=Path('_regression/production-patch-chain-v167.fixture.json')
patch=json.loads(patch_path.read_text())
order=patch['assembler']['assembly_order']
req(len(order)==47 and order==[r['path'] for r in patch['blocks']],'canonical patch order')
concat=b''.join(Path(p).read_bytes() for p in order)
req(len(concat)==patch['patch_range']['concat_utf8_bytes']==405723,'patch concat bytes')
req(sha_bytes(concat)==patch['patch_range']['concat_sha256']=='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8','patch concat hash')
for r in patch['blocks']:
    p=Path(r['path']); req(p.exists(),'patch missing '+r['path'])
    req(len(p.read_bytes())==r['utf8_bytes'] and sha_file(p)==r['sha256'],'patch identity '+r['path'])

bundle=Path('app/learning-patches-v170.txt')
if not bundle.exists() or bundle.read_bytes()!=concat:
    bundle.write_bytes(concat)
req(bundle.read_bytes()==concat,'bundle exact concat')

old_adapter=Path('app/v169-block-00.txt')
arch_adapter=Path('_regression/archive/diagnostics/v169-block-00.txt')
if old_adapter.exists():
    b=old_adapter.read_bytes()
    if arch_adapter.exists(): req(arch_adapter.read_bytes()==b,'archive adapter mismatch')
    else: arch_adapter.write_bytes(b)
    old_adapter.unlink()
req(arch_adapter.exists(),'v169 adapter archive missing')

adapter=Path('app/v170-block-00.txt')
adapter.write_text("// ===== FE QUEST v170 release adapter =====\n(() => {\n  function runV170SelfCheck(){return feqRunSelfCheck('v170','runV170SelfCheck');}\n  globalThis.runV170SelfCheck=runV170SelfCheck;\n})();\n")

wrapper=Path('app/runtime-diagnostic-wrapper.txt')
w=wrapper.read_text()
w=w.replace("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v169.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v170.fixture.json'")
w=w.replace('archivedSourceCount:51','archivedSourceCount:52')
w=w.replace("'runV168SelfCheck'])","'runV168SelfCheck','runV169SelfCheck'])")
w=w.replace('retiredAdapters.length===9','retiredAdapters.length===10')
w=w.replace('a.retiredAdapters===9','a.retiredAdapters===10')
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v170.fixture.json'" in w,'wrapper fixture update')
req('archivedSourceCount:52' in w,'wrapper archive count')
req("'runV169SelfCheck'" in w,'wrapper retired adapter')
req('retiredAdapters.length===10' in w and 'a.retiredAdapters===10' in w,'wrapper retired count')
wrapper.write_text(w)

idx=Path('index.html')
s=idx.read_text()
if '{% capture learningPatches %}' not in s:
    start=s.index('{% capture v132block %}')
    end=s.index('{% capture semanticRuntime %}',start)
    s=s[:start]+"{% capture learningPatches %}{% include_relative app/learning-patches-v170.txt %}{% endcapture %}\n"+s[end:]
versions=[str(v) for v in range(132,145)]
old_insert='{{ runtimeGuard }}'+''.join('{{ v'+v+'block }}' for v in versions)
req(old_insert in s,'expanded insertion marker')
s=s.replace(old_insert,'{{ runtimeGuard }}{{ learningPatches }}',1)
s=s.replace('{% capture v169block %}{% include_relative app/v169-block-00.txt %}{% endcapture %}','{% capture v170block %}{% include_relative app/v170-block-00.txt %}{% endcapture %}')
s=s.replace('<title>FE QUEST PWA v169</title>','<title>FE QUEST PWA v170</title>')
s=s.replace("const APP_VERSION = 'v169';","const APP_VERSION = 'v170';")
s=s.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV169SelfCheck();','applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV170SelfCheck();')
s=s.replace('{{ v169block }}','{{ v170block }}')
req(s.count('{% include_relative app/learning-patches-v170.txt %}')==1,'bundle include count')
req(not re.search(r'\{%\s*include_relative\s+app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt\s*%\}',s),'expanded patch include remains')
req('{% include_relative app/v170-block-00.txt %}' in s and 'v169-block-00.txt' not in s,'v170 adapter include')
idx.write_text(s)

manifest_path=Path('manifest.webmanifest')
manifest=json.loads(manifest_path.read_text())
manifest['name']='FE QUEST v170'
manifest['description']='基本情報技術者試験向けPWA。v170では、v132〜v144の47個の学習パッチを内容・順序を一切変えず405,723バイトの単一learning bundleへbyte-exactに統合し、従来の47 include assemblerと新しい1 include assemblerを実Jekyll buildで比較する。QUESTION_BANK・self-check・DOM・diagnostic contractのcanonical runtime snapshotが一致した場合のみ新assemblerを採用し、元の47 source fragmentは回帰証拠として保持する。current-contract 71、科目A710問、browser UI 23、CI coverage 84/84、legacy 293 residual 0を維持。'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js')
sw_text=sw.read_text().replace("const APP_VERSION = 'v169';","const APP_VERSION = 'v170';",1).replace("const CACHE_NAME = 'fe-quest-v169-1';","const CACHE_NAME = 'fe-quest-v170-1';",1)
req("const APP_VERSION = 'v170';" in sw_text and "fe-quest-v170-1" in sw_text,'sw version')
sw.write_text(sw_text)

compaction={
  'name':'production-learning-compaction-v170',
  'version':'v170',
  'scope':'active-learning-patch-chain-v132-v144',
  'policy':'byte-exact-semantic-preserving-compaction-with-expanded-reference-build',
  'parent_release':{'version':'v169','main_sha':'b88fb53608423960c05ad8eb0d0fd6ec1238a320'},
  'source_inventory':ident(patch_path),
  'base':{'path':patch['base']['path'],'utf8_bytes':patch['base']['utf8_bytes'],'sha256':patch['base']['sha256']},
  'source_fragments':{
    'version_count':13,'physical_block_count':47,'assembly_order':order,
    'concat_utf8_bytes':len(concat),'concat_sha256':sha_bytes(concat),
    'preserved_in_repository':True,'production_include_count_before':47
  },
  'learning_bundle':ident(bundle,source_fragment_count=47,materialization='byte-exact-concatenation',production_include_count_after=1),
  'assembler':{
    'path':'index.html','mode':'base-v131-plus-single-learning-bundle','production_learning_include_count':1,
    'expanded_reference_learning_include_count':47,'switch_authorized_only_by_byte_exact_build_and_runtime_equivalence':True
  },
  'validation':{'status':'pending','built_html_byte_exact':None,'canonical_runtime_snapshot_equal':None},
  'automatic_behavior_removal_authorized':False
}
comp_path=Path('_regression/production-learning-compaction-v170.fixture.json')
comp_path.write_text(json.dumps(compaction,ensure_ascii=False,indent=2)+'\n')

parent_fx=json.loads(Path('_regression/production-source-archive-boundary-v169.fixture.json').read_text())
fx=parent_fx
fx['name']='production-source-archive-boundary-v170'; fx['version']='v170'; fx['archived_source_count']=52
entry={'name':'v169-block-00.txt','old_path':'app/v169-block-00.txt','archive_path':'_regression/archive/diagnostics/v169-block-00.txt','utf8_bytes':len(arch_adapter.read_bytes()),'sha256':sha_file(arch_adapter)}
if not any(e['name']=='v169-block-00.txt' for e in fx['archive_entries']): fx['archive_entries'].append(entry)
req(len(fx['archive_entries'])==52,'archive entry count')
fx['active_runtime']=ident('app/runtime-semantic-diagnostics.txt')
fx['stable_wrapper']=ident(wrapper)
fx['release_adapter']=ident(adapter,allowed_global='runV170SelfCheck')
fx['assembler']=ident(idx)
fx['manifest']=ident(manifest_path)
fx['service_worker']=ident(sw)
fx['learning_bundle']=ident(bundle,source_fragment_count=47,materialization='byte-exact-concatenation')
fx['compaction_fixture']=ident(comp_path)
fx['policy']='historical-diagnostics-build-excluded-regression-archive-plus-byte-exact-learning-bundle'
archive_fx=Path('_regression/production-source-archive-boundary-v170.fixture.json')
archive_fx.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

archive_files=[p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()]
req(len(archive_files)==52,'physical archive count')
req(not old_adapter.exists() and adapter.exists(),'release adapter boundary')
req(Path('app/runtime-semantic-diagnostics.txt').stat().st_size==55525 and sha_file('app/runtime-semantic-diagnostics.txt')=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50','semantic runtime unchanged')
print(f'FEQUEST_V170_SOURCE_MATERIALIZED fragments=47 bundle={len(concat)} archive=52 runtime=55525')
