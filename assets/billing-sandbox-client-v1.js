// The normal client retains Auth races, retries and redirect validation.
// This adapter can reach only the two dedicated sandbox endpoints.
(function(root){
  'use strict';
  const base=root.FEQUEST_BILLING_API_V1;
  function createClient({config,fetcher=root.fetch.bind(root),storage=root.sessionStorage,...options}){
    const routes=new Map([
      ['/functions/v1/fequest-access-status-v1','/functions/v1/fequest-access-status-sandbox-v1'],
      ['/functions/v1/fequest-checkout-v1','/functions/v1/fequest-checkout-sandbox-v1']
    ]);
    const scopedStorage={getItem:key=>storage?.getItem('fequest_sandbox_v1:'+key),setItem:(key,value)=>storage?.setItem('fequest_sandbox_v1:'+key,value),removeItem:key=>storage?.removeItem('fequest_sandbox_v1:'+key)};
    const client=base.createClient({...options,config:{...config,salesEnabled:true},storage:scopedStorage,fetcher:async(url,init)=>{
      const target=new URL(url),route=routes.get(target.pathname);
      if(target.origin!=='https://gkvgxnkoypypikxtyeoz.supabase.co'||!route)throw new base.ClientError('sandbox_response_invalid');
      const status=target.pathname.endsWith('fequest-access-status-v1');target.pathname=route;
      const response=await fetcher(target.href,init);
      if(status&&response.ok){
        const value=await response.clone().json();
        if(value?.sandbox!==true)throw new base.ClientError('sandbox_response_invalid');
      }
      return response;
    }});
    return Object.freeze({snapshot:client.snapshot,subscribe:client.subscribe,refresh:client.refresh,checkout:client.checkout,dispose:client.dispose});
  }
  const api=Object.freeze({createClient,parseReturnURL:base.parseReturnURL});
  root.FEQUEST_BILLING_SANDBOX_API_V1=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
