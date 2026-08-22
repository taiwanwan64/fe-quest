// FE QUEST v342 learner-facing cloud sync settings UI.
// This module owns presentation only. It never reads/writes learner profile data directly and
// performs no network request except through injected auth/controller/account actions chosen by the user.
(function(root){
  'use strict';

  const UI_SPEC=Object.freeze({
    mountBeforeId:'pwaHealthCard',
    cardId:'cloudSyncCardV342',
    policy:'optional-local-first-explicit-conflict-choice',
    signedOutCopy:'ログインしなくても、これまで通りこの端末だけで学習できます。',
    conflictCopy:'新しい学習履歴を自動で上書きしません。どちらを残すか選んでください。',
    deletionCopy:'アカウントを削除すると、クラウド上の学習データも削除されます。この端末の学習データは残ります。'
  });

  function asState(value){return value&&typeof value==='object'?value:{}}
  function asAuth(value){return value&&typeof value==='object'?value:{initialized:false,signedIn:false,userId:null,email:null}}
  function fmtTime(value){
    if(!value)return null;
    const d=new Date(value);if(Number.isNaN(d.getTime()))return null;
    try{return d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}catch(_){return null}
  }

  function deriveView(authSnapshot,syncState,uiState={}){
    const auth=asAuth(authSnapshot),state=asState(syncState),busy=uiState.busy||null,notice=uiState.notice||null;
    const signedIn=Boolean(auth.signedIn&&auth.userId);
    const bound=Boolean(state.userId);
    const conflict=state.conflict&&typeof state.conflict==='object'?state.conflict:null;
    const pending=state.pending&&typeof state.pending==='object'?state.pending:null;
    const deletionAvailable=Boolean(uiState.accountDeletionAvailable);
    let key='signed-out',title='クラウド同期はオフです',detail=UI_SPEC.signedOutCopy,tone='neutral',actions=['send-link'];

    if(!auth.initialized){key='initializing';title='アカウントを確認しています';detail='学習はそのまま続けられます。';actions=[]}
    else if(signedIn&&!bound){key='signed-in-disabled';title='クラウド同期はオフです';detail=`${auth.email||'ログイン済み'}。この端末の学習データはまだクラウドへ送信されません。`;actions=['enable','sign-out']}
    else if(signedIn&&bound&&conflict){
      key='conflict';tone='warning';title='同期するデータを確認してください';detail=UI_SPEC.conflictCopy;actions=['keep-local','use-cloud','sign-out'];
    }else if(signedIn&&bound&&pending){
      key=state.lastError?'pending-error':'pending';tone=state.lastError?'warning':'info';title=state.lastError?'同期を完了できていません':'同期待ちのデータがあります';
      detail=state.lastError?.retryable?'通信が戻ったら再試行できます。ローカルの学習データは保存済みです。':'この端末の保存は完了しています。クラウドへの反映を待っています。';
      actions=['sync-now','disable','sign-out'];
    }else if(signedIn&&bound){
      key='synced';tone='success';title='クラウド同期は有効です';
      const last=fmtTime(state.lastSuccessAt);detail=last?`最終同期: ${last}`:'この端末の学習データをクラウドへ同期します。';actions=['sync-now','disable','sign-out'];
    }

    if(signedIn&&deletionAvailable&&!actions.includes('delete-account'))actions.push('delete-account');
    if(busy){title='処理しています';detail=busy==='magic-link'?'ログインリンクを送信しています。':busy==='delete-account'?'アカウントとクラウドデータを削除しています。':'データを安全に確認しています。';actions=[]}
    return Object.freeze({key,title,detail,tone,actions:Object.freeze(actions),signedIn,email:auth.email||null,bound,conflict,pending,lastError:state.lastError||null,notice,deletionAvailable});
  }

  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}

  function createSyncSettingsUI(options){
    const o=options||{},auth=o.authBoundary,controller=o.controller;
    if(!auth||typeof auth.snapshot!=='function'||typeof auth.sendMagicLink!=='function'||typeof auth.signOutThisDevice!=='function')throw new TypeError('auth boundary required');
    if(!controller||typeof controller.state!=='function'||typeof controller.enableSync!=='function'||typeof controller.syncNow!=='function'||typeof controller.resolveConflict!=='function'||typeof controller.disableSync!=='function')throw new TypeError('sync controller required');
    const deleteAccountAction=typeof o.deleteAccount==='function'?o.deleteAccount:null;
    const doc=o.document||(typeof document!=='undefined'?document:null);
    const confirmFn=typeof o.confirm==='function'?o.confirm:(message=>typeof root.confirm==='function'?root.confirm(message):false);
    const onMessage=typeof o.onMessage==='function'?o.onMessage:()=>{};
    let node=o.mount||null,unsubscribe=null,disposed=false;
    let uiState={busy:null,notice:null};

    function state(){return controller.state()}
    function view(){return deriveView(auth.snapshot(),state(),{...uiState,accountDeletionAvailable:Boolean(deleteAccountAction)})}
    function setNotice(kind,text){uiState={...uiState,notice:{kind,text:String(text||'')}};onMessage(uiState.notice);render()}
    async function run(kind,fn){
      if(uiState.busy)return {ok:false,status:'busy'};
      uiState={...uiState,busy:kind,notice:null};render();
      let result;
      try{result=await fn()}catch(error){result={ok:false,status:'unexpected-error',error}}
      uiState={...uiState,busy:null};
      return result;
    }

    async function sendMagicLink(email){
      const result=await run('magic-link',()=>auth.sendMagicLink(email));
      if(result&&result.ok)setNotice('success',`${result.email} にログインリンクを送りました。`);
      else setNotice('error','ログインリンクを送れませんでした。通信状態とメールアドレスを確認してください。');
      return result;
    }
    async function enable(){
      const result=await run('enable',()=>controller.enableSync());
      if(result&&result.ok)setNotice('success','クラウド同期を有効にしました。');
      else if(result&&result.status==='first-link-conflict')setNotice('warning','この端末とクラウドの両方に学習データがあります。残すデータを選んでください。');
      else if(result&&result.retryable)setNotice('warning','ローカル保存は完了しています。通信が戻ったら同期を再試行できます。');
      else setNotice('error','クラウド同期を有効にできませんでした。');
      return result;
    }
    async function syncNow(){
      const result=await run('sync',()=>controller.syncNow());
      if(result&&result.ok)setNotice('success','クラウドへ同期しました。');
      else if(result&&result.conflict)setNotice('warning','別の端末の学習データが見つかりました。残すデータを選んでください。');
      else if(result&&result.retryable)setNotice('warning','この端末への保存は完了しています。通信が戻ったら再試行できます。');
      else setNotice('error','同期を完了できませんでした。ローカルの学習データはそのままです。');
      return result;
    }
    async function resolve(choice){
      const label=choice==='local'?'この端末の学習データ':'クラウドの学習データ';
      const prompt=choice==='local'
        ?'この端末の学習データを残してクラウドへ反映します。別端末側の状態は上書きされます。続けますか？'
        :'クラウドの学習データをこの端末へ取り込みます。現在の端末データは復旧点を作成してから置き換えます。続けますか？';
      if(!confirmFn(prompt))return {ok:false,status:'cancelled'};
      const result=await run('resolve',()=>controller.resolveConflict(choice));
      if(result&&result.ok)setNotice('success',`${label}を採用して同期しました。`);
      else setNotice('error','競合を解決できませんでした。現在の学習データは自動では上書きしていません。');
      return result;
    }
    function disable(){const result=controller.disableSync();setNotice('success','この端末のクラウド同期をオフにしました。学習データは削除されません。');return result}
    async function signOut(){
      const result=await run('sign-out',()=>auth.signOutThisDevice());
      if(result&&result.ok)setNotice('success','この端末からログアウトしました。');
      else setNotice('error','ログアウトできませんでした。');
      return result;
    }
    async function deleteAccount(){
      if(!deleteAccountAction)return {ok:false,status:'unsupported'};
      if(!confirmFn('FE QUESTのアカウントとクラウド上の学習データを削除します。この端末の学習データは残ります。続けますか？'))return {ok:false,status:'cancelled'};
      if(!confirmFn('この操作は取り消せません。本当にアカウントを削除しますか？'))return {ok:false,status:'cancelled'};
      const result=await run('delete-account',()=>deleteAccountAction());
      if(result&&result.ok){
        try{controller.disableSync()}catch(_e){}
        let signedOut={ok:false};
        try{signedOut=await auth.signOutThisDevice()}catch(_e){}
        setNotice('success','アカウントとクラウド上の学習データを削除しました。この端末の学習データは残っています。');
        return {...result,signedOut:Boolean(signedOut&&signedOut.ok)};
      }
      setNotice('error','アカウントを削除できませんでした。クラウドデータは自動では変更していません。');
      return result;
    }

    function ensureNode(){
      if(node||!doc)return node;
      node=doc.getElementById?.(UI_SPEC.cardId)||null;
      if(node)return node;
      const before=doc.getElementById?.(UI_SPEC.mountBeforeId)||null;
      if(!before||!before.parentNode||typeof doc.createElement!=='function')return null;
      node=doc.createElement('div');node.id=UI_SPEC.cardId;node.className='planner-card feq-cloud-sync-card';
      before.parentNode.insertBefore(node,before);return node;
    }

    function render(){
      if(disposed)return null;
      const mount=ensureNode(),v=view();if(!mount)return v;
      const notice=v.notice?`<div class="feq-sync-notice ${escapeHtml(v.notice.kind)}" role="status">${escapeHtml(v.notice.text)}</div>`:'';
      const signedOutForm=v.key==='signed-out'?`<div class="feq-sync-email"><label for="cloudSyncEmailV342">メールアドレス</label><input id="cloudSyncEmailV342" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com"><button type="button" data-sync-action="send-link">ログインリンクを送る</button></div>`:'';
      const buttons=[];
      if(v.actions.includes('enable'))buttons.push('<button type="button" class="planner-save" data-sync-action="enable">クラウド同期を有効にする</button>');
      if(v.actions.includes('sync-now'))buttons.push('<button type="button" class="planner-save" data-sync-action="sync-now">今すぐ同期</button>');
      if(v.actions.includes('keep-local'))buttons.push('<button type="button" class="planner-save" data-sync-action="keep-local">この端末のデータを使う</button>');
      if(v.actions.includes('use-cloud'))buttons.push('<button type="button" data-sync-action="use-cloud">クラウドのデータを使う</button>');
      if(v.actions.includes('disable'))buttons.push('<button type="button" data-sync-action="disable">この端末の同期をオフ</button>');
      if(v.actions.includes('sign-out'))buttons.push('<button type="button" data-sync-action="sign-out">ログアウト</button>');
      if(v.actions.includes('delete-account'))buttons.push('<button type="button" class="feq-sync-danger" data-sync-action="delete-account">アカウントを削除</button>');
      const deletionNote=v.signedIn&&v.deletionAvailable?`<div class="feq-sync-deletion-note">${escapeHtml(UI_SPEC.deletionCopy)}</div>`:'';
      mount.innerHTML=`<div class="feq-sync-head"><div><h2>アカウント・クラウド同期</h2><div class="sub">端末変更やブラウザデータ削除に備えて学習履歴を同期できます。</div></div><span class="feq-sync-status ${escapeHtml(v.tone)}">${escapeHtml(v.title)}</span></div><div class="feq-sync-detail">${escapeHtml(v.detail)}</div>${v.email?`<div class="feq-sync-account">${escapeHtml(v.email)}</div>`:''}${notice}${signedOutForm}<div class="feq-sync-actions">${buttons.join('')}</div>${deletionNote}<div class="feq-sync-local-note">クラウドに接続できないときも学習とローカル保存は続けられます。JSONエクスポートと復旧センターも引き続き利用できます。</div>`;
      mount.querySelector?.('[data-sync-action="send-link"]')?.addEventListener('click',()=>sendMagicLink(mount.querySelector?.('#cloudSyncEmailV342')?.value||''));
      mount.querySelector?.('[data-sync-action="enable"]')?.addEventListener('click',enable);
      mount.querySelector?.('[data-sync-action="sync-now"]')?.addEventListener('click',syncNow);
      mount.querySelector?.('[data-sync-action="keep-local"]')?.addEventListener('click',()=>resolve('local'));
      mount.querySelector?.('[data-sync-action="use-cloud"]')?.addEventListener('click',()=>resolve('remote'));
      mount.querySelector?.('[data-sync-action="disable"]')?.addEventListener('click',disable);
      mount.querySelector?.('[data-sync-action="sign-out"]')?.addEventListener('click',signOut);
      mount.querySelector?.('[data-sync-action="delete-account"]')?.addEventListener('click',deleteAccount);
      return v;
    }

    function start(){
      render();
      if(typeof auth.subscribe==='function')unsubscribe=auth.subscribe(()=>render());
      return view();
    }
    function dispose(){disposed=true;try{unsubscribe&&unsubscribe()}catch(_e){}unsubscribe=null;return true}

    return Object.freeze({start,render,view,sendMagicLink,enable,syncNow,resolve,disable,signOut,deleteAccount,dispose});
  }

  const api=Object.freeze({UI_SPEC,deriveView,createSyncSettingsUI});
  root.FEQUEST_SYNC_UI_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
