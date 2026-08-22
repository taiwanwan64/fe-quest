from pathlib import Path
import base64,json,re,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

paths=[Path('cloud/sync-contract-v342.js'),Path('cloud/sync-state-v342.js'),Path('cloud/sync-engine-v342.js'),Path('cloud/reconciliation-v342.js'),Path('cloud/sync-controller-v342.js')]
for p in paths:req(p.exists(),f'missing {p}')

node=r'''
const C=require(process.argv[2]);
const S=require(process.argv[3]);
const E=require(process.argv[4]);
const R=require(process.argv[5]);
const K=require(process.argv[6]);
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const cases=[];const ok=(name,cond,detail)=>cases.push({name,pass:Boolean(cond),detail:detail||null});
const userA='11111111-1111-4111-8111-111111111111';const userB='22222222-2222-4222-8222-222222222222';
const sum=n=>'fnv1a32:'+Number(n).toString(16).padStart(8,'0').slice(-8);
function desc(revision,xp,tag='local'){
  return {profileSchemaVersion:5,revision,checksum:sum(revision*1000+xp),updatedAt:`2026-08-22T${String(revision%24).padStart(2,'0')}:00:00Z`,writerId:tag,payload:{profileSchemaVersion:5,profileMeta:{revision,lastWriterId:tag,updatedAt:`2026-08-22T${String(revision%24).padStart(2,'0')}:00:00Z`},xp,tag}};
}
function remoteFrom(d){return {revision:d.revision,checksum:d.checksum,profileSchemaVersion:d.profileSchemaVersion,payload:JSON.parse(JSON.stringify(d.payload)),updatedAt:d.updatedAt,writerId:d.writerId}}
function harness({local,remote=null,hasData=true,user=userA,readOffline=false}={}){
  const storage=new MemoryStorage();let current=local||desc(2,0);let cloud=remote?remoteFrom(remote):null;let authUser=user;let reads=0,commits=0,recoveries=0;let offline=readOffline;
  const auth={getAuthenticatedUserId:()=>authUser};
  const transport={
    readProfile:async uid=>{reads++;if(offline)return {ok:false,error:{kind:'network',retryable:true,message:'offline'}};return {ok:true,remote:cloud?JSON.parse(JSON.stringify(cloud)):null}},
    commitProfile:async x=>{
      commits++;
      if(!cloud){cloud={revision:x.profileRevision,checksum:x.payloadChecksum,profileSchemaVersion:x.profileSchemaVersion,payload:JSON.parse(JSON.stringify(x.payload)),updatedAt:x.clientUpdatedAt,writerId:x.writerId};return {ok:true,response:{sync_status:'uploaded-new',remote_revision:cloud.revision,remote_checksum:cloud.checksum,remote_payload:cloud.payload}}}
      if(x.profileRevision===cloud.revision&&K.deepEqual(x.payload,cloud.payload))return {ok:true,response:{sync_status:'already-synced',remote_revision:cloud.revision,remote_checksum:cloud.checksum,remote_payload:cloud.payload}};
      if(x.baseRemoteRevision!==cloud.revision)return {ok:true,response:{sync_status:'remote-changed-conflict',remote_revision:cloud.revision,remote_checksum:cloud.checksum,remote_payload:cloud.payload}};
      if(x.profileRevision<=cloud.revision)return {ok:true,response:{sync_status:'remote-newer-or-equal',remote_revision:cloud.revision,remote_checksum:cloud.checksum,remote_payload:cloud.payload}};
      cloud={revision:x.profileRevision,checksum:x.payloadChecksum,profileSchemaVersion:x.profileSchemaVersion,payload:JSON.parse(JSON.stringify(x.payload)),updatedAt:x.clientUpdatedAt,writerId:x.writerId};return {ok:true,response:{sync_status:'uploaded-update',remote_revision:cloud.revision,remote_checksum:cloud.checksum,remote_payload:cloud.payload}};
    }
  };
  const engine=E.createSyncEngine({contract:C,stateApi:S,storage,transport,getCommittedProfile:()=>current,getAuthenticatedUserId:()=>authUser});
  const resolver=R.createConflictResolver({stateApi:S,storage,engine,
    createRecoveryPoint:async()=>{recoveries++;return true},
    promoteLocalRevision:async minimum=>{current=desc(minimum,current.payload.xp,'device-A');return current},
    replaceLocalProfile:async(payload,meta)=>{current=desc(meta.minimumRevision,Number(payload.xp)||0,'device-A-adopt');current.payload.sourceTag=payload.tag;return current}
  });
  const controller=K.createSyncController({authBoundary:auth,transport,engine,resolver,stateApi:S,storage,getLocalDescriptor:()=>current,hasLocalLearningData:()=>hasData});
  return {controller,engine,resolver,storage,transport,get local(){return current},set local(v){current=v},get remote(){return cloud},set remote(v){cloud=v?remoteFrom(v):null},get reads(){return reads},get commits(){return commits},get recoveries(){return recoveries},set offline(v){offline=v},set user(v){authUser=v}};
}
(async()=>{
  ok('controller deep equality ignores object key order but detects value changes',K.deepEqual({b:2,a:{y:1,x:[1,2]}},{a:{x:[1,2],y:1},b:2})&&!K.deepEqual({a:1},{a:2}));

  const a=harness({local:desc(4,40),remote:null,hasData:true});
  const a1=await a.controller.enableSync();
  ok('first link with no remote uploads committed local profile',a1.ok&&a1.firstLink==='local-uploaded'&&a.remote.revision===4&&a.remote.payload.xp===40&&a.engine.status().pending===null);

  const remoteB=desc(20,500,'device-A');
  const b=harness({local:desc(3,0),remote:remoteB,hasData:false});
  const b1=await b.controller.enableSync();
  ok('fresh second device automatically adopts authenticated remote history',b1.ok&&b1.firstLink==='remote-adopted'&&b.local.payload.xp===500&&b.local.revision===21&&b.remote.revision===21);
  ok('fresh-device remote adoption creates recovery before replacing local state',b.recoveries===1&&b.engine.status().pending===null);

  const cRemote=desc(10,1000,'device-B');
  const c=harness({local:desc(6,600,'device-A'),remote:cRemote,hasData:true});
  const c1=await c.controller.enableSync();
  const commitsAtConflict=c.commits;
  ok('first link with learning data on both sides becomes explicit conflict without write',!c1.ok&&c1.status==='first-link-conflict'&&c.engine.status().conflict.remoteRevision===10&&commitsAtConflict===0);
  const cBlocked=await c.controller.syncNow();
  ok('sync-now while conflict pending performs zero network writes',!cBlocked.ok&&cBlocked.status==='conflict-pending'&&c.commits===commitsAtConflict);
  c.remote=desc(11,1100,'device-B');
  const cRead=await c.controller.getConflictRemote();
  ok('conflict view rereads current remote instead of trusting stale payload',cRead.ok&&cRead.remote.revision===11&&cRead.remote.payload.xp===1100);
  const cLocal=await c.controller.resolveConflict('local');
  ok('explicit keep-local promotes above freshly read remote then uploads through CAS',cLocal.ok&&cLocal.resolution==='local'&&c.remote.revision===12&&c.remote.payload.xp===600&&c.engine.status().conflict===null);

  c.remote=desc(18,1800,'device-B');
  c.local=desc(13,700,'device-A');c.engine.queueAfterLocalCommit(c.local);
  const later=await c.controller.syncNow();
  ok('remote advance after prior sync becomes conflict rather than overwrite',!later.ok&&later.status==='remote-changed-conflict'&&c.engine.status().conflict.remoteRevision===18);
  const cRemoteChoice=await c.controller.resolveConflict('remote');
  ok('explicit use-remote recovery/adoption produces next local revision and round-trips',cRemoteChoice.ok&&cRemoteChoice.resolution==='remote'&&c.local.payload.xp===1800&&c.local.revision===19&&c.remote.revision===19&&c.recoveries===1);

  const d=harness({local:desc(7,70),remote:null,hasData:true,readOffline:true});
  const d1=await d.controller.enableSync();
  ok('offline first enable keeps local outbox pending without rolling back learner state',!d1.ok&&d1.status==='pending-offline'&&d.engine.status().pending.profileRevision===7&&d.local.payload.xp===70&&d.commits===0);
  d.offline=false;
  const d2=await d.controller.enableSync();
  ok('reconnect after offline first enable safely completes upload',d2.ok&&d.remote.revision===7&&d.engine.status().pending===null);

  const same=desc(9,90,'same-device');
  const e=harness({local:JSON.parse(JSON.stringify(same)),remote:same,hasData:true});
  const e1=await e.controller.enableSync();
  ok('exact same first-link payload is recognized and acknowledged without conflict',e1.ok&&e1.firstLink==='already-synced'&&e.engine.status().pending===null&&e.engine.status().lastSyncedRemoteRevision===9);

  const f=harness({local:desc(5,50),remote:null,hasData:true,user:userA});
  f.engine.enableForCurrentUser();f.user=userB;
  const readsBeforeMismatch=f.reads,commitsBeforeMismatch=f.commits;
  const mismatch=await f.controller.enableSync();
  ok('different authenticated account cannot reuse existing sync ancestry',!mismatch.ok&&mismatch.status==='account-mismatch'&&f.reads===readsBeforeMismatch&&f.commits===commitsBeforeMismatch);
  f.user=userA;const localBeforeDisable=f.local.payload.xp;const disabled=f.controller.disableSync();
  ok('disabling sync clears sync metadata only and leaves learner state intact',disabled.ok&&f.engine.status().userId===null&&f.local.payload.xp===localBeforeDisable);

  console.log('__V342_CONTROLLER__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'controller.js';p.write_text(node)
    for src in paths:
        chk=subprocess.run(['node','--check',str(src)],capture_output=True,text=True);req(chk.returncode==0,f'syntax {src} '+chk.stderr[-5000:])
    z=subprocess.run(['node',str(p),*(str(x.resolve()) for x in paths)],capture_output=True,text=True);req(z.returncode==0,'controller simulation '+z.stderr[-12000:])
    m=re.search(r'__V342_CONTROLLER__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'controller marker missing')
    data=json.loads(base64.b64decode(m.group(1)))
req(data['allPassed'],'controller cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=15,'controller coverage too small')

src=Path('cloud/sync-controller-v342.js').read_text()
req('first-link-conflict' in src and "choice==='local'" in src and "choice==='remote'" in src,'explicit first-link/conflict routes missing')
req('transport.readProfile' in src and 'engine.flush' in src,'controller orchestration boundaries missing')
req('fetch(' not in src,'controller must not bypass transport')
req('saveProfile(' not in src and 'writeCurrentProfile(' not in src,'controller must not bypass local adapters')
req('cloud/sync-controller-v342.js' not in Path('app/base-shell-v341.html').read_text(),'controller unexpectedly production-loaded')
main_app=subprocess.run(['git','show','origin/main:assets/app-v341.js'],capture_output=True,text=False);req(main_app.returncode==0,'cannot read main app')
req(main_app.stdout==Path('assets/app-v341.js').read_bytes(),'v341 app changed')

names=[x['name'] for x in data['cases']]
report=f'''# FE QUEST v342 — First-link / two-device sync controller validation\n\nResult: **PASS — {data['count']} / {data['count']} END-TO-END ORCHESTRATION CASES PASS**\n\n- first login with no cloud row uploads the existing committed local profile\n- a fresh second device with an existing authenticated remote profile adopts that history through the recovery-protected reconciliation path\n- if both first-link sides contain learning data and differ, no automatic timestamp winner is chosen; an explicit conflict is persisted\n- unresolved conflict makes sync-now perform zero network writes\n- conflict resolution rereads the remote immediately before the user choice is applied, reducing stale-decision risk\n- explicit keep-local promotes/rebases and then uses the guarded CAS upload path\n- explicit use-cloud creates recovery, adopts locally above the observed remote revision, then round-trips the committed local snapshot\n- a later second-device advance is detected as conflict rather than overwritten\n- offline first enable leaves the local outbox intact; reconnect completes without learner rollback\n- exact same first-link payload is acknowledged without a false conflict\n- account mismatch blocks remote reads/writes, and disabling sync clears metadata without touching learner state\n- controller performs no direct fetch or learner persistence call and remains absent from the production shell\n\nThe cloud foundation now has a tested path for device A → device B, offline first enable → reconnect, and both major conflict choices. Production activation still requires project configuration, SDK vendoring, learner-facing controls, and final release-level regression/offline checks.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_SYNC_CONTROLLER.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-controller-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-controller-v342','result':'PASS','caseCount':data['count'],'validatedCases':names,'deviceAToB':True,'offlineReconnect':True,'explicitConflictChoice':True,'accountMismatchBlocked':True,'productionLoaded':False},ensure_ascii=True,indent=2)+'\n')
print(report)
