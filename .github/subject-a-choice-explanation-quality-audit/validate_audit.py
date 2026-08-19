from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile,statistics

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-choice-explanation-quality-audit-(v(\d+))',b);req(m,'bad v297 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function pick(v,...ks){for(const k of ks){if(v&&v[k]!=null)return v[k];}return null;}
const rows=QUESTION_BANK.filter(q=>q&&q.coreTopicId).map(q=>({id:String(q.id||''),topic:String(q.coreTopicId||''),q:String(pick(q,'q','question','text')||''),options:(Array.isArray(q.options)?q.options:Array.isArray(q.opts)?q.opts:[]).map(String),a:Number.isInteger(Number(q.a))?Number(q.a):null,exp:String(pick(q,'exp','explain','explanation')||''),choiceExps:Array.isArray(q.choiceExps)?q.choiceExps.map(x=>String(x||'')):[]}));
console.log('__V297__'+Buffer.from(JSON.stringify({v:APP_VERSION,rows,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V297__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def chapter(topic):
    m=re.search(r'(?:^|_)(\d{1,2})(?:_|$)',topic);return int(m.group(1)) if m else None
def generic(text):
    s=re.sub(r'\s+','',text)
    pats=['別の役割・性質を表す選択肢','問題文の条件とは一致しない','同じ分野の用語だが、問われている役割ではない','正解ではありません','誤りです']
    hits=sum(p.replace(' ','') in s for p in pats)
    # A generic marker is only concerning when there is little concrete follow-up content.
    return hits>0 and len(s)<55
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v297','v296'),'expects v296')
source=Path('audits/SUBJECT_A_FORMAT_CLASSIFIER_CALIBRATION_v296.txt');req(source.exists() and 'PASS — CLASSIFIER CALIBRATED' in source.read_text(),'v296 evidence missing')
expected={'.github/subject-a-choice-explanation-quality-audit/validate_audit.py','.github/workflows/subject-a-choice-explanation-quality-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v297' and par['v']=='v296','versions');req(cand['rows']==par['rows'],'audit-only bank drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
rows=cand['rows'];req(len(rows)==550,'Subject A core bank count drift')
findings=[];wrong_exps=[];question_stats=[]
for r in rows:
    opts=r['options'];ce=r['choiceExps'];a=r['a'];ch=chapter(r['topic'])
    missing_main=not r['exp'].strip();invalid_a=a is None or a<0 or a>=len(opts);length_mismatch=len(ce)!=len(opts);blank=[i for i,x in enumerate(ce) if not x.strip()]
    wrong=[(i,ce[i] if i<len(ce) else '') for i in range(len(opts)) if i!=a]
    for i,e in wrong:wrong_exps.append({'id':r['id'],'chapter':ch,'index':i,'text':e,'chars':len(e.strip()),'generic':generic(e)})
    duplicate_wrong=len([e for _,e in wrong if e.strip()])>=2 and len(set(e.strip() for _,e in wrong if e.strip()))<len([e for _,e in wrong if e.strip()])
    short_wrong=[i for i,e in wrong if len(e.strip())<18]
    generic_wrong=[i for i,e in wrong if generic(e)]
    issues=[]
    if missing_main:issues.append('missing_main_explanation')
    if invalid_a:issues.append('invalid_answer_index')
    if length_mismatch:issues.append('choice_explanation_length_mismatch')
    if blank:issues.append('blank_choice_explanation')
    if duplicate_wrong:issues.append('duplicate_wrong_explanation')
    if len(short_wrong)>=2:issues.append('multiple_short_wrong_explanations')
    if len(generic_wrong)>=2:issues.append('multiple_generic_wrong_explanations')
    if issues:findings.append({'id':r['id'],'chapter':ch,'topic':r['topic'],'issues':issues,'blankIndexes':blank,'shortWrongIndexes':short_wrong,'genericWrongIndexes':generic_wrong,'stem':r['q'][:160]})
    question_stats.append({'id':r['id'],'chapter':ch,'mainChars':len(r['exp'].strip()),'choiceChars':[len(x.strip()) for x in ce]})
all_choice=[n for q in question_stats for n in q['choiceChars']]
wrong_chars=[x['chars'] for x in wrong_exps]
by_ch={}
for ch in sorted({x['chapter'] for x in question_stats if x['chapter'] is not None}):
    ids=[q for q in question_stats if q['chapter']==ch];fs=[f for f in findings if f['chapter']==ch];we=[x for x in wrong_exps if x['chapter']==ch]
    by_ch[str(ch)]={'questions':len(ids),'findingQuestions':len(fs),'genericWrongChoices':sum(x['generic'] for x in we),'wrongChoices':len(we),'medianWrongExplanationChars':round(statistics.median([x['chars'] for x in we]),1) if we else 0}
high=[f for f in findings if any(x in f['issues'] for x in ['missing_main_explanation','invalid_answer_index','choice_explanation_length_mismatch','blank_choice_explanation'])]
quality=[f for f in findings if f not in high]
summary={'questions':len(rows),'mainExplanationMissing':sum(not r['exp'].strip() for r in rows),'choiceExplanationLengthMismatch':sum(len(r['choiceExps'])!=len(r['options']) for r in rows),'blankChoiceExplanations':sum(sum(not x.strip() for x in r['choiceExps']) for r in rows),'medianChoiceExplanationChars':round(statistics.median(all_choice),1),'medianWrongExplanationChars':round(statistics.median(wrong_chars),1),'genericWrongChoiceCount':sum(x['generic'] for x in wrong_exps),'wrongChoiceCount':len(wrong_exps),'highPriorityFindingQuestions':len(high),'qualityFindingQuestions':len(quality),'highPriority':high[:40],'qualitySamples':quality[:60],'byChapter':by_ch}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — EXPLANATION EVIDENCE CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-choice-explanation-quality-v297.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v297 — Subject A Choice-Explanation Quality Audit
=========================================================

Result
------
PASS — EXPLANATION EVIDENCE CAPTURED
Previous release: v296
Source main: {parent}
Learner-facing change in v297: none

Reference basis
---------------
The supplied 令和8年度 textbook repeatedly pairs topic instruction with "過去問＆完全解説", and the supplied problem book is explicitly organized around public/mock questions. This supports checking that FE QUEST teaches from wrong choices rather than merely revealing the correct answer. The source does not prescribe a character-count threshold, so the thresholds below are internal diagnostics only.

Method
------
Audit all 550 Subject A core questions for a main explanation, valid answer index, one non-empty choice explanation per option, and then separately flag weak-learning signals: repeated identical wrong-choice explanations, two or more very short wrong-choice explanations (<18 characters), or two or more generic short explanations such as "the condition does not match" without concrete concept feedback. Structural completeness is high priority; wording-depth signals require manual review before editing.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing content changed.
All 550 Subject A core questions are equivalent to v296.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Repair structural explanation gaps immediately if any exist. If structural completeness is perfect but a small cluster of generic/short wrong-choice feedback remains, open only those IDs for detail review and replace generic feedback with concise concept-specific reasoning. Do not rewrite already diagnostic explanations merely to make them longer.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_CHOICE_EXPLANATION_QUALITY_v297.txt').write_text(audit);print(audit)
