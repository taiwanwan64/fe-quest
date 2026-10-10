(()=>{
'use strict';
// Isolated open-preview supplement: no profile, XP, history or offline content writes.
const GATE_URL='https://gkvgxnkoypypikxtyeoz.supabase.co/functions/v1/fequest-question-gate-v376';
const ASSET_BASE=document.currentScript?.src||document.baseURI;
const MODES={
  boundaries:{file:'question-catalog-b-grammar-boundaries-v1.json',version:'b-grammar-boundaries-catalog-v1',contentVersion:'b-grammar-boundaries-protected-v1-20261011',practice:'grammar-boundaries-v1',size:2,button:'bGrammarBoundariesStart'},
  base:{file:'question-catalog-b-grammar-v1.json',version:'b-grammar-catalog-v1',contentVersion:'b-grammar-protected-v1-20261008',practice:'grammar-v1',size:6,button:'bGrammarStart'},
  types:{file:'question-catalog-b-grammar-types-v1.json',version:'b-grammar-types-catalog-v1',contentVersion:'b-grammar-types-protected-v1-20261010',practice:'grammar-types-v1',size:2,button:'bGrammarTypesStart'},
  comments:{file:'question-catalog-b-grammar-comments-v1.json',version:'b-grammar-comments-catalog-v1',contentVersion:'b-grammar-comments-protected-v1-20261010',practice:'grammar-comments-v1',size:1,button:'bGrammarCommentsStart'},
  functions:{file:'question-catalog-b-grammar-functions-v1.json',version:'b-grammar-functions-catalog-v1',contentVersion:'b-grammar-functions-protected-v1-20261010',practice:'grammar-functions-v1',size:2,button:'bGrammarFunctionsStart'}
};
let mode=MODES.base;
const el=id=>document.getElementById(id);
const root=el('bGrammarPractice');
if(!root)return;
let epoch=0,controller=null,questions=[],session='',index=0,firstCorrect=0,firstAnswered=false,busy=false;
const disabledChoices=new Set();
const forbidden=new Set(['answerIndex','answer_index','answer','a','explanation','choiceExplanations','choice_explanations','postSubmit','traceTail']);
function safeTree(value){
  if(!value||typeof value!=='object')return;
  for(const [key,item] of Object.entries(value)){
    if(forbidden.has(key))throw new Error('pre_submit_answer_leak');
    safeTree(item);
  }
}
function validateCatalog(doc){
  if(doc?.version!==mode.version||doc?.contentVersion!==mode.contentVersion||doc?.counts?.supplementalGrammar!==mode.size||doc?.counts?.catalogQuestions!==mode.size||!Array.isArray(doc.items)||doc.items.length!==mode.size)throw new Error('catalog_invalid');
  const rows=doc.items.slice().sort((a,b)=>a.practiceOrdinal-b.practiceOrdinal);
  rows.forEach((row,i)=>{
    if(!/^b_exam_bgrammar_[a-z_]+$/.test(row?.id||'')||row.sourcePool!=='b_exam_algo'||row.practice!==mode.practice||row.practiceOrdinal!==i+1||row.ordinal!==1||row.id!=='b_exam_'+row.parentId)throw new Error('catalog_invalid');
    if(Object.keys(row).some(key=>!['id','sourcePool','parentId','ordinal','level','domain','format','practice','practiceOrdinal'].includes(key)))throw new Error('catalog_private_content');
  });
  if(new Set(rows.map(row=>row.id)).size!==mode.size)throw new Error('catalog_duplicate');
  return rows;
}
function validateBootstrap(data,entries){
  if(typeof data?.sessionToken!=='string'||data.sessionToken.length<32||!Array.isArray(data.questions)||data.questions.length!==mode.size)throw new Error('bootstrap_invalid');
  const found=new Map();
  for(const question of data.questions){
    safeTree(question);
    const entry=entries.find(row=>row.id===question?.id),render=question?.renderContext;
    if(!entry||found.has(question.id)||question.sourcePool!=='b_exam_algo'||typeof question.stem!=='string'||!Array.isArray(question.options)||question.options.length!==4||question.options.some(x=>typeof x!=='string')||typeof question.hint!=='string'||render?.type!=='exam'||render.parentId!==entry.parentId||typeof render.title!=='string'||typeof render.context!=='string'||!Array.isArray(render.code)||render.code.some(x=>typeof x!=='string'))throw new Error('question_invalid');
    found.set(question.id,question);
  }
  return entries.map(row=>found.get(row.id));
}
function validateGrade(data,id,choice){
  if(data?.questionId!==id||typeof data.correct!=='boolean'||!Number.isInteger(data.answerIndex)||data.answerIndex<0||data.answerIndex>3||data.correct!==(choice===data.answerIndex)||typeof data.explanation!=='string'||!Array.isArray(data.choiceExplanations)||data.choiceExplanations.length!==4||data.choiceExplanations.some(x=>typeof x!=='string'))throw new Error('grade_invalid');
  return data;
}
async function request(url,body,run){
  if(run!==epoch)throw new Error('cancelled');
  const active=new AbortController();controller=active;
  const timer=setTimeout(()=>active.abort(),15000);
  try{
    const response=await fetch(url,{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:active.signal});
    if(!response.ok)throw new Error('service_unavailable');
    const data=await response.json();
    if(run!==epoch)throw new Error('cancelled');
    return data;
  }finally{clearTimeout(timer);if(controller===active)controller=null;}
}
function clearRuntime(){questions=[];session='';index=0;firstCorrect=0;firstAnswered=false;busy=false;disabledChoices.clear();}
function clearQuestion(){
  for(const id of ['bGrammarTitle','bGrammarContext','bGrammarCode','bGrammarStem','bGrammarHint','bGrammarFeedback','bGrammarOptions'])el(id).replaceChildren();
  el('bGrammarQuestion').hidden=true;el('bGrammarNext').hidden=true;el('bGrammarHint').hidden=true;
}
function reset(message=''){
  epoch++;controller?.abort();controller=null;clearRuntime();clearQuestion();
  for(const config of Object.values(MODES)){el(config.button).disabled=false;el(config.button).hidden=false;}
  el('bGrammarClose').hidden=true;el('bGrammarStatus').textContent=message;
}
function showQuestion(){
  const q=questions[index];if(!q)return;
  clearQuestion();firstAnswered=false;disabledChoices.clear();
  el('bGrammarQuestion').hidden=false;
  el('bGrammarTitle').textContent=`${index+1} / ${mode.size}：${q.renderContext.title}`;
  el('bGrammarContext').textContent=q.renderContext.context;
  el('bGrammarCode').textContent=q.renderContext.code.join('\n');
  el('bGrammarStem').textContent=q.stem;
  q.options.forEach((label,choice)=>{
    const button=document.createElement('button');button.type='button';button.textContent=`${'アイウエ'[choice]}：${label}`;
    button.addEventListener('click',()=>answer(choice));el('bGrammarOptions').appendChild(button);
  });
  el('bGrammarStatus').textContent='選択肢を選んで採点してください。';el('bGrammarTitle').focus();
}
async function start(name){
  if(busy)return;
  reset();mode=MODES[name];const run=epoch;busy=true;
  for(const config of Object.values(MODES))el(config.button).disabled=true;
  el('bGrammarClose').hidden=false;el('bGrammarStatus').textContent=`保護された${mode.size}問を読み込んでいます…`;
  try{
    const entries=validateCatalog(await request(new URL(mode.file,ASSET_BASE).toString(),null,run));
    const data=await request(GATE_URL,{action:'bootstrap',accessCode:'',requestedIds:entries.map(row=>row.id)},run);
    questions=validateBootstrap(data,entries);session=data.sessionToken;busy=false;
    for(const config of Object.values(MODES))el(config.button).hidden=true;
    showQuestion();
  }catch(_error){if(run===epoch)reset('読み込めませんでした。通信状態を確認して、もう一度開始してください。');}
}
function feedback(data,q){
  const target=el('bGrammarFeedback');target.replaceChildren();
  const result=document.createElement('p');result.textContent=data.correct?'正解です。':'今回は不正解です。ヒントを読んで再挑戦できます。';target.appendChild(result);
  const explanation=document.createElement('p');explanation.textContent=data.explanation;target.appendChild(explanation);
  const list=document.createElement('ul');
  data.choiceExplanations.forEach((reason,i)=>{const item=document.createElement('li');item.textContent=`${'アイウエ'[i]}（${q.options[i]}）：${reason}`;list.appendChild(item);});target.appendChild(list);
}
async function answer(choice){
  const q=questions[index];if(!q||busy||disabledChoices.has(choice))return;
  const run=epoch;busy=true;
  const buttons=[...el('bGrammarOptions').children];buttons.forEach(button=>button.disabled=true);
  el('bGrammarNext').disabled=true;el('bGrammarStatus').textContent='採点しています…';
  try{
    const data=validateGrade(await request(GATE_URL,{action:'answer',sessionToken:session,questionId:q.id,choiceIndex:choice},run),q.id,choice);
    if(!firstAnswered){firstAnswered=true;if(data.correct)firstCorrect++;}
    feedback(data,q);
    if(data.correct){buttons[choice].dataset.correct='true';buttons.forEach((_,i)=>disabledChoices.add(i));}
    else{disabledChoices.add(choice);buttons[choice].dataset.wrong='true';el('bGrammarHint').textContent='ヒント：'+q.hint;el('bGrammarHint').hidden=false;}
    buttons.forEach((button,i)=>button.disabled=disabledChoices.has(i));
    el('bGrammarNext').hidden=false;el('bGrammarNext').textContent=index===mode.size-1?'確認結果を見る':'次の問題へ';
    el('bGrammarStatus').textContent=data.correct?'正解を確認しました。次へ進めます。':'初回正解には数えません。再挑戦するか、次へ進めます。';
  }catch(_error){
    if(run===epoch){buttons.forEach((button,i)=>button.disabled=disabledChoices.has(i));el('bGrammarStatus').textContent='採点できませんでした。解答は未確定です。通信状態を確認して再試行してください。';}
  }finally{if(run===epoch){busy=false;el('bGrammarNext').disabled=false;}}
}
function next(){
  if(busy||!firstAnswered)return;
  if(index===mode.size-1){const score=firstCorrect;reset(`確認終了：初回正解 ${score} / ${mode.size}問。XP・履歴・基礎演習の進捗は変更していません。`);el(mode.button).focus();return;}
  index++;showQuestion();
}
el('bGrammarBoundariesStart').addEventListener('click',()=>start('boundaries'));
el('bGrammarStart').addEventListener('click',()=>start('base'));
el('bGrammarTypesStart').addEventListener('click',()=>start('types'));
el('bGrammarCommentsStart').addEventListener('click',()=>start('comments'));
el('bGrammarFunctionsStart').addEventListener('click',()=>start('functions'));
el('bGrammarClose').addEventListener('click',()=>reset('確認を閉じました。途中の解答は保存しません。'));
el('bGrammarNext').addEventListener('click',next);
const guide=root.closest('details');guide?.addEventListener('toggle',()=>{if(!guide.open)reset();});
const parent=el('bSelect');
if(parent)new MutationObserver(()=>{if(parent.classList.contains('hidden'))reset();}).observe(parent,{attributes:true,attributeFilter:['class']});
const screen=el('trace');
if(screen)new MutationObserver(()=>{if(!screen.classList.contains('active'))reset();}).observe(screen,{attributes:true,attributeFilter:['class']});
window.addEventListener('pagehide',()=>reset());
})();


