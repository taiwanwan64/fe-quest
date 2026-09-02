function coreTopicDatabaseDiagramViewV354(id){
  if(id!=='core_09_03')return '';
  return `<figure class="core-dbnorm-diagram-v354" aria-labelledby="coreDbnormCaptionV354">
    <figcaption id="coreDbnormCaptionV354"><span>図で確認</span><b>重複する受注明細を3つの表に分ける</b></figcaption>
    <p class="core-dbnorm-lead-v354">同じ注文情報や商品情報を何度も書かず、役割ごとに一度だけ保存します。</p>
    <div class="core-dbnorm-flow-v354" role="group" aria-label="正規化前の受注明細表を、注文表、商品表、注文明細表に分割する図">
      <section class="core-dbnorm-stage-v354 is-before" aria-labelledby="coreDbnormBeforeV354">
        <div class="core-dbnorm-stage-head-v354">
          <span class="core-dbnorm-stage-number-v354">正規化前</span>
          <h3 id="coreDbnormBeforeV354">受注明細を1表に保存</h3>
        </div>
        <div class="core-dbnorm-table-box-v354">
          <table class="core-dbnorm-table-v354 is-wide">
            <caption>正規化前の受注明細表</caption>
            <colgroup><col class="is-order"><col class="is-product"><col class="is-quantity"></colgroup>
            <thead><tr><th scope="col">注文情報</th><th scope="col">商品情報</th><th scope="col">数量</th></tr></thead>
            <tbody>
              <tr><td><span class="core-dbnorm-order-v354">O101・9/2</span></td><td><span class="core-dbnorm-product-v354">P01・キーボード・3,000円</span></td><td>1</td></tr>
              <tr><td><span class="core-dbnorm-order-v354 is-repeat">O101・9/2</span></td><td><span class="core-dbnorm-product-v354">P02・マウス・1,500円</span></td><td>2</td></tr>
              <tr><td><span class="core-dbnorm-order-v354">O102・9/3</span></td><td><span class="core-dbnorm-product-v354 is-repeat">P01・キーボード・3,000円</span></td><td>1</td></tr>
            </tbody>
          </table>
        </div>
        <div class="core-dbnorm-legend-v354" aria-label="色の説明">
          <span><i class="is-order" aria-hidden="true"></i>注文情報が重複</span>
          <span><i class="is-product" aria-hidden="true"></i>商品情報が重複</span>
        </div>
      </section>

      <div class="core-dbnorm-arrow-v354" aria-hidden="true">
        <b><i class="is-wide">→</i><i class="is-narrow">↓</i></b>
        <span>役割ごとに<br>分ける</span>
      </div>

      <section class="core-dbnorm-stage-v354 is-after" aria-labelledby="coreDbnormAfterV354">
        <div class="core-dbnorm-stage-head-v354">
          <span class="core-dbnorm-stage-number-v354">正規化後</span>
          <h3 id="coreDbnormAfterV354">注文・商品・明細に分割</h3>
        </div>
        <div class="core-dbnorm-after-grid-v354">
          <div class="core-dbnorm-table-box-v354 is-order-table">
            <table class="core-dbnorm-table-v354">
              <caption><span>注文</span><small>注文そのもの</small></caption>
              <thead><tr><th scope="col">注文ID 🔑</th><th scope="col">注文日</th></tr></thead>
              <tbody><tr><td>O101</td><td>9/2</td></tr><tr><td>O102</td><td>9/3</td></tr></tbody>
            </table>
          </div>
          <div class="core-dbnorm-table-box-v354 is-product-table">
            <table class="core-dbnorm-table-v354">
              <caption><span>商品</span><small>商品の基本情報</small></caption>
              <thead><tr><th scope="col">商品ID 🔑</th><th scope="col">商品名</th><th scope="col">単価</th></tr></thead>
              <tbody><tr><td>P01</td><td>キーボード</td><td>3,000円</td></tr><tr><td>P02</td><td>マウス</td><td>1,500円</td></tr></tbody>
            </table>
          </div>
          <div class="core-dbnorm-table-box-v354 is-detail-table">
            <table class="core-dbnorm-table-v354">
              <caption><span>注文明細</span><small>注文と商品を結ぶ</small></caption>
              <thead><tr><th scope="col">注文ID 🔑</th><th scope="col">商品ID 🔑</th><th scope="col">数量</th></tr></thead>
              <tbody><tr><td>O101</td><td>P01</td><td>1</td></tr><tr><td>O101</td><td>P02</td><td>2</td></tr><tr><td>O102</td><td>P01</td><td>1</td></tr></tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
    <div class="core-dbnorm-result-v354"><b>ポイント</b><span>注文日や商品名を変更するときは、それぞれの表を1か所直せば済みます。注文明細には「どの注文に、どの商品が、いくつあるか」だけを残します。</span></div>
  </figure>`;
}
