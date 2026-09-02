function coreTopicCryptoSignatureDiagramViewV355(id){
  if(id!=='core_11_02'&&id!=='core_11_03')return '';
  return `<figure class="core-keycompare-diagram-v355" aria-labelledby="coreKeycompareCaptionV355">
    <figcaption id="coreKeycompareCaptionV355"><span>図で比較</span><b>公開鍵暗号とデジタル署名は、鍵の向きが逆</b></figcaption>
    <p class="core-keycompare-lead-v355">上段と下段の同じ位置を見比べて、「誰の鍵を、何のために使うか」を整理します。</p>

    <div class="core-keycompare-stack-v355" role="group" aria-label="公開鍵暗号とデジタル署名で使う鍵を上下に比較する図">
      <section class="core-keycompare-row-v355 is-encryption" aria-labelledby="coreKeycompareEncryptionV355">
        <div class="core-keycompare-row-head-v355">
          <div><span>上段</span><h3 id="coreKeycompareEncryptionV355">公開鍵暗号</h3></div>
          <p><b>目的：秘密に送る</b><small>機密性</small></p>
        </div>
        <div class="core-keycompare-track-v355">
          <div class="core-keycompare-step-v355">
            <span class="core-keycompare-actor-v355">送信者</span>
            <b class="core-keycompare-action-v355">暗号化</b>
            <span class="core-keycompare-key-v355 is-public"><i aria-hidden="true">🔓</i>受信者の公開鍵</span>
            <small>相手が公開してよい鍵</small>
          </div>
          <div class="core-keycompare-arrow-v355" aria-hidden="true"><i class="is-wide">→</i><i class="is-narrow">↓</i></div>
          <div class="core-keycompare-payload-v355 is-cipher">
            <span aria-hidden="true">✉️</span>
            <b>暗号文を送る</b>
            <small>途中で見られても読めない</small>
          </div>
          <div class="core-keycompare-arrow-v355" aria-hidden="true"><i class="is-wide">→</i><i class="is-narrow">↓</i></div>
          <div class="core-keycompare-step-v355">
            <span class="core-keycompare-actor-v355">受信者</span>
            <b class="core-keycompare-action-v355">復号</b>
            <span class="core-keycompare-key-v355 is-private"><i aria-hidden="true">🔐</i>受信者の秘密鍵</span>
            <small>本人だけが持つ鍵</small>
          </div>
        </div>
      </section>

      <section class="core-keycompare-row-v355 is-signature" aria-labelledby="coreKeycompareSignatureV355">
        <div class="core-keycompare-row-head-v355">
          <div><span>下段</span><h3 id="coreKeycompareSignatureV355">デジタル署名</h3></div>
          <p><b>目的：本人・改ざん確認</b><small>真正性・完全性</small></p>
        </div>
        <div class="core-keycompare-track-v355">
          <div class="core-keycompare-step-v355">
            <span class="core-keycompare-actor-v355">署名者</span>
            <b class="core-keycompare-action-v355">文書のハッシュへ署名</b>
            <span class="core-keycompare-key-v355 is-private"><i aria-hidden="true">🔐</i>署名者の秘密鍵</span>
            <small>本人だけが署名を作れる</small>
          </div>
          <div class="core-keycompare-arrow-v355" aria-hidden="true"><i class="is-wide">→</i><i class="is-narrow">↓</i></div>
          <div class="core-keycompare-payload-v355 is-signed">
            <span aria-hidden="true">📄</span>
            <b>文書＋署名を送る</b>
            <small>本文を秘密にする処理ではない</small>
          </div>
          <div class="core-keycompare-arrow-v355" aria-hidden="true"><i class="is-wide">→</i><i class="is-narrow">↓</i></div>
          <div class="core-keycompare-step-v355">
            <span class="core-keycompare-actor-v355">検証者</span>
            <b class="core-keycompare-action-v355">署名を検証</b>
            <span class="core-keycompare-key-v355 is-public"><i aria-hidden="true">🔓</i>署名者の公開鍵</span>
            <small>本人の鍵かは証明書で確認</small>
          </div>
        </div>
      </section>
    </div>

    <div class="core-keycompare-memory-v355">
      <b>覚え方</b>
      <div><span>暗号化</span><strong>相手の公開鍵</strong><i>→</i><strong>相手の秘密鍵</strong></div>
      <div><span>署名</span><strong>自分の秘密鍵</strong><i>→</i><strong>自分の公開鍵</strong></div>
    </div>
  </figure>`;
}
