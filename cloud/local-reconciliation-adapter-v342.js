// FE QUEST v342 production-local callbacks for explicit cloud reconciliation.
// This module performs only existing FE QUEST local atomic persistence operations.
// It contains no network/auth logic and remains unloaded until cloud sync activation.
(function(root){
  'use strict';

  function committedDescriptor(result){
    if(!result||typeof result!=='object'||!result.profile||typeof result.profile!=='object')throw new TypeError('committed local write result required');
    const revision=Number(result.revision);
    const checksum=result.checksum;
    const schema=Number(result.profile.profileSchemaVersion);
    if(!Number.isSafeInteger(revision)||revision<0)throw new TypeError('committed revision required');
    if(typeof checksum!=='string'||!/^(?:fnv1a32:[0-9a-f]{8}|sha256:[0-9a-f]{64})$/.test(checksum))throw new TypeError('committed checksum required');
    if(!Number.isSafeInteger(schema)||schema<=0)throw new TypeError('profile schema required');
    const meta=result.profile.profileMeta&&typeof result.profile.profileMeta==='object'?result.profile.profileMeta:{};
    return {
      profileSchemaVersion:schema,
      revision,
      checksum,
      updatedAt:meta.updatedAt||null,
      writerId:meta.lastWriterId||null,
      payload:result.profile
    };
  }

  function requireProductionPersistence(){
    for(const [name,value] of [
      ['writeCurrentProfile',typeof writeCurrentProfile==='function'],
      ['stampProfileForSave',typeof stampProfileForSave==='function'],
      ['normalizeProfileData',typeof normalizeProfileData==='function'],
      ['currentAtomicProfile',typeof currentAtomicProfile==='function'],
      ['rememberCommittedProfile',typeof rememberCommittedProfile==='function'],
      ['acquireProfileWriteLease',typeof acquireProfileWriteLease==='function'],
      ['releaseProfileWriteLease',typeof releaseProfileWriteLease==='function']
    ])if(!value)throw new Error(`FE QUEST production persistence unavailable: ${name}`);
  }

  function createLocalReconciliationCallbacks(options){
    const o=options||{};
    const warn=typeof o.warn==='function'?o.warn:((...args)=>{try{console.warn(...args)}catch(_){}});
    requireProductionPersistence();

    async function createRecoveryPoint(meta={}){
      if(typeof writeRecoveryCheckpoint!=='function')return false;
      try{
        return (await writeRecoveryCheckpoint(profile,meta.reason||'before-cloud-adopt',true))===true;
      }catch(error){warn('Cloud reconciliation recovery checkpoint failed',error);return false}
    }

    function targetRevision(payload,minimumRevision){
      const min=Math.max(0,Math.round(Number(minimumRevision)||0));
      let latest=Math.max(0,Math.round(Number(profileBaseRevision)||0));
      try{latest=Math.max(latest,Number(currentAtomicProfile()?.revision)||0)}catch(_e){}
      try{latest=Math.max(latest,Number(profile?.profileMeta?.revision)||0)}catch(_e){}
      try{latest=Math.max(latest,Number(payload?.profileMeta?.revision)||0)}catch(_e){}
      return Math.max(min,latest+1);
    }

    function commitPayload(payload,minimumRevision,{refresh=false,reason='cloud-reconciliation'}={}){
      if(profileWriteBlocked||profileConflictBlocked)return null;
      if(!acquireProfileWriteLease())return null;
      let result=null;
      try{
        const stamped=stampProfileForSave(payload);
        const exactRevision=targetRevision(stamped,minimumRevision);
        result=writeCurrentProfile(stamped,{preservePrevious:true,exactRevision});
        profile=result.profile;
        rememberCommittedProfile(profile);
        clearProfileSaveFailure?.();
      }catch(error){
        try{restoreCommittedProfileInMemory(false)}catch(_e){}
        try{noteProfileSaveFailure?.(error)}catch(_e){}
        if(error&&error.code==='PROFILE_REVISION_CONFLICT')try{markProfileConflict?.()}catch(_e){}
        else profileWriteBlocked=true;
        throw error;
      }finally{
        releaseProfileWriteLease();
      }
      try{queueRecoveryCheckpoint?.(reason,false)}catch(error){warn('Post-reconciliation recovery queue failed',error)}
      if(refresh)try{refreshProfileUI?.()}catch(error){warn('UI refresh failed after cloud reconciliation commit',error)}
      return committedDescriptor(result);
    }

    async function promoteLocalRevision(minimumRevision,meta={}){
      return commitPayload(profile,minimumRevision,{refresh:false,reason:meta.reason||'cloud-keep-local'});
    }

    async function replaceLocalProfile(remotePayload,meta={}){
      if(!remotePayload||typeof remotePayload!=='object')throw new TypeError('remote profile payload required');
      // Validate/migrate the remote payload before taking the write lease. A future or invalid
      // cloud schema is a sync input problem, not a local-storage failure, and must never set
      // profileWriteBlocked or stop the learner from continuing locally.
      const validated=normalizeProfileData(remotePayload);
      return commitPayload(validated,meta.minimumRevision,{refresh:true,reason:'cloud-adopted'});
    }

    return Object.freeze({createRecoveryPoint,promoteLocalRevision,replaceLocalProfile});
  }

  const api=Object.freeze({committedDescriptor,createLocalReconciliationCallbacks});
  root.FEQUEST_LOCAL_RECONCILIATION_ADAPTER_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
