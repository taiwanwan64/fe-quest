from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-wrong-answer-explanation-diagnostic-audit-(v(\d+))', branch)
    req(m, 'bad Subject B wrong-answer explanation diagnostic audit branch')
    version = m.group(1)
    return version, f'v{int(m.group(2)) - 1}'


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x229000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function choiceSpecificMeta(row){
  const options=Array.isArray(row?.options)?row.options:(Array.isArray(row?.opts)?row.opts:[]);
  const correct=Number(row?.correct);
  const explicitKeys=['choiceExps','choiceExplanations','optionExplanations','wrongExplanations','feedbackByChoice','feedbackByOption','optionFeedback','wrongFeedback'];
  for(const key of explicitKeys){
    const v=row?.[key];
    if(Array.isArray(v) && options.length && v.length>=options.length){
      const covered=options.every((_,i)=>i===correct || String(v[i]??'').trim().length>0);
      if(covered)return {present:true,kind:key};
    }
    if(v && typeof v==='object' && !Array.isArray(v) && options.length){
      const covered=options.every((_,i)=>i===correct || String(v[i]??v[String(i)]??'').trim().length>0);
      if(covered)return {present:true,kind:key};
    }
  }
  if(options.length && options.every((o,i)=>i===correct || (o && typeof o==='object' && String(o.explain??o.explanation??o.feedback??'').trim().length>0))){
    return {present:true,kind:'option-object'};
  }
  return {present:false,kind:null};
}
function summarizeRows(rows){
  return {
    total:rows.length,
    generalExplain:rows.filter(x=>String(x.explain||'').trim()).length,
    hint:rows.filter(x=>String(x.hint||'').trim()).length,
    choiceSpecific:rows.filter(x=>x.choiceSpecific).length,
    optionCountHistogram:rows.reduce((m,x)=>(m[String(x.options)]=(m[String(x.options)]||0)+1,m),{}),
    examples:rows.slice(0,5).map(x=>({id:x.id,domain:x.domain||null,options:x.options,choiceSpecific:x.choiceSpecific,metaKind:x.metaKind||null}))
  };
}
function explanationInventory(){
  const algo=[];
  for(const ex of B_EXERCISES){
    (ex.steps||[]).forEach((s,i)=>{
      if(!s.predict)return;
      const meta=choiceSpecificMeta(s);
      algo.push({id:`${ex.id}:${i}`,domain:ex.domain||'',options:(s.opts||[]).length,correct:s.correct,explain:s.explain||'',hint:s.hint||'',choiceSpecific:meta.present,metaKind:meta.kind});
    });
  }
  const security=[];
  for(const sc of SECURITY_SCENARIOS){
    (sc.steps||[]).forEach((s,i)=>{
      const meta=choiceSpecificMeta(s);
      security.push({id:`${sc.id}:${i}`,domain:'情報セキュリティ',options:(s.options||[]).length,correct:s.correct,explain:s.explain||'',hint:s.hint||'',choiceSpecific:meta.present,metaKind:meta.kind});
    });
  }
  const finalAlgo=B_EXAM_ALGO_ITEMS.map(item=>{
    const d=makeFinalAlgoExam(item),meta=choiceSpecificMeta(d);
    return {id:d.sourceId,domain:d.domain||'',options:(d.options||[]).length,correct:d.correct,explain:d.explain||'',hint:d.hint||'',choiceSpecific:meta.present,metaKind:meta.kind};
  });
  const finalSecurity=SECURITY_SCENARIOS.map(sc=>{
    const d=makeFinalSecurity(sc),meta=choiceSpecificMeta(d);
    return {id:d.sourceId,domain:'情報セキュリティ',options:(d.options||[]).length,correct:d.correct,explain:d.explain||'',hint:d.hint||'',choiceSpecific:meta.present,metaKind:meta.kind};
  });
  return {algorithmPractice:summarizeRows(algo),securityPractice:summarizeRows(security),finalAlgorithm:summarizeRows(finalAlgo),finalSecurity:summarizeRows(finalSecurity)};
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
console.log('__V229__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,
  domainSpec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),coverage:remediationCoverage(),inventory:explanationInventory()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-5000:])
        m = re.search(r'__V229__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req(version == 'v229' and previous == 'v228', 'v229 explanation diagnosis audit expects v228 parent')
source = Path('audits/SUBJECT_B_ALGORITHM_DOMAIN_LEARNER_FLOW_AUDIT_v228.txt')
req(source.exists(), 'v228 algorithm-domain learner-flow evidence missing')
st = source.read_text()
req('PASS — NO FINDINGS' in st and 'learning value of post-answer explanations and wrong-answer review' in st, 'v228 next-frontier evidence drift')
expected = {
    '.github/subject-b-wrong-answer-explanation-diagnostic-audit/validate_audit.py',
    '.github/workflows/subject-b-wrong-answer-explanation-diagnostic-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v229 audit-only source drift: ' + repr(sorted(changed ^ expected)))
for path in [
    'app/base-stable.html',
    'app/subject-b-security-overrides-v200.txt',
    'app/subject-b-algorithm-overrides-v202.txt',
    'app/subject-b-final-overrides-v208.txt',
    'app/subject-b-final-pool-overrides-v211.txt',
    'app/subject-b-final-order-overrides-v214.txt',
    'app/subject-b-final-remediation-overrides-v217.txt',
    'app/subject-b-final-xp-overrides-v219.txt',
    'app/subject-b-readiness-overrides-v222.txt',
    'app/subject-b-readiness-copy-overrides-v224.txt',
    'app/subject-b-algorithm-domain-progression-overrides-v227.txt',
]:
    req(Path(path).read_bytes() == subprocess.check_output(['git','show',parent+':'+path]), 'learner-facing source drift: '+path)

cand = runtime('_site/index.html')
par = runtime('_site_parent/index.html')
req(cand['v'] == version and par['v'] == previous, 'runtime versions')
req(cand['counts'] == par['counts'] == [20,16,4], 'final counts drift')
req(cand['seconds'] == par['seconds'] == 6000, 'time limit drift')
req(cand['pool'] == par['pool'] == 43, 'algorithm pool drift')
req(cand['high'] == par['high'] and len(cand['high']) == 15, 'high-trace inventory drift')
req(cand['floor'] == par['floor'] == 4, 'high-trace floor drift')
req(cand['orderSpec'] == par['orderSpec'], 'v214 order spec drift')
req(cand['recoverySpec'] == par['recoverySpec'], 'v217 recovery spec drift')
req(cand['xpSpec'] == par['xpSpec'], 'v219 XP spec drift')
req(cand['readinessSpec'] == par['readinessSpec'], 'v222 readiness spec drift')
req(cand['copySpec'] == par['copySpec'], 'v224 readiness copy spec drift')
req(cand['domainSpec'] == par['domainSpec'], 'v227 algorithm-domain progression policy drift')
req(cand['selectionSig'] == par['selectionSig'], '1000-seed selection/order drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic validation failed')
req(cand['inventory'] == par['inventory'], 'audit-only explanation inventory behavior drift')
req(cand['coverage'] == par['coverage'], 'audit-only remediation coverage drift')

inv = cand['inventory']
for name in ['algorithmPractice','securityPractice','finalAlgorithm','finalSecurity']:
    row = inv[name]
    req(row['total'] > 0, name + ' explanation inventory empty')
    req(row['generalExplain'] == row['total'], name + ' general explanation coverage incomplete')
    req(row['choiceSpecific'] == 0, name + ' unexpectedly has complete choice-specific diagnosis metadata; reassess finding')
req(inv['algorithmPractice']['hint'] == inv['algorithmPractice']['total'], 'algorithm practice hint coverage incomplete')
req(inv['securityPractice']['hint'] == inv['securityPractice']['total'], 'security practice hint coverage incomplete')
req(inv['finalAlgorithm']['total'] == 43, 'final algorithm explanation inventory drift')
req(inv['finalSecurity']['total'] == 15, 'final security explanation inventory drift')

cov = cand['coverage']
req(cov['algorithm'] == 43 and not cov['algoBad'], 'algorithm direct remediation coverage drift')
req(cov['security'] == 15 and not cov['secBad'], 'security remediation coverage drift')

fixture = {
    'name': f'subject-b-wrong-answer-explanation-diagnostic-audit-{version}',
    'version': version,
    'previous': previous,
    'sourceMain': parent,
    'learnerFacingChange': False,
    'inventory': inv,
    'selectionSignature1000': cand['selectionSig'],
    'coverage': cov,
    'finding': {
        'id': 'subject_b_wrong_answer_feedback_not_choice_specific',
        'severity': 'Medium',
        'summary': 'Subject B authored questions provide general correct-path explanations, but no complete option-specific diagnosis metadata for wrong choices in algorithm practice, security practice, or generated final-review items.'
    }
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-wrong-answer-explanation-diagnostic-audit-v229.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2)+'\n')

audit = f'''FE QUEST v229 — Subject B Wrong-Answer Explanation Diagnostic Audit
=============================================================================

Result
------
PASS — MEDIUM FINDING RECORDED
Previous: v228
Source main: {parent}
Learner-facing change in v229: none

What was audited
----------------
The v226-v228 domain-progression sequence is closed, so this audit moved to the next Subject B learning-quality frontier named by v228: whether post-answer feedback helps the learner identify the exact reasoning break, reconstruct the trace, and know what to change on the next attempt.
The audit inventoried authored algorithm prediction steps, security scenario steps, the 43-item algorithm final pool after final-item generation, and the 15 generated security final-review items. It distinguished a general correct-path explanation from structured feedback that can vary according to the learner's selected wrong option.

Explanation coverage proof
--------------------------
Algorithm practice prediction steps: {inv['algorithmPractice']['total']} / general explanations {inv['algorithmPractice']['generalExplain']} / hints {inv['algorithmPractice']['hint']} / complete choice-specific diagnosis {inv['algorithmPractice']['choiceSpecific']}.
Security practice steps: {inv['securityPractice']['total']} / general explanations {inv['securityPractice']['generalExplain']} / hints {inv['securityPractice']['hint']} / complete choice-specific diagnosis {inv['securityPractice']['choiceSpecific']}.
Generated final algorithm review items: {inv['finalAlgorithm']['total']} / general explanations {inv['finalAlgorithm']['generalExplain']} / complete choice-specific diagnosis {inv['finalAlgorithm']['choiceSpecific']}.
Generated final security review items: {inv['finalSecurity']['total']} / general explanations {inv['finalSecurity']['generalExplain']} / complete choice-specific diagnosis {inv['finalSecurity']['choiceSpecific']}.
The authored data therefore has strong general explanation coverage, but the reviewed question objects expose one general explanation rather than a complete explanation/feedback entry for each wrong option.

Medium finding
--------------
subject_b_wrong_answer_feedback_not_choice_specific
The current Subject B feedback can explain the correct route, and v217 still gives a valid next-practice destination, but the authored review metadata does not distinguish why one wrong option was chosen from why another wrong option was chosen. For a learner who selected a distractor because of an off-by-one update, branch-order mistake, stack/queue confusion, or security-control misconception, the app cannot reliably name that exact break from option-specific authored feedback because that layer is absent.
This is a learning-efficiency finding, not a scoring or correctness defect. The correct answer, general explanation, hints, final selection, and direct remediation all remain intact.

Recommended repair boundary
---------------------------
Use v230 for a narrow wrong-answer diagnosis repair. Add structured per-wrong-option feedback to Subject B question data and carry it into post-answer/final-review rendering. Each wrong-choice diagnosis should identify the concrete reasoning break, reconstruct the minimum state/trace needed to see the error, and give one concise next-attempt cue. Reuse the existing prompt/options/correct/explain/hint, domain labels, and remediation destinations rather than creating a parallel curriculum.
Do not change scoring, correct answers, question selection/order, the 100-minute/20-question final contract, the 65% readiness gate, v227 domain concentration thresholds, security routing, or remediation destinations.

Preserved contracts
-------------------
1000 deterministic final-session seeds matched v228 selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, v222 readiness calculation and 65% threshold, v224 compound evidence copy, and v227 domain progression policy are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.
Candidate/reference release validation is handled by the standard release workflow before this audit.

Findings summary
----------------
High: 0
Medium: 1
Low: 0

Decision
--------
The next release should repair the medium finding without broadening curriculum scope. Prioritize exact wrong-choice diagnosis in Subject B post-answer review, then run a post-repair learner-flow audit before moving to another learning-quality frontier.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_WRONG_ANSWER_EXPLANATION_DIAGNOSTIC_AUDIT_v229.txt').write_text(audit)
print(audit)
