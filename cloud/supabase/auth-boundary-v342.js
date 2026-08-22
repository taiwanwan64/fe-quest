// FE QUEST v342 Supabase authentication/session boundary.
// This module owns no learner profile data and no refresh-token storage of its own.
// Supabase Auth remains responsible for session persistence/refresh; FE QUEST only keeps
// a short-lived in-memory session snapshot so the local-first sync engine can ask for
// the currently authenticated user id synchronously.
(function(root){
  'use strict';

  const AUTH_SPEC=Object.freeze({
    provider:'supabase',
    method:'email-magic-link',
    flowType:'pkce',
    persistSession:true,
    autoRefreshToken:true,
    detectSessionInUrl:true,
    emailTemplate:'redirect-to-token-hash',
    callbackQuery:'token_hash+type=email',
    signOutScope:'local'
  });

  function trimSlash(value){return String(value||'').replace(/\/+$/,'')}
  function publicKey(value){
    if(typeof value!=='string'||value.length<20)throw new TypeError('Supabase public publishable/anon key required');
    if(/service[_-]?role/i.test(value)||new RegExp('sb'+'_secret_','i').test(value))throw new TypeError('secret/service-role key is forbidden in the PWA');
    return value;
  }
  function validHttps(value){return /^https:\/\//i.test(String(value||''))}
  function cleanEmail(value){
    const email=String(value||'').trim().toLowerCase();
    if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new TypeError('valid email required');
    return email;
  }
  function sessionValue(session){
    if(!session||typeof session!=='object'||!session.user||typeof session.user.id!=='string'||!session.user.id)return null;
    return {
      userId:session.user.id,
      email:typeof session.user.email==='string'?session.user.email:null,
      accessToken:typeof session.access_token==='string'&&session.access_token?session.access_token:null,
      expiresAt:Number.isFinite(Number(session.expires_at))?Number(session.expires_at):null
    };
  }

  function parseEmailTokenHashCallback(value){
    if(!value)return null;
    let url;
    try{url=new URL(String(value),'https://fequest.invalid/')}catch(_e){return null}
    const tokenHash=url.searchParams.get('token_hash');
    const type=url.searchParams.get('type');
    if(!tokenHash||type!=='email')return null;
    return Object.freeze({tokenHash,type:'email'});
  }

  function sanitizedCallbackUrl(value){
    if(!value)return null;
    let url;
    try{url=new URL(String(value),'https://fequest.invalid/')}catch(_e){return null}
    url.searchParams.delete('token_hash');
    url.searchParams.delete('type');
    return url.toString();
  }

  function createConfiguredClient(options){
    const o=options||{};
    if(typeof o.createClient!=='function')throw new TypeError('Supabase createClient function required');
    const url=trimSlash(o.url);
    if(!validHttps(url))throw new TypeError('Supabase https project URL required');
    const key=publicKey(o.publishableKey??o.anonKey);
    const auth={
      persistSession:true,
      autoRefreshToken:true,
      detectSessionInUrl:true,
      flowType:'pkce'
    };
    if(o.storage)auth.storage=o.storage;
    return o.createClient(url,key,{auth});
  }

  function createAuthBoundary(options){
    const o=options||{};
    const client=o.client;
    if(!client||!client.auth)throw new TypeError('Supabase auth client required');
    if(typeof client.auth.getSession!=='function'||typeof client.auth.onAuthStateChange!=='function'||typeof client.auth.signInWithOtp!=='function'||typeof client.auth.signOut!=='function'){
      throw new TypeError('Supabase auth client methods missing');
    }
    const redirectTo=String(o.redirectTo||'');
    if(redirectTo&&!validHttps(redirectTo))throw new TypeError('https auth redirect required');
    const onSignedOut=typeof o.onSignedOut==='function'?o.onSignedOut:()=>{};
    const onAuthError=typeof o.onAuthError==='function'?o.onAuthError:()=>{};
    const getLocationHref=typeof o.getLocationHref==='function'?o.getLocationHref:()=>{
      try{return root.location&&typeof root.location.href==='string'?root.location.href:''}catch(_e){return ''}
    };
    const replaceLocation=typeof o.replaceLocation==='function'?o.replaceLocation:(next=>{
      try{root.history&&typeof root.history.replaceState==='function'&&root.history.replaceState(root.history.state||null,'',next)}catch(_e){}
    });

    let cached=null;
    let subscription=null;
    let initialized=false;
    const listeners=new Set();

    function snapshot(){
      return Object.freeze({
        initialized,
        signedIn:Boolean(cached&&cached.userId),
        userId:cached?cached.userId:null,
        email:cached?cached.email:null,
        expiresAt:cached?cached.expiresAt:null
      });
    }

    function notify(event){
      const snap=snapshot();
      for(const fn of Array.from(listeners)){
        try{fn(snap,event)}catch(_e){}
      }
    }

    function setSession(session,event){
      const previousUser=cached&&cached.userId;
      cached=sessionValue(session);
      const nextUser=cached&&cached.userId;
      if(previousUser&&!nextUser){
        try{onSignedOut(previousUser,event||'SIGNED_OUT')}catch(_e){}
      }
      notify(event||'SESSION_CHANGED');
      return snapshot();
    }

    async function consumeEmailTokenHashCallback(){
      const href=getLocationHref();
      const callback=parseEmailTokenHashCallback(href);
      if(!callback)return {ok:true,status:'none'};
      if(typeof client.auth.verifyOtp!=='function'){
        const error=new Error('Supabase verifyOtp is required for PKCE email callback');
        try{onAuthError(error,'PKCE_EMAIL_CALLBACK')}catch(_e){}
        return {ok:false,status:'verify-unavailable',error};
      }
      let result;
      try{result=await client.auth.verifyOtp({token_hash:callback.tokenHash,type:callback.type})}catch(error){
        try{onAuthError(error,'PKCE_EMAIL_CALLBACK')}catch(_e){}
        return {ok:false,status:'verify-error',error};
      }
      if(result&&result.error){
        try{onAuthError(result.error,'PKCE_EMAIL_CALLBACK')}catch(_e){}
        return {ok:false,status:'verify-error',error:result.error};
      }
      const clean=sanitizedCallbackUrl(href);
      if(clean)try{replaceLocation(clean)}catch(_e){}
      return {ok:true,status:'verified'};
    }

    async function initialize(){
      if(initialized)return snapshot();
      // Supabase's hosted passwordless guide requires PKCE magic-link templates to send
      // token_hash + type=email back to the app, which the browser client exchanges with verifyOtp.
      // A failed callback is nonfatal: local study still starts and the auth error is reported only
      // through this isolated boundary.
      await consumeEmailTokenHashCallback();
      let result;
      try{result=await client.auth.getSession()}catch(error){
        initialized=true;
        try{onAuthError(error,'INITIAL_SESSION')}catch(_e){}
        notify('INITIAL_SESSION_ERROR');
        return snapshot();
      }
      if(result&&result.error){
        initialized=true;
        try{onAuthError(result.error,'INITIAL_SESSION')}catch(_e){}
        notify('INITIAL_SESSION_ERROR');
      }else{
        cached=sessionValue(result&&result.data&&result.data.session);
        initialized=true;
        notify('INITIAL_SESSION');
      }
      const registered=client.auth.onAuthStateChange((event,session)=>{
        setSession(session,event||'AUTH_STATE_CHANGE');
      });
      subscription=registered&&registered.data&&registered.data.subscription?registered.data.subscription:null;
      return snapshot();
    }

    function getAuthenticatedUserId(){return cached&&cached.userId?cached.userId:null}

    async function getAccessToken(){
      let result;
      try{result=await client.auth.getSession()}catch(error){
        try{onAuthError(error,'TOKEN_SESSION')}catch(_e){}
        return null;
      }
      if(!result||result.error){
        if(result&&result.error)try{onAuthError(result.error,'TOKEN_SESSION')}catch(_e){}
        return null;
      }
      cached=sessionValue(result.data&&result.data.session);
      return cached&&cached.accessToken?cached.accessToken:null;
    }

    async function sendMagicLink(email){
      const normalized=cleanEmail(email);
      const options={shouldCreateUser:true};
      if(redirectTo)options.emailRedirectTo=redirectTo;
      try{
        const result=await client.auth.signInWithOtp({email:normalized,options});
        if(result&&result.error)return {ok:false,error:result.error};
        return {ok:true,email:normalized};
      }catch(error){return {ok:false,error}}
    }

    async function signOutThisDevice(){
      let result;
      try{result=await client.auth.signOut({scope:'local'})}catch(error){return {ok:false,error,snapshot:snapshot()}}
      if(result&&result.error)return {ok:false,error:result.error,snapshot:snapshot()};
      // Supabase normally emits SIGNED_OUT synchronously. Keep a defensive local clear
      // for adapters/mocks that do not emit it; setSession only calls onSignedOut on a transition.
      setSession(null,'SIGNED_OUT');
      return {ok:true,snapshot:snapshot()};
    }

    function subscribe(listener){
      if(typeof listener!=='function')throw new TypeError('listener function required');
      listeners.add(listener);
      return ()=>listeners.delete(listener);
    }

    function dispose(){
      try{subscription&&subscription.unsubscribe&&subscription.unsubscribe()}catch(_e){}
      subscription=null;
      listeners.clear();
      return true;
    }

    return Object.freeze({initialize,snapshot,getAuthenticatedUserId,getAccessToken,sendMagicLink,signOutThisDevice,consumeEmailTokenHashCallback,subscribe,dispose});
  }

  const api=Object.freeze({AUTH_SPEC,parseEmailTokenHashCallback,sanitizedCallbackUrl,createConfiguredClient,createAuthBoundary});
  root.FEQUEST_SUPABASE_AUTH_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
