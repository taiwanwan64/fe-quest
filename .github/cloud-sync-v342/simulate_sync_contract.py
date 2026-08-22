from pathlib import Path
import json,subprocess,tempfile,re


def req(ok,msg):
    if not ok: raise AssertionError(msg)

module=Path('cloud/sync-contract-v342.js')
sql=Path('cloud/supabase/v342_schema.sql')
req(module.exists(),'sync contract module missing')
req(sql.exists(),'Supabase schema missing')

node=r'''
const S=require(process.argv[2]);
const sha=c=>String(c).repeat(64).slice(0,64);
const cases=[];
function run(name,input,expect){
  const got=S.decideCommit(input);
  cases.push({name,input,expect,got,pass:Object.entries(expect).every(([k,v])=>JSON.stringify(got[k])===JSON.stringify(v))});
}
run('no account never blocks local study',{authenticated:false,online:false,providerAvailable:false,localRevision:3,localSha256:sha('a'),baseRemoteRevision:null,remote:null},{status:'local-only',action:'none',blocksLocalSave:false,keepPending:false});
run('offline authenticated save stays pending',{authenticated:true,online:false,providerAvailable:true,localRevision:10,localSha256:sha('b'),baseRemoteRevision:9,remote:{revision:9,sha256:sha('a')}},{status:'pending-offline',action:'retry-later',blocksLocalSave:false,keepPending:true});
run('provider failure stays pending',{authenticated:true,online:true,providerAvailable:false,localRevision:10,localSha256:sha('b'),baseRemoteRevision:9,remote:{revision:9,sha256:sha('a')}},{status:'pending-provider-error',action:'retry-later',blocksLocalSave:false,keepPending:true});
run('first cloud upload',{authenticated:true,online:true,providerAvailable:true,localRevision:3,localSha256:sha('a'),baseRemoteRevision:null,remote:null},{status:'uploaded-new',action:'upload',blocksLocalSave:false,keepPending:false,nextRemoteRevision:3});
run('lost response retry is idempotent',{authenticated:true,online:true,providerAvailable:true,localRevision:3,localSha256:sha('a'),baseRemoteRevision:null,remote:{revision:3,sha256:sha('a')}},{status:'already-synced',action:'noop',blocksLocalSave:false,keepPending:false,nextRemoteRevision:3});
run('normal update on unchanged remote',{authenticated:true,online:true,providerAvailable:true,localRevision:10,localSha256:sha('b'),baseRemoteRevision:9,remote:{revision:9,sha256:sha('a')}},{status:'uploaded-update',action:'upload',blocksLocalSave:false,keepPending:false,nextRemoteRevision:10});
run('same revision different payload diverges',{authenticated:true,online:true,providerAvailable:true,localRevision:10,localSha256:sha('b'),baseRemoteRevision:9,remote:{revision:10,sha256:sha('c')}},{status:'diverged-same-revision',action:'conflict',blocksLocalSave:false,keepPending:true,remoteRevision:10});
run('remote changed since base blocks numerically newer local',{authenticated:true,online:true,providerAvailable:true,localRevision:15,localSha256:sha('d'),baseRemoteRevision:10,remote:{revision:11,sha256:sha('c')}},{status:'remote-changed-conflict',action:'conflict',blocksLocalSave:false,keepPending:true,remoteRevision:11});
run('offline local revisions can jump when remote stayed at base',{authenticated:true,online:true,providerAvailable:true,localRevision:15,localSha256:sha('d'),baseRemoteRevision:10,remote:{revision:10,sha256:sha('a')}},{status:'uploaded-update',action:'upload',blocksLocalSave:false,keepPending:false,nextRemoteRevision:15});
run('previously synced row missing is conflict',{authenticated:true,online:true,providerAvailable:true,localRevision:11,localSha256:sha('b'),baseRemoteRevision:10,remote:null},{status:'remote-missing-conflict',action:'conflict',blocksLocalSave:false,keepPending:true});
run('remote ahead of base is never overwritten',{authenticated:true,online:true,providerAvailable:true,localRevision:9,localSha256:sha('b'),baseRemoteRevision:9,remote:{revision:10,sha256:sha('c')}},{status:'remote-changed-conflict',action:'conflict',blocksLocalSave:false,keepPending:true,remoteRevision:10});

// Explicit two-device race: A advances remote; stale B has a much larger local revision.
let remote={revision:10,sha256:sha('a')};
const a=S.decideCommit({authenticated:true,online:true,providerAvailable:true,localRevision:11,localSha256:sha('b'),baseRemoteRevision:10,remote});
if(a.action==='upload')remote={revision:11,sha256:sha('b')};
const b=S.decideCommit({authenticated:true,online:true,providerAvailable:true,localRevision:20,localSha256:sha('c'),baseRemoteRevision:10,remote});
cases.push({name:'two-device stale B cannot clobber A',a,b,remote,pass:a.status==='uploaded-update'&&b.status==='remote-changed-conflict'&&remote.revision===11&&remote.sha256===sha('b')});

// Outbox coalescing: while offline, latest committed profile replaces pending payload metadata
// but ancestry remains tied to the last successfully synced remote revision.
const meta={contractVersion:1,userId:'u',lastSyncedRemoteRevision:10,lastSyncedSha256:sha('a'),pending:null};
const q1=S.queueCommittedProfile(meta,{revision:11,sha256:sha('b'),updatedAt:'2026-01-01T00:00:00Z',writerId:'A'});
const q2=S.queueCommittedProfile(q1,{revision:15,sha256:sha('c'),updatedAt:'2026-01-02T00:00:00Z',writerId:'A'});
cases.push({name:'outbox coalesces latest local revision without moving base',q1,q2,pass:q2.pending.profileRevision===15&&q2.pending.baseRemoteRevision===10&&q2.lastSyncedRemoteRevision===10});

const ack=S.acknowledge(q2,{sync_status:'uploaded-update',remote_revision:15,remote_sha256:sha('c')});
cases.push({name:'successful ack clears pending and advances base',ack,pass:ack.pending===null&&ack.lastSyncedRemoteRevision===15&&ack.lastSyncedSha256===sha('c')});

console.log('__SIM__'+Buffer.from(JSON.stringify({contractVersion:S.CONTRACT_VERSION,cases})).toString('base64'));
'''
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'sim.js';p.write_text(node)
    z=subprocess.run(['node',str(p),str(module.resolve())],capture_output=True,text=True)
    req(z.returncode==0,'Node simulation failed '+z.stderr[-10000:])
    m=re.search(r'__SIM__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'simulation marker missing')
    import base64
    data=json.loads(base64.b64decode(m.group(1)))

# queuedAt is intentionally runtime-generated by the production contract. Scrub only that
# volatile timestamp from the regression artifact so CI can prove semantic reproducibility
# without creating a new bot commit on every pull-request run.
def scrub_runtime_fields(value):
    if isinstance(value,dict):
        return {k:('<runtime-generated>' if k=='queuedAt' else scrub_runtime_fields(v)) for k,v in value.items()}
    if isinstance(value,list):
        return [scrub_runtime_fields(v) for v in value]
    return value

data=scrub_runtime_fields(data)

failed=[c['name'] for c in data['cases'] if not c['pass']]
req(not failed,'sync contract scenarios failed '+repr(failed))
req(len(data['cases'])>=14,'scenario coverage unexpectedly low')

s=sql.read_text()
for token in [
    'alter table public.user_profiles enable row level security',
    'force row level security',
    'auth.uid()',
    'fequest_commit_profile_v342',
    'p_base_remote_revision',
    'remote-changed-conflict',
    'diverged-same-revision',
    'already-synced',
    'security definer',
    'revoke insert, update, delete on public.user_profiles from authenticated',
    'grant select on public.user_profiles to authenticated'
]: req(token in s,'SQL contract token missing '+token)
req('service_role' in s and 'must never require a service_role key' in s,'service-role prohibition documentation missing')

summary={
  'scenarioCount':len(data['cases']),
  'allPassed':True,
  'localSaveBlockedBySync':False,
  'twoDeviceStaleOverwritePrevented':True,
  'equalRevisionDivergenceDetected':True,
  'lostResponseRetryIdempotent':True,
  'offlineOutboxCoalescesWithoutMovingBase':True,
  'remoteMissingAfterPriorSyncIsConflict':True,
  'rlsRequired':True,
  'blindTableWritesRevoked':True,
  'serviceRoleInPwaProhibited':True
}
fixture={'name':'cloud-sync-contract-v342','sourceAppVersion':'v341','result':'PASS — LOCAL-FIRST OUTBOX + REMOTE CAS PREVENT SILENT STALE OVERWRITE','summary':summary,'simulation':data}
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-contract-v342.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n')
report=f'''# FE QUEST v342 — Sync conflict simulation\n\nResult: **{fixture['result']}**\n\n- deterministic scenarios: **{summary['scenarioCount']} / {summary['scenarioCount']} PASS**\n- no account: local study continues with no cloud dependency\n- offline / provider error: local save succeeds and outbox stays pending\n- first upload and normal update: accepted only on the expected remote ancestry\n- lost HTTP response retry: idempotent `already-synced`\n- equal revision + different checksum: explicit divergence\n- remote changed since this device's last successful sync: conflict even if local revision is numerically larger\n- two-device race: stale device cannot clobber the device that already advanced remote\n- offline local saves can coalesce to the newest local revision while keeping the original remote base\n- previously synced remote row disappearing: explicit conflict, not silent recreation\n- RLS required; direct authenticated INSERT/UPDATE/DELETE revoked; writes go through the guarded RPC\n- service-role credential is explicitly prohibited in the PWA\n\nThis is still transport-independent. No production network call, credential, account requirement or profile-schema change is introduced by this slice.\n'''
Path('audits/V342_SYNC_CONFLICT_SIMULATION.md').write_text(report)
print(report)
