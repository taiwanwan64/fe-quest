// FE QUEST v365: linked-list diagrams and trace presentation.

function linkedListStaticNodeV365(id,value,next,address){
  return `<div class="ll-node-v365" data-ll-node="${escapeHtml(id)}">
    <span class="ll-address-v365">番地 ${escapeHtml(address)}</span>
    <b>${escapeHtml(id)}</b><span>値 ${escapeHtml(value)}</span><code>next: ${escapeHtml(next)}</code>
  </div>`;
}

function coreTopicLinkedListDiagramViewV365(id){
  if(id!=='core_03_01') return '';
  return `<figure class="ll-figure-v365" aria-labelledby="llCaptionV365" data-ll-diagram="core">
    <figcaption id="llCaptionV365">連結リストは、置き場所ではなく next で並ぶ</figcaption>
    <p class="ll-lead-v365">各ノードは「値」と「次のノードを指すリンク」を持ちます。<b>head</b> から next をたどり、<b>null</b> で終わります。</p>
    <section class="ll-section-v365" aria-labelledby="llOrderTitleV365">
      <h4 id="llOrderTitleV365"><span>1</span>たどる順序</h4>
      <div class="ll-chain-v365" aria-label="headからA、C、D、nullの順につながる">
        <span class="ll-end-v365">head</span><span class="ll-arrow-v365" aria-hidden="true">→</span>
        ${linkedListStaticNodeV365('A','10','C','100')}<span class="ll-arrow-v365" aria-hidden="true">→</span>
        ${linkedListStaticNodeV365('C','30','D','420')}<span class="ll-arrow-v365" aria-hidden="true">→</span>
        ${linkedListStaticNodeV365('D','40','null','260')}<span class="ll-arrow-v365" aria-hidden="true">→</span><span class="ll-end-v365">null</span>
      </div>
      <div class="ll-memory-v365" aria-label="メモリ上では番地100にA、番地260にD、番地420にCがある">
        <b>メモリを番地順に見ると</b><span><small>100</small>A</span><span><small>260</small>D</span><span><small>420</small>C</span>
      </div>
      <p class="ll-note-v365">番地順は A → D → C でも、読む順序は next が示す <b>A → C → D</b> です。</p>
    </section>
    <section class="ll-section-v365" aria-labelledby="llInsertTitleV365">
      <h4 id="llInsertTitleV365"><span>2</span>AとCの間へBを挿入</h4>
      <div class="ll-rewire-v365">
        <div><span class="ll-step-v365">①</span><code>B.next ← C</code><small>BからCへのリンクを先に作る</small></div>
        <div><span class="ll-step-v365">②</span><code>A.next ← B</code><small>Aの行き先をBへ変える</small></div>
      </div>
      <div class="ll-result-v365" aria-label="挿入後はhead、A、B、C、D、nullの順につながる">
        <b>挿入後</b><span>head</span><i aria-hidden="true">→</i><span>A</span><i aria-hidden="true">→</i><span class="is-new">B</span><i aria-hidden="true">→</i><span>C</span><i aria-hidden="true">→</i><span>D</span><i aria-hidden="true">→</i><span>null</span>
      </div>
      <p class="ll-note-v365">CやDを移動する必要はありません。削除も同様に、例えば <code>A.next ← B.next</code> とリンクをつなぎ替えます。</p>
    </section>
    <p class="ll-takeaway-v365"><b>試験で追うもの</b><span>現在位置 <code>p</code> と、更新前後の <code>next</code> を書き出すと、挿入・削除・走査を取り違えにくくなります。</span></p>
  </figure>`;
}

function linkedListTraceViewV365(list,currentNode,visited=[]){
  const nodes=Array.isArray(list)?list:[];
  const visitedSet=new Set(Array.isArray(visited)?visited:[]);
  const chain=nodes.map((node,i)=>{
    const nodeId=String(node?.id??'');
    const next=String(nodes[i+1]?.id??'null');
    const current=currentNode===node?.id;
    return `<span class="ll-trace-hop-v365">${i?'<span class="trace-list-arrow" aria-hidden="true">→</span>':''}<span class="ll-trace-node-wrap-v365">
      <span class="ll-trace-pointer-v365${current?' is-current':''}" aria-hidden="true">p ↓</span>
      <span class="trace-list-node${current?' current':''}${visitedSet.has(node?.id)?' visited':''}" data-ll-trace-node="${escapeHtml(nodeId)}">
        <span class="trace-node-id">${escapeHtml(nodeId)}</span><span class="trace-node-value">${escapeHtml(node?.value??'')}</span><code>next: ${escapeHtml(next)}</code>
      </span></span></span>`;
  }).join('');
  const pointer=currentNode==null?'null（末尾まで到達）':String(currentNode);
  return `<div class="ll-trace-v365" data-ll-current="${escapeHtml(currentNode==null?'null':String(currentNode))}">
    <div class="ll-trace-chain-v365"><span class="ll-trace-head-v365">head</span><span class="trace-list-arrow" aria-hidden="true">→</span>${chain}<span class="trace-list-arrow" aria-hidden="true">→</span><span class="ll-trace-null-v365">null</span></div>
    <p class="ll-trace-status-v365"><b>現在の p：</b>${escapeHtml(pointer)}</p>
  </div>`;
}
