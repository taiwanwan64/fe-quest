// FE QUEST v367: bubble and selection sort diagrams and trace presentation.

function sortCellsV367(values,{compare=[],candidate=-1,scan=-1,fixed=[],labels={}}={}){
  const compareSet=new Set(compare),fixedSet=new Set(fixed);
  return `<div class="sort-cells-v367">${values.map((value,index)=>{
    const marker=labels[index]||[index===candidate?'minPos':'',index===scan?'j':''].filter(Boolean).join(' / ');
    const classes=[compareSet.has(index)?'is-compare':'',index===candidate?'is-candidate':'',index===scan?'is-scan':'',fixedSet.has(index)?'is-fixed':''].filter(Boolean).join(' ');
    return `<span class="sort-cell-wrap-v367"><span class="sort-marker-v367">${escapeHtml(marker)}</span><span class="sort-cell-v367 ${classes}" data-sort-index="${index}"><b>${escapeHtml(value)}</b><small>${index}</small></span></span>`;
  }).join('')}</div>`;
}

function sortFlowRowV367(label,values,options={},note=''){
  return `<div class="sort-flow-row-v367"><b>${escapeHtml(label)}</b><div>${sortCellsV367(values,options)}${note?`<span class="sort-flow-note-v367">${escapeHtml(note)}</span>`:''}</div></div>`;
}

function coreTopicSortDiagramViewV367(id){
  if(id!=='core_03_03') return '';
  return `<figure class="sort-figure-v367" aria-labelledby="sortCaptionV367" data-sort-diagram="core">
    <figcaption id="sortCaptionV367">同じ配列を1回整列：隣を比べるか、最小値を選ぶか</figcaption>
    <p class="sort-lead-v367"><code>[4, 2, 5, 1]</code> を昇順にするとき、<b>比較する位置</b>と<b>交換するタイミング</b>を追います。</p>
    <div class="sort-compare-v367">
      <section class="sort-panel-v367 bubble" aria-labelledby="bubbleTitleV367">
        <h4 id="bubbleTitleV367"><span>バブルソート</span><small>隣同士を順に比較</small></h4>
        <p>左が大きければ、その場で交換します。</p>
        <div class="sort-flow-v367">
          ${sortFlowRowV367('開始',[4,2,5,1])}
          ${sortFlowRowV367('i = 0',[2,4,5,1],{compare:[0,1],labels:{0:'i',1:'i+1'}},'4 > 2：交換')}
          ${sortFlowRowV367('i = 1',[2,4,5,1],{compare:[1,2],labels:{1:'i',2:'i+1'}},'4 < 5：そのまま')}
          ${sortFlowRowV367('i = 2',[2,4,1,5],{compare:[2,3],fixed:[3],labels:{2:'i',3:'i+1'}},'5 > 1：交換')}
        </div>
        <p class="sort-result-v367"><b>1走査後</b><code>[2, 4, 1, 5]</code><span>最大値5が右端に確定</span></p>
      </section>
      <section class="sort-panel-v367 selection" aria-labelledby="selectionTitleV367">
        <h4 id="selectionTitleV367"><span>選択ソート</span><small>最小値の位置を探索</small></h4>
        <p>未整列部分を最後まで見てから交換します。</p>
        <div class="sort-flow-v367">
          ${sortFlowRowV367('開始',[4,2,5,1],{candidate:0,labels:{0:'minPos'}})}
          ${sortFlowRowV367('j = 1',[4,2,5,1],{candidate:1,scan:1,labels:{1:'j / minPos'}},'2 < 4：minPos = 1')}
          ${sortFlowRowV367('j = 2',[4,2,5,1],{candidate:1,scan:2,labels:{1:'minPos',2:'j'}},'5 < 2：偽')}
          ${sortFlowRowV367('j = 3',[4,2,5,1],{candidate:3,scan:3,labels:{3:'j / minPos'}},'1 < 2：minPos = 3')}
        </div>
        <p class="sort-result-v367"><b>添字0と3を交換</b><code>[1, 2, 5, 4]</code><span>最小値1が左端に確定</span></p>
      </section>
    </div>
    <p class="sort-takeaway-v367"><b>1回では全体が完成するとは限らない</b><span>バブルソートは右端から、選択ソートは左端から、確定する範囲を1要素ずつ広げます。基本形はいずれも全体で <code>O(n²)</code> です。</span></p>
  </figure>`;
}

function sortTraceViewV367(mode,array,step={}){
  const values=Array.isArray(array)?array:[];
  const state=step&&typeof step.state==='object'&&step.state?step.state:{};
  const bubble=mode==='bubble_sort_b'||mode==='bubble';
  const line=Number.isInteger(step.line)?step.line:-1;
  const focus=Number.isInteger(step.focus)?step.focus:-1;
  const i=Number.isInteger(state.i)?state.i:-1;
  const j=Number.isInteger(state.j)?state.j:-1;
  const minPos=Number.isInteger(state.minPos)?state.minPos:-1;
  const complete=bubble?line===6:line>=7;
  const cells=values.map((value,index)=>{
    const labels=[];
    let compare=false,candidate=false,scan=false,fixed=false;
    if(bubble){
      compare=i>=0&&(index===i||index===i+1);
      if(index===i) labels.push('i');
      if(index===i+1) labels.push('i+1');
      fixed=complete&&index===values.length-1;
    }else if(complete){
      fixed=index===0;
      if(fixed) labels.push('確定');
    }else{
      candidate=minPos>=0&&index===minPos;
      scan=j>=0&&index===j;
      if(candidate) labels.push('minPos');
      if(scan) labels.push('j');
    }
    const classes=[compare?'is-compare':'',candidate?'is-candidate':'',scan?'is-scan':'',fixed?'is-fixed':'',index===focus?'is-focus':''].filter(Boolean).join(' ');
    return `<span class="sort-trace-cell-wrap-v367"><span class="sort-trace-marker-v367">${escapeHtml(labels.join(' / '))}</span><span class="trace-array-cell ${classes}" data-sort-trace-index="${index}">${escapeHtml(value)}<span class="trace-array-index">${index}</span></span></span>`;
  }).join('');
  let status;
  if(bubble){
    status=complete?`1走査完了：右端の${values[values.length-1]??'値'}が確定`:i>=0?`比較位置：i = ${i} ／ data[${i}] と data[${i+1}]`:'左端から隣同士の比較を始めます。';
  }else{
    status=complete?`交換完了：添字0に最小値${values[0]??''}を確定`:minPos>=0?`現在の最小候補：添字${minPos}（値${values[minPos]}）${j>=0?` ／ j = ${j}`:''}`:'未整列部分の先頭を最小候補にします。';
  }
  return `<div class="sort-trace-v367" data-sort-mode="${bubble?'bubble':'selection'}" data-sort-i="${bubble&&i>=0?i:''}" data-sort-j="${!bubble&&j>=0?j:''}" data-sort-min-pos="${!bubble&&minPos>=0?minPos:''}" data-sort-complete="${complete?'true':'false'}">
    <div class="sort-trace-head-v367"><b>${bubble?'バブルソート':'選択ソート'}</b><span>${bubble?'隣接比較':'最小位置の更新'}</span></div>
    <div class="sort-trace-cells-v367">${cells}</div>
    <p class="sort-trace-status-v367">${escapeHtml(status)}</p>
  </div>`;
}
