from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def context():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-distractor-difficulty-calibration-audit-(v(\d+))', branch)
    req(m, 'bad Subject B distractor/difficulty calibration audit branch')
    return m.group(1), f'v{int(m.group(2)) - 1}'


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x232000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function tx(v){return String(v??'').trim();}
function opts(q){return Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);}
function ai(q){return Number.isInteger(Number(q?.a))?Number(q.a):Number(q?.correct);}
function sentinel(v){return /^(?:未定義|変化しない|なし|null|true|false|不明)$/i.test(tx(v));}
function family(v){
  const s=tx(v);
  if(/^\[[^\]]*\]$/.test(s))return 'list';
  if(/^\([^()]*,[^()]*\)$/.test(s))return 'tuple';
  if(/^[^=,]+=[^,]+(?:,\s*[^=,]+=[^,]+)+$/.test(s))return 'state';
  if(s.includes('→')&&!s.includes('←'))return 'chain';
  if(s.includes('←')||/^return\b/i.test(s))return 'expression';
  if(/^[01]{3,}(?:₂)?$/.test(s)||/^[01]{2,}₂$/.test(s))return 'bit';
  if(/^-?\d+(?:\.\d+)?$/.test(s))return 'number';
  if(/^(?:true|false)$/i.test(s))return 'boolean';
  if(/^[A-Za-z]$/.test(s))return 'symbol';
  return 'text';
}
const STRUCT=new Set(['number','list','tuple','state','chain','expression','bit','boolean']);
function question(layer,id,level,domain,q){
  const o=opts(q).map(tx),a=ai(q),cf=family(o[a]),f=o.map(family),same=f.filter((x,i)=>i!==a&&x===cf).length;
  const out=[];f.forEach((x,i)=>{if(i!==a&&x!==cf&&!sentinel(o[i])&&STRUCT.has(cf)&&STRUCT.has(x)&&same>=2)out.push({index:i,text:o[i],family:x});});
  const norm=o.map(x=>x.replace(/[\s　]/g,'').replace(/[，]/g,',').replace(/[＝]/g,'=')),dups=[];
  norm.forEach((x,i)=>{const j=norm.indexOf(x);if(j<i)dups.push([j,i]);});
  return {layer,id,level:tx(level)||'未設定',domain:tx(domain)||'—',options:o,correctFamily:cf,outliers:out,duplicates:dups};
}
function metrics(code,data){
  const a=Array.isArray(code)?code:[];let loops=0,branches=0,defs=0,indent=0,assigns=0,struct=0;
  for(const raw of a){const s=String(raw),t=s.trim();indent=Math.max(indent,Math.floor((s.match(/^\s*/)?.[0].length||0)/4));if(/^(?:for|while|do\b)/i.test(t))loops++;if(/^(?:if\b|elseif\b|else\b)/i.test(t))branches++;if(/^(?:function|procedure|method|class)\b/i.test(t))defs++;if(t.includes('←'))assigns++;if(/\[[^\]]*\]|\.next\b|PUSH\b|POP\b|ENQUEUE\b|DEQUEUE\b|AND\b|OR\b|XOR\b|>>|<</i.test(t))struct++;}
  const facts=Math.min(4,tx(data)?1+(tx(data).match(/[。;；]/g)||[]).length:0);
  const score=a.length+2*loops+2*branches+2*defs+indent+Math.min(assigns,5)+Math.min(struct,5)+facts;
  return {lines:a.length,loops,branches,defs,indent,assigns,struct,facts,score};
}
function median(xs){if(!xs.length)return 0;const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function separation(hi,lo){if(!hi.length||!lo.length)return null;let w=0,n=0;for(const a of hi)for(const b of lo){n++;w+=a>b?1:(a===b?0.5:0);}return Math.round(w/n*1000)/1000;}
function dist(rows,key='level'){const m={};for(const r of rows){const k=tx(r[key])||'未設定';m[k]=(m[k]||0)+1;}return m;}
function burden(rows){const by={};for(const r of rows)(by[r.level]||(by[r.level]=[])).push(r.metrics.score);const o={};for(const [k,v] of Object.entries(by))o[k]={count:v.length,median:median(v),min:Math.min(...v),max:Math.max(...v)};return o;}
function inventory(){
  const traceQ=[],traceEx=[],compound=[],security=[];
  for(const ex of B_EXERCISES){traceEx.push({id:ex.id,level:ex.level,domain:ex.concept||'',metrics:metrics(ex.code,JSON.stringify({array:ex.array,matrix:ex.matrix,list:ex.list,tree:ex.tree}))});(ex.steps||[]).forEach((s,i)=>{if(s.predict)traceQ.push(question('trace',`${ex.id}:${i}`,ex.level,ex.concept,s.predict));});}
  for(const set of B_COMPOUND_SETS)(set.qs||[]).forEach((q,i)=>compound.push(question('compound',`${set.id}:${i}`,q.qlevel||set.level,set.title,q)));
  for(const sc of SECURITY_SCENARIOS)(sc.steps||[]).forEach((s,i)=>security.push(question('security-practice',`${sc.id}:${i}`,sc.level,sc.concept||'情報セキュリティ',s)));
  const final=B_EXAM_ALGO_ITEMS.map(x=>({...question('final-algorithm',x.id,x.level,x.domain,x),metrics:metrics(x.code,JSON.stringify(x.data||[]))}));
  const extraMismatch=[];
  for(const ex of B_EXERCISES){const e=tx(B_MOCK_EXTRA_DISTRACTOR?.[ex.id]);if(!e)continue;const c=[...new Set((ex.steps||[]).filter(s=>s.predict).map(s=>family(opts(s.predict)[ai(s.predict)])))],ef=family(e);if(!c.includes(ef)&&!sentinel(e)&&STRUCT.has(ef)&&c.some(x=>STRUCT.has(x)))extraMismatch.push({exerciseId:ex.id,extra:e,extraFamily:ef,correctFamilies:c});}
  const all=[...traceQ,...compound,...security,...final];
  const outliers=all.filter(x=>x.outliers.length).map(x=>({layer:x.layer,id:x.id,level:x.level,domain:x.domain,options:x.options,correctFamily:x.correctFamily,outliers:x.outliers}));
  const duplicates=all.filter(x=>x.duplicates.length).map(x=>({layer:x.layer,id:x.id,options:x.options,duplicates:x.duplicates}));
  const tb=burden(traceEx),fb=burden(final),ts={basicVsStandard:separation(traceEx.filter(x=>x.level==='標準').map(x=>x.metrics.score),traceEx.filter(x=>x.level==='基礎').map(x=>x.metrics.score)),standardVsAdvanced:separation(traceEx.filter(x=>x.level==='応用').map(x=>x.metrics.score),traceEx.filter(x=>x.level==='標準').map(x=>x.metrics.score))},fs={standardVsAdvanced:separation(final.filter(x=>x.level==='応用').map(x=>x.metrics.score),final.filter(x=>x.level==='標準').map(x=>x.metrics.score))};
  let inversions=0;for(const d of [...new Set(final.map(x=>x.domain))]){const st=final.filter(x=>x.domain===d&&x.level==='標準'),ad=final.filter(x=>x.domain===d&&x.level==='応用');for(const a of ad)for(const s of st)if(a.metrics.score+2<=s.metrics.score)inversions++;}
  return {counts:{traceQuestions:traceQ.length,compound:compound.length,security:security.length,finalAlgorithm:final.length},levels:{traceExercises:dist(traceEx),compound:dist(compound),security:dist(security),finalAlgorithm:dist(final),mockQuotas:{...B_MOCK_QUOTAS}},distractors:{totalQuestions:all.length,totalWrongSlots:all.reduce((n,x)=>n+x.options.length-1,0),outliers,duplicates,extraMismatch},burden:{trace:tb,finalAlgorithm:fb,traceSeparation:ts,finalSeparation:fs,domainInversionCount:inversions}};
}
function remediation(){const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));const a=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),s=SECURITY_SCENARIOS.map(makeFinalSecurity);return {algorithm:a.length,security:s.length,algoBad:a.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId),secBad:s.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId)};}
console.log('__V232__'+Buffer.from(JSON.stringify({v:APP_VERSION,counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,domainSpec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,feedbackSpec:globalThis.SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC||null,sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),remediation:remediation(),inventory:inventory()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-6000:])
        m = re.search(r'__V232__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = context()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req((version, previous) == ('v232', 'v231'), 'v232 audit expects v231 parent')
source = Path('audits/SUBJECT_B_WRONG_ANSWER_FEEDBACK_LEARNER_FLOW_AUDIT_v231.txt')
req(source.exists(), 'v231 evidence missing')
req('PASS — NO FINDINGS' in source.read_text() and 'distractor plausibility and difficulty calibration' in source.read_text(), 'v231 handoff drift')
expected = {'.github/subject-b-distractor-difficulty-calibration-audit/validate_audit.py','.github/workflows/subject-b-distractor-difficulty-calibration-audit.yml'}
changed = set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v232 audit-only source drift: ' + repr(sorted(changed ^ expected)))
for path in ['app/base-stable.html','app/subject-b-security-overrides-v200.txt','app/subject-b-algorithm-overrides-v202.txt','app/subject-b-session-overrides-v205.txt','app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt','app/subject-b-algorithm-domain-progression-overrides-v227.txt','app/subject-b-wrong-answer-feedback-overrides-v230.txt']:
    req(Path(path).read_bytes() == subprocess.check_output(['git','show',parent+':'+path]), 'learner-facing source drift: '+path)

cand, par = runtime('_site/index.html'), runtime('_site_parent/index.html')
req(cand['v'] == 'v232' and par['v'] == 'v231', 'runtime versions')
req(cand['counts'] == par['counts'] == [20,16,4] and cand['seconds'] == par['seconds'] == 6000, 'final contract drift')
req(cand['pool'] == par['pool'] == 43 and cand['floor'] == par['floor'] == 4 and cand['high'] == par['high'] and len(cand['high']) == 15, 'final pool/high-trace drift')
for k in ['orderSpec','recoverySpec','xpSpec','readinessSpec','copySpec','domainSpec','feedbackSpec']:
    req(cand[k] == par[k], k + ' drift')
req(cand['selectionSig'] == par['selectionSig'], '1000-seed selection/order drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic validation failed')
req(cand['remediation'] == par['remediation'], 'remediation drift')
req(cand['remediation']['algorithm'] == 43 and not cand['remediation']['algoBad'], 'algorithm remediation invalid')
req(cand['remediation']['security'] == 15 and not cand['remediation']['secBad'], 'security remediation invalid')
req(cand['inventory'] == par['inventory'], 'audit-only inventory behavior drift')

inv = cand['inventory']
req(inv['counts']['finalAlgorithm'] == 43 and inv['counts']['traceQuestions'] > 0 and inv['counts']['compound'] > 0 and inv['counts']['security'] > 0, 'question inventory incomplete')
req(inv['levels']['mockQuotas'] == {'基礎':2,'標準':4,'応用':2}, 'mini-mock quota drift')

findings=[]
dups=inv['distractors']['duplicates']; outliers=inv['distractors']['outliers']; extras=inv['distractors']['extraMismatch']
if dups:
    findings.append({'id':'subject_b_duplicate_answer_choices','severity':'High','count':len(dups),'summary':'Normalized duplicate answer choices exist.'})
if outliers or extras:
    findings.append({'id':'subject_b_distractor_structural_mismatch','severity':'Medium','count':len(outliers)+len(extras),'summary':'Some wrong choices use a different structural answer form from the correct answer and the other distractors, allowing partial rejection without solving.'})
b=inv['burden']; tr=b['trace']; fi=b['finalAlgorithm']; sep_t=b['traceSeparation']['standardVsAdvanced']; sep_f=b['finalSeparation']['standardVsAdvanced']
trace_order=tr.get('基礎',{}).get('median',0) <= tr.get('標準',{}).get('median',0) <= tr.get('応用',{}).get('median',0)
final_order=fi.get('標準',{}).get('median',0) <= fi.get('応用',{}).get('median',0)
if (not trace_order) or (not final_order) or (sep_t is not None and sep_t < .55) or (sep_f is not None and sep_f < .55):
    findings.append({'id':'subject_b_difficulty_label_structural_separation_weak','severity':'Low','count':1,'summary':'Static difficulty labels separate weakly on the conservative structural-burden proxy; conceptual difficulty may still justify individual labels.'})

sev={x:sum(1 for f in findings if f['severity']==x) for x in ['High','Medium','Low']}
result='PASS — NO FINDINGS' if not findings else ('PASS — HIGH FINDING RECORDED' if sev['High'] else ('PASS — MEDIUM FINDING RECORDED' if sev['Medium'] else 'PASS — LOW FINDING RECORDED'))
fixture={'name':f'subject-b-distractor-difficulty-calibration-audit-{version}','version':version,'previous':previous,'sourceMain':parent,'learnerFacingChange':False,'selectionSignature1000':cand['selectionSig'],'inventory':inv,'remediation':cand['remediation'],'findings':findings}
Path('_regression').mkdir(exist_ok=True)
Path(f'_regression/subject-b-distractor-difficulty-calibration-audit-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

examples='\n'.join(f"- {x['layer']} {x['id']} / {x['domain']}: {x['options']} -> outlier {[o['text'] for o in x['outliers']]}" for x in outliers[:12]) or '- none'
extra_examples='\n'.join(f"- {x['exerciseId']}: extra={x['extra']} ({x['extraFamily']}) / correct families={x['correctFamilies']}" for x in extras[:12]) or '- none'
finding_text='\n'.join(f"- {f['severity']}: {f['id']} ({f['count']}) — {f['summary']}" for f in findings) or '- none'
audit=f'''FE QUEST v232 — Subject B Distractor Plausibility & Difficulty Calibration Audit
====================================================================================

Result
------
{result}
Previous: v231
Source main: {parent}
Learner-facing change in v232: none

What was audited
----------------
v229-v231 closed the wrong-answer feedback sequence. v232 moved to the next frontier named by v231: distractor plausibility, static 基礎/標準/応用 calibration, and the TRACE → mini-mock → final progression. This release is audit-only.

Inventory
---------
TRACE prediction questions: {inv['counts']['traceQuestions']}
Compound questions: {inv['counts']['compound']}
Security practice questions: {inv['counts']['security']}
Final algorithm source questions: {inv['counts']['finalAlgorithm']}
Audited wrong-choice slots: {inv['distractors']['totalWrongSlots']}
TRACE exercise levels: {json.dumps(inv['levels']['traceExercises'],ensure_ascii=False,sort_keys=True)}
Compound levels: {json.dumps(inv['levels']['compound'],ensure_ascii=False,sort_keys=True)}
Security levels: {json.dumps(inv['levels']['security'],ensure_ascii=False,sort_keys=True)}
Final algorithm levels: {json.dumps(inv['levels']['finalAlgorithm'],ensure_ascii=False,sort_keys=True)}
Mini-mock quota: {json.dumps(inv['levels']['mockQuotas'],ensure_ascii=False,sort_keys=True)}

Distractor plausibility
-----------------------
Duplicate normalized option sets: {len(dups)}
Question-level structural outliers: {len(outliers)}
Generated extra-distractor family mismatches: {len(extras)}
The structural check is conservative: a wrong choice is flagged only when the correct answer and at least two other distractors share one structural answer form while the remaining wrong choice uses another form. Sentinel answers such as 「未定義」 are not flagged merely for being text.

Flagged question examples
-------------------------
{examples}

Flagged generated-extra examples
--------------------------------
{extra_examples}

Difficulty calibration
----------------------
TRACE structural burden by label: {json.dumps(tr,ensure_ascii=False,sort_keys=True)}
Final algorithm structural burden by label: {json.dumps(fi,ensure_ascii=False,sort_keys=True)}
TRACE pairwise separation: {json.dumps(b['traceSeparation'],ensure_ascii=False,sort_keys=True)}
Final pairwise separation: {json.dumps(b['finalSeparation'],ensure_ascii=False,sort_keys=True)}
Same-domain final inversions (応用 at least two structural-burden points below a 標準 item): {b['domainInversionCount']}
The burden proxy combines only observable code length, loops/branches/definitions, indentation, assignments, data-structure operations and supplied facts. It is not treated as exam-difficulty truth; conceptual difficulty can make a shorter item harder.

Findings
--------
{finding_text}

Preserved contracts
-------------------
1000 deterministic final-session seeds match v231 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 order, v217 recovery, v219 XP, v222 readiness/65% threshold, v224 copy, v227 domain progression, and v230 choice-specific feedback are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.

Findings summary
----------------
High: {sev['High']}
Medium: {sev['Medium']}
Low: {sev['Low']}

Decision
--------
'''
if any(f['id']=='subject_b_distractor_structural_mismatch' for f in findings):
    audit += 'Use v233 for a narrow distractor-quality repair. Replace only flagged structurally incompatible distractors with same-answer-form alternatives representing realistic mistakes such as off-by-one, stale state, update-order, traversal, LIFO/FIFO, or security-control confusion. Preserve prompts, correct answers, v230 feedback, difficulty labels, scoring, selection/order, timing, the 65% readiness gate, and remediation targets unless separately audited evidence requires a change. Follow with a learner-flow/regression audit.\n'
elif findings:
    audit += 'Use v233 only for the narrowest calibration repair supported by the evidence, then follow with a learner-flow/regression audit. Do not change scoring or the 65% readiness gate from this structural proxy alone.\n'
else:
    audit += 'No audit-level defect was found under the conservative checks. Move the next Subject B release to a different learning-quality frontier rather than changing scoring or readiness thresholds without new evidence.\n'
Path('audits').mkdir(exist_ok=True)
Path(f'audits/SUBJECT_B_DISTRACTOR_DIFFICULTY_CALIBRATION_AUDIT_{version}.txt').write_text(audit)
print(f'FEQUEST_SUBJECT_B_DISTRACTOR_DIFFICULTY_CALIBRATION_AUDIT_OK version={version} result={result} outliers={len(outliers)} extras={len(extras)} duplicates={len(dups)} findings={len(findings)}')
