/* The original optional labs now use the same direct-manipulation dialog as the newer touch labs. */
(() => {
  'use strict';
  const scenarios = {
    binary:{icon:'🔢',task:'桁のスイッチを押して、2進数の値を変えてみましょう。',kind:'bits'},
    logic:{icon:'⚙️',task:'AとBのスイッチを切り替え、ANDとORを比較しましょう。',kind:'gates'},
    breakeven:{icon:'📈',task:'販売量を動かし、売上と費用が交わるところを探しましょう。',kind:'range'},
    sql:{icon:'🗃️',task:'WHEREの条件を選び、残る行を確認しましょう。',kind:'filter'},
    stackqueue:{icon:'📚',task:'同じデータをスタックとキューから取り出して、順序を比較しましょう。',kind:'stack'},
    binarysearch:{icon:'🔍',task:'探す値を選び、中央との比較で探索範囲が半分になる様子を確認しましょう。',kind:'search'},
    cpu:{icon:'🧠',task:'CPUの命令サイクルを順に進めましょう。',options:[
      ['取出し','主記憶','命令を取り出す','CPUが次の命令を主記憶から読み込みます。'],
      ['解読','命令レジスタ','何をするか読み解く','制御装置が命令の種類や対象を解釈します。'],
      ['実行','演算・入出力','命令どおりに処理する','演算結果や状態が更新されます。']
    ]},
    transaction:{icon:'↩️',task:'更新の途中で障害が起きたときの状態を確かめましょう。',options:[
      ['更新前','口座 A: 100','口座 B: 100','開始時はどちらの残高も100です。'],
      ['Aを減額','口座 A: 70','口座 B: 100','Aだけが30減った段階で確定してはいけません。'],
      ['ROLLBACK','口座 A: 100','口座 B: 100','失敗した取引を取り消し、更新前の状態に戻します。'],
      ['COMMIT','口座 A: 70','口座 B: 130','両方の更新が成功したときだけ確定します。']
    ]},
    subnet:{icon:'🌐',task:'IPアドレスのホスト部を0にしてネットワークアドレスを作りましょう。',options:[
      ['元のIP','192.168.1.130','末尾: 10000010','/24なら先頭24ビットがネットワーク部です。'],
      ['/24マスク','255.255.255.0','末尾: 00000000','ホスト部の8ビットを0にするマスクです。'],
      ['ANDした結果','192.168.1.0','末尾: 00000000','ネットワークアドレスは192.168.1.0になります。']
    ]},
    crypto:{icon:'🔐',task:'暗号化と復号で使う鍵をそれぞれ確かめましょう。',options:[
      ['暗号化','受信者の公開鍵','誰でも暗号化できる','送信者は受信者が公開した鍵でデータを暗号化します。'],
      ['復号','受信者の秘密鍵','受信者だけが読める','対応する秘密鍵を持つ受信者が復号します。']
    ]},
    cache:{icon:'⚡',task:'HITとMISSで、データが通る経路を比べましょう。',options:[
      ['HIT','CPU → キャッシュ → CPU','主記憶に行かない','必要なデータがキャッシュにあり、すばやく取得できます。'],
      ['MISS','CPU → キャッシュ → 主記憶','主記憶へ取りに行く','キャッシュにないため、下位の記憶装置を参照します。']
    ]},
    tcpudp:{icon:'📡',task:'同じデータを送るときの確認方法を比べましょう。',options:[
      ['TCP','接続 → 送信 → 到達確認','信頼性を重視','順序や再送を管理して届けます。'],
      ['UDP','送信 → 次のデータ','速度を重視','到達確認や再送を標準では行いません。']
    ]},
    signature:{icon:'✍️',task:'署名を作り、受信側で検証する順序を追いましょう。',options:[
      ['要約','本文 → ハッシュ値','短い要約を作る','本文からハッシュ値を計算します。'],
      ['署名','ハッシュ値 ＋ 送信者の秘密鍵','署名を作る','送信者の秘密鍵で署名します。'],
      ['検証','署名 ＋ 送信者の公開鍵','一致を確かめる','受信側が本文のハッシュ値と比較します。']
    ]},
    mutex:{icon:'🔒',task:'同時更新と排他制御で、結果がどう変わるか見ましょう。',options:[
      ['排他なし','読取 → 割込み → 上書き','更新が失われる','二つの処理が古い値を読み、片方の結果が消えることがあります。'],
      ['排他あり','ロック → 更新 → 解放','順番に更新する','同じデータへの更新を一つずつ完了させます。']
    ]},
    automata:{icon:'🔁',task:'入力列を1文字ずつ処理し、現在の状態を更新しましょう。',options:[
      ['初期','状態 A','入力前','現在状態はAです。'],
      ['入力 1','状態 B','Aから切り替わる','規則に従い、入力1でBに移ります。'],
      ['次に 0','状態 B','Bを維持する','入力0では現在の状態を保ちます。'],
      ['次に 1','状態 A','Bから切り替わる','入力1でもう一度Aに戻ります。']
    ]},
    memorychips:{icon:'💾',task:'電源を切ったあとに情報が残るか比べましょう。',options:[
      ['RAM','作業中のデータ','電源断で消える','読み書きができ、実行中の作業領域に使います。'],
      ['ROM','起動用の情報','電源断でも残る','読み出しを主な用途とする不揮発性メモリです。'],
      ['フラッシュ','保存したデータ','電源断でも残る','電気的に書き換えられる不揮発性メモリです。']
    ]},
    filesystem:{icon:'🗂️',task:'ルートから目的のファイルまで階層をたどりましょう。',options:[
      ['ルート','/','出発点','絶対パスはルートから始まります。'],
      ['フォルダ','/home/user/','下の階層へ','区切りごとにフォルダをたどります。'],
      ['ファイル','/home/user/memo.txt','目的地','相対パスなら現在地からの位置を示します。']
    ]},
    uiux:{icon:'👆',task:'操作しにくい画面をどう改善できるか確かめましょう。',options:[
      ['改善前','小さいボタン・説明なし','押し間違いや迷い','重要な操作が見つけにくくなります。'],
      ['改善後','大きいボタン・明確なラベル','迷わず操作','タッチ領域と表示の意味を分かりやすくします。']
    ]},
    multimedia:{icon:'🖼️',task:'画素数と色のビット数がデータ量にどう効くか見ましょう。',options:[
      ['1画素','24ビット','3バイト','RGB各8ビットなら1画素は24ビットです。'],
      ['100画素','2,400ビット','300バイト','画素数×1画素当たりのビット数で求めます。'],
      ['1,000画素','24,000ビット','3,000バイト','縦横の画素数が増えるとデータ量も比例して増えます。']
    ]},
    devmodel:{icon:'🛠️',task:'開発の進め方を切り替え、変更への対応を比較しましょう。',options:[
      ['ウォーターフォール','要件 → 設計 → 実装 → テスト','工程を順番に進める','初期の要求を明確にし、各工程の成果を受け渡します。'],
      ['アジャイル','小さく作る → 評価 → 改善','短い反復で見直す','動く成果物を確認しながら繰り返し調整します。']
    ]},
    audit:{icon:'🔎',task:'監査人の立場と、監査される側の役割を比べましょう。',options:[
      ['監査人','証拠を確認 → 評価 → 報告','独立した立場','対象業務から独立し、客観的に評価します。'],
      ['被監査部門','業務の実施 → 記録の提示','改善に取り組む','監査結果を受けて改善策を検討します。']
    ]},
    businessprocess:{icon:'🏢',task:'業務手順の変化を追い、どこで待ち時間が減るか見ましょう。',options:[
      ['改善前','紙で申請 → 転記 → 承認','重複入力がある','転記と持ち運びで時間がかかります。'],
      ['改善後','入力 → 自動共有 → 承認','重複入力を減らす','同じデータを再入力せずに次の担当へ渡せます。']
    ]},
    procurement:{icon:'📋',task:'調達の前に、何を依頼書へ書くか確かめましょう。',options:[
      ['目的','解決したい課題','何のための調達か','目的が分かると提案の方向を揃えられます。'],
      ['要件','必要な機能・性能','何を満たすか','提供者が提案範囲を判断できます。'],
      ['評価','比較基準・条件','どう選ぶか','費用だけでなく条件に照らして比較できます。']
    ]},
    swot:{icon:'🧭',task:'内部と外部、有利と不利の二つの軸で分類しましょう。',options:[
      ['強み S','内部 × 有利','自社の資源','得意な技術や人材などです。'],
      ['弱み W','内部 × 不利','自社の課題','不足した設備や経験などです。'],
      ['機会 O','外部 × 有利','市場の追い風','新しい需要や制度などです。'],
      ['脅威 T','外部 × 不利','市場の向かい風','競合の参入や需要の減少などです。']
    ]},
    iot:{icon:'📶',task:'現実世界の情報が機器の動作につながる流れを追いましょう。',options:[
      ['測る','センサ','温度などを取得','物理的な状態をデータに変えます。'],
      ['送る','ネットワーク','データを送信','集めた情報を処理先へ届けます。'],
      ['判断','クラウド','データを分析','条件に応じて制御内容を決めます。'],
      ['動かす','アクチュエータ','機器に反映','モータや弁などを実際に動かします。']
    ]},
    finance:{icon:'💰',task:'売上高から費用を順に引いて利益を求めましょう。',options:[
      ['売上高','100万円','出発点','売上を計算の起点にします。'],
      ['売上総利益','100 − 60 = 40万円','売上原価を引く','商品やサービスそのものの粗利です。'],
      ['営業利益','40 − 25 = 15万円','販管費を引く','本業による利益です。']
    ]},
    os:{icon:'🖥️',task:'CPUを複数の処理へ短時間ずつ割り当てましょう。',options:[
      ['1回目','P1 が実行','P2・P3は待機','短い時間だけP1にCPUを渡します。'],
      ['2回目','P2 が実行','P1・P3は待機','次の処理へCPUを切り替えます。'],
      ['3回目','P3 が実行','P1・P2は待機','切替えを繰り返すと複数の処理が進みます。']
    ]},
    reliability:{icon:'🔗',task:'同じ稼働率0.9の装置を直列・並列で組み合わせましょう。',options:[
      ['直列','A → B','0.9 × 0.9 = 0.81','両方が動いて初めてシステムが動きます。'],
      ['並列','A または B','1 − (0.1 × 0.1) = 0.99','少なくとも片方が動けば使えます。']
    ]},
    backup:{icon:'🗄️',task:'月曜以降の変更をどこから数えるか比べましょう。',options:[
      ['フル','日曜の全データ','復元の基点','その時点のデータを丸ごと保存します。'],
      ['増分','前回のバックアップから','日々の差だけ','水曜時点への復元にはフルと月・火・水の増分が必要です。'],
      ['差分','直近のフルから','フル以降の差','復元にはフルと最新の差分を使います。']
    ]},
    development:{icon:'🧱',task:'決めた内容が次の工程へ渡る順序を追いましょう。',options:[
      ['要件定義','何を作るか','利用者の要求','機能や制約を明確にします。'],
      ['設計','どう作るか','構造や画面','要件を実装できる形にします。'],
      ['実装','プログラムを作る','動く仕組み','設計に従って作成します。'],
      ['テスト・移行','検証して使い始める','本番へ移す','要求どおりに動くか確かめます。']
    ]},
    testing:{icon:'🧪',task:'確認する対象を広げながら、テスト工程を見比べましょう。',options:[
      ['単体','個々のプログラム','小さな単位','部品ごとの動作を確認します。'],
      ['結合','部品同士の連携','受渡し','インタフェースやデータの受渡しを確認します。'],
      ['システム','全体の機能','システム全体','完成したシステムが仕様に合うか確認します。'],
      ['運用','利用者の業務','実際の使い方','利用者の要求を満たすか確認します。']
    ]},
    criticalpath:{icon:'🗓️',task:'二つの経路を選び、全体の完了日を決める方を見つけましょう。',options:[
      ['経路 A → C','3日 ＋ 4日','合計7日','こちらが長く、完了日を決めるクリティカルパスです。'],
      ['経路 B → D','2日 ＋ 3日','合計5日','こちらには2日分の余裕があります。']
    ]},
    sla:{icon:'🎧',task:'対応優先度を決める材料とSLAの役割を確認しましょう。',options:[
      ['広範囲の障害','全社で停止','優先度が高い','影響範囲と緊急度が大きい状態です。'],
      ['個別の質問','一人からの問い合わせ','通常の対応','影響範囲や合意した応答時間を確認します。'],
      ['SLA','可用性・応答時間など','合意したサービス水準','提供者と利用者の間で水準を定めます。']
    ]},
    iprights:{icon:'©️',task:'守りたい対象を選び、対応する権利を確認しましょう。',options:[
      ['発明','技術的なアイデア','特許権','発明を保護します。'],
      ['作品・プログラム','創作物','著作権','表現を保護します。'],
      ['商品名・マーク','ブランドの目印','商標権','商品やサービスの識別標識を保護します。'],
      ['物品のデザイン','形状・模様など','意匠権','物品などの外観デザインを保護します。']
    ]}
  };

  const html = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const grid=document.getElementById('labLessonGrid');
  if(!grid || typeof LAB_LESSON_IDS==='undefined' || typeof LESSONS==='undefined')return;
  const missing=LAB_LESSON_IDS.filter(id=>!scenarios[id]);
  if(missing.length){console.error('Touch lab coverage missing:',missing);return;}
  let dialog=null,previousFocus=null,currentId=null,selected=0,bits=[0,0,0,0],inputs=[0,0],quantity=5,rows=[{name:'A',score:80},{name:'B',score:60},{name:'C',score:90}],items=['A','B','C'],target=7,quizChoice=null;

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
      const numbers=[1,3,5,7,9,11,13],middle=7;
      return `<label class="touch-lab-slider">探す値：<select data-target>${numbers.map(n=>`<option value="${n}" ${n===target?'selected':''}>${n}</option>`).join('')}</select></label><div class="touch-lab-rows">${numbers.map(n=>`<span class="${n===middle?'middle':n===target?'found':target<middle&&n>middle||target>middle&&n<middle?'removed':'kept'}">${n}</span>`).join('')}</div><p class="touch-lab-result">中央の7と比較：<strong>${target===middle?'見つかった':target<middle?'左半分を残す':'右半分を残す'}</strong></p><p>残した範囲でも同じ比較を繰り返します。</p>`;
    }
    const option=config.options[selected];
    const track=config.options.length<3?'':`<div class="touch-lab-track" aria-label="全体の段階">${config.options.map((item,i)=>`<span class="${i===selected?'active':''}"><b>${i+1}</b>${html(item[0])}</span>`).join('')}</div>`;
    const steps=option[1].split(/\s*→\s*/);
    const flow=steps.length>1
      ?`<div class="touch-lab-flow touch-lab-sequence" role="img" aria-label="${html(option[0]+'：'+option[1])}">${steps.map((step,i)=>`${i?'<i aria-hidden="true">→</i>':''}<span>${html(step)}</span>`).join('')}</div>`
      :`<div class="touch-lab-flow" role="img" aria-label="${html(option[0]+'：'+option[1])}"><span>${html(option[0])}</span><i aria-hidden="true">→</i><strong>${html(option[1])}</strong></div>`;
    return `<div class="touch-lab-options">${config.options.map((item,i)=>`<button type="button" data-select="${i}" aria-pressed="${selected===i}">${html(item[0])}</button>`).join('')}</div>${track}${flow}<p class="touch-lab-result">${html(option[2])}</p><p class="touch-lab-observation">${html(option[3])}</p>`;
  }
  function quiz(id){
    const item=LESSONS[id].pages.find(page=>page.quiz)?.quiz;
    if(!item)return '';
    return `<section class="touch-lab-check"><h3>確かめる</h3><p>${html(LESSONS[id].pages.find(page=>page.quiz).copy)}</p><div class="touch-lab-answers">${item.options.map((option,i)=>`<button type="button" data-answer="${i}" aria-pressed="${quizChoice===i}">${html(option)}</button>`).join('')}</div><div class="touch-lab-feedback" role="status" aria-live="polite"></div></section>`;
  }
  function render(){
    const config=scenarios[currentId];if(!config||!dialog)return;
    dialog.querySelector('.touch-lab-title').textContent=LESSONS[currentId].title;
    dialog.querySelector('.touch-lab-task').textContent=config.task;
    dialog.querySelector('.touch-lab-activity').innerHTML=visual(config);
    dialog.querySelector('.touch-lab-check-host').innerHTML=quiz(currentId);
  }
  function open(id){
    if(!scenarios[id])return;
    previousFocus=document.activeElement;currentId=id;selected=0;bits=[0,0,0,0];inputs=[0,0];quantity=5;items=['A','B','C'];target=7;quizChoice=null;
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
      dialog.addEventListener('change',event=>{if(event.target.matches('[data-target]')){target=Number(event.target.value);dialog.querySelector('.touch-lab-activity').innerHTML=visual(scenarios[currentId]);}});
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
  globalThis.FEQUEST_TOUCH_LABS_V383={ids:Object.keys(scenarios),open,close};
})();
