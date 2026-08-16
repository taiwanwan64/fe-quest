from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys, tempfile
from v171_runtime_stub import STUB

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

bundle_hash='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
runtime_hash='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
base_hash='1222c7ac30b6a227f0b5bfd4d7b5a4c380a18d47d55171cfaaeaa3c09dbfbd5a'

prod_path=Path('_site/index.html'); ref_path=Path('_site_reference/index.html')
req(prod_path.exists() and ref_path.exists(),'both Jekyll builds required')
prod_b=prod_path.read_bytes(); ref_b=ref_path.read_bytes()
req(prod_b==ref_b,'stable and v170-versioned learning boundary Jekyll output differ')
prod=prod_b.decode(); ref=ref_b.decode()
src=Path('index.html').read_text()
manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v171';" in prod and 'runV171SelfCheck();' in prod,'version/boot')
req('"name": "FE QUEST v171"' in manifest,'manifest')
req("const APP_VERSION = 'v171';" in sw and "fe-quest-v171-1" in sw,'sw-version')
req(all(x in sw for x in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]),'sw parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',prod),'legacy evaluator bundled')

patch=json.loads(Path('_regression/production-patch-chain-v167.fixture.json').read_text())
order=patch['assembler']['assembly_order']
req(len(order)==47,'patch inventory')
learn_fx_path=Path('_regression/production-learning-source-boundary-v171.fixture.json')
learn_fx=json.loads(learn_fx_path.read_text())
req(learn_fx['version']=='v171' and learn_fx['archived_source_count']==48,'learning boundary fixture')
stable=Path('app/learning-patches.txt')
req(stable.exists() and len(stable.read_bytes())==405723 and sha_file(stable)==bundle_hash,'stable learning identity')
req(src.count('{% include_relative app/learning-patches.txt %}')==1,'stable learning include count')
req('learning-patches-v170.txt' not in src,'versioned bundle referenced by production')
req(not re.search(r'\{%\s*include_relative\s+app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt\s*%\}',src),'fragment include remains')

arch_root=Path('_regression/archive/learning-patches')
req(arch_root.exists(),'learning archive root')
arch_files=[p for p in arch_root.iterdir() if p.is_file()]
req(len(arch_files)==48,'learning archive physical count')
concat=b''
for r in patch['blocks']:
    old=Path(r['path'])
    req(not old.exists(),'fragment still active '+r['path'])
    p=arch_root/old.name
    req(p.exists(),'archived fragment missing '+p.as_posix())
    req(len(p.read_bytes())==r['utf8_bytes'] and sha_file(p)==r['sha256'],'archived fragment identity '+p.as_posix())
    concat+=p.read_bytes()
req(len(concat)==405723 and sha_bytes(concat)==bundle_hash and concat==stable.read_bytes(),'archived reconstruction')
arch_bundle=arch_root/'learning-patches-v170.txt'
req(arch_bundle.exists() and arch_bundle.read_bytes()==stable.read_bytes(),'archived v170 bundle parity')
req(not Path('app/learning-patches-v170.txt').exists(),'versioned bundle active residual')
req(learn_fx['reconstruction']['stable_module_equals_fragment_concat'] and learn_fx['reconstruction']['archived_v170_bundle_equals_stable_module'],'fixture reconstruction flags')

diag_fx_path=Path('_regression/production-source-archive-boundary-v171.fixture.json')
diag_fx=json.loads(diag_fx_path.read_text())
req(diag_fx['version']=='v171' and diag_fx['archived_source_count']==53 and len(diag_fx['archive_entries'])==53,'diagnostic archive count')
for e in diag_fx['archive_entries']:
    req(not Path(e['old_path']).exists(),'old diagnostic source exists '+e['old_path'])
    p=Path(e['archive_path']); req(p.exists(),'diagnostic archive missing '+p.as_posix())
    req(len(p.read_bytes())==e['utf8_bytes'] and sha_file(p)==e['sha256'],'diagnostic archive identity '+p.as_posix())
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==53,'diagnostic archive physical count')
req(not Path('_site/_regression').exists() and not Path('_site_reference/_regression').exists(),'regression archive deployed')

req(Path('app/v171-block-00.txt').exists() and not Path('app/v170-block-00.txt').exists(),'adapter source boundary')
req('{% include_relative app/v171-block-00.txt %}' in src and 'app/v170-block-00.txt' not in src,'assembler adapter')
rt=Path('app/runtime-semantic-diagnostics.txt')
req(len(rt.read_bytes())==55525 and sha_file(rt)==runtime_hash,'runtime identity')
req(len(Path('app/base-v131.html').read_bytes())==3041328 and sha_file('app/base-v131.html')==base_hash,'base identity')
w=Path('app/runtime-diagnostic-wrapper.txt').read_text()
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v171.fixture.json'" in w and 'archivedSourceCount:53' in w,'wrapper archive metadata')
req("'runV170SelfCheck'" in w and 'retiredAdapters.length===11' in w and 'a.retiredAdapters===11' in w,'retired adapter inventory')

protected=subprocess.check_output(['git','diff','--name-only','origin/main','--','app/base-v131.html','app/runtime-semantic-diagnostics.txt'],text=True).splitlines()
req(not protected,'protected stable source changed: '+','.join(protected))

class P(HTMLParser):
    def __init__(self): super().__init__(); self.ids=set(); self.classes=[]
    def handle_starttag(self,t,a):
        d=dict(a)
        if d.get('id'): self.ids.add(d['id'])
        self.classes += d.get('class','').split()
p=P(); p.feed(prod)
ids_req=['home','map','weak','problems','plan','coverage','mock','lesson','trace','settingsBtn','bMockResultList','startDiagnostic','installCard','pwaHealthCard','aiDrawer','aiFab','aiBackdrop','toast','offlinePill','planFocusCard','planDetailsToggle','analyticsDetailsToggle','weakTopAction','rightDailyAction','rightDailyProgress','quizSubmit','subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']
req(all(x in p.ids for x in ids_req),'dom ids')
for c in ['result-detail-fold','result-more-actions','sidebar','mock-history-details','mock-secondary-details','weak-detail-fold','coverage-summary-compact','b-mode-switcher','analytics-priority-card','data-maintenance-fold','recovery-fold','quiz-actions','ai-header-btn']:
    req(c in p.classes,'dom class '+c)
print('FEQUEST_V171_STATIC_DOM_OK 23/23 + required-dom')

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
        z=subprocess.run(['node','--check',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' syntax '+z.stderr[-500:])
        z=subprocess.run(['node',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' runtime '+z.stderr[-1200:])
    m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m,label+' snapshot marker')
    req(m.group(3)=='1',label+' self-check')
    return {'sha256':m.group(1),'utf8_bytes':int(m.group(2))}

prod_snap=snapshot('stable-learning',prod); ref_snap=snapshot('versioned-learning-reference',ref)
req(prod_snap==ref_snap,'canonical runtime snapshot differs')

js=extract_js(prod)
retired='||'.join(f"typeof runV{v}SelfCheck!=='undefined'" for v in range(160,171))
checks=f'''if(APP_VERSION!=='v171')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v171'||s.releaseAdapter!=='runV171SelfCheck')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==11||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV171SelfCheck!=='function'||{retired})throw Error('adapters');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/production-source-archive-boundary-v171.fixture.json'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveRoot!=='_regression/archive/diagnostics'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==53)throw Error('archive');console.log('FEQUEST_V171_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=11 adapter=1 data=6 backing=0 diagnostic-archive=53 learning-archive=48 app-learning-modules=1 critical-map=56 release-map=28 ci=84 legacy-bundled=0');'''
Path('/tmp/v171-run.js').write_text(STUB+'\n'+js+'\n'+checks)
z=subprocess.run(['node','/tmp/v171-run.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'production runtime')

legacy=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
base=Path(legacy['source']).read_text(); a=base.index(legacy['start_marker']); b=base.index(legacy['end_marker'],a); legacy_src=base[a:b]
req(sha_text(legacy_src)==legacy['range_sha256'] and len(legacy_src.encode())==49657 and len(re.findall(r'\bassert\s*\(',legacy_src))==293,'legacy fixture')
diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in diag['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+pth.as_posix())
    blocks.append(pth.read_text())
dsources=''.join(blocks); tmpl=legacy['release_shell_template']; adapted=legacy_src.replace(legacy['release_shell_from'],tmpl.replace('{{VERSION}}','v171'))
rel=r'''const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V171_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');'''
Path('/tmp/v171-release.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel)
q=subprocess.run(['node','/tmp/v171-release.js'],capture_output=True,text=True); print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release runtime')

learn_fx['validation']={
  'status':'passed','built_html_byte_exact':True,'canonical_runtime_snapshot_equal':True,
  'stable_build':{'path':'_site/index.html','utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},
  'versioned_reference_build':{'path':'_site_reference/index.html','utf8_bytes':len(ref_b),'sha256':sha_bytes(ref_b)},
  'canonical_runtime_snapshot':prod_snap,
  'canonical_snapshot_excluded_volatile_fields':['FEQUEST_SELF_CHECK.checkedAt'],
  'source_fragments_archived_byte_exact':True,'stable_module_reconstructed_from_archived_fragments':True,
  'archived_v170_bundle_equals_stable_module':True,'semantic_runtime_unchanged':True,'base_unchanged':True,
  'automatic_behavior_removal_authorized':False
}
learn_fx_path.write_text(json.dumps(learn_fx,ensure_ascii=False,indent=2)+'\n')
diag_fx['learning_source_boundary_fixture']=ident(learn_fx_path)
diag_fx_path.write_text(json.dumps(diag_fx,ensure_ascii=False,indent=2)+'\n')

audit=Path('audits/LEARNING_SOURCE_BOUNDARY_AUDIT_v171.txt')
audit.write_text(f'''FE QUEST v171 — Stable Learning Source Boundary Audit
=======================================================

Scope
-----
v171 promotes the v170 byte-exact learning bundle to the versionless production path app/learning-patches.txt.
The 47 original v132-v144 source fragments and the superseded versioned bundle app/learning-patches-v170.txt are retained byte-exactly under _regression/archive/learning-patches/ and are excluded from deployment.

Stable active learning module
-----------------------------
Path: app/learning-patches.txt
UTF-8 bytes: 405,723
SHA-256: {bundle_hash}
Source fragments represented: 47
Production learning modules: 1

Learning provenance archive
---------------------------
Archive root: _regression/archive/learning-patches
Archived source files: 48
- canonical v132-v144 source fragments: 47
- superseded v170 bundle: 1
Reconstructed 47-fragment concat equals stable module: yes
Archived v170 bundle equals stable module: yes
Versioned v132-v144 fragment residual in app/: 0
Versioned learning bundle residual in app/: 0
Archive deployed by Jekyll: no

Real Jekyll equivalence
-----------------------
Stable-path build bytes: {len(prod_b):,}
Stable-path build SHA-256: {sha_bytes(prod_b)}
Versioned-boundary reference build bytes: {len(ref_b):,}
Versioned-boundary reference build SHA-256: {sha_bytes(ref_b)}
Generated HTML byte equality: true
Canonical runtime snapshot SHA-256: {prod_snap['sha256']}
Canonical runtime snapshot UTF-8 bytes: {prod_snap['utf8_bytes']:,}
Canonical runtime equality: true
Excluded volatile field: FEQUEST_SELF_CHECK.checkedAt

Learner-facing invariants
-------------------------
QUESTION_BANK: 710 / 710 unique IDs
Answers: A178 / B178 / C177 / D177
Cognitive: 想起166 / 適用323 / 判断221
Current contract: 71/71
Browser UI: 23/23 + required DOM
Critical curriculum: 56/56
Release sentinel: 28/28
CI coverage: 84/84
Legacy fixture: 293 assertions / raw errors 22 / residual 0
Stable semantic runtime: 55,525 bytes / {runtime_hash}
Base v131: 3,041,328 bytes / {base_hash}

Release/archive boundary
------------------------
Diagnostic/provenance archive count: 53
Current adapter: runV171SelfCheck
Retired adapter inventory: 11 (runV160SelfCheck through runV170SelfCheck)
Leaked retired adapters: 0

Policy
------
This release changes physical source placement only. It does not remove learner behavior or authorize semantic patch deletion.
The immutable v167 patch inventory retains the historical original paths; v171's learning-source-boundary fixture is the authoritative mapping from those paths to build-excluded archived provenance.
''')
print('FEQUEST_V171_LEARNING_BOUNDARY_OK html-byte-exact=1 runtime-snapshot=1 stable-learning=405723 archived-learning=48 active-learning-modules=1 snapshot='+prod_snap['sha256'])
print('FEQUEST_V171_PATCH_PROVENANCE_OK fragments=47 archive=47 stable-reconstruction=1 versioned-bundle-archive=1')
print('FEQUEST_V171_ARCHIVE_BOUNDARY_OK diagnostic-archive=53 learning-archive=48 app-diagnostic-residual=0 app-learning-residual=0 deployed-archive=0 runtime=55525')
print('FEQUEST_V171_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=11 adapter=1 data=6 backing=0 diagnostic-archive=53 learning-archive=48 active-learning-modules=1 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
