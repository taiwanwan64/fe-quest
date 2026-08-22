// FE QUEST v342 cloud sync orchestration controller.
// Local study remains independent. This controller only coordinates explicit enable/sync actions
// across the already isolated auth, transport, outbox engine, and reconciliation contracts.
(function(root){
  'use strict';

  function deepEqual(a,b){
    if(a===b)return true;
    if(a==null||b==null||typeof a!==typeof b)return false;
    if(Array.isArray(a)||Array.isArray(b)){
      if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return false;
      for(let i=0;i<a.length;i++)if(!deepEqual(a[i],b[i]))return false;
      return true;
    }
    if(typeof a==='object'){
      const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
      if(ak.length!==bk.length)return false;
      for(let i=0;i<ak.length;i++)if(ak[i]!==bk[i]||!deepEqual(a[ak[i]],b[bk[i]]))return false;
      return true;
    }
    return false;
  }

  function createSyncController(options){
    const o=options||{};
    const auth=o.authBoundary;
    const transport=o.transport;
    const engine=o.engine;
    const resolver=o.resolver;
    const stateApi=o.stateApi;
    const storage=o.storage;
    const getLocalDescriptor=o.getLocalDescriptor;
    const hasLocalLearningData=o.hasLocalLearningData;
    if(!auth||typeof auth.getAuthenticatedUserId!=='function')throw new TypeError('auth boundary required');
    if(!transport||typeof transport.readProfile!=='function')throw new TypeError('sync transport read required');
    if(!engine||typeof engine.enableForCurrentUser!=='function'||typeof engine.flush!=='function')throw new TypeError('sync engine required');
    if(!resolver||typeof resolver.keepLocal!=='function'||typeof resolver.useRemote!=='function')throw new TypeError('conflict resolver required');
    if(!stateApi||typeof stateApi.recordConflict!=='function'||typeof stateApi.rebasePendingToRemote!=='function')throw new TypeError('sync state api required');
    if(typeof getLocalDescriptor!=='function')throw new TypeError('local descriptor callback required');
    if(typeof hasLocalLearningData!=='function')throw new TypeError('local learning history callback required');

    function userId(){return auth.getAuthenticatedUserId()||null}
    function state(){return engine.status()}
    function accountCheck(){
      const uid=userId(),s=state();
      if(!uid)return {ok:false,status:'signed-out',state:s};
      if(s.userId&&s.userId!==uid)return {ok:false,status:'account-mismatch',state:s};
      return {ok:true,userId:uid,state:s};
    }

    async function readRemote(uid){
      let result;
      try{result=await transport.readProfile(uid)}catch(error){return {ok:false,error:{kind:'transport',retryable:true,message:String(error&&error.message||error)}}}
      return result||{ok:false,error:{kind:'provider',retryable:true,message:'Empty transport response'}};
    }

    function firstLinkConflict(remote){
      const next=stateApi.recordConflict(storage,{
        sync_status:'first-link-conflict',
        remote_revision:remote.revision,
        remote_checksum:remote.checksum
      });
      return {ok:false,status:'first-link-conflict',conflict:true,state:next,remote};
    }

    async function enableSync(){
      const uid=userId();
      if(!uid)return {ok:false,status:'signed-out',state:state()};
      let s=state();
      if(s.userId&&s.userId!==uid)return {ok:false,status:'account-mismatch',state:s};
      if(!s.userId){
        const enabled=engine.enableForCurrentUser();
        if(!enabled.ok)return enabled;
        s=enabled.state;
      }

      const remoteResult=await readRemote(uid);
      if(!remoteResult.ok){
        return {ok:false,status:remoteResult.error?.retryable?'pending-offline':'remote-read-failed',retryable:Boolean(remoteResult.error?.retryable),error:remoteResult.error,state:state()};
      }
      const remote=remoteResult.remote||null;
      s=state();
      if(s.conflict){
        if(remote)stateApi.recordConflict(storage,{sync_status:s.conflict.status||'remote-changed-conflict',remote_revision:remote.revision,remote_checksum:remote.checksum});
        return {ok:false,status:'conflict-pending',conflict:true,state:state(),remote};
      }

      const local=getLocalDescriptor();
      const firstNegotiation=s.lastSuccessAt==null&&s.lastSyncedRemoteRevision==null;
      if(firstNegotiation){
        const decision=root.FEQUEST_SYNC_RECONCILIATION_V342?.decideInitialLink
          ?root.FEQUEST_SYNC_RECONCILIATION_V342.decideInitialLink({remoteExists:Boolean(remote),samePayload:Boolean(remote&&deepEqual(local.payload,remote.payload)),localHasLearningData:Boolean(hasLocalLearningData(local.payload))})
          :null;
        if(!decision)throw new Error('initial-link decision contract unavailable');
        if(decision.status==='first-link-conflict')return firstLinkConflict(remote);
        if(decision.status==='adopt-remote'){
          const adopted=await resolver.useRemote(remote);
          if(!adopted.ok)return {ok:false,status:adopted.status||'remote-adopt-failed',state:state(),detail:adopted,remote};
          const flushed=await engine.flush();
          return {...flushed,firstLink:'remote-adopted',remote};
        }
        if(decision.status==='already-synced'){
          const rebased=stateApi.rebasePendingToRemote(storage,{revision:remote.revision,checksum:remote.checksum});
          if(!rebased.ok)return {ok:false,status:rebased.reason||'rebase-failed',state:rebased.state,remote};
          const flushed=await engine.flush();
          return {...flushed,firstLink:'already-synced',remote};
        }
        // No remote: guarded upload-new path.
        const flushed=await engine.flush();
        return {...flushed,firstLink:'local-uploaded',remote:null};
      }

      const flushed=await engine.flush();
      return {...flushed,remote};
    }

    async function syncNow(){
      const check=accountCheck();
      if(!check.ok)return check;
      if(!check.state.userId)return enableSync();
      if(check.state.conflict)return {ok:false,status:'conflict-pending',conflict:true,state:check.state};
      return engine.flush();
    }

    async function getConflictRemote(){
      const check=accountCheck();
      if(!check.ok)return check;
      const result=await readRemote(check.userId);
      if(!result.ok)return {ok:false,status:'remote-read-failed',retryable:Boolean(result.error?.retryable),error:result.error,state:state()};
      return {ok:true,status:'remote-read',remote:result.remote||null,state:state()};
    }

    async function resolveConflict(choice){
      const check=accountCheck();
      if(!check.ok)return check;
      if(!check.state.conflict)return {ok:false,status:'no-conflict',state:check.state};
      const read=await readRemote(check.userId);
      if(!read.ok)return {ok:false,status:'remote-read-failed',retryable:Boolean(read.error?.retryable),error:read.error,state:state()};
      const remote=read.remote||null;
      let resolved;
      if(choice==='local')resolved=await resolver.keepLocal(remote);
      else if(choice==='remote'){
        if(!remote)return {ok:false,status:'remote-missing',state:state()};
        resolved=await resolver.useRemote(remote);
      }else return {ok:false,status:'invalid-choice',state:state()};
      if(!resolved.ok)return {ok:false,status:resolved.status||'resolve-failed',state:state(),detail:resolved,remote};
      const flushed=await engine.flush();
      return {...flushed,resolution:choice,remote};
    }

    function disableSync(){return engine.disable()}

    return Object.freeze({state,enableSync,syncNow,getConflictRemote,resolveConflict,disableSync});
  }

  const api=Object.freeze({deepEqual,createSyncController});
  root.FEQUEST_SYNC_CONTROLLER_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
