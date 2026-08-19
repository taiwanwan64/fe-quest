from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-remediation-readiness-learner-flow-audit-(v(\d+))',branch)
    req(m,'bad Subject B remediation readiness learner-flow audit branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function resetProfile(){
  profile.bFinalHistory=[];profile.bFinalStats={};profile.bFinalMistakeStats={};profile.bMockHistory=[];profile.securityMockHistory=[];profile.bCompoundHistory=[];
  delete profile.subjectBReadinessV222;delete profile.subjectBAlgorithmDomainV227;
}
function targetCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secs=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam).map(x=>({sourceId:x.sourceId,domain:x.domain,target:bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain)}));
  const sec=SECURITY_SCENARIOS.map(makeFinalSecurity).map(x=>({sourceId:x.sourceId,concept:x.concept,target:bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ')}));
  return {
    algorithm:algo.length,security:sec.length,
    algoBad:algo.filter(x=>x.target?.mode!=='trace'||!x.target?.id||!ex.has(x.target.id)),
    secBad:sec.filter(x=>x.target?.mode!=='security'||x.target?.id!==x.sourceId||!secs.has(x.target.id)),
    algoTargets:[...new Set(algo.map(x=>x.target?.id).filter(Boolean))],
    secTargets:[...new Set(sec.map(x=>x.target?.id).filter(Boolean))]
  };
}
function domainCompletionProbe(){
  resetProfile();
  const groups={};for(const raw of B_EXAM_ALGO_ITEMS){(groups[raw.domain]||(groups[raw.domain]=[])).push(raw);}
  const pair=Object.entries(groups).find(([,xs])=>xs.length>=2);
  if(!pair)return {ok:false,reason:'no domain has two final items'};
  const [domain,xs]=pair;
  profile.bFinalHistory=[{date:'2026-12-01',rate:50,correct:10,blank:0,seconds:5000,algoCorrect:8,secCorrect:4}];
  xs.slice(0,2).forEach(raw=>{
    const item=makeFinalAlgoExam(raw),key=bFinalMistakeKey(item);
    profile.bFinalStats[`algo:${item.sourceId}`]={seen:1,correct:0,lastSeen:'2026-12-01'};
    profile.bFinalMistakeStats[key]={misses:2,lastMissed:'2026-12-01'};
  });
  const evidence=subjectBAlgorithmDomainEvidenceV227();
  const context=subjectBAlgorithmDomainContextV227();
  if(!context)return {ok:false,domain,evidence,reason:'domain context unavailable'};
  const before=profile.subjectBAlgorithmDomainV227?JSON.parse(JSON.stringify(profile.subjectBAlgorithmDomainV227)):null;
  const marked=subjectBMarkAlgorithmDomainTraceCompleteV227(context.target.id);
  const marker=profile.subjectBAlgorithmDomainV227?JSON.parse(JSON.stringify(profile.subjectBAlgorithmDomainV227)):null;
  return {ok:marked===true&&marker?.completed===true&&marker?.targetId===context.target.id,domain,evidence,target:context.target,before,marked,marker};
}
function readinessProbe(){
  resetProfile();
  const floor=SUBJECT_B_READINESS_V222_SPEC.shortPracticeFloor;
  profile.bMockHistory=[{rate:64}];const algo64={rate:subjectBReadinessRateV222('miniMock'),count:subjectBReadinessCountV222('miniMock')};
  profile.bMockHistory.unshift({rate:65});const algo65={rate:subjectBReadinessRateV222('miniMock'),count:subjectBReadinessCountV222('miniMock')};
  profile.securityMockHistory=[{rate:64}];const sec64={rate:subjectBReadinessRateV222('securityMock'),count:subjectBReadinessCountV222('securityMock')};
  profile.securityMockHistory.unshift({rate:65});const sec65={rate:subjectBReadinessRateV222('securityMock'),count:subjectBReadinessCountV222('securityMock')};
  const securityTarget=subjectBFirstFinalTargetV222({algoCorrect:15,secCorrect:1});
  const algorithmTarget=subjectBFirstFinalTargetV222({algoCorrect:8,secCorrect:4});
  return {floor,algo64,algo65,sec64,sec65,securityTarget,algorithmTarget};
}
function sourceProbe(){
  const resultBase=(typeof __renderBFinalResultBeforeV217==='function')?String(__renderBFinalResultBeforeV217):'';
  const launch=(typeof launchSubjectBRecommendation==='function')?String(launchSubjectBRecommendation):'';
  const finish=(typeof finishBExercise==='function')?String(finishBExercise):'';
  const hub=(typeof subjectBHubRecommendation==='function')?String(subjectBHubRecommendation):'';
  const mark=(typeof subjectBMarkAlgorithmDomainTraceCompleteV227==='function')?String(subjectBMarkAlgorithmDomainTraceCompleteV227):'';
  return {
    resultUsesRemediationTarget:resultBase.includes('bFinalRemediationTarget'),
    resultHasDirectLaunch:resultBase.includes('launchSubjectBRecommendation')||/start[A-Za-z0-9_]*\(/.test(resultBase),
    launchHasTrace:launch.includes('trace'),launchHasSecurity:launch.includes('security'),launchUsesId:/\.id\b/.test(launch),
    finishMarksDomain:finish.includes('subjectBMarkAlgorithmDomainTraceCompleteV227'),
    markerUsesTraceId:mark.includes('targetId')&&mark.includes('traceId'),
    sources:{resultBase,launch,finish,hub,mark}
  };
}
function securityRotationProbe(){
  profile.bFinalStats={};let seen=new Set();
  function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
  for(let s=0;s<5;s++){
    Math.random=seedRand((0x241500+s*104729)>>>0);const items=buildBFinal();
    for(const item of items){if(item.kind==='security')seen.add(item.sourceId);const key=item.kind==='security'?`sec:${item.sourceId}`:`algo:${item.sourceId}`;const st=profile.bFinalStats[key]||(profile.bFinalStats[key]={seen:0,correct:0,lastSeen:null});st.seen++;st.lastSeen=`2026-12-0${s+1}`;}
  }
  return seen.size;
}
const coverage=targetCoverage(),domain=domainCompletionProbe(),readiness=readinessProbe(),sources=sourceProbe();
console.log('__V241__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,coverage,domain,readiness,sources,securityCoverage5:securityRotationProbe(),
  specs:{readiness:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,domain:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,rotation:globalThis.SUBJECT_B_FINAL_SECURITY_ROTATION_V239_SPEC||null},
  contracts:{counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208},
  hashes:{questions:hashJson(QUESTION_BANK),exercises:hashJson(B_EXERCISES),security:hashJson(SECURITY_SCENARIOS),finalAlgo:hashJson(B_EXAM_ALGO_ITEMS)},
  sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V241__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v241' and previous=='v240','v241 audit expects v240 parent')
expected={'.github/subject-b-remediation-readiness-learner-flow-audit/validate_audit.py','.github/workflows/subject-b-remediation-readiness-learner-flow-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v241 audit-only source drift: '+repr(sorted(changed^expected)))

cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['hashes']==par['hashes'],'audit-only content bank drift')
req(cand['contracts']==par['contracts'],'audit-only final contract drift')
req(cand['coverage']==par['coverage'],'audit-only remediation mapping drift')
req(cand['sources']==par['sources'],'audit-only learner-flow source drift')
req(cand['securityCoverage5']==par['securityCoverage5']==15,'v239 five-final coverage regression')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')

c=cand['coverage'];d=cand['domain'];r=cand['readiness'];s=cand['sources']
findings=[]
if c['algorithm']!=43 or c['security']!=15 or c['algoBad'] or c['secBad']:
    findings.append(('High','subject_b_final_remediation_target_unreachable','A final wrong-answer remediation target is missing or points to an invalid TRACE/security item.'))
if r['floor']!=65 or r['algo64']['rate']!=64 or r['algo65']['rate']!=65 or r['sec64']['rate']!=64 or r['sec65']['rate']!=65:
    findings.append(('High','subject_b_readiness_evidence_threshold_drift','The established 65% readiness evidence boundary or latest-rate tracking drifted.'))
if not d.get('ok'):
    findings.append(('Medium','subject_b_algorithm_trace_completion_not_reflected','A qualified first-final algorithm weakness could not be marked complete through its TRACE target.'))
if not s['finishMarksDomain'] or not s['markerUsesTraceId']:
    findings.append(('Medium','subject_b_trace_finish_marker_disconnected','The real TRACE completion wrapper is not connected to the v227 domain-remediation completion marker.'))
if not s['resultUsesRemediationTarget']:
    findings.append(('Medium','subject_b_final_review_remediation_target_not_rendered','The real final result renderer does not consume the remediation target mapping.'))
if not (s['launchHasTrace'] and s['launchHasSecurity'] and s['launchUsesId']):
    findings.append(('Medium','subject_b_recommendation_launcher_route_gap','The recommendation launcher source does not expose both TRACE/security id-based routing.'))

priority={'High':3,'Medium':2,'Low':1}
findings.sort(key=lambda x:-priority[x[0]])
result='PASS — NO FINDINGS' if not findings else f"PASS — {findings[0][0].upper()} FINDING RECORDED"
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'findings':[{'priority':p,'marker':m,'detail':x} for p,m,x in findings],'coverage':c,'domainCompletion':d,'readiness':r,'sourceContracts':{k:v for k,v in s.items() if k!='sources'},'sourceExtracts':s['sources'],'securityCoverageByFinal5':cand['securityCoverage5'],'contracts':cand['contracts'],'semanticOK':True}
Path('_regression').mkdir(exist_ok=True)
Path(f'_regression/subject-b-remediation-readiness-learner-flow-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
find_text='none' if not findings else '\n'.join(f'- {p}: {m} — {x}' for p,m,x in findings)
audit=f'''FE QUEST {version} — Subject B Remediation → Readiness Learner-Flow Audit\n=====================================================================\n\nResult\n------\n{result}\nPrevious release: {previous}\nSource main: {parent}\nLearner-facing change in {version}: none\n\nDirect final wrong-answer recovery\n----------------------------------\nAlgorithm final remediation targets: {c['algorithm']-len(c['algoBad'])}/{c['algorithm']} reachable TRACE targets\nSecurity final remediation targets: {c['security']-len(c['secBad'])}/{c['security']} reachable security targets\nUnique TRACE targets used by final pool: {len(c['algoTargets'])}\nUnique security targets used by final pool: {len(c['secTargets'])}\nFinal result renderer consumes bFinalRemediationTarget: {'yes' if s['resultUsesRemediationTarget'] else 'no'}\nRecommendation launcher exposes TRACE route: {'yes' if s['launchHasTrace'] else 'no'}\nRecommendation launcher exposes security route: {'yes' if s['launchHasSecurity'] else 'no'}\nRecommendation launcher is id-aware: {'yes' if s['launchUsesId'] else 'no'}\n\nAlgorithm weakness completion\n-----------------------------\nSynthetic concentrated first-final weakness qualified: {'yes' if d.get('evidence',{}).get('qualifies') else 'no'}\nResolved TRACE target: {json.dumps(d.get('target'),ensure_ascii=False)}\nTRACE completion marker updated through the real v227 helper: {'yes' if d.get('ok') else 'no'}\nfinishBExercise is wired to that marker: {'yes' if s['finishMarksDomain'] else 'no'}\n\nReadiness evidence\n------------------\nEstablished short-practice floor: {r['floor']}%\nAlgorithm mini-mock latest-rate probe: 64% → {r['algo64']['rate']}%, then 65% → {r['algo65']['rate']}%\nSecurity mini-mock latest-rate probe: 64% → {r['sec64']['rate']}%, then 65% → {r['sec65']['rate']}%\nWeak-security first-final target mode: {r['securityTarget'].get('mode')}\nWeak-algorithm first-final target mode: {r['algorithmTarget'].get('mode')}\n\nRegression\n----------\nv239 security coverage remains 15/15 by final 5 in the deterministic probe: {cand['securityCoverage5']}/15\nFinal contract unchanged: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace 15 / floor 4.\nQuestion, TRACE, security and final-algorithm bank hashes vs v240: identical.\nSubject B semantic diagnostics: OK.\n\nFindings\n--------\n{find_text}\n\nDecision\n--------\nIf clean, the final-wrong-answer → remediation-target → focused completion/readiness evidence chain is internally connected and the next learner-value frontier should examine whether the review UI makes those recovery targets sufficiently actionable. If a finding is recorded, repair only the evidenced handoff and keep the v222 65% readiness gate and v239 security coverage behavior unchanged.\n'''
Path('audits').mkdir(exist_ok=True)
Path(f'audits/SUBJECT_B_REMEDIATION_READINESS_LEARNER_FLOW_AUDIT_{version}.txt').write_text(audit)
print(audit)
