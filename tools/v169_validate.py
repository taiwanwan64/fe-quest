from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys
from v169_runtime_stub import STUB

def req(v,m):
    if not v: raise AssertionError(m)
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()

h=Path('_site/index.html').read_text()
src=Path('index.html').read_text()
manifest=Path('_site/manifest.webmanifest').read_text()
sw=Path('_site/sw.js').read_text()

req("const APP_VERSION = 'v169';" in h and 'runV169SelfCheck();' in h,'version/boot')
req('"name": "FE QUEST v169"' in manifest,'manifest')
req("const APP_VERSION = 'v169';" in sw and "fe-quest-v169-1" in sw,'sw-version')
req(all(x in sw for x in ["GET_VERSION","networkWithTimeout","staleWhileRevalidate","request.headers.has('range')"]),'sw parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',h),'legacy evaluator bundled')

fixture=json.loads(Path('_regression/production-source-archive-boundary-v169.fixture.json').read_text())
req(fixture['version']=='v169' and fixture['archived_source_count']==51 and len(fixture['archive_entries'])==51,'archive count')
req(fixture['production_app_archival_residual_count']==0 and fixture['archive_root']=='_regression/archive/diagnostics','archive policy')
for e in fixture['archive_entries']:
    req(not Path(e['old_path']).exists(),f"old archival source exists {e['old_path']}")
    p=Path(e['archive_path']); req(p.exists(),f"archive missing {p}")
    req(p.stat().st_size==e['utf8_bytes'] and sha_file(p)==e['sha256'],f"archive identity {p}")
req(not Path('_site/_regression').exists(),'regression archive deployed')

residual=[]
for p in Path('app').iterdir():
    n=p.name
    if re.fullmatch(r'v(?:14[5-9]|15\d|16\d)-block-\d\d\.txt',n) and n!='v169-block-00.txt': residual.append(n)
    if re.fullmatch(r'v154-runtime-v\d+\.txt',n): residual.append(n)
    if re.fullmatch(r'runtime-.*-v\d+.*\.txt',n): residual.append(n)
req(not residual,'app archive residual '+','.join(residual))
req(Path('app/v169-block-00.txt').exists() and not Path('app/v168-block-00.txt').exists(),'adapter source boundary')
req('{% include_relative app/v169-block-00.txt %}' in src and 'app/v168-block-00.txt' not in src,'assembler adapter')

rt=Path('app/runtime-semantic-diagnostics.txt')
req(rt.stat().st_size==55525 and sha_file(rt)=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50','runtime identity')
for key in ['stable_wrapper','release_adapter','assembler','manifest','service_worker','patch_chain_fixture','patch_effect_fixture','equivalence_plan_fixture']:
    d=fixture[key]; req(sha_file(d['path'])==d['sha256'],f'fixture identity {key}')

w=Path('app/runtime-diagnostic-wrapper.txt').read_text()
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v169.fixture.json'" in w and 'archivedSourceCount:51' in w,'wrapper archive metadata')
req("retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck','runV166SelfCheck','runV167SelfCheck','runV168SelfCheck'])" in w,'retired adapter inventory')

patch=json.loads(Path('_regression/production-patch-chain-v167.fixture.json').read_text())
req(patch['patch_range']['version_count']==13 and patch['patch_range']['block_count']==47,'patch inventory count')
rows=patch['blocks']; ordered=[r['path'] for r in rows]; concat=b''
for r in rows:
    p=Path(r['path']); req(p.exists(),f'patch missing {p}')
    req(p.stat().st_size==r['utf8_bytes'] and sha_file(p)==r['sha256'],f'patch identity {p}')
    req(src.count(f'{{% include_relative {r["path"]} %}}')==1,f'patch include {p}')
    concat+=p.read_bytes()
req(len(concat)==405723 and hashlib.sha256(concat).hexdigest()=='6b06aae81ef5f92f59d65afa52c0e7c5288124265fb1f48d049526852708ebb8','patch concat')
req(re.findall(r'\{%\s*include_relative\s+(app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt)\s*%\}',src)==ordered,'patch exact assembly')

effect=json.loads(Path('_regression/production-patch-effects-v168.fixture.json').read_text())
s=effect['summary']
req((s['dependency_edges'],s['dependency_provider_blocks'],s['effect_marker_blocks'],s['rewrite_review_blocks'],s['patch_local_leaf_review_blocks'],s['equivalence_test_candidates'],s['automatic_removal_candidates'])==(11,11,40,6,7,13,0),'v168 effect evidence')

plan=json.loads(Path('_regression/production-equivalence-plan-v169.fixture.json').read_text())
req(plan['version']=='v169' and plan['policy']=='counterfactual-runtime-snapshot-no-production-removal','equivalence plan')
req(plan['single_candidate_count']==13 and plan['variant_count']==15,'equivalence plan counts')
req(plan['candidate_families']['v132_leaf_blocks']==[f'app/v132-block-{i:02d}.txt' for i in range(7)],'leaf candidates')
req(plan['candidate_families']['quality_write_chain_blocks']==['app/v135-block-00.txt','app/v139-block-00.txt','app/v139-block-01.txt','app/v141-block-00.txt','app/v142-block-00.txt','app/v143-block-00.txt'],'quality candidates')

result=json.loads(Path('_regression/production-equivalence-results-v169.fixture.json').read_text())
req(result['version']=='v169' and result['policy']=='measured-counterfactual-runtime-snapshot-no-production-removal','equivalence results')
req(result['plan']['sha256']==sha_file('_regression/production-equivalence-plan-v169.fixture.json'),'result plan identity')
req(result['baseline']['runtime_ok'] and result['baseline']['syntax_ok'],'baseline equivalence runtime')
req(len(result['variants'])==15 and result['summary']['single_candidate_count']==13,'result counts')
req(result['summary']['automatic_removal_authorized'] is False and result['decision']['automatic_removal_authorized'] is False,'no automatic removal')
ids={r['id'] for r in result['variants']}
req(ids=={v['id'] for v in plan['variants']},'variant set')
for r in result['variants']:
    req(r['baseline_snapshot_sha256']==result['baseline']['snapshot_sha256'],'baseline snapshot linkage')

changed=subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()
forbidden=[p for p in changed if p=='app/base-v131.html' or re.fullmatch(r'app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt',p) or p=='app/runtime-semantic-diagnostics.txt']
req(not forbidden,'equivalence-preflight source changed: '+','.join(forbidden))

class P(HTMLParser):
    def __init__(self): super().__init__(); self.ids=set(); self.classes=[]
    def handle_starttag(self,t,a):
        d=dict(a)
        if d.get('id'): self.ids.add(d['id'])
        self.classes += d.get('class','').split()
p=P(); p.feed(h)
ids_req=['home','map','weak','problems','plan','coverage','mock','lesson','trace','settingsBtn','bMockResultList','startDiagnostic','installCard','pwaHealthCard','aiDrawer','aiFab','aiBackdrop','toast','offlinePill','planFocusCard','planDetailsToggle','analyticsDetailsToggle','weakTopAction','rightDailyAction','rightDailyProgress','quizSubmit','subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']
req(all(x in p.ids for x in ids_req),'dom ids')
for c in ['result-detail-fold','result-more-actions','sidebar','mock-history-details','mock-secondary-details','weak-detail-fold','coverage-summary-compact','b-mode-switcher','analytics-priority-card','data-maintenance-fold','recovery-fold','quiz-actions','ai-header-btn']:
    req(c in p.classes,'dom class '+c)
print('FEQUEST_V169_STATIC_DOM_OK 23/23 + required-dom')

scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
js='\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))
Path('/tmp/v169-prod.js').write_text(js)
subprocess.run(['node','--check','/tmp/v169-prod.js'],check=True)
checks=r"""if(APP_VERSION!=='v169')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v169'||s.releaseAdapter!=='runV169SelfCheck')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==9||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV169SelfCheck!=='function'||typeof runV168SelfCheck!=='undefined'||typeof runV167SelfCheck!=='undefined'||typeof runV166SelfCheck!=='undefined'||typeof runV165SelfCheck!=='undefined'||typeof runV164SelfCheck!=='undefined'||typeof runV163SelfCheck!=='undefined'||typeof runV162SelfCheck!=='undefined'||typeof runV161SelfCheck!=='undefined'||typeof runV160SelfCheck!=='undefined')throw Error('adapters');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/production-source-archive-boundary-v169.fixture.json'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveRoot!=='_regression/archive/diagnostics'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==51)throw Error('archive');console.log('FEQUEST_V169_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=9 adapter=1 data=6 backing=0 archive=51 app-residual=0 patches=47 critical-map=56 release-map=28 ci=84 legacy-bundled=0');"""
Path('/tmp/v169-run.js').write_text(STUB+'\n'+js+'\n'+checks)
z=subprocess.run(['node','/tmp/v169-run.js'],capture_output=True,text=True)
print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'production runtime')

legacy=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
base=Path(legacy['source']).read_text(); a=base.index(legacy['start_marker']); b=base.index(legacy['end_marker'],a); legacy_src=base[a:b]
req(sha_text(legacy_src)==legacy['range_sha256'] and len(legacy_src.encode())==49657 and len(re.findall(r'\bassert\s*\(',legacy_src))==293,'legacy fixture')
diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in diag['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and pth.stat().st_size==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper '+str(pth))
    blocks.append(pth.read_text())
dsources=''.join(blocks)
tmpl=legacy['release_shell_template']; adapted=legacy_src.replace(legacy['release_shell_from'],tmpl.replace('{{VERSION}}','v169'))
rel=r"""const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V169_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');"""
Path('/tmp/v169-release.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel)
q=subprocess.run(['node','/tmp/v169-release.js'],capture_output=True,text=True)
print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release runtime')

summary=result['summary']
print('FEQUEST_V169_EQUIVALENCE_RESULT '
      f"single=13 variants=15 equivalent={summary['equivalent_variants']} non-equivalent={summary['non_equivalent_variants']} "
      f"runtime-errors={summary['runtime_error_variants']} v132-group={int(summary['v132_leaf_group_equivalent'])} "
      f"quality-group={int(summary['quality_write_group_equivalent'])} automatic-removal=0")
print('FEQUEST_V169_PATCH_INVENTORY_OK versions=13 blocks=47 assembler=47 base=1 unchanged-learning-source=1')
print('FEQUEST_V169_ARCHIVE_BOUNDARY_OK archive=51 app-residual=0 deployed-archive=0 runtime=55525')
print('FEQUEST_V169_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=9 adapter=1 data=6 backing=0 archive=51 app-residual=0 patches=47 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
