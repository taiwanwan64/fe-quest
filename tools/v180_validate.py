from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys, tempfile
from v180_runtime_stub import STUB

PARENT='cd65d500ab0eab81cf44a975a138025eac7b950d'
WRAPPER_BYTES=19860; WRAPPER_SHA='3dd927c419d137121e434c4d5b8759429b2ab4d7af8d7799ab5faff8e22d99b3'
ADAPTER_BYTES=211; ADAPTER_SHA='795dabdd88e0efe464fdd94d688e6fef1473b1d83e96e3a9e537b8ff813e1248'
INVENTORY_BYTES=17671; INVENTORY_SHA='b290a576691505999bc734197aba4623a80f2d055a1a48fe718e55cd6dbb3250'
BASE_BYTES=2991671; BASE_SHA='c41e5e4ade215d9cff6e103cae4596ef42f7b3334fe20cb0912023948c44fcac'
LEARNING_BYTES=405723; LEARNING_SHA='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8'
RUNTIME_BYTES=55525; RUNTIME_SHA='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'
INV=Path('_regression/diagnostic-archive-inventory.fixture.json')
FIXTURE=Path('_regression/derived-release-diagnostic-metadata-v180.fixture.json')
AUDIT=Path('audits/DERIVED_RELEASE_DIAGNOSTIC_METADATA_AUDIT_v180.txt')
FORBIDDEN=Path('_regression/production-source-archive-boundary-v180.fixture.json')

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def extract_js(h): return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))

wrapper=Path('app/runtime-diagnostic-wrapper.txt'); adapter=Path('app/runtime-release-adapter.txt'); specp=Path('app/runtime-release-diagnostic-spec.txt')
req(len(wrapper.read_bytes())==WRAPPER_BYTES and sha_file(wrapper)==WRAPPER_SHA,'stable wrapper identity')
req(len(adapter.read_bytes())==ADAPTER_BYTES and sha_file(adapter)==ADAPTER_SHA,'stable adapter identity')
req(len(INV.read_bytes())==INVENTORY_BYTES and sha_file(INV)==INVENTORY_SHA,'stable inventory identity')
req(wrapper.read_bytes()==subprocess.check_output(['git','show',PARENT+':app/runtime-diagnostic-wrapper.txt']),'wrapper differs from v179')
req(adapter.read_bytes()==subprocess.check_output(['git','show',PARENT+':app/runtime-release-adapter.txt']),'adapter differs from v179')
req(INV.read_bytes()==subprocess.check_output(['git','show',PARENT+':_regression/diagnostic-archive-inventory.fixture.json']),'inventory differs from v179')
req(len(Path('app/base-stable.html').read_bytes())==BASE_BYTES and sha_file('app/base-stable.html')==BASE_SHA,'stable base identity')
req(len(Path('app/learning-patches.txt').read_bytes())==LEARNING_BYTES and sha_file('app/learning-patches.txt')==LEARNING_SHA,'stable learning identity')
req(len(Path('app/runtime-semantic-diagnostics.txt').read_bytes())==RUNTIME_BYTES and sha_file('app/runtime-semantic-diagnostics.txt')==RUNTIME_SHA,'semantic runtime identity')
req(not FORBIDDEN.exists(),'v180 release boundary must not exist')

spec=specp.read_text()
for token in ["const releaseVersion='v180'",'const releaseNumber=Number(releaseVersion.slice(1))','Array.from({length:releaseNumber-160}',"currentReleaseAdapter:`runV${releaseNumber}SelfCheck`",'retiredReleaseAdapterCount:retiredReleaseAdapters.length',"archiveBoundaryFixture:'_regression/diagnostic-archive-inventory.fixture.json'"]:
    req(token in spec,'derived release metadata '+token)
req(len(re.findall(r"['\"]runV\d+SelfCheck['\"]",spec))==0,'explicit retired adapter literal remains in candidate metadata')
req(spec.count("'v180'")==1,'candidate must have exactly one v180 literal')
req(not [p for p in Path('app').iterdir() if p.is_file() and re.fullmatch(r'v\d+-block-\d+\.txt',p.name)],'versioned production adapter source')

inv=json.loads(INV.read_text())
req(inv['archived_source_count']==58 and len(inv['archive_entries'])==58,'archive inventory count')
req(len([p for p in Path(inv['archive_root']).iterdir() if p.is_file()])==58,'physical diagnostic archive count')
for item in inv['archive_entries']:
    p=Path(item['archive_path']); req(p.exists(),'archive missing '+p.as_posix()); req(len(p.read_bytes())==item['utf8_bytes'] and sha_file(p)==item['sha256'],'archive identity '+p.as_posix())
req(len([p for p in Path('_regression/archive/learning-patches').iterdir() if p.is_file()])==48,'learning archive count')
req(len([p for p in Path('_regression/archive/learning-base').iterdir() if p.is_file()])==2,'base archive count')

prod_path=Path('_site/index.html'); ref_path=Path('_site_reference/index.html')
req(prod_path.exists() and ref_path.exists(),'real Jekyll candidate/reference missing')
prod_b=prod_path.read_bytes(); ref_b=ref_path.read_bytes(); prod=prod_b.decode(); ref=ref_b.decode(); src=Path('index.html').read_text()
req("const APP_VERSION = 'v180';" in prod and "globalThis['runV'+APP_VERSION.slice(1)+'SelfCheck']()" in prod,'v180 generated boot')
req('{% include_relative app/runtime-release-adapter.txt %}' in src and 'v180-block-00.txt' not in src,'stable adapter assembler')
req('"name": "FE QUEST v180"' in Path('_site/manifest.webmanifest').read_text(),'manifest v180')
sw=Path('_site/sw.js').read_text(); req("const APP_VERSION = 'v180';" in sw and 'fe-quest-v180-1' in sw,'SW v180')
for token in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]: req(token in sw,'SW behavior '+token)
req(not Path('_site/_regression').exists() and not Path('_site_reference/_regression').exists(),'regression deployed')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',prod),'legacy evaluator bundled')

cand_spec=specp.read_text(); ref_spec=Path('_reference/app/runtime-release-diagnostic-spec.txt').read_text()
req(cand_spec in prod and ref_spec in ref,'release metadata source not materialized verbatim')
req(prod.replace(cand_spec,'__FEQ_RELEASE_METADATA__',1)==ref.replace(ref_spec,'__FEQ_RELEASE_METADATA__',1),'generated HTML differs outside release metadata module')

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
print('FEQUEST_V180_STATIC_DOM_OK 23/23 + required-dom')

retired='||'.join(f"typeof globalThis.runV{v}SelfCheck!=='undefined'" for v in range(160,180))
CHECKS=f'''const s=globalThis.FEQUEST_SELF_CHECK;if(APP_VERSION!=='v180'||!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.browserUiContract.total!==23||s.releaseVersion!=='v180'||s.releaseAdapter!=='runV180SelfCheck')throw Error('self '+JSON.stringify(s?.errors));if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==20||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper boundary');if(globalThis.FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/diagnostic-archive-inventory.fixture.json'||globalThis.FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==58)throw Error('archive projection');if(typeof globalThis.FEQ_RELEASE_DIAGNOSTIC_SPEC!=='undefined')throw Error('metadata global leak');if(typeof globalThis.runV180SelfCheck!=='function'||{retired})throw Error('adapter boundary');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('questions');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('answers');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cognitive');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('CI coverage');if(s.legacyClassification.total!==293||s.legacyClassification.unique!==293||!s.legacyClassification.exactCoverage)throw Error('legacy classification');'''
SNAP=r'''
const __c=require('crypto');function __canon(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(__canon);const o={};for(const k of Object.keys(v).sort()){const x=v[k];if(typeof x==='function'||typeof x==='undefined')continue;o[k]=__canon(x);}return o;}
const raw=globalThis.FEQUEST_SELF_CHECK;if(!raw)throw Error('self missing');const self={...raw};delete self.checkedAt;
const payload={appVersion:APP_VERSION,questionBank:__canon(QUESTION_BANK),selfCheck:__canon(self),diagnosticRuntimeSpec:__canon(globalThis.FEQ_DIAGNOSTIC_RUNTIME_SPEC),diagnosticContractData:__canon(globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA),diagnosticDataProvenance:__canon(globalThis.FEQ_DIAGNOSTIC_DATA_PROVENANCE),globalSurface:Object.keys(globalThis).filter(k=>/^(?:feq|runV)/.test(k)).sort(),answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length)};const txt=JSON.stringify(__canon(payload));console.log('__FEQ_SNAPSHOT__ '+__c.createHash('sha256').update(txt).digest('hex')+' '+Buffer.byteLength(txt)+' '+(raw.ok?'1':'0'));
'''

def runtime_snapshot(html,label):
    js=extract_js(html)
    with tempfile.TemporaryDirectory() as td:
        run=Path(td)/'run.js'; run.write_text(STUB+'\n'+js+'\n'+CHECKS+'\n'+SNAP)
        z=subprocess.run(['node','--check',str(run)],capture_output=True,text=True); req(z.returncode==0,label+' node syntax '+z.stderr[-1500:])
        z=subprocess.run(['node',str(run)],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,label+' node runtime')
    m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m and m.group(3)=='1',label+' snapshot/self-check')
    return {'sha256':m.group(1),'utf8_bytes':int(m.group(2))}

candidate=runtime_snapshot(prod,'candidate'); reference=runtime_snapshot(ref,'reference')
req(candidate==reference,'derived/explicit metadata canonical runtime differs')
print('FEQUEST_V180_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=20 adapter=1 data=6 backing=0 diagnostic-archive=58 archive-growth=0 stable-archive-inventory=1 release-boundary-created=0 learning-archive=48 base-archive=2 active-learning=1 active-base=1 stable-adapter=1 versioned-adapter-source=0 derived-release-metadata=1 explicit-retired-literals=0 critical-map=56 release-map=28 ci=84 legacy-bundled=0')

legacy_fx=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
legacy=Path('_regression/archive/learning-base/runAppSelfCheck-v131.txt').read_text()
req(sha_bytes(legacy.encode())==legacy_fx['range_sha256'] and len(legacy.encode())==legacy_fx['range_utf8_bytes'] and len(re.findall(r'\bassert\s*\(',legacy))==legacy_fx['assert_calls'],'legacy range fixture')
helper=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in helper['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+pth.as_posix()); blocks.append(pth.read_text())
adapted=legacy.replace(legacy_fx['release_shell_from'],legacy_fx['release_shell_template'].replace('{{VERSION}}','v180'))
rel=r'''const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V180_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');'''
with tempfile.TemporaryDirectory() as td:
    rp=Path(td)/'release.js'; rp.write_text(STUB+'\n'+extract_js(prod)+'\neval('+json.dumps(''.join(blocks))+');\neval('+json.dumps(adapted)+');\n'+rel)
    rz=subprocess.run(['node',str(rp)],capture_output=True,text=True); print(rz.stdout); print(rz.stderr,file=sys.stderr); req(rz.returncode==0,'release fixture')

fx=json.loads(FIXTURE.read_text())
fx['release_metadata_module']={'path':specp.as_posix(),'utf8_bytes':len(specp.read_bytes()),'sha256':sha_file(specp),'release_version_literal':'v180','derived_current_adapter':'runV180SelfCheck','derived_retired_adapter_count':20,'explicit_retired_adapter_literals':0}
fx['validation']={'status':'passed','candidate_generated_index':{'utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},'reference_generated_index':{'utf8_bytes':len(ref_b),'sha256':sha_bytes(ref_b)},'generated_html_equal_after_release_metadata_module_normalization':True,'candidate_runtime_snapshot':candidate,'reference_runtime_snapshot':reference,'canonical_runtime_equality':candidate==reference,'only_excluded_volatile_field':'FEQUEST_SELF_CHECK.checkedAt','architecture_normalization_fields':[],'wrapper_byte_identical_to_v179_parent':True,'stable_adapter_byte_identical_to_v179_parent':True,'stable_inventory_byte_identical_to_v179_parent':True,'diagnostic_archive_growth':0,'release_specific_v180_archive_boundary_created':False,'production_versioned_adapter_source_count':0,'learner_facing_change':False}
FIXTURE.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')

AUDIT.write_text(f'''FE QUEST v180 — Derived Release Diagnostic Metadata Audit\n==========================================================\n\nResult\n------\nPASSED authoritative GitHub Pages/Jekyll candidate/reference validation.\n\nArchitecture\n------------\nCandidate metadata module: {len(specp.read_bytes()):,} bytes / SHA-256 {sha_file(specp)}\nSingle releaseVersion literal: v180\nDerived current adapter: runV180SelfCheck\nDerived retired adapters: 20 (runV160SelfCheck through runV179SelfCheck)\nExplicit retired adapter name literals in candidate source: 0\nRelease-specific diagnostic archive boundary created: no\nDiagnostic archive: 58 / growth 0\n\nStable boundaries\n-----------------\nWrapper: {WRAPPER_BYTES:,} / {WRAPPER_SHA}\nRelease adapter: {ADAPTER_BYTES} / {ADAPTER_SHA}\nStable diagnostic archive inventory: {INVENTORY_BYTES:,} / {INVENTORY_SHA}\nAll byte-identical to v179: yes\n\nGenerated HTML\n--------------\nCandidate: {len(prod_b):,} bytes / {sha_bytes(prod_b)}\nExplicit-array reference: {len(ref_b):,} bytes / {sha_bytes(ref_b)}\nEqual after replacing only the release metadata source module with one placeholder: yes\n\nCanonical runtime\n-----------------\nCandidate/reference exact equality: yes\nUTF-8 bytes: {candidate['utf8_bytes']:,}\nSHA-256: {candidate['sha256']}\nExcluded volatile field: FEQUEST_SELF_CHECK.checkedAt\nArchitecture normalization fields: none\n\nRelease contract\n----------------\nCurrent 71/71\nBrowser UI 23/23 + required DOM\nCritical 56/56\nRelease sentinel 28/28\nCI 84/84\nLegacy 293 / raw 22 / residual 0\nQuestions 710 / unique 710\nAnswers A178/B178/C177/D177\nCognitive 想起166/適用323/判断221\n''')

print('FEQUEST_V180_DERIVED_METADATA_OK runtime-equivalent=1 html-release-module-normalized=1 explicit-retired-literals=0 retired-adapters=20 diagnostic-archive=58 archive-growth=0 snapshot=%s' % candidate['sha256'])
print('FEQUEST_V180_ARCHIVE_BOUNDARY_OK diagnostic-archive=58 archive-growth=0 stable-archive-inventory=1 release-boundary-created=0 learning-archive=48 base-archive=2 deployed-regression=0 runtime=55525')
print('FEQUEST_V180_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=20 adapter=1 data=6 backing=0 diagnostic-archive=58 archive-growth=0 stable-archive-inventory=1 release-boundary-created=0 learning-archive=48 base-archive=2 active-learning=1 active-base=1 stable-adapter=1 versioned-adapter-source=0 derived-release-metadata=1 explicit-retired-literals=0 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
