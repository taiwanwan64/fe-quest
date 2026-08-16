from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,subprocess,sys

def req(v,m):
    if not v: raise AssertionError(m)
def sha(s): return hashlib.sha256(s.encode()).hexdigest()
h=Path('_site/index.html').read_text()
manifest=Path('_site/manifest.webmanifest').read_text(); sw=Path('_site/sw.js').read_text()
req("const APP_VERSION = 'v159';" in h and 'runV159SelfCheck();' in h,'version/boot')
req('"name": "FE QUEST v159"' in manifest,'manifest')
req("const APP_VERSION = 'v159';" in sw and "fe-quest-v159-1" in sw,'sw')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',h),'legacy-evaluator')
old=['V148_EXTRA_UI_CONTRACTS','V149_LEGACY_ASSERT_INVENTORY','V150_CI_ONLY_SENTINEL_GROUPS','V150_CRITICAL_CURRICULUM_SPEC','V151_RELEASE_SENTINEL_SPEC','V152_LEGACY_FIXTURE_SPEC']
req(all(x not in h for x in old),'old-data-token')
src=Path('index.html').read_text(); req('runtime-semantic-diagnostics-v159-00.txt' in src and 'runtime-semantic-diagnostics-v159-08.txt' in src and 'runtime-current-diagnostics.txt' not in src and 'runtime-semantic-projection-v158.txt' not in src and 'semanticRuntimeRaw' not in src,'assembler-direct-materialized-runtime')
legacy=json.loads(Path('_regression/legacy-run-app-self-check-v131.fixture.json').read_text()); base=Path(legacy['source']).read_text(); a=base.index(legacy['start_marker']); b=base.index(legacy['end_marker'],a); fixture=base[a:b]
req(sha(fixture)==legacy['range_sha256'] and len(fixture.encode())==49657 and len(re.findall(r'\bassert\s*\(',fixture))==293,'legacy-fixture')
sem=json.loads(Path('_regression/semantic-diagnostic-runtime-v155.fixture.json').read_text()); archival=Path(sem['module']).read_text(); req(sha(archival)==sem['module_sha256'] and len(archival.encode())==54898,'archival-runtime-source')
pf=json.loads(Path('_regression/semantic-diagnostic-projection-v158.fixture.json').read_text())
mf=json.loads(Path('_regression/semantic-diagnostic-materialization-v159.fixture.json').read_text())
mmeta=mf['materialized_runtime']; req(mmeta['part_count']==9,'materialized-part-count'); materialized=''
for part in mmeta['parts']:
    p=Path(part['path']); req(hashlib.sha256(p.read_bytes()).hexdigest()==part['sha256'] and p.stat().st_size==part['utf8_bytes'],'materialized-part:'+part['path']); materialized+=p.read_text()
req(sha(materialized)==mmeta['concatenated_sha256']=='88db821278597a5a2dc073da6935ceb979b39632b243fed9cd7846cd924abe50' and len(materialized.encode())==mmeta['concatenated_utf8_bytes']==55525,'materialized-runtime')
rules=[
('V148_EXTRA_UI_CONTRACTS','browserUiAdditions','  const V148_EXTRA_UI_CONTRACTS = [','  const browserUiAdditions = [','  globalThis.V148_EXTRA_UI_CONTRACTS=V148_EXTRA_UI_CONTRACTS;'),
('V149_LEGACY_ASSERT_INVENTORY','legacyAssertionInventory','  const V149_LEGACY_ASSERT_INVENTORY = Object.freeze({','  const legacyAssertionInventory = Object.freeze({','  globalThis.V149_LEGACY_ASSERT_INVENTORY=V149_LEGACY_ASSERT_INVENTORY;'),
('V150_CI_ONLY_SENTINEL_GROUPS','ciSentinelGroups','  const V150_CI_ONLY_SENTINEL_GROUPS=Object.freeze({','  const ciSentinelGroups=Object.freeze({','  globalThis.V150_CI_ONLY_SENTINEL_GROUPS=V150_CI_ONLY_SENTINEL_GROUPS;'),
('V150_CRITICAL_CURRICULUM_SPEC','criticalCurriculumSpec','  const V150_CRITICAL_CURRICULUM_SPEC=Object.freeze({','  const criticalCurriculumSpec=Object.freeze({','  globalThis.V150_CRITICAL_CURRICULUM_SPEC=V150_CRITICAL_CURRICULUM_SPEC;'),
('V151_RELEASE_SENTINEL_SPEC','releaseSentinelSpec','  const V151_RELEASE_SENTINEL_SPEC=Object.freeze({','  const releaseSentinelSpec=Object.freeze({','  globalThis.V151_RELEASE_SENTINEL_SPEC=V151_RELEASE_SENTINEL_SPEC;'),
('V152_LEGACY_FIXTURE_SPEC','legacyFixtureSpec','  const V152_LEGACY_FIXTURE_SPEC=Object.freeze({','  const legacyFixtureSpec=Object.freeze({','  globalThis.V152_LEGACY_FIXTURE_SPEC=V152_LEGACY_FIXTURE_SPEC;')]
proj=archival
for old,local,d0,d1,g0 in rules:
    proj=proj.replace(d0,d1).replace(g0,f'  globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA.{local}={local};').replace(old,f'globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA.{local}')
req(materialized==proj and sha(proj)==pf['projected_runtime']['sha256'] and len(proj.encode())==pf['projected_runtime']['utf8_bytes'],'materialization-equivalence')
req(all(r[0] not in materialized for r in rules),'materialized-old-token')
fin=Path('app/runtime-diagnostic-data-finalize-v159.txt'); req(hashlib.sha256(fin.read_bytes()).hexdigest()=='9d9c00d0bfe445ffc0f666250b4d7daca3abb612e6cb019d5ee9e886b8d79927' and fin.stat().st_size==1264,'finalizer-v159')
pre=Path('app/runtime-diagnostic-data-prelude-v157.txt'); req(hashlib.sha256(pre.read_bytes()).hexdigest()=='318bd6cea2a15cb87c47550926e39324a27e9bf25106604e1b8cf743ab2ddf92' and pre.stat().st_size==235,'prelude')
req(not any(Path('_site').rglob('*.fixture.json')),'fixture-deployed')
print('FEQUEST_V159_FIXTURE_BOUNDARY_OK production=excluded fixture=293 data=6 backing=0')
class P(HTMLParser):
    def __init__(s): super().__init__(); s.ids=set(); s.classes=[]; s.attrs=[]
    def handle_starttag(s,t,a):
        d=dict(a); s.attrs.append((t,d));
        if d.get('id'): s.ids.add(d['id'])
        s.classes += d.get('class','').split()
p=P();p.feed(h)
ids=['home','map','weak','problems','plan','coverage','mock','lesson','trace','settingsBtn','bMockResultList','startDiagnostic','installCard','pwaHealthCard','aiDrawer','aiFab','aiBackdrop','toast','offlinePill','planFocusCard','planDetailsToggle','analyticsDetailsToggle','weakTopAction','rightDailyAction','rightDailyProgress','quizSubmit','subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']
req(all(x in p.ids for x in ids),'dom-ids')
for c in ['result-detail-fold','result-more-actions','sidebar','mock-history-details','mock-secondary-details','weak-detail-fold','coverage-summary-compact','b-mode-switcher','analytics-priority-card','data-maintenance-fold','recovery-fold','quiz-actions','ai-header-btn']:
    req(c in p.classes,'dom-class:'+c)
visible=re.sub(r'<(?:script|style|template)\b[^>]*>.*?</(?:script|style|template)>','',h,flags=re.S|re.I)
req('今日のクエスト' not in visible and 'クエスト完了' not in visible,'legacy-copy')
print('FEQUEST_V159_STATIC_DOM_OK 23/23 + required-dom')
scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I); js='\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{')); Path('/tmp/p.js').write_text(js); subprocess.run(['node','--check','/tmp/p.js'],check=True)
helper=Path('tools/v154_validate.py').read_text(encoding='utf-8')
m=re.search(r'stub=r"""(.*?)"""',helper,re.S); req(m,'shared-runtime-stub'); stub=m.group(1)
checks="""if(APP_VERSION!=='v159')throw Error('version');const s=FEQUEST_SELF_CHECK;if(!s||!s.ok||s.currentContract.total!==71||s.currentContract.passed!==71||s.architecture!=='v159-materialized-semantic-runtime-source')throw Error('self');if(s.browserUiContract.total!==23)throw Error('ui');if(s.semanticRuntimeBoundary.stable!==17||s.semanticRuntimeBoundary.retired!==46||!s.semanticRuntimeBoundary.ok)throw Error('helpers');if(s.semanticDataBoundary.semantic!==6||s.semanticDataBoundary.leakedBacking.length||!s.semanticDataBoundary.frozen)throw Error('data');if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('q');if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('a');if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cog');if(s.declarativeCiCoverage.total!==84||s.declarativeCiCoverage.critical!==56||s.declarativeCiCoverage.release!==28)throw Error('ci');console.log('FEQUEST_V159_PRODUCTION_RUNTIME_OK current=71/71 stable=17 retired-fn=46 data=6 backing=0 critical-map=56 release-map=28 ci=84 legacy-bundled=0');"""
Path('/tmp/r.js').write_text(stub+'\n'+js+'\n'+checks); z=subprocess.run(['node','/tmp/r.js'],capture_output=True,text=True); print(z.stdout); print(z.stderr,file=sys.stderr); req(z.returncode==0,'runtime')
diag=json.loads(Path('_regression/diagnostic-helper-boundary-v154.fixture.json').read_text()); dsources=''.join(Path(x['path']).read_text() for x in diag['source_blocks']); tmpl=legacy['release_shell_template']; adapted=fixture.replace(legacy['release_shell_from'],tmpl.replace('{{VERSION}}','v159'))
rel="""const cc=runV150CriticalCurriculumAudit(),rs=runV151ReleaseSentinelAudit(),l=runV149LegacyShadowAudit();if(cc.total!==56||cc.failed||rs.total!==28||rs.failed||l.rawErrorCount!==22||l.residualActiveErrors.length||(String(runAppSelfCheck).match(/\\bassert\\s*\\(/g)||[]).length!==293)throw Error('release');console.log('FEQUEST_V159_RELEASE_FIXTURE_OK diagnostic=46 critical=56/56 release=28/28 legacy=293 raw=22 residual=0');"""
Path('/tmp/f.js').write_text(stub+'\n'+js+'\neval('+json.dumps(dsources)+');\neval('+json.dumps(adapted)+');\n'+rel); q=subprocess.run(['node','/tmp/f.js'],capture_output=True,text=True); print(q.stdout); print(q.stderr,file=sys.stderr); req(q.returncode==0,'release-runtime')
print('FEQUEST_V159_RUNTIME_OK current=71/71 stable=17 retired-fn=46 data=6 backing=0 critical=56/56 release=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
