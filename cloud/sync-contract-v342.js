// FE QUEST v342 provider-neutral local-first sync contract.
// This module remains opt-in until authenticated cloud sync is deliberately activated.
// The local profile revision/checksum stay authoritative; cloud never invents a second revision.
(function(root){
  'use strict';

  const CONTRACT_VERSION=2;
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

  function normalizeChecksum(value){
    if(typeof value!=='string')throw new TypeError('profile checksum required');
    if(/^fnv1a32:[0-9a-f]{8}$/.test(value))return value;
    if(/^sha256:[0-9a-f]{64}$/.test(value))return value;
    // Foundation builds before the production boundary was discovered stored bare SHA-256.
    if(/^[0-9a-f]{64}$/.test(value))return `sha256:${value}`;
    throw new TypeError('unsupported profile checksum');
  }

  function optionalChecksum(value){
    if(value==null)return null;
    try{return normalizeChecksum(value)}catch(_){return null}
  }

  function normalizeCommitted(input){
    if(!input||typeof input!=='object')throw new TypeError('committed profile metadata required');
    const revision=finiteRevision(input.revision,'local revision');
    const checksum=normalizeChecksum(input.checksum??input.sha256);
    return {revision,checksum,updatedAt:input.updatedAt||null,writerId:input.writerId||null};
  }

  function normalizeRemote(remote){
    if(remote==null)return null;
    if(typeof remote!=='object')throw new TypeError('remote must be null or object');
    const revision=finiteRevision(remote.revision,'remote revision');
    const checksum=normalizeChecksum(remote.checksum??remote.sha256);
    return {revision,checksum,updatedAt:remote.updatedAt||null};
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
      lastSyncedChecksum:optionalChecksum(current.lastSyncedChecksum??current.lastSyncedSha256),
      pending:{
        baseRemoteRevision:base,
        profileRevision:c.revision,
        payloadChecksum:c.checksum,
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
      checksum:x.localChecksum??x.localSha256,
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

    // Client-side equality is a fast deterministic hint. The server RPC additionally compares
    // JSONB payload equality for same-revision requests, so an FNV-1a collision cannot silently
    // turn divergent learner data into an idempotent replay.
    if(local.revision===remote.revision&&local.checksum===remote.checksum){
      return {...common,status:STATUS.ALREADY_SYNCED,action:'noop',keepPending:false,nextRemoteRevision:remote.revision};
    }

    if(local.revision===remote.revision&&local.checksum!==remote.checksum){
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
    const checksum=normalizeChecksum(response.remote_checksum??response.remote_sha256);
    return {
      contractVersion:CONTRACT_VERSION,
      userId:syncMeta.userId||null,
      lastSyncedRemoteRevision:revision,
      lastSyncedChecksum:checksum,
      pending:null
    };
  }

  const api=Object.freeze({CONTRACT_VERSION,STATUS,normalizeChecksum,queueCommittedProfile,decideCommit,acknowledge});
  root.FEQUEST_SYNC_CONTRACT_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
