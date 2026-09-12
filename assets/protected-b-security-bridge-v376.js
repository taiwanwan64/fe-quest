(()=>{
'use strict';

const provider=()=>globalThis.FEQUEST_PROTECTED_CONTENT;
const SOURCE_POOL='b_security';
const STEPS_PER_SCENARIO=3;
let activeParentId='';
let entries=[];
let activeOrdinal=0;
const preparedPackets=new Map();
const finalizedOrdinals=new Set();
const hydratedIds=new Set();
let accessPromise=null;

function el(id){return document.getElementById(id)}
function toast(message){
  try{if(typeof popToast==='function')return popToast(message)}catch(_e){}
  console.warn('[FE QUEST v376 B security]',message);
}

function requestAccess(){
  const p=provider();
  if(!p||typeof p.loadCatalog!=='function'||typeof p.hydrate!=='function'||typeof p.submit!=='function')throw new Error('protected_content_provider_missing');
  if(p.hasAccessCode())return Promise.resolve(true);
  if(accessPromise)return accessPromise;
  accessPromise=new Promise(resolve=>{
    const old=el('fequestV376BSecurityAccessDialog');if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='fequestV376BSecurityAccessDialog';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.52);display:grid;place-items:center;padding:20px';
    const card=document.createElement('div');
    card.style.cssText='width:min(440px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(15,23,42,.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#24313d';
    card.innerHTML='<h2 style="margin:0 0 8px;font-size:20px">テスター用アクセスコード</h2><p style="margin:0 0 14px;line-height:1.65;font-size:14px">科目Bの保護されたセキュリティ演習を読み込むため、案内されたアクセスコードを入力してください。</p><input id="fequestV376BSecurityAccessInput" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" style="box-sizing:border-box;width:100%;min-height:48px;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-size:16px"><div id="fequestV376BSecurityAccessError" role="alert" style="min-height:20px;margin-top:6px;font-size:13px;color:#b42318"></div><div style="display:flex;gap:10px;margin-top:12px"><button type="button" id="fequestV376BSecurityAccessCancel" style="flex:1;min-height:46px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;font-weight:700">キャンセル</button><button type="button" id="fequestV376BSecurityAccessSubmit" style="flex:1;min-height:46px;border:0;border-radius:12px;background:#58cc02;color:#fff;font-weight:800">続ける</button></div>';
    overlay.appendChild(card);document.body.appendChild(overlay);
    const input=el('fequestV376BSecurityAccessInput'),error=el('fequestV376BSecurityAccessError');
    const finish=value=>{overlay.remove();accessPromise=null;resolve(value)};
    el('fequestV376BSecurityAccessCancel')?.addEventListener('click',()=>finish(false));
    const submit=()=>{
      try{p.setAccessCode(input?.value||'',{rememberForTab:true});finish(true)}
      catch(_e){if(error)error.textContent='アクセスコードを確認してください。'}
    };
    el('fequestV376BSecurityAccessSubmit')?.addEventListener('click',submit);
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
function frozenObject(value){return Object.freeze(cloneValue(value&&typeof value==='object'?value:{}))}

async function catalogEntries(parentId){
  const id=safeId(parentId);if(!id)throw new Error('b_security_parent_id_invalid');
  const catalog=await provider().loadCatalog();
  const found=(catalog?.items||[])
    .filter(item=>item?.sourcePool===SOURCE_POOL&&item?.parentId===id)
    .sort((a,b)=>Number(a.ordinal)-Number(b.ordinal));
  if(found.length!==STEPS_PER_SCENARIO)throw new Error('b_security_catalog_invalid');
  for(let i=0;i<found.length;i++)if(Number(found[i]?.ordinal)!==i+1)throw new Error('b_security_catalog_ordinal_invalid');
  if(new Set(found.map(item=>item.id)).size!==STEPS_PER_SCENARIO)throw new Error('b_security_catalog_duplicate_ids');
  return found;
}

function packetFrom(question,entry){
  if(!question||question.id!==entry.id||question.sourcePool!==SOURCE_POOL)throw new Error('b_security_hydration_invalid');
  if(typeof question.stem!=='string'||!Array.isArray(question.options)||question.options.length!==4)throw new Error('b_security_question_invalid');
  if('answerIndex' in question||'explanation' in question||'choiceExplanations' in question)throw new Error('b_security_pre_submit_answer_leak');
  const render=question.renderContext;
  if(!render||typeof render!=='object'||render.type!=='security'||render.parentId!==activeParentId)throw new Error('b_security_render_context_invalid');
  for(const forbidden of ['options','opts','answer','answerIndex','a','explain','explanation','choiceExplanations']){
    if(Object.prototype.hasOwnProperty.call(render,forbidden))throw new Error('b_security_render_answer_leak');
  }
  return Object.freeze({
    parentId:activeParentId,
    ordinal:Number(entry.ordinal),
    questionId:entry.id,
    level:entry.level||'',
    concept:entry.concept||'',
    stem:question.stem,
    options:Object.freeze([...question.options]),
    hint:typeof question.hint==='string'?question.hint:'',
    title:typeof render.title==='string'?render.title:'セキュリティ・ケース演習',
    icon:typeof render.icon==='string'?render.icon:'🛡️',
    desc:typeof render.desc==='string'?render.desc:'',
    incident:frozenObject(render.incident),
    evidence:Object.freeze(Array.isArray(render.evidence)?cloneValue(render.evidence):[]),
    log:typeof render.log==='string'?render.log:'',
    risk:frozenObject(render.risk),
  });
}

async function hydrateOrdinal(ordinal){
  const n=Number(ordinal);
  if(!activeParentId||entries.length!==STEPS_PER_SCENARIO)throw new Error('b_security_session_missing');
  if(!Number.isInteger(n)||n<1||n>STEPS_PER_SCENARIO)throw new Error('b_security_ordinal_invalid');
  if(n>1&&!finalizedOrdinals.has(n-1))throw new Error('b_security_sequence_locked');
  if(preparedPackets.has(n))return preparedPackets.get(n);
  const entry=entries[n-1];
  const hydrated=await provider().hydrate([entry.id]);
  const question=(hydrated?.questions||[]).find(item=>item.id===entry.id);
  const packet=packetFrom(question,entry);
  hydratedIds.add(entry.id);
  preparedPackets.set(n,packet);
  return packet;
}

function activate(ordinal){
  const n=Number(ordinal);
  const packet=preparedPackets.get(n);
  if(!packet)throw new Error('b_security_step_not_prepared');
  if(n>1&&!finalizedOrdinals.has(n-1))throw new Error('b_security_sequence_locked');
  const previous=activeOrdinal;
  activeOrdinal=n;
  if(previous&&previous!==n){
    const previousEntry=entries[previous-1];
    preparedPackets.delete(previous);
    if(previousEntry){
      hydratedIds.delete(previousEntry.id);
      provider()?.forgetAnswer?.(previousEntry.id);
      provider()?.clearHydrated?.([previousEntry.id]);
    }
  }
  return packet;
}

async function start(parentId,ordinal=1,answered=false){
  if(!Number.isInteger(ordinal)||ordinal<1||ordinal>3||typeof answered!=='boolean')throw new Error('b_security_resume_invalid');
  clear();
  if(!(await requestAccess()))throw new Error('beta_access_cancelled');
  activeParentId=safeId(parentId);
  if(!activeParentId)throw new Error('b_security_parent_id_invalid');
  entries=await catalogEntries(activeParentId);
  for(let n=1;n<ordinal;n++)finalizedOrdinals.add(n);
  if(answered)finalizedOrdinals.add(ordinal);
  await hydrateOrdinal(ordinal);
  return activate(ordinal);
}

async function grade(questionId,choiceIndex,{finalAttempt=false}={}){
  const id=safeId(questionId);if(!id)throw new Error('b_security_question_id_invalid');
  const entry=entries[activeOrdinal-1];
  if(!entry||entry.id!==id)throw new Error('b_security_question_not_active');
  if(!Number.isInteger(choiceIndex)||choiceIndex<0||choiceIndex>3)throw new Error('choice_index_invalid');
  if(finalizedOrdinals.has(activeOrdinal))throw new Error('b_security_already_finalized');
  const result=await provider().submit(id,choiceIndex);
  if(result?.questionId!==id||typeof result?.correct!=='boolean'||!Number.isInteger(result?.answerIndex))throw new Error('b_security_grade_invalid');
  const finalized=result.correct||finalAttempt===true;
  if(finalized)finalizedOrdinals.add(activeOrdinal);
  if(!finalized){
    provider()?.forgetAnswer?.(id);
    return Object.freeze({questionId:id,correct:false,finalized:false});
  }
  const response=Object.freeze({
    questionId:id,
    correct:result.correct,
    finalized:true,
    answerIndex:result.answerIndex,
    explanation:typeof result.explanation==='string'?result.explanation:'',
    postSubmit:result.postSubmit&&typeof result.postSubmit==='object'?Object.freeze({...result.postSubmit}):Object.freeze({}),
  });
  provider()?.forgetAnswer?.(id);
  return response;
}

async function prepareNext(){
  if(!activeOrdinal||!finalizedOrdinals.has(activeOrdinal))throw new Error('b_security_current_step_unresolved');
  if(activeOrdinal>=entries.length)return null;
  return hydrateOrdinal(activeOrdinal+1);
}

function packet(ordinal){return activate(ordinal)}

function clear(){
  const ids=[...hydratedIds];
  hydratedIds.clear();
  activeParentId='';entries=[];activeOrdinal=0;preparedPackets.clear();finalizedOrdinals.clear();
  if(ids.length)provider()?.clearHydrated?.(ids);
  return ids.length;
}

function state(){return Object.freeze({parentId:activeParentId,activeOrdinal,finalizedOrdinals:Object.freeze([...finalizedOrdinals]),preparedOrdinals:Object.freeze([...preparedPackets.keys()]),hydratedIds:Object.freeze([...hydratedIds])})}
function reportError(error){
  if(error?.status===401||error?.status===403||String(error?.message||'').startsWith('beta_access'))provider()?.clearAccessCode?.();
  toast('セキュリティ演習の問題読み込みまたは採点に失敗しました。通信状態とアクセスコードを確認してください。');
}

globalThis.FEQUEST_V376_B_SECURITY=Object.freeze({
  version:'v376-b-security-1',
  start,
  resume:(parentId,ordinal,answered)=>start(parentId,ordinal,answered),
  grade,
  prepareNext,
  packet,
  clear,
  state,
  reportError,
});
})();
