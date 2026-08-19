from pathlib import Path
import base64,json,math,os,re,runpy,statistics,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-rotation-detail-audit-(v(\d+))',b);req(m,'bad v283 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function algoIds(rows){return rows.filter(x=>x&&x.kind==='algo').map(x=>x.sourceId);}
const ALL_IDS=B_EXAM_ALGO_ITEMS.map(x=>x.id);
function emptyFreq(){return Object.fromEntries(ALL_IDS.map(x=>[x,0]));}
function cold(fn,n,seedBase){const freq=emptyFreq(),sessions=[];for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((seedBase+i)>>>0);const ids=algoIds(fn());ids.forEach(id=>freq[id]++);sessions.push(ids);}return {freq,sessions,signature:hashText(JSON.stringify(sessions.slice(0,2000)))};}
function floorDelta(n){const added=emptyFreq(),removed=emptyFreq();let changed=0,totalAdded=0,totalRemoved=0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x283800+i)>>>0);const base=algoIds(__buildBFinalBeforeV208());profile.bFinalStats={};Math.random=seedRand((0x283800+i)>>>0);const cur=algoIds(buildBFinal());const b=new Set(base),c=new Set(cur);const add=cur.filter(x=>!b.has(x)),rem=base.filter(x=>!c.has(x));if(add.length||rem.length)changed++;add.forEach(x=>{added[x]++;totalAdded++;});rem.forEach(x=>{removed[x]++;totalRemoved++;});}return {runs:n,changedSessions:changed,totalAdded,totalRemoved,added,removed};}
function sequential(n){profile.bFinalStats={};const freq=emptyFreq(),sessions=[];for(let i=0;i<n;i++){Math.random=seedRand((0x283c00+i)>>>0);const ids=algoIds(buildBFinal());sessions.push(ids);ids.forEach(id=>{freq[id]++;const old=profile.bFinalStats[id]||{};profile.bFinalStats[id]={...old,seen:(old.seen||0)+1,lastSeen:`sim-${String(i).padStart(4,'0')}`};});}return {freq,sessions,stats:profile.bFinalStats,signature:hashText(JSON.stringify(sessions))};}
const probeItem=B_EXAM_ALGO_ITEMS[0];profile.bFinalStats={[probeItem.id]:{seen:7,lastSeen:'probe'}};const seenProbe=bFinalAlgoSeen(probeItem);
const currentCold=cold(()=>buildBFinal(),5000,0x283000);const baseCold=cold(()=>__buildBFinalBeforeV208(),5000,0x283000);const seq=sequential(1000);
console.log('__V283__'+Buffer.from(JSON.stringify({v:APP_VERSION,items:B_EXAM_ALGO_ITEMS.map(x=>({id:x.id,domain:x.domain||'',level:x.level||'',highTrace:(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]).includes(x.id)})),currentCold,baseCold,floorDelta:floorDelta(2000),sequential:seq,selectorSource:String(__buildBFinalBeforeV208),repairSource:String(bFinalRepairTraceFloorV208),seenSource:String(bFinalAlgoSeen),seenProbe,contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V283__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

def freq_summary(freq):
    xs=list(freq.values());return {'min':min(xs),'median':round(statistics.median(xs),1),'max':max(xs),'maxMinRatio':round(max(xs)/min(xs),2) if min(xs)>0 else None,'cv':round(statistics.pstdev(xs)/statistics.mean(xs),3)}

def top(freq,n=8,reverse=True):return sorted(freq.items(),key=(lambda x:(-x[1],x[0])) if reverse else (lambda x:(x[1],x[0])))[:n]

def mean_overlap(sessions):
    if len(sessions)<2:return 0
    return round(statistics.mean(len(set(sessions[i-1])&set(sessions[i])) for i in range(1,len(sessions))),2)

def coverage_milestones(sessions,total):
    seen=set();targets=[11,22,33,total];out={}
    for idx,ids in enumerate(sessions,1):
        seen.update(ids)
        for t in targets:
            if t not in out and len(seen)>=t:out[t]=idx
    return {str(t):out.get(t) for t in targets}

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v283','v282'),'expects v282')
source=Path('audits/SUBJECT_B_FINAL_DIFFICULTY_MIX_v282.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text() and '5000' in source.read_text(),'v282 evidence missing')
expected={'.github/subject-b-final-rotation-detail-audit/validate_audit.py','.github/workflows/subject-b-final-rotation-detail-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v283' and par['v']=='v282','versions');
for k in ['items','currentCold','baseCold','floorDelta','sequential','selectorSource','repairSource','seenSource','seenProbe','contract']:
    req(cand[k]==par[k],f'audit-only runtime drift {k}')
req(cand['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic');req(cand['seenProbe']==7,'bFinalAlgoSeen probe drift')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
cur=cand['currentCold']['freq'];base=cand['baseCold']['freq'];seq=cand['sequential']['freq'];delta=cand['floorDelta'];sessions=cand['sequential']['sessions']
summary={'coldCurrent':freq_summary(cur),'coldBasePreV208':freq_summary(base),'sequential1000':freq_summary(seq),'coldCurrentMost':top(cur),'coldCurrentLeast':top(cur,reverse=False),'coldBaseMost':top(base),'coldBaseLeast':top(base,reverse=False),'sequentialMost':top(seq),'sequentialLeast':top(seq,reverse=False),'floorChangedSessions':delta['changedSessions'],'floorChangedRatePct':round(delta['changedSessions']/delta['runs']*100,1),'floorTotalAdded':delta['totalAdded'],'floorTotalRemoved':delta['totalRemoved'],'floorMostAdded':top(delta['added']),'floorMostRemoved':top(delta['removed']),'sequentialConsecutiveOverlapMean':mean_overlap(sessions),'sequentialCoverageMilestones':coverage_milestones(sessions,43),'selectorUsesSeen':'seen' in cand['selectorSource'],'selectorUsesLastSeen':'lastSeen' in cand['selectorSource'],'repairUsesSeen':'Seen' in cand['repairSource'] or 'seen' in cand['repairSource'],'repairUsesRandomTie':'Math.random' in cand['repairSource']}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','summary':summary,'selectorSource':cand['selectorSource'],'repairSource':cand['repairSource'],'seenSource':cand['seenSource'],'coldCurrentFrequency':cur,'coldBaseFrequency':base,'sequentialFrequency':seq,'floorDelta':delta,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-final-rotation-detail-v283.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v283 — Subject B Final Rotation / Exposure Detail Audit
===================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v282
Source main: {parent}
Learner-facing change in v283: none

Purpose
-------
v282 confirmed a perfectly stable 8 標準 + 8 応用 and 10-domain mix, but cold-start simulation showed very uneven per-item selection frequency. v283 isolates whether that signal comes from the underlying selector, the v208 high-TRACE floor repair, or simply from repeatedly resetting exposure history in the diagnostic.

Interpretation boundary
-----------------------
The cold-start runs intentionally reset profile.bFinalStats before every generated final. They describe first-session selection pressure, not actual long-run learner exposure. The sequential simulation keeps bFinalStats between sessions and increments the same seen field consumed by bFinalAlgoSeen; it is a controlled rotation probe, not a claim about real learner completion frequency.

Selector evidence
-----------------
bFinalAlgoSeen probe with seen=7 returns: {cand['seenProbe']}
Underlying pre-v208 selector source references seen: {summary['selectorUsesSeen']}
Underlying pre-v208 selector source references lastSeen: {summary['selectorUsesLastSeen']}
v208 floor repair references exposure/seen: {summary['repairUsesSeen']}
v208 floor repair uses random tie-breaking: {summary['repairUsesRandomTie']}

5000 independent cold-start finals
----------------------------------
Current selector frequency: {json.dumps(summary['coldCurrent'],ensure_ascii=False)}
Pre-v208 selector frequency: {json.dumps(summary['coldBasePreV208'],ensure_ascii=False)}
Current most selected: {json.dumps(summary['coldCurrentMost'],ensure_ascii=False)}
Current least selected: {json.dumps(summary['coldCurrentLeast'],ensure_ascii=False)}
Pre-v208 most selected: {json.dumps(summary['coldBaseMost'],ensure_ascii=False)}
Pre-v208 least selected: {json.dumps(summary['coldBaseLeast'],ensure_ascii=False)}

v208 high-TRACE floor delta over 2000 matched seeds
--------------------------------------------------
Sessions whose algorithm source-id set changes: {summary['floorChangedSessions']} / {delta['runs']} ({summary['floorChangedRatePct']}%)
Total added IDs: {summary['floorTotalAdded']}
Total removed IDs: {summary['floorTotalRemoved']}
Most often added by the floor repair: {json.dumps(summary['floorMostAdded'],ensure_ascii=False)}
Most often removed by the floor repair: {json.dumps(summary['floorMostRemoved'],ensure_ascii=False)}

1000 sequential exposure-aware finals
-------------------------------------
Selection frequency: {json.dumps(summary['sequential1000'],ensure_ascii=False)}
Most selected: {json.dumps(summary['sequentialMost'],ensure_ascii=False)}
Least selected: {json.dumps(summary['sequentialLeast'],ensure_ascii=False)}
Mean number of algorithm items repeated from the immediately previous final: {summary['sequentialConsecutiveOverlapMean']} / 16
Cumulative pool coverage milestones (unique items seen → session number): {json.dumps(summary['sequentialCoverageMilestones'],ensure_ascii=False)}

Regression
----------
No learner-facing content or selector code changed.
Cold-start, base-selector, floor-delta and sequential probes are byte-behavior equivalent to the untouched v282 parent.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-TRACE 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If sequential exposure-aware frequencies converge substantially compared with cold-start frequencies, preserve the current selector and treat v282's extreme cold-start frequencies as an initialization effect. If large imbalance remains even after 1000 sequential sessions, inspect the smallest selector stage responsible before changing quotas or content. Separately, a high immediate-session overlap can justify a bounded anti-repeat rule even when long-run frequency is balanced.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_FINAL_ROTATION_DETAIL_v283.txt').write_text(audit);print(audit)
