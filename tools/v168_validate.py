from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys
from v168_runtime_stub import STUB
from v168_effect_lib import analyze_patch_effects

def req(v,m):
    if not v: raise AssertionError(m)
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()

h=Path('_site/index.html').read_text()
src=Path('index.html').read_text()
manifest=Path('_site/manifest.webmanifest').read_text()
sw=Path('_site/sw.js').read_text()

req("const APP_VERSION = 'v168';" in h and 'runV168SelfCheck();' in h,'version/boot')
req('"name": "FE QUEST v168"' in manifest,'manifest')
req("const APP_VERSION = 'v168';" in sw and "fe-quest-v168-1" in sw,'sw-version')
req(all(x in sw for x in ["GET_VERSION","networkWithTimeout","staleWhileRevalidate","request.headers.has('range')"]),'sw-behavior-parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',h),'legacy evaluator bundled')

fixture=json.loads(Path('_regression/production-source-archive-boundary-v168.fixture.json').read_text())
req(fixture['version']=='v168' and fixture['archived_source_count']==50 and len(fixture['archive_entries'])==50,'archive count')
req(fixture['archive_root']=='_regression/archive/diagnostics' and fixture['production_app_archival_residual_count']==0,'archive policy')
for e in fixture['archive_entries']:
    old=Path(e['old_path']); arc=Path(e['archive_path'])
    req(not old.exists(),f'old archival path still in app: {old}')
    req(arc.exists(),f'archived source missing: {arc}')
    req(arc.stat().st_size==e['utf8_bytes'] and sha_file(arc)==e['sha256'],f'archive identity: {arc}')
req(not Path('_site/_regression').exists(),'regression archive deployed')
for e in fixture['archive_entries']:
    req(not Path('_site',e['archive_path']).exists(),f'archived source deployed: {e["name"]}')

residual=[]
for p in Path('app').iterdir():
    n=p.name
    if re.fullmatch(r'v(?:14[5-9]|15\d|16\d)-block-\d\d\.txt',n) and n!='v168-block-00.txt': residual.append(n)
    if re.fullmatch(r'v154-runtime-v\d+\.txt',n): residual.append(n)
    if re.fullmatch(r'runtime-.*-v\d+.*\.txt',n): residual.append(n)
req(not residual,'app archive residual: '+','.join(residual))
req(Path('app/v168-block-00.txt').exists(),'v168 adapter missing')
req(not Path('app/v167-block-00.txt').exists(),'v167 adapter still in app')
req('{% include_relative app/v168-block-00.txt %}' in src and 'app/v167-block-00.txt' not in src,'assembler adapter')
req('_regression/archive/diagnostics' not in src,'assembler references archive')
req(src.count('{% include_relative app/runtime-semantic-diagnostics.txt %}')==1,'single active runtime include')

rt=Path('app/runtime-semantic-diagnostics.txt')
req(rt.stat().st_size==55525 and sha_file(rt)=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50','active runtime identity')
req(fixture['active_runtime']['sha256']==sha_file(rt) and fixture['active_runtime']['utf8_bytes']==55525,'fixture runtime identity')
for key in ['stable_wrapper','release_adapter','assembler','manifest','service_worker','patch_chain_fixture','patch_effect_fixture']:
    d=fixture[key]; req(sha_file(d['path'])==d['sha256'],f'fixture identity {key}')

w=Path('app/runtime-diagnostic-wrapper.txt').read_text()
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v168.fixture.json'" in w and "archiveRoot:'_regression/archive/diagnostics'" in w and 'archivedSourceCount:50' in w,'wrapper archive metadata')
req("retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck','runV166SelfCheck','runV167SelfCheck'])" in w,'retired adapter inventory')
req("archivalRuntimeModule:'_regression/archive/diagnostics/runtime-current-diagnostics.txt'" in w,'archival runtime path')
req("archivalProjectionModule:'_regression/archive/diagnostics/runtime-semantic-projection-v158.txt'" in w,'archival projection path')
req("archivalPreludeModule:'_regression/archive/diagnostics/runtime-diagnostic-data-prelude-v157.txt'" in w and "archivalFinalizeModule:'_regression/archive/diagnostics/runtime-diagnostic-data-finalize-v159.txt'" in w,'archival data paths')
req(all(f'_regression/archive/diagnostics/runtime-semantic-diagnostics-v159-{i:02d}.txt' in w for i in range(9)),'archival runtime parts')

patch=json.loads(Path('_regression/production-patch-chain-v167.fixture.json').read_text())
req(patch['version']=='v167' and patch['scope']=='active-learning-patch-chain-v132-v144','patch fixture identity')
req(patch['policy']=='inventory-only-no-consolidation','patch policy')
req(patch['patch_range']['version_count']==13 and patch['patch_range']['block_count']==47,'patch counts')
expected_counts={'v132':8,'v133':6,'v134':7,'v135':1,'v136':8,'v137':1,'v138':9,'v139':2,'v140':1,'v141':1,'v142':1,'v143':1,'v144':1}
req(patch['patch_range']['expected_block_counts']==expected_counts,'patch count map')
rows=patch['blocks']; req(len(rows)==47,'patch row count')
ordered=[r['path'] for r in rows]
req(ordered==patch['assembler']['assembly_order'],'patch assembly order fixture')
concat=b''
for r in rows:
    p=Path(r['path']); req(p.exists(),f'patch block missing {p}')
    req(p.stat().st_size==r['utf8_bytes'] and sha_file(p)==r['sha256'],f'patch block identity {p}')
    inc=f'{{% include_relative {r["path"]} %}}'
    req(src.count(inc)==1,f'patch include cardinality {p}')
    concat+=p.read_bytes()
req(len(concat)==patch['patch_range']['concat_utf8_bytes'] and hashlib.sha256(concat).hexdigest()==patch['patch_range']['concat_sha256'],'patch concat identity')
incs=re.findall(r'\{%\s*include_relative\s+(app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt)\s*%\}',src)
req(incs==ordered,'patch chain exact assembler coverage')
req(sha_file(patch['base']['path'])==patch['base']['sha256'] and Path(patch['base']['path']).stat().st_size==patch['base']['utf8_bytes'],'base source identity')

effect=json.loads(Path('_regression/production-patch-effects-v168.fixture.json').read_text())
req(effect['version']=='v168' and effect['scope']=='active-learning-patch-chain-v132-v144','effect fixture identity')
req(effect['policy']=='analysis-only-no-consolidation-no-automatic-removal','effect policy')
req(effect['source_inventory']['path']=='_regression/production-patch-chain-v167.fixture.json' and effect['source_inventory']['sha256']==sha_file(effect['source_inventory']['path']),'effect source inventory identity')
expected=analyze_patch_effects(patch)
for key in ['analysis_method','summary','dependency_edges','definition_chains','write_chains','blocks']:
    req(effect[key]==expected[key],f'effect analysis reproducibility {key}')
s=effect['summary']
req(s['block_count']==47 and s['version_count']==13 and s['automatic_removal_candidates']==0,'effect summary counts')
req(all(b['automatic_removal_candidate'] is False for b in effect['blocks']),'automatic removal flag')
audit=Path('audits/PATCH_EFFECT_DEPENDENCY_AUDIT_v168.txt').read_text()
for needle in [
    f"Patch-to-patch dependency edges: {s['dependency_edges']}",
    f"Dependency provider blocks: {s['dependency_provider_blocks']}",
    f"Effect-marker-bearing blocks: {s['effect_marker_blocks']}",
    f"Equivalence-test candidates: {s['equivalence_test_candidates']}",
    "Automatic removal candidates: 0",
    "does not authorize removal of any block",
]:
    req(needle in audit,'effect audit marker '+needle)

changed=subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()
forbidden=[p for p in changed if p=='app/base-v131.html' or re.fullmatch(r'app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt',p) or p=='app/runtime-semantic-diagnostics.txt']
req(not forbidden,'analysis-only source changed: '+','.join(forbidden))

legacy=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text())
base=Path(legacy['source']).read_text(); a=base.index(legacy['start_marker']); b=base.index(legacy['end_marker'],a); legacy_src=base[a:b]
req(sha_text(legacy_src)==legacy['range_sha256'] and len(legacy_src.encode())==49657 and len(re.findall(r'\bassert\s*\(',legacy_src))==293,'legacy fixture')

class P(HTMLParser):
    def __init__(s): super().__init__(); s.ids=set(); s.classes=[]
    def handle_starttag(s,t,a):
        d=dict(a)
        if d.get('id'): s.ids.add(d['id'])
        s.classes += d.get('class','').split()
p=P(); p.feed(h)
ids=['home','map','weak','problems','plan','coverage','mock','lesson','trace','settingsBtn','bMockResultList','startDiagnostic','installCard','pwaHealthCard','aiDrawer','aiFab','aiBackdrop','toast','offlinePill','planFocusCard','planDetailsToggle','analyticsDetailsToggle','weakTopAction','rightDailyAction','rightDailyProgress','quizSubmit','subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']
req(all(x in p.ids for x in ids),'dom ids')
for c in ['result-detail-fold','result-more-actions','sidebar','mock-history-details','mock-secondary-details','weak-detail-fold','coverage-summary-compact','b-mode-switcher','analytics-priority-card','data-maintenance-fold','recovery-fold','quiz-actions','ai-header-btn']:
    req(c in p.classes,'dom class '+c)
visible=re.sub(r'<(?:script|style|template)\b[^>]*>.*?</(?:script|style|template)>','',h,flags=re.S|re.I)
req('今日のクエスト' not in visible and 'クエスト完了' not in visible,'legacy copy')
print('FEQUEST_V168_STATIC_DOM_OK 23/23 + required-dom')

scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
js='\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))
Path('/tmp/p.js').write_text(js)
subprocess.run(['node','--check','/tmp/p.js'],check=True)
checks="""if(APP_VERSION!=='v168')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v168'||s.releaseAdapter!=='runV168SelfCheck')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==8||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV168SelfCheck!=='function'||typeof runV167SelfCheck!=='undefined'||typeof runV166SelfCheck!=='undefined'||typeof runV165SelfCheck!=='undefined'||typeof runV164SelfCheck!=='undefined'||typeof runV163SelfCheck!=='undefined'||typeof runV162SelfCheck!=='undefined'||typeof runV161SelfCheck!=='undefined'||typeof runV160SelfCheck!=='undefined')throw Error('adapters');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/production-source-archive-boundary-v168.fixture.json'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveRoot!=='_regression/archive/diagnostics'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==50)throw Error('archive-spec');console.log('FEQUEST_V168_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=8 adapter=1 data=6 backing=0 archive=50 app-residual=0 patches=47 critical-map=56 release-map=28 ci=84 legacy-bundled=0');"""
Path('/tmp/r.js').write_text(STUB+'\n'+js+'\n'+checks)
z=subprocess.run(['node','/tmp/r.js'],capture_output=True,text=True)
print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'runtime')

diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in diag['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and pth.stat().st_size==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper source '+str(pth))
    blocks.append(pth.read_text())
dsources=''.join(blocks)
tmpl=legacy['release_shell_template']; adapted=legacy_src.replace(legacy['release_shell_from'],tmpl.replace('{{VERSION}}','v168'))
rel="""const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\\bassert\\s*\\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V168_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');"""
Path('/tmp/f.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel)
q=subprocess.run(['node','/tmp/f.js'],capture_output=True,text=True)
print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release runtime')

print(
    'FEQUEST_V168_PATCH_EFFECTS_OK '
    f"versions=13 blocks=47 edges={s['dependency_edges']} providers={s['dependency_provider_blocks']} "
    f"effects={s['effect_marker_blocks']} rewrite-review={s['rewrite_review_blocks']} "
    f"leaf-review={s['patch_local_leaf_review_blocks']} equivalence-candidates={s['equivalence_test_candidates']} automatic-removal=0"
)
print('FEQUEST_V168_PATCH_INVENTORY_OK versions=13 blocks=47 assembler=47 base=1 unchanged-learning-source=1')
print('FEQUEST_V168_ARCHIVE_BOUNDARY_OK archive=50 app-residual=0 deployed-archive=0 runtime=55525')
print('FEQUEST_V168_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 retired-adapter-inventory=8 adapter=1 data=6 backing=0 archive=50 app-residual=0 patches=47 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
