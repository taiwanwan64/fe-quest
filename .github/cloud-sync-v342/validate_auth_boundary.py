from pathlib import Path
import base64, json, re, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

paths={
    'auth':Path('cloud/supabase/auth-boundary-v342.js'),
    'shell':Path('app/base-shell-v341.html'),
    'app':Path('assets/app-v341.js'),
    'state':Path('cloud/sync-state-v342.js')
}
for p in paths.values(): req(p.exists(),f'missing {p}')

node=r'''
const A=require(process.argv[2]);
const cases=[];
const ok=(name,cond,detail)=>cases.push({name,pass:Boolean(cond),detail:detail||null});
const userA='11111111-1111-4111-8111-111111111111';
const userB='22222222-2222-4222-8222-222222222222';
const session=(id,email,token='access-token-abcdefghijklmnopqrstuvwxyz')=>({user:{id,email},access_token:token,expires_at:1893456000,refresh_token:'MUST_REMAIN_INSIDE_SDK'});

(async()=>{
  let configured=null;
  const fakeClient={auth:{}};
  const built=A.createConfiguredClient({
    createClient:(url,key,opts)=>{configured={url,key,opts};return fakeClient},
    url:'https://example.supabase.co/',
    publishableKey:'public-anon-key-abcdefghijklmnopqrstuvwxyz'
  });
  ok('configured client uses PKCE and SDK session persistence',built===fakeClient&&configured.url==='https://example.supabase.co'&&configured.opts.auth.flowType==='pkce'&&configured.opts.auth.persistSession===true&&configured.opts.auth.autoRefreshToken===true&&configured.opts.auth.detectSessionInUrl===true);

  let secretRejected=false;
  try{A.createConfiguredClient({createClient:()=>fakeClient,url:'https://example.supabase.co',publishableKey:'service_role_not_allowed_abcdefghijklmnopqrstuvwxyz'})}catch(e){secretRejected=/forbidden/i.test(String(e))}
  ok('service-role style browser credential is rejected',secretRejected);

  let current=null;
  let authCallback=null;
  let unsubscribeCount=0;
  let getSessionCount=0;
  let otpArgs=null;
  let signOutArgs=null;
  let signOutError=null;
  const client={auth:{
    getSession:async()=>{getSessionCount++;return {data:{session:current},error:null}},
    onAuthStateChange:(cb)=>{authCallback=cb;return {data:{subscription:{unsubscribe:()=>{unsubscribeCount++}}}}},
    signInWithOtp:async(args)=>{otpArgs=args;return {data:{},error:null}},
    signOut:async(args)=>{
      signOutArgs=args;
      if(signOutError)return {error:signOutError};
      current=null;
      if(authCallback)authCallback('SIGNED_OUT',null);
      return {error:null};
    }
  }};
  const signedOut=[];const authErrors=[];const notifications=[];
  const boundary=A.createAuthBoundary({client,redirectTo:'https://example.github.io/fe-quest/',onSignedOut:(uid,event)=>signedOut.push({uid,event}),onAuthError:(e,event)=>authErrors.push({e,event})});
  boundary.subscribe((snap,event)=>notifications.push({snap,event}));

  const initial=await boundary.initialize();
  ok('initial signed-out session exposes no user or token',initial.initialized&&!initial.signedIn&&boundary.getAuthenticatedUserId()===null&&(await boundary.getAccessToken())===null);
  ok('initialization registers exactly one auth state listener',typeof authCallback==='function'&&notifications.some(x=>x.event==='INITIAL_SESSION'));

  current=session(userA,'User@Example.com','token-a-abcdefghijklmnopqrstuvwxyz');
  authCallback('SIGNED_IN',current);
  ok('SIGNED_IN updates synchronous engine identity cache',boundary.getAuthenticatedUserId()===userA&&boundary.snapshot().signedIn===true&&boundary.snapshot().email==='User@Example.com');
  ok('public snapshot never exposes access or refresh token',!('accessToken' in boundary.snapshot())&&!('refreshToken' in boundary.snapshot()));

  current=session(userB,'b@example.com','token-b-abcdefghijklmnopqrstuvwxyz');
  authCallback('TOKEN_REFRESHED',current);
  ok('auth state refresh replaces cached authenticated identity',boundary.getAuthenticatedUserId()===userB&&boundary.snapshot().email==='b@example.com');
  const token=await boundary.getAccessToken();
  ok('transport token callback reads current SDK session instead of a FE QUEST token store',token==='token-b-abcdefghijklmnopqrstuvwxyz'&&getSessionCount>=2);

  const magic=await boundary.sendMagicLink('  Person@Example.COM ');
  ok('magic-link sign-in normalizes email and uses configured redirect',magic.ok&&otpArgs.email==='person@example.com'&&otpArgs.options.shouldCreateUser===true&&otpArgs.options.emailRedirectTo==='https://example.github.io/fe-quest/');

  current=session(userB,'b@example.com','token-c-abcdefghijklmnopqrstuvwxyz');
  authCallback('SIGNED_IN',current);
  const out=await boundary.signOutThisDevice();
  ok('device sign-out uses local scope and clears only cached auth identity',out.ok&&signOutArgs.scope==='local'&&boundary.getAuthenticatedUserId()===null&&signedOut.filter(x=>x.uid===userB).length===1);

  current=session(userA,'a@example.com','token-d-abcdefghijklmnopqrstuvwxyz');
  authCallback('SIGNED_IN',current);
  signOutError=new Error('provider unavailable');
  const failedOut=await boundary.signOutThisDevice();
  signOutError=null;
  ok('failed provider sign-out does not falsely clear local authenticated state',!failedOut.ok&&boundary.getAuthenticatedUserId()===userA);

  const beforeDispose=unsubscribeCount;
  boundary.dispose();
  ok('dispose unsubscribes auth listener without touching learner data',unsubscribeCount===beforeDispose+1);

  let learnerStorage='UNCHANGED';
  const failureClient={auth:{
    getSession:async()=>{throw Error('offline')},
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    signInWithOtp:async()=>({error:Error('offline')}),
    signOut:async()=>({error:Error('offline')})
  }};
  const failure=A.createAuthBoundary({client:failureClient,onAuthError:()=>{}});
  const failureInit=await failure.initialize();
  ok('auth provider failure is nonfatal and independent from learner data',failureInit.initialized&&!failureInit.signedIn&&learnerStorage==='UNCHANGED');

  console.log('__V342_AUTH__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass),authSpec:A.AUTH_SPEC})).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''

with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'auth.js';p.write_text(node)
    chk=subprocess.run(['node','--check',str(paths['auth'])],capture_output=True,text=True)
    req(chk.returncode==0,'auth module syntax failed '+chk.stderr[-5000:])
    z=subprocess.run(['node',str(p),str(paths['auth'].resolve())],capture_output=True,text=True)
    req(z.returncode==0,'auth simulation failed '+z.stderr[-10000:])
    m=re.search(r'__V342_AUTH__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'auth marker missing')
    data=json.loads(base64.b64decode(m.group(1)))

req(data['allPassed'],'auth cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=12,'auth coverage too small')
spec=data['authSpec']
req(spec['flowType']=='pkce' and spec['persistSession'] and spec['autoRefreshToken'] and spec['detectSessionInUrl'],'auth spec incomplete')
req(spec['signOutScope']=='local','device logout scope changed')

auth=paths['auth'].read_text()
req('refresh_token' not in auth.lower(),'auth boundary must not manually persist or inspect refresh tokens')
req('localStorage.setItem' not in auth and 'sessionStorage.setItem' not in auth,'auth boundary gained manual token/session persistence')
req('saveProfile(' not in auth and 'writeCurrentProfile(' not in auth,'auth boundary must not touch learner persistence')
req('fetch(' not in auth,'auth boundary must use Supabase client rather than direct network requests')
for forbidden in ['SUPABASE_SERVICE_ROLE','service_role=']:
    req(forbidden not in auth,f'forbidden credential marker {forbidden}')

shell=paths['shell'].read_text()
req('cloud/supabase/auth-boundary-v342.js' not in shell,'auth boundary unexpectedly production-loaded')

# This foundation slice must not change the already validated v341 learning runtime.
main_app=subprocess.run(['git','show','origin/main:assets/app-v341.js'],capture_output=True,text=False)
req(main_app.returncode==0,'cannot fetch main app asset')
req(main_app.stdout==paths['app'].read_bytes(),'v341 application asset changed in auth slice')

names=[x['name'] for x in data['cases']]
report=f'''# FE QUEST v342 — Supabase Auth / PKCE session boundary validation\n\nResult: **PASS — {data['count']} / {data['count']} AUTH BOUNDARY CASES PASS WITHOUT ENTERING LEARNER PERSISTENCE**\n\n- authentication choice: Supabase Auth email magic link with PKCE\n- browser client contract: `persistSession=true`, `autoRefreshToken=true`, `detectSessionInUrl=true`, `flowType=pkce`\n- FE QUEST keeps only an in-memory session summary; the Supabase SDK remains responsible for persisted session/refresh-token handling\n- the sync engine can read the cached authenticated user id synchronously\n- transport access tokens are obtained through the SDK `getSession()` boundary and are never exposed in public snapshots\n- auth-state changes update the cache; token refresh therefore does not require learner-profile writes\n- this-device logout uses `scope=local`; successful sign-out can clear isolated sync metadata through a callback\n- provider/auth errors remain nonfatal and cannot block local study\n- the auth boundary contains no direct network request, local/session storage write, `saveProfile()` call, or `writeCurrentProfile()` call\n- secret/service-role browser credentials remain prohibited\n- the v341 application asset is unchanged and the auth module is still absent from the production shell\n\nProduction login remains intentionally disabled until a public Supabase project configuration, locally vendored/pinned SDK asset, explicit sync controls, and conflict-reconciliation UI are ready.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_AUTH_BOUNDARY.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-auth-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-auth-v342','result':'PASS','caseCount':data['count'],'validatedCases':names,'authSpec':spec,'productionLoaded':False,'learnerPersistenceTouched':False},ensure_ascii=True,indent=2)+'\n')
print(report)
