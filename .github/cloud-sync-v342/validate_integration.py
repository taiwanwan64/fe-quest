from pathlib import Path
import base64, hashlib, json, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

paths={
    'app':Path('assets/app-v341.js'),
    'contract':Path('cloud/sync-contract-v342.js'),
    'state':Path('cloud/sync-state-v342.js'),
    'engine':Path('cloud/sync-engine-v342.js'),
    'transport':Path('cloud/supabase/transport-v342.js'),
    'adapter':Path('cloud/production-adapter-v342.js'),
    'sql':Path('cloud/supabase/v342_schema.sql'),
    'shell':Path('app/base-shell-v341.html')
}
for p in paths.values(): req(p.exists(),f'missing {p}')

# Cloud integration must not mutate the proven v341 application asset in this slice.
main_app=subprocess.run(['git','show','origin/main:assets/app-v341.js'],capture_output=True,text=False)
req(main_app.returncode==0,'cannot read main app asset')
branch_bytes=paths['app'].read_bytes()
req(hashlib.sha256(main_app.stdout).hexdigest()==hashlib.sha256(branch_bytes).hexdigest(),'v341 production app asset changed')

stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
modules='\n'.join(paths[k].read_text() for k in ['contract','state','engine','transport','adapter'])

tail=r'''
const cases=[];
const ok=(name,cond)=>cases.push({name,pass:Boolean(cond)});
const userA='11111111-1111-4111-8111-111111111111';
let authUser=null;
let transportCalls=[];
let transportMode='success';
const fakeTransport={commitProfile:async x=>{
  transportCalls.push(x);
  if(transportMode==='offline')return {ok:false,error:{kind:'network',retryable:true,message:'offline'}};
  return {ok:true,response:{sync_status:x.baseRemoteRevision==null?'uploaded-new':'uploaded-update',remote_revision:x.profileRevision,remote_checksum:x.payloadChecksum,remote_payload:x.payload}};
}};

const firstAtomic=currentAtomicProfile();
ok('existing atomic profile exposes local FNV checksum',firstAtomic&&/^fnv1a32:[0-9a-f]{8}$/.test(firstAtomic.checksum));
const firstDescriptor=FEQUEST_PRODUCTION_SYNC_ADAPTER_V342.descriptorFromAtomicRecord(firstAtomic);
ok('adapter descriptor reuses exact local revision checksum writer and payload',firstDescriptor.revision===firstAtomic.revision&&firstDescriptor.checksum===firstAtomic.checksum&&firstDescriptor.writerId===firstAtomic.writerId&&firstDescriptor.payload.profileMeta.revision===firstAtomic.revision);

const bridge=FEQUEST_PRODUCTION_SYNC_ADAPTER_V342.createProductionBridge({
  engineApi:FEQUEST_SYNC_ENGINE_V342,
  contract:FEQUEST_SYNC_CONTRACT_V342,
  stateApi:FEQUEST_SYNC_STATE_V342,
  storage:localStorage,
  transport:fakeTransport,
  getAuthenticatedUserId:()=>authUser,
  warn:()=>{}
});
const originalWriter=writeCurrentProfile;
const installed=bridge.install();
ok('production bridge installs one post-commit observer',installed.ok&&bridge.isInstalled()&&writeCurrentProfile!==originalWriter);

const beforeDisabled=currentAtomicProfile();
const disabledSave=saveProfile();
const afterDisabled=currentAtomicProfile();
const disabledState=bridge.engine.status();
ok('disabled cloud never blocks or queues a successful local save',disabledSave===true&&afterDisabled.revision===beforeDisabled.revision+1&&disabledState.userId===null&&disabledState.pending===null&&transportCalls.length===0);

authUser=userA;
const enabled=bridge.engine.enableForCurrentUser();
ok('explicit enable queues already committed local snapshot without network',enabled.ok&&enabled.state.pending.profileRevision===afterDisabled.revision&&enabled.state.pending.payloadChecksum===afterDisabled.checksum&&transportCalls.length===0);

const beforeQueued=currentAtomicProfile();
const queuedSave=saveProfile();
const afterQueued=currentAtomicProfile();
const queuedState=bridge.engine.status();
ok('post-save hook queues only the newly committed revision',queuedSave===true&&afterQueued.revision===beforeQueued.revision+1&&queuedState.pending.profileRevision===afterQueued.revision&&queuedState.pending.payloadChecksum===afterQueued.checksum&&transportCalls.length===0);

const flushed=await bridge.engine.flush();
const sent=transportCalls[0];
ok('flush sends local revision checksum writer and exact profile payload',flushed.ok&&sent.profileRevision===afterQueued.revision&&sent.payloadChecksum===afterQueued.checksum&&sent.writerId===afterQueued.writerId&&sent.payload.profileMeta.revision===afterQueued.revision&&bridge.engine.status().pending===null);

profileWriteBlocked=true;
const blockedRevision=currentAtomicProfile().revision;
const blocked=saveProfile();
profileWriteBlocked=false;
ok('blocked local save creates no cloud outbox mutation',blocked===false&&currentAtomicProfile().revision===blockedRevision&&bridge.engine.status().pending===null);

transportMode='offline';
const offlineLocal=saveProfile();
const offlineAtomic=currentAtomicProfile();
const offlineFlush=await bridge.engine.flush();
ok('network failure cannot roll back successful local commit',offlineLocal===true&&!offlineFlush.ok&&offlineFlush.retryable===true&&currentAtomicProfile().revision===offlineAtomic.revision&&bridge.engine.status().pending.profileRevision===offlineAtomic.revision);
transportMode='success';

const uninstalled=bridge.uninstall();
ok('bridge can restore original local writer exactly',uninstalled.ok&&!bridge.isInstalled()&&writeCurrentProfile===originalWriter);

// v1 foundation metadata with a bare SHA-256 migrates locally without touching learner profile data.
class M {constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const legacy=new M();
legacy.setItem(FEQUEST_SYNC_STATE_V342.STORAGE_KEY,JSON.stringify({storeVersion:1,contractVersion:1,userId:userA,lastSyncedRemoteRevision:9,lastSyncedSha256:'a'.repeat(64),pending:{baseRemoteRevision:9,profileRevision:10,payloadSha256:'b'.repeat(64)}}));
const migrated=FEQUEST_SYNC_STATE_V342.load(legacy);
ok('legacy foundation metadata migrates to algorithm-prefixed checksum',migrated.storeVersion===2&&migrated.lastSyncedChecksum==='sha256:'+'a'.repeat(64)&&migrated.pending.payloadChecksum==='sha256:'+'b'.repeat(64));

// Real Supabase transport accepts the local FNV checksum and maps it to p_payload_checksum.
let captured=null;
const supa=FEQUEST_SUPABASE_TRANSPORT_V342.createSupabaseTransport({
  url:'https://example.supabase.co',
  anonKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz',
  getAccessToken:async()=>'user-access-token-abcdefghijklmnopqrstuvwxyz',
  fetchImpl:async(url,opts)=>{captured={url,opts};const body=JSON.parse(opts.body);return {ok:true,status:200,text:async()=>JSON.stringify([{sync_status:'uploaded-update',remote_revision:body.p_profile_revision,remote_checksum:body.p_payload_checksum,remote_payload:body.p_payload}])}}
});
const t=await supa.commitProfile({userId:userA,baseRemoteRevision:3,profileSchemaVersion:5,profileRevision:4,clientUpdatedAt:'2026-08-22T00:00:00Z',writerId:'device-a',payload:{profileSchemaVersion:5,profileMeta:{revision:4}},payloadChecksum:'fnv1a32:1234abcd'});
const body=JSON.parse(captured.opts.body);
ok('Supabase transport carries prefixed local checksum through guarded RPC',t.ok&&body.p_payload_checksum==='fnv1a32:1234abcd'&&t.response.remote_checksum==='fnv1a32:1234abcd'&&captured.url.endsWith('/rest/v1/rpc/fequest_commit_profile_v342'));

console.log('__V342_INTEGRATION__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
'''

# Wrap tail in async IIFE because production app itself is classic synchronous JavaScript.
program=stub+'\n'+paths['app'].read_text()+'\n'+modules+'\n;(async()=>{\n'+tail+'\n})().catch(e=>{console.error(e);process.exit(1)});\n'
with tempfile.TemporaryDirectory() as td:
    js=Path(td)/'integration.js';js.write_text(program)
    chk=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
    req(chk.returncode==0,'node syntax failed '+chk.stderr[-8000:])
    z=subprocess.run(['node',str(js)],capture_output=True,text=True)
    req(z.returncode==0,'integration runtime failed '+z.stderr[-12000:])
    m=re.search(r'__V342_INTEGRATION__([A-Za-z0-9+/=]+)',z.stdout)
    req(m is not None,'integration marker missing')
    data=json.loads(base64.b64decode(m.group(1)))

req(data['allPassed'],'integration cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=11,'integration coverage too small')

sql=paths['sql'].read_text()
req('payload_checksum' in sql and 'p_payload_checksum' in sql and 'remote_checksum' in sql,'checksum-aware SQL contract missing')
req("p_profile_revision = v_row.profile_revision\n     and p_payload = v_row.payload" in sql,'same-revision RPC must compare JSONB payload equality')
req('and p_payload_checksum = v_row.payload_checksum' not in sql,'same-revision idempotency must not rely on checksum equality alone')
req("alter table public.user_profiles drop column if exists payload_sha256" in sql,'legacy foundation SHA column migration missing')
req('security definer' in sql.lower() and 'auth.uid()' in sql and 'force row level security' in sql.lower(),'Supabase ownership protections missing')

shell=paths['shell'].read_text()
for inactive in ['cloud/production-adapter-v342.js','cloud/sync-engine-v342.js','cloud/supabase/transport-v342.js']:
    req(inactive not in shell,f'cloud integration unexpectedly production-loaded: {inactive}')

combined='\n'.join(paths[k].read_text() for k in ['contract','state','engine','transport','adapter'])
for forbidden in ['SUPABASE_SERVICE_ROLE','sb_secret_','service_role=']:
    req(forbidden not in combined,f'forbidden credential marker {forbidden}')
req('fetch(' not in paths['engine'].read_text(),'engine gained direct network call')
req('fetch(' not in paths['adapter'].read_text(),'production adapter gained direct network call')

names=[x['name'] for x in data['cases']]
report=f'''# FE QUEST v342 — Production save boundary integration validation\n\nResult: **PASS — {data['count']} / {data['count']} LOCAL-FIRST INTEGRATION CASES PASS**\n\n- the v341 application asset is byte-for-byte unchanged from `main` in this slice\n- the production adapter reuses the committed atomic revision, `fnv1a32:` checksum, writer id, timestamp, and profile payload\n- cloud-disabled saves stay fully local and perform zero transport calls\n- explicit enable queues the current committed snapshot without network activity\n- later successful local writes queue only after `writeCurrentProfile()` returns\n- blocked/failed local writes do not create outbox entries\n- offline flush failure leaves the committed local revision intact and pending for retry\n- legacy foundation bare-SHA metadata migrates to an algorithm-prefixed checksum locally\n- Supabase transport now sends `p_payload_checksum` instead of inventing a second production checksum\n- same-revision RPC idempotency compares JSONB payload equality, so FNV-1a collisions cannot silently merge divergent learner data\n- RLS/auth ownership and guarded RPC-only writes remain intact\n- the adapter/engine/transport remain absent from the v341 production shell until authentication and conflict UI are ready\n\nProduction activation is intentionally still disabled. The next slice can add the authenticated session/config boundary and learner-facing sync controls without changing the local persistence contract.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_PRODUCTION_SAVE_INTEGRATION.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-production-integration-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-production-integration-v342','result':'PASS','caseCount':data['count'],'validatedCases':names,'productionLoaded':False,'localChecksum':'fnv1a32','sameRevisionServerComparison':'jsonb-payload-equality'},ensure_ascii=True,indent=2)+'\n')
print(report)
