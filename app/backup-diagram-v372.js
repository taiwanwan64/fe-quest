// FE QUEST v372: backup scope and restore-chain comparison.

function backupDiagramModelV372(){
  const days=['日','月','火','水','木'];
  const additions=[['元'],['A'],['B'],['C'],['D']];
  const definitions=[
    {mode:'full',name:'フル',rule:'毎回、対象全体を保存',restore:[4]},
    {mode:'differential',name:'差分',rule:'直近フル以降の変更を保存',restore:[0,4]},
    {mode:'incremental',name:'増分',rule:'直前の保存以降の変更を保存',restore:[0,1,2,3,4]}
  ];
  const methods=definitions.map(method=>({...method,rows:days.map((day,i)=>({
    day,
    kind:i===0?'フル':method.name,
    data:method.mode==='full'||i===0?additions.slice(0,i+1).flat():method.mode==='differential'?additions.slice(1,i+1).flat():additions[i].slice()
  }))}));
  return {days,additions,methods};
}

function backupDiagramViewV372(mode='compare'){
  const model=backupDiagramModelV372();
  const overview=mode==='overview';
  const methods=mode==='incremental'||mode==='differential'?model.methods.filter(m=>m.mode===mode):model.methods;
  const tokens=data=>data.map(x=>`<span class="backup-token-v372 ${x==='元'?'is-base':''}" data-backup-data="${x}">${x}</span>`).join('');
  const caption=overview?'データの変化を追う':'保存と復元を比べる';
  const timeline=model.days.map((day,i)=>`<li><b>${day}曜</b><span>${i===0?'元データ':'追加 '+model.additions[i][0]}</span></li>`).join('');
  const cards=methods.map(method=>`<section class="backup-method-v372" data-backup-method="${method.mode}" aria-labelledby="backupMethod${method.mode}V372">
    <h3 id="backupMethod${method.mode}V372">${method.name}</h3><p class="backup-rule-v372">${method.rule}</p>
    <h4>各日に保存する範囲</h4>
    <ol class="backup-saves-v372" aria-label="${method.name}方式の保存範囲">${method.rows.map((row,i)=>`<li data-backup-day="${i}"><b>${row.day}曜</b><div aria-label="${row.data.join('、')}を保存">${tokens(row.data)}</div></li>`).join('')}</ol>
    <div class="backup-restore-v372"><h4>木曜終了時へ復元</h4><ol aria-label="${method.name}方式の復元順">${method.restore.map((index,step)=>`<li data-restore-day="${index}"><b>${step+1}</b><span>${model.days[index]}曜の${method.rows[index].kind}</span></li>`).join('')}</ol></div>
    <p class="backup-result-v372">${method.mode==='full'?'木曜のフルだけで復元できます。':method.mode==='differential'?'日曜のフル＋木曜の差分。月〜水の差分は使いません。':'日曜のフル＋月〜木の増分を順番に適用します。'}</p>
  </section>`).join('');
  return `<figure class="backup-figure-v372" aria-labelledby="backupCaptionV372" data-backup-diagram="${overview?'overview':mode}">
    <figcaption id="backupCaptionV372"><span>図で確認</span><b>${caption}</b></figcaption>
    <p class="backup-lead-v372">日曜のデータを「元」、月〜木に追加する別々のデータをA〜Dとします。各日の終了時に保存します。</p>
    <ol class="backup-timeline-v372" aria-label="日曜の元データに、月曜から木曜にA、B、C、Dを追加">${timeline}</ol>
    ${overview?'':`<p class="backup-premise-v372">3方式は別々に実施する例です。差分・増分も、日曜はフルから始めます。ブロックはデータの範囲を示し、容量の比率ではありません。</p>
    <div class="backup-methods-v372 ${methods.length===1?'is-single':''}" role="group" aria-label="保存範囲と復元手順の比較">${cards}</div>
    <p class="backup-takeaway-v372"><b>保存の基準と復元の組合せをセットで</b><span>差分は「直近のフル」、増分は「直前のバックアップ」が基準です。増分は必要な途中の世代を失うと、そこから先を正しく復元できなくなることがあります。取得後は復元テストも行います。</span></p>`}
  </figure>`;
}

function coreTopicBackupDiagramViewV372(id){
  if(id!=='core_06_03')return '';
  return backupDiagramViewV372('compare');
}
