from pathlib import Path
import base64,json,os,re,runpy,statistics,subprocess,tempfile

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
const probeItem=B_EXAM_ALGO_ITEMS[0];
profile.bFinalStats={[probeItem.id]:{seen:7,lastSeen:'probe'}};
const seenProbe=bFinalAlgoSeen(probeItem);
const currentCold=cold(()=>buildBFinal(),5000,0x283000);
const baseCold=cold(()=>__buildBFinalBeforeV208(),5000,0x283000);
console.log('__V283__'+Buffer.from(JSON.stringify({v:APP_VERSION,items:B_EXAM_ALGO_ITEMS.map(x=>({id:x.id,domain:x.domain||'',level:x.level||'',highTrace:(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]).includes(x.id)})),currentCold,baseCold,floorDelta:floorDelta(2000),selectorSource:String(__buildBFinalBeforeV208),repairSource:String(bFinalRepairTraceFloorV208),seenSource:String(bFinalAlgoSeen),finishSource:String(finishBFinal),seenProbe,contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V283__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

def freq_summary(freq):
    xs=list(freq.values());return {'min':min(xs),'median':round(statistics.median(xs),1),'max':max(xs),'maxMinRatio':round(max(xs)/min(xs),2) if min(xs)>0 else None,'cv':round(statistics.pstdev(xs)/statistics.mean(xs),3)}

def top(freq,n=8,reverse=True):return sorted(freq.items(),key=(lambda x:(-x[1],x[0])) if reverse else (lambda x:(x[1],x[0])))[:n]

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v283','v282'),'expects v282')
source=Path('audits/SUBJECT_B_FINAL_DIFFICULTY_MIX_v282.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text() and '5000' in source.read_text(),'v282 evidence missing')
expected={'.github/subject-b-final-rotation-detail-audit/validate_audit.py','.github/workflows/subject-b-final-rotation-detail-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v283' and par['v']=='v282','versions')
for k in ['items','currentCold','baseCold','floorDelta','selectorSource','repairSource','seenSource','finishSource','seenProbe','contract']:
    req(cand[k]==par[k],f'audit-only runtime drift {k}')
req(cand['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
cur=cand['currentCold']['freq'];base=cand['baseCold']['freq'];delta=cand['floorDelta']
summary={'coldCurrent':freq_summary(cur),'coldBasePreV208':freq_summary(base),'coldCurrentMost':top(cur),'coldCurrentLeast':top(cur,reverse=False),'coldBaseMost':top(base),'coldBaseLeast':top(base,reverse=False),'floorChangedSessions':delta['changedSessions'],'floorChangedRatePct':round(delta['changedSessions']/delta['runs']*100,1),'floorTotalAdded':delta['totalAdded'],'floorTotalRemoved':delta['totalRemoved'],'floorMostAdded':top(delta['added']),'floorMostRemoved':top(delta['removed']),'seenProbe':cand['seenProbe'],'selectorMentionsBFinalStats':'bFinalStats' in cand['selectorSource'],'seenHookMentionsBFinalStats':'bFinalStats' in cand['seenSource'],'finishMentionsBFinalStats':'bFinalStats' in cand['finishSource'],'repairUsesRandomTie':'Math.random' in cand['repairSource']}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','summary':summary,'selectorSource':cand['selectorSource'],'repairSource':cand['repairSource'],'seenSource':cand['seenSource'],'finishSource':cand['finishSource'],'coldCurrentFrequency':cur,'coldBaseFrequency':base,'floorDelta':delta,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-final-rotation-detail-v283.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
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
v282 confirmed a perfectly stable 8 標準 + 8 応用 and 10-domain mix, but cold-start simulation showed very uneven per-item selection frequency. v283 isolates whether that signal is already present before the v208 high-TRACE floor, how often the floor changes a selected set, and where the actual exposure counter is read/written before any rotation repair is attempted.

Interpretation boundary
-----------------------
The 5000-run frequency probes intentionally reset profile.bFinalStats before each generated final. They describe cold-start selection pressure only. v283 does not assume how repeated completed finals update exposure history; instead it captures the exact selector / exposure / completion hooks so the next audit can model that lifecycle correctly.

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

Exposure-hook evidence
----------------------
Synthetic bFinalStats[id].seen=7 probe returns: {summary['seenProbe']}
Underlying selector mentions bFinalStats: {summary['selectorMentionsBFinalStats']}
bFinalAlgoSeen mentions bFinalStats: {summary['seenHookMentionsBFinalStats']}
finishBFinal mentions bFinalStats: {summary['finishMentionsBFinalStats']}
v208 floor repair uses random tie-breaking: {summary['repairUsesRandomTie']}

Exact bFinalAlgoSeen source
---------------------------
{cand['seenSource']}

Exact pre-v208 selector source
------------------------------
{cand['selectorSource']}

Exact v208 floor-repair source
------------------------------
{cand['repairSource']}

finishBFinal source excerpt
---------------------------
{cand['finishSource']}

Regression
----------
No learner-facing content or selector code changed.
Cold-start current/pre-v208 frequency probes and the floor-delta probe are byte-behavior equivalent to the untouched v282 parent.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-TRACE 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use the captured hook sources to build a lifecycle-faithful repeated-final simulation next. Do not change the selector based only on cold-start imbalance. If the actual completion lifecycle already drives exposure-aware rotation, preserve it; if repeated completed finals still overexpose a narrow subset, repair only that selection stage while keeping the exact 8/8 level mix, all 10 domains and the high-TRACE floor.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_FINAL_ROTATION_DETAIL_v283.txt').write_text(audit);print(audit)
