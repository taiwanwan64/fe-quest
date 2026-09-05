// FE QUEST v370: database deadlock wait-cycle diagram.

function coreTopicDeadlockDiagramViewV370(id){
  if(id!=='core_09_06')return '';
  return `<figure class="deadlock-figure-v370" aria-labelledby="deadlockCaptionV370" data-deadlock-diagram="core">
    <figcaption id="deadlockCaptionV370"><span>図で確認</span><b>デッドロックは「互いに相手を待つ輪」</b></figcaption>
    <p class="deadlock-lead-v370">2つの処理が、商品表と注文表を逆の順序でロックする場面を追います。</p>
    <div class="deadlock-resources-v370" role="group" aria-label="ロック対象の二つの資源">
      <span><b>資源1</b>商品表</span><span><b>資源2</b>注文表</span>
    </div>
    <div class="deadlock-lanes-v370" role="group" aria-label="処理Aと処理Bのロックと待機">
      <section class="deadlock-lane-v370 is-a" aria-labelledby="deadlockLaneAV370">
        <h3 id="deadlockLaneAV370"><span>処理A</span><small>商品表 → 注文表の順</small></h3>
        <ol>
          <li data-deadlock-state="hold"><b>1</b><span><strong>商品表をロック</strong><small>商品表を保持したまま</small></span></li>
          <li data-deadlock-state="wait"><b>3</b><span><strong>注文表を要求</strong><small>処理Bが保持中 → 待機</small></span></li>
        </ol>
      </section>
      <section class="deadlock-lane-v370 is-b" aria-labelledby="deadlockLaneBV370">
        <h3 id="deadlockLaneBV370"><span>処理B</span><small>注文表 → 商品表の順</small></h3>
        <ol>
          <li data-deadlock-state="hold"><b>2</b><span><strong>注文表をロック</strong><small>注文表を保持したまま</small></span></li>
          <li data-deadlock-state="wait"><b>4</b><span><strong>商品表を要求</strong><small>処理Aが保持中 → 待機</small></span></li>
        </ol>
      </section>
    </div>
    <div class="deadlock-cycle-v370" role="img" aria-label="処理Aは処理Bを待ち、処理Bは処理Aを待つ循環待ち">
      <div class="deadlock-wait-v370"><b>処理A</b><span>注文表の解放を待つ</span><em>→ 処理B</em></div>
      <div class="deadlock-knot-v370" aria-hidden="true"><span>循環待ち</span><b>↻</b></div>
      <div class="deadlock-wait-v370"><b>処理B</b><span>商品表の解放を待つ</span><em>→ 処理A</em></div>
    </div>
    <p class="deadlock-result-v370"><b>デッドロック</b><span>どちらも相手が解放するまで進めず、ロックの解放処理にも到達できません。</span></p>
    <div class="deadlock-solutions-v370">
      <section class="deadlock-solution-v370 is-prevent" aria-labelledby="deadlockPreventV370"><h4 id="deadlockPreventV370">起こしにくくする</h4><b>ロック順序を統一</b><div class="deadlock-order-v370"><span>商品表</span><i>→</i><span>注文表</span></div><p>両方の処理が同じ順序で取得すれば、待機が輪になる状況を避けやすくなります。</p></section>
      <section class="deadlock-solution-v370 is-recover" aria-labelledby="deadlockRecoverV370"><h4 id="deadlockRecoverV370">発生したら解消</h4><b>片方をROLLBACK</b><div class="deadlock-order-v370"><span>検出</span><i>→</i><span>ロック解放</span></div><p>DBMSが検出し、一方のトランザクションを取り消して循環を切る方法があります。</p></section>
    </div>
    <p class="deadlock-takeaway-v370"><b>待っているだけでは解消しない</b><span>「保持したまま別の資源を待つ処理」が輪になっていないかを確認します。</span></p>
  </figure>`;
}
