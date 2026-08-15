from pathlib import Path
from html.parser import HTMLParser
import re, subprocess, sys

HTML_PATH=Path('_site/index.html')
html=HTML_PATH.read_text(encoding='utf-8')

class Node:
    __slots__=('tag','attrs','parent','children','texts')
    def __init__(self,tag='root',attrs=None,parent=None):
        self.tag=tag; self.attrs=dict(attrs or []); self.parent=parent; self.children=[]; self.texts=[]
    @property
    def classes(self): return set(self.attrs.get('class','').split())
    def text(self): return ''.join(self.texts)+''.join(c.text() for c in self.children)
    def descendants(self):
        for c in self.children:
            yield c
            yield from c.descendants()

class TreeParser(HTMLParser):
    VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root=Node(); self.stack=[self.root]
    def handle_starttag(self,tag,attrs):
        n=Node(tag,attrs,self.stack[-1]); self.stack[-1].children.append(n)
        if tag not in self.VOID: self.stack.append(n)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in self.VOID: self.handle_endtag(tag)
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag:
                self.stack=self.stack[:i]
                return
    def handle_data(self,data): self.stack[-1].texts.append(data)

p=TreeParser(); p.feed(html); root=p.root
all_nodes=[root,*root.descendants()]
def by_id(id_): return next((n for n in all_nodes if n.attrs.get('id')==id_),None)
def by_class(cls): return [n for n in all_nodes if cls in n.classes]
def descendants_with_class(n,cls): return [x for x in n.descendants() if cls in x.classes] if n else []
def ancestor_id(n,id_):
    cur=n.parent if n else None
    while cur:
        if cur.attrs.get('id')==id_: return True
        cur=cur.parent
    return False
def direct_child_class(n,cls): return next((c for c in (n.children if n else []) if cls in c.classes),None)
def contains_node(a,b):
    cur=b
    while cur:
        if cur is a: return True
        cur=cur.parent
    return False
def require(ok,msg):
    if not ok: raise AssertionError(msg)

# Static DOM structure: same 13 UI contracts grouped by v144.
require(len(by_class('result-detail-fold'))>=5 and len(by_class('result-more-actions'))>=5,'DOM v111 result hierarchy')
b=by_id('bMockResultList'); require(b and '次の科目B' in b.text(),'DOM v111 Subject B result next action')
require(by_id('home') is not None and by_id('startDiagnostic') is not None and '始める' in by_id('startDiagnostic').text(),'DOM v112 onboarding')
require(ancestor_id(by_id('installCard'),'pwaHealthCard'),'DOM v112 install location')
ai=by_id('aiDrawer'); fab=by_id('aiFab'); require(ai and ai.attrs.get('role')=='dialog' and fab and fab.attrs.get('aria-controls')=='aiDrawer','DOM v113 AI dialog')
require(ai is not None and 'inert' in ai.attrs and by_id('aiBackdrop') is not None,'DOM v113 AI inert/backdrop')
toast=by_id('toast'); off=by_id('offlinePill'); require(toast and toast.attrs.get('aria-live')=='polite' and off and off.attrs.get('role')=='status','DOM v113 live status')
sidebar=next((n for n in by_class('sidebar')),None); require(sidebar and sidebar.attrs.get('role')=='navigation','DOM v113 nav landmark')
home=by_id('home'); h1=next((c for c in home.children if c.tag=='h1'),None) if home else None; require(h1 and 'sr-only' in h1.classes,'DOM v114 home action-first')
mock=by_id('mockMenu'); sec=direct_child_class(mock,'mock-secondary-details'); hist=direct_child_class(mock,'mock-history-details'); mh=by_id('mockHistoryList'); require(sec and hist and mh and contains_node(hist,mh),'DOM v114 mock disclosure')
weak=by_id('weak'); fold=direct_child_class(weak,'weak-detail-fold'); wg=by_id('weakCategoryGrid'); require(fold and wg and contains_node(fold,wg),'DOM v114 weak disclosure')
coverage=by_id('coverage'); cov=next((n for n in descendants_with_class(coverage,'coverage-summary-compact')),None); require(cov and '教材の総合進捗' in cov.text(),'DOM v114 coverage summary')
require(len(by_class('b-mode-switcher'))==4,'DOM v110 Subject B mode switchers')
print('FEQUEST_V144_STATIC_DOM_OK 13/13')

# Syntax + Node minimal-DOM runtime smoke.
scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
Path('/tmp/fe-v144-inline.js').write_text(js,encoding='utf-8')
subprocess.run(['node','--check','/tmp/fe-v144-inline.js'],check=True)

stub=r'''
const noop=()=>{};
let dummy;
const methods=new Set(['addEventListener','removeEventListener','appendChild','removeChild','replaceChildren','insertBefore','setAttribute','removeAttribute','focus','blur','click','scrollIntoView','select','setSelectionRange','dispatchEvent','showModal','close','play','pause']);
const dummyHandler={
  get(t,p){
    if(p===Symbol.iterator)return function*(){};
    if(p==='length')return 0;
    if(p==='classList')return {add:noop,remove:noop,toggle:()=>false,contains:()=>false,replace:()=>false};
    if(p==='style')return {setProperty:noop,removeProperty:noop};
    if(p==='dataset')return {};
    if(p==='value')return '';
    if(p==='checked'||p==='disabled')return false;
    if(p==='innerHTML'||p==='textContent'||p==='innerText')return '';
    if(p==='getContext')return ()=>null;
    if(p==='getBoundingClientRect')return ()=>({top:0,left:0,right:0,bottom:0,width:0,height:0});
    if(p==='querySelectorAll')return ()=>[];
    if(p==='querySelector')return ()=>dummy();
    if(p==='closest')return ()=>null;
    if(p==='matches'||p==='contains'||p==='hasAttribute')return ()=>false;
    if(p==='getAttribute')return ()=>null;
    if(methods.has(p))return noop;
    return Reflect.get(t,p) ?? noop;
  },
  set(t,p,v){t[p]=v;return true;}
};
dummy=()=>new Proxy({},dummyHandler);
globalThis.document=new Proxy({
  readyState:'loading',body:dummy(),documentElement:dummy(),activeElement:null,
  querySelectorAll:()=>[],querySelector:()=>dummy(),getElementById:()=>dummy(),
  getElementsByClassName:()=>[],getElementsByTagName:()=>[],
  createElement:()=>dummy(),createTextNode:()=>dummy(),createDocumentFragment:()=>dummy(),
  addEventListener:noop,removeEventListener:noop
},dummyHandler);
globalThis.window=globalThis;
globalThis.addEventListener=noop;globalThis.removeEventListener=noop;
globalThis.scrollTo=noop;globalThis.scrollBy=noop;
globalThis.location={href:'https://example.test/fe-quest/',origin:'https://example.test',pathname:'/fe-quest/',search:'',hash:'',assign:noop,replace:noop,reload:noop};
globalThis.history={pushState:noop,replaceState:noop,back:noop,forward:noop,go:noop};
const makeStorage=()=>{const m=new Map();return {getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),clear:()=>m.clear(),key:i=>[...m.keys()][i]??null,get length(){return m.size;}}};
globalThis.localStorage=makeStorage();globalThis.sessionStorage=makeStorage();
globalThis.navigator={userAgent:'node-runtime-smoke',language:'ja-JP',languages:['ja-JP'],onLine:true,clipboard:{writeText:async()=>{}},serviceWorker:{register:async()=>({}),addEventListener:noop,removeEventListener:noop,controller:null}};
globalThis.matchMedia=()=>({matches:false,media:'',addEventListener:noop,removeEventListener:noop,addListener:noop,removeListener:noop});
globalThis.getComputedStyle=()=>({getPropertyValue:()=>'',display:'block',visibility:'visible'});
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=noop;
globalThis.setInterval=()=>0;globalThis.clearInterval=noop;globalThis.setTimeout=(fn,ms)=>0;globalThis.clearTimeout=noop;
globalThis.alert=noop;globalThis.confirm=()=>true;globalThis.prompt=()=>'';
globalThis.fetch=async()=>({ok:true,status:200,type:'basic',json:async()=>({}),text:async()=>'',clone(){return this;}});
globalThis.Notification=function(){};globalThis.Notification.permission='denied';
globalThis.HTMLElement=class {};
globalThis.Event=class {constructor(type,init={}){this.type=type;Object.assign(this,init);}};
globalThis.CustomEvent=class extends globalThis.Event {constructor(type,init={}){super(type,init);this.detail=init.detail;}};
globalThis.ResizeObserver=class {observe(){} unobserve(){} disconnect(){}};
globalThis.IntersectionObserver=class {observe(){} unobserve(){} disconnect(){}};
globalThis.CSS={escape:s=>String(s)};
globalThis.__FEQUEST_RUNTIME_SMOKE__=true;
'''
checks=r'''
if(APP_VERSION!=='v144') throw new Error(`runtime smoke: APP_VERSION ${APP_VERSION}`);
if(QUESTION_BANK.length!==710) throw new Error(`runtime smoke: question count ${QUESTION_BANK.length}`);
if(new Set(QUESTION_BANK.map(q=>q.id)).size!==710) throw new Error('runtime smoke: duplicate question id');
const ans=[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',');
if(ans!=='178,178,177,177') throw new Error(`runtime smoke: answer distribution ${ans}`);
const cog=['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',');
if(cog!=='166,323,221') throw new Error(`runtime smoke: cognitive distribution ${cog}`);
if(!Array.isArray(globalThis.V144_UI_CONTRACTS)||V144_UI_CONTRACTS.length!==13) throw new Error('runtime smoke: v144 UI contract definitions');
const sc=globalThis.FEQUEST_SELF_CHECK;
if(!sc) throw new Error('runtime smoke: self-check missing');
if(!sc.ok||(sc.errors||[]).length!==0) throw new Error(`runtime smoke: active errors ${JSON.stringify(sc.errors)}`);
if(sc.v144RuntimeMode!=='node-minimal-dom') throw new Error(`runtime smoke: mode ${sc.v144RuntimeMode}`);
if((sc.uiDeferredWarnings||[]).length!==13) throw new Error(`runtime smoke: UI deferred ${(sc.uiDeferredWarnings||[]).length}`);
if((sc.historicalMetadataWarnings||[]).length!==8) throw new Error(`runtime smoke: historical ${(sc.historicalMetadataWarnings||[]).length}`);
if((sc.supersededSemanticWarnings||[]).length!==1) throw new Error(`runtime smoke: semantic ${(sc.supersededSemanticWarnings||[]).length}`);
if((sc.warnings||[]).some(x=>String(x).startsWith('legacy audit metadata: ')||String(x).startsWith('browser DOM contract deferred in node smoke: '))) throw new Error(`runtime smoke: warning noise ${JSON.stringify(sc.warnings)}`);
if(sc.v144UiContract?.mode!=='deferred-to-browser-dom'||sc.v144UiContract?.total!==13) throw new Error(`runtime smoke: ui report ${JSON.stringify(sc.v144UiContract)}`);
if(sc.v144DiagnosticContract?.activeErrorCount!==0||sc.v144DiagnosticContract?.historicalMetadataCount!==8||sc.v144DiagnosticContract?.supersededSemanticCount!==1) throw new Error(`runtime smoke: diagnostic contract ${JSON.stringify(sc.v144DiagnosticContract)}`);
console.log('FEQUEST_V144_RUNTIME_OK');
'''
runner=Path('/tmp/fe-v144-runtime.js'); runner.write_text(stub+'\n'+js+'\n'+checks,encoding='utf-8')
r=subprocess.run(['node',str(runner)],capture_output=True,text=True)
print(r.stdout)
print(r.stderr,file=sys.stderr)
if r.returncode!=0 or 'FEQUEST_V144_RUNTIME_OK' not in r.stdout:
    raise SystemExit(r.returncode or 1)
