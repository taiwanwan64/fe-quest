from pathlib import Path
import hashlib, json, re, shutil, copy

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p, **extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d

parent_main='1f028dab4d12364dd5bddf19831618da1c3dc5d1'
bundle_hash='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
runtime_hash='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
base_hash='1222c7ac30b6a227f0b5bfd4d7b5a4c380a18d47d55171cfaaeaa3c09dbfbd5a'

patch_path=Path('_regression/production-patch-chain-v167.fixture.json')
patch=json.loads(patch_path.read_text())
order=patch['assembler']['assembly_order']
req(len(order)==47 and order==[r['path'] for r in patch['blocks']],'canonical patch order')

old_bundle=Path('app/learning-patches-v170.txt')
req(old_bundle.exists(),'v170 learning bundle missing')
bundle_bytes=old_bundle.read_bytes()
req(len(bundle_bytes)==405723 and sha_bytes(bundle_bytes)==bundle_hash,'v170 learning bundle identity')

stable=Path('app/learning-patches.txt')
stable.write_bytes(bundle_bytes)
req(len(stable.read_bytes())==405723 and sha_file(stable)==bundle_hash,'stable learning module identity')

learn_archive=Path('_regression/archive/learning-patches')
learn_archive.mkdir(parents=True,exist_ok=True)
archive_entries=[]
fragment_bytes=[]
for r in patch['blocks']:
    src=Path(r['path'])
    dst=learn_archive/src.name
    if src.exists():
        b=src.read_bytes()
        req(len(b)==r['utf8_bytes'] and sha_bytes(b)==r['sha256'],'fragment identity '+r['path'])
        if dst.exists(): req(dst.read_bytes()==b,'fragment archive mismatch '+r['path'])
        else: dst.write_bytes(b)
        src.unlink()
    req(dst.exists(),'fragment archive missing '+dst.as_posix())
    req(len(dst.read_bytes())==r['utf8_bytes'] and sha_file(dst)==r['sha256'],'archived fragment identity '+r['path'])
    fragment_bytes.append(dst.read_bytes())
    archive_entries.append({'role':'source-fragment','name':src.name,'old_path':r['path'],'archive_path':dst.as_posix(),'utf8_bytes':r['utf8_bytes'],'sha256':r['sha256']})
concat=b''.join(fragment_bytes)
req(len(concat)==405723 and sha_bytes(concat)==bundle_hash,'archived fragment reconstruction')
req(concat==stable.read_bytes(),'stable module != archived fragment concat')

arch_old_bundle=learn_archive/'learning-patches-v170.txt'
if old_bundle.exists():
    if arch_old_bundle.exists(): req(arch_old_bundle.read_bytes()==old_bundle.read_bytes(),'v170 bundle archive mismatch')
    else: arch_old_bundle.write_bytes(old_bundle.read_bytes())
    old_bundle.unlink()
req(arch_old_bundle.exists() and arch_old_bundle.read_bytes()==stable.read_bytes(),'archived v170 bundle identity')
archive_entries.append({'role':'superseded-versioned-bundle','name':'learning-patches-v170.txt','old_path':'app/learning-patches-v170.txt','archive_path':arch_old_bundle.as_posix(),'utf8_bytes':len(arch_old_bundle.read_bytes()),'sha256':sha_file(arch_old_bundle)})
req(len(archive_entries)==48,'learning archive entry count')

old_adapter=Path('app/v170-block-00.txt')
arch_adapter=Path('_regression/archive/diagnostics/v170-block-00.txt')
if old_adapter.exists():
    b=old_adapter.read_bytes()
    if arch_adapter.exists(): req(arch_adapter.read_bytes()==b,'v170 adapter archive mismatch')
    else: arch_adapter.write_bytes(b)
    old_adapter.unlink()
req(arch_adapter.exists(),'v170 adapter archive missing')

adapter=Path('app/v171-block-00.txt')
adapter.write_text("// ===== FE QUEST v171 release adapter =====\n(() => {\n  function runV171SelfCheck(){return feqRunSelfCheck('v171','runV171SelfCheck');}\n  globalThis.runV171SelfCheck=runV171SelfCheck;\n})();\n")

wrapper=Path('app/runtime-diagnostic-wrapper.txt')
w=wrapper.read_text()
w=w.replace("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v170.fixture.json'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v171.fixture.json'")
w=w.replace('archivedSourceCount:52','archivedSourceCount:53')
w=w.replace("'runV169SelfCheck'])","'runV169SelfCheck','runV170SelfCheck'])")
w=w.replace('retiredAdapters.length===10','retiredAdapters.length===11')
w=w.replace('a.retiredAdapters===10','a.retiredAdapters===11')
w=w.replace('a.retiredAdapters===10','a.retiredAdapters===11')
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v171.fixture.json'" in w,'wrapper fixture')
req('archivedSourceCount:53' in w,'wrapper archive count')
req("'runV170SelfCheck'" in w,'wrapper retired adapter')
req('retiredAdapters.length===11' in w and 'a.retiredAdapters===11' in w,'wrapper retired count')
wrapper.write_text(w)

idx=Path('index.html')
s=idx.read_text()
s=s.replace('{% include_relative app/learning-patches-v170.txt %}','{% include_relative app/learning-patches.txt %}')
s=s.replace('{% capture v170block %}{% include_relative app/v170-block-00.txt %}{% endcapture %}','{% capture v171block %}{% include_relative app/v171-block-00.txt %}{% endcapture %}')
s=s.replace('<title>FE QUEST PWA v170</title>','<title>FE QUEST PWA v171</title>')
s=s.replace("const APP_VERSION = 'v170';","const APP_VERSION = 'v171';")
s=s.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV170SelfCheck();','applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV171SelfCheck();')
s=s.replace('{{ v170block }}','{{ v171block }}')
req(s.count('{% include_relative app/learning-patches.txt %}')==1,'stable learning include')
req('learning-patches-v170.txt' not in s,'versioned learning include residual')
req(not re.search(r'\{%\s*include_relative\s+app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt\s*%\}',s),'fragment include residual')
req('{% include_relative app/v171-block-00.txt %}' in s and 'v170-block-00.txt' not in s,'v171 adapter include')
idx.write_text(s)

manifest_path=Path('manifest.webmanifest')
manifest=json.loads(manifest_path.read_text())
manifest['name']='FE QUEST v171'
manifest['description']='基本情報技術者試験向けPWA。v171では、v170でbyte-exact統合した405,723バイトの学習パッチ群をversionlessな安定モジュール app/learning-patches.txt に昇格し、元のv132〜v144 47 source fragmentとv170版bundleをbuild-excluded regression archiveへbyte-exactに移動する。production app/には単一の安定学習モジュールだけを残し、実Jekyll buildとcanonical runtime snapshotで旧versioned bundle境界との完全同値を検証する。current-contract 71、科目A710問、browser UI 23、CI coverage 84/84、legacy 293 residual 0を維持。'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js')
sw_text=sw.read_text().replace("const APP_VERSION = 'v170';","const APP_VERSION = 'v171';",1).replace("const CACHE_NAME = 'fe-quest-v170-1';","const CACHE_NAME = 'fe-quest-v171-1';",1)
req("const APP_VERSION = 'v171';" in sw_text and "fe-quest-v171-1" in sw_text,'sw version')
sw.write_text(sw_text)

boundary={
  'name':'production-learning-source-boundary-v171',
  'version':'v171',
  'scope':'stable-active-learning-module-and-build-excluded-provenance',
  'policy':'single-versionless-active-learning-module-with-byte-exact-regression-archive',
  'parent_release':{'version':'v170','main_sha':parent_main},
  'source_inventory':ident(patch_path),
  'parent_compaction_fixture':ident('_regression/production-learning-compaction-v170.fixture.json'),
  'base':ident('app/base-v131.html'),
  'stable_active_module':ident(stable,source_fragment_count=47,materialization='byte-exact-concatenation',production_include_count=1),
  'archive_root':learn_archive.as_posix(),
  'archived_source_count':48,
  'archive_entries':archive_entries,
  'reconstruction':{
    'fragment_count':47,'concat_utf8_bytes':len(concat),'concat_sha256':sha_bytes(concat),
    'stable_module_equals_fragment_concat':True,'archived_v170_bundle_equals_stable_module':True
  },
  'production_app':{
    'active_learning_modules':['app/learning-patches.txt'],
    'versioned_fragment_residual_count':0,
    'versioned_bundle_residual_count':0
  },
  'validation':{'status':'pending','built_html_byte_exact':None,'canonical_runtime_snapshot_equal':None},
  'automatic_behavior_removal_authorized':False
}
learn_fx=Path('_regression/production-learning-source-boundary-v171.fixture.json')
learn_fx.write_text(json.dumps(boundary,ensure_ascii=False,indent=2)+'\n')

parent_fx=json.loads(Path('_regression/production-source-archive-boundary-v170.fixture.json').read_text())
fx=copy.deepcopy(parent_fx)
fx['name']='production-source-archive-boundary-v171'; fx['version']='v171'; fx['archived_source_count']=53
entry={'name':'v170-block-00.txt','old_path':'app/v170-block-00.txt','archive_path':'_regression/archive/diagnostics/v170-block-00.txt','utf8_bytes':len(arch_adapter.read_bytes()),'sha256':sha_file(arch_adapter)}
if not any(e['name']=='v170-block-00.txt' for e in fx['archive_entries']): fx['archive_entries'].append(entry)
req(len(fx['archive_entries'])==53,'diagnostic archive entry count')
fx['active_runtime']=ident('app/runtime-semantic-diagnostics.txt')
fx['stable_wrapper']=ident(wrapper)
fx['release_adapter']=ident(adapter,allowed_global='runV171SelfCheck')
fx['assembler']=ident(idx)
fx['manifest']=ident(manifest_path)
fx['service_worker']=ident(sw)
fx['stable_learning_module']=ident(stable,source_fragment_count=47)
fx['learning_source_boundary_fixture']=ident(learn_fx)
fx['policy']='historical-diagnostics-build-excluded-regression-archive-plus-stable-versionless-learning-module'
archive_fx=Path('_regression/production-source-archive-boundary-v171.fixture.json')
archive_fx.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

diag_files=[p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()]
req(len(diag_files)==53,'physical diagnostic archive count')
learn_files=[p for p in learn_archive.iterdir() if p.is_file()]
req(len(learn_files)==48,'physical learning archive count')

residual=[p.name for p in Path('app').iterdir() if re.fullmatch(r'v(?:13[2-9]|14[0-4])-block-\d\d\.txt',p.name)]
req(not residual,'learning fragment residual '+','.join(residual))
req(not Path('app/learning-patches-v170.txt').exists(),'versioned learning bundle residual')
req(stable.exists(),'stable learning module missing')
req(not old_adapter.exists() and adapter.exists(),'release adapter boundary')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==55525 and sha_file('app/runtime-semantic-diagnostics.txt')==runtime_hash,'semantic runtime unchanged')
req(len(Path('app/base-v131.html').read_bytes())==3041328 and sha_file('app/base-v131.html')==base_hash,'base unchanged')
print('FEQUEST_V171_SOURCE_MATERIALIZED stable-learning=405723 archived-learning=48 diagnostic-archive=53 runtime=55525')
