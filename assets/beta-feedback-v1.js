(function(root){
'use strict';
const choice=(id,label,options)=>({id,label,options,required:true});
const text=(id,label,note)=>({id,label,note,type:'text',required:false});
const stages={
  d1:{title:'初回の使いやすさ',intro:'最初の学習を試した時点で教えてください。途中で止まった場合も回答できます。',fields:[
    choice('opened','アプリを開いて利用できましたか？',['はい','いいえ']),
    choice('setup','初回設定・実力診断を完了できましたか？',['完了できた','途中まで','開始できなかった']),
    choice('started','「今日の学習」から学習を始められましたか？',['始められた','始められなかった','どこから始めるか分からなかった','そこまで進んでいない']),
    choice('confusion','次に何を押すか分からない場所はありましたか？',['なかった','あった','まだ判断できない']),
    choice('blocker','起動・保存・学習開始に重大な問題はありましたか？',['なかった','起動できなかった','保存できない・データ消失の疑い','学習を始められなかった','その他・複数の問題','判断できない']),
    text('detail','止まった場所・分かりにくかった点','画面名や行おうとした操作だけで構いません。'),
    text('environment','使った端末・ブラウザ','例：iPhone / Safari。分かる範囲で構いません。')
  ]},
  d3:{title:'3日目ごろの感想',intro:'使っていない場合も、そのまま教えてください。',fields:[
    choice('returned','初回以降、もう一度利用しましたか？',['はい','いいえ']),
    choice('burden','次に何を勉強するか考える負担は減りましたか？',['減った','どちらともいえない','減らなかった','まだ判断できない']),
    choice('plan','「今日の学習」の内容に納得できましたか？',['納得できた','だいたい納得できた','あまり納得できなかった','利用していない・判断できない']),
    choice('navigation','復習・科目B・次の学習へ進むときに迷いましたか？',['迷わなかった','少し迷った','かなり迷った','そこまで利用していない']),
    choice('nextday','今後も使いたいと思いますか？',['使いたい','たぶん使う','分からない','たぶん使わない','使わない']),
    text('reason','その理由・一番分かりにくかった点','使わなかった理由も歓迎します。')
  ]},
  d7:{title:'7日目ごろの感想',intro:'毎日の利用は必須ではありません。継続した理由と、使わなくなった理由を教えてください。',fields:[
    choice('continued','今の利用状況に最も近いものは？',['今も使っている','数回使ったが現在は使っていない','初回以降ほとんど使わなかった']),
    choice('burden','今日は何を勉強するか考える負担は減りましたか？',['減った','どちらともいえない','減らなかった','判断できない']),
    choice('future','今後も使いたいと思いますか？',['ぜひ使いたい','使いたい','どちらともいえない','あまり使いたくない','使いたくない']),
    choice('data','保存・復旧・同期・プライバシーに不安はありましたか？',['なかった','あった','利用していない・判断できない']),
    text('reason','続けた・使わなくなった一番大きな理由','良い評価である必要はありません。'),
    text('improve','一つだけ直すなら、どこですか？','データへの不安があれば、内容を最小限で記載してください。')
  ]},
  bug:{title:'不具合・分かりにくい点',intro:'学習データを消すなどの操作はせず、分かる範囲で状況を教えてください。',fields:[
    choice('kind','報告の種類',['起動・通信','保存・進捗','操作・表示','教材・解説','学習計画','その他']),
    choice('impact','学習への影響',['学習を続けられない','一部を使えない','学習は続けられる','判断できない']),
    text('actual','行った操作と、実際に起きたこと','例：教材一覧から開くと、読み込み表示のまま止まった。'),
    text('expected','期待していた動き','問題・教材の全文を貼らず、画面名と動きだけで構いません。'),
    text('environment','端末・ブラウザ','分かる範囲で構いません。')
  ]},
  price:{title:'有料化についての意見（任意）',intro:'購入予約や契約ではありません。価格や提供内容は未定で、この回答から料金は発生しません。基本教材・演習・復習を無料とし、教材に沿った個別解説や弱点に合わせた追加演習を有料にする仮案への意見です。',fields:[
    choice('interest','このような有料支援を検討しますか？',['有料でも検討したい','内容・価格による','無料なら使いたい','利用しない','判断できない']),
    choice('price480','仮に月額480円なら、どう感じますか？',['検討できる','その内容には払わない','内容を試してから判断したい','判断できない']),
    choice('price980','同じ仮案が月額980円なら、どう感じますか？',['検討できる','その内容には払わない','内容を試してから判断したい','判断できない']),
    text('value','お金を払う価値があると感じる支援・条件','無料で十分だと思う理由も歓迎します。')
  ]}
};
const validStage=value=>Object.prototype.hasOwnProperty.call(stages,value)?value:'d1';
function buildAnswer(stage,answers){
  stage=validStage(stage);
  const rows=['## FE QUEST βフィードバック',`回答の種類：${stages[stage].title}`];
  const code=String(answers.tester||'').trim();
  if(code)rows.push(`管理番号：${code}`);
  for(const field of stages[stage].fields){const value=String(answers[field.id]||'').trim();if(value)rows.push(`\n### ${field.label}\n${value}`);}
  rows.push('\n※本人による感想です。アプリの利用履歴から自動判定した結果ではありません。');
  if(stage==='price')rows.push('※有料機能・価格は仮案への意見です。購入予約・契約ではありません。');
  return rows.join('\n');
}
function sensitive(value){return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:access|refresh)_token\s*[=:]|-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\./i.test(value);}
function issueUrl(stage,body){return 'https://github.com/taiwanwan64/fe-quest/issues/new?'+new URLSearchParams({title:'[β] '+stages[validStage(stage)].title,body}).toString();}
if(typeof module==='object'&&module.exports)module.exports={stages,validStage,buildAnswer,sensitive,issueUrl};
if(!root.document)return;
const document=root.document;
const form=document.getElementById('feedbackForm');
if(!form)return;
let stage=validStage(new URL(root.location.href).searchParams.get('stage'));
const drafts={},previews={};
let dirty=false;
const byId=id=>document.getElementById(id);
function readAnswers(){const answers={};for(const input of form.querySelectorAll('input,select,textarea'))answers[input.name]=input.value;return answers;}
function status(message,error=false){const node=byId('shareStatus');node.textContent=message;node.classList.toggle('error',error);}
function render(next){
  if(form.elements.length){drafts[stage]=readAnswers();if(!byId('review').hidden)previews[stage]=byId('answerPreview').value;}
  stage=validStage(next);
  const spec=stages[stage];
  byId('stageTitle').textContent=spec.title;byId('stageIntro').textContent=spec.intro;
  document.querySelectorAll('[data-stage]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.stage===stage)));
  const questions=byId('questions');questions.replaceChildren();
  const fields=[{id:'tester',label:'運営者から指定された管理番号',note:'任意。B01などの管理番号のみ。β招待コードや連絡先は入力しないでください。',type:'code'},...spec.fields];
  for(const field of fields){
    const label=document.createElement('label');label.className='field';
    const title=document.createElement('span');title.className='field-label';title.textContent=field.label;
    if(!field.required){const optional=document.createElement('span');optional.className='optional';optional.textContent='任意';title.append(optional);}
    label.append(title);
    if(field.note){const note=document.createElement('span');note.className='field-note';note.id='note-'+field.id;note.textContent=field.note;label.append(note);}
    const control=document.createElement(field.options?'select':field.type==='code'?'input':'textarea');
    control.id='answer-'+field.id;control.name=field.id;control.required=!!field.required;
    if(field.options){const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='選んでください';control.append(placeholder);for(const value of field.options){const option=document.createElement('option');option.value=value;option.textContent=value;control.append(option);}}
    else if(field.type==='code'){control.type='text';control.pattern='[A-Z][0-9]{2,3}';control.maxLength=4;control.placeholder='例：B01';control.autocomplete='off';}
    else {control.maxLength=160;control.rows=3;}
    if(field.note)control.setAttribute('aria-describedby','note-'+field.id);
    control.value=drafts[stage]?.[field.id]||'';label.append(control);questions.append(label);
  }
  byId('review').hidden=!previews[stage];byId('answerPreview').value=previews[stage]||'';
  byId('publicConsent').checked=false;byId('priceNext').hidden=stage!=='d7';status('');
  const url=new URL(root.location.href);url.searchParams.set('stage',stage);root.history.replaceState(null,'',url);
}
document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>render(button.dataset.stage)));
form.addEventListener('input',()=>{dirty=true;previews[stage]='';byId('review').hidden=true;byId('publicConsent').checked=false;});
form.addEventListener('change',()=>{dirty=true;previews[stage]='';byId('review').hidden=true;byId('publicConsent').checked=false;});
form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const answers=readAnswers();
  if(stage==='bug'&&!String(answers.actual||'').trim()){byId('answer-actual').setCustomValidity('行った操作と起きたことを、短く入力してください。');byId('answer-actual').reportValidity();byId('answer-actual').addEventListener('input',()=>byId('answer-actual').setCustomValidity(''),{once:true});return;}
  const body=buildAnswer(stage,answers);
  if(sensitive(body)){root.alert('連絡先や認証情報と思われる内容があります。入力から取り除いてください。');return;}
  drafts[stage]=answers;previews[stage]=body;byId('answerPreview').value=body;byId('review').hidden=false;byId('publicConsent').checked=false;status('回答を作成しました。まだ提出されていません。');byId('reviewTitle').focus();
});
byId('answerPreview').addEventListener('input',()=>{dirty=true;previews[stage]=byId('answerPreview').value;byId('publicConsent').checked=false;status('内容を変更しました。公開前の確認をもう一度行ってください。');});
function checkedBody(){const body=byId('answerPreview').value.trim();if(!body){status('回答内容が空です。',true);return null;}if(sensitive(body)){status('連絡先や認証情報と思われる内容を取り除いてください。',true);return null;}return body;}
async function copy(){const body=checkedBody();if(!body)return;try{if(!root.navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await root.navigator.clipboard.writeText(body);status('コピーしました。募集元の連絡手段などに貼り付けて渡せます。');}catch{byId('answerPreview').focus();byId('answerPreview').select();status('自動コピーができませんでした。選択された回答を手動でコピーしてください。',true);}}
byId('copyAnswer').addEventListener('click',copy);
byId('saveAnswer').addEventListener('click',()=>{const body=checkedBody();if(!body)return;const url=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='fequest-feedback-'+stage+'.txt';document.body.append(link);link.click();link.remove();root.setTimeout(()=>URL.revokeObjectURL(url),1000);status('保存用ファイルを作成しました。まだ運営者には提出されていません。');});
byId('openGithub').addEventListener('click',()=>{
  const body=checkedBody();if(!body)return;
  if(!byId('publicConsent').checked){status('公開される内容を確認し、確認のチェックを入れてください。',true);byId('publicConsent').focus();return;}
  const url=issueUrl(stage,body);
  if(url.length>7500){status('回答が長いため、回答をコピーしてGitHubの本文欄に貼り付けてください。まだ提出されていません。',true);root.open('https://github.com/taiwanwan64/fe-quest/issues/new','_blank','noopener,noreferrer');return;}
  root.open(url,'_blank','noopener,noreferrer');status('GitHubの確認画面を開きます。投稿はGitHub上で確定してください。このページでは提出済みか確認できません。');
});
root.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
render(stage);
})(typeof window==='object'?window:globalThis);
