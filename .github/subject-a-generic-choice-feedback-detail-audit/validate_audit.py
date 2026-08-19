from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-generic-choice-feedback-detail-audit-(v(\d+))',b);req(m,'bad v298 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path,ids):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=f'''
const ids=new Set({json.dumps(ids,ensure_ascii=False)});
function pick(v,...ks){{for(const k of ks){{if(v&&v[k]!=null)return v[k];}}return null;}}
const rows=QUESTION_BANK.filter(q=>ids.has(String(q.id||''))).map(q=>({{id:String(q.id||''),topic:String(q.coreTopicId||''),q:String(pick(q,'q','question','text')||''),options:(Array.isArray(q.options)?q.options:Array.isArray(q.opts)?q.opts:[]).map(String),a:Number(q.a),exp:String(pick(q,'exp','explain','explanation')||''),choiceExps:Array.isArray(q.choiceExps)?q.choiceExps.map(String):[]}}));
console.log('__V298__'+Buffer.from(JSON.stringify({{v:APP_VERSION,rows,sem:validateSubjectBSemantics()}})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V298__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def generic(text):
    s=re.sub(r'\s+','',text);pats=['別の役割・性質を表す選択肢','問題文の条件とは一致しない','同じ分野の用語だが、問われている役割ではない','正解ではありません','誤りです'];return [p for p in pats if p.replace(' ','') in s]
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v298','v297'),'expects v297')
p=Path('_regression/subject-a-choice-explanation-quality-v297.fixture.json');req(p.exists(),'v297 fixture missing');v297=json.loads(p.read_text());req(v297.get('result')=='PASS — EXPLANATION EVIDENCE CAPTURED','v297 result')
qs=v297['summary']['qualitySamples'];targets=[x for x in qs if 'multiple_generic_wrong_explanations' in x.get('issues',[])];ids=[x['id'] for x in targets];req(ids,'no generic targets')
expected={'.github/subject-a-generic-choice-feedback-detail-audit/validate_audit.py','.github/workflows/subject-a-generic-choice-feedback-detail-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html',ids),runtime('_site_parent/index.html',ids);req(cand['v']=='v298' and par['v']=='v297','versions');req(cand['rows']==par['rows'],'audit-only target drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
req(set(ids)=={x['id'] for x in cand['rows']},'target retrieval mismatch')
detail=[]
for r in cand['rows']:
    wrong=[]
    for i,(opt,e) in enumerate(zip(r['options'],r['choiceExps'])):
        if i==r['a']:continue
        hits=generic(e);wrong.append({'index':i,'option':opt,'explanation':e,'genericMarkers':hits,'chars':len(e.strip())})
    detail.append({'id':r['id'],'topic':r['topic'],'stem':r['q'],'correctIndex':r['a'],'correctOption':r['options'][r['a']] if 0<=r['a']<len(r['options']) else None,'wrongChoices':wrong})
# Manual-review signal: two or more wrong explanations with generic markers and no named/quoted option term in the explanation body.
repair_candidates=[]
for d in detail:
    weak=[]
    for w in d['wrongChoices']:
        norm_opt=re.sub(r'[「」\s]','',w['option']);norm_exp=re.sub(r'[「」\s]','',w['explanation'])
        option_named=(len(norm_opt)>=2 and norm_opt[:min(8,len(norm_opt))] in norm_exp)
        if w['genericMarkers'] and not option_named:weak.append(w['index'])
    if len(weak)>=2:repair_candidates.append({'id':d['id'],'weakWrongIndexes':weak})
summary={'targetQuestions':len(ids),'detail':detail,'repairCandidates':repair_candidates}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — GENERIC FEEDBACK DETAIL CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-generic-choice-feedback-detail-v298.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v298 — Subject A Generic Wrong-Choice Feedback Detail Audit
====================================================================

Result
------
PASS — GENERIC FEEDBACK DETAIL CAPTURED
Previous release: v297
Source main: {parent}
Learner-facing change in v298: none

Purpose
-------
v297 confirmed perfect structural explanation coverage across all 550 Subject A core questions, but found a smaller cluster where two or more wrong choices use short generic feedback. v298 opens only that cluster. The goal is not to make every explanation longer; it is to determine whether the learner is told what the distractor actually means and why it does not fit.

Target count
------------
{len(ids)} questions

Detailed target evidence
------------------------
{json.dumps(detail,ensure_ascii=False,indent=2)}

Conservative repair candidates
------------------------------
{json.dumps(repair_candidates,ensure_ascii=False,indent=2)}

Interpretation
--------------
A generic phrase is acceptable when it is followed by concrete concept-specific reasoning. A repair candidate requires at least two wrong options whose feedback contains a generic marker and does not even name the option/concept in a simple text check. The next step should manually inspect only these candidates and improve factual diagnostic feedback without changing stems, answers or difficulty.

Regression
----------
No learner-facing content changed.
All targeted questions are equivalent to v297.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If repairCandidates is non-empty, repair only those wrong-choice explanations using original concise concept-specific wording. Preserve question stems, options, correct answers, selection logic and scoring. If it is empty, close this explanation-quality concern without edits.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_GENERIC_CHOICE_FEEDBACK_DETAIL_v298.txt').write_text(audit);print(audit)
