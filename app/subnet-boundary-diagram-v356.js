function coreTopicSubnetBoundaryDiagramViewV356(id){
  if(id!=='core_10_04')return '';
  const binaryRow=(label,networkBits,hostBits,note)=>`<div class="core-subnet-binary-row-v356">
    <div class="core-subnet-row-label-v356"><b>${label}</b><small>${note}</small></div>
    <div class="core-subnet-bitline-v356">
      <div class="core-subnet-network-bits-v356">${networkBits}</div>
      <i class="core-subnet-boundary-v356" aria-hidden="true"></i>
      <div class="core-subnet-host-bits-v356">${hostBits}</div>
    </div>
  </div>`;
  return `<figure class="core-subnet-diagram-v356" aria-labelledby="coreSubnetCaptionV356">
    <figcaption id="coreSubnetCaptionV356"><span>図で確認</span><b>/26は、左から26bitと残り6bitの境界</b></figcaption>
    <p class="core-subnet-lead-v356">例：<code>192.168.1.130/26</code>。3つの行で、青と黄の境界位置は変わりません。</p>

    <div class="core-subnet-summary-v356" aria-label="サブネットマスクの前提">
      <div><span>IPアドレス</span><b>192.168.1.130/26</b></div>
      <div><span>サブネットマスク</span><b>255.255.255.192</b></div>
      <div><span>bitの内訳</span><b>26bit ＋ 6bit</b><small>32 − 26 = 6</small></div>
    </div>

    <div class="core-subnet-legend-v356" aria-label="色の説明">
      <span class="is-network"><i aria-hidden="true"></i>ネットワーク部 <b>26bit</b></span>
      <span class="is-host"><i aria-hidden="true"></i>ホスト部 <b>6bit</b></span>
    </div>

    <div class="core-subnet-binary-v356" role="group" aria-label="IPアドレス、サブネットマスク、ネットワークアドレスを同じ26bit境界で比較する図">
      <div class="core-subnet-column-head-v356" aria-hidden="true">
        <span>先頭26bit</span><i></i><span>残り6bit</span>
      </div>
      ${binaryRow('IPアドレス','<span>11000000</span><em>.</em><span>10101000</span><em>.</em><span>00000001</span><em>.</em><span>10</span>','<span>000010</span>','192.168.1.130')}
      ${binaryRow('マスク','<span>11111111</span><em>.</em><span>11111111</span><em>.</em><span>11111111</span><em>.</em><span>11</span>','<span>000000</span>','255.255.255.192')}
      <div class="core-subnet-and-v356"><span>AND</span><b>ネットワーク部は残し、ホスト部をすべて0にする</b></div>
      ${binaryRow('ネットワーク','<span>11000000</span><em>.</em><span>10101000</span><em>.</em><span>00000001</span><em>.</em><span>10</span>','<span>000000</span>','192.168.1.128')}
    </div>

    <div class="core-subnet-result-v356">
      <span aria-hidden="true">✓</span>
      <div><b>ネットワークアドレスは 192.168.1.128</b><small>ホスト部6bitを0にした結果です。境界より左の26bitはそのまま残します。</small></div>
    </div>
  </figure>`;
}
