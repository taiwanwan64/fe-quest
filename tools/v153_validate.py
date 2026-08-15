from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, subprocess, sys

h=Path('_site/index.html').read_text(encoding='utf-8')
spec_path=Path('_regression/legacy-run-app-self-check-v131.fixture.json')
spec=json.loads(spec_path.read_text(encoding='utf-8'))
base=Path(spec['source']).read_text(encoding='utf-8')
start_marker=spec['start_marker']
end_marker=spec['end_marker']
req_start=base.count(start_marker)==1 and base.count(end_marker)==1
if not req_start:
    raise AssertionError('fixture-markers')
start_i=base.index(start_marker)
end_i=base.index(end_marker,start_i)
fixture=base[start_i:end_i]

def req(x,m):
    if not x: raise AssertionError(m)

# Physical source/build boundary.
req(hashlib.sha256(fixture.encode('utf-8')).hexdigest()==spec['range_sha256']=='b7f6a3eea1e5c609844311ba9acfe17179df19e07b9c82354ff9ee87c6922f36','fixture-sha')
req(len(fixture.encode('utf-8'))==spec['range_utf8_bytes']==49657,'fixture-bytes')
req(len(re.findall(r'\bassert\s*\(',fixture))==spec['assert_calls']==293,'fixture-assert-count')
req(not re.search(r'(?m)^\s*function runAppSelfCheck\(\)\{',h),'production-legacy-function-present')
req('window.FEQUEST_SELF_CHECK=runAppSelfCheck();' not in h,'production-legacy-boot-call-present')
req('window.FEQUEST_SELF_CHECK=runV153SelfCheck();' in h,'v153-self-check-boot-missing')
req("const APP_VERSION = 'v153';" in h,'v153-version-missing')
manifest=Path('_site/manifest.webmanifest').read_text(encoding='utf-8')
sw=Path('_site/sw.js').read_text(encoding='utf-8')
req('"name": "FE QUEST v153"' in manifest,'manifest-version')
req("const APP_VERSION = 'v153';" in sw and "const CACHE_NAME = 'fe-quest-v153-1';" in sw,'service-worker-version')
req(not any(Path('_site').rglob('legacy-run-app-self-check-v131.fixture.json')),'legacy-fixture-spec-deployed')
print('FEQUEST_V153_FIXTURE_BOUNDARY_OK production=excluded fixture=293')
class N:
    def __init__(s,t='root',a=(),p=None): s.t=t;s.a=dict(a);s.p=p;s.c=[];s.x=[]
    def text(s): return '' if s.t in('script','style','template') else ''.join(s.x)+''.join(i.text() for i in s.c)

class P(HTMLParser):
    V=set('area base br col embed hr img input link meta param source track wbr'.split())
    def __init__(s): super().__init__(convert_charrefs=True);s.r=N();s.st=[s.r]
    def handle_starttag(s,t,a):
        n=N(t,a,s.st[-1]);s.st[-1].c.append(n)
        if t not in s.V:s.st.append(n)
    def handle_endtag(s,t):
        for i in range(len(s.st)-1,0,-1):
            if s.st[i].t==t:s.st=s.st[:i];break
    def handle_data(s,d): s.st[-1].x.append(d)

p=P();p.feed(h)
def walk(n):
    yield n
    for c in n.c: yield from walk(c)
ns=list(walk(p.r))
gid=lambda x:next((n for n in ns if n.a.get('id')==x),None)
cls=lambda c:[n for n in ns if c in n.a.get('class','').split()]
def anc(n,tag=None,id=None):
    n=n.p if n else None
    while n:
        if (tag is None or n.t==tag) and (id is None or n.a.get('id')==id): return True
        n=n.p
    return False
def inside(a,b):
    while b:
        if a is b:return True
        b=b.p
    return False

req(len(cls('result-detail-fold'))>=5 and len(cls('result-more-actions'))>=5,'result')
req(gid('bMockResultList') and '次の科目B' in gid('bMockResultList').text(),'bnext')
req(gid('startDiagnostic') and '始める' in gid('startDiagnostic').text(),'onboard')
req(anc(gid('installCard'),id='pwaHealthCard'),'install')
ai,fab=gid('aiDrawer'),gid('aiFab')
req(ai and ai.a.get('role')=='dialog' and fab and fab.a.get('aria-controls')=='aiDrawer','aidialog')
req(ai and 'inert' in ai.a and gid('aiBackdrop'),'aiinert')
req(gid('toast').a.get('aria-live')=='polite' and gid('offlinePill').a.get('role')=='status','live')
req(cls('sidebar')[0].a.get('role')=='navigation','nav')
req(any(c.t=='h1' and 'sr-only' in c.a.get('class','').split() for c in gid('home').c),'home')
mock=gid('mockMenu')
hist=next((c for c in mock.c if 'mock-history-details' in c.a.get('class','').split()),None)
sec=next((c for c in mock.c if 'mock-secondary-details' in c.a.get('class','').split()),None)
req(hist and sec and inside(hist,gid('mockHistoryList')),'mock')
weak=gid('weak')
fold=next((c for c in weak.c if 'weak-detail-fold' in c.a.get('class','').split()),None)
req(fold and inside(fold,gid('weakCategoryGrid')),'weak')
req(any('coverage-summary-compact' in n.a.get('class','').split() and '教材の総合進捗' in n.text() for n in ns if inside(gid('coverage'),n)),'coverage')
req(len(cls('b-mode-switcher'))==4,'bswitch')
req(gid('planFocusCard') and gid('planDetailsToggle'),'plan')
req(gid('analyticsDetailsToggle') and any('analytics-priority-card' in n.a.get('class','').split() and inside(gid('history'),n) for n in ns),'analytics')
req(any('data-maintenance-fold' in n.a.get('class','').split() and inside(gid('pwaHealthCard'),n) for n in ns) and any('recovery-fold' in n.a.get('class','').split() and inside(gid('pwaHealthCard'),n) for n in ns),'data')
req(all('aria-label' in n.a for n in ns if n.t=='button' and 'back' in n.a.get('class','').split()),'back')
req(gid('weakTopAction'),'weaktop')
req(gid('rightDailyAction') and gid('rightDailyProgress'),'desktop')
req(fab and 'ai-header-btn' in fab.a.get('class','').split() and anc(fab,tag='header'),'aihead')
req(gid('problems') and gid('quizSubmit') and cls('quiz-actions'),'quiz')
req(all(gid(x) for x in ['subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']),'bcards')
body=next(n for n in ns if n.t=='body')
req('今日のクエスト' not in body.text() and 'クエスト完了' not in body.text(),'copy')
req(all(gid(x) for x in ['home','map','weak','problems','plan','coverage','mock','lesson','trace','settingsBtn']),'required-dom-sentinel')
print('FEQUEST_V153_STATIC_DOM_OK 23/23 + required-dom')

scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
Path('/tmp/fequest_v153_prod.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/fequest_v153_prod.js'],check=True)

stub=r"""const noop=()=>{};let dummy;
const M=new Set(['addEventListener','removeEventListener','appendChild','removeChild','replaceChildren','insertBefore','setAttribute','removeAttribute','focus','blur','click','scrollIntoView','select','setSelectionRange','dispatchEvent','showModal','close','play','pause']);
const H={get(t,p){if(p===Symbol.iterator)return function*(){};if(p==='length')return 0;if(p==='classList')return {add:noop,remove:noop,toggle:()=>false,contains:()=>false,replace:()=>false};if(p==='style')return {setProperty:noop,removeProperty:noop};if(p==='dataset')return {};if(p==='value')return '';if(p==='checked'||p==='disabled')return false;if(p==='innerHTML'||p==='textContent'||p==='innerText')return '';if(p==='getContext')return ()=>null;if(p==='getBoundingClientRect')return ()=>({top:0,left:0,right:0,bottom:0,width:0,height:0});if(p==='querySelectorAll')return ()=>[];if(p==='querySelector')return ()=>dummy();if(p==='closest')return ()=>null;if(p==='matches'||p==='contains'||p==='hasAttribute')return ()=>false;if(p==='getAttribute')return ()=>null;if(M.has(p))return noop;return Reflect.get(t,p)??noop},set(t,p,v){t[p]=v;return true}};
dummy=()=>new Proxy({},H);globalThis.document=new Proxy({readyState:'loading',body:dummy(),documentElement:dummy(),activeElement:null,querySelectorAll:()=>[],querySelector:()=>dummy(),getElementById:()=>dummy(),getElementsByClassName:()=>[],getElementsByTagName:()=>[],createElement:()=>dummy(),createTextNode:()=>dummy(),createDocumentFragment:()=>dummy(),addEventListener:noop,removeEventListener:noop},H);globalThis.window=globalThis;globalThis.addEventListener=noop;globalThis.removeEventListener=noop;globalThis.scrollTo=noop;globalThis.scrollBy=noop;globalThis.location={href:'https://x/',origin:'https://x',pathname:'/',search:'',hash:'',assign:noop,replace:noop,reload:noop};globalThis.history={pushState:noop,replaceState:noop,back:noop,forward:noop,go:noop};const S=()=>{const m=new Map();return {getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>[...m.keys()][i]??null,get length(){return m.size}}};globalThis.localStorage=S();globalThis.sessionStorage=S();globalThis.navigator={userAgent:'node-runtime-smoke',language:'ja-JP',languages:['ja-JP'],onLine:true,clipboard:{writeText:async()=>{}},serviceWorker:{register:async()=>({}),addEventListener:noop,removeEventListener:noop,controller:null}};globalThis.matchMedia=()=>({matches:false,media:'',addEventListener:noop,removeEventListener:noop,addListener:noop,removeListener:noop});globalThis.getComputedStyle=()=>({getPropertyValue:()=>'',display:'block',visibility:'visible'});globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=noop;globalThis.setInterval=()=>0;globalThis.clearInterval=noop;globalThis.setTimeout=()=>0;globalThis.clearTimeout=noop;globalThis.alert=noop;globalThis.confirm=()=>true;globalThis.prompt=()=>'';globalThis.fetch=async()=>({ok:true,status:200,type:'basic',json:async()=>({}),text:async()=>'',clone(){return this}});globalThis.Notification=function(){};globalThis.Notification.permission='denied';globalThis.HTMLElement=class{};globalThis.Event=class{constructor(t,i={}){this.type=t;Object.assign(this,i)}};globalThis.CustomEvent=class extends globalThis.Event{constructor(t,i={}){super(t,i);this.detail=i.detail}};globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};globalThis.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};globalThis.CSS={escape:s=>String(s)};globalThis.__FEQUEST_RUNTIME_SMOKE__=true;"""

prod_checks=r"""if(APP_VERSION!=='v153')throw Error('version');
if(typeof runAppSelfCheck!=='undefined')throw Error('legacy evaluator bundled');
if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw Error('questions');
if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw Error('answers');
if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw Error('cognitive');
const s=FEQUEST_SELF_CHECK;
if(!s||!s.ok||s.architecture!=='v153-diagnostic-runtime-boundary-inventory'||s.currentContract.total!==71||s.currentContract.passed!==71||s.currentContract.failed)throw Error('self');
if(s.historicalDiagnostics.mode!=='production-current-diagnostics-only'||s.historicalDiagnostics.legacyShadowExecution!==false||s.historicalDiagnostics.legacyShadowLocation!=='release-validation-only')throw Error('prod diagnostics metadata');
if(s.browserUiContract.mode!=='deferred-to-browser-dom'||s.browserUiContract.total!==23||s.uiDeferredWarnings.length!==23)throw Error('ui');
const hi=s.v153DiagnosticHelperInventory;
if(!hi||hi.total!==46||hi.unique!==46||hi.duplicateCount||hi.productionRuntime!==17||hi.releaseOnly!==10||hi.compatibilityOnly!==19||!hi.allAvailable||!hi.exactInventory||hi.missing.length)throw Error('helper inventory');
const cb=s.v153ProductionCallBoundary;
if(!cb||!cb.ok||cb.violations.length||cb.forbiddenCount!==29)throw Error('call boundary');
const lc=s.v152LegacyClassification;
if(!lc||lc.total!==293||lc.classified!==293||lc.unique!==293||lc.duplicateCount||!lc.exactCoverage||!lc.declaredCountsOk)throw Error('legacy classification');
const ci=s.v150CiSentinelInventory,c=ci.bucketCounts;
if(ci.classified!==84||ci.unique!==84||ci.duplicateCount||!ci.exactCoverage||!ci.declaredCountsOk||c.qualityCaps!==2||c.articleTeachingStructure!==4||c.criticalCurriculum!==56||c.assessmentStructure!==17||c.lessonPages!==1||c.referenceAnchors!==2||c.settingsHelper!==1||c.requiredDom!==1)throw Error('ci inventory');
const dc=s.v151DeclarativeCiCoverage;
if(!dc||dc.critical!==56||dc.release!==28||dc.total!==84||dc.unique!==84||dc.duplicateCount||!dc.exactCoverage)throw Error('declarative coverage');
const fp=s.v153LegacyFixturePolicy;
if(!fp||fp.productionFunctionPresent!==false||fp.releaseFixtureAssertions!==293||fp.releaseCiExecutesLegacy!==true||fp.productionExecutesLegacy!==false)throw Error('fixture policy');
const cc=runV150CriticalCurriculumAudit();
if(cc.total!==56||cc.passed!==56||cc.failed||cc.legacyAssertionsCovered!==56||!cc.coverageExact)throw Error('critical curriculum');
const rs=runV151ReleaseSentinelAudit();
if(rs.total!==28||rs.passed!==28||rs.failed||rs.legacyAssertionsCovered!==28||!rs.coverageExact)throw Error('release sentinels');
console.log('FEQUEST_V153_PRODUCTION_RUNTIME_OK current=71/71 helpers=46 runtime=17 release=10 compat=19 critical=56/56 release-sentinel=28/28 ci=84 legacy-bundled=0');"""

prod_script=Path('/tmp/fequest_v153_prod_runtime.js')
prod_script.write_text(stub+'\n'+js+'\n'+prod_checks,encoding='utf-8')
z=subprocess.run(['node',str(prod_script)],capture_output=True,text=True)
print(z.stdout)
print(z.stderr,file=sys.stderr)
req(z.returncode==0 and 'FEQUEST_V153_PRODUCTION_RUNTIME_OK' in z.stdout,'production-runtime')

# Release-only compatibility shadow: emulate the historical assembler's one release-shell substitution,
# then load the fixture after the production bundle has already completed its own v153 self-check.
template=spec.get('release_shell_template')
req(template and '{{VERSION}}' in template,'fixture-release-shell-template')
fixture_release=fixture.replace(spec['release_shell_from'],template.replace('{{VERSION}}','v153'))
req(fixture_release!=fixture,'fixture-release-shell-adapter')
legacy_checks=r"""if(typeof runAppSelfCheck!=='function')throw Error('fixture evaluator missing');
if((String(runAppSelfCheck).match(/\bassert\s*\(/g)||[]).length!==293)throw Error('fixture assert inventory');
const l=runV149LegacyShadowAudit();
if(!l.executed||l.rawErrorCount!==22||l.historicalMetadata.length!==8||l.supersededSemantic.length!==1||l.legacyUiSignals.length!==13||l.residualActiveErrors.length)throw Error('legacy shadow');
if(l.inventory.sourceAssertCalls!==293||!l.inventory.exactCoverage||l.inventory.duplicateCount)throw Error('legacy fixture inventory');
console.log('FEQUEST_V153_RELEASE_FIXTURE_OK legacy=293 raw=22 residual=0');"""
legacy_script=Path('/tmp/fequest_v153_fixture_runtime.js')
import json
legacy_script.write_text(stub+'\n'+js+'\n'+'eval('+json.dumps(fixture_release)+');\n'+legacy_checks,encoding='utf-8')
q=subprocess.run(['node',str(legacy_script)],capture_output=True,text=True)
print(q.stdout)
print(q.stderr,file=sys.stderr)
req(q.returncode==0 and 'FEQUEST_V153_RELEASE_FIXTURE_OK' in q.stdout,'fixture-runtime')

print('FEQUEST_V153_RUNTIME_OK current=71/71 helpers=46 runtime=17 release-only=10 compat=19 critical=56/56 release-sentinel=28/28 ci=84 legacy=293 residual=0 production-legacy=0')
