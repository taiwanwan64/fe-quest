from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys
from v166_runtime_stub import STUB

def req(v,m):
    if not v: raise AssertionError(m)
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()

h=Path('_site/index.html').read_text(); src=Path('index.html').read_text(); manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v166';" in h and 'runV166SelfCheck();' in h,'version/boot')
req('"name": "FE QUEST v166"' in manifest,'manifest')
req("const APP_VERSION = 'v166';" in sw and "fe-quest-v166-1" in sw,'sw-version')
req(all(x in sw for x in ["GET_VERSION","networkWithTimeout","staleWhileRevalidate","request.headers.has('range')"]),'sw-behavior-parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',h),'legacy evaluator bundled')

fixture=json.loads(Path('_regression/production-source-archive-boundary-v166.fixture.json').read_text())
req(fixture['archived_source_count']==48 and len(fixture['archive_entries'])==48,'archive count')
req(fixture['archive_root']=='_regression/archive/diagnostics' and fixture['production_app_archival_residual_count']==0,'archive policy')
for e in fixture['archive_entries']:
    old=Path(e['old_path']); arc=Path(e['archive_path'])
    req(not old.exists(),f'old archival path still in app: {old}')
    req(arc.exists(),f'archived source missing: {arc}')
    req(arc.stat().st_size==e['utf8_bytes'] and sha_file(arc)==e['sha256'],f'archive identity: {arc}')
req(not Path('_site/_regression').exists(),'regression archive deployed')
for e in fixture['archive_entries']:
    req(not Path('_site',e['archive_path']).exists(),f'archived source deployed: {e["name"]}')

# App source boundary: historical diagnostic/versioned sources are gone.
residual=[]
for p in Path('app').iterdir():
    n=p.name
    if re.fullmatch(r'v(?:14[5-9]|15\d|16[0-5])-block-\d\d\.txt',n): residual.append(n)
    if re.fullmatch(r'v154-runtime-v\d+\.txt',n): residual.append(n)
    if re.fullmatch(r'runtime-.*-v\d+.*\.txt',n): residual.append(n)
req(not residual,'app archive residual: '+','.join(residual))
req(Path('app/v166-block-00.txt').exists(),'v166 adapter missing')
req('{% include_relative app/v166-block-00.txt %}' in src and 'app/v165-block-00.txt' not in src,'assembler adapter')
req('_regression/archive/diagnostics' not in src,'assembler references archive')
req(src.count('{% include_relative app/runtime-semantic-diagnostics.txt %}')==1,'single active runtime include')

rt=Path('app/runtime-semantic-diagnostics.txt')
req(rt.stat().st_size==55525 and sha_file(rt)=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50','active runtime identity')
req(fixture['active_runtime']['sha256']==sha_file(rt) and fixture['active_runtime']['utf8_bytes']==55525,'fixture runtime identity')
for key in ['stable_wrapper','release_adapter','assembler','manifest','service_worker']:
    d=fixture[key]; req(sha_file(d['path'])==d['sha256'],f'fixture identity {key}')

w=Path('app/runtime-diagnostic-wrapper.txt').read_text()
req("archiveBoundaryFixture:'_regression/production-source-archive-boundary-v166.fixture.json'" in w and "archiveRoot:'_regression/archive/diagnostics'" in w and 'archivedSourceCount:48' in w,'wrapper archive metadata')
req("retiredReleaseAdapters:Object.freeze(['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck','runV165SelfCheck'])" in w,'retired adapter inventory')
req("archivalRuntimeModule:'_regression/archive/diagnostics/runtime-current-diagnostics.txt'" in w,'archival runtime path')
req("archivalProjectionModule:'_regression/archive/diagnostics/runtime-semantic-projection-v158.txt'" in w,'archival projection path')
req("archivalPreludeModule:'_regression/archive/diagnostics/runtime-diagnostic-data-prelude-v157.txt'" in w and "archivalFinalizeModule:'_regression/archive/diagnostics/runtime-diagnostic-data-finalize-v159.txt'" in w,'archival data paths')
req(all(f'_regression/archive/diagnostics/runtime-semantic-diagnostics-v159-{i:02d}.txt' in w for i in range(9)),'archival runtime parts')

legacy=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text()); base=Path(legacy['source']).read_text(); a=base.index(legacy['start_marker']); b=base.index(legacy['end_marker'],a); legacy_src=base[a:b]
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
print('FEQUEST_V166_STATIC_DOM_OK 23/23 + required-dom')

scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I); js='\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{')); Path('/tmp/p.js').write_text(js); subprocess.run(['node','--check','/tmp/p.js'],check=True)
checks="""if(APP_VERSION!=='v166')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v166'||s.releaseAdapter!=='runV166SelfCheck')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==6||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV166SelfCheck!=='function'||typeof runV165SelfCheck!=='undefined'||typeof runV164SelfCheck!=='undefined'||typeof runV163SelfCheck!=='undefined'||typeof runV162SelfCheck!=='undefined'||typeof runV161SelfCheck!=='undefined'||typeof runV160SelfCheck!=='undefined')throw Error('adapters');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveBoundaryFixture!=='_regression/production-source-archive-boundary-v166.fixture.json'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archiveRoot!=='_regression/archive/diagnostics'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivedSourceCount!==48)throw Error('archive-spec');console.log('FEQUEST_V166_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 adapter=1 data=6 backing=0 archive=48 app-residual=0 critical-map=56 release-map=28 ci=84 legacy-bundled=0');"""
Path('/tmp/r.js').write_text(STUB+'\n'+js+'\n'+checks); z=subprocess.run(['node','/tmp/r.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'runtime')

# Release-only historical helpers are executed from the build-excluded archive using the immutable v154 manifest.
diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); blocks=[]
for item in diag['source_blocks']:
    pth=Path(item['path'])
    if not pth.exists(): pth=Path('_regression/archive/diagnostics')/pth.name
    req(pth.exists() and pth.stat().st_size==item['utf8_bytes'] and sha_file(pth)==item['sha256'],'release helper source '+str(pth))
    blocks.append(pth.read_text())
dsources=''.join(blocks); tmpl=legacy['release_shell_template']; adapted=legacy_src.replace(legacy['release_shell_from'],tmpl.replace('{{VERSION}}','v166'))
rel="""const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\\bassert\\s*\\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V166_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0 archive-source=8');"""
Path('/tmp/f.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel); q=subprocess.run(['node','/tmp/f.js'],capture_output=True,text=True); print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release runtime')
print('FEQUEST_V166_ARCHIVE_BOUNDARY_OK archive=48 app-residual=0 deployed-archive=0 runtime=55525')
print('FEQUEST_V166_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 adapter=1 data=6 backing=0 archive=48 app-residual=0 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
