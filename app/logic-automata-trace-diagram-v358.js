function coreTopicLogicAutomataTraceDiagramViewV358(id){
  if(id==='core_02_02'){
    return `<figure class="core-logic-trace-diagram-v358" aria-labelledby="coreLogicTraceCaptionV358">
      <figcaption id="coreLogicTraceCaptionV358">論理回路は中間値を左から追う</figcaption>
      <p class="core-trace-lead-v358">例：入力を <code>A=1</code>、<code>B=0</code> とし、<code>(A OR B) AND (NOT B)</code> の出力を求めます。</p>

      <div class="core-logic-flow-v358" aria-label="入力A=1とB=0からORとNOTの中間値を求め、ANDへ渡して出力1を得る流れ">
        <section class="core-logic-inputs-v358">
          <span>入力A <b>1</b></span>
          <span>入力B <b>0</b></span>
        </section>
        <i class="core-trace-arrow-v358" aria-hidden="true">→</i>
        <section class="core-logic-middle-v358">
          <div><b class="core-gate-or-v358">OR</b><span>1 OR 0</span><output>x = 1</output></div>
          <div><b class="core-gate-not-v358">NOT</b><span>NOT 0</span><output>y = 1</output></div>
        </section>
        <i class="core-trace-arrow-v358" aria-hidden="true">→</i>
        <section class="core-logic-output-v358">
          <b class="core-gate-and-v358">AND</b>
          <span>x AND y</span>
          <output>出力 = 1</output>
        </section>
      </div>

      <ol class="core-trace-steps-v358">
        <li><b>1</b><span>ORを計算</span><code>1 OR 0 = 1</code></li>
        <li><b>2</b><span>NOTを計算</span><code>NOT 0 = 1</code></li>
        <li><b>3</b><span>ANDへ渡す</span><code>1 AND 1 = 1</code></li>
      </ol>
      <p class="core-trace-rule-v358"><b>ポイント</b> 最後の出力を一気に暗算せず、ゲートごとの値を書き込むと取り違えを防げます。</p>
    </figure>`;
  }

  if(id==='core_02_04'){
    return `<figure class="core-automata-trace-diagram-v358" aria-labelledby="coreAutomataTraceCaptionV358">
      <figcaption id="coreAutomataTraceCaptionV358">入力を一文字ずつ適用して状態を更新する</figcaption>
      <p class="core-trace-lead-v358">初期状態はA。入力<code>1</code>でAとBを切り替え、入力<code>0</code>では現在状態を維持します。</p>

      <div class="core-automata-rules-v358" aria-label="状態遷移の規則">
        <div><b>状態A</b><span><code>0</code> → A</span><span><code>1</code> → B</span></div>
        <div><b>状態B</b><span><code>0</code> → B</span><span><code>1</code> → A</span></div>
      </div>

      <div class="core-automata-input-v358"><span>入力列</span><b>1 → 0 → 1</b></div>
      <ol class="core-automata-trace-v358" aria-label="初期状態Aから入力1、0、1を順に処理してAへ戻る状態遷移">
        <li class="core-state-a-v358"><small>初期状態</small><b>A</b><span>ここから開始</span></li>
        <li class="core-state-b-v358"><small>入力 1</small><b>B</b><span>Aから切替え</span></li>
        <li class="core-state-b-v358"><small>入力 0</small><b>B</b><span>状態を維持</span></li>
        <li class="core-state-a-v358"><small>入力 1</small><b>A</b><span>Bから切替え</span></li>
      </ol>
      <p class="core-trace-rule-v358"><b>最終状態：A</b> 入力だけを見るのではなく、各文字を処理するたびに「現在状態」を更新します。</p>
    </figure>`;
  }
  return '';
}
