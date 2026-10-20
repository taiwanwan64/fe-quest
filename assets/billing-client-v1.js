// No learner profile or token persistence. Server responses determine access.
(function(root){
  'use strict';
  const SKU='fequest-full-180d',UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  const SESSION=/^cs_[A-Za-z0-9_]{3,217}$/;
  const terminal=new Set(['checkout_expired','request_already_completed']);
  class ClientError extends Error{constructor(code,status=0){super(code);this.code=code;this.status=status;}}
  function policy(value){
    if(!value||!['open-preview','restricted'].includes(value.accessMode)||!Number.isSafeInteger(value.accessRevision)||value.accessRevision<1)throw new ClientError('content_policy_invalid');
    return {accessMode:value.accessMode,accessRevision:value.accessRevision};
  }
  function validateStatus(value){
    policy(value);
    const v=value,e=v?.entitlement,p=v?.plan;
    if(!v||typeof v.purchaseAvailable!=='boolean'||!['open-preview','restricted'].includes(v.accessMode)||p?.sku!==SKU||p.amountJPY!==2980||p.durationDays!==180||p.autoRenew!==false||v.preview?.lessons!==6||v.preview?.questions!==41||typeof e?.active!=='boolean'||!(e.expiresAt===null||Number.isSafeInteger(e.expiresAt))||(e.active&&e.expiresAt===null&&e.kind!=='owner')||(e.kind!==undefined&&!['owner','migration','purchase'].includes(e.kind))||(v.purchase!==null&&(!v.purchase||!['pending','paid','refunded','expired'].includes(v.purchase.state)||typeof v.purchase.confirmationPending!=='boolean'||typeof v.purchase.reconciliationRequired!=='boolean')))throw new ClientError('status_invalid');
    return v;
  }
  function parseReturnURL(href){
    const u=new URL(href),ids=u.searchParams.getAll('session_id');
    if([...u.searchParams.keys()].some(k=>k!=='session_id')||ids.length>1||(ids.length===1&&!SESSION.test(ids[0])))throw new ClientError('invalid_return');
    return ids[0]??null;
  }
  function createClient({authBoundary,config,fetcher=root.fetch.bind(root),storage=root.sessionStorage,randomUUID=()=>root.crypto.randomUUID(),navigate=url=>root.location.assign(url),onIdentityChange=()=>{},onAccessChange=()=>{},onAccessDenied=()=>{}}){
    const base=new URL(config.supabaseURL);
    if(base.protocol!=='https:'||base.hostname!=='gkvgxnkoypypikxtyeoz.supabase.co'||base.pathname!=='/'||base.username||base.password||base.port||base.search||base.hash)throw new ClientError('configuration_invalid');
    const listeners=new Set(),requests=new Set(),contentRequests=new Set(),intents=new Map();let generation=0,disposed=false,status=null,lastError=null,busy=false,refreshRequest=0,contentGeneration=0,accessPolicy=null,rightsStamp=null;
    function clearContent(){contentGeneration++;for(const c of contentRequests)c.abort();contentRequests.clear();try{onAccessChange();}catch(_e){}}
    function acceptPolicy(value){
      const next=policy(value);
      if(accessPolicy&&(next.accessRevision<accessPolicy.accessRevision||(next.accessRevision===accessPolicy.accessRevision&&next.accessMode!==accessPolicy.accessMode)))throw new ClientError('request_superseded');
      const changed=accessPolicy&&(next.accessRevision!==accessPolicy.accessRevision||next.accessMode!==accessPolicy.accessMode);
      accessPolicy=next;if(changed)clearContent();return Boolean(changed);
    }
    const identity=()=>{const s=authBoundary?.snapshot();return s?.signedIn&&UUID.test(s.userId)?s.userId:null;};
    let userID=identity();
    const snapshot=()=>Object.freeze({userID,status,lastError,busy,salesEnabled:config.salesEnabled===true,accessEnforcementEnabled:config.accessEnforcementEnabled===true});
    const emit=()=>{const s=snapshot();for(const fn of [...listeners])try{fn(s);}catch(_e){}};
    function assertCurrent(g,u){if(identity()!==userID)invalidate();if(disposed||g!==generation||u!==identity())throw new ClientError('account_changed');}
    function invalidate(){
      const next=identity();if(next===userID)return;
      userID=next;generation++;refreshRequest++;status=null;lastError=null;busy=false;
      contentGeneration++;accessPolicy=null;rightsStamp=null;contentRequests.clear();
      for(const c of requests)c.abort();requests.clear();
      try{onIdentityChange(next);}catch(_e){}
      emit();
    }
    const unsubscribe=authBoundary?.subscribe(()=>{invalidate();});
    async function request(path,{method='GET',body,requireAuth=false,isContent=false}={}){
      invalidate();const g=generation,u=userID;
      const cg=contentGeneration;
      if(requireAuth&&!u)throw new ClientError('authentication_required',401);
      const token=u?await authBoundary.getAccessToken():null;assertCurrent(g,u);
      if(u&&!token)throw new ClientError('authentication_required',401);
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);requests.add(controller);
      if(isContent)contentRequests.add(controller);
      try{
        const headers={apikey:config.publishableKey,...(token?{authorization:'Bearer '+token}:{}),...(body?{'content-type':'application/json'}:{})};
        const r=await fetcher(base.origin+'/functions/v1/'+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'});
        const value=await r.json();assertCurrent(g,u);
        if(isContent){
          if(r.ok||value?.accessMode!==undefined)acceptPolicy(value);
          if(cg!==contentGeneration)throw new ClientError('content_policy_changed');
        }
        if(!r.ok)throw new ClientError(typeof value?.error==='string'?value.error:'service_unavailable',r.status);
        return value;
      }catch(e){assertCurrent(g,u);if(e instanceof ClientError)throw e;throw new ClientError('service_unavailable');}
      finally{clearTimeout(timer);requests.delete(controller);contentRequests.delete(controller);}
    }
    async function refresh(sessionID=null){
      invalidate();const sequence=++refreshRequest,g=generation,u=userID;
      if(sessionID!==null&&!SESSION.test(sessionID))throw new ClientError('invalid_return');
      try{
        const data=validateStatus(await request('fequest-access-status-v1'+(sessionID?'?session_id='+encodeURIComponent(sessionID):''),{requireAuth:Boolean(sessionID)}));
        assertCurrent(g,u);if(sequence!==refreshRequest)throw new ClientError('request_superseded');
        acceptPolicy(data);
        const nextRights=JSON.stringify(data.entitlement);
        if(rightsStamp!==null&&rightsStamp!==nextRights)clearContent();rightsStamp=nextRights;
        status=data;lastError=null;emit();return data;
      }catch(e){if(g===generation&&sequence===refreshRequest&&!disposed){status=null;lastError=e.code||'service_unavailable';emit();}throw e;}
    }
    function intent(newAttempt){
      const key='fequest_checkout_intent_v1:'+userID+':'+SKU;
      if(newAttempt&&!terminal.has(lastError))throw new ClientError('retry_not_available');
      let id=intents.get(userID);
      try{if(newAttempt)storage?.removeItem(key);else if(!id)id=storage?.getItem(key);}catch(_e){}
      if(newAttempt||!UUID.test(id||''))id=randomUUID();
      if(!UUID.test(id))throw new ClientError('request_id_unavailable');
      intents.set(userID,id);try{storage?.setItem(key,id);}catch(_e){}
      return id;
    }
    async function checkout({newAttempt=false}={}){
      invalidate();if(busy)throw new ClientError('request_in_progress');
      if(!config.salesEnabled)throw new ClientError('billing_unavailable',503);
      if(!userID)throw new ClientError('authentication_required',401);
      const requestID=intent(newAttempt),g=generation,u=userID;busy=true;emit();
      try{
        const current=await refresh();assertCurrent(g,u);
        if(current.entitlement.active)throw new ClientError('already_active',409);
        if(!current.purchaseAvailable)throw new ClientError('billing_unavailable',503);
        const result=await request('fequest-checkout-v1',{method:'POST',body:{sku:SKU,requestId:requestID},requireAuth:true});assertCurrent(g,u);
        let url;try{url=new URL(result.url);}catch(_e){throw new ClientError('checkout_response_invalid');}
        if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com'||url.username||url.password||url.port)throw new ClientError('checkout_response_invalid');
        navigate(url.href);return url.href;
      }catch(e){if(g===generation&&!disposed){lastError=e.code||'service_unavailable';emit();}throw e;}
      finally{if(g===generation&&!disposed){busy=false;emit();}}
    }
    async function content(kind,body){
      if(!['question','lesson'].includes(kind))throw new ClientError('invalid_content_kind');
      const payload={...body};delete payload.accessCode;
      // Stable URLs are protected by the server release policy. No browser flag
      // selects a free endpoint, and errors never retry another URL.
      try{return await request('fequest-'+kind+'-gate-v376',{method:'POST',body:payload,isContent:true});}
      catch(error){if(['authentication_required','purchase_required'].includes(error.code)){clearContent();try{onAccessDenied(error);}catch(_e){}}throw error;}
    }
    function dispose(){disposed=true;generation++;for(const c of requests)c.abort();requests.clear();unsubscribe?.();listeners.clear();}
    return Object.freeze({snapshot,refresh,checkout,content,subscribe:fn=>{listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},dispose});
  }
  const api=Object.freeze({SKU,ClientError,createClient,validateStatus,parseReturnURL});
  root.FEQUEST_BILLING_API_V1=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
