from pathlib import Path
from html.parser import HTMLParser
import re, subprocess, sys

html=Path('_site/index.html').read_text(encoding='utf-8')

class Node:
    __slots__=('tag','attrs','parent','children','texts')
    def __init__(self,tag='root',attrs=None,parent=None):
        self.tag=tag; self.attrs=dict(attrs or []); self.parent=parent; self.children=[]; self.texts=[]
    @property
    def classes(self): return set(self.attrs.get('class','').split())
    def text(self,visible=True):
        if visible and self.tag in ('script','style','template'): return ''
        return ''.join(self.texts)+''.join(c.text(visible) for c in self.children)
    def descendants(self):
        for c in self.children:
            yield c; yield from c.descendants()
class P(HTMLParser):
    VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self): super().__init__(convert_charrefs=True); self.root=Node(); self.stack=[self.root]
    def handle_starttag(self,tag,attrs):
        n=Node(tag,attrs,self.stack[-1]); self.stack[-1].children.append(n)
        if tag not in self.VOID:self.stack.append(n)
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag:self.stack=self.stack[:i];return
    def handle_data(self,data):self.stack[-1].texts.append(data)
p=P();p.feed(html); nodes=[p.root,*p.root.descendants()]
by_id=lambda x:next((n for n in nodes if n.attrs.get('id')==x),None)
by_class=lambda c:[n for n in nodes if c in n.classes]
def ancestor_id(n,id_):
    cur=n.parent if n else None
    while cur:
        if cur.attrs.get('id')==id_:return True
        cur=cur.parent
    return False
def ancestor_tag(n,tag):
    cur=n.parent if n else None
    while cur:
        if cur.tag==tag:return True
        cur=cur.parent
    return False
def direct(n,cls):return next((c for c in (n.children if n else []) if cls in c.classes),None)
def contains(a,b):
    cur=b
    while cur:
        if cur is a:return True
        cur=cur.parent
    return False
def req(ok,msg):
    if not ok:raise AssertionError(msg)

# v144 inherited 13
req(len(by_class('result-detail-fold'))>=5 and len(by_class('result-more-actions'))>=5,'DOM result hierarchy')
req(by_id('bMockResultList') and '次の科目B' in by_id('bMockResultList').text(),'DOM Subject B next')
req(by_id('startDiagnostic') and '始める' in by_id('startDiagnostic').text(),'DOM onboarding')
req(ancestor_id(by_id('installCard'),'pwaHealthCard'),'DOM install')
ai=by_id('aiDrawer');fab=by_id('aiFab');req(ai and ai.attrs.get('role')=='dialog' and fab and fab.attrs.get('aria-controls')=='aiDrawer','DOM AI dialog')
req(ai and 'inert' in ai.attrs and by_id('aiBackdrop'),'DOM AI inert')
req(by_id('toast') and by_id('toast').attrs.get('aria-live')=='polite' and by_id('offlinePill') and by_id('offlinePill').attrs.get('role')=='status','DOM live')
req(next((n for n in by_class('sidebar')),None).attrs.get('role')=='navigation','DOM nav')
home=by_id('home');req(next((c for c in home.children if c.tag=='h1' and 'sr-only' in c.classes),None),'DOM home hierarchy')
mock=by_id('mockMenu');hist=direct(mock,'mock-history-details');req(direct(mock,'mock-secondary-details') and hist and contains(hist,by_id('mockHistoryList')),'DOM mock disclosure')
weak=by_id('weak');fold=direct(weak,'weak-detail-fold');req(fold and contains(fold,by_id('weakCategoryGrid')),'DOM weak disclosure')
coverage=by_id('coverage');req(any('coverage-summary-compact' in n.classes and '教材の総合進捗' in n.text() for n in coverage.descendants()),'DOM coverage')
req(len(by_class('b-mode-switcher'))==4,'DOM B switchers')

# v148 additional 10
req(by_id('planFocusCard') and by_id('planDetailsToggle'),'DOM plan priority')
history=by_id('history');req(history and any('analytics-priority-card' in n.classes for n in history.descendants()) and by_id('analyticsDetailsToggle'),'DOM analytics priority')
health=by_id('pwaHealthCard');req(health and any('data-maintenance-fold' in n.classes for n in health.descendants()) and any('recovery-fold' in n.classes for n in health.descendants()),'DOM data recovery folds')
req(all('aria-label' in n.attrs for n in nodes if n.tag=='button' and 'back' in n.classes),'DOM back labels')
req(by_id('weakTopAction'),'DOM weak top action')
req(by_id('rightDailyAction') and by_id('rightDailyProgress'),'DOM desktop daily action')
req(fab and 'ai-header-btn' in fab.classes and ancestor_tag(fab,'header'),'DOM AI header location')
req(by_id('problems') and by_id('quizSubmit') and any('quiz-actions' in n.classes for n in nodes),'DOM focused exercise CTA')
req(all(by_id(x) for x in ['subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']),'DOM Subject B next cards')
body=next((n for n in nodes if n.tag=='body'),None);visible=body.text(True) if body else ''
req('今日のクエスト' not in visible and 'クエスト完了' not in visible,'DOM legacy quest copy')
print('FEQUEST_V148_STATIC_DOM_OK 23/23')

scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
Path('/tmp/fe-v148-inline.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/fe-v148-inline.js'],check=True)

stub=r'''
const noop=()=>{};let dummy;
const methods=new Set(['addEventListener','removeEventListener','appendChild','removeChild','replaceChildren','insertBefore','setAttribute','removeAttribute','focus','blur','click','scrollIntoView','select','setSelectionRange','dispatchEvent','showModal','close','play','pause']);
const h={get(t,p){if(p===Symbol.iterator)return function*(){};if(p==='length')return 0;if(p==='classList')return {add:noop,remove:noop,toggle:()=>false,contains:()=>false,replace:()=>false};if(p==='style')return {setProperty:noop,removeProperty:noop};if(p==='dataset')return {};if(p==='value')return '';if(p==='checked'||p==='disabled')return false;if(p==='innerHTML'||p==='textContent'||p==='innerText')return '';if(p==='getContext')return ()=>null;if(p==='getBoundingClientRect')return ()=>({top:0,left:0,right:0,bottom:0,width:0,height:0});if(p==='querySelectorAll')return ()=>[];if(p==='querySelector')return ()=>dummy();if(p==='closest')return ()=>null;if(p==='matches'||p==='contains'||p==='hasAttribute')return ()=>false;if(p==='getAttribute')return ()=>null;if(methods.has(p))return noop;return Reflect.get(t,p)??noop;},set(t,p,v){t[p]=v;return true;}};
dummy=()=>new Proxy({},h);
globalThis.document=new Proxy({readyState:'loading',body:dummy(),documentElement:dummy(),activeElement:null,querySelectorAll:()=>[],querySelector:()=>dummy(),getElementById:()=>dummy(),getElementsByClassName:()=>[],getElementsByTagName:()=>[],createElement:()=>dummy(),createTextNode:()=>dummy(),createDocumentFragment:()=>dummy(),addEventListener:noop,removeEventListener:noop},h);
globalThis.window=globalThis;globalThis.addEventListener=noop;globalThis.removeEventListener=noop;globalThis.scrollTo=noop;globalThis.scrollBy=noop;
globalThis.location={href:'https://example.test/fe-quest/',origin:'https://example.test',pathname:'/fe-quest/',search:'',hash:'',assign:noop,replace:noop,reload:noop};globalThis.history={pushState:noop,replaceState:noop,back:noop,forward:noop,go:noop};
const store=()=>{const m=new Map();return {getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>[...m.keys()][i]??null,get length(){return m.size;}}};globalThis.localStorage=store();globalThis.sessionStorage=store();
globalThis.navigator={userAgent:'node-runtime-smoke',language:'ja-JP',languages:['ja-JP'],onLine:true,clipboard:{writeText:async()=>{}},serviceWorker:{register:async()=>({}),addEventListener:noop,removeEventListener:noop,controller:null}};
globalThis.matchMedia=()=>({matches:false,media:'',addEventListener:noop,removeEventListener:noop,addListener:noop,removeListener:noop});globalThis.getComputedStyle=()=>({getPropertyValue:()=>'',display:'block',visibility:'visible'});globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=noop;globalThis.setInterval=()=>0;globalThis.clearInterval=noop;globalThis.setTimeout=()=>0;globalThis.clearTimeout=noop;globalThis.alert=noop;globalThis.confirm=()=>true;globalThis.prompt=()=>'';
globalThis.fetch=async()=>({ok:true,status:200,type:'basic',json:async()=>({}),text:async()=>'',clone(){return this;}});globalThis.Notification=function(){};globalThis.Notification.permission='denied';globalThis.HTMLElement=class {};globalThis.Event=class{constructor(type,init={}){this.type=type;Object.assign(this,init)}};globalThis.CustomEvent=class extends globalThis.Event{constructor(type,init={}){super(type,init);this.detail=init.detail}};globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};globalThis.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};globalThis.CSS={escape:s=>String(s)};globalThis.__FEQUEST_RUNTIME_SMOKE__=true;
'''
checks=r'''
if(APP_VERSION!=='v148')throw new Error(`version ${APP_VERSION}`);
if(QUESTION_BANK.length!==710||new Set(QUESTION_BANK.map(q=>q.id)).size!==710)throw new Error('question shape');
if([0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',')!=='178,178,177,177')throw new Error('answer balance');
if(['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',')!=='166,323,221')throw new Error('cognitive balance');
const sc=globalThis.FEQUEST_SELF_CHECK;
if(!sc||sc.architecture!=='v148-quality-ux-current-contract'||!sc.ok||(sc.errors||[]).length)throw new Error(`self check ${JSON.stringify(sc?.errors)}`);
if(sc.currentContract?.total!==61||sc.currentContract?.passed!==61||sc.currentContract?.failed!==0)throw new Error(`current ${JSON.stringify(sc?.currentContract)}`);
const inv=sc.v148MigrationInventory;
if(!inv||inv.inheritedCurrentContracts!==53||inv.newlyMigratedGroups!==8||inv.migratedLegacyAssertionEquivalents!==15||inv.legacyShadowAssertCalls!==293||inv.compatibilityResidualCount!==0||inv.browserUiContracts!==23||inv.inheritedBrowserUiContracts!==13||inv.newBrowserUiContracts!==10)throw new Error(`inventory ${JSON.stringify(inv)}`);
const cue=sc.v148CueAudit;
if(Object.values(cue).some(v=>v!==0))throw new Error(`cue ${JSON.stringify(cue)}`);
const hist=sc.historicalDiagnostics;
if(hist?.rawErrorCount!==22||hist?.historicalMetadata?.length!==8||hist?.supersededSemantic?.length!==1||hist?.legacyUiSignals?.length!==13||hist?.residualActiveErrors?.length!==0)throw new Error(`historical ${JSON.stringify(hist)}`);
if(sc.browserUiContract?.mode!=='deferred-to-browser-dom'||sc.browserUiContract?.total!==23||(sc.uiDeferredWarnings||[]).length!==23)throw new Error('ui deferred');
if(sc.v148RuntimeMode!=='node-minimal-dom'||sc.v148DiagnosticContract?.activeErrorCount!==0)throw new Error('runtime mode');
console.log('FEQUEST_V148_RUNTIME_OK');
'''
runner=Path('/tmp/fe-v148-runtime.js');runner.write_text(stub+'\n'+js+'\n'+checks,encoding='utf-8')
r=subprocess.run(['node',str(runner)],capture_output=True,text=True)
print(r.stdout);print(r.stderr,file=sys.stderr)
if r.returncode!=0 or 'FEQUEST_V148_RUNTIME_OK' not in r.stdout:raise SystemExit(r.returncode or 1)
