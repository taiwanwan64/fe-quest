(()=>{
'use strict';

const VERSION='ipa92-memory-lab-v1';
const CARD_ID='ipa92MemoryLabCard';
const DIALOG_ID='ipa92MemoryLabDialog';
const STYLE_ID='ipa92MemoryLabStyle';
const REFERENCES=Object.freeze([1,2,3,1,4,2,5,1]);
const ALGORITHMS=Object.freeze(['fifo','lru']);

function snapshotState(state,event){
  return Object.freeze({
    step:state.step,
    page:event.page,
    tlbHit:event.tlbHit,
    pageFault:event.pageFault,
    victim:event.victim,
    frameIndex:event.frameIndex,
    frames:Object.freeze([...state.frames]),
    tlb:Object.freeze(state.tlb.map(entry=>Object.freeze({...entry}))),
    pageHits:state.pageHits,
    pageFaults:state.pageFaults,
    tlbHits:state.tlbHits,
    tlbMisses:state.tlbMisses
  });
}

function createState(frameCount=3){
  return {
    step:0,
    frames:Array(frameCount).fill(null),
    loadedAt:Array(frameCount).fill(-1),
    lastUsed:Array(frameCount).fill(-1),
    tlb:[],
    pageHits:0,
    pageFaults:0,
    tlbHits:0,
    tlbMisses:0
  };
}

function chooseVictim(state,algorithm){
  if(algorithm==='fifo'){
    let candidate=0;
    for(let i=1;i<state.frames.length;i+=1)if(state.loadedAt[i]<state.loadedAt[candidate])candidate=i;
    return candidate;
  }
  let candidate=0;
  for(let i=1;i<state.frames.length;i+=1)if(state.lastUsed[i]<state.lastUsed[candidate])candidate=i;
  return candidate;
}

function touchTlb(state,page,frameIndex,capacity=2){
  state.tlb=state.tlb.filter(entry=>entry.page!==page&&entry.frame!==frameIndex);
  state.tlb.unshift({page,frame:frameIndex});
  state.tlb=state.tlb.slice(0,capacity);
}

function applyReference(state,page,algorithm,tlbCapacity=2){
  if(!ALGORITHMS.includes(algorithm))throw new Error(`unknown page replacement algorithm: ${algorithm}`);
  state.step+=1;
  let pageIndex=state.frames.indexOf(page);
  const tlbIndex=state.tlb.findIndex(entry=>entry.page===page&&state.frames[entry.frame]===page);
  const tlbHit=tlbIndex>=0;
  if(tlbHit)state.tlbHits+=1;else state.tlbMisses+=1;
  let pageFault=false;
  let victim=null;
  if(pageIndex>=0){
    state.pageHits+=1;
  }else{
    pageFault=true;
    state.pageFaults+=1;
    pageIndex=state.frames.indexOf(null);
    if(pageIndex<0){
      pageIndex=chooseVictim(state,algorithm);
      victim=state.frames[pageIndex];
      state.tlb=state.tlb.filter(entry=>entry.frame!==pageIndex&&entry.page!==victim);
    }
    state.frames[pageIndex]=page;
    state.loadedAt[pageIndex]=state.step;
  }
  state.lastUsed[pageIndex]=state.step;
  touchTlb(state,page,pageIndex,tlbCapacity);
  return snapshotState(state,{page,tlbHit,pageFault,victim,frameIndex:pageIndex});
}

function simulate(algorithm,references=REFERENCES,frameCount=3,tlbCapacity=2){
  const state=createState(frameCount);
  const steps=[];
  for(const page of references)steps.push(applyReference(state,page,algorithm,tlbCapacity));
  return steps;
}

function validateMemoryLab(){
  const fifo=simulate('fifo');
  const lru=simulate('lru');
  if(fifo.length!==REFERENCES.length||lru.length!==REFERENCES.length)throw new Error('memory lab step count invalid');
  const fifoLast=fifo.at(-1),lruLast=lru.at(-1);
  if(fifoLast.pageFaults!==6||fifoLast.pageHits!==2)throw new Error(`FIFO result invalid: faults=${fifoLast.pageFaults} hits=${fifoLast.pageHits}`);
  if(lruLast.pageFaults!==7||lruLast.pageHits!==1)throw new Error(`LRU result invalid: faults=${lruLast.pageFaults} hits=${lruLast.pageHits}`);
  if(fifoLast.frames.join(',')!=='4,5,1')throw new Error(`FIFO final frames invalid: ${fifoLast.frames}`);
  if(lruLast.frames.join(',')!=='5,1,2')throw new Error(`LRU final frames invalid: ${lruLast.frames}`);
  const tlbMissButPageHit=fifo.some(step=>!step.tlbHit&&!step.pageFault);
  if(!tlbMissButPageHit)throw new Error('memory lab must demonstrate TLB miss without page fault');
  return true;
}

let currentAlgorithm='fifo';
let currentSteps=[];
let currentIndex=-1;
let returnFocus=null;
let ensureScheduled=false;

function injectStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
body.ipa92-memory-open{overflow:hidden}
#${DIALOG_ID}[hidden]{display:none!important}
#${DIALOG_ID}{position:fixed;inset:0;z-index:2147482030;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(15,23,42,.62);backdrop-filter:blur(4px)}
.ipa92-memory-dialog{box-sizing:border-box;width:min(860px,100%);max-height:min(920px,calc(100dvh - 24px));overflow:auto;overscroll-behavior:contain;padding:20px;border-radius:22px;background:#fff;color:#24313d;box-shadow:0 28px 80px rgba(15,23,42,.28)}
.ipa92-memory-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.ipa92-memory-kicker{display:block;color:#2f6f16;font-size:11px;font-weight:900}.ipa92-memory-head h2{margin:3px 0 0;font-size:clamp(20px,4vw,28px)}.ipa92-memory-close{flex:0 0 auto;width:44px;height:44px;border:1px solid #d8dee5;border-radius:50%;background:#fff;font-size:24px;cursor:pointer}
.ipa92-memory-lead{margin:10px 0 14px;color:#52606d;font-size:13px;line-height:1.65}.ipa92-memory-tabs{display:flex;gap:8px;margin-bottom:12px}.ipa92-memory-tabs button{min-height:44px;padding:9px 16px;border:1px solid #d7dfe7;border-radius:999px;background:#fff;font-weight:800;cursor:pointer}.ipa92-memory-tabs button.is-active{border-color:#58cc02;background:#eef9e7;color:#2f6f16}
.ipa92-memory-reference{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 14px}.ipa92-memory-reference span{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#f1f5f9;font-weight:900}.ipa92-memory-reference span.is-current{background:#7c3aed;color:#fff;transform:translateY(-2px)}.ipa92-memory-reference span.is-past{background:#eef9e7;color:#2f6f16}
.ipa92-memory-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ipa92-memory-panel{padding:14px;border:1px solid #dbe4ec;border-radius:18px;background:#fbfcfd}.ipa92-memory-panel h3{margin:0 0 10px;font-size:15px}.ipa92-memory-frames{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ipa92-memory-frame{min-height:82px;padding:9px;border:2px solid #cbd5e1;border-radius:14px;background:#fff;text-align:center}.ipa92-memory-frame small{display:block;color:#64748b}.ipa92-memory-frame b{display:block;margin-top:6px;font-size:26px}.ipa92-memory-frame.is-active{border-color:#7c3aed;background:#f5f3ff}.ipa92-memory-frame.is-victim{border-color:#ef4444;background:#fff1f2}
.ipa92-memory-tlb{display:grid;gap:8px}.ipa92-memory-tlb-row{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #dbe4ec;border-radius:12px;background:#fff}.ipa92-memory-tlb-row b{font-size:14px}.ipa92-memory-tlb-row span{color:#64748b;font-size:12px}.ipa92-memory-empty{color:#64748b;font-size:13px;line-height:1.6}
.ipa92-memory-result{margin-top:12px;padding:13px 14px;border-radius:14px;background:#f1f5f9;color:#475569;font-size:13px;line-height:1.65}.ipa92-memory-result b{display:block;color:#24313d;margin-bottom:3px}.ipa92-memory-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.ipa92-memory-stat{padding:10px;border:1px solid #dbe4ec;border-radius:12px;background:#fff;text-align:center}.ipa92-memory-stat b{display:block;font-size:20px}.ipa92-memory-stat small{color:#64748b}.ipa92-memory-controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.ipa92-memory-controls button{min-height:46px;padding:9px 14px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;font-weight:800;cursor:pointer}.ipa92-memory-controls button[data-memory-next]{margin-left:auto;border-color:#58cc02;background:#58cc02;color:#fff}.ipa92-memory-note{margin-top:12px;padding:12px;border-radius:14px;background:#eef9e7;color:#315c20;font-size:12px;line-height:1.65}
@media(max-width:680px){.ipa92-memory-dialog{padding:16px;border-radius:18px}.ipa92-memory-grid{grid-template-columns:1fr}.ipa92-memory-stats{grid-template-columns:repeat(2,1fr)}.ipa92-memory-controls button{flex:1 1 40%}.ipa92-memory-controls button[data-memory-next]{margin-left:0}}
`;
  document.head.appendChild(style);
}

function selectAlgorithm(algorithm){
  currentAlgorithm=ALGORITHMS.includes(algorithm)?algorithm:'fifo';
  currentSteps=simulate(currentAlgorithm);
  currentIndex=-1;
  const dialog=document.getElementById(DIALOG_ID);
  if(dialog){
    dialog.querySelectorAll('[data-memory-algorithm]').forEach(button=>{
      const active=button.dataset.memoryAlgorithm===currentAlgorithm;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  render();
}

function render(){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog)return;
  const step=currentIndex>=0?currentSteps[currentIndex]:null;
  dialog.querySelectorAll('[data-reference-index]').forEach(element=>{
    const index=Number(element.dataset.referenceIndex);
    element.classList.toggle('is-past',index<currentIndex);
    element.classList.toggle('is-current',index===currentIndex);
  });
  const frames=step?step.frames:[null,null,null];
  const frameRoot=dialog.querySelector('[data-memory-frames]');
  if(frameRoot){
    frameRoot.innerHTML='';
    frames.forEach((page,index)=>{
      const box=document.createElement('div');
      box.className='ipa92-memory-frame';
      if(step&&index===step.frameIndex)box.classList.add('is-active');
      if(step&&step.victim!==null&&page===step.page&&index===step.frameIndex)box.dataset.replaced=String(step.victim);
      box.innerHTML=`<small>フレーム ${index}</small><b>${page===null?'—':page}</b>`;
      frameRoot.appendChild(box);
    });
  }
  const tlbRoot=dialog.querySelector('[data-memory-tlb]');
  if(tlbRoot){
    tlbRoot.innerHTML='';
    const entries=step?step.tlb:[];
    if(!entries.length){const p=document.createElement('div');p.className='ipa92-memory-empty';p.textContent='まだTLBに変換情報はありません。ページを参照すると、直近のページ→フレーム対応が入ります。';tlbRoot.appendChild(p)}
    else entries.forEach((entry,index)=>{const row=document.createElement('div');row.className='ipa92-memory-tlb-row';row.innerHTML=`<b>ページ ${entry.page} → フレーム ${entry.frame}</b><span>${index===0?'直近':'2番目'}</span>`;tlbRoot.appendChild(row)});
  }
  const result=dialog.querySelector('[data-memory-result]');
  if(result){
    if(!step)result.innerHTML='<b>開始前</b>「1参照進める」を押し、まずTLBを探し、次に主記憶のページ表を確認する流れを追ってください。';
    else{
      const tlbText=step.tlbHit?'TLBヒット':'TLBミス';
      const pageText=step.pageFault?`ページフォールト${step.victim!==null?`。ページ${step.victim}を置換`:''}`:'主記憶には存在（ページヒット）';
      result.innerHTML=`<b>ページ ${step.page}：${tlbText} → ${pageText}</b>${step.tlbHit?'TLBだけで対応フレームをすぐ特定できます。':step.pageFault?'主記憶にも無いため、補助記憶からページを読み込みます。':'TLBには無くても主記憶にはあるため、ページフォールトにはなりません。'}`;
    }
  }
  const values={pageHits:step?.pageHits||0,pageFaults:step?.pageFaults||0,tlbHits:step?.tlbHits||0,tlbMisses:step?.tlbMisses||0};
  for(const [key,value] of Object.entries(values)){const node=dialog.querySelector(`[data-memory-stat="${key}"]`);if(node)node.textContent=String(value)}
  const progress=dialog.querySelector('[data-memory-progress]');
  if(progress)progress.textContent=currentIndex<0?`0 / ${REFERENCES.length}`:`${currentIndex+1} / ${REFERENCES.length}`;
  const next=dialog.querySelector('[data-memory-next]');
  if(next)next.disabled=currentIndex>=currentSteps.length-1;
}

function moveNext(){if(currentIndex<currentSteps.length-1){currentIndex+=1;render()}}
function finish(){currentIndex=currentSteps.length-1;render()}
function reset(){currentIndex=-1;render()}

function buildDialog(){
  injectStyles();
  let backdrop=document.getElementById(DIALOG_ID);
  if(backdrop)return backdrop;
  backdrop=document.createElement('div');
  backdrop.id=DIALOG_ID;
  backdrop.hidden=true;
  const refs=REFERENCES.map((page,index)=>`<span data-reference-index="${index}">${page}</span>`).join('');
  backdrop.innerHTML=`
    <section class="ipa92-memory-dialog" role="dialog" aria-modal="true" aria-labelledby="ipa92MemoryTitle">
      <div class="ipa92-memory-head"><div><span class="ipa92-memory-kicker">図解・操作ラボ / IPA Ver.9.2補強</span><h2 id="ipa92MemoryTitle">TLB・ページ置換を1参照ずつ追う</h2></div><button type="button" class="ipa92-memory-close" data-memory-close aria-label="TLB・ページ置換ラボを閉じる">×</button></div>
      <p class="ipa92-memory-lead">仮想ページを3個の主記憶フレームへ読み込みます。TLBは直近2件の「ページ→フレーム」対応だけを保持します。FIFOとLRUで置換結果がどう変わるか比較してください。</p>
      <div class="ipa92-memory-tabs" role="group" aria-label="ページ置換方式を選択"><button type="button" data-memory-algorithm="fifo">FIFO</button><button type="button" data-memory-algorithm="lru">LRU</button></div>
      <div><b>参照列</b><span data-memory-progress style="float:right;color:#64748b;font-size:12px;font-weight:800">0 / ${REFERENCES.length}</span></div><div class="ipa92-memory-reference">${refs}</div>
      <div class="ipa92-memory-grid"><section class="ipa92-memory-panel"><h3>主記憶のページフレーム</h3><div class="ipa92-memory-frames" data-memory-frames></div></section><section class="ipa92-memory-panel"><h3>TLB（変換情報のキャッシュ・2件）</h3><div class="ipa92-memory-tlb" data-memory-tlb></div></section></div>
      <div class="ipa92-memory-result" data-memory-result aria-live="polite"></div>
      <div class="ipa92-memory-stats"><div class="ipa92-memory-stat"><b data-memory-stat="pageHits">0</b><small>ページヒット</small></div><div class="ipa92-memory-stat"><b data-memory-stat="pageFaults">0</b><small>ページフォールト</small></div><div class="ipa92-memory-stat"><b data-memory-stat="tlbHits">0</b><small>TLBヒット</small></div><div class="ipa92-memory-stat"><b data-memory-stat="tlbMisses">0</b><small>TLBミス</small></div></div>
      <div class="ipa92-memory-controls"><button type="button" data-memory-reset>最初から</button><button type="button" data-memory-finish>最後まで</button><button type="button" data-memory-next>1参照進める →</button></div>
      <div class="ipa92-memory-note"><b>重要：</b>TLBミスとページフォールトは別物です。TLBに変換情報が無くても、目的のページが主記憶にあればページフォールトは発生しません。FIFOは「最も古く読み込んだページ」、LRUは「最も長く使っていないページ」を置換します。</div>
    </section>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('[data-memory-close]')?.addEventListener('click',closeLab);
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeLab()});
  backdrop.querySelectorAll('[data-memory-algorithm]').forEach(button=>button.addEventListener('click',()=>selectAlgorithm(button.dataset.memoryAlgorithm)));
  backdrop.querySelector('[data-memory-reset]')?.addEventListener('click',reset);
  backdrop.querySelector('[data-memory-finish]')?.addEventListener('click',finish);
  backdrop.querySelector('[data-memory-next]')?.addEventListener('click',moveNext);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)closeLab()});
  return backdrop;
}

function openLab(){
  const dialog=buildDialog();
  returnFocus=document.activeElement;
  dialog.hidden=false;
  document.body.classList.add('ipa92-memory-open');
  selectAlgorithm(currentAlgorithm||'fifo');
  setTimeout(()=>dialog.querySelector('[data-memory-close]')?.focus(),0);
}

function closeLab(){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog||dialog.hidden)return;
  dialog.hidden=true;
  document.body.classList.remove('ipa92-memory-open');
  const target=returnFocus;
  returnFocus=null;
  if(target&&target.isConnected)setTimeout(()=>target.focus(),0);
}

function ensureCard(){
  const grid=document.getElementById('labLessonGrid');
  if(!grid)return false;
  let card=document.getElementById(CARD_ID);
  if(card&&card.parentElement===grid)return true;
  card?.remove();
  card=document.createElement('button');
  card.id=CARD_ID;
  card.type='button';
  card.className='ipa92-lab-card';
  card.setAttribute('aria-haspopup','dialog');
  card.innerHTML='<span class="ipa92-lab-icon">▦</span><span class="ipa92-lab-copy"><small>IPA Ver.9.2補強 / タッチ対応</small><b>TLB・ページ置換</b><em>参照列を1つずつ進め、FIFO・LRUとTLBヒットを同時に追います。</em></span><span class="ipa92-lab-go">操作する →</span>';
  card.addEventListener('click',openLab);
  grid.appendChild(card);
  return true;
}

function scheduleEnsure(){
  if(ensureScheduled)return;
  ensureScheduled=true;
  const run=()=>{ensureScheduled=false;ensureCard()};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0);
}

validateMemoryLab();
injectStyles();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleEnsure,{once:true});else scheduleEnsure();
new MutationObserver(scheduleEnsure).observe(document.documentElement,{childList:true,subtree:true});

globalThis.FEQUEST_IPA92_MEMORY_LAB=Object.freeze({version:VERSION,open:openLab,validate:validateMemoryLab,simulate:(algorithm)=>simulate(algorithm),references:REFERENCES});
})();