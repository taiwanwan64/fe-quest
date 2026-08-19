from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile,collections

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-cognitive-rubric-calibration-audit-(v(\d+))',b);req(m,'bad v304 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function c(v){return v==null?'':String(v)}
function row(q){return {id:c(q?.id),cat:c(q?.cat),difficulty:c(q?.difficulty),cognitive:c(q?.cognitiveLevel),coreTopicId:c(q?.coreTopicId),concept:c(q?.concept),angle:c(q?.angle),q:c(q?.q),options:(q?.options||[]).map(String),judgmentDemand:c(q?.judgmentDemand),judgmentAudit:c(q?.judgmentAudit),applicationDemand:c(q?.applicationDemand),applicationAudit:c(q?.applicationAudit),recallDemand:c(q?.recallDemand),recallAudit:c(q?.recallAudit),cognitiveRewrite:c(q?.cognitiveRewrite)};}
const rows=QUESTION_BANK.map(row);console.log('__V304__'+Buffer.from(JSON.stringify({v:APP_VERSION,rows,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V304__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def features(r):
    q=r['q'];opts=r['options'];numeric=bool(re.search(r'\d',q)) and bool(re.search(r'(求め|計算|算出|%|％|÷|/|円|利益|投資|速度|時間|確率|稼働率|件|bit|byte)',q,re.I));decision=bool(re.search(r'(最も適切|考え方として|対応として|優先|判断|すべき|注意すべき|次に行う|採用|選ぶ)',q));scenario=bool(re.search(r'(企業|会社|組織|経営|業務|顧客|プロジェクト|システム|担当|市場|調達|契約|製品|サービス|インシデント|障害)',q)) or len(q)>=75;sentence=sum(len(x)>=18 for x in opts);return {'numericDirect':numeric,'decisionCue':decision,'scenarioCue':scenario,'sentenceOptions':sentence}
def sample(r):return {k:r[k] for k in ['id','cat','difficulty','cognitive','coreTopicId','concept','angle','q','options','judgmentDemand','applicationDemand','cognitiveRewrite','features']}
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v304','v303'),'expects v303')
v303p=Path('_regression/subject-a-mock-cognitive-metadata-v303.fixture.json');req(v303p.exists(),'v303 fixture missing');v303=json.loads(v303p.read_text());req(v303.get('result')=='PASS — COGNITIVE METADATA EVIDENCE CAPTURED','v303 result')
expected={'.github/subject-a-cognitive-rubric-calibration-audit/validate_audit.py','.github/workflows/subject-a-cognitive-rubric-calibration-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v304' and par['v']=='v303','versions');req(cand['rows']==par['rows'],'bank drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
rows=[]
for r in cand['rows']:rows.append({**r,'features':features(r)})
jud=[r for r in rows if r['cognitive']=='判断'];app=[r for r in rows if r['cognitive']=='適用'];stdjud=[r for r in jud if r['difficulty']=='標準'];demands=collections.Counter(r['judgmentDemand'] or '(blank)' for r in jud);std_demands=collections.Counter(r['judgmentDemand'] or '(blank)' for r in stdjud)
direct_jud=[r for r in jud if r['features']['numericDirect']];direct_std=[r for r in stdjud if r['features']['numericDirect']];context_compare=[r for r in jud if r['judgmentDemand']=='文脈比較'];strategy_std=[r for r in rows if r['cat']=='ストラテジ' and r['difficulty']=='標準'];strategy_apply=[r for r in strategy_std if r['cognitive']=='適用'];strategy_like=[r for r in strategy_apply if r['features']['decisionCue'] and r['features']['sentenceOptions']>=3 and (r['features']['scenarioCue'] or r['angle'] in ['scenario','discrimination'])]
summary={'counts':{'bank':len(rows),'judgment':len(jud),'application':len(app),'standardJudgment':len(stdjud),'directNumericJudgment':len(direct_jud),'directNumericStandardJudgment':len(direct_std)},'judgmentDemandDistribution':dict(demands),'standardJudgmentDemandDistribution':dict(std_demands),'directNumericJudgmentSamples':[sample(r) for r in direct_jud[:30]],'contextCompareJudgmentSamples':[sample(r) for r in context_compare[:40]],'strategyStandard':{'count':len(strategy_std),'judgment':[sample(r) for r in strategy_std if r['cognitive']=='判断'],'judgmentLikeApplicationCandidates':[sample(r) for r in strategy_like[:30]]},'rubricInterpretation':'Use the existing bank itself as the calibration set. A retag is high-confidence only when its content structure clearly conflicts with the dominant structure of similarly tagged questions; do not promote scenario/application questions to 判断 merely to satisfy diversity.'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — COGNITIVE RUBRIC CALIBRATED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-cognitive-rubric-calibration-v304.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v304 — Subject A Cognitive-Rubric Calibration Audit
==========================================================

Result
------
PASS — COGNITIVE RUBRIC CALIBRATED
Previous release: v303
Source main: {parent}
Learner-facing change in v304: none

Purpose
-------
v303 identified strat-16 as direct formula application despite its 判断 tag, but also showed several scenario questions currently tagged 適用. v304 calibrates that distinction against the existing QUESTION_BANK as a whole before any retagging. The goal is to distinguish a real metadata error from a merely judgment-like wording style.

Method
------
Inventory every 判断 and 適用 question, their judgmentDemand/applicationDemand metadata, difficulty and transparent structural cues. In particular, compare direct numeric 判断 questions and the existing 文脈比較 subset with Strategy/standard candidates. The current bank is treated as the internal rubric; no external or official cognitive taxonomy is invented.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing content changed.
QUESTION_BANK rows are equivalent to v303.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Retag only if the calibration shows strat-16 is an outlier even among existing 文脈比較／判断 questions. If existing direct numeric questions are commonly and intentionally labeled 判断, keep metadata and repair selection diversity instead. If strat-16 is a clear outlier, identify at least two Strategy/standard questions whose structure genuinely matches the calibrated 判断 rubric before making a metadata-only repair.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_COGNITIVE_RUBRIC_CALIBRATION_v304.txt').write_text(audit);print(audit)
