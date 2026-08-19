from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile,statistics

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-applied-reasoning-format-audit-(v(\d+))',b);req(m,'bad v294 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function pick(v,...ks){for(const k of ks){if(v&&v[k]!=null)return v[k];}return null;}
const rows=QUESTION_BANK.filter(q=>q&&q.coreTopicId).map(q=>({id:String(q.id||''),topic:String(q.coreTopicId||''),cat:String(pick(q,'cat','category','domain')||''),q:String(pick(q,'q','question','text')||''),options:(Array.isArray(q.options)?q.options:Array.isArray(q.opts)?q.opts:[]).map(String),exp:String(pick(q,'exp','explain','explanation')||''),keys:Object.keys(q).sort()}));
console.log('__V294__'+Buffer.from(JSON.stringify({v:APP_VERSION,totalQuestionBank:QUESTION_BANK.length,rows,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V294__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def chapter(topic):
    m=re.search(r'(?:^|_)(\d{1,2})(?:_|$)',topic);return int(m.group(1)) if m else None
def classify(row):
    q=row['q'];ql=q.lower();n=len(q)
    calc=bool(re.search(r'(求め|計算|算出|何(?:秒|分|時間|個|回|台|人|円|bit|byte|バイト|%|％)|平均|確率|稼働率|応答時間|転送時間|実効速度|損益分岐|利益|原価|工数|日数|最短|最大|最小)',q)) or (bool(re.search(r'\d',q)) and bool(re.search(r'[%％+×÷=／/]|Mbps|Gbps|MHz|GHz|ms|秒|分|円|人月|bit|byte|バイト',q,re.I)))
    data=bool(re.search(r'(次の図|図に|次の表|表に|グラフ|真理値表|回路|状態遷移|ER図|E-R図|ネットワーク図|PERT|アローダイアグラム|構成図|タイムチャート|SQL文|コード|擬似言語)',q,re.I))
    scenario=n>=110 or bool(re.search(r'(ある企業|ある会社|ある組織|あるシステム|あるサービス|あるプロジェクト|利用者|担当者|管理者|開発チーム|業務で|運用中|インシデント|顧客|取引先|新たに|導入する|変更する|障害が|要求が)',q))
    discrimination=bool(re.search(r'(適切|正しい|誤って|最も|説明として|特徴として|目的として|組合せ|どれか)',q))
    definition=not(calc or data or scenario) and n<=72 and bool(re.search(r'(とは|名称|用語|何か|どれか|ものは|説明として|特徴として)',q))
    return {'calc':calc,'data':data,'scenario':scenario,'discrimination':discrimination,'definitionLike':definition,'appliedAny':calc or data or scenario,'length':n}
def pct(a,b):return round(100*a/b,1) if b else 0.0
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v294','v293'),'expects v293')
source=Path('audits/RESULT_SCREEN_CLOSURE_SOURCE_v293.txt');req(source.exists() and 'PASS — CLOSURE SOURCE CAPTURED' in source.read_text(),'v293 evidence missing')
expected={'.github/subject-a-applied-reasoning-format-audit/validate_audit.py','.github/workflows/subject-a-applied-reasoning-format-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v294' and par['v']=='v293','versions');req(cand['totalQuestionBank']==par['totalQuestionBank'] and cand['rows']==par['rows'],'audit-only Subject A bank drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
rows=cand['rows'];req(len(rows)>=100,'core Subject A question bank unexpectedly small')
classified=[]
for r in rows:
    c=classify(r);classified.append({**r,**c,'chapter':chapter(r['topic'])})
metrics=['calc','data','scenario','discrimination','definitionLike','appliedAny']
def agg(xs):
    n=len(xs);return {'count':n,'medianStemChars':round(statistics.median([x['length'] for x in xs]),1) if xs else 0,**{k:{'count':sum(bool(x[k]) for x in xs),'pct':pct(sum(bool(x[k]) for x in xs),n)} for k in metrics}}
overall=agg(classified)
chapters={}
for ch in sorted(set(x['chapter'] for x in classified if x['chapter'] is not None)):
    chapters[str(ch)]=agg([x for x in classified if x['chapter']==ch])
# Diagnostic-only conservative signals, not textbook-prescribed quotas.
# Flag only sufficiently populated chapters that are overwhelmingly short definition-like or have no applied-form item at all.
signals=[]
for ch,a in chapters.items():
    if a['count']>=6 and a['definitionLike']['pct']>=80:signals.append({'chapter':ch,'type':'definition_dominance','detail':a})
    if a['count']>=6 and a['appliedAny']['count']==0:signals.append({'chapter':ch,'type':'no_applied_form_detected','detail':a})
examples={k:[{'id':x['id'],'topic':x['topic'],'q':x['q'][:180]} for x in classified if x[k]][:8] for k in ['calc','data','scenario','definitionLike']}
key_shapes={}
for x in classified:
    ks=tuple(x['keys']);key_shapes[ks]=key_shapes.get(ks,0)+1
shape_summary=[{'count':n,'keys':list(ks)} for ks,n in sorted(key_shapes.items(),key=lambda kv:-kv[1])[:8]]
summary={'questionBankTotal':cand['totalQuestionBank'],'coreSubjectARows':len(rows),'overall':overall,'chapters':chapters,'diagnosticSignals':signals,'examples':examples,'keyShapes':shape_summary}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — FORMAT EVIDENCE CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-applied-reasoning-format-v294.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v294 — Subject A Applied-Reasoning / Question-Format Audit
=================================================================

Result
------
PASS — FORMAT EVIDENCE CAPTURED
Previous release: v293
Source main: {parent}
Learner-facing change in v294: none

Reference basis
---------------
The supplied 令和8年度 textbook organizes Subject A across 21 chapters and repeatedly places "出る順！ 過去問＆完全解説" inside those chapters. The supplied 令和8年度 problem book separately contains the 令和7年度公開問題 for Subject A plus four selected Subject A mock sets. These sources support auditing FE QUEST for breadth of problem-solving forms rather than treating Subject A as terminology recall alone. They do not prescribe a numeric quota for calculation/scenario/diagram questions, so the percentages below are diagnostic evidence only and are not asserted as official target ratios.

Classification method
---------------------
Every QUESTION_BANK item with coreTopicId is classified by transparent stem-text heuristics into calculation/numeric, data/diagram/code interpretation, scenario/application, conceptual discrimination, and short definition-like forms. Labels are multi-valued except definition-like, which is excluded when calculation/data/scenario cues are present. Long stems (>=110 Japanese characters) count as scenario/application evidence. This is a source audit, not an exam-score model.

Overall Subject A core bank
---------------------------
{json.dumps(overall,ensure_ascii=False,indent=2)}

Per chapter-prefix distribution
-------------------------------
{json.dumps(chapters,ensure_ascii=False,indent=2)}

Conservative diagnostic signals
-------------------------------
{json.dumps(signals,ensure_ascii=False,indent=2)}

Representative detected examples (IDs/stems only)
-------------------------------------------------
{json.dumps(examples,ensure_ascii=False,indent=2)}

Question object shapes
----------------------
{json.dumps(shape_summary,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing content changed.
The core Subject A question rows are byte-data equivalent to v293.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use the per-chapter evidence to choose the smallest learning-quality follow-up. A chapter is not repaired simply because its calculation/scenario share is low: some syllabus areas are naturally conceptual. Only chapters with an extreme short-definition concentration or no applied-form evidence should be opened for manual content inspection against the supplied textbook/problem-book structure. Any new questions must be original unless they are clearly eligible public examination questions; do not copy proprietary book questions.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_APPLIED_REASONING_FORMAT_v294.txt').write_text(audit);print(audit)
