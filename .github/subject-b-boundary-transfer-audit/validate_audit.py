from pathlib import Path
import base64, json, os, re, runpy, statistics, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-boundary-transfer-audit-(v(\d+))',branch)
    req(m is not None,'bad v275 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def scripts(path):
    html=Path(path).read_text(); return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function stable(v){return JSON.stringify(v,(k,x)=>typeof x==='function'?String(x):x);}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function asLines(v){if(Array.isArray(v))return v.map(String);if(typeof v==='string')return v.split(/\r?\n/).filter(Boolean);return [];}
function finalRows(){return B_EXAM_ALGO_ITEMS.map(x=>({id:x.id,domain:String(x.domain||''),level:String(x.level||''),format:String(x.format||''),q:String(x.q||x.prompt||''),desc:String(x.desc||x.description||''),code:asLines(x.code),options:Array.isArray(x.options)?x.options.map(String):[]}));}
function traceRows(){return B_EXERCISES.map(x=>({id:x.id,title:String(x.title||x.name||''),skill:String(x.skill||x.domain||x.area||''),desc:String(x.desc||x.description||''),code:asLines(x.code),steps:(x.steps||[]).map(s=>({msg:String(s.msg||''),predict:s.predict?{q:String(s.predict.q||''),opts:(s.predict.opts||[]).map(String),a:s.predict.a}:null}))}));}
console.log('__V275__'+Buffer.from(JSON.stringify({v:APP_VERSION,finalRows:finalRows(),traceRows:traceRows(),banks:{ex:hashText(stable(B_EXERCISES)),algo:hashText(stable(B_EXAM_ALGO_ITEMS)),compound:hashText(stable(B_COMPOUND_SETS)),security:hashText(stable(SECURITY_SCENARIOS))},contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-9000:])
        m=re.search(r'__V275__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))


SIGNALS={
 'notFound':re.compile(r'見つから|存在しない|該当しない|探索失敗|not[ -]?found|\b-1\b',re.I),
 'emptyOrNull':re.compile(r'\bnull\b|未定義|空(?:配列|リスト|キュー|スタック|集合|の場合|なら|のとき)|要素数\s*(?:=|＝|←)?\s*0',re.I),
 'singleElement':re.compile(r'1\s*要素|要素(?:数)?\s*(?:=|＝|←)?\s*1|一つだけ|1個だけ',re.I),
 'endpointWords':re.compile(r'先頭|末尾|最初|最後|境界|範囲外|端(?:の|まで|から)',re.I),
 'baseCase':re.compile(r'基底|base\s*case|再帰.*(?:0|1)|(?:0|1).*再帰',re.I),
 'zeroBoundary':re.compile(r'(?:<=|>=|≤|≥|<|>|=|＝|≠)\s*0|0\s*(?:<=|>=|≤|≥|<|>|=|＝|≠)',re.I),
 'lengthBoundary':re.compile(r'(?:length|len|要素数|配列の長さ|末尾).{0,24}(?:-\s*1|−\s*1|未満|以下)|(?:-\s*1|−\s*1).{0,24}(?:length|len|要素数|配列の長さ)',re.I),
}
BOUNDARY_OP=re.compile(r'<=|>=|≤|≥|より小さ|より大き|未満|以下|以上|添字|index|\[[^\]]+\]',re.I)


def final_text(r): return '\n'.join([r['q'],r['desc'],*r['code'],*r['options']])
def trace_text(r):
    chunks=[r['title'],r['skill'],r['desc'],*r['code']]
    for s in r['steps']:
        chunks.append(s['msg'])
        if s['predict']: chunks.extend([s['predict']['q'],*s['predict']['opts']])
    return '\n'.join(chunks)

def classify(text):
    hits=[k for k,rx in SIGNALS.items() if rx.search(text)]
    return {'signals':hits,'semanticEdge':bool(hits),'boundaryOperator':bool(BOUNDARY_OP.search(text))}


version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v275','v274'),'v275 audit expects v274 parent')
source=Path('audits/SUBJECT_B_FINAL_HANDOFF_POST_REPAIR_v274.txt'); req(source.exists(),'v274 closure audit missing')
req('PASS — NO FINDINGS' in source.read_text(),'v274 closure evidence drift')
transfer=Path('audits/SUBJECT_B_TRANSFER_RETRACE_EXPANSION_POST_AUDIT_v265.txt'); req(transfer.exists(),'v265 transfer closure audit missing')
req('Close the current alternate-value re-trace expansion sequence at two exercises.' in transfer.read_text(),'v265 transfer closure evidence drift')
expected={'.github/subject-b-boundary-transfer-audit/validate_audit.py','.github/workflows/subject-b-boundary-transfer-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v275 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v275' and par['v']=='v274','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'audit-only Subject B bank drift')
req(cand['finalRows']==par['finalRows'] and cand['traceRows']==par['traceRows'],'audit-only learner content drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')

final=[]
for r in cand['finalRows']:
    c=classify(final_text(r)); final.append({**{k:r[k] for k in ['id','domain','level','format']},**c})
trace=[]
for r in cand['traceRows']:
    c=classify(trace_text(r)); trace.append({**{k:r[k] for k in ['id','title','skill']},**c})
by_domain={}
for r in final:
    d=r['domain'] or '未設定'; e=by_domain.setdefault(d,{'count':0,'semanticEdge':0,'boundaryOperator':0,'ids':[],'edgeIds':[],'signals':{}})
    e['count']+=1;e['ids'].append(r['id']);e['semanticEdge']+=int(r['semanticEdge']);e['boundaryOperator']+=int(r['boundaryOperator'])
    if r['semanticEdge']:e['edgeIds'].append(r['id'])
    for s in r['signals']:e['signals'][s]=e['signals'].get(s,0)+1
critical=['探索・整列','一次元配列','二次元配列','再帰・関数','リスト','木構造','スタック・キュー']
findings=[]
for d in critical:
    e=by_domain.get(d)
    if e and e['semanticEdge']==0:
        findings.append({'id':'subject_b_domain_lacks_explicit_edge_state_item','severity':'Medium','domain':d,'summary':'This boundary-sensitive algorithm domain has no final-practice item with an explicit not-found/empty/null/singleton/endpoint/base-case/zero-or-length-boundary signal.'})
# A domain with only one explicit edge item is useful but fragile; record it as Low only when it has >=4 final items.
for d in critical:
    e=by_domain.get(d)
    if e and e['count']>=4 and e['semanticEdge']==1:
        findings.append({'id':'subject_b_domain_edge_state_coverage_singleton','severity':'Low','domain':d,'edgeIds':e['edgeIds'],'summary':'This boundary-sensitive domain has only one explicitly identifiable edge-state final item, so repeated practice may have little edge-case variety.'})
result='PASS — NO FINDINGS' if not findings else 'PASS — FINDINGS RECORDED'
summary={'finalCount':len(final),'traceCount':len(trace),'semanticEdgeFinalCount':sum(1 for x in final if x['semanticEdge']),'boundaryOperatorFinalCount':sum(1 for x in final if x['boundaryOperator']),'semanticEdgeTraceCount':sum(1 for x in trace if x['semanticEdge']),'boundaryOperatorTraceCount':sum(1 for x in trace if x['boundaryOperator']),'byDomain':by_domain,'criticalDomains':critical}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'finalClassification':final,'traceClassification':trace,'findings':findings,'semanticOK':True,'candidateMechanicalSixFileByteEquality':True}
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-boundary-transfer-v275.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

domain_txt='\n'.join(f"{d}: total={e['count']} / explicit-edge={e['semanticEdge']} / boundary-operator={e['boundaryOperator']} / edgeIds={e['edgeIds']} / signals={json.dumps(e['signals'],ensure_ascii=False,sort_keys=True)}" for d,e in sorted(by_domain.items()))
trace_edges=[x['id'] for x in trace if x['semanticEdge']]
find_txt='None.' if not findings else '\n'.join(f"{x['severity']} — {x['id']} ({x['domain']}): {x['summary']}" for x in findings)
audit=f'''FE QUEST v275 — Subject B Boundary / Edge-State Transfer Audit
==================================================================

Result
------
{result}
Previous release: v274
Source main: {parent}
Learner-facing change in v275: none

Why this frontier
-----------------
v265 deliberately closed alternate-value re-trace after two safe repeat variants, and v274 closed the recent mobile/interaction-friction sequence. v275 therefore returns to learner-facing transfer quality without adding another generic variant generator: it audits whether the existing Subject B algorithm practice exposes learners to boundary and edge states that require fresh reasoning rather than only ordinary-path tracing.

Attached-material framing
-------------------------
The attached Subject B material explicitly recommends making an execution example before tracing and shows boundary-value examples around conditional ranges. That supports auditing edge-state coverage as a separate transfer skill. This audit uses that learning strategy as design guidance only; no proprietary question text is copied into FE QUEST.

Coverage summary
----------------
Final algorithm items: {summary['finalCount']}
TRACE exercises: {summary['traceCount']}
Final items with an explicit semantic edge-state signal: {summary['semanticEdgeFinalCount']}
Final items with a boundary/operator/index signal: {summary['boundaryOperatorFinalCount']}
TRACE exercises with an explicit semantic edge-state signal: {summary['semanticEdgeTraceCount']}
TRACE exercises with a boundary/operator/index signal: {summary['boundaryOperatorTraceCount']}

Domain evidence
---------------
{domain_txt}

TRACE exercises with explicit edge-state signals
------------------------------------------------
{json.dumps(trace_edges,ensure_ascii=False)}

Findings
--------
{find_txt}

Interpretation
--------------
“Explicit edge-state” is intentionally conservative: the source must visibly contain a not-found, empty/null, singleton, endpoint, base-case, zero-boundary or length-boundary cue. Ordinary inequalities and array indexes are counted separately as boundary/operator evidence and do not by themselves prove an edge-case exercise. This avoids treating every loop as meaningful boundary transfer.

Regression
----------
All 20 TRACE exercises and 43 final algorithm items are unchanged from v274.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If a boundary-sensitive domain has zero explicit edge-state items, add one narrowly scoped original problem in that domain before increasing generic question volume. If a domain has exactly one edge-state item, first inspect its selection exposure and conceptual uniqueness before deciding whether a second item is justified. Preserve the existing re-trace variants and do not randomize edge cases blindly: empty/null/not-found inputs can invalidate indexes or change answer-option uniqueness unless authored and regression-tested explicitly.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_BOUNDARY_TRANSFER_v275.txt').write_text(audit); print(audit)
