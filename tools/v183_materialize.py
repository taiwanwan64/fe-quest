from pathlib import Path
import hashlib, json, re, subprocess

PARENT='91b445285be486a320d925ddbcf8b4f238c56766'
V182_VALIDATION_SOURCE='79a440271c76a55f1730f51d8967b31e80c71c21'
V180_VALIDATION_SOURCE='badb3bfa0304b2a0d8cd20c04f1fe6e1e0090bca'
WRAPPER_BYTES=19860; WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211; ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
METADATA_BYTES=859; METADATA_SHA='8b1b4889588abea7ff52609341350a21804aee026d95bec24ea70eb3e2f668e2'
INVENTORY_BYTES=17671; INVENTORY_SHA='b290a576691505999bc734197aba4623a80f2d055a1a48fe718e55cd6dbb3250'
BASE_BYTES=2991671; BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723; LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525; RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
FIXTURE='_regression/outer-version-shell-feasibility-v183.fixture.json'
AUDIT='audits/OUTER_VERSION_SHELL_FEASIBILITY_AUDIT_v183.txt'
FORBIDDEN='_regression/production-source-archive-boundary-v183.fixture.json'

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
    req(q.read_bytes()==subprocess.check_output(['git','show',PARENT+':'+p]),'v182 parent byte drift '+p)

spec=Path('app/runtime-release-diagnostic-spec.txt').read_text()
req('const releaseVersion=APP_VERSION;' in spec,'metadata not APP_VERSION-driven')
req(not re.search(r"['\"]v\d+['\"]",spec),'release literal embedded in stable metadata')
req(not re.search(r"['\"]runV\d+SelfCheck['\"]",spec),'adapter literal embedded in stable metadata')
req(not Path(FORBIDDEN).exists(),'v183 release-specific archive boundary forbidden')
req(not [p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)],'versioned adapter source residual')

inv=json.loads(Path('_regression/diagnostic-archive-inventory.fixture.json').read_text())
req(inv['archived_source_count']==58 and len(inv['archive_entries'])==58,'archive inventory count')
req(len([p for p in Path(inv['archive_root']).iterdir() if p.is_file()])==58,'physical diagnostic archive count')

# Keep the current low-complexity outer shell: three explicit release files.
idx=Path('index.html'); t=idx.read_text()
req('<title>FE QUEST PWA v182</title>' in t and "const APP_VERSION = 'v182';" in t,'v182 parent index shell missing')
t=t.replace('<title>FE QUEST PWA v182</title>','<title>FE QUEST PWA v183</title>',1)
t=t.replace("const APP_VERSION = 'v182';","const APP_VERSION = 'v183';",1)
idx.write_text(t)
t=idx.read_text()
req('<title>FE QUEST PWA v183</title>' in t and "const APP_VERSION = 'v183';" in t,'v183 index shell')
req('{% include_relative app/runtime-release-diagnostic-spec.txt %}' in t,'stable metadata include missing')
req('{% include_relative app/runtime-release-adapter.txt %}' in t,'stable adapter include missing')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in t,'dynamic self-check boot drift')

mp=Path('manifest.webmanifest'); m=json.loads(mp.read_text())
m['name']='FE QUEST v183'
m['description']='基本情報技術者試験向けPWA。v183ではouter version shellのsingle source化を検証し、service workerとmanifestをJekyllテンプレート化する追加依存より、現行の単純な明示更新方式のrelease reliabilityを優先する。diagnostic architecture 4モジュールbyte-stable・科目A710問・current contract 71・browser UI 23・CI 84/84・legacy 293 residual 0を維持する。'
mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
req(mp.read_text().lstrip().startswith('{'),'manifest source must remain directly valid JSON')

sw=Path('sw.js'); w=sw.read_text()
req(not w.startswith('---'),'service worker parent unexpectedly templated')
w=w.replace("const APP_VERSION = 'v182';","const APP_VERSION = 'v183';",1)
w=w.replace("const CACHE_NAME = 'fe-quest-v182-1';","const CACHE_NAME = 'fe-quest-v183-1';",1)
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in w,'SW behavior '+token)
req("const APP_VERSION = 'v183';" in w and 'fe-quest-v183-1' in w,'SW v183')
sw.write_text(w)
req(not sw.read_text().startswith('---'),'service worker source must remain directly executable JS')

fx={
 'name':'outer-version-shell-feasibility-v183','version':'v183',
 'scope':'compare-single-source-jekyll-template-candidate-with-conventional-three-file-version-shell-and-retain-lower-complexity-source',
 'parent_release':{'version':'v182','main_sha':PARENT},
 'stable_modules':[
   ident('app/runtime-diagnostic-wrapper.txt',parent_byte_identical=True),
   ident('app/runtime-release-adapter.txt',parent_byte_identical=True),
   ident('app/runtime-release-diagnostic-spec.txt',parent_byte_identical=True,version_source='APP_VERSION'),
   ident('_regression/diagnostic-archive-inventory.fixture.json',parent_byte_identical=True,archive_entry_count=58),
 ],
 'release_specific_diagnostic_architecture_changed_files':0,
 'expected_runtime':{'releaseVersion':'v183','currentReleaseAdapter':'runV183SelfCheck','retiredReleaseAdapterCount':23,'retiredReleaseAdapterRange':'runV160SelfCheck..runV182SelfCheck'},
 'diagnostic_archive':{'previous_count':58,'current_count':58,'growth':0},
 'release_specific_archive_boundary':{'path':FORBIDDEN,'exists':False},
 'production_versioned_adapter_source_count':0,
 'outer_shell':{
   'conventional_release_files':['index.html','manifest.webmanifest','sw.js'],
   'candidate_version_source':'_data/release.yml',
   'candidate_requires_jekyll_front_matter':['manifest.webmanifest','sw.js'],
   'candidate_standalone_source_manifest_valid_json':False,
   'candidate_standalone_source_sw_directly_executable':False,
   'adopted':False,
   'decision':'retain-conventional-explicit-three-file-shell-to-preserve-static-source-portability-and-minimize-build-coupling'
 },
 'stable_base':ident('app/base-stable.html'),
 'stable_learning_module':ident('app/learning-patches.txt'),
 'stable_semantic_runtime':ident('app/runtime-semantic-diagnostics.txt'),
 'validation':{'status':'pending','candidate_generated_output_equivalence':'pending'}
}
Path(FIXTURE).write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
Path(AUDIT).write_text(f'''FE QUEST v183 — Outer Version Shell Feasibility Audit\n=======================================================\n\nDecision before authoritative build\n-----------------------------------\nRetain the conventional explicit three-file outer version shell unless the candidate provides a material reliability benefit.\n\nWhy the single-source candidate is not preferred\n------------------------------------------------\nTo share one version source across index.html, manifest.webmanifest and sw.js with current GitHub Pages/Jekyll, manifest and service worker source files must become Liquid/Jekyll templates (front matter), or an additional runtime/build file must be introduced. The former makes source manifest invalid JSON and source sw.js non-executable before Jekyll processing; the latter adds a package/build dependency. This is more coupling for only three explicit release files.\n\nPinned architecture\n-------------------\nWrapper: {WRAPPER_BYTES:,} / {WRAPPER_SHA}\nRelease adapter: {ADAPTER_BYTES} / {ADAPTER_SHA}\nRelease metadata: {METADATA_BYTES} / {METADATA_SHA}\nArchive inventory: {INVENTORY_BYTES:,} / {INVENTORY_SHA}\nRelease-specific diagnostic architecture changed files: 0\n\nExpected runtime\n----------------\nAPP_VERSION / releaseVersion: v183\nCurrent adapter: runV183SelfCheck\nRetired adapters: 23 (runV160SelfCheck through runV182SelfCheck)\nDiagnostic archive: 58 / growth 0\n\nValidation status\n-----------------\npending conventional/candidate real Jekyll equivalence and runtime validation\n''')

# Reuse the proven v180 runtime stub.
stub=subprocess.check_output(['git','show',V180_VALIDATION_SOURCE+':tools/v180_runtime_stub.py']).decode()
Path('tools/v183_runtime_stub.py').write_text(stub)

# Generate v183 runtime validator from the proven v182 validator, then add candidate-output proof.
v=subprocess.check_output(['git','show',V182_VALIDATION_SOURCE+':tools/v182_validate_generated.py']).decode()
v=v.replace('from v182_runtime_stub import STUB','from v183_runtime_stub import STUB')
v=v.replace("PARENT='846f91009dc61fdc86a1547577ead2e8daced355'",f"PARENT='{PARENT}'")
v=v.replace('v182','v183').replace('V182','V183')
v=v.replace('v181 parent byte drift','v182 parent byte drift')
v=v.replace('range(160,182)','range(160,183)')
v=v.replace('retiredAdapters!==22','retiredAdapters!==23')
v=v.replace('retired-adapter-inventory=22','retired-adapter-inventory=23')
v=v.replace('Retired adapters: 22','Retired adapters: 23')
v=v.replace('retired-adapters=22','retired-adapters=23')
v=v.replace("FIXTURE=Path('_regression/steady-state-diagnostic-architecture-v183.fixture.json')",f"FIXTURE=Path('{FIXTURE}')")
v=v.replace("AUDIT=Path('audits/STEADY_STATE_DIAGNOSTIC_ARCHITECTURE_AUDIT_v183.txt')",f"AUDIT=Path('{AUDIT}')")
anchor="req(not Path('_site/_regression').exists(),'regression deployed')"
extra=anchor+"\n\n# Single-source candidate must generate exactly the same six deployable files.\ncand_root=Path('_site_candidate'); req(cand_root.exists(),'candidate Jekyll output missing')\nrelease_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']\nfor relp in release_files:\n    a=Path('_site')/relp; b=cand_root/relp\n    req(a.read_bytes()==b.read_bytes(),'candidate output differs '+relp)\ncandidate_source_sw=Path('_candidate/sw.js').read_text(); candidate_source_manifest=Path('_candidate/manifest.webmanifest').read_text()\nreq(candidate_source_sw.startswith('---'),'candidate sw must require Jekyll front matter')\nreq(candidate_source_manifest.startswith('---'),'candidate manifest must require Jekyll front matter')\nreq(not Path('sw.js').read_text().startswith('---'),'production sw must remain direct static JS')\nreq(Path('manifest.webmanifest').read_text().lstrip().startswith('{'),'production manifest must remain direct JSON')"
req(anchor in v,'validator insertion anchor missing')
v=v.replace(anchor,extra,1)
fxanchor="fx=json.loads(FIXTURE.read_text())"
fxextra=fxanchor+"\nfx['outer_shell']['candidate_generated_output_equivalent']=True\nfx['outer_shell']['candidate_release_file_count']=6\nfx['outer_shell']['production_manifest_direct_json']=True\nfx['outer_shell']['production_sw_direct_js']=True"
req(fxanchor in v,'fixture anchor missing')
v=v.replace(fxanchor,fxextra,1)
# Append the feasibility decision after the proven v183 runtime markers/audit update.
v += "\nAUDIT.write_text(AUDIT.read_text()+'''\\nOuter shell feasibility\\n-----------------------\\nSingle-source Jekyll candidate generated all six release files byte-identically to the conventional v183 source: yes\\nCandidate source manifest requires Jekyll front matter: yes\\nCandidate source service worker requires Jekyll front matter: yes\\nProduction source manifest remains directly valid JSON: yes\\nProduction source service worker remains directly executable JS: yes\\nDecision: candidate not adopted; preserve conventional explicit three-file release shell.\\n''')\nprint('FEQUEST_V183_OUTER_SHELL_FEASIBILITY_OK candidate-output-equivalent=1 candidate-frontmatter-manifest=1 candidate-frontmatter-sw=1 adopted=0 conventional-release-files=3 diagnostic-architecture-changed=0')\n"
Path('tools/v183_validate_generated.py').write_text(v)

print('FEQUEST_V183_SOURCE_MATERIALIZED wrapper-byte-stable=1 adapter-byte-stable=1 metadata-byte-stable=1 inventory-byte-stable=1 diagnostic-architecture-changed=0 retired-adapters=23 diagnostic-archive=58 archive-growth=0 outer-shell=conventional-three-file')
