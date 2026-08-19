from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-transfer-retrace-audit-(v(\d+))',branch)
    req(m is not None,'bad v260 audit branch')
    version=m.group(1); return version,f'v{int(m.group(2))-1}'


def scripts(path):
    html=Path(path).read_text(); return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def source_evidence(path):
    js=scripts(path)
    occ=[]
    for term in ['B_EXERCISES','currentB','finishBExercise']:
        start=0
        while True:
            i=js.find(term,start)
            if i<0: break
            lo=max(0,i-900); hi=min(len(js),i+1300); chunk=js[lo:hi]
            funcs=list(re.finditer(r'function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',chunk[:900]))
            fn=funcs[-1].group(1) if funcs else None
            occ.append({'term':term,'function':fn,'random':bool(re.search(r'Math\.random|shuffle|shuffled|random',chunk,re.I)),'variant':bool(re.search(r'variant|alternate|different.?value|別の値|generate',chunk,re.I)),'snippet':re.sub(r'\s+',' ',chunk)[-1500:]})
            start=i+len(term)
    consumers=[x for x in occ if x['term']=='B_EXERCISES']
    return {'occurrences':len(occ),'consumerOccurrences':len(consumers),'consumerRandomNeighborhoods':sum(1 for x in consumers if x['random']),'consumerVariantNeighborhoods':sum(1 for x in consumers if x['variant']),'consumerFunctions':sorted(set(x['function'] for x in consumers if x['function'])),'sample':consumers[:8]}


def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function variantKeys(v,path='',out=[]){
 if(Array.isArray(v)){v.forEach((x,i)=>variantKeys(x,`${path}[${i}]`,out));return out;}
 if(!v||typeof v!=='object')return out;
 for(const [k,x] of Object.entries(v)){
   const p=path?`${path}.${k}`:k;
   if(/variant|alternate|seed|generator|random|param|inputset|valueset|template/i.test(k))out.push(p);
   variantKeys(x,p,out);
 }
 return out;
}
function exerciseRows(){return B_EXERCISES.map(ex=>{const preds=(ex.steps||[]).filter(s=>s.predict).map(s=>({q:String(s.predict.q||''),opts:(s.predict.opts||[]).map(String),a:s.predict.a}));return {id:ex.id,keys:Object.keys(ex).sort(),code:(ex.code||[]).map(String),predictions:preds,variantKeys:variantKeys(ex),fingerprint:hashJson({code:ex.code,steps:ex.steps,desc:ex.desc})};});}
function remediationTargets(){return B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam).map(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return {sourceId:x.sourceId,domain:x.domain,mode:t.mode,id:t.id||null};});}
const rows=exerciseRows();
console.log('__V260__'+Buffer.from(JSON.stringify({v:APP_VERSION,rows,variantKeys:variantKeys(B_EXERCISES),targets:remediationTargets(),finishSource:String(finishBExercise),contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],banks:{ex:hashJson(B_EXERCISES),algo:hashJson(B_EXAM_ALGO_ITEMS)},sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True); req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V260__([A-Za-z0-9+/=]+)',z.stdout); req(m,'runtime marker missing'); return json.loads(base64.b64decode(m.group(1)))

version,previous=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req((version,previous)==('v260','v259'),'v260 audit expects v259 runtime parent')
source=Path('audits/SUBJECT_B_FINAL_AUTHENTICITY_DIAGNOSTIC_v259.txt'); req(source.exists(),'v259 authenticity audit missing')
req('PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(),'v259 evidence drift')
expected={'.github/subject-b-transfer-retrace-audit/validate_audit.py','.github/workflows/subject-b-transfer-retrace-audit.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(changed==expected,'v260 audit-only source drift: '+repr(sorted(changed^expected)))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html'); src=source_evidence('_site/index.html'); psrc=source_evidence('_site_parent/index.html')
req(cand['v']=='v260' and par['v']=='v259','runtime versions')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4],'final contract drift')
req(cand['banks']==par['banks'],'audit-only bank drift')
req(cand['rows']==par['rows'] and cand['targets']==par['targets'],'audit-only trace/remediation drift')
req(src==psrc,'audit-only exercise source evidence drift')
req(cand['sem'].get('ok') is True,'Subject B semantic diagnostics failed')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/mechanical reference mismatch')

rows=cand['rows']; req(len(rows)==20,'TRACE exercise count drift')
pred_counts={r['id']:len(r['predictions']) for r in rows}; req(all(n==2 for n in pred_counts.values()),'TRACE prediction count drift')
all_variant=sorted(set(cand['variantKeys'])); per_variant={r['id']:r['variantKeys'] for r in rows if r['variantKeys']}
trace_targets=[t for t in cand['targets'] if t['mode']=='trace']; req(len(trace_targets)==43,'algorithm remediation TRACE coverage drift')
unique_target_ids=sorted(set(t['id'] for t in trace_targets)); fixed_prediction_signatures={r['id']:hash(tuple((p['q'],tuple(p['opts']),p['a']) for p in r['predictions'])) for r in rows}

has_authored_variant=bool(all_variant or per_variant)
source_variant=src['consumerVariantNeighborhoods']>0
finding=not has_authored_variant and not source_variant
result='PASS — MEDIUM FINDING RECORDED' if finding else 'PASS — NO FINDINGS'
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'traceExerciseCount':len(rows),'predictionCountByExercise':pred_counts,'variantKeys':all_variant,'perExerciseVariantKeys':per_variant,'sourceEvidence':src,'algorithmTraceTargets':len(trace_targets),'uniqueTraceTargetIds':unique_target_ids,'fixedPredictionSignatures':fixed_prediction_signatures,'finding':({'id':'fixed_value_trace_repractice_limits_transfer','severity':'Medium','summary':'The focused TRACE remediation layer has fixed authored code/prediction values and no detected alternate-value variant metadata or generator neighborhood, so repeating the same target primarily rehearses the same state path rather than testing transfer to changed inputs.'} if finding else None),'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-transfer-retrace-v260.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v260 — Subject B Transfer / Re-Trace Diagnostic Audit
====================================================================

Result
------
{result}
Previous release: v259
Source main: {parent}
Learner-facing change in v260: none

Why this frontier
-----------------
v259 confirmed that the final-practice high-TRACE set is structurally deeper than ordinary items, so simply lengthening those questions is not the next priority. The next learning-quality question is transfer: after a learner has traced one concrete state path, can FE QUEST make them reconstruct the same idea under changed values rather than only repeat the identical authored path?

Attached-material framing
-------------------------
The attached Subject B-specific study books strongly organize algorithm preparation around pseudocode tracing, and their structure repeatedly returns to re-tracing programs with changed values/conditions as a way to confirm understanding. This audit uses that pedagogical direction only as a learning-design reference; it does not copy any proprietary problem text into FE QUEST.

Current TRACE layer
-------------------
TRACE exercises: {len(rows)}
Predictions per exercise: all 2
Algorithm final items with valid TRACE remediation: {len(trace_targets)} / 43
Unique TRACE destinations used by those final items: {len(unique_target_ids)}
Detected authored variant/template keys in B_EXERCISES: {json.dumps(all_variant,ensure_ascii=False)}
Exercises carrying variant/template metadata: {json.dumps(per_variant,ensure_ascii=False,sort_keys=True)}
B_EXERCISES source neighborhoods with variant/generator indicators: {src['consumerVariantNeighborhoods']}
B_EXERCISES source neighborhoods with random/shuffle indicators: {src['consumerRandomNeighborhoods']}
Detected consumer functions near B_EXERCISES: {json.dumps(src['consumerFunctions'],ensure_ascii=False)}

Interpretation
--------------
The existing TRACE layer is strong at guided intermediate-state reconstruction: every exercise has two authored prediction checkpoints, and all 43 final algorithm items retain a valid direct TRACE destination. However, no authored alternate-value/template field was detected in the 20 TRACE exercises, and no B_EXERCISES consumer neighborhood exposed a variant/generator path. The same remediation target therefore presents one fixed authored code/state scenario. Randomness elsewhere in Subject B (for example mock selection or option ordering) is not equivalent to changing the traced program's input/state values.

Medium finding
--------------
fixed_value_trace_repractice_limits_transfer
A learner can be routed precisely to a weak domain, but repeating that focused TRACE primarily rehearses the same concrete values. This can reward memory of the prior state path rather than requiring reconstruction under a changed input. The gap is learning transfer, not scoring correctness or curriculum coverage.

Recommended repair boundary
---------------------------
Use v261 for a narrow alternate-value re-trace pilot rather than changing all 20 exercises at once. Start with a small, mechanically verifiable subset of arithmetic/control/array TRACE exercises whose state transitions can be parameterized without changing the underlying concept. Preserve the original authored version as the first exposure; only a later repeat/review should be eligible for a deterministic safe variant. Each variant must keep exactly two prediction checkpoints, four options, one correct answer, and explanation/hint correctness. Do not randomize values if it can create duplicate options, invalid indexes, changed asymptotic behavior, or a different conceptual answer.

Regression
----------
Question/final algorithm banks and all 20 TRACE exercises are unchanged from v259.
Final contract remains 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Scoring, selection/order, readiness, remediation targets, difficulty labels, exam timing, and profile schema are unchanged.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_TRANSFER_RETRACE_DIAGNOSTIC_v260.txt').write_text(audit); print(audit)
