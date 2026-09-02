function coreTopicInlineDiagramViewV353(id){
  if(id!=='core_01_05')return '';
  return `<figure class="core-inline-diagram-v353 core-twos-diagram-v353" aria-labelledby="coreTwosCaptionV353">
    <figcaption id="coreTwosCaptionV353"><span>図で確認</span><b>2の補数を作る3ステップ</b></figcaption>
    <p class="core-twos-lead-v353">8bitの「+5」から「-5」を作ります。bit長を固定して左から順に追います。</p>
    <div class="core-twos-flow-v353" role="img" aria-label="8bitのプラス5を全ビット反転し、1を加えてマイナス5の2の補数表現を作る3段階の図">
      <div class="core-twos-step-v353 is-start">
        <span class="core-twos-step-label-v353">1　元の正数</span>
        <div class="core-twos-number-v353"><span class="core-twos-sign-v353">+5</span><code>0000 0101</code></div>
      </div>
      <div class="core-twos-arrow-v353" aria-hidden="true">
        <span class="core-twos-arrow-glyph-v353"><i class="core-twos-arrow-wide-v353">→</i><i class="core-twos-arrow-narrow-v353">↓</i></span>
        <small>全bitを反転</small>
      </div>
      <div class="core-twos-step-v353">
        <span class="core-twos-step-label-v353">2　0と1を入れ替える</span>
        <div class="core-twos-number-v353"><code>1111 1010</code></div>
      </div>
      <div class="core-twos-arrow-v353" aria-hidden="true">
        <span class="core-twos-arrow-glyph-v353"><i class="core-twos-arrow-wide-v353">→</i><i class="core-twos-arrow-narrow-v353">↓</i></span>
        <small>1を加える</small>
      </div>
      <div class="core-twos-step-v353 is-result">
        <span class="core-twos-step-label-v353">3　2の補数が完成</span>
        <div class="core-twos-number-v353"><span class="core-twos-sign-v353">-5</span><code>1111 1011</code></div>
      </div>
    </div>
    <div class="core-twos-caution-v353"><b>注意：</b>先頭の符号bitだけを1にするのではありません。「全bit反転 → 1を加える」を1セットで覚えます。</div>
  </figure>`;
}
