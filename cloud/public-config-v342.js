// FE QUEST v342 public cloud configuration.
// Publishable/anon keys are browser-public by design; secret/service-role keys are forbidden.
// v341 production does not load this file. v342 uses this exact canonical HTTPS root for Magic Link callbacks.
(function(root){
  'use strict';
  root.FEQUEST_PUBLIC_CLOUD_CONFIG_V342=Object.freeze({
    version:1,
    enabled:true,
    provider:'supabase',
    url:'https://gkvgxnkoypypikxtyeoz.supabase.co',
    publishableKey:'sb_publishable_kRxdzyfjBDHEd9xMamQpYg_C8reUast',
    redirectTo:'https://taiwanwan64.github.io/fe-quest/'
  });
})(typeof globalThis!=='undefined'?globalThis:this);
