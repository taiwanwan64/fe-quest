from pathlib import Path
import base64,hashlib,json,re,runpy,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

app=Path('assets/app-v341.js');adapter=Path('cloud/local-reconciliation-adapter-v342.js');shell=Path('app/base-shell-v341.html')
for p in [app,adapter,shell]:req(p.exists(),f'missing {p}')
main_app=subprocess.run(['git','show','origin/main:assets/app-v341.js'],capture_output=True,text=False)
req(main_app.returncode==0,'cannot read main v341 app')
req(main_app.stdout==app.read_bytes(),'v341 production app changed in local reconciliation slice')

stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
tail=r'''
const cases=[];const ok=(name,cond,detail)=>cases.push({name,pass:Boolean(cond),detail:detail||null});
const A=FEQUEST_LOCAL_RECONCILIATION_ADAPTER_V342;
let recoveryCalls=[];
const realRecovery=writeRecoveryCheckpoint;
writeRecoveryCheckpoint=async(p,reason,force)=>{recoveryCalls.push({revision:p.profileMeta?.revision,reason,force});return true};
const callbacks=A.createLocalReconciliationCallbacks({warn:()=>{}});

const initial=currentAtomicProfile();
const initialXp=initial.profile.xp;
const recovery=await callbacks.createRecoveryPoint({reason:'before-cloud-adopt',remoteRevision:99});
ok('forced recovery callback snapshots current local profile before cloud adoption',recovery===true&&recoveryCalls.length===1&&recoveryCalls[0].revision===initial.revision&&recoveryCalls[0].reason==='before-cloud-adopt'&&recoveryCalls[0].force===true);

const promoteMin=initial.revision+5;
const promoted=await callbacks.promoteLocalRevision(promoteMin,{reason:'cloud-keep-local'});
const afterPromote=currentAtomicProfile();
ok('keep-local promotion creates a real atomic revision at or above requested minimum',promoted&&promoted.revision>=promoteMin&&afterPromote.revision===promoted.revision&&afterPromote.checksum===promoted.checksum&&/^fnv1a32:[0-9a-f]{8}$/.test(promoted.checksum));
ok('revision promotion preserves learner content while stamping a new local commit',afterPromote.profile.xp===initialXp&&promoted.payload.xp===initialXp&&promoted.writerId===afterPromote.writerId&&promoted.updatedAt===afterPromote.profile.profileMeta.updatedAt);
const lastGoodAfterPromote=JSON.parse(localStorage.getItem(LAST_GOOD_PROFILE_KEY));
ok('promotion preserves previous valid profile for rollback',lastGoodAfterPromote.profileMeta.revision===initial.revision);

const remoteRevision=promoted.revision+7;
const remotePayload=structuredClone(promoted.payload);
remotePayload.profileMeta={...remotePayload.profileMeta,revision:remoteRevision,lastWriterId:'remote-device',updatedAt:'2025-01-01T00:00:00Z'};
remotePayload.xp=777;
remotePayload.remoteMarker='REMOTE_SOURCE';
const adopted=await callbacks.replaceLocalProfile(remotePayload,{minimumRevision:remoteRevision+1,remoteRevision});
const afterAdopt=currentAtomicProfile();
ok('remote adoption commits validated payload above observed remote revision',adopted&&adopted.revision>=remoteRevision+1&&afterAdopt.revision===adopted.revision&&afterAdopt.profile.xp===777&&afterAdopt.profile.remoteMarker==='REMOTE_SOURCE');
ok('remote adoption becomes a local commit with local writer and fresh timestamp',adopted.writerId===afterAdopt.writerId&&adopted.writerId!==remotePayload.profileMeta.lastWriterId&&adopted.updatedAt!==remotePayload.profileMeta.updatedAt&&adopted.payload.profileMeta.revision===adopted.revision);
const lastGoodAfterAdopt=JSON.parse(localStorage.getItem(LAST_GOOD_PROFILE_KEY));
ok('remote adoption keeps the pre-adoption local commit as rollback data',lastGoodAfterAdopt.profileMeta.revision===promoted.revision&&lastGoodAfterAdopt.xp===initialXp);

const beforeFuture=currentAtomicProfile();
const future=structuredClone(afterAdopt.profile);future.profileSchemaVersion=PROFILE_SCHEMA_VERSION+1;
let futureRejected=false;
try{await callbacks.replaceLocalProfile(future,{minimumRevision:beforeFuture.revision+1})}catch(e){futureRejected=e&&e.code==='FUTURE_PROFILE_SCHEMA'}
ok('future cloud schema is rejected before write lease without blocking local study',futureRejected&&profileWriteBlocked===false&&currentAtomicProfile().revision===beforeFuture.revision&&currentAtomicProfile().profile.xp===beforeFuture.profile.xp);

const beforeLease=currentAtomicProfile();
localStorage.setItem(PROFILE_WRITER_LEASE_KEY,JSON.stringify({tabId:'other-tab',expiresAt:Date.now()+60000}));
const leaseBlocked=await callbacks.promoteLocalRevision(beforeLease.revision+5);
localStorage.removeItem(PROFILE_WRITER_LEASE_KEY);
ok('another-tab write lease blocks cloud reconciliation local mutation',leaseBlocked===null&&currentAtomicProfile().revision===beforeLease.revision);

const beforeBlocked=currentAtomicProfile();profileWriteBlocked=true;
const blocked=await callbacks.replaceLocalProfile(beforeBlocked.profile,{minimumRevision:beforeBlocked.revision+2});profileWriteBlocked=false;
ok('existing local persistence block prevents cloud adoption without changing data',blocked===null&&currentAtomicProfile().revision===beforeBlocked.revision&&currentAtomicProfile().profile.xp===beforeBlocked.profile.xp);

const realWriter=writeCurrentProfile;const beforeFailure=currentAtomicProfile();
writeCurrentProfile=()=>{throw Error('simulated storage failure')};
let storageFailed=false;
try{await callbacks.promoteLocalRevision(beforeFailure.revision+3)}catch(e){storageFailed=/storage failure/.test(String(e))}
writeCurrentProfile=realWriter;
ok('local write failure is surfaced and committed learner snapshot is restored',storageFailed&&profileWriteBlocked===true&&currentAtomicProfile().revision===beforeFailure.revision&&profile.profileMeta.revision===beforeFailure.revision);
profileWriteBlocked=false;

writeRecoveryCheckpoint=realRecovery;
const descriptor=A.committedDescriptor({profile:afterAdopt.profile,revision:afterAdopt.revision,checksum:afterAdopt.checksum});
ok('committed descriptor exposes only the exact atomic sync fields',descriptor.revision===afterAdopt.revision&&descriptor.checksum===afterAdopt.checksum&&descriptor.payload===afterAdopt.profile&&descriptor.profileSchemaVersion===PROFILE_SCHEMA_VERSION);

console.log('__V342_LOCAL_ADOPT__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
'''
program=stub+'\n'+app.read_text()+'\n'+adapter.read_text()+'\n;(async()=>{\n'+tail+'\n})().catch(e=>{console.error(e);process.exit(1)});\n'
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'local-adoption.js';p.write_text(program)
    chk=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);req(chk.returncode==0,'node syntax '+chk.stderr[-8000:])
    z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime '+z.stderr[-12000:])
    m=re.search(r'__V342_LOCAL_ADOPT__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'marker missing')
    data=json.loads(base64.b64decode(m.group(1)))
req(data['allPassed'],'local adoption cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=11,'local adoption coverage too small')

src=adapter.read_text()
req('writeRecoveryCheckpoint(profile' in src and ',true)' in src,'forced pre-adoption recovery contract missing')
req('exactRevision' in src and 'writeCurrentProfile' in src,'exact atomic revision write missing')
req('normalizeProfileData(remotePayload)' in src,'remote payload must validate before local write')
req('fetch(' not in src,'local adapter must not perform network')
req('signIn' not in src and 'getSession(' not in src,'local adapter must not own auth')
req('cloud/local-reconciliation-adapter-v342.js' not in shell.read_text(),'local reconciliation adapter unexpectedly production-loaded')

names=[x['name'] for x in data['cases']]
report=f'''# FE QUEST v342 — Production local reconciliation callbacks validation\n\nResult: **PASS — {data['count']} / {data['count']} ATOMIC LOCAL-ADOPTION CASES PASS**\n\n- cloud reconciliation reuses the existing FE QUEST write lease, atomic envelope, checksum, rollback snapshot, and committed-profile memory contract\n- pre-cloud adoption requests a forced recovery checkpoint of the current local learner profile\n- keep-local revision promotion is a real no-content-change atomic local commit, not a metadata-only revision invention\n- remote adoption validates/migrates the remote profile before taking the local write lease\n- adopted data is persisted above the observed remote revision, stamped with the current local writer/timestamp, and keeps the prior local commit as rollback data\n- future-schema cloud payloads are rejected before mutation and do not set the local persistence block\n- another-tab lease or an existing local persistence block prevents cloud reconciliation writes\n- a real local write failure restores the last committed learner snapshot and surfaces failure instead of pretending reconciliation succeeded\n- committed descriptors reuse the exact local revision/checksum/payload needed by the outbox engine\n- this adapter has no network/auth responsibility and remains absent from the v341 production shell\n\nThe conflict resolver now has concrete production-safe callbacks for recovery, keep-local revision promotion, and remote adoption. Activation still waits for sync controls and project configuration.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_LOCAL_RECONCILIATION_ADAPTER.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-local-adoption-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-local-adoption-v342','result':'PASS','caseCount':data['count'],'validatedCases':names,'usesExistingAtomicPersistence':True,'forcedRecoveryBeforeAdoption':True,'futureSchemaBlocksCloudOnly':True,'productionLoaded':False},ensure_ascii=True,indent=2)+'\n')
print(report)
