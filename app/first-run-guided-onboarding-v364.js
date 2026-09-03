// FE QUEST v364 — guided first-run onboarding.
// This layer changes presentation/routing only. Account use remains optional and the existing
// v342 local-first cloud boundary continues to own authentication and synchronization.
const FIRST_RUN_GUIDED_V364_SPEC=Object.freeze({
  policy:'optional-account-then-settings-then-diagnostic-then-home',
  accountRequired:false,
  navigationLockedUntilDiagnostic:true,
  existingLearnerRouteChanged:false,
  profileSchemaChanged:false,
  cloudRuntimeChanged:false,
  diagnosticScoringChanged:false,
  finishDestination:'home',
  autoLaunchAfterDiagnostic:false
});

const FIRST_RUN_ACCOUNT_STATE_V364='onboardingAccountV364';
const FIRST_RUN_TOTAL_STEPS_V364='onboardingTotalStepsV364';
let firstRunGuidedSessionV364=false;
let firstRunCloudObserverV364=null;
let firstRunCloudPollV364=null;
let originalShowScreenV364=showScreen;
let originalRenderFirstRunExperienceV364=typeof renderFirstRunExperienceV340==='function'?renderFirstRunExperienceV340:null;

function firstRunExistingLearnerV364(){
  return Boolean(profile?.diagnosticCompleted)||(typeof firstRunHasLearningHistoryV340==='function'&&firstRunHasLearningHistoryV340());
}

function firstRunAccountPassedV364(){
  const state=readUiState();
  return ['skipped','signed-in'].includes(String(state?.[FIRST_RUN_ACCOUNT_STATE_V364]||''));
}

function firstRunNeedsSettingsV364(){
  return !String(profile?.settings?.examDate||'').trim();
}

function firstRunGuidedActiveV364(){
  return firstRunGuidedSessionV364||!firstRunExistingLearnerV364();
}

function firstRunGuidedTotalStepsV364(){
  const saved=Number(readUiState()?.[FIRST_RUN_TOTAL_STEPS_V364]);
  return saved===2||saved===3?saved:(firstRunNeedsSettingsV364()?3:2);
}

function firstRunGuidedNodeV364(tag,cls,text){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!=null)node.textContent=text;
  return node;
}

function firstRunCloudCardV364(){
  return document.getElementById('cloudSyncCardV342');
}

function firstRunCloudSignedInV364(){
  const card=firstRunCloudCardV364();
  const account=card?.querySelector?.('.feq-sync-account');
  return account?String(account.textContent||'').trim():'';
}

function firstRunCloudReadyV364(){
  return Boolean(firstRunCloudCardV364()?.querySelector?.('[data-sync-action="send-link"]'));
}

function stopFirstRunCloudWatchV364(){
  try{firstRunCloudObserverV364?.disconnect()}catch(_e){}
  firstRunCloudObserverV364=null;
  if(firstRunCloudPollV364)clearInterval(firstRunCloudPollV364);
  firstRunCloudPollV364=null;
}

function updateFirstRunCloudStateV364(){
  const root=document.getElementById('firstRunGuidedV364');
  if(!root||root.dataset.stage!=='account')return;
  const email=firstRunCloudSignedInV364();
  if(email){
    const current=root.querySelector('.v364-account-signed-in');
    if(current&&current.dataset.email===email)return;
    renderFirstRunAccountV364(root,email);
    return;
  }
  const send=root.querySelector('#firstRunSendLinkV364');
  const status=root.querySelector('#firstRunAccountStatusV364');
  if(send){
    const ready=firstRunCloudReadyV364();
    send.disabled=!ready;
    const message=ready?'メールアドレスを入力してください。':'アカウント機能を準備しています。待たずにスキップすることもできます。';
    if(status&&!status.dataset.result&&status.textContent!==message)status.textContent=message;
  }
  const hiddenNotice=firstRunCloudCardV364()?.querySelector?.('.feq-sync-notice');
  if(status&&hiddenNotice){
    const message=String(hiddenNotice.textContent||'').trim();
    status.dataset.result='1';
    if(status.textContent!==message)status.textContent=message;
    status.classList.toggle('is-error',hiddenNotice.classList.contains('error'));
    status.classList.toggle('is-success',hiddenNotice.classList.contains('success'));
    if(hiddenNotice.classList.contains('success')&&send)send.disabled=false;
  }
}

function watchFirstRunCloudV364(){
  stopFirstRunCloudWatchV364();
  if(typeof MutationObserver==='function'){
    firstRunCloudObserverV364=new MutationObserver(updateFirstRunCloudStateV364);
    firstRunCloudObserverV364.observe(document.body||document.documentElement,{childList:true,subtree:true,characterData:true});
  }
  firstRunCloudPollV364=setInterval(updateFirstRunCloudStateV364,350);
  setTimeout(updateFirstRunCloudStateV364,0);
}

function renderFirstRunShellV364(root,step,title,lead){
  root.replaceChildren();
  root.append(firstRunGuidedNodeV364('div','v364-step',`ステップ ${step} / ${firstRunGuidedTotalStepsV364()}`));
  root.append(firstRunGuidedNodeV364('h1','',title));
  root.append(firstRunGuidedNodeV364('p','v364-lead',lead));
}

function advancePastFirstRunAccountV364(mode){
  writeUiState({[FIRST_RUN_ACCOUNT_STATE_V364]:mode});
  stopFirstRunCloudWatchV364();
  const root=document.getElementById('firstRunGuidedV364');
  if(firstRunNeedsSettingsV364())renderFirstRunSettingsV364(root);
  else startFirstRunDiagnosticV364();
}

function renderFirstRunAccountV364(root,signedInEmail=''){
  root.dataset.stage='account';
  renderFirstRunShellV364(root,1,'ログイン・登録','アカウントを使うと、端末を替えたときも学習データを引き継げます。ログインせず、この端末だけで始めることもできます。');

  if(signedInEmail){
    const signed=firstRunGuidedNodeV364('div','v364-account-signed-in');
    signed.dataset.email=signedInEmail;
    signed.append(firstRunGuidedNodeV364('span','v364-account-icon','✓'));
    const copy=firstRunGuidedNodeV364('div','');
    copy.append(firstRunGuidedNodeV364('b','', 'ログイン済みです'));
    copy.append(firstRunGuidedNodeV364('span','',signedInEmail));
    signed.append(copy);root.append(signed);
    const next=firstRunGuidedNodeV364('button','v364-primary','このアカウントで続ける →');
    next.type='button';next.id='firstRunAccountContinueV364';
    next.addEventListener('click',()=>advancePastFirstRunAccountV364('signed-in'));
    root.append(next);
  }else{
    const form=firstRunGuidedNodeV364('div','v364-account-form');
    const label=firstRunGuidedNodeV364('label','v364-label','メールアドレス');label.htmlFor='firstRunEmailV364';
    const email=firstRunGuidedNodeV364('input','');email.id='firstRunEmailV364';email.type='email';email.autocomplete='email';email.inputMode='email';email.placeholder='you@example.com';
    const send=firstRunGuidedNodeV364('button','v364-primary','ログイン・登録リンクを送る');send.type='button';send.id='firstRunSendLinkV364';send.disabled=true;
    send.addEventListener('click',()=>{
      const value=String(email.value||'').trim();
      const status=root.querySelector('#firstRunAccountStatusV364');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){
        status.dataset.result='1';status.className='v364-account-status is-error';status.textContent='正しい形式のメールアドレスを入力してください。';email.focus();return;
      }
      const cloudEmail=firstRunCloudCardV364()?.querySelector?.('#cloudSyncEmailV342');
      const cloudSend=firstRunCloudCardV364()?.querySelector?.('[data-sync-action="send-link"]');
      if(!cloudEmail||!cloudSend){
        status.dataset.result='1';status.className='v364-account-status is-error';status.textContent='アカウント機能を準備できませんでした。通信状態を確認するか、ログインせずに進んでください。';return;
      }
      cloudEmail.value=value;status.dataset.result='1';status.className='v364-account-status';status.textContent='ログインリンクを送信しています…';send.disabled=true;cloudSend.click();
      setTimeout(updateFirstRunCloudStateV364,250);
    });
    form.append(label,email,send);root.append(form);
    root.append(firstRunGuidedNodeV364('div','v364-account-help','初めての方は、メールに届くリンクを開くと登録が完了します。パスワードは不要です。'));
    const status=firstRunGuidedNodeV364('div','v364-account-status','アカウント機能を準備しています。待たずにスキップすることもできます。');status.id='firstRunAccountStatusV364';status.setAttribute('role','status');root.append(status);
    const skip=firstRunGuidedNodeV364('button','v364-secondary','ログインせずに始める');skip.type='button';skip.id='firstRunAccountSkipV364';skip.addEventListener('click',()=>advancePastFirstRunAccountV364('skipped'));root.append(skip);
  }

  const privacy=firstRunGuidedNodeV364('p','v364-privacy');
  privacy.append('アカウント利用については ');
  const link=firstRunGuidedNodeV364('a','','プライバシーポリシー');link.href='./privacy.html';link.target='_blank';link.rel='noopener';
  privacy.append(link,' をご確認ください。');root.append(privacy);
  watchFirstRunCloudV364();
}

function renderFirstRunSettingsV364(root){
  if(!root)return;
  root.dataset.stage='settings';
  const total=firstRunGuidedTotalStepsV364();
  renderFirstRunShellV364(root,total-1,'学習計画の基準を設定','受験予定日と1日に使える時間を設定します。実力診断の結果と合わせて、最初の「今日の学習」を作ります。');
  let selected=Number(profile?.settings?.studyMinutes)||60;
  const presets=[30,45,60,90];if(!presets.includes(selected))selected=60;

  const fields=firstRunGuidedNodeV364('div','v364-settings-fields');
  const dateField=firstRunGuidedNodeV364('div','v364-field');
  const dateLabel=firstRunGuidedNodeV364('label','v364-label','受験予定日');dateLabel.htmlFor='firstRunExamDateV364';
  const date=firstRunGuidedNodeV364('input','');date.type='date';date.id='firstRunExamDateV364';date.min=firstRunDateKeyV340();date.value=profile?.settings?.examDate||'';
  dateField.append(dateLabel,date,firstRunGuidedNodeV364('div','v364-help','残り日数に合わせて、新規学習・復習・直前期の負荷を調整します。'));
  const minutesField=firstRunGuidedNodeV364('div','v364-field');minutesField.append(firstRunGuidedNodeV364('div','v364-label','1日の学習時間'));
  const minuteButtons=firstRunGuidedNodeV364('div','v364-minutes');
  presets.forEach(value=>{
    const button=firstRunGuidedNodeV364('button','v364-minute',`${value}分`);button.type='button';button.dataset.minutes=String(value);button.setAttribute('aria-pressed',String(value===selected));
    button.addEventListener('click',()=>{selected=value;minuteButtons.querySelectorAll('.v364-minute').forEach(item=>item.setAttribute('aria-pressed',String(Number(item.dataset.minutes)===selected)));});
    minuteButtons.append(button);
  });
  minutesField.append(minuteButtons,firstRunGuidedNodeV364('div','v364-help','あとから「計画」でいつでも変更できます。'));
  fields.append(dateField,minutesField);root.append(fields);
  const error=firstRunGuidedNodeV364('div','v364-error');error.id='firstRunSettingsErrorV364';root.append(error);
  const submit=firstRunGuidedNodeV364('button','v364-primary','設定を保存して実力診断へ →');submit.type='button';submit.id='firstRunSettingsContinueV364';
  submit.addEventListener('click',()=>{
    const exam=String(date.value||'').trim();
    if(!exam){error.textContent='受験予定日を選んでください。';error.classList.add('show');date.focus();return;}
    if(exam<firstRunDateKeyV340()){error.textContent='受験予定日は今日以降の日付を選んでください。';error.classList.add('show');date.focus();return;}
    error.classList.remove('show');submit.disabled=true;submit.textContent='保存しています…';
    profile.settings=profile.settings||{};profile.settings.studyMinutes=selected;profile.settings.examDate=exam;profile.settings.autoPace=true;
    if(!saveProfile()){
      submit.disabled=false;submit.textContent='設定を保存して実力診断へ →';error.textContent='設定を保存できませんでした。少し待ってから、もう一度お試しください。';error.classList.add('show');return;
    }
    startFirstRunDiagnosticV364();
  });
  root.append(submit);
}

function prepareFirstRunDiagnosticHeadingV364(){
  const head=document.querySelector('#diagnostic .screen-head > div');
  if(!head)return;
  let step=head.querySelector('.v364-diagnostic-step');
  if(!step){step=firstRunGuidedNodeV364('div','v364-step v364-diagnostic-step');head.prepend(step);}
  step.textContent=`ステップ ${firstRunGuidedTotalStepsV364()} / ${firstRunGuidedTotalStepsV364()}`;
}

function startFirstRunDiagnosticV364(){
  document.getElementById('firstRunGuidedV364')?.remove();
  firstRunGuidedSessionV364=true;
  document.body.classList.add('fequest-first-run-v364');
  prepareFirstRunDiagnosticHeadingV364();
  startDiagnosticFlow(false);
  appHistoryReplace('diagnostic',0);
}

function finishGuidedDiagnosticV364(){
  try{ensureTodayPlanSnapshot(true)}catch(_e){}
  writeUiState({[FIRST_RUN_ACCOUNT_STATE_V364]:readUiState()?.[FIRST_RUN_ACCOUNT_STATE_V364]||'skipped',screen:'home'});
  firstRunGuidedSessionV364=false;
  stopFirstRunCloudWatchV364();
  document.body.classList.remove('fequest-first-run-v364');
  document.querySelector('.v364-diagnostic-step')?.remove();
  document.getElementById('firstRunGuidedV364')?.remove();
  originalShowScreenV364('home',{replaceHistory:true,instant:true});
  refreshProfileUI();
  return true;
}

function installFirstRunGuidedV364(){
  if(firstRunExistingLearnerV364()){
    document.body.classList.remove('fequest-first-run-v364');
    return false;
  }
  firstRunGuidedSessionV364=true;
  if(![2,3].includes(Number(readUiState()?.[FIRST_RUN_TOTAL_STEPS_V364]))){
    writeUiState({[FIRST_RUN_TOTAL_STEPS_V364]:firstRunNeedsSettingsV364()?3:2});
  }
  document.body.classList.add('fequest-first-run-v364');
  document.getElementById('firstRunExperienceV340')?.remove();
  const home=document.getElementById('home');if(!home)return false;
  let root=document.getElementById('firstRunGuidedV364');
  if(!root){root=firstRunGuidedNodeV364('section','first-run-guided-v364');root.id='firstRunGuidedV364';root.setAttribute('aria-label','初回設定');home.prepend(root);}
  if(firstRunAccountPassedV364()){
    if(firstRunNeedsSettingsV364())renderFirstRunSettingsV364(root);
    else startFirstRunDiagnosticV364();
  }else renderFirstRunAccountV364(root,firstRunCloudSignedInV364());
  originalShowScreenV364('home',{replaceHistory:true,instant:true});
  return true;
}

showScreen=function(id,opts={}){
  if(firstRunGuidedActiveV364()&&!['home','diagnostic'].includes(id)){
    id=document.getElementById('diagnostic')?.classList.contains('active')?'diagnostic':'home';
  }
  return originalShowScreenV364(id,opts);
};

if(originalRenderFirstRunExperienceV364){
  renderFirstRunExperienceV340=function(){
    if(firstRunGuidedActiveV364()){document.getElementById('firstRunExperienceV340')?.remove();return false;}
    return originalRenderFirstRunExperienceV364();
  };
}

globalThis.FIRST_RUN_GUIDED_V364_SPEC=FIRST_RUN_GUIDED_V364_SPEC;
globalThis.firstRunExistingLearnerV364=firstRunExistingLearnerV364;
globalThis.firstRunGuidedActiveV364=firstRunGuidedActiveV364;
globalThis.startFirstRunDiagnosticV364=startFirstRunDiagnosticV364;
globalThis.finishGuidedDiagnosticV364=finishGuidedDiagnosticV364;
globalThis.installFirstRunGuidedV364=installFirstRunGuidedV364;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installFirstRunGuidedV364,{once:true});
else installFirstRunGuidedV364();
