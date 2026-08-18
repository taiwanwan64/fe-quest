from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-distractor-quality-repair-(v(\d+))', branch)
    req(m, 'bad Subject B distractor quality repair branch')
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
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x233000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function text(v){return String(v??'').trim();}
function optionsOf(q){return Array.isArray(q?.options)?q.options:(Array.isArray(q?.opts)?q.opts:[]);}
function answerIndex(q){
  if(Number.isInteger(q?.a))return q.a;
  if(Number.isInteger(q?.correctIndex))return q.correctIndex;
  if(Number.isInteger(q?.answerIndex))return q.answerIndex;
  if(typeof q?.correctText==='string')return optionsOf(q).map(text).indexOf(text(q.correctText));
  if(Number.isInteger(q?.correct))return q.correct;
  return Number(q?.a);
}
function family(v){
  const s=text(v);
  if(!s)return 'empty';
  if(/^\[[^\]]*\]$/.test(s))return 'list';
  if(/^\([^()]*,[^()]*\)$/.test(s))return 'tuple';
  if(/^[^=,]+=[^,]+(?:,\s*[^=,]+=[^,]+)+$/.test(s))return 'state';
  if(s.includes('→')&&!s.includes('←'))return 'chain';
  if(s.includes('←')||/^return\b/i.test(s))return 'expression';
  if(/^[01]+₂$/.test(s))return 'bit';
  if(/^-?\d+(?:\.\d+)?$/.test(s))return 'number';
  if(/^(?:true|false)$/i.test(s))return 'boolean';
  if(/^[A-Za-z]$/.test(s))return 'symbol';
  return 'text';
}
function normalized(v){return text(v).replace(/[\s　]/g,'').replace(/[，]/g,',').replace(/[＝]/g,'=');}
const STRUCTURAL=new Set(['number','list','tuple','state','chain','expression','bit','boolean','symbol']);
function plausibility(q){
  const opts=optionsOf(q),a=answerIndex(q),cf=family(opts[a]);
  const wrong=opts.map((o,i)=>({index:i,text:text(o),family:family(o)})).filter(x=>x.index!==a);
  const same=wrong.filter(x=>x.family===cf).length;
  const outliers=wrong.filter(x=>x.family!==cf&&STRUCTURAL.has(cf)&&STRUCTURAL.has(x.family)&&same>=2);
  const seen=new Map(),duplicates=[];
  opts.forEach((o,i)=>{const n=normalized(o);if(seen.has(n))duplicates.push([seen.get(n),i]);else seen.set(n,i);});
  return {correctFamily:cf,outliers,duplicates};
}
function questionRow(layer,id,level,domain,q){const p=plausibility(q);return {layer,id,level:text(level),domain:text(domain),q:text(q?.q),options:optionsOf(q).map(text),a:answerIndex(q),...p};}
function sourceRows(){
  const rows=[];
  for(const ex of B_EXERCISES)(ex.steps||[]).forEach((s,i)=>{if(s.predict)rows.push(questionRow('trace',`${ex.id}:${i}`,ex.level,ex.concept||'',s.predict));});
  for(const set of B_COMPOUND_SETS)(set.qs||[]).forEach((q,i)=>rows.push(questionRow('compound',`${set.id}:${i}`,q.qlevel||set.level,set.title||'',q)));
  for(const sc of SECURITY_SCENARIOS)(sc.steps||[]).forEach((q,i)=>rows.push(questionRow('security',`${sc.id}:${i}`,sc.level,sc.concept||'',q)));
  for(const q of B_EXAM_ALGO_ITEMS)rows.push(questionRow('final-algorithm',q.id,q.level,q.domain,q));
  return rows;
}
function traceFingerprint(){
  const rows=[];
  for(const ex of B_EXERCISES)(ex.steps||[]).forEach((s,i)=>{if(s.predict){const q=s.predict;rows.push({id:`${ex.id}:${i}`,level:ex.level,q:text(q.q),opts:optionsOf(q).map(text),a:answerIndex(q),explain:text(q.explain),hint:text(q.hint)});}});
  return rows;
}
function finalFingerprint(){return B_EXAM_ALGO_ITEMS.map(q=>({id:q.id,domain:q.domain,level:q.level,format:q.format,q:q.q,options:q.options,a:q.a,explain:q.explain}));}
function otherLevelFingerprint(){return {
  trace:B_EXERCISES.map(x=>[x.id,x.level]),
  compound:B_COMPOUND_SETS.map(x=>[x.id,x.level,(x.qs||[]).map(q=>q.qlevel||'')]),
  security:SECURITY_SCENARIOS.map(x=>[x.id,x.level]),
  final:B_EXAM_ALGO_ITEMS.map(x=>[x.id,x.level])
};}
function feedbackCoverage(){
  let questions=0,wrongSlots=0,structured=0,keyed=0,correctBlank=0;const bad=[];
  const inspect=(q,label)=>{questions++;const opts=optionsOf(q),a=answerIndex(q),arr=Array.isArray(q?.wrongFeedback)?q.wrongFeedback:[],map=q?.wrongFeedbackByText||{};for(let i=0;i<opts.length;i++){if(i===a){if(!arr[i])correctBlank++;continue;}wrongSlots++;const f=arr[i];if(f&&typeof f==='object'&&text(f.diagnosis)&&text(f.checkpoint)&&text(f.nextCue))structured++;if(map[text(opts[i])]&&typeof map[text(opts[i])]==='object')keyed++;if(!f||!text(f.diagnosis)||!text(f.checkpoint)||!text(f.nextCue))bad.push(`${label}:${i}`);}};
  for(const ex of B_EXERCISES)(ex.steps||[]).forEach((s,i)=>{if(s.predict)inspect(s.predict,`trace:${ex.id}:${i}`);});
  for(const sc of SECURITY_SCENARIOS)(sc.steps||[]).forEach((q,i)=>inspect(q,`sec:${sc.id}:${i}`));
  for(const q of B_EXAM_ALGO_ITEMS)inspect(q,`final:${q.id}`);
  for(const set of B_COMPOUND_SETS)(set.qs||[]).forEach((q,i)=>inspect(q,`compound:${set.id}:${i}`));
  return {questions,wrongSlots,structured,keyed,correctBlank,bad};
}
function remediation(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
function forcedRandom(first){let n=0;return ()=>{n++;return n===1?first:((n*0.173)%1);};}
function generatedRows(){
  const rows=[];
  for(const ex of B_EXERCISES){
    for(const first of [0.01,0.99]){
      Math.random=forcedRandom(first);const m=bMockCandidateFromExercise(ex);if(m)rows.push(questionRow('algorithm-mini',`${ex.id}:${first}`,ex.level,ex.concept||'',m));
      Math.random=forcedRandom(first);const f=makeFinalAlgoFromTrace(ex);if(f)rows.push(questionRow('trace-final',`${ex.id}:${first}`,ex.level,ex.concept||'',f));
    }
  }
  return rows;
}
function targetSnapshot(){
  const ex=B_EXERCISES.find(x=>x.id==='selection_sort_b');
  const q=ex?.steps?.map(x=>x.predict).filter(Boolean).find(x=>text(x.q)==='最終的なminPosは？');
  const wrongIndex=q?.opts?.map(text).indexOf('0')??-1;
  const fb=wrongIndex>=0&&typeof subjectBChoiceFeedbackV230==='function'?subjectBChoiceFeedbackV230(q,wrongIndex):null;
  const correctFb=q&&typeof subjectBChoiceFeedbackV230==='function'?subjectBChoiceFeedbackV230(q,q.a):null;
  return {level:ex?.level,q:text(q?.q),options:optionsOf(q).map(text),a:answerIndex(q),correct:text(optionsOf(q)[answerIndex(q)]),wrongIndex,fb,correctFb,extra:text(B_MOCK_EXTRA_DISTRACTOR?.selection_sort_b)};
}
const rows=sourceRows(),generated=generatedRows();
console.log('__V233__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,hasSpec:typeof SUBJECT_B_DISTRACTOR_QUALITY_V233_SPEC!=='undefined',spec:globalThis.SUBJECT_B_DISTRACTOR_QUALITY_V233_SPEC||null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,
  high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,domainSpec:globalThis.SUBJECT_B_ALGORITHM_DOMAIN_PROGRESSION_V227_SPEC||null,feedbackSpec:globalThis.SUBJECT_B_WRONG_ANSWER_FEEDBACK_V230_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(1000),remediation:remediation(),target:targetSnapshot(),traceFingerprint:traceFingerprint(),finalFingerprint:finalFingerprint(),levels:otherLevelFingerprint(),feedback:feedbackCoverage(),
  sourceAudit:{questions:rows.length,outliers:rows.filter(x=>x.outliers.length),duplicates:rows.filter(x=>x.duplicates.length)},
  generatedAudit:{questions:generated.length,outliers:generated.filter(x=>x.outliers.length),duplicates:generated.filter(x=>x.duplicates.length),selectionSort:generated.filter(x=>x.id.startsWith('selection_sort_b:')).map(x=>({layer:x.layer,options:x.options,a:x.a,correctFamily:x.correctFamily}))},
  generatorContract:{allPredWidth4:B_EXERCISES.every(ex=>(ex.steps||[]).filter(s=>s.predict).every(s=>optionsOf(s.predict).length===4)),extraAppendThenSlice:String(makeFinalAlgoFromTrace).includes('base.push(extra)')&&String(makeFinalAlgoFromTrace).includes('base.slice(0,4)')}
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'rt.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-6000:])
        m = re.search(r'__V233__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req(version == 'v233' and previous == 'v232', 'v233 distractor repair expects v232 parent')
source = Path('audits/SUBJECT_B_DISTRACTOR_DIFFICULTY_CALIBRATION_AUDIT_v232.txt')
req(source.exists(), 'v232 distractor calibration audit missing')
st = source.read_text()
req('PASS — MEDIUM FINDING RECORDED' in st and 'subject_b_distractor_structural_mismatch' in st, 'v232 finding evidence drift')

manifest = json.loads(Path('_release/content-change-v233.json').read_text())
req(manifest['parent_main_sha'] == parent and manifest['source_quality_audit'] == str(source), 'v233 manifest parent/source drift')
req(manifest['source_priority_tier'] == 'medium' and manifest['quality_audit_marker'] == 'subject_b_distractor_structural_mismatch', 'v233 manifest finding drift')
req(manifest['allowed_question_ids'] == ['selection_sort_b'], 'v233 allowed question scope drift')
req(manifest['content_files'] == ['app/subject-b-distractor-quality-overrides-v233.txt'] and manifest['assembly_files'] == ['index.html'], 'v233 approved file scope drift')

expected = {
    '.github/subject-b-distractor-quality-repair/validate_repair.py',
    '.github/workflows/subject-b-distractor-quality-repair.yml',
    '_release/content-change-v233.json',
    'app/subject-b-distractor-quality-overrides-v233.txt',
    'index.html',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v233 repair source drift: ' + repr(sorted(changed ^ expected)))
for path in [
    'app/base-stable.html','app/subject-b-security-overrides-v200.txt','app/subject-b-algorithm-overrides-v202.txt','app/subject-b-session-overrides-v205.txt',
    'app/subject-b-final-overrides-v208.txt','app/subject-b-final-pool-overrides-v211.txt','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt',
    'app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt','app/subject-b-readiness-copy-overrides-v224.txt','app/subject-b-algorithm-domain-progression-overrides-v227.txt',
    'app/subject-b-wrong-answer-feedback-overrides-v230.txt'
]:
    req(Path(path).read_bytes() == subprocess.check_output(['git','show',parent+':'+path]), 'preserved learner-facing source drift: ' + path)

cand = runtime('_site/index.html')
par = runtime('_site_parent/index.html')
req(cand['v'] == version and par['v'] == previous, 'runtime versions')
req(cand['hasSpec'] is True and par['hasSpec'] is False, 'v233 repair presence boundary')
req(cand['counts'] == par['counts'] == [20,16,4], 'final counts drift')
req(cand['seconds'] == par['seconds'] == 6000, 'time limit drift')
req(cand['pool'] == par['pool'] == 43, 'algorithm pool drift')
req(cand['high'] == par['high'] and len(cand['high']) == 15 and cand['floor'] == par['floor'] == 4, 'high-trace contract drift')
for key,label in [('orderSpec','v214 order'),('recoverySpec','v217 recovery'),('xpSpec','v219 XP'),('readinessSpec','v222 readiness'),('copySpec','v224 copy'),('domainSpec','v227 domain progression'),('feedbackSpec','v230 feedback')]:
    req(cand[key] == par[key], label + ' spec drift')
req(cand['selectionSig'] == par['selectionSig'], '1000-seed final selection/order drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic validation failed')
req(cand['remediation'] == par['remediation'], 'remediation coverage changed')
req(cand['remediation']['algorithm'] == 43 and not cand['remediation']['algoBad'], 'algorithm remediation coverage drift')
req(cand['remediation']['security'] == 15 and not cand['remediation']['secBad'], 'security remediation coverage drift')
req(cand['finalFingerprint'] == par['finalFingerprint'], 'final algorithm source content changed')
req(cand['levels'] == par['levels'], 'difficulty labels changed')

ct, pt = cand['target'], par['target']
req(pt['options'] == ['1','2','3','[1,5,2,4]'] and pt['correct'] == '3' and pt['a'] == 2, 'v232 target baseline drift')
req(ct['options'] == ['1','2','3','0'] and ct['correct'] == '3' and ct['a'] == 2, 'v233 target distractor not repaired')
req(ct['q'] == pt['q'] == '最終的なminPosは？' and ct['level'] == pt['level'] == '標準', 'target prompt/level drift')
req(ct['extra'] == '0' and pt['extra'] == '[1,5,2,4]', 'same-question extra fallback not aligned')
req(ct['wrongIndex'] == 3 and isinstance(ct['fb'], dict), 'v230 feedback missing for repaired distractor')
req('「0」' in ct['fb'].get('diagnosis','') and 'minPos' in ct['fb'].get('diagnosis',''), 'repaired distractor diagnosis is not choice-specific')
req(ct['fb'].get('checkpoint') and ct['fb'].get('nextCue') and ct['correctFb'] is None, 'v230 three-part/correct-answer feedback contract drift')

# Exactly one authored TRACE option changes; prompt, answer, explanation and hint stay byte-equivalent at the runtime data level.
pa = {x['id']:x for x in par['traceFingerprint']}; ca = {x['id']:x for x in cand['traceFingerprint']}
req(pa.keys() == ca.keys(), 'TRACE inventory changed')
diffs = []
for k in pa:
    if pa[k] != ca[k]: diffs.append(k)
req(len(diffs) == 1, 'unexpected TRACE content changes: ' + repr(diffs))
k = diffs[0]
req(k.startswith('selection_sort_b:'), 'non-target TRACE changed: ' + k)
p, c = pa[k], ca[k]
for field in ['level','q','a','explain','hint']:
    req(p[field] == c[field], 'target non-option field changed: ' + field)
req(p['opts'] == ['1','2','3','[1,5,2,4]'] and c['opts'] == ['1','2','3','0'], 'target option delta drift')

req(len(par['sourceAudit']['outliers']) == 1 and par['sourceAudit']['outliers'][0]['id'].startswith('selection_sort_b:'), 'improved v232 baseline should isolate one genuine learner-visible structural mismatch')
req(cand['sourceAudit']['questions'] == par['sourceAudit']['questions'] == 173, 'source audit inventory drift')
req(not cand['sourceAudit']['outliers'] and not cand['sourceAudit']['duplicates'], 'learner-visible source structural mismatch remains')
req(not cand['generatedAudit']['outliers'] and not cand['generatedAudit']['duplicates'], 'learner-visible generated structural mismatch remains')
req(cand['generatorContract']['allPredWidth4'] is True and cand['generatorContract']['extraAppendThenSlice'] is True, 'generated-extra reachability contract drift')
req(cand['generatedAudit']['selectionSort'], 'selection_sort generated probes missing')
for row in cand['generatedAudit']['selectionSort']:
    req(row['correctFamily'] == 'number' and all(re.fullmatch(r'-?\d+(?:\.\d+)?', x) for x in row['options']), 'selection_sort generated answer-form mismatch remains')

fb = cand['feedback']
req(fb['questions'] == 173 and fb['wrongSlots'] == 519, 'v230 source feedback inventory drift')
req(fb['structured'] == fb['keyed'] == 519 and fb['correctBlank'] == 173 and not fb['bad'], 'v230 feedback coverage regressed')

spec = cand['spec'] or {}
req(spec.get('findingResolved') == 'subject_b_distractor_structural_mismatch', 'v233 finding marker missing')
req(spec.get('targetExercise') == 'selection_sort_b' and spec.get('oldDistractor') == '[1,5,2,4]' and spec.get('newDistractor') == '0', 'v233 target spec drift')
for flag in ['correctAnswerChanged','promptChanged','difficultyLabelChanged','scoringChanged','questionSelectionChanged','questionOrderChanged','timingChanged','readinessThresholdChanged','remediationTargetsChanged']:
    req(spec.get(flag) is False, 'unexpected v233 contract change: ' + flag)
req(spec.get('v230FeedbackPreserved') is True, 'v230 feedback preservation marker missing')

fixture = {
    'name':'subject-b-distractor-quality-repair-v233','version':version,'previous':previous,'sourceMain':parent,'learnerFacingChange':True,
    'findingResolved':'subject_b_distractor_structural_mismatch','target':ct,'sourceQuestionsAudited':cand['sourceAudit']['questions'],
    'sourceOutliersAfter':cand['sourceAudit']['outliers'],'generatedQuestionsProbed':cand['generatedAudit']['questions'],'generatedOutliersAfter':cand['generatedAudit']['outliers'],
    'v230FeedbackCoverage':fb,'selectionSignature1000':cand['selectionSig'],'remediation':cand['remediation'],'generatorContract':cand['generatorContract'],
    'difficultyLabelsChanged':False,'lowFindingDisposition':'No label changes in v233; v232 structural-burden proxy is advisory and conceptual difficulty remains separately relevant.'
}
Path('_regression/subject-b-distractor-quality-repair-v233.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')
Path('audits/SUBJECT_B_DISTRACTOR_QUALITY_REPAIR_v233.txt').write_text(f'''FE QUEST v233 — Subject B Distractor Quality Repair\n==============================================================\n\nResult\n------\nPASS — v232 learner-visible structural distractor finding repaired\nPrevious: v232\nSource main: {parent}\nLearner-facing change in v233: yes, one wrong option only\n\nRepair\n------\nThe genuine learner-visible v232 mismatch was selection_sort_b / 「最終的なminPosは？」.\nOld wrong choice: [1,5,2,4] (array-shaped and rejectable by answer form)\nNew wrong choice: 0 (same numeric answer form; represents leaving minPos at its initial value)\nCorrect answer remains 3; correct index remains 2; prompt, explanation, hint and difficulty label remain unchanged.\nThe v230 wrong-choice feedback for 0 explicitly diagnoses the stale-initial-minPos mistake and retains diagnosis / checkpoint / nextCue.\n\nAudit refinement\n----------------\nThe v232 queue_service flag was a classifier false positive: identifier 101 is a decimal-style queue/customer ID in that question, not a binary bit string.\nThe seven B_MOCK_EXTRA_DISTRACTOR configuration flags were not learner-visible under the current generator: every prediction already has four authored options, the extra is appended after those, and final trace generation slices the first four. The selection_sort_b fallback was nevertheless aligned to 0 so a future generator-width change cannot revive that mismatch.\nWith the refined numeric-ID classification, the v232 baseline contains exactly one genuine learner-visible source mismatch, and v233 removes it.\n\nCoverage\n--------\nLearner-visible source questions audited: {cand['sourceAudit']['questions']}\nLearner-visible source structural outliers after repair: 0\nGenerated algorithm mini/final trace probes: {cand['generatedAudit']['questions']}\nGenerated structural outliers after repair: 0\nNormalized duplicate option sets after repair: 0\nv230 structured wrong-answer feedback: {fb['structured']} / {fb['wrongSlots']} wrong slots\n\nPreserved contracts\n-------------------\n1000 deterministic final-session seeds match v232 selection/order.\n100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.\nv214 order, v217 recovery, v219 XP, v222 readiness/65% threshold, v224 copy, v227 domain progression and v230 choice-specific feedback remain unchanged.\nAlgorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.\nDifficulty labels are unchanged; the v232 Low structural-separation finding remains advisory rather than being converted into label changes without stronger evidence.\nSubject B semantic validation: OK.\n\nDecision\n--------\nUse v234 for a post-repair learner-flow/regression audit: confirm the new numeric distractor appears naturally in TRACE / mini-mock / trace-derived final paths, choice-specific feedback follows the selected option through shuffling, and no answer-form shortcut remains.\n''')
print('FEQUEST_V233_SUBJECT_B_DISTRACTOR_QUALITY_REPAIR_OK')
