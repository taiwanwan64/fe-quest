(function(root){
  'use strict';
  const doc=root.document,config=root.FEQUEST_BILLING_CONFIG_V1,api=root.FEQUEST_BILLING_API_V1;
  const by=id=>doc.getElementById(id);let client,auth,sessionID=null,pollTimer,polls=0,cooldownTimer,sendAfter=0,authBusy=false,stopped=false;
  const returnPage=doc.body.dataset.billingPage==='return';
  function text(id,value){const el=by(id);if(el)el.textContent=value;}
  function currentAccount(){const s=auth?.snapshot();text('accountLabel',s?.signedIn?(s.email||'ログイン中'):'ログインしていません');by('loginPanel').hidden=Boolean(s?.signedIn);by('signOut').hidden=!s?.signedIn;}
  function updateLoginButtons(){by('sendCode').disabled=authBusy||Date.now()<sendAfter;by('verifyCode').disabled=authBusy;by('signOut').disabled=authBusy;}
  function date(value){return new Intl.DateTimeFormat('ja-JP',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Tokyo'}).format(value*1000);}
  const errors={authentication_required:'購入時と同じメールアドレスでログインしてください。',purchase_not_found:'このアカウントでは購入情報を確認できませんでした。購入時のアカウントをご確認ください。',payment_confirmation_pending:'お支払いを確認中です。追加の購入操作は行わず、しばらくお待ちください。',payment_reconciliation_required:'お支払い状況を確認しています。追加購入せず、問い合わせ窓口へご連絡ください。',checkout_reconciliation_required:'前の購入手続きを確認する必要があります。追加購入せず、問い合わせ窓口へご連絡ください。',checkout_expired:'前の購入手続きの期限が切れました。新しい手続きを開始できます。',request_already_completed:'前の購入手続きは終了しています。利用状況を再確認してから、新しく開始できます。',already_active:'利用権があります。追加購入せず学習を続けられます。',billing_unavailable:'現在は販売準備中です。無料公開中の学習をご利用ください。',invalid_return:'購入情報を確認できませんでした。利用状況を再確認するか、問い合わせ窓口へご連絡ください。'};
  function render(state){
    const data=state.status,e=data?.entitlement,p=data?.purchase;currentAccount();
    let heading='利用状況を確認しています',copy='しばらくお待ちください。';
    if(state.lastError){heading='利用状況を確認できませんでした';copy=errors[state.lastError]||'通信状態を確認して、もう一度お試しください。';}
    else if(data){
      if(returnPage&&sessionID&&p?.state==='pending'){heading='お支払いを確認しています';copy=p.reconciliationRequired?'追加の購入操作は行わず、問い合わせ窓口へご連絡ください。':'確認が終わるまで少しお待ちください。画面を閉じても確認処理は継続されます。';}
      else if(returnPage&&p?.state==='refunded'){heading='返金済みです';copy='この購入分の利用権は終了しました。学習履歴はそのまま残ります。';}
      else if(returnPage&&p?.state==='expired'){heading='購入手続きの期限が切れました';copy='お支払いは確認されていません。利用プラン画面から改めて手続きできます。';}
      else if(e?.active){heading=returnPage&&p?.state==='paid'?'お支払いを確認しました':'利用権があります';copy=e.kind==='owner'?'個人学習用のアクセスで、学習を続けられます。':(e.kind==='migration'?'移行期間の利用権':'全範囲の利用権')+'は '+date(e.expiresAt)+'（日本時間）まで有効です。';}
      else if(data.accessMode==='open-preview'){heading='現在は無料公開中です';copy='購入手続きは不要です。学習内容と履歴をそのまま利用できます。';}
      else{heading='無料体験をご利用いただけます';copy='無料の6教材・41問を繰り返し利用できます。学習履歴の保存・復元も使えます。';}
    }
    text('accessHeading',heading);text('accessCopy',copy);
    if(by('purchaseAvailability')){
      const notice=state.lastError?'購入の受付状況を確認できません。時間をおいて、利用状況を再確認してください。':!data?'購入の受付状況を確認しています。':data.accessMode==='open-preview'?'現在は全範囲を無料公開しています。購入手続きは不要です。':e?.active?'現在の利用権で学習を続けられます。追加購入は不要です。':data.purchaseAvailable?'全範囲プランの購入を受け付けています。料金と条件を確認してお申し込みください。':'現在、新規購入の受付を停止しています。無料の6教材・41問は購入せずに利用できます。';
      text('purchaseAvailability',notice);
    }
    const available=state.salesEnabled&&data?.purchaseAvailable===true&&!e?.active;
    by('consentRow').hidden=!available;by('checkout').disabled=!available||!state.userID||state.busy||!by('consent').checked;
    text('checkout',state.busy?'購入手続きを確認しています':available?'支払い内容を確認する':e?.active?'利用権があります':'販売準備中');
    by('newAttempt').hidden=!state.salesEnabled||!['checkout_expired','request_already_completed'].includes(state.lastError);
    by('refreshStatus').disabled=state.busy;
  }
  async function refresh(){
    clearTimeout(pollTimer);if(stopped)return;
    try{
      const data=await client.refresh(returnPage?sessionID:null);
      if(returnPage&&data.purchase?.confirmationPending&&!data.purchase.reconciliationRequired&&polls<12&&doc.visibilityState!=='hidden'){polls++;pollTimer=setTimeout(refresh,2000);}
    }catch(_e){}
  }
  function scheduleRefresh(){polls=0;clearTimeout(pollTimer);setTimeout(refresh,0);}
  async function authenticate(action){
    if(authBusy||!auth)return;if(action==='send'&&Date.now()<sendAfter)return;
    authBusy=true;updateLoginButtons();text('authMessage','確認しています…');
    try{
      let result;
      if(action==='send'){
        const email=by('email');if(!email.reportValidity())return;
        sendAfter=Date.now()+60000;clearTimeout(cooldownTimer);cooldownTimer=setTimeout(updateLoginButtons,60000);
        result=await auth.sendMagicLink(email.value);text('authMessage',result.ok?'確認コードを送信しました。メールに届くコードを、この画面に入力してください。':'メールを送信できませんでした。入力と通信状態をご確認ください。');
        if(result.ok)by('code').focus();
      }else if(action==='verify'){
        result=await auth.verifyEmailCode(by('email').value,by('code').value);by('code').value='';
        text('authMessage',result.ok?'ログインしました。':'コードを確認してください。期限切れの場合はメールを再送してください。');
        if(result.ok)scheduleRefresh();
      }else{result=await auth.signOutThisDevice();text('authMessage',result.ok?'この端末からログアウトしました。':'ログアウトできませんでした。もう一度お試しください。');if(result.ok)scheduleRefresh();}
    }catch(_e){text('authMessage','処理できませんでした。通信状態をご確認ください。');}
    finally{authBusy=false;updateLoginButtons();currentAccount();}
  }
  async function start(){
    try{
      if(returnPage){sessionID=api.parseReturnURL(root.location.href);root.history.replaceState(root.history.state,'',root.location.pathname);}
      const clientSDK=root.FEQUEST_SUPABASE_AUTH_V342.createConfiguredClient({createClient:root.supabase.createClient,url:config.supabaseURL,publishableKey:config.publishableKey});
      auth=root.FEQUEST_SUPABASE_AUTH_V342.createAuthBoundary({client:clientSDK,redirectTo:config.appBaseURL,onAuthError:()=>{}});
      await auth.initialize();
      client=api.createClient({authBoundary:auth,config});client.subscribe(render);
      auth.subscribe(()=>{by('code').value='';by('consent').checked=false;currentAccount();scheduleRefresh();});
      by('sendCode').addEventListener('click',()=>authenticate('send'));
      by('verifyCode').addEventListener('click',()=>authenticate('verify'));
      by('code').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();authenticate('verify');}});
      by('signOut').addEventListener('click',()=>authenticate('signout'));
      by('consent').addEventListener('change',()=>render(client.snapshot()));
      by('refreshStatus').addEventListener('click',()=>{polls=0;refresh();});
      by('checkout').addEventListener('click',()=>{if(by('consent').checked)client.checkout().catch(()=>{});});
      by('newAttempt').addEventListener('click',()=>{if(by('consent').checked)client.checkout({newAttempt:true}).catch(()=>{});});
      doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='hidden')clearTimeout(pollTimer);else scheduleRefresh();});
      updateLoginButtons();await refresh();
    }catch(e){text('accessHeading','利用状況を確認できませんでした');text('accessCopy',errors[e.code]||'通信状態を確認して、ページを開き直してください。');}
  }
  root.addEventListener('pagehide',()=>{stopped=true;clearTimeout(pollTimer);clearTimeout(cooldownTimer);client?.dispose();auth?.dispose();});
  root.addEventListener('pageshow',e=>{if(e.persisted)root.location.reload();});
  start();
})(globalThis);
