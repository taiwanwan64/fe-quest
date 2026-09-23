/* The original optional labs now use the same direct-manipulation dialog as the newer touch labs. */
(() => {
  'use strict';
  const scenarios = {
    binary:{icon:'🔢',task:'桁のスイッチを押して、2進数の値を変えてみましょう。',kind:'bits'},
    logic:{icon:'⚙️',task:'AとBのスイッチを切り替え、ANDとORを比較しましょう。',kind:'gates'},
    breakeven:{icon:'📈',task:'販売量を動かし、売上と費用が交わるところを探しましょう。',kind:'range'},
    sql:{icon:'🗃️',task:'WHEREの条件を選び、残る行を確認しましょう。',kind:'filter'},
    stackqueue:{icon:'📚',task:'同じデータをスタックとキューから取り出して、順序を比較しましょう。',kind:'stack'},
    binarysearch:{icon:'🔍',task:'探す値を選び、中央との比較を繰り返して見つけましょう。',kind:'search'},
    cpu:{icon:'🧠',task:'取出し・解読・実行を1ステップずつ進めましょう。',kind:'cycle'},
    transaction:{icon:'↩️',task:'30をAからBへ移す途中で、確定または障害による取消しを試しましょう。',kind:'transaction'},
    subnet:{icon:'🌐',task:'IPアドレスとマスクを変え、AND演算でネットワークアドレスを作りましょう。',kind:'subnet'},
    crypto:{icon:'🔐',task:'受信者の公開鍵で暗号化し、対応する秘密鍵で開けられるか試しましょう。',kind:'crypto'},
    cache:{icon:'⚡',task:'番地を読んで、キャッシュへの登録とHIT/MISSを確かめましょう。',kind:'cache'},
    tcpudp:{icon:'📡',task:'パケットが消えた場合にTCPとUDPで何が変わるか試しましょう。',kind:'transport'},
    signature:{icon:'✍️',task:'秘密鍵で署名し、本文の改変や違う公開鍵で検証結果が変わるか確かめましょう。',kind:'signature'},
    mutex:{icon:'🔒',task:'二つの処理を進め、ロックの有無で更新結果を比べましょう。',kind:'mutex'},
    automata:{icon:'🔁',task:'0または1を入力し、遷移規則に従って状態がどう変わるか確かめましょう。',kind:'automata'},
    memorychips:{icon:'💾',task:'RAM・ROM・フラッシュの書込みと電源断を試しましょう。',kind:'memorychips'},
    filesystem:{icon:'🗂️',task:'フォルダを移動し、現在位置からの相対パスを確かめましょう。',kind:'filesystem'},
    uiux:{icon:'👆',task:'ボタンの大きさとラベルを変え、操作しやすさを比べましょう。',kind:'uiux'},
    multimedia:{icon:'🖼️',task:'縦横の画素数と色のビット数を変え、無圧縮のデータ量を計算しましょう。',kind:'multimedia'},
    devmodel:{icon:'🛠️',task:'要求変更の頻度を変えて、進め方を比べましょう。',kind:'devmodel'},
    audit:{icon:'🔎',task:'誰が監査を担当するか選び、独立性を確かめましょう。',kind:'audit'},
    businessprocess:{icon:'🏢',task:'転記を自動化し、待ち時間がどのくらい減るか確かめましょう。',kind:'businessprocess'},
    procurement:{icon:'📋',task:'提案依頼書に必要な項目を入れ、比較可能な条件を整えましょう。',kind:'procurement'},
    swot:{icon:'🧭',task:'事例の内部・外部と有利・不利を選んで分類しましょう。',kind:'swot'},
    iot:{icon:'📶',task:'センサの温度を変えて、条件に応じた機器の動作を試しましょう。',kind:'iot'},
    finance:{icon:'💰',task:'売上と費用を変えて、売上総利益と営業利益がどう動くか確かめましょう。',kind:'finance'},
    os:{icon:'🖥️',task:'時間片を進め、CPUを割り当てる処理を観察しましょう。',kind:'scheduler'},
    reliability:{icon:'🔗',task:'装置の稼働率を変え、直列と並列の稼働率を比べましょう。',kind:'reliability'},
    backup:{icon:'🗄️',task:'復元する曜日と方式を選び、必要なバックアップを集めましょう。',kind:'backup'},
    development:{icon:'🧱',task:'開発工程を正しい順に選び、成果を次の工程へ渡しましょう。',kind:'development'},
    testing:{icon:'🧪',task:'確認したい対象から、適切なテスト段階を選びましょう。',kind:'testing'},
    criticalpath:{icon:'🗓️',task:'作業日数を変えて、どの経路が完了日を決めるか確認しましょう。',kind:'criticalpath'},
    sla:{icon:'🎧',task:'影響範囲と緊急度を変え、対応優先度を判定しましょう。',kind:'sla'},
    iprights:{icon:'©️',task:'守りたい対象に応じた権利を選びましょう。',kind:'iprights'}
  };

  const html = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const grid=document.getElementById('labLessonGrid');
  if(!grid || typeof LAB_LESSON_IDS==='undefined' || typeof LESSONS==='undefined')return;
  const missing=LAB_LESSON_IDS.filter(id=>!scenarios[id]);
  if(missing.length){console.error('Touch lab coverage missing:',missing);return;}
  let dialog=null,previousFocus=null,currentId=null,selected=0,bits=[0,0,0,0],inputs=[0,0],quantity=5,rows=[{name:'A',score:80},{name:'B',score:60},{name:'C',score:90}],items=['A','B','C'],target=7,quizChoice=null;
  let searchLow=0,searchHigh=6,searchDone=false,txStep=0,txFinish='',lastOctet=130,maskLength=24,automataState='A',automataHistory=[],availability=[90,90],pathDays=[3,4,2,3];
  let cacheLines=[],cacheRead='',cacheHit=false,signatureSigned=false,signatureTampered=false,signatureKey='sender',backupDay=3,backupMethod='incremental';
  let cryptoStep=0,cryptoKey='recipient',mutexStep=0,mutexLock=false,multimedia=[10,10,24],finance=[100,60,25],swotCase=0,swotInternal=null,swotFavorable=null;
  let cycleStep=0,transportProtocol='TCP',transportDrop=false,transportSent=false,powerOn=true,ramData=true,flashWritten=false,folder='/',uiBig=false,uiLabels=false,uiClicked=false,manualMinutes=8,automatic=false,temperature=24,schedulerTick=0;
  let changeFrequency=0,auditor='',requirements=[false,false,false],developmentStep=0,developmentFeedback='',testCase=0,testAnswer='',slaImpact=0,slaUrgency=0,rightsCase=0,rightsAnswer='';

  function cards(){
    grid.querySelectorAll('[data-original-lab]').forEach(el=>el.remove());
    for(const id of LAB_LESSON_IDS){
      const config=scenarios[id],button=document.createElement('button');
      button.type='button';button.className='ipa92-lab-card';button.dataset.originalLab=id;
      button.setAttribute('aria-haspopup','dialog');
      button.innerHTML=`<span class="ipa92-lab-icon">${html(config.icon)}</span><span class="ipa92-lab-copy"><small>図を触って理解する</small><b>${html(LESSONS[id].title)}</b><em>${html(config.task)}</em></span><span class="ipa92-lab-go">操作する →</span>`;
      button.addEventListener('click',()=>open(id));grid.appendChild(button);
    }
  }
  function visual(config){
    if(config.kind==='bits'){
      const n=bits.reduce((sum,bit,i)=>sum+bit*[8,4,2,1][i],0);
      return `<div class="touch-lab-bits">${bits.map((bit,i)=>`<button type="button" data-bit="${i}" aria-pressed="${!!bit}"><b>${[8,4,2,1][i]}</b><span>${bit}</span></button>`).join('')}</div><p class="touch-lab-result">2進数 ${bits.join('')} ＝ 10進数 <strong>${n}</strong></p><p>点灯した桁の重みだけを足します。</p>`;
    }
    if(config.kind==='gates'){
      const [a,b]=inputs;
      return `<div class="touch-lab-switches">${inputs.map((bit,i)=>`<button type="button" data-input="${i}" aria-pressed="${!!bit}">${i?'B':'A'}：${bit?'ON（1）':'OFF（0）'}</button>`).join('')}</div><div class="touch-lab-equations"><span>AND <strong>${a&b}</strong><small>両方が1のときだけ1</small></span><span>OR <strong>${a|b}</strong><small>どちらかが1なら1</small></span></div>`;
    }
    if(config.kind==='range'){
      const sales=quantity*20,cost=40+quantity*12,profit=sales-cost;
      return `<label class="touch-lab-slider">販売量：<strong data-count>${quantity}個</strong><input type="range" min="0" max="10" value="${quantity}" data-quantity></label><div class="touch-lab-bars"><div>売上 <i style="width:${sales/2}%"></i><b>${sales}万円</b></div><div>総費用 <i style="width:${cost/2}%"></i><b>${cost}万円</b></div></div><p class="touch-lab-result">利益 <span data-profit>${profit}</span>万円：<strong data-profit-state>${profit===0?'損益分岐点':profit>0?'黒字':'赤字'}</strong></p><p>売上＝20万円×個数、総費用＝固定費40万円＋12万円×個数です。</p>`;
    }
    if(config.kind==='filter'){
      const min=[0,70,85][selected];return `<div class="touch-lab-options">${['全件','得点70以上','得点85以上'].map((label,i)=>`<button type="button" data-select="${i}" aria-pressed="${selected===i}">${label}</button>`).join('')}</div><p class="touch-lab-query">SELECT * FROM 成績 WHERE 得点 &gt;= ${min}</p><div class="touch-lab-rows">${rows.map(row=>`<span class="${row.score>=min?'kept':'removed'}">${row.name}：${row.score}</span>`).join('')}</div><p>条件を満たす行だけが結果に残ります。</p>`;
    }
    if(config.kind==='stack'){
      return `<div class="touch-lab-options"><button type="button" data-select="0" aria-pressed="${selected===0}">スタック（後入れ先出し）</button><button type="button" data-select="1" aria-pressed="${selected===1}">キュー（先入れ先出し）</button></div><div class="touch-lab-flow">${items.map((item,i)=>`<span>${i+1}. ${item}</span>`).join('<i aria-hidden="true">→</i>')}</div><p class="touch-lab-result">次に取り出す：<strong>${items.length?(selected===0?items.at(-1):items[0]):'空'}</strong></p><button type="button" class="touch-lab-advance" data-advance ${items.length?'':'disabled'}>1個取り出す</button><button type="button" class="touch-lab-reset" data-reset>元に戻す</button>`;
    }
    if(config.kind==='search'){
      const numbers=[1,3,5,7,9,11,13],middle=Math.floor((searchLow+searchHigh)/2),value=numbers[middle];
      const explanation=searchDone?`${target} を発見しました。`:target===value?`中央 ${value} が探す値です。`:target<value?`中央 ${value} より小さいので、右側を捨てます。`:`中央 ${value} より大きいので、左側を捨てます。`;
      return `<label class="touch-lab-slider">探す値：<select data-target aria-label="探す値">${numbers.map(n=>`<option value="${n}" ${n===target?'selected':''}>${n}</option>`).join('')}</select></label><div class="touch-lab-rows touch-lab-search" aria-label="探索中の配列">${numbers.map((n,i)=>`<span class="${i<searchLow||i>searchHigh?'removed':i===middle?'middle':'kept'}">${n}</span>`).join('')}</div><p class="touch-lab-result" role="status">${searchDone?'探索完了':`現在の範囲：${numbers[searchLow]} ～ ${numbers[searchHigh]}`}　<strong>${explanation}</strong></p><button type="button" class="touch-lab-advance" data-search-step ${searchDone?'disabled':''}>${searchDone?'見つかりました':'中央と比較して絞る'}</button><button type="button" class="touch-lab-reset" data-search-reset>最初から</button>`;
    }
    if(config.kind==='transaction'){
      const a=txFinish==='rollback'?100:txStep>0?70:100,b=txFinish==='rollback'?100:txStep>1?130:100;
      const message=txFinish==='rollback'?'障害を再現：未確定の変更は両方取り消されました。':txFinish==='commit'?'確定：AからBへ30移り、合計は200のままです。':txStep===0?'まずAから30減額します。':txStep===1?'Aだけ減った途中状態です。Bへ30加算するか、障害を起こしてください。':'両方更新されました。COMMITで確定するか、障害を起こしてください。';
      return `<div class="touch-lab-ledger"><div>口座 A <strong>${a}</strong></div><div>口座 B <strong>${b}</strong></div><div>合計 <strong>${a+b}</strong></div></div><p class="touch-lab-result" role="status">${message}</p><div class="touch-lab-actions"><button type="button" data-tx="debit" ${txStep!==0||txFinish?'disabled':''}>① Aから30減額</button><button type="button" data-tx="credit" ${txStep!==1||txFinish?'disabled':''}>② Bへ30加算</button><button type="button" data-tx="commit" ${txStep!==2||txFinish?'disabled':''}>③ COMMIT</button><button type="button" data-tx="rollback" ${!txStep||txFinish?'disabled':''}>障害 → ROLLBACK</button><button type="button" data-tx="reset">最初から</button></div><p>途中の残高は未確定です。処理が失敗した場合は更新前の状態に戻します。</p>`;
    }
    if(config.kind==='subnet'){
      const prefixBits=maskLength-24,octetMask=prefixBits?(255 << (8-prefixBits)) & 255:0,network=lastOctet&octetMask,broadcast=network+(255-octetMask);
      const binary=n=>n.toString(2).padStart(8,'0');
      return `<div class="touch-lab-controls"><label>IPアドレスの末尾：<input data-octet type="number" min="0" max="255" inputmode="numeric" value="${lastOctet}"></label><label>マスク：<select data-mask>${[24,25,26,27,28].map(n=>`<option value="${n}" ${n===maskLength?'selected':''}>/${n}</option>`).join('')}</select></label></div><div class="touch-lab-bitmath" aria-label="末尾8ビットのAND演算"><span>IP</span><strong>${binary(lastOctet)}</strong><span>マスク</span><strong>${binary(octetMask)}</strong><span>AND</span><strong>${binary(network)}</strong></div><p class="touch-lab-result" role="status">ネットワークアドレス：<strong>192.168.1.${network}/${maskLength}</strong></p><p>ホスト部のビットを0にします。ブロードキャストアドレスは 192.168.1.${broadcast} です。</p>`;
    }
    if(config.kind==='automata'){
      return `<div class="touch-lab-automata" aria-label="状態遷移図"><span class="${automataState==='A'?'active':''}">状態 A</span><span>0：そのまま<br>1：切り替える</span><span class="${automataState==='B'?'active':''}">状態 B</span></div><p class="touch-lab-result" role="status">現在の状態：<strong>${automataState}</strong></p><div class="touch-lab-actions"><button type="button" data-automata="0">0 を入力</button><button type="button" data-automata="1">1 を入力</button><button type="button" data-automata="reset">初期状態に戻す</button></div><p>入力列：${automataHistory.length?automataHistory.join(' → '):'まだ入力していません'}</p>`;
    }
    if(config.kind==='reliability'){
      const [a,b]=availability.map(n=>n/100),series=a*b,parallel=1-(1-a)*(1-b);
      return `<div class="touch-lab-controls">${availability.map((n,i)=>`<label>装置 ${i?'B':'A'} の稼働率：<strong>${n}%</strong><input data-availability="${i}" type="range" min="0" max="100" step="5" value="${n}"></label>`).join('')}</div><div class="touch-lab-compare"><div><b>直列：A → B</b><strong>${(series*100).toFixed(1)}%</strong><small>両方動く：${a.toFixed(2)} × ${b.toFixed(2)}</small></div><div><b>並列：A ∥ B</b><strong>${(parallel*100).toFixed(1)}%</strong><small>少なくとも片方：1 − ${(1-a).toFixed(2)} × ${(1-b).toFixed(2)}</small></div></div>`;
    }
    if(config.kind==='criticalpath'){
      const a=pathDays[0]+pathDays[1],b=pathDays[2]+pathDays[3],longest=Math.max(a,b);
      return `<div class="touch-lab-controls touch-lab-duration">${pathDays.map((day,i)=>`<label>作業 ${'ACBD'[i]}：<strong>${day}日</strong><input data-path-day="${i}" type="range" min="1" max="10" value="${day}"></label>`).join('')}</div><div class="touch-lab-compare"><div class="${a===longest?'active':''}"><b>経路 A → C</b><strong>${a}日</strong><small>余裕 ${longest-a}日</small></div><div class="${b===longest?'active':''}"><b>経路 B → D</b><strong>${b}日</strong><small>余裕 ${longest-b}日</small></div></div><p class="touch-lab-result" role="status">完了まで <strong>${longest}日</strong>。クリティカルパス：${a===b?'両方の経路':a>b?'A → C':'B → D'}</p>`;
    }
    if(config.kind==='cache'){
      return `<div class="touch-lab-compare"><div><b>主記憶</b><strong>A・B・C</strong><small>すべての番地がある</small></div><div><b>キャッシュ（2枠）</b><strong>${cacheLines.length?cacheLines.join('・'):'空'}</strong><small>新しく読んだ番地を保存</small></div></div><div class="touch-lab-actions">${['A','B','C'].map(address=>`<button type="button" data-cache="${address}">番地 ${address} を読む</button>`).join('')}<button type="button" data-cache="reset">空に戻す</button></div><p class="touch-lab-result" role="status">${cacheRead?`${cacheRead}：${cacheHit?'HIT（キャッシュから取得）':'MISS（主記憶から取得して登録）'}`:'番地を選んでください。'}</p><p>2枠が埋まると、最初に入れた番地を入れ替えます。もう一度同じ番地を読んでHITを確認してください。</p>`;
    }
    if(config.kind==='signature'){
      const valid=signatureSigned&&!signatureTampered&&signatureKey==='sender';
      return `<div class="touch-lab-flow"><span>本文「合格」</span><i aria-hidden="true">→</i><span>ハッシュ値</span><i aria-hidden="true">→</i><strong>送信者の秘密鍵で署名</strong></div><div class="touch-lab-actions"><button type="button" data-signature="sign" ${signatureSigned?'disabled':''}>署名を作成</button><button type="button" data-signature="tamper" ${!signatureSigned?'disabled':''}>本文を改変：${signatureTampered?'あり':'なし'}</button><button type="button" data-signature="key" ${!signatureSigned?'disabled':''}>検証鍵：${signatureKey==='sender'?'送信者':'別人'}の公開鍵</button><button type="button" data-signature="reset">最初から</button></div><p class="touch-lab-result" role="status">${!signatureSigned?'まず署名を作成します。':valid?'検証成功：署名から確認した値と、受信した本文のハッシュ値が一致。':'検証失敗：本文の改変または公開鍵が一致しません。'}</p><p>署名には送信者の秘密鍵、検証には対応する送信者の公開鍵を使います。</p>`;
    }
    if(config.kind==='backup'){
      const days=['日','月','火','水','木','金','土'],incremental=days.slice(1,backupDay+1).map(day=>`${day}曜増分`),files=backupMethod==='incremental'?['日曜フル',...incremental]:['日曜フル',`${days[backupDay]}曜差分`];
      return `<div class="touch-lab-controls"><label>復元したい曜日<select data-backup-day>${days.slice(1).map((day,i)=>`<option value="${i+1}" ${backupDay===i+1?'selected':''}>${day}曜</option>`).join('')}</select></label><label>方式<select data-backup-method><option value="incremental" ${backupMethod==='incremental'?'selected':''}>増分</option><option value="differential" ${backupMethod==='differential'?'selected':''}>差分</option></select></label></div><div class="touch-lab-flow touch-lab-backup-files">${files.map((file,i)=>`${i?'<i aria-hidden="true">＋</i>':''}<span>${file}</span>`).join('')}</div><p class="touch-lab-result" role="status">必要なバックアップ：<strong>${files.length}個</strong></p><p>${backupMethod==='incremental'?'増分は直前のバックアップからの変更を保存します。途中の増分を抜かすと復元できません。':'差分は最後のフルバックアップからの変更を毎回保存します。最新の差分だけを使います。'}</p>`;
    }
    if(config.kind==='crypto'){
      return `<div class="touch-lab-flow"><span>送信者</span><i aria-hidden="true">→</i><strong>${cryptoStep?'暗号文':'平文'}</strong><i aria-hidden="true">→</i><span>受信者</span></div><div class="touch-lab-actions"><button type="button" data-crypto="encrypt" ${cryptoStep?'disabled':''}>受信者の公開鍵で暗号化</button><button type="button" data-crypto="decrypt" ${cryptoStep!==1?'disabled':''}>選んだ鍵で復号</button><button type="button" data-crypto="reset">最初から</button></div><div class="touch-lab-controls"><label>復号に使う鍵<select data-crypto-key><option value="recipient" ${cryptoKey==='recipient'?'selected':''}>受信者の秘密鍵</option><option value="sender" ${cryptoKey==='sender'?'selected':''}>送信者の秘密鍵</option><option value="public" ${cryptoKey==='public'?'selected':''}>受信者の公開鍵</option></select></label></div><p class="touch-lab-result" role="status">${cryptoStep===0?'まず受信者の公開鍵で暗号化してください。':cryptoStep===1?'暗号文が届きました。復号に使う鍵を選んでください。':cryptoStep===2?'復号成功：元の文を読めます。':'復号できません。対応する受信者の秘密鍵が必要です。'}</p>`;
    }
    if(config.kind==='mutex'){
      const value=mutexStep===0?0:mutexStep===1?0:mutexStep===2?1:mutexLock?2:1;
      const caption=mutexLock?['初期値 0。二つの処理がそれぞれ1増やします。','処理Aがロックを取り、値0を読みました。Bは待機します。','処理Aが1を書き込み、ロックを解放しました。','処理Bが新しい値1を読み、2を書き込みました。'][mutexStep]:['初期値 0。二つの処理がそれぞれ1増やします。','処理AとBが古い値0を読みました。','処理Aが1を書き込みました。','処理Bが古い値0を基に1を上書きしました。'][mutexStep];
      return `<div class="touch-lab-options"><button type="button" data-mutex-mode="0" aria-pressed="${!mutexLock}">ロックなし</button><button type="button" data-mutex-mode="1" aria-pressed="${mutexLock}">ロックあり</button></div><div class="touch-lab-ledger"><div>処理A <strong>${mutexStep>=2?'完了':mutexStep>=1?'読取済み':'待機'}</strong></div><div>処理B <strong>${mutexStep===3?'完了':mutexStep>=1&&!mutexLock?'読取済み':'待機'}</strong></div><div>共有する値 <strong>${value}</strong></div></div><p class="touch-lab-result" role="status">${caption} ${mutexStep===3?(mutexLock?'ロックで順に更新したので2です。':'更新が1回分失われました。'):''}</p><button type="button" class="touch-lab-advance" data-mutex-next ${mutexStep===3?'disabled':''}>次の操作へ</button><button type="button" class="touch-lab-reset" data-mutex-reset>最初から</button>`;
    }
    if(config.kind==='multimedia'){
      const [width,height,depth]=multimedia,bytes=width*height*depth/8;
      return `<div class="touch-lab-controls">${['横の画素数','縦の画素数','1画素のビット数'].map((label,i)=>`<label>${label}<select data-multimedia="${i}">${(i===2?[8,16,24,32]:[10,20,50,100]).map(n=>`<option value="${n}" ${multimedia[i]===n?'selected':''}>${n}${i===2?'ビット':'画素'}</option>`).join('')}</select></label>`).join('')}</div><div class="touch-lab-flow"><span>${width} × ${height} ＝ ${width*height}画素</span><i aria-hidden="true">×</i><span>${depth}ビット</span><i aria-hidden="true">÷</i><span>8ビット/バイト</span></div><p class="touch-lab-result" role="status">無圧縮の画素データ量：<strong>${bytes.toLocaleString('ja-JP')}バイト</strong></p><p>ファイルのヘッダーや圧縮後の大きさは含めません。</p>`;
    }
    if(config.kind==='finance'){
      const [sales,cost,expenses]=finance;
      return `<div class="touch-lab-controls">${['売上高','売上原価','販管費'].map((label,i)=>`<label>${label}（万円）<input data-finance="${i}" type="range" min="0" max="150" step="5" value="${finance[i]}"><strong>${finance[i]}万円</strong></label>`).join('')}</div><div class="touch-lab-flow"><span>売上高 ${sales}</span><i aria-hidden="true">−</i><span>売上原価 ${cost}</span><i aria-hidden="true">−</i><span>販管費 ${expenses}</span></div><div class="touch-lab-compare"><div><b>売上総利益</b><strong>${sales-cost}万円</strong><small>売上高 − 売上原価</small></div><div><b>営業利益</b><strong>${sales-cost-expenses}万円</strong><small>売上総利益 − 販管費</small></div></div>`;
    }
    if(config.kind==='swot'){
      const examples=['自社に熟練した技術者がいる','自社の設備が古い','市場に新しい需要が生まれた','競合が市場へ参入した'];
      const actual=[['内部','有利','強み S'],['内部','不利','弱み W'],['外部','有利','機会 O'],['外部','不利','脅威 T']][swotCase];
      const answer=swotInternal===null||swotFavorable===null?'二つの軸を選んでください。':`${swotInternal=== (actual[0]==='内部')&&swotFavorable===(actual[1]==='有利')?'正解':'もう一度確認'}：${actual[2]}（${actual[0]} × ${actual[1]}）`;
      return `<label class="touch-lab-slider">分類する事例<select data-swot-case>${examples.map((item,i)=>`<option value="${i}" ${i===swotCase?'selected':''}>${html(item)}</option>`).join('')}</select></label><div class="touch-lab-options">${[['内部',true,'internal'],['外部',false,'internal'],['有利',true,'favorable'],['不利',false,'favorable']].map(([label,value,axis])=>`<button type="button" data-swot-axis="${axis}" data-swot-value="${value}" aria-pressed="${axis==='internal'?swotInternal===value:swotFavorable===value}">${label}</button>`).join('')}</div><p class="touch-lab-result" role="status">${answer}</p><p>内部か外部か、有利か不利かで分類します。事例を変えて4種類を試してください。</p>`;
    }
    if(config.kind==='cycle'){
      const stages=['取出し','解読','実行'],messages=['主記憶から命令を取り出します。','命令レジスタの内容を解釈します。','演算装置などが処理を実行します。'];
      return `<div class="touch-lab-track">${stages.map((name,i)=>`<span class="${i===cycleStep%3?'active':''}"><b>${i+1}</b>${name}</span>`).join('')}</div><p class="touch-lab-result" role="status">${messages[cycleStep%3]}</p><div class="touch-lab-actions"><button type="button" data-cycle>次の段階へ →</button><button type="button" data-cycle-reset>最初から</button></div><p>命令の実行が終わると、次の命令の取出しに戻ります。${cycleStep>=3?` ${Math.floor(cycleStep/3)+1}回目の命令サイクルです。`:''}</p>`;
    }
    if(config.kind==='transport'){
      let message='送信を押して違いを比べてください。';
      if(transportSent)message=transportDrop?(transportProtocol==='TCP'?'パケット消失を検出して再送します。到達順序も管理します。':'パケットは届きません。UDP自体は再送や到達確認をしません。'):(transportProtocol==='TCP'?'到達確認を受け取って次へ進みます。':'到達しました。UDP自体は到達確認を行いません。');
      return `<div class="touch-lab-options"><button type="button" data-transport-protocol="TCP" aria-pressed="${transportProtocol==='TCP'}">TCP</button><button type="button" data-transport-protocol="UDP" aria-pressed="${transportProtocol==='UDP'}">UDP</button></div><div class="touch-lab-flow"><span>送信者</span><i aria-hidden="true">→</i><strong>${transportDrop?'途中で消失':'パケット'}</strong><i aria-hidden="true">→</i><span>受信者</span></div><div class="touch-lab-actions"><button type="button" data-transport-drop aria-pressed="${transportDrop}">途中でパケットを失う：${transportDrop?'あり':'なし'}</button><button type="button" data-transport-send>送信する</button></div><p class="touch-lab-result" role="status">${message}</p>`;
    }
    if(config.kind==='memorychips'){
      return `<div class="touch-lab-compare touch-lab-memories"><div><b>RAM</b><strong>${powerOn?(ramData?'作業データあり':'空'):'消失'}</strong><small>電源が必要な揮発性メモリ</small></div><div><b>ROM</b><strong>起動情報あり</strong><small>読み出し中心の不揮発性メモリ</small></div><div><b>フラッシュ</b><strong>${flashWritten?'保存済み':'空'}</strong><small>書き換え可能な不揮発性メモリ</small></div></div><div class="touch-lab-actions"><button type="button" data-power>${powerOn?'電源を切る':'電源を入れる'}</button><button type="button" data-ram ${!powerOn?'disabled':''}>RAMへ書き込む</button><button type="button" data-flash ${!powerOn?'disabled':''}>フラッシュへ保存</button><button type="button" data-memory-reset>初期状態へ</button></div><p class="touch-lab-result" role="status">${powerOn?'電源を切るとRAMの作業データは消えます。':'電源を切ってもROMとフラッシュの情報は残ります。'}</p>`;
    }
    if(config.kind==='filesystem'){
      const dirs=['/','/home/','/home/user/'],current=dirs.indexOf(folder);
      return `<div class="touch-lab-flow"><span class="${current===0?'active':''}">/</span><i aria-hidden="true">→</i><span class="${current===1?'active':''}">home/</span><i aria-hidden="true">→</i><span class="${current===2?'active':''}">user/</span><i aria-hidden="true">→</i><strong>memo.txt</strong></div><div class="touch-lab-actions"><button type="button" data-folder="home" ${current===2?'disabled':''}>${current===0?'home':'user'}へ進む</button><button type="button" data-folder="back" ${current===0?'disabled':''}>.. で親へ</button><button type="button" data-folder="root">/ へ戻る</button></div><p class="touch-lab-result" role="status">現在位置：<strong>${folder}</strong>　memo.txtへの相対パス：<strong>${['home/user/memo.txt','user/memo.txt','memo.txt'][current]}</strong></p><p>絶対パスは常に /home/user/memo.txt です。相対パスは現在位置で変わります。</p>`;
    }
    if(config.kind==='uiux'){
      return `<div class="touch-lab-actions"><button type="button" data-ui="size" aria-pressed="${uiBig}">タッチ領域：${uiBig?'大きい':'小さい'}</button><button type="button" data-ui="label" aria-pressed="${uiLabels}">表示：${uiLabels?'内容が分かる':'記号のみ'}</button></div><div class="touch-lab-preview"><button type="button" class="${uiBig?'large':''}" data-ui-preview aria-label="${uiLabels?'保存する':'記号だけのボタン'}">${uiLabels?'保存する':'✎'}</button></div><p class="touch-lab-result" role="status">${uiClicked?'サンプルのボタンを押しました。 ':''}${uiBig&&uiLabels?'押しやすく、何をする操作か分かります。':uiBig?'押しやすくなりました。次は操作名を分かるようにしましょう。':uiLabels?'操作名は分かります。押す範囲も広げてみましょう。':'何をするボタンか分かりにくく、押す範囲も小さい状態です。'}</p>`;
    }
    if(config.kind==='businessprocess'){
      const time=3+(automatic?0:manualMinutes)+5;
      return `<div class="touch-lab-flow"><span>申請入力 3分</span><i aria-hidden="true">→</i><span>${automatic?'自動共有 0分':`紙から転記 ${manualMinutes}分`}</span><i aria-hidden="true">→</i><strong>承認 5分</strong></div><div class="touch-lab-controls"><label>転記の所要時間：<strong>${manualMinutes}分</strong><input data-manual-minutes type="range" min="1" max="15" value="${manualMinutes}"></label></div><div class="touch-lab-actions"><button type="button" data-auto aria-pressed="${automatic}">${automatic?'自動化を解除':'転記を自動化'}</button></div><p class="touch-lab-result" role="status">全体 <strong>${time}分</strong>${automatic?`（従来より${manualMinutes}分短縮）`:''}</p><p>この例では転記だけを自動化します。承認など残りの工程の時間は変わりません。</p>`;
    }
    if(config.kind==='iot'){
      return `<label class="touch-lab-slider">センサが測った温度：<strong>${temperature}℃</strong><input data-temperature type="range" min="10" max="40" value="${temperature}"></label><div class="touch-lab-flow"><span>温度センサ</span><i aria-hidden="true">→</i><span>ネットワーク</span><i aria-hidden="true">→</i><span>30℃以上か判定</span><i aria-hidden="true">→</i><strong>送風機 ${temperature>=30?'ON':'OFF'}</strong></div><p class="touch-lab-result" role="status">${temperature>=30?'条件を満たしたので機器が動きます。':'条件未満なので機器は停止します。'}</p>`;
    }
    if(config.kind==='scheduler'){
      const active=schedulerTick%3;
      return `<div class="touch-lab-compare touch-lab-processes">${[0,1,2].map(i=>`<div class="${i===active?'active':''}"><b>処理 P${i+1}</b><strong>${i===active?'実行中':'待機'}</strong></div>`).join('')}</div><p class="touch-lab-result" role="status">時間片 ${schedulerTick+1}：CPUはP${active+1}に割り当てられています。</p><div class="touch-lab-actions"><button type="button" data-scheduler>1時間片進める</button><button type="button" data-scheduler-reset>最初から</button></div><p>一つのCPUを短い時間ずつ順番に割り当てる例です。</p>`;
    }
    if(config.kind==='devmodel'){
      const frequent=changeFrequency>=2;
      return `<label class="touch-lab-slider">要求変更の頻度：<strong>${['ほぼない','ときどき','多い','とても多い'][changeFrequency]}</strong><input data-change-frequency type="range" min="0" max="3" value="${changeFrequency}"></label><div class="touch-lab-compare"><div class="${frequent?'':'active'}"><b>ウォーターフォールの例</b><strong>要件 → 設計 → 実装 → テスト</strong><small>工程ごとに決めた内容を引き継ぐ</small></div><div class="${frequent?'active':''}"><b>アジャイルの例</b><strong>小さく作る → 評価 → 改善</strong><small>短い単位でフィードバックを反映</small></div></div><p class="touch-lab-result" role="status">${frequent?'この例では短い反復で変更を取り込む進め方が合います。':'この例では要求を初めに整理して工程を進められます。'}</p><p>実際の選択では規模、契約、品質要件なども考慮します。</p>`;
    }
    if(config.kind==='audit'){
      const independent=auditor==='auditor';
      return `<div class="touch-lab-flow"><span>業務担当者：手続を実施</span><i aria-hidden="true">→</i><span>記録・証拠</span><i aria-hidden="true">→</i><strong>監査人：評価・報告</strong></div><p>業務担当部署の処理について、誰が監査・評価しますか？</p><div class="touch-lab-options">${[['self','業務担当者本人'],['boss','同じ部署の上司'],['auditor','独立した監査担当']].map(([id,label])=>`<button type="button" data-auditor="${id}" aria-pressed="${auditor===id}">${label}</button>`).join('')}</div><p class="touch-lab-result" role="status">${auditor?(independent?'独立した立場から証拠を確認し、評価できます。':'自分たちの業務を自分たちで監査すると、客観性を確保しにくくなります。'):'監査担当を選んでください。'}</p>`;
    }
    if(config.kind==='procurement'){
      const names=['目的・課題','必要な機能・性能','評価条件'],count=requirements.filter(Boolean).length;
      return `<p>提案依頼書（RFP）に入れる情報を選んでください。</p><div class="touch-lab-options">${names.map((name,i)=>`<button type="button" data-requirement="${i}" aria-pressed="${requirements[i]}">${requirements[i]?'✓ ':''}${name}</button>`).join('')}</div><div class="touch-lab-flow"><span>発注側の依頼</span><i aria-hidden="true">→</i><strong>提供者の提案</strong><i aria-hidden="true">→</i><span>基準に沿った比較</span></div><p class="touch-lab-result" role="status">${count===3?'目的、要件、評価条件がそろいました。提案を比較できます。':`記入済み ${count}/3。${names.filter((_,i)=>!requirements[i]).join('・')}を追加してください。`}</p>`;
    }
    if(config.kind==='development'){
      const names=['要件定義','設計','実装','テスト・移行'];
      return `<div class="touch-lab-track">${names.map((name,i)=>`<span class="${i<developmentStep?'active':''}"><b>${i+1}</b>${name}</span>`).join('')}</div><p>次の工程を選んでください。</p><div class="touch-lab-options">${names.map((name,i)=>`<button type="button" data-development="${i}" ${i<developmentStep?'disabled':''}>${name}</button>`).join('')}</div><p class="touch-lab-result" role="status">${developmentFeedback||'何を作るか決める工程から始めましょう。'} ${developmentStep===4?'完成した内容を利用へ移します。':''}</p><button type="button" class="touch-lab-reset" data-development-reset>最初から</button>`;
    }
    if(config.kind==='testing'){
      const cases=['関数一つの計算が正しいか','二つの部品間でデータが渡るか','システム全体が仕様を満たすか','利用者が業務で使えるか'],names=['単体テスト','結合テスト','システムテスト','受入れテスト'];
      return `<label class="touch-lab-slider">確認したい対象<select data-test-case>${cases.map((label,i)=>`<option value="${i}" ${i===testCase?'selected':''}>${label}</option>`).join('')}</select></label><div class="touch-lab-options">${names.map((name,i)=>`<button type="button" data-test-answer="${i}" aria-pressed="${testAnswer===String(i)}">${name}</button>`).join('')}</div><p class="touch-lab-result" role="status">${testAnswer===''?'どの段階で確認しますか？':`${Number(testAnswer)===testCase?'正解':'確認する対象が違います'}：${names[testCase]}。${cases[testCase]}`}</p>`;
    }
    if(config.kind==='sla'){
      const priority=slaImpact&&slaUrgency?'高':slaImpact||slaUrgency?'中':'低';
      return `<div class="touch-lab-options"><button type="button" data-sla="impact" aria-pressed="${!!slaImpact}">影響範囲：${slaImpact?'全社':'一人'}</button><button type="button" data-sla="urgency" aria-pressed="${!!slaUrgency}">緊急度：${slaUrgency?'今すぐ':'後でもよい'}</button></div><div class="touch-lab-flow"><span>影響範囲</span><i aria-hidden="true">＋</i><span>緊急度</span><i aria-hidden="true">→</i><strong>優先度 ${priority}</strong></div><p class="touch-lab-result" role="status">この例の対応優先度：<strong>${priority}</strong></p><p>SLAは提供者と利用者が合意する可用性や応答時間などのサービス水準です。個別の優先度だけを指す言葉ではありません。</p>`;
    }
    if(config.kind==='iprights'){
      const cases=['新しい技術的発明','自作の文章やプログラムの表現','商品名やロゴ','物品などの外観デザイン'],names=['特許権','著作権','商標権','意匠権'];
      return `<label class="touch-lab-slider">守りたい対象<select data-rights-case>${cases.map((label,i)=>`<option value="${i}" ${i===rightsCase?'selected':''}>${label}</option>`).join('')}</select></label><div class="touch-lab-options">${names.map((name,i)=>`<button type="button" data-rights-answer="${i}" aria-pressed="${rightsAnswer===String(i)}">${name}</button>`).join('')}</div><p class="touch-lab-result" role="status">${rightsAnswer===''?'どの権利と対応しますか？':`${Number(rightsAnswer)===rightsCase?'正解':'もう一度確認'}：${names[rightsCase]}は${cases[rightsCase]}に対応します。`}</p><p>この例は試験用の基本的な対応関係です。権利の成立要件はそれぞれ異なります。</p>`;
    }
    throw new Error(`Unknown touch lab kind: ${config.kind}`);
  }
  function quiz(id){
    const item=LESSONS[id].pages.find(page=>page.quiz)?.quiz;
    if(!item)return '';
    return `<section class="touch-lab-check"><h3>確かめる</h3><p>${html(LESSONS[id].pages.find(page=>page.quiz).copy)}</p><div class="touch-lab-answers">${item.options.map((option,i)=>`<button type="button" data-answer="${i}" aria-pressed="${quizChoice===i}">${html(option)}</button>`).join('')}</div><div class="touch-lab-feedback" role="status" aria-live="polite"></div></section>`;
  }
  function render(){
    const config=scenarios[currentId];if(!config||!dialog)return;
    // Safari may leave the previous <select> focused after a touch on a button.
    // Restoring focus to a newly rendered select would reopen its native picker.
    const focused=document.activeElement,focusKey=focused?.tagName==='BUTTON'&&dialog.contains(focused)
      ?focused.getAttributeNames().find(name=>name.startsWith('data-') && name!=='data-count'):null;
    const focusValue=focusKey&&focused.getAttribute(focusKey);
    dialog.querySelector('.touch-lab-title').textContent=LESSONS[currentId].title;
    dialog.querySelector('.touch-lab-task').textContent=config.task;
    dialog.querySelector('.touch-lab-activity').innerHTML=visual(config);
    dialog.querySelector('.touch-lab-check-host').innerHTML=quiz(currentId);
    if(focusKey){
      const next=[...dialog.querySelectorAll(`[${focusKey}]`)].find(node=>node.getAttribute(focusKey)===focusValue && !node.disabled);
      (next||dialog.querySelector('.touch-lab-close')).focus({preventScroll:true});
    }
  }
  // Keep the native form control mounted while updating its results. Replacing and
  // focusing a <select> during its change event reopens the iOS picker.
  function refreshAfterFieldChange(){
    const activity=dialog.querySelector('.touch-lab-activity');
    const preview=document.createElement('div');
    preview.innerHTML=visual(scenarios[currentId]);
    const previous=[...activity.children],next=[...preview.children];
    if(previous.length!==next.length)throw new Error('Touch lab field layout changed unexpectedly');
    previous.forEach((element,i)=>{
      if(element.matches('select,input')||element.querySelector('select,input'))return;
      element.replaceWith(next[i]);
    });
  }
  function open(id){
    if(!scenarios[id])return;
    previousFocus=document.activeElement;currentId=id;selected=0;bits=[0,0,0,0];inputs=[0,0];quantity=5;items=['A','B','C'];target=7;quizChoice=null;
    searchLow=0;searchHigh=6;searchDone=false;txStep=0;txFinish='';lastOctet=130;maskLength=24;automataState='A';automataHistory=[];availability=[90,90];pathDays=[3,4,2,3];
    cacheLines=[];cacheRead='';cacheHit=false;signatureSigned=false;signatureTampered=false;signatureKey='sender';backupDay=3;backupMethod='incremental';
    cryptoStep=0;cryptoKey='recipient';mutexStep=0;mutexLock=false;multimedia=[10,10,24];finance=[100,60,25];swotCase=0;swotInternal=null;swotFavorable=null;
    cycleStep=0;transportProtocol='TCP';transportDrop=false;transportSent=false;powerOn=true;ramData=true;flashWritten=false;folder='/';uiBig=false;uiLabels=false;uiClicked=false;manualMinutes=8;automatic=false;temperature=24;schedulerTick=0;
    changeFrequency=0;auditor='';requirements=[false,false,false];developmentStep=0;developmentFeedback='';testCase=0;testAnswer='';slaImpact=0;slaUrgency=0;rightsCase=0;rightsAnswer='';
    if(!dialog){
      dialog=document.createElement('div');dialog.className='touch-lab-backdrop';dialog.hidden=true;
      dialog.innerHTML='<section class="touch-lab-dialog" role="dialog" aria-modal="true" aria-labelledby="touchLabTitle"><div class="touch-lab-head"><div><small>図を触って理解する</small><h2 id="touchLabTitle" class="touch-lab-title"></h2></div><button type="button" class="touch-lab-close" aria-label="ラボを閉じる">×</button></div><p class="touch-lab-task"></p><div class="touch-lab-activity"></div><div class="touch-lab-check-host"></div></section>';
      document.body.appendChild(dialog);
      dialog.addEventListener('click',event=>{
        if(event.target===dialog||event.target.closest('.touch-lab-close')){close();return;}
        const button=event.target.closest('button');if(!button)return;
        if(button.dataset.bit!==undefined){const i=Number(button.dataset.bit);bits[i]^=1;render();}
        else if(button.dataset.input!==undefined){const i=Number(button.dataset.input);inputs[i]^=1;render();}
        else if(button.dataset.select!==undefined){selected=Number(button.dataset.select);render();}
        else if(button.dataset.advance!==undefined){if(items.length){if(selected===0)items.pop();else items.shift();}render();}
        else if(button.dataset.reset!==undefined){items=['A','B','C'];render();}
        else if(button.dataset.searchStep!==undefined){
          if(searchDone)return;
          const mid=Math.floor((searchLow+searchHigh)/2),value=[1,3,5,7,9,11,13][mid];
          if(target===value)searchDone=true;
          else if(target<value)searchHigh=mid-1;
          else searchLow=mid+1;
          render();
        }
        else if(button.dataset.searchReset!==undefined){searchLow=0;searchHigh=6;searchDone=false;render();}
        else if(button.dataset.tx!==undefined){
          const action=button.dataset.tx;
          if(action==='reset'){txStep=0;txFinish='';}
          else if(!txFinish){
            if(action==='debit'&&txStep===0)txStep=1;
            else if(action==='credit'&&txStep===1)txStep=2;
            else if(action==='commit'&&txStep===2)txFinish='commit';
            else if(action==='rollback'&&txStep>0)txFinish='rollback';
          }
          render();
        }
        else if(button.dataset.automata!==undefined){
          if(button.dataset.automata==='reset'){automataState='A';automataHistory=[];}
          else {const symbol=button.dataset.automata;automataHistory.push(symbol);if(symbol==='1')automataState=automataState==='A'?'B':'A';}
          render();
        }
        else if(button.dataset.cache!==undefined){
          const address=button.dataset.cache;
          if(address==='reset'){cacheLines=[];cacheRead='';cacheHit=false;}
          else{
            cacheHit=cacheLines.includes(address);cacheRead=address;
            if(!cacheHit){if(cacheLines.length===2)cacheLines.shift();cacheLines.push(address);}
          }
          render();
        }
        else if(button.dataset.signature!==undefined){
          const action=button.dataset.signature;
          if(action==='reset'){signatureSigned=false;signatureTampered=false;signatureKey='sender';}
          else if(action==='sign')signatureSigned=true;
          else if(signatureSigned&&action==='tamper')signatureTampered=!signatureTampered;
          else if(signatureSigned&&action==='key')signatureKey=signatureKey==='sender'?'other':'sender';
          render();
        }
        else if(button.dataset.crypto!==undefined){
          if(button.dataset.crypto==='reset'){cryptoStep=0;cryptoKey='recipient';}
          else if(button.dataset.crypto==='encrypt'&&cryptoStep===0)cryptoStep=1;
          else if(button.dataset.crypto==='decrypt'&&cryptoStep===1)cryptoStep=cryptoKey==='recipient'?2:3;
          render();
        }
        else if(button.dataset.mutexMode!==undefined){mutexLock=button.dataset.mutexMode==='1';mutexStep=0;render();}
        else if(button.dataset.mutexNext!==undefined){mutexStep=Math.min(3,mutexStep+1);render();}
        else if(button.dataset.mutexReset!==undefined){mutexStep=0;render();}
        else if(button.dataset.swotAxis!==undefined){
          if(button.dataset.swotAxis==='internal')swotInternal=button.dataset.swotValue==='true';
          else swotFavorable=button.dataset.swotValue==='true';
          render();
        }
        else if(button.dataset.cycle!==undefined){cycleStep++;render();}
        else if(button.dataset.cycleReset!==undefined){cycleStep=0;render();}
        else if(button.dataset.transportProtocol!==undefined){transportProtocol=button.dataset.transportProtocol;transportSent=false;render();}
        else if(button.dataset.transportDrop!==undefined){transportDrop=!transportDrop;transportSent=false;render();}
        else if(button.dataset.transportSend!==undefined){transportSent=true;render();}
        else if(button.dataset.power!==undefined){powerOn=!powerOn;if(!powerOn)ramData=false;render();}
        else if(button.dataset.ram!==undefined){if(powerOn)ramData=true;render();}
        else if(button.dataset.flash!==undefined){if(powerOn)flashWritten=true;render();}
        else if(button.dataset.memoryReset!==undefined){powerOn=true;ramData=true;flashWritten=false;render();}
        else if(button.dataset.folder!==undefined){
          const dirs=['/','/home/','/home/user/'],current=dirs.indexOf(folder);
          folder=button.dataset.folder==='root'?'/':dirs[Math.max(0,Math.min(2,current+(button.dataset.folder==='back'?-1:1)))];
          render();
        }
        else if(button.dataset.ui!==undefined){if(button.dataset.ui==='size')uiBig=!uiBig;else uiLabels=!uiLabels;uiClicked=false;render();}
        else if(button.dataset.uiPreview!==undefined){uiClicked=true;render();}
        else if(button.dataset.auto!==undefined){automatic=!automatic;render();}
        else if(button.dataset.scheduler!==undefined){schedulerTick++;render();}
        else if(button.dataset.schedulerReset!==undefined){schedulerTick=0;render();}
        else if(button.dataset.auditor!==undefined){auditor=button.dataset.auditor;render();}
        else if(button.dataset.requirement!==undefined){const i=Number(button.dataset.requirement);requirements[i]=!requirements[i];render();}
        else if(button.dataset.development!==undefined){
          const i=Number(button.dataset.development);
          if(i===developmentStep){developmentStep++;developmentFeedback=`${['要求を整理しました。','要件から構造を設計しました。','設計に基づき実装しました。','完成した機能を検証しました。'][i]}`;}
          else developmentFeedback=`まだ${['要件定義','設計','実装','テスト・移行'][developmentStep]}が必要です。`;
          render();
        }
        else if(button.dataset.developmentReset!==undefined){developmentStep=0;developmentFeedback='';render();}
        else if(button.dataset.testAnswer!==undefined){testAnswer=button.dataset.testAnswer;render();}
        else if(button.dataset.sla!==undefined){if(button.dataset.sla==='impact')slaImpact=1-slaImpact;else slaUrgency=1-slaUrgency;render();}
        else if(button.dataset.rightsAnswer!==undefined){rightsAnswer=button.dataset.rightsAnswer;render();}
        else if(button.dataset.answer!==undefined){
          quizChoice=Number(button.dataset.answer);
          const item=LESSONS[currentId].pages.find(page=>page.quiz).quiz;
          dialog.querySelectorAll('[data-answer]').forEach((option,i)=>option.setAttribute('aria-pressed',String(i===quizChoice)));
          const result=dialog.querySelector('.touch-lab-feedback');
          result.textContent=(quizChoice===item.answer?'正解です。':'もう一度確認しましょう。')+' '+item.explain;
          result.classList.toggle('correct',quizChoice===item.answer);
        }
      });
      dialog.addEventListener('input',event=>{
        if(event.target.matches('[data-availability]')){
          const control=event.target,activity=dialog.querySelector('.touch-lab-activity');
          availability[Number(control.dataset.availability)]=Number(control.value);
          activity.querySelectorAll('.touch-lab-controls label strong').forEach((node,i)=>node.textContent=availability[i]+'%');
          const [a,b]=availability.map(n=>n/100),cards=activity.querySelectorAll('.touch-lab-compare > div');
          cards[0].querySelector('strong').textContent=(a*b*100).toFixed(1)+'%';
          cards[1].querySelector('strong').textContent=((1-(1-a)*(1-b))*100).toFixed(1)+'%';
          cards[0].querySelector('small').textContent=`両方動く：${a.toFixed(2)} × ${b.toFixed(2)}`;
          cards[1].querySelector('small').textContent=`少なくとも片方：1 − ${(1-a).toFixed(2)} × ${(1-b).toFixed(2)}`;
          return;
        }
        if(event.target.matches('[data-path-day]')){
          const control=event.target,activity=dialog.querySelector('.touch-lab-activity');
          pathDays[Number(control.dataset.pathDay)]=Number(control.value);
          activity.querySelectorAll('.touch-lab-controls label strong').forEach((node,i)=>node.textContent=pathDays[i]+'日');
          const a=pathDays[0]+pathDays[1],b=pathDays[2]+pathDays[3],longest=Math.max(a,b),cards=activity.querySelectorAll('.touch-lab-compare > div');
          [a,b].forEach((days,i)=>{cards[i].classList.toggle('active',days===longest);cards[i].querySelector('strong').textContent=days+'日';cards[i].querySelector('small').textContent=`余裕 ${longest-days}日`;});
          activity.querySelector('.touch-lab-result').innerHTML=`完了まで <strong>${longest}日</strong>。クリティカルパス：${a===b?'両方の経路':a>b?'A → C':'B → D'}`;
          return;
        }
        if(event.target.matches('[data-finance]')){
          const control=event.target,activity=dialog.querySelector('.touch-lab-activity');
          finance[Number(control.dataset.finance)]=Number(control.value);
          activity.querySelectorAll('.touch-lab-controls label strong').forEach((node,i)=>node.textContent=finance[i]+'万円');
          const values=activity.querySelectorAll('.touch-lab-flow span');
          values.forEach((node,i)=>node.textContent=['売上高','売上原価','販管費'][i]+' '+finance[i]);
          const cards=activity.querySelectorAll('.touch-lab-compare strong');
          cards[0].textContent=finance[0]-finance[1]+'万円';cards[1].textContent=finance[0]-finance[1]-finance[2]+'万円';
          return;
        }
        if(event.target.matches('[data-manual-minutes]')){
          manualMinutes=Number(event.target.value);
          const activity=dialog.querySelector('.touch-lab-activity');
          activity.querySelector('.touch-lab-controls strong').textContent=manualMinutes+'分';
          activity.querySelector('.touch-lab-flow span:nth-of-type(2)').textContent=automatic?'自動共有 0分':`紙から転記 ${manualMinutes}分`;
          activity.querySelector('.touch-lab-result').innerHTML=`全体 <strong>${8+(automatic?0:manualMinutes)}分</strong>${automatic?`（従来より${manualMinutes}分短縮）`:''}`;
          return;
        }
        if(event.target.matches('[data-temperature]')){
          temperature=Number(event.target.value);
          const activity=dialog.querySelector('.touch-lab-activity');
          activity.querySelector('.touch-lab-slider strong').textContent=temperature+'℃';
          activity.querySelector('.touch-lab-flow strong').textContent='送風機 '+(temperature>=30?'ON':'OFF');
          activity.querySelector('.touch-lab-result').textContent=temperature>=30?'条件を満たしたので機器が動きます。':'条件未満なので機器は停止します。';
          return;
        }
        if(event.target.matches('[data-change-frequency]')){
          changeFrequency=Number(event.target.value);
          const activity=dialog.querySelector('.touch-lab-activity');
          activity.querySelector('.touch-lab-slider strong').textContent=['ほぼない','ときどき','多い','とても多い'][changeFrequency];
          const frequent=changeFrequency>=2,cards=activity.querySelectorAll('.touch-lab-compare > div');
          cards[0].classList.toggle('active',!frequent);cards[1].classList.toggle('active',frequent);
          activity.querySelector('.touch-lab-result').textContent=frequent?'この例では短い反復で変更を取り込む進め方が合います。':'この例では要求を初めに整理して工程を進められます。';
          return;
        }
        if(!event.target.matches('[data-quantity]'))return;
        quantity=Number(event.target.value);
        const activity=dialog.querySelector('.touch-lab-activity'),bars=activity.querySelectorAll('.touch-lab-bars div');
        const sales=quantity*20,cost=40+quantity*12,profit=sales-cost;
        activity.querySelector('[data-count]').textContent=quantity+'個';
        bars[0].querySelector('i').style.width=sales/2+'%';bars[0].querySelector('b').textContent=sales+'万円';
        bars[1].querySelector('i').style.width=cost/2+'%';bars[1].querySelector('b').textContent=cost+'万円';
        activity.querySelector('[data-profit]').textContent=profit;
        activity.querySelector('[data-profit-state]').textContent=profit===0?'損益分岐点':profit>0?'黒字':'赤字';
      });
      dialog.addEventListener('change',event=>{
        if(event.target.matches('[data-target]')){target=Number(event.target.value);searchLow=0;searchHigh=6;searchDone=false;refreshAfterFieldChange();}
        else if(event.target.matches('[data-octet]')){lastOctet=Math.min(255,Math.max(0,Number(event.target.value)||0));event.target.value=String(lastOctet);refreshAfterFieldChange();}
        else if(event.target.matches('[data-mask]')){maskLength=Number(event.target.value);refreshAfterFieldChange();}
        else if(event.target.matches('[data-backup-day]')){backupDay=Number(event.target.value);refreshAfterFieldChange();}
        else if(event.target.matches('[data-backup-method]')){backupMethod=event.target.value;refreshAfterFieldChange();}
        else if(event.target.matches('[data-crypto-key]')){cryptoKey=event.target.value;if(cryptoStep>1)cryptoStep=1;refreshAfterFieldChange();}
        else if(event.target.matches('[data-multimedia]')){multimedia[Number(event.target.dataset.multimedia)]=Number(event.target.value);refreshAfterFieldChange();}
        else if(event.target.matches('[data-swot-case]')){swotCase=Number(event.target.value);swotInternal=null;swotFavorable=null;refreshAfterFieldChange();}
        else if(event.target.matches('[data-test-case]')){testCase=Number(event.target.value);testAnswer='';refreshAfterFieldChange();}
        else if(event.target.matches('[data-rights-case]')){rightsCase=Number(event.target.value);rightsAnswer='';refreshAfterFieldChange();}
      });
      document.addEventListener('keydown',event=>{
        if(dialog.hidden)return;
        if(event.key==='Escape'){close();return;}
        if(event.key!=='Tab')return;
        const controls=[...dialog.querySelectorAll('button:not([disabled]),input,select')],first=controls[0],last=controls.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      });
    }
    render();dialog.hidden=false;document.body.classList.add('touch-lab-open');
    dialog.querySelector('.touch-lab-close').focus();
  }
  function close(){
    if(!dialog||dialog.hidden)return;
    dialog.hidden=true;document.body.classList.remove('touch-lab-open');
    if(previousFocus?.isConnected)previousFocus.focus();
    previousFocus=null;currentId=null;
  }
  cards();
  const search=document.getElementById('touchLabSearch'),searchStatus=document.getElementById('touchLabSearchStatus');
  search?.addEventListener('input',()=>{
    const term=search.value.trim().toLocaleLowerCase('ja');
    const all=[...grid.querySelectorAll('.ipa92-lab-card')];
    let found=0;
    all.forEach(card=>{card.hidden=!!term&&!card.textContent.toLocaleLowerCase('ja').includes(term);if(!card.hidden)found++;});
    if(searchStatus)searchStatus.textContent=term?`${found}件見つかりました。`:'';
  });
  globalThis.FEQUEST_TOUCH_LABS_V383={ids:Object.keys(scenarios),open,close};
})();
