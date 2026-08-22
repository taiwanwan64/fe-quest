from pathlib import Path
import base64,json,re,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

paths=[
    Path('cloud/sync-contract-v342.js'),
    Path('cloud/sync-state-v342.js'),
    Path('cloud/supabase/transport-v342.js')
]
for p in paths:req(p.exists(),f'missing {p}')

node=r'''
const C=require(process.argv[2]);
const S=require(process.argv[3]);
const T=require(process.argv[4]);
const sha=c=>String(c).repeat(64).slice(0,64);
class MemoryStorage{
  constructor(seed={}){this.m=new Map(Object.entries(seed))}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
}
const cases=[];
function ok(name,cond,detail){cases.push({name,pass:Boolean(cond),detail:detail||null})}
(async()=>{
  const storage=new MemoryStorage({learnerProfile:'DO_NOT_TOUCH',[S.STORAGE_KEY]:'{bad json'});
  const recovered=S.load(storage);
  ok('corrupt sync metadata is isolated',recovered.userId===null&&storage.getItem('learnerProfile')==='DO_NOT_TOUCH');

  let b=S.bindUser(storage,'11111111-1111-4111-8111-111111111111');
  ok('first account binding succeeds',b.ok&&b.state.userId==='11111111-1111-4111-8111-111111111111');
  const mismatch=S.bindUser(storage,'22222222-2222-4222-8222-222222222222');
  ok('different account never inherits ancestry',!mismatch.ok&&mismatch.reason==='account-mismatch'&&mismatch.state.userId===b.state.userId);

  let q=S.queue(storage,C,{revision:11,sha256:sha('b'),updatedAt:'2026-01-01T00:00:00Z',writerId:'A'},b.state.userId);
  q=S.queue(storage,C,{revision:15,sha256:sha('c'),updatedAt:'2026-01-02T00:00:00Z',writerId:'A'},b.state.userId);
  ok('outbox coalesces to latest local commit',q.ok&&q.state.pending.profileRevision===15&&q.state.pending.payloadSha256===sha('c'));
  ok('outbox does not invent remote ancestry',q.state.pending.baseRemoteRevision===null&&q.state.lastSyncedRemoteRevision===null);

  const ack=S.acknowledge(storage,C,{sync_status:'uploaded-new',remote_revision:15,remote_sha256:sha('c')});
  ok('successful ack advances base and clears pending',ack.pending===null&&ack.lastSyncedRemoteRevision===15&&ack.lastSyncedSha256===sha('c'));
  S.clearAccountBinding(storage);
  ok('sign-out sync reset leaves learner storage untouched',storage.getItem('learnerProfile')==='DO_NOT_TOUCH'&&S.load(storage).userId===null);

  let rejected=false;
  try{T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:'service_role_REDACTED_NOT_ALLOWED',getAccessToken:async()=>null,fetchImpl:async()=>{}})}catch(e){rejected=/forbidden/i.test(String(e))}
  ok('service-role style key rejected',rejected);

  let fetchCount=0;
  const noSession=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz',getAccessToken:async()=>null,fetchImpl:async()=>{fetchCount++;throw Error('must not fetch')}});
  const noSessionResult=await noSession.readProfile('11111111-1111-4111-8111-111111111111');
  ok('no auth session makes zero network calls',!noSessionResult.ok&&noSessionResult.error.kind==='auth'&&fetchCount===0);

  let captured=null;
  const fetchRead=async(url,opts)=>{captured={url,opts};return {ok:true,status:200,text:async()=>JSON.stringify([{profile_schema_version:5,profile_revision:7,client_updated_at:'2026-01-01T00:00:00Z',writer_id:'A',payload:{xp:1},payload_sha256:sha('a'),server_updated_at:'2026-01-01T00:00:01Z'}])}};
  const tr=T.createSupabaseTransport({url:'https://example.supabase.co/',anonKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz',getAccessToken:async()=>'user-access-token-abcdefghijklmnopqrstuvwxyz',fetchImpl:fetchRead});
  const read=await tr.readProfile('11111111-1111-4111-8111-111111111111');
  ok('read uses authenticated RLS REST request',read.ok&&read.remote.revision===7&&captured.url.includes('/rest/v1/user_profiles?')&&captured.opts.headers.apikey.startsWith('public-anon')&&captured.opts.headers.Authorization.startsWith('Bearer user-access'));

  captured=null;
  const fetchCommit=async(url,opts)=>{captured={url,opts};return {ok:true,status:200,text:async()=>JSON.stringify([{sync_status:'uploaded-update',remote_revision:8,remote_sha256:sha('b'),remote_client_updated_at:'2026-01-02T00:00:00Z',remote_server_updated_at:'2026-01-02T00:00:01Z',remote_payload:{xp:2}}])}};
  const tr2=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz',getAccessToken:async()=>'user-access-token-abcdefghijklmnopqrstuvwxyz',fetchImpl:fetchCommit});
  const committed=await tr2.commitProfile({userId:'11111111-1111-4111-8111-111111111111',baseRemoteRevision:7,profileSchemaVersion:5,profileRevision:8,clientUpdatedAt:'2026-01-02T00:00:00Z',writerId:'A',payload:{xp:2},payloadSha256:sha('b')});
  const body=JSON.parse(captured.opts.body);
  ok('commit uses guarded RPC not blind table upsert',committed.ok&&committed.response.sync_status==='uploaded-update'&&captured.url.endsWith('/rest/v1/rpc/fequest_commit_profile_v342')&&body.p_base_remote_revision===7&&body.p_profile_revision===8&&body.p_payload.xp===2);

  const conflictFetch=async()=>({ok:true,status:200,text:async()=>JSON.stringify([{sync_status:'remote-changed-conflict',remote_revision:9,remote_sha256:sha('d'),remote_payload:{xp:99}}])});
  const tr3=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz',getAccessToken:async()=>'user-access-token-abcdefghijklmnopqrstuvwxyz',fetchImpl:conflictFetch});
  const conflict=await tr3.commitProfile({userId:'11111111-1111-4111-8111-111111111111',baseRemoteRevision:7,profileSchemaVersion:5,profileRevision:8,clientUpdatedAt:'2026-01-02T00:00:00Z',writerId:'A',payload:{xp:2},payloadSha256:sha('b')});
  ok('application conflict is returned for explicit reconciliation',conflict.ok&&conflict.response.sync_status==='remote-changed-conflict'&&conflict.response.remote_revision===9);

  const network=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz',getAccessToken:async()=>'user-access-token-abcdefghijklmnopqrstuvwxyz',fetchImpl:async()=>{throw Error('offline')}});
  const net=await network.readProfile('11111111-1111-4111-8111-111111111111');
  ok('network error is retryable and nonthrowing',!net.ok&&net.error.kind==='network'&&net.error.retryable===true);

  const auth=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz',getAccessToken:async()=>'user-access-token-abcdefghijklmnopqrstuvwxyz',fetchImpl:async()=>({ok:false,status:401,text:async()=>JSON.stringify({message:'expired'})})});
  const ar=await auth.readProfile('11111111-1111-4111-8111-111111111111');
  ok('expired session is classified as auth failure',!ar.ok&&ar.error.kind==='auth'&&ar.error.retryable===false);

  const provider=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz',getAccessToken:async()=>'user-access-token-abcdefghijklmnopqrstuvwxyz',fetchImpl:async()=>({ok:false,status:503,text:async()=>JSON.stringify({message:'down'})})});
  const pr=await provider.readProfile('11111111-1111-4111-8111-111111111111');
  ok('provider outage remains retryable',!pr.ok&&pr.error.kind==='provider'&&pr.error.retryable===true);

  const out={cases,allPassed:cases.every(x=>x.pass),count:cases.length,storageKey:S.STORAGE_KEY,rpc:T.RPC_NAME};
  console.log('__V342_TRANSPORT__'+Buffer.from(JSON.stringify(out)).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''

with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'run.js';p.write_text(node)
    z=subprocess.run(['node',str(p),*(str(x.resolve()) for x in paths)],capture_output=True,text=True)
    req(z.returncode==0,'transport node validation failed '+z.stderr[-12000:])
    m=re.search(r'__V342_TRANSPORT__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'transport marker missing')
    data=json.loads(base64.b64decode(m.group(1)))

req(data['allPassed'],'transport cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=13,'transport coverage too small')

combined='\n'.join(p.read_text() for p in paths)
for forbidden in ['SUPABASE_SERVICE_ROLE','sb_secret_','service_role=']:
    req(forbidden not in combined,'hardcoded secret marker '+forbidden)
req('fetch(' not in Path('assets/app-v341.js').read_text(),'v341 production app unexpectedly gained cloud network call')

summary={
    'caseCount':data['count'],'allPassed':True,
    'syncStateSeparateFromProfileSchema':True,
    'accountMismatchBlocksCrossAccountAncestry':True,
    'noSessionNoNetwork':True,
    'networkErrorsNonThrowingRetryable':True,
    'rpcOnlyWrites':True,
    'serviceRoleCredentialForbidden':True,
    'productionV341StillCloudFree':True
}
report=f'''# FE QUEST v342 — Optional sync transport validation\n\nResult: **PASS — CREDENTIAL-FREE OPTIONAL TRANSPORT + ISOLATED OUTBOX METADATA PRESERVE LOCAL-FIRST SAFETY**\n\n- deterministic transport/store cases: **{data['count']} / {data['count']} PASS**\n- sync metadata stored outside profile schema under `{data['storageKey']}`\n- corrupt sync metadata cannot delete or block learner profile data\n- different account cannot inherit prior account remote ancestry\n- missing auth session performs zero network calls\n- Supabase reads use authenticated RLS REST; writes use guarded `{data['rpc']}` RPC only\n- network/provider errors are nonthrowing and retryable; auth expiry is explicit\n- remote conflict responses are returned to the caller for reconciliation, not auto-overwritten\n- service-role/secret credential markers are prohibited\n- production v341 application asset remains cloud-network-free in this slice\n\nThese modules are still opt-in foundation code. They are not loaded by production until a public Supabase project URL/key and an authenticated session boundary are deliberately wired in.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_OPTIONAL_TRANSPORT_VALIDATION.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-transport-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-transport-v342','result':'PASS','summary':summary,'cases':data['cases']},ensure_ascii=True,indent=2)+'\n')
print(report)
