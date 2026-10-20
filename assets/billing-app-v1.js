(function(root){
  'use strict';
  // Only volatile content/session state is cleared. No profile, progress,
  // recovery point, sync metadata or persisted resume record is deleted.
  function clearTemporaryAccess(navigate=true){
    for(const reset of root.FEQUEST_ACCOUNT_CACHE_RESETS_V1??[])try{reset();}catch(_e){}
    for(const name of ['releaseSubjectAPracticeRuntimeV435','releaseSubjectAMockContextV435','releaseSubjectBProtectedRuntimeV435'])try{root[name]?.();}catch(_e){}
    try{root.FEQUEST_PROTECTED_LESSONS?.clearCurrent?.();}catch(_e){}
    if(navigate)try{root.showScreen?.('home',{skipUnsavedPlanGuard:true,replaceHistory:true});}catch(_e){}
  }
  async function bind(){
    const loader=root.FEQUEST_CLOUD_ACTIVATION_INSTANCE_V342,api=root.FEQUEST_BILLING_API_V1,config=root.FEQUEST_BILLING_CONFIG_V1;
    if(!loader||!api||!config)return;
    await loader.start();
    const auth=loader.getAuthBoundary?.();if(!auth)return;
    clearTemporaryAccess(false);
    const dialog=root.document.getElementById('billingAccessDialogV1');
    const denied=error=>{
      clearTemporaryAccess(true);
      const copy=root.document.getElementById('billingAccessMessageV1');
      if(copy)copy.textContent=error.code==='authentication_required'?'この問題・教材を利用するには、購入したアカウントでログインしてください。':'この問題・教材は全範囲の利用プランに含まれます。利用プランとログイン中のアカウントをご確認ください。';
      if(dialog&&!dialog.open)dialog.showModal();
    };
    root.document.getElementById('billingAccessCloseV1')?.addEventListener('click',()=>dialog?.close());
    const client=api.createClient({authBoundary:auth,config,onIdentityChange:()=>{dialog?.close();clearTemporaryAccess(true);setTimeout(refresh,0);},onAccessChange:()=>clearTemporaryAccess(true),onAccessDenied:denied});
    root.FEQUEST_BILLING_V1=client;
    const summary=root.document.getElementById('billingPlanSummaryV1');
    let expiryTimer;
    client.subscribe(s=>{
      clearTimeout(expiryTimer);
      const expiry=s.status?.entitlement;
      if(expiry?.active&&Number.isSafeInteger(expiry.expiresAt))expiryTimer=setTimeout(()=>{clearTemporaryAccess(true);refresh();},Math.max(0,Math.min(2147483647,expiry.expiresAt*1000-Date.now()+100)));
      if(!summary)return;const e=s.status?.entitlement;
      summary.textContent=e?.active?(e.kind==='owner'?'個人学習用の利用権があります。':'全範囲の利用権があります。'):s.status?.accessMode==='restricted'?'無料体験と利用プランを確認できます。':'現在は無料公開中です。';
    });
    const refresh=()=>client.refresh().catch(error=>{if(!['request_superseded','account_changed'].includes(error.code))clearTemporaryAccess(false);});
    auth.subscribe(()=>setTimeout(refresh,0));
    root.document.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')refresh();});
    root.addEventListener('pagehide',event=>{if(!event.persisted)client.dispose();});
    root.addEventListener('pageshow',event=>{if(event.persisted){clearTemporaryAccess(false);auth.getAccessToken().then(refresh).catch(()=>{});}});
    refresh();
    return client;
  }
  root.FEQUEST_CLEAR_TEMPORARY_ACCESS_V1=clearTemporaryAccess;
  root.FEQUEST_BILLING_READY_V1=bind();
  root.FEQUEST_BILLING_READY_V1.catch(()=>{});
})(globalThis);
