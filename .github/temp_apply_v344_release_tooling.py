from pathlib import Path

p=Path('.github/release/split_release_common.py')
s=p.read_text()

s=s.replace("V343_ADAPTIVE_PRECISION_SOURCE='app/adaptive-precision-v343.js'\n","V343_ADAPTIVE_PRECISION_SOURCE='app/adaptive-precision-v343.js'\nV344_LEARNING_OUTCOMES_SOURCE='app/learning-outcomes-v344.js'\n",1)

shell_anchor="""    if cloud_runtime_assets(version):
        app_tag=f'<script src=\"./assets/app-{version}.js\"></script>'
        activation_tag=f'<script src=\"{CLOUD_ACTIVATION_ENTRYPOINT}\"></script>'
        req(app_tag in out,'cloud-enabled release core app script tag missing')
        if activation_tag not in out:
            out=out.replace(app_tag,app_tag+'\\n'+activation_tag,1)
        req(out.count(activation_tag)==1,'cloud activation loader must appear exactly once')
        req(out.index(app_tag)<out.index(activation_tag),'cloud activation must follow core application script')
    return out
"""
assert shell_anchor in s
shell_repl="""    if cloud_runtime_assets(version):
        app_tag=f'<script src=\"./assets/app-{version}.js\"></script>'
        activation_tag=f'<script src=\"{CLOUD_ACTIVATION_ENTRYPOINT}\"></script>'
        req(app_tag in out,'cloud-enabled release core app script tag missing')
        if activation_tag not in out:
            out=out.replace(app_tag,app_tag+'\\n'+activation_tag,1)
        req(out.count(activation_tag)==1,'cloud activation loader must appear exactly once')
        req(out.index(app_tag)<out.index(activation_tag),'cloud activation must follow core application script')
    if version=='v344':
        report_anchor='      <div class=\"analytics-card analytics-priority-card\">'
        req(report_anchor in out,'v344 analytics priority anchor missing')
        req('id=\"analyticsOutcomeReport\"' not in out,'v344 learning outcome report unexpectedly already materialized')
        report='''      <div class=\"analytics-card v344-outcome-card\" id=\"analyticsOutcomeReport\">\n        <div class=\"analytics-card-head\"><div><h2>最近の学習レポート</h2><div class=\"sub\">保存されている学習記録の範囲で、最近の成果と次の重点をまとめます。</div></div></div>\n        <div class=\"v344-outcome-grid\">\n          <div class=\"v344-outcome-item\"><span>学習ペース</span><b id=\"analyticsOutcomeActivity\">0分 / 0日</b><small id=\"analyticsOutcomeActivityNote\">直近7日の記録から集計します。</small></div>\n          <div class=\"v344-outcome-item\"><span>最近伸びた分野</span><b id=\"analyticsOutcomeGrowth\">比較データを集めています</b><small id=\"analyticsOutcomeGrowthNote\">保存済み回答の範囲で比較します。</small></div>\n          <div class=\"v344-outcome-item\"><span>次に伸ばすポイント</span><b id=\"analyticsOutcomeNext\">演習データを集める</b><small id=\"analyticsOutcomeNextNote\">現在の学習記録から案内します。</small></div>\n        </div>\n        <div class=\"v344-outcome-evidence-note\">正答率の変化は「直近の保存済み回答」と「その前の保存済み回答」を比べます。今週と先週の完全な成績比較ではありません。</div>\n      </div>\n'''
        out=out.replace(report_anchor,report+report_anchor,1)
        req(out.count('id=\"analyticsOutcomeReport\"')==1,'v344 learning outcome report must appear exactly once')
    return out
"""
s=s.replace(shell_anchor,shell_repl,1)

js_anchor="""def transform_js(text,previous,version,feature_source=None):
"""
assert js_anchor in s
css_func="""def transform_css(text,previous,version):
    out=text
    if version=='v344':
        marker='/* ===== v344: bounded learning outcome report ===== */'
        req(marker not in out,'v344 learning outcome CSS unexpectedly already materialized')
        block='''\n\n/* ===== v344: bounded learning outcome report ===== */\n.v344-outcome-card{border-color:#d9e6ec;background:linear-gradient(180deg,#fff 0%,#fbfdfe 100%)}\n.v344-outcome-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}\n.v344-outcome-item{min-width:0;border:1px solid #e1e8ec;border-radius:15px;background:#fff;padding:13px}\n.v344-outcome-item span{display:block;font-size:14px;color:var(--muted);font-weight:900;margin-bottom:5px}\n.v344-outcome-item b{display:block;font-size:17px;line-height:1.45;color:#17324a;overflow-wrap:anywhere}\n.v344-outcome-item small{display:block;font-size:14px;line-height:1.55;color:#5f7383;margin-top:5px}\n.v344-outcome-evidence-note{font-size:14px;line-height:1.6;color:#667887;margin-top:10px}\n@media(max-width:700px){.v344-outcome-grid{grid-template-columns:1fr}.v344-outcome-item{padding:12px}}\n'''
        out=out.rstrip()+block+'\\n'
        req(out.count(marker)==1,'v344 learning outcome CSS must appear exactly once')
    return out

"""
s=s.replace(js_anchor,css_func+js_anchor,1)

v343_block="""    if version=='v343':
        feature=feature_source if feature_source is not None else Path(V343_ADAPTIVE_PRECISION_SOURCE).read_text()
        req('V343_ADAPTIVE_PRECISION_SPEC' in feature,'v343 adaptive precision source marker missing')
        req('V343_ADAPTIVE_PRECISION_SPEC' not in out,'v343 adaptive precision unexpectedly already materialized')
        out=replace_named_function(out,'recommendedPrescription',feature)
        req(out.count('const V343_ADAPTIVE_PRECISION_SPEC=')==1,'v343 adaptive precision must be injected exactly once')
        req(out.count('function recommendedPrescription()')==1,'v343 recommended prescription replacement must be unique')
    return out
"""
assert v343_block in s
v344_block="""    if version=='v343':
        feature=feature_source if feature_source is not None else Path(V343_ADAPTIVE_PRECISION_SOURCE).read_text()
        req('V343_ADAPTIVE_PRECISION_SPEC' in feature,'v343 adaptive precision source marker missing')
        req('V343_ADAPTIVE_PRECISION_SPEC' not in out,'v343 adaptive precision unexpectedly already materialized')
        out=replace_named_function(out,'recommendedPrescription',feature)
        req(out.count('const V343_ADAPTIVE_PRECISION_SPEC=')==1,'v343 adaptive precision must be injected exactly once')
        req(out.count('function recommendedPrescription()')==1,'v343 recommended prescription replacement must be unique')
    if version=='v344':
        feature=feature_source if feature_source is not None else Path(V344_LEARNING_OUTCOMES_SOURCE).read_text()
        req('V344_LEARNING_OUTCOMES_SPEC' in feature,'v344 learning outcomes source marker missing')
        req('V344_LEARNING_OUTCOMES_SPEC' not in out,'v344 learning outcomes unexpectedly already materialized')
        out=replace_named_function(out,'renderLearningAnalytics',feature)
        req(out.count('const V344_LEARNING_OUTCOMES_SPEC=')==1,'v344 learning outcomes must be injected exactly once')
        req(out.count('function renderLearningAnalytics()')==1,'v344 analytics render replacement must be unique')
        req(out.count('function learningOutcomeReportDecisionV344(')==1,'v344 report decision helper must be unique')
    return out
"""
s=s.replace(v343_block,v344_block,1)

manifest_anchor="""    if version=='v343':
        feature_path=root/V343_ADAPTIVE_PRECISION_SOURCE
        req(feature_path.exists(),'v343 adaptive precision source missing')
        feature_b=feature_path.read_bytes()
        result['adaptivePrecision']={
          'version':'v343','sourcePath':V343_ADAPTIVE_PRECISION_SOURCE,
          'utf8Bytes':len(feature_b),'sha256':sha_bytes(feature_b),'profileSchemaChange':False
        }
    if cloud_assets:
"""
assert manifest_anchor in s
manifest_repl="""    if version=='v343':
        feature_path=root/V343_ADAPTIVE_PRECISION_SOURCE
        req(feature_path.exists(),'v343 adaptive precision source missing')
        feature_b=feature_path.read_bytes()
        result['adaptivePrecision']={
          'version':'v343','sourcePath':V343_ADAPTIVE_PRECISION_SOURCE,
          'utf8Bytes':len(feature_b),'sha256':sha_bytes(feature_b),'profileSchemaChange':False
        }
    if version=='v344':
        feature_path=root/V344_LEARNING_OUTCOMES_SOURCE
        req(feature_path.exists(),'v344 learning outcomes source missing')
        feature_b=feature_path.read_bytes()
        result['learningOutcomes']={
          'version':'v344','sourcePath':V344_LEARNING_OUTCOMES_SOURCE,
          'utf8Bytes':len(feature_b),'sha256':sha_bytes(feature_b),'profileSchemaChange':False,
          'evidenceBasis':'bounded-recorded-answers-and-calendar-activity'
        }
    if cloud_assets:
"""
s=s.replace(manifest_anchor,manifest_repl,1)

mat_anchor="""    target['shell'].write_text(transform_shell(prev['shell'].read_text(),previous,version))
    shutil.copyfile(prev['css'],target['css'])
    feature_source=(root/V343_ADAPTIVE_PRECISION_SOURCE).read_text() if version=='v343' else None
    target['js'].write_text(transform_js(prev['js'].read_text(),previous,version,feature_source))
"""
assert mat_anchor in s
mat_repl="""    target['shell'].write_text(transform_shell(prev['shell'].read_text(),previous,version))
    target['css'].write_text(transform_css(prev['css'].read_text(),previous,version))
    feature_source=None
    if version=='v343':feature_source=(root/V343_ADAPTIVE_PRECISION_SOURCE).read_text()
    elif version=='v344':feature_source=(root/V344_LEARNING_OUTCOMES_SOURCE).read_text()
    target['js'].write_text(transform_js(prev['js'].read_text(),previous,version,feature_source))
"""
s=s.replace(mat_anchor,mat_repl,1)
p.write_text(s)

p=Path('.github/release/release_validate_split.py')
s=p.read_text()
s=s.replace('from split_release_common import release_context,req,sha_bytes,ident,transform_shell,transform_js,cloud_runtime_assets','from split_release_common import release_context,req,sha_bytes,ident,transform_shell,transform_css,transform_js,cloud_runtime_assets',1)
s=s.replace("prev_css=subprocess.check_output(['git','show',parent+f':assets/app-{previous}.css'])\n","prev_css=subprocess.check_output(['git','show',parent+f':assets/app-{previous}.css'])\nprev_css_text=prev_css.decode()\n",1)
s=s.replace("req(Path(f'assets/app-{version}.css').read_bytes()==prev_css,'mechanical CSS changed')","req(Path(f'assets/app-{version}.css').read_text()==transform_css(prev_css_text,previous,version),'target CSS differs from approved transform contract')",1)
s=s.replace(" 'mechanicalCssByteIdenticalToPrevious':True,'approvedJsTransformContract':True,"," 'mechanicalCssByteIdenticalToPrevious':Path(f'assets/app-{version}.css').read_bytes()==prev_css,'approvedCssTransformContract':True,'approvedJsTransformContract':True,",1)
p.write_text(s)

p=Path('.github/release/release_materialize_split.py')
s=p.read_text()
s=s.replace('CSS is copied byte-exact; application JS advances APP_VERSION while preserving the Safari native date sizing correction introduced in v342.','CSS and application JS follow the approved version transform; unchanged releases remain byte-exact while deliberate learner-facing presentation changes are version-scoped. Safari native date sizing correction introduced in v342 is preserved.',1)
p.write_text(s)

print('v344 release tooling transform applied')
