function stackQueueInitialStateV360(){
  return {stack:['A','B','C'],queue:['A','B','C'],nextStack:3,nextQueue:3};
}

function stackQueueApplyV360(state,operation){
  if(operation==='reset') return {state:stackQueueInitialStateV360(),event:{operation}};
  if(!['push','pop','enqueue','dequeue'].includes(operation)) return {state,event:null};
  const kind=(operation==='push'||operation==='pop')?'stack':'queue';
  const adding=operation==='push'||operation==='enqueue';
  const before=state[kind];
  // Six is a display limit for this exercise, not a property of stacks/queues.
  if((adding&&before.length>=6)||(!adding&&!before.length)) return {state,event:null};
  const next={...state,stack:[...state.stack],queue:[...state.queue]};
  let value;
  if(adding){
    const key=kind==='stack'?'nextStack':'nextQueue';
    const n=next[key]++;
    value=String.fromCharCode(65+n%26)+(n>=26?String(Math.floor(n/26)):'');
    next[kind].push(value);
  }else value=kind==='stack'?next.stack.pop():next.queue.shift();
  return {state:next,event:{operation,kind,adding,value,before:[...before],after:[...next[kind]]}};
}

function stackQueueCardsV360(stack,queue){
  const panel=(kind,values)=>{
    const isStack=kind==='stack';
    const name=isStack?'スタック':'キュー';
    const shown=isStack?[...values].reverse():[...values];
    return `<section class="sq-panel-v360 sq-${kind}-v360" data-sq-kind="${kind}" aria-label="${name}の現在の中身">
      <h4>${name}</h4><div class="sq-rule-name-v360"><span>${isStack?'LIFO':'FIFO'}</span><span>${isStack?'後入れ先出し':'先入れ先出し'}</span></div>
      <div class="sq-end-v360"><b><span>${isStack?'TOP':'FRONT'}</span><span>${isStack?'（頂上）':'（先頭）'}</span></b><span class="sq-actions-v360">${isStack?'<span>追加 ↓</span>':''}<span>取り出し ↑</span></span></div>
      <ol class="sq-values-v360" aria-label="${isStack?'頂上から底':'先頭から末尾'}の順">
        ${shown.length?shown.map((value,i)=>`<li class="${i===0?'sq-next-v360':''}" data-sq-value="${escapeHtml(String(value))}"><b>${escapeHtml(String(value))}</b>${i===0?'<span>次に出る</span>':''}</li>`).join(''):'<li class="sq-empty-v360">空です</li>'}
      </ol>
      <div class="sq-end-v360 sq-bottom-v360"><b>${isStack?'底':'<span>REAR</span><span>（末尾）</span>'}</b><span>${isStack?'操作しない側':'追加 ↑'}</span></div>
    </section>`;
  };
  return `<div class="sq-cards-v360">${panel('stack',stack)}${panel('queue',queue)}</div>`;
}

function coreTopicStackQueueDiagramViewV360(id){
  if(id!=='core_03_01') return '';
  return `<figure class="sq-figure-v360" aria-labelledby="sqCaptionV360">
    <figcaption id="sqCaptionV360">同じ順に入れても、取り出す順は違う</figcaption>
    <p class="sq-lead-v360">どちらも <b>A → B → C</b> の順に追加した直後です。「次に出る」要素と、出し入れする位置を比べましょう。</p>
    ${stackQueueCardsV360(['A','B','C'],['A','B','C'])}
    <div class="sq-results-v360">
      <section><h4>スタックを1回POP</h4><b>C が出る</b><span>残り（底 → 頂上）</span><code>A → B</code></section>
      <section><h4>キューを1回DEQUEUE</h4><b>A が出る</b><span>残り（先頭 → 末尾）</span><code>B → C</code></section>
    </div>
    <p class="sq-takeaway-v360"><b>途中で追加せず、全部取り出すと？</b><span>スタック：C → B → A<br>キュー：A → B → C</span></p>
    <p class="sq-footnote-v360">PUSH／ENQUEUEは追加、POP／DEQUEUEは取り出しです。LIFOはLast In, First Out、FIFOはFirst In, First Outの略です。この図は操作の順序を表し、実際のメモリ配置を表すものではありません。</p>
  </figure>`;
}

function stackQueueOperationTextV360(text){
  // Here POP names a stack operation, not the mail protocol. An explicit label
  // also prevents the existing generic abbreviation expander from mixing them.
  return String(text??'').replace(/\bPOP\b(?!\s*[（(])/g,'POP（取り出し操作）');
}

function renderStackQueueExperienceV360(stage){
  let state=stackQueueInitialStateV360();
  stage.innerHTML=`<section class="sq-demo-v360" aria-label="スタックとキューの操作体験">
    <p class="sq-lead-v360">まずPOPとDEQUEUEを1回ずつ試しましょう。追加や繰り返し操作は任意です。最初は両方ともA → B → Cの順に追加済みです。</p>
    <div class="sq-board-v360"></div>
    <div class="sq-controls-v360">
      <div role="group" aria-label="スタックの操作"><button type="button" data-sq-op="pop" id="popStack"><span>POP：</span><span>取り出す</span></button><button type="button" data-sq-op="push" id="pushStackV360"><span>PUSH：</span><span>追加する</span></button></div>
      <div role="group" aria-label="キューの操作"><button type="button" data-sq-op="dequeue" id="deqQueue"><span>DEQUEUE：</span><span>取り出す</span></button><button type="button" data-sq-op="enqueue" id="enqQueueV360"><span>ENQUEUE：</span><span>追加する</span></button></div>
    </div>
    <p class="sq-event-v360" role="status" aria-live="polite" aria-atomic="true">初期状態です。スタックはC、キューはAが次に出ます。</p>
    <p class="sq-progress-v360"></p>
    <button type="button" class="sq-reset-v360" data-sq-op="reset">図だけ最初に戻す</button>
    <p class="sq-footnote-v360">表示上限は各6個です。スタック・キュー自体が6個までという意味ではありません。図のリセットで、確認済みの操作や保存された学習進捗は消えません。</p>
  </section>`;
  const demo=stage.querySelector('.sq-demo-v360');
  const listText=values=>values.length?values.join(' → '):'空';
  const sync=()=>{
    demo.querySelector('.sq-board-v360').innerHTML=stackQueueCardsV360(state.stack,state.queue);
    for(const [op,disabled] of [['pop',!state.stack.length],['push',state.stack.length>=6],['dequeue',!state.queue.length],['enqueue',state.queue.length>=6]]){
      demo.querySelector(`[data-sq-op="${op}"]`).disabled=disabled;
    }
    const wasDone=lessonInteractiveDone;
    lessonInteractiveDone=dsSeen.has('stack')&&dsSeen.has('queue');
    demo.querySelector('.sq-progress-v360').textContent=`POP：${dsSeen.has('stack')?'確認済み':'未確認'} ／ DEQUEUE：${dsSeen.has('queue')?'確認済み':'未確認'}`;
    if(lessonInteractiveDone&&!wasDone) showLessonFeedback('両方の取り出し方を確認できました。次へ進むか、追加・取り出しを続けて比べられます。');
  };
  demo.addEventListener('click',e=>{
    const button=e.target.closest('button[data-sq-op]');
    if(!button||!demo.contains(button)||button.disabled) return;
    const result=stackQueueApplyV360(state,button.dataset.sqOp);
    if(!result.event) return;
    const hadFocus=document.activeElement===button;
    state=result.state;
    const event=result.event;
    if(event.operation==='pop') dsSeen.add('stack');
    if(event.operation==='dequeue') dsSeen.add('queue');
    sync();
    demo.querySelector('.sq-event-v360').textContent=event.operation==='reset'
      ?'図を初期状態のA → B → Cに戻しました。確認済みの操作は保持しています。'
      :`${event.operation.toUpperCase()}：${event.value}を${event.adding?'追加':'取り出し'}ました。${event.kind==='stack'?'スタック（底 → 頂上）':'キュー（先頭 → 末尾）'}：${listText(event.before)} から ${listText(event.after)} へ。`;
    // Controls are not recreated. If a focused control reaches its limit, move
    // focus to the inverse operation so keyboard users can keep experimenting.
    if(button.disabled&&hadFocus){
      const inverse={pop:'push',push:'pop',dequeue:'enqueue',enqueue:'dequeue'}[event.operation];
      demo.querySelector(`[data-sq-op="${inverse}"]`)?.focus({preventScroll:true});
    }
  });
  sync();
}
