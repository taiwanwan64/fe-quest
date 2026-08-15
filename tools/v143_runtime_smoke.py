from pathlib import Path
import re, subprocess, sys

html = Path('_site/index.html').read_text(encoding='utf-8')
scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
Path('/tmp/fe-v143-inline.js').write_text(js, encoding='utf-8')
subprocess.run(['node', '--check', '/tmp/fe-v143-inline.js'], check=True)

stub = r'''
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

checks = r'''
if(APP_VERSION!=='v143') throw new Error(`runtime smoke: APP_VERSION ${APP_VERSION}`);
if(QUESTION_BANK.length!==710) throw new Error(`runtime smoke: question count ${QUESTION_BANK.length}`);
if(new Set(QUESTION_BANK.map(q=>q.id)).size!==710) throw new Error('runtime smoke: duplicate question id');
const ans=[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length).join(',');
if(ans!=='178,178,177,177') throw new Error(`runtime smoke: answer distribution ${ans}`);
const cog=['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length).join(',');
if(cog!=='166,323,221') throw new Error(`runtime smoke: cognitive distribution ${cog}`);
const a=globalThis.SUBJECT_A_V143_ACTIVE_QUALITY_AUDIT;
if(!a) throw new Error('runtime smoke: v143 audit missing');
if(a.optionOutliersBefore.length!==9||a.optionOutliersAfter.length!==0) throw new Error(`runtime smoke: option outliers ${JSON.stringify(a)}`);
if(a.depthShortBefore.length!==32||a.depthShortAfter.length!==0) throw new Error(`runtime smoke: depth contract ${JSON.stringify(a)}`);
if(String(a.oldJudgmentOption).indexOf('だけ確認する')<0||String(a.newJudgmentOption).indexOf('だけ確認する')>=0) throw new Error('runtime smoke: judgment cue contract');
const sc=globalThis.FEQUEST_SELF_CHECK;
if(!sc||!sc.v143DataContract) throw new Error('runtime smoke: v143 self-check missing');
if(!sc.ok||(sc.errors||[]).length!==0) throw new Error(`runtime smoke: active errors ${JSON.stringify(sc.errors)}`);
if((sc.legacyWarnings||[]).length!==9) throw new Error(`runtime smoke: legacy warnings ${(sc.legacyWarnings||[]).length}`);
if((sc.uiDeferredWarnings||[]).length!==13) throw new Error(`runtime smoke: UI deferred ${(sc.uiDeferredWarnings||[]).length}`);
if(sc.v143RuntimeMode!=='node-minimal-dom') throw new Error(`runtime smoke: mode ${sc.v143RuntimeMode}`);
if(sc.v143DataContract.optionOutlierCount!==0||sc.v143DataContract.depthShortCount!==0||sc.v143DataContract.judgmentGiveawayCount!==0||sc.v143DataContract.dataErrorCount!==0) throw new Error(`runtime smoke: data contract ${JSON.stringify(sc.v143DataContract)}`);
console.log('FEQUEST_V143_RUNTIME_OK');
'''

runner = Path('/tmp/fe-v143-runtime.js')
runner.write_text(stub + '\n' + js + '\n' + checks, encoding='utf-8')
result = subprocess.run(['node', str(runner)], capture_output=True, text=True)
print(result.stdout)
print(result.stderr, file=sys.stderr)
if result.returncode != 0 or 'FEQUEST_V143_RUNTIME_OK' not in result.stdout:
    raise SystemExit(result.returncode or 1)
