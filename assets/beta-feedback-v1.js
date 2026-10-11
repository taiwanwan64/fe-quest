(function(root){
'use strict';
const choice=(id,label,options)=>({id,label,options,required:true});
const text=(id,label,note)=>({id,label,note,type:'text',required:false});
const stages={
  feedback:{title:'ご意見・感想',intro:'改善してほしい点や、学習で役立った点を短く教えてください。',fields:[
    choice('kind','ご意見の種類',['学習計画','教材・図解','科目Aの演習・復習','科目Bの演習','使い方・表示','その他']),
    {...text('detail','伝えたいこと','画面名と、感じたことを記載してください。'),required:true},
    text('environment','使った端末・ブラウザ','例：iPhone / Safari。分かる範囲で構いません。')
  ]},
  bug:{title:'不具合・解説の誤り',intro:'学習データを消すなどの操作はせず、分かる範囲で状況を教えてください。',fields:[
    choice('kind','報告の種類',['起動・通信','保存・進捗','操作・表示','教材・解説','学習計画','その他']),
    choice('impact','学習への影響',['学習を続けられない','一部を使えない','学習は続けられる','判断できない']),
    {...text('actual','行った操作と、実際に起きたこと','例：教材一覧から開くと、読み込み表示のまま止まった。'),required:true},
    text('expected','期待していた動き','問題・教材の全文を貼らず、画面名と動きだけで構いません。'),
    text('environment','端末・ブラウザ','分かる範囲で構いません。')
  ]}
};
const validStage=value=>Object.prototype.hasOwnProperty.call(stages,value)?value:'feedback';
function buildAnswer(stage,answers){
  stage=validStage(stage);
  const rows=['## FE QUEST ご意見・不具合報告',`回答の種類：${stages[stage].title}`];
  for(const field of stages[stage].fields){const value=String(answers[field.id]||'').trim();if(value)rows.push(`\n### ${field.label}\n${value}`);}
  rows.push('\n※本人による感想です。アプリの利用履歴から自動判定した結果ではありません。');
  return rows.join('\n');
}
function sensitive(value){return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:access|refresh)_token\s*[=:]|-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\./i.test(value);}
function issueUrl(stage,body){return 'https://github.com/taiwanwan64/fe-quest/issues/new?'+new URLSearchParams({title:'[FE QUEST] '+stages[validStage(stage)].title,body}).toString();}
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
  const fields=spec.fields;
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
  byId('publicConsent').checked=false;status('');
  const url=new URL(root.location.href);url.searchParams.set('stage',stage);root.history.replaceState(null,'',url);
}
document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>render(button.dataset.stage)));
form.addEventListener('input',()=>{dirty=true;previews[stage]='';byId('review').hidden=true;byId('publicConsent').checked=false;});
form.addEventListener('change',()=>{dirty=true;previews[stage]='';byId('review').hidden=true;byId('publicConsent').checked=false;});
form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const answers=readAnswers();
  const requiredText=stage==='bug'?'actual':'detail';
  if(!String(answers[requiredText]||'').trim()){const input=byId('answer-'+requiredText);input.setCustomValidity('内容を短く入力してください。');input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});return;}
  const body=buildAnswer(stage,answers);
  if(sensitive(body)){root.alert('連絡先や認証情報と思われる内容があります。入力から取り除いてください。');return;}
  drafts[stage]=answers;previews[stage]=body;byId('answerPreview').value=body;byId('review').hidden=false;byId('publicConsent').checked=false;status('回答を作成しました。まだ提出されていません。');byId('reviewTitle').focus();
});
byId('answerPreview').addEventListener('input',()=>{dirty=true;previews[stage]=byId('answerPreview').value;byId('publicConsent').checked=false;status('内容を変更しました。公開前の確認をもう一度行ってください。');});
function checkedBody(){const body=byId('answerPreview').value.trim();if(!body){status('回答内容が空です。',true);return null;}if(sensitive(body)){status('連絡先や認証情報と思われる内容を取り除いてください。',true);return null;}return body;}
async function copy(){const body=checkedBody();if(!body)return;try{if(!root.navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await root.navigator.clipboard.writeText(body);status('コピーしました。GitHubの本文欄などへ貼り付けられます。コピーだけでは提出されません。');}catch{byId('answerPreview').focus();byId('answerPreview').select();status('自動コピーができませんでした。選択された回答を手動でコピーしてください。',true);}}
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
