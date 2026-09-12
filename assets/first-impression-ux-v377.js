(()=>{
'use strict';

const VERSION='v377-first-impression-ux-7';
const NOTICE_ID='v377BetaInviteNotice';
const READINESS_UNKNOWN_NOTE='演習結果など、判定に必要なデータがそろうと自動で算出されます。';
const INVALID_PERCENT_RE=/(?:NaN|Infinity|-Infinity)\s*%/;
const FINITE_PERCENT_RE=/^\s*(?:100|\d{1,2})%\s*$/;
const VENN_CARD_ID='ipa92VennLabCard';
const VENN_DIALOG_ID='ipa92VennDialog';

let applyScheduled=false;
let readinessObserver=null;
let readinessTargets=new WeakSet();
let healthTimer=null;
let recoveryRunning=false;
let recoveryCount=0;
let lastRecoveryAt=0;
let vennReturnFocus=null;
let vennPracticeIndex=-1;
let vennPracticeExpected=null;
let vennPracticeSelection=new Set();

const VENN_OPERATIONS=Object.freeze({
  A:{label:'A',regions:['a','ab'],detail:'集合Aに入る部分です。重なっている部分 A∩B もAに含まれます。'},
  B:{label:'B',regions:['b','ab'],detail:'集合Bに入る部分です。重なっている部分 A∩B もBに含まれます。'},
  intersection:{label:'A ∩ B',regions:['ab'],detail:'AとBの両方に入る共通部分です。'},
  union:{label:'A ∪ B',regions:['a','ab','b'],detail:'AまたはBの少なくとも一方に入る部分です。'},
  notA:{label:'¬A',regions:['b','outside'],detail:'全体集合のうちAに入らない部分です。'},
  notB:{label:'¬B',regions:['a','outside'],detail:'全体集合のうちBに入らない部分です。'},
  notIntersection:{label:'¬(A ∩ B)',regions:['a','b','outside'],detail:'AとBの共通部分だけを除いた領域です。'},
  demorgan1:{label:'¬A ∪ ¬B',regions:['a','b','outside'],detail:'¬(A ∩ B) と同じ領域になります。これがド・モルガンの法則の1つです。'},
  notUnion:{label:'¬(A ∪ B)',regions:['outside'],detail:'AにもBにも入らない外側だけです。'},
  demorgan2:{label:'¬A ∩ ¬B',regions:['outside'],detail:'¬(A ∪ B) と同じ領域になります。これもド・モルガンの法則です。'}
});

const VENN_PRACTICE=Object.freeze([
  {key:'intersection',prompt:'A ∩ B になる領域をタップしてください。'},
  {key:'union',prompt:'A ∪ B になる領域をすべてタップしてください。'},
  {key:'notA',prompt:'¬A になる領域をすべてタップしてください。'},
  {key:'notIntersection',prompt:'¬(A ∩ B) になる領域をすべてタップしてください。'},
  {key:'notUnion',prompt:'¬(A ∪ B) になる領域をタップしてください。'},
  {key:'demorgan1',prompt:'¬A ∪ ¬B になる領域をすべてタップしてください。'}
]);

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

  resetOnboardingAccountMarker();
  document.getElementById('firstRunGuidedV364')?.remove();
  try{
    if(typeof installFirstRunGuidedV364==='function')installFirstRunGuidedV364();
  }catch(_error){}

  if(elementHasVisibleContent(document.getElementById('firstRunGuidedV364'))||diagnosticIsVisible()||elementVisible(document.getElementById('fequestV376AccessDialog'))){
    return 'onboarding-restored';
  }

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

function sanitizeCompactReadiness(value,bar){
  if(!value)return;
  if(hasInvalidPercent(value.textContent)){
    setTextIfChanged(value,'算出中');
    value.dataset.v377ReadinessUnknown='1';
    if(bar)bar.style.width='0%';
    return;
  }
  if(value.dataset.v377ReadinessUnknown==='1'&&FINITE_PERCENT_RE.test(value.textContent||'')){
    delete value.dataset.v377ReadinessUnknown;
  }
}

function enhanceReadiness(){
  const card=document.getElementById('readinessCard');
  const value=document.getElementById('readinessValue');
  const ring=document.getElementById('readinessRing');
  const label=document.getElementById('readinessLabel');
  const explain=document.getElementById('readinessExplain');
  const breakdown=document.getElementById('readinessBreakdown');
  const home=document.getElementById('homeReadiness');
  const right=document.getElementById('rightReadiness');
  const rightBar=document.getElementById('rightReadinessBar');

  const valueWasInvalid=hasInvalidPercent(value?.textContent);
  const breakdownWasInvalid=hasInvalidPercent(breakdown?.textContent);
  const homeWasInvalid=hasInvalidPercent(home?.textContent);

  if(breakdownWasInvalid)sanitizeUnknownPercentages(breakdown);
  sanitizeCompactReadiness(right,rightBar);

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

function relocateStudyBlockBar(){
  const bar=document.getElementById('studyBlockBarV373');
  if(!bar||bar.hidden)return;
  const active=[...document.querySelectorAll('.screen.active')].find(elementVisible);
  if(!active)return;
  if(bar.parentElement!==active)active.appendChild(bar);
  bar.dataset.v377Inline='1';
}

function enhanceSyllabusBadge(){
  const card=document.getElementById('pwaHealthCard');
  if(!card)return;
  const row=[...card.querySelectorAll('.pwa-health-item')].find(item=>item.querySelector('span')?.textContent.trim()==='試験範囲');
  const value=row?.querySelector('b');
  if(!value)return;
  if(value.textContent.trim()==='Ver.9.2対応'||value.textContent.trim()==='Ver.9.2対応強化中'){
    value.textContent='Ver.9.2対応強化中';
    value.classList.remove('good');
    value.classList.add('ipa92-coverage-progress');
    value.title='IPA Ver.9.2の細目単位で教材・問題・図解を再監査し、未対応項目を順次補強しています。';
  }
}

function vennSorted(values){
  return [...values].sort((a,b)=>['a','ab','b','outside'].indexOf(a)-['a','ab','b','outside'].indexOf(b));
}

function vennSameSelection(left,right){
  const a=vennSorted(left);
  const b=vennSorted(right);
  return a.length===b.length&&a.every((value,index)=>value===b[index]);
}

function vennRegionName(region){
  return ({a:'Aのみ',ab:'A ∩ B',b:'Bのみ',outside:'AにもBにも入らない'})[region]||region;
}

function renderVennSelection(regions,label,detail,{practice=false}={}){
  const dialog=document.getElementById(VENN_DIALOG_ID);
  if(!dialog)return;
  const selected=new Set(regions);
  for(const shape of dialog.querySelectorAll('[data-venn-shape]')){
    shape.classList.toggle('is-active',selected.has(shape.dataset.vennShape));
  }
  for(const button of dialog.querySelectorAll('[data-venn-region]')){
    const active=selected.has(button.dataset.vennRegion);
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  }
  const formula=dialog.querySelector('#ipa92VennFormula');
  const note=dialog.querySelector('#ipa92VennExplanation');
  if(formula)formula.textContent=label||'領域をタップしてみましょう';
  if(note)note.textContent=detail||'図の領域をタップすると、その部分の意味を確認できます。';
  dialog.dataset.vennPractice=practice?'1':'0';
}

function setVennOperation(key){
  const operation=VENN_OPERATIONS[key];
  if(!operation)return;
  vennPracticeExpected=null;
  vennPracticeSelection.clear();
  const dialog=document.getElementById(VENN_DIALOG_ID);
  if(dialog){
    for(const button of dialog.querySelectorAll('[data-venn-operation]')){
      button.classList.toggle('is-active',button.dataset.vennOperation===key);
      button.setAttribute('aria-pressed',String(button.dataset.vennOperation===key));
    }
    const practiceStatus=dialog.querySelector('#ipa92VennPracticeStatus');
    if(practiceStatus)practiceStatus.textContent='下の「タップ練習を始める」で、式から領域を選ぶ練習もできます。';
  }
  renderVennSelection(operation.regions,operation.label,operation.detail);
}

function vennRegionFromPointer(svg,event){
  const matrix=svg.getScreenCTM();
  if(!matrix)return null;
  const point=svg.createSVGPoint();
  point.x=event.clientX;
  point.y=event.clientY;
  const local=point.matrixTransform(matrix.inverse());
  if(local.x<20||local.x>340||local.y<20||local.y>200)return null;
  const inA=((local.x-135)**2)+((local.y-110)**2)<=70**2;
  const inB=((local.x-225)**2)+((local.y-110)**2)<=70**2;
  if(inA&&inB)return'ab';
  if(inA)return'a';
  if(inB)return'b';
  return'outside';
}

function handleVennRegion(region){
  const dialog=document.getElementById(VENN_DIALOG_ID);
  if(!dialog||!region)return;
  if(vennPracticeExpected){
    if(vennPracticeSelection.has(region))vennPracticeSelection.delete(region);
    else vennPracticeSelection.add(region);
    renderVennSelection(vennPracticeSelection,'選択中',`${vennSorted(vennPracticeSelection).map(vennRegionName).join('・')||'まだ選択していません'}。選び終えたら「答え合わせ」を押してください。`,{practice:true});
    return;
  }
  for(const button of dialog.querySelectorAll('[data-venn-operation]')){
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed','false');
  }
  const detail=region==='ab'?'ここはAとBの両方に含まれるので A ∩ B です。':region==='a'?'ここはAには含まれますがBには含まれません。':region==='b'?'ここはBには含まれますがAには含まれません。':'ここはAにもBにも含まれない、全体集合の外側部分です。';
  renderVennSelection([region],vennRegionName(region),detail);
}

function nextVennPractice(){
  vennPracticeIndex=(vennPracticeIndex+1)%VENN_PRACTICE.length;
  const task=VENN_PRACTICE[vennPracticeIndex];
  const operation=VENN_OPERATIONS[task.key];
  vennPracticeExpected=new Set(operation.regions);
  vennPracticeSelection=new Set();
  const dialog=document.getElementById(VENN_DIALOG_ID);
  if(!dialog)return;
  for(const button of dialog.querySelectorAll('[data-venn-operation]')){
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed','false');
  }
  const prompt=dialog.querySelector('#ipa92VennPracticePrompt');
  const status=dialog.querySelector('#ipa92VennPracticeStatus');
  const check=dialog.querySelector('#ipa92VennCheck');
  if(prompt)prompt.textContent=task.prompt;
  if(status)status.textContent='図を直接タップするか、下の4つの領域ボタンで選べます。';
  if(check)check.disabled=false;
  renderVennSelection([],'タップ練習',task.prompt,{practice:true});
}

function checkVennPractice(){
  const dialog=document.getElementById(VENN_DIALOG_ID);
  if(!dialog||!vennPracticeExpected)return;
  const status=dialog.querySelector('#ipa92VennPracticeStatus');
  const correct=vennSameSelection(vennPracticeSelection,vennPracticeExpected);
  if(correct){
    const task=VENN_PRACTICE[vennPracticeIndex];
    const operation=VENN_OPERATIONS[task.key];
    if(status)status.textContent=`正解です。${operation.detail}`;
    renderVennSelection(operation.regions,operation.label,operation.detail,{practice:true});
  }else if(status){
    const chosen=vennSorted(vennPracticeSelection).map(vennRegionName).join('・')||'未選択';
    status.textContent=`もう一度。現在の選択は「${chosen}」です。式に含まれる領域をすべて選んでみましょう。`;
  }
}

function buildVennDialog(){
  let backdrop=document.getElementById(VENN_DIALOG_ID);
  if(backdrop)return backdrop;
  backdrop=document.createElement('div');
  backdrop.id=VENN_DIALOG_ID;
  backdrop.className='ipa92-venn-backdrop';
  backdrop.hidden=true;
  backdrop.innerHTML=`
    <section class="ipa92-venn-dialog" role="dialog" aria-modal="true" aria-labelledby="ipa92VennTitle">
      <div class="ipa92-venn-head">
        <div><span class="ipa92-venn-kicker">図解・操作ラボ / IPA Ver.9.2補強</span><h2 id="ipa92VennTitle">集合・ベン図を触って理解する</h2></div>
        <button type="button" class="ipa92-venn-close" id="ipa92VennClose" aria-label="ベン図ラボを閉じる">×</button>
      </div>
      <p class="ipa92-venn-lead">式を押すと対応する領域が光ります。図そのものをタップして「Aのみ」「共通部分」「Bのみ」「外側」の意味も確認できます。</p>
      <div class="ipa92-venn-operations" role="group" aria-label="表示する集合演算">
        <button type="button" data-venn-operation="A">A</button>
        <button type="button" data-venn-operation="B">B</button>
        <button type="button" data-venn-operation="intersection">A ∩ B</button>
        <button type="button" data-venn-operation="union">A ∪ B</button>
        <button type="button" data-venn-operation="notA">¬A</button>
        <button type="button" data-venn-operation="notB">¬B</button>
        <button type="button" data-venn-operation="notIntersection">¬(A ∩ B)</button>
        <button type="button" data-venn-operation="demorgan1">¬A ∪ ¬B</button>
        <button type="button" data-venn-operation="notUnion">¬(A ∪ B)</button>
        <button type="button" data-venn-operation="demorgan2">¬A ∩ ¬B</button>
      </div>
      <div class="ipa92-venn-stage">
        <svg id="ipa92VennSvg" viewBox="0 0 360 220" role="img" aria-label="集合Aと集合Bのベン図。図の領域をタップできます。">
          <defs>
            <mask id="ipa92MaskANotB"><rect width="360" height="220" fill="white"/><circle cx="225" cy="110" r="70" fill="black"/></mask>
            <mask id="ipa92MaskBNotA"><rect width="360" height="220" fill="white"/><circle cx="135" cy="110" r="70" fill="black"/></mask>
            <mask id="ipa92MaskOutside"><rect width="360" height="220" fill="white"/><circle cx="135" cy="110" r="70" fill="black"/><circle cx="225" cy="110" r="70" fill="black"/></mask>
            <clipPath id="ipa92ClipB"><circle cx="225" cy="110" r="70"/></clipPath>
          </defs>
          <rect x="20" y="20" width="320" height="180" rx="16" class="ipa92-venn-universe"/>
          <rect x="20" y="20" width="320" height="180" rx="16" class="ipa92-venn-highlight" data-venn-shape="outside" mask="url(#ipa92MaskOutside)"/>
          <circle cx="135" cy="110" r="70" class="ipa92-venn-highlight" data-venn-shape="a" mask="url(#ipa92MaskANotB)"/>
          <circle cx="225" cy="110" r="70" class="ipa92-venn-highlight" data-venn-shape="b" mask="url(#ipa92MaskBNotA)"/>
          <circle cx="135" cy="110" r="70" class="ipa92-venn-highlight" data-venn-shape="ab" clip-path="url(#ipa92ClipB)"/>
          <circle cx="135" cy="110" r="70" class="ipa92-venn-circle"/>
          <circle cx="225" cy="110" r="70" class="ipa92-venn-circle"/>
          <text x="92" y="67" class="ipa92-venn-label">A</text>
          <text x="254" y="67" class="ipa92-venn-label">B</text>
          <text x="29" y="43" class="ipa92-venn-universe-label">全体集合</text>
        </svg>
        <div class="ipa92-venn-readout" aria-live="polite"><b id="ipa92VennFormula">A ∩ B</b><span id="ipa92VennExplanation">AとBの両方に入る共通部分です。</span></div>
      </div>
      <div class="ipa92-venn-region-controls" role="group" aria-label="ベン図の領域を選択">
        <button type="button" data-venn-region="a">Aのみ</button>
        <button type="button" data-venn-region="ab">A ∩ B</button>
        <button type="button" data-venn-region="b">Bのみ</button>
        <button type="button" data-venn-region="outside">外側</button>
      </div>
      <div class="ipa92-demorgan-note"><b>ド・モルガンを目で確認</b><span>「¬(A ∩ B)」と「¬A ∪ ¬B」、または「¬(A ∪ B)」と「¬A ∩ ¬B」を交互に押してください。式は違っても、光る領域が同じになります。</span></div>
      <div class="ipa92-venn-practice">
        <div><b id="ipa92VennPracticePrompt">式から領域を選ぶ練習もできます。</b><span id="ipa92VennPracticeStatus">図を直接タップして答えます。</span></div>
        <div class="ipa92-venn-practice-actions"><button type="button" id="ipa92VennPracticeNext">タップ練習を始める</button><button type="button" id="ipa92VennCheck" disabled>答え合わせ</button></div>
      </div>
    </section>`;
  document.body.appendChild(backdrop);

  const close=()=>closeVennLab();
  backdrop.querySelector('#ipa92VennClose')?.addEventListener('click',close);
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)close()});
  backdrop.querySelectorAll('[data-venn-operation]').forEach(button=>button.addEventListener('click',()=>setVennOperation(button.dataset.vennOperation)));
  backdrop.querySelectorAll('[data-venn-region]').forEach(button=>button.addEventListener('click',()=>handleVennRegion(button.dataset.vennRegion)));
  backdrop.querySelector('#ipa92VennSvg')?.addEventListener('click',event=>handleVennRegion(vennRegionFromPointer(event.currentTarget,event)));
  backdrop.querySelector('#ipa92VennPracticeNext')?.addEventListener('click',nextVennPractice);
  backdrop.querySelector('#ipa92VennCheck')?.addEventListener('click',checkVennPractice);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)close()});
  return backdrop;
}

function openVennLab(){
  const dialog=buildVennDialog();
  vennReturnFocus=document.activeElement;
  dialog.hidden=false;
  document.body.classList.add('ipa92-venn-open');
  vennPracticeExpected=null;
  vennPracticeSelection.clear();
  setVennOperation('intersection');
  setTimeout(()=>dialog.querySelector('#ipa92VennClose')?.focus(),0);
}

function closeVennLab(){
  const dialog=document.getElementById(VENN_DIALOG_ID);
  if(!dialog||dialog.hidden)return;
  dialog.hidden=true;
  document.body.classList.remove('ipa92-venn-open');
  const target=vennReturnFocus;
  vennReturnFocus=null;
  if(target&&target.isConnected)setTimeout(()=>target.focus(),0);
}

function ensureVennLabCard(){
  const grid=document.getElementById('labLessonGrid');
  if(!grid)return;
  let card=document.getElementById(VENN_CARD_ID);
  if(card&&card.parentElement===grid)return;
  card?.remove();
  card=document.createElement('button');
  card.id=VENN_CARD_ID;
  card.type='button';
  card.className='ipa92-lab-card';
  card.setAttribute('aria-haspopup','dialog');
  card.innerHTML='<span class="ipa92-lab-icon">◉</span><span class="ipa92-lab-copy"><small>IPA Ver.9.2補強 / タッチ対応</small><b>集合・ベン図</b><em>領域を直接タップして、積集合・和集合・補集合・ド・モルガンを確認します。</em></span><span class="ipa92-lab-go">操作する →</span>';
  card.addEventListener('click',openVennLab);
  grid.appendChild(card);
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
  for(const target of [document.getElementById('readinessCard'),document.getElementById('homeReadiness'),document.getElementById('rightReadiness')]){
    if(!target||readinessTargets.has(target))continue;
    readinessObserver.observe(target,{childList:true,subtree:true,characterData:true});
    readinessTargets.add(target);
  }
}

function apply(){
  enhanceDiagnosticIntro();
  enhanceAccessDialog();
  enhanceReadiness();
  relocateStudyBlockBar();
  enhanceSyllabusBadge();
  ensureVennLabCard();
  ensureScopedReadinessObserver();
  scheduleHealthCheck(700);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleApply,{once:true});
else scheduleApply();

const structureObserver=new MutationObserver(()=>{
  scheduleApply();
  scheduleHealthCheck(700);
});
structureObserver.observe(document.documentElement,{childList:true,subtree:true});

setTimeout(()=>checkBlankShell(false),900);
setTimeout(()=>checkBlankShell(false),2400);
setTimeout(()=>checkBlankShell(false),5200);

globalThis.FEQUEST_FIRST_IMPRESSION_UX_V377=Object.freeze({
  version:VERSION,
  observerMode:'scoped-readiness',
  blankShellRecovery:'guarded-v2',
  studyBlockBarMode:'inline-active-screen',
  ipa92VennLab:'touch-v1',
  refresh:scheduleApply,
  recoverNow:()=>checkBlankShell(true),
  routeHealthy:routeIsHealthy,
  openVennLab
});
})();
