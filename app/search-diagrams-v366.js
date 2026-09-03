// FE QUEST v366: linear and binary search diagrams and trace presentation.

function searchStaticCellsV366(values,{active=[],checked=[],current=-1,found=-1,labels={}}={}){
  const activeSet=new Set(active),checkedSet=new Set(checked);
  return `<div class="search-cells-v366">${values.map((value,index)=>{
    const classes=[activeSet.has(index)?'is-active':'',checkedSet.has(index)?'is-checked':'',current===index?'is-current':'',found===index?'is-found':''].filter(Boolean).join(' ');
    return `<span class="search-cell-wrap-v366"><span class="search-marker-v366">${escapeHtml(labels[index]||'')}</span><span class="search-cell-v366 ${classes}" data-search-index="${index}"><b>${escapeHtml(value)}</b><small>${index}</small></span></span>`;
  }).join('')}</div>`;
}

function coreTopicSearchDiagramViewV366(id){
  if(id!=='core_03_03') return '';
  const values=[2,5,8,12,16,21,30];
  return `<figure class="search-figure-v366" aria-labelledby="searchCaptionV366" data-search-diagram="core">
    <figcaption id="searchCaptionV366">同じ21を探す：順に見るか、半分ずつ絞るか</figcaption>
    <p class="search-lead-v366">どちらも値そのものではなく、<b>比較する添字</b>と<b>次に残す範囲</b>を追います。</p>
    <div class="search-compare-v366">
      <section class="search-panel-v366 linear" aria-labelledby="linearTitleV366">
        <h4 id="linearTitleV366"><span>線形探索</span><small>未整列でも使える</small></h4>
        <p>先頭から1個ずつ確認</p>
        ${searchStaticCellsV366(values,{checked:[0,1,2,3,4],current:5,found:5,labels:{5:'発見'}})}
        <div class="search-route-v366" aria-label="添字0から5まで順に比較"><span>0</span><i>→</i><span>1</span><i>→</i><span>2</span><i>→</i><span>3</span><i>→</i><span>4</span><i>→</i><strong>5</strong></div>
        <p class="search-result-v366"><b>6回比較</b><span>最悪では全要素を確認：O(n)</span></p>
      </section>
      <section class="search-panel-v366 binary" aria-labelledby="binaryTitleV366">
        <h4 id="binaryTitleV366"><span>二分探索</span><small>昇順に整列済みが前提</small></h4>
        <p>中央と比べ、不要な半分を捨てる</p>
        <div class="search-binary-step-v366"><b>1回目</b>${searchStaticCellsV366(values,{active:[0,1,2,3,4,5,6],current:3,labels:{0:'low',3:'mid',6:'high'}})}<span><code>12 &lt; 21</code> → 添字0〜3を探索対象から外す</span></div>
        <div class="search-down-v366" aria-hidden="true">↓</div>
        <div class="search-binary-step-v366"><b>2回目</b>${searchStaticCellsV366(values,{active:[4,5,6],checked:[0,1,2,3],current:5,found:5,labels:{4:'low',5:'mid・発見',6:'high'}})}<span><code>21 = 21</code> → 添字5で発見</span></div>
        <p class="search-result-v366"><b>2回比較</b><span>探索範囲を半分ずつ縮小：O(log n)</span></p>
      </section>
    </div>
    <p class="search-takeaway-v366"><b>試験で追うもの</b><span>線形探索は現在の <code>i</code>、二分探索は更新前後の <code>low</code>・<code>mid</code>・<code>high</code> を書き出します。</span></p>
  </figure>`;
}

function searchTraceViewV366(mode,array,target,step={}){
  const values=Array.isArray(array)?array:[];
  const state=step&&typeof step.state==='object'&&step.state?step.state:{};
  const binary=mode==='binary_search_b'||mode==='binary';
  const focus=Number.isInteger(step.focus)?step.focus:-1;
  const found=Number.isInteger(step.found)?step.found:-1;
  const low=Number.isInteger(state.low)?state.low:0;
  const high=Number.isInteger(state.high)?state.high:values.length-1;
  const mid=Number.isInteger(state.mid)?state.mid:(binary?focus:-1);
  const hasRange=binary&&Number.isInteger(state.low)&&Number.isInteger(state.high);
  const cells=values.map((value,index)=>{
    const inRange=!binary||!hasRange||(index>=low&&index<=high);
    const checked=binary?(hasRange&&!inRange):(focus>=0&&index<focus);
    const labels=[];
    if(binary&&hasRange&&index===low) labels.push('low');
    if(binary&&mid>=0&&index===mid) labels.push('mid');
    if(binary&&hasRange&&index===high) labels.push('high');
    if(!binary&&index===focus) labels.push('i');
    const classes=[inRange?'is-active':'is-discarded',checked?'is-checked':'',index===focus?'is-current':'',index===found?'is-found':''].filter(Boolean).join(' ');
    return `<span class="search-trace-cell-wrap-v366"><span class="search-trace-marker-v366">${escapeHtml(labels.join(' / '))}</span><span class="trace-array-cell ${classes}" data-search-trace-index="${index}">${escapeHtml(value)}<span class="trace-array-index">${index}</span></span></span>`;
  }).join('');
  const status=binary
    ?(hasRange?`探索範囲：${low}〜${high}${mid>=0?` ／ mid：${mid}`:''}`:'探索範囲を設定する前です。')
    :(focus>=0?`現在の i：${focus} ／ 先頭から${focus+1}個目を確認`:'先頭から探索を始めます。');
  return `<div class="search-trace-v366" data-search-mode="${binary?'binary':'linear'}" data-search-focus="${focus}" data-search-low="${binary&&hasRange?low:''}" data-search-high="${binary&&hasRange?high:''}">
    <div class="search-trace-head-v366"><b>${binary?'二分探索':'線形探索'}</b><span>target = ${escapeHtml(target)}</span></div>
    <div class="search-trace-cells-v366">${cells}</div>
    <p class="search-trace-status-v366">${escapeHtml(status)}</p>
  </div>`;
}
