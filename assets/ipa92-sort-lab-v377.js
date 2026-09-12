(()=>{
'use strict';

const VERSION='ipa92-sort-lab-v1';
const CARD_ID='ipa92SortLabCard';
const DIALOG_ID='ipa92SortLabDialog';
const STYLE_ID='ipa92SortLabStyle';
const INITIAL_VALUES=Object.freeze([8,3,6,1,5,4]);
const ALGORITHM_ORDER=Object.freeze(['merge','insertion','shell','heap']);

const ALGORITHMS=Object.freeze({
  merge:{
    label:'マージソート',
    short:'分割 → 併合',
    cue:'小さく分割し、整列済みの列を比較しながら併合する分割統治法です。',
    target:'分割した区間が、最後に一つの整列済み配列へ戻る流れを追います。'
  },
  insertion:{
    label:'挿入ソート',
    short:'整列済み部分へ挿入',
    cue:'左側を整列済みとみなし、次の値を正しい位置へ差し込みます。',
    target:'手札を並べるように、整列済み部分が左から広がる様子を追います。'
  },
  shell:{
    label:'シェルソート',
    short:'gapを縮める挿入',
    cue:'離れた要素をgapごとに挿入ソートし、gapを小さくして最後は1にします。',
    target:'最初に離れた位置を大まかに整え、最後に細かく仕上げる流れを追います。'
  },
  heap:{
    label:'ヒープソート',
    short:'ヒープ → 根を確定',
    cue:'最大ヒープを作り、根の最大値を末尾へ移してヒープを作り直します。',
    target:'配列とヒープ木を同時に見て、根と末尾の役割を結び付けます。'
  }
});

let currentAlgorithm='merge';
let currentSteps=[];
let currentStepIndex=0;
let returnFocus=null;
let ensureScheduled=false;

function range(start,end){
  const result=[];
  for(let i=start;i<end;i+=1)result.push(i);
  return result;
}

function snapshot(values,note,{active=[],sorted=[],meta='',heapSize=null}={}){
  return {
    values:[...values],
    note:String(note||''),
    active:[...new Set(active)].filter(Number.isInteger),
    sorted:[...new Set(sorted)].filter(Number.isInteger),
    meta:String(meta||''),
    heapSize:Number.isInteger(heapSize)?heapSize:null
  };
}

function mergeSteps(input){
  const a=[...input];
  const steps=[snapshot(a,'開始。まず配列を小さな区間へ分けます。',{meta:'分割統治：分割フェーズ'})];
  const sort=(left,right)=>{
    if(right-left<=1)return;
    const mid=Math.floor((left+right)/2);
    steps.push(snapshot(a,`区間 ${left}〜${right-1} を ${left}〜${mid-1} と ${mid}〜${right-1} に分割します。`,{active:range(left,right),meta:'分割'}));
    sort(left,mid);
    sort(mid,right);
    const leftValues=a.slice(left,mid);
    const rightValues=a.slice(mid,right);
    let i=0,j=0,k=left;
    while(i<leftValues.length&&j<rightValues.length){
      if(leftValues[i]<=rightValues[j])a[k++]=leftValues[i++];
      else a[k++]=rightValues[j++];
    }
    while(i<leftValues.length)a[k++]=leftValues[i++];
    while(j<rightValues.length)a[k++]=rightValues[j++];
    steps.push(snapshot(a,`左右の整列済み区間を小さい値から取り出して、${left}〜${right-1} を併合しました。`,{active:range(left,right),meta:`併合：${left}〜${mid-1} + ${mid}〜${right-1}`}));
  };
  sort(0,a.length);
  steps.push(snapshot(a,'全ての区間が一つに併合され、昇順に整列しました。',{sorted:range(0,a.length),meta:'完成'}));
  return steps;
}

function insertionSteps(input){
  const a=[...input];
  const steps=[snapshot(a,'開始。左端1個を「整列済み」と考えます。',{sorted:[0],meta:'整列済み：0番'})];
  for(let i=1;i<a.length;i+=1){
    const key=a[i];
    steps.push(snapshot(a,`${key} を取り出し、左側の整列済み部分のどこへ入るか調べます。`,{active:[i],sorted:range(0,i),meta:`挿入する値：${key}`}));
    let j=i-1;
    while(j>=0&&a[j]>key){
      a[j+1]=a[j];
      j-=1;
    }
    a[j+1]=key;
    steps.push(snapshot(a,`${key} を位置 ${j+1} へ挿入しました。左側 ${i+1} 個が整列済みです。`,{active:[j+1],sorted:range(0,i+1),meta:`整列済み：0〜${i}`}));
  }
  steps.push(snapshot(a,'全要素の挿入が終わり、昇順に整列しました。',{sorted:range(0,a.length),meta:'完成'}));
  return steps;
}

function shellSteps(input){
  const a=[...input];
  const steps=[snapshot(a,'開始。離れた要素を先に整えてから、間隔を縮めます。',{meta:'gapを使う挿入ソート'})];
  const gaps=[];
  for(let gap=Math.floor(a.length/2);gap>0;gap=Math.floor(gap/2)){
    if(!gaps.includes(gap))gaps.push(gap);
    if(gap===1)break;
  }
  if(!gaps.includes(1))gaps.push(1);
  for(const gap of gaps){
    steps.push(snapshot(a,`gap=${gap}。${gap} 個離れた要素どうしを同じグループとして挿入ソートします。`,{meta:`gap = ${gap}`}));
    for(let i=gap;i<a.length;i+=1){
      const temp=a[i];
      let j=i;
      while(j>=gap&&a[j-gap]>temp){
        a[j]=a[j-gap];
        j-=gap;
      }
      a[j]=temp;
      steps.push(snapshot(a,`${temp} を gap=${gap} の並びで位置 ${j} へ移しました。`,{active:[j,i],meta:`gap = ${gap}`}));
    }
  }
  steps.push(snapshot(a,'最後に gap=1 の挿入ソートを終え、昇順に整列しました。',{sorted:range(0,a.length),meta:'完成'}));
  return steps;
}

function heapSteps(input){
  const a=[...input];
  const total=a.length;
  const steps=[snapshot(a,'開始。配列を完全二分木として見て、最大ヒープを作ります。',{heapSize:total,meta:'ヒープ構築'})];
  const sortedForSize=size=>range(size,total);
  const heapify=(size,start)=>{
    let root=start;
    while(true){
      const left=root*2+1;
      const right=root*2+2;
      let largest=root;
      if(left<size&&a[left]>a[largest])largest=left;
      if(right<size&&a[right]>a[largest])largest=right;
      if(largest===root)break;
      const beforeRoot=a[root];
      const beforeChild=a[largest];
      [a[root],a[largest]]=[a[largest],a[root]];
      steps.push(snapshot(a,`${beforeRoot} と子 ${beforeChild} を比較し、大きい ${beforeChild} を親側へ上げました。`,{active:[root,largest],sorted:sortedForSize(size),heapSize:size,meta:'ヒープ条件を回復'}));
      root=largest;
    }
  };
  for(let i=Math.floor(total/2)-1;i>=0;i-=1)heapify(total,i);
  steps.push(snapshot(a,'最大値が根（添字0）に来る最大ヒープができました。',{active:[0],heapSize:total,meta:'最大ヒープ完成'}));
  for(let end=total-1;end>0;end-=1){
    const max=a[0];
    [a[0],a[end]]=[a[end],a[0]];
    steps.push(snapshot(a,`根の最大値 ${max} を末尾 ${end} へ移し、この位置を確定します。`,{active:[0,end],sorted:range(end,total),heapSize:end,meta:`確定済み：${end}〜${total-1}`}));
    heapify(end,0);
  }
  steps.push(snapshot(a,'根の取り出しと再ヒープ化を繰り返し、昇順に整列しました。',{sorted:range(0,total),heapSize:0,meta:'完成'}));
  return steps;
}

function buildSteps(key,input=INITIAL_VALUES){
  if(key==='merge')return mergeSteps(input);
  if(key==='insertion')return insertionSteps(input);
  if(key==='shell')return shellSteps(input);
  if(key==='heap')return heapSteps(input);
  throw new Error(`unknown sort algorithm: ${key}`);
}

function validateAlgorithms(){
  const expected=[...INITIAL_VALUES].sort((a,b)=>a-b).join(',');
  for(const key of ALGORITHM_ORDER){
    const steps=buildSteps(key);
    if(!steps.length)throw new Error(`IPA 9.2 sort lab has no steps: ${key}`);
    const actual=steps.at(-1).values.join(',');
    if(actual!==expected)throw new Error(`IPA 9.2 sort lab final state invalid: ${key} => ${actual}`);
  }
  return true;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
body.ipa92-sort-open{overflow:hidden}
#${DIALOG_ID}[hidden]{display:none!important}
#${DIALOG_ID}{position:fixed;inset:0;z-index:2147482010;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(15,23,42,.6);backdrop-filter:blur(4px)}
.ipa92-sort-dialog{box-sizing:border-box;width:min(820px,100%);max-height:min(900px,calc(100dvh - 24px));overflow:auto;overscroll-behavior:contain;padding:20px;border-radius:22px;background:#fff;color:#24313d;box-shadow:0 28px 80px rgba(15,23,42,.28)}
.ipa92-sort-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.ipa92-sort-kicker{display:block;margin-bottom:3px;color:#2f6f16;font-size:11px;font-weight:900;letter-spacing:.03em}.ipa92-sort-head h2{margin:0;font-size:clamp(20px,4vw,28px);line-height:1.25}.ipa92-sort-close{flex:0 0 auto;width:44px;height:44px;border:1px solid #d8dee5;border-radius:50%;background:#fff;color:#334155;font-size:24px;line-height:1;cursor:pointer}
.ipa92-sort-lead{margin:10px 0 14px;color:#52606d;font-size:13px;line-height:1.65}.ipa92-sort-tabs{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 10px;scrollbar-width:thin}.ipa92-sort-tabs button{flex:0 0 auto;min-height:44px;padding:8px 13px;border:1px solid #d7dfe7;border-radius:999px;background:#fff;color:#334155;font-weight:800;cursor:pointer}.ipa92-sort-tabs button.is-active{border-color:#58cc02;background:#eef9e7;color:#2f6f16}
.ipa92-sort-stage{padding:14px;border:1px solid #e2e8f0;border-radius:18px;background:#fbfcfd}.ipa92-sort-stage-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.ipa92-sort-stage-head b{font-size:15px}.ipa92-sort-progress{color:#64748b;font-size:12px;font-weight:800}.ipa92-sort-array{display:grid;grid-template-columns:repeat(6,minmax(40px,1fr));gap:8px;align-items:end;min-height:210px;padding:12px 6px 4px}.ipa92-sort-cell{position:relative;display:grid;grid-template-rows:1fr auto auto;align-items:end;gap:5px;min-width:0;height:190px;padding:6px;border:2px solid transparent;border-radius:12px;background:#f1f5f9;transition:transform .18s ease,border-color .18s ease,background .18s ease}.ipa92-sort-cell.is-active{border-color:#7c3aed;background:#f5f3ff;transform:translateY(-3px)}.ipa92-sort-cell.is-sorted{border-color:#58cc02;background:#f2faed}.ipa92-sort-bar{align-self:end;width:100%;min-height:18px;border-radius:8px 8px 4px 4px;background:#94a3b8}.ipa92-sort-cell.is-active .ipa92-sort-bar{background:#7c3aed}.ipa92-sort-cell.is-sorted .ipa92-sort-bar{background:#58cc02}.ipa92-sort-value{text-align:center;font-size:17px;font-weight:900}.ipa92-sort-index{text-align:center;color:#64748b;font-size:10px}.ipa92-sort-marker{position:absolute;top:5px;right:6px;color:#5b21b6;font-size:10px;font-weight:900}.ipa92-sort-cell.is-sorted .ipa92-sort-marker{color:#2f6f16}
.ipa92-sort-readout{display:grid;gap:5px;margin-top:12px;padding:13px 14px;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 1px #e2e8f0}.ipa92-sort-readout b{color:#1f5f0c;font-size:14px}.ipa92-sort-readout span{color:#52606d;font-size:13px;line-height:1.65}.ipa92-sort-heap-wrap[hidden]{display:none!important}.ipa92-sort-heap-wrap{margin-top:12px;padding:12px;border:1px solid #dbe4ec;border-radius:14px;background:#fff}.ipa92-sort-heap-wrap b{display:block;margin-bottom:6px;font-size:12px;color:#475569}.ipa92-sort-heap{display:block;width:100%;max-height:205px}.ipa92-sort-heap line{stroke:#94a3b8;stroke-width:2}.ipa92-sort-heap circle{fill:#eef9e7;stroke:#58cc02;stroke-width:2}.ipa92-sort-heap circle.is-active{fill:#f5f3ff;stroke:#7c3aed;stroke-width:3}.ipa92-sort-heap text{fill:#24313d;font-size:14px;font-weight:900;text-anchor:middle;dominant-baseline:middle;pointer-events:none}
.ipa92-sort-cue{display:grid;gap:4px;margin-top:12px;padding:12px 14px;border:1px solid #ded8fa;border-radius:14px;background:#f7f5ff}.ipa92-sort-cue b{font-size:12px;color:#4c3f91}.ipa92-sort-cue span{font-size:12px;line-height:1.6;color:#5f6272}.ipa92-sort-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.ipa92-sort-controls button{min-height:46px;padding:9px 10px;border:1px solid #d7dfe7;border-radius:12px;background:#fff;color:#334155;font-weight:900;cursor:pointer}.ipa92-sort-controls button[data-sort-next]{border-color:#58cc02;background:#58cc02;color:#fff}.ipa92-sort-controls button:disabled{background:#e2e8f0;border-color:#e2e8f0;color:#94a3b8;cursor:not-allowed}
.ipa92-sort-close:focus-visible,.ipa92-sort-tabs button:focus-visible,.ipa92-sort-controls button:focus-visible{outline:3px solid rgba(88,204,2,.25);outline-offset:2px}
@media(max-width:640px){.ipa92-sort-dialog{padding:15px;border-radius:18px}.ipa92-sort-array{gap:5px;min-height:170px;padding-left:0;padding-right:0}.ipa92-sort-cell{height:155px;padding:4px}.ipa92-sort-value{font-size:15px}.ipa92-sort-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.ipa92-sort-stage{padding:10px}.ipa92-sort-stage-head{align-items:flex-start;flex-direction:column;gap:3px}}
@media(prefers-reduced-motion:reduce){.ipa92-sort-cell{transition:none!important}}
`;
  document.head.appendChild(style);
}

function heapSvg(step){
  const size=step.heapSize??0;
  if(size<=0)return '<svg class="ipa92-sort-heap" viewBox="0 0 320 185" role="img" aria-label="ヒープ部分は空です"></svg>';
  const positions=[[160,27],[88,82],[232,82],[48,145],[128,145],[208,145],[288,145]];
  const active=new Set(step.active);
  let lines='';
  let nodes='';
  for(let i=1;i<size&&i<positions.length;i+=1){
    const parent=Math.floor((i-1)/2);
    const [x1,y1]=positions[parent];
    const [x2,y2]=positions[i];
    lines+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  for(let i=0;i<size&&i<positions.length;i+=1){
    const [x,y]=positions[i];
    nodes+=`<circle cx="${x}" cy="${y}" r="21"${active.has(i)?' class="is-active"':''}/><text x="${x}" y="${y}">${step.values[i]}</text>`;
  }
  return `<svg class="ipa92-sort-heap" viewBox="0 0 320 185" role="img" aria-label="現在の最大ヒープ。${step.values.slice(0,size).join('、')}">${lines}${nodes}</svg>`;
}

function renderStep(){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog||!currentSteps.length)return;
  const step=currentSteps[currentStepIndex];
  const active=new Set(step.active);
  const sorted=new Set(step.sorted);
  const array=dialog.querySelector('[data-sort-array]');
  if(array){
    array.setAttribute('aria-label',`現在の配列: ${step.values.join('、')}`);
    array.innerHTML=step.values.map((value,index)=>{
      const classes=['ipa92-sort-cell'];
      if(active.has(index))classes.push('is-active');
      if(sorted.has(index))classes.push('is-sorted');
      const marker=sorted.has(index)?'確定':active.has(index)?'処理中':'';
      const height=Math.max(22,Math.round(value/Math.max(...INITIAL_VALUES)*100));
      return `<div class="${classes.join(' ')}" aria-label="添字${index}、値${value}${marker?`、${marker}`:''}"><span class="ipa92-sort-marker">${marker}</span><span class="ipa92-sort-bar" style="height:${height}%" aria-hidden="true"></span><b class="ipa92-sort-value">${value}</b><small class="ipa92-sort-index">[${index}]</small></div>`;
    }).join('');
  }
  const title=dialog.querySelector('[data-sort-step-title]');
  const note=dialog.querySelector('[data-sort-step-note]');
  const progress=dialog.querySelector('[data-sort-progress]');
  if(title)title.textContent=step.meta||ALGORITHMS[currentAlgorithm].short;
  if(note)note.textContent=step.note;
  if(progress)progress.textContent=`手順 ${currentStepIndex+1} / ${currentSteps.length}`;
  const heapWrap=dialog.querySelector('[data-sort-heap-wrap]');
  if(heapWrap){
    heapWrap.hidden=currentAlgorithm!=='heap';
    const heap=heapWrap.querySelector('[data-sort-heap]');
    if(heap)heap.innerHTML=currentAlgorithm==='heap'?heapSvg(step):'';
  }
  const prev=dialog.querySelector('[data-sort-prev]');
  const next=dialog.querySelector('[data-sort-next]');
  if(prev)prev.disabled=currentStepIndex===0;
  if(next)next.disabled=currentStepIndex>=currentSteps.length-1;
}

function selectAlgorithm(key){
  if(!ALGORITHMS[key])return;
  currentAlgorithm=key;
  currentSteps=buildSteps(key);
  currentStepIndex=0;
  const dialog=document.getElementById(DIALOG_ID);
  if(dialog){
    for(const button of dialog.querySelectorAll('[data-sort-algorithm]')){
      const selected=button.dataset.sortAlgorithm===key;
      button.classList.toggle('is-active',selected);
      button.setAttribute('aria-pressed',String(selected));
    }
    const label=dialog.querySelector('[data-sort-algorithm-label]');
    const cue=dialog.querySelector('[data-sort-cue]');
    const target=dialog.querySelector('[data-sort-target]');
    if(label)label.textContent=ALGORITHMS[key].label;
    if(cue)cue.textContent=ALGORITHMS[key].cue;
    if(target)target.textContent=ALGORITHMS[key].target;
  }
  renderStep();
}

function moveStep(delta){
  currentStepIndex=Math.max(0,Math.min(currentSteps.length-1,currentStepIndex+delta));
  renderStep();
}

function buildDialog(){
  injectStyles();
  let backdrop=document.getElementById(DIALOG_ID);
  if(backdrop)return backdrop;
  backdrop=document.createElement('div');
  backdrop.id=DIALOG_ID;
  backdrop.hidden=true;
  backdrop.innerHTML=`
    <section class="ipa92-sort-dialog" role="dialog" aria-modal="true" aria-labelledby="ipa92SortLabTitle">
      <div class="ipa92-sort-head">
        <div><span class="ipa92-sort-kicker">図解・操作ラボ / IPA Ver.9.2補強</span><h2 id="ipa92SortLabTitle">整列アルゴリズムを1手ずつ追う</h2></div>
        <button type="button" class="ipa92-sort-close" data-sort-close aria-label="整列アルゴリズムラボを閉じる">×</button>
      </div>
      <p class="ipa92-sort-lead">同じ配列を4種類の方法で昇順にします。「1手進める」をタップし、値がどこへ動くかを比較してください。</p>
      <div class="ipa92-sort-tabs" role="group" aria-label="整列アルゴリズムを選択">
        <button type="button" data-sort-algorithm="merge">マージ</button>
        <button type="button" data-sort-algorithm="insertion">挿入</button>
        <button type="button" data-sort-algorithm="shell">シェル</button>
        <button type="button" data-sort-algorithm="heap">ヒープ</button>
      </div>
      <div class="ipa92-sort-stage">
        <div class="ipa92-sort-stage-head"><b data-sort-algorithm-label>マージソート</b><span class="ipa92-sort-progress" data-sort-progress>手順 1 / 1</span></div>
        <div class="ipa92-sort-array" data-sort-array role="img" aria-label="現在の配列"></div>
        <div class="ipa92-sort-heap-wrap" data-sort-heap-wrap hidden><b>配列と同じ値をヒープ木として見る</b><div data-sort-heap></div></div>
        <div class="ipa92-sort-readout" aria-live="polite"><b data-sort-step-title>開始</b><span data-sort-step-note></span></div>
      </div>
      <div class="ipa92-sort-cue"><b>試験での見分け方</b><span data-sort-cue></span><span data-sort-target></span></div>
      <div class="ipa92-sort-controls">
        <button type="button" data-sort-reset>最初から</button>
        <button type="button" data-sort-prev>← 1手戻す</button>
        <button type="button" data-sort-next>1手進める →</button>
        <button type="button" data-sort-finish>最後まで</button>
      </div>
    </section>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('[data-sort-close]')?.addEventListener('click',closeLab);
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeLab()});
  backdrop.querySelectorAll('[data-sort-algorithm]').forEach(button=>button.addEventListener('click',()=>selectAlgorithm(button.dataset.sortAlgorithm)));
  backdrop.querySelector('[data-sort-reset]')?.addEventListener('click',()=>{currentStepIndex=0;renderStep()});
  backdrop.querySelector('[data-sort-prev]')?.addEventListener('click',()=>moveStep(-1));
  backdrop.querySelector('[data-sort-next]')?.addEventListener('click',()=>moveStep(1));
  backdrop.querySelector('[data-sort-finish]')?.addEventListener('click',()=>{currentStepIndex=currentSteps.length-1;renderStep()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)closeLab()});
  return backdrop;
}

function openLab(){
  const dialog=buildDialog();
  returnFocus=document.activeElement;
  dialog.hidden=false;
  document.body.classList.add('ipa92-sort-open');
  selectAlgorithm(currentAlgorithm||'merge');
  setTimeout(()=>dialog.querySelector('[data-sort-close]')?.focus(),0);
}

function closeLab(){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog||dialog.hidden)return;
  dialog.hidden=true;
  document.body.classList.remove('ipa92-sort-open');
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
  card.innerHTML='<span class="ipa92-lab-icon">⇅</span><span class="ipa92-lab-copy"><small>IPA Ver.9.2補強 / タッチ対応</small><b>整列アルゴリズム</b><em>マージ・挿入・シェル・ヒープを同じ配列で1手ずつ比較します。</em></span><span class="ipa92-lab-go">操作する →</span>';
  card.addEventListener('click',openLab);
  grid.appendChild(card);
  return true;
}

function scheduleEnsure(){
  if(ensureScheduled)return;
  ensureScheduled=true;
  const run=()=>{ensureScheduled=false;ensureCard()};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);
  else setTimeout(run,0);
}

validateAlgorithms();
injectStyles();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleEnsure,{once:true});
else scheduleEnsure();
new MutationObserver(scheduleEnsure).observe(document.documentElement,{childList:true,subtree:true});

globalThis.FEQUEST_IPA92_SORT_LAB=Object.freeze({version:VERSION,open:openLab,validate:validateAlgorithms,buildSteps:(key)=>buildSteps(key).map(step=>({...step,values:[...step.values],active:[...step.active],sorted:[...step.sorted]}))});
})();
