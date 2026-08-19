from pathlib import Path
import base64,json,math,os,re,runpy,statistics,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip();m=re.fullmatch(r'subject-b-final-sequential-rotation-audit-(v(\d+))',b);req(m,'bad v286 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
const ALL_IDS=B_EXAM_ALGO_ITEMS.map(x=>x.id);function freq0(){return Object.fromEntries(ALL_IDS.map(x=>[x,0]));}
function algoRows(rows){return rows.filter(x=>x?.kind==='algo');}
function applySelectionRelevantCompletion(rows){rows.forEach(item=>{const key=item.kind==='security'?`sec:${item.sourceId}`:`algo:${item.sourceId}`;if(!profile.bFinalStats[key])profile.bFinalStats[key]={seen:0,correct:0,lastSeen:null};const st=profile.bFinalStats[key];st.seen++;st.lastSeen=localDateISO(0);});}
function sessionChecks(rows){const algo=algoRows(rows),raw=algo.map(x=>B_EXAM_ALGO_ITEMS.find(r=>r.id===x.sourceId));return {standard:raw.filter(x=>x?.level==='標準').length,advanced:raw.filter(x=>x?.level==='応用').length,domains:new Set(raw.map(x=>x?.domain)).size,high:algo.filter(x=>(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]).includes(x.sourceId)).length};}
function cold(n){const f=freq0(),sessions=[];for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x286000+i)>>>0);const rows=buildBFinal(),ids=algoRows(rows).map(x=>x.sourceId);ids.forEach(x=>f[x]++);sessions.push(ids);}return {freq:f,sessions};}
function sequential(n){profile.bFinalStats={};const f=freq0(),sessions=[],checks=[];for(let i=0;i<n;i++){Math.random=seedRand((0x286000+i)>>>0);const rows=buildBFinal(),ids=algoRows(rows).map(x=>x.sourceId);ids.forEach(x=>f[x]++);sessions.push(ids);checks.push(sessionChecks(rows));applySelectionRelevantCompletion(rows);}const stats=Object.fromEntries(ALL_IDS.map(id=>[id,profile.bFinalStats[`algo:${id}`]?.seen||0]));return {freq:f,sessions,checks,stats};}
const coldRun=cold(1000),seq=sequential(1000);
console.log('__V286__'+Buffer.from(JSON.stringify({v:APP_VERSION,cold:coldRun,sequential:seq,finishSource:String(_finishBFinalV65),pickSource:String(pickFinalAlgoCandidate),seenSource:String(bFinalAlgoSeen),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V286__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def fs(freq):
    xs=list(freq.values());return {'min':min(xs),'median':round(statistics.median(xs),1),'max':max(xs),'maxMinRatio':round(max(xs)/min(xs),2) if min(xs) else None,'cv':round(statistics.pstdev(xs)/statistics.mean(xs),3)}
def top(freq,n=8,reverse=True):return sorted(freq.items(),key=(lambda x:(-x[1],x[0])) if reverse else (lambda x:(x[1],x[0])))[:n]
def overlap(ss):return round(statistics.mean(len(set(ss[i-1])&set(ss[i])) for i in range(1,len(ss))),2)
def milestones(ss):
    seen=set();out={};targets=[11,22,33,43]
    for i,ids in enumerate(ss,1):
        seen.update(ids)
        for t in targets:
            if t not in out and len(seen)>=t:out[t]=i
    return {str(t):out.get(t) for t in targets}
version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v286','v285'),'expects v285')
source=Path('audits/SUBJECT_B_FINAL_COMPLETION_STATS_v285.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v285 evidence missing')
expected={'.github/subject-b-final-sequential-rotation-audit/validate_audit.py','.github/workflows/subject-b-final-sequential-rotation-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v286' and par['v']=='v285','versions')
for k in ['cold','sequential','finishSource','pickSource','seenSource','contract']:req(cand[k]==par[k],f'audit-only runtime drift {k}')
req(cand['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
seq=cand['sequential'];cold=cand['cold'];req(seq['freq']==seq['stats'],'selection-relevant completion stats do not match observed sequential frequency')
req(all(x['standard']==8 and x['advanced']==8 and x['domains']==10 and x['high']>=4 for x in seq['checks']),'sequential session contract drift')
summary={'cold':fs(cold['freq']),'sequential':fs(seq['freq']),'coldMost':top(cold['freq']),'coldLeast':top(cold['freq'],reverse=False),'sequentialMost':top(seq['freq']),'sequentialLeast':top(seq['freq'],reverse=False),'coldConsecutiveOverlap':overlap(cold['sessions']),'sequentialConsecutiveOverlap':overlap(seq['sessions']),'sequentialCoverageMilestones':milestones(seq['sessions']),'cvReductionPct':round((1-fs(seq['freq'])['cv']/fs(cold['freq'])['cv'])*100,1) if fs(cold['freq'])['cv'] else 0,'allSessionsEightEight':True,'allSessionsTenDomains':True,'allSessionsHighTraceFloor':True}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','summary':summary,'coldFrequency':cold['freq'],'sequentialFrequency':seq['freq'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-final-sequential-rotation-v286.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v286 — Subject B Final Sequential Rotation Audit
=========================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v285
Source main: {parent}
Learner-facing change in v286: none

Purpose
-------
v285 captured the exact completion mutation: every completed final increments profile.bFinalStats[`algo:<id>`].seen for each algorithm item. v286 therefore compares 1000 independent cold-start finals with 1000 sequential finals while applying that exact selection-relevant production mutation after each generated session.

Interpretation boundary
-----------------------
The sequential probe mirrors only the completion fields that affect future selection: namespaced seen counters (plus lastSeen, which the current candidate selector does not consume). It intentionally does not simulate correctness, XP, DOM rendering or history because those do not participate in pickFinalAlgoCandidate or the v208 high-TRACE floor.

Frequency balance
-----------------
Cold-start 1000 finals: {json.dumps(summary['cold'],ensure_ascii=False)}
Sequential completed 1000 finals: {json.dumps(summary['sequential'],ensure_ascii=False)}
Coefficient-of-variation reduction: {summary['cvReductionPct']}%
Cold most selected: {json.dumps(summary['coldMost'],ensure_ascii=False)}
Cold least selected: {json.dumps(summary['coldLeast'],ensure_ascii=False)}
Sequential most selected: {json.dumps(summary['sequentialMost'],ensure_ascii=False)}
Sequential least selected: {json.dumps(summary['sequentialLeast'],ensure_ascii=False)}

Repeated-session diversity
--------------------------
Mean immediate overlap, cold-start sessions: {summary['coldConsecutiveOverlap']} / 16
Mean immediate overlap, sequential completed sessions: {summary['sequentialConsecutiveOverlap']} / 16
Cumulative algorithm-pool coverage (unique items -> session number): {json.dumps(summary['sequentialCoverageMilestones'],ensure_ascii=False)}

Session-contract preservation
-----------------------------
Every sequential session: exactly 8 標準 + 8 応用: yes
Every sequential session: all 10 algorithm domains: yes
Every sequential session: high-TRACE floor >=4: yes
The final namespaced seen counts exactly equal observed sequential selection frequencies: yes

Decision
--------
If sequential exposure sharply reduces frequency dispersion and reaches all 43 items quickly, preserve the current exposure-aware selector; the v282 skew was a cold-start artifact. If one or more items remain near-mandatory and others remain rare despite production seen updates, inspect the domain/level candidate-cell inventory next, because the constraint structure rather than the exposure sort is then the likely cause. A separate anti-repeat repair is justified only if immediate sequential overlap remains high enough to materially reduce practice variety.

Regression
----------
No learner-facing content, selector, scoring, timing or remediation code changed.
All sequential sessions preserve the existing final composition contract.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_FINAL_SEQUENTIAL_ROTATION_v286.txt').write_text(audit);print(audit)
