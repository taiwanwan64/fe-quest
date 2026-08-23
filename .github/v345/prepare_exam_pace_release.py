from pathlib import Path

p=Path('.github/release/split_release_common.py')
text=p.read_text()

old="V344_LEARNING_OUTCOMES_SOURCE='app/learning-outcomes-v344.js'\n"
new=old+"V345_EXAM_PACE_SOURCE='app/exam-pace-v345.js'\n"
assert old in text and 'V345_EXAM_PACE_SOURCE' not in text
text=text.replace(old,new,1)

shell_anchor="""        out=out.replace(report_anchor,report+report_anchor,1)
        req(out.count('id=\"analyticsOutcomeReport\"')==1,'v344 learning outcome report must appear exactly once')
    return out
"""
shell_new="""        out=out.replace(report_anchor,report+report_anchor,1)
        req(out.count('id=\"analyticsOutcomeReport\"')==1,'v344 learning outcome report must appear exactly once')
    if version=='v345':
        pace_anchor='        <div class=\"v344-outcome-evidence-note\">'
        req(pace_anchor in out,'v345 outcome evidence anchor missing')
        req('id=\"analyticsOutcomeExamPace\"' not in out,'v345 exam pace row unexpectedly already materialized')
        pace='''        <div class=\"v345-exam-pace-row\" id=\"analyticsOutcomeExamPace\" data-tone=\"neutral\">
          <div class=\"v345-exam-pace-icon\" id=\"analyticsOutcomeExamPaceIcon\">📅</div>
          <div class=\"v345-exam-pace-copy\"><span>試験までのペース</span><b id=\"analyticsOutcomeExamPaceTitle\">受験日を設定すると表示</b><small id=\"analyticsOutcomeExamPaceNote\">FE QUEST内の残り学習量と学習記録から案内します。</small></div>
        </div>
'''
        out=out.replace(pace_anchor,pace+pace_anchor,1)
        req(out.count('id=\"analyticsOutcomeExamPace\"')==1,'v345 exam pace row must appear exactly once')
    return out
"""
assert shell_anchor in text
text=text.replace(shell_anchor,shell_new,1)

css_anchor="""        req(out.count(marker)==1,'v344 learning outcome CSS must appear exactly once')
    return out
"""
css_new="""        req(out.count(marker)==1,'v344 learning outcome CSS must appear exactly once')
    if version=='v345':
        marker='/* ===== v345: exam pace outcome summary ===== */'
        req(marker not in out,'v345 exam pace CSS unexpectedly already materialized')
        block='''

/* ===== v345: exam pace outcome summary ===== */
.v345-exam-pace-row{display:flex;align-items:flex-start;gap:11px;margin-top:11px;padding:13px;border:1px solid #dce7ec;border-radius:15px;background:#fff}
.v345-exam-pace-icon{flex:0 0 30px;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#eef5f8;font-size:17px}
.v345-exam-pace-copy{min-width:0;flex:1}
.v345-exam-pace-copy span{display:block;font-size:14px;color:var(--muted);font-weight:900;margin-bottom:4px}
.v345-exam-pace-copy b{display:block;font-size:17px;line-height:1.45;color:#17324a;overflow-wrap:anywhere}
.v345-exam-pace-copy small{display:block;font-size:14px;line-height:1.6;color:#5f7383;margin-top:4px}
.v345-exam-pace-row[data-tone=good]{border-color:#cae7d5;background:#fbfffc}
.v345-exam-pace-row[data-tone=ok]{border-color:#cfe3ec;background:#fbfdff}
.v345-exam-pace-row[data-tone=warn]{border-color:#f0dfb8;background:#fffdf7}
.v345-exam-pace-row[data-tone=danger]{border-color:#efc9c9;background:#fffafa}
@media(max-width:700px){.v345-exam-pace-row{padding:12px;gap:10px}.v345-exam-pace-copy b{font-size:16px}}
'''
        out=out.rstrip()+block+'\\n'
        req(out.count(marker)==1,'v345 exam pace CSS must appear exactly once')
    return out
"""
assert css_anchor in text
text=text.replace(css_anchor,css_new,1)

js_anchor="""        req(out.count('function learningOutcomeReportDecisionV344(')==1,'v344 report decision helper must be unique')
    return out
"""
js_new="""        req(out.count('function learningOutcomeReportDecisionV344(')==1,'v344 report decision helper must be unique')
    if version=='v345':
        feature=feature_source if feature_source is not None else Path(V345_EXAM_PACE_SOURCE).read_text()
        req('V345_EXAM_PACE_PRESENTATION_SPEC' in feature,'v345 exam pace source marker missing')
        req('V345_EXAM_PACE_PRESENTATION_SPEC' not in out,'v345 exam pace source unexpectedly already materialized')
        out=replace_named_function(out,'renderLearningOutcomeReportV344',feature)
        req(out.count('const V345_EXAM_PACE_PRESENTATION_SPEC=')==1,'v345 exam pace source must be injected exactly once')
        req(out.count('function renderLearningOutcomeReportV344()')==1,'v345 outcome renderer replacement must be unique')
        req(out.count('function examPaceOutcomeDecisionV345(')==1,'v345 pace decision helper must be unique')
    return out
"""
assert js_anchor in text
text=text.replace(js_anchor,js_new,1)

manifest_anchor="""        result['learningOutcomes']={
          'version':'v344','sourcePath':V344_LEARNING_OUTCOMES_SOURCE,
          'utf8Bytes':len(feature_b),'sha256':sha_bytes(feature_b),'profileSchemaChange':False,
          'evidenceBasis':'bounded-recorded-answers-and-calendar-activity'
        }
    if cloud_assets:
"""
manifest_new="""        result['learningOutcomes']={
          'version':'v344','sourcePath':V344_LEARNING_OUTCOMES_SOURCE,
          'utf8Bytes':len(feature_b),'sha256':sha_bytes(feature_b),'profileSchemaChange':False,
          'evidenceBasis':'bounded-recorded-answers-and-calendar-activity'
        }
    if version=='v345':
        feature_path=root/V345_EXAM_PACE_SOURCE
        req(feature_path.exists(),'v345 exam pace source missing')
        feature_b=feature_path.read_bytes()
        result['examPacePresentation']={
          'version':'v345','sourcePath':V345_EXAM_PACE_SOURCE,
          'utf8Bytes':len(feature_b),'sha256':sha_bytes(feature_b),'profileSchemaChange':False,
          'evidenceBasis':'existing-exam-pace-status-and-taper-contract','passProbability':False
        }
    if cloud_assets:
"""
assert manifest_anchor in text
text=text.replace(manifest_anchor,manifest_new,1)

material_anchor="""    if version=='v343':feature_source=(root/V343_ADAPTIVE_PRECISION_SOURCE).read_text()
    elif version=='v344':feature_source=(root/V344_LEARNING_OUTCOMES_SOURCE).read_text()
    target['js'].write_text(transform_js(prev['js'].read_text(),previous,version,feature_source))
"""
material_new="""    if version=='v343':feature_source=(root/V343_ADAPTIVE_PRECISION_SOURCE).read_text()
    elif version=='v344':feature_source=(root/V344_LEARNING_OUTCOMES_SOURCE).read_text()
    elif version=='v345':feature_source=(root/V345_EXAM_PACE_SOURCE).read_text()
    target['js'].write_text(transform_js(prev['js'].read_text(),previous,version,feature_source))
"""
assert material_anchor in text
text=text.replace(material_anchor,material_new,1)

p.write_text(text)
print('Prepared v345 exam pace release transform')
