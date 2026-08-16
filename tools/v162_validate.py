from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,subprocess,sys
from v162_runtime_stub import STUB

def req(v,m):
    if not v: raise AssertionError(m)
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()

h=Path('_site/index.html').read_text()
manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v162';" in h and 'runV162SelfCheck();' in h,'version/boot')
req('"name": "FE QUEST v162"' in manifest,'manifest')
req("const APP_VERSION = 'v162';" in sw and "fe-quest-v162-1" in sw,'sw')
req(all(x in sw for x in ["GET_VERSION","networkWithTimeout","staleWhileRevalidate","request.headers.has('range')"]),'sw-behavior-parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',h),'legacy-evaluator')
old_data=['V148_EXTRA_UI_CONTRACTS','V149_LEGACY_ASSERT_INVENTORY','V150_CI_ONLY_SENTINEL_GROUPS','V150_CRITICAL_CURRICULUM_SPEC','V151_RELEASE_SENTINEL_SPEC','V152_LEGACY_FIXTURE_SPEC']
req(all(x not in h for x in old_data),'old-data-token')
retired_wrapper=['v159SemanticRuntimeBoundaryAudit','v159DiagnosticDataBoundaryAudit','v159ReplacementChecks','v159AdditionalCurrentChecks','v159EvaluateCurrentContract','runV159SelfCheck']
for name in retired_wrapper:
    req(not re.search(r'(?m)^\s*function\s+'+re.escape(name)+r'\s*\(',h),'retired-wrapper-declaration:'+name)

src=Path('index.html').read_text()
req('runtime-diagnostic-wrapper.txt' in src and 'v162-block-00.txt' in src,'assembler-wrapper')
req('runtime-diagnostic-data-prelude.txt' in src and 'runtime-diagnostic-data-finalize.txt' in src and 'runtime-diagnostic-data-prelude-v157.txt' not in src and 'runtime-diagnostic-data-finalize-v159.txt' not in src,'assembler-stable-data-modules')
req('app/v159-block-00.txt' not in src and 'app/v159-block-01.txt' not in src and 'app/v159-block-02.txt' not in src and 'app/v160-block-00.txt' not in src and 'app/v161-block-00.txt' not in src,'assembler-retired-wrapper')
for i in range(9):
    req(f'runtime-semantic-diagnostics-{i:02d}.txt' in src,'stable-runtime-path:'+str(i))
    req(f'runtime-semantic-diagnostics-v159-{i:02d}.txt' not in src,'retired-runtime-path:'+str(i))
req('runtime-current-diagnostics.txt' not in src and 'runtime-semantic-projection-v158.txt' not in src and 'semanticRuntimeRaw' not in src,'assembler-materialized-runtime')

legacy=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text()); base=Path(legacy['source']).read_text(); a=base.index(legacy['start_marker']); b=base.index(legacy['end_marker'],a); fixture=base[a:b]
req(sha_text(fixture)==legacy['range_sha256'] and len(fixture.encode())==49657 and len(re.findall(r'\bassert\s*\(',fixture))==293,'legacy-fixture')

rf=json.loads(Path('_regression/stable-semantic-diagnostic-runtime-v162.fixture.json').read_text())
r=rf['stable_runtime']; req(r['part_count']==9 and len(r['parts'])==9,'stable-runtime-part-count'); materialized=''
for part in r['parts']:
    p=Path(part['path']); a=Path(part['archival_path'])
    req(sha_file(p)==part['sha256'] and p.stat().st_size==part['utf8_bytes'],'stable-runtime:'+part['path'])
    req(sha_file(a)==part['archival_sha256'] and a.stat().st_size==part['archival_utf8_bytes'] and p.read_bytes()==a.read_bytes() and part['byte_exact_with_archival'],'runtime-archival-parity:'+part['path'])
    materialized+=p.read_text()
req(sha_text(materialized)==r['concatenated_sha256']==r['expected_sha256']=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50' and len(materialized.encode())==r['concatenated_utf8_bytes']==r['expected_utf8_bytes']==55525,'stable-runtime-concat')
req(r['stable_path_policy']=='stable-semantic-runtime-part-paths-v162' and r['production_uses_versioned_v159_paths'] is False and r['archival_v159_paths_retained'] is True,'stable-runtime-policy')

df=json.loads(Path('_regression/stable-diagnostic-data-modules-v161.fixture.json').read_text())
for m in [df['stable_modules']['prelude'],df['stable_modules']['finalize']]:
    p=Path(m['path']); a=Path(m['archival_path'])
    req(sha_file(p)==m['sha256'] and p.stat().st_size==m['utf8_bytes'],'stable-data:'+m['path'])
    req(sha_file(a)==m['archival_sha256'] and a.stat().st_size==m['archival_utf8_bytes'] and p.read_bytes()==a.read_bytes() and m['byte_exact_with_archival'],'stable-data-parity:'+m['path'])

w=rf['stable_wrapper']; ad=rf['release_adapter']
req(sha_file(w['path'])==w['sha256'] and Path(w['path']).stat().st_size==w['utf8_bytes']==18971,'wrapper-bytes')
req(sha_file(ad['path'])==ad['sha256'] and Path(ad['path']).stat().st_size==ad['utf8_bytes']==190,'adapter-bytes')
req(w['stable_global_count']==6 and w['retired_v159_wrapper_global_count']==6 and w['retired_release_adapters']==['runV160SelfCheck','runV161SelfCheck'],'wrapper-inventory')
req(ad['allowed_versioned_global']=='runV162SelfCheck' and rf['production_policy']=='stable-semantic-runtime-part-paths-direct-materialized-runtime','adapter-policy')
req(not any(Path('_site').rglob('*.fixture.json')),'fixture-deployed')
print('FEQUEST_V162_FIXTURE_BOUNDARY_OK production=excluded fixture=293 data=6 backing=0 wrapper=6 retired-wrapper=6 retired-adapter=2 adapter=1 stable-data=2 stable-runtime=9')

class P(HTMLParser):
    def __init__(s): super().__init__(); s.ids=set(); s.classes=[]
    def handle_starttag(s,t,a):
        d=dict(a)
        if d.get('id'): s.ids.add(d['id'])
        s.classes += d.get('class','').split()
p=P(); p.feed(h)
ids=['home','map','weak','problems','plan','coverage','mock','lesson','trace','settingsBtn','bMockResultList','startDiagnostic','installCard','pwaHealthCard','aiDrawer','aiFab','aiBackdrop','toast','offlinePill','planFocusCard','planDetailsToggle','analyticsDetailsToggle','weakTopAction','rightDailyAction','rightDailyProgress','quizSubmit','subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']
req(all(x in p.ids for x in ids),'dom-ids')
for c in ['result-detail-fold','result-more-actions','sidebar','mock-history-details','mock-secondary-details','weak-detail-fold','coverage-summary-compact','b-mode-switcher','analytics-priority-card','data-maintenance-fold','recovery-fold','quiz-actions','ai-header-btn']:
    req(c in p.classes,'dom-class:'+c)
visible=re.sub(r'<(?:script|style|template)\b[^>]*>.*?</(?:script|style|template)>','',h,flags=re.S|re.I)
req('今日のクエスト' not in visible and 'クエスト完了' not in visible,'legacy-copy')
print('FEQUEST_V162_STATIC_DOM_OK 23/23 + required-dom')

scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I); js='\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{')); Path('/tmp/p.js').write_text(js); subprocess.run(['node','--check','/tmp/p.js'],check=True)
checks="""if(APP_VERSION!=='v162')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v162'||s.releaseAdapter!=='runV162SelfCheck')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==2||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV162SelfCheck!=='function'||typeof feqRunSelfCheck!=='function'||typeof feqEvaluateCurrentContract!=='function')throw Error('stable-api');if(typeof runV161SelfCheck!=='undefined'||typeof runV160SelfCheck!=='undefined'||typeof runV159SelfCheck!=='undefined'||typeof v159EvaluateCurrentContract!=='undefined'||typeof v159SemanticRuntimeBoundaryAudit!=='undefined'||typeof v159DiagnosticDataBoundaryAudit!=='undefined'||typeof v159ReplacementChecks!=='undefined'||typeof v159AdditionalCurrentChecks!=='undefined')throw Error('retired-wrapper');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_DATA_RUNTIME_SPEC.preludeModule!=='app/runtime-diagnostic-data-prelude.txt'||FEQ_DIAGNOSTIC_DATA_RUNTIME_SPEC.finalizeModule!=='app/runtime-diagnostic-data-finalize.txt')throw Error('stable-data-modules');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.materializedRuntimeParts.length!==9||FEQ_DIAGNOSTIC_RUNTIME_SPEC.materializedRuntimeParts.some(p=>p.includes('-v159-'))||FEQ_DIAGNOSTIC_RUNTIME_SPEC.stableRuntimePathPolicy!=='stable-semantic-runtime-part-paths-v162')throw Error('stable-runtime-paths');console.log('FEQUEST_V162_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 adapter=1 data=6 backing=0 stable-data=2 stable-runtime=9 critical-map=56 release-map=28 ci=84 legacy-bundled=0');"""
Path('/tmp/r.js').write_text(STUB+'\n'+js+'\n'+checks); z=subprocess.run(['node','/tmp/r.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'runtime')

diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); dsources=''.join(Path(x['path']).read_text() for x in diag['source_blocks']); tmpl=legacy['release_shell_template']; adapted=fixture.replace(legacy['release_shell_from'],tmpl.replace('{{VERSION}}','v162'))
rel="""const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\\bassert\\s*\\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V162_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0');"""
Path('/tmp/f.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel); q=subprocess.run(['node','/tmp/f.js'],capture_output=True,text=True); print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release-runtime')
print('FEQUEST_V162_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 adapter=1 data=6 backing=0 stable-data=2 stable-runtime=9 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
