(()=>{
'use strict';

const GATE_URL='https://gkvgxnkoypypikxtyeoz.supabase.co/functions/v1/fequest-question-gate-v376';
const SCRIPT_URL=document.currentScript?.src||document.baseURI;
const CATALOG_URL=new URL('question-catalog-v376.json',SCRIPT_URL).toString();
const IPA92_CATALOG_URL=new URL('question-catalog-ipa92-v1.json',SCRIPT_URL).toString();
const BASE_CATALOG_VERSION='v376-catalog-1';
const IPA92_CATALOG_VERSION='ipa92-catalog-v1';
const BASE_CATALOG_TOTAL=904;
const IPA92_CATALOG_TOTAL=13;
const MERGED_CATALOG_TOTAL=BASE_CATALOG_TOTAL+IPA92_CATALOG_TOTAL;
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
  if(rememberForTab){
    try{sessionStorage.setItem(ACCESS_SESSION_KEY,code)}catch(_e){}
  }else{
    try{sessionStorage.removeItem(ACCESS_SESSION_KEY)}catch(_e){}
  }
  return true;
}

function clearProtectedCache(){
  questionCache.clear();
  answerCache.clear();
  sessionByQuestion.clear();
}

function clearHydrated(inputIds){
  if(!Array.isArray(inputIds))return 0;
  let cleared=0;
  for(const id of new Set(inputIds.filter(value=>typeof value==='string'))){
    if(questionCache.delete(id))cleared++;
    answerCache.delete(id);
    sessionByQuestion.delete(id);
  }
  return cleared;
}

function forgetAnswer(questionId){
  if(typeof questionId!=='string')return false;
  return answerCache.delete(questionId);
}

function clearAccessCode(){
  memoryAccessCode='';
  try{sessionStorage.removeItem(ACCESS_SESSION_KEY)}catch(_e){}
  clearProtectedCache();
}

function hasAccessCode(){
  return !!(memoryAccessCode||readSessionAccessCode());
}

async function fetchJson(url,options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
  try{
    const response=await fetch(url,{
      ...options,
      cache:'no-store',
      credentials:'omit',
      referrerPolicy:'no-referrer',
      signal:controller.signal,
    });
    let data={};
    try{data=await response.json()}catch(_e){}
    if(!response.ok){
      const error=new Error(typeof data?.error==='string'?data.error:`request_failed_${response.status}`);
      error.status=response.status;
      error.payload=data;
      throw error;
    }
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('question_service_timeout');
    throw error;
  }finally{
    clearTimeout(timer);
  }
}

function safeCatalogItem(item){
  return !!item&&typeof item==='object'&&typeof item.id==='string'&&typeof item.sourcePool==='string';
}

function safeIpa92CatalogItem(item){
  if(!safeCatalogItem(item)||item.sourcePool!=='subject_a'||!/^ipa92_a_[A-Za-z0-9_-]+$/.test(item.id))return false;
  if(Object.keys(item).some(key=>PROTECTED_CATALOG_KEYS.has(key)))return false;
  return typeof item.cat==='string'&&typeof item.concept==='string'&&/^core_[0-9]{2}_[0-9]{2}$/.test(String(item.coreTopicId||''));
}

function mergedCounts(baseCounts){
  const counts={...(baseCounts&&typeof baseCounts==='object'?baseCounts:{})};
  counts.subjectA=Number(counts.subjectA||0)+IPA92_CATALOG_TOTAL;
  counts.trackedSubjectA=Number(counts.trackedSubjectA||0)+IPA92_CATALOG_TOTAL;
  counts.catalogQuestions=Number(counts.catalogQuestions||BASE_CATALOG_TOTAL)+IPA92_CATALOG_TOTAL;
  return Object.freeze(counts);
}

async function loadCatalog(){
  if(!catalogPromise){
    catalogPromise=Promise.all([fetchJson(CATALOG_URL),fetchJson(IPA92_CATALOG_URL)]).then(([catalog,ipa92])=>{
      if(catalog?.version!==BASE_CATALOG_VERSION||!Array.isArray(catalog.items)||catalog.items.length!==BASE_CATALOG_TOTAL){
        throw new Error('question_catalog_invalid');
      }
      if(!catalog.items.every(safeCatalogItem))throw new Error('question_catalog_invalid');
      if(ipa92?.version!==IPA92_CATALOG_VERSION||ipa92?.contentVersion!=='ipa92-questions-v1'||!Array.isArray(ipa92.items)||ipa92.items.length!==IPA92_CATALOG_TOTAL){
        throw new Error('ipa92_question_catalog_invalid');
      }
      if(!ipa92.items.every(safeIpa92CatalogItem))throw new Error('ipa92_question_catalog_invalid');
      const baseIds=catalog.items.map(item=>item.id);
      const extensionIds=ipa92.items.map(item=>item.id);
      if(new Set(baseIds).size!==baseIds.length)throw new Error('question_catalog_duplicate_ids');
      if(new Set(extensionIds).size!==extensionIds.length)throw new Error('ipa92_question_catalog_duplicate_ids');
      const mergedIds=[...baseIds,...extensionIds];
      if(new Set(mergedIds).size!==MERGED_CATALOG_TOTAL)throw new Error('question_catalog_extension_collision');
      const items=[...catalog.items,...ipa92.items].map(item=>Object.freeze({...item}));
      return Object.freeze({
        ...catalog,
        version:`${BASE_CATALOG_VERSION}+${IPA92_CATALOG_VERSION}`,
        extensionContentVersion:ipa92.contentVersion,
        counts:mergedCounts(catalog.counts),
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
    questionCache.delete(oldest);
    answerCache.delete(oldest);
    sessionByQuestion.delete(oldest);
  }
}

async function bootstrapBatch(ids){
  if(ids.length>MAX_BATCH)throw new Error('question_batch_too_large');
  const data=await fetchJson(GATE_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      action:'bootstrap',
      accessCode:currentAccessCode(),
      requestedIds:ids,
    }),
  });
  if(typeof data?.sessionToken!=='string'||data.sessionToken.length<32||!Array.isArray(data.questions)){
    throw new Error('question_bootstrap_invalid');
  }
  const received=new Set();
  for(const q of data.questions){
    if(!q||typeof q.id!=='string'||!ids.includes(q.id)||!Array.isArray(q.options)||q.options.length!==4){
      throw new Error('question_payload_invalid');
    }
    if('answerIndex' in q||'explanation' in q||'choiceExplanations' in q){
      throw new Error('pre_submit_answer_leak');
    }
    received.add(q.id);
    sessionByQuestion.set(q.id,data.sessionToken);
    touchQuestion(q.id,Object.freeze({...q,options:Object.freeze([...q.options])}));
  }
  if(received.size!==ids.length)throw new Error('question_bootstrap_incomplete');
  return {
    questions:ids.map(id=>questionCache.get(id)),
    expiresAt:data.expiresAt||null,
    remainingToday:Number.isFinite(Number(data.remainingToday))?Number(data.remainingToday):null,
  };
}

async function hydrate(inputIds,{force=false}={}){
  const ids=uniqueRequestedIds(inputIds);
  const catalog=await loadCatalog();
  const catalogIds=new Set(catalog.items.map(item=>item.id));
  if(ids.some(id=>!catalogIds.has(id)))throw new Error('question_id_not_in_catalog');

  const missing=force?ids:ids.filter(id=>!questionCache.has(id)||!sessionByQuestion.has(id));
  let remainingToday=null;
  let expiresAt=null;
  for(let i=0;i<missing.length;i+=MAX_BATCH){
    const result=await bootstrapBatch(missing.slice(i,i+MAX_BATCH));
    if(result.remainingToday!==null)remainingToday=result.remainingToday;
    if(result.expiresAt)expiresAt=result.expiresAt;
  }
  ids.forEach(id=>{if(questionCache.has(id))touchQuestion(id,questionCache.get(id))});
  return {
    questions:ids.map(id=>questionCache.get(id)).filter(Boolean),
    remainingToday,
    expiresAt,
  };
}

function getCachedQuestion(id){
  const value=questionCache.get(id)||null;
  if(value)touchQuestion(id,value);
  return value;
}

function getAnsweredResult(id){
  return answerCache.get(id)||null;
}

async function ensureSession(questionId){
  let sessionToken=sessionByQuestion.get(questionId);
  if(!sessionToken){
    await hydrate([questionId],{force:true});
    sessionToken=sessionByQuestion.get(questionId);
  }
  if(typeof sessionToken!=='string'||sessionToken.length<32)throw new Error('question_session_missing');
  return sessionToken;
}

async function submit(questionId,choiceIndex){
  if(typeof questionId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(questionId))throw new Error('question_id_invalid');
  if(!Number.isInteger(choiceIndex)||choiceIndex<0||choiceIndex>3)throw new Error('choice_index_invalid');
  const sessionToken=await ensureSession(questionId);
  const data=await fetchJson(GATE_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'answer',sessionToken,questionId,choiceIndex}),
  });
  if(data?.questionId!==questionId||typeof data?.correct!=='boolean'||!Number.isInteger(data?.answerIndex)){
    throw new Error('answer_payload_invalid');
  }
  const result=Object.freeze({
    questionId,
    correct:data.correct,
    answerIndex:data.answerIndex,
    explanation:typeof data.explanation==='string'?data.explanation:'',
    choiceExplanations:Array.isArray(data.choiceExplanations)?Object.freeze([...data.choiceExplanations]):Object.freeze([]),
    postSubmit:data.postSubmit&&typeof data.postSubmit==='object'?Object.freeze({...data.postSubmit}):Object.freeze({}),
  });
  answerCache.set(questionId,result);
  return result;
}

async function resumeTraceTail(questionId){
  if(typeof questionId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(questionId))throw new Error('question_id_invalid');
  const sessionToken=await ensureSession(questionId);
  const data=await fetchJson(GATE_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'trace_tail_resume',sessionToken,questionId}),
  });
  const tail=data?.traceTail;
  if(data?.questionId!==questionId||!tail||typeof tail!=='object'||Array.isArray(tail)||!Array.isArray(tail.steps)||!tail.steps.length){
    throw new Error('trace_tail_resume_payload_invalid');
  }
  for(const step of tail.steps){
    if(!step||typeof step!=='object'||Array.isArray(step)||['predict','answer','answerIndex','a'].some(key=>key in step)){
      throw new Error('trace_tail_resume_payload_invalid');
    }
  }
  return tail;
}

window.FEQUEST_PROTECTED_CONTENT=Object.freeze({
  version:'v376-provider-2-ipa92',
  maxBatch:MAX_BATCH,
  maxCache:MAX_CACHE,
  catalogTotal:MERGED_CATALOG_TOTAL,
  setAccessCode,
  clearAccessCode,
  hasAccessCode,
  loadCatalog,
  hydrate,
  submit,
  resumeTraceTail,
  getCachedQuestion,
  getAnsweredResult,
  forgetAnswer,
  clearHydrated,
  clearProtectedCache,
});
})();
