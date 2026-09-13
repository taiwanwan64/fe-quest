(()=>{
'use strict';

const VERSION='ipa92-modeling-lab-v1';
const CARD_ID='ipa92ModelingLabCard';
const DIALOG_ID='ipa92ModelingLabDialog';
const STYLE_ID='ipa92ModelingLabStyle';
const MODES=Object.freeze(['uml','dfd','er']);

const MODELS=Object.freeze({
  uml:Object.freeze({
    label:'UML',
    title:'クラス図：構造と関係を読む',
    cue:'クラス図は「ものの構造」を表します。クラス・属性・操作と、クラス同士の関係を読み分けます。',
    elements:Object.freeze([
      Object.freeze({id:'uml-class-user',kind:'クラス',label:'利用者',detail:'クラスは、同じ性質や振る舞いをもつオブジェクトの設計図です。'}),
      Object.freeze({id:'uml-attribute',kind:'属性',label:'name : String',detail:'属性は、クラスが保持するデータや状態を表します。'}),
      Object.freeze({id:'uml-operation',kind:'操作',label:'login()',detail:'操作（メソッド）は、クラスが提供する処理や振る舞いを表します。'}),
      Object.freeze({id:'uml-class-admin',kind:'クラス',label:'管理者',detail:'管理者クラスは利用者クラスの性質を引き継ぐ例として配置しています。'}),
      Object.freeze({id:'uml-generalization',kind:'汎化（継承）',label:'△ 汎化',detail:'白抜き三角形の矢印で、より一般的なクラスへつながる継承関係を表します。'})
    ]),
    practice:Object.freeze({prompt:'「管理者は利用者の一種である」という関係を表すのに最も適切なのは？',choices:Object.freeze(['関連','汎化（継承）','集約']),answer:1,why:'「〜は〜の一種」という is-a 関係なので、汎化（継承）で表します。'})
  }),
  dfd:Object.freeze({
    label:'DFD',
    title:'DFD：データの流れを読む',
    cue:'DFDは「データがどこから来て、どの処理を通り、どこへ行くか」を表します。処理手順そのものより、データの流れに注目します。',
    elements:Object.freeze([
      Object.freeze({id:'dfd-external',kind:'外部実体',label:'顧客',detail:'外部実体は、対象システムの外側からデータを与えたり受け取ったりする人・組織・別システムです。'}),
      Object.freeze({id:'dfd-flow-in',kind:'データフロー',label:'注文データ →',detail:'データフローは、データが移動する向きと内容を矢印で表します。'}),
      Object.freeze({id:'dfd-process',kind:'プロセス',label:'受注登録',detail:'プロセスは、入力データを変換・処理して出力データを作る処理を表します。'}),
      Object.freeze({id:'dfd-flow-out',kind:'データフロー',label:'登録情報 →',detail:'処理後のデータがデータストアへ移動する流れです。'}),
      Object.freeze({id:'dfd-store',kind:'データストア',label:'受注DB',detail:'データストアは、システム内でデータを保存しておく場所を表します。'})
    ]),
    practice:Object.freeze({prompt:'「顧客 → ? → 受注DB」とデータが流れるとき、? に置くべき要素は？',choices:Object.freeze(['プロセス','別の外部実体','注釈']),answer:0,why:'外部実体からデータストアへ直接つなぐのではなく、データを処理するプロセスを介して表します。'})
  }),
  er:Object.freeze({
    label:'E-R図',
    title:'E-R図：エンティティと多重度を読む',
    cue:'E-R図は、業務で扱う「もの」と「ものの関係」を表します。テーブル設計の前段階として、エンティティ・属性・カーディナリティを整理します。',
    elements:Object.freeze([
      Object.freeze({id:'er-customer',kind:'エンティティ',label:'顧客',detail:'エンティティは、業務で管理したい対象（人・物・出来事など）を表します。'}),
      Object.freeze({id:'er-customer-key',kind:'属性・主キー',label:'顧客ID',detail:'属性はエンティティの性質です。主キーは各行を一意に識別する属性です。'}),
      Object.freeze({id:'er-relation',kind:'リレーションシップ',label:'注文する',detail:'リレーションシップは、エンティティ同士の意味のある関係を表します。'}),
      Object.freeze({id:'er-cardinality',kind:'カーディナリティ',label:'1 : N',detail:'1:Nは、一方の1件に対して他方の複数件が対応できる関係です。'}),
      Object.freeze({id:'er-order',kind:'エンティティ',label:'注文',detail:'注文も業務上管理する独立した対象なのでエンティティとして表します。'})
    ]),
    practice:Object.freeze({prompt:'顧客1人が複数の注文を持ち、各注文は1人の顧客に属する関係は？',choices:Object.freeze(['1 : 1','1 : N','N : M']),answer:1,why:'顧客側が1、注文側が複数なので1:Nです。関係DBでは通常、N側の注文に顧客IDを外部キーとして持たせます。'})
  })
});

function modeModel(mode){return MODELS[mode]||MODELS.uml}
function answerPractice(mode,choiceIndex){const model=modeModel(mode);return Object.freeze({correct:Number(choiceIndex)===model.practice.answer,answer:model.practice.answer,why:model.practice.why})}
function validateModelingLab(){
  if(MODES.some(mode=>!MODELS[mode]))throw new Error('modeling lab mode missing');
  for(const mode of MODES){
    const model=MODELS[mode];
    if(!Array.isArray(model.elements)||model.elements.length<4)throw new Error(`modeling lab elements missing: ${mode}`);
    const ids=model.elements.map(item=>item.id);
    if(new Set(ids).size!==ids.length)throw new Error(`modeling lab duplicate element id: ${mode}`);
    if(!Array.isArray(model.practice.choices)||model.practice.choices.length<3)throw new Error(`modeling lab practice choices invalid: ${mode}`);
    if(!Number.isInteger(model.practice.answer)||model.practice.answer<0||model.practice.answer>=model.practice.choices.length)throw new Error(`modeling lab practice answer invalid: ${mode}`);
  }
  if(answerPractice('uml',1).correct!==true||answerPractice('dfd',0).correct!==true||answerPractice('er',1).correct!==true)throw new Error('modeling lab answer contract invalid');
  return true;
}

let currentMode='uml';
let returnFocus=null;
let ensureScheduled=false;

function injectStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
body.ipa92-modeling-open{overflow:hidden}
#${DIALOG_ID}[hidden]{display:none!important}
#${DIALOG_ID}{position:fixed;inset:0;z-index:2147482020;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(15,23,42,.62);backdrop-filter:blur(4px)}
.ipa92-modeling-dialog{box-sizing:border-box;width:min(860px,100%);max-height:min(920px,calc(100dvh - 24px));overflow:auto;overscroll-behavior:contain;padding:20px;border-radius:22px;background:#fff;color:#24313d;box-shadow:0 28px 80px rgba(15,23,42,.28)}
.ipa92-modeling-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.ipa92-modeling-kicker{display:block;color:#2f6f16;font-size:11px;font-weight:900}.ipa92-modeling-head h2{margin:3px 0 0;font-size:clamp(20px,4vw,28px)}.ipa92-modeling-close{flex:0 0 auto;width:44px;height:44px;border:1px solid #d8dee5;border-radius:50%;background:#fff;font-size:24px;cursor:pointer}
.ipa92-modeling-lead{margin:10px 0 14px;color:#52606d;font-size:13px;line-height:1.65}.ipa92-modeling-tabs{display:flex;gap:8px;overflow:auto;padding:2px 0 12px}.ipa92-modeling-tabs button{min-height:44px;padding:9px 15px;border:1px solid #d7dfe7;border-radius:999px;background:#fff;font-weight:800;cursor:pointer;white-space:nowrap}.ipa92-modeling-tabs button.is-active{border-color:#58cc02;background:#eef9e7;color:#2f6f16}
.ipa92-modeling-title{margin:4px 0 6px;font-size:18px}.ipa92-modeling-cue{margin:0 0 12px;color:#52606d;font-size:13px;line-height:1.65}.ipa92-modeling-stage{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(220px,.65fr);gap:12px}.ipa92-modeling-canvas{min-height:290px;padding:14px;border:1px solid #dbe4ec;border-radius:18px;background:linear-gradient(180deg,#fbfcfd,#f7fafc)}
.ipa92-modeling-diagram{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;align-items:center;min-height:235px}.ipa92-modeling-node{min-height:72px;padding:9px 7px;border:2px solid #cbd5e1;border-radius:12px;background:#fff;color:#24313d;font-size:11px;font-weight:800;text-align:center;cursor:pointer;touch-action:manipulation}.ipa92-modeling-node b{display:block;margin-top:3px;font-size:13px}.ipa92-modeling-node.is-selected{border-color:#7c3aed;background:#f5f3ff;box-shadow:0 0 0 3px rgba(124,58,237,.12)}.ipa92-modeling-node[data-kind*="データフロー"]{border-style:dashed}.ipa92-modeling-node[data-kind="プロセス"]{border-radius:999px}.ipa92-modeling-node[data-kind="データストア"]{border-left-width:5px;border-right-width:5px}.ipa92-modeling-node[data-kind="リレーションシップ"]{transform:rotate(0deg);background:#fff7ed;border-color:#fb923c}
.ipa92-modeling-readout{display:grid;align-content:start;gap:7px;padding:14px;border:1px solid #dbe4ec;border-radius:18px;background:#fff}.ipa92-modeling-readout small{color:#64748b;font-weight:800}.ipa92-modeling-readout b{font-size:17px}.ipa92-modeling-readout p{margin:0;color:#52606d;font-size:13px;line-height:1.7}.ipa92-modeling-tip{margin-top:auto;padding:10px;border-radius:12px;background:#eef9e7;color:#315c20;font-size:12px;line-height:1.6}
.ipa92-modeling-practice{margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:18px;background:#fbfcfd}.ipa92-modeling-practice>strong{display:block;margin-bottom:10px}.ipa92-modeling-choices{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ipa92-modeling-choices button{min-height:48px;padding:9px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;font-weight:800;cursor:pointer}.ipa92-modeling-choices button.is-correct{border-color:#58cc02;background:#eef9e7;color:#2f6f16}.ipa92-modeling-choices button.is-wrong{border-color:#ef4444;background:#fff1f2;color:#991b1b}.ipa92-modeling-feedback{min-height:44px;margin-top:10px;padding:10px 12px;border-radius:12px;background:#f1f5f9;color:#475569;font-size:13px;line-height:1.6}
@media(max-width:680px){.ipa92-modeling-dialog{padding:16px;border-radius:18px}.ipa92-modeling-stage{grid-template-columns:1fr}.ipa92-modeling-diagram{grid-template-columns:1fr;min-height:0}.ipa92-modeling-node{min-height:54px}.ipa92-modeling-choices{grid-template-columns:1fr}.ipa92-modeling-readout{min-height:150px}}
`;
  document.head.appendChild(style);
}

function renderMode(mode){
  currentMode=MODELS[mode]?mode:'uml';
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog)return;
  const model=modeModel(currentMode);
  dialog.querySelectorAll('[data-modeling-mode]').forEach(button=>{
    const active=button.dataset.modelingMode===currentMode;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  const title=dialog.querySelector('[data-modeling-title]');
  const cue=dialog.querySelector('[data-modeling-cue]');
  const canvas=dialog.querySelector('[data-modeling-diagram]');
  const prompt=dialog.querySelector('[data-modeling-practice-prompt]');
  const choices=dialog.querySelector('[data-modeling-choices]');
  const feedback=dialog.querySelector('[data-modeling-feedback]');
  if(title)title.textContent=model.title;
  if(cue)cue.textContent=model.cue;
  if(canvas){
    canvas.innerHTML='';
    for(const element of model.elements){
      const button=document.createElement('button');
      button.type='button';
      button.className='ipa92-modeling-node';
      button.dataset.elementId=element.id;
      button.dataset.kind=element.kind;
      button.innerHTML=`<small>${element.kind}</small><b>${element.label}</b>`;
      button.addEventListener('click',()=>selectElement(element.id));
      canvas.appendChild(button);
    }
  }
  if(prompt)prompt.textContent=model.practice.prompt;
  if(choices){
    choices.innerHTML='';
    model.practice.choices.forEach((choice,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.textContent=choice;
      button.dataset.choiceIndex=String(index);
      button.addEventListener('click',()=>checkPractice(index));
      choices.appendChild(button);
    });
  }
  if(feedback)feedback.textContent='選択肢をタップして、図の関係を組み立てる練習をしてください。';
  const first=model.elements[0];
  selectElement(first.id);
}

function selectElement(id){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog)return;
  const model=modeModel(currentMode);
  const element=model.elements.find(item=>item.id===id)||model.elements[0];
  dialog.querySelectorAll('[data-element-id]').forEach(button=>button.classList.toggle('is-selected',button.dataset.elementId===element.id));
  const kind=dialog.querySelector('[data-modeling-readout-kind]');
  const label=dialog.querySelector('[data-modeling-readout-label]');
  const detail=dialog.querySelector('[data-modeling-readout-detail]');
  if(kind)kind.textContent=element.kind;
  if(label)label.textContent=element.label;
  if(detail)detail.textContent=element.detail;
}

function checkPractice(index){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog)return;
  const result=answerPractice(currentMode,index);
  dialog.querySelectorAll('[data-choice-index]').forEach(button=>{
    const choice=Number(button.dataset.choiceIndex);
    button.classList.toggle('is-correct',choice===result.answer);
    button.classList.toggle('is-wrong',choice===Number(index)&&!result.correct);
  });
  const feedback=dialog.querySelector('[data-modeling-feedback]');
  if(feedback)feedback.textContent=`${result.correct?'正解です。':'もう一度確認しましょう。'} ${result.why}`;
}

function buildDialog(){
  injectStyles();
  let backdrop=document.getElementById(DIALOG_ID);
  if(backdrop)return backdrop;
  backdrop=document.createElement('div');
  backdrop.id=DIALOG_ID;
  backdrop.hidden=true;
  backdrop.innerHTML=`
    <section class="ipa92-modeling-dialog" role="dialog" aria-modal="true" aria-labelledby="ipa92ModelingTitle">
      <div class="ipa92-modeling-head"><div><span class="ipa92-modeling-kicker">図解・操作ラボ / IPA Ver.9.2補強</span><h2 id="ipa92ModelingTitle">UML・DFD・E-R図を見分ける</h2></div><button type="button" class="ipa92-modeling-close" data-modeling-close aria-label="モデリング図ラボを閉じる">×</button></div>
      <p class="ipa92-modeling-lead">図の要素を直接タップして意味を確認し、最後に関係の選び方を練習します。「構造」「データの流れ」「業務データの関係」を混同しないことが目標です。</p>
      <div class="ipa92-modeling-tabs" role="group" aria-label="図の種類を選択"><button type="button" data-modeling-mode="uml">UML クラス図</button><button type="button" data-modeling-mode="dfd">DFD</button><button type="button" data-modeling-mode="er">E-R図</button></div>
      <h3 class="ipa92-modeling-title" data-modeling-title></h3><p class="ipa92-modeling-cue" data-modeling-cue></p>
      <div class="ipa92-modeling-stage"><div class="ipa92-modeling-canvas"><div class="ipa92-modeling-diagram" data-modeling-diagram></div></div><aside class="ipa92-modeling-readout" aria-live="polite"><small data-modeling-readout-kind>要素</small><b data-modeling-readout-label>選択してください</b><p data-modeling-readout-detail></p><div class="ipa92-modeling-tip">試験ではまず「何を表した図か」を判断します。UML=ソフトウェア構造、DFD=データの流れ、E-R図=データ同士の関係、という軸で切り分けると迷いにくくなります。</div></aside></div>
      <div class="ipa92-modeling-practice"><strong data-modeling-practice-prompt></strong><div class="ipa92-modeling-choices" data-modeling-choices></div><div class="ipa92-modeling-feedback" data-modeling-feedback aria-live="polite"></div></div>
    </section>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('[data-modeling-close]')?.addEventListener('click',closeLab);
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeLab()});
  backdrop.querySelectorAll('[data-modeling-mode]').forEach(button=>button.addEventListener('click',()=>renderMode(button.dataset.modelingMode)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)closeLab()});
  return backdrop;
}

function openLab(){
  const dialog=buildDialog();
  returnFocus=document.activeElement;
  dialog.hidden=false;
  document.body.classList.add('ipa92-modeling-open');
  renderMode(currentMode||'uml');
  setTimeout(()=>dialog.querySelector('[data-modeling-close]')?.focus(),0);
}

function closeLab(){
  const dialog=document.getElementById(DIALOG_ID);
  if(!dialog||dialog.hidden)return;
  dialog.hidden=true;
  document.body.classList.remove('ipa92-modeling-open');
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
  card.innerHTML='<span class="ipa92-lab-icon">◇</span><span class="ipa92-lab-copy"><small>IPA Ver.9.2補強 / タッチ対応</small><b>UML・DFD・E-R図</b><em>図の要素をタップし、構造・データの流れ・多重度を見分けます。</em></span><span class="ipa92-lab-go">操作する →</span>';
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

validateModelingLab();
injectStyles();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleEnsure,{once:true});else scheduleEnsure();
new MutationObserver(scheduleEnsure).observe(document.documentElement,{childList:true,subtree:true});

globalThis.FEQUEST_IPA92_MODELING_LAB=Object.freeze({version:VERSION,open:openLab,validate:validateModelingLab,answerPractice,models:MODELS});
})();