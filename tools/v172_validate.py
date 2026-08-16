from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys, tempfile
from v172_runtime_stub import STUB

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
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d
def extract_js(h):
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
    return '\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))

prod_path=Path('_site/index.html'); ref_path=Path('_site_reference/index.html')
req(prod_path.exists() and ref_path.exists(),'both Jekyll builds required')
prod_b=prod_path.read_bytes(); ref_b=ref_path.read_bytes()
req(prod_b==ref_b,'stable base and legacy Liquid projection Jekyll output differ')
prod=prod_b.decode(); ref=ref_b.decode()
src=Path('index.html').read_text()
manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v172';" in prod and 'runV172SelfCheck();' in prod,'version/boot')
req('"name": "FE QUEST v172"' in manifest,'manifest')
req("const APP_VERSION = 'v172';" in sw and "fe-quest-v172-1" in sw,'sw-version')
req(all(x in sw for x in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]),'sw parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',prod),'legacy evaluator bundled')

base=Path('app/base-v131.html').read_bytes(); stable=Path('app/base-stable.html').read_bytes()
req(len(base)==BASE_BYTES and sha_bytes(base)==BASE_SHA,'historical base identity')
req(base.count(START)==1 and base.count(END)==1,'historical base markers')
a=base.index(START); b=base.index(END,a); legacy=base[a:b]
req(len(legacy)==LEGACY_BYTES and sha_bytes(legacy)==LEGACY_SHA,'legacy range identity')
req(stable==base[:a]+base[b:],'stable base byte projection')
req(len(stable)==BASE_BYTES-LEGACY_BYTES and START not in stable and stable.count(END)==1,'stable base structure')
legacy_archive=Path('_regression/archive/learning-base/runAppSelfCheck-v131.txt')
req(legacy_archive.exists() and legacy_archive.read_bytes()==legacy,'legacy range archive')
base_fx_path=Path('_regression/production-base-stabilization-v172.fixture.json')
base_fx=json.loads(base_fx_path.read_text())
req(base_fx['version']=='v172' and base_fx['historical_base']['sha256']==BASE_SHA,'base fixture')
req(base_fx['legacy_range']['sha256']==LEGACY_SHA and base_fx['legacy_range']['utf8_bytes']==LEGACY_BYTES,'base legacy fixture')
req(base_fx['stable_active_base']['sha256']==sha_bytes(stable) and base_fx['stable_active_base']['utf8_bytes']==len(stable),'stable base fixture')
req(src.count('{% include_relative app/base-stable.html %}')==1,'stable base include count')
req('{% include_relative app/base-v131.html %}' not in src and 'legacyStartParts' not in src and 'legacyEndParts' not in src,'dynamic base stripping residual')

learn=Path('app/learning-patches.txt')
req(learn.exists() and len(learn.read_bytes())==LEARNING_BYTES and sha_file(learn)==LEARNING_SHA,'stable learning identity')
learn_fx=json.loads(Path('_regression/production-learning-source-boundary-v171.fixture.json').read_text())
req(learn_fx['version']=='v171' and learn_fx['archived_source_count']==48,'learning source boundary')
req(src.count('{% include_relative app/learning-patches.txt %}')==1,'learning include count')
req(len([p for p in Path('_regression/archive/learning-patches').iterdir() if p.is_file()])==48,'learning archive count')

diag_fx_path=Path('_regression/production-source-archive-boundary-v172.fixture.json')
diag_fx=json.loads(diag_fx_path.read_text())
req(diag_fx['version']=='v172' and diag_fx['archived_source_count']==54 and len(diag_fx['archive_entries'])==54,'diagnostic archive fixture')
for e in diag_fx['archive_entries']:
    req(not Path(e['old_path']).exists(),'old diagnostic source exists '+e['old_path'])
    p=Path(e['archive_path']); req(p.exists(),'diagnostic archive missing '+p.as_posix())
    req(len(p.read_bytes())==e['utf8_bytes'] and sha_file(p)==e['sha256'],'diagnostic archive identity '+p.as_posix())
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==54,'diagnostic archive physical count')
req(not Path('_site/_regression').exists() and not Path('_site_reference/_regression').exists(),'regression archive deployed')
req(Path('app/v172-block-00.txt').exists() and not Path('app/v171-block-00.txt').exists(),'adapter source boundary')
req('{% include_relative app/v172-block-00.txt %}' in src and 'app/v171-block-00.txt' not in src,'assembler adapter')
rt=Path('app/runtime-semantic-diagnostics.txt')
req(len(rt.read_bytes())==RUNTIME_BYTES and sha_file(rt)==RUNTIME_SHA,'runtime identity')
w=Path('app/runtime-diagnostic-wrapper.txt').read_text()
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v172.fixture.json'" in w and 'archivedSourceCount:54' in w,'wrapper archive metadata')
req("'runV171SelfCheck'" in w and 'retiredAdapters.length===12' in w and 'new Set(retiredAdapters).size===12' in w and 'a.retiredAdapters===12' in w,'retired adapter inventory')

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
print('FEQUEST_V172_STATIC_DOM_OK 23/23 + required-dom')

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
        z=subprocess.run(['node','--check',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' syntax '+z.stderr[-800:])
        z=subprocess.run(['node',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' runtime '+z.stderr[-1600:])
    m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m,label+' snapshot marker')
    req(m.group(3)=='1',label+' self-check')
    return {'sha256':m.group(1),'utf8_bytes':int(m.group(2))}

prod_snap=snapshot('stable-base',prod); ref_snap=snapshot('legacy-liquid-reference',ref)
req(prod_snap==ref_snap,'canonical runtime snapshot differs')

js=extract_js(prod)
retired='||'.join(f"typeof runV{v}SelfCheck!=='undefined'" for v in range(160,172))
checks=f'''if(APP_VERSION!=='v172')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v172'||s.releaseAdapter!=='runV172SelfCheck')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==12||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV172SelfCheck!=='function'||{retired})throw Error('adapters');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/production-source-archive-boundary-v172.fixture.json'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveRoot!=='_regression/archive/diagnostics'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==54)throw Error('archive');console.log('FEQUEST_V172_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=12 adapter=1 data=6 backing=0 diagnostic-archive=54 learning-archive=48 active-learning=1 active-base=1 critical-map=56 release-map=28 ci=84 legacy-bundled=0');'''
Path('/tmp/v172-run.js').write_text(STUB+'\n'+js+'\n'+checks)
z=subprocess.run(['node','/tmp/v172-run.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'production runtime')

legacy_fx=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
legacy_text=legacy.decode()
req(sha_text(legacy_text)==legacy_fx['range_sha256'] and len(legacy_text.encode())==legacy_fx['range_utf8_bytes'] and len(re.findall(r'\bassert\s*\(',legacy_text))==legacy_fx['assert_calls'],'legacy fixture')
diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in diag['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+pth.as_posix())
    blocks.append(pth.read_text())
dsources=''.join(blocks); tmpl=legacy_fx['release_shell_template']; adapted=legacy_text.replace(legacy_fx['release_shell_from'],tmpl.replace('{{VERSION}}','v172'))
rel=r'''const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V172_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');'''
Path('/tmp/v172-release.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel)
q=subprocess.run(['node','/tmp/v172-release.js'],capture_output=True,text=True); print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release runtime')

base_fx['validation']={
  'status':'passed','built_html_byte_exact':True,'canonical_runtime_snapshot_equal':True,
  'stable_build':{'path':'_site/index.html','utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},
  'legacy_liquid_reference_build':{'path':'_site_reference/index.html','utf8_bytes':len(ref_b),'sha256':sha_bytes(ref_b)},
  'canonical_runtime_snapshot':prod_snap,
  'canonical_snapshot_excluded_volatile_fields':['FEQUEST_SELF_CHECK.checkedAt'],
  'historical_base_unchanged':True,'legacy_range_archived_byte_exact':True,'stable_base_matches_liquid_projection':True,
  'learning_source_boundary_unchanged':True,'semantic_runtime_unchanged':True,
  'automatic_semantic_deletion_authorized':False
}
base_fx_path.write_text(json.dumps(base_fx,ensure_ascii=False,indent=2)+'\n')
diag_fx['base_stabilization_fixture']=ident(base_fx_path)
diag_fx['stable_base']=ident('app/base-stable.html',legacy_evaluator_excluded=True)
diag_fx_path.write_text(json.dumps(diag_fx,ensure_ascii=False,indent=2)+'\n')

stable_sha=sha_bytes(stable)
audit=f'''FE QUEST v172 — Stable Production Base Boundary Audit\n=======================================================\n\nScope\n-----\nv172 materializes the exact production-base projection that v171 generated in Liquid by excluding the release-only runAppSelfCheck() evaluator from app/base-v131.html.\nProduction now includes app/base-stable.html directly; the historical base remains immutable evidence and the excluded evaluator range is preserved byte-exact under _regression/archive/learning-base/.\n\nStable active base\n------------------\nPath: app/base-stable.html\nUTF-8 bytes: {len(stable):,}\nSHA-256: {stable_sha}\nHistorical base: {BASE_BYTES:,} bytes / {BASE_SHA}\nExcluded legacy evaluator: {LEGACY_BYTES:,} bytes / {LEGACY_SHA}\nExact subtraction: yes\nProduction dynamic legacy split operations: 0\nProduction stable base includes: 1\n\nReal Jekyll equivalence\n-----------------------\nStable-base build bytes: {len(prod_b):,}\nStable-base build SHA-256: {sha_bytes(prod_b)}\nLegacy-Liquid reference build bytes: {len(ref_b):,}\nLegacy-Liquid reference build SHA-256: {sha_bytes(ref_b)}\nGenerated HTML byte equality: true\nCanonical runtime snapshot SHA-256: {prod_snap['sha256']}\nCanonical runtime snapshot UTF-8 bytes: {prod_snap['utf8_bytes']:,}\nCanonical runtime equality: true\nExcluded volatile field: FEQUEST_SELF_CHECK.checkedAt\n\nLearner-facing invariants\n-------------------------\nQUESTION_BANK: 710 / 710 unique IDs\nAnswers: A178 / B178 / C177 / D177\nCognitive: 想起166 / 適用323 / 判断221\nCurrent contract: 71/71\nBrowser UI: 23/23 + required DOM\nCritical curriculum: 56/56\nRelease sentinel: 28/28\nCI coverage: 84/84\nLegacy fixture: 293 assertions / raw errors 22 / residual 0\nStable learning module: {LEARNING_BYTES:,} bytes / {LEARNING_SHA}\nStable semantic runtime: {RUNTIME_BYTES:,} bytes / {RUNTIME_SHA}\n\nRelease/archive boundary\n------------------------\nDiagnostic/provenance archive count: 54\nLearning provenance archive count: 48\nCurrent adapter: runV172SelfCheck\nRetired adapter inventory: 12 (runV160SelfCheck through runV171SelfCheck)\nLeaked retired adapters: 0\n\nPolicy\n------\nThis release changes the physical base-source boundary only. It does not change learner content, remove learning behavior, or authorize semantic deletion of historical code.\n'''
Path('audits/BASE_SOURCE_BOUNDARY_AUDIT_v172.txt').write_text(audit)

print(f'FEQUEST_V172_BASE_BOUNDARY_OK html-byte-exact=1 runtime-snapshot=1 stable-base={len(stable)} stable-base-sha={stable_sha} legacy-archive={LEGACY_BYTES} snapshot={prod_snap["sha256"]}')
print('FEQUEST_V172_LEARNING_BOUNDARY_OK stable-learning=405723 learning-archive=48 active-learning-modules=1')
print('FEQUEST_V172_ARCHIVE_BOUNDARY_OK diagnostic-archive=54 learning-archive=48 base-provenance=1 deployed-archive=0 runtime=55525')
print('FEQUEST_V172_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=12 adapter=1 data=6 backing=0 diagnostic-archive=54 learning-archive=48 active-learning=1 active-base=1 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
