from pathlib import Path
import base64,json,re,runpy,subprocess,tempfile

html=Path('_site/index.html').read_text()
scripts='\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']

def around(term, radius=1100):
    i=scripts.find(term)
    return None if i<0 else scripts[max(0,i-radius):min(len(scripts),i+len(term)+radius)]

def html_around(term, radius=1600):
    i=html.find(term)
    return None if i<0 else html[max(0,i-radius):min(len(html),i+len(term)+radius)]

tail=r'''
const safe=(f)=>{try{return {ok:true,value:f()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const names=['saveProfile','loadProfile','newProfile','createProfile','createDefaultProfile','defaultProfile','makeDefaultProfile','freshProfile','resetProfile','exportData','importData','backupData','restoreData','getDailyRecord','ensureQuestionProfile','normalizeProfile','migrateProfile'];
const sources={};
for(const n of names){try{const v=eval(n);sources[n]=typeof v==='function'?String(v).slice(0,12000):(v===undefined?null:v)}catch(e){sources[n]=null}}
const summarize=(v)=>{
  if(v===null)return {type:'null',value:null};
  if(Array.isArray(v))return {type:'array',length:v.length,first:v.slice(0,3)};
  if(typeof v==='object'){const ks=Object.keys(v);return {type:'object',keyCount:ks.length,keys:ks.slice(0,80)};}
  return {type:typeof v,value:v};
};
const profileSummary={};for(const [k,v] of Object.entries(profile))profileSummary[k]=summarize(v);
const storage=safe(()=>{const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);out.push({key:k,bytes:String(localStorage.getItem(k)||'').length})}return out});
console.log('__RESET_INSPECT__'+Buffer.from(JSON.stringify({v:APP_VERSION,profileKeys:Object.keys(profile),profileSummary,sources,storage})).toString('base64'));
'''
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'rt.js'; p.write_text(stub+'\n'+scripts+'\n'+tail)
    z=subprocess.run(['node',str(p)],capture_output=True,text=True)
    if z.returncode!=0: raise SystemExit(z.stderr[-16000:])
    m=re.search(r'__RESET_INSPECT__([A-Za-z0-9+/=]+)',z.stdout)
    if not m: raise SystemExit('marker missing')
    data=json.loads(base64.b64decode(m.group(1)))

out={
 'runtime':data,
 'scriptSnippets':{
   'profileAssign':around('profile='),
   'profileSpacedAssign':around('profile ='),
   'saveProfile':around('function saveProfile'),
   'loadProfile':around('function loadProfile'),
   'storageSet':around('localStorage.setItem'),
   'dailyMinutes':around('dailyMinutes'),
   'examDate':around('examDate'),
 },
 'htmlSnippets':{
   'appData':html_around('アプリ・データ'),
   'dataManagement':html_around('データ管理'),
   'recovery':html_around('復旧センター'),
   'backup':html_around('バックアップ'),
 }
}
print('__RESET_INSPECT_JSON__')
print(json.dumps(out,ensure_ascii=False,indent=2)[:60000])
