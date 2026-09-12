(()=>{
'use strict';

const provider=()=>globalThis.FEQUEST_PROTECTED_CONTENT;
const DIAGNOSTIC_COUNT=12;
const SUBJECT_A_MAX_SESSION=20;
let diagnosticItems=[];
let diagnosticBusy=false;
let subjectASessionIds=[];
let accessDialogPromise=null;

function toast(message){
  try{if(typeof popToast==='function')return popToast(message)}catch(_e){}
  console.warn('[FE QUEST v376]',message);
}

function showDiagnosticScreen(){
  try{if(typeof showScreen==='function')showScreen('diagnostic')}catch(_e){}
}

function el(id){return document.getElementById(id)}
function setDisplay(id,value){const node=el(id);if(node)node.style.display=value}

function accessDialog(){
  if(accessDialogPromise)return accessDialogPromise;
  accessDialogPromise=new Promise(resolve=>{
    const old=el('fequestV376AccessDialog');
    if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='fequestV376AccessDialog';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-labelledby','fequestV376AccessTitle');
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.52);display:grid;place-items:center;padding:20px';
    const card=document.createElement('div');
    card.style.cssText='width:min(440px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(15,23,42,.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#24313d';
    card.innerHTML='<h2 id="fequestV376AccessTitle" style="margin:0 0 8px;font-size:20px">テスター用アクセスコード</h2><p style="margin:0 0 14px;line-height:1.65;font-size:14px">保護された問題を読み込むため、案内されたアクセスコードを入力してください。このタブを閉じるとコードは破棄されます。</p><label for="fequestV376AccessInput" style="display:block;font-size:13px;font-weight:700;margin-bottom:6px">アクセスコード</label><input id="fequestV376AccessInput" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" style="box-sizing:border-box;width:100%;min-height:48px;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-size:16px"><div id="fequestV376AccessError" role="alert" style="min-height:20px;margin-top:6px;font-size:13px;color:#b42318"></div><div style="display:flex;gap:10px;margin-top:12px"><button type="button" id="fequestV376AccessCancel" style="flex:1;min-height:46px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;font-weight:700">キャンセル</button><button type="button" id="fequestV376AccessSubmit" style="flex:1;min-height:46px;border:0;border-radius:12px;background:#58cc02;color:#fff;font-weight:800">続ける</button></div>';
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const input=el('fequestV376AccessInput');
    const error=el('fequestV376AccessError');
    const finish=value=>{overlay.remove();accessDialogPromise=null;resolve(value)};
    el('fequestV376AccessCancel')?.addEventListener('click',()=>finish(false));
    const submit=()=>{
      try{
        provider().setAccessCode(input?.value||'',{rememberForTab:true});
        finish(true);
      }catch(_e){if(error)error.textContent='アクセスコードを確認してください。'}
    };
    el('fequestV376AccessSubmit')?.addEventListener('click',submit);
    input?.addEventListener('keydown',event=>{if(event.key==='Enter')submit()});
    setTimeout(()=>input?.focus(),0);
  });
  return accessDialogPromise;
}

async function ensureAccess(){
  const p=provider();
  if(!p||typeof p.loadCatalog!=='function'||typeof p.hydrate!=='function'||typeof p.submit!=='function')throw new Error('protected_content_provider_missing');
  if(p.hasAccessCode())return true;
  return accessDialog();
}

function protectedError(error,message){
  if(error?.status===401||error?.status===403||String(error?.message||'').startsWith('beta_access'))provider()?.clearAccessCode?.();
  toast(message);
}

function diagnosticCatalogItems(catalog){
  const items=(catalog?.items||[])
    .filter(item=>item?.sourcePool==='diagnostic')
    .sort((a,b)=>Number(a.ordinal)-Number(b.ordinal));
  if(items.length!==DIAGNOSTIC_COUNT)throw new Error('diagnostic_catalog_invalid');
  if(new Set(items.map(item=>item.id)).size!==DIAGNOSTIC_COUNT)throw new Error('diagnostic_catalog_duplicate_ids');
  return items;
}

async function loadDiagnosticItems(){
  const p=provider();
  const catalogItems=diagnosticCatalogItems(await p.loadCatalog());
  const ids=catalogItems.map(item=>item.id);
  const hydrated=await p.hydrate(ids);
  const byId=new Map((hydrated?.questions||[]).map(question=>[question.id,question]));
  const items=catalogItems.map(meta=>{
    const question=byId.get(meta.id);
    if(!question||typeof question.stem!=='string'||!Array.isArray(question.options)||question.options.length!==4)throw new Error('diagnostic_hydration_invalid');
    return Object.freeze({
      id:meta.id,
      category:meta.category,
      stem:question.stem,
      options:Object.freeze([...question.options]),
    });
  });
  if(items.length!==DIAGNOSTIC_COUNT)throw new Error('diagnostic_hydration_incomplete');
  return items;
}

function setDiagnosticBusy(busy){
  diagnosticBusy=!!busy;
  const next=el('diagNext');
  const prev=el('diagPrev');
  if(next)next.disabled=diagnosticBusy;
  if(prev)prev.disabled=diagnosticBusy||diagIndex===0;
}

function renderDiagnostic(){
  const item=diagnosticItems[diagIndex];
  if(!item)return;
  const category=el('diagCategory');if(category)category.textContent=item.category||'';
  const count=el('diagCount');if(count)count.textContent=`${diagIndex+1} / ${diagnosticItems.length}`;
  const progress=el('diagProgress');if(progress)progress.style.width=`${((diagIndex+1)/diagnosticItems.length)*100}%`;
  const question=el('diagQuestion');if(question)question.textContent=item.stem;
  const options=el('diagOptions');
  if(options){
    options.innerHTML='';
    item.options.forEach((option,index)=>{
      const button=document.createElement('button');
      button.className='diag-option'+(diagAnswers[diagIndex]===index?' selected':'');
      button.textContent=`${String.fromCharCode(65+index)}. ${option}`;
      button.disabled=diagnosticBusy;
      button.addEventListener('click',()=>{
        if(diagnosticBusy)return;
        diagAnswers[diagIndex]=index;
        renderDiagnostic();
      });
      options.appendChild(button);
    });
  }
  const prev=el('diagPrev');if(prev)prev.disabled=diagnosticBusy||diagIndex===0;
  const next=el('diagNext');
  if(next){
    next.disabled=diagnosticBusy;
    next.textContent=diagnosticBusy?'採点中…':(diagIndex===diagnosticItems.length-1?'結果を見る':'次へ →');
  }
}

function renderDiagnosticResult(scores){
  setDisplay('diagQuiz','none');
  setDisplay('diagResult','block');
  const grid=el('diagResultGrid');
  if(grid){
    grid.innerHTML='';
    sortedSkills().forEach(([category,value])=>{
      const node=document.createElement('div');
      node.className='diag-result';
      node.innerHTML=`<div class="sub">${category}</div><div class="diag-score">${value}%</div>`;
      grid.appendChild(node);
    });
  }
  const weak=sortedSkills().slice(0,3).map(item=>item[0]);
  const advice=el('diagResultAdvice');
  if(advice)advice.textContent=`まずは「${weak.join('・')}」を重点的に進めます。今日の学習は${effectiveStudyMinutes()}分を目安に自動調整します。`;
}

async function finishDiagnostic(){
  if(diagnosticBusy||diagnosticItems.length!==DIAGNOSTIC_COUNT)return false;
  if(diagAnswers.some(answer=>!Number.isInteger(answer))){toast('回答していない問題があります');return false;}
  setDiagnosticBusy(true);
  renderDiagnostic();
  try{
    const correctness=[];
    for(let index=0;index<diagnosticItems.length;index++){
      const result=await provider().submit(diagnosticItems[index].id,diagAnswers[index]);
      provider().forgetAnswer?.(diagnosticItems[index].id);
      correctness.push(result?.correct===true);
    }
    const categories={};
    diagnosticItems.forEach((item,index)=>{
      if(!categories[item.category])categories[item.category]={correct:0,total:0};
      categories[item.category].total++;
      if(correctness[index])categories[item.category].correct++;
    });
    const scores={};
    Object.entries(categories).forEach(([category,value])=>{
      scores[category]=Math.round(value.correct/value.total*100);
    });
    Object.keys(profile.skills).forEach(category=>{
      const raw=scores[category];
      if(raw!==undefined){
        const sampleCount=categories[category].total;
        const prior=profile.skills[category]??60;
        const weight=sampleCount>=2?0.65:0.45;
        profile.skills[category]=Math.round(prior*(1-weight)+raw*weight);
      }
    });
    profile.diagnosticCompleted=true;
    profile.diagnosticScores=scores;
    profile.xp+=120;
    saveProfile();
    renderDiagnosticResult(scores);
    provider().clearProtectedCache();
    return true;
  }catch(error){
    protectedError(error,'診断結果を取得できませんでした。通信状態とアクセスコードを確認してください。');
    return false;
  }finally{
    setDiagnosticBusy(false);
    if(el('diagQuiz')?.style.display!=='none')renderDiagnostic();
  }
}

async function startDiagnostic(skipIntro=false){
  showDiagnosticScreen();
  setDisplay('diagResult','none');
  if(!skipIntro){
    setDisplay('diagIntro','block');
    setDisplay('diagQuiz','none');
    return true;
  }
  if(diagnosticBusy)return false;
  diagnosticBusy=true;
  try{
    if(!(await ensureAccess()))return false;
    setDisplay('diagIntro','none');
    setDisplay('diagQuiz','block');
    const next=el('diagNext');if(next){next.disabled=true;next.textContent='問題を読み込み中…'}
    diagnosticItems=await loadDiagnosticItems();
    diagIndex=0;
    diagAnswers=Array(diagnosticItems.length).fill(null);
    renderDiagnostic();
    return true;
  }catch(error){
    protectedError(error,'問題を読み込めませんでした。通信状態とアクセスコードを確認してください。');
    setDisplay('diagIntro','block');
    setDisplay('diagQuiz','none');
    return false;
  }finally{
    diagnosticBusy=false;
    if(diagnosticItems.length)renderDiagnostic();
  }
}

function nextDiagnostic(){
  if(diagnosticBusy||!diagnosticItems.length)return;
  if(diagAnswers[diagIndex]===null){toast('回答を1つ選んでください');return;}
  if(diagIndex<diagnosticItems.length-1){diagIndex++;renderDiagnostic();return;}
  void finishDiagnostic();
}

function wireDiagnosticControls(){
  const next=el('diagNext');
  if(next&&!next.dataset.v376ProtectedWired){
    next.dataset.v376ProtectedWired='1';
    next.addEventListener('click',event=>{event.preventDefault();nextDiagnostic()});
  }
}

function subjectAQuestionId(item){
  if(!item||typeof item!=='object')return '';
  const candidates=[item.__protectedQuestionId,item.sourceId,item.id];
  for(const value of candidates){
    if(typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value))return value;
  }
  return '';
}

function safeSubjectAMetadata(item,catalogItem,questionId){
  const source=item&&typeof item==='object'?item:{};
  const catalog=catalogItem&&typeof catalogItem==='object'?catalogItem:{};
  const keys=[
    'cat','difficulty','concept','coreTopicId','angle','cognitiveLevel','recallDemand',
    'applicationDemand','judgmentDemand','practicalAudit','examDepth','judgmentAudit',
    'examStyle','qualityAudit','qualityOverride','comparisonTopicIds',
  ];
  const out={id:questionId,sourceId:questionId,__protectedQuestionId:questionId,variant:false,variantSibling:false};
  for(const key of keys){
    if(catalog[key]!==undefined)out[key]=catalog[key];
    else if(source[key]!==undefined)out[key]=source[key];
  }
  return out;
}

async function prepareSubjectA(inputItems){
  if(!Array.isArray(inputItems)||inputItems.length<1||inputItems.length>SUBJECT_A_MAX_SESSION)throw new Error('subject_a_session_size_invalid');
  if(!(await ensureAccess()))throw new Error('beta_access_cancelled');
  const p=provider();
  const catalog=await p.loadCatalog();
  const catalogById=new Map((catalog?.items||[])
    .filter(item=>item?.sourcePool==='subject_a'||item?.sourcePool==='chapter_extra')
    .map(item=>[item.id,item]));
  const normalized=[];
  const seen=new Set();
  for(const item of inputItems){
    const questionId=subjectAQuestionId(item);
    if(!questionId||!catalogById.has(questionId))throw new Error('subject_a_question_not_in_catalog');
    if(seen.has(questionId))continue;
    seen.add(questionId);
    normalized.push({item,questionId,catalogItem:catalogById.get(questionId)});
  }
  if(normalized.length<1)throw new Error('subject_a_session_empty');
  if(subjectASessionIds.length)p.clearHydrated?.(subjectASessionIds);
  const ids=normalized.map(entry=>entry.questionId);
  const hydrated=await p.hydrate(ids);
  const byId=new Map((hydrated?.questions||[]).map(question=>[question.id,question]));
  const prepared=normalized.map(({item,questionId,catalogItem})=>{
    const question=byId.get(questionId);
    if(!question||typeof question.stem!=='string'||!Array.isArray(question.options)||question.options.length!==4)throw new Error('subject_a_hydration_invalid');
    return {
      ...safeSubjectAMetadata(item,catalogItem,questionId),
      q:question.stem,
      options:[...question.options],
      hint:typeof question.hint==='string'?question.hint:'',
      renderContext:question.renderContext&&typeof question.renderContext==='object'?{...question.renderContext}:{},
    };
  });
  subjectASessionIds=[...ids];
  return prepared;
}

async function gradeSubjectA(item,choiceIndex){
  const questionId=subjectAQuestionId(item);
  if(!questionId)throw new Error('subject_a_question_id_invalid');
  try{
    const result=await provider().submit(questionId,choiceIndex);
    return result;
  }finally{
    provider()?.forgetAnswer?.(questionId);
  }
}

function clearSubjectASession(){
  const ids=[...subjectASessionIds];
  subjectASessionIds=[];
  return provider()?.clearHydrated?.(ids)||0;
}

function reportSubjectAError(error){
  protectedError(error,'問題の読み込みまたは採点に失敗しました。通信状態とアクセスコードを確認してください。');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wireDiagnosticControls,{once:true});
else wireDiagnosticControls();

globalThis.FEQUEST_V376_PROTECTED_FLOW=Object.freeze({
  version:'v376-protected-flow-2',
  startDiagnostic,
  renderDiagnostic,
  finishDiagnostic,
  prepareSubjectA,
  gradeSubjectA,
  clearSubjectASession,
  reportSubjectAError,
});
})();
