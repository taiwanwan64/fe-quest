// FE QUEST v342 explicit cloud conflict reconciliation.
// Conflict resolution is deliberately a learner/user decision. This module never silently
// picks a timestamp winner and never performs a network request by itself.
(function(root){
  'use strict';

  function validChecksum(value){return typeof value==='string'&&/^(?:fnv1a32:[0-9a-f]{8}|sha256:[0-9a-f]{64})$/.test(value)}
  function normalizeRemote(remote,{allowMissing=false}={}){
    if(remote==null){
      if(allowMissing)return null;
      throw new TypeError('remote profile required');
    }
    if(typeof remote!=='object')throw new TypeError('remote profile required');
    const revision=Number(remote.revision??remote.remote_revision);
    const checksum=remote.checksum??remote.remote_checksum??remote.sha256??remote.remote_sha256;
    const schema=Number(remote.profileSchemaVersion??remote.profile_schema_version??remote.payload?.profileSchemaVersion);
    const payload=remote.payload??remote.remote_payload;
    if(!Number.isSafeInteger(revision)||revision<0)throw new TypeError('valid remote revision required');
    if(!validChecksum(checksum))throw new TypeError('valid remote checksum required');
    if(!Number.isSafeInteger(schema)||schema<=0)throw new TypeError('valid remote profile schema required');
    if(!payload||typeof payload!=='object')throw new TypeError('remote profile payload required');
    return {revision,checksum,profileSchemaVersion:schema,payload,updatedAt:remote.updatedAt??remote.remote_client_updated_at??null,writerId:remote.writerId??remote.writer_id??null};
  }

  function decideInitialLink(input){
    const x=input||{};
    if(!x.remoteExists)return Object.freeze({status:'upload-local',requiresChoice:false});
    if(x.samePayload===true)return Object.freeze({status:'already-synced',requiresChoice:false});
    if(x.localHasLearningData===false)return Object.freeze({status:'adopt-remote',requiresChoice:false});
    return Object.freeze({status:'first-link-conflict',requiresChoice:true});
  }

  function createConflictResolver(options){
    const o=options||{};
    const stateApi=o.stateApi;
    const storage=o.storage;
    const engine=o.engine;
    const createRecoveryPoint=o.createRecoveryPoint;
    const replaceLocalProfile=o.replaceLocalProfile;
    if(!stateApi||typeof stateApi.rebasePendingToRemote!=='function')throw new TypeError('sync state rebase api required');
    if(!engine||typeof engine.queueAfterLocalCommit!=='function')throw new TypeError('sync engine required');
    if(typeof createRecoveryPoint!=='function')throw new TypeError('recovery callback required');
    if(typeof replaceLocalProfile!=='function')throw new TypeError('local replacement callback required');

    function status(){return stateApi.load(storage)}

    function keepLocal(remote){
      const before=status();
      if(!before.pending)return {ok:false,status:'nothing-pending',state:before};
      let r=null;
      try{r=normalizeRemote(remote,{allowMissing:true})}catch(error){return {ok:false,status:'invalid-remote',error,state:before}}
      const rebased=stateApi.rebasePendingToRemote(storage,r?{revision:r.revision,checksum:r.checksum}:{revision:null,checksum:null});
      if(!rebased.ok)return {ok:false,status:rebased.reason||'rebase-failed',state:rebased.state};
      return {ok:true,status:'local-selected-ready-to-flush',state:rebased.state};
    }

    async function useRemote(remote){
      let r;
      try{r=normalizeRemote(remote)}catch(error){return {ok:false,status:'invalid-remote',error,state:status()}}

      let recovered=false;
      try{recovered=await createRecoveryPoint({reason:'before-cloud-adopt',remoteRevision:r.revision})}catch(error){
        return {ok:false,status:'recovery-failed',error,state:status()};
      }
      if(recovered!==true)return {ok:false,status:'recovery-failed',state:status()};

      let committed;
      try{committed=await replaceLocalProfile(r.payload,{source:'cloud-conflict-resolution',remoteRevision:r.revision})}catch(error){
        return {ok:false,status:'local-replace-failed',error,state:status()};
      }
      if(!committed||typeof committed!=='object')return {ok:false,status:'local-replace-failed',state:status()};

      // Queue the newly committed local state before rebasing its ancestry. If the production
      // post-save bridge already queued it, this is an idempotent coalesce of the same commit.
      const queued=engine.queueAfterLocalCommit(committed);
      if(!queued||queued.ok!==true)return {ok:false,status:'local-adopted-outbox-error',queue:queued,state:status()};

      const rebased=stateApi.rebasePendingToRemote(storage,{revision:r.revision,checksum:r.checksum});
      if(!rebased.ok)return {ok:false,status:rebased.reason||'rebase-failed',state:rebased.state};
      return {ok:true,status:'remote-adopted-pending',state:rebased.state,remoteRevision:r.revision};
    }

    return Object.freeze({status,keepLocal,useRemote});
  }

  const api=Object.freeze({normalizeRemote,decideInitialLink,createConflictResolver});
  root.FEQUEST_SYNC_RECONCILIATION_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
