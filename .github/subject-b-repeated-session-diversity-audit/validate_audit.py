from pathlib import Path
import base64, json, os, re, runpy, statistics, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-repeated-session-diversity-audit-(v(\d+))',branch)
    req(m,'bad Subject B repeated-session diversity audit branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function text(v){return String(v??'').trim();}
function mark(stats,key,day){const s=stats[key]||(stats[key]={seen:0,correct:0,lastSeen:''});s.seen=(s.seen||0)+1;s.lastSeen=`2026-10-${String(day).padStart(2,'0')}`;}
function overlap(a,b){const B=new Set(b);let n=0;for(const x of a)if(B.has(x))n++;return n;}
function exposureSummary(pool,stats,keyFn){const vals=pool.map(id=>stats[keyFn(id)]?.seen||0);return {min:Math.min(...vals),max:Math.max(...vals),zero:vals.filter(x=>x===0).length,vals};}
function miniCohort(seed,sessions=6){
  profile.bMockStats={};
  const pool=B_EXERCISES.map(x=>x.id),seen=new Set(),coverage=[],rows=[];
  for(let s=0;s<sessions;s++){
    Math.random=seedRand((seed+s*7919)>>>0);
    const items=buildBMock();
    const ids=items.map(x=>x.id),levels=items.reduce((m,x)=>(m[x.level]=(m[x.level]||0)+1,m),{}),families={};
    ids.forEach(id=>{const f=bMockFamilyOf({id});families[f]=(families[f]||0)+1;seen.add(id);mark(profile.bMockStats,id,s+1);});
    rows.push({ids,levels,maxFamily:Math.max(...Object.values(families)),overlapPrev:s?overlap(ids,rows[s-1].ids):0});
    coverage.push(seen.size);
  }
  return {coverage,rows,exposure:exposureSummary(pool,profile.bMockStats,x=>x)};
}
function finalCohort(seed,sessions=8){
  profile.bFinalStats={};
  const algoPool=B_EXAM_ALGO_ITEMS.map(x=>x.id),secPool=SECURITY_SCENARIOS.map(x=>x.id),algoSeen=new Set(),secSeen=new Set(),coverageAlgo=[],coverageSec=[],rows=[];
  for(let s=0;s<sessions;s++){
    Math.random=seedRand((seed+s*104729)>>>0);
    const items=buildBFinal(),algo=items.filter(x=>x.kind==='algo'),sec=items.filter(x=>x.kind==='security'),algoIds=algo.map(x=>x.sourceId),secIds=sec.map(x=>x.sourceId);
    algoIds.forEach(id=>{algoSeen.add(id);mark(profile.bFinalStats,`algo:${id}`,s+1);});
    secIds.forEach(id=>{secSeen.add(id);mark(profile.bFinalStats,`sec:${id}`,s+1);});
    const levels=algo.reduce((m,x)=>(m[x.level]=(m[x.level]||0)+1,m),{}),domains=new Set(algo.map(x=>x.domain));
    rows.push({algoIds,secIds,levels,domains:domains.size,high:bFinalHighTraceCountV208(algo),algoOverlapPrev:s?overlap(algoIds,rows[s-1].algoIds):0,secOverlapPrev:s?overlap(secIds,rows[s-1].secIds):0});
    coverageAlgo.push(algoSeen.size);coverageSec.push(secSeen.size);
  }
  return {coverageAlgo,coverageSec,rows,algoExposure:exposureSummary(algoPool,profile.bFinalStats,id=>`algo:${id}`),secExposure:exposureSummary(secPool,profile.bFinalStats,id=>`sec:${id}`)};
}
function summarize(cohorts,key,index){const xs=cohorts.map(x=>x[key][index]);return {min:Math.min(...xs),max:Math.max(...xs),avg:Number((xs.reduce((a,b)=>a+b,0)/xs.length).toFixed(2)),median:xs.slice().sort((a,b)=>a-b)[Math.floor(xs.length/2)]};}
function runAudit(){
  const mini=[],final=[];
  for(let i=0;i<100;i++){mini.push(miniCohort((0x237100+i)>>>0));final.push(finalCohort((0x237900+i)>>>0));}
  const miniAdj=mini.flatMap(c=>c.rows.slice(1).map(r=>r.overlapPrev)),finalAdj=final.flatMap(c=>c.rows.slice(1).map(r=>r.algoOverlapPrev)),secAdj=final.flatMap(c=>c.rows.slice(1).map(r=>r.secOverlapPrev));
  return {
    mini:{pool:B_EXERCISES.length,coverageAfter1:summarize(mini,'coverage',0),coverageAfter2:summarize(mini,'coverage',1),coverageAfter3:summarize(mini,'coverage',2),coverageAfter4:summarize(mini,'coverage',3),allCoveredBy3:mini.filter(c=>c.coverage[2]===B_EXERCISES.length).length,allCoveredBy4:mini.filter(c=>c.coverage[3]===B_EXERCISES.length).length,avgAdjacentOverlap:Number((miniAdj.reduce((a,b)=>a+b,0)/miniAdj.length).toFixed(2)),worstAdjacentOverlap:Math.max(...miniAdj),endExposureMax:Math.max(...mini.map(c=>c.exposure.max)),endExposureMin:Math.min(...mini.map(c=>c.exposure.min)),sessionsValid:mini.every(c=>c.rows.every(r=>r.ids.length===8&&new Set(r.ids).size===8&&r.levels['基礎']===2&&r.levels['標準']===4&&r.levels['応用']===2&&r.maxFamily<=B_MOCK_FAMILY_MAX))},
    final:{algoPool:B_EXAM_ALGO_ITEMS.length,secPool:SECURITY_SCENARIOS.length,algoCoverageAfter2:summarize(final,'coverageAlgo',1),algoCoverageAfter3:summarize(final,'coverageAlgo',2),algoCoverageAfter4:summarize(final,'coverageAlgo',3),algoCoverageAfter6:summarize(final,'coverageAlgo',5),algoCoverageAfter8:summarize(final,'coverageAlgo',7),algoAllCoveredBy6:final.filter(c=>c.coverageAlgo[5]===B_EXAM_ALGO_ITEMS.length).length,algoAllCoveredBy8:final.filter(c=>c.coverageAlgo[7]===B_EXAM_ALGO_ITEMS.length).length,secCoverageAfter3:summarize(final,'coverageSec',2),secCoverageAfter4:summarize(final,'coverageSec',3),secCoverageAfter5:summarize(final,'coverageSec',4),secAllCoveredBy5:final.filter(c=>c.coverageSec[4]===SECURITY_SCENARIOS.length).length,avgAlgoAdjacentOverlap:Number((finalAdj.reduce((a,b)=>a+b,0)/finalAdj.length).toFixed(2)),worstAlgoAdjacentOverlap:Math.max(...finalAdj),avgSecAdjacentOverlap:Number((secAdj.reduce((a,b)=>a+b,0)/secAdj.length).toFixed(2)),worstSecAdjacentOverlap:Math.max(...secAdj),algoEndExposureMax:Math.max(...final.map(c=>c.algoExposure.max)),algoEndExposureMin:Math.min(...final.map(c=>c.algoExposure.min)),secEndExposureMax:Math.max(...final.map(c=>c.secExposure.max)),secEndExposureMin:Math.min(...final.map(c=>c.secExposure.min)),sessionsValid:final.every(c=>c.rows.every(r=>r.algoIds.length===16&&new Set(r.algoIds).size===16&&r.secIds.length===4&&new Set(r.secIds).size===4&&r.levels['標準']===8&&r.levels['応用']===8&&r.domains===B_FINAL_ALGO_DOMAINS.length&&r.high>=B_FINAL_HIGH_TRACE_FLOOR_V208))}
  };
}
const audit=runAudit();
console.log('__V237__'+Buffer.from(JSON.stringify({v:APP_VERSION,audit,sem:validateSubjectBSemantics(),counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,highCount:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,miniSpec:globalThis.SUBJECT_B_SESSION_V205_SPEC||null,readiness:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,domain:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,feedback:globalThis.SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC||null,propagation:globalThis.SUBJECT_B_TRACE_FINAL_FEEDBACK_V235_SPEC||null})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V237__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v237' and previous=='v236','v237 audit expects v236 release parent')
expected={'.github/subject-b-repeated-session-diversity-audit/validate_audit.py','.github/workflows/subject-b-distractor-quality-learner-flow-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v237 audit-only source drift: '+repr(sorted(changed^expected)))

cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['audit']==par['audit'],'audit-only behavior drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(cand['counts']==[20,16,4] and cand['seconds']==6000 and cand['pool']==43 and cand['highCount']==15 and cand['floor']==4,'final contract drift')
req(cand['audit']['mini']['sessionsValid'],'mini-mock session contracts failed')
req(cand['audit']['final']['sessionsValid'],'final session contracts failed')

mini=cand['audit']['mini'];fin=cand['audit']['final'];findings=[]
if mini['allCoveredBy4']<90:
    findings.append(('Medium','subject_b_algorithm_mini_repeated_session_coverage_slow',f"Only {mini['allCoveredBy4']}/100 simulated learners covered all {mini['pool']} algorithm exercises by four 8-question mini-mocks."))
elif mini['allCoveredBy3']<75:
    findings.append(('Low','subject_b_algorithm_mini_repeated_session_coverage_variable',f"Only {mini['allCoveredBy3']}/100 simulated learners covered all {mini['pool']} algorithm exercises by three 8-question mini-mocks."))
if fin['algoAllCoveredBy8']<90:
    findings.append(('Medium','subject_b_final_algorithm_long_run_coverage_gap',f"Only {fin['algoAllCoveredBy8']}/100 simulated learners covered all {fin['algoPool']} final-algorithm source items by eight final sessions."))
elif fin['algoAllCoveredBy6']<60:
    findings.append(('Low','subject_b_final_algorithm_rotation_slow',f"Only {fin['algoAllCoveredBy6']}/100 simulated learners covered all {fin['algoPool']} final-algorithm source items by six final sessions."))
if fin['secAllCoveredBy5']<90:
    findings.append(('Medium','subject_b_final_security_long_run_coverage_gap',f"Only {fin['secAllCoveredBy5']}/100 simulated learners covered all {fin['secPool']} security scenarios by five final sessions."))
if mini['avgAdjacentOverlap']>6:
    findings.append(('Low','subject_b_algorithm_mini_adjacent_repeat_high',f"Average adjacent mini-mock overlap is {mini['avgAdjacentOverlap']} of 8 items."))
if fin['avgAlgoAdjacentOverlap']>12:
    findings.append(('Low','subject_b_final_algorithm_adjacent_repeat_high',f"Average adjacent final-algorithm overlap is {fin['avgAlgoAdjacentOverlap']} of 16 items."))

severity_order={'High':3,'Medium':2,'Low':1}
max_sev=max((severity_order[s] for s,_,_ in findings),default=0)
result='PASS — NO FINDINGS' if not findings else ('PASS — MEDIUM FINDING RECORDED' if max_sev>=2 else 'PASS — LOW FINDING RECORDED')
summary='\n'.join(f'- {s}: {code} — {msg}' for s,code,msg in findings) if findings else 'High: 0\nMedium: 0\nLow: 0'

audit=f'''FE QUEST {version} — Subject B Repeated-Session Diversity / Coverage Audit
==========================================================================

Result
------
{result}
Previous release: {previous}
Source main: {parent}
Learner-facing change in {version}: none

Scope
-----
This audit simulates 100 independent learners repeatedly taking Subject B algorithm mini-mocks and full final sessions while carrying forward the same exposure counters that production selection uses. It measures cumulative source-item coverage, adjacent-session repetition and end-of-run exposure skew. Correct-answer, score and mastery performance are intentionally held out so this audit isolates rotation behavior.

Algorithm mini-mock
-------------------
Pool: {mini['pool']} exercises; session size: 8; quotas: 2 basic / 4 standard / 2 advanced; family cap: {cand['miniSpec']['familyMax']}
Coverage after 1 session (min/avg/max): {mini['coverageAfter1']['min']} / {mini['coverageAfter1']['avg']} / {mini['coverageAfter1']['max']}
Coverage after 2 sessions: {mini['coverageAfter2']['min']} / {mini['coverageAfter2']['avg']} / {mini['coverageAfter2']['max']}
Coverage after 3 sessions: {mini['coverageAfter3']['min']} / {mini['coverageAfter3']['avg']} / {mini['coverageAfter3']['max']}
Coverage after 4 sessions: {mini['coverageAfter4']['min']} / {mini['coverageAfter4']['avg']} / {mini['coverageAfter4']['max']}
All 20 covered by session 3: {mini['allCoveredBy3']} / 100 cohorts
All 20 covered by session 4: {mini['allCoveredBy4']} / 100 cohorts
Average adjacent overlap: {mini['avgAdjacentOverlap']} / 8; worst observed: {mini['worstAdjacentOverlap']} / 8
Exposure after 6 sessions, global cohort extrema: min {mini['endExposureMin']} / max {mini['endExposureMax']}
Per-session quota/family/duplicate contracts: OK

Full final — algorithm
----------------------
Pool: {fin['algoPool']} source items; 16 algorithm items per final
Coverage after 2 sessions: {fin['algoCoverageAfter2']['min']} / {fin['algoCoverageAfter2']['avg']} / {fin['algoCoverageAfter2']['max']}
Coverage after 3 sessions: {fin['algoCoverageAfter3']['min']} / {fin['algoCoverageAfter3']['avg']} / {fin['algoCoverageAfter3']['max']}
Coverage after 4 sessions: {fin['algoCoverageAfter4']['min']} / {fin['algoCoverageAfter4']['avg']} / {fin['algoCoverageAfter4']['max']}
Coverage after 6 sessions: {fin['algoCoverageAfter6']['min']} / {fin['algoCoverageAfter6']['avg']} / {fin['algoCoverageAfter6']['max']}
Coverage after 8 sessions: {fin['algoCoverageAfter8']['min']} / {fin['algoCoverageAfter8']['avg']} / {fin['algoCoverageAfter8']['max']}
All 43 covered by session 6: {fin['algoAllCoveredBy6']} / 100 cohorts
All 43 covered by session 8: {fin['algoAllCoveredBy8']} / 100 cohorts
Average adjacent overlap: {fin['avgAlgoAdjacentOverlap']} / 16; worst observed: {fin['worstAlgoAdjacentOverlap']} / 16
Exposure after 8 sessions, global cohort extrema: min {fin['algoEndExposureMin']} / max {fin['algoEndExposureMax']}
Every session preserved 8 standard + 8 advanced, all algorithm domains and high-trace floor >= 4: OK

Full final — security
---------------------
Pool: {fin['secPool']} scenarios; 4 security items per final
Coverage after 3 sessions: {fin['secCoverageAfter3']['min']} / {fin['secCoverageAfter3']['avg']} / {fin['secCoverageAfter3']['max']}
Coverage after 4 sessions: {fin['secCoverageAfter4']['min']} / {fin['secCoverageAfter4']['avg']} / {fin['secCoverageAfter4']['max']}
Coverage after 5 sessions: {fin['secCoverageAfter5']['min']} / {fin['secCoverageAfter5']['avg']} / {fin['secCoverageAfter5']['max']}
All 15 covered by session 5: {fin['secAllCoveredBy5']} / 100 cohorts
Average adjacent overlap: {fin['avgSecAdjacentOverlap']} / 4; worst observed: {fin['worstSecAdjacentOverlap']} / 4
Exposure after 8 sessions, global cohort extrema: min {fin['secEndExposureMin']} / max {fin['secEndExposureMax']}

Findings
--------
{summary}

Preserved contracts
-------------------
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
Subject B semantic validation: OK.
v205 mini-mock family balance, v222 readiness / 65% threshold, v227 domain progression, v230 choice feedback and v235 trace-final feedback propagation are unchanged.

Decision
--------
''' + ("Repeated-session rotation is healthy enough that no selector repair is justified. Keep the current exposure-aware selectors and move to a different learner-value frontier.\n" if not findings else "Use the recorded finding(s) to decide a narrow rotation repair. Preserve session quotas, high-trace floor, difficulty labels, scoring, readiness threshold and remediation behavior.\n")

fixture={'version':version,'previous':previous,'parent':parent,'result':result,'findings':[{'severity':s,'code':c,'message':m} for s,c,m in findings],'metrics':cand['audit']}
Path(f'_regression/subject-b-repeated-session-diversity-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_REPEATED_SESSION_DIVERSITY_AUDIT_{version}.txt').write_text(audit)
print(audit)
