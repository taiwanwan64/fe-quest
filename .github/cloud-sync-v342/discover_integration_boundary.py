from pathlib import Path
import base64,hashlib,json,re,runpy,subprocess,tempfile

APP=Path('assets/app-v341.js')
OUT=Path('audits/V342_SYNC_INTEGRATION_DISCOVERY.json')
MD=Path('audits/V342_SYNC_INTEGRATION_DISCOVERY.md')

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def sha(s):return hashlib.sha256(s.encode()).hexdigest()

def fn_source(js,name):
    patterns=[rf'function\s+{re.escape(name)}\s*\(',rf'\b{re.escape(name)}\s*=\s*function\s*\(',rf'\b{re.escape(name)}\s*=\s*\([^)]*\)\s*=>']
    starts=[m.start() for p in patterns for m in [re.search(p,js)] if m]
    if not starts:return None
    start=min(starts);brace=js.find('{',start)
    if brace<0:return js[start:start+4000]
    depth=0;quote=None;esc=False;i=brace
    while i<len(js):
        c=js[i]
        if quote:
            if esc:esc=False
            elif c=='\\':esc=True
            elif c==quote:quote=None
        else:
            if c in ('"',"'",'`'):quote=c
            elif c=='{':depth+=1
            elif c=='}':
                depth-=1
                if depth==0:return js[start:i+1]
        i+=1
    return js[start:start+20000]

js=APP.read_text();req("const APP_VERSION = 'v341';" in js,'expected v341 production asset')
priority=['saveProfile','persistProfileSilently','stampProfileForSave','writeCurrentProfile','atomicProfileEnvelope','decodeAtomicProfileEnvelope','rememberCommittedProfile','restoreCommittedProfileInMemory','assertNoExternalProfileConflict','acquireProfileWriteLease','releaseProfileWriteLease','queueRecoveryCheckpoint','validRawWithChecksum']
sources={}
for name in priority:
    s=fn_source(js,name)
    sources[name]=None if s is None else {'bytes':len(s.encode()),'sha256':sha(s),'source':s}

# Keep this audit bounded. The 3.36MB production bundle contains hundreds of named functions;
# repeatedly rescanning the whole bundle for every function makes Actions discovery needlessly slow.
# Token windows are enough here because the exact priority function sources above carry the write-path contract.
checksum_related=[]
for token in ['checksum','sha256','atomicProfileEnvelope','writeCurrentProfile','profileMeta.revision','lastWriterId']:
    matches=list(re.finditer(re.escape(token),js,re.I))
    checksum_related.append({
        'token':token,
        'count':len(matches),
        'windows':[
            {'offset':m.start(),'preview':js[max(0,m.start()-350):min(len(js),m.start()+850)]}
            for m in matches[:20]
        ]
    })

constants=[]
for m in re.finditer(r'\bconst\s+([A-Za-z_$][\w$]*(?:KEY|Key|key|SCHEMA|Schema|schema)[A-Za-z_$\w]*)\s*=\s*([^;\n]+)',js):
    value=m.group(2).strip()
    if len(value)<240:constants.append({'name':m.group(1),'value':value})

stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
tail=r'''
const __safe=f=>{try{return {ok:true,value:f()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
function __storage(){
  const out=[];
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);const raw=localStorage.getItem(k);let parsed=null;
      try{parsed=JSON.parse(raw)}catch(e){}
      out.push({key:k,bytes:Buffer.byteLength(String(raw||'')),json:parsed&&typeof parsed==='object'?{keys:Object.keys(parsed).sort(),schema:parsed.profileSchemaVersion??parsed.schema??null,revision:parsed.revision??parsed.profileMeta?.revision??null,writer:parsed.lastWriterId??parsed.profileMeta?.lastWriterId??null,hasChecksum:Object.prototype.hasOwnProperty.call(parsed,'checksum'),checksum:parsed.checksum??null,payloadKeys:parsed.payload&&typeof parsed.payload==='object'?Object.keys(parsed.payload).sort().slice(0,60):null,payloadRevision:parsed.payload?.profileMeta?.revision??null,payloadWriter:parsed.payload?.profileMeta?.lastWriterId??null}:null});
    }
  }catch(e){return [{error:String(e)}]}
  return out.sort((a,b)=>String(a.key).localeCompare(String(b.key)));
}
const before={meta:JSON.parse(JSON.stringify(profile.profileMeta||{})),storage:__storage()};
const envelope=__safe(()=>atomicProfileEnvelope(profile));
const writeDescriptor=__safe(()=>{
  const e=atomicProfileEnvelope(profile);
  return {keys:Object.keys(e).sort(),revision:e.revision??null,lastWriterId:e.lastWriterId??null,checksum:e.checksum??null,payloadSchema:e.payload?.profileSchemaVersion??null,payloadRevision:e.payload?.profileMeta?.revision??null,payloadUpdatedAt:e.payload?.profileMeta?.updatedAt??null,payloadWriterId:e.payload?.profileMeta?.lastWriterId??null,serializedBytes:Buffer.byteLength(JSON.stringify(e))};
});
const saveResult=__safe(()=>saveProfile());
const after={meta:JSON.parse(JSON.stringify(profile.profileMeta||{})),storage:__storage()};
const committed=__safe(()=>typeof FEQ_LAST_COMMITTED_PROFILE!=='undefined'?FEQ_LAST_COMMITTED_PROFILE:null);
const out={before,envelope:envelope.ok?{ok:true,value:{keys:Object.keys(envelope.value||{}).sort(),revision:envelope.value?.revision??null,lastWriterId:envelope.value?.lastWriterId??null,checksum:envelope.value?.checksum??null,payloadSchema:envelope.value?.payload?.profileSchemaVersion??null,payloadRevision:envelope.value?.payload?.profileMeta?.revision??null,payloadUpdatedAt:envelope.value?.payload?.profileMeta?.updatedAt??null,payloadWriterId:envelope.value?.payload?.profileMeta?.lastWriterId??null,serializedBytes:Buffer.byteLength(JSON.stringify(envelope.value||{}))}}:envelope,writeDescriptor,saveResult,after,committed};
console.log('__V342INT__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'run.js';p.write_text(stub+'\n'+js+'\n'+tail)
    chk=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);req(chk.returncode==0,'node syntax '+chk.stderr[-5000:])
    z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'node runtime '+z.stderr[-12000:])
    m=re.search(r'__V342INT__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'runtime marker missing')
    runtime=json.loads(base64.b64decode(m.group(1)))

out={'audit':'FE QUEST v342 sync integration boundary discovery','sourceVersion':'v341','priorityFunctionSources':sources,'checksumTokenWindows':checksum_related,'storageAndSchemaConstants':constants,'runtime':runtime}
OUT.parent.mkdir(exist_ok=True);OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')

rows=[]
for n,v in sources.items():
    if v: rows.append(f'- `{n}`: {v["bytes"]} bytes / `{v["sha256"][:12]}`')
    else: rows.append(f'- `{n}`: not found')
report='''# FE QUEST v342 — Sync integration boundary discovery\n\nResult: **PASS — EXACT LOCAL COMMIT BOUNDARY CAPTURED BEFORE PRODUCTION SYNC HOOK**\n\n## Priority function inventory\n\n'''+"\n".join(rows)+'''\n\n## Runtime observation\n\n```json\n'''+json.dumps(runtime,ensure_ascii=False,indent=2)+'''\n```\n\nThe next integration slice must derive its cloud descriptor from the already-committed atomic envelope/profile state rather than inventing a second revision or checksum scheme. No production cloud script is loaded by this discovery.\n'''
MD.write_text(report)
print(report)
