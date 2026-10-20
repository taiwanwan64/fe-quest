import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),api=require('../../assets/billing-client-v1.js');
const uid='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',requestID='33333333-3333-4333-8333-333333333333';
const config={supabaseURL:'https://gkvgxnkoypypikxtyeoz.supabase.co',publishableKey:'public-fixture-only',salesEnabled:true,accessEnforcementEnabled:false};
const status=(extra={})=>({purchaseAvailable:true,accessMode:'restricted',plan:{sku:api.SKU,amountJPY:2980,durationDays:180,autoRenew:false},preview:{lessons:6,questions:41},entitlement:{active:false,expiresAt:null},purchase:null,...extra});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
function fixture({user=uid,settings={},reply}={}){
  let id=user;const listeners=new Set(),calls=[],navigations=[],stored=new Map([['learner-profile-sentinel','keep']]);let changes=0;
  const auth={snapshot:()=>({signedIn:Boolean(id),userId:id,email:'fixture@example.invalid'}),getAccessToken:async()=>id+'-token',subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
  const client=api.createClient({authBoundary:auth,config:{...config,...settings},fetcher:async(url,init)=>{calls.push({url,init});return reply?reply(url,init):Response.json(url.includes('checkout')?{url:'https://checkout.stripe.com/c/pay/fixture'}:status());},storage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},randomUUID:()=>requestID,navigate:url=>navigations.push(url),onIdentityChange:()=>{changes++;}});
  return{client,calls,navigations,stored,changes:()=>changes,setUser:value=>{id=value;for(const fn of listeners)fn();},quietSetUser:value=>{id=value;},auth};
}
test('disabled sale never posts Checkout, including a forged available server status',async()=>{
  const f=fixture({settings:{salesEnabled:false}});await f.client.refresh();await assert.rejects(f.client.checkout(),e=>e.code==='billing_unavailable');assert.equal(f.calls.length,1);assert.equal(f.navigations.length,0);
});
test('Checkout requires Auth, current access status and explicit one-time SKU/request ID only',async()=>{
  const f=fixture();await f.client.checkout();const call=f.calls.find(c=>c.init.method==='POST');
  assert.deepEqual(JSON.parse(call.init.body),{sku:api.SKU,requestId:requestID});assert.equal(call.init.headers.authorization,'Bearer '+uid+'-token');
  assert.equal(call.init.credentials,'omit');assert.equal(call.init.cache,'no-store');assert.equal(call.init.redirect,'error');
  assert.deepEqual(f.navigations,['https://checkout.stripe.com/c/pay/fixture']);assert.equal(f.stored.get('learner-profile-sentinel'),'keep');
  const anonymous=fixture({user:null});await assert.rejects(anonymous.client.checkout(),e=>e.code==='authentication_required');assert.equal(anonymous.calls.length,0);
});
test('an active purchase, owner or migration right blocks Checkout without a POST',async()=>{
  for(const kind of ['purchase','owner','migration']){
    const f=fixture({reply:async()=>Response.json(status({entitlement:{active:true,kind,expiresAt:kind==='owner'?null:200}}))});
    await assert.rejects(f.client.checkout(),e=>e.code==='already_active');assert.equal(f.calls.length,1);assert.equal(f.navigations.length,0);
  }
});
test('duplicate clicks share one in-flight operation and retries preserve the request UUID',async()=>{
  const pending=deferred();let attempts=0;const f=fixture({reply:async url=>url.includes('checkout')?(attempts++===0?pending.promise:Response.json({url:'https://checkout.stripe.com/c/pay/fixture'})):Response.json(status())});
  const first=f.client.checkout();await assert.rejects(f.client.checkout(),e=>e.code==='request_in_progress');
  await new Promise(r=>setTimeout(r,0));pending.resolve(Response.json({error:'service_unavailable'},{status:503}));await assert.rejects(first);await f.client.checkout();
  const ids=f.calls.filter(c=>c.init.method==='POST').map(c=>JSON.parse(c.init.body).requestId);assert.deepEqual(ids,[requestID,requestID]);
});
test('an explicit new attempt is allowed only after a terminal checkout response',async()=>{
  const f=fixture({reply:async url=>Response.json(url.includes('checkout')?{error:'checkout_expired'}:status(),{status:url.includes('checkout')?409:200})});
  await assert.rejects(f.client.checkout({newAttempt:true}),e=>e.code==='retry_not_available');
  await assert.rejects(f.client.checkout(),e=>e.code==='checkout_expired');await assert.rejects(f.client.checkout({newAttempt:true}),e=>e.code==='checkout_expired');
  assert.equal(f.calls.filter(c=>c.init.method==='POST').length,2);
});
test('redirects cannot leave the exact HTTPS Stripe Checkout host',async()=>{
  for(const url of ['https://checkout.stripe.com.attacker.invalid/x','http://checkout.stripe.com/x','https://name:pass@checkout.stripe.com/x','https://checkout.stripe.com:444/x','javascript:alert(1)']){
    const f=fixture({reply:async path=>Response.json(path.includes('checkout')?{url}:status())});await assert.rejects(f.client.checkout(),e=>e.code==='checkout_response_invalid');assert.equal(f.navigations.length,0);
  }
});
test('return URLs accept one session ID only and never create a purchase',async()=>{
  assert.equal(api.parseReturnURL('https://fe-quest.pages.dev/billing-return.html?session_id=cs_test_123'),'cs_test_123');
  for(const q of ['?session_id=cs_test_123&session_id=cs_test_456','?session_id=x','?next=https://attacker.invalid'])assert.throws(()=>api.parseReturnURL('https://fe-quest.pages.dev/billing-return.html'+q));
  const f=fixture();await f.client.refresh('cs_test_123');assert(f.calls.every(c=>c.init.method==='GET'));assert.equal(f.navigations.length,0);
});
test('Auth switch during token refresh prevents the old token from reaching the API',async()=>{
  const pending=deferred(),f=fixture();f.auth.getAccessToken=()=>pending.promise;
  const request=f.client.refresh();f.setUser(other);pending.resolve('old-token');
  await assert.rejects(request,e=>e.code==='account_changed');assert.equal(f.calls.length,0);assert.equal(f.client.snapshot().status,null);assert.equal(f.changes(),1);
});
test('a late response after Auth switch cannot restore the old account entitlement',async()=>{
  const pending=deferred(),f=fixture({reply:()=>pending.promise}),request=f.client.refresh();await new Promise(r=>setTimeout(r,0));f.setUser(other);
  pending.resolve(Response.json(status({entitlement:{active:true,expiresAt:null,kind:'owner'}})));await assert.rejects(request,e=>e.code==='account_changed');
  assert.equal(f.client.snapshot().userID,other);assert.equal(f.client.snapshot().status,null);assert.equal(f.stored.get('learner-profile-sentinel'),'keep');
});
test('same-account token events preserve caches; logout discards temporary account state',async()=>{
  const f=fixture();await f.client.refresh();f.setUser(uid);assert(f.client.snapshot().status);assert.equal(f.changes(),0);
  f.setUser(null);assert.equal(f.client.snapshot().status,null);assert.equal(f.changes(),1);
});
test('getSession changing identity before the Auth event also invalidates the old account',async()=>{
  const f=fixture();await f.client.refresh();f.auth.getAccessToken=async()=>{f.quietSetUser(other);return 'new-account-token';};
  await assert.rejects(f.client.refresh(),e=>e.code==='account_changed');assert.equal(f.client.snapshot().userID,other);assert.equal(f.client.snapshot().status,null);assert.equal(f.changes(),1);
});
test('overlapping status reads cannot overwrite a newer response',async()=>{
  const first=deferred();let count=0;const f=fixture({reply:()=>++count===1?first.promise:Promise.resolve(Response.json(status({purchaseAvailable:false})))});
  const a=f.client.refresh();await new Promise(r=>setTimeout(r,0));await f.client.refresh();first.resolve(Response.json(status()));
  await assert.rejects(a,e=>e.code==='request_superseded');assert.equal(f.client.snapshot().status.purchaseAvailable,false);
});
test('candidate content uses the verified token and drops legacy access codes; disabled candidates never call',async()=>{
  const f=fixture({settings:{accessEnforcementEnabled:true},reply:async()=>Response.json({lessonId:'core_01_01',payload:{}})});
  await f.client.content('lesson',{action:'lesson',lessonId:'core_01_01',accessCode:'old-code'});
  assert.deepEqual(JSON.parse(f.calls[0].init.body),{action:'lesson',lessonId:'core_01_01'});assert(f.calls[0].url.endsWith('/fequest-lesson-gate-billing-v1'));
  const disabled=fixture();await assert.rejects(disabled.client.content('lesson',{}),e=>e.code==='candidate_inactive');assert.equal(disabled.calls.length,0);
});
test('invalid status and network failures stay closed without enabling Checkout',async()=>{
  for(const value of [{},status({plan:{sku:api.SKU,amountJPY:1,durationDays:180,autoRenew:false}}),status({entitlement:{active:true,expiresAt:null,kind:'purchase'}})]){
    const f=fixture({reply:async()=>Response.json(value)});await assert.rejects(f.client.refresh());assert.equal(f.client.snapshot().status,null);
  }
});

function providerContext(filename,gate){
  const context={console,URL,Map,Set,WeakMap,Promise,AbortController,setTimeout,clearTimeout,document:{currentScript:{src:'https://fe-quest.pages.dev/assets/'+filename},baseURI:'https://fe-quest.pages.dev/'},sessionStorage:{getItem:()=>null,removeItem(){},setItem(){}},fetch:async(url,init)=>{
    if(String(url).includes('supabase.co'))return gate(JSON.parse(init.body));
    const file=new URL(url).pathname.replace(/^\//,'');return Response.json(JSON.parse(fs.readFileSync(new URL('../../'+file,import.meta.url),'utf8')));
  }};context.globalThis=context;context.window=context;
  vm.runInNewContext(fs.readFileSync(new URL('../../assets/'+filename,import.meta.url),'utf8'),context);return context;
}
for(const filename of ['protected-content-provider-v376.js','protected-content-provider-v376-v35.js'])test(filename+': account clearing rejects ignored-abort bootstrap/answer responses',async()=>{
  let pending=null;const id='coreq_01_01_1';
  const packet={id,stem:'fixture',options:['A','B','C','D'],hint:'',renderContext:{}};
  const c=providerContext(filename,body=>pending?pending.promise:Promise.resolve(Response.json(body.action==='bootstrap'?{sessionToken:'a'.repeat(64),questions:[packet]}:{questionId:id,correct:true,answerIndex:0,explanation:'fixture',choiceExplanations:[],postSubmit:{}})));
  const p=c.FEQUEST_PROTECTED_CONTENT;await p.loadCatalog();
  pending=deferred();const first=p.hydrate([id]);await new Promise(r=>setTimeout(r,0));p.clearProtectedCache();pending.resolve(Response.json({sessionToken:'a'.repeat(64),questions:[packet]}));
  await assert.rejects(first,/account_changed/);assert.equal(p.getCachedQuestion(id),null);
  pending=null;await p.hydrate([id]);pending=deferred();const answer=p.submit(id,0);await new Promise(r=>setTimeout(r,0));p.clearProtectedCache();pending.resolve(Response.json({questionId:id,correct:true,answerIndex:0,explanation:'fixture',choiceExplanations:[],postSubmit:{}}));
  await assert.rejects(answer,/account_changed/);assert.equal(p.getAnsweredResult(id),null);
});
test('lesson account clearing rejects a late ignored-abort payload',async()=>{
  const pending=deferred(),c=providerContext('protected-lesson-provider-v376.js',()=>pending.promise),p=c.FEQUEST_PROTECTED_LESSONS;
  const first=p.hydrate('core_01_01');p.clearCurrent();pending.resolve(Response.json({lessonId:'core_01_01',payload:{articleHtml:'fixture'}}));
  await assert.rejects(first,/superseded/);assert.equal(p.getCurrent(),null);
});
test('public release switches are false and the new pages have no inline code or key material',()=>{
  const source=fs.readFileSync(new URL('../../assets/billing-config-v1.js',import.meta.url),'utf8'),context={URL,location:{href:'https://fe-quest.pages.dev/plans.html'}};
  vm.runInNewContext(source,context);assert.equal(context.FEQUEST_BILLING_CONFIG_V1.salesEnabled,false);assert.equal(context.FEQUEST_BILLING_CONFIG_V1.accessEnforcementEnabled,false);
  for(const name of ['plans.html','billing-return.html']){
    const html=fs.readFileSync(new URL('../../'+name,import.meta.url),'utf8');
    assert(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html));assert(!/\bon(?:click|load|error)=/i.test(html));assert(html.includes('Content-Security-Policy'));
  }
});
