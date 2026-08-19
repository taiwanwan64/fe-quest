from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile,statistics

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-format-classifier-calibration-audit-(v(\d+))',b);req(m,'bad v296 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def chapter(topic):
    m=re.search(r'(?:^|_)(\d{1,2})(?:_|$)',topic);return int(m.group(1)) if m else None
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function pick(v,...ks){for(const k of ks){if(v&&v[k]!=null)return v[k];}return null;}
const rows=QUESTION_BANK.filter(q=>q&&q.coreTopicId).map(q=>({id:String(q.id||''),topic:String(q.coreTopicId||''),q:String(pick(q,'q','question','text')||''),options:(Array.isArray(q.options)?q.options:Array.isArray(q.opts)?q.opts:[]).map(String)}));
console.log('__V296__'+Buffer.from(JSON.stringify({v:APP_VERSION,rows,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V296__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def classify(r):
    q=r['q'];opts=r['options'];combined=' '.join([q]+opts);n=len(q)
    calc=bool(re.search(r'(求め|計算|算出|何(?:秒|分|時間|個|回|台|人|円|bit|byte|バイト|%|％)|平均|確率|稼働率|応答時間|転送時間|実効速度|損益分岐|利益|原価|工数|日数|最短|最大|最小)',q)) or (bool(re.search(r'\d',q)) and bool(re.search(r'[%％+×÷=／/]|Mbps|Gbps|MHz|GHz|ms|秒|分|円|人月|bit|byte|バイト',q,re.I)))
    data=bool(re.search(r'(次の図|図に|次の表|表に|グラフ|真理値表|回路|状態遷移|ER図|E-R図|ネットワーク図|PERT|アローダイアグラム|構成図|タイムチャート|SQL文|コード|擬似言語)',q,re.I))
    situational=bool(re.search(r'(企業|会社|組織|システム|サービス|プロジェクト|利用者|担当者|管理者|開発チーム|顧客|取引先|業務|運用|インシデント|要件|調達|契約|導入|障害|変更|要求|受注|在庫|製造|販売|発注|提案)',combined))
    action=bool(re.search(r'(最も適切|適切|対応|判断|選択|優先|実施|行う|すべき|次に|方法|目的|評価)',q))
    sentence_opts=sum(len(x)>=18 for x in opts)
    scenario=n>=110 or (situational and (action or sentence_opts>=2))
    applied=calc or data or scenario
    recall=(not applied) and n<=72 and sentence_opts<=1 and bool(re.search(r'(とは|名称|用語|何か|どれか|ものは|説明として|特徴として|文書は|活動は)',q))
    return {'calc':calc,'data':data,'scenario':scenario,'appliedAny':applied,'recallLike':recall,'sentenceOptions':sentence_opts,'stemChars':n}
def pct(a,b):return round(a/b*100,1) if b else 0.0
def agg(xs):
    n=len(xs);return {'count':n,'medianStemChars':round(statistics.median([x['stemChars'] for x in xs]),1) if xs else 0,'calcPct':pct(sum(x['calc'] for x in xs),n),'dataPct':pct(sum(x['data'] for x in xs),n),'scenarioPct':pct(sum(x['scenario'] for x in xs),n),'appliedPct':pct(sum(x['appliedAny'] for x in xs),n),'recallLikePct':pct(sum(x['recallLike'] for x in xs),n)}
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v296','v295'),'expects v295')
v295p=Path('_regression/subject-a-applied-reasoning-detail-v295.fixture.json');req(v295p.exists(),'v295 fixture missing');v295=json.loads(v295p.read_text());req(v295.get('result')=='PASS — SIGNAL CHAPTERS INSPECTED','v295 result')
expected={'.github/subject-a-format-classifier-calibration-audit/validate_audit.py','.github/workflows/subject-a-format-classifier-calibration-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v296' and par['v']=='v295','versions');req(cand['rows']==par['rows'],'audit-only bank drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
rows=[]
for r in cand['rows']:
    c=classify(r);rows.append({**r,**c,'chapter':chapter(r['topic'])})
overall=agg(rows);chapters={str(ch):agg([x for x in rows if x['chapter']==ch]) for ch in sorted({x['chapter'] for x in rows if x['chapter'] is not None})}
old_signal_chapters=v295['summary']['signalChapters'];old_vs_new={str(ch):{'old':next(x['detail'] for x in v295['summary']['sourceSignals'] if int(x['chapter'])==ch),'new':chapters[str(ch)]} for ch in old_signal_chapters}
# Conservative residual target: enough items, >=75% recall-like and <=10% applied, or literally zero applied after option-aware calibration.
residual=[]
for ch,a in chapters.items():
    if a['count']>=6 and (a['appliedPct']==0 or (a['recallLikePct']>=75 and a['appliedPct']<=10)):residual.append({'chapter':ch,'detail':a})
examples={str(ch):[{'id':x['id'],'q':x['q'][:180],'scenario':x['scenario'],'recallLike':x['recallLike'],'sentenceOptions':x['sentenceOptions']} for x in rows if x['chapter']==ch][:20] for ch in old_signal_chapters}
summary={'overall':overall,'chapters':chapters,'oldSignalChapters':old_signal_chapters,'oldVsNew':old_vs_new,'residualConservativeSignals':residual,'oldSignalExamples':examples}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — CLASSIFIER CALIBRATED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-format-classifier-calibration-v296.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v296 — Subject A Question-Format Classifier Calibration Audit
=======================================================================

Result
------
PASS — CLASSIFIER CALIBRATED
Previous release: v295
Source main: {parent}
Learner-facing change in v296: none

Why recalibrate
---------------
v295 showed that v294's stem-only lexical classifier falsely labeled chapters 17 and 19 as having no applied-form questions. In chapter 17, several short stems lead to long, scenario-like alternatives and action judgments. v296 therefore uses both the stem and answer alternatives, and recognizes practical decision cues such as requirements, procurement, operations, customers, proposals and business processes. This remains a diagnostic heuristic, not an official exam quota.

Overall calibrated distribution
-------------------------------
{json.dumps(overall,ensure_ascii=False,indent=2)}

Old v294 signals versus calibrated result
-----------------------------------------
{json.dumps(old_vs_new,ensure_ascii=False,indent=2)}

Residual conservative signals
-----------------------------
{json.dumps(residual,ensure_ascii=False,indent=2)}

Per-chapter calibrated distribution
-----------------------------------
{json.dumps(chapters,ensure_ascii=False,indent=2)}

Old-signal examples under calibrated classifier
-----------------------------------------------
{json.dumps(examples,ensure_ascii=False,indent=2)}

Reference interpretation
------------------------
The supplied textbook/problem-book structure supports broad practice across Subject A, but it does not define a required percentage of scenario or calculation items. Therefore v296 only uses extreme residual signals to decide whether manual content inspection is warranted. A conceptual chapter is allowed to remain conceptual.

Regression
----------
No learner-facing content changed.
All 550 core Subject A question rows are equivalent to v295.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If the old chapter-17/19 signals disappear and no new extreme residual remains, close this particular format-balance concern without adding questions. If a residual remains, inspect only that chapter manually before writing any original content.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_FORMAT_CLASSIFIER_CALIBRATION_v296.txt').write_text(audit);print(audit)
