function coreTopicMemoryHierarchyDiagramViewV357(id){
  if(id!=='core_04_03')return '';
  const level=(kind,name,place,role)=>`<li class="core-memory-level-v357 core-memory-level-${kind}-v357">
    <div class="core-memory-level-name-v357"><b>${name}</b><span>${place}</span></div>
    <small>${role}</small>
  </li>`;
  return `<figure class="core-memory-hierarchy-diagram-v357" aria-labelledby="coreMemoryHierarchyCaptionV357">
    <figcaption id="coreMemoryHierarchyCaptionV357">速さと容量で見るメモリ階層</figcaption>
    <p class="core-memory-hierarchy-lead-v357">CPUに近いほど高速・小容量です。下へ行くほど一般に低速になる一方、より大きな容量を扱えます。</p>

    <div class="core-memory-mobile-trends-v357" aria-hidden="true">
      <span><b>上ほど</b> 高速・小容量</span>
      <span><b>下ほど</b> 低速・大容量</span>
    </div>

    <div class="core-memory-stage-v357">
      <div class="core-memory-axis-v357 core-memory-speed-axis-v357" aria-label="上ほど高速、下ほど低速">
        <b>速度</b><span>高速</span><i aria-hidden="true"></i><span>低速</span>
      </div>

      <ol class="core-memory-levels-v357" aria-label="上からレジスタ、キャッシュ、主記憶、補助記憶の順に並ぶメモリ階層">
        ${level('register','レジスタ','CPU内部','今すぐ使う値を保持')}
        ${level('cache','キャッシュ','CPUの近く','よく使うデータを一時保持')}
        ${level('main','主記憶（RAM）','メインメモリ','実行中のプログラムを保持')}
        ${level('storage','補助記憶','SSD / HDD','大容量・電源断後も保持')}
      </ol>

      <div class="core-memory-axis-v357 core-memory-capacity-axis-v357" aria-label="上ほど小容量、下ほど大容量">
        <b>容量</b><span>小</span><i aria-hidden="true"></i><span>大</span>
      </div>
    </div>

    <div class="core-memory-hierarchy-rule-v357">
      <b>試験での見方</b>
      <span>「容量が大きいほど高速」ではありません。速度を補うため、役割の違う記憶装置を階層にして使います。</span>
    </div>
  </figure>`;
}
