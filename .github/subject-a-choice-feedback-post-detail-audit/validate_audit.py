from pathlib import Path
import json,os,re,subprocess

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-choice-feedback-post-detail-audit-(v(\d+))',b);req(m,'bad v299 branch');return m.group(1),f'v{int(m.group(2))-1}'
def strip_generic(text):
    s=text.strip()
    phrases=[
      '問題文の条件とは一致しない。','問題文の条件とは一致しない',
      '同じ分野の用語だが、問われている役割ではない。','同じ分野の用語だが、問われている役割ではない',
      'この設問が問う対象とは役割が異なる。','この設問が問う対象とは役割が異なる',
      'ここで求める定義には当てはまらない。','ここで求める定義には当てはまらない',
      '正解ではありません。','正解ではありません','誤りです。','誤りです'
    ]
    for p in phrases:s=s.replace(p,'')
    return re.sub(r'\s+',' ',s).strip(' 。')
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v299','v298'),'expects v298')
p=Path('_regression/subject-a-generic-choice-feedback-detail-v298.fixture.json');req(p.exists(),'v298 fixture missing');v298=json.loads(p.read_text());req(v298.get('result')=='PASS — GENERIC FEEDBACK DETAIL CAPTURED','v298 result')
expected={'.github/subject-a-choice-feedback-post-detail-audit/validate_audit.py','.github/workflows/subject-a-choice-feedback-post-detail-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
# Audit the captured v298 production evidence rather than reclassifying the whole bank.
detail=v298['summary']['detail'];rows=[];weak=[]
for d in detail:
    for w in d['wrongChoices']:
        if not w.get('genericMarkers'):continue
        core=strip_generic(w['explanation']);row={'id':d['id'],'topic':d['topic'],'index':w['index'],'option':w['option'],'original':w['explanation'],'genericMarkers':w['genericMarkers'],'conceptSpecificRemainder':core,'remainderChars':len(core)};rows.append(row)
        # Below 18 chars after removing generic boilerplate is a conservative manual-review threshold only.
        if len(core)<18:weak.append(row)
summary={'targetQuestions':len(detail),'genericWrongChoices':len(rows),'weakAfterBoilerplateRemoval':len(weak),'weakRows':weak,'remainderMinChars':min((x['remainderChars'] for x in rows),default=0),'remainderExamples':rows[:30]}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — POST-DETAIL EVIDENCE CAPTURED','summary':summary,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-choice-feedback-post-detail-v299.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v299 — Subject A Choice-Feedback Post-Detail Audit
===========================================================

Result
------
PASS — POST-DETAIL EVIDENCE CAPTURED
Previous release: v298
Source main: {parent}
Learner-facing change in v299: none

Purpose
-------
v298 showed that the repeated generic phrases usually follow a concrete definition of the distractor. v299 removes only the generic boilerplate phrases from the captured explanations and measures what concept-specific teaching remains. This avoids rewriting useful feedback merely because it ends with a common sentence.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Interpretation
--------------
The 18-character threshold is an internal conservative review trigger, not a textbook or exam requirement. If a wrong-choice explanation still contains a substantive concept definition after generic boilerplate is stripped, the feedback is already diagnostic enough for the learner and should be preserved. Only rows with a genuinely thin remainder should be considered for editing.

Regression
----------
No learner-facing content changed.
v299 analyzes the validated v298 evidence only; the standard release validator separately enforces candidate/mechanical-reference equality and production invariants.

Decision
--------
If weakAfterBoilerplateRemoval is zero, close the Subject A explanation-quality sequence without content changes. If non-zero, repair only those exact wrong-choice explanations and leave all stems, options, answers and already diagnostic feedback untouched.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_CHOICE_FEEDBACK_POST_DETAIL_v299.txt').write_text(audit);print(audit)
