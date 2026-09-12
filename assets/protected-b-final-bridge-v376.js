(()=>{
'use strict';

const provider=()=>globalThis.FEQUEST_PROTECTED_CONTENT;
const EXAM_POOL='b_exam_algo';
const SECURITY_POOL='b_security';
const FINAL_SIZE=20;
const FINAL_ALGO_SIZE=16;
const FINAL_SECURITY_SIZE=4;
let mode='';
let entries=[];
const hydratedIds=new Set();
let accessPromise=null;

function el(id){return document.getElementById(id)}
function toast(message){
  try{if(typeof popToast==='function')return popToast(message)}catch(_e){}
  console.warn('[FE QUEST v376 B final]',message);
}
function safeId(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value)?value:''}
function cloneValue(value){
  if(Array.isArray(value))return value.map(cloneValue);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,cloneValue(item)]));
  return value;
}
function freezeClone(value){
  const cloned=cloneValue(value);
  return cloned&&typeof cloned==='object'?Object.freeze(cloned):cloned;
}
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
    const old=el('fequestV376BFinalAccessDialog');if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='fequestV376BFinalAccessDialog';
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.52);display:grid;place-items:center;padding:20px';
    const card=document.createElement('div');
    card.style.cssText='width:min(440px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(15,23,42,.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#24313d';
    card.innerHTML='<h2 style="margin:0 0 8px;font-size:20px">テスター用アクセスコード</h2><p style="margin:0 0 14px;line-height:1.65;font-size:14px">科目B総合実戦の保護された20問を読み込むため、案内されたアクセスコードを入力してください。</p><input id="fequestV376BFinalAccessInput" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" style="box-sizing:border-box;width:100%;min-height:48px;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-size:16px"><div id="fequestV376BFinalAccessError" role="alert" style="min-height:20px;margin-top:6px;font-size:13px;color:#b42318"></div><div style="display:flex;gap:10px;margin-top:12px"><button type="button" id="fequestV376BFinalAccessCancel" style="flex:1;min-height:46px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;font-weight:700">キャンセル</button><button type="button" id="fequestV376BFinalAccessSubmit" style="flex:1;min-height:46px;border:0;border-radius:12px;background:#58cc02;color:#fff;font-weight:800">続ける</button></div>';
    overlay.appendChild(card);document.body.appendChild(overlay);
    const input=el('fequestV376BFinalAccessInput'),error=el('fequestV376BFinalAccessError');
    const finish=value=>{overlay.remove();accessPromise=null;resolve(value)};
    el('fequestV376BFinalAccessCancel')?.addEventListener('click',()=>finish(false));
    const submit=()=>{
      try{p.setAccessCode(input?.value||'',{rememberForTab:true});finish(true)}
      catch(_e){if(error)error.textContent='アクセスコードを確認してください。'}
    };
    el('fequestV376BFinalAccessSubmit')?.addEventListener('click',submit);
    input?.addEventListener('keydown',event=>{if(event.key==='Enter')submit()});
    setTimeout(()=>input?.focus(),0);
  });
  return accessPromise;
}

function assertPreSubmitQuestion(question,entry){
  if(!question||question.id!==entry.id||question.sourcePool!==entry.sourcePool)throw new Error('b_final_hydration_invalid');
  if(typeof question.stem!=='string'||!Array.isArray(question.options)||question.options.length!==4)throw new Error('b_final_question_invalid');
  if('answerIndex' in question||'explanation' in question||'choiceExplanations' in question)throw new Error('b_final_pre_submit_answer_leak');
  return question;
}
function assertRenderSafe(render,type,parentId){
  if(!render||typeof render!=='object'||render.type!==type||render.parentId!==parentId)throw new Error('b_final_render_context_invalid');
  for(const forbidden of ['options','opts','answer','answerIndex','a','explain','explanation','choiceExplanations','point','pitfall']){
    if(Object.prototype.hasOwnProperty.call(render,forbidden))throw new Error('b_final_render_answer_leak');
  }
  return render;
}

async function catalogEntries(questionIds){
  if(!Array.isArray(questionIds)||questionIds.length!==FINAL_SIZE)throw new Error('b_final_question_count_invalid');
  const ids=questionIds.map(safeId);
  if(ids.some(id=>!id)||new Set(ids).size!==FINAL_SIZE)throw new Error('b_final_question_ids_invalid');
  const catalog=await requireProvider().loadCatalog();
  const byId=new Map((catalog?.items||[]).map(item=>[item.id,item]));
  const found=ids.map(id=>byId.get(id));
  if(found.some(item=>!item))throw new Error('b_final_catalog_item_missing');
  const algo=found.filter(item=>item.sourcePool===EXAM_POOL);
  const security=found.filter(item=>item.sourcePool===SECURITY_POOL);
  if(algo.length!==FINAL_ALGO_SIZE||security.length!==FINAL_SECURITY_SIZE)throw new Error('b_final_pool_mix_invalid');
  if(found.some(item=>item.sourcePool!==EXAM_POOL&&item.sourcePool!==SECURITY_POOL))throw new Error('b_final_pool_invalid');
  return found;
}

function algoPacket(question,entry){
  assertPreSubmitQuestion(question,entry);
  const parentId=safeId(entry.parentId);if(!parentId)throw new Error('b_final_algo_parent_invalid');
  const render=assertRenderSafe(question.renderContext,'exam',parentId);
  return Object.freeze({
    mode:'final',kind:'algo',questionId:entry.id,parentId,ordinal:1,
    level:entry.level||'',domain:entry.domain||'',format:entry.format||'',
    stem:question.stem,options:Object.freeze([...question.options]),hint:typeof question.hint==='string'?question.hint:'',
    title:typeof render.title==='string'?render.title:'科目B 実戦問題',
    context:typeof render.context==='string'?render.context:'',
    code:freezeClone(Array.isArray(render.code)?render.code:[]),
    data:freezeClone(Array.isArray(render.data)?render.data:[]),
  });
}
function securityPacket(question,entry){
  assertPreSubmitQuestion(question,entry);
  const parentId=safeId(entry.parentId);if(!parentId)throw new Error('b_final_security_parent_invalid');
  const render=assertRenderSafe(question.renderContext,'security',parentId);
  return Object.freeze({
    mode:'final',kind:'security',questionId:entry.id,parentId,ordinal:Number(entry.ordinal)||1,
    level:entry.level||'',concept:entry.concept||'',format:render.log?'ログ読解':'ケース判断',
    stem:question.stem,options:Object.freeze([...question.options]),hint:typeof question.hint==='string'?question.hint:'',
    title:typeof render.title==='string'?render.title:'情報セキュリティ',icon:typeof render.icon==='string'?render.icon:'🛡️',
    desc:typeof render.desc==='string'?render.desc:'',incident:freezeClone(render.incident||{}),
    evidence:freezeClone(Array.isArray(render.evidence)?render.evidence:[]),log:typeof render.log==='string'?render.log:null,risk:!!render.risk,
  });
}

async function startSession(questionIds){
  clear();
  if(!(await requestAccess()))throw new Error('beta_access_cancelled');
  entries=await catalogEntries(questionIds);
  const ids=entries.map(item=>item.id);
  const hydrated=await requireProvider().hydrate(ids);
  const questions=hydrated?.questions||[];
  if(questions.length!==FINAL_SIZE)throw new Error('b_final_hydration_incomplete');
  const packets=entries.map(entry=>{
    const question=questions.find(item=>item.id===entry.id);
    const packet=entry.sourcePool===EXAM_POOL?algoPacket(question,entry):securityPacket(question,entry);
    hydratedIds.add(entry.id);
    return packet;
  });
  mode='final';
  return Object.freeze(packets);
}

async function gradeSession(choiceIndexes){
  if(mode!=='final'||entries.length!==FINAL_SIZE)throw new Error('b_final_session_missing');
  if(!Array.isArray(choiceIndexes)||choiceIndexes.length!==FINAL_SIZE)throw new Error('b_final_answers_invalid');
  const out=[];
  for(let i=0;i<entries.length;i++){
    const entry=entries[i],choice=choiceIndexes[i],blank=choice===null||choice===undefined;
    if(!blank&&(!Number.isInteger(choice)||choice<0||choice>3))throw new Error('choice_index_invalid');
    const submitted=blank?0:choice;
    const result=await requireProvider().submit(entry.id,submitted);
    if(result?.questionId!==entry.id||typeof result?.correct!=='boolean'||!Number.isInteger(result?.answerIndex))throw new Error('b_final_grade_invalid');
    out.push(Object.freeze({
      questionId:entry.id,kind:entry.sourcePool===EXAM_POOL?'algo':'security',blank,
      selectedChoiceIndex:blank?null:choice,correct:blank?false:result.correct,answerIndex:result.answerIndex,
      explanation:typeof result.explanation==='string'?result.explanation:'',
      postSubmit:result.postSubmit&&typeof result.postSubmit==='object'?Object.freeze({...result.postSubmit}):Object.freeze({}),
    }));
    requireProvider().forgetAnswer?.(entry.id);
  }
  return Object.freeze(out);
}

function clear(){
  const ids=[...hydratedIds];hydratedIds.clear();mode='';entries=[];
  if(ids.length)provider()?.clearHydrated?.(ids);
  return ids.length;
}
function state(){return Object.freeze({mode,questionIds:Object.freeze(entries.map(item=>item.id)),hydratedIds:Object.freeze([...hydratedIds])})}
function reportError(error){
  if(error?.status===401||error?.status===403||String(error?.message||'').startsWith('beta_access'))provider()?.clearAccessCode?.();
  toast('科目B総合実戦の読み込みまたは採点に失敗しました。通信状態とアクセスコードを確認してください。');
}

globalThis.FEQUEST_V376_B_FINAL=Object.freeze({
  version:'v376-b-final-1',
  startSession,
  gradeSession,
  clear,
  state,
  reportError,
});
})();
