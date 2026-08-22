from pathlib import Path
import base64,json,re,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

files=[Path('cloud/sync-contract-v342.js'),Path('cloud/sync-state-v342.js'),Path('cloud/sync-engine-v342.js')]
for p in files:req(p.exists(),f'missing {p}')

node=r'''
const C=require(process.argv[2]);
const S=require(process.argv[3]);
const E=require(process.argv[4]);
const sha=c=>String(c).repeat(64).slice(0,64);
class MemoryStorage{
  constructor(seed={}){this.m=new Map(Object.entries(seed))}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
}
const cases=[];const ok=(name,cond,detail)=>cases.push({name,pass:Boolean(cond),detail:detail||null});
const userA='11111111-1111-4111-8111-111111111111';
const userB='22222222-2222-4222-8222-222222222222';
const desc=(r,c='a')=>({profileSchemaVersion:5,revision:r,sha256:sha(c),updatedAt:`2026-01-${String(r).padStart(2,'0')}T00:00:00Z`,writerId:'device-A',payload:{revision:r,xp:r}});
(async()=>{
  let current=desc(1,'a');let user=null;let calls=[];
  const storage=new MemoryStorage({learnerProfile:'SAFE'});
  const transport={commitProfile:async x=>{calls.push(x);return {ok:true,response:{sync_status:'uploaded-new',remote_revision:x.profileRevision,remote_sha256:x.payloadSha256}}}};
  const engine=E.createSyncEngine({contract:C,stateApi:S,storage,transport,getCommittedProfile:()=>current,getAuthenticatedUserId:()=>user});

  const disabledQueue=engine.queueAfterLocalCommit(current);
  ok('post-local hook is network-free while disabled',disabledQueue.ok&&disabledQueue.status==='disabled'&&calls.length===0&&S.load(storage).pending===null);
  const signedOutEnable=engine.enableForCurrentUser();
  ok('enable requires authenticated identity',!signedOutEnable.ok&&signedOutEnable.status==='signed-out'&&calls.length===0);

  user=userA;
  const enabled=engine.enableForCurrentUser();
  ok('explicit enable queues current committed profile without network',enabled.ok&&enabled.status==='enabled-pending'&&enabled.state.pending.profileRevision===1&&calls.length===0);
  current=desc(2,'b');
  const queued=engine.queueAfterLocalCommit(current);
  ok('successful later local commit coalesces outbox only',queued.ok&&queued.state.pending.profileRevision===2&&calls.length===0);

  const firstFlush=await engine.flush();
  ok('explicit flush uploads and acknowledges',firstFlush.ok&&firstFlush.status==='uploaded-new'&&calls.length===1&&engine.status().pending===null&&engine.status().lastSyncedRemoteRevision===2);

  current=desc(3,'c');engine.queueAfterLocalCommit(current);
  calls=[];
  const failingTransport={commitProfile:async x=>{calls.push(x);return {ok:false,error:{kind:'network',retryable:true,message:'offline'}}}};
  const failEngine=E.createSyncEngine({contract:C,stateApi:S,storage,transport:failingTransport,getCommittedProfile:()=>current,getAuthenticatedUserId:()=>user});
  const offline=await failEngine.flush();
  ok('network failure keeps pending and never rolls back local data',!offline.ok&&offline.retryable&&engine.status().pending.profileRevision===3&&storage.getItem('learnerProfile')==='SAFE');

  const conflictTransport={commitProfile:async x=>({ok:true,response:{sync_status:'remote-changed-conflict',remote_revision:4,remote_sha256:sha('d'),remote_payload:{revision:4}}})};
  const conflictEngine=E.createSyncEngine({contract:C,stateApi:S,storage,transport:conflictTransport,getCommittedProfile:()=>current,getAuthenticatedUserId:()=>user});
  const conflict=await conflictEngine.flush();
  ok('remote conflict remains pending for explicit reconciliation',!conflict.ok&&conflict.conflict&&conflict.status==='remote-changed-conflict'&&conflict.state.pending.profileRevision===3&&conflict.state.conflict.remoteRevision===4);

  user=userB;calls=[];
  const mismatch=await failEngine.flush();
  ok('different signed-in account makes zero transport calls',!mismatch.ok&&mismatch.status==='account-mismatch'&&calls.length===0&&S.load(storage).userId===userA);
  user=userA;

  // Restore a known successful base, queue revision 5, then let local advance to 6 before flush.
  S.acknowledge(storage,C,{sync_status:'uploaded-update',remote_revision:2,remote_sha256:sha('b')});
  current=desc(5,'e');engine.queueAfterLocalCommit(current);
  current=desc(6,'f');
  let coalescedArg=null;
  const coalesceTransport={commitProfile:async x=>{coalescedArg=x;return {ok:true,response:{sync_status:'uploaded-update',remote_revision:6,remote_sha256:sha('f')}}}};
  const coalesceEngine=E.createSyncEngine({contract:C,stateApi:S,storage,transport:coalesceTransport,getCommittedProfile:()=>current,getAuthenticatedUserId:()=>user});
  const coalesced=await coalesceEngine.flush();
  ok('flush refreshes stale outbox to newest committed local snapshot',coalesced.ok&&coalescedArg.profileRevision===6&&coalescedArg.baseRemoteRevision===2&&coalescedArg.payload.revision===6);

  current=desc(7,'g');coalesceEngine.queueAfterLocalCommit(current);
  let release;let slowCalls=0;
  const slowTransport={commitProfile:x=>{slowCalls++;return new Promise(res=>{release=()=>res({ok:true,response:{sync_status:'uploaded-update',remote_revision:7,remote_sha256:sha('g')}})})}};
  const slowEngine=E.createSyncEngine({contract:C,stateApi:S,storage,transport:slowTransport,getCommittedProfile:()=>current,getAuthenticatedUserId:()=>user});
  const p1=slowEngine.flush();const p2=slowEngine.flush();
  await new Promise(r=>setTimeout(r,0));
  const oneCallBeforeRelease=slowCalls===1;release();const [r1,r2]=await Promise.all([p1,p2]);
  ok('concurrent flushes share one in-flight transport operation',oneCallBeforeRelease&&slowCalls===1&&r1.ok&&r2.ok);

  current=desc(8,'h');slowEngine.queueAfterLocalCommit(current);
  const throwing=E.createSyncEngine({contract:C,stateApi:S,storage,transport:{commitProfile:async()=>{throw Error('boom')}},getCommittedProfile:()=>current,getAuthenticatedUserId:()=>user});
  const thrown=await throwing.flush();
  ok('unexpected transport throw is contained and retryable',!thrown.ok&&thrown.retryable&&S.load(storage).pending.profileRevision===8);

  const reloaded=E.createSyncEngine({contract:C,stateApi:S,storage,transport:failingTransport,getCommittedProfile:()=>current,getAuthenticatedUserId:()=>user});
  ok('pending sync metadata survives engine recreation',reloaded.status().pending.profileRevision===8&&reloaded.status().userId===userA);
  const off=reloaded.disable();
  ok('disable clears only sync binding and preserves learner data',off.ok&&off.state.userId===null&&off.state.pending===null&&storage.getItem('learnerProfile')==='SAFE');

  console.log('__ENGINE__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''

with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'engine.js';p.write_text(node)
    z=subprocess.run(['node',str(p),*(str(x.resolve()) for x in files)],capture_output=True,text=True)
    req(z.returncode==0,'engine simulation failed '+z.stderr[-12000:])
    m=re.search(r'__ENGINE__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'engine marker missing')
    data=json.loads(base64.b64decode(m.group(1)))

req(data['allPassed'],'engine cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=12,'engine coverage too small')
engine=Path('cloud/sync-engine-v342.js').read_text()
req('fetch(' not in engine,'sync engine must be transport-agnostic')
req(not re.search(r'\bsaveProfile\s*\(',engine),'engine must not call saveProfile itself')
req(not re.search(r'\bwriteCurrentProfile\s*\(',engine),'engine must not bypass atomic local persistence')
req('queueAfterLocalCommit' in engine and 'flush' in engine,'explicit queue/flush boundary missing')
req('cloud/sync-engine-v342.js' not in Path('app/base-shell-v341.html').read_text(),'engine must remain opt-in before v342 activation')

names=[x['name'] for x in data['cases']]
summary={'caseCount':data['count'],'allPassed':True,'postLocalHookNetworkFree':True,'explicitEnableRequired':True,'conflictKeepsPending':True,'crossAccountNetworkBlocked':True,'staleOutboxCoalescedAtFlush':True,'singleFlightFlush':True,'transportThrowContained':True,'disablePreservesLearnerData':True,'productionV341Unchanged':True}
report=f'''# FE QUEST v342 — Local-first sync engine validation\n\nResult: **PASS — POST-LOCAL-COMMIT OUTBOX AND EXPLICIT FLUSH KEEP CLOUD OUTSIDE THE ATOMIC SAVE PATH**\n\n- deterministic engine cases: **{data['count']} / {data['count']} PASS**\n- sync remains disabled until an authenticated user explicitly enables it\n- `queueAfterLocalCommit()` is synchronous and performs no network request\n- `flush()` is separate, single-flight, and can be retried independently of local saving\n- offline/provider failures keep the newest pending local commit\n- remote conflicts keep pending data and record explicit reconciliation metadata\n- account mismatch blocks all transport activity\n- a newer committed local profile replaces a stale pending descriptor while retaining the last successful remote base\n- unexpected transport throws are contained as retryable sync errors\n- disabling sync clears only sync metadata and does not touch learner data\n- production v341 shell remains unchanged and does not load the engine\n\nThe remaining production integration work is to obtain the exact committed-profile descriptor after `saveProfile()` succeeds, add an authenticated Supabase session boundary, and expose explicit enable/conflict UI before activating v342 cloud sync.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_SYNC_ENGINE_VALIDATION.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-engine-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-engine-v342','result':'PASS','summary':summary,'validatedCases':names},ensure_ascii=True,indent=2)+'\n')
print(report)
