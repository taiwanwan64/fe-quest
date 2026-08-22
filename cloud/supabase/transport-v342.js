// FE QUEST v342 Supabase REST transport.
// This file contains no project URL, anon key, access token, or service-role credential.
// It is not production-loaded until explicit public configuration is supplied.
(function(root){
  'use strict';

  const RPC_NAME='fequest_commit_profile_v342';
  const TABLE='user_profiles';

  function trimSlash(v){return String(v||'').replace(/\/+$/,'')}
  function safeMessage(value){return typeof value==='string'?value.slice(0,500):null}
  function uuidLike(value){return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)}
  function validChecksum(value){return typeof value==='string'&&/^(?:fnv1a32:[0-9a-f]{8}|sha256:[0-9a-f]{64})$/.test(value)}

  function validatePublicConfig(config){
    const c=config||{};
    const url=trimSlash(c.url);
    if(!/^https:\/\//i.test(url))throw new TypeError('Supabase https project URL required');
    if(typeof c.anonKey!=='string'||c.anonKey.length<20)throw new TypeError('Supabase public anon/publishable key required');
    if(/service[_-]?role|sb_secret_/i.test(c.anonKey))throw new TypeError('secret/service-role key is forbidden in the PWA');
    if(typeof c.getAccessToken!=='function')throw new TypeError('getAccessToken callback required');
    const fetchImpl=c.fetchImpl||(typeof fetch==='function'?fetch.bind(root):null);
    if(typeof fetchImpl!=='function')throw new TypeError('fetch implementation required');
    return {url,anonKey:c.anonKey,getAccessToken:c.getAccessToken,fetchImpl};
  }

  function normalizeRemoteRow(row){
    if(!row||typeof row!=='object')return null;
    return {
      revision:Number(row.profile_revision),
      checksum:row.payload_checksum,
      updatedAt:row.client_updated_at||null,
      serverUpdatedAt:row.server_updated_at||null,
      profileSchemaVersion:Number(row.profile_schema_version),
      writerId:row.writer_id||null,
      payload:row.payload
    };
  }

  function normalizeRpcResponse(value){
    const row=Array.isArray(value)?value[0]:value;
    if(!row||typeof row!=='object'||typeof row.sync_status!=='string')throw new TypeError('invalid Supabase RPC response');
    return {
      sync_status:row.sync_status,
      remote_revision:row.remote_revision==null?null:Number(row.remote_revision),
      remote_checksum:row.remote_checksum||null,
      remote_client_updated_at:row.remote_client_updated_at||null,
      remote_server_updated_at:row.remote_server_updated_at||null,
      remote_payload:row.remote_payload==null?null:row.remote_payload
    };
  }

  function classifyHttp(status,message){
    if(status===401||status===403)return {kind:'auth',retryable:false,message:safeMessage(message)||`HTTP ${status}`};
    if(status===408||status===425||status===429||status>=500)return {kind:'provider',retryable:true,message:safeMessage(message)||`HTTP ${status}`};
    return {kind:'request',retryable:false,message:safeMessage(message)||`HTTP ${status}`};
  }

  function createSupabaseTransport(config){
    const c=validatePublicConfig(config);

    async function token(){
      const value=await c.getAccessToken();
      return typeof value==='string'&&value.length>20?value:null;
    }

    async function request(path,options){
      const accessToken=await token();
      if(!accessToken)return {ok:false,error:{kind:'auth',retryable:false,message:'No authenticated Supabase session'}};
      const headers={
        'apikey':c.anonKey,
        'Authorization':`Bearer ${accessToken}`,
        'Accept':'application/json',
        ...(options&&options.body!=null?{'Content-Type':'application/json'}:{}),
        ...((options&&options.headers)||{})
      };
      let response;
      try{
        response=await c.fetchImpl(c.url+path,{...(options||{}),headers});
      }catch(error){
        return {ok:false,error:{kind:'network',retryable:true,message:safeMessage(error&&error.message)||'Network error'}};
      }
      let data=null;
      const text=await response.text().catch(()=> '');
      if(text){try{data=JSON.parse(text)}catch(_){data=text}}
      if(!response.ok){
        const msg=data&&typeof data==='object'?(data.message||data.error_description||data.error):text;
        return {ok:false,status:response.status,error:classifyHttp(response.status,msg),data};
      }
      return {ok:true,status:response.status,data};
    }

    async function readProfile(userId){
      if(!uuidLike(userId))return {ok:false,error:{kind:'request',retryable:false,message:'Valid authenticated user id required'}};
      const select='profile_schema_version,profile_revision,client_updated_at,writer_id,payload,payload_checksum,server_updated_at';
      const result=await request(`/rest/v1/${TABLE}?user_id=eq.${encodeURIComponent(userId)}&select=${encodeURIComponent(select)}&limit=1`,{method:'GET'});
      if(!result.ok)return result;
      const rows=Array.isArray(result.data)?result.data:[];
      return {ok:true,status:result.status,remote:rows.length?normalizeRemoteRow(rows[0]):null};
    }

    async function commitProfile(input){
      const x=input||{};
      if(!uuidLike(x.userId))return {ok:false,error:{kind:'request',retryable:false,message:'Valid authenticated user id required'}};
      if(!Number.isSafeInteger(Number(x.profileRevision))||Number(x.profileRevision)<0||!validChecksum(x.payloadChecksum)||!x.payload||typeof x.payload!=='object'){
        return {ok:false,error:{kind:'request',retryable:false,message:'Invalid committed profile descriptor'}};
      }
      const body={
        p_user_id:x.userId,
        p_base_remote_revision:x.baseRemoteRevision==null?null:Number(x.baseRemoteRevision),
        p_profile_schema_version:Number(x.profileSchemaVersion),
        p_profile_revision:Number(x.profileRevision),
        p_client_updated_at:x.clientUpdatedAt,
        p_writer_id:x.writerId||null,
        p_payload:x.payload,
        p_payload_checksum:x.payloadChecksum
      };
      const result=await request(`/rest/v1/rpc/${RPC_NAME}`,{method:'POST',body:JSON.stringify(body)});
      if(!result.ok)return result;
      try{
        return {ok:true,status:result.status,response:normalizeRpcResponse(result.data)};
      }catch(error){
        return {ok:false,error:{kind:'provider',retryable:true,message:safeMessage(error&&error.message)||'Invalid RPC response'}};
      }
    }

    return Object.freeze({provider:'supabase',rpcName:RPC_NAME,readProfile,commitProfile});
  }

  const api=Object.freeze({RPC_NAME,TABLE,validatePublicConfig,createSupabaseTransport});
  root.FEQUEST_SUPABASE_TRANSPORT_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
