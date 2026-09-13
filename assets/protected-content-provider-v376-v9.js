(()=>{
'use strict';

const GATE_URL='https://gkvgxnkoypypikxtyeoz.supabase.co/functions/v1/fequest-question-gate-v376';
const SCRIPT_URL=document.currentScript?.src||document.baseURI;
const BASE_CATALOG_URL=new URL('question-catalog-v376.json',SCRIPT_URL).toString();
const IPA92_V1_V6_CATALOG_URL=new URL('question-catalog-ipa92-v1-v6.json',SCRIPT_URL).toString();
const IPA92_V7_CATALOG_URL=new URL('question-catalog-ipa92-v7.json',SCRIPT_URL).toString();
const IPA92_V8_CATALOG_URL=new URL('question-catalog-ipa92-v8.json',SCRIPT_URL).toString();
const IPA92_V9_CATALOG_URL=new URL('question-catalog-ipa92-v9.json',SCRIPT_URL).toString();
const BASE_CATALOG_VERSION='v376-catalog-1';
const IPA92_V1_V6_CATALOG_VERSION='ipa92-catalog-v1-v6';
const IPA92_V7_CATALOG_VERSION='ipa92-catalog-v7';
const IPA92_V8_CATALOG_VERSION='ipa92-catalog-v8';
const IPA92_V9_CATALOG_VERSION='ipa92-catalog-v9';
const IPA92_V1_V6_CONTENT_VERSION='ipa92-questions-v1-v6';
const IPA92_V1_V6_CONTENT_VERSIONS=Object.freeze([
  'ipa92-questions-v1','ipa92-questions-v2','ipa92-questions-v3',
  'ipa92-questions-v4','ipa92-questions-v5','ipa92-questions-v6'
]);
const IPA92_V7_CONTENT_VERSION='ipa92-questions-v7';
const IPA92_V8_CONTENT_VERSION='ipa92-questions-v8';
const IPA92_V9_CONTENT_VERSION='ipa92-questions-v9';
const BASE_CATALOG_TOTAL=904;
const IPA92_V1_V6_TOTAL=83;
const IPA92_V7_TOTAL=16;
const IPA92_V8_TOTAL=16;
const IPA92_V9_TOTAL=12;
const IPA92_EXTENSION_TOTAL=IPA92_V1_V6_TOTAL+IPA92_V7_TOTAL+IPA92_V8_TOTAL+IPA92_V9_TOTAL;
const MERGED_CATALOG_TOTAL=BASE_CATALOG_TOTAL+IPA92_EXTENSION_TOTAL;
const ACCESS_SESSION_KEY='fequest_beta_access_v376';
const MAX_BATCH=20;
const MAX_CACHE=60;
const REQUEST_TIMEOUT_MS=15000;
const PROTECTED_CATALOG_KEYS=new Set(['q','stem','options','answerIndex','answer_index','a','explanation','exp','hint','choiceExplanations','choice_explanations']);

let memoryAccessCode='';
let catalogPromise=null;
const questionCache=new Map();
const answerCache=new Map();
const sessionByQuestion=new Map();

function normalizeCode(value){
  const code=typeof value==='string'?value.trim():'';
  if(code.length<12||code.length>160)throw new Error('beta_access_invalid');
  return code;
}
function readSessionAccessCode(){
  try{return sessionStorage.getItem(ACCESS_SESSION_KEY)||''}catch(_e){return ''}
}
function currentAccessCode(){
  if(memoryAccessCode)return memoryAccessCode;
  const stored=readSessionAccessCode();
  if(stored){memoryAccessCode=stored;return stored}
  throw new Error('beta_access_required');
}
function setAccessCode(value,{rememberForTab=true}={}){
  const code=normalizeCode(value);
  memoryAccessCode=code;
  if(rememberForTab){try{sessionStorage.setItem(ACCESS_SESSION_KEY,code)}catch(_e){}}
  else{try{sessionStorage.removeItem(ACCESS_SESSION_KEY)}catch(_e){}}
  return true;
}
function clearProtectedCache(){questionCache.clear();answerCache.clear();sessionByQuestion.clear();}
function clearHydrated(inputIds){
  if(!Array.isArray(inputIds))return 0;
  let cleared=0;
  for(const id of new Set(inputIds.filter(value=>typeof value==='string'))){
    if(questionCache.delete(id))cleared++;
    answerCache.delete(id);sessionByQuestion.delete(id);
  }
  return cleared;
}
function forgetAnswer(questionId){return typeof questionId==='string'?answerCache.delete(questionId):false;}
function clearAccessCode(){
  memoryAccessCode='';
  try{sessionStorage.removeItem(ACCESS_SESSION_KEY)}catch(_e){}
  clearProtectedCache();
}
function hasAccessCode(){return !!(memoryAccessCode||readSessionAccessCode())}

async function fetchJson(url,options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
  try{
    const response=await fetch(url,{...options,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
    let data={};
    try{data=await response.json()}catch(_e){}
    if(!response.ok){
      const error=new Error(typeof data?.error==='string'?data.error:`request_failed_${response.status}`);
      error.status=response.status;error.payload=data;throw error;
    }
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('question_service_timeout');
    throw error;
  }finally{clearTimeout(timer)}
}

function safeCatalogItem(item){return !!item&&typeof item==='object'&&typeof item.id==='string'&&typeof item.sourcePool==='string'}
function safeIpa92CatalogItem(item){
  if(!safeCatalogItem(item)||item.sourcePool!=='subject_a'||!/^ipa92_a_[A-Za-z0-9_-]+$/.test(item.id))return false;
  if(Object.keys(item).some(key=>PROTECTED_CATALOG_KEYS.has(key)))return false;
  return typeof item.cat==='string'&&typeof item.concept==='string'&&/^core_[0-9]{2}_[0-9]{2}$/.test(String(item.coreTopicId||''));
}
function sameStringArray(actual,expected){return Array.isArray(actual)&&actual.length===expected.length&&actual.every((value,index)=>value===expected[index])}
function mergedCounts(baseCounts){
  const counts={...(baseCounts&&typeof baseCounts==='object'?baseCounts:{})};
  counts.subjectA=Number(counts.subjectA||0)+IPA92_EXTENSION_TOTAL;
  counts.trackedSubjectA=Number(counts.trackedSubjectA||0)+IPA92_EXTENSION_TOTAL;
  counts.catalogQuestions=Number(counts.catalogQuestions||BASE_CATALOG_TOTAL)+IPA92_EXTENSION_TOTAL;
  return Object.freeze(counts);
}

async function loadCatalog(){
  if(!catalogPromise){
    catalogPromise=Promise.all([
      fetchJson(BASE_CATALOG_URL),fetchJson(IPA92_V1_V6_CATALOG_URL),fetchJson(IPA92_V7_CATALOG_URL),fetchJson(IPA92_V8_CATALOG_URL),fetchJson(IPA92_V9_CATALOG_URL)
    ]).then(([base,legacy,v7,v8,v9])=>{
      if(base?.version!==BASE_CATALOG_VERSION||!Array.isArray(base.items)||base.items.length!==BASE_CATALOG_TOTAL)throw new Error('question_catalog_invalid');
      if(!base.items.every(safeCatalogItem))throw new Error('question_catalog_invalid');
      if(
        legacy?.version!==IPA92_V1_V6_CATALOG_VERSION||legacy?.contentVersion!==IPA92_V1_V6_CONTENT_VERSION||
        !sameStringArray(legacy?.contentVersions,IPA92_V1_V6_CONTENT_VERSIONS)||!Array.isArray(legacy.items)||legacy.items.length!==IPA92_V1_V6_TOTAL
      )throw new Error('ipa92_question_catalog_invalid');
      if(!legacy.items.every(safeIpa92CatalogItem))throw new Error('ipa92_question_catalog_invalid');
      if(
        v7?.version!==IPA92_V7_CATALOG_VERSION||v7?.contentVersion!==IPA92_V7_CONTENT_VERSION||
        !sameStringArray(v7?.contentVersions,[IPA92_V7_CONTENT_VERSION])||!Array.isArray(v7.items)||v7.items.length!==IPA92_V7_TOTAL
      )throw new Error('ipa92_v7_question_catalog_invalid');
      if(!v7.items.every(safeIpa92CatalogItem)||v7.items.some(item=>item.qualityAudit!=='ipa92-original-v7'))throw new Error('ipa92_v7_question_catalog_invalid');
      if(
        v8?.version!==IPA92_V8_CATALOG_VERSION||v8?.contentVersion!==IPA92_V8_CONTENT_VERSION||
        !sameStringArray(v8?.contentVersions,[IPA92_V8_CONTENT_VERSION])||!Array.isArray(v8.items)||v8.items.length!==IPA92_V8_TOTAL
      )throw new Error('ipa92_v8_question_catalog_invalid');
      if(!v8.items.every(safeIpa92CatalogItem)||v8.items.some(item=>item.qualityAudit!=='ipa92-original-v8'))throw new Error('ipa92_v8_question_catalog_invalid');
      if(
        v9?.version!==IPA92_V9_CATALOG_VERSION||v9?.contentVersion!==IPA92_V9_CONTENT_VERSION||
        !sameStringArray(v9?.contentVersions,[IPA92_V9_CONTENT_VERSION])||!Array.isArray(v9.items)||v9.items.length!==IPA92_V9_TOTAL
      )throw new Error('ipa92_v9_question_catalog_invalid');
      if(!v9.items.every(safeIpa92CatalogItem)||v9.items.some(item=>item.qualityAudit!=='ipa92-original-v9'))throw new Error('ipa92_v9_question_catalog_invalid');

      const baseIds=base.items.map(item=>item.id);
      const extensionItems=[...legacy.items,...v7.items,...v8.items,...v9.items];
      const extensionIds=extensionItems.map(item=>item.id);
      if(new Set(baseIds).size!==baseIds.length)throw new Error('question_catalog_duplicate_ids');
      if(new Set(extensionIds).size!==IPA92_EXTENSION_TOTAL)throw new Error('ipa92_question_catalog_duplicate_ids');
      const mergedIds=[...baseIds,...extensionIds];
      if(new Set(mergedIds).size!==MERGED_CATALOG_TOTAL)throw new Error('question_catalog_extension_collision');
      const items=[...base.items,...extensionItems].map(item=>Object.freeze({...item}));
      return Object.freeze({
        ...base,
        version:`${BASE_CATALOG_VERSION}+ipa92-catalog-v1-v9`,
        extensionContentVersion:'ipa92-questions-v1-v9',
        extensionContentVersions:Object.freeze([...IPA92_V1_V6_CONTENT_VERSIONS,IPA92_V7_CONTENT_VERSION,IPA92_V8_CONTENT_VERSION,IPA92_V9_CONTENT_VERSION]),
        counts:mergedCounts(base.counts),
        items:Object.freeze(items),
      });
    }).catch(error=>{catalogPromise=null;throw error});
  }
  return catalogPromise;
}

function uniqueRequestedIds(input){
  if(!Array.isArray(input))throw new Error('question_ids_required');
  const ids=[...new Set(input.filter(id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id)))];
  if(ids.length<1)throw new Error('question_ids_required');
  return ids;
}
function touchQuestion(id,value){
  if(questionCache.has(id))questionCache.delete(id);
  questionCache.set(id,value);
  while(questionCache.size>MAX_CACHE){
    const oldest=questionCache.keys().next().value;
    questionCache.delete(oldest);answerCache.delete(oldest);sessionByQuestion.delete(oldest);
  }
}
async function bootstrapBatch(ids){
  if(ids.length>MAX_BATCH)throw new Error('question_batch_too_large');
  const data=await fetchJson(GATE_URL,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'bootstrap',accessCode:currentAccessCode(),requestedIds:ids}),
  });
  if(typeof data?.sessionToken!=='string'||data.sessionToken.length<32||!Array.isArray(data.questions))throw new Error('question_bootstrap_invalid');
  const received=new Set();
  for(const q of data.questions){
    if(!q||typeof q.id!=='string'||!ids.includes(q.id)||!Array.isArray(q.options)||q.options.length!==4)throw new Error('question_payload_invalid');
    if('answerIndex' in q||'explanation' in q||'choiceExplanations' in q)throw new Error('pre_submit_answer_leak');
    received.add(q.id);sessionByQuestion.set(q.id,data.sessionToken);
    touchQuestion(q.id,Object.freeze({...q,options:Object.freeze([...q.options])}));
  }
  if(received.size!==ids.length)throw new Error('question_bootstrap_incomplete');
  return {questions:ids.map(id=>questionCache.get(id)),expiresAt:data.expiresAt||null,remainingToday:Number.isFinite(Number(data.remainingToday))?Number(data.remainingToday):null};
}
async function hydrate(inputIds,{force=false}={}){
  const ids=uniqueRequestedIds(inputIds);
  const catalog=await loadCatalog();
  const catalogIds=new Set(catalog.items.map(item=>item.id));
  if(ids.some(id=>!catalogIds.has(id)))throw new Error('question_id_not_in_catalog');
  const missing=force?ids:ids.filter(id=>!questionCache.has(id)||!sessionByQuestion.has(id));
  let remainingToday=null,expiresAt=null;
  for(let i=0;i<missing.length;i+=MAX_BATCH){
    const result=await bootstrapBatch(missing.slice(i,i+MAX_BATCH));
    if(result.remainingToday!==null)remainingToday=result.remainingToday;
    if(result.expiresAt)expiresAt=result.expiresAt;
  }
  ids.forEach(id=>{if(questionCache.has(id))touchQuestion(id,questionCache.get(id))});
  return {questions:ids.map(id=>questionCache.get(id)).filter(Boolean),remainingToday,expiresAt};
}
function getCachedQuestion(id){const value=questionCache.get(id)||null;if(value)touchQuestion(id,value);return value}
function getAnsweredResult(id){return answerCache.get(id)||null}
async function ensureSession(questionId){
  let sessionToken=sessionByQuestion.get(questionId);
  if(!sessionToken){await hydrate([questionId],{force:true});sessionToken=sessionByQuestion.get(questionId)}
  if(typeof sessionToken!=='string'||sessionToken.length<32)throw new Error('question_session_missing');
  return sessionToken;
}
async function submit(questionId,choiceIndex){
  if(typeof questionId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(questionId))throw new Error('question_id_invalid');
  if(!Number.isInteger(choiceIndex)||choiceIndex<0||choiceIndex>3)throw new Error('choice_index_invalid');
  const sessionToken=await ensureSession(questionId);
  const data=await fetchJson(GATE_URL,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'answer',sessionToken,questionId,choiceIndex}),
  });
  if(data?.questionId!==questionId||typeof data?.correct!=='boolean'||!Number.isInteger(data?.answerIndex))throw new Error('answer_payload_invalid');
  const result=Object.freeze({
    questionId,correct:data.correct,answerIndex:data.answerIndex,
    explanation:typeof data.explanation==='string'?data.explanation:'',
    choiceExplanations:Array.isArray(data.choiceExplanations)?Object.freeze([...data.choiceExplanations]):Object.freeze([]),
    postSubmit:data.postSubmit&&typeof data.postSubmit==='object'?Object.freeze({...data.postSubmit}):Object.freeze({}),
  });
  answerCache.set(questionId,result);return result;
}
async function resumeTraceTail(questionId){
  if(typeof questionId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(questionId))throw new Error('question_id_invalid');
  const sessionToken=await ensureSession(questionId);
  const data=await fetchJson(GATE_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'trace_tail_resume',sessionToken,questionId})});
  const tail=data?.traceTail;
  if(data?.questionId!==questionId||!tail||typeof tail!=='object'||Array.isArray(tail)||!Array.isArray(tail.steps)||!tail.steps.length)throw new Error('trace_tail_resume_payload_invalid');
  for(const step of tail.steps){
    if(!step||typeof step!=='object'||Array.isArray(step)||['predict','answer','answerIndex','a'].some(key=>key in step))throw new Error('trace_tail_resume_payload_invalid');
  }
  return tail;
}

window.FEQUEST_PROTECTED_CONTENT=Object.freeze({
  version:'v376-provider-6-ipa92-v1-v9',maxBatch:MAX_BATCH,maxCache:MAX_CACHE,catalogTotal:MERGED_CATALOG_TOTAL,
  setAccessCode,clearAccessCode,hasAccessCode,loadCatalog,hydrate,submit,resumeTraceTail,
  getCachedQuestion,getAnsweredResult,forgetAnswer,clearHydrated,clearProtectedCache,
});
})();
