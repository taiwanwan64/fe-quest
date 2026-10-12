// Keep email-code verification in the same PWA that requested the email.
(()=>{
  'use strict';
  function update(){
    const root=document.getElementById('firstRunGuidedV364');
    if(!root||root.dataset.stage!=='account')return;
    const send=root.querySelector('#firstRunSendLinkV364');
    if(!send)return;
    if(send.textContent!=='ログインメールを送る')send.textContent='ログインメールを送る';
    const help=root.querySelector('.v364-account-help');
    const copy='メールに届く確認コードを、この画面に入力してください。パスワードは不要です。';
    if(help&&help.textContent!==copy)help.textContent=copy;
    const cloud=document.getElementById('cloudSyncCardV342');
    const cloudCode=cloud?.querySelector('#cloudSyncCodeV342');
    let form=root.querySelector('#firstRunCodeFormV1');
    if(!cloudCode){if(form)form.remove();return;}
    if(!form){
      form=document.createElement('div');form.id='firstRunCodeFormV1';form.className='v364-account-form';
      const hint=document.createElement('p');hint.textContent='メールのリンクは開かず、確認コードを入力してください。';
      const label=document.createElement('label');label.className='v364-label';label.htmlFor='firstRunCodeV1';label.textContent='確認コード';
      const input=document.createElement('input');input.id='firstRunCodeV1';input.type='text';input.inputMode='numeric';input.autocomplete='one-time-code';input.maxLength=10;input.pattern='[0-9]{6,10}';
      const button=document.createElement('button');button.type='button';button.className='v364-primary';button.textContent='確認コードでログイン';
      function submit(){
        const target=document.querySelector('#cloudSyncCodeV342');
        const verify=document.querySelector('[data-sync-action="verify-code"]');
        if(!target||!verify||verify.disabled)return;
        target.value=input.value;verify.click();input.value='';
      }
      button.addEventListener('click',submit);
      input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit();}});
      form.append(hint,label,input,button);
      root.querySelector('#firstRunAccountStatusV364')?.insertAdjacentElement('afterend',form);
    }
    if(form.hidden)form.hidden=false;
    const button=form.querySelector('button');
    const disabled=Boolean(cloud.querySelector('[data-sync-action="verify-code"]')?.disabled);
    if(button.disabled!==disabled)button.disabled=disabled;
  }
  let scheduled=false;
  const observer=new MutationObserver(()=>{
    if(scheduled)return;scheduled=true;
    queueMicrotask(()=>{scheduled=false;update();});
  });
  observer.observe(document.body,{childList:true,subtree:true});
  update();
})();
