from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys, tempfile
from v170_runtime_stub import STUB

def req(v,m):
    if not v: raise AssertionError(m)
def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(Path(p).read_bytes())
def ident(p,**extra):
    p=Path(p); d={'path':p.as_posix(),'utf8_bytes':len(p.read_bytes()),'sha256':sha_file(p)}; d.update(extra); return d
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()

def extract_js(h):
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
    return '\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))

prod_path=Path('_site/index.html'); ref_path=Path('_site_reference/index.html')
req(prod_path.exists() and ref_path.exists(),'both Jekyll builds required')
prod_b=prod_path.read_bytes(); ref_b=ref_path.read_bytes()
req(prod_b==ref_b,'compact and expanded Jekyll output differ')
prod=prod_b.decode(); ref=ref_b.decode(); src=Path('index.html').read_text(); ref_src=Path('_v170_reference_src/index.html').read_text()
manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v170';" in prod and 'runV170SelfCheck();' in prod,'version/boot')
req('"name": "FE QUEST v170"' in manifest,'manifest')
req("const APP_VERSION = 'v170';" in sw and "fe-quest-v170-1" in sw,'sw-version')
req(all(x in sw for x in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]),'sw parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',prod),'legacy evaluator bundled')

patch=json.loads(Path('_regression/production-patch-chain-v167.fixture.json').read_text())
order=patch['assembler']['assembly_order']; req(len(order)==47,'patch inventory')
concat=b''
for r in patch['blocks']:
    p=Path(r['path']); req(p.exists(),'patch missing '+r['path'])
    req(len(p.read_bytes())==r['utf8_bytes'] and sha_file(p)==r['sha256'],'patch identity '+r['path'])
    concat+=p.read_bytes()
req(len(concat)==405723 and sha_bytes(concat)=='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8','patch concat identity')
bundle=Path('app/learning-patches-v170.txt')
req(bundle.read_bytes()==concat,'bundle is not exact patch concatenation')
req(src.count('{% include_relative app/learning-patches-v170.txt %}')==1,'production bundle include')
req(not re.search(r'\{%\s*include_relative\s+app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt\s*%\}',src),'production expanded include remains')
ref_includes=re.findall(r'\{%\s*include_relative\s+(app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt)\s*%\}',ref_src)
req(ref_includes==order,'reference exact 47 assembly order')

comp_path=Path('_regression/production-learning-compaction-v170.fixture.json')
comp=json.loads(comp_path.read_text())
req(comp['version']=='v170' and comp['source_fragments']['physical_block_count']==47,'compaction fixture')
req(comp['learning_bundle']['sha256']==sha_file(bundle) and comp['learning_bundle']['utf8_bytes']==len(concat),'bundle fixture identity')
req(comp['assembler']['production_learning_include_count']==1 and comp['assembler']['expanded_reference_learning_include_count']==47,'assembler compaction counts')

fixture_path=Path('_regression/production-source-archive-boundary-v170.fixture.json')
fixture=json.loads(fixture_path.read_text())
req(fixture['version']=='v170' and fixture['archived_source_count']==52 and len(fixture['archive_entries'])==52,'archive count')
req(fixture['production_app_archival_residual_count']==0 and fixture['archive_root']=='_regression/archive/diagnostics','archive policy')
for e in fixture['archive_entries']:
    req(not Path(e['old_path']).exists(),'old archival source exists '+e['old_path'])
    p=Path(e['archive_path']); req(p.exists(),'archive missing '+str(p))
    req(len(p.read_bytes())==e['utf8_bytes'] and sha_file(p)==e['sha256'],'archive identity '+str(p))
req(len([p for p in Path('_regression/archive/diagnostics').iterdir() if p.is_file()])==52,'physical archive count')
req(not Path('_site/_regression').exists() and not Path('_site_reference/_regression').exists(),'regression archive deployed')

residual=[]
for p in Path('app').iterdir():
    n=p.name
    if re.fullmatch(r'v(?:14[5-9]|15\d|16\d|17\d)-block-\d\d\.txt',n) and n!='v170-block-00.txt': residual.append(n)
    if re.fullmatch(r'v154-runtime-v\d+\.txt',n): residual.append(n)
    if re.fullmatch(r'runtime-.*-v\d+.*\.txt',n): residual.append(n)
req(not residual,'app archive residual '+','.join(residual))
req(Path('app/v170-block-00.txt').exists() and not Path('app/v169-block-00.txt').exists(),'adapter source boundary')
req('{% include_relative app/v170-block-00.txt %}' in src and 'app/v169-block-00.txt' not in src,'assembler adapter')

rt=Path('app/runtime-semantic-diagnostics.txt')
req(len(rt.read_bytes())==55525 and sha_file(rt)=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50','runtime identity')
w=Path('app/runtime-diagnostic-wrapper.txt').read_text()
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v170.fixture.json'" in w and 'archivedSourceCount:52' in w,'wrapper archive metadata')
req("'runV169SelfCheck'" in w and 'retiredAdapters.length===10' in w and 'a.retiredAdapters===10' in w,'retired adapter inventory')

changed=subprocess.check_output(['git','diff','--name-only','origin/main','--','app/base-v131.html',*order,'app/runtime-semantic-diagnostics.txt'],text=True).splitlines()
req(not changed,'protected learning source changed: '+','.join(changed))
req(sha_file('app/base-v131.html')=='1222c7ac30b6a227f0b5bfd4d7b5a4c380a18d47d55171cfaaeaa3c09dbfbd5a','base identity')

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
print('FEQUEST_V170_STATIC_DOM_OK 23/23 + required-dom')

SNAPSHOT_JS=r'''
const __feqCrypto=require('crypto');
function __feqCanon(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(__feqCanon);const o={};for(const k of Object.keys(v).sort()){const x=v[k];if(typeof x==='function'||typeof x==='undefined')continue;o[k]=__feqCanon(x);}return o;}
const __feqSelf=globalThis.FEQUEST_SELF_CHECK;if(!__feqSelf)throw new Error('snapshot self-check missing');
const __feqPayload={appVersion:APP_VERSION,questionBank:__feqCanon(QUESTION_BANK),selfCheck:__feqCanon(__feqSelf),diagnosticContractData:__feqCanon(globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA),diagnosticDataProvenance:__feqCanon(globalThis.FEQ_DIAGNOSTIC_DATA_PROVENANCE),globalSurface:Object.keys(globalThis).filter(k=>/^(?:feq|runV)/.test(k)).sort(),answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length)};
const __feqRaw=JSON.stringify(__feqCanon(__feqPayload));console.log('__FEQ_SNAPSHOT__ '+__feqCrypto.createHash('sha256').update(__feqRaw).digest('hex')+' '+Buffer.byteLength(__feqRaw,'utf8')+' '+(__feqSelf.ok?'1':'0'));
'''

def snapshot(label,h):
    js=extract_js(h)
    with tempfile.TemporaryDirectory() as td:
        pth=Path(td)/f'{label}.js'; pth.write_text(STUB+'\n'+js+'\n'+SNAPSHOT_JS)
        z=subprocess.run(['node','--check',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' syntax '+z.stderr[-500:])
        z=subprocess.run(['node',str(pth)],capture_output=True,text=True); req(z.returncode==0,label+' runtime '+z.stderr[-1000:])
    m=re.search(r'__FEQ_SNAPSHOT__ ([0-9a-f]{64}) (\d+) ([01])',z.stdout); req(m,label+' snapshot marker')
    req(m.group(3)=='1',label+' self-check')
    return {'sha256':m.group(1),'utf8_bytes':int(m.group(2))}

prod_snap=snapshot('compact',prod); ref_snap=snapshot('expanded-reference',ref)
req(prod_snap==ref_snap,'canonical runtime snapshot differs')

js=extract_js(prod)
retired='||'.join(f"typeof runV{v}SelfCheck!=='undefined'" for v in range(160,170))
checks=f"""if(APP_VERSION!=='v170')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v170'||s.releaseAdapter!=='runV170SelfCheck')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==10||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV170SelfCheck!=='function'||{retired})throw Error('adapters');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/production-source-archive-boundary-v170.fixture.json'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveRoot!=='_regression/archive/diagnostics'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==52)throw Error('archive');console.log('FEQUEST_V170_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=10 adapter=1 data=6 backing=0 archive=52 app-residual=0 patch-sources=47 learning-modules=1 critical-map=56 release-map=28 ci=84 legacy-bundled=0');"""
Path('/tmp/v170-run.js').write_text(STUB+'\n'+js+'\n'+checks)
z=subprocess.run(['node','/tmp/v170-run.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'production runtime')

legacy=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
base=Path(legacy['source']).read_text(); a=base.index(legacy['start_marker']); b=base.index(legacy['end_marker'],a); legacy_src=base[a:b]
req(sha_text(legacy_src)==legacy['range_sha256'] and len(legacy_src.encode())==49657 and len(re.findall(r'\bassert\s*\(',legacy_src))==293,'legacy fixture')
diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in diag['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and len(pth.read_bytes())==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+str(pth))
    blocks.append(pth.read_text())
dsources=''.join(blocks); tmpl=legacy['release_shell_template']; adapted=legacy_src.replace(legacy['release_shell_from'],tmpl.replace('{{VERSION}}','v170'))
rel=r"""const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V170_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');"""
Path('/tmp/v170-release.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel)
q=subprocess.run(['node','/tmp/v170-release.js'],capture_output=True,text=True); print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release runtime')

comp['validation']={
  'status':'passed','built_html_byte_exact':True,'canonical_runtime_snapshot_equal':True,
  'compact_build':{'path':'_site/index.html','utf8_bytes':len(prod_b),'sha256':sha_bytes(prod_b)},
  'expanded_reference_build':{'path':'_site_reference/index.html','utf8_bytes':len(ref_b),'sha256':sha_bytes(ref_b)},
  'canonical_runtime_snapshot':prod_snap,
  'source_fragments_unchanged':True,'semantic_runtime_unchanged':True,'automatic_behavior_removal_authorized':False
}
comp_path.write_text(json.dumps(comp,ensure_ascii=False,indent=2)+'\n')
fixture['compaction_fixture']=ident(comp_path)
fixture_path.write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=Path('audits/LEARNING_COMPACTION_AUDIT_v170.txt')
audit.write_text(f'''FE QUEST v170 — Learning Patch Compaction Equivalence Audit
================================================================

Purpose
-------
Materialize the unchanged v132-v144 learning patch chain as one byte-exact production bundle, while retaining all 47 original source fragments as regression evidence.

Source identity
---------------
Base: app/base-v131.html / 3,041,328 bytes / SHA-256 1222c7ac30b6a227f0b5bfd4d7b5a4c380a18d47d55171cfaaeaa3c09dbfbd5a
Original patch fragments: 47 across v132-v144
Original patch concat: 405,723 bytes / SHA-256 6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8
New production learning bundle: app/learning-patches-v170.txt / {len(concat):,} bytes / SHA-256 {sha_bytes(concat)}
Bundle materialization: exact byte concatenation in the canonical v167 assembly order

Assembler equivalence
---------------------
Production assembler learning includes: 1
Expanded reference assembler learning includes: 47
Production Jekyll index bytes: {len(prod_b):,}
Production Jekyll index SHA-256: {sha_bytes(prod_b)}
Expanded-reference Jekyll index bytes: {len(ref_b):,}
Expanded-reference Jekyll index SHA-256: {sha_bytes(ref_b)}
Byte-exact generated HTML equality: true

Canonical runtime equivalence
-----------------------------
Snapshot SHA-256: {prod_snap['sha256']}
Snapshot UTF-8 bytes: {prod_snap['utf8_bytes']:,}
Compact/reference runtime snapshot equality: true
Current contract: 71/71
Browser UI contract: 23/23 + required DOM
Question bank: 710 / 710 unique IDs
Answer distribution: A178 / B178 / C177 / D177
Cognitive distribution: 想起166 / 適用323 / 判断221
CI declarative coverage: 84/84
Legacy regression: 293 assertions / raw 22 / residual 0

Decision
--------
The single learning bundle is authorized as the production assembly source because both real Jekyll output and canonical runtime state are identical to the expanded 47-include reference. The original 47 v132-v144 files remain unchanged in the repository and continue to define the source-level provenance contract. No learner behavior or question content is removed.
''')

print(f"FEQUEST_V170_COMPACTION_EQUIVALENCE_OK html-byte-exact=1 runtime-snapshot=1 fragments=47 modules=1 bundle=405723 snapshot={prod_snap['sha256']}")
print('FEQUEST_V170_PATCH_INVENTORY_OK versions=13 source-fragments=47 production-learning-modules=1 unchanged-learning-source=1')
print('FEQUEST_V170_ARCHIVE_BOUNDARY_OK archive=52 app-residual=0 deployed-archive=0 runtime=55525')
print('FEQUEST_V170_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=10 adapter=1 data=6 backing=0 archive=52 app-residual=0 patch-sources=47 learning-modules=1 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
