(function(root){
  'use strict';
  const script=root.document?.currentScript?.src;
  root.FEQUEST_BILLING_CONFIG_V1=Object.freeze({
    version:'billing-ui-v1-20261020',
    supabaseURL:'https://gkvgxnkoypypikxtyeoz.supabase.co',
    publishableKey:"sb_publishable_kRxdzyfjBDHEd9xMamQpYg_C8reUast",
    appBaseURL:new URL('../',script||new URL('./assets/billing-config-v1.js',root.location.href)).href,
    // The server's purchaseAvailable response and Checkout handler control sales.
    // Keeping the purchase flow ready avoids another static upload at launch.
    salesEnabled:true,
    accessEnforcementEnabled:false
  });
})(typeof globalThis!=='undefined'?globalThis:this);
