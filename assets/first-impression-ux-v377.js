(()=>{
'use strict';

const VERSION='v377-first-impression-ux-1';
const NOTICE_ID='v377BetaInviteNotice';

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

function apply(){
  enhanceDiagnosticIntro();
  enhanceAccessDialog();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
else apply();

const observer=new MutationObserver(()=>apply());
observer.observe(document.documentElement,{childList:true,subtree:true});

globalThis.FEQUEST_FIRST_IMPRESSION_UX_V377=Object.freeze({
  version:VERSION,
  refresh:apply,
});
})();
