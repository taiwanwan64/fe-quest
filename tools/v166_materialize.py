from pathlib import Path
import hashlib, json, re

ROOT=Path('.')
APP=ROOT/'app'
ARCHIVE=ROOT/'_regression'/'archive'/'diagnostics'
FIXTURE=ROOT/'_regression'/'production-source-archive-boundary-v166.fixture.json'

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def req(v,m):
    if not v: raise SystemExit(m)

def archival_names():
    names=[
        'runtime-current-diagnostics.txt',
        'runtime-diagnostic-contract-data.txt',
        'runtime-diagnostic-data-finalize-v157.txt',
        'runtime-diagnostic-data-finalize-v159.txt',
        'runtime-diagnostic-data-prelude-v157.txt',
        'runtime-semantic-projection-v158.txt',
    ]
    names += [f'runtime-semantic-diagnostics-v159-{i:02d}.txt' for i in range(9)]
    names += [f'v{v}-block-00.txt' for v in range(145,158)]
    names += [f'v158-block-{i:02d}.txt' for i in range(3)]
    names += [f'v159-block-{i:02d}.txt' for i in range(3)]
    names += [f'v154-runtime-v{v}.txt' for v in range(145,153)]
    names += [f'v{v}-block-00.txt' for v in range(160,166)]
    req(len(names)==48 and len(set(names))==48,'archive inventory must be exactly 48 unique files')
    return names

names=archival_names()
ARCHIVE.mkdir(parents=True,exist_ok=True)
entries=[]
for name in names:
    src=APP/name
    dst=ARCHIVE/name
    if src.exists():
        req(not dst.exists(),f'archive destination already exists: {dst}')
        src.rename(dst)
    req(dst.exists(),f'missing archival source after move: {dst}')
    b=dst.read_bytes()
    entries.append({'name':name,'old_path':f'app/{name}','archive_path':str(dst).replace('\\','/'),'utf8_bytes':len(b),'sha256':sha_bytes(b)})

# Versioned release adapter.
adapter="""// ===== FE QUEST v166 release adapter =====
(() => {
  function runV166SelfCheck(){return feqRunSelfCheck('v166','runV166SelfCheck');}
  globalThis.runV166SelfCheck=runV166SelfCheck;
})();
"""
(APP/'v166-block-00.txt').write_text(adapter)

# Stable diagnostic wrapper now points historical source metadata to the build-excluded regression archive.
wp=APP/'runtime-diagnostic-wrapper.txt'
w=wp.read_text()
for name in names:
    w=w.replace(f'app/{name}',f'_regression/archive/diagnostics/{name}')
old="    materializationMode:'byte-exact-physical-semantic-runtime-source',\n"
new=old+"    archiveBoundaryFixture:'_regression/production-source-archive-boundary-v166.fixture.json',\n    archiveRoot:'_regression/archive/diagnostics',\n    archivedSourceCount:48,\n"
if 'archiveBoundaryFixture' not in w:
    req(old in w,'wrapper materialization insertion point missing')
    w=w.replace(old,new,1)
w=w.replace("Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck'])","Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck'])")
w=w.replace('retiredAdapters.length===5&&new Set(retiredAdapters).size===5','retiredAdapters.length===6&&new Set(retiredAdapters).size===6')
w=w.replace('a.retiredAdapters===5','a.retiredAdapters===6')
needle="&&s.materializationMode==='byte-exact-physical-semantic-runtime-source'&&s.stableRuntimePathPolicy==='single-physical-semantic-runtime-source'"
repl="&&s.materializationMode==='byte-exact-physical-semantic-runtime-source'&&s.archiveBoundaryFixture==='_regression/production-source-archive-boundary-v166.fixture.json'&&s.archiveRoot==='_regression/archive/diagnostics'&&s.archivedSourceCount===48&&s.stableRuntimePathPolicy==='single-physical-semantic-runtime-source'"
req(needle in w or repl in w,'wrapper semantic archive contract point missing')
w=w.replace(needle,repl)
wp.write_text(w)

# Jekyll assembler: only current production sources remain in app/. 
ip=ROOT/'index.html'
x=ip.read_text()
x=x.replace('{% capture v165block %}{% include_relative app/v165-block-00.txt %}{% endcapture %}','{% capture v166block %}{% include_relative app/v166-block-00.txt %}{% endcapture %}')
x=x.replace('FE QUEST PWA v165','FE QUEST PWA v166')
x=x.replace("const APP_VERSION = 'v165';","const APP_VERSION = 'v166';")
x=x.replace('runV165SelfCheck()','runV166SelfCheck()')
x=x.replace('{{ v165block }}','{{ v166block }}')
ip.write_text(x)

# Manifest + service worker versioning only; behavior remains unchanged.
mp=ROOT/'manifest.webmanifest'
m=json.loads(mp.read_text())
m['name']='FE QUEST v166'
m['description']='基本情報技術者試験向けPWA。v166ではproduction sourceの診断系アーカイブ境界を整理し、app/から48個のhistorical diagnostic/provenance sourceを_regression/archive/diagnosticsへ移動。build対象のapp/には現行semantic runtime・stable data modules・stable wrapper・v166 adapterと学習機能ブロックだけを残す。current-contract 71、科目A710問、Profile Schema v5、browser UI 23、critical curriculum 56、remaining release sentinel 28、CI coverage 84/84、legacy 293 residual 0を維持。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
sp=ROOT/'sw.js'
sw=sp.read_text().replace("const APP_VERSION = 'v165';","const APP_VERSION = 'v166';").replace("const CACHE_NAME = 'fe-quest-v165-1';","const CACHE_NAME = 'fe-quest-v166-1';")
sp.write_text(sw)

# Current app source must have no diagnostic/versioned archive residue.
residual=[]
for p in APP.iterdir():
    n=p.name
    if n in names: residual.append(n)
    if re.fullmatch(r'v(?:14[5-9]|15\d|16[0-5])-block-\d\d\.txt',n): residual.append(n)
    if re.fullmatch(r'v154-runtime-v\d+\.txt',n): residual.append(n)
    if re.fullmatch(r'runtime-.*-v\d+.*\.txt',n): residual.append(n)
req(not residual,'archival residue in app/: '+','.join(sorted(set(residual))))

fixture={
  'name':'production-source-archive-boundary-v166',
  'version':'v166',
  'archive_root':'_regression/archive/diagnostics',
  'archived_source_count':48,
  'production_app_archival_residual_count':0,
  'archive_entries':entries,
  'active_runtime':{
    'path':'app/runtime-semantic-diagnostics.txt',
    'utf8_bytes':(APP/'runtime-semantic-diagnostics.txt').stat().st_size,
    'sha256':sha_file(APP/'runtime-semantic-diagnostics.txt')
  },
  'stable_wrapper':{
    'path':'app/runtime-diagnostic-wrapper.txt',
    'utf8_bytes':wp.stat().st_size,
    'sha256':sha_file(wp)
  },
  'release_adapter':{
    'path':'app/v166-block-00.txt',
    'utf8_bytes':(APP/'v166-block-00.txt').stat().st_size,
    'sha256':sha_file(APP/'v166-block-00.txt'),
    'allowed_global':'runV166SelfCheck'
  },
  'assembler':{'path':'index.html','sha256':sha_file(ip)},
  'manifest':{'path':'manifest.webmanifest','sha256':sha_file(mp)},
  'service_worker':{'path':'sw.js','sha256':sha_file(sp)},
  'policy':'historical-diagnostics-build-excluded-regression-archive'
}
FIXTURE.write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
print('FEQUEST_V166_SOURCE_MATERIALIZED archive=48 app-residual=0 runtime-sha256='+fixture['active_runtime']['sha256'])
