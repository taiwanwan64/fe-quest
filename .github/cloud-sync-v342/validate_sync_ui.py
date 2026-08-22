from pathlib import Path
import base64,json,re,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

ui=Path('cloud/sync-ui-v342.js')
css=Path('cloud/sync-ui-v342.css')
shell=Path('app/base-shell-v341.html')
for p in [ui,css,shell]:req(p.exists(),f'missing {p}')

program=ui.read_text()+r'''
;(async()=>{
const api=globalThis.FEQUEST_SYNC_UI_V342;const cases=[];const ok=(name,cond)=>cases.push({name,pass:Boolean(cond)});
const baseState=()=>({userId:null,lastSyncedRemoteRevision:null,pending:null,conflict:null,lastAttemptAt:null,lastSuccessAt:null,lastError:null});
let authSnap={initialized:true,signedIn:false,userId:null,email:null};let listeners=[];let magic=[];let signouts=0;
const auth={snapshot:()=>authSnap,sendMagicLink:async email=>{magic.push(email);return {ok:true,email:String(email).trim().toLowerCase()}},signOutThisDevice:async()=>{signouts++;authSnap={initialized:true,signedIn:false,userId:null,email:null};listeners.forEach(fn=>fn(authSnap,'SIGNED_OUT'));return {ok:true}},subscribe:fn=>{listeners.push(fn);return()=>{listeners=listeners.filter(x=>x!==fn)}}};
let syncState=baseState(),calls=[];
const controller={state:()=>JSON.parse(JSON.stringify(syncState)),enableSync:async()=>{calls.push('enable');syncState.userId=authSnap.userId;return {ok:true,status:'uploaded-new',state:controller.state()}},syncNow:async()=>{calls.push('sync');return {ok:true,status:'already-synced',state:controller.state()}},resolveConflict:async choice=>{calls.push('resolve:'+choice);syncState.conflict=null;return {ok:true,status:'uploaded-update',state:controller.state()}},disableSync:()=>{calls.push('disable');syncState=baseState();return {ok:true,status:'disabled',state:controller.state()}}};

let v=api.deriveView(authSnap,syncState);ok('signed-out makes account optional and offers magic link',v.key==='signed-out'&&v.actions.includes('send-link')&&v.detail.includes('ログインしなくても'));
authSnap={initialized:false,signedIn:false,userId:null,email:null};v=api.deriveView(authSnap,syncState);ok('auth initialization never blocks local study copy',v.key==='initializing'&&v.detail.includes('学習'));
authSnap={initialized:true,signedIn:true,userId:'u1',email:'a@example.com'};v=api.deriveView(authSnap,syncState);ok('signed-in remains sync-disabled until explicit enable',v.key==='signed-in-disabled'&&v.actions.includes('enable'));
syncState={...baseState(),userId:'u1',lastSuccessAt:'2026-08-22T01:00:00Z'};v=api.deriveView(authSnap,syncState);ok('synced state exposes manual sync and disable',v.key==='synced'&&v.actions.includes('sync-now')&&v.actions.includes('disable'));
syncState={...syncState,pending:{profileRevision:7,payloadChecksum:'fnv1a32:1234abcd'}};v=api.deriveView(authSnap,syncState);ok('pending local commit is clearly shown as locally saved',v.key==='pending'&&v.detail.includes('保存は完了'));
syncState={...syncState,lastError:{kind:'network',retryable:true}};v=api.deriveView(authSnap,syncState);ok('retryable network failure preserves local-first message',v.key==='pending-error'&&v.detail.includes('ローカル'));
syncState={...syncState,conflict:{status:'remote-changed-conflict',remoteRevision:8}};v=api.deriveView(authSnap,syncState);ok('conflict requires explicit local or cloud choice',v.key==='conflict'&&v.actions.includes('keep-local')&&v.actions.includes('use-cloud')&&v.detail.includes('自動'));

syncState=baseState();authSnap={initialized:true,signedIn:false,userId:null,email:null};const ui1=api.createSyncSettingsUI({authBoundary:auth,controller,confirm:()=>true});ui1.start();const ml=await ui1.sendMagicLink('USER@Example.COM');ok('magic link is sent only through explicit UI action',ml.ok&&magic.length===1&&magic[0]==='USER@Example.COM');ui1.dispose();

authSnap={initialized:true,signedIn:true,userId:'u1',email:'a@example.com'};syncState=baseState();const ui2=api.createSyncSettingsUI({authBoundary:auth,controller,confirm:()=>true});const en=await ui2.enable();ok('enable delegates to guarded controller and binds sync',en.ok&&calls.includes('enable')&&syncState.userId==='u1');const sn=await ui2.syncNow();ok('sync-now is explicit controller action',sn.ok&&calls.includes('sync'));
syncState.conflict={status:'remote-changed-conflict',remoteRevision:9};const rr=await ui2.resolve('remote');ok('confirmed cloud choice delegates explicit remote resolution',rr.ok&&calls.includes('resolve:remote')&&syncState.conflict===null);ui2.dispose();

syncState={...baseState(),userId:'u1',conflict:{status:'remote-changed-conflict'}};let rejectedCalls=0;const noController={...controller,resolveConflict:async()=>{rejectedCalls++;return {ok:true}}};const ui3=api.createSyncSettingsUI({authBoundary:auth,controller:noController,confirm:()=>false});const cancelled=await ui3.resolve('local');ok('cancelled destructive choice performs no reconciliation call',cancelled.status==='cancelled'&&rejectedCalls===0);ui3.dispose();

syncState={...baseState(),userId:'u1'};const ui4=api.createSyncSettingsUI({authBoundary:auth,controller,confirm:()=>true});ui4.disable();ok('disable clears only sync controller state',calls.includes('disable')&&syncState.userId===null);await ui4.signOut();ok('sign-out delegates to auth boundary',signouts===1&&authSnap.signedIn===false);const beforeListeners=listeners.length;ui4.start();const afterStart=listeners.length;ui4.dispose();ok('auth subscription is disposed cleanly',afterStart===beforeListeners+1&&listeners.length===beforeListeners);

v=api.deriveView({initialized:true,signedIn:true,userId:'u1',email:'x@y.z'},{...baseState(),userId:'u1'},{busy:'sync'});ok('busy UI removes competing actions',v.actions.length===0&&v.title==='処理しています');
console.log('__SYNCUI__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'ui.js';p.write_text(program)
    chk=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);req(chk.returncode==0,'node syntax '+chk.stderr[-6000:])
    z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'ui runtime '+z.stderr[-10000:])
    m=re.search(r'__SYNCUI__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'ui marker missing')
    data=json.loads(base64.b64decode(m.group(1)))
req(data['allPassed'],'UI cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=15,'UI coverage too small')

src=ui.read_text();styles=css.read_text();prod=shell.read_text()
req('fetch(' not in src,'UI must not own transport fetch')
for forbidden in ['saveProfile(', 'writeCurrentProfile(', 'localStorage.setItem(', 'indexedDB']:
    req(forbidden not in src,f'UI directly touches learner persistence: {forbidden}')
req('confirmFn' in src and "resolve('local')" in src and "resolve('remote')" in src,'explicit conflict confirmation path missing')
req('ログインしなくても' in src and 'ローカル保存' in src and 'JSONエクスポート' in src and '復旧センター' in src,'local-first learner copy incomplete')
for selector in ['.feq-cloud-sync-card','.feq-sync-status.warning','.feq-sync-email','@media(max-width:640px)']:
    req(selector in styles,f'missing responsive UI style {selector}')
req('cloud/sync-ui-v342.js' not in prod and 'cloud/sync-ui-v342.css' not in prod,'v341 production shell must remain untouched')

report=f'''# FE QUEST v342 — Cloud sync settings UI validation\n\nResult: **PASS — {data['count']} / {data['count']} LEARNER-FACING SYNC UI CASES PASS**\n\n- account login remains optional; signed-out copy explicitly says local study continues\n- signing in does not enable cloud sync until the learner explicitly chooses to enable it\n- pending/offline states say the local save is already complete\n- unresolved conflicts expose two explicit choices and never pick a timestamp winner\n- choosing local/cloud requires a confirmation step; cancelling makes no reconciliation call\n- sync-now, disable, magic-link login, and sign-out are explicit user actions\n- the UI delegates all auth/sync work and contains no direct fetch or learner-profile persistence calls\n- JSON export and Recovery Center remain visible in the local-first safety copy\n- the settings card has a compact mobile layout for <=640px\n- the v341 production shell still does not load any cloud-sync UI asset\n\nThis slice is production-disabled. The next activation slice must assemble auth/transport/controller from a validated public project config and a pinned Supabase browser SDK before the card is loaded by v342.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_SYNC_SETTINGS_UI.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-ui-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-ui-v342','result':'PASS','caseCount':data['count'],'validatedCases':[x['name'] for x in data['cases']],'productionLoaded':False,'accountOptional':True,'conflictChoiceExplicit':True},ensure_ascii=False,indent=2)+'\n')
print(report)
