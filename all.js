
const screens = [...document.querySelectorAll('.screen')];
const navBtns = [...document.querySelectorAll('.nav-btn[data-screen]')];

function showScreen(id){
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.screen === id));
  window.scrollTo({top:0, behavior:'smooth'});
}

document.querySelectorAll('[data-screen]').forEach(btn=>{
  btn.addEventListener('click',()=>showScreen(btn.dataset.screen));
});


const toast = document.getElementById('toast');
function popToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1600);
}

document.getElementById('settingsBtn').addEventListener('click',()=>popToast('設定画面は次版で追加予定です'));

const traceStates = [
  {line:0,a:0,i:'—',tip:'a に 0 が代入されました。'},
  {line:1,a:0,i:1,tip:'for が開始。i は 1 です。'},
  {line:2,a:1,i:1,tip:'a ← a + i。0 + 1 で a は 1。'},
  {line:3,a:1,i:1,tip:'1回目のループ終了。次の i へ。'},
  {line:1,a:1,i:2,tip:'i が 2 になりました。'},
  {line:2,a:3,i:2,tip:'1 + 2 で a は 3。'},
  {line:3,a:3,i:2,tip:'2回目のループ終了。'},
  {line:1,a:3,i:3,tip:'i が 3 になりました。'},
  {line:2,a:6,i:3,tip:'3 + 3 で a は 6。'},
  {line:3,a:6,i:3,tip:'3回目のループ終了。'},
  {line:4,a:6,i:3,tip:'ループ終了。最終的に a = 6 を出力します。'}
];
let traceIndex = -1;

function renderTrace(){
  document.querySelectorAll('.code-line').forEach(l=>l.classList.remove('active'));
  if(traceIndex >= 0){
    const s = traceStates[traceIndex];
    const line = document.querySelector(`.code-line[data-line="${s.line}"]`);
    if(line) line.classList.add('active');
    document.getElementById('varA').textContent = s.a;
    document.getElementById('varI').textContent = s.i;
    document.getElementById('traceTip').innerHTML = s.tip;
    document.getElementById('traceProgress').style.width = ((traceIndex+1)/traceStates.length*100)+'%';
  }else{
    document.getElementById('varA').textContent = '—';
    document.getElementById('varI').textContent = '—';
    document.getElementById('traceTip').innerHTML = '最初は <b>a ← 0</b> です。1 STEP を押してください。';
    document.getElementById('traceProgress').style.width = '0%';
  }
  document.getElementById('finishQuest').style.display = traceIndex === traceStates.length-1 ? 'block':'none';
}

document.getElementById('stepTrace').addEventListener('click',()=>{
  if(traceIndex < traceStates.length-1){
    traceIndex++;
    renderTrace();
  }else popToast('トレース完了です！');
});

document.getElementById('resetTrace').addEventListener('click',()=>{
  traceIndex = -1;
  renderTrace();
});

document.getElementById('finishQuest').addEventListener('click',()=>{
  showScreen('result');
});
document.getElementById('resultHome').addEventListener('click',()=>showScreen('home'));

const aiDrawer = document.getElementById('aiDrawer');
function openAi(){ aiDrawer.classList.add('open'); }
function closeAi(){ aiDrawer.classList.remove('open'); }
document.getElementById('aiFab').addEventListener('click',openAi);
document.getElementById('openAiSide').addEventListener('click',openAi);
document.getElementById('closeAi').addEventListener('click',closeAi);

const chat = document.getElementById('chat');
const input = document.getElementById('chatInput');
function addBubble(text, type){
  const d = document.createElement('div');
  d.className = 'bubble ' + (type === 'user' ? 'user-bub':'bot-bub');
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}
function mockAnswer(q){
  const lower = q.toLowerCase();
  if(q.includes('二分探索') || q.includes('答え') || q.includes('なぜ')){
    return '二分探索では、中央の値と目的の値を比べて「半分を捨てる」のがポイントです。37は23より大きいので、23以下の左側は調べなくてよくなります。';
  }
  if(q.includes('図')){
    return 'イメージは「辞書を真ん中から開く」方法です。目的の言葉が後ろなら前半を全部捨て、残った範囲でもまた真ん中を見る、を繰り返します。';
  }
  if(q.includes('簡単')){
    return '「真ん中を見る → 大きいか小さいか判断 → いらない半分を捨てる」。まずはこの3手だけ覚えれば大丈夫です。';
  }
  if(q.includes('似た')){
    return '練習：配列 [2, 5, 9, 14, 21, 30, 44] から30を二分探索するとき、最初に中央の14を見た後、次に残すのは左側・右側のどちらでしょう？';
  }
  return 'この試作ではAI APIにはまだ接続していません。本番では、今開いている問題・正解・学習履歴を一緒に渡して、その問題専用の説明を返す予定です。';
}
function send(){
  const q = input.value.trim();
  if(!q) return;
  addBubble(q,'user'); input.value='';
  setTimeout(()=>addBubble(mockAnswer(q),'bot'),350);
}
document.getElementById('sendChat').addEventListener('click',send);
input.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });
document.querySelectorAll('.quick button').forEach(b=>{
  b.addEventListener('click',()=>{
    addBubble(b.dataset.q,'user');
    setTimeout(()=>addBubble(mockAnswer(b.dataset.q),'bot'),300);
  });
});


// ===== v4: Persistent learner profile + diagnostic =====
const STORAGE_KEY = 'fequest_profile_v4';

const DEFAULT_PROFILE = {
  xp: 4820,
  streak: 6,
  diagnosticCompleted: false,
  diagnosticScores: {},
  skills: {
    '基礎理論': 55,
    'コンピュータ': 65,
    'データベース': 55,
    'ネットワーク': 55,
    'セキュリティ': 65,
    'アルゴリズム': 45,
    'マネジメント': 65,
    'ストラテジ': 70
  },
  lastStudyDate: null
};

function loadProfile(){
  try{
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return p ? {...DEFAULT_PROFILE, ...p, skills:{...DEFAULT_PROFILE.skills, ...(p.skills||{})}} : structuredClone(DEFAULT_PROFILE);
  }catch(e){
    return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  }
}
let profile = loadProfile();

function saveProfile(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  refreshProfileUI();
}

function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

function refreshProfileUI(){
  const xpTop = document.getElementById('xpTop');
  const xpMobile = document.getElementById('xpMobile');
  const streakTop = document.getElementById('streakTop');
  const streakMobile = document.getElementById('streakMobile');
  if(xpTop) xpTop.textContent = profile.xp.toLocaleString('ja-JP');
  if(xpMobile) xpMobile.textContent = profile.xp >= 1000 ? (profile.xp/1000).toFixed(1)+'k' : profile.xp;
  if(streakTop) streakTop.textContent = profile.streak;
  if(streakMobile) streakMobile.textContent = profile.streak;

  const banner = document.getElementById('diagBanner');
  if(banner) banner.classList.toggle('hidden', profile.diagnosticCompleted);

  renderSkills();
  buildDailyQuest();
}

function sortedSkills(){
  return Object.entries(profile.skills).sort((a,b)=>a[1]-b[1]);
}

function renderSkills(){
  const list = document.getElementById('skillList');
  if(!list) return;
  list.innerHTML = '';
  const icons = {
    '基礎理論':'🧮','コンピュータ':'⚙️','データベース':'🗄️','ネットワーク':'🌐',
    'セキュリティ':'🛡️','アルゴリズム':'💻','マネジメント':'📋','ストラテジ':'📈'
  };
  sortedSkills().forEach(([name,val])=>{
    const row = document.createElement('div');
    row.className='skill-row';
    row.innerHTML = `
      <div class="skill-head">
        <div class="skill-name">${icons[name]||'📘'} ${name}</div>
        <div class="skill-value">${val}%</div>
      </div>
      <div class="progress"><div style="width:${val}%"></div></div>
    `;
    list.appendChild(row);
  });
  const weak = sortedSkills().slice(0,3).map(x=>x[0]);
  const advice = document.getElementById('weakAdvice');
  if(advice){
    advice.textContent = profile.diagnosticCompleted
      ? `現在の優先分野は「${weak.join('・')}」です。毎日の復習枠に少しずつ入れます。`
      : '実力診断をすると、ここに優先して学ぶ分野が表示されます。';
  }
}

function buildDailyQuest(){
  const ordered = sortedSkills();
  const weak1 = ordered[0]?.[0] || 'アルゴリズム';
  const weak2 = ordered[1]?.[0] || 'ネットワーク';
  const review = document.getElementById('questReviewTopic');
  const newTitle = document.getElementById('questNewTitle');
  const btopic = document.getElementById('questBTopic');
  if(review) review.textContent = `${weak1}・${weak2}`;

  const newStage = {
    '基礎理論':'基数変換',
    'コンピュータ':'CPUとキャッシュ',
    'データベース':'SQLの基本',
    'ネットワーク':'IPアドレス',
    'セキュリティ':'公開鍵暗号',
    'アルゴリズム':'二分探索',
    'マネジメント':'プロジェクト管理',
    'ストラテジ':'経営戦略'
  };
  if(newTitle) newTitle.textContent = newStage[weak1] || '二分探索';
  if(btopic) btopic.textContent = profile.skills['アルゴリズム'] < 70 ? '配列・ループ' : '条件分岐・探索';
}

// Original diagnostic questions based on FE topic areas; not copied from the books.
const DIAG_QUESTIONS = [
  {
    category:'基礎理論',
    q:'2進数 1010 を10進数で表すといくつですか？',
    options:['8','10','12','14'], answer:1
  },
  {
    category:'コンピュータ',
    q:'CPUと主記憶の速度差を埋めるために使われるものとして最も適切なのは？',
    options:['キャッシュメモリ','光ディスク','プリンタ','ルータ'], answer:0
  },
  {
    category:'データベース',
    q:'関係データベースで、表の各行を一意に識別するために使うキーは？',
    options:['外部キー','主キー','暗号鍵','検索キー'], answer:1
  },
  {
    category:'ネットワーク',
    q:'インターネット上で機器を識別するために使われる論理的なアドレスは？',
    options:['MACアドレスだけ','IPアドレス','SSID','URLだけ'], answer:1
  },
  {
    category:'セキュリティ',
    q:'送信者本人が作成したことと、内容が改ざんされていないことの確認に役立つものは？',
    options:['デジタル署名','バックアップ','圧縮','ファイアウォールだけ'], answer:0
  },
  {
    category:'アルゴリズム',
    q:'二分探索を効率よく使うために、探索対象のデータに必要な条件は？',
    options:['必ず重複している','整列されている','画像データである','暗号化されている'], answer:1
  },
  {
    category:'アルゴリズム',
    q:'スタックからデータを取り出す順序として正しいものは？',
    options:['最初に入れたものから','最後に入れたものから','ランダム','値が小さいものから'], answer:1
  },
  {
    category:'マネジメント',
    q:'プロジェクトで作業の開始・終了予定を管理する対象として最も近いものは？',
    options:['スケジュール','暗号鍵','IPアドレス','主キー'], answer:0
  },
  {
    category:'ストラテジ',
    q:'売上高と費用が等しくなり、利益が0になる売上高を何と呼びますか？',
    options:['損益分岐点','限界利益','営業利益率','流動比率'], answer:0
  },
  {
    category:'ネットワーク',
    q:'家庭や社内LANで使われることが多く、インターネット上ではそのまま使わないIPアドレスは？',
    options:['プライベートIPアドレス','グローバルIPアドレス','MACアドレス','URL'], answer:0
  },
  {
    category:'セキュリティ',
    q:'パスワードそのものではなく、計算結果を保存して照合する用途でよく使われる仕組みは？',
    options:['ハッシュ','ソート','キャッシュ','ルーティング'], answer:0
  },
  {
    category:'データベース',
    q:'複数の処理を「すべて成功」または「すべて取り消し」として扱うまとまりは？',
    options:['トランザクション','サブネット','スレッド','プロトコル'], answer:0
  }
];

let diagIndex = 0;
let diagAnswers = Array(DIAG_QUESTIONS.length).fill(null);

function startDiagnosticFlow(){
  showScreen('diagnostic');
  document.getElementById('diagIntro').style.display='block';
  document.getElementById('diagQuiz').style.display='none';
  document.getElementById('diagResult').style.display='none';
}

const startDiagnosticBtn = document.getElementById('startDiagnostic');
if(startDiagnosticBtn) startDiagnosticBtn.addEventListener('click',startDiagnosticFlow);

const diagBegin = document.getElementById('diagBegin');
if(diagBegin) diagBegin.addEventListener('click',()=>{
  diagIndex=0;
  diagAnswers=Array(DIAG_QUESTIONS.length).fill(null);
  document.getElementById('diagIntro').style.display='none';
  document.getElementById('diagQuiz').style.display='block';
  renderDiagQuestion();
});

function renderDiagQuestion(){
  const item = DIAG_QUESTIONS[diagIndex];
  document.getElementById('diagCategory').textContent=item.category;
  document.getElementById('diagCount').textContent=`${diagIndex+1} / ${DIAG_QUESTIONS.length}`;
  document.getElementById('diagProgress').style.width=`${((diagIndex+1)/DIAG_QUESTIONS.length)*100}%`;
  document.getElementById('diagQuestion').textContent=item.q;
  const opts=document.getElementById('diagOptions');
  opts.innerHTML='';
  item.options.forEach((op,i)=>{
    const b=document.createElement('button');
    b.className='diag-option'+(diagAnswers[diagIndex]===i?' selected':'');
    b.textContent=`${String.fromCharCode(65+i)}. ${op}`;
    b.addEventListener('click',()=>{
      diagAnswers[diagIndex]=i;
      renderDiagQuestion();
    });
    opts.appendChild(b);
  });
  document.getElementById('diagPrev').disabled=diagIndex===0;
  document.getElementById('diagNext').textContent=diagIndex===DIAG_QUESTIONS.length-1?'結果を見る':'次へ →';
}

document.getElementById('diagPrev')?.addEventListener('click',()=>{
  if(diagIndex>0){diagIndex--;renderDiagQuestion();}
});

document.getElementById('diagNext')?.addEventListener('click',()=>{
  if(diagAnswers[diagIndex]===null){
    popToast('回答を1つ選んでください');
    return;
  }
  if(diagIndex<DIAG_QUESTIONS.length-1){
    diagIndex++;renderDiagQuestion();
  }else{
    finishDiagnostic();
  }
});

function finishDiagnostic(){
  const cats={};
  DIAG_QUESTIONS.forEach((q,i)=>{
    if(!cats[q.category]) cats[q.category]={correct:0,total:0};
    cats[q.category].total++;
    if(diagAnswers[i]===q.answer) cats[q.category].correct++;
  });

  const scores={};
  Object.entries(cats).forEach(([cat,v])=>{
    scores[cat]=Math.round(v.correct/v.total*100);
  });

  // Categories with one diagnostic item are softened toward a neutral prior
  // so one mistake does not create an extreme 0/100 mastery estimate.
  Object.keys(profile.skills).forEach(cat=>{
    const raw = scores[cat];
    if(raw !== undefined){
      const sampleCount = cats[cat].total;
      const prior = profile.skills[cat] ?? 60;
      const weight = sampleCount >= 2 ? 0.65 : 0.45;
      profile.skills[cat]=Math.round(prior*(1-weight)+raw*weight);
    }
  });

  profile.diagnosticCompleted=true;
  profile.diagnosticScores=scores;
  profile.xp += 120;
  saveProfile();

  document.getElementById('diagQuiz').style.display='none';
  document.getElementById('diagResult').style.display='block';

  const grid=document.getElementById('diagResultGrid');
  grid.innerHTML='';
  sortedSkills().forEach(([cat,val])=>{
    const d=document.createElement('div');
    d.className='diag-result';
    d.innerHTML=`<div class="sub">${cat}</div><div class="diag-score">${val}%</div>`;
    grid.appendChild(d);
  });

  const weak=sortedSkills().slice(0,3).map(x=>x[0]);
  document.getElementById('diagResultAdvice').textContent=
    `まずは「${weak.join('・')}」を重点的に進めます。得意分野は短い復習だけにして、60分を効率よく使います。`;
}

document.getElementById('diagFinish')?.addEventListener('click',()=>showScreen('home'));
document.getElementById('diagRedo')?.addEventListener('click',()=>{
  profile.diagnosticCompleted=false;
  saveProfile();
  startDiagnosticFlow();
});

// Lesson interactions are handled by the v6 lesson engine.
document.getElementById('finishQuest')?.addEventListener('click',()=>{
  profile.skills['アルゴリズム']=clamp((profile.skills['アルゴリズム']||45)+3,0,100);
  profile.xp += 40;
  profile.lastStudyDate = new Date().toISOString().slice(0,10);
  saveProfile();
});

// If the current prototype's result handler hard-codes XP, profile refresh will win afterwards.
setTimeout(refreshProfileUI,0);



// ===== v5: Original question bank + spaced review =====
// All questions below are FE QUEST originals.
// Book structure/topics were used only as curriculum references.

const QUESTION_BANK = [
  // 基礎理論
  {id:'theory-01',cat:'基礎理論',concept:'基数変換',difficulty:'基礎',
   q:'10進数の13を2進数で表したものはどれですか？',
   options:['1011','1101','1110','1001'],a:1,
   exp:'13 = 8 + 4 + 1 なので、8・4・1の桁が1になります。したがって 1101 です。',
   hint:'8, 4, 2, 1 の4つの重みで13を作ってみましょう。'},
  {id:'theory-02',cat:'基礎理論',concept:'論理演算',difficulty:'基礎',
   q:'Aが真、Bが偽のとき、A AND B の結果はどれですか？',
   options:['真','偽','場合による','定義できない'],a:1,
   exp:'ANDは両方が真のときだけ真になります。Bが偽なので結果は偽です。',
   hint:'ANDは「AもBも」の意味です。'},
  {id:'theory-03',cat:'基礎理論',concept:'補数',difficulty:'標準',
   q:'8ビットの2の補数表現で、00000101 が +5 を表すとき、-5 を表すものはどれですか？',
   options:['11111010','11111011','10000101','00000110'],a:1,
   exp:'+5のビットを反転すると11111010、そこに1を加えると11111011です。',
   hint:'2の補数は「ビット反転して1を加える」です。'},
  {id:'theory-04',cat:'基礎理論',concept:'確率',difficulty:'標準',
   q:'独立した2つの装置A・Bがあり、それぞれ正常に動く確率が0.9です。両方とも正常に動く確率は？',
   options:['0.81','0.90','0.99','1.80'],a:0,
   exp:'独立事象なので 0.9 × 0.9 = 0.81 です。',
   hint:'「両方とも」は確率を掛け合わせます。'},

  // コンピュータ
  {id:'computer-01',cat:'コンピュータ',concept:'CPU',difficulty:'基礎',
   q:'CPUが主記憶から命令を取り出し、内容を解読して実行する一連の流れとして最も適切なのは？',
   options:['実行→解読→取出し','取出し→解読→実行','解読→取出し→実行','取出し→実行→解読'],a:1,
   exp:'基本的な命令サイクルは、命令取出し（fetch）→命令解読（decode）→実行（execute）です。',
   hint:'まず命令を手元に持ってこないと、解読も実行もできません。'},
  {id:'computer-02',cat:'コンピュータ',concept:'キャッシュ',difficulty:'基礎',
   q:'キャッシュメモリの主な目的として最も適切なのは？',
   options:['CPUと主記憶の速度差を小さくする','電源断でも必ずデータを保持する','ネットワーク速度を上げる','ディスク容量を増やす'],a:0,
   exp:'高速なキャッシュをCPUと主記憶の間に置き、頻繁に使うデータを置くことで実効アクセス時間を短くします。',
   hint:'CPUは非常に高速ですが、主記憶はそれより遅いです。'},
  {id:'computer-03',cat:'コンピュータ',concept:'記憶階層',difficulty:'標準',
   q:'一般に、アクセス速度が速い順として最も適切なのは？',
   options:['SSD→主記憶→レジスタ','レジスタ→キャッシュ→主記憶','主記憶→キャッシュ→レジスタ','キャッシュ→SSD→レジスタ'],a:1,
   exp:'CPU内部のレジスタが最も高速で、その次にキャッシュ、主記憶と続きます。',
   hint:'CPUに近いほど高速、と考えると整理しやすいです。'},
  {id:'computer-04',cat:'コンピュータ',concept:'割込み',difficulty:'標準',
   q:'入出力装置の処理完了をCPUへ知らせ、現在の処理を一時中断して対応処理を行わせる仕組みは？',
   options:['割込み','スプーリング','キャッシュ','仮想記憶'],a:0,
   exp:'割込みは、外部イベントなどに応じてCPUが現在の処理を一時中断し、割込み処理へ移る仕組みです。',
   hint:'「今やっている処理に割って入る」イメージです。'},

  // データベース
  {id:'db-01',cat:'データベース',concept:'主キー',difficulty:'基礎',
   q:'関係データベースの表で、各行を一意に識別するための属性は？',
   options:['主キー','外部キー','ビュー','インデックスだけ'],a:0,
   exp:'主キーは各行（レコード）を一意に識別するための属性または属性の組です。',
   hint:'「この1行は誰？」を一意に決めるキーです。'},
  {id:'db-02',cat:'データベース',concept:'SQL',difficulty:'基礎',
   q:'表 employee から salary が300000以上の行を検索したい。WHERE句として適切なのは？',
   options:['WHERE salary >= 300000','WHERE salary =< 300000','WHERE salary LIKE 300000','WHERE salary IS 300000'],a:0,
   exp:'300000以上は >= を使います。したがって WHERE salary >= 300000 です。',
   hint:'「以上」は >= です。'},
  {id:'db-03',cat:'データベース',concept:'正規化',difficulty:'標準',
   q:'データベースの正規化を行う主な目的として最も適切なのは？',
   options:['データの重複や更新時の矛盾を減らす','必ず検索速度を最大化する','全表を1つにまとめる','パスワードを暗号化する'],a:0,
   exp:'正規化はデータの重複を抑え、追加・更新・削除時の不整合を起こしにくくするために行います。',
   hint:'同じ情報を何か所にも持つと、修正漏れが起きやすくなります。'},
  {id:'db-04',cat:'データベース',concept:'トランザクション',difficulty:'標準',
   q:'銀行振込で「A口座から減額」と「B口座へ加算」を一体として扱い、途中失敗時は両方取り消したい。この性質に最も関係するものは？',
   options:['原子性','可用性','局所性','冗長性'],a:0,
   exp:'原子性（Atomicity）は、トランザクション内の処理を「全部成功」か「全部失敗」のどちらかとして扱う性質です。',
   hint:'途中まで反映された状態を残さない性質です。'},

  // ネットワーク
  {id:'net-01',cat:'ネットワーク',concept:'IPアドレス',difficulty:'基礎',
   q:'LAN内で使われることが多く、インターネット上で直接ルーティングされないアドレスは？',
   options:['プライベートIPアドレス','グローバルIPアドレス','MACアドレス','URL'],a:0,
   exp:'プライベートIPアドレスはLAN内で利用され、通常はNATなどを介してインターネットへ接続します。',
   hint:'家庭のルータ配下でよく使うアドレスです。'},
  {id:'net-02',cat:'ネットワーク',concept:'DNS',difficulty:'基礎',
   q:'example.com のようなドメイン名をIPアドレスへ対応付ける仕組みは？',
   options:['DNS','DHCP','FTP','SMTP'],a:0,
   exp:'DNSはドメイン名とIPアドレスの対応付けを行う仕組みです。',
   hint:'人間向けの名前を、通信で使うアドレスに変換します。'},
  {id:'net-03',cat:'ネットワーク',concept:'サブネット',difficulty:'標準',
   q:'IPv4アドレス 192.168.10.25/24 のネットワークアドレスは？',
   options:['192.168.10.0','192.168.10.24','192.168.0.0','192.168.10.255'],a:0,
   exp:'/24では先頭24ビットがネットワーク部です。最後の8ビットを0にすると192.168.10.0です。',
   hint:'/24は 255.255.255.0 と同じ意味です。'},
  {id:'net-04',cat:'ネットワーク',concept:'TCP/UDP',difficulty:'標準',
   q:'到達確認や再送制御を行い、信頼性の高い通信を提供するプロトコルは？',
   options:['TCP','UDP','ARP','ICMPだけ'],a:0,
   exp:'TCPはコネクション型で、順序制御・再送制御などにより信頼性を確保します。',
   hint:'Webやメールなど、多くの用途で「確実に届けたい」ときに使われます。'},

  // セキュリティ
  {id:'sec-01',cat:'セキュリティ',concept:'ハッシュ',difficulty:'基礎',
   q:'入力データから固定長の値を生成し、改ざん検知などに利用されるものは？',
   options:['ハッシュ関数','ルータ','正規化','キャッシュ'],a:0,
   exp:'ハッシュ関数は入力から固定長のハッシュ値を生成します。内容が変わると通常ハッシュ値も変化します。',
   hint:'データの「指紋」のような値を作ります。'},
  {id:'sec-02',cat:'セキュリティ',concept:'公開鍵暗号',difficulty:'標準',
   q:'公開鍵暗号方式で、受信者だけが読めるように送信内容を暗号化するとき、通常どの鍵を使いますか？',
   options:['受信者の公開鍵','受信者の秘密鍵','送信者の秘密鍵だけ','送信者の公開鍵だけ'],a:0,
   exp:'受信者の公開鍵で暗号化し、その対応する受信者の秘密鍵で復号します。',
   hint:'暗号化する鍵は相手に公開されていても困らない鍵です。'},
  {id:'sec-03',cat:'セキュリティ',concept:'デジタル署名',difficulty:'標準',
   q:'デジタル署名を付与する際、署名者が主に使用する鍵は？',
   options:['署名者の秘密鍵','署名者の公開鍵','受信者の公開鍵','受信者の秘密鍵'],a:0,
   exp:'署名者は自分の秘密鍵を用いて署名し、検証側は署名者の公開鍵で確認します。',
   hint:'本人しか持っていない鍵で署名するから、本人性の確認に使えます。'},
  {id:'sec-04',cat:'セキュリティ',concept:'認証',difficulty:'基礎',
   q:'「知っている情報」「持っている物」「本人の身体的特徴」のうち、異なる種類を2つ以上組み合わせる認証は？',
   options:['多要素認証','単一障害点','排他制御','負荷分散'],a:0,
   exp:'多要素認証は、知識・所持・生体など異なる要素を組み合わせます。',
   hint:'パスワード＋スマホ認証のような組合せです。'},

  // アルゴリズム
  {id:'algo-01',cat:'アルゴリズム',concept:'二分探索',difficulty:'基礎',
   q:'昇順に整列された配列 [4, 9, 15, 22, 31, 40, 52] から40を二分探索する。最初に22と比較した後、次に残す範囲は？',
   options:['22より左側','22より右側','全体を残す','探索終了'],a:1,
   exp:'40は22より大きいので、22以下の左半分を捨て、右半分を探索します。',
   hint:'目的値40と中央22の大小を比べます。'},
  {id:'algo-02',cat:'アルゴリズム',concept:'スタック',difficulty:'基礎',
   q:'空のスタックに A、B、C の順でPUSHした後、1回POPすると取り出されるのは？',
   options:['A','B','C','何も取り出せない'],a:2,
   exp:'スタックはLIFO（後入れ先出し）なので、最後に入れたCが最初に取り出されます。',
   hint:'積み重ねた皿を上から取るイメージです。'},
  {id:'algo-03',cat:'アルゴリズム',concept:'計算量',difficulty:'標準',
   q:'要素数nの配列を先頭から順に調べる線形探索で、最悪の場合に調べる要素数はおおよそどれですか？',
   options:['1','log2 n','n','n²'],a:2,
   exp:'目的の値が最後にある、または存在しない場合、最大でn個すべてを調べます。計算量はO(n)です。',
   hint:'一つずつ順番に見る探索です。'},
  {id:'algo-04',cat:'アルゴリズム',concept:'ループトレース',difficulty:'標準',
   q:'a←0 とし、iを1から4まで1ずつ増やしながら a←a+i を実行する。終了時のaはいくつですか？',
   options:['4','6','10','16'],a:2,
   exp:'aは 0+1+2+3+4 = 10 になります。',
   hint:'iの値を1,2,3,4と順番に足してみましょう。'},

  // マネジメント
  {id:'mgmt-01',cat:'マネジメント',concept:'プロジェクト',difficulty:'基礎',
   q:'プロジェクトの作業を細かい単位へ分解し、階層的に整理したものは？',
   options:['WBS','DNS','ER図','NAT'],a:0,
   exp:'WBS（Work Breakdown Structure）は、プロジェクトの作業を階層的に分解したものです。',
   hint:'大きな仕事を小さな仕事へ「分解」します。'},
  {id:'mgmt-02',cat:'マネジメント',concept:'リスク',difficulty:'標準',
   q:'発生確率は低いが、発生した場合の影響が非常に大きいリスクへの対応として、まず適切なのは？',
   options:['無条件で無視する','影響と対応策を検討して管理対象にする','必ず発生したものとして扱う','記録せず担当者だけで覚える'],a:1,
   exp:'リスクは発生確率と影響度を評価し、必要な対応を計画します。確率が低くても影響が大きければ管理対象になり得ます。',
   hint:'確率だけでなく「起きたときの大きさ」も見ます。'},
  {id:'mgmt-03',cat:'マネジメント',concept:'サービスレベル',difficulty:'基礎',
   q:'サービス提供者と利用者の間で、可用性や応答時間などのサービス水準を合意したものは？',
   options:['SLA','SQL','SDK','SSLだけ'],a:0,
   exp:'SLA（Service Level Agreement）は、提供するサービス水準についての合意です。',
   hint:'Service Level の合意です。'},
  {id:'mgmt-04',cat:'マネジメント',concept:'監査',difficulty:'標準',
   q:'システム監査人に特に求められる立場として最も適切なのは？',
   options:['監査対象からの独立性','開発担当者と必ず同一人物','営業目標の達成責任','監査対象部署への従属'],a:0,
   exp:'システム監査では、客観的な評価を行うため監査対象からの独立性が重要です。',
   hint:'自分で作ったものを自分だけで監査すると客観性が弱くなります。'},

  // ストラテジ
  {id:'strat-01',cat:'ストラテジ',concept:'損益分岐点',difficulty:'基礎',
   q:'売上高と総費用が等しくなり、利益が0となる売上高を何と呼びますか？',
   options:['損益分岐点売上高','営業利益','限界利益率','固定資産'],a:0,
   exp:'利益がちょうど0になる売上高を損益分岐点売上高と呼びます。',
   hint:'利益がプラスにもマイナスにもならない境目です。'},
  {id:'strat-02',cat:'ストラテジ',concept:'SWOT',difficulty:'基礎',
   q:'SWOT分析で、企業内部の「強み」を表す要素は？',
   options:['Strength','Weakness','Opportunity','Threat'],a:0,
   exp:'SWOTはStrength（強み）、Weakness（弱み）、Opportunity（機会）、Threat（脅威）です。',
   hint:'Sは英語の「強さ」です。'},
  {id:'strat-03',cat:'ストラテジ',concept:'マーケティング',difficulty:'標準',
   q:'市場を顧客の属性やニーズなどで複数のグループに分けることは？',
   options:['セグメンテーション','デバッグ','正規化','スケジューリング'],a:0,
   exp:'セグメンテーションは市場を一定の基準で複数の顧客群に分けることです。',
   hint:'市場を「区分」に分ける考え方です。'},
  {id:'strat-04',cat:'ストラテジ',concept:'知的財産',difficulty:'標準',
   q:'発明を保護する代表的な産業財産権は？',
   options:['特許権','著作権だけ','商号','所有権'],a:0,
   exp:'発明を保護する代表的な権利は特許権です。',
   hint:'新しい技術的アイデア＝発明を保護します。'}
];

function ensureQuestionProfile(){
  if(!profile.qStats) profile.qStats={};
  if(!profile.sessions) profile.sessions=[];
  QUESTION_BANK.forEach(q=>{
    if(!profile.qStats[q.id]){
      profile.qStats[q.id]={
        attempts:0, correct:0, streak:0,
        due:null, last:null, lastReason:null
      };
    }
  });
}
ensureQuestionProfile();
saveProfile();

function localDateISO(offsetDays=0){
  const d=new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()+offsetDays);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function isDue(stat){
  return stat && stat.due && stat.due <= localDateISO(0);
}
function reviewInterval(streak){
  if(streak <= 0) return 1;
  if(streak === 1) return 3;
  if(streak === 2) return 7;
  if(streak === 3) return 14;
  return 30;
}
function shuffled(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function dueQuestions(){
  ensureQuestionProfile();
  return QUESTION_BANK.filter(q=>isDue(profile.qStats[q.id]));
}
function updateDueCount(){
  const e=document.getElementById('dueCount');
  if(e) e.textContent=dueQuestions().length;
}
function categoryWeakness(cat){
  return 100-(profile.skills[cat] ?? 50);
}
function chooseWeakQuestions(n=10){
  const ranked=shuffled(QUESTION_BANK).sort((a,b)=>categoryWeakness(b.cat)-categoryWeakness(a.cat));
  return ranked.slice(0,Math.min(n,ranked.length));
}
function chooseRandomBalanced(n=10){
  const cats=[...new Set(QUESTION_BANK.map(q=>q.cat))];
  let selected=[];
  let pools={};
  cats.forEach(c=>pools[c]=shuffled(QUESTION_BANK.filter(q=>q.cat===c)));
  let ci=0;
  while(selected.length<n && Object.values(pools).some(p=>p.length)){
    const c=cats[ci%cats.length];
    if(pools[c].length) selected.push(pools[c].pop());
    ci++;
  }
  return selected;
}

let quizItems=[];
let quizIndex=0;
let quizSelected=null;
let quizAnswered=false;
let quizCorrectCount=0;
let quizWrongCount=0;
let quizEarnedXp=0;
let quizMode='random';
let quizPickedReason=null;
let sessionLog=[];

const problemHub=document.getElementById('problemHub');
const quizSession=document.getElementById('quizSession');
const quizResultScreen=document.getElementById('quizResultScreen');

function openProblemsHub(){
  if(problemHub) problemHub.style.display='grid';
  if(quizSession) quizSession.style.display='none';
  if(quizResultScreen) quizResultScreen.style.display='none';
  updateDueCount();
  renderRecentHistory();
}

function startQuiz(mode){
  ensureQuestionProfile();
  quizMode=mode;
  if(mode==='review'){
    const due=dueQuestions();
    quizItems=due.length ? shuffled(due).slice(0,10) : chooseWeakQuestions(5);
  }else if(mode==='weak'){
    quizItems=chooseWeakQuestions(10);
  }else{
    quizItems=chooseRandomBalanced(10);
  }
  quizIndex=0;
  quizSelected=null;
  quizAnswered=false;
  quizCorrectCount=0;
  quizWrongCount=0;
  quizEarnedXp=0;
  quizPickedReason=null;
  sessionLog=[];

  problemHub.style.display='none';
  quizResultScreen.style.display='none';
  quizSession.style.display='block';

  const titles={review:'今日の復習',weak:'弱点10問',random:'ランダム10問'};
  document.getElementById('quizSessionTitle').textContent=titles[mode]||'問題演習';
  document.getElementById('quizSessionSub').textContent='FE QUEST オリジナル問題';
  renderQuizQuestion();
}

document.querySelectorAll('.problem-mode button[data-mode]').forEach(b=>{
  b.addEventListener('click',()=>startQuiz(b.dataset.mode));
});

function renderQuizQuestion(){
  const q=quizItems[quizIndex];
  quizSelected=null;
  quizAnswered=false;
  quizPickedReason=null;

  document.getElementById('quizCategory').textContent=`${q.cat}・${q.concept}`;
  document.getElementById('quizDifficulty').textContent=q.difficulty;
  document.getElementById('quizQuestion').textContent=q.q;
  document.getElementById('quizCounter').textContent=`${quizIndex+1} / ${quizItems.length}`;
  document.getElementById('quizProgress').style.width=`${(quizIndex/quizItems.length)*100}%`;
  document.getElementById('quizExplain').classList.remove('show');
  document.getElementById('reasonBox').classList.remove('show');
  document.getElementById('quizSubmit').textContent='回答する';
  document.getElementById('quizSubmit').disabled=false;
  document.getElementById('quizHintBtn').style.display='block';

  document.querySelectorAll('.reason-chip').forEach(c=>c.classList.remove('picked'));

  const opts=document.getElementById('quizOptions');
  opts.innerHTML='';
  q.options.forEach((op,i)=>{
    const b=document.createElement('button');
    b.className='quiz-option';
    b.textContent=`${String.fromCharCode(65+i)}. ${op}`;
    b.addEventListener('click',()=>{
      if(quizAnswered) return;
      quizSelected=i;
      document.querySelectorAll('.quiz-option').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
    });
    opts.appendChild(b);
  });
}

document.getElementById('quizHintBtn')?.addEventListener('click',()=>{
  const q=quizItems[quizIndex];
  popToast(q.hint);
});

document.getElementById('quizSubmit')?.addEventListener('click',()=>{
  if(!quizAnswered){
    if(quizSelected===null){
      popToast('選択肢を1つ選んでください');
      return;
    }
    gradeCurrentQuestion();
  }else{
    if(quizIndex < quizItems.length-1){
      quizIndex++;
      renderQuizQuestion();
    }else{
      finishQuizSession();
    }
  }
});

function gradeCurrentQuestion(){
  const q=quizItems[quizIndex];
  const ok=quizSelected===q.a;
  quizAnswered=true;

  document.querySelectorAll('.quiz-option').forEach((b,i)=>{
    b.disabled=true;
    b.classList.remove('selected');
    if(i===q.a) b.classList.add('correct');
    else if(i===quizSelected && !ok) b.classList.add('wrong');
  });

  const title=document.getElementById('quizResultTitle');
  title.textContent=ok?'⭕ 正解！':'❌ 不正解';
  document.getElementById('quizExplanation').textContent=q.exp;
  document.getElementById('quizHint').textContent=`覚え方：${q.hint}`;
  document.getElementById('quizExplain').classList.add('show');
  document.getElementById('quizHintBtn').style.display='none';

  if(ok){
    quizCorrectCount++;
    quizEarnedXp+=10;
  }else{
    quizWrongCount++;
    document.getElementById('reasonBox').classList.add('show');
  }

  const st=profile.qStats[q.id];
  st.attempts++;
  st.last=localDateISO(0);
  if(ok){
    st.correct++;
    st.streak=(st.streak||0)+1;
    st.due=localDateISO(reviewInterval(st.streak));
    profile.skills[q.cat]=clamp((profile.skills[q.cat]||50)+1,0,100);
  }else{
    st.streak=0;
    st.due=localDateISO(1);
    profile.skills[q.cat]=clamp((profile.skills[q.cat]||50)-2,0,100);
  }

  sessionLog.push({id:q.id,cat:q.cat,concept:q.concept,ok});
  profile.xp += ok ? 10 : 2;
  saveProfile();

  document.getElementById('quizSubmit').textContent=
    quizIndex===quizItems.length-1 ? '結果を見る' : '次の問題 →';
  document.getElementById('quizProgress').style.width=`${((quizIndex+1)/quizItems.length)*100}%`;
}

document.querySelectorAll('.reason-chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    document.querySelectorAll('.reason-chip').forEach(c=>c.classList.remove('picked'));
    chip.classList.add('picked');
    quizPickedReason=chip.dataset.reason;
    const q=quizItems[quizIndex];
    if(profile.qStats[q.id]){
      profile.qStats[q.id].lastReason=quizPickedReason;
      saveProfile();
    }
  });
});

function finishQuizSession(){
  const total=quizItems.length;
  const rate=total?Math.round(quizCorrectCount/total*100):0;
  profile.sessions.unshift({
    date:localDateISO(0),
    mode:quizMode,
    total,
    correct:quizCorrectCount,
    rate,
    log:sessionLog.slice(0,10)
  });
  profile.sessions=profile.sessions.slice(0,20);
  profile.lastStudyDate=localDateISO(0);
  saveProfile();

  quizSession.style.display='none';
  quizResultScreen.style.display='block';

  document.getElementById('sessionScore').textContent=`${rate}%`;
  document.getElementById('sessionCorrect').textContent=quizCorrectCount;
  document.getElementById('sessionWrong').textContent=quizWrongCount;
  document.getElementById('sessionXp').textContent=`+${quizCorrectCount*10 + quizWrongCount*2}`;

  let comment='いい復習になりました。';
  if(rate>=90) comment='かなり安定しています！次は少し難しい問題へ進めます。';
  else if(rate>=70) comment='合格圏を意識できる良い出来です。間違えた問題を復習しましょう。';
  else if(rate>=50) comment='理解は進んでいます。苦手分野をもう一周すると伸びます。';
  else comment='今は弱点を発見できたことが収穫です。明日の復習に自動で回します。';
  document.getElementById('sessionComment').textContent=comment;

  const wrongCats={};
  sessionLog.filter(x=>!x.ok).forEach(x=>wrongCats[x.cat]=(wrongCats[x.cat]||0)+1);
  const topWrong=Object.entries(wrongCats).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);
  document.getElementById('sessionAdvice').textContent=
    topWrong.length
      ? `今回の要復習は「${topWrong.join('・')}」。不正解問題は明日以降の復習キューへ入りました。`
      : '全問正解です。正解した問題も忘却を防ぐため、数日後に再出題されます。';

  renderRecentHistory();
  updateDueCount();
}

document.getElementById('sessionHome')?.addEventListener('click',openProblemsHub);
document.getElementById('quitQuiz')?.addEventListener('click',()=>{
  if(confirm('この演習を終了して問題一覧へ戻りますか？')) openProblemsHub();
});

function renderRecentHistory(){
  const root=document.getElementById('recentHistory');
  if(!root) return;
  ensureQuestionProfile();

  const sessions=(profile.sessions||[]).slice(0,4);
  if(!sessions.length){
    root.innerHTML='<div class="sub">まだ演習履歴がありません。</div>';
    return;
  }
  root.innerHTML='';
  const names={review:'今日の復習',weak:'弱点10問',random:'ランダム10問'};
  sessions.forEach(s=>{
    const row=document.createElement('div');
    row.className='history-row';
    const good=s.rate>=70;
    row.innerHTML=`
      <div class="history-mark ${good?'ok':'ng'}">${good?'✓':'!'}</div>
      <div class="history-text">
        <div class="history-title">${names[s.mode]||'問題演習'}・${s.rate}%</div>
        <div class="history-sub">${s.date}　${s.correct}/${s.total}問正解</div>
      </div>
    `;
    root.appendChild(row);
  });
}

// Integrate review count with profile refresh.
const _refreshProfileUI_v5 = refreshProfileUI;
refreshProfileUI = function(){
  _refreshProfileUI_v5();
  ensureQuestionProfile();
  updateDueCount();
  renderRecentHistory();
};
refreshProfileUI();
openProblemsHub();



// ===== v6: Interactive lesson engine =====
const LESSONS = {
  binary:{
    title:'2進数を触って理解', cat:'基礎理論', skill:'基礎理論',
    pages:[
      {
        headline:'2進数は「ON / OFF」の組合せ',
        copy:'右から 1、2、4、8… と桁の重みが2倍ずつ増えます。まずは4ビットだけで考えましょう。',
        render:()=>`
          <div style="text-align:center;font-size:44px">💡</div>
          <div class="bit-board">
            ${[8,4,2,1].map(w=>`<div class="bit-col"><div class="bit-weight">${w}</div><button class="bit-toggle" disabled>0</button></div>`).join('')}
          </div>
          <div class="lesson-copy">0はOFF、1はON。ONになった桁の重みを足すと10進数になります。</div>`
      },
      {
        headline:'13を作ってみましょう',
        copy:'8・4・2・1のスイッチを押して、合計を13にしてください。',
        interactive:'binary13'
      },
      {
        headline:'13 = 8 + 4 + 1',
        copy:'8・4・1をON、2をOFFにすると 1101 になります。桁そのものより「重みの合計」と考えると理解しやすくなります。',
        render:()=>`
          <div class="bit-board">
            ${[[8,1],[4,1],[2,0],[1,1]].map(([w,b])=>`<div class="bit-col"><div class="bit-weight">${w}</div><button class="bit-toggle ${b?'on':''}" disabled>${b}</button></div>`).join('')}
          </div>
          <div class="binary-total">1101₂ = 13₁₀</div>`
      },
      {
        headline:'ミニチェック',
        copy:'2進数 1011 を10進数にすると？',
        quiz:{options:['9','10','11','13'],answer:2,explain:'8 + 2 + 1 = 11 なので、1011₂ = 11₁₀ です。'}
      }
    ]
  },

  cpu:{
    title:'CPUの命令サイクル', cat:'コンピュータ', skill:'コンピュータ',
    pages:[
      {
        headline:'CPUは命令を順番に処理する',
        copy:'基本の流れは「命令を取ってくる → 意味を読み解く → 実行する」です。',
        render:()=>cpuFlow(0)
      },
      {
        headline:'Fetch → Decode → Execute',
        copy:'「1 STEP」を押して命令を進めてください。',
        interactive:'cpuCycle'
      },
      {
        headline:'なぜ順番が大切？',
        copy:'命令を手元に取り込まなければ解読できず、解読しなければ何を実行すべきか分かりません。',
        render:()=>cpuFlow(3)
      },
      {
        headline:'ミニチェック',
        copy:'命令サイクルの基本的な順番として正しいものは？',
        quiz:{options:['Execute → Decode → Fetch','Fetch → Decode → Execute','Decode → Execute → Fetch','Fetch → Execute → Decode'],answer:1,explain:'基本は Fetch（取出し）→ Decode（解読）→ Execute（実行）です。'}
      }
    ]
  },

  transaction:{
    title:'トランザクション', cat:'データベース', skill:'データベース',
    pages:[
      {
        headline:'振込は「2つで1セット」',
        copy:'A口座から1,000円減らし、B口座へ1,000円増やす。この2処理は途中で片方だけ残ると困ります。',
        render:()=>bankView(10000,5000,'まだ処理していません。')
      },
      {
        headline:'途中で失敗したら？',
        copy:'まずA口座だけ減額した状態を作ります。その後ROLLBACKして元へ戻してみましょう。',
        interactive:'transaction'
      },
      {
        headline:'原子性：全部か、何もなかったことにする',
        copy:'トランザクションでは一連の処理をひとまとまりとして扱います。成功ならCOMMIT、失敗ならROLLBACKします。',
        render:()=>bankView(9000,6000,'COMMIT → 両方の変更を確定')
      },
      {
        headline:'ミニチェック',
        copy:'処理途中で失敗し、一連の変更を取り消す操作は？',
        quiz:{options:['COMMIT','ROLLBACK','SELECT','GRANT'],answer:1,explain:'ROLLBACKはトランザクションの変更を取り消し、処理前の状態へ戻します。'}
      }
    ]
  },

  subnet:{
    title:'/24 サブネット入門', cat:'ネットワーク', skill:'ネットワーク',
    pages:[
      {
        headline:'/24なら前の3オクテットがネットワーク部',
        copy:'IPv4は32ビットです。/24は先頭24ビットがネットワーク部なので、10進表記では前3つのオクテットに相当します。',
        render:()=>ipView([192,168,10,25],3)
      },
      {
        headline:'ネットワークアドレスを作る',
        copy:'ホスト部を0にするとネットワークアドレスになります。「ホスト部を0にする」を押してください。',
        interactive:'subnet'
      },
      {
        headline:'192.168.10.25/24 → 192.168.10.0',
        copy:'前3オクテットはそのまま、最後のホスト部だけ0にします。',
        render:()=>ipView([192,168,10,0],3)
      },
      {
        headline:'ミニチェック',
        copy:'10.20.30.77/24 のネットワークアドレスは？',
        quiz:{options:['10.20.30.0','10.20.0.0','10.20.30.77','10.20.30.255'],answer:0,explain:'/24では最後の1オクテットがホスト部です。そこを0にするため10.20.30.0です。'}
      }
    ]
  },

  crypto:{
    title:'公開鍵暗号', cat:'セキュリティ', skill:'セキュリティ',
    pages:[
      {
        headline:'鍵は2本で1組',
        copy:'公開鍵は他人に渡してよい鍵、秘密鍵は本人だけが厳重に持つ鍵です。',
        render:()=>cryptoView(0)
      },
      {
        headline:'秘密のメッセージを送ってみる',
        copy:'受信者の公開鍵で暗号化し、その受信者の秘密鍵で復号する流れを進めてください。',
        interactive:'crypto'
      },
      {
        headline:'暗号化：公開鍵 ／ 復号：秘密鍵',
        copy:'「誰でも暗号化できるが、対応する秘密鍵を持つ受信者だけが読める」という形になります。',
        render:()=>cryptoView(3)
      },
      {
        headline:'ミニチェック',
        copy:'受信者だけが読めるように暗号化するとき、暗号化に使う鍵は？',
        quiz:{options:['送信者の秘密鍵','受信者の公開鍵','受信者の秘密鍵','送信者の公開鍵'],answer:1,explain:'受信者の公開鍵で暗号化し、対応する受信者の秘密鍵で復号します。'}
      }
    ]
  },

  binarysearch:{
    title:'二分探索', cat:'アルゴリズム', skill:'アルゴリズム',
    pages:[
      {
        headline:'「半分を捨てる」探索',
        copy:'整列済みのデータの中央を確認し、目的値が大きいか小さいかで不要な半分を捨てます。',
        render:()=>searchView(false)
      },
      {
        headline:'37を探しましょう',
        copy:'中央の23と比較しました。37は23より大きいので、次に残す範囲は？',
        interactive:'binarysearch'
      },
      {
        headline:'探索範囲が一気に半分へ',
        copy:'線形探索のように先頭から全部を見るのではなく、比較するたびに探索範囲を大きく減らせます。',
        render:()=>searchView(true)
      },
      {
        headline:'ミニチェック',
        copy:'二分探索をそのまま利用するために重要な条件は？',
        quiz:{options:['データが整列されている','必ず重複がある','データ数が偶数','文字列だけである'],answer:0,explain:'中央との大小比較で半分を捨てるため、探索対象が順序付けされていることが重要です。'}
      }
    ]
  }
};

function cpuFlow(active){
  const labels=[['📥','FETCH','命令を取り出す'],['🧠','DECODE','命令を解読'],['⚡','EXECUTE','命令を実行']];
  return `<div class="cpu-flow">${
    labels.map((x,i)=>`${i?'<div class="cpu-arrow">→</div>':''}<div class="cpu-box ${active===i+1||active===3?'active':''}"><div style="font-size:30px">${x[0]}</div><div>${x[1]}</div><div class="sub">${x[2]}</div></div>`).join('')
  }</div>`;
}
function bankView(a,b,log){
  return `<div class="bank-grid">
    <div class="account"><div>A口座</div><div class="account-money">¥${a.toLocaleString()}</div></div>
    <div class="transfer-arrow">→</div>
    <div class="account"><div>B口座</div><div class="account-money">¥${b.toLocaleString()}</div></div>
  </div><div class="txn-log">${log}</div>`;
}
function ipView(nums,netCount){
  return `<div class="ip-row">${nums.map((n,i)=>`<div class="octet ${i<netCount?'net':'host'}">${n}</div>`).join('<b>.</b>')}</div>
  <div class="subnet-legend"><span><i class="legend-dot" style="background:#1cb0f6"></i>ネットワーク部</span><span><i class="legend-dot" style="background:#ffc800"></i>ホスト部</span></div>`;
}
function cryptoView(active){
  return `<div class="crypto-flow">
    <div class="crypto-card ${active>=1?'active':''}"><div class="crypto-icon">✉️</div><b>HELLO</b><div class="sub">平文</div></div>
    <div aria-hidden="true" class="cpu-arrow">→</div>
    <div class="crypto-card ${active>=2?'active':''}"><div class="crypto-icon">🔒</div><b>受信者の公開鍵</b><div class="sub">暗号化</div></div>
    <div aria-hidden="true" class="cpu-arrow">→</div>
    <div class="crypto-card ${active>=3?'active':''}"><div class="crypto-icon">🔑</div><b>受信者の秘密鍵</b><div class="sub">復号してHELLO</div></div>
  </div>`;
}
function searchView(discarded){
  const vals=[3,8,15,23,37,42,61];
  return `<div style="text-align:center;font-weight:900">目的値：37</div>
  <div class="search-array">${vals.map((v,i)=>`<div class="search-cell ${i===3?'mid':''} ${i===4?'target':''} ${discarded&&i<=3?'gone':''}">${v}</div>`).join('')}</div>
  <div class="lesson-copy">${discarded?'23以下を探索対象から外しました。':'中央は23です。37と比べます。'}</div>`;
}

if(!profile.lessonProgress) profile.lessonProgress={};
Object.keys(LESSONS).forEach(id=>{
  if(profile.lessonProgress[id]===undefined) profile.lessonProgress[id]=0;
});
saveProfile();

let activeLesson='binary';
let lessonStep=0;
let lessonInteractiveDone=false;
let lessonQuizDone=false;
let cpuStep=0;
let txnState=0;
let cryptoStep=0;

function updateCourseUI(){
  Object.keys(LESSONS).forEach(id=>{
    const pct=profile.lessonProgress?.[id]||0;
    document.querySelectorAll(`[data-lp="${id}"]`).forEach(e=>e.style.width=pct+'%');
    document.querySelectorAll(`[data-lpt="${id}"]`).forEach(e=>e.textContent=pct+'%');
  });
  const vals=Object.keys(LESSONS).map(id=>profile.lessonProgress?.[id]||0);
  const avg=Math.round(vals.reduce((a,b)=>a+b,0)/(vals.length||1));
  const cp=document.getElementById('coursePercent');
  if(cp) cp.textContent=avg+'%';
}
updateCourseUI();

document.querySelectorAll('.lesson-open[data-lesson]').forEach(btn=>{
  btn.addEventListener('click',()=>startLesson(btn.dataset.lesson));
});
document.getElementById('mapTrace')?.addEventListener('click',()=>showScreen('trace'));

function startLesson(id){
  if(!LESSONS[id]) return;
  activeLesson=id;
  lessonStep=0;
  resetLessonState();
  showScreen('lesson');
  renderLesson();
}
function resetLessonState(){
  lessonInteractiveDone=false;
  lessonQuizDone=false;
  cpuStep=0;txnState=0;cryptoStep=0;
}
function renderLesson(){
  const lesson=LESSONS[activeLesson];
  const page=lesson.pages[lessonStep];
  document.getElementById('lessonTitle').textContent=lesson.title;
  document.getElementById('lessonCategory').textContent=`${lesson.cat}・FE QUEST ORIGINAL LESSON`;
  document.getElementById('lessonHeadline').textContent=page.headline;
  document.getElementById('lessonCopy').textContent=page.copy;
  document.getElementById('lessonStepLabel').textContent=`${lessonStep+1} / ${lesson.pages.length}`;
  document.querySelectorAll('#lessonDots span').forEach((s,i)=>s.classList.toggle('on',i<=lessonStep));
  const check=document.getElementById('lessonCheck');
  check.className='lesson-check';
  check.innerHTML='';

  const stage=document.getElementById('lessonStage');
  stage.innerHTML='';
  lessonInteractiveDone=!page.interactive && !page.quiz;
  lessonQuizDone=!page.quiz;

  if(page.render) stage.innerHTML=page.render();
  if(page.interactive) renderInteractive(page.interactive,stage);
  if(page.quiz) renderLessonQuiz(page.quiz,stage);

  document.getElementById('lessonPrev').disabled=lessonStep===0;
  const next=document.getElementById('lessonNext');
  if(lessonStep===lesson.pages.length-1){
    next.textContent='レッスン完了 ✨';
  }else{
    next.textContent='次へ →';
  }
}
function showLessonFeedback(msg,bad=false){
  const c=document.getElementById('lessonCheck');
  c.className='lesson-check show'+(bad?' bad':'');
  c.innerHTML=msg;
}

function renderInteractive(type,stage){
  if(type==='binary13'){
    stage.innerHTML=`<div style="text-align:center;font-weight:900">目標：13</div>
      <div class="bit-board" id="bitBoard">${[8,4,2,1].map(w=>`<div class="bit-col"><div class="bit-weight">${w}</div><button class="bit-toggle" data-weight="${w}">0</button></div>`).join('')}</div>
      <div class="binary-total">合計 <span id="bitTotal">0</span></div>`;
    let total=0;
    stage.querySelectorAll('.bit-toggle').forEach(b=>{
      b.addEventListener('click',()=>{
        b.classList.toggle('on');
        b.textContent=b.classList.contains('on')?'1':'0';
        total=[...stage.querySelectorAll('.bit-toggle.on')].reduce((s,x)=>s+Number(x.dataset.weight),0);
        document.getElementById('bitTotal').textContent=total;
        if(total===13){
          lessonInteractiveDone=true;
          showLessonFeedback('🎉 できました！ 8 + 4 + 1 = 13、つまり <b>1101₂</b> です。');
        }
      });
    });
  }

  if(type==='cpuCycle'){
    stage.innerHTML=`<div id="cpuDynamic">${cpuFlow(0)}</div><div class="cpu-action"><button class="purple-btn" id="cpuStepBtn">▶ 1 STEP</button></div>`;
    document.getElementById('cpuStepBtn').addEventListener('click',()=>{
      cpuStep=Math.min(3,cpuStep+1);
      document.getElementById('cpuDynamic').innerHTML=cpuFlow(cpuStep);
      const names=['','Fetch：命令を取り出しました。','Decode：命令の意味を解読しました。','Execute：命令を実行しました。'];
      showLessonFeedback(names[cpuStep]);
      if(cpuStep===3){
        lessonInteractiveDone=true;
        document.getElementById('cpuStepBtn').textContent='✓ 完了';
      }
    });
  }

  if(type==='transaction'){
    stage.innerHTML=`<div id="bankDynamic">${bankView(10000,5000,'開始前：A=10,000 / B=5,000')}</div>
      <div class="txn-buttons"><button class="secondary" id="txnWithdraw">① Aから1,000円減額</button><button class="purple-btn" id="txnRollback" disabled>② ROLLBACK</button></div>`;
    document.getElementById('txnWithdraw').addEventListener('click',()=>{
      txnState=1;
      document.getElementById('bankDynamic').innerHTML=bankView(9000,5000,'⚠ Aだけ減額。ここで障害が発生！');
      document.getElementById('txnWithdraw').disabled=true;
      document.getElementById('txnRollback').disabled=false;
      showLessonFeedback('B口座への加算前に障害が起きました。このままだと1,000円が消えてしまいます。',true);
    });
    document.getElementById('txnRollback').addEventListener('click',()=>{
      txnState=2;
      document.getElementById('bankDynamic').innerHTML=bankView(10000,5000,'ROLLBACK → 処理前の状態へ復元');
      document.getElementById('txnRollback').disabled=true;
      lessonInteractiveDone=true;
      showLessonFeedback('✅ ROLLBACKでA口座も元に戻りました。「途中だけ反映」を残さないのが重要です。');
    });
  }

  if(type==='subnet'){
    stage.innerHTML=`<div id="subnetDynamic">${ipView([192,168,10,25],3)}</div>
      <div style="text-align:center;margin-top:18px"><button class="purple-btn" id="zeroHost">ホスト部を0にする</button></div>`;
    document.getElementById('zeroHost').addEventListener('click',()=>{
      document.getElementById('subnetDynamic').innerHTML=ipView([192,168,10,0],3);
      document.getElementById('zeroHost').disabled=true;
      lessonInteractiveDone=true;
      showLessonFeedback('✅ ネットワークアドレスは <b>192.168.10.0</b> です。');
    });
  }

  if(type==='crypto'){
    stage.innerHTML=`<div id="cryptoDynamic">${cryptoView(0)}</div><div class="crypto-actions"><button class="purple-btn" id="cryptoStepBtn">🔒 公開鍵で暗号化</button></div>`;
    document.getElementById('cryptoStepBtn').addEventListener('click',()=>{
      cryptoStep++;
      if(cryptoStep===1){
        document.getElementById('cryptoDynamic').innerHTML=cryptoView(2);
        document.getElementById('cryptoStepBtn').textContent='🔑 秘密鍵で復号';
        showLessonFeedback('暗号文になりました。公開鍵を持っていても、同じ鍵では復号できません。');
      }else{
        document.getElementById('cryptoDynamic').innerHTML=cryptoView(3);
        document.getElementById('cryptoStepBtn').disabled=true;
        document.getElementById('cryptoStepBtn').textContent='✓ 復号完了';
        lessonInteractiveDone=true;
        showLessonFeedback('✅ 対応する受信者の秘密鍵で元のメッセージを復号できました。');
      }
    });
  }

  if(type==='binarysearch'){
    stage.innerHTML=`${searchView(false)}
      <div class="micro-options"><button class="micro-option" data-side="left">← 左側を残す</button><button class="micro-option" data-side="right">右側を残す →</button></div>`;
    stage.querySelectorAll('.micro-option').forEach(b=>{
      b.addEventListener('click',()=>{
        if(b.dataset.side==='right'){
          b.classList.add('good');
          lessonInteractiveDone=true;
          stage.querySelector('.search-array').innerHTML=[3,8,15,23,37,42,61].map((v,i)=>`<div class="search-cell ${i===3?'mid':''} ${i===4?'target':''} ${i<=3?'gone':''}">${v}</div>`).join('');
          showLessonFeedback('🎉 正解！ 37 > 23 なので、左半分を捨てて右側を残します。');
        }else{
          b.classList.add('bad');
          showLessonFeedback('💡 37は23より大きいですね。大きい値が並んでいる側を残します。',true);
          setTimeout(()=>b.classList.remove('bad'),900);
        }
      });
    });
  }
}

function renderLessonQuiz(quiz,stage){
  stage.innerHTML=`<div class="micro-options" id="lessonQuizOptions">${quiz.options.map((o,i)=>`<button class="micro-option" data-i="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}</div>`;
  stage.querySelectorAll('.micro-option').forEach(b=>{
    b.addEventListener('click',()=>{
      if(lessonQuizDone) return;
      const i=Number(b.dataset.i);
      if(i===quiz.answer){
        b.classList.add('good');
        lessonQuizDone=true;
        lessonInteractiveDone=true;
        stage.querySelectorAll('.micro-option').forEach(x=>x.disabled=true);
        showLessonFeedback('⭕ 正解！ '+quiz.explain);
      }else{
        b.classList.add('bad');
        showLessonFeedback('もう一度考えてみましょう。',true);
        setTimeout(()=>b.classList.remove('bad'),800);
      }
    });
  });
}

document.getElementById('lessonPrev')?.addEventListener('click',()=>{
  if(lessonStep>0){lessonStep--;resetLessonState();renderLesson();}
});
document.getElementById('lessonNext')?.addEventListener('click',()=>{
  const lesson=LESSONS[activeLesson];
  const page=lesson.pages[lessonStep];
  if((page.interactive||page.quiz) && !lessonInteractiveDone){
    popToast('このステップをクリアしてから進みましょう');
    return;
  }
  if(lessonStep<lesson.pages.length-1){
    lessonStep++;
    resetLessonState();
    renderLesson();
  }else{
    completeLesson();
  }
});
function completeLesson(){
  const lesson=LESSONS[activeLesson];
  const old=profile.lessonProgress[activeLesson]||0;
  profile.lessonProgress[activeLesson]=100;
  profile.skills[lesson.skill]=clamp((profile.skills[lesson.skill]||50)+(old<100?3:1),0,100);
  profile.xp += old<100?50:15;
  saveProfile();
  updateCourseUI();

  document.getElementById('lessonHeadline').textContent='LESSON COMPLETE!';
  document.getElementById('lessonCopy').textContent='今日の理解を、問題演習と数日後の復習で定着させます。';
  document.getElementById('lessonStage').innerHTML=`
    <div class="lesson-complete">
      <div class="lesson-complete-icon">🏆</div>
      <h2>${lesson.title} クリア</h2>
      <div class="lesson-complete-xp">+${old<100?50:15} XP</div>
      <span class="mastery-change">${lesson.skill} 習熟度 UP</span>
    </div>`;
  document.getElementById('lessonCheck').className='lesson-check';
  document.getElementById('lessonPrev').style.display='none';
  document.getElementById('lessonStepLabel').textContent='完了';
  const next=document.getElementById('lessonNext');
  next.textContent='学習マップへ';
  const fresh=next.cloneNode(true);
  next.parentNode.replaceChild(fresh,next);
  fresh.addEventListener('click',()=>{
    document.getElementById('lessonPrev').style.display='';
    // restore next button listener by reloading app state through map; next lesson start will rerender.
    showScreen('map');
    location.reload();
  });
}

// Home main quest starts the weakest matching implemented lesson.
document.getElementById('startQuest')?.addEventListener('click',()=>{
  const weak=sortedSkills()[0]?.[0]||'アルゴリズム';
  const map={
    '基礎理論':'binary',
    'コンピュータ':'cpu',
    'データベース':'transaction',
    'ネットワーク':'subnet',
    'セキュリティ':'crypto',
    'アルゴリズム':'binarysearch'
  };
  startLesson(map[weak]||'binarysearch');
});


// ===== PWA support =====
let deferredInstallPrompt = null;
const installCard = document.getElementById('installCard');
const installPwaBtn = document.getElementById('installPwaBtn');
const pwaModal = document.getElementById('pwaModal');
const closePwaModal = document.getElementById('closePwaModal');
const offlinePill = document.getElementById('offlinePill');

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function refreshInstallCard(){
  if(isStandalone() && installCard) installCard.classList.add('hidden');
}
refreshInstallCard();

window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
});

if(installPwaBtn){
  installPwaBtn.addEventListener('click', async ()=>{
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      refreshInstallCard();
      return;
    }
    pwaModal.classList.add('open');
  });
}
if(closePwaModal) closePwaModal.addEventListener('click',()=>pwaModal.classList.remove('open'));
if(pwaModal) pwaModal.addEventListener('click',(e)=>{
  if(e.target === pwaModal) pwaModal.classList.remove('open');
});

function updateOnlineState(){
  if(!offlinePill) return;
  offlinePill.classList.toggle('show', !navigator.onLine);
}
window.addEventListener('online',updateOnlineState);
window.addEventListener('offline',updateOnlineState);
updateOnlineState();

if('serviceWorker' in navigator && location.protocol !== 'file:'){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js').catch(err=>{
      console.warn('Service Worker registration failed:', err);
    });
  });
}

