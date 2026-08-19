from pathlib import Path
import base64,json,math,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-security-option-cue-audit-(v(\d+))',b);req(m,'bad v276 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
const rows=SECURITY_SCENARIOS.map(s=>({id:s.id,title:String(s.title||''),level:String(s.level||''),concept:String(s.concept||''),incident:String(s.incident?.text||''),steps:(s.steps||[]).map((q,i)=>({i,q:String(q.q||''),options:(q.options||[]).map(String),a:Number(q.a),hint:String(q.hint||''),explain:String(q.explain||'')}))}));
console.log('__V276__'+Buffer.from(JSON.stringify({v:APP_VERSION,rows,banks:{sec:hashText(stable(SECURITY_SCENARIOS)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),ex:hashText(stable(B_EXERCISES))},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed: '+z.stderr[-8000:]);m=re.search(r'__V276__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

CUE=re.compile(r'必ず|常に|だけ|のみ|一切|すべて|全て|不要|必要ない|そのまま|後で|無条件|例外なく|誰でも|何もしない|放置',re.I)

def step_metric(sid,step):
    opts=step['options'];a=step['a'];req(len(opts)==4 and 0<=a<4,f'bad security option shape {sid}:{step["i"]}')
    lens=[len(x) for x in opts];correct=lens[a];wrong=[lens[i] for i in range(4) if i!=a]
    cue=[len(CUE.findall(x)) for x in opts]
    return {'scenarioId':sid,'step':step['i'],'answerIndex':a,'lengths':lens,'correctLength':correct,'wrongMedian':sorted(wrong)[1],'correctIsUniqueLongest':correct>max(wrong),'correctLongerBy8':correct>=max(wrong)+8,'correctCueCount':cue[a],'wrongCueCount':sum(cue[i] for i in range(4) if i!=a),'duplicateOptions':len(set(opts))!=4}

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v276','v275'),'expects v275 parent')
source=Path('audits/SUBJECT_B_BOUNDARY_TRANSFER_v275.txt');req(source.exists() and 'PASS — NO FINDINGS' in source.read_text(),'v275 closure missing')
expected={'.github/subject-b-security-option-cue-audit/validate_audit.py','.github/workflows/subject-b-security-option-cue-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'audit-only source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v276' and par['v']=='v275','versions');req(cand['banks']==par['banks'] and cand['rows']==par['rows'],'security/content drift');req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'contract drift');req(cand['sem'].get('ok') is True,'semantic diagnostics')
metrics=[step_metric(r['id'],s) for r in cand['rows'] for s in r['steps']];n=len(metrics);req(n>0,'no security steps')
pos=[0,0,0,0]
for m in metrics:pos[m['answerIndex']]+=1
longest=[m for m in metrics if m['correctIsUniqueLongest']];long8=[m for m in metrics if m['correctLongerBy8']];dups=[m for m in metrics if m['duplicateOptions']]
correct_cues=sum(m['correctCueCount'] for m in metrics);wrong_cues=sum(m['wrongCueCount'] for m in metrics)
# Compare cue density per option, not raw totals (3x more wrong options exist).
correct_density=correct_cues/n;wrong_density=wrong_cues/(n*3)
findings=[]
if dups:findings.append({'id':'security_duplicate_options','severity':'High','count':len(dups),'steps':[f"{m['scenarioId']}:{m['step']}" for m in dups]})
if len(long8)/n>=0.35:findings.append({'id':'security_correct_answer_length_cue','severity':'Medium','ratio':round(len(long8)/n,3),'count':len(long8),'summary':'At least 35% of security steps have a correct option eight or more characters longer than every distractor.'})
if wrong_density>=correct_density*2 and wrong_density-correct_density>=0.20:findings.append({'id':'security_distractor_absolutist_cue_bias','severity':'Medium','correctCueDensity':round(correct_density,3),'wrongCueDensity':round(wrong_density,3),'summary':'Absolutist/obviously-passive cue terms are at least twice as dense in distractors as in correct options.'})
# Position imbalance is only Low and only for a very strong skew.
if max(pos)/n>=0.45:findings.append({'id':'security_correct_position_skew','severity':'Low','positions':pos,'summary':'One answer position contains at least 45% of correct answers.'})
result='PASS — NO FINDINGS' if not findings else 'PASS — FINDINGS RECORDED'
summary={'scenarioCount':len(cand['rows']),'stepCount':n,'answerPositions':pos,'uniqueLongestCorrectCount':len(longest),'correctLongerBy8Count':len(long8),'correctLongerBy8Ratio':round(len(long8)/n,3),'correctCueDensity':round(correct_density,3),'wrongCueDensityPerDistractor':round(wrong_density,3),'duplicateOptionStepCount':len(dups)}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'metrics':metrics,'findings':findings,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-security-option-cue-v276.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
find_txt='None.' if not findings else '\n'.join(f"{x['severity']} — {x['id']}: {x.get('summary','')}" for x in findings)
audit=f'''FE QUEST v276 — Subject B Security Option-Cue Audit
========================================================

Result
------
{result}
Previous release: v275
Source main: {parent}
Learner-facing change in v276: none

Purpose
-------
v275 found broad boundary/edge-state coverage in algorithm practice, so v276 shifts to the 20% security side of Subject B. The goal is not to add more scenarios blindly, but to check whether answer choices leak correctness through length, repeated absolutist wording, duplicate choices, or answer-position skew.

Why this matters
----------------
The attached Subject B problem material frames security as case reading and warns against being pulled by traps in the scenario or choices. FE QUEST should therefore reward evidence-based judgment, not a shortcut such as “the longest careful-sounding option is probably correct” or “the choice with 必ず/だけ is probably wrong.”

Inventory
---------
Security scenarios: {summary['scenarioCount']}
Scored scenario steps: {summary['stepCount']}
Correct positions [0,1,2,3]: {summary['answerPositions']}
Correct option is unique longest: {summary['uniqueLongestCorrectCount']} / {n}
Correct option is >=8 chars longer than every distractor: {summary['correctLongerBy8Count']} / {n} ({summary['correctLongerBy8Ratio']:.1%})
Cue density in correct options: {summary['correctCueDensity']}
Cue density per distractor: {summary['wrongCueDensityPerDistractor']}
Steps with duplicate option text: {summary['duplicateOptionStepCount']}

Findings
--------
{find_txt}

Interpretation
--------------
Length is treated as a cue only when the correct choice is at least eight characters longer than every distractor, not merely the longest by one or two characters. Wording-cue density is normalized per option because each question has three distractors. The cue list targets strong absolutes/passive non-actions such as 必ず・常に・だけ・のみ・不要・そのまま・放置; it is a diagnostic signal, not proof that any individual option is bad.

Regression
----------
All security scenarios/steps and all algorithm/TRACE content are unchanged from v275.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If a systematic cue bias is recorded, repair the smallest repeated pattern first while preserving the scenario facts, correct security judgment, and explanation. Do not make distractors vague merely to equalize length. If no systematic cue appears, keep the current scenario bank and move to another evidence-backed learning-quality frontier.
'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_SECURITY_OPTION_CUE_v276.txt').write_text(audit);print(audit)
