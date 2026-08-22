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
const userA='11111111-1111-4111-8111-111111111111';
const userB='22222222-2222-4222-8222-222222222222';
class MemoryStorage{
  constructor(seed={}){this.m=new Map(Object.entries(seed))}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
}
const desc=(r,c)=>({profileSchemaVersion:5,revision:r,sha256:sha(c||String(r)),updatedAt:`2026-01-${String(Math.min(r,28)).padStart(2,'0')}T00:00:00Z`,writerId:'device-A',payload:{revision:r,xp:r}});
const cases=[];const ok=(name,cond,detail)=>cases.push({name,pass:Boolean(cond),detail:detail||null});
function setup(transport,user=null,current=desc(1,'a')){
  const storage=new MemoryStorage({learnerProfile:'SAFE'});
  const holder={user,current};
  let calls=0;
  const wrapped={commitProfile:async x=>{calls++;return transport.commitProfile(x)}};
  const engine=E.createSyncEngine({contract:C,stateApi:S,storage,transport:wrapped,getCommittedProfile:()=>holder.current,getAuthenticatedUserId:()=>holder.user});
  return {storage,holder,engine,calls:()=>calls};
}
const success=(status='uploaded-new')=>({commitProfile:async x=>({ok:true,response:{sync_status:status,remote_revision:x.profileRevision,remote_sha256:x.payloadSha256}})});
(async()=>{
  {
    const x=setup(success(),null);
    const r=x.engine.queueAfterLocalCommit(x.holder.current);
    ok('disabled post-local hook is synchronous and network-free',r.ok&&r.status==='disabled'&&x.calls()===0&&S.load(x.storage).pending===null);
  }
  {
    const x=setup(success(),null);
    const r=x.engine.enableForCurrentUser();
    ok('explicit enable requires authenticated identity',!r.ok&&r.status==='signed-out'&&x.calls()===0);
  }
  {
    const x=setup(success(),userA);
    const r=x.engine.enableForCurrentUser();
    ok('explicit enable queues current commit without network',r.ok&&r.status==='enabled-pending'&&r.state.pending.profileRevision===1&&x.calls()===0);
  }
  {
    const x=setup(success(),userA);
    x.engine.enableForCurrentUser();x.holder.current=desc(2,'b');
    const r=x.engine.queueAfterLocalCommit(x.holder.current);
    ok('later local commit only coalesces pending outbox',r.ok&&r.state.pending.profileRevision===2&&r.state.pending.payloadSha256===sha('b')&&x.calls()===0);
  }
  {
    const x=setup(success('uploaded-new'),userA);
    x.engine.enableForCurrentUser();
    const r=await x.engine.flush();
    ok('explicit flush uploads and acknowledges',r.ok&&r.status==='uploaded-new'&&x.calls()===1&&x.engine.status().pending===null&&x.engine.status().lastSyncedRemoteRevision===1);
  }
  {
    const x=setup({commitProfile:async()=>({ok:false,error:{kind:'network',retryable:true,message:'offline'}})},userA);
    x.engine.enableForCurrentUser();
    const r=await x.engine.flush();
    ok('network failure keeps pending and never touches learner data',!r.ok&&r.retryable===true&&x.engine.status().pending.profileRevision===1&&x.storage.getItem('learnerProfile')==='SAFE');
  }
  {
    const x=setup({commitProfile:async()=>({ok:true,response:{sync_status:'remote-changed-conflict',remote_revision:2,remote_sha256:sha('z'),remote_payload:{revision:2}}})},userA);
    x.engine.enableForCurrentUser();
    const r=await x.engine.flush();
    ok('remote conflict keeps pending for reconciliation',!r.ok&&r.conflict===true&&r.status==='remote-changed-conflict'&&r.state.pending.profileRevision===1&&r.state.conflict.remoteRevision===2);
  }
  {
    const x=setup(success(),userA);
    x.engine.enableForCurrentUser();x.holder.user=userB;
    const r=await x.engine.flush();
    ok('account mismatch blocks all transport calls',!r.ok&&r.status==='account-mismatch'&&x.calls()===0&&x.engine.status().userId===userA);
  }
  {
    let captured=null;
    const transport={commitProfile:async arg=>{captured=arg;return {ok:true,response:{sync_status:arg.baseRemoteRevision==null?'uploaded-new':'uploaded-update',remote_revision:arg.profileRevision,remote_sha256:arg.payloadSha256}}}};
    const x=setup(transport,userA,desc(1,'a'));
    x.engine.enableForCurrentUser();await x.engine.flush();
    x.holder.current=desc(2,'b');x.engine.queueAfterLocalCommit(x.holder.current);
    x.holder.current=desc(3,'c');
    const r=await x.engine.flush();
    ok('flush refreshes stale pending descriptor but preserves remote base',r.ok&&captured.profileRevision===3&&captured.payload.revision===3&&captured.baseRemoteRevision===1&&x.engine.status().lastSyncedRemoteRevision===3);
  }
  {
    let calls=0;
    const delayed={commitProfile:async arg=>{calls++;await new Promise(r=>setTimeout(r,20));return {ok:true,response:{sync_status:'uploaded-new',remote_revision:arg.profileRevision,remote_sha256:arg.payloadSha256}}}};
    const storage=new MemoryStorage({learnerProfile:'SAFE'});const holder={user:userA,current:desc(1,'a')};
    const engine=E.createSyncEngine({contract:C,stateApi:S,storage,transport:delayed,getCommittedProfile:()=>holder.current,getAuthenticatedUserId:()=>holder.user});
    engine.enableForCurrentUser();
    const [a,b]=await Promise.all([engine.flush(),engine.flush()]);
    ok('concurrent flushes share one in-flight transport call',calls===1&&a.ok&&b.ok&&a.status===b.status);
  }
  {
    const x=setup({commitProfile:async()=>{throw Error('boom')}},userA);
    x.engine.enableForCurrentUser();
    const r=await x.engine.flush();
    ok('unexpected transport throw is contained and retryable',!r.ok&&r.retryable===true&&x.engine.status().pending.profileRevision===1);
  }
  {
    const x=setup({commitProfile:async()=>({ok:false,error:{kind:'provider',retryable:true,message:'down'}})},userA);
    x.engine.enableForCurrentUser();await x.engine.flush();
    const recreated=E.createSyncEngine({contract:C,stateApi:S,storage:x.storage,transport:success(),getCommittedProfile:()=>x.holder.current,getAuthenticatedUserId:()=>x.holder.user});
    const survived=recreated.status().pending&&recreated.status().pending.profileRevision===1;
    const off=recreated.disable();
    ok('pending survives recreation and disable preserves learner data',survived&&off.ok&&off.state.userId===null&&off.state.pending===null&&x.storage.getItem('learnerProfile')==='SAFE');
  }
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
