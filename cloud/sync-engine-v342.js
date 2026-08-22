// FE QUEST v342 local-first sync engine.
// The engine never replaces saveProfile(). Call queueAfterLocalCommit() only after the
// existing atomic local save has succeeded. Network flush is a separate operation.
(function(root){
  'use strict';

  const SUCCESS=new Set(['uploaded-new','uploaded-update','already-synced']);
  const CONFLICT=new Set(['diverged-same-revision','remote-changed-conflict','remote-missing-conflict','remote-newer-or-equal']);

  function descriptor(input){
    const x=input||{};
    const revision=Number(x.revision);
    const schema=Number(x.profileSchemaVersion);
    if(!Number.isSafeInteger(revision)||revision<0)throw new TypeError('committed revision required');
    if(!Number.isSafeInteger(schema)||schema<=0)throw new TypeError('profile schema version required');
    if(typeof x.sha256!=='string'||!/^[0-9a-f]{64}$/.test(x.sha256))throw new TypeError('committed sha256 required');
    if(!x.payload||typeof x.payload!=='object')throw new TypeError('committed payload required');
    return {
      revision,
      profileSchemaVersion:schema,
      sha256:x.sha256,
      updatedAt:x.updatedAt||null,
      writerId:x.writerId||null,
      payload:x.payload
    };
  }

  function createSyncEngine(options){
    const o=options||{};
    const contract=o.contract;
    const stateApi=o.stateApi;
    const storage=o.storage;
    const transport=o.transport;
    const getCommittedProfile=o.getCommittedProfile;
    const getAuthenticatedUserId=o.getAuthenticatedUserId;
    if(!contract||typeof contract.queueCommittedProfile!=='function')throw new TypeError('sync contract required');
    if(!stateApi||typeof stateApi.load!=='function'||typeof stateApi.queue!=='function')throw new TypeError('sync state api required');
    if(!transport||typeof transport.commitProfile!=='function')throw new TypeError('sync transport required');
    if(typeof getCommittedProfile!=='function')throw new TypeError('getCommittedProfile callback required');
    if(typeof getAuthenticatedUserId!=='function')throw new TypeError('getAuthenticatedUserId callback required');

    let inFlight=null;

    function currentUser(){
      const value=getAuthenticatedUserId();
      return typeof value==='string'&&value?value:null;
    }

    function status(){return stateApi.load(storage)}

    function queueForBoundUser(committed){
      const state=status();
      if(!state.userId)return {ok:true,status:'disabled',state};
      const userId=currentUser();
      if(!userId)return {ok:true,status:'signed-out',state};
      if(userId!==state.userId)return {ok:false,status:'account-mismatch',state};
      const d=descriptor(committed);
      const queued=stateApi.queue(storage,contract,{revision:d.revision,sha256:d.sha256,updatedAt:d.updatedAt,writerId:d.writerId},userId);
      return queued.ok?{ok:true,status:'queued',state:queued.state}:{ok:false,status:queued.reason||'queue-failed',state:queued.state};
    }

    function queueAfterLocalCommit(committed){
      // Intentionally synchronous and network-free. This is the only safe hook for saveProfile().
      try{return queueForBoundUser(committed)}catch(error){return {ok:false,status:'queue-error',error:String(error&&error.message||error),state:status()}}
    }

    function enableForCurrentUser(){
      const userId=currentUser();
      if(!userId)return {ok:false,status:'signed-out',state:status()};
      const bound=stateApi.bindUser(storage,userId);
      if(!bound.ok)return {ok:false,status:bound.reason||'account-mismatch',state:bound.state};
      let committed;
      try{committed=descriptor(getCommittedProfile())}catch(error){return {ok:false,status:'local-descriptor-error',error:String(error&&error.message||error),state:status()}}
      const queued=stateApi.queue(storage,contract,{revision:committed.revision,sha256:committed.sha256,updatedAt:committed.updatedAt,writerId:committed.writerId},userId);
      return queued.ok?{ok:true,status:'enabled-pending',state:queued.state}:{ok:false,status:queued.reason||'queue-failed',state:queued.state};
    }

    function disable(){
      const next=stateApi.clearAccountBinding(storage);
      return {ok:true,status:'disabled',state:next};
    }

    function ensurePendingMatchesCurrent(state,userId){
      const current=descriptor(getCommittedProfile());
      const pending=state.pending;
      if(!pending||pending.profileRevision!==current.revision||pending.payloadSha256!==current.sha256){
        const q=stateApi.queue(storage,contract,{revision:current.revision,sha256:current.sha256,updatedAt:current.updatedAt,writerId:current.writerId},userId);
        if(!q.ok)throw new Error(q.reason||'failed to refresh outbox');
        return {state:q.state,current};
      }
      return {state,current};
    }

    async function doFlush(){
      let state=status();
      if(!state.userId)return {ok:true,status:'disabled',state};
      const userId=currentUser();
      if(!userId)return {ok:false,status:'signed-out',state};
      if(userId!==state.userId)return {ok:false,status:'account-mismatch',state};
      if(!state.pending)return {ok:true,status:'nothing-pending',state};

      stateApi.recordAttempt(storage);
      let current;
      try{
        const ensured=ensurePendingMatchesCurrent(status(),userId);
        state=ensured.state;current=ensured.current;
      }catch(error){
        const next=stateApi.recordFailure(storage,{kind:'local',retryable:true,message:String(error&&error.message||error)});
        return {ok:false,status:'local-descriptor-error',state:next};
      }

      let result;
      try{
        result=await transport.commitProfile({
          userId,
          baseRemoteRevision:state.pending.baseRemoteRevision,
          profileSchemaVersion:current.profileSchemaVersion,
          profileRevision:current.revision,
          clientUpdatedAt:current.updatedAt,
          writerId:current.writerId,
          payload:current.payload,
          payloadSha256:current.sha256
        });
      }catch(error){
        result={ok:false,error:{kind:'transport',retryable:true,message:String(error&&error.message||error)}};
      }

      if(!result||!result.ok){
        const error=(result&&result.error)||{kind:'transport',retryable:true,message:'Unknown transport error'};
        const next=stateApi.recordFailure(storage,error);
        return {ok:false,status:error.kind||'transport-error',retryable:Boolean(error.retryable),state:next};
      }

      const response=result.response||{};
      if(SUCCESS.has(response.sync_status)){
        const next=stateApi.acknowledge(storage,contract,response);
        return {ok:true,status:response.sync_status,state:next,response};
      }
      if(CONFLICT.has(response.sync_status)){
        const next=stateApi.recordConflict(storage,response);
        return {ok:false,status:response.sync_status,conflict:true,state:next,response};
      }
      const next=stateApi.recordFailure(storage,{kind:'provider',retryable:true,message:'Unknown sync status'});
      return {ok:false,status:'unknown-sync-status',retryable:true,state:next,response};
    }

    function flush(){
      if(inFlight)return inFlight;
      // Start the explicit network operation immediately. The caller already chose to flush;
      // this also closes the tiny scheduling window where a second flush could observe no request yet.
      inFlight=doFlush().finally(()=>{inFlight=null});
      return inFlight;
    }

    return Object.freeze({status,enableForCurrentUser,disable,queueAfterLocalCommit,flush});
  }

  const api=Object.freeze({createSyncEngine});
  root.FEQUEST_SYNC_ENGINE_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
