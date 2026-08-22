from pathlib import Path
import base64,json,re,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

auth=Path('cloud/supabase/auth-boundary-v342.js')
shell=Path('app/base-shell-v341.html')
for p in [auth,shell]: req(p.exists(),f'missing {p}')

node=r'''
const A=require(process.argv[2]);
const cases=[];const ok=(name,cond)=>cases.push({name,pass:Boolean(cond)});
const user='11111111-1111-4111-8111-111111111111';
const liveSession=()=>({user:{id:user,email:'learner@example.com'},access_token:'access-token-abcdefghijklmnopqrstuvwxyz',expires_at:1893456000,refresh_token:'SDK_ONLY'});

(async()=>{
  const parsed=A.parseEmailTokenHashCallback('https://example.github.io/fe-quest/?token_hash=abc123&type=email&keep=1');
  ok('token-hash email callback is parsed explicitly',parsed&&parsed.tokenHash==='abc123'&&parsed.type==='email');
  ok('non-email or missing token callbacks are ignored',A.parseEmailTokenHashCallback('https://example.test/?token_hash=x&type=recovery')===null&&A.parseEmailTokenHashCallback('https://example.test/?type=email')===null);
  const clean=A.sanitizedCallbackUrl('https://example.github.io/fe-quest/?token_hash=secret&type=email&keep=1#section');
  ok('callback sanitizer removes auth token while preserving unrelated URL state',!clean.includes('token_hash=')&&!clean.includes('type=email')&&clean.includes('keep=1')&&clean.endsWith('#section'));

  let current=null,verifyArgs=null,verifyCount=0,getSessionCount=0,replaceArgs=[],authErrors=[],authCallback=null;
  let href='https://example.github.io/fe-quest/?token_hash=token-hash-xyz&type=email&keep=1';
  const client={auth:{
    verifyOtp:async args=>{verifyArgs=args;verifyCount++;current=liveSession();return {data:{session:current},error:null}},
    getSession:async()=>{getSessionCount++;return {data:{session:current},error:null}},
    onAuthStateChange:cb=>{authCallback=cb;return {data:{subscription:{unsubscribe(){}}}}},
    signInWithOtp:async()=>({data:{},error:null}),signOut:async()=>({error:null})
  }};
  const boundary=A.createAuthBoundary({client,redirectTo:'https://example.github.io/fe-quest/',getLocationHref:()=>href,replaceLocation:next=>{replaceArgs.push(next);href=next},onAuthError:(e,phase)=>authErrors.push({e,phase})});
  const initialized=await boundary.initialize();
  ok('initialize exchanges PKCE token hash before reading session',initialized.signedIn&&verifyCount===1&&verifyArgs.token_hash==='token-hash-xyz'&&verifyArgs.type==='email'&&getSessionCount===1);
  ok('successful callback removes one-time token from browser URL',replaceArgs.length===1&&!replaceArgs[0].includes('token_hash=')&&!replaceArgs[0].includes('type=email')&&replaceArgs[0].includes('keep=1'));
  const again=await boundary.initialize();
  ok('initialization is idempotent and never reuses consumed token',again.signedIn&&verifyCount===1&&getSessionCount===1);
  boundary.dispose();

  let missingVerifierErrors=[];
  const noVerifyClient={auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOtp:async()=>({error:null}),signOut:async()=>({error:null})}};
  const noVerify=A.createAuthBoundary({client:noVerifyClient,getLocationHref:()=>'https://example.test/?token_hash=x&type=email',onAuthError:(e,phase)=>missingVerifierErrors.push(phase)});
  const noVerifyResult=await noVerify.initialize();
  ok('missing verifyOtp during callback fails open for local study',noVerifyResult.initialized&&!noVerifyResult.signedIn&&missingVerifierErrors.includes('PKCE_EMAIL_CALLBACK'));

  let failedVerifyCount=0,failedReplace=0,failedErrors=[];
  const verifyFailureClient={auth:{
    verifyOtp:async()=>{failedVerifyCount++;return {data:{session:null},error:new Error('expired token')}},
    getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOtp:async()=>({error:null}),signOut:async()=>({error:null})
  }};
  const verifyFailure=A.createAuthBoundary({client:verifyFailureClient,getLocationHref:()=>'https://example.test/?token_hash=expired&type=email',replaceLocation:()=>{failedReplace++},onAuthError:(e,phase)=>failedErrors.push(phase)});
  const failedInit=await verifyFailure.initialize();
  ok('expired callback is nonfatal and remains signed out',failedInit.initialized&&!failedInit.signedIn&&failedVerifyCount===1&&failedErrors.includes('PKCE_EMAIL_CALLBACK'));
  ok('failed callback is not erased before learner can retry or diagnose',failedReplace===0);

  let otpArgs=null;
  const sendClient={auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithOtp:async args=>{otpArgs=args;return {data:{},error:null}},signOut:async()=>({error:null})}};
  const sender=A.createAuthBoundary({client:sendClient,redirectTo:'https://example.github.io/fe-quest/'});
  const sent=await sender.sendMagicLink(' User@Example.COM ');
  ok('magic-link request still supplies exact production redirectTo',sent.ok&&otpArgs.email==='user@example.com'&&otpArgs.options.emailRedirectTo==='https://example.github.io/fe-quest/'&&otpArgs.options.shouldCreateUser===true);

  ok('auth spec documents required PKCE email-template contract',A.AUTH_SPEC.flowType==='pkce'&&A.AUTH_SPEC.emailTemplate==='redirect-to-token-hash'&&A.AUTH_SPEC.callbackQuery==='token_hash+type=email');
  console.log('__PKCE__'+Buffer.from(JSON.stringify({cases,count:cases.length,allPassed:cases.every(x=>x.pass)})).toString('base64'));
})().catch(e=>{console.error(e);process.exit(1)});
'''

with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'pkce.js';p.write_text(node)
    chk=subprocess.run(['node','--check',str(auth)],capture_output=True,text=True);req(chk.returncode==0,'auth syntax '+chk.stderr[-5000:])
    z=subprocess.run(['node',str(p),str(auth.resolve())],capture_output=True,text=True);req(z.returncode==0,'pkce simulation '+z.stderr[-8000:])
    m=re.search(r'__PKCE__([A-Za-z0-9+/=]+)',z.stdout);req(m is not None,'pkce marker missing')
    data=json.loads(base64.b64decode(m.group(1)))
req(data['allPassed'],'PKCE cases failed '+repr([x['name'] for x in data['cases'] if not x['pass']]))
req(data['count']>=12,'PKCE coverage too small')

src=auth.read_text();prod=shell.read_text()
req('verifyOtp' in src and 'token_hash' in src and "type!=='email'" in src,'PKCE token-hash verifier missing')
req('replaceLocation' in src and 'sanitizedCallbackUrl' in src,'one-time callback cleanup missing')
req('refresh_token' not in src.lower(),'FE QUEST must not inspect refresh token')
req('fetch(' not in src and 'saveProfile(' not in src and 'writeCurrentProfile(' not in src,'auth callback crossed isolation boundary')
req('cloud/supabase/auth-boundary-v342.js' not in prod,'v341 production shell unexpectedly loads auth')

report=f'''# FE QUEST v342 — Supabase PKCE magic-link callback validation\n\nResult: **PASS — {data['count']} / {data['count']} PKCE EMAIL CALLBACK CASES PASS**\n\n- FE QUEST now recognizes only `token_hash` callbacks with `type=email`\n- the one-time token is exchanged through Supabase `verifyOtp()` before the session is read\n- successful exchange removes `token_hash` / `type` from the browser URL while preserving unrelated query/hash state\n- repeated initialization does not replay a consumed magic-link token\n- missing SDK verifier or expired token fails open: local study remains available and no learner persistence is touched\n- failed verification does not erase the callback URL before diagnosis/retry\n- magic-link send still uses the explicit HTTPS app redirect URL\n- the auth contract records that the hosted Supabase Magic Link template must redirect `token_hash` + `type=email` to FE QUEST\n- FE QUEST still never stores or inspects refresh tokens, and the v341 production shell remains cloud-free\n\n**External deployment requirement:** Supabase Auth's hosted passwordless documentation requires a PKCE Magic Link email template that sends `token_hash` to the application. For the static FE QUEST root URL, configure the hosted template to use the allowed FE QUEST redirect URL and append `?token_hash={{{{ .TokenHash }}}}&type=email` (using Supabase template variables such as `.RedirectTo`/`.TokenHash` as configured in the Dashboard).\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/V342_PKCE_MAGIC_LINK_CALLBACK.md').write_text(report)
Path('_regression').mkdir(exist_ok=True);Path('_regression/cloud-sync-pkce-callback-v342.fixture.json').write_text(json.dumps({'name':'cloud-sync-pkce-callback-v342','result':'PASS','caseCount':data['count'],'validatedCases':[x['name'] for x in data['cases']],'productionLoaded':False,'callback':'token_hash+type=email','verifyMethod':'verifyOtp'},ensure_ascii=False,indent=2)+'\n')
print(report)
