// FE QUEST v342 production local-commit adapter.
// This module is inert until createProductionBridge(...).install() is called explicitly.
// It wraps the existing writeCurrentProfile binding only to observe its successful return;
// failed/blocked local writes never enter the cloud outbox and cloud never enters the atomic path.
(function(root){
  'use strict';

  function validChecksum(value){return typeof value==='string'&&/^(?:fnv1a32:[0-9a-f]{8}|sha256:[0-9a-f]{64})$/.test(value)}
  function validRevision(value){return Number.isSafeInteger(Number(value))&&Number(value)>=0}

  function descriptorFromProfile(profile,revision,checksum,writerId=null){
    if(!profile||typeof profile!=='object')throw new TypeError('committed profile required');
    const schema=Number(profile.profileSchemaVersion);
    const rev=Number(revision);
    if(!Number.isSafeInteger(schema)||schema<=0)throw new TypeError('profile schema version required');
    if(!validRevision(rev))throw new TypeError('committed revision required');
    if(!validChecksum(checksum))throw new TypeError('committed local checksum required');
    const meta=profile.profileMeta&&typeof profile.profileMeta==='object'?profile.profileMeta:{};
    if(Number(meta.revision)!==rev)throw new TypeError('profile revision does not match committed revision');
    const committedWriter=writerId||meta.lastWriterId||null;
    if(writerId&&meta.lastWriterId&&writerId!==meta.lastWriterId)throw new TypeError('profile writer does not match committed writer');
    return {
      profileSchemaVersion:schema,
      revision:rev,
      checksum,
      updatedAt:meta.updatedAt||null,
      writerId:committedWriter,
      payload:profile
    };
  }

  function descriptorFromWriteResult(result){
    if(!result||typeof result!=='object')throw new TypeError('writeCurrentProfile result required');
    return descriptorFromProfile(result.profile,result.revision,result.checksum,result.profile&&result.profile.profileMeta&&result.profile.profileMeta.lastWriterId);
  }

  function descriptorFromAtomicRecord(record){
    if(!record||typeof record!=='object')throw new TypeError('atomic committed profile required');
    return descriptorFromProfile(record.profile,record.revision,record.checksum,record.writerId);
  }

  function createProductionBridge(options){
    const o=options||{};
    const engineApi=o.engineApi;
    if(!engineApi||typeof engineApi.createSyncEngine!=='function')throw new TypeError('sync engine api required');
    const getAuthenticatedUserId=o.getAuthenticatedUserId;
    if(typeof getAuthenticatedUserId!=='function')throw new TypeError('authenticated user callback required');

    const getAtomicProfile=o.getAtomicProfile||(()=>{
      if(typeof currentAtomicProfile!=='function')throw new Error('FE QUEST atomic profile reader unavailable');
      return currentAtomicProfile();
    });
    const getWriter=o.getWriteCurrentProfile||(()=>{
      if(typeof writeCurrentProfile!=='function')throw new Error('FE QUEST local writer unavailable');
      return writeCurrentProfile;
    });
    const setWriter=o.setWriteCurrentProfile||((fn)=>{writeCurrentProfile=fn});
    const warn=typeof o.warn==='function'?o.warn:((...args)=>{try{console.warn(...args)}catch(_){}});

    function getCommittedProfile(){return descriptorFromAtomicRecord(getAtomicProfile())}

    const engine=engineApi.createSyncEngine({
      contract:o.contract,
      stateApi:o.stateApi,
      storage:o.storage,
      transport:o.transport,
      getCommittedProfile,
      getAuthenticatedUserId
    });

    let original=null;
    let wrapped=null;

    function install(){
      if(wrapped)return {ok:true,status:'already-installed',engine};
      original=getWriter();
      if(typeof original!=='function')throw new TypeError('writeCurrentProfile function required');
      wrapped=function(...args){
        // If the existing local write throws, execution never reaches the queue hook.
        const result=original.apply(this,args);
        try{engine.queueAfterLocalCommit(descriptorFromWriteResult(result))}
        catch(error){warn('Optional cloud outbox queue failed after local commit',error)}
        return result;
      };
      setWriter(wrapped);
      return {ok:true,status:'installed',engine};
    }

    function uninstall(){
      if(!wrapped)return {ok:true,status:'not-installed'};
      if(getWriter()===wrapped)setWriter(original);
      original=null;wrapped=null;
      return {ok:true,status:'uninstalled'};
    }

    function isInstalled(){return Boolean(wrapped&&getWriter()===wrapped)}

    return Object.freeze({engine,install,uninstall,isInstalled,getCommittedProfile});
  }

  const api=Object.freeze({descriptorFromWriteResult,descriptorFromAtomicRecord,createProductionBridge});
  root.FEQUEST_PRODUCTION_SYNC_ADAPTER_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
