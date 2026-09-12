(()=>{
'use strict';

const provider=()=>globalThis.FEQUEST_PROTECTED_CONTENT;
const COMPOUND_POOL='b_compound';
const EXAM_POOL='b_exam_algo';
const COMPOUND_SIZE=3;
let mode='';
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
  console.warn('[FE QUEST v376 B exam]',message);
}
function safeId(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value)?value:''}
function cloneValue(value){
  if(Array.isArray(value))return value.map(cloneValue);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,cloneValue(item)]));
  return value;
}
function frozenObject(value){return Object.freeze(cloneValue(value&&typeof value==='object'?value:{}))}

function requireProvider(){
  const p=provider();
  if(!p||typeof p.loadCatalog!=='function'||typeof p.hydrate!=='function'||typeof p.submit!=='function')throw new Error('protected_content_provider_missing');
  return p;
}

function requestAccess(){
  const p=requireProvider();
  if(p.hasAccessCode())return Promise.resolve(true);
  if(accessPromise)return accessPromise;
  accessPromise=new Promise(resolve=>{
    const old=el('fequestV376BExamAccessDialog');if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='fequestV376BExamAccessDialog';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.52);display:grid;place-items:center;padding:20px';
    const card=document.createElement('div');
    card.style.cssText='width:min(440px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(15,23,42,.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#24313d';
    card.innerHTML='<h2 style="margin:0 0 8px;font-size:20px">テスター用アクセスコード</h2><p style="margin:0 0 14px;line-height:1.65;font-size:14px">科目Bの保護された複合問題・実戦問題を読み込むため、案内されたアクセスコードを入力してください。</p><input id="fequestV376BExamAccessInput" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" style="box-sizing:border-box;width:100%;min-height:48px;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-size:16px"><div id="fequestV376BExamAccessError" role="alert" style="min-height:20px;margin-top:6px;font-size:13px;color:#b42318"></div><div style="display:flex;gap:10px;margin-top:12px"><button type="button" id="fequestV376BExamAccessCancel" style="flex:1;min-height:46px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;font-weight:700">キャンセル</button><button type="button" id="fequestV376BExamAccessSubmit" style="flex:1;min-height:46px;border:0;border-radius:12px;background:#58cc02;color:#fff;font-weight:800">続ける</button></div>';
    overlay.appendChild(card);document.body.appendChild(overlay);
    const input=el('fequestV376BExamAccessInput'),error=el('fequestV376BExamAccessError');
    const finish=value=>{overlay.remove();accessPromise=null;resolve(value)};
    el('fequestV376BExamAccessCancel')?.addEventListener('click',()=>finish(false));
    const submit=()=>{
      try{p.setAccessCode(input?.value||'',{rememberForTab:true});finish(true)}
      catch(_e){if(error)error.textContent='アクセスコードを確認してください。'}
    };
    el('fequestV376BExamAccessSubmit')?.addEventListener('click',submit);
    input?.addEventListener('keydown',event=>{if(event.key==='Enter')submit()});
    setTimeout(()=>input?.focus(),0);
  });
  return accessPromise;
}

function assertPreSubmitQuestion(question,entry,pool){
  if(!question||question.id!==entry.id||question.sourcePool!==pool)throw new Error('b_exam_hydration_invalid');
  if(typeof question.stem!=='string'||!Array.isArray(question.options)||question.options.length!==4)throw new Error('b_exam_question_invalid');
  if('answerIndex' in question||'explanation' in question||'choiceExplanations' in question)throw new Error('b_exam_pre_submit_answer_leak');
  return question;
}
function assertRenderSafe(render,type,parentId){
  if(!render||typeof render!=='object'||render.type!==type||render.parentId!==parentId)throw new Error('b_exam_render_context_invalid');
  for(const forbidden of ['options','opts','answer','answerIndex','a','explain','explanation','choiceExplanations','point','pitfall']){
    if(Object.prototype.hasOwnProperty.call(render,forbidden))throw new Error('b_exam_render_answer_leak');
  }
  return render;
}

async function compoundCatalogEntries(parentId){
  const id=safeId(parentId);if(!id)throw new Error('b_compound_parent_id_invalid');
  const catalog=await requireProvider().loadCatalog();
  const found=(catalog?.items||[])
    .filter(item=>item?.sourcePool===COMPOUND_POOL&&item?.parentId===id)
    .sort((a,b)=>Number(a.ordinal)-Number(b.ordinal));
  if(found.length!==COMPOUND_SIZE)throw new Error('b_compound_catalog_invalid');
  for(let i=0;i<found.length;i++)if(Number(found[i]?.ordinal)!==i+1)throw new Error('b_compound_catalog_ordinal_invalid');
  if(new Set(found.map(item=>item.id)).size!==COMPOUND_SIZE)throw new Error('b_compound_catalog_duplicate_ids');
  return found;
}

async function compoundCatalog(){
  const catalog=await requireProvider().loadCatalog();
  const rows=(catalog?.items||[]).filter(item=>item?.sourcePool===COMPOUND_POOL);
  const parents=new Map();
  for(const row of rows){
    const parentId=safeId(row?.parentId);if(!parentId)continue;
    if(!parents.has(parentId))parents.set(parentId,{parentId,level:row.level||'',count:0});
    parents.get(parentId).count+=1;
  }
  const out=[...parents.values()].filter(item=>item.count===COMPOUND_SIZE).map(item=>Object.freeze({...item}));
  if(out.length!==15)throw new Error('b_compound_parent_catalog_invalid');
  return Object.freeze(out);
}

function compoundPacket(question,entry){
  assertPreSubmitQuestion(question,entry,COMPOUND_POOL);
  const render=assertRenderSafe(question.renderContext,'compound',activeParentId);
  return Object.freeze({
    mode:'compound',
    parentId:activeParentId,
    ordinal:Number(entry.ordinal),
    questionId:entry.id,
    level:entry.level||'',
    kind:entry.kind||'',
    qlevel:entry.qlevel||'',
    stem:question.stem,
    options:Object.freeze([...question.options]),
    hint:typeof question.hint==='string'?question.hint:'',
    title:typeof render.title==='string'?render.title:'複合問題',
    lead:typeof render.lead==='string'?render.lead:'',
    code:Object.freeze(Array.isArray(render.code)?cloneValue(render.code):[]),
    data:frozenObject(render.data),
  });
}

async function prepareCompound(ordinal){
  const n=Number(ordinal);
  if(mode!=='compound'||!activeParentId||entries.length!==COMPOUND_SIZE)throw new Error('b_compound_session_missing');
  if(!Number.isInteger(n)||n<1||n>COMPOUND_SIZE)throw new Error('b_compound_ordinal_invalid');
  if(n>1&&!finalizedOrdinals.has(n-1))throw new Error('b_compound_sequence_locked');
  if(preparedPackets.has(n))return preparedPackets.get(n);
  const entry=entries[n-1];
  const hydrated=await requireProvider().hydrate([entry.id]);
  const question=(hydrated?.questions||[]).find(item=>item.id===entry.id);
  const packet=compoundPacket(question,entry);
  hydratedIds.add(entry.id);
  preparedPackets.set(n,packet);
  return packet;
}

function activateCompound(ordinal){
  const n=Number(ordinal);
  const packet=preparedPackets.get(n);
  if(!packet)throw new Error('b_compound_question_not_prepared');
  if(n>1&&!finalizedOrdinals.has(n-1))throw new Error('b_compound_sequence_locked');
  const previous=activeOrdinal;
  activeOrdinal=n;
  if(previous&&previous!==n){
    const previousEntry=entries[previous-1];
    preparedPackets.delete(previous);
    if(previousEntry){
      hydratedIds.delete(previousEntry.id);
      requireProvider().forgetAnswer?.(previousEntry.id);
      requireProvider().clearHydrated?.([previousEntry.id]);
    }
  }
  return packet;
}

async function startCompound(parentId){
  clear();
  if(!(await requestAccess()))throw new Error('beta_access_cancelled');
  mode='compound';
  activeParentId=safeId(parentId);
  if(!activeParentId)throw new Error('b_compound_parent_id_invalid');
  entries=await compoundCatalogEntries(activeParentId);
  await prepareCompound(1);
  return activateCompound(1);
}

async function startCompoundSession(parentId){
  clear();
  if(!(await requestAccess()))throw new Error('beta_access_cancelled');
  mode='compound';
  activeParentId=safeId(parentId);
  if(!activeParentId)throw new Error('b_compound_parent_id_invalid');
  entries=await compoundCatalogEntries(activeParentId);
  const ids=entries.map(item=>item.id);
  const hydrated=await requireProvider().hydrate(ids);
  const questions=hydrated?.questions||[];
  const packets=[];
  for(let i=0;i<entries.length;i++){
    const entry=entries[i];
    const question=questions.find(item=>item.id===entry.id);
    const packet=compoundPacket(question,entry);
    preparedPackets.set(i+1,packet);hydratedIds.add(entry.id);packets.push(packet);
  }
  activeOrdinal=1;
  return Object.freeze(packets);
}

async function gradeCompound(questionId,choiceIndex){
  if(mode!=='compound')throw new Error('b_compound_session_missing');
  const id=safeId(questionId);if(!id)throw new Error('b_compound_question_id_invalid');
  const entry=entries[activeOrdinal-1];
  if(!entry||entry.id!==id)throw new Error('b_compound_question_not_active');
  if(!Number.isInteger(choiceIndex)||choiceIndex<0||choiceIndex>3)throw new Error('choice_index_invalid');
  const result=await requireProvider().submit(id,choiceIndex);
  if(result?.questionId!==id||typeof result?.correct!=='boolean'||!Number.isInteger(result?.answerIndex))throw new Error('b_compound_grade_invalid');
  finalizedOrdinals.add(activeOrdinal);
  const response=Object.freeze({
    questionId:id,
    correct:result.correct,
    answerIndex:result.answerIndex,
    explanation:typeof result.explanation==='string'?result.explanation:'',
    postSubmit:result.postSubmit&&typeof result.postSubmit==='object'?Object.freeze({...result.postSubmit}):Object.freeze({}),
  });
  requireProvider().forgetAnswer?.(id);
  return response;
}

async function gradeCompoundSession(choiceIndexes){
  if(mode!=='compound'||entries.length!==COMPOUND_SIZE)throw new Error('b_compound_session_missing');
  if(!Array.isArray(choiceIndexes)||choiceIndexes.length!==COMPOUND_SIZE)throw new Error('b_compound_session_answers_invalid');
  const out=[];
  for(let i=0;i<entries.length;i++){
    const entry=entries[i],choice=choiceIndexes[i],blank=choice===null||choice===undefined;
    if(!blank&&(!Number.isInteger(choice)||choice<0||choice>3))throw new Error('choice_index_invalid');
    const submitted=blank?0:choice;
    const result=await requireProvider().submit(entry.id,submitted);
    if(result?.questionId!==entry.id||typeof result?.correct!=='boolean'||!Number.isInteger(result?.answerIndex))throw new Error('b_compound_grade_invalid');
    finalizedOrdinals.add(i+1);
    out.push(Object.freeze({
      questionId:entry.id,
      blank,
      selectedChoiceIndex:blank?null:choice,
      correct:blank?false:result.correct,
      answerIndex:result.answerIndex,
      explanation:typeof result.explanation==='string'?result.explanation:'',
      postSubmit:result.postSubmit&&typeof result.postSubmit==='object'?Object.freeze({...result.postSubmit}):Object.freeze({}),
    }));
    requireProvider().forgetAnswer?.(entry.id);
  }
  return Object.freeze(out);
}

async function nextCompound(){
  if(mode!=='compound'||!activeOrdinal||!finalizedOrdinals.has(activeOrdinal))throw new Error('b_compound_current_question_unresolved');
  if(activeOrdinal>=entries.length)return null;
  const nextOrdinal=activeOrdinal+1;
  await prepareCompound(nextOrdinal);
  return activateCompound(nextOrdinal);
}

async function examCatalog(filters={}){
  const catalog=await requireProvider().loadCatalog();
  const level=typeof filters.level==='string'?filters.level:'';
  const domain=typeof filters.domain==='string'?filters.domain:'';
  const format=typeof filters.format==='string'?filters.format:'';
  const found=(catalog?.items||[]).filter(item=>item?.sourcePool===EXAM_POOL)
    .filter(item=>!level||item.level===level)
    .filter(item=>!domain||item.domain===domain)
    .filter(item=>!format||item.format===format)
    .map(item=>Object.freeze({id:item.id,parentId:item.parentId||'',ordinal:Number(item.ordinal)||1,level:item.level||'',domain:item.domain||'',format:item.format||''}));
  if(found.length<1)throw new Error('b_exam_catalog_empty');
  return Object.freeze(found);
}

function examPacket(question,entry){
  assertPreSubmitQuestion(question,entry,EXAM_POOL);
  const parentId=safeId(entry.parentId);if(!parentId)throw new Error('b_exam_parent_id_invalid');
  const render=assertRenderSafe(question.renderContext,'exam',parentId);
  return Object.freeze({
    mode:'exam',
    parentId,
    ordinal:1,
    questionId:entry.id,
    level:entry.level||'',
    domain:entry.domain||'',
    format:entry.format||'',
    stem:question.stem,
    options:Object.freeze([...question.options]),
    hint:typeof question.hint==='string'?question.hint:'',
    title:typeof render.title==='string'?render.title:'科目B 実戦問題',
    context:typeof render.context==='string'?render.context:'',
    code:Object.freeze(Array.isArray(render.code)?cloneValue(render.code):[]),
    data:frozenObject(render.data),
  });
}

async function startExam(questionId){
  clear();
  if(!(await requestAccess()))throw new Error('beta_access_cancelled');
  const id=safeId(questionId);if(!id)throw new Error('b_exam_question_id_invalid');
  const catalog=await requireProvider().loadCatalog();
  const entry=(catalog?.items||[]).find(item=>item?.sourcePool===EXAM_POOL&&item?.id===id);
  if(!entry)throw new Error('b_exam_question_not_in_catalog');
  const hydrated=await requireProvider().hydrate([id]);
  const question=(hydrated?.questions||[]).find(item=>item.id===id);
  const packet=examPacket(question,entry);
  mode='exam';activeParentId=safeId(entry.parentId);entries=[entry];activeOrdinal=1;
  hydratedIds.add(id);preparedPackets.set(1,packet);
  return packet;
}

async function gradeExam(questionId,choiceIndex){
  if(mode!=='exam')throw new Error('b_exam_session_missing');
  const id=safeId(questionId);if(!id||entries[0]?.id!==id)throw new Error('b_exam_question_not_active');
  if(!Number.isInteger(choiceIndex)||choiceIndex<0||choiceIndex>3)throw new Error('choice_index_invalid');
  const result=await requireProvider().submit(id,choiceIndex);
  if(result?.questionId!==id||typeof result?.correct!=='boolean'||!Number.isInteger(result?.answerIndex))throw new Error('b_exam_grade_invalid');
  finalizedOrdinals.add(1);
  const response=Object.freeze({
    questionId:id,
    correct:result.correct,
    answerIndex:result.answerIndex,
    explanation:typeof result.explanation==='string'?result.explanation:'',
    postSubmit:result.postSubmit&&typeof result.postSubmit==='object'?Object.freeze({...result.postSubmit}):Object.freeze({}),
  });
  requireProvider().forgetAnswer?.(id);
  return response;
}

function clear(){
  const ids=[...hydratedIds];
  hydratedIds.clear();
  mode='';activeParentId='';entries=[];activeOrdinal=0;preparedPackets.clear();finalizedOrdinals.clear();
  if(ids.length)provider()?.clearHydrated?.(ids);
  return ids.length;
}
function state(){return Object.freeze({mode,parentId:activeParentId,activeOrdinal,finalizedOrdinals:Object.freeze([...finalizedOrdinals]),preparedOrdinals:Object.freeze([...preparedPackets.keys()]),hydratedIds:Object.freeze([...hydratedIds])})}
function reportError(error){
  if(error?.status===401||error?.status===403||String(error?.message||'').startsWith('beta_access'))provider()?.clearAccessCode?.();
  toast('科目Bの複合問題・実戦問題の読み込みまたは採点に失敗しました。通信状態とアクセスコードを確認してください。');
}

globalThis.FEQUEST_V376_B_EXAM=Object.freeze({
  version:'v376-b-exam-2',
  compoundCatalog,
  startCompound,
  startCompoundSession,
  gradeCompound,
  gradeCompoundSession,
  nextCompound,
  examCatalog,
  startExam,
  gradeExam,
  clear,
  state,
  reportError,
});
})();
