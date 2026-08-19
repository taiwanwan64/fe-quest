from pathlib import Path
import base64,json,math,os,re,runpy,statistics,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-workload-balance-audit-(v(\d+))',b);req(m,'bad v281 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function lines(v){if(Array.isArray(v))return v.map(String);if(typeof v==='string')return v.split(/\r?\n/).filter(Boolean);return [];}
function countRx(text,rx){const m=String(text||'').match(rx);return m?m.length:0;}
function metric(x){const code=lines(x.code),q=String(x.q||x.prompt||''),ctx=String(x.context||''),opts=Array.isArray(x.options)?x.options.map(String):[];const all=[ctx,q,...code,...opts].join('\n');const controls=countRx(all,/\b(?:if|else|elseif|for|while|repeat|until|procedure|function|return)\b|もし|繰り返|反復|再帰/gi);const assigns=countRx(all,/←|:=|\+=|-=|\*=|\/=|\+\+|--/g);const indexes=countRx(all,/\[[^\]]+\]/g);const calls=countRx(all,/\b[A-Za-z_][A-Za-z0-9_]*\s*\(/g);return {id:x.id,domain:String(x.domain||''),level:String(x.level||''),format:String(x.format||''),highTrace:(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]).includes(x.id),codeLines:code.length,codeChars:code.join('\n').length,promptChars:q.length,contextChars:ctx.length,optionChars:opts.reduce((a,b)=>a+b.length,0),controlMarkers:controls,assignmentMarkers:assigns,indexMarkers:indexes,callMarkers:calls,structureMarkers:controls+assigns+indexes+calls,totalTextChars:all.length};}
function sessions(){const out=[];const sig=[];for(let i=0;i<5000;i++){profile.bFinalStats={};Math.random=seedRand((0x281000+i)>>>0);const rows=buildBFinal();const ids=rows.filter(x=>x.kind==='algo').map(x=>x.sourceId);out.push(ids);if(i<2000)sig.push(rows.map(x=>[x.kind,x.sourceId]));}return {ids:out,sig:hashText(JSON.stringify(sig))};}
console.log('__V281__'+Buffer.from(JSON.stringify({v:APP_VERSION,metrics:B_EXAM_ALGO_ITEMS.map(metric),sessions:sessions(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-8000:]);m=re.search(r'__V281__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))

def percentile(vals,p):
    xs=sorted(float(x) for x in vals)
    if not xs:return 0
    k=(len(xs)-1)*p;f=math.floor(k);c=math.ceil(k)
    if f==c:return xs[int(k)]
    return xs[f]*(c-k)+xs[c]*(k-f)

def rank_percentile(vals,x):
    xs=sorted(vals);less=sum(1 for v in xs if v<x);equal=sum(1 for v in xs if v==x)
    return 100*(less+0.5*equal)/len(xs)

def r1(x): return round(float(x),1)

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v281','v280'),'expects v280')
source=Path('audits/SUBJECT_B_TRACE_OVERLAP_POST_AUDIT_v280.txt');req(source.exists() and 'PASS — NO FINDINGS' in source.read_text(),'v280 closure missing')
expected={'.github/subject-b-final-workload-balance-audit/validate_audit.py','.github/workflows/subject-b-final-workload-balance-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v281' and par['v']=='v280','versions');req(cand['metrics']==par['metrics'],'audit-only item drift');req(cand['sessions']['ids']==par['sessions']['ids'] and cand['sessions']['sig']==par['sessions']['sig'],'audit-only session drift');req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'contract');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
rows=cand['metrics'];req(len(rows)==43,'pool drift')
metrics=['codeLines','structureMarkers','totalTextChars'];vals={k:[r[k] for r in rows] for k in metrics};thresholds={};
for k in metrics:
    q1,q3=percentile(vals[k],.25),percentile(vals[k],.75);thresholds[k]={'q1':r1(q1),'median':r1(percentile(vals[k],.5)),'q3':r1(q3),'iqr':r1(q3-q1),'tukeyHigh':r1(q3+1.5*(q3-q1))}
for r in rows:
    ps=[rank_percentile(vals[k],r[k]) for k in metrics];r['workloadPercentileProxy']=r1(sum(ps)/len(ps));r['outlierDimensions']=[k for k in metrics if r[k]>thresholds[k]['tukeyHigh']]
heavy=sorted(rows,key=lambda r:(-r['workloadPercentileProxy'],-r['structureMarkers'],-r['codeLines']))
byid={r['id']:r for r in rows};session=[]
for ids in cand['sessions']['ids']:
    ws=[byid[x]['workloadPercentileProxy'] for x in ids];session.append({'avg':sum(ws)/len(ws),'max':max(ws),'p90count':sum(1 for x in ws if x>=90),'outlierCount':sum(1 for i in ids if byid[i]['outlierDimensions'])})
avgs=[x['avg'] for x in session];p90c=[x['p90count'] for x in session];outs=[x['outlierCount'] for x in session]
summary={'timeLimitSeconds':6000,'questionCount':20,'algorithmCount':16,'securityCount':4,'nominalSecondsPerQuestion':300,'importantCaveat':'The workload percentile is a relative static complexity proxy, not a predicted response time.','thresholds':thresholds,'topCandidates':[{'id':r['id'],'domain':r['domain'],'level':r['level'],'format':r['format'],'proxy':r['workloadPercentileProxy'],'codeLines':r['codeLines'],'structureMarkers':r['structureMarkers'],'totalTextChars':r['totalTextChars'],'outlierDimensions':r['outlierDimensions'],'highTrace':r['highTrace']} for r in heavy[:10]],'multiDimensionOutliers':[r['id'] for r in rows if len(r['outlierDimensions'])>=2],'anyDimensionOutliers':[r['id'] for r in rows if r['outlierDimensions']],'sessionAvgProxy':{'min':r1(min(avgs)),'p05':r1(percentile(avgs,.05)),'median':r1(percentile(avgs,.5)),'p95':r1(percentile(avgs,.95)),'max':r1(max(avgs))},'sessionP90ItemCount':{'min':min(p90c),'median':r1(percentile(p90c,.5)),'p95':r1(percentile(p90c,.95)),'max':max(p90c)},'sessionOutlierItemCount':{'min':min(outs),'median':r1(percentile(outs,.5)),'p95':r1(percentile(outs,.95)),'max':max(outs)}}
spread=summary['sessionAvgProxy']['p95']-summary['sessionAvgProxy']['p05'];summary['sessionAvgP95MinusP05']=r1(spread)
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','summary':summary,'metrics':rows,'selectionSignatureMatch2000':True,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-b-final-workload-balance-v281.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
def fmt(r):return f"{r['id']} | {r['domain']} | {r['level']} | {r['format']} | proxy={r['workloadPercentileProxy']} | code={r['codeLines']} | structure={r['structureMarkers']} | text={r['totalTextChars']} | outlier={','.join(r['outlierDimensions']) or '-'} | highTRACE={r['highTrace']}"
audit=f'''FE QUEST v281 — Subject B Final Static Workload-Balance Diagnostic Audit
=========================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v280
Source main: {parent}
Learner-facing change in v281: none

Purpose
-------
v280 closed the TRACE/final transfer-overlap sequence. v281 checks the next learner-facing risk: whether the 16 algorithm questions selected into a 100-minute / 20-question final can vary too much in visible tracing workload from one generated session to another, or whether a small number of algorithm items are static-complexity outliers that deserve closer inspection.

Important interpretation boundary
---------------------------------
The workload percentile used here is NOT a predicted solving time and is not converted into minutes. It is a relative static proxy built only from three transparent signals across the 43 algorithm items: code-line count, visible structure-marker count (control / assignment / indexing / call markers), and total visible text length. Actual learner response time must come from the existing local performance data when enough samples exist.

Exam frame
----------
Time limit: 6000 seconds (100 minutes)
Total questions: 20
Algorithm questions: 16
Security questions: 4
Nominal whole-exam average: 300 seconds per question. This is only the arithmetic budget, not a target for each individual item.

Pool distribution / Tukey high fences
-------------------------------------
{json.dumps(thresholds,ensure_ascii=False,indent=2)}

Highest relative workload candidates
------------------------------------
{chr(10).join(fmt(r) for r in heavy[:10])}

Static outlier inventory
------------------------
Any-dimension Tukey-high candidates: {json.dumps(summary['anyDimensionOutliers'],ensure_ascii=False)}
Two-or-more-dimension Tukey-high candidates: {json.dumps(summary['multiDimensionOutliers'],ensure_ascii=False)}

5000 generated-final sessions
-----------------------------
Average relative workload proxy across the 16 selected algorithm items:
min={summary['sessionAvgProxy']['min']} / p05={summary['sessionAvgProxy']['p05']} / median={summary['sessionAvgProxy']['median']} / p95={summary['sessionAvgProxy']['p95']} / max={summary['sessionAvgProxy']['max']}
p95-p05 spread: {summary['sessionAvgP95MinusP05']} percentile-proxy points
Number of >=90th-percentile algorithm items in one final:
min={summary['sessionP90ItemCount']['min']} / median={summary['sessionP90ItemCount']['median']} / p95={summary['sessionP90ItemCount']['p95']} / max={summary['sessionP90ItemCount']['max']}
Number of Tukey-high algorithm items in one final:
min={summary['sessionOutlierItemCount']['min']} / median={summary['sessionOutlierItemCount']['median']} / p95={summary['sessionOutlierItemCount']['p95']} / max={summary['sessionOutlierItemCount']['max']}

Regression
----------
All 43 final algorithm items are byte-behavior equivalent to v280.
5000 deterministic final builds preserve the existing source-id sessions; first 2000 session selection/order signature is unchanged from the untouched parent.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-TRACE 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use the captured distribution rather than an arbitrary per-question minute estimate. If one or more multi-dimensional static outliers exist, inspect only those items in v282 and decide whether their learner-visible state path is genuinely too dense or simply appropriately rich. If session-level p05/p95 workload remains reasonably clustered and no item is a multi-dimensional outlier, do not flatten useful difficulty variation. Separately, learner-local response-time evidence can later validate whether any static candidate is actually slow in practice.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_B_FINAL_WORKLOAD_BALANCE_v281.txt').write_text(audit);print(audit)
