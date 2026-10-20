import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../billing-ui/package.json',import.meta.url)),{chromium}=require('playwright');
const root=path.resolve(new URL('../../',import.meta.url).pathname),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'fequest-billing-browser-'));
const out=path.resolve(process.env.BILLING_UI_EVIDENCE_DIR||path.join(temporary,'evidence'));fs.mkdirSync(out,{recursive:true});
execFileSync('openssl',['req','-x509','-nodes','-newkey','rsa:2048','-keyout',path.join(temporary,'key.pem'),'-out',path.join(temporary,'cert.pem'),'-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=https.createServer({key:fs.readFileSync(path.join(temporary,'key.pem')),cert:fs.readFileSync(path.join(temporary,'cert.pem'))},(req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'https://localhost').pathname);}catch(_e){res.writeHead(400).end();return;}
  const target=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404).end();return;}
  res.setHeader('content-type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('cache-control','no-store');fs.createReadStream(target).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='https://127.0.0.1:'+server.address().port;
const executablePath=process.env.BILLING_BROWSER_EXECUTABLE;
assert(executablePath,'BILLING_BROWSER_EXECUTABLE must point to an installed browser');
const args=JSON.parse(process.env.BILLING_BROWSER_ARGS||'["--no-sandbox","--disable-dev-shm-usage"]');
let browser;const evidence={browser:null,cases:[],liveEmailRequests:0,liveCheckoutRequests:0};
const uid='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const plan={sku:'fequest-full-180d',amountJPY:2980,durationDays:180,autoRenew:false};
const response=extra=>({purchaseAvailable:false,accessMode:'open-preview',plan,preview:{lessons:6,questions:41},entitlement:{active:false,expiresAt:null},purchase:null,...extra});
async function fixture({initialUser=null,width=390,height=844,reply=()=>({status:200,body:response({})})}={}){
  browser=await chromium.launch({executablePath,args,headless:true});evidence.browser=await browser.version();
  const context=await browser.newContext({viewport:{width,height},ignoreHTTPSErrors:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({initialUser,uid,other})=>{
    let user=initialUser?{id:initialUser,email:initialUser===uid?'first@example.invalid':'second@example.invalid'}:null;
    const listeners=new Set();window.__fixtureEmailSends=0;
    const snapshot=()=>({initialized:true,signedIn:Boolean(user),userId:user?.id??null,email:user?.email??null});
    const setUser=id=>{user=id?{id,email:id===uid?'first@example.invalid':'second@example.invalid'}:null;for(const fn of listeners)fn(snapshot(),'SIGNED_IN');};
    const boundary={initialize:async()=>snapshot(),snapshot,getAccessToken:async()=>user?user.id+'-fixture-token':null,getAuthenticatedUserId:()=>user?.id??null,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},sendMagicLink:async()=>{window.__fixtureEmailSends++;return{ok:true};},verifyEmailCode:async(email,code)=>{if(code!=='123456')return{ok:false};setUser(email.startsWith('second')?other:uid);return{ok:true};},signOutThisDevice:async()=>{setUser(null);return{ok:true};},dispose(){}};
    const api={createConfiguredClient:()=>({}),createAuthBoundary:()=>boundary};
    Object.defineProperty(window,'FEQUEST_SUPABASE_AUTH_V342',{configurable:false,get:()=>api,set(){}});
    window.__fixtureSetUser=setUser;localStorage.setItem('learner-history-sentinel','preserved');
  },{initialUser,uid,other});
  await context.route('https://gkvgxnkoypypikxtyeoz.supabase.co/**',async route=>{
    const req=route.request(),url=req.url(),method=req.method(),headers={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,apikey,content-type','access-control-allow-methods':'GET,POST,OPTIONS'};
    if(method==='OPTIONS'){await route.fulfill({status:204,headers});return;}
    requests.push({url,method,authorization:req.headers().authorization??null});
    if(url.includes('/auth/')){evidence.liveEmailRequests++;await route.fulfill({status:500,headers,json:{error:'auth_not_expected'}});return;}
    if(url.includes('fequest-checkout-v1')){evidence.liveCheckoutRequests++;await route.fulfill({status:503,headers,json:{error:'billing_unavailable'}});return;}
    const result=await reply(req);await route.fulfill({status:result.status,headers,json:result.body});
  });
  return{context,page,errors,requests};
}
async function capture(f,name){
  await f.page.evaluate(()=>document.fonts.ready);
  assert(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': horizontal overflow');
  assert.deepEqual(f.errors,[],name+': page errors');
  assert.equal(await f.page.evaluate(()=>localStorage.getItem('learner-history-sentinel')),'preserved');
  await f.page.screenshot({path:path.join(out,name+'.png'),fullPage:true});evidence.cases.push({name,passed:true,requests:f.requests.length});
}
try{
  {
    const f=await fixture();await f.page.goto(base+'/plans.html');await f.page.getByRole('heading',{name:'現在は無料公開中です'}).waitFor();
    assert(await f.page.locator('#checkout').isDisabled());assert.equal(f.requests.filter(r=>r.method==='POST').length,0);
    await capture(f,'phone-plans-free');await f.context.close();await browser.close();browser=null;
  }
  {
    const f=await fixture({initialUser:uid,width:1280,height:900,reply:()=>({status:200,body:response({entitlement:{active:true,kind:'owner',expiresAt:null}})})});
    await f.page.goto(base+'/plans.html');await f.page.getByRole('heading',{name:'利用権があります'}).waitFor();assert(await f.page.locator('#checkout').isDisabled());
    await capture(f,'desktop-owner');await f.context.close();await browser.close();browser=null;
  }
  {
    let count=0;const f=await fixture({initialUser:uid,reply:()=>({status:200,body:++count<3?response({purchase:{state:'pending',confirmationPending:true,reconciliationRequired:false}}):response({purchase:{state:'paid',confirmationPending:false,reconciliationRequired:false},entitlement:{active:true,kind:'purchase',expiresAt:1792468800+15552000}})})});
    await f.page.goto(base+'/billing-return.html?session_id=cs_test_fixture');await f.page.getByRole('heading',{name:'お支払いを確認しています'}).waitFor();
    await f.page.getByRole('heading',{name:'お支払いを確認しました'}).waitFor({timeout:12000});
    assert(!f.page.url().includes('session_id'));assert(f.requests.every(r=>r.method==='GET'));
    await capture(f,'phone-return-paid');await f.context.close();await browser.close();browser=null;
  }
  {
    const f=await fixture({initialUser:uid,reply:()=>({status:200,body:response({purchase:{state:'refunded',confirmationPending:false,reconciliationRequired:false}})})});
    await f.page.goto(base+'/billing-return.html?session_id=cs_test_fixture');await f.page.getByRole('heading',{name:'返金済みです'}).waitFor();
    await capture(f,'phone-return-refunded');await f.context.close();await browser.close();browser=null;
  }
  {
    let release;const blocked=new Promise(r=>release=r);
    const f=await fixture({initialUser:uid,reply:async req=>{
      if(req.headers().authorization?.includes(uid)){await blocked;return{status:200,body:response({entitlement:{active:true,kind:'owner',expiresAt:null}})};}
      return{status:404,body:{error:'purchase_not_found'}};
    }});
    await f.page.goto(base+'/billing-return.html?session_id=cs_test_fixture');await f.page.waitForFunction(()=>Boolean(window.__fixtureSetUser));
    await f.page.evaluate(other=>window.__fixtureSetUser(other),other);release();
    await f.page.getByText('このアカウントでは購入情報を確認できませんでした。購入時のアカウントをご確認ください。').waitFor();
    assert(!(await f.page.locator('#accessCopy').innerText()).includes('個人学習用'));
    await capture(f,'phone-account-switch');await f.context.close();await browser.close();browser=null;
  }
  {
    const f=await fixture();await f.page.goto(base+'/plans.html');await f.page.getByRole('heading',{name:'現在は無料公開中です'}).waitFor();
    await f.page.locator('#email').fill('first@example.invalid');await f.page.locator('#sendCode').click();
    await f.page.getByText('確認コードを送信しました。メールに届くコードを、この画面に入力してください。').waitFor();
    await f.page.locator('#code').fill('123456');await f.page.locator('#verifyCode').click();await f.page.getByText('first@example.invalid',{exact:true}).waitFor();
    assert(await f.page.locator('#checkout').isDisabled());assert.equal(await f.page.evaluate(()=>window.__fixtureEmailSends),1);
    assert(!f.requests.some(r=>r.url.includes('/auth/')));await capture(f,'phone-code-login');await f.context.close();await browser.close();browser=null;
  }
  {
    const id='coreq_01_01_1',f=await fixture({initialUser:uid,reply:req=>{
      if(req.url().includes('fequest-question-gate')){const body=req.postDataJSON();return{status:200,body:{sessionToken:'a'.repeat(64),questions:body.requestedIds.map(id=>({id,stem:'Browser fixture',options:['A','B','C','D'],hint:'',catalog:{},renderContext:{}}))}};}
      return{status:200,body:response({})};
    }});
    await f.page.goto(base+'/');await f.page.waitForFunction(()=>Boolean(window.FEQUEST_BILLING_V1));
    await f.page.evaluate(async id=>{await window.FEQUEST_IPA92_V35_PROVIDER_READY;await window.FEQUEST_PROTECTED_CONTENT.hydrate([id]);},id);
    assert(await f.page.evaluate(id=>Boolean(window.FEQUEST_PROTECTED_CONTENT.getCachedQuestion(id)),id));
    const cleared=await f.page.evaluate(()=>{const removed=[],original=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){removed.push(k);return original.call(this,k);};window.FEQUEST_CLEAR_TEMPORARY_ACCESS_V1(false);Storage.prototype.removeItem=original;return removed;});
    assert.deepEqual(cleared,[]);assert.equal(await f.page.evaluate(id=>window.FEQUEST_PROTECTED_CONTENT.getCachedQuestion(id),id),null);
    await f.page.evaluate(other=>window.__fixtureSetUser(other),other);await f.page.waitForFunction(other=>window.FEQUEST_BILLING_V1.snapshot().userID===other,other);
    await f.page.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
    await f.page.waitForTimeout(100);await f.page.evaluate(()=>window.FEQUEST_BILLING_V1.refresh());
    await capture(f,'phone-app-cache-clear');await f.context.close();await browser.close();browser=null;
  }
  assert.equal(evidence.liveEmailRequests,0);assert.equal(evidence.liveCheckoutRequests,0);
  console.log('PASS browser: '+evidence.cases.length+' screen states, responsive layouts, account switch, code-login port and zero live email/Checkout requests');
}finally{
  fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  await browser?.close();await new Promise(resolve=>server.close(resolve));
}
