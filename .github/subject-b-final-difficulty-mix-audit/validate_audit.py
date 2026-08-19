from pathlib import Path
import base64,json,math,os,re,runpy,statistics,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-difficulty-mix-audit-(v(\d+))',b);req(m,'bad v282 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function item(x){return {id:x.id,domain:String(x.domain||''),level:String(x.level||''),format:String(x.format||''),highTrace:(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]).includes(x.id)};}
function sessions(){const out=[];const sig=[];for(let i=0;i<5000;i++){profile.bFinalStats={};Math.random=seedRand((0x282000+i)>>>0);const rows=buildBFinal();const algo=rows.filter(x=>x.kind==='algo').map(x=>x.sourceId);out.push(algo);if(i<2000)sig.push(rows.map(x=>[x.kind,x.sourceId]));}return {ids:out,sig:hashText(JSON.stringify(sig))};}
console.log('__V282__'+Buffer.from(JSON.stringify({v:APP_VERSION,items:B_EXAM_ALGO_ITEMS.map(item),sessions:sessions(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-8000:]);m=re.search(r'__V282__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

def percentile(vals,p):
    xs=sorted(float(x) for x in vals)
    if not xs:return 0
    k=(len(xs)-1)*p;f=math.floor(k);c=math.ceil(k)
    if f==c:return xs[int(k)]
    return xs[f]*(c-k)+xs[c]*(k-f)

def dist(vals):
    return {'min':min(vals),'p05':round(percentile(vals,.05),1),'median':round(percentile(vals,.5),1),'p95':round(percentile(vals,.95),1),'max':max(vals)}

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v282','v281'),'expects v281')
source=Path('audits/SUBJECT_B_FINAL_WORKLOAD_BALANCE_v281.txt');req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v281 workload audit missing')
expected={'.github/subject-b-final-difficulty-mix-audit/validate_audit.py','.github/workflows/subject-b-final-difficulty-mix-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v282' and par['v']=='v281','versions');req(cand['items']==par['items'] and cand['sessions']==par['sessions'],'audit-only content/session drift');req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
items=cand['items'];req(len(items)==43,'pool drift');byid={x['id']:x for x in items};levels={};domains={};
for x in items:levels[x['level']]=levels.get(x['level'],0)+1;domains[x['domain']]=domains.get(x['domain'],0)+1
freq={x['id']:0 for x in items};rows=[]
for ids in cand['sessions']['ids']:
    for i in ids:freq[i]+=1
    lv={};
    for i in ids:lv[byid[i]['level']]=lv.get(byid[i]['level'],0)+1
    rows.append({'standard':lv.get('標準',0),'advanced':lv.get('応用',0),'other':sum(v for k,v in lv.items() if k not in ('標準','応用')),'domainCount':len(set(byid[i]['domain'] for i in ids)),'highTrace':sum(1 for i in ids if byid[i]['highTrace'])})
std=[r['standard'] for r in rows];adv=[r['advanced'] for r in rows];dom=[r['domainCount'] for r in rows];high=[r['highTrace'] for r in rows]
req(all(r['standard']+r['advanced']+r['other']==16 for r in rows),'session level accounting drift')
by_level_freq={}
for level in sorted(levels):
    xs=[freq[x['id']] for x in items if x['level']==level];by_level_freq[level]={'poolCount':levels[level],'selectionFrequencyMin':min(xs),'selectionFrequencyMedian':round(statistics.median(xs),1),'selectionFrequencyMax':max(xs)}
summary={'poolLevels':levels,'poolDomains':domains,'sessionStandardCount':dist(std),'sessionAdvancedCount':dist(adv),'sessionOtherLevelCount':dist([r['other'] for r in rows]),'sessionDomainDiversity':dist(dom),'sessionHighTraceCount':dist(high),'byLevelSelectionFrequency':by_level_freq,'allItemFrequencyMin':min(freq.values()),'allItemFrequencyMedian':round(statistics.median(freq.values()),1),'allItemFrequencyMax':max(freq.values()),'mostSelected':sorted(freq.items(),key=lambda x:(-x[1],x[0]))[:8],'leastSelected':sorted(freq.items(),key=lambda x:(x[1],x[0]))[:8]}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','summary':summary,'frequency':freq,'selectionSignatureMatch2000':True,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-final-difficulty-mix-v282.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v282 — Subject B Final Difficulty-Mix Diagnostic Audit
====================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v281
Source main: {parent}
Learner-facing change in v282: none

Purpose
-------
v281 found no multi-dimensional static workload outlier and a reasonably clustered session-level workload proxy. v282 checks a complementary source of generated-final variance: whether the authored difficulty labels (標準 / 応用) are mixed consistently across the 16 algorithm slots, and whether domain/high-TRACE diversity remains stable across repeated final generation.

Important interpretation boundary
---------------------------------
Authored difficulty labels are not a direct estimate of actual learner response time or official exam item difficulty. This audit only measures the consistency of the app's own labelled mix across generated sessions. It does not redefine labels or impose a new exam blueprint.

Pool inventory
--------------
Difficulty-label counts: {json.dumps(levels,ensure_ascii=False,sort_keys=True)}
Domain counts: {json.dumps(domains,ensure_ascii=False,sort_keys=True)}

5000 generated-final sessions
-----------------------------
標準 items per 16 algorithm slots: {json.dumps(summary['sessionStandardCount'],ensure_ascii=False)}
応用 items per 16 algorithm slots: {json.dumps(summary['sessionAdvancedCount'],ensure_ascii=False)}
Other labels per 16 algorithm slots: {json.dumps(summary['sessionOtherLevelCount'],ensure_ascii=False)}
Distinct algorithm domains per final: {json.dumps(summary['sessionDomainDiversity'],ensure_ascii=False)}
High-TRACE items per final: {json.dumps(summary['sessionHighTraceCount'],ensure_ascii=False)}

Selection-frequency balance
---------------------------
Per-level selection frequency across 5000 finals: {json.dumps(by_level_freq,ensure_ascii=False,sort_keys=True)}
All-item selection frequency: min={summary['allItemFrequencyMin']} / median={summary['allItemFrequencyMedian']} / max={summary['allItemFrequencyMax']}
Most selected: {json.dumps(summary['mostSelected'],ensure_ascii=False)}
Least selected: {json.dumps(summary['leastSelected'],ensure_ascii=False)}

Regression
----------
All 43 final algorithm item identities, labels, domains and high-TRACE flags are unchanged from v281.
All 5000 deterministic generated-final source-id sessions are byte-behavior equivalent to v281; the first 2000 selection/order signature is unchanged.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-TRACE 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use the observed distribution to decide the next step. If almost all sessions naturally retain both substantial 標準 and 応用 representation and domain diversity remains stable, preserve the current randomized selection policy rather than over-engineering a rigid difficulty quota. If the tails produce clearly lopsided sessions, inspect only the selection policy in a bounded follow-up; do not relabel questions merely to force numerical symmetry.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_FINAL_DIFFICULTY_MIX_v282.txt').write_text(audit);print(audit)
