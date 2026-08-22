// FE QUEST v342 cloud runtime bootstrap.
// The bootstrap is fail-open for local study: missing/invalid cloud configuration never enters the
// existing learner persistence path. Production activation requires an explicit enabled public config.
(function(root){
  'use strict';

  const REQUIRED_GLOBALS=Object.freeze([
    'FEQUEST_SYNC_CONTRACT_V342','FEQUEST_SYNC_STATE_V342','FEQUEST_SYNC_ENGINE_V342',
    'FEQUEST_SUPABASE_TRANSPORT_V342','FEQUEST_SUPABASE_AUTH_V342','FEQUEST_PRODUCTION_SYNC_ADAPTER_V342',
    'FEQUEST_SYNC_RECONCILIATION_V342','FEQUEST_LOCAL_RECONCILIATION_ADAPTER_V342',
    'FEQUEST_SYNC_CONTROLLER_V342','FEQUEST_SYNC_UI_V342'
  ]);

  function forbiddenKey(value){return typeof value==='string'&&(/service[_-]?role/i.test(value)||new RegExp('sb'+'_secret_','i').test(value))}
  function validateEnabledConfig(input){
    const c=input&&typeof input==='object'?input:{};
    if(c.enabled!==true)return Object.freeze({enabled:false});
    if(c.provider!=='supabase')throw new TypeError('v342 cloud provider must be supabase');
    if(typeof c.url!=='string'||!/^https:\/\//i.test(c.url))throw new TypeError('Supabase https project URL required');
    const key=c.publishableKey??c.anonKey;
    if(typeof key!=='string'||key.length<20)throw new TypeError('Supabase public publishable/anon key required');
    if(forbiddenKey(key))throw new TypeError('secret/service-role key is forbidden in the PWA');
    if(typeof c.redirectTo!=='string'||!/^https:\/\//i.test(c.redirectTo))throw new TypeError('https auth redirect required');
    return Object.freeze({enabled:true,provider:'supabase',url:c.url.replace(/\/+$/,''),publishableKey:key,redirectTo:c.redirectTo});
  }

  function hasLearningData(payload){
    const p=payload&&typeof payload==='object'?payload:{};
    if(Number(p.xp)>0)return true;
    if(Array.isArray(p.sessions)&&p.sessions.length)return true;
    if(Object.values(p.lessonProgress||{}).some(v=>Number(v)>0))return true;
    if(Object.values(p.bProgress||{}).some(v=>Number(v)>0))return true;
    if(Object.values(p.qStats||{}).some(v=>Number(v&&v.attempts)>0))return true;
    if(Array.isArray(p.mockHistory)&&p.mockHistory.length)return true;
    if(Array.isArray(p.bMockHistory)&&p.bMockHistory.length)return true;
    if(Array.isArray(p.bFinalHistory)&&p.bFinalHistory.length)return true;
    return false;
  }

  function moduleSet(){
    const missing=REQUIRED_GLOBALS.filter(name=>!root[name]);
    if(missing.length)throw new Error(`FE QUEST cloud modules missing: ${missing.join(', ')}`);
    return {
      contract:root.FEQUEST_SYNC_CONTRACT_V342,stateApi:root.FEQUEST_SYNC_STATE_V342,engineApi:root.FEQUEST_SYNC_ENGINE_V342,
      transportApi:root.FEQUEST_SUPABASE_TRANSPORT_V342,authApi:root.FEQUEST_SUPABASE_AUTH_V342,productionApi:root.FEQUEST_PRODUCTION_SYNC_ADAPTER_V342,
      reconciliationApi:root.FEQUEST_SYNC_RECONCILIATION_V342,localApi:root.FEQUEST_LOCAL_RECONCILIATION_ADAPTER_V342,
      controllerApi:root.FEQUEST_SYNC_CONTROLLER_V342,uiApi:root.FEQUEST_SYNC_UI_V342
    };
  }

  function createCloudRuntime(options={}){
    const rawConfig=options.config??root.FEQUEST_PUBLIC_CLOUD_CONFIG_V342??{enabled:false};
    let config;
    try{config=validateEnabledConfig(rawConfig)}catch(error){return Object.freeze({ok:false,status:'invalid-config',error,start:async()=>({ok:false,status:'invalid-config',error}),stop:()=>true})}
    if(!config.enabled)return Object.freeze({ok:true,status:'disabled',start:async()=>({ok:true,status:'disabled'}),stop:()=>true});

    let modules;
    try{modules=moduleSet()}catch(error){return Object.freeze({ok:false,status:'modules-missing',error,start:async()=>({ok:false,status:'modules-missing',error}),stop:()=>true})}
    const createClient=options.createClient??root.supabase?.createClient;
    if(typeof createClient!=='function')return Object.freeze({ok:false,status:'sdk-missing',start:async()=>({ok:false,status:'sdk-missing'}),stop:()=>true});
    const storage=options.storage??root.localStorage;
    if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')return Object.freeze({ok:false,status:'storage-unavailable',start:async()=>({ok:false,status:'storage-unavailable'}),stop:()=>true});

    let controller=null,ui=null,bridge=null,authBoundary=null,started=false,stopped=false;
    const warn=typeof options.warn==='function'?options.warn:((...args)=>{try{console.warn(...args)}catch(_){}});

    const client=modules.authApi.createConfiguredClient({createClient,url:config.url,publishableKey:config.publishableKey,storage:options.authStorage});
    authBoundary=modules.authApi.createAuthBoundary({
      client,redirectTo:config.redirectTo,
      onSignedOut:()=>{try{controller&&controller.disableSync()}catch(error){warn('Cloud sign-out metadata cleanup failed',error)}},
      onAuthError:(error,phase)=>warn(`Cloud auth ${phase||'error'}`,error)
    });
    const transport=modules.transportApi.createSupabaseTransport({
      url:config.url,anonKey:config.publishableKey,getAccessToken:()=>authBoundary.getAccessToken(),fetchImpl:options.fetchImpl
    });
    bridge=modules.productionApi.createProductionBridge({
      engineApi:modules.engineApi,contract:modules.contract,stateApi:modules.stateApi,storage,transport,
      getAuthenticatedUserId:()=>authBoundary.getAuthenticatedUserId(),warn
    });
    const localCallbacks=modules.localApi.createLocalReconciliationCallbacks({warn});
    const resolver=modules.reconciliationApi.createConflictResolver({
      stateApi:modules.stateApi,storage,engine:bridge.engine,
      createRecoveryPoint:localCallbacks.createRecoveryPoint,
      replaceLocalProfile:localCallbacks.replaceLocalProfile,
      promoteLocalRevision:localCallbacks.promoteLocalRevision
    });
    controller=modules.controllerApi.createSyncController({
      authBoundary,transport,engine:bridge.engine,resolver,stateApi:modules.stateApi,storage,
      getLocalDescriptor:()=>bridge.getCommittedProfile(),hasLocalLearningData:payload=>hasLearningData(payload)
    });
    ui=modules.uiApi.createSyncSettingsUI({
      authBoundary,controller,document:options.document??root.document,confirm:options.confirm,onMessage:options.onMessage
    });

    async function start(){
      if(stopped)return {ok:false,status:'stopped'};
      if(started)return {ok:true,status:'already-started',controller,authBoundary,engine:bridge.engine};
      // Auth/provider failure cannot prevent local app startup. The bridge is safe to install while
      // sync is disabled because it only queues after a successful local commit and never fetches.
      let authSnapshot;
      try{authSnapshot=await authBoundary.initialize()}catch(error){warn('Cloud auth initialization failed',error);authSnapshot=authBoundary.snapshot()}
      bridge.install();ui.start();started=true;
      return {ok:true,status:'started',auth:authSnapshot,controller,authBoundary,engine:bridge.engine};
    }
    function stop(){
      if(stopped)return true;stopped=true;
      try{ui&&ui.dispose()}catch(_e){}try{authBoundary&&authBoundary.dispose()}catch(_e){}try{bridge&&bridge.uninstall()}catch(_e){}
      return true;
    }
    function snapshot(){return Object.freeze({configured:true,started,auth:authBoundary.snapshot(),sync:controller.state()})}

    return Object.freeze({ok:true,status:'ready',config,start,stop,snapshot,controller,authBoundary,engine:bridge.engine});
  }

  const api=Object.freeze({REQUIRED_GLOBALS,validateEnabledConfig,hasLearningData,createCloudRuntime});
  root.FEQUEST_CLOUD_RUNTIME_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
