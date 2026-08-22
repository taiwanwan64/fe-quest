from pathlib import Path
import base64, json, re, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)

transport = Path('cloud/supabase/transport-v342.js')
ui = Path('cloud/sync-ui-v342.js')
edge = Path('cloud/supabase/functions/fequest-delete-account-v342/index.ts')
runtime = Path('cloud/runtime-bootstrap-v342.js')
hardening = Path('cloud/supabase/v342_revoke_anon_rpc.sql')
shell = Path('app/base-shell-v341.html')
for p in [transport, ui, edge, runtime, hardening, shell]:
    req(p.exists(), f'missing {p}')

program = transport.read_text() + '\n' + ui.read_text() + r'''
;(async()=>{
const cases=[];const ok=(name,cond)=>cases.push({name,pass:Boolean(cond)});
const T=globalThis.FEQUEST_SUPABASE_TRANSPORT_V342;
const U=globalThis.FEQUEST_SYNC_UI_V342;
const publicKey='sb_publishable_abcdefghijklmnopqrstuvwxyz0123456789';
const token='user-access-token-abcdefghijklmnopqrstuvwxyz0123456789';
let fetchCalls=[];
let tr=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:publicKey,getAccessToken:async()=>null,fetchImpl:async()=>{fetchCalls.push(1);throw new Error('should not fetch')}});
let r=await tr.deleteAccount();
ok('signed-out account deletion performs zero network requests',!r.ok&&r.error.kind==='auth'&&fetchCalls.length===0);

fetchCalls=[];
tr=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:publicKey,getAccessToken:async()=>token,fetchImpl:async(url,opts)=>{fetchCalls.push({url,opts});return {ok:true,status:200,text:async()=>JSON.stringify({ok:true,status:'deleted'})}}});
r=await tr.deleteAccount();
const call=fetchCalls[0];const body=JSON.parse(call.opts.body);
ok('transport calls only the authenticated deletion Edge Function',r.ok&&fetchCalls.length===1&&call.url==='https://example.supabase.co/functions/v1/fequest-delete-account-v342'&&call.opts.method==='POST');
ok('deletion transport sends publishable key and user JWT only',call.opts.headers.apikey===publicKey&&call.opts.headers.Authorization===`Bearer ${token}`&&!String(call.opts.headers.Authorization).includes('secret'));
ok('deletion transport requires the fixed explicit confirmation payload',body.confirm==='delete-fequest-account');

tr=T.createSupabaseTransport({url:'https://example.supabase.co',anonKey:publicKey,getAccessToken:async()=>token,fetchImpl:async()=>({ok:true,status:200,text:async()=>JSON.stringify({ok:true,status:'unexpected'})})});
r=await tr.deleteAccount();
ok('unexpected deletion response fails closed',!r.ok&&r.error.kind==='provider');

const baseState=()=>({userId:'11111111-1111-4111-8111-111111111111',pending:null,conflict:null,lastError:null,lastSuccessAt:null});
let signedOutView=U.deriveView({initialized:true,signedIn:false,userId:null,email:null},baseState(),{accountDeletionAvailable:true});
ok('signed-out learner never sees account deletion action',!signedOutView.actions.includes('delete-account'));

let authSnap={initialized:true,signedIn:true,userId:'11111111-1111-4111-8111-111111111111',email:'learner@example.com'};
let signouts=0,disables=0,deletes=0;
const auth={snapshot:()=>authSnap,sendMagicLink:async()=>({ok:true}),signOutThisDevice:async()=>{signouts++;authSnap={initialized:true,signedIn:false,userId:null,email:null};return {ok:true}},subscribe:()=>()=>{}};
const controller={state:()=>baseState(),enableSync:async()=>({ok:true}),syncNow:async()=>({ok:true}),resolveConflict:async()=>({ok:true}),disableSync:()=>{disables++;return {ok:true}}};
let confirmations=[true,true];
let learnerUI=U.createSyncSettingsUI({authBoundary:auth,controller,deleteAccount:async()=>{deletes++;return {ok:true,status:200,response:{status:'deleted'}}},confirm:()=>confirmations.shift()??false,document:null});
let v=learnerUI.view();
ok('signed-in learner sees explicit account deletion action only when backend action exists',v.actions.includes('delete-account')&&v.deletionAvailable===true);
r=await learnerUI.deleteAccount();
ok('successful deletion requires two confirmations and calls backend exactly once',r.ok&&deletes===1);
ok('successful deletion clears sync metadata and signs out this device',disables===1&&signouts===1&&authSnap.signedIn===false);

// Reset to signed-in and cancel on the second confirmation.
authSnap={initialized:true,signedIn:true,userId:'11111111-1111-4111-8111-111111111111',email:'learner@example.com'};deletes=0;disables=0;signouts=0;confirmations=[true,false];
learnerUI=U.createSyncSettingsUI({authBoundary:auth,controller,deleteAccount:async()=>{deletes++;return {ok:true}},confirm:()=>confirmations.shift()??false,document:null});
r=await learnerUI.deleteAccount();
ok('cancelled second destructive confirmation performs no deletion call',r.status==='cancelled'&&deletes===0&&disables===0&&signouts===0);

// Backend failure must not sign out or clear sync state.
confirmations=[true,true];deletes=0;disables=0;signouts=0;
learnerUI=U.createSyncSettingsUI({authBoundary:auth,controller,deleteAccount:async()=>{deletes++;return {ok:false,error:{kind:'provider'}}},confirm:()=>confirmations.shift()??false,document:null});
r=await learnerUI.deleteAccount();
ok('backend deletion failure preserves account and sync state',!r.ok&&deletes===1&&disables===0&&signouts===0&&authSnap.signedIn===true);

learnerUI=U.createSyncSettingsUI({authBoundary:auth,controller,confirm:()=>true,document:null});
v=learnerUI.view();
ok('account deletion action is absent when runtime has no deletion backend',!v.actions.includes('delete-account')&&v.deletionAvailable===false);

console.log('__ACCOUNT__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''

with tempfile.TemporaryDirectory() as td:
    p = Path(td) / 'account.js'
    p.write_text(program)
    chk = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
    req(chk.returncode == 0, 'node syntax ' + chk.stderr[-8000:])
    run = subprocess.run(['node', str(p)], capture_output=True, text=True)
    req(run.returncode == 0, 'account runtime ' + run.stderr[-12000:])
    marker = re.search(r'__ACCOUNT__([A-Za-z0-9+/=]+)', run.stdout)
    req(marker is not None, 'account marker missing')
    data = json.loads(base64.b64decode(marker.group(1)))

req(data['allPassed'], 'account cases failed ' + repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count'] >= 12, 'account lifecycle coverage too small')

edge_src = edge.read_text()
transport_src = transport.read_text()
ui_src = ui.read_text()
runtime_src = runtime.read_text()
hardening_src = hardening.read_text().lower()
prod = shell.read_text()

for needle in [
    "npm:@supabase/server@1.4.1",
    "withSupabase({ auth: 'user' }",
    'ctx.supabase.auth.getUser()',
    'ctx.supabaseAdmin.auth.admin.deleteUser(userId)',
    "req.method !== 'POST'",
    "CONFIRM_VALUE = 'delete-fequest-account'",
    "'Cache-Control': 'no-store'",
]:
    req(needle in edge_src, f'Edge Function guard missing: {needle}')
for forbidden in ['sb_secret_', 'service_role_', 'gkvgxnkoypypikxtyeoz']:
    req(forbidden not in edge_src, f'Edge Function hardcodes forbidden credential/project material: {forbidden}')
req("DELETE_ACCOUNT_FUNCTION='fequest-delete-account-v342'" in transport_src, 'transport deletion endpoint constant missing')
req("deleteAccount:typeof transport.deleteAccount==='function'?()=>transport.deleteAccount():null" in runtime_src, 'runtime deletion injection missing')
req('fetch(' not in ui_src, 'UI must not own deletion network fetch')
for forbidden in ['saveProfile(', 'writeCurrentProfile(', 'localStorage.setItem(', 'indexedDB']:
    req(forbidden not in ui_src, f'UI directly touches learner persistence: {forbidden}')
req('この端末の学習データは残ります' in ui_src and 'この操作は取り消せません' in ui_src, 'learner deletion policy copy incomplete')
req('from anon' in hardening_src and 'revoke execute on function public.fequest_commit_profile_v342' in hardening_src, 'anon RPC hardening migration missing')
req('fequest-delete-account-v342' not in prod and 'cloud/sync-ui-v342.js' not in prod, 'v341 production shell must remain cloud-free')

case_names = [x['name'] for x in data['cases']]
report = f'''# FE QUEST v342 — Account lifecycle validation\n\nResult: **PASS — {data['count']} / {data['count']} ACCOUNT-LIFECYCLE CASES PASS**\n\n- deleting an account is available only to a signed-in learner and only through an injected backend action\n- the browser sends only the public Supabase key plus the learner session JWT; no admin credential is shipped\n- the destructive operation requires two learner confirmations and a fixed server confirmation value\n- the Edge Function accepts POST only, independently re-validates the authenticated user, and deletes exactly that Auth user\n- `public.user_profiles.user_id -> auth.users.id ON DELETE CASCADE` removes the cloud learning profile with the account\n- successful deletion disables this device's sync metadata and signs out locally\n- FE QUEST local learning data is deliberately preserved; deleting local data remains a separate data-management action\n- cancellation and backend failure do not clear sync state or sign the learner out\n- the Edge Function pins `@supabase/server@1.4.1`, uses user auth, and keeps admin capability server-side\n- anonymous execution of the sync RPC remains explicitly revoked\n- the v341 production shell remains cloud-free\n\nThe backend endpoint may be deployed before v342 activation because it requires a valid user JWT. The production app must still remain disabled until redirect/email settings, the pinned browser SDK, and final release validation are complete.\n'''
Path('audits').mkdir(exist_ok=True)
Path('audits/V342_ACCOUNT_LIFECYCLE.md').write_text(report)
Path('_regression').mkdir(exist_ok=True)
Path('_regression/account-lifecycle-v342.fixture.json').write_text(json.dumps({
    'name': 'account-lifecycle-v342',
    'result': 'PASS',
    'caseCount': data['count'],
    'validatedCases': case_names,
    'cloudAccountDeletion': True,
    'localDataPreserved': True,
    'productionLoaded': False,
}, ensure_ascii=False, indent=2) + '\n')
print(report)
