from pathlib import Path
import base64,hashlib,json,re,runpy,subprocess,tempfile

APP=Path('assets/app-v341.js')
INDEX=Path('index.html')
MAT=Path('.github/release/release_materialize.py')
VALID=Path('.github/release/release_validate.py')

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def sh(v): return hashlib.sha256(v.encode()).hexdigest()

def named_function_source(js,name):
    pats=[rf'function\s+{re.escape(name)}\s*\(',rf'\b{re.escape(name)}\s*=\s*function\s*\(',rf'\b{re.escape(name)}\s*=\s*\([^)]*\)\s*=>']
    starts=[]
    for p in pats:
        m=re.search(p,js)
        if m: starts.append(m.start())
    if not starts:return None
    start=min(starts);brace=js.find('{',start)
    if brace<0:return js[start:start+2000]
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
    return js[start:start+12000]

js=APP.read_text();req("const APP_VERSION = 'v341';" in js,'expected v341 app asset')
all_fn=sorted(set(re.findall(r'function\s+([A-Za-z_$][\w$]*)\s*\(',js)))
keywords=re.compile(r'(profile|backup|recovery|restore|storage|lease|migration|checksum|revision|export|import|persist|write|conflict|atomic)',re.I)
candidates=[n for n in all_fn if keywords.search(n)]
priority=['saveProfile','persistProfileSilently','stampProfileForSave','writeCurrentProfile','readCurrentProfile','acquireProfileWriteLease','releaseProfileWriteLease','markProfileConflict','restoreCommittedProfileInMemory','queueRecoveryCheckpoint','createRecoveryCheckpoint','validateImportedProfile','performLearningDataResetV333','migrateProfile','normalizeProfile','createDefaultProfile','defaultProfile']
for n in priority:
    if n not in candidates and named_function_source(js,n):candidates.append(n)
candidates=sorted(set(candidates))
fn={}
for n in candidates:
    s=named_function_source(js,n)
    if s: fn[n]={'bytes':len(s.encode()),'sha256':sh(s),'source':s[:16000]}

# Metadata ownership across all discovered persistence functions.
metadata_matrix=[]
for n,row in fn.items():
    s=row['source'];tokens=[x for x in ['revision','updatedAt','lastWriterId','profileSchemaVersion','checksum','writeCurrentProfile','acquireProfileWriteLease','queueRecoveryCheckpoint'] if x in s]
    if tokens:metadata_matrix.append({'function':n,'tokens':tokens})

key_literals=sorted(set(re.findall(r'(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*[\'\"]([^\'\"]+)',js)))
key_constants=[]
for m in re.finditer(r'\b(const|let|var)\s+([A-Za-z_$][\w$]*(?:KEY|Key|key)[A-Za-z_$\w]*)\s*=\s*[\'\"]([^\'\"]+)[\'\"]',js):
    key_constants.append({'name':m.group(2),'value':m.group(3)})
idb_literals=sorted(set(re.findall(r'indexedDB\.open\(\s*[\'\"]([^\'\"]+)',js)))

stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
tail=r'''
const __v342safe=f=>{try{return {ok:true,value:f()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const __v342names=__NAMES__;
const __v342sources={};for(const n of __v342names){try{const f=eval(n);if(typeof f==='function')__v342sources[n]=String(f).slice(0,16000)}catch(e){}}
let __v342storage={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);__v342storage[k]=localStorage.getItem(k)}}catch(e){__v342storage={error:String(e)}}
const __v342json=JSON.stringify(profile);
const __v342out={
 version:APP_VERSION,
 profileSchemaVersion:profile?.profileSchemaVersion??null,
 profileMeta:profile?.profileMeta??null,
 profileKeys:Object.keys(profile||{}).sort(),
 settingsKeys:Object.keys(profile?.settings||{}).sort(),
 profileJsonBytes:Buffer.byteLength(__v342json,'utf8'),
 profileSnapshot:__v342safe(()=>JSON.parse(__v342json)),
 functions:__v342sources,
 storageAfterBoot:__v342storage,
 contractFailures:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0},
 semantics:__v342safe(()=>validateSubjectBSemantics())
};
console.log('__V342DISC__'+Buffer.from(JSON.stringify(__v342out)).toString('base64'));
'''.replace('__NAMES__',json.dumps(sorted(fn.keys())))
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'run.js';p.write_text(stub+'\n'+js+'\n'+tail)
    z=subprocess.run(['node',str(p)],capture_output=True,text=True)
    req(z.returncode==0,'runtime discovery failed '+z.stderr[-12000:])
    m=re.search(r'__V342DISC__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'runtime marker')
    runtime=json.loads(base64.b64decode(m.group(1)))

meta_tokens={k:js.count(k) for k in ['profileSchemaVersion','revision','updatedAt','lastWriterId','checksum','last-known-good','migration','IndexedDB','indexedDB','BroadcastChannel','storage']}
network_tokens={k:js.count(k) for k in ['fetch(','WebSocket','EventSource','supabase','firebase','cloudSync','remoteSync']}
index=INDEX.read_text();materializer=MAT.read_text();validator=VALID.read_text()
split_release={
 'rootIndexIsSplitInclude':'{% include_relative app/base-shell-v341.html %}' in index,
 'materializerReadsRootIndex':"Path('index.html')" in materializer,
 'materializerRequiresInlinePreviousTitle':'previous title' in materializer,
 'materializerRequiresStableMetadataInclude':'stable metadata include missing' in materializer,
 'validatorReadsBuiltInlineScript':'<script' in validator or 'scripts' in validator,
 'needsSplitAwareReleaseToolingBeforeV342Materialization':True
}

def contains(n,token):return token in (fn.get(n,{}).get('source') or '')
write_boundary={
 'saveProfileCallsWriteCurrentProfile':contains('saveProfile','writeCurrentProfile'),
 'saveProfileUsesWriteLease':contains('saveProfile','acquireProfileWriteLease'),
 'saveProfileQueuesRecoveryCheckpoint':contains('saveProfile','queueRecoveryCheckpoint'),
 'stampProfileTouchesRevision':contains('stampProfileForSave','revision'),
 'stampProfileTouchesUpdatedAt':contains('stampProfileForSave','updatedAt'),
 'stampProfileTouchesLastWriterId':contains('stampProfileForSave','lastWriterId'),
 'writeCurrentProfileMentionsChecksum':contains('writeCurrentProfile','checksum') or contains('writeCurrentProfile','Checksum'),
}

out={
 'audit':'FE QUEST v342 cloud-sync contract discovery','sourceVersion':runtime['version'],'learnerFacingChange':'none',
 'productionAsset':{'path':str(APP),'bytes':APP.stat().st_size,'sha256':hashlib.sha256(APP.read_bytes()).hexdigest()},
 'runtime':runtime,'persistenceFunctionInventory':fn,'metadataOwnershipMatrix':metadata_matrix,
 'storageLiteralKeys':key_literals,'storageKeyConstants':key_constants,'indexedDBLiteralNames':idb_literals,
 'metadataTokenCounts':meta_tokens,'networkTokenCounts':network_tokens,'writeBoundaryEvidence':write_boundary,'splitReleaseTooling':split_release,
 'designConstraints':[
   'local profile remains usable with no account and no network','cloud write must happen only after local atomic save succeeds',
   'revision/updatedAt/lastWriterId must not be bypassed','recovery center and JSON export remain independent escape hatches',
   'old cloud data must never silently overwrite a newer local revision','provider SDK/network failure must not block saveProfile or app startup',
   'split-distribution release tooling must be made v342-aware before the version is materialized'
 ]
}
Path('audits').mkdir(exist_ok=True);Path('audits/V342_CLOUD_SYNC_CONTRACT_DISCOVERY.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
summary={
 'schema':runtime.get('profileSchemaVersion'),'profileMeta':runtime.get('profileMeta'),'profileJsonBytesAtFreshBoot':runtime.get('profileJsonBytes'),
 'profileKeyCount':len(runtime.get('profileKeys') or []),'settingsKeys':runtime.get('settingsKeys'),'persistenceFunctions':len(fn),
 'metadataOwnershipMatrix':metadata_matrix,'literalStorageKeys':len(key_literals),'indexedDBNames':idb_literals,
 'writeBoundaryEvidence':write_boundary,'networkTokens':network_tokens,'splitReleaseTooling':split_release
}
report='''# FE QUEST v342 — Cloud sync contract discovery\n\nResult: **PASS — CURRENT LOCAL-FIRST WRITE/RECOVERY CONTRACT INVENTORIED BEFORE CLOUD CODE**\n\n```json\n'''+json.dumps(summary,ensure_ascii=False,indent=2)+'''\n```\n\n## Decision\n\nCloud code must not be inserted inside the atomic local write before persistence succeeds. The safe first integration point is an asynchronous/outbox-style hook after a successful local commit, with revision metadata carried to the remote record. Authentication and provider failures must therefore be non-blocking for normal study.\n\nThe fresh profile JSON byte count is recorded because a one-record-per-user backend must leave ample headroom as question history grows. Provider selection should prefer a variable-schema JSON payload without forcing FE QUEST to shard its 33-key profile model prematurely.\n\nThe v341 distribution cutover also means the old stable release materializer still assumes an inline root template. v342 must make release tooling split-aware before attempting a conventional v342 materialization; this is a developer-release concern, not a learner data regression.\n\nDetailed source/function snapshots are stored in `audits/V342_CLOUD_SYNC_CONTRACT_DISCOVERY.json`.\n'''
Path('audits/V342_CLOUD_SYNC_CONTRACT_DISCOVERY.md').write_text(report)
print(report)
