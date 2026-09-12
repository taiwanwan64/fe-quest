(()=>{
'use strict';

const GATE_URL='https://gkvgxnkoypypikxtyeoz.supabase.co/functions/v1/fequest-lesson-gate-v376';
const ACCESS_SESSION_KEY='fequest_beta_access_v376';
const REQUEST_TIMEOUT_MS=15000;
let memoryAccessCode='';
let activeLesson=null;
let inflight=null;
let requestGeneration=0;

function normalizeCode(value){const code=typeof value==='string'?value.trim():'';if(code.length<12||code.length>160)throw new Error('beta_access_invalid');return code;}
function readSessionAccessCode(){try{return sessionStorage.getItem(ACCESS_SESSION_KEY)||''}catch(_e){return ''}}
function currentAccessCode(){if(memoryAccessCode)return memoryAccessCode;const stored=readSessionAccessCode();if(stored){memoryAccessCode=stored;return stored}throw new Error('beta_access_required');}
function setAccessCode(value,{rememberForTab=true}={}){const code=normalizeCode(value);memoryAccessCode=code;try{if(rememberForTab)sessionStorage.setItem(ACCESS_SESSION_KEY,code);else sessionStorage.removeItem(ACCESS_SESSION_KEY)}catch(_e){}return true;}
function clearAccessCode(){memoryAccessCode='';try{sessionStorage.removeItem(ACCESS_SESSION_KEY)}catch(_e){}clearCurrent();}
function hasAccessCode(){return !!(memoryAccessCode||readSessionAccessCode());}
function validLessonId(id){return typeof id==='string'&&/^core_\d{2}_\d{2}$/.test(id);}
function freezePayload(value){if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('lesson_payload_invalid');return Object.freeze({...value});}
async function fetchJson(options,controller){const timer=setTimeout(()=>controller.abort('timeout'),REQUEST_TIMEOUT_MS);try{const response=await fetch(GATE_URL,{...options,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});let data={};try{data=await response.json()}catch(_e){}if(!response.ok){const error=new Error(typeof data?.error==='string'?data.error:`request_failed_${response.status}`);error.status=response.status;throw error;}return data;}catch(error){if(error?.name==='AbortError'){const reason=controller.signal.reason;if(reason==='superseded')throw new Error('lesson_request_superseded');if(reason==='cancelled')throw new Error('lesson_request_cancelled');throw new Error('lesson_service_timeout');}throw error;}finally{clearTimeout(timer);}}
function clearCurrent(){requestGeneration++;if(inflight?.controller)inflight.controller.abort('cancelled');activeLesson=null;inflight=null;}
function getCurrent(id){if(id!==undefined&&activeLesson?.lessonId!==id)return null;return activeLesson;}
async function hydrate(id,{force=false}={}){
  if(!validLessonId(id))throw new Error('lesson_id_invalid');
  if(!force&&activeLesson?.lessonId===id)return activeLesson;
  if(inflight?.id===id)return inflight.promise;
  if(inflight?.controller)inflight.controller.abort('superseded');
  activeLesson=null;
  const generation=++requestGeneration;
  const controller=new AbortController();
  const promise=(async()=>{
    const data=await fetchJson({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'lesson',accessCode:currentAccessCode(),lessonId:id})},controller);
    if(generation!==requestGeneration)throw new Error('lesson_request_superseded');
    if(data?.lessonId!==id)throw new Error('lesson_payload_invalid');
    const record=Object.freeze({lessonId:id,payload:freezePayload(data.payload),remainingToday:Number.isFinite(Number(data.remainingToday))?Number(data.remainingToday):null});
    activeLesson=record;
    return record;
  })().finally(()=>{if(inflight?.generation===generation)inflight=null;});
  inflight={id,promise,controller,generation};
  return promise;
}

window.FEQUEST_PROTECTED_LESSONS=Object.freeze({version:'v376-lesson-provider-2',setAccessCode,clearAccessCode,hasAccessCode,hydrate,getCurrent,clearCurrent});
})();
