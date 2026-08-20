from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-a-mock-calibration-closure-audit-(v(\d+))',b);req(m,'bad v310 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
const out={v:APP_VERSION,blueprints:MOCK_BLUEPRINTS,pref:String(mockCognitivePreference),picker:String(pickMockPool),builder:String(buildMockQuestions),bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.difficulty,q.cognitiveLevel,q.concept,q.coreTopicId]),sem:validateSubjectBSemantics()};console.log('__V310__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V310__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))
version,previous=context();req((version,previous)==('v310','v309'),'expects v310')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();p309=Path('_regression/subject-a-mock-unreached-question-diagnosis-v309.fixture.json');req(p309.exists(),'v309 fixture missing');v309=json.loads(p309.read_text());req(v309.get('result')=='PASS — UNREACHED MOCK QUESTIONS DIAGNOSED','v309 result');s309=v309['summary'];never=s309['neverMeta'];req(len(never)==78 and s309['never']==78,'v309 unreached count drift')
expected={'.github/subject-a-mock-calibration-closure-audit/validate_audit.py','.github/workflows/subject-a-mock-calibration-closure-audit.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/subject-a-mock-calibration-closure-v310.fixture.json','audits/SUBJECT_A_MOCK_CALIBRATION_CLOSURE_v310.txt'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing audit source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v310' and par['v']=='v309','versions');
for k in ['blueprints','pref','picker','builder','bankSignature']:req(cand[k]==par[k],k+' drift')
req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'semantic')
primary={'基礎':'想起','標準':'適用','実戦':'判断'}
never_primary=[x for x in never if primary.get(x['difficulty'])==x['cognitiveLevel']]
allowed={('基礎','適用'),('基礎','判断'),('標準','想起')}
unexpected=[x for x in never if (x['difficulty'],x['cognitiveLevel']) not in allowed]
req(not never_primary,'unreached primary-fit questions '+repr([x['id'] for x in never_primary]))
req(not unexpected,'unexpected unreached calibration pair '+repr([(x['id'],x['difficulty'],x['cognitiveLevel']) for x in unexpected]))
req(all(x['difficulty']!='実戦' for x in never),'practical question unexpectedly unreachable')
bp=cand['blueprints'];full=bp['full'];half=bp['half'];full_d=[full['basic'],full['standard'],full['practical']];half_d=[half['basic'],half['standard'],half['practical']];full_c=[full['cognitive']['想起'],full['cognitive']['適用'],full['cognitive']['判断']];half_c=[half['cognitive']['想起'],half['cognitive']['適用'],half['cognitive']['判断']];req(full_d==[15,30,15] and full_c==[15,29,16],'full calibration contract drift');req(half_d==[8,14,8] and half_c==[8,13,9],'half calibration contract drift')
req("if(difficulty==='基礎')return ['想起','適用','判断']" in cand['pref'] and "if(difficulty==='標準')return ['適用','判断','想起']" in cand['pref'] and "return ['判断','適用','想起']" in cand['pref'],'preference contract drift')
req('cognitiveTarget' in cand['picker'] and 'mockCandidateSort' in cand['picker'],'picker calibration/novelty contract drift')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
counts={};
for x in never:counts[f"{x['difficulty']}→{x['cognitiveLevel']}"]=counts.get(f"{x['difficulty']}→{x['cognitiveLevel']}",0)+1
summary={'unreachedQuestions':len(never),'unreachedPrimaryFit':len(never_primary),'unreachedPairs':counts,'allowedCrossCalibrationPairs':['基礎→適用','基礎→判断','標準→想起'],'practicalUnreached':sum(1 for x in never if x['difficulty']=='実戦'),'fullBlueprint':{'difficulty':full_d,'cognitive':full_c},'halfBlueprint':{'difficulty':half_d,'cognitive':half_c},'primaryMapping':primary,'interpretation':'The 78 unreached bank items are exclusively cross-calibration combinations. The mock blueprint deliberately aligns 基礎 with 想起, 標準 with 適用, and 実戦 with 判断, with one slot shifted from 適用 to 判断. mockCandidateSort already handles novelty inside the eligible calibration path. Forcing 100% bank exposure would weaken the intended mock calibration rather than fix a rotation bug.','decision':'KEEP CURRENT SELECTOR — UNREACHED SET IS CALIBRATION-CONSISTENT'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — MOCK CALIBRATION SEQUENCE CLOSED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-calibration-closure-v310.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v310 — Subject A Mock Calibration Closure Audit\n=========================================================\n\nResult\n------\nPASS — MOCK CALIBRATION SEQUENCE CLOSED\nPrevious release: v309\nSource main: {parent}\nLearner-facing change: none\n\nFinding\n-------\n{json.dumps(summary,ensure_ascii=False,indent=2)}\n\nRegression\n----------\nQUESTION_BANK, MOCK_BLUEPRINTS, mockCognitivePreference, pickMockPool and buildMockQuestions are unchanged from v309.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nKeep the current selector. v306 fixed the genuine category-order pathology; v307-v309 show that the remaining unreached bank items are calibration-consistent cross-mapping questions, not a failed novelty mechanism. Do not chase 100% QUESTION_BANK exposure in mock mode. Close this mock-calibration sequence and move to a different learning-quality frontier.\n''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_CALIBRATION_CLOSURE_v310.txt').write_text(audit);print(audit)
