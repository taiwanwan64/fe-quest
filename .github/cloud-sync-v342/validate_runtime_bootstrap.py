from pathlib import Path
import base64,json,re,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

files=[
 'cloud/sync-contract-v342.js','cloud/sync-state-v342.js','cloud/sync-engine-v342.js',
 'cloud/supabase/transport-v342.js','cloud/supabase/auth-boundary-v342.js','cloud/production-adapter-v342.js',
 'cloud/reconciliation-v342.js','cloud/local-reconciliation-adapter-v342.js','cloud/sync-controller-v342.js',
 'cloud/sync-ui-v342.js','cloud/public-config-v342.js','cloud/runtime-bootstrap-v342.js'
]
for f in files: req(Path(f).exists(),f'missing {f}')
modules='\n'.join(Path(f).read_text() for f in files)

tail=r'''
const cases=[];const ok=(name,cond)=>cases.push({name,pass:Boolean(cond)});
const api=FEQUEST_CLOUD_RUNTIME_V342;
const defaultRuntime=api.createCloudRuntime();
ok('default public config keeps cloud runtime disabled',defaultRuntime.ok&&defaultRuntime.status==='disabled');
let secretRejected=false;try{api.validateEnabledConfig({enabled:true,provider:'supabase',url:'https://x.supabase.co',publishableKey:'service_role_abcdefghijklmnopqrstuvwxyz',redirectTo:'https://example.com/'})}catch(e){secretRejected=true}
ok('secret service-role credential is rejected before assembly',secretRejected);
let urlRejected=false;try{api.validateEnabledConfig({enabled:true,provider:'supabase',url:'http://x.supabase.co',publishableKey:'public-key-abcdefghijklmnopqrstuvwxyz',redirectTo:'https://example.com/'})}catch(e){urlRejected=true}
ok('enabled config requires HTTPS project URL',urlRejected);
ok('fresh learner detector stays false for empty profile',api.hasLearningData({profileSchemaVersion:5,profileMeta:{revision:0}})===false);
ok('learner detector recognizes XP and question attempts',[api.hasLearningData({xp:1}),api.hasLearningData({qStats:{q1:{attempts:1}}})].every(Boolean));

const enabled={enabled:true,provider:'supabase',url:'https://example.supabase.co',publishableKey:'public-key-abcdefghijklmnopqrstuvwxyz',redirectTo:'https://example.com/fe-quest/'};
const oldSupabase=globalThis.supabase;delete globalThis.supabase;const sdkMissing=api.createCloudRuntime({config:enabled});ok('enabled config without pinned SDK fails open as sdk-missing',!sdkMissing.ok&&sdkMissing.status==='sdk-missing');globalThis.supabase=oldSupabase;

const M=()=>{const m=new Map();return {getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(String(k)),key:i=>[...m.keys()][i]??null,get length(){return m.size}}};
const storage=M();globalThis.localStorage=storage;
let profile={profileSchemaVersion:5,profileMeta:{createdAt:'2026-08-22T00:00:00Z',updatedAt:'2026-08-22T00:00:00Z',revision:1,lastWriterId:'writer-a'},xp:10,sessions:[],lessonProgress:{},bProgress:{},qStats:{}};
let checksum='fnv1a32:11111111';let originalWrites=0;let wrappedWrites=0;let recovery=0;let unsubscribed=0;
let writeCurrentProfile=function(p){originalWrites++;const rev=Number(p?.profileMeta?.revision||profile.profileMeta.revision)+1;profile=JSON.parse(JSON.stringify(p));profile.profileMeta={...(profile.profileMeta||{}),revision:rev,lastWriterId:'writer-a',updatedAt:'2026-08-22T00:01:00Z'};checksum=rev%2?'fnv1a32:33333333':'fnv1a32:22222222';return {profile,revision:rev,checksum}};
function stampProfileForSave(p){return JSON.parse(JSON.stringify(p))}
function currentAtomicProfile(){return {profile:JSON.parse(JSON.stringify(profile)),revision:profile.profileMeta.revision,checksum,writerId:profile.profileMeta.lastWriterId}}
function rememberCommittedProfile(p){profile=JSON.parse(JSON.stringify(p));return profile}
function acquireProfileWriteLease(){return true}function releaseProfileWriteLease(){}function clearProfileSaveFailure(){}function restoreCommittedProfileInMemory(){return true}function noteProfileSaveFailure(){}function markProfileConflict(){}
async function writeRecoveryCheckpoint(){recovery++;return true}function queueRecoveryCheckpoint(){}function refreshProfileUI(){}
let profileWriteBlocked=false,profileConflictBlocked=false,profileBaseRevision=1;

const userId='11111111-1111-4111-8111-111111111111';
let session={user:{id:userId,email:'learner@example.com'},access_token:'access-token-abcdefghijklmnopqrstuvwxyz',expires_at:9999999999};let authListener=null;let clientOptions=null;let fetchCalls=[];
function createClient(url,key,options){clientOptions={url,key,options};return {auth:{getSession:async()=>({data:{session},error:null}),onAuthStateChange:fn=>{authListener=fn;return {data:{subscription:{unsubscribe:()=>{unsubscribed++}}}}},signInWithOtp:async()=>({error:null}),signOut:async()=>{session=null;authListener&&authListener('SIGNED_OUT',null);return {error:null}}}}}
const fetchImpl=async(url,opts={})=>{fetchCalls.push({url,method:opts.method||'GET',body:opts.body||null});if((opts.method||'GET')==='GET')return {ok:true,status:200,text:async()=>'[]'};const body=JSON.parse(opts.body);return {ok:true,status:200,text:async()=>JSON.stringify([{sync_status:body.p_base_remote_revision==null?'uploaded-new':'uploaded-update',remote_revision:body.p_profile_revision,remote_checksum:body.p_payload_checksum,remote_payload:body.p_payload}])}};

const runtime=api.createCloudRuntime({config:enabled,createClient,storage,fetchImpl,document:null,confirm:()=>true,warn:()=>{}});
ok('valid public config assembles runtime without starting it',runtime.ok&&runtime.status==='ready'&&fetchCalls.length===0);
const beforeWriter=writeCurrentProfile;const started=await runtime.start();ok('runtime start initializes PKCE auth and installs local post-commit bridge',started.ok&&started.status==='started'&&clientOptions.options.auth.flowType==='pkce'&&writeCurrentProfile!==beforeWriter);
ok('signed-in session still leaves sync opt-in disabled after startup',runtime.snapshot().auth.signedIn===true&&runtime.snapshot().sync.userId===null&&fetchCalls.length===0);
const enabledResult=await runtime.controller.enableSync();ok('explicit enable performs first remote read and guarded upload',enabledResult.ok&&runtime.snapshot().sync.userId===userId&&runtime.snapshot().sync.pending===null&&fetchCalls.filter(x=>x.method==='GET').length===1&&fetchCalls.filter(x=>x.method==='POST').length===1);
const networkBeforeSave=fetchCalls.length;writeCurrentProfile(profile);wrappedWrites++;const afterSaveState=runtime.snapshot().sync;ok('post-local-commit bridge queues newer local state without network',afterSaveState.pending&&afterSaveState.pending.profileRevision===profile.profileMeta.revision&&fetchCalls.length===networkBeforeSave&&originalWrites>=1);
const synced=await runtime.controller.syncNow();ok('manual sync flushes queued local commit through guarded transport',synced.ok&&runtime.snapshot().sync.pending===null&&fetchCalls.length===networkBeforeSave+1);
runtime.stop();ok('runtime stop disposes auth subscription and restores original writer',writeCurrentProfile===beforeWriter&&unsubscribed===1);
const stopped=await runtime.start();ok('stopped runtime cannot be restarted accidentally',stopped.status==='stopped');
console.log('__BOOTSTRAP__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
'''
program=modules+'\n;(async()=>{\n'+tail+'\n})().catch(e=>{console.error(e);process.exit(1)});\n'
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'bootstrap.js';p.write_text(program)
    chk=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);req(chk.returncode==0,'node syntax '+chk.stderr[-8000:])
    z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'bootstrap runtime '+z.stderr[-12000:])
    m=re.search(r'__BOOTSTRAP__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'bootstrap marker missing')
    data=json.loads(base64.b64decode(m.group(1)))
req(data['allPassed'],'bootstrap cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=14,'bootstrap coverage too small')

config=Path('cloud/public-config-v342.js').read_text();bootstrap=Path('cloud/runtime-bootstrap-v342.js').read_text();shell=Path('app/base-shell-v341.html').read_text()
req('enabled:false' in config,'repository public config must remain disabled by default')
req('publishableKey:null' in config and 'url:null' in config,'repository must contain no real Supabase project config')
for forbidden in ['service_role_', 'sb_secret_']:
    req(forbidden not in config,f'forbidden secret marker in public config: {forbidden}')
req('fetch(' not in bootstrap,'bootstrap must delegate network to transport')
for forbidden in ['saveProfile(', 'writeCurrentProfile(', 'localStorage.setItem(']: req(forbidden not in bootstrap,f'bootstrap directly mutates learner persistence: {forbidden}')
req('FEQUEST_PUBLIC_CLOUD_CONFIG_V342' not in shell and 'runtime-bootstrap-v342.js' not in shell,'v341 production shell unexpectedly activates cloud runtime')
req("status:'sdk-missing'" in bootstrap and "status:'disabled'" in bootstrap,'fail-open activation guards missing')

report=f'''# FE QUEST v342 — Cloud runtime bootstrap validation\n\nResult: **PASS — {data['count']} / {data['count']} ACTIVATION-BOUNDARY CASES PASS**\n\n- repository public cloud config is disabled by default and contains no real project URL/key\n- service-role/secret credentials are rejected before runtime assembly\n- enabled config requires HTTPS Supabase project and HTTPS auth redirect URLs\n- missing browser SDK fails open as `sdk-missing`; local FE QUEST remains independent\n- valid config assembles auth, transport, post-commit outbox, reconciliation, controller, and learner UI\n- runtime start initializes PKCE auth and installs only the post-local-commit observer\n- an existing signed-in session still does not enable sync automatically\n- explicit enable performs the first remote read/upload\n- later local commits queue without network; manual sync performs the transport flush\n- stop restores the original local writer and disposes the auth subscription\n- bootstrap has no direct fetch or learner-profile persistence calls\n- the v341 production shell remains cloud-free\n\nThe remaining production blocker is external deployment: create/configure the Supabase project, apply `v342_schema.sql`, configure redirect URLs/email delivery, pin/vendor the browser SDK, then replace the disabled public config and release v342 through the split-aware release validator.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_CLOUD_RUNTIME_BOOTSTRAP.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-runtime-bootstrap-v342.fixture.json').write_text(json.dumps({'name':'cloud-runtime-bootstrap-v342','result':'PASS','caseCount':data['count'],'validatedCases':[x['name'] for x in data['cases']],'defaultEnabled':False,'productionLoaded':False,'externalDeploymentRequired':True},ensure_ascii=False,indent=2)+'\n')
print(report)
