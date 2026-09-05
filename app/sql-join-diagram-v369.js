// FE QUEST v369: INNER JOIN and LEFT OUTER JOIN result comparison.

function sqlJoinTableV369(caption,headers,rows,{kind='source'}={}){
  return `<div class="sql-join-table-box-v369 is-${kind}">
    <table class="sql-join-table-v369">
      <caption>${escapeHtml(caption)}</caption>
      <thead><tr>${headers.map(header=>`<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row=>`<tr class="${row.className||''}">${row.cells.map(cell=>`<td>${cell===null?'<span class="sql-join-null-v369">NULL</span>':escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>`;
}

function coreTopicSqlJoinDiagramViewV369(id){
  if(id!=='core_09_07')return '';
  const employees=[
    {cells:['E01','青木','10']},
    {cells:['E02','井上','20']},
    {cells:['E03','上田','30'],className:'is-unmatched'}
  ];
  const departments=[
    {cells:['10','営業部']},
    {cells:['20','開発部']},
    {cells:['40','総務部'],className:'is-unmatched'}
  ];
  const innerRows=[
    {cells:['E01','青木','営業部']},
    {cells:['E02','井上','開発部']}
  ];
  const leftRows=[
    {cells:['E01','青木','営業部']},
    {cells:['E02','井上','開発部']},
    {cells:['E03','上田',null],className:'is-kept-unmatched'}
  ];
  return `<figure class="sql-join-figure-v369" aria-labelledby="sqlJoinCaptionV369" data-sql-join-diagram="core">
    <figcaption id="sqlJoinCaptionV369"><span>図で確認</span><b>INNER JOINとLEFT OUTER JOINで残る行を比べる</b></figcaption>
    <p class="sql-join-lead-v369">社員表を左、部署表を右に置き、共通する <code>dept_id</code> で照合します。</p>
    <div class="sql-join-source-grid-v369" role="group" aria-label="結合前の社員表と部署表">
      <section class="sql-join-source-v369" aria-labelledby="sqlJoinEmployeeV369"><h3 id="sqlJoinEmployeeV369"><span>左表</span>employee（社員）</h3>${sqlJoinTableV369('employee',['社員ID','氏名','dept_id'],employees)}</section>
      <section class="sql-join-source-v369" aria-labelledby="sqlJoinDepartmentV369"><h3 id="sqlJoinDepartmentV369"><span>右表</span>department（部署）</h3>${sqlJoinTableV369('department',['dept_id','部署名'],departments)}</section>
    </div>
    <div class="sql-join-key-v369"><b>結合条件</b><code>employee.dept_id = department.dept_id</code><span>10・20は一致／30・40は相手がいない</span></div>
    <div class="sql-join-compare-v369">
      <section class="sql-join-panel-v369 is-inner" aria-labelledby="sqlJoinInnerV369"><h4 id="sqlJoinInnerV369"><span>INNER JOIN</span><small>両方に一致する行だけ</small></h4><code class="sql-join-expression-v369">employee INNER JOIN department</code>${sqlJoinTableV369('結合結果',['社員ID','氏名','部署名'],innerRows,{kind:'result'})}<p><b>2行</b><span><code>dept_id = 10, 20</code> だけが残ります。</span></p></section>
      <section class="sql-join-panel-v369 is-left" aria-labelledby="sqlJoinLeftV369"><h4 id="sqlJoinLeftV369"><span>LEFT OUTER JOIN</span><small>左表の全行を残す</small></h4><code class="sql-join-expression-v369">employee LEFT OUTER JOIN department</code>${sqlJoinTableV369('結合結果',['社員ID','氏名','部署名'],leftRows,{kind:'result'})}<p><b>3行</b><span>部署が見つからない上田さんも残り、部署名は <code>NULL</code> になります。</span></p></section>
    </div>
    <p class="sql-join-takeaway-v369"><b>LEFTは「左表を残す」のLEFT</b><span>今回は左表がemployeeなので社員は全員残ります。右表にしかない総務部（dept_id = 40）は結果に追加されません。</span></p>
  </figure>`;
}
