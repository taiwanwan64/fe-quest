(()=>{
'use strict';

const VERSION='ipa92-modeling-lab-v1';
const CARD_ID='ipa92ModelingLabCard';
const DIALOG_ID='ipa92ModelingLabDialog';
const STYLE_ID='ipa92ModelingLabStyle';
const MODE_ORDER=Object.freeze(['uml','dfd','er']);
const MODE_LABELS=Object.freeze({uml:'UML',dfd:'DFD',er:'E-R図'});
const MODELS=Object.freeze({
  uml:Object.freeze({
    lead:'クラスの構造と、クラス同士の関連を表します。',
    elements:Object.freeze([
      Object.freeze({id:'customer',label:'顧客',kind:'class',description:'クラス。対象の種類を表し、属性や操作をひとまとまりにします。'}),
      Object.freeze({id:'order',label:'注文',kind:'class',description:'クラス。ここでは「顧客が注文を行う」という関連を読み取ります。'}),
      Object.freeze({id:'product',label:'商品',kind:'class',description:'クラス。注文との関連を持つ別の概念を表しています。'}),
      Object.freeze({id:'association',label:'関連',kind:'relation',description:'実線はクラス同士の関連を表す代表的な記法です。多重度 1、0..* などで個数関係も示せます。'})
    ])
  }),
  dfd:Object.freeze({
    lead:'データが、外部・処理・データストアの間をどう流れるかを表します。',
    elements:Object.freeze([
      Object.freeze({id:'external',label:'顧客',kind:'external',description:'外部実体。システムの外側でデータを渡したり受け取ったりする主体です。'}),
      Object.freeze({id:'process',label:'注文受付',kind:'process',description:'処理。入力データを受け取り、何らかの変換や処理を行います。'}),
      Object.freeze({id:'store',label:'注文DB',kind:'store',description:'データストア。処理が読み書きする保存先を表します。'}),
      Object.freeze({id:'flow',label:'データフロー',kind:'flow',description:'矢印はデータの流れです。制御手順ではなく「何のデータがどこへ移るか」を読みます。'})
    ])
  }),
  er:Object.freeze({
    lead:'データベースで扱う実体・関係・カーディナリティを表します。',
    elements:Object.freeze([
      Object.freeze({id:'entity-customer',label:'顧客',kind:'entity',description:'エンティティ。管理対象となる実体の種類です。'}),
      Object.freeze({id:'entity-order',label:'注文',kind:'entity',description:'エンティティ。注文番号などを主キーとして管理できます。'}),
      Object.freeze({id:'relationship',label:'行う',kind:'relationship',description:'リレーションシップ。エンティティ同士がどのような関係を持つかを表します。'}),
      Object.freeze({id:'cardinality',label:'1 : N',kind:'cardinality',description:'カーディナリティ。ここでは「1人の顧客が複数の注文を持ち得る」1対多を表しています。'})
    ])
  })
});
const SCENARIOS=Object.freeze([
  Object.freeze({id:'s1',text:'「顧客クラス」と「注文クラス」の構造や関連を表したい。',answer:'uml',reason:'クラス構造やオブジェクト指向の関係を表すならUMLが適しています。'}),
  Object.freeze({id:'s2',text:'顧客から受け取った注文データが、処理を通ってDBへ保存される流れを表したい。',answer:'dfd',reason:'データが外部実体・処理・データストア間を流れる様子はDFDで表します。'}),
  Object.freeze({id:'s3',text:'顧客と注文の1対多の関係を、データベース設計として表したい。',answer:'er',reason:'エンティティ同士の関係やカーディナリティはE-R図で表します。'})
]);

let activeMode='uml';
let selectedElement='customer';
let quizIndex=0;
let quizScore=0;
let quizAnswered=false;
let returnFocus=null;
let ensureScheduled=false;

function validateModels(){
  if(MODE_ORDER.some(mode=>!MODELS[mode]))throw new Error('missing modeling mode');
  for(const mode of MODE_ORDER){
    const items=MODELS[mode].elements;
    if(!Array.isArray(items)||items.length<4)throw new Error(`insufficient elements: ${mode}`);
    const ids=items.map(item=>item.id);
    if(new Set(ids).size!==ids.length)throw new Error(`duplicate element: ${mode}`);
    if(items.some(item=>!item.label||!item.kind||!item.description))throw new Error(`invalid element: ${mode}`);
  }
  if(SCENARIOS.length!==3||SCENARIOS.some(item=>!MODE_ORDER.includes(item.answer)))throw new Error('invalid modeling scenarios');
  return true;
}

function selectedModelElement(){
  return MODELS[activeMode].elements.find(item=>item.id===selectedElement)||MODELS[activeMode].elements[0];
}

function elementClass(id){return id===selectedElement?' is-selected':''}
function buttonAttrs(id,label){return `data-model-element="${id}" role="button" tabindex="0" aria-label="${label}を確認"`}

function umlSvg(){
  const box=(id,x,y,title,attrs)=>`<g class="ipa92-model-node${elementClass(id)}" ${buttonAttrs(id,title)}><rect x="${x}" y="${y}" width="120" height="82" rx="8"/><line x1="${x}" y1="${y+27}" x2="${x+120}" y2="${y+27}"/><text class="title" x="${x+60}" y="${y+18}">${title}</text><text x="${x+10}" y="${y+46}">${attrs[0]}</text><text x="${x+10}" y="${y+64}">${attrs[1]}</text></g>`;
  return `<svg class="ipa92-model-svg" viewBox="0 0 430 270" aria-label="UMLクラス図の例">
    <g class="ipa92-model-relation${elementClass('association')}" ${buttonAttrs('association','関連')}><line x1="150" y1="80" x2="260" y2="80"/><text x="164" y="70">1</text><text x="226" y="70">0..*</text><line x1="320" y1="122" x2="320" y2="175"/><text x="330" y="151">*</text></g>
    ${box('customer',30,38,'顧客',['顧客ID','氏名'])}
    ${box('order',260,38,'注文',['注文ID','注文日'])}
    ${box('product',260,175,'商品',['商品ID','商品名'])}
  </svg>`;
}

function dfdSvg(){
  return `<svg class="ipa92-model-svg" viewBox="0 0 430 270" aria-label="DFDの例">
    <defs><marker id="ipa92ModelArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs>
    <g class="ipa92-model-flow${elementClass('flow')}" ${buttonAttrs('flow','データフロー')}><line x1="126" y1="95" x2="188" y2="95"/><line x1="276" y1="95" x2="340" y2="95"/><text x="132" y="82">注文データ</text><text x="282" y="82">登録データ</text></g>
    <g class="ipa92-model-node${elementClass('external')}" ${buttonAttrs('external','外部実体 顧客')}><rect x="30" y="65" width="96" height="60"/><text class="title" x="78" y="100">顧客</text></g>
    <g class="ipa92-model-node${elementClass('process')}" ${buttonAttrs('process','処理 注文受付')}><rect x="188" y="57" width="88" height="76" rx="30"/><text class="title" x="232" y="90">注文</text><text class="title" x="232" y="110">受付</text></g>
    <g class="ipa92-model-node${elementClass('store')}" ${buttonAttrs('store','データストア 注文DB')}><path d="M340 65h72v60h-72m8-60v60"/><text class="title" x="378" y="100">注文DB</text></g>
    <text class="ipa92-model-caption" x="215" y="205">DFDは処理の順番より「データの流れ」を見る</text>
  </svg>`;
}

function erSvg(){
  return `<svg class="ipa92-model-svg" viewBox="0 0 430 270" aria-label="E-R図の例">
    <g class="ipa92-model-relation${elementClass('cardinality')}" ${buttonAttrs('cardinality','カーディナリティ 1対多')}><line x1="142" y1="105" x2="188" y2="105"/><line x1="252" y1="105" x2="300" y2="105"/><text x="151" y="92">1</text><text x="280" y="92">N</text></g>
    <g class="ipa92-model-node${elementClass('entity-customer')}" ${buttonAttrs('entity-customer','エンティティ 顧客')}><rect x="30" y="68" width="112" height="74" rx="7"/><text class="title" x="86" y="100">顧客</text><text x="86" y="122">顧客ID</text></g>
    <g class="ipa92-model-node${elementClass('relationship')}" ${buttonAttrs('relationship','リレーションシップ 行う')}><polygon points="220,70 252,105 220,140 188,105"/><text class="title" x="220" y="110">行う</text></g>
    <g class="ipa92-model-node${elementClass('entity-order')}" ${buttonAttrs('entity-order','エンティティ 注文')}><rect x="300" y="68" width="112" height="74" rx="7"/><text class="title" x="356" y="100">注文</text><text x="356" y="122">注文ID</text></g>
    <text class="ipa92-model-caption" x="215" y="205">1人の顧客 : 複数の注文 ＝ 1 : N</text>
  </svg>`;
}

function diagramSvg(){return activeMode==='uml'?umlSvg():activeMode==='dfd'?dfdSvg():erSvg()}

function injectStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
body.ipa92-model-open{overflow:hidden}#${DIALOG_ID}[hidden]{display:none!important}#${DIALOG_ID}{position:fixed;inset:0;z-index:2147482030;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(15,23,42,.62);backdrop-filter:blur(4px)}
.ipa92-model-dialog{box-sizing:border-box;width:min(860px,100%);max-height:calc(100dvh - 24px);overflow:auto;overscroll-behavior:contain;padding:20px;border-radius:22px;background:#fff;color:#24313d;box-shadow:0 28px 80px rgba(15,23,42,.28)}.ipa92-model-head{display:flex;justify-content:space-between;gap:14px}.ipa92-model-kicker{display:block;color:#2f6f16;font-size:11px;font-weight:900}.ipa92-model-head h2{margin:3px 0 0;font-size:clamp(20px,4vw,28px)}.ipa92-model-close{width:44px;height:44px;border:1px solid #d8dee5;border-radius:50%;background:#fff;font-size:24px;cursor:pointer}.ipa92-model-lead{margin:10px 0 12px;color:#52606d;font-size:13px;line-height:1.65}
.ipa92-model-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.ipa92-model-tabs button{min-height:46px;border:1px solid #d7dfe7;border-radius:12px;background:#fff;font-weight:900;cursor:pointer}.ipa92-model-tabs button.is-active{border-color:#58cc02;background:#eef9e7;color:#2f6f16}.ipa92-model-stage{display:grid;grid-template-columns:minmax(0,1fr) minmax(210px,260px);gap:14px;align-items:center;padding:14px;border:1px solid #e2e8f0;border-radius:18px;background:#fbfcfd}.ipa92-model-svg{display:block;width:100%;max-height:360px;touch-action:manipulation;user-select:none}.ipa92-model-node,.ipa92-model-relation,.ipa92-model-flow{cursor:pointer}.ipa92-model-node rect,.ipa92-model-node polygon,.ipa92-model-node path{fill:#fff;stroke:#475569;stroke-width:2.5}.ipa92-model-node line{stroke:#94a3b8;stroke-width:1.5}.ipa92-model-node text,.ipa92-model-relation text,.ipa92-model-flow text{fill:#334155;font-size:12px;text-anchor:middle}.ipa92-model-node text.title{font-size:14px;font-weight:900}.ipa92-model-relation line,.ipa92-model-flow line{stroke:#64748b;stroke-width:2.5}.ipa92-model-flow line{marker-end:url(#ipa92ModelArrow)}.ipa92-model-flow path{fill:#64748b}.ipa92-model-node.is-selected rect,.ipa92-model-node.is-selected polygon,.ipa92-model-node.is-selected path{fill:#eef9e7;stroke:#58cc02;stroke-width:4}.ipa92-model-relation.is-selected line,.ipa92-model-flow.is-selected line{stroke:#7c3aed;stroke-width:5}.ipa92-model-node:focus-visible rect,.ipa92-model-node:focus-visible polygon,.ipa92-model-relation:focus-visible line,.ipa92-model-flow:focus-visible line{stroke:#2563eb;stroke-width:5}.ipa92-model-caption{font-size:12px!important;fill:#52606d!important;text-anchor:middle!important}.ipa92-model-readout{display:grid;gap:7px;padding:14px;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 1px #e2e8f0}.ipa92-model-readout b{color:#1f5f0c;font-size:16px}.ipa92-model-readout span{color:#52606d;font-size:12px;line-height:1.65}
.ipa92-model-quiz{margin-top:14px;padding:14px;border:1px solid #ded8fa;border-radius:16px;background:#faf9ff}.ipa92-model-quiz-kicker{font-size:11px;font-weight:900;color:#5b21b6}.ipa92-model-quiz-q{margin:5px 0 10px;font-size:13px;font-weight:800;line-height:1.55}.ipa92-model-quiz-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ipa92-model-quiz-buttons button,.ipa92-model-next{min-height:44px;border:1px solid #d7dfe7;border-radius:11px;background:#fff;font-weight:900;cursor:pointer}.ipa92-model-quiz-buttons button.correct{border-color:#58cc02;background:#eef9e7;color:#1f5f0c}.ipa92-model-quiz-buttons button.wrong{border-color:#ef4444;background:#fff1f2;color:#991b1b}.ipa92-model-feedback{min-height:36px;margin-top:9px;font-size:12px;line-height:1.55;color:#52606d}.ipa92-model-next{display:none;width:100%;margin-top:8px;background:#58cc02;color:#fff;border-color:#58cc02}.ipa92-model-next.show{display:block}.ipa92-model-score{margin-top:8px;text-align:right;font-size:11px;font-weight:800;color:#64748b}
.ipa92-model-close:focus-visible,.ipa92-model-tabs button:focus-visible,.ipa92-model-quiz-buttons button:focus-visible,.ipa92-model-next:focus-visible{outline:3px solid rgba(88,204,2,.25);outline-offset:2px}@media(max-width:680px){.ipa92-model-dialog{padding:15px;border-radius:18px}.ipa92-model-stage{grid-template-columns:1fr;padding:10px}.ipa92-model-svg{max-height:290px}.ipa92-model-quiz-buttons{grid-template-columns:1fr}.ipa92-model-tabs button{min-height:48px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
`;document.head.appendChild(style);
}

function bindElementEvents(root){
  root.querySelectorAll('[data-model-element]').forEach(el=>{
    const activate=()=>{selectedElement=el.dataset.modelElement;render()};
    el.addEventListener('click',activate);el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate()}});
  });
}

function renderQuiz(){
  const dialog=document.getElementById(DIALOG_ID);if(!dialog)return;
  const scenario=SCENARIOS[quizIndex];
  dialog.querySelector('[data-model-quiz-q]').textContent=scenario.text;
  dialog.querySelector('[data-model-score]').textContent=`${quizIndex+1} / ${SCENARIOS.length}　正解 ${quizScore}`;
  const feedback=dialog.querySelector('[data-model-feedback]');feedback.textContent='';
  const next=dialog.querySelector('[data-model-next]');next.classList.remove('show');
  dialog.querySelectorAll('[data-model-answer]').forEach(btn=>{btn.disabled=false;btn.classList.remove('correct','wrong')});
  quizAnswered=false;
}

function answerQuiz(answer){
  if(quizAnswered)return;quizAnswered=true;
  const dialog=document.getElementById(DIALOG_ID),scenario=SCENARIOS[quizIndex];if(!dialog)return;
  const ok=answer===scenario.answer;if(ok)quizScore++;
  dialog.querySelectorAll('[data-model-answer]').forEach(btn=>{btn.disabled=true;if(btn.dataset.modelAnswer===scenario.answer)btn.classList.add('correct');else if(btn.dataset.modelAnswer===answer)btn.classList.add('wrong')});
  dialog.querySelector('[data-model-feedback]').textContent=`${ok?'正解です。':'ここは '+MODE_LABELS[scenario.answer]+' です。'} ${scenario.reason}`;
  dialog.querySelector('[data-model-score]').textContent=`${quizIndex+1} / ${SCENARIOS.length}　正解 ${quizScore}`;
  dialog.querySelector('[data-model-next]').classList.add('show');
}

function nextQuiz(){
  quizIndex=(quizIndex+1)%SCENARIOS.length;if(quizIndex===0)quizScore=0;renderQuiz();
}

function render(){
  const dialog=document.getElementById(DIALOG_ID);if(!dialog)return;
  const canvas=dialog.querySelector('[data-model-canvas]');canvas.innerHTML=diagramSvg();bindElementEvents(canvas);
  const item=selectedModelElement();
  dialog.querySelector('[data-model-mode]').textContent=MODE_LABELS[activeMode];
  dialog.querySelector('[data-model-detail-title]').textContent=item.label;
  dialog.querySelector('[data-model-detail]').textContent=item.description;
  dialog.querySelector('[data-model-mode-lead]').textContent=MODELS[activeMode].lead;
  dialog.querySelectorAll('[data-model-tab]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.modelTab===activeMode));
}

function setMode(mode){
  if(!MODE_ORDER.includes(mode))return false;activeMode=mode;selectedElement=MODELS[mode].elements[0].id;render();return true;
}

function buildDialog(){
  injectStyles();let backdrop=document.getElementById(DIALOG_ID);if(backdrop)return backdrop;
  backdrop=document.createElement('div');backdrop.id=DIALOG_ID;backdrop.hidden=true;backdrop.innerHTML=`<section class="ipa92-model-dialog" role="dialog" aria-modal="true" aria-labelledby="ipa92ModelTitle"><div class="ipa92-model-head"><div><span class="ipa92-model-kicker">図解・操作ラボ / IPA Ver.9.2補強</span><h2 id="ipa92ModelTitle">UML・DFD・E-R図を使い分ける</h2></div><button type="button" class="ipa92-model-close" data-model-close aria-label="設計図ラボを閉じる">×</button></div><p class="ipa92-model-lead">図の要素をタップして意味を確認し、「構造」「データの流れ」「データの関係」のどれを表したいかで図を選び分けます。</p><div class="ipa92-model-tabs">${MODE_ORDER.map(mode=>`<button type="button" data-model-tab="${mode}">${MODE_LABELS[mode]}</button>`).join('')}</div><div class="ipa92-model-stage"><div data-model-canvas></div><div class="ipa92-model-readout" aria-live="polite"><b data-model-mode></b><span data-model-mode-lead></span><b data-model-detail-title></b><span data-model-detail></span></div></div><div class="ipa92-model-quiz"><div class="ipa92-model-quiz-kicker">使い分けミニ判定</div><div class="ipa92-model-quiz-q" data-model-quiz-q></div><div class="ipa92-model-quiz-buttons">${MODE_ORDER.map(mode=>`<button type="button" data-model-answer="${mode}">${MODE_LABELS[mode]}</button>`).join('')}</div><div class="ipa92-model-feedback" data-model-feedback aria-live="polite"></div><button type="button" class="ipa92-model-next" data-model-next>次の判定へ →</button><div class="ipa92-model-score" data-model-score></div></div></section>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('[data-model-close]').addEventListener('click',closeLab);backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeLab()});
  backdrop.querySelectorAll('[data-model-tab]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.modelTab)));
  backdrop.querySelectorAll('[data-model-answer]').forEach(btn=>btn.addEventListener('click',()=>answerQuiz(btn.dataset.modelAnswer)));
  backdrop.querySelector('[data-model-next]').addEventListener('click',nextQuiz);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)closeLab()});return backdrop;
}

function openLab(){
  const dialog=buildDialog();returnFocus=document.activeElement;activeMode='uml';selectedElement='customer';quizIndex=0;quizScore=0;dialog.hidden=false;document.body.classList.add('ipa92-model-open');render();renderQuiz();setTimeout(()=>dialog.querySelector('[data-model-close]')?.focus(),0);
}
function closeLab(){
  const dialog=document.getElementById(DIALOG_ID);if(!dialog||dialog.hidden)return;dialog.hidden=true;document.body.classList.remove('ipa92-model-open');const target=returnFocus;returnFocus=null;if(target&&target.isConnected)setTimeout(()=>target.focus(),0);
}
function ensureCard(){
  const grid=document.getElementById('labLessonGrid');if(!grid)return false;let card=document.getElementById(CARD_ID);if(card&&card.parentElement===grid)return true;card?.remove();card=document.createElement('button');card.id=CARD_ID;card.type='button';card.className='ipa92-lab-card';card.setAttribute('aria-haspopup','dialog');card.innerHTML='<span class="ipa92-lab-icon">◇</span><span class="ipa92-lab-copy"><small>IPA Ver.9.2補強 / タッチ対応</small><b>UML・DFD・E-R図</b><em>図の要素をタップし、構造・データの流れ・エンティティ関係を使い分けます。</em></span><span class="ipa92-lab-go">操作する →</span>';card.addEventListener('click',openLab);grid.appendChild(card);return true;
}
function scheduleEnsure(){if(ensureScheduled)return;ensureScheduled=true;const run=()=>{ensureScheduled=false;ensureCard()};if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0)}

validateModels();injectStyles();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleEnsure,{once:true});else scheduleEnsure();new MutationObserver(scheduleEnsure).observe(document.documentElement,{childList:true,subtree:true});
globalThis.FEQUEST_IPA92_MODELING_LAB=Object.freeze({version:VERSION,open:openLab,validate:validateModels,setMode,modes:MODE_ORDER,scenarios:SCENARIOS});
})();
