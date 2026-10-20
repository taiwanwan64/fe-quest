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
    const client=api.createClient({authBoundary:auth,config,onIdentityChange:()=>clearTemporaryAccess(true)});
    root.FEQUEST_BILLING_V1=client;
    const summary=root.document.getElementById('billingPlanSummaryV1');
    client.subscribe(s=>{
      if(!summary)return;const e=s.status?.entitlement;
      summary.textContent=e?.active?(e.kind==='owner'?'個人学習用の利用権があります。':'全範囲の利用権があります。'):s.status?.accessMode==='restricted'?'無料体験と利用プランを確認できます。':'現在は無料公開中です。';
    });
    const refresh=()=>client.refresh().catch(()=>{});
    auth.subscribe(()=>setTimeout(refresh,0));
    root.document.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')refresh();});
    root.addEventListener('pagehide',()=>client.dispose(),{once:true});
    refresh();
  }
  root.FEQUEST_CLEAR_TEMPORARY_ACCESS_V1=clearTemporaryAccess;
  bind().catch(()=>{});
})(globalThis);
