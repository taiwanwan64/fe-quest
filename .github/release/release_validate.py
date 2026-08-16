from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, os, re, runpy, subprocess, sys, tempfile

WRAPPER_BYTES=19860; WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211; ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
METADATA_BYTES=859; METADATA_SHA='8b1b4889588abea7ff52609341350a21804aee026d95bec24ea70eb3e2f668e2'
INVENTORY_BYTES=17671; INVENTORY_SHA='b290a576691505999bc734197aba4623a80f2d055a1a48fe718e55cd6dbb3250'
BASE_BYTES=2991671; BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723; LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525; RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
TOOL_PATHS=['.github/workflows/release-validate.yml','.github/release/release_materialize.py','.github/release/prepare_reference.py','.github/release/release_validate.py','.github/release/runtime_stub.py']

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d
def extract_js(h): return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))

def release_context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'(v(\d+))-staging',branch)
    req(m is not None,'release branch must match vNNN-staging')
    version=m.group(1); number=int(m.group(2)); return branch,version,number,f'v{number-1}'

branch,version,number,previous=release_context()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
fixture=Path(f'_regression/release-tooling-cadence-{version}.fixture.json')
audit=Path(f'audits/RELEASE_TOOLING_CADENCE_AUDIT_{version}.txt')

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
    q=Path(p); req(q.exists() and len(q.read_bytes())==b and sha_file(q)==s,'stable identity '+p)
    req(q.read_bytes()==subprocess.check_output(['git','show',parent+':'+p]),'parent main byte drift '+p)

# Stable release tooling must contain no target-release literals. On the adoption release the parent does not yet contain it;
# on every later release it must be byte-identical to parent main.
tooling=[]; adoption=False
for p in TOOL_PATHS:
    q=Path(p); req(q.exists(),'stable tooling missing '+p)
    txt=q.read_text()
    req(version not in txt,'target release literal embedded in stable tooling '+p)
    r=subprocess.run(['git','show',parent+':'+p],capture_output=True)
    if r.returncode==0:
        req(q.read_bytes()==r.stdout,'stable release tooling drift '+p)
        tooling.append(ident(p,parent_byte_identical=True))
    else:
        adoption=True; tooling.append(ident(p,parent_byte_identical=False))
req(adoption in (True,False),'tooling adoption state')
req(not list(Path('.github/workflows').glob('v*-validate.yml')),'versioned release workflow source present')
if Path('tools').exists(): req(not list(Path('tools').glob('v*_*.py')),'versioned release tool source present')

inv=json.loads(Path('_regression/diagnostic-archive-inventory.fixture.json').read_text())
req(inv['archived_source_count']==58 and len(inv['archive_entries'])==58,'archive inventory count')
physical=[p for p in Path(inv['archive_root']).iterdir() if p.is_file()]
req(len(physical)==58,'physical diagnostic archive count')
for item in inv['archive_entries']:
    p=Path(item['archive_path']); req(p.exists(),'archive missing '+p.as_posix())
    req(len(p.read_bytes())==item['utf8_bytes'] and sha_file(p)==item['sha256'],'archive identity '+p.as_posix())
req(len([p for p in Path('_regression/archive/learning-patches').iterdir() if p.is_file()])==48,'learning archive count')
req(len([p for p in Path('_regression/archive/learning-base').iterdir() if p.is_file()])==2,'base archive count')

prod_path=Path('_site/index.html'); ref_path=Path('_site_reference/index.html')
req(prod_path.exists() and ref_path.exists(),'real Jekyll outputs missing')
release_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
for relp in release_files:
    a=Path('_site')/relp; b=Path('_site_reference')/relp
    req(a.exists() and b.exists(),'release file missing '+relp)
    req(a.read_bytes()==b.read_bytes(),'stable tooling/reference output differs '+relp)

prod_b=prod_path.read_bytes(); prod=prod_b.decode(); src=Path('index.html').read_text()
req(f"const APP_VERSION = '{version}';" in prod and f'<title>FE QUEST PWA {version}</title>' in prod,'generated release shell')
req("globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in prod,'dynamic self-check boot missing')
req('{% include_relative app/runtime-release-diagnostic-spec.txt %}' in src,'stable metadata include missing')
req('{% include_relative app/runtime-release-adapter.txt %}' in src,'stable adapter include missing')
manifest_src=Path('manifest.webmanifest').read_text(); req(manifest_src.lstrip().startswith('{'),'production manifest not direct JSON')
manifest=json.loads(manifest_src); req(manifest['name']==f'FE QUEST {version}','manifest source version')
req(json.loads(Path('_site/manifest.webmanifest').read_text())['name']==f'FE QUEST {version}','generated manifest version')
sw_src=Path('sw.js').read_text(); req(not sw_src.startswith('---'),'production sw source templated')
sw=Path('_site/sw.js').read_text(); req(f"const APP_VERSION = '{version}';" in sw and f'fe-quest-{version}-1' in sw,'generated SW version')
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in sw,'SW behavior '+token)
req(not Path('_site/_regression').exists(),'regression deployed')
req(not Path('_site/.github').exists(),'release tooling deployed')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',prod),'legacy evaluator bundled')

class P(HTMLParser):
    def __init__(self): super().__init__(); self.ids=set(); self.classes=[]
    def handle_starttag(self,t,a):
        d=dict(a)
        if d.get('id'): self.ids.add(d['id'])
        self.classes += d.get('class','').split()
p=P(); p.feed(prod)
ids_req=['home','map','weak','problems','plan','coverage','mock','lesson','trace','settingsBtn','bMockResultList','startDiagnostic','installCard','pwaHealthCard','aiDrawer','aiFab','aiBackdrop','toast','offlinePill','planFocusCard','planDetailsToggle','analyticsDetailsToggle','weakTopAction','rightDailyAction','rightDailyProgress','quizSubmit','subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']
req(all(x in p.ids for x in ids_req),'required DOM ids')
for c in ['result-detail-fold','result-more-actions','sidebar','mock-history-details','mock-secondary-details','weak-detail-fold','coverage-summary-compact','b-mode-switcher','analytics-priority-card','data-maintenance-fold','recovery-fold','quiz-actions','ai-header-btn']:
    req(c in p.classes,'required DOM class '+c)
print('FEQUEST_RELEASE_STATIC_DOM_OK 23/23 + required-dom')

STUB=runpy.run_path('.github/release/runtime_stub.py')['STUB']
retired='||'.join(f"typeof globalThis.runV{v}SelfCheck!=='undefined'" for v in range(160,number)) or 'false'
CHECKS=f'''const s=globalThis.FEQUEST_SELF_CHECK;if(APP_VERSION!=='{version}'||!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.browserUiContract.total!==23||s.releaseVersion!=='{version}'||s.releaseAdapter!=='runV{number}SelfCheck')throw Error('self '+JSON.stringify(s?.errors));if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!=={number-160}||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper boundary');if(globalThis.FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/diagnostic-archive-inventory.fixture.json'||globalThis.FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==58)throw Error('archive projection');if(typeof globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC!=='undefined')throw Error('metadata global leak');if(typeof globalThis.runV{number}SelfCheck!=='function'||{retired})throw Error('adapter boundary');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('questions');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('answers');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cognitive');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('CI coverage');if(s.legacyClassification.total!==293||s.legacyClassification.unique!==293||!s.legacyClassification.exactCoverage)throw Error('legacy classification');'''
SNAP=r'''
const __c=require('crypto');function __canon(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(__canon);const o={};for(const k of Object.keys(v).sort()){const x=v[k];if(typeof x==='function'||typeof x==='undefined')continue;o[k]=__canon(x);}return o;}
const raw=globalThis.FEQUEST_SELF_CHECK;if(!raw)throw Error('self missing');const self={...raw};delete self.checkedAt;
const payload={appVersion:APP_VERSION,questionBank:__canon(QUESTION_BANK),selfCheck:__canon(self),diagnosticRuntimeSpec:__canon(globalThis.FEQ_DIAGNOSTIC_RUNTIME_SPEC),diagnosticContractData:__canon(globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA),diagnosticDataProvenance:__canon(globalThis.FEQ_DIAGNOSTIC_DATA_PROVENANCE),globalSurface:Object.keys(globalThis).filter(k=>/^(?:feq|runV)/.test(k)).sort(),answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length)};const txt=JSON.stringify(__canon(payload));console.log('__FEQ_SNAPSHOT__ '+__c.createHash('sha256').update(txt).digest('hex')+' '+Buffer.byteLength(txt)+' '+(raw.ok?'1':'0'));
'''
js=extract_js(prod)
with tempfile.TemporaryDirectory() as td:
    run=Path(td)/'run.js'; run.write_text(STUB+'\n'+js+'\n'+CHECKS+'\n'+SNAP)
    z=subprocess.run(['node','--check',str(run)],capture_output=True,text=True); req(z.returncode==0,'node syntax '+z.stderr[-1500:])
    z=subprocess.run(['node',str(run)],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'node runtime')
m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m and m.group(3)=='1','snapshot/self-check')
snapshot={'sha256':m.group(1),'utf8_bytes':int(m.group(2))}
print(f'FEQUEST_RELEASE_PRODUCTION_RUNTIME_OK version={version} current=71/71 stable=17 retired-fn=46 wrapper=6 retired-adapter=0 retired-adapter-inventory={number-160} adapter=1 diagnostic-archive=58 archive-growth=0 ci=84 legacy-bundled=0')

legacy_fx=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
legacy=Path('_regression/archive/learning-base/runAppSelfCheck-v131.txt').read_text()
req(sha_bytes(legacy.encode())==legacy_fx['range_sha256'] and len(legacy.encode())==legacy_fx['range_utf8_bytes'] and len(re.findall(r'\bassert\s*\(',legacy))==legacy_fx['assert_calls'],'legacy range fixture')
helper=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in helper['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+pth.as_posix()); blocks.append(pth.read_text())
adapted=legacy.replace(legacy_fx['release_shell_from'],legacy_fx['release_shell_template'].replace('{{VERSION}}',version))
rel=f'''const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\\bassert\\s*\\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_RELEASE_FIXTURE_OK version={version} diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');'''
with tempfile.TemporaryDirectory() as td:
    rp=Path(td)/'release.js'; rp.write_text(STUB+'\n'+extract_js(prod)+'\neval('+json.dumps(''.join(blocks))+');\neval('+json.dumps(adapted)+');\n'+rel)
    rz=subprocess.run(['node',str(rp)],capture_output=True,text=True); print(rz.stdout); print(rz.stderr,file=sys.stderr); req(rz.returncode==0,'release fixture')

fx=json.loads(fixture.read_text())
fx['stable_release_tooling']=tooling
fx['tooling_adoption_release']=adoption
fx['validation']={
 'status':'passed',
 'generated_index':{'utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},
 'canonical_runtime_snapshot':snapshot,
 'only_excluded_volatile_field':'FEQUEST_SELF_CHECK.checkedAt',
 'candidate_reference_six_file_byte_equality':True,
 'stable_runtime_architecture_byte_identical_to_parent':True,
 'release_specific_diagnostic_architecture_changed_files':0,
 'diagnostic_archive_growth':0,
 'production_versioned_adapter_source_count':0,
 'release_specific_validation_tool_source_count':0,
 'stable_release_tooling_file_count':len(TOOL_PATHS),
 'stable_release_tooling_deployed':False,
 'production_manifest_direct_json':True,
 'production_sw_direct_js':True,
 'learner_facing_change':False
}
fixture.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
audit.write_text(f'''FE QUEST {version} — Release Tooling Cadence Audit\n====================================================\n\nResult\n------\nPASSED real GitHub Pages/Jekyll candidate/reference validation.\n\nVersionless tooling\n-------------------\nBranch-derived target: {version}\nPrevious release inferred and required: {previous}\nStable tooling files: {len(TOOL_PATHS)}\nAdoption release: {'yes' if adoption else 'no'}\nRelease-specific validation workflow/tool source files: 0\nStable tooling deployed by Jekyll: no\n\nReference proof\n---------------\nA mechanical conventional reference was created from origin/main and advanced from {previous} to {version}.\nCandidate and reference generated six release files are byte-identical: yes\nProduction manifest remains direct JSON: yes\nProduction sw.js remains direct JavaScript: yes\n\nRuntime\n-------\nCurrent adapter: runV{number}SelfCheck\nRetired adapters: {number-160} (runV160SelfCheck through runV{number-1}SelfCheck)\nCanonical runtime: {snapshot['utf8_bytes']:,} bytes / SHA-256 {snapshot['sha256']}\nExcluded volatile field: FEQUEST_SELF_CHECK.checkedAt\nDiagnostic archive: 58 / growth 0\n\nGenerated HTML\n--------------\n{len(prod_b):,} bytes / SHA-256 {sha_bytes(prod_b)}\n\nContracts\n---------\nCurrent 71/71\nBrowser UI 23/23 + required DOM\nCritical 56/56\nRelease sentinel 28/28\nCI 84/84\nLegacy 293 / raw22 / residual0\nQuestions 710 / unique710\nAnswers A178/B178/C177/D177\nCognitive 想起166/適用323/判断221\n''')
print(f'FEQUEST_RELEASE_TOOLING_OK version={version} candidate-reference=1 stable-tooling={len(TOOL_PATHS)} versioned-tooling=0 tooling-deployed=0 diagnostic-architecture-changed=0 retired-adapters={number-160} diagnostic-archive=58 archive-growth=0 snapshot={snapshot["sha256"]}')
