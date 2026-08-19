from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-mock-cognitive-metadata-audit-(v(\d+))',b);req(m,'bad v303 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function clean(v){return v==null?'':String(v);}
function row(q){return {id:clean(q?.id),cat:clean(q?.cat),difficulty:clean(q?.difficulty),cognitive:clean(q?.cognitiveLevel),coreTopicId:clean(q?.coreTopicId),concept:clean(q?.concept),angle:clean(q?.angle),q:clean(q?.q),options:(q?.options||[]).map(String),judgmentDemand:clean(q?.judgmentDemand),judgmentAudit:clean(q?.judgmentAudit),applicationDemand:clean(q?.applicationDemand),applicationAudit:clean(q?.applicationAudit),recallDemand:clean(q?.recallDemand),recallAudit:clean(q?.recallAudit),cognitiveRewrite:clean(q?.cognitiveRewrite),explainTopicId:clean(q?.explainTopicId)};}
const pool=QUESTION_BANK.filter(q=>q.cat==='ストラテジ'&&q.difficulty==='標準').map(row);const target=pool.find(q=>q.id==='strat-16');
const out={v:APP_VERSION,pool,target,sem:validateSubjectBSemantics()};console.log('__V303__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V303__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def evidence(r):
    q=r['q'];opts=r['options'];joined=' '.join(opts);numeric=bool(re.search(r'\d',q)) and bool(re.search(r'(求め|計算|算出|%|％|÷|/|円|利益|投資額|ROI)',q,re.I));decision=bool(re.search(r'(最も適切|考え方として|対応として|優先|判断|どのように|採るべき|すべき)',q));scenario=bool(re.search(r'(企業|会社|組織|経営|業務|顧客|プロジェクト|システム|担当|市場|調達|契約|製品|サービス)',q)) or len(q)>=75;sentence_opts=sum(len(x)>=18 for x in opts);judgment_score=(2 if decision else 0)+(1 if scenario else 0)+(1 if sentence_opts>=3 else 0)+(1 if r['judgmentDemand'] else 0)-(2 if numeric else 0);application_score=(2 if numeric else 0)+(1 if re.search(r'(分類|該当|どれか|求め)',q) else 0)+(1 if r['applicationDemand'] else 0);return {'numericDirect':numeric,'decisionCue':decision,'scenarioCue':scenario,'sentenceOptions':sentence_opts,'judgmentScore':judgment_score,'applicationScore':application_score}
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v303','v302'),'expects v302')
v302p=Path('_regression/subject-a-mock-selection-detail-v302.fixture.json');req(v302p.exists(),'v302 fixture missing');v302=json.loads(v302p.read_text());req(v302.get('result')=='PASS — MOCK SELECTION DETAIL CAPTURED','v302 result');req(v302['summary']['sameCategoryDifficultyPool']['cognitiveCounts']=={'想起':4,'適用':66,'判断':1},'v302 cognitive pool finding drift')
expected={'.github/subject-a-mock-cognitive-metadata-audit/validate_audit.py','.github/workflows/subject-a-mock-cognitive-metadata-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v303' and par['v']=='v302','versions');req(cand['pool']==par['pool'],'pool drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
rows=[]
for r in cand['pool']:
    e=evidence(r);rows.append({**r,'evidence':e})
target=next(r for r in rows if r['id']=='strat-16');candidates=sorted([r for r in rows if r['cognitive']=='適用' and r['evidence']['judgmentScore']>=3 and not r['evidence']['numericDirect']],key=lambda r:(-r['evidence']['judgmentScore'],-len(r['q']),r['id']))
mislabels=[]
if target['cognitive']=='判断' and target['evidence']['numericDirect'] and target['evidence']['applicationScore']>=2:mislabels.append({'id':'strat-16','current':'判断','suggestedRole':'適用','reason':'direct numeric/formula application','evidence':target['evidence'],'q':target['q']})
summary={'sourceFinding':{'onlyJudgmentInStrategyStandard':True,'target':'strat-16','forcedFreshFullSelectionPct':100.0},'target':target,'highConfidenceJudgmentCandidates':[{k:r[k] for k in ['id','cognitive','coreTopicId','concept','angle','q','options','judgmentDemand','applicationDemand','cognitiveRewrite','evidence']} for r in candidates[:16]],'suspectedMislabels':mislabels,'poolRows':rows,'interpretation':'A one-for-one retag would merely move deterministic selection to a different sole 判断 item. A safe repair needs strat-16 moved to 適用 only if its content role supports that, plus at least two genuinely judgment-style peers in the same category/difficulty pool so the required judgment slot can rotate.'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — COGNITIVE METADATA EVIDENCE CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-cognitive-metadata-v303.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v303 — Subject A Mock Cognitive-Metadata Audit
========================================================

Result
------
PASS — COGNITIVE METADATA EVIDENCE CAPTURED
Previous release: v302
Source main: {parent}
Learner-facing change in v303: none

Purpose
-------
v302 proved that strat-16 is selected deterministically because it is the only 判断-tagged question in the 71-question ストラテジ／標準 pool while the full mock still needs another 判断 item at that selection step. v303 checks the actual question content and existing cognitive audit metadata before deciding whether the problem is the selector or the metadata.

Method
------
Inspect all 71 questions in the exact pool. Flag direct numeric/formula use as strong 適用 evidence and scenario/decision wording with substantive alternatives as 判断 evidence. Existing judgmentDemand/applicationDemand/cognitiveRewrite metadata is preserved as supporting evidence rather than overwritten. This is an internal pedagogical metadata audit, not an assertion about an official IPA cognitive quota.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing content changed.
All 71 ストラテジ／標準 rows are equivalent to v302.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Do not weaken the mock's cognitive target just to remove a repeated item. If the content evidence confirms strat-16 is really an application/calculation question and identifies at least two genuinely judgment-style peers currently tagged 適用, repair only those cognitiveLevel metadata values and then rerun full/half mock simulation. This preserves category and difficulty composition while allowing the judgment slot to rotate.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_COGNITIVE_METADATA_v303.txt').write_text(audit);print(audit)
