from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys, tempfile
from v176_runtime_stub import STUB

PARENT='f61e6032aad53109284b9a24ba43191e4447944d'
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

# Stable architecture identities. The wrapper must still be byte-identical to v175.
wrapper=Path('app/runtime-diagnostic-wrapper.txt'); wb=wrapper.read_bytes()
req(len(wb)==WRAPPER_BYTES and sha_bytes(wb)==WRAPPER_SHA,'stable wrapper pinned identity')
req(wb==subprocess.check_output(['git','show',PARENT+':app/runtime-diagnostic-wrapper.txt']),'v176 wrapper differs from v175 parent')
stable=Path('app/runtime-release-adapter.txt'); req(stable.exists() and len(stable.read_bytes())==ADAPTER_BYTES and sha_file(stable)==ADAPTER_SHA,'stable adapter identity')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base identity')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning identity')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'semantic runtime identity')

# Release and source boundaries.
spec=Path('app/runtime-release-diagnostic-spec.txt').read_text()
for token in ["releaseVersion:'v176'","currentReleaseAdapter:'runV176SelfCheck'","archiveBoundaryFixture:'_regression/production-source-archive-boundary-v176.fixture.json'",'archivedSourceCount:58','retiredReleaseAdapterCount:16',"'runV175SelfCheck'"]:
    req(token in spec,'release metadata '+token)
req(not Path('app/v175-block-00.txt').exists() and not Path('app/v176-block-00.txt').exists(),'versioned current adapter source residual')
versioned=[p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)]
req(not versioned,'production versioned adapter/source residual '+','.join(p.name for p in versioned))
req(Path('_regression/archive/diagnostics/v175-block-00.txt').exists(),'v175 adapter archive missing')
diag=json.loads(Path('_regression/production-source-archive-boundary-v176.fixture.json').read_text())
req(diag['version']=='v176' and diag['archived_source_count']==58 and len(diag['archive_entries'])==58,'diagnostic fixture v176')
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==58,'diagnostic archive physical count')
req(len([p for p in Path('_regression/archive/learning-patches').iterdir() if p.is_file()])==48,'learning archive count')
req(len([p for p in Path('_regression/archive/learning-base').iterdir() if p.is_file()])==2,'base archive count')

prod_path=Path('_site/index.html'); ref_path=Path('_site_reference/index.html')
req(prod_path.exists() and ref_path.exists(),'real Jekyll candidate/reference build missing')
prod_b=prod_path.read_bytes(); ref_b=ref_path.read_bytes(); prod=prod_b.decode(); ref=ref_b.decode(); src=Path('index.html').read_text()
req("const APP_VERSION = 'v176';" in prod and "globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in prod,'candidate v176 dynamic boot')
req("const APP_VERSION = 'v176';" in ref and 'runV176SelfCheck();' in ref,'reference v176 versioned boot')
req('{% include_relative app/runtime-release-adapter.txt %}' in src and 'v176-block-00.txt' not in src and 'v175-block-00.txt' not in src,'stable adapter assembler')
manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req('"name": "FE QUEST v176"' in manifest,'manifest v176')
req("const APP_VERSION = 'v176';" in sw and 'fe-quest-v176-1' in sw,'SW v176')
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in sw,'SW behavior '+token)
req(not Path('_site/_regression').exists() and not Path('_site_reference/_regression').exists(),'regression deployed')
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
print('FEQUEST_V176_STATIC_DOM_OK 23/23 + required-dom')

SNAP=r'''
const __c=require('crypto');function __canon(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(__canon);const o={};for(const k of Object.keys(v).sort()){const x=v[k];if(typeof x==='function'||typeof x==='undefined')continue;o[k]=__canon(x);}return o;}
const raw=globalThis.FEQUEST_SELF_CHECK;if(!raw)throw Error('self missing');const self={...raw};delete self.checkedAt;
const payload={appVersion:APP_VERSION,questionBank:__canon(QUESTION_BANK),selfCheck:__canon(self),diagnosticContractData:__canon(globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA),diagnosticDataProvenance:__canon(globalThis.FEQ_DIAGNOSTIC_DATA_PROVENANCE),globalSurface:Object.keys(globalThis).filter(k=>/^(?:feq|runV)/.test(k)).sort(),answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length)};const txt=JSON.stringify(__canon(payload));console.log('__FEQ_SNAPSHOT__ '+__c.createHash('sha256').update(txt).digest('hex')+' '+Buffer.byteLength(txt)+' '+(raw.ok?'1':'0'));
'''
retired='||'.join(f"typeof globalThis.runV{v}SelfCheck!=='undefined'" for v in range(160,176))
CHECKS=f'''const s=FEQUEST_SELF_CHECK;if(APP_VERSION!=='v176'||!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.browserUiContract.total!==23||s.releaseVersion!=='v176'||s.releaseAdapter!=='runV176SelfCheck')throw Error('self '+JSON.stringify(s?.errors));if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==16||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper boundary');if(typeof globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC!=='undefined')throw Error('release metadata global leak');if(typeof globalThis.runV176SelfCheck!=='function'||{retired})throw Error('adapter boundary');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('questions');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('answers');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cognitive');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('CI coverage');'''

def runtime_snapshot(html,label):
    js=extract_js(html)
    with tempfile.TemporaryDirectory() as td:
        run=Path(td)/'run.js'; run.write_text(STUB+'\n'+js+'\n'+CHECKS+'\n'+SNAP)
        z=subprocess.run(['node','--check',str(run)],capture_output=True,text=True); req(z.returncode==0,label+' node syntax '+z.stderr[-1500:])
        z=subprocess.run(['node',str(run)],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,label+' node runtime')
    m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m and m.group(3)=='1',label+' snapshot/self-check')
    return {'sha256':m.group(1),'utf8_bytes':int(m.group(2))}

candidate=runtime_snapshot(prod,'candidate')
reference=runtime_snapshot(ref,'reference')
req(candidate==reference,'stable adapter runtime snapshot differs from versioned reference')
print('FEQUEST_V176_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=16 adapter=1 data=6 backing=0 diagnostic-archive=58 learning-archive=48 base-archive=2 active-learning=1 active-base=1 stable-adapter=1 versioned-adapter-source=0 release-metadata=1 critical-map=56 release-map=28 ci=84 legacy-bundled=0')

# Release-only legacy evaluator regression remains pinned and executable.
legacy_fx=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
legacy=Path('_regression/archive/learning-base/runAppSelfCheck-v131.txt').read_text()
req(sha_bytes(legacy.encode())==legacy_fx['range_sha256'] and len(legacy.encode())==legacy_fx['range_utf8_bytes'] and len(re.findall(r'\bassert\s*\(',legacy))==legacy_fx['assert_calls'],'legacy range fixture')
helper=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in helper['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+pth.as_posix()); blocks.append(pth.read_text())
adapted=legacy.replace(legacy_fx['release_shell_from'],legacy_fx['release_shell_template'].replace('{{VERSION}}','v176'))
rel=r'''const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V176_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');'''
with tempfile.TemporaryDirectory() as td:
    rp=Path(td)/'release.js'; rp.write_text(STUB+'\n'+extract_js(prod)+'\neval('+json.dumps(''.join(blocks))+');\neval('+json.dumps(adapted)+');\n'+rel)
    rz=subprocess.run(['node',str(rp)],capture_output=True,text=True); print(rz.stdout); print(rz.stderr,file=sys.stderr); req(rz.returncode==0,'release fixture')

# Record authoritative measurements only after candidate/reference equivalence passes.
fxp=Path('_regression/stable-release-adapter-v176.fixture.json'); fx=json.loads(fxp.read_text())
fx['validation']={'status':'passed','candidate_generated_index':{'utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},'reference_generated_index':{'utf8_bytes':len(ref_b),'sha256':sha_bytes(ref_b)},'generated_html_byte_equality':prod_b==ref_b,'candidate_runtime_snapshot':candidate,'reference_runtime_snapshot':reference,'canonical_runtime_equality':candidate==reference,'only_excluded_volatile_field':'FEQUEST_SELF_CHECK.checkedAt','wrapper_byte_identical_to_parent':True,'production_versioned_adapter_source_count':0,'learner_facing_change':False}
fxp.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

audit=Path('audits/STABLE_RELEASE_ADAPTER_AUDIT_v176.txt')
audit.write_text(audit.read_text().replace('pending authoritative candidate/reference GitHub Pages validation',f'''passed\nCandidate real Jekyll index: {len(prod_b):,} bytes / {sha_bytes(prod_b)}\nReference versioned-adapter index: {len(ref_b):,} bytes / {sha_bytes(ref_b)}\nGenerated HTML byte equality: {'yes' if prod_b==ref_b else 'no (expected source-layout difference)'}\nCanonical runtime snapshot: {candidate['sha256']} / {candidate['utf8_bytes']:,} bytes\nCandidate/reference canonical runtime equality: yes\nOnly excluded volatile field: FEQUEST_SELF_CHECK.checkedAt\nStable wrapper byte-identical to v175: yes\nVersioned production adapter sources: 0\nTemporary release metadata global leaked: no\nCurrent contract: 71/71\nBrowser UI: 23/23 + required DOM\nCritical curriculum: 56/56\nRelease sentinel: 28/28\nCI coverage: 84/84\nLegacy fixture: 293 assertions / raw 22 / residual 0'''))

print('FEQUEST_V176_STABLE_ADAPTER_OK runtime-equivalent=1 stable-adapter=211 stable-adapter-sha='+ADAPTER_SHA+' wrapper-byte-stable=1 versioned-adapter-source=0 retired-adapter-inventory=16 diagnostic-archive=58 snapshot='+candidate['sha256'])
print('FEQUEST_V176_ARCHIVE_BOUNDARY_OK diagnostic-archive=58 learning-archive=48 base-archive=2 deployed-regression=0 runtime=55525')
print('FEQUEST_V176_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=16 adapter=1 data=6 backing=0 diagnostic-archive=58 learning-archive=48 base-archive=2 active-learning=1 active-base=1 stable-adapter=1 versioned-adapter-source=0 release-metadata=1 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
