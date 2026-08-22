// FE QUEST v342 public cloud configuration.
// Publishable/anon keys are browser-public by design; secret/service-role keys are forbidden.
// Keep enabled=false until the Supabase project, redirect URL, SQL schema, and pinned browser SDK are deployed.
(function(root){
  'use strict';
  root.FEQUEST_PUBLIC_CLOUD_CONFIG_V342=Object.freeze({
    version:1,
    enabled:false,
    provider:'supabase',
    url:null,
    publishableKey:null,
    redirectTo:null
  });
})(typeof globalThis!=='undefined'?globalThis:this);
