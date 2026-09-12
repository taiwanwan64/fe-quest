(()=>{
'use strict';

const VERSION='v377-first-impression-ux-5';
const NOTICE_ID='v377BetaInviteNotice';
const READINESS_UNKNOWN_NOTE='演習結果など、判定に必要なデータがそろうと自動で算出されます。';
const INVALID_PERCENT_RE=/(?:NaN|Infinity|-Infinity)\s*%/;
const FINITE_PERCENT_RE=/^\s*(?:100|\d{1,2})%\s*$/;

let applyScheduled=false;
let readinessObserver=null;
let readinessTargets=new WeakSet();
let healthTimer=null;
let recoveryRunning=false;
let recoveryCount=0;
let lastRecoveryAt=0;

function protectedProvider(){
  return globalThis.FEQUEST_PROTECTED_CONTENT;
}

function hasInviteCode(){
  try{return protectedProvider()?.hasAccessCode?.()===true}catch(_error){return false}
}

function elementVisible(element){
  if(!element||!element.isConnected)return false;
  const style=getComputedStyle(element);
  if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;
  const rect=element.getBoundingClientRect();
  return rect.width>0&&rect.height>0;
}

function elementHasVisibleContent(root){
  if(!elementVisible(root))return false;
  const selector='h1,h2,h3,h4,p,li,button,a,input,select,textarea,img,svg,canvas,video,[role="button"],[role="status"],.card,.panel,.page';
  const candidates=root.matches?.(selector)?[root,...root.querySelectorAll(selector)]:[...root.querySelectorAll(selector)];
  return candidates.some(element=>{
    if(!elementVisible(element))return false;
    if(element.matches('input,select,textarea,img,svg,canvas,video'))return true;
    return (element.textContent||'').trim().length>0;
  });
}

function diagnosticIsVisible(){
  const screen=document.getElementById('diagnostic');
  return !!screen&&screen.classList.contains('active')&&elementHasVisibleContent(screen);
}

function routeIsHealthy(){
  const guided=document.getElementById('firstRunGuidedV364');
  const accessDialog=document.getElementById('fequestV376AccessDialog');
  if(document.body.classList.contains('fequest-first-run-v364')){
    return elementHasVisibleContent(guided)||diagnosticIsVisible()||elementVisible(accessDialog);
  }
  if(elementHasVisibleContent(guided)||elementVisible(accessDialog))return true;
  return [...document.querySelectorAll('.screen.active')].some(elementHasVisibleContent);
}

function clearFirstRunPresentation(){
  document.body.classList.remove('fequest-first-run-v364','fequest-first-run-welcome-v364','fequest-first-run-guide-v364','fequest-first-run-diagnostic-v366');
  document.body.removeAttribute('data-first-run-step-v364');
  document.body.removeAttribute('data-first-run-guided-v364');
  document.body.removeAttribute('data-first-run-cleanup-v364');
  try{
    sessionStorage.removeItem('fequest_first_run_guided_session_v364');
    sessionStorage.removeItem('fequest_first_run_cleanup_pending_v364');
  }catch(_error){}
}

function showHomeSafely(){
  clearFirstRunPresentation();
  try{
    if(typeof showScreen==='function')showScreen('home',{replaceHistory:true,instant:true});
  }catch(_error){}
  const home=document.getElementById('home');
  if(home){
    for(const screen of document.querySelectorAll('.screen.active'))if(screen!==home)screen.classList.remove('active');
    home.classList.add('active');
  }
  try{if(typeof refreshProfileUI==='function')refreshProfileUI()}catch(_error){}
}

function resetOnboardingAccountMarker(){
  try{
    if(typeof writeUiState==='function'){
      writeUiState({onboardingAccountV364:''});
      return true;
    }
  }catch(_error){}
  return false;
}

function recoverFirstRunShell(){
  let existing=false;
  try{existing=typeof firstRunExistingLearnerV364==='function'&&firstRunExistingLearnerV364()}catch(_error){}
  if(existing){
    showHomeSafely();
    return 'existing-home';
  }

  // A persisted account-passed marker can leave first-run suppression active while the
  // guided root/diagnostic route is absent. Reset only that onboarding presentation
  // marker and rebuild a visible first-run route; profile, learning history and auth stay intact.
  resetOnboardingAccountMarker();
  document.getElementById('firstRunGuidedV364')?.remove();
  try{
    if(typeof installFirstRunGuidedV364==='function')installFirstRunGuidedV364();
  }catch(_error){}

  if(elementHasVisibleContent(document.getElementById('firstRunGuidedV364'))||diagnosticIsVisible()||elementVisible(document.getElementById('fequestV376AccessDialog'))){
    return 'onboarding-restored';
  }

  // Last-resort visible route. Never clear learner/profile/auth storage merely to escape
  // a presentation dead-end.
  showHomeSafely();
  return 'home-fallback';
}

function checkBlankShell(force=false){
  if(recoveryRunning||routeIsHealthy())return false;
  if(!force&&document.readyState==='loading')return false;
  if(!force&&document.hidden)return false;
  const now=Date.now();
  if(!force&&now-lastRecoveryAt<1200)return false;
  if(recoveryCount>=3&&!force)return false;

  recoveryRunning=true;
  recoveryCount+=1;
  lastRecoveryAt=now;
  let result='none';
  try{
    result=document.body.classList.contains('fequest-first-run-v364')?recoverFirstRunShell():(showHomeSafely(),'home-restored');
    document.documentElement.dataset.v377BlankShellRecovery=result;
  }finally{
    recoveryRunning=false;
  }
  return routeIsHealthy();
}

function scheduleHealthCheck(delay=600){
  if(healthTimer!==null)return;
  healthTimer=setTimeout(()=>{
    healthTimer=null;
    checkBlankShell(false);
  },delay);
}

function enhanceDiagnosticIntro(){
  const begin=document.getElementById('diagBegin');
  if(!begin)return;
  const intro=document.getElementById('diagIntro')||begin.parentElement;
  if(!intro)return;

  let notice=document.getElementById(NOTICE_ID);
  if(!notice){
    notice=document.createElement('div');
    notice.id=NOTICE_ID;
    notice.className='v377-beta-invite-notice';
    notice.setAttribute('role','note');
    notice.innerHTML='<strong>現在は招待制βテスト中です。</strong><br>ログインは学習データの引継ぎに、招待コードはβ期間中の問題アクセス確認に使います。診断を始める際に、案内された招待コードを1回入力してください。';
    begin.insertAdjacentElement('beforebegin',notice);
  }

  const expected=hasInviteCode()?'診断を始める':'招待コードを入力して診断を始める';
  if(begin.textContent!==expected)begin.textContent=expected;
}

function enhanceAccessDialog(){
  const dialog=document.getElementById('fequestV376AccessDialog');
  if(!dialog||dialog.dataset.v377Enhanced==='1')return;

  const title=document.getElementById('fequestV376AccessTitle');
  const input=document.getElementById('fequestV376AccessInput');
  const label=input?dialog.querySelector(`label[for="${input.id}"]`):null;
  const cancel=document.getElementById('fequestV376AccessCancel');
  const submit=document.getElementById('fequestV376AccessSubmit');
  const description=title?.nextElementSibling;

  if(title)title.textContent='βテスト招待コード';
  if(description&&description.tagName==='P'){
    description.textContent='FE QUESTは現在、招待制βテスト中です。ログインは学習データの引継ぎに、招待コードはβ期間中の問題アクセス確認に使います。案内された招待コードを入力してください。';
  }
  if(label)label.textContent='招待コード';
  if(cancel)cancel.textContent='戻る';
  if(submit)submit.textContent=diagnosticIsVisible()?'診断を始める':'続ける';

  if(input&&!dialog.querySelector('[data-v377-beta-note]')){
    const note=document.createElement('p');
    note.dataset.v377BetaNote='1';
    note.textContent='招待コードはこのタブ内だけで保持され、タブを閉じると破棄されます。';
    const error=document.getElementById('fequestV376AccessError');
    (error||input).insertAdjacentElement('afterend',note);
  }

  dialog.dataset.v377Enhanced='1';
}

function hasInvalidPercent(value){
  return INVALID_PERCENT_RE.test(String(value||''));
}

function rememberText(element,attribute){
  if(!element||element.hasAttribute(attribute))return;
  element.setAttribute(attribute,element.textContent||'');
}

function restoreText(element,attribute,placeholder){
  if(!element||!element.hasAttribute(attribute))return;
  if(element.textContent===placeholder)element.textContent=element.getAttribute(attribute)||'';
  element.removeAttribute(attribute);
}

function setTextIfChanged(element,value){
  if(element&&element.textContent!==value)element.textContent=value;
}

function sanitizeUnknownPercentages(root){
  if(!root)return false;
  let changed=false;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
    const before=node.nodeValue||'';
    if(!hasInvalidPercent(before))continue;
    node.nodeValue=before.replace(/(?:NaN|Infinity|-Infinity)\s*%/g,'未判定');
    changed=true;
  }
  return changed;
}

function enhanceReadiness(){
  const card=document.getElementById('readinessCard');
  const value=document.getElementById('readinessValue');
  const ring=document.getElementById('readinessRing');
  const label=document.getElementById('readinessLabel');
  const explain=document.getElementById('readinessExplain');
  const breakdown=document.getElementById('readinessBreakdown');
  const home=document.getElementById('homeReadiness');

  const valueWasInvalid=hasInvalidPercent(value?.textContent);
  const breakdownWasInvalid=hasInvalidPercent(breakdown?.textContent);
  const homeWasInvalid=hasInvalidPercent(home?.textContent);

  if(breakdownWasInvalid)sanitizeUnknownPercentages(breakdown);

  if(home){
    if(homeWasInvalid){
      setTextIfChanged(home,'算出中');
      home.dataset.v377ReadinessUnknown='1';
    }else if(home.dataset.v377ReadinessUnknown==='1'&&FINITE_PERCENT_RE.test(home.textContent||'')){
      delete home.dataset.v377ReadinessUnknown;
    }
  }

  const shouldEnterUnknown=valueWasInvalid||breakdownWasInvalid;
  const alreadyUnknown=card?.dataset.v377ReadinessUnknown==='1';
  const corePublishedFinite=value&&FINITE_PERCENT_RE.test(value.textContent||'');

  if(shouldEnterUnknown){
    if(card)card.dataset.v377ReadinessUnknown='1';
    rememberText(label,'data-v377-readiness-previous-label');
    rememberText(explain,'data-v377-readiness-previous-explain');
    setTextIfChanged(value,'算出中');
    setTextIfChanged(label,'データ収集中');
    if(explain&&!explain.textContent.includes(READINESS_UNKNOWN_NOTE)){
      explain.textContent=`${explain.textContent.trim()} ${READINESS_UNKNOWN_NOTE}`.trim();
    }
    ring?.classList.add('v377-readiness-unknown');
    return;
  }

  if(alreadyUnknown&&!corePublishedFinite){
    setTextIfChanged(value,'算出中');
    setTextIfChanged(label,'データ収集中');
    if(explain&&!explain.textContent.includes(READINESS_UNKNOWN_NOTE)){
      explain.textContent=`${explain.textContent.trim()} ${READINESS_UNKNOWN_NOTE}`.trim();
    }
    ring?.classList.add('v377-readiness-unknown');
    return;
  }

  if(alreadyUnknown&&corePublishedFinite){
    if(card)delete card.dataset.v377ReadinessUnknown;
    ring?.classList.remove('v377-readiness-unknown');
    restoreText(label,'data-v377-readiness-previous-label','データ収集中');
    const previousExplain=explain?.getAttribute('data-v377-readiness-previous-explain');
    if(explain&&previousExplain!==null&&explain.textContent.includes(READINESS_UNKNOWN_NOTE)){
      explain.textContent=previousExplain;
      explain.removeAttribute('data-v377-readiness-previous-explain');
    }
  }
}

function scheduleApply(){
  if(applyScheduled)return;
  applyScheduled=true;
  const run=()=>{
    applyScheduled=false;
    apply();
  };
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);
  else setTimeout(run,0);
}

function ensureScopedReadinessObserver(){
  if(!readinessObserver){
    readinessObserver=new MutationObserver(()=>scheduleApply());
  }
  for(const target of [document.getElementById('readinessCard'),document.getElementById('homeReadiness')]){
    if(!target||readinessTargets.has(target))continue;
    readinessObserver.observe(target,{childList:true,subtree:true,characterData:true});
    readinessTargets.add(target);
  }
}

function apply(){
  enhanceDiagnosticIntro();
  enhanceAccessDialog();
  enhanceReadiness();
  ensureScopedReadinessObserver();
  scheduleHealthCheck(700);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleApply,{once:true});
else scheduleApply();

// Observe only structural changes globally. Character-data observation is deliberately
// limited to the readiness regions so normal rendering cannot flood the observer.
const structureObserver=new MutationObserver(()=>{
  scheduleApply();
  scheduleHealthCheck(700);
});
structureObserver.observe(document.documentElement,{childList:true,subtree:true});

// Startup guard for persisted/PWA states. These checks are intentionally delayed so
// valid screen transitions get time to settle before a blank shell is repaired.
setTimeout(()=>checkBlankShell(false),900);
setTimeout(()=>checkBlankShell(false),2400);
setTimeout(()=>checkBlankShell(false),5200);

globalThis.FEQUEST_FIRST_IMPRESSION_UX_V377=Object.freeze({
  version:VERSION,
  observerMode:'scoped-readiness',
  blankShellRecovery:'guarded-v2',
  refresh:scheduleApply,
  recoverNow:()=>checkBlankShell(true),
  routeHealthy:routeIsHealthy,
});
})();
