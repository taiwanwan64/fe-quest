from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-applied-reasoning-detail-audit-(v(\d+))',b);req(m,'bad v295 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def chapter(topic):
    m=re.search(r'(?:^|_)(\d{1,2})(?:_|$)',topic);return int(m.group(1)) if m else None
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function pick(v,...ks){for(const k of ks){if(v&&v[k]!=null)return v[k];}return null;}
const rows=QUESTION_BANK.filter(q=>q&&q.coreTopicId).map(q=>({id:String(q.id||''),topic:String(q.coreTopicId||''),cat:String(pick(q,'cat','category','domain')||''),q:String(pick(q,'q','question','text')||''),options:(Array.isArray(q.options)?q.options:Array.isArray(q.opts)?q.opts:[]).map(String),a:Number.isInteger(Number(q.a))?Number(q.a):null,exp:String(pick(q,'exp','explain','explanation')||''),choiceExps:Array.isArray(q.choiceExps)?q.choiceExps.map(String):[]}));
console.log('__V295__'+Buffer.from(JSON.stringify({v:APP_VERSION,rows,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V295__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def cues(q):
    return {
      'numeric':bool(re.search(r'\d|%|％|秒|分|円|人月|bit|byte|バイト',q,re.I)),
      'scenario':bool(re.search(r'(ある企業|ある会社|ある組織|あるシステム|あるサービス|あるプロジェクト|利用者|担当者|管理者|顧客|取引先|導入|運用|要件|調達|契約|障害|変更)',q)),
      'actionJudgment':bool(re.search(r'(最も適切|適切|対応|判断|選択|優先|実施|行う|すべき)',q)),
      'definition':bool(re.search(r'(とは|名称|用語|説明として|特徴として|ものは|どれか)',q))
    }
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v295','v294'),'expects v294')
fixture_path=Path('_regression/subject-a-applied-reasoning-format-v294.fixture.json');req(fixture_path.exists(),'v294 fixture missing');v294=json.loads(fixture_path.read_text());req(v294.get('result')=='PASS — FORMAT EVIDENCE CAPTURED','v294 fixture result')
signals=v294['summary'].get('diagnosticSignals',[]);signal_chapters=sorted({int(x['chapter']) for x in signals});req(signal_chapters,'v294 produced no conservative signal chapters')
expected={'.github/subject-a-applied-reasoning-detail-audit/validate_audit.py','.github/workflows/subject-a-applied-reasoning-detail-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v295' and par['v']=='v294','versions');req(cand['rows']==par['rows'],'audit-only Subject A bank drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
rows=[]
for r in cand['rows']:
    ch=chapter(r['topic'])
    if ch in signal_chapters:rows.append({**r,'chapter':ch,'stemChars':len(r['q']),'cues':cues(r['q'])})
by_ch={}
for ch in signal_chapters:
    xs=[x for x in rows if x['chapter']==ch];by_ch[str(ch)]={'count':len(xs),'topics':sorted({x['topic'] for x in xs}),'scenarioCue':sum(x['cues']['scenario'] for x in xs),'actionJudgmentCue':sum(x['cues']['actionJudgment'] for x in xs),'definitionCue':sum(x['cues']['definition'] for x in xs),'medianStemChars':sorted([x['stemChars'] for x in xs])[len(xs)//2] if xs else 0,'items':xs}
# Reference-book chapter titles are used only as orientation; no proprietary question text is copied.
reference_titles={1:'基礎理論1',2:'基礎理論2',3:'アルゴリズムとプログラミング',4:'コンピュータの構成要素',5:'システムの構成要素',6:'ソフトウェア',7:'ハードウェア',8:'ユーザーインタフェースとマルチメディア',9:'データベース',10:'ネットワーク',11:'情報セキュリティ',12:'システム開発',13:'ソフトウェア開発手法',14:'プロジェクトマネジメント',15:'サービスマネジメントとシステム監査',16:'システム戦略',17:'システム企画',18:'経営戦略マネジメント',19:'ビジネスインダストリ',20:'企業活動',21:'法務'}
orientation={str(ch):reference_titles.get(ch,'') for ch in signal_chapters}
summary={'sourceSignals':signals,'signalChapters':signal_chapters,'referenceOrientation':orientation,'detail':by_ch}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — SIGNAL CHAPTERS INSPECTED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-applied-reasoning-detail-v295.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
# Keep audit compact enough to review: include full stems/options for only the conservative signal chapters.
audit=f'''FE QUEST v295 — Subject A Applied-Reasoning Signal-Chapter Detail Audit
=======================================================================

Result
------
PASS — SIGNAL CHAPTERS INSPECTED
Previous release: v294
Source main: {parent}
Learner-facing change in v295: none

Reference basis
---------------
The supplied 令和8年度 textbook covers Subject A in chapters 1–21 and repeatedly integrates worked past-question sections; the supplied problem book contains the 令和7年度公開問題 and four Subject A mock sets. v294 therefore measured question-form breadth without inventing official format quotas. v295 opens only the conservative signal chapters from that audit. Reference chapter titles below are orientation labels only; no proprietary book questions are reproduced.

v294 conservative signals
-------------------------
{json.dumps(signals,ensure_ascii=False,indent=2)}

Signal chapter orientation
--------------------------
{json.dumps(orientation,ensure_ascii=False,indent=2)}

Detailed current FE QUEST items
-------------------------------
{json.dumps(by_ch,ensure_ascii=False,indent=2)}

Interpretation
--------------
A zero/low heuristic applied-form count is not by itself a content defect. The detailed stems must show whether the chapter already asks learners to choose actions or reason from a situation even when the v294 lexical classifier missed it. Only a chapter that is genuinely dominated by short recall/discrimination after this manual-readable detail should receive new original scenario/application items.

Regression
----------
No learner-facing content changed.
All 550 core Subject A question rows are equivalent to v294.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use this detail to choose at most one narrowly scoped content repair. Prefer an original scenario/application item in a concept area where the current bank asks only definitions but the supplied textbook structure clearly treats the chapter as a practical decision domain. Do not copy proprietary problem-book questions.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_APPLIED_REASONING_DETAIL_v295.txt').write_text(audit);print(audit)
