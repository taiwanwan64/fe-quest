// FE QUEST v371: paging map and demand-page replacement diagram.

function pagingDiagramModelV371(){
  const before=[1,3,0],requested=2,victimFrame=0;
  const after=before.slice();
  after[victimFrame]=requested;
  return {pageCount:4,before,after,requested,victimFrame,victim:before[victimFrame]};
}

function coreTopicPagingDiagramViewV371(id){
  if(id!=='core_06_01')return '';
  const model=pagingDiagramModelV371();
  const panel=(phase,title,frames)=>{
    const rows=Array.from({length:model.pageCount},(_,page)=>{
      const frame=frames.indexOf(page),present=frame>=0;
      return `<tr data-page="${page}" data-frame="${present?frame:'absent'}" class="${page===model.requested?'is-requested':''}"><th scope="row">ページ${page}</th><td>${present?'枠'+frame:'主記憶にない'}</td></tr>`;
    }).join('');
    const slots=frames.map((page,frame)=>`<li data-frame="${frame}" data-page="${page}" class="${frame===model.victimFrame?'is-changed':''}"><span>枠${frame}</span><b>ページ${page}</b></li>`).join('');
    return `<section class="paging-panel-v371" data-paging-phase="${phase}" aria-labelledby="paging${phase}V371">
      <h3 id="paging${phase}V371">${title}</h3>
      <table class="paging-table-v371"><caption>ページ表の対応（簡略図）</caption><thead><tr><th scope="col">仮想ページ</th><th scope="col">主記憶の枠</th></tr></thead><tbody>${rows}</tbody></table>
      <h4>主記憶の中身</h4><ol class="paging-frames-v371" aria-label="${title}の主記憶。枠番号順">${slots}</ol>
      <p class="paging-panel-note-v371">${phase==='before'?'ページ2は補助記憶にあり、まだ主記憶にはありません。':'枠0がページ1からページ2へ。ほかの枠は同じです。'}</p>
    </section>`;
  };
  return `<figure class="paging-figure-v371" aria-labelledby="pagingCaptionV371" data-paging-diagram="core">
    <figcaption id="pagingCaptionV371"><span>図で確認</span><b>ページと主記憶の対応</b></figcaption>
    <p class="paging-lead-v371">仮想記憶を固定長の「ページ」に分け、主記憶の同じ大きさの枠（フレーム）に対応させます。</p>
    <p class="paging-premise-v371">この例は仮想ページ4枚・主記憶3枠。ページ2を参照し、枠0のページ1を置き換えます。置換対象は例として指定しています。</p>
    <div class="paging-panels-v371" role="group" aria-label="ページ2の読込み前と読込み後の比較">
      ${panel('before','読込み前',model.before)}
      ${panel('after','読込み後',model.after)}
    </div>
    <p class="paging-map-note-v371"><b>ページ番号と枠番号は別</b><span>ページ0は枠2にあります。ページ表を使うため、仮想ページ順に主記憶へ並べる必要はありません。</span></p>
    <h3 class="paging-flow-title-v371">主記憶にないときの流れ</h3>
    <ol class="paging-flow-v371" aria-label="ページフォールトから参照再開まで">
      <li data-paging-step="fault"><b>1</b><div><strong>ページ2を参照 → ページフォールト</strong><p>主記憶にないことを検出し、OSが必要なページを用意します。</p></div></li>
      <li data-paging-step="replace"><b>2</b><div><strong>空き枠がないので、枠0を空ける</strong><p>この例ではページ1が置換対象です。保存先へ未反映の変更があれば、先に補助記憶へ書き戻します。</p></div></li>
      <li data-paging-step="load"><b>3</b><div><strong>補助記憶のページ2 → 主記憶の枠0</strong><p>必要なページを読み込みます。補助記憶からの読込みをページインといいます。</p></div></li>
      <li data-paging-step="resume"><b>4</b><div><strong>ページ表を更新し、参照を再開</strong><p>ページ1は「主記憶にない」、ページ2は「枠0」へ。ページ内の位置は変えずに対応付けます。</p></div></li>
    </ol>
    <p class="paging-takeaway-v371"><b>主記憶の容量が増えるわけではない</b><span>読込み後も3枠のままです。空き枠があれば置換は不要です。入替えが頻発し、処理より入替えに時間を取られる状態をスラッシングといいます。</span></p>
  </figure>`;
}
