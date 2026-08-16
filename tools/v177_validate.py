from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys, tempfile
from v177_runtime_stub import STUB

PARENT='391d930f75e8a0997ab3ad486cf313f47e502800'
WRAPPER_BYTES=19860; WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211; ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
BASE_BYTES=2991671; BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723; LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525; RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def extract_js(h): return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))

# Stable architecture identities must be byte-identical to the final v176 main.
wrapper=Path('app/runtime-diagnostic-wrapper.txt'); adapter=Path('app/runtime-release-adapter.txt')
wb=wrapper.read_bytes(); ab=adapter.read_bytes()
req(len(wb)==WRAPPER_BYTES and sha_bytes(wb)==WRAPPER_SHA,'stable wrapper pinned identity')
req(len(ab)==ADAPTER_BYTES and sha_bytes(ab)==ADAPTER_SHA,'stable adapter pinned identity')
req(wb==subprocess.check_output(['git','show',PARENT+':app/runtime-diagnostic-wrapper.txt']),'v177 wrapper differs from v176 parent bytes')
req(ab==subprocess.check_output(['git','show',PARENT+':app/runtime-release-adapter.txt']),'v177 stable adapter differs from v176 parent bytes')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base identity')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning identity')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'semantic runtime identity')

# Release cadence: retired adapter contract grows, physical archive does not.
spec=Path('app/runtime-release-diagnostic-spec.txt').read_text()
for token in ["releaseVersion:'v177'","currentReleaseAdapter:'runV177SelfCheck'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v177.fixture.json'",'archivedSourceCount:58','retiredReleaseAdapterCount:17',"'runV176SelfCheck'"]:
    req(token in spec,'release metadata '+token)
versioned=[p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)]
req(not versioned,'production versioned adapter/source residual '+','.join(p.name for p in versioned))
prev=json.loads(Path('_regression/production-source-archive-boundary-v176.fixture.json').read_text())
diag=json.loads(Path('_regression/production-source-archive-boundary-v177.fixture.json').read_text())
req(diag['version']=='v177' and diag['archived_source_count']==58 and len(diag['archive_entries'])==58,'diagnostic fixture v177')
req(prev['archive_entries']==diag['archive_entries'],'diagnostic archive entries changed in v177')
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==58,'diagnostic archive physical count')
req(len([p for p in Path('_regression/archive/learning-patches').iterdir() if p.is_file()])==48,'learning archive count')
req(len([p for p in Path('_regression/archive/learning-base').iterdir() if p.is_file()])==2,'base archive count')

prod_path=Path('_site/index.html'); req(prod_path.exists(),'real Jekyll build missing')
prod_b=prod_path.read_bytes(); prod=prod_b.decode(); src=Path('index.html').read_text()
req("const APP_VERSION = 'v177';" in prod and "globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in prod,'v177 dynamic boot')
req('{% include_relative app/runtime-release-adapter.txt %}' in src and 'v177-block-00.txt' not in src,'stable adapter assembler')
manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req('"name": "FE QUEST v177"' in manifest,'manifest v177')
req("const APP_VERSION = 'v177';" in sw and 'fe-quest-v177-1' in sw,'SW v177')
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in sw,'SW behavior '+token)
req(not Path('_site/_regression').exists(),'regression deployed')
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
print('FEQUEST_V177_STATIC_DOM_OK 23/23 + required-dom')

SNAP=r'''
const __c=require('crypto');function __canon(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(__canon);const o={};for(const k of Object.keys(v).sort()){const x=v[k];if(typeof x==='function'||typeof x==='undefined')continue;o[k]=__canon(x);}return o;}
const raw=globalThis.FEQUEST_SELF_CHECK;if(!raw)throw Error('self missing');const self={...raw};delete self.checkedAt;
const payload={appVersion:APP_VERSION,questionBank:__canon(QUESTION_BANK),selfCheck:__canon(self),diagnosticContractData:__canon(globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA),diagnosticDataProvenance:__canon(globalThis.FEQ_DIAGNOSTIC_DATA_PROVENANCE),globalSurface:Object.keys(globalThis).filter(k=>/^(?:feq|runV)/.test(k)).sort(),answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length)};const txt=JSON.stringify(__canon(payload));console.log('__FEQ_SNAPSHOT__ '+__c.createHash('sha256').update(txt).digest('hex')+' '+Buffer.byteLength(txt)+' '+(raw.ok?'1':'0'));
'''
retired='||'.join(f"typeof globalThis.runV{v}SelfCheck!=='undefined'" for v in range(160,177))
CHECKS=f'''const s=FEQUEST_SELF_CHECK;if(APP_VERSION!=='v177'||!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.browserUiContract.total!==23||s.releaseVersion!=='v177'||s.releaseAdapter!=='runV177SelfCheck')throw Error('self '+JSON.stringify(s?.errors));if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==17||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper boundary');if(typeof globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC!=='undefined')throw Error('release metadata global leak');if(typeof globalThis.runV177SelfCheck!=='function'||{retired})throw Error('adapter boundary');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('questions');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('answers');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cognitive');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('CI coverage');console.log('FEQUEST_V177_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=17 adapter=1 data=6 backing=0 diagnostic-archive=58 archive-growth=0 learning-archive=48 base-archive=2 active-learning=1 active-base=1 stable-adapter=1 versioned-adapter-source=0 release-metadata=1 critical-map=56 release-map=28 ci=84 legacy-bundled=0');'''

js=extract_js(prod)
with tempfile.TemporaryDirectory() as td:
    run=Path(td)/'run.js'; run.write_text(STUB+'\n'+js+'\n'+CHECKS+'\n'+SNAP)
    z=subprocess.run(['node','--check',str(run)],capture_output=True,text=True); req(z.returncode==0,'node syntax '+z.stderr[-1500:])
    z=subprocess.run(['node',str(run)],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'node runtime')
m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m and m.group(3)=='1','snapshot/self-check')
snapshot={'sha256':m.group(1),'utf8_bytes':int(m.group(2))}

# Release-only legacy evaluator remains exactly pinned and executable.
legacy_fx=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
legacy=Path('_regression/archive/learning-base/runAppSelfCheck-v131.txt').read_text()
req(sha_bytes(legacy.encode())==legacy_fx['range_sha256'] and len(legacy.encode())==legacy_fx['range_utf8_bytes'] and len(re.findall(r'\bassert\s*\(',legacy))==legacy_fx['assert_calls'],'legacy range fixture')
helper=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in helper['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+pth.as_posix()); blocks.append(pth.read_text())
adapted=legacy.replace(legacy_fx['release_shell_from'],legacy_fx['release_shell_template'].replace('{{VERSION}}','v177'))
rel=r'''const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V177_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');'''
with tempfile.TemporaryDirectory() as td:
    rp=Path(td)/'release.js'; rp.write_text(STUB+'\n'+js+'\neval('+json.dumps(''.join(blocks))+');\neval('+json.dumps(adapted)+');\n'+rel)
    rz=subprocess.run(['node',str(rp)],capture_output=True,text=True); print(rz.stdout); print(rz.stderr,file=sys.stderr); req(rz.returncode==0,'release fixture')

# Record authoritative measurements only after every invariant passes.
fxp=Path('_regression/stable-release-cadence-v177.fixture.json'); fx=json.loads(fxp.read_text())
fx['release_metadata_module']={'path':'app/runtime-release-diagnostic-spec.txt','utf8_bytes':len(Path('app/runtime-release-diagnostic-spec.txt').read_bytes()),'sha256':sha_file('app/runtime-release-diagnostic-spec.txt'),'release_version':'v177','retired_release_adapter_count':17,'diagnostic_archive_count':58}
fx['validation']={'status':'passed','generated_index':{'utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},'canonical_runtime_snapshot':snapshot,'only_excluded_volatile_field':'FEQUEST_SELF_CHECK.checkedAt','wrapper_byte_identical_to_v176_parent':True,'stable_adapter_byte_identical_to_v176_parent':True,'diagnostic_archive_growth':0,'production_versioned_adapter_source_count':0,'learner_facing_change':False}
fxp.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

audit=Path('audits/STABLE_RELEASE_CADENCE_AUDIT_v177.txt')
if 'pending authoritative GitHub Actions validation' in audit.read_text():
    audit.write_text(audit.read_text().replace('pending authoritative GitHub Actions validation',f'''passed\nReal Jekyll index: {len(prod_b):,} bytes / {sha_bytes(prod_b)}\nCanonical runtime snapshot: {snapshot['sha256']} / {snapshot['utf8_bytes']:,} bytes\nOnly excluded volatile field: FEQUEST_SELF_CHECK.checkedAt\nStable wrapper byte-identical to v176 parent: yes\nStable release adapter byte-identical to v176 parent: yes\nDiagnostic archive: 58 -> 58 (growth 0)\nVersioned production adapter sources: 0\nTemporary release metadata global leaked: no\nCurrent contract: 71/71\nBrowser UI: 23/23 + required DOM\nCritical curriculum: 56/56\nRelease sentinel: 28/28\nCI coverage: 84/84\nLegacy fixture: 293 assertions / raw 22 / residual 0'''))

print('FEQUEST_V177_STABLE_CADENCE_OK wrapper-byte-stable=1 adapter-byte-stable=1 stable-adapter=211 stable-adapter-sha='+ADAPTER_SHA+' versioned-adapter-source=0 retired-adapter-inventory=17 diagnostic-archive=58 archive-growth=0 snapshot='+snapshot['sha256'])
print('FEQUEST_V177_ARCHIVE_BOUNDARY_OK diagnostic-archive=58 archive-growth=0 learning-archive=48 base-archive=2 deployed-regression=0 runtime=55525')
print('FEQUEST_V177_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=17 adapter=1 data=6 backing=0 diagnostic-archive=58 archive-growth=0 learning-archive=48 base-archive=2 active-learning=1 active-base=1 stable-adapter=1 versioned-adapter-source=0 release-metadata=1 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
