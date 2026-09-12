(()=>{
'use strict';

const VERSION='ipa92-graph-lab-v1';
const CARD_ID='ipa92GraphLabCard';
const DIALOG_ID='ipa92GraphLabDialog';
const STYLE_ID='ipa92GraphLabStyle';
const NODE_ORDER=Object.freeze(['A','B','C','D','E','F']);
const NODES=Object.freeze({
  A:{x:48,y:120},B:{x:130,y:52},C:{x:130,y:188},
  D:{x:230,y:68},E:{x:230,y:172},F:{x:320,y:120}
});
const EDGES=Object.freeze([
  ['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['D','F'],['E','F']
]);

let directed=false;
let selectedNode='A';
let pathMode=false;
let pathNodes=[];
let traversalKind=null;
let traversalOrder=[];
let traversalIndex=0;
let returnFocus=null;
let ensureScheduled=false;

function neighbors(node,useDirected=directed){
  const result=[];
  for(const [from,to] of EDGES){
    if(from===node)result.push(to);
    if(!useDirected&&to===node)result.push(from);
  }
  return NODE_ORDER.filter(value=>result.includes(value));
}

function incoming(node){
  return NODE_ORDER.filter(candidate=>EDGES.some(([from,to])=>from===candidate&&to===node));
}

function edgeExists(from,to,useDirected=directed){
  return EDGES.some(([a,b])=>a===from&&b===to||(!useDirected&&a===to&&b===from));
}

function bfs(start,useDirected=directed){
  const seen=new Set([start]);
  const queue=[start];
  const order=[];
  while(queue.length){
    const node=queue.shift();
    order.push(node);
    for(const next of neighbors(node,useDirected)){
      if(seen.has(next))continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return order;
}

function dfs(start,useDirected=directed){
  const seen=new Set();
  const order=[];
  const visit=node=>{
    if(seen.has(node))return;
    seen.add(node);
    order.push(node);
    for(const next of neighbors(node,useDirected))visit(next);
  };
  visit(start);
  return order;
}

function shortestPath(start,target,useDirected=directed){
  const queue=[[start]];
  const seen=new Set([start]);
  while(queue.length){
    const path=queue.shift();
    const last=path[path.length-1];
    if(last===target)return path;
    for(const next of neighbors(last,useDirected)){
      if(seen.has(next))continue;
      seen.add(next);
      queue.push([...path,next]);
    }
  }
  return null;
}

function validateGraph(){
  const known=new Set(NODE_ORDER);
  const keys=new Set();
  for(const [from,to] of EDGES){
    if(!known.has(from)||!known.has(to))throw new Error(`unknown graph endpoint: ${from}-${to}`);
    const key=`${from}->${to}`;
    if(keys.has(key))throw new Error(`duplicate graph edge: ${key}`);
    keys.add(key);
  }
  for(const mode of [false,true]){
    const b=bfs('A',mode);
    const d=dfs('A',mode);
    if(new Set(b).size!==NODE_ORDER.length)throw new Error(`BFS does not cover all nodes; directed=${mode}`);
    if(new Set(d).size!==NODE_ORDER.length)throw new Error(`DFS does not cover all nodes; directed=${mode}`);
  }
  const shortest=shortestPath('A','F',false);
  if(!shortest||shortest.length!==4)throw new Error(`unexpected shortest A-F path: ${shortest}`);
  if(shortestPath('F','A',true)!==null)throw new Error('directed graph should not allow F to A');
  return true;
}

function edgeKey(a,b){return `${a}-${b}`}
function currentPathEdges(){
  const keys=new Set();
  for(let i=1;i<pathNodes.length;i+=1){
    const a=pathNodes[i-1],b=pathNodes[i];
    keys.add(edgeKey(a,b));
    if(!directed)keys.add(edgeKey(b,a));
  }
  return keys;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
body.ipa92-graph-open{overflow:hidden}
#${DIALOG_ID}[hidden]{display:none!important}
#${DIALOG_ID}{position:fixed;inset:0;z-index:2147482020;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(15,23,42,.6);backdrop-filter:blur(4px)}
.ipa92-graph-dialog{box-sizing:border-box;width:min(820px,100%);max-height:min(900px,calc(100dvh - 24px));overflow:auto;overscroll-behavior:contain;padding:20px;border-radius:22px;background:#fff;color:#24313d;box-shadow:0 28px 80px rgba(15,23,42,.28)}
.ipa92-graph-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.ipa92-graph-kicker{display:block;margin-bottom:3px;color:#2f6f16;font-size:11px;font-weight:900}.ipa92-graph-head h2{margin:0;font-size:clamp(20px,4vw,28px);line-height:1.25}.ipa92-graph-close{flex:0 0 auto;width:44px;height:44px;border:1px solid #d8dee5;border-radius:50%;background:#fff;color:#334155;font-size:24px;cursor:pointer}
.ipa92-graph-lead{margin:10px 0 14px;color:#52606d;font-size:13px;line-height:1.65}.ipa92-graph-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.ipa92-graph-toolbar button,.ipa92-graph-toolbar select{min-height:44px;padding:8px 12px;border:1px solid #d7dfe7;border-radius:12px;background:#fff;color:#334155;font-weight:800}.ipa92-graph-toolbar button{cursor:pointer}.ipa92-graph-toolbar button.is-active{border-color:#58cc02;background:#eef9e7;color:#2f6f16}
.ipa92-graph-stage{display:grid;grid-template-columns:minmax(0,1fr) minmax(205px,250px);gap:14px;align-items:center;padding:14px;border:1px solid #e2e8f0;border-radius:18px;background:#fbfcfd}.ipa92-graph-svg{display:block;width:100%;max-height:360px;touch-action:manipulation;user-select:none}.ipa92-graph-edge{stroke:#94a3b8;stroke-width:3}.ipa92-graph-edge.is-path{stroke:#7c3aed;stroke-width:6}.ipa92-graph-node{cursor:pointer}.ipa92-graph-node circle{fill:#fff;stroke:#334155;stroke-width:3;transition:.16s}.ipa92-graph-node text{fill:#24313d;font-size:16px;font-weight:900;text-anchor:middle;dominant-baseline:middle;pointer-events:none}.ipa92-graph-node.is-selected circle{fill:#eef9e7;stroke:#58cc02;stroke-width:4}.ipa92-graph-node.is-visited circle{fill:#f5f3ff;stroke:#7c3aed;stroke-width:4}.ipa92-graph-node:focus-visible circle{stroke:#2563eb;stroke-width:5}.ipa92-graph-visit-num{font-size:10px!important;fill:#5b21b6!important}.ipa92-graph-readout{display:grid;gap:7px;padding:14px;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 1px #e2e8f0}.ipa92-graph-readout b{color:#1f5f0c;font-size:15px}.ipa92-graph-readout span{color:#52606d;font-size:12px;line-height:1.6}.ipa92-graph-path{padding:9px 10px;border-radius:10px;background:#f7f5ff;color:#4c3f91!important;font-weight:800;word-break:break-word}
.ipa92-graph-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.ipa92-graph-actions button{min-height:46px;padding:8px 10px;border:1px solid #d7dfe7;border-radius:12px;background:#fff;color:#334155;font-weight:900;cursor:pointer}.ipa92-graph-actions button.primary{border-color:#58cc02;background:#58cc02;color:#fff}.ipa92-graph-actions button:disabled{background:#e2e8f0;border-color:#e2e8f0;color:#94a3b8;cursor:not-allowed}.ipa92-graph-note{display:grid;gap:4px;margin-top:12px;padding:12px 14px;border:1px solid #ded8fa;border-radius:14px;background:#f7f5ff}.ipa92-graph-note b{font-size:12px;color:#4c3f91}.ipa92-graph-note span{font-size:12px;line-height:1.6;color:#5f6272}
.ipa92-graph-close:focus-visible,.ipa92-graph-toolbar button:focus-visible,.ipa92-graph-toolbar select:focus-visible,.ipa92-graph-actions button:focus-visible{outline:3px solid rgba(88,204,2,.25);outline-offset:2px}
@media(max-width:680px){.ipa92-graph-dialog{padding:15px;border-radius:18px}.ipa92-graph-stage{grid-template-columns:1fr;padding:10px}.ipa92-graph-svg{max-height:290px}.ipa92-graph-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(prefers-reduced-motion:reduce){.ipa92-graph-node circle{transition:none!important}}
`;
  document.head.appendChild(style);
}

function graphSvg(){
  const pathEdges=currentPathEdges();
  const visited=traversalKind?new Map(traversalOrder.slice(0,traversalIndex+1).map((node,index)=>[node,index+1])):new Map();
  const marker=directed?'<defs><marker id="ipa92GraphArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/></marker></defs>':'';
  const edges=EDGES.map(([from,to])=>{
    const a=NODES[from],b=NODES[to];
    const cls=pathEdges.has(edgeKey(from,to))?'ipa92-graph-edge is-path':'ipa92-graph-edge';
    return `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"${directed?' marker-end="url(#ipa92GraphArrow)"':''}/>`;
  }).join('');
  const nodes=NODE_ORDER.map(node=>{
    const p=NODES[node];
    const classes=['ipa92-graph-node'];
    if(node===selectedNode)classes.push('is-selected');
    if(visited.has(node))classes.push('is-visited');
    const num=visited.has(node)?`<text class="ipa92-graph-visit-num" x="${p.x+20}" y="${p.y-20}">${visited.get(node)}</text>`:'';
    return `<g class="${classes.join(' ')}" data-graph-node="${node}" role="button" tabindex="0" aria-label="頂点${node}"><circle cx="${p.x}" cy="${p.y}" r="25"/><text x="${p.x}" y="${p.y}">${node}</text>${num}</g>`;
  }).join('');
  return `<svg class="ipa92-graph-svg" viewBox="0 0 370 240" role="img" aria-label="${directed?'有向':'無向'}グラフ。頂点をタップできます。">${marker}${edges}${nodes}</svg>`;
}

function nodeSummary(node){
  const out=neighbors(node,directed);
  if(!directed)return `隣接頂点: ${out.join('・')||'なし'} / 次数: ${out.length}`;
  const inc=incoming(node);
  return `出る辺 → ${out.join('・')||'なし'}（出次数 ${out.length}） / 入る辺 ← ${inc.join('・')||'なし'}（入次数 ${inc.length}）`;
}

function statusText(){
  if(traversalKind){
    const shown=traversalOrder.slice(0,traversalIndex+1);
    return `${traversalKind} 探索順: ${shown.join(' → ')}${shown.length<traversalOrder.length?' → …':''}`;
  }
  if(pathMode)return pathNodes.length?`作成中の経路: ${pathNodes.join(' → ')}`:'最初の頂点をタップしてください。';
  return `${selectedNode}: ${nodeSummary(selectedNode)}`;
}

function render(message=''){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog)return;
  const canvas=dialog.querySelector('[data-graph-canvas]');
  if(canvas){
    canvas.innerHTML=graphSvg();
    bindNodeEvents(canvas);
  }
  const mode=dialog.querySelector('[data-graph-mode]');
  const detail=dialog.querySelector('[data-graph-detail]');
  const path=dialog.querySelector('[data-graph-path]');
  if(mode)mode.textContent=directed?'有向グラフ':'無向グラフ';
  if(detail)detail.textContent=message||statusText();
  if(path)path.textContent=pathMode?(pathNodes.length?`経路: ${pathNodes.join(' → ')}`:'経路を作成中'):(traversalKind?statusText():nodeSummary(selectedNode));
  const toggle=dialog.querySelector('[data-graph-directed]');
  if(toggle){toggle.textContent=directed?'有向 →':'無向 —';toggle.classList.toggle('is-active',directed)}
  const pathButton=dialog.querySelector('[data-graph-path-mode]');
  if(pathButton)pathButton.classList.toggle('is-active',pathMode);
  const prev=dialog.querySelector('[data-graph-prev]');
  const next=dialog.querySelector('[data-graph-next]');
  if(prev)prev.disabled=!traversalKind||traversalIndex<=0;
  if(next)next.disabled=!traversalKind||traversalIndex>=traversalOrder.length-1;
}

function selectNode(node){
  if(!NODE_ORDER.includes(node))return;
  selectedNode=node;
  if(pathMode){
    if(pathNodes.length===0){
      pathNodes=[node];
      render(`${node} から経路を開始しました。次に辺でつながる頂点をタップしてください。`);
      return;
    }
    const last=pathNodes[pathNodes.length-1];
    if(node===last){render(`${node} は現在位置です。別の隣接頂点を選んでください。`);return}
    if(!edgeExists(last,node,directed)){
      render(`${last} から ${node} へ直接つながる${directed?'向きの':''}辺はありません。別の頂点を選んでください。`);
      return;
    }
    pathNodes=[...pathNodes,node];
    render(`${last} → ${node} を経路へ追加しました。`);
    return;
  }
  traversalKind=null;
  traversalOrder=[];
  traversalIndex=0;
  render();
}

function bindNodeEvents(root){
  root.querySelectorAll('[data-graph-node]').forEach(element=>{
    const activate=()=>selectNode(element.dataset.graphNode);
    element.addEventListener('click',activate);
    element.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();activate()}
    });
  });
}

function toggleDirected(){
  directed=!directed;
  pathNodes=[];
  pathMode=false;
  traversalKind=null;
  traversalOrder=[];
  traversalIndex=0;
  render(directed?'有向グラフに切り替えました。矢印の方向にだけ進めます。':'無向グラフに切り替えました。辺は両方向に進めます。');
}

function togglePathMode(){
  pathMode=!pathMode;
  pathNodes=[];
  traversalKind=null;
  traversalOrder=[];
  traversalIndex=0;
  render(pathMode?'経路作成モードです。最初の頂点をタップしてください。':'経路作成を終了しました。頂点をタップすると隣接関係を確認できます。');
}

function startTraversal(kind){
  const select=document.getElementById(DIALOG_ID)?.querySelector('[data-graph-start]');
  const start=select?.value||selectedNode||'A';
  selectedNode=start;
  pathMode=false;
  pathNodes=[];
  traversalKind=kind;
  traversalOrder=kind==='BFS'?bfs(start,directed):dfs(start,directed);
  traversalIndex=0;
  render(`${kind} を ${start} から開始しました。「1手進む」で探索順を追ってください。`);
}

function moveTraversal(delta){
  if(!traversalKind)return;
  traversalIndex=Math.max(0,Math.min(traversalOrder.length-1,traversalIndex+delta));
  render();
}

function resetLab(){
  selectedNode='A';
  pathMode=false;
  pathNodes=[];
  traversalKind=null;
  traversalOrder=[];
  traversalIndex=0;
  const select=document.getElementById(DIALOG_ID)?.querySelector('[data-graph-start]');
  if(select)select.value='A';
  render('初期状態へ戻しました。まず頂点をタップして、隣接頂点と次数を確認してみましょう。');
}

function buildDialog(){
  injectStyles();
  let backdrop=document.getElementById(DIALOG_ID);
  if(backdrop)return backdrop;
  backdrop=document.createElement('div');
  backdrop.id=DIALOG_ID;
  backdrop.hidden=true;
  backdrop.innerHTML=`
    <section class="ipa92-graph-dialog" role="dialog" aria-modal="true" aria-labelledby="ipa92GraphLabTitle">
      <div class="ipa92-graph-head"><div><span class="ipa92-graph-kicker">図解・操作ラボ / IPA Ver.9.2補強</span><h2 id="ipa92GraphLabTitle">グラフ理論をタップして理解する</h2></div><button type="button" class="ipa92-graph-close" data-graph-close aria-label="グラフ理論ラボを閉じる">×</button></div>
      <p class="ipa92-graph-lead">頂点と辺の関係を直接タップして確認し、経路を自分で作った後、BFSとDFSの探索順へつなげます。</p>
      <div class="ipa92-graph-toolbar">
        <button type="button" data-graph-directed>無向 —</button>
        <button type="button" data-graph-path-mode>経路を作る</button>
        <label>探索開始 <select data-graph-start aria-label="探索の開始頂点">${NODE_ORDER.map(node=>`<option value="${node}">${node}</option>`).join('')}</select></label>
        <button type="button" data-graph-bfs>BFS</button><button type="button" data-graph-dfs>DFS</button>
      </div>
      <div class="ipa92-graph-stage">
        <div data-graph-canvas></div>
        <div class="ipa92-graph-readout" aria-live="polite"><b data-graph-mode>無向グラフ</b><span data-graph-detail></span><span class="ipa92-graph-path" data-graph-path></span></div>
      </div>
      <div class="ipa92-graph-actions"><button type="button" data-graph-reset>リセット</button><button type="button" data-graph-prev>← 1手戻す</button><button type="button" class="primary" data-graph-next>1手進む →</button><button type="button" data-graph-shortest>A→Fの最短経路</button></div>
      <div class="ipa92-graph-note"><b>試験での見分け方</b><span>頂点＝点、辺＝頂点どうしのつながり、経路＝辺をたどった頂点列です。無向グラフは辺を両方向へ進めますが、有向グラフは矢印方向だけです。</span><span>BFSは近い頂点から層状に、DFSは一つの道を深く進んでから戻ります。重みなしグラフの最短辺数はBFSで求められます。</span></div>
    </section>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('[data-graph-close]')?.addEventListener('click',closeLab);
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeLab()});
  backdrop.querySelector('[data-graph-directed]')?.addEventListener('click',toggleDirected);
  backdrop.querySelector('[data-graph-path-mode]')?.addEventListener('click',togglePathMode);
  backdrop.querySelector('[data-graph-bfs]')?.addEventListener('click',()=>startTraversal('BFS'));
  backdrop.querySelector('[data-graph-dfs]')?.addEventListener('click',()=>startTraversal('DFS'));
  backdrop.querySelector('[data-graph-prev]')?.addEventListener('click',()=>moveTraversal(-1));
  backdrop.querySelector('[data-graph-next]')?.addEventListener('click',()=>moveTraversal(1));
  backdrop.querySelector('[data-graph-reset]')?.addEventListener('click',resetLab);
  backdrop.querySelector('[data-graph-shortest]')?.addEventListener('click',()=>{
    const result=shortestPath('A','F',directed);
    pathMode=true;
    traversalKind=null;
    traversalOrder=[];
    traversalIndex=0;
    pathNodes=result||[];
    render(result?`A から F の最短経路の一例は ${result.join(' → ')} です（辺 ${result.length-1} 本）。`:'この向きでは A から F へ到達できません。');
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)closeLab()});
  return backdrop;
}

function openLab(){
  const dialog=buildDialog();
  returnFocus=document.activeElement;
  dialog.hidden=false;
  document.body.classList.add('ipa92-graph-open');
  resetLab();
  setTimeout(()=>dialog.querySelector('[data-graph-close]')?.focus(),0);
}

function closeLab(){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog||dialog.hidden)return;
  dialog.hidden=true;
  document.body.classList.remove('ipa92-graph-open');
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
  card.innerHTML='<span class="ipa92-lab-icon">⌘</span><span class="ipa92-lab-copy"><small>IPA Ver.9.2補強 / タッチ対応</small><b>グラフ理論・探索</b><em>頂点・辺・経路をタップし、無向/有向とBFS/DFSをつなげて理解します。</em></span><span class="ipa92-lab-go">操作する →</span>';
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

validateGraph();
injectStyles();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleEnsure,{once:true});
else scheduleEnsure();
new MutationObserver(scheduleEnsure).observe(document.documentElement,{childList:true,subtree:true});

globalThis.FEQUEST_IPA92_GRAPH_LAB=Object.freeze({version:VERSION,open:openLab,validate:validateGraph,bfs,dfs,shortestPath,neighbors});
})();
