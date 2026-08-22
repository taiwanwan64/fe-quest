// FE QUEST v342 provider-neutral local-first sync contract.
// This module is intentionally NOT loaded by production v341 yet.
// It defines the deterministic decisions that the eventual transport adapter must obey.
(function(root){
  'use strict';

  const CONTRACT_VERSION=1;
  const STATUS=Object.freeze({
    LOCAL_ONLY:'local-only',
    PENDING_OFFLINE:'pending-offline',
    PENDING_PROVIDER:'pending-provider-error',
    UPLOAD_NEW:'uploaded-new',
    UPLOAD_UPDATE:'uploaded-update',
    ALREADY_SYNCED:'already-synced',
    DIVERGED:'diverged-same-revision',
    REMOTE_CHANGED:'remote-changed-conflict',
    REMOTE_MISSING:'remote-missing-conflict',
    REMOTE_NEWER:'remote-newer-or-equal'
  });

  function finiteRevision(value,name){
    const n=Number(value);
    if(!Number.isSafeInteger(n)||n<0)throw new TypeError(`${name||'revision'} must be a non-negative safe integer`);
    return n;
  }

  function optionalRevision(value,name){
    if(value==null)return null;
    return finiteRevision(value,name);
  }

  function validSha(value){return typeof value==='string'&&/^[0-9a-f]{64}$/.test(value)}

  function normalizeCommitted(input){
    if(!input||typeof input!=='object')throw new TypeError('committed profile metadata required');
    const revision=finiteRevision(input.revision,'local revision');
    if(!validSha(input.sha256))throw new TypeError('local sha256 must be lowercase hex');
    return {revision,sha256:input.sha256,updatedAt:input.updatedAt||null,writerId:input.writerId||null};
  }

  function normalizeRemote(remote){
    if(remote==null)return null;
    if(typeof remote!=='object')throw new TypeError('remote must be null or object');
    const revision=finiteRevision(remote.revision,'remote revision');
    if(!validSha(remote.sha256))throw new TypeError('remote sha256 must be lowercase hex');
    return {revision,sha256:remote.sha256,updatedAt:remote.updatedAt||null};
  }

  // Called only after the existing FE QUEST atomic local write has succeeded.
  // Coalescing deliberately keeps the same baseRemoteRevision while offline: if another
  // device advances the remote, CAS will detect it even when local revision grows higher.
  function queueCommittedProfile(syncMeta,committed){
    const c=normalizeCommitted(committed);
    const current=(syncMeta&&typeof syncMeta==='object')?syncMeta:{};
    const base=optionalRevision(current.lastSyncedRemoteRevision,'last synced remote revision');
    return {
      contractVersion:CONTRACT_VERSION,
      userId:current.userId||null,
      lastSyncedRemoteRevision:base,
      lastSyncedSha256:validSha(current.lastSyncedSha256)?current.lastSyncedSha256:null,
      pending:{
        baseRemoteRevision:base,
        profileRevision:c.revision,
        payloadSha256:c.sha256,
        clientUpdatedAt:c.updatedAt,
        writerId:c.writerId,
        queuedAt:new Date().toISOString()
      }
    };
  }

  function decideCommit(input){
    const x=input||{};
    const local=normalizeCommitted({
      revision:x.localRevision,
      sha256:x.localSha256,
      updatedAt:x.clientUpdatedAt,
      writerId:x.writerId
    });
    const base=optionalRevision(x.baseRemoteRevision,'base remote revision');
    const remote=normalizeRemote(x.remote);
    const common={blocksLocalSave:false,localRevision:local.revision,baseRemoteRevision:base};

    if(!x.authenticated)return {...common,status:STATUS.LOCAL_ONLY,action:'none',keepPending:false};
    if(!x.online)return {...common,status:STATUS.PENDING_OFFLINE,action:'retry-later',keepPending:true};
    if(x.providerAvailable===false)return {...common,status:STATUS.PENDING_PROVIDER,action:'retry-later',keepPending:true};

    if(remote==null){
      if(base!=null)return {...common,status:STATUS.REMOTE_MISSING,action:'conflict',keepPending:true};
      return {...common,status:STATUS.UPLOAD_NEW,action:'upload',keepPending:false,nextRemoteRevision:local.revision};
    }

    // Lost-response retries are safe even when the caller still carries an older base.
    if(local.revision===remote.revision&&local.sha256===remote.sha256){
      return {...common,status:STATUS.ALREADY_SYNCED,action:'noop',keepPending:false,nextRemoteRevision:remote.revision};
    }

    if(local.revision===remote.revision&&local.sha256!==remote.sha256){
      return {...common,status:STATUS.DIVERGED,action:'conflict',keepPending:true,remoteRevision:remote.revision};
    }

    if(base!==remote.revision){
      return {...common,status:STATUS.REMOTE_CHANGED,action:'conflict',keepPending:true,remoteRevision:remote.revision};
    }

    if(local.revision<=remote.revision){
      return {...common,status:STATUS.REMOTE_NEWER,action:'conflict',keepPending:true,remoteRevision:remote.revision};
    }

    return {...common,status:STATUS.UPLOAD_UPDATE,action:'upload',keepPending:false,nextRemoteRevision:local.revision};
  }

  function acknowledge(syncMeta,response){
    if(!syncMeta||typeof syncMeta!=='object')throw new TypeError('sync metadata required');
    if(!response||!['uploaded-new','uploaded-update','already-synced'].includes(response.sync_status)){
      throw new TypeError('successful server response required');
    }
    const revision=finiteRevision(response.remote_revision,'ack remote revision');
    if(!validSha(response.remote_sha256))throw new TypeError('ack sha256 required');
    return {
      contractVersion:CONTRACT_VERSION,
      userId:syncMeta.userId||null,
      lastSyncedRemoteRevision:revision,
      lastSyncedSha256:response.remote_sha256,
      pending:null
    };
  }

  const api=Object.freeze({CONTRACT_VERSION,STATUS,queueCommittedProfile,decideCommit,acknowledge});
  root.FEQUEST_SYNC_CONTRACT_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
