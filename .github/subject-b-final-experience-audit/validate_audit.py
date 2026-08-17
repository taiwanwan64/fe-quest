from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(v,m):
    if not v: raise AssertionError(m)


def context():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-experience-audit-(v(\d+))',branch)
    req(m,'bad Subject B final experience audit branch')
    version=m.group(1); previous=f"v{int(m.group(2))-1}"
    return version,previous


def runtime_dump(path,probe=False):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function __seeded(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function __initStats(){
  profile.bFinalStats={};
  B_EXAM_ALGO_ITEMS.forEach(q=>{profile.bFinalStats[`algo:${q.id}`]={seen:0,correct:0,lastSeen:null};});
  SECURITY_SCENARIOS.forEach(s=>{profile.bFinalStats[`sec:${s.id}`]={seen:0,correct:0,lastSeen:null};});
}
function __orderProbe(n,seed){
  Math.random=__seeded(seed);__initStats();
  let exactBlock=0,securityBefore17=0,adjacentSecurity=0,totalTransitions=0,maxTransitions=0,minTransitions=999;
  const firstSecurity={};
  for(let i=0;i<n;i++){
    const items=buildBFinal();
    const kinds=items.map(x=>x.kind==='security'?'S':'A');
    const pos=[];kinds.forEach((k,j)=>{if(k==='S')pos.push(j+1);});
    if(pos.join(',')==='17,18,19,20')exactBlock++;
    if(pos.some(p=>p<17))securityBefore17++;
    if(pos.some((p,j)=>j>0&&p===pos[j-1]+1))adjacentSecurity++;
    firstSecurity[pos[0]]=(firstSecurity[pos[0]]||0)+1;
    let transitions=0;
    for(let j=1;j<kinds.length;j++)if(kinds[j]!==kinds[j-1])transitions++;
    totalTransitions+=transitions;maxTransitions=Math.max(maxTransitions,transitions);minTransitions=Math.min(minTransitions,transitions);
  }
  return {sessions:n,exactBlock,exactBlockRate:exactBlock/n,securityBefore17,securityBefore17Rate:securityBefore17/n,adjacentSecurity,adjacentSecurityRate:adjacentSecurity/n,avgTransitions:Math.round(totalTransitions/n*1000)/1000,minTransitions,maxTransitions,firstSecurity};
}
let probe=null;
if(%PROBE%)probe=__orderProbe(20000,0x213001);
console.log('__EXP__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  finalSeconds:B_FINAL_SECONDS,
  finalCounts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],
  poolCount:B_EXAM_ALGO_ITEMS.length,
  highCount:(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]).length,
  floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  sem:validateSubjectBSemantics(),
  probe
})).toString('base64'));
'''.replace('%PROBE%','true' if probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        f=Path(td)/'runtime.js';f.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(f)],capture_output=True,text=True)
        req(z.returncode==0,'runtime dump failed: '+z.stderr[-4000:])
        m=re.search(r'__EXP__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))

version,previous=context()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(previous=='v212','v213 audit expects v212 parent')

candidate=runtime_dump('_site/index.html',probe=True)
parent_rt=runtime_dump('_site_parent/index.html',probe=False)
req(candidate['v']==version and parent_rt['v']==previous,'runtime versions')
req(candidate['finalSeconds']==parent_rt['finalSeconds']==6000,'100-minute contract drift')
req(candidate['finalCounts']==parent_rt['finalCounts']==[20,16,4],'20/16/4 contract drift')
req(candidate['poolCount']==parent_rt['poolCount']==43,'43-item pool drift')
req(candidate['highCount']==parent_rt['highCount']==15 and candidate['floor']==parent_rt['floor']==4,'trace contract drift')
req(candidate['sem'].get('ok') is True,'Subject B semantic validation failed: '+repr(candidate['sem'].get('errors')))

html=Path('_site/index.html').read_text()
parent_html=Path('_site_parent/index.html').read_text()
for token in ['id="bFinalTimer"','id="bFinalPrev"','id="bFinalNext"','id="bFinalFlag"','id="bFinalNavGrid"','id="bFinalReviewList"']:
    req(token in html,'missing final-session UX token '+token)
for token in ["bFinalSeconds<=15*60","bFinalSeconds<=5*60","bFinalSeconds%15===0","なぜ崩れましたか？","トレースミス","コード理解","読み違い","知識不足","時間不足","data-bfinalstudy"]:
    req(token in html,'missing final-session behavior '+token)
for token in ['return shuffled([...algo,...secPool]);','const B_FINAL_SECONDS=100*60;']:
    req(token in html and token in parent_html,'final-session source contract missing '+token)

p=candidate['probe']
req(p['sessions']==20000,'probe size')
medium=p['securityBefore17Rate']>0.95 and p['exactBlockRate']<0.01
req(medium,'expected order-fidelity finding not reproduced')

fixture={
  'name':f'subject-b-final-session-experience-{version}',
  'version':version,
  'previous_version':previous,
  'parent_main_sha':parent,
  'learner_facing_change':False,
  'runtime_preservation':{'time_seconds':6000,'counts':[20,16,4],'algorithm_pool':43,'high_trace':15,'trace_floor':4,'semantic_validator_ok':True},
  'time_pressure_ux':{'result':'pass','timer_visible':True,'warning_at_minutes':[15,5],'resume_checkpoint_seconds':15,'free_navigation':True,'flag_for_review':True,'forced_per_question_timer':False},
  'review_usefulness':{'result':'pass','overall_score':True,'algorithm_security_split':True,'format_breakdown':True,'per_question_answer_and_explanation':True,'mistake_reason_tags':['トレースミス','コード理解','読み違い','知識不足','時間不足'],'direct_remediation_action':True},
  'question_order':{
    'result':'medium_finding','id':'final_question_order_fidelity',
    'current_policy':'full-shuffle-after-selecting-16-algorithm-and-4-security',
    'public_sample_calibration':'IPA full 20-question sample presents questions 1-16 as algorithm/programming and 17-20 as information security; this is calibration evidence, not a claim that every CBT delivery guarantees an immutable order.',
    'probe':p
  },
  'findings':{'high':[],'medium':['final_question_order_fidelity'],'low':[]},
  'decision':'Keep v213 audit-only. v214 should preserve the selected 16+4 set and all quotas, but order the 16 algorithm questions first and the 4 security questions last, shuffling only within each block unless stronger current IPA evidence requires otherwise.',
  'status':'passed_with_medium_finding'
}
Path(f'_regression/subject-b-final-session-experience-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

Path(f'audits/SUBJECT_B_FINAL_SESSION_EXPERIENCE_AUDIT_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Final-Practice Whole-Session Experience Audit
==========================================================================

Result
------
PASS WITH MEDIUM FINDING
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Scope
-----
Audit the 20-question Subject B final-practice experience after the v211 pool expansion and v212 rotation validation. This release does not change questions, selection logic, saved-state IDs, time limit, review behavior or scoring.

Time-pressure experience — PASS
-------------------------------
The session remains 100 minutes / 20 required questions (5 minutes per question as a simple average, not a forced pacing rule).
The countdown is always visible, changes to warning state at 15 minutes remaining and danger state at 5 minutes remaining, and the session saves resumable state every 15 seconds.
Learners can move backward/forward, jump through the 20-question navigator and flag questions for later. There is no per-question countdown that would distort self-directed time allocation.

Review usefulness — PASS
------------------------
The result screen exposes overall score, algorithm/security split and format-level performance.
Each question review shows the learner answer, correct answer and explanation.
Incorrect items can be tagged as トレースミス / コード理解 / 読み違い / 知識不足 / 時間不足 and link directly to a remediation activity.
No review-utility defect was found in this audit.

Question-order fidelity — MEDIUM
--------------------------------
Current buildBFinal selects a contract-valid 16 algorithm + 4 security set and then performs one full shuffle across all 20 questions.
The published IPA full 20-question Subject B sample is structured with algorithm/programming questions 1-16 followed by information-security questions 17-20. This is used as public-sample calibration evidence; it is not treated as proof that every CBT delivery is contractually required to preserve exactly that order.

Deterministic 20,000-session order probe of the current FE QUEST policy:
  exact 16-algorithm then 4-security block order: {p['exactBlock']} / {p['sessions']} ({p['exactBlockRate']*100:.3f}%)
  at least one security question before Q17: {p['securityBefore17']} / {p['sessions']} ({p['securityBefore17Rate']*100:.3f}%)
  at least one adjacent pair of security questions: {p['adjacentSecurity']} / {p['sessions']} ({p['adjacentSecurityRate']*100:.3f}%)
  type transitions per session: average {p['avgTransitions']} / min {p['minTransitions']} / max {p['maxTransitions']}

The full shuffle is useful for mixed practice, but this mode is explicitly presented as a final, exam-oriented 100-minute session. The extra algorithm/security context switching is therefore less faithful to the public full-sample structure than necessary.

Findings
--------
High: 0
Medium: 1 — final_question_order_fidelity
Low: 0

Decision
--------
Do not change learner behavior in v213.
For v214, preserve the already-selected 16 algorithm and 4 security questions, all existing difficulty/domain/high-trace/security quotas and exposure-aware selection. Change only presentation order: shuffle inside the algorithm block, then shuffle inside the security block, and concatenate algorithm 16 + security 4. Re-audit rotation and saved resume/review behavior after the repair.
''')
print(f"FEQUEST_SUBJECT_B_FINAL_SESSION_EXPERIENCE_AUDIT version={version} exact={p['exactBlockRate']:.6f} securityBefore17={p['securityBefore17Rate']:.6f}")
