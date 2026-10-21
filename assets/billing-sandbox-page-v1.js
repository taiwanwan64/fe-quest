(function(root){
  'use strict';
  const doc=root.document,api=root.FEQUEST_BILLING_SANDBOX_API_V1,config=root.FEQUEST_BILLING_CONFIG_V1,by=id=>doc.getElementById(id);
  let auth,client,sessionID=null,busy=false,sendAfter=0,cooldown,poll,polls=0,stopped=false;
  const text=(id,value)=>{by(id).textContent=value;};
  const errors={sandbox_unavailable:'テスト決済は準備中です。開始の案内までお待ちください。',sandbox_window_closed:'テスト決済の受付期間外です。',sandbox_not_allowed:'このアカウントはテスト対象に設定されていません。案内されたメールアドレスをご確認ください。',authentication_required:'テストに使うメールアドレスでログインしてください。',already_active:'このアカウントには利用権があります。追加のテスト購入はできません。',checkout_expired:'前のテスト手続きは期限切れです。新しい手続きを開始できます。',request_already_completed:'前のテスト手続きは完了しています。利用状況を確認してください。',payment_confirmation_pending:'確認中です。追加購入せず、少し待ってから再確認してください。',payment_reconciliation_required:'支払い状況の確認が必要です。追加購入せず、案内をお待ちください。',checkout_reconciliation_required:'前の手続きの確認が必要です。追加購入せず、案内をお待ちください。',purchase_not_found:'このアカウントのテスト購入を確認できませんでした。',invalid_return:'テスト購入の情報を確認できませんでした。',sandbox_response_invalid:'テスト決済の接続先を確認できませんでした。'};
  function account(){const s=auth?.snapshot();text('accountLabel',s?.signedIn?(s.email||'ログイン中'):'ログインしていません');by('loginPanel').hidden=Boolean(s?.signedIn);by('signOut').hidden=!s?.signedIn;}
  function loginButtons(){by('sendCode').disabled=busy||Date.now()<sendAfter;by('verifyCode').disabled=busy;by('signOut').disabled=busy;}
  function render(state){
    account();const data=state.status,p=data?.purchase,active=data?.entitlement.active;
    let heading='テストの準備状況を確認しています',copy='しばらくお待ちください。';
    if(state.lastError){heading='テスト決済を開始できません';copy=errors[state.lastError]||'接続を確認できませんでした。通信状態を確認して再確認してください。';}
    else if(data){
      if(p?.state==='pending'){heading='テストのお支払いを確認しています';copy='追加購入せず、少し待ってから再確認してください。';}
      else if(p?.state==='refunded'){heading='テストの返金を確認しました';copy='この購入分の利用権は終了しました。学習履歴は保持されています。';}
      else if(active){heading='利用権を確認しました';copy='追加のテスト購入はできません。学習履歴は保持されています。';}
      else if(data.purchaseAvailable){heading='テスト決済を開始できます';copy='内容にチェックを入れて、Stripeのテスト画面へ進んでください。';}
      else{heading='テスト決済の受付期間外です';copy='通常の無料学習は引き続き利用できます。';}
    }
    text('accessHeading',heading);text('accessCopy',copy);
    const available=Boolean(data?.sandbox&&data.purchaseAvailable&&!active&&state.userID);
    by('consentRow').hidden=!available;by('checkout').disabled=!available||state.busy||!by('consent').checked;
    text('checkout',state.busy?'テスト手続きを確認しています':'2,980円のテスト決済へ');
    by('newAttempt').hidden=!['checkout_expired','request_already_completed'].includes(state.lastError);by('newAttempt').disabled=state.busy||!by('consent').checked;
    by('refreshStatus').disabled=state.busy;
  }
  async function refresh(){
    clearTimeout(poll);if(stopped||!client)return;
    try{const data=await client.refresh(sessionID);if(data.purchase?.confirmationPending&&!data.purchase.reconciliationRequired&&polls<12&&doc.visibilityState!=='hidden'){polls++;poll=setTimeout(refresh,2000);}}catch(_e){}
  }
  function schedule(){polls=0;clearTimeout(poll);queueMicrotask(refresh);}
  async function authenticate(action){
    if(busy||!auth||(action==='send'&&Date.now()<sendAfter))return;
    busy=true;loginButtons();text('authMessage','確認しています…');
    try{
      if(action==='send'){
        if(!by('email').reportValidity())return;sendAfter=Date.now()+60000;clearTimeout(cooldown);cooldown=setTimeout(loginButtons,60000);
        const result=await auth.sendMagicLink(by('email').value);text('authMessage',result.ok?'確認コードを送信しました。メールのコードを入力してください。':'確認コードを送信できませんでした。');if(result.ok)by('code').focus();
      }else if(action==='verify'){
        const result=await auth.verifyEmailCode(by('email').value,by('code').value);by('code').value='';text('authMessage',result.ok?'ログインしました。':'確認コードとメールアドレスをご確認ください。');if(result.ok)schedule();
      }else{const result=await auth.signOutThisDevice();text('authMessage',result.ok?'ログアウトしました。':'ログアウトできませんでした。');if(result.ok)schedule();}
    }catch(_e){text('authMessage','通信状態をご確認ください。');}finally{busy=false;loginButtons();account();}
  }
  async function start(){
    try{
      sessionID=api.parseReturnURL(root.location.href);root.history.replaceState(root.history.state,'',root.location.pathname);
      const sdk=root.FEQUEST_SUPABASE_AUTH_V342.createConfiguredClient({createClient:root.supabase.createClient,url:config.supabaseURL,publishableKey:config.publishableKey});
      auth=root.FEQUEST_SUPABASE_AUTH_V342.createAuthBoundary({client:sdk,redirectTo:config.appBaseURL,onAuthError:()=>{}});await auth.initialize();
      client=api.createClient({authBoundary:auth,config});client.subscribe(render);
      auth.subscribe(()=>{by('code').value='';by('consent').checked=false;account();schedule();});
      by('sendCode').addEventListener('click',()=>authenticate('send'));by('verifyCode').addEventListener('click',()=>authenticate('verify'));by('signOut').addEventListener('click',()=>authenticate('signout'));
      by('code').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();authenticate('verify');}});
      by('consent').addEventListener('change',()=>render(client.snapshot()));by('refreshStatus').addEventListener('click',schedule);
      by('checkout').addEventListener('click',()=>{if(by('consent').checked)client.checkout().catch(()=>{});});by('newAttempt').addEventListener('click',()=>{if(by('consent').checked)client.checkout({newAttempt:true}).catch(()=>{});});
      doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='hidden')clearTimeout(poll);else schedule();});loginButtons();await refresh();
    }catch(e){text('accessHeading','テスト決済を開始できません');text('accessCopy',errors[e.code]||'接続を確認できませんでした。ページを開き直してください。');}
  }
  root.addEventListener('pagehide',()=>{stopped=true;clearTimeout(poll);clearTimeout(cooldown);client?.dispose();auth?.dispose();});root.addEventListener('pageshow',e=>{if(e.persisted)root.location.reload();});start();
})(globalThis);
