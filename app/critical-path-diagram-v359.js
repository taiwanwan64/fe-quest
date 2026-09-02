function coreTopicCriticalPathDiagramViewV359(id){
  if(id!=='core_14_04') return '';
  return `<figure class="core-critical-path-v359" aria-labelledby="coreCriticalPathCaptionV359">
    <figcaption id="coreCriticalPathCaptionV359">最も長い経路が、全体の日数を決める</figcaption>
    <p class="core-cp-lead-v359">経路Aと経路Bを同時に開始し、<b>両方の作業が終わったら完了</b>する例です。どちらか一方を選ぶのではありません。</p>

    <div class="core-cp-network-v359">
      <div class="core-cp-start-v359"><b>開始</b><span>0日目・2経路を並行して進める</span></div>
      <div class="core-cp-split-v359" aria-hidden="true"></div>
      <div class="core-cp-paths-v359">
        <section class="core-cp-route-v359 core-cp-critical-v359" aria-labelledby="coreCpRouteAV359" data-route="A" data-duration="7" data-float="0">
          <h4 id="coreCpRouteAV359">経路A</h4>
          <p class="core-cp-badge-v359">クリティカルパス</p>
          <ol class="core-cp-tasks-v359" aria-label="経路Aの作業順序">
            <li data-days="3"><span>作業A1</span><b>3日</b></li>
            <li data-days="4"><span>作業A2</span><b>4日</b></li>
          </ol>
          <div class="core-cp-total-v359"><span>3 + 4 = <b>7日</b></span><small>余裕 0日</small></div>
          <div class="core-cp-bar-v359" aria-hidden="true"><span style="flex:7"></span></div>
        </section>
        <section class="core-cp-route-v359 core-cp-secondary-v359" aria-labelledby="coreCpRouteBV359" data-route="B" data-duration="5" data-float="2">
          <h4 id="coreCpRouteBV359">経路B</h4>
          <p class="core-cp-badge-v359">2日早く終わる</p>
          <ol class="core-cp-tasks-v359" aria-label="経路Bの作業順序">
            <li data-days="2"><span>作業B1</span><b>2日</b></li>
            <li data-days="3"><span>作業B2</span><b>3日</b></li>
          </ol>
          <div class="core-cp-total-v359"><span>2 + 3 = <b>5日</b></span><small>余裕 2日</small></div>
          <div class="core-cp-bar-v359" aria-hidden="true"><span style="flex:5"></span><i style="flex:2"></i></div>
        </section>
      </div>
      <div class="core-cp-join-v359" aria-hidden="true"></div>
      <div class="core-cp-finish-v359"><span>両方の完了を待つ</span><b>全体の最短所要日数は <strong>7日</strong></b><code>max(7, 5) = 7</code></div>
    </div>

    <div class="core-cp-notes-v359">
      <p><b>経路Aの遅れは全体へ</b><span>余裕が0日なので、Aが1日遅れると全体も8日になります。</span></p>
      <p><b>経路Bには2日の余裕</b><span>この例では、Bの遅れが合計2日以内なら、全体は7日のままです。</span></p>
    </div>
    <p class="core-cp-rule-v359"><b>比べるのは作業数ではなく、時間の合計。</b> 並行する2経路の7日と5日を足して、12日としないようにしましょう。</p>
    <p class="core-cp-assumption-v359">前提：矢印は前後関係。各経路内は上の作業が終わってから次へ進みます。2経路を同時に進める人員・設備があり、開始・完了の節点自体に所要時間はありません。棒の塗り部分は各経路の日数、点線部分は余裕です。</p>
  </figure>`;
}
