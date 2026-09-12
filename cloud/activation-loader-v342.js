// FE QUEST v342 cloud activation loader.
// Production intent: one same-origin entrypoint after the core application script.
// The learner app stays local-first: disabled config or any cloud asset/runtime failure is fail-open.
(function(root){
  'use strict';

  const ACTIVATION_SPEC=Object.freeze({
    version:'v342',
    configPath:'./cloud/public-config-v342.js',
    stylePath:'./cloud/sync-ui-v342.css',
    sdkPath:'./vendor/supabase/supabase-2.112.3.js',
    modulePaths:Object.freeze([
      './cloud/sync-contract-v342.js',
      './cloud/sync-state-v342.js',
      './cloud/sync-engine-v342.js',
      './cloud/supabase/transport-v342.js',
      './cloud/supabase/auth-boundary-v342.js',
      './cloud/production-adapter-v342.js',
      './cloud/reconciliation-v342.js',
      './cloud/local-reconciliation-adapter-v342.js',
      './cloud/sync-controller-v342.js',
      './cloud/sync-ui-v342.js',
      './cloud/runtime-bootstrap-v342.js'
    ]),
    policy:'same-origin-pinned-sdk-fail-open-local-first'
  });

  function localAssetPath(value){
    const path=String(value||'');
    if(!/^\.\/[A-Za-z0-9_./-]+$/.test(path)||path.includes('..'))throw new TypeError('cloud activation asset must be a fixed same-origin relative path');
    return path;
  }
  function assetId(kind,path){return `fequest-v342-${kind}-${path.replace(/[^a-z0-9]+/gi,'-')}`}

  function installConnectivityNoticeRecovery(){
    const d=root.document;
    if(!d||typeof root.addEventListener!=='function')return false;
    if(root.FEQUEST_V342_CONNECTIVITY_NOTICE_RECOVERY_INSTALLED)return true;
    const clearStaleOfflineNotice=()=>{
      try{
        if(root.navigator?.onLine!==true)return false;
        const notice=d.getElementById?.('appNotice');
        if(!notice||!notice.classList?.contains('offline'))return false;
        notice.className='app-notice';
        return true;
      }catch(_e){return false}
    };
    root.addEventListener('online',clearStaleOfflineNotice);
    root.addEventListener('pageshow',clearStaleOfflineNotice);
    root.FEQUEST_V342_CONNECTIVITY_NOTICE_RECOVERY_INSTALLED=true;
    clearStaleOfflineNotice();
    return true;
  }

  function defaultLoadScript(path,doc){
    const p=localAssetPath(path),d=doc||root.document;
    if(!d||typeof d.createElement!=='function')return Promise.reject(new Error('document unavailable'));
    const id=assetId('script',p),existing=d.getElementById?.(id);
    if(existing){
      if(existing.dataset?.loaded==='true')return Promise.resolve({ok:true,path:p,reused:true});
      return new Promise((resolve,reject)=>{existing.addEventListener('load',()=>resolve({ok:true,path:p,reused:true}),{once:true});existing.addEventListener('error',()=>reject(new Error(`failed to load ${p}`)),{once:true})});
    }
    return new Promise((resolve,reject)=>{
      const el=d.createElement('script');el.id=id;el.src=p;el.async=false;el.defer=false;
      el.addEventListener('load',()=>{try{el.dataset.loaded='true'}catch(_e){}resolve({ok:true,path:p,reused:false})},{once:true});
      el.addEventListener('error',()=>reject(new Error(`failed to load ${p}`)),{once:true});
      (d.head||d.body||d.documentElement).appendChild(el);
    });
  }

  function defaultLoadStyle(path,doc){
    const p=localAssetPath(path),d=doc||root.document;
    if(!d||typeof d.createElement!=='function')return Promise.reject(new Error('document unavailable'));
    const id=assetId('style',p),existing=d.getElementById?.(id);
    if(existing)return Promise.resolve({ok:true,path:p,reused:true});
    return new Promise((resolve,reject)=>{
      const el=d.createElement('link');el.id=id;el.rel='stylesheet';el.href=p;
      el.addEventListener('load',()=>resolve({ok:true,path:p,reused:false}),{once:true});
      el.addEventListener('error',()=>reject(new Error(`failed to load ${p}`)),{once:true});
      (d.head||d.documentElement).appendChild(el);
    });
  }

  function createActivationLoader(options={}){
    const loadScript=typeof options.loadScript==='function'?options.loadScript:(path=>defaultLoadScript(path,options.document));
    const loadStyle=typeof options.loadStyle==='function'?options.loadStyle:(path=>defaultLoadStyle(path,options.document));
    const warn=typeof options.warn==='function'?options.warn:((...args)=>{try{console.warn(...args)}catch(_e){}});
    let runtime=null,startPromise=null,stopped=false;

    function currentConfig(){return options.config??root.FEQUEST_PUBLIC_CLOUD_CONFIG_V342??null}

    async function ensureConfig(){
      const present=currentConfig();
      if(present)return {ok:true,config:present,loaded:false};
      try{await loadScript(ACTIVATION_SPEC.configPath)}catch(error){return {ok:false,status:'config-load-failed',error}}
      const config=currentConfig();
      if(!config)return {ok:false,status:'config-missing'};
      return {ok:true,config,loaded:true};
    }

    async function startInner(){
      if(stopped)return {ok:false,status:'stopped'};
      const configResult=await ensureConfig();
      if(!configResult.ok)return configResult;
      const config=configResult.config;
      if(!config||config.enabled!==true)return {ok:true,status:'disabled',configLoaded:configResult.loaded};

      try{await loadStyle(ACTIVATION_SPEC.stylePath)}catch(error){warn('FE QUEST cloud style failed; local study continues',error);return {ok:false,status:'asset-load-failed',asset:ACTIVATION_SPEC.stylePath,error}}
      const scripts=[ACTIVATION_SPEC.sdkPath,...ACTIVATION_SPEC.modulePaths];
      for(const path of scripts){
        try{await loadScript(path)}catch(error){warn(`FE QUEST cloud asset failed: ${path}; local study continues`,error);return {ok:false,status:'asset-load-failed',asset:path,error}}
      }

      const factory=typeof options.runtimeFactory==='function'?options.runtimeFactory:root.FEQUEST_CLOUD_RUNTIME_V342?.createCloudRuntime;
      if(typeof factory!=='function')return {ok:false,status:'runtime-missing'};
      let candidate;
      try{candidate=factory(options.runtimeOptions?{...options.runtimeOptions,config}:{config})}catch(error){warn('FE QUEST cloud runtime assembly failed; local study continues',error);return {ok:false,status:'runtime-assembly-failed',error}}
      if(!candidate||candidate.ok!==true||typeof candidate.start!=='function')return {ok:false,status:candidate?.status||'runtime-not-ready',error:candidate?.error};
      runtime=candidate;
      let result;
      try{result=await runtime.start()}catch(error){warn('FE QUEST cloud runtime start failed; local study continues',error);return {ok:false,status:'runtime-start-failed',error}}
      if(!result||result.ok!==true)return {ok:false,status:result?.status||'runtime-start-failed',result};
      return {ok:true,status:'started',runtimeStatus:result.status||'started'};
    }

    function start(){
      if(startPromise)return startPromise;
      startPromise=Promise.resolve().then(startInner);
      return startPromise;
    }
    function stop(){
      stopped=true;
      try{runtime&&runtime.stop&&runtime.stop()}catch(_e){}
      return true;
    }
    function snapshot(){return Object.freeze({started:Boolean(runtime),stopped,config:Boolean(currentConfig()),policy:ACTIVATION_SPEC.policy})}
    return Object.freeze({start,stop,snapshot});
  }

  function autoStart(){
    installConnectivityNoticeRecovery();
    const loader=createActivationLoader();
    root.FEQUEST_CLOUD_ACTIVATION_INSTANCE_V342=loader;
    loader.start().catch(error=>{try{console.warn('FE QUEST cloud activation failed; local study continues',error)}catch(_e){}});
    return loader;
  }

  const api=Object.freeze({ACTIVATION_SPEC,localAssetPath,installConnectivityNoticeRecovery,createActivationLoader,autoStart});
  root.FEQUEST_CLOUD_ACTIVATION_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof document!=='undefined')Promise.resolve().then(()=>autoStart());
})(typeof globalThis!=='undefined'?globalThis:this);
