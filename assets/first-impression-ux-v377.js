(()=>{
'use strict';

const VERSION='v377-first-impression-ux-2';
const NOTICE_ID='v377BetaInviteNotice';
const READINESS_UNKNOWN_NOTE='演習結果など、判定に必要なデータがそろうと自動で算出されます。';
const INVALID_PERCENT_RE=/(?:NaN|Infinity|-Infinity)\s*%/;
const FINITE_PERCENT_RE=/^\s*(?:100|\d{1,2})%\s*$/;

function protectedProvider(){
  return globalThis.FEQUEST_PROTECTED_CONTENT;
}

function hasInviteCode(){
  try{return protectedProvider()?.hasAccessCode?.()===true}catch(_error){return false}
}

function diagnosticIsVisible(){
  const screen=document.getElementById('diagnostic');
  return !!screen&&(screen.classList.contains('active')||getComputedStyle(screen).display!=='none');
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

function apply(){
  enhanceDiagnosticIntro();
  enhanceAccessDialog();
  enhanceReadiness();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
else apply();

const observer=new MutationObserver(()=>apply());
observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});

globalThis.FEQUEST_FIRST_IMPRESSION_UX_V377=Object.freeze({
  version:VERSION,
  refresh:apply,
});
})();
