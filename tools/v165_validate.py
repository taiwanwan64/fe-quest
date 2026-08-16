from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,subprocess,sys
from v165_runtime_stub import STUB

def req(v,m):
    if not v: raise AssertionError(m)
def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()
def sha_file(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()

h=Path('_site/index.html').read_text(); manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v165';" in h and 'runV165SelfCheck();' in h,'version/boot')
req('"name": "FE QUEST v165"' in manifest,'manifest')
req("const APP_VERSION = 'v165';" in sw and "fe-quest-v165-1" in sw,'sw')
req(all(x in sw for x in ["GET_VERSION","networkWithTimeout","staleWhileRevalidate","request.headers.has('range')"]),'sw-behavior-parity')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',h),'legacy-evaluator')
old_data=['V148_EXTRA_UI_CONTRACTS','V149_LEGACY_ASSERT_INVENTORY','V150_CI_ONLY_SENTINEL_GROUPS','V150_CRITICAL_CURRICULUM_SPEC','V151_RELEASE_SENTINEL_SPEC','V152_LEGACY_FIXTURE_SPEC']
req(all(x not in h for x in old_data),'old-data-token')
retired_wrapper=['v159SemanticRuntimeBoundaryAudit','v159DiagnosticDataBoundaryAudit','v159ReplacementChecks','v159AdditionalCurrentChecks','v159EvaluateCurrentContract','runV159SelfCheck']
for name in retired_wrapper:
    req(not re.search(r'(?m)^\s*function\s+'+re.escape(name)+r'\s*\(',h),'retired-wrapper-declaration:'+name)
for name in ['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck']:
    req(not re.search(r'(?m)^\s*function\s+'+re.escape(name)+r'\s*\(',h),'retired-adapter-declaration:'+name)

src=Path('index.html').read_text()
req('runtime-diagnostic-wrapper.txt' in src and 'v165-block-00.txt' in src and 'v164-block-00.txt' not in src,'assembler-wrapper')
req('runtime-diagnostic-data-prelude.txt' in src and 'runtime-diagnostic-data-finalize.txt' in src and 'runtime-diagnostic-data-prelude-v157.txt' not in src and 'runtime-diagnostic-data-finalize-v159.txt' not in src,'assembler-stable-data-modules')
req('{% include_relative app/runtime-semantic-diagnostics.txt %}' in src,'single-runtime-source')
for i in range(9):
    stable=Path(f'app/runtime-semantic-diagnostics-{i:02d}.txt')
    req(not stable.exists(),'retired-stable-part-present:'+str(i))
    req(f'include_relative app/runtime-semantic-diagnostics-{i:02d}.txt' not in src,'retired-split-runtime-include:'+str(i))
    req(f'include_relative app/runtime-semantic-diagnostics-v159-{i:02d}.txt' not in src,'retired-versioned-runtime-include:'+str(i))
req('runtime-current-diagnostics.txt' not in src and 'runtime-semantic-projection-v158.txt' not in src and 'semanticRuntimeRaw' not in src,'assembler-materialized-runtime')

legacy=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text()); base=Path(legacy['source']).read_text(); a=base.index(legacy['start_marker']); b=base.index(legacy['end_marker'],a); fixture=base[a:b]
req(sha_text(fixture)==legacy['range_sha256'] and len(fixture.encode())==49657 and len(re.findall(r'\bassert\s*\(',fixture))==293,'legacy-fixture')

pf=json.loads(Path('_regression/physical-semantic-runtime-source-v165.fixture.json').read_text())
phy=pf['physical_runtime']; rp=Path(phy['path']); rb=rp.read_bytes(); rt=rp.read_text()
req(sha_file(rp)==phy['sha256']=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50','physical-runtime-hash')
req(rp.stat().st_size==phy['utf8_bytes']==55525 and phy['source_count']==1 and phy['liquid_include_count']==0,'physical-runtime-bytes')
req('{% include_relative' not in rt and '{%' not in rt,'physical-runtime-no-liquid')
req(h.count(rt)==1,'generated-runtime-byte-exact-occurrence')
arc=pf['archival_versioned_runtime']; rendered=b''
for part in arc['parts']:
    pp=Path(part['path']); req(pp.exists() and sha_file(pp)==part['sha256'] and pp.stat().st_size==part['utf8_bytes'],'archival-part:'+part['path']); rendered+=pp.read_bytes()
req(arc['part_count']==9 and hashlib.sha256(rendered).hexdigest()==arc['concatenated_sha256']==phy['sha256'] and len(rendered)==arc['concatenated_utf8_bytes']==55525 and rendered==rb and arc['byte_exact_with_physical_runtime'],'archival-runtime-parity')
req(pf['retired_stable_loader']['production_paths_absent'] and pf['retired_stable_loader']['backing_part_count']==9,'retired-loader-policy')

# Stable data lifecycle + active provenance.
df=json.loads(Path('_regression/stable-diagnostic-data-modules-v161.fixture.json').read_text())
pre=df['stable_modules']['prelude']; pp=Path(pre['path']); aa=Path(pre['archival_path'])
req(sha_file(pp)==pre['sha256'] and pp.stat().st_size==pre['utf8_bytes'] and sha_file(aa)==pre['archival_sha256'] and pp.read_bytes()==aa.read_bytes(),'stable-data-prelude')
fin=pf['active_provenance']; fp=Path(fin['finalizer_path']); ft=fp.read_text()
req(sha_file(fp)==fin['finalizer_sha256'] and fp.stat().st_size==fin['finalizer_utf8_bytes'],'stable-finalizer-identity')
req("sourceModule:'app/runtime-semantic-diagnostics.txt'" in ft and "projectionMode:'stable-physical-semantic-runtime-source'" in ft,'stable-active-provenance')

w=pf['stable_wrapper']; ad=pf['release_adapter']
req(sha_file(w['path'])==w['sha256'] and Path(w['path']).stat().st_size==w['utf8_bytes']==18563,'wrapper-bytes')
req(sha_file(ad['path'])==ad['sha256'] and Path(ad['path']).stat().st_size==ad['utf8_bytes']==190,'adapter-bytes')
req(w['stable_global_count']==6 and w['retired_v159_wrapper_global_count']==6 and w['retired_release_adapters']==['runV160SelfCheck','runV161SelfCheck','runV162SelfCheck','runV163SelfCheck','runV164SelfCheck'],'wrapper-inventory')
req(ad['allowed_versioned_global']=='runV165SelfCheck' and pf['production_policy']=='byte-exact-single-physical-semantic-runtime-source','adapter-policy')
req(not any(Path('_site').rglob('*.fixture.json')),'fixture-deployed')
print('FEQUEST_V165_FIXTURE_BOUNDARY_OK production=excluded fixture=293 data=6 backing=0 wrapper=6 retired-wrapper=6 retired-adapter=5 adapter=1 stable-data=2 physical-runtime=1 split-backing=0')

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
print('FEQUEST_V165_STATIC_DOM_OK 23/23 + required-dom')

scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I); js='\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{')); Path('/tmp/p.js').write_text(js); subprocess.run(['node','--check','/tmp/p.js'],check=True)
checks="""if(APP_VERSION!=='v165')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='stable-semantic-diagnostic-wrapper'||s.releaseVersion!=='v165'||s.releaseAdapter!=='runV165SelfCheck')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||s.semanticRuntimeBoundary.stableWrapper!==6||s.semanticRuntimeBoundary.retiredWrapper!==6||s.semanticRuntimeBoundary.retiredAdapters!==5||s.semanticRuntimeBoundary.presentStableWrapper!==6||s.semanticRuntimeBoundary.leakedRetiredWrapper.length||s.semanticRuntimeBoundary.leakedRetiredAdapters.length||!s.semanticRuntimeBoundary.ok)throw Error('wrapper');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(typeof runV165SelfCheck!=='function'||typeof feqRunSelfCheck!=='function'||typeof feqEvaluateCurrentContract!=='function')throw Error('stable-api');if(typeof runV164SelfCheck!=='undefined'||typeof runV163SelfCheck!=='undefined'||typeof runV162SelfCheck!=='undefined'||typeof runV161SelfCheck!=='undefined'||typeof runV160SelfCheck!=='undefined'||typeof runV159SelfCheck!=='undefined'||typeof v159EvaluateCurrentContract!=='undefined'||typeof v159SemanticRuntimeBoundaryAudit!=='undefined'||typeof v159DiagnosticDataBoundaryAudit!=='undefined'||typeof v159ReplacementChecks!=='undefined'||typeof v159AdditionalCurrentChecks!=='undefined')throw Error('retired-wrapper');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');if(FEQ_DIAGNOSTIC_DATA_RUNTIME_SPEC.preludeModule!=='app/runtime-diagnostic-data-prelude.txt'||FEQ_DIAGNOSTIC_DATA_RUNTIME_SPEC.finalizeModule!=='app/runtime-diagnostic-data-finalize.txt')throw Error('stable-data-modules');if(FEQ_DIAGNOSTIC_DATA_PROVENANCE.sourceModule!=='app/runtime-semantic-diagnostics.txt'||FEQ_DIAGNOSTIC_DATA_PROVENANCE.projectionMode!=='stable-physical-semantic-runtime-source')throw Error('stable-provenance');if(FEQ_DIAGNOSTIC_RUNTIME_SPEC.physicalRuntimeSourceCount!==1||FEQ_DIAGNOSTIC_RUNTIME_SPEC.physicalRuntimeModule!=='app/runtime-semantic-diagnostics.txt'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.physicalRuntimeSha256!=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.physicalRuntimeUtf8Bytes!==55525||FEQ_DIAGNOSTIC_RUNTIME_SPEC.materializationMode!=='byte-exact-physical-semantic-runtime-source'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.stableRuntimePathPolicy!=='single-physical-semantic-runtime-source'||FEQ_DIAGNOSTIC_RUNTIME_SPEC.archivalVersionedRuntimeParts.length!==9)throw Error('physical-runtime-source');console.log('FEQUEST_V165_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 adapter=1 data=6 backing=0 stable-data=2 physical-runtime=1 split-backing=0 critical-map=56 release-map=28 ci=84 legacy-bundled=0');"""
Path('/tmp/r.js').write_text(STUB+'\n'+js+'\n'+checks); z=subprocess.run(['node','/tmp/r.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'runtime')

diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); dsources=''.join(Path(x['path']).read_text() for x in diag['source_blocks']); tmpl=legacy['release_shell_template']; adapted=fixture.replace(legacy['release_shell_from'],tmpl.replace('{{VERSION}}','v165'))
rel="""const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\\bassert\\s*\\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V165_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0');"""
Path('/tmp/f.js').write_text(STUB+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel); q=subprocess.run(['node','/tmp/f.js'],capture_output=True,text=True); print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release-runtime')
print('FEQUEST_V165_RUNTIME_OK current=71/71 stable=17 retired-fn=46 wrapper=6 retired-wrapper=0 retired-adapter=0 adapter=1 data=6 backing=0 stable-data=2 physical-runtime=1 split-backing=0 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
