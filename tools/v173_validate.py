from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys, tempfile
from v173_runtime_stub import STUB

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
V172_ADAPTER_BYTES=190
V172_ADAPTER_SHA='21f1232d1dd736eae7df78d6434e154471d3ccfbd46e2f28303d16ea8a215e1d'
V173_ADAPTER_SHA='c3307424b4499960adece93f52a06b210922545ee2e9b87a7ebc07f53c483037'
START=b'function runAppSelfCheck(){'
END=b'function runLessonUXAudit(){'
ARCHIVE_BASE=Path('_regression/archive/learning-base/base-v131.html')
LEGACY_ARCHIVE=Path('_regression/archive/learning-base/runAppSelfCheck-v131.txt')


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
def classify_ref(path):
    s=path.as_posix()
    if s in {'app/runtime-semantic-diagnostics.txt','app/runtime-diagnostic-wrapper.txt'}: return 'runtime-historical-provenance-literal'
    if s.startswith('_regression/'): return 'historical-regression-evidence'
    if s.startswith('audits/'): return 'historical-audit-documentation'
    if s=='manifest.webmanifest': return 'release-description'
    return 'UNCLASSIFIED'
def scan_refs():
    needle=b'app/base-v131.html'; rows=[]
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

prod_path=Path('_site/index.html'); ref_path=Path('_site_reference/index.html')
req(prod_path.exists() and ref_path.exists(),'both real Jekyll builds required')
prod_b=prod_path.read_bytes(); ref_b=ref_path.read_bytes()
req(prod_b==ref_b,'candidate and restored-historical-base generated index.html differ')
prod=prod_b.decode(); ref=ref_b.decode()
src=Path('index.html').read_text()
manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v173';" in prod and 'runV173SelfCheck();' in prod,'v173 version/boot')
req('"name": "FE QUEST v173"' in manifest,'v173 manifest')
req("const APP_VERSION = 'v173';" in sw and "fe-quest-v173-1" in sw,'v173 sw version')
req(all(x in sw for x in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]),'sw parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',prod),'legacy evaluator bundled')

# Physical historical-base archive and exact stable projection.
req(not Path('app/base-v131.html').exists(),'historical full base remains in app')
req(ARCHIVE_BASE.exists() and len(ARCHIVE_BASE.read_bytes())==BASE_BYTES and sha_file(ARCHIVE_BASE)==BASE_SHA,'archived full base identity')
base=ARCHIVE_BASE.read_bytes(); stable=Path('app/base-stable.html').read_bytes()
req(len(stable)==STABLE_BYTES and sha_bytes(stable)==STABLE_SHA,'stable base identity')
req(base.count(START)==1 and base.count(END)==1,'historical base markers')
a=base.index(START); b=base.index(END,a); legacy=base[a:b]
req(len(legacy)==LEGACY_BYTES and sha_bytes(legacy)==LEGACY_SHA,'legacy range identity')
req(stable==base[:a]+base[b:],'stable base exact projection')
req(LEGACY_ARCHIVE.exists() and LEGACY_ARCHIVE.read_bytes()==legacy,'legacy evaluator archive exact')
req(src.count('{% include_relative app/base-stable.html %}')==1 and 'app/base-v131.html' not in src,'assembler base boundary')

# Candidate deploy must stop publishing the historical full base; reference deploy restores it only to prove independence.
req(not Path('_site/app/base-v131.html').exists(),'candidate still deploys historical base')
req(Path('_site_reference/app/base-v131.html').exists(),'reference did not deploy restored historical base')
req(len(Path('_site_reference/app/base-v131.html').read_bytes())==BASE_BYTES and sha_file('_site_reference/app/base-v131.html')==BASE_SHA,'reference historical base identity')
req(not Path('_site/_regression').exists() and not Path('_site_reference/_regression').exists(),'regression archive deployed')
for name in ['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']:
    req((Path('_site')/name).read_bytes()==(Path('_site_reference')/name).read_bytes(),'app-shell reference difference '+name)

# Stable learning/runtime modules remain byte exact.
learn=Path('app/learning-patches.txt'); rt=Path('app/runtime-semantic-diagnostics.txt')
req(len(learn.read_bytes())==LEARNING_BYTES and sha_file(learn)==LEARNING_SHA,'stable learning identity')
req(len(rt.read_bytes())==RUNTIME_BYTES and sha_file(rt)==RUNTIME_SHA,'stable semantic runtime identity')
req(len([p for p in Path('_regression/archive/learning-patches').iterdir() if p.is_file()])==48,'learning patch archive count')
req(len([p for p in Path('_regression/archive/learning-base').iterdir() if p.is_file()])==2,'learning base archive count')

# Diagnostic archive and release adapter boundary.
diag_fx_path=Path('_regression/production-source-archive-boundary-v173.fixture.json')
diag_fx=json.loads(diag_fx_path.read_text())
req(diag_fx['version']=='v173' and diag_fx['archived_source_count']==55 and len(diag_fx['archive_entries'])==55,'diagnostic archive fixture')
for e in diag_fx['archive_entries']:
    req(not Path(e['old_path']).exists(),'old diagnostic source exists '+e['old_path'])
    p=Path(e['archive_path']); req(p.exists(),'diagnostic archive missing '+p.as_posix())
    req(len(p.read_bytes())==e['utf8_bytes'] and sha_file(p)==e['sha256'],'diagnostic archive identity '+p.as_posix())
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==55,'diagnostic archive physical count')
arch172=Path('_regression/archive/diagnostics/v172-block-00.txt')
req(len(arch172.read_bytes())==V172_ADAPTER_BYTES and sha_file(arch172)==V172_ADAPTER_SHA,'v172 adapter archive identity')
v173=Path('app/v173-block-00.txt')
req(v173.exists() and len(v173.read_bytes())==190 and sha_file(v173)==V173_ADAPTER_SHA and not Path('app/v172-block-00.txt').exists(),'v173 adapter source boundary')
req('{% include_relative app/v173-block-00.txt %}' in src and 'app/v172-block-00.txt' not in src,'assembler adapter boundary')
w=Path('app/runtime-diagnostic-wrapper.txt').read_text()
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v173.fixture.json'" in w and 'archivedSourceCount:55' in w,'wrapper archive metadata')
req("'runV172SelfCheck'" in w and 'retiredAdapters.length===13' in w and 'new Set(retiredAdapters).size===13' in w and 'a.retiredAdapters===13' in w,'retired adapter inventory')
req("f.sourcePath==='app/base-v131.html'" in w,'historical source provenance changed')

# Literal reference inventory: only historical evidence/provenance locations may retain the original path string.
refs=scan_refs(); unknown=[r for r in refs if r['classification']=='UNCLASSIFIED']
req(not unknown,'unclassified historical base references '+repr(unknown))
req(not any(r['path']=='index.html' for r in refs),'production assembler historical base literal')

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
print('FEQUEST_V173_STATIC_DOM_OK 23/23 + required-dom')

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
        z=subprocess.run(['node','--check',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' syntax '+z.stderr[-1200:])
        z=subprocess.run(['node',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' runtime '+z.stderr[-2000:])
    m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m,label+' snapshot marker')
    if m.group(3)!='1': print(z.stdout)
    req(m.group(3)=='1',label+' self-check')
    return {'sha256':m.group(1),'utf8_bytes':int(m.group(2))}

prod_snap=snapshot('archived-base-candidate',prod); ref_snap=snapshot('restored-base-reference',ref)
req(prod_snap==ref_snap,'canonical runtime snapshot differs')

js=extract_js(prod)
retired='||'.join(f"typeof runV{v}SelfCheck!=='undefined'" for v in range(160,173))
checks=f'''if(APP_VERSION!=='v173')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v173'||s.releaseAdapter!=='runV173SelfCheck')throw Error('self '+JSON.stringify(s?.errors));if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==13||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV173SelfCheck!=='function'||{retired})throw Error('adapters');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/production-source-archive-boundary-v173.fixture.json'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveRoot!=='_regression/archive/diagnostics'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==55)throw Error('archive');console.log('FEQUEST_V173_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=13 adapter=1 data=6 backing=0 diagnostic-archive=55 learning-archive=48 base-archive=2 active-learning=1 active-base=1 critical-map=56 release-map=28 ci=84 legacy-bundled=0');'''
Path('/tmp/v173-run.js').write_text(STUB+'\n'+js+'\n'+checks)
z=subprocess.run(['node','/tmp/v173-run.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'production runtime')

# Release-only legacy evaluator continues to execute from its archived range, independent of the full base location.
legacy_fx=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
legacy_text=LEGACY_ARCHIVE.read_text()
req(sha_text(legacy_text)==legacy_fx['range_sha256'] and len(legacy_text.encode())==legacy_fx['range_utf8_bytes'] and len(re.findall(r'\bassert\s*\(',legacy_text))==legacy_fx['assert_calls'],'legacy fixture')
diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in diag['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+pth.as_posix())
    blocks.append(pth.read_text())
dsources=''.join(blocks); tmpl=legacy_fx['release_shell_template']; adapted=legacy_text.replace(legacy_fx['release_shell_from'],tmpl.replace('{{VERSION}}','v173'))
rel=r'''const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V173_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');'''
Path('/tmp/v173-release.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel)
q=subprocess.run(['node','/tmp/v173-release.js'],capture_output=True,text=True); print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release runtime')

# Persist measured evidence.
fx_path=Path('_regression/production-base-archive-boundary-v173.fixture.json'); fx=json.loads(fx_path.read_text())
fx['reference_inventory_after_move']=refs
fx['validation']={
  'status':'passed','generated_index_byte_exact':True,'app_shell_byte_exact':True,'canonical_runtime_snapshot_equal':True,
  'candidate_build':{'path':'_site/index.html','utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},
  'restored_historical_base_reference_build':{'path':'_site_reference/index.html','utf8_bytes':len(ref_b),'sha256':sha_bytes(ref_b)},
  'canonical_runtime_snapshot':prod_snap,
  'canonical_snapshot_excluded_volatile_fields':['FEQUEST_SELF_CHECK.checkedAt'],
  'historical_base_archive_byte_exact':True,'stable_base_projection_exact':True,
  'candidate_deployed_historical_base':False,'reference_deployed_historical_base':True,'regression_archive_deployed':False,
  'unclassified_historical_base_reference_count':len(unknown),
  'learning_source_boundary_unchanged':True,'semantic_runtime_unchanged':True,'automatic_semantic_deletion_authorized':False
}
fx_path.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
diag_fx['base_archive_boundary_fixture']='_regression/production-base-archive-boundary-v173.fixture.json'
diag_fx['base_archive_boundary_validation']='passed'
diag_fx_path.write_text(json.dumps(diag_fx,ensure_ascii=False,indent=2)+'\n')

rows='\n'.join(f"- {r['path']} | occurrences={r['occurrences']} | {r['classification']}" for r in refs) or '- none'
audit=f'''FE QUEST v173 — Historical Base Archive Boundary Audit\n=========================================================\n\nScope\n-----\nv173 relocates the historical v131 full base out of app/ after v172 proved that production uses app/base-stable.html directly. The historical full base is preserved byte-exact under build-excluded _regression/archive/learning-base/. No learner-facing content or active learning/runtime behavior is changed.\n\nHistorical full base\n--------------------\nOriginal path: app/base-v131.html\nArchive path: _regression/archive/learning-base/base-v131.html\nUTF-8 bytes: {BASE_BYTES:,}\nSHA-256: {BASE_SHA}\nOriginal app path present: false\nArchive identity: byte-exact\n\nStable active base\n------------------\nPath: app/base-stable.html\nUTF-8 bytes: {STABLE_BYTES:,}\nSHA-256: {STABLE_SHA}\nExact historical projection after excluding legacy evaluator: true\nLegacy evaluator archive: {LEGACY_BYTES:,} bytes / {LEGACY_SHA}\n\nReference inventory\n-------------------\nThe original path literal may remain only as immutable historical provenance/evidence. No index assembler dependency remains.\n{rows}\nUnclassified references: {len(unknown)}\n\nReal Jekyll archive-independence proof\n-------------------------------------\nCandidate generated index.html bytes: {len(prod_b):,}\nCandidate SHA-256: {sha_bytes(prod_b)}\nReference generated index.html bytes: {len(ref_b):,}\nReference SHA-256: {sha_bytes(ref_b)}\nGenerated index equality: true\nApp-shell equality: true\nCandidate deployed app/base-v131.html: false\nReference deployed app/base-v131.html: true\nRegression archive deployed: false\nCanonical runtime snapshot: {prod_snap['sha256']} / {prod_snap['utf8_bytes']:,} bytes\nCanonical runtime equality: true\n\nRelease invariants\n------------------\nQUESTION_BANK: 710 / 710 unique IDs\nAnswers: A178 / B178 / C177 / D177\nCognitive: 想起166 / 適用323 / 判断221\nCurrent contract: 71/71\nBrowser UI: 23/23 + required DOM\nCritical curriculum: 56/56\nRelease sentinel: 28/28\nCI coverage: 84/84\nLegacy fixture: 293 assertions / raw errors 22 / residual 0\nStable learning module: {LEARNING_BYTES:,} bytes / {LEARNING_SHA}\nStable semantic runtime: {RUNTIME_BYTES:,} bytes / {RUNTIME_SHA}\nDiagnostic/provenance archive count: 55\nLearning-patch provenance archive count: 48\nLearning-base archive count: 2\nRetired release adapter inventory: 13 (runV160SelfCheck through runV172SelfCheck)\nCurrent adapter: runV173SelfCheck\n\nPolicy\n------\nThis is a physical provenance relocation only. Historical source strings remain historical provenance where contractually pinned. No semantic deletion is authorized.\n'''
Path('audits/BASE_ARCHIVE_BOUNDARY_AUDIT_v173.txt').write_text(audit)

print('FEQUEST_V173_BASE_ARCHIVE_OK html-byte-exact=1 runtime-snapshot=1 base-archive=%d base-sha=%s stable-base=%d stable-sha=%s legacy=%d snapshot=%s refs=%d unclassified=0 deployed-base=0' % (BASE_BYTES,BASE_SHA,STABLE_BYTES,STABLE_SHA,LEGACY_BYTES,prod_snap['sha256'],len(refs)))
print('FEQUEST_V173_LEARNING_BOUNDARY_OK stable-learning=%d learning-archive=48 active-learning-modules=1' % LEARNING_BYTES)
print('FEQUEST_V173_ARCHIVE_BOUNDARY_OK diagnostic-archive=55 learning-archive=48 base-archive=2 deployed-regression=0 runtime=%d' % RUNTIME_BYTES)
print('FEQUEST_V173_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=13 adapter=1 data=6 backing=0 diagnostic-archive=55 learning-archive=48 base-archive=2 active-learning=1 active-base=1 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
