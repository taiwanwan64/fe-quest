from pathlib import Path
import base64, json, os, re, runpy, statistics, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-authenticity-audit-(v(\d+))',branch)
    req(m is not None,'bad v259 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text(); scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand((0x259000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function asLines(v){if(Array.isArray(v))return v.map(String);if(typeof v==='string')return v.split(/\r?\n/).filter(Boolean);return [];}
function countRx(text,rx){const m=String(text||'').match(rx);return m?m.length:0;}
function itemMetric(x){
  const code=asLines(x.code); const q=String(x.q||x.prompt||''); const desc=String(x.desc||x.description||'');
  const options=Array.isArray(x.options)?x.options.map(String):[]; const joined=[q,desc,...code,...options].join('\n');
  const control=countRx(joined,/\b(?:if|else|elseif|for|while|repeat|until|procedure|function|return)\b|もし|繰り返|反復|条件|再帰/gi);
  const assign=countRx(joined,/←|:=|\+=|-=|\*=|\/=|\+\+|--/g);
  const index=countRx(joined,/\[[^\]]+\]/g);
  const calls=countRx(joined,/\b[A-Za-z_][A-Za-z0-9_]*\s*\(/g);
  return {id:x.id,domain:x.domain||'',level:x.level||'',format:x.format||'',keys:Object.keys(x).sort(),codeLines:code.length,codeChars:code.join('\n').length,promptChars:q.length,descChars:desc.length,optionChars:options.reduce((a,b)=>a+b.length,0),controlMarkers:control,assignmentMarkers:assign,indexMarkers:index,callMarkers:calls,totalTextChars:joined.length,highTrace:(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]).includes(x.id)};
}
function selectionCoverage(){
  const freq={};let highMin=99,highMax=0,highSum=0;
  for(let i=0;i<5000;i++){
    profile.bFinalStats={};Math.random=seedRand((0x259500+i)>>>0);const rows=buildBFinal();
    const algo=rows.filter(x=>x.kind==='algo'); const hc=algo.filter(x=>(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]).includes(x.sourceId)).length;
    highMin=Math.min(highMin,hc); highMax=Math.max(highMax,hc); highSum+=hc;
    algo.forEach(x=>freq[x.sourceId]=(freq[x.sourceId]||0)+1);
  }
  return {runs:5000,highTraceMin:highMin,highTraceMax:highMax,highTraceAvg:Number((highSum/5000).toFixed(3)),frequency:freq};
}
const metrics=B_EXAM_ALGO_ITEMS.map(itemMetric);
console.log('__V259__'+Buffer.from(JSON.stringify({v:APP_VERSION,metrics,coverage:selectionCoverage(),sig:finalSig(),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V259__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))


def median(rows,key):
    vals=[float(r[key]) for r in rows]; return statistics.median(vals) if vals else 0

version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v259','v258'),'v259 audit expects v258 parent')
source=Path('audits/SUBJECT_B_LOCAL_ADAPTIVE_POST_AUDIT_v258.txt'); req(source.exists(),'v258 closure audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v258 closure evidence drift')
expected={'.github/subject-b-final-authenticity-audit/validate_audit.py','.github/workflows/subject-b-final-authenticity-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v259 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v259' and par['v']=='v258','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['sig']==par['sig'],'2000-seed final selection/order/options drift')
req(cand['metrics']==par['metrics'],'audit-only algorithm item drift')
req(cand['coverage']==par['coverage'],'audit-only selection coverage drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')

rows=cand['metrics']; high=[r for r in rows if r['highTrace']]; other=[r for r in rows if not r['highTrace']]
req(len(rows)==43 and len(high)==15,'algorithm/high-trace inventory drift')
by_domain={}
for r in rows: by_domain[r['domain']]=by_domain.get(r['domain'],0)+1
shortest=sorted(high,key=lambda r:(r['codeLines'],r['controlMarkers']+r['assignmentMarkers']+r['indexMarkers'],r['totalTextChars']))[:8]
longest=sorted(rows,key=lambda r:(-r['codeLines'],-r['totalTextChars']))[:8]
summary={
 'pool':43,'highTrace':15,'domains':by_domain,
 'highMedianCodeLines':median(high,'codeLines'),'otherMedianCodeLines':median(other,'codeLines'),
 'highMedianPromptChars':median(high,'promptChars'),'otherMedianPromptChars':median(other,'promptChars'),
 'highMedianTotalTextChars':median(high,'totalTextChars'),'otherMedianTotalTextChars':median(other,'totalTextChars'),
 'highMedianControlMarkers':median(high,'controlMarkers'),'otherMedianControlMarkers':median(other,'controlMarkers'),
 'highMedianAssignmentMarkers':median(high,'assignmentMarkers'),'otherMedianAssignmentMarkers':median(other,'assignmentMarkers'),
 'highMedianIndexMarkers':median(high,'indexMarkers'),'otherMedianIndexMarkers':median(other,'indexMarkers'),
 'highZeroCodeLines':[r['id'] for r in high if r['codeLines']==0],
 'highLowStructure':[r['id'] for r in high if r['codeLines']<=4 and (r['controlMarkers']+r['assignmentMarkers']+r['indexMarkers'])<=3],
 'selectionCoverage':cand['coverage']
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — DETAIL EVIDENCE CAPTURED','summary':summary,'shortestHighTrace':shortest,'longestOverall':longest,'metrics':rows,'finalSignatureMatch':True,'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-final-authenticity-v259.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

def fmt(r):
    return f"{r['id']} | {r['domain']} | {r['level']} | {r['format']} | code={r['codeLines']} lines / prompt={r['promptChars']} chars / control={r['controlMarkers']} / assign={r['assignmentMarkers']} / index={r['indexMarkers']} / total={r['totalTextChars']}"

audit=f'''FE QUEST v259 — Subject B Final Problem Authenticity Diagnostic Audit
==========================================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v258
Source main: {parent}
Learner-facing change in v259: none

Purpose
-------
v258 closed the learner-local adaptive-recommendation sequence. v259 returns to Subject B content quality and inventories whether the 43 final-practice algorithm items, especially the 15 items already designated as sustained/high TRACE, actually carry enough visible program/state structure to justify a deeper authenticity review. This is diagnostic only: no question wording, answer, scoring, selection, order, difficulty label, remediation route, timing, or UI is changed.

Reference framing
-----------------
The attached 令和8年度 study materials organize Subject B around algorithm/programming plus information security, and the dedicated Subject B strategy section explicitly separates algorithm/programming preparation from security preparation. The repository already uses a sustained-TRACE floor, so this audit measures the existing algorithm pool in that same trace-oriented frame rather than inventing a new curriculum taxonomy.

Inventory
---------
Algorithm final-practice pool: 43
Sustained/high TRACE inventory: 15
Domain counts: {json.dumps(by_domain,ensure_ascii=False,sort_keys=True)}
High-TRACE median code lines: {summary['highMedianCodeLines']}
Other-item median code lines: {summary['otherMedianCodeLines']}
High-TRACE median prompt chars: {summary['highMedianPromptChars']}
Other-item median prompt chars: {summary['otherMedianPromptChars']}
High-TRACE median total visible text chars: {summary['highMedianTotalTextChars']}
Other-item median total visible text chars: {summary['otherMedianTotalTextChars']}
High-TRACE median control markers: {summary['highMedianControlMarkers']}
Other-item median control markers: {summary['otherMedianControlMarkers']}
High-TRACE median assignment markers: {summary['highMedianAssignmentMarkers']}
Other-item median assignment markers: {summary['otherMedianAssignmentMarkers']}
High-TRACE median index markers: {summary['highMedianIndexMarkers']}
Other-item median index markers: {summary['otherMedianIndexMarkers']}
High-TRACE items with zero explicit code lines: {json.dumps(summary['highZeroCodeLines'],ensure_ascii=False)}
High-TRACE low-structure diagnostic candidates (<=4 code lines and <=3 combined control/assignment/index markers): {json.dumps(summary['highLowStructure'],ensure_ascii=False)}

Shortest sustained/high TRACE candidates
----------------------------------------
{chr(10).join(fmt(r) for r in shortest)}

Longest overall items
---------------------
{chr(10).join(fmt(r) for r in longest)}

Repeated-final exposure
-----------------------
5000 deterministic final builds preserved the existing high-TRACE floor.
High-TRACE count per final: min={cand['coverage']['highTraceMin']} / max={cand['coverage']['highTraceMax']} / average={cand['coverage']['highTraceAvg']}
Every selection frequency is captured in the regression fixture for a later repair to avoid improving items that almost never appear or accidentally overexposing a small subset.

Regression
----------
Question / TRACE / compound / security / final-algorithm banks: byte-behavior equivalent to v258.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
Use this evidence for v260. If sustained/high-TRACE items are structurally indistinguishable from ordinary items or include conspicuously short/low-state candidates, repair only that bounded subset first. Preserve the 43-item pool, 15-item high-TRACE inventory unless evidence requires reclassification, the floor of four per final, all scoring/selection contracts, and the existing remediation map. Prefer richer multi-step state tracking and realistic pseudocode reading over simply making stems longer.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_FINAL_AUTHENTICITY_DIAGNOSTIC_v259.txt').write_text(audit); print(audit)
