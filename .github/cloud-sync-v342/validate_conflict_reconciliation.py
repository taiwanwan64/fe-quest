from pathlib import Path
import base64,json,re,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

paths=[Path('cloud/sync-contract-v342.js'),Path('cloud/sync-state-v342.js'),Path('cloud/sync-engine-v342.js'),Path('cloud/reconciliation-v342.js')]
for p in paths:req(p.exists(),f'missing {p}')

node=r'''
const C=require(process.argv[2]);
const S=require(process.argv[3]);
const E=require(process.argv[4]);
const R=require(process.argv[5]);
class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
}
const cases=[];const ok=(name,cond,detail)=>cases.push({name,pass:Boolean(cond),detail:detail||null});
const user='11111111-1111-4111-8111-111111111111';
const check=n=>'fnv1a32:'+Number(n).toString(16).padStart(8,'0').slice(-8);
const make=(revision,xp,tag='local')=>({profileSchemaVersion:5,revision,checksum:check(revision*101+xp),updatedAt:`2026-08-22T${String(revision%24).padStart(2,'0')}:00:00Z`,writerId:tag,payload:{profileSchemaVersion:5,profileMeta:{revision,updatedAt:`2026-08-22T${String(revision%24).padStart(2,'0')}:00:00Z`,lastWriterId:tag},xp,tag}});
(async()=>{
  ok('initial link with no remote uploads local',R.decideInitialLink({remoteExists:false,localHasLearningData:true}).status==='upload-local');
  ok('fresh local profile adopts existing remote without choice',R.decideInitialLink({remoteExists:true,localHasLearningData:false,samePayload:false}).status==='adopt-remote');
  ok('existing local learning plus different remote requires choice',R.decideInitialLink({remoteExists:true,localHasLearningData:true,samePayload:false}).status==='first-link-conflict');
  ok('known identical payload is already synced',R.decideInitialLink({remoteExists:true,localHasLearningData:true,samePayload:true}).status==='already-synced');

  const storage=new MemoryStorage();
  let current=make(5,50);
  let remote={revision:10,checksum:check(999),profileSchemaVersion:5,payload:{profileSchemaVersion:5,profileMeta:{revision:10,lastWriterId:'device-B'},xp:100,tag:'remote'},updatedAt:'2026-08-22T10:00:00Z',writerId:'device-B'};
  let calls=0;
  const transport={commitProfile:async x=>{
    calls++;
    if(x.baseRemoteRevision!==remote.revision)return {ok:true,response:{sync_status:'remote-changed-conflict',remote_revision:remote.revision,remote_checksum:remote.checksum,remote_payload:remote.payload}};
    if(x.profileRevision<=remote.revision)return {ok:true,response:{sync_status:'remote-newer-or-equal',remote_revision:remote.revision,remote_checksum:remote.checksum,remote_payload:remote.payload}};
    remote={revision:x.profileRevision,checksum:x.payloadChecksum,profileSchemaVersion:x.profileSchemaVersion,payload:x.payload,updatedAt:x.clientUpdatedAt,writerId:x.writerId};
    return {ok:true,response:{sync_status:'uploaded-update',remote_revision:remote.revision,remote_checksum:remote.checksum,remote_payload:remote.payload}};
  }};
  const engine=E.createSyncEngine({contract:C,stateApi:S,storage,transport,getCommittedProfile:()=>current,getAuthenticatedUserId:()=>user});
  const enabled=engine.enableForCurrentUser();
  const conflict=await engine.flush();
  ok('first divergent flush records persistent conflict',enabled.ok&&!conflict.ok&&conflict.conflict&&engine.status().conflict.remoteRevision===10&&calls===1);

  current=make(6,60);engine.queueAfterLocalCommit(current);
  ok('later local study preserves conflict while coalescing newest pending commit',engine.status().conflict.remoteRevision===10&&engine.status().pending.profileRevision===6&&engine.status().pending.baseRemoteRevision===null);
  const beforeBlockedCalls=calls;
  const blocked=await engine.flush();
  ok('unresolved conflict blocks automatic network retries',!blocked.ok&&blocked.status==='conflict-pending'&&calls===beforeBlockedCalls);

  const sequence=[];
  let recoveryMode='ok';let replaceMode='ok';let promoteMode='ok';
  const resolver=R.createConflictResolver({
    stateApi:S,storage,engine,
    createRecoveryPoint:async meta=>{sequence.push('recovery:'+meta.remoteRevision);return recoveryMode==='ok'},
    promoteLocalRevision:async minimum=>{
      sequence.push('promote:'+minimum);
      if(promoteMode!=='ok')throw Error('promotion failed');
      current=make(minimum,current.payload.xp,'device-A');
      return current;
    },
    replaceLocalProfile:async(payload,meta)=>{
      sequence.push('replace:'+meta.minimumRevision);
      if(replaceMode!=='ok')throw Error('replace failed');
      const xp=Number(payload.xp)||0;
      current=make(meta.minimumRevision,xp,'device-A-adopt');
      current.payload.adoptedFrom=payload.tag||'remote';
      return current;
    }
  });

  const keep=await resolver.keepLocal(remote);
  ok('keep-local choice promotes a lower local revision above remote first',keep.ok&&sequence.includes('promote:11')&&engine.status().pending.profileRevision===11&&engine.status().pending.baseRemoteRevision===10&&engine.status().conflict===null);
  const keepFlush=await engine.flush();
  ok('rebased keep-local commit passes guarded CAS and becomes remote',keepFlush.ok&&remote.revision===11&&remote.payload.xp===60&&engine.status().pending===null);

  // Another device advances remote while this device keeps learning.
  remote={revision:15,checksum:check(1500),profileSchemaVersion:5,payload:{profileSchemaVersion:5,profileMeta:{revision:15,lastWriterId:'device-B'},xp:999,tag:'remote-new'},updatedAt:'2026-08-22T15:00:00Z',writerId:'device-B'};
  current=make(12,70);engine.queueAfterLocalCommit(current);
  const conflict2=await engine.flush();
  ok('later remote advance is detected instead of overwritten by local numeric history',!conflict2.ok&&conflict2.status==='remote-changed-conflict'&&engine.status().conflict.remoteRevision===15);

  sequence.length=0;
  const adopted=await resolver.useRemote(remote);
  ok('use-remote creates recovery point before replacing local learner state',adopted.ok&&sequence[0]==='recovery:15'&&sequence[1]==='replace:16');
  ok('adopted remote is committed locally above remote revision then rebased',engine.status().pending.profileRevision===16&&engine.status().pending.baseRemoteRevision===15&&engine.status().conflict===null&&current.payload.xp===999&&current.payload.adoptedFrom==='remote-new');
  const adoptedFlush=await engine.flush();
  ok('adopted remote snapshot can round-trip as the next local committed revision',adoptedFlush.ok&&remote.revision===16&&remote.payload.xp===999&&engine.status().pending===null);

  // Failure safety: a recovery failure must stop before learner replacement or ancestry changes.
  remote={revision:20,checksum:check(2000),profileSchemaVersion:5,payload:{profileSchemaVersion:5,profileMeta:{revision:20},xp:2000,tag:'remote-20'}};
  current=make(17,100);engine.queueAfterLocalCommit(current);await engine.flush();
  const conflictBefore=JSON.stringify(engine.status().conflict);const pendingBefore=JSON.stringify(engine.status().pending);
  sequence.length=0;recoveryMode='fail';
  const recoveryFail=await resolver.useRemote(remote);recoveryMode='ok';
  ok('failed recovery checkpoint aborts remote adoption before local replacement',!recoveryFail.ok&&recoveryFail.status==='recovery-failed'&&sequence.length===1&&JSON.stringify(engine.status().conflict)===conflictBefore&&JSON.stringify(engine.status().pending)===pendingBefore);

  sequence.length=0;replaceMode='fail';
  const replaceFail=await resolver.useRemote(remote);replaceMode='ok';
  ok('failed local replacement leaves conflict and pending ancestry unresolved',!replaceFail.ok&&replaceFail.status==='local-replace-failed'&&sequence[0]==='recovery:20'&&sequence[1]==='replace:21'&&engine.status().conflict.remoteRevision===20&&engine.status().pending.baseRemoteRevision===16);

  // Explicit local choice after a remote deletion may recreate the remote; no numeric promotion is needed.
  S.recordConflict(storage,{sync_status:'remote-missing-conflict',remote_revision:null,remote_checksum:null});
  const promotedBefore=sequence.filter(x=>x.startsWith('promote:')).length;
  const missing=await resolver.keepLocal(null);
  ok('explicit keep-local can rebase a known remote deletion to null without hidden network work',missing.ok&&engine.status().pending.baseRemoteRevision===null&&engine.status().conflict===null&&sequence.filter(x=>x.startsWith('promote:')).length===promotedBefore);

  console.log('__V342_CONFLICT__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''

with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'conflict.js';p.write_text(node)
    for src in paths:
        chk=subprocess.run(['node','--check',str(src)],capture_output=True,text=True)
        req(chk.returncode==0,f'node syntax failed {src}: '+chk.stderr[-5000:])
    z=subprocess.run(['node',str(p),*(str(x.resolve()) for x in paths)],capture_output=True,text=True)
    req(z.returncode==0,'conflict simulation failed '+z.stderr[-12000:])
    m=re.search(r'__V342_CONFLICT__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'conflict marker missing')
    data=json.loads(base64.b64decode(m.group(1)))

req(data['allPassed'],'conflict cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=16,'conflict coverage too small')

state=Path('cloud/sync-state-v342.js').read_text();engine=Path('cloud/sync-engine-v342.js').read_text();rec=Path('cloud/reconciliation-v342.js').read_text()
req('current.conflict=unresolved' in state,'local queue must preserve unresolved conflict')
req('rebasePendingToRemote' in state,'explicit ancestry rebase helper missing')
req("status:'conflict-pending'" in engine,'engine must block transport while conflict pending')
req('engine.flush(' not in rec and '.flush()' not in rec,'reconciliation choice must not auto-start network upload')
req('createRecoveryPoint' in rec and 'minimumRevision:r.revision+1' in rec,'remote adoption safety contract incomplete')
req('promoteLocalRevision' in rec and 'r.revision+1' in rec,'keep-local monotonic revision promotion missing')
req('fetch(' not in rec,'reconciliation layer must remain transport-neutral')
req('saveProfile(' not in rec and 'writeCurrentProfile(' not in rec,'reconciliation layer must use injected atomic persistence callbacks')
req('cloud/reconciliation-v342.js' not in Path('app/base-shell-v341.html').read_text(),'reconciliation unexpectedly production-loaded')

# Learning runtime remains untouched in this foundation slice.
main_app=subprocess.run(['git','show','origin/main:assets/app-v341.js'],capture_output=True,text=False);req(main_app.returncode==0,'cannot read main app')
req(main_app.stdout==Path('assets/app-v341.js').read_bytes(),'v341 app asset changed')

names=[x['name'] for x in data['cases']]
report=f'''# FE QUEST v342 — Conflict lifecycle and explicit reconciliation validation\n\nResult: **PASS — {data['count']} / {data['count']} CONFLICT / TWO-DEVICE SAFETY CASES PASS**\n\n- first account link distinguishes no-remote, identical, fresh-local, and both-have-learning-data states\n- a detected remote conflict persists even when the learner continues studying locally\n- later local commits still coalesce to the newest outbox entry but do not erase the unresolved conflict\n- `flush()` performs zero transport writes while a conflict is pending\n- choosing local is explicit; when remote revision is higher/equal, the selected local snapshot must first receive a real atomic local revision above the remote before CAS rebasing\n- choosing cloud is explicit; a recovery checkpoint must succeed before replacing learner data\n- adopted cloud data is committed locally at a revision above the observed remote, queued, then rebased to that remote ancestry\n- neither keep-local nor use-cloud automatically calls `flush()`; network upload remains a separate operation\n- failed recovery or failed local replacement leaves conflict ancestry unresolved instead of pretending success\n- explicit keep-local can recover from a known remote deletion by rebasing to a missing remote only after user choice\n- the reconciliation layer remains transport-neutral and does not call learner persistence functions directly\n- the v341 learning runtime is unchanged and reconciliation remains absent from the production shell\n\nThis closes the dangerous gap where a local save after a detected conflict could temporarily erase the conflict marker or repeated flushes could hammer the same unresolved remote state. Learner-facing conflict UI and exact production persistence callbacks remain to be wired before cloud activation.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_CONFLICT_RECONCILIATION.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-conflict-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-conflict-v342','result':'PASS','caseCount':data['count'],'validatedCases':names,'conflictBlocksTransport':True,'localSavePreservesConflict':True,'explicitChoiceRequired':True,'remoteAdoptionRequiresRecovery':True,'productionLoaded':False},ensure_ascii=True,indent=2)+'\n')
print(report)
