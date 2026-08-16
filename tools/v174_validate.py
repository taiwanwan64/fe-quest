from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys, tempfile
from v174_runtime_stub import STUB

PARENT_MAIN='32cc7c00e607a9f274fca7b7b4f226590d8c626e'
BASE_BYTES=2991671
BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
HIST_BASE_BYTES=3041328
HIST_BASE_SHA='1222c7ac30b6a227f0b5bfd4d7b5a4c380a18d47d55171cfaaeaa3c09dbfbd5a'
LEGACY_BYTES=49657
LEGACY_SHA='b7f6a3eea1e5c609844311ba9acfe17179df19e07b9c82354ff9ee87c6922f36'
LEARNING_BYTES=405723
LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525
RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
DIAG_ARCHIVE_COUNT=56
RETIRED=[f'runV{v}SelfCheck' for v in range(160,174)]


def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d
def extract_js(h):
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
    return '\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))
def git_parent(path): return subprocess.check_output(['git','show',f'{PARENT_MAIN}:{path}'])

prod_path=Path('_site/index.html'); ref_path=Path('_site_reference/index.html')
req(prod_path.exists() and ref_path.exists(),'both real Jekyll builds required')
prod_b=prod_path.read_bytes(); ref_b=ref_path.read_bytes(); prod=prod_b.decode(); ref=ref_b.decode()
src=Path('index.html').read_text(); manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v174';" in prod and 'runV174SelfCheck();' in prod,'v174 version/boot')
req('"name": "FE QUEST v174"' in manifest,'v174 manifest')
req("const APP_VERSION = 'v174';" in sw and "fe-quest-v174-1" in sw,'v174 sw version')
req(all(x in sw for x in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]),'sw parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',prod),'legacy evaluator bundled')

# Stable learner/runtime source identities.
base=Path('app/base-stable.html'); learn=Path('app/learning-patches.txt'); rt=Path('app/runtime-semantic-diagnostics.txt')
req(len(base.read_bytes())==BASE_BYTES and sha_file(base)==BASE_SHA,'stable base identity')
req(len(learn.read_bytes())==LEARNING_BYTES and sha_file(learn)==LEARNING_SHA,'stable learning identity')
req(len(rt.read_bytes())==RUNTIME_BYTES and sha_file(rt)==RUNTIME_SHA,'stable semantic runtime identity')
req(not Path('app/base-v131.html').exists(),'historical base returned to app')
hist=Path('_regression/archive/learning-base/base-v131.html'); legacy_archive=Path('_regression/archive/learning-base/runAppSelfCheck-v131.txt')
req(hist.exists() and len(hist.read_bytes())==HIST_BASE_BYTES and sha_file(hist)==HIST_BASE_SHA,'historical base archive identity')
req(legacy_archive.exists() and len(legacy_archive.read_bytes())==LEGACY_BYTES and sha_file(legacy_archive)==LEGACY_SHA,'legacy evaluator archive identity')
req(len([p for p in Path('_regression/archive/learning-patches').iterdir() if p.is_file()])==48,'learning patch archive count')
req(len([p for p in Path('_regression/archive/learning-base').iterdir() if p.is_file()])==2,'learning base archive count')

# Release metadata extraction boundary.
wrapper=Path('app/runtime-diagnostic-wrapper.txt'); w=wrapper.read_text(); spec=Path('app/runtime-release-diagnostic-spec.txt'); sp=spec.read_text()
req("const releaseSpec=globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC;" in w,'stable wrapper release spec read')
req('releaseSpec.archiveBoundaryFixture' in w and 'releaseSpec.archivedSourceCount' in w and 'releaseSpec.retiredReleaseAdapterCount' in w,'stable wrapper dynamic release fields')
req('retiredReleaseAdapters:Object.freeze([...releaseSpec.retiredReleaseAdapters])' in w,'stable wrapper dynamic adapter list')
req('delete globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC;' in w,'release spec temporary global cleanup')
for forbidden in ["production-source-archive-boundary-v174.fixture.json","archivedSourceCount:56","'runV173SelfCheck'",'retiredAdapters.length===14','a.retiredAdapters===14']:
    req(forbidden not in w,'release-specific literal remained in stable wrapper: '+forbidden)
for token in ["releaseVersion:'v174'","currentReleaseAdapter:'runV174SelfCheck'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v174.fixture.json'",'archivedSourceCount:56','retiredReleaseAdapterCount:14']:
    req(token in sp,'release metadata token '+token)
req(all(repr(x) in sp for x in RETIRED),'retired adapter metadata list')
req(src.count('{% include_relative app/runtime-release-diagnostic-spec.txt %}')==1,'release metadata assembler include')
req(src.count('{% include_relative app/runtime-diagnostic-wrapper.txt %}')==1,'stable wrapper assembler include')
req(src.count('{% include_relative app/base-stable.html %}')==1 and src.count('{% include_relative app/learning-patches.txt %}')==1 and src.count('{% include_relative app/runtime-semantic-diagnostics.txt %}')==1,'stable source include counts')
req('{% include_relative app/v174-block-00.txt %}' in src and 'app/v173-block-00.txt' not in src,'current adapter assembler boundary')
parent_wrapper=git_parent('app/runtime-diagnostic-wrapper.txt')
req(sha_bytes(parent_wrapper)!=sha_file(wrapper),'v174 wrapper stabilization did not change wrapper')

# Diagnostic archive and adapter boundary.
diag_fx=json.loads(Path('_regression/production-source-archive-boundary-v174.fixture.json').read_text())
req(diag_fx['version']=='v174' and diag_fx['archived_source_count']==DIAG_ARCHIVE_COUNT and len(diag_fx['archive_entries'])==DIAG_ARCHIVE_COUNT,'diagnostic archive fixture')
for e in diag_fx['archive_entries']:
    req(not Path(e['old_path']).exists(),'old diagnostic source exists '+e['old_path'])
    p=Path(e['archive_path']); req(p.exists(),'diagnostic archive missing '+p.as_posix())
    req(len(p.read_bytes())==e['utf8_bytes'] and sha_file(p)==e['sha256'],'diagnostic archive identity '+p.as_posix())
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==DIAG_ARCHIVE_COUNT,'diagnostic archive physical count')
arch173=Path('_regression/archive/diagnostics/v173-block-00.txt'); active174=Path('app/v174-block-00.txt')
req(arch173.exists() and "function runV173SelfCheck()" in arch173.read_text(),'v173 adapter archive')
req(active174.exists() and "function runV174SelfCheck()" in active174.read_text() and not Path('app/v173-block-00.txt').exists(),'v174 active adapter')

# Static/browser DOM contract remains present in generated output.
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
print('FEQUEST_V174_STATIC_DOM_OK 23/23 + required-dom')

SNAPSHOT_JS=r'''
const __feqCrypto=require('crypto');
function __feqCanon(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(__feqCanon);const o={};for(const k of Object.keys(v).sort()){const x=v[k];if(typeof x==='function'||typeof x==='undefined')continue;o[k]=__feqCanon(x);}return o;}
const __feqSelfRaw=globalThis.FEQUEST_SELF_CHECK;if(!__feqSelfRaw)throw new Error('snapshot self-check missing');
const __feqSelf={...__feqSelfRaw};delete __feqSelf.checkedAt;
const __feqPayload={appVersion:APP_VERSION,questionBank:__feqCanon(QUESTION_BANK),selfCheck:__feqCanon(__feqSelf),diagnosticContractData:__feqCanon(globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA),diagnosticDataProvenance:__feqCanon(globalThis.FEQ_DIAGNOSTIC_DATA_PROVENANCE),globalSurface:Object.keys(globalThis).filter(k=>/^(?:feq|runV)/.test(k)).sort(),answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length)};
const __feqRaw=JSON.stringify(__feqCanon(__feqPayload));console.log('__FEQ_SNAPSHOT__ '+__feqCrypto.createHash('sha256').update(__feqRaw).digest('hex')+' '+Buffer.byteLength(__feqRaw,'utf8')+' '+(__feqSelfRaw.ok?'1':'0'));
'''
def snapshot(label,h):
    js=extract_js(h)
    with tempfile.TemporaryDirectory() as td:
        pth=Path(td)/(label+'.js'); pth.write_text(STUB+'\n'+js+'\n'+SNAPSHOT_JS)
        z=subprocess.run(['node','--check',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' syntax '+z.stderr[-1600:])
        z=subprocess.run(['node',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' runtime '+z.stderr[-2400:])
    m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m,label+' snapshot marker')
    if m.group(3)!='1': print(z.stdout)
    req(m.group(3)=='1',label+' self-check')
    return {'sha256':m.group(1),'utf8_bytes':int(m.group(2))}

prod_snap=snapshot('release-metadata-module-candidate',prod)
ref_snap=snapshot('old-inline-metadata-reference',ref)
req(prod_snap==ref_snap,'canonical runtime snapshot differs between metadata module and inline reference')

# Detailed candidate runtime invariants and zero temporary release-spec global leakage.
js=extract_js(prod)
retired_expr='||'.join(f"typeof {name}!=='undefined'" for name in RETIRED)
checks=f'''if(APP_VERSION!=='v174')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v174'||s.releaseAdapter!=='runV174SelfCheck')throw Error('self '+JSON.stringify(s?.errors));if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==14||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof FEQ_RELEASE_DIAGNOSTIC_SPEC!=='undefined')throw Error('release metadata global leaked');if(typeof runV174SelfCheck!=='function'||{retired_expr})throw Error('adapters');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/production-source-archive-boundary-v174.fixture.json'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveRoot!=='_regression/archive/diagnostics'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==56)throw Error('archive');console.log('FEQUEST_V174_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=14 adapter=1 data=6 backing=0 diagnostic-archive=56 learning-archive=48 base-archive=2 active-learning=1 active-base=1 release-metadata=1 critical-map=56 release-map=28 ci=84 legacy-bundled=0');'''
Path('/tmp/v174-run.js').write_text(STUB+'\n'+js+'\n'+checks)
z=subprocess.run(['node','/tmp/v174-run.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'production runtime')

# Release-only legacy fixture remains exact and independent of production wrapper layout.
legacy_fx=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
legacy_text=legacy_archive.read_text()
req(sha_text(legacy_text)==legacy_fx['range_sha256'] and len(legacy_text.encode())==legacy_fx['range_utf8_bytes'] and len(re.findall(r'\bassert\s*\(',legacy_text))==legacy_fx['assert_calls'],'legacy fixture identity')
diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in diag['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+pth.as_posix())
    blocks.append(pth.read_text())
dsources=''.join(blocks); tmpl=legacy_fx['release_shell_template']; adapted=legacy_text.replace(legacy_fx['release_shell_from'],tmpl.replace('{{VERSION}}','v174'))
rel=r'''const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V174_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');'''
Path('/tmp/v174-release.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel)
z=subprocess.run(['node','/tmp/v174-release.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'release fixture runtime')

# Real Jekyll build comparison: source bytes intentionally differ, semantic snapshot must not.
for name in ['manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']:
    req((Path('_site')/name).read_bytes()==(Path('_site_reference')/name).read_bytes(),'reference app-shell difference '+name)
req(not Path('_site/_regression').exists() and not Path('_site_reference/_regression').exists(),'regression archive deployed')
req(prod_b!=ref_b,'candidate/reference index unexpectedly byte-identical; reference should retain old inline wrapper source')

# Finalize evidence fixture and audit.
fxp=Path('_regression/stable-release-diagnostic-metadata-v174.fixture.json'); fx=json.loads(fxp.read_text())
fx['validation']={
  'status':'passed',
  'reference_mode':'v174-old-inline-metadata-wrapper-derived-from-v173-parent',
  'candidate_generated_index':{'utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},
  'reference_generated_index':{'utf8_bytes':len(ref_b),'sha256':sha_bytes(ref_b)},
  'generated_index_byte_exact':False,
  'canonical_runtime_candidate':prod_snap,
  'canonical_runtime_reference':ref_snap,
  'canonical_runtime_equal':prod_snap==ref_snap,
  'canonical_runtime_excluded_fields':['FEQUEST_SELF_CHECK.checkedAt'],
  'stable_wrapper_release_specific_literals_absent':True,
  'temporary_release_metadata_global_leaked':False,
  'current_contract':'71/71','browser_ui':'23/23 + required DOM','critical_curriculum':'56/56','release_sentinel':'28/28','ci_coverage':'84/84','legacy_fixture':'293 assertions / raw 22 / residual 0'
}
fx['stable_wrapper']=ident(wrapper,release_specific_literals_absent=True)
fx['release_metadata_module']=ident(spec,release_version='v174',current_adapter='runV174SelfCheck',retired_adapter_count=14,diagnostic_archive_count=56)
fxp.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v174 — Release Diagnostic Metadata Boundary Audit
==========================================================

Scope
-----
v174 performs a one-time stabilization of app/runtime-diagnostic-wrapper.txt. Release-varying diagnostic metadata is moved to app/runtime-release-diagnostic-spec.txt. The wrapper now reads that small module, copies the required values into the existing FEQ_DIAGNOSTIC_RUNTIME_SPEC contract, validates release coherence, and deletes the temporary metadata global after initialization.

Stable wrapper
--------------
Path: app/runtime-diagnostic-wrapper.txt
UTF-8 bytes: {len(wrapper.read_bytes()):,}
SHA-256: {sha_file(wrapper)}
Parent v173 wrapper UTF-8 bytes: {len(parent_wrapper):,}
Parent v173 wrapper SHA-256: {sha_bytes(parent_wrapper)}
Release-specific v174 fixture/count/adapter literals remaining in stable wrapper: 0

Release metadata module
-----------------------
Path: app/runtime-release-diagnostic-spec.txt
UTF-8 bytes: {len(spec.read_bytes()):,}
SHA-256: {sha_file(spec)}
Release: v174
Current adapter: runV174SelfCheck
Retired adapter inventory: 14 (runV160SelfCheck through runV173SelfCheck)
Diagnostic/provenance archive count: 56
Archive fixture: _regression/production-source-archive-boundary-v174.fixture.json
Temporary metadata global after wrapper initialization: absent

Counterfactual reference proof
------------------------------
Reference mode: old v173 inline-metadata wrapper advanced directly to v174
Candidate generated index.html bytes: {len(prod_b):,}
Candidate SHA-256: {sha_bytes(prod_b)}
Reference generated index.html bytes: {len(ref_b):,}
Reference SHA-256: {sha_bytes(ref_b)}
Generated HTML byte equality: false (expected because JavaScript source layout changed)
Canonical runtime candidate: {prod_snap['sha256']} / {prod_snap['utf8_bytes']:,} bytes
Canonical runtime reference: {ref_snap['sha256']} / {ref_snap['utf8_bytes']:,} bytes
Canonical runtime equality: true
Only excluded volatile field: FEQUEST_SELF_CHECK.checkedAt

Stable learner/runtime boundaries
---------------------------------
Stable base: {BASE_BYTES:,} bytes / {BASE_SHA}
Stable learning module: {LEARNING_BYTES:,} bytes / {LEARNING_SHA}
Stable semantic runtime: {RUNTIME_BYTES:,} bytes / {RUNTIME_SHA}
Learning-patch provenance archive count: 48
Learning-base archive count: 2

Release invariants
------------------
QUESTION_BANK: 710 / 710 unique IDs
Answers: A178 / B178 / C177 / D177
Cognitive: 想起166 / 適用323 / 判断221
Profile Schema: v5
Current contract: 71/71
Browser UI: 23/23 + required DOM
Critical curriculum: 56/56
Release sentinel: 28/28
CI coverage: 84/84
Legacy fixture: 293 assertions / raw errors 22 / residual 0
Production legacy evaluator: absent

Policy
------
Future releases should update the small release metadata module and thin current adapter, while keeping app/runtime-diagnostic-wrapper.txt byte-stable unless its release-independent behavior genuinely changes. No learner-facing content or behavior removal is authorized by v174.
'''
Path('audits/RELEASE_DIAGNOSTIC_METADATA_BOUNDARY_AUDIT_v174.txt').write_text(audit)

print('FEQUEST_V174_METADATA_BOUNDARY_OK runtime-snapshot=1 wrapper-stable=1 release-metadata=1 metadata-global-leak=0 retired-adapter-inventory=14 diagnostic-archive=56 snapshot='+prod_snap['sha256'])
print('FEQUEST_V174_ARCHIVE_BOUNDARY_OK diagnostic-archive=56 learning-archive=48 base-archive=2 deployed-regression=0 runtime=55525')
print('FEQUEST_V174_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=14 adapter=1 data=6 backing=0 diagnostic-archive=56 learning-archive=48 base-archive=2 active-learning=1 active-base=1 release-metadata=1 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
