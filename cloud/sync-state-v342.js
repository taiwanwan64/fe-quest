// FE QUEST v342 local-only cloud sync metadata store.
// Deliberately separate from the learner profile/schema: deleting this state must never
// delete XP, question history, lesson progress, recovery points, or JSON backups.
(function(root){
  'use strict';

  const STORAGE_KEY='fequest.cloudSync.v342';
  const STORE_VERSION=1;

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value))}
  function validSha(value){return typeof value==='string'&&/^[0-9a-f]{64}$/.test(value)}
  function validRevision(value){return value==null||(Number.isSafeInteger(Number(value))&&Number(value)>=0)}
  function cleanString(value,max=500){return typeof value==='string'?value.slice(0,max):null}

  function emptyState(){
    return {
      storeVersion:STORE_VERSION,
      contractVersion:1,
      userId:null,
      lastSyncedRemoteRevision:null,
      lastSyncedSha256:null,
      pending:null,
      conflict:null,
      lastAttemptAt:null,
      lastSuccessAt:null,
      lastError:null
    };
  }

  function normalizePending(value){
    if(!value||typeof value!=='object')return null;
    if(!validRevision(value.baseRemoteRevision)||!validRevision(value.profileRevision)||!validSha(value.payloadSha256))return null;
    return {
      baseRemoteRevision:value.baseRemoteRevision==null?null:Number(value.baseRemoteRevision),
      profileRevision:Number(value.profileRevision),
      payloadSha256:value.payloadSha256,
      clientUpdatedAt:cleanString(value.clientUpdatedAt,100),
      writerId:cleanString(value.writerId,200),
      queuedAt:cleanString(value.queuedAt,100)
    };
  }

  function normalize(input){
    const s=emptyState();
    if(!input||typeof input!=='object'||Number(input.storeVersion)!==STORE_VERSION)return s;
    s.contractVersion=Number(input.contractVersion)===1?1:1;
    s.userId=cleanString(input.userId,200);
    s.lastSyncedRemoteRevision=validRevision(input.lastSyncedRemoteRevision)&&input.lastSyncedRemoteRevision!=null?Number(input.lastSyncedRemoteRevision):null;
    s.lastSyncedSha256=validSha(input.lastSyncedSha256)?input.lastSyncedSha256:null;
    s.pending=normalizePending(input.pending);
    s.conflict=input.conflict&&typeof input.conflict==='object'?clone(input.conflict):null;
    s.lastAttemptAt=cleanString(input.lastAttemptAt,100);
    s.lastSuccessAt=cleanString(input.lastSuccessAt,100);
    s.lastError=input.lastError&&typeof input.lastError==='object'?clone(input.lastError):null;
    return s;
  }

  function storageOrThrow(storage){
    const s=storage||(typeof localStorage!=='undefined'?localStorage:null);
    if(!s||typeof s.getItem!=='function'||typeof s.setItem!=='function')throw new TypeError('storage adapter required');
    return s;
  }

  function load(storage){
    const s=storageOrThrow(storage);
    try{
      const raw=s.getItem(STORAGE_KEY);
      return raw?normalize(JSON.parse(raw)):emptyState();
    }catch(_){
      // Corrupt sync metadata is isolated from the learner profile. Do not throw into app startup.
      return emptyState();
    }
  }

  function save(storage,state){
    const s=storageOrThrow(storage);
    const next=normalize({...state,storeVersion:STORE_VERSION});
    s.setItem(STORAGE_KEY,JSON.stringify(next));
    return clone(next);
  }

  function bindUser(storage,userId){
    if(typeof userId!=='string'||!userId)throw new TypeError('authenticated user id required');
    const current=load(storage);
    if(current.userId&&current.userId!==userId){
      return {ok:false,reason:'account-mismatch',state:current};
    }
    current.userId=userId;
    return {ok:true,state:save(storage,current)};
  }

  function queue(storage,contract,committed,userId){
    if(!contract||typeof contract.queueCommittedProfile!=='function')throw new TypeError('sync contract required');
    const bound=bindUser(storage,userId);
    if(!bound.ok)return bound;
    const current=bound.state;
    const queued=contract.queueCommittedProfile(current,committed);
    current.contractVersion=queued.contractVersion;
    current.pending=queued.pending;
    current.lastSyncedRemoteRevision=queued.lastSyncedRemoteRevision;
    current.lastSyncedSha256=queued.lastSyncedSha256;
    current.conflict=null;
    current.lastError=null;
    return {ok:true,state:save(storage,current)};
  }

  function recordAttempt(storage){
    const current=load(storage);
    current.lastAttemptAt=new Date().toISOString();
    return save(storage,current);
  }

  function recordFailure(storage,error){
    const current=load(storage);
    current.lastError={
      kind:cleanString(error&&error.kind,100)||'unknown',
      message:cleanString(error&&error.message,500),
      retryable:Boolean(error&&error.retryable),
      at:new Date().toISOString()
    };
    return save(storage,current);
  }

  function recordConflict(storage,response){
    const current=load(storage);
    current.conflict={
      status:cleanString(response&&response.sync_status,100)||'conflict',
      remoteRevision:validRevision(response&&response.remote_revision)&&response.remote_revision!=null?Number(response.remote_revision):null,
      remoteSha256:validSha(response&&response.remote_sha256)?response.remote_sha256:null,
      detectedAt:new Date().toISOString()
    };
    current.lastError=null;
    return save(storage,current);
  }

  function acknowledge(storage,contract,response){
    if(!contract||typeof contract.acknowledge!=='function')throw new TypeError('sync contract required');
    const current=load(storage);
    const ack=contract.acknowledge(current,response);
    current.contractVersion=ack.contractVersion;
    current.userId=ack.userId||current.userId;
    current.lastSyncedRemoteRevision=ack.lastSyncedRemoteRevision;
    current.lastSyncedSha256=ack.lastSyncedSha256;
    current.pending=null;
    current.conflict=null;
    current.lastError=null;
    current.lastSuccessAt=new Date().toISOString();
    return save(storage,current);
  }

  function clearAccountBinding(storage){
    // Keep no cross-account ancestry. Local learner data lives elsewhere and is untouched.
    const next=emptyState();
    return save(storage,next);
  }

  const api=Object.freeze({STORAGE_KEY,STORE_VERSION,emptyState,normalize,load,save,bindUser,queue,recordAttempt,recordFailure,recordConflict,acknowledge,clearAccountBinding});
  root.FEQUEST_SYNC_STATE_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
