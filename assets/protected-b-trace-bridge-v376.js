(()=>{
'use strict';

const provider=()=>globalThis.FEQUEST_PROTECTED_CONTENT;
const SOURCE_POOL='b_exercise';
let activeParentId='';
let entries=[];
let activeOrdinal=0;
const resolvedOrdinals=new Set();
const hydratedIds=new Set();
let accessPromise=null;

function el(id){return document.getElementById(id)}
function toast(message){
  try{if(typeof popToast==='function')return popToast(message)}catch(_e){}
  console.warn('[FE QUEST v376 B trace]',message);
}

function requestAccess(){
  const p=provider();
  if(!p||typeof p.loadCatalog!=='function'||typeof p.hydrate!=='function'||typeof p.submit!=='function')throw new Error('protected_content_provider_missing');
  if(p.hasAccessCode())return Promise.resolve(true);
  if(accessPromise)return accessPromise;
  accessPromise=new Promise(resolve=>{
    const old=el('fequestV376BTraceAccessDialog');if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='fequestV376BTraceAccessDialog';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.52);display:grid;place-items:center;padding:20px';
    const card=document.createElement('div');
    card.style.cssText='width:min(440px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(15,23,42,.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#24313d';
    card.innerHTML='<h2 style="margin:0 0 8px;font-size:20px">テスター用アクセスコード</h2><p style="margin:0 0 14px;line-height:1.65;font-size:14px">科目Bの保護された演習を読み込むため、案内されたアクセスコードを入力してください。</p><input id="fequestV376BTraceAccessInput" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" style="box-sizing:border-box;width:100%;min-height:48px;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-size:16px"><div id="fequestV376BTraceAccessError" role="alert" style="min-height:20px;margin-top:6px;font-size:13px;color:#b42318"></div><div style="display:flex;gap:10px;margin-top:12px"><button type="button" id="fequestV376BTraceAccessCancel" style="flex:1;min-height:46px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;font-weight:700">キャンセル</button><button type="button" id="fequestV376BTraceAccessSubmit" style="flex:1;min-height:46px;border:0;border-radius:12px;background:#58cc02;color:#fff;font-weight:800">続ける</button></div>';
    overlay.appendChild(card);document.body.appendChild(overlay);
    const input=el('fequestV376BTraceAccessInput'),error=el('fequestV376BTraceAccessError');
    const finish=value=>{overlay.remove();accessPromise=null;resolve(value)};
    el('fequestV376BTraceAccessCancel')?.addEventListener('click',()=>finish(false));
    const submit=()=>{
      try{p.setAccessCode(input?.value||'',{rememberForTab:true});finish(true)}
      catch(_e){if(error)error.textContent='アクセスコードを確認してください。'}
    };
    el('fequestV376BTraceAccessSubmit')?.addEventListener('click',submit);
    input?.addEventListener('keydown',event=>{if(event.key==='Enter')submit()});
    setTimeout(()=>input?.focus(),0);
  });
  return accessPromise;
}

function safeId(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value)?value:''}
function cloneValue(value){
  if(Array.isArray(value))return value.map(cloneValue);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,cloneValue(item)]));
  return value;
}

async function catalogEntries(parentId){
  const id=safeId(parentId);if(!id)throw new Error('b_trace_parent_id_invalid');
  const catalog=await provider().loadCatalog();
  const found=(catalog?.items||[])
    .filter(item=>item?.sourcePool===SOURCE_POOL&&item?.parentId===id)
    .sort((a,b)=>Number(a.ordinal)-Number(b.ordinal));
  if(found.length!==2||Number(found[0]?.ordinal)!==1||Number(found[1]?.ordinal)!==2)throw new Error('b_trace_catalog_invalid');
  if(new Set(found.map(item=>item.id)).size!==2)throw new Error('b_trace_catalog_duplicate_ids');
  return found;
}

function validatePacketQuestion(question,entry){
  if(!question||question.id!==entry.id||question.sourcePool!==SOURCE_POOL)throw new Error('b_trace_hydration_invalid');
  if(typeof question.stem!=='string'||!Array.isArray(question.options)||question.options.length!==4)throw new Error('b_trace_question_invalid');
  if('answerIndex' in question||'explanation' in question||'choiceExplanations' in question)throw new Error('b_trace_pre_submit_answer_leak');
  const render=question.renderContext;
  const segment=Array.isArray(render?.traceSegment)?{...render,...render.visual,steps:render.traceSegment}:render?.traceSegment;
  if(!segment||typeof segment!=='object'||!Array.isArray(segment.steps)||segment.steps.length<1)throw new Error('b_trace_segment_invalid');
  for(const step of segment.steps){
    if(!step||typeof step!=='object')throw new Error('b_trace_step_invalid');
    if('predict' in step||'answer' in step||'answerIndex' in step||'a' in step)throw new Error('b_trace_future_answer_leak');
  }
  return segment;
}

async function loadOrdinal(ordinal){
  if(!activeParentId||entries.length!==2)throw new Error('b_trace_session_missing');
  const n=Number(ordinal);
  if(!Number.isInteger(n)||n<1||n>2)throw new Error('b_trace_ordinal_invalid');
  if(n>1&&!resolvedOrdinals.has(n-1))throw new Error('b_trace_sequence_locked');
  const entry=entries[n-1];
  const hydrated=await provider().hydrate([entry.id]);
  const question=(hydrated?.questions||[]).find(item=>item.id===entry.id);
  const segment=validatePacketQuestion(question,entry);
  hydratedIds.add(entry.id);
  activeOrdinal=n;
  return Object.freeze({
    parentId:activeParentId,
    ordinal:n,
    questionId:entry.id,
    level:entry.level||'',
    concept:entry.concept||'',
    stem:question.stem,
    options:Object.freeze([...question.options]),
    hint:typeof question.hint==='string'?question.hint:'',
    traceSegment:Object.freeze(cloneValue(segment)),
  });
}

async function start(parentId,ordinal=1){
  if(!Number.isInteger(ordinal)||ordinal<1||ordinal>2)throw new Error('b_trace_resume_ordinal_invalid');
  clear();
  if(!(await requestAccess()))throw new Error('beta_access_cancelled');
  activeParentId=safeId(parentId);
  if(!activeParentId)throw new Error('b_trace_parent_id_invalid');
  entries=await catalogEntries(activeParentId);
  // Saved position permits navigation only; it grants no answer, XP or completion.
  if(ordinal===2)resolvedOrdinals.add(1);
  return loadOrdinal(ordinal);
}

function tailPacket(segment,choiceIndex){
  if(!segment||!Array.isArray(segment.steps)||!segment.steps.length)throw new Error('b_trace_tail_unavailable');
  if(segment.steps.some(step=>!step||typeof step!=='object'||['predict','answer','answerIndex','a'].some(key=>key in step)))throw new Error('b_trace_tail_invalid');
  return Object.freeze({parentId:activeParentId,ordinal:2,questionId:entries[1].id,phase:'tail',choiceIndex,
    level:entries[1].level||'',concept:entries[1].concept||'',traceSegment:Object.freeze(cloneValue(segment))});
}
async function resumeTail(parentId,choiceIndex){
  const legacyResume=choiceIndex===null;
  if(!legacyResume&&(!Number.isInteger(choiceIndex)||choiceIndex<0||choiceIndex>3))throw new Error('b_trace_resume_choice_invalid');
  const packet=await start(parentId,2);
  if(legacyResume){
    if(typeof provider().resumeTraceTail!=='function')throw new Error('b_trace_tail_resume_provider_missing');
    const segment=await provider().resumeTraceTail(packet.questionId);
    const tail=tailPacket(segment,null);
    resolvedOrdinals.add(2);
    return tail;
  }
  const result=await grade(packet.questionId,choiceIndex);
  if(!result.correct||!result.tail)throw new Error('b_trace_resume_answer_mismatch');
  return result.tail;
}
async function grade(questionId,choiceIndex){
  const id=safeId(questionId);if(!id)throw new Error('b_trace_question_id_invalid');
  const active=entries[activeOrdinal-1];
  if(!active||active.id!==id)throw new Error('b_trace_question_not_active');
  if(!Number.isInteger(choiceIndex)||choiceIndex<0||choiceIndex>3)throw new Error('choice_index_invalid');
  try{
    const result=await provider().submit(id,choiceIndex);
    if(result?.questionId!==id||typeof result?.correct!=='boolean')throw new Error('b_trace_grade_invalid');
    const tail=result.correct&&activeOrdinal===2?tailPacket(result.postSubmit?.traceTail,choiceIndex):null;
    if(result.correct)resolvedOrdinals.add(activeOrdinal);
    return Object.freeze({
      questionId:id,
      tail,
      correct:result.correct,
      explanation:result.correct&&typeof result.explanation==='string'?result.explanation:'',
      postSubmit:result.correct&&result.postSubmit&&typeof result.postSubmit==='object'?Object.freeze({...result.postSubmit}):Object.freeze({}),
    });
  }finally{
    provider()?.forgetAnswer?.(id);
  }
}

async function next(){
  if(!activeOrdinal||!resolvedOrdinals.has(activeOrdinal))throw new Error('b_trace_current_prediction_unresolved');
  if(activeOrdinal>=entries.length)return null;
  return loadOrdinal(activeOrdinal+1);
}

function clear(){
  const ids=[...hydratedIds];
  hydratedIds.clear();
  activeParentId='';entries=[];activeOrdinal=0;resolvedOrdinals.clear();
  if(ids.length)provider()?.clearHydrated?.(ids);
  return ids.length;
}

function state(){return Object.freeze({parentId:activeParentId,activeOrdinal,resolvedOrdinals:Object.freeze([...resolvedOrdinals]),hydratedIds:Object.freeze([...hydratedIds])})}
function reportError(error){
  if(error?.status===401||error?.status===403||String(error?.message||'').startsWith('beta_access'))provider()?.clearAccessCode?.();
  toast('科目Bの問題読み込みまたは採点に失敗しました。通信状態とアクセスコードを確認してください。');
}

globalThis.FEQUEST_V376_B_TRACE=Object.freeze({
  version:'v376-b-trace-1',
  start,
  resume:(parentId,ordinal)=>start(parentId,ordinal),
  resumeTail,
  grade,
  next,
  clear,
  state,
  reportError,
});
})();
