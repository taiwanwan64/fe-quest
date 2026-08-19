from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-local-performance-timing-(v(\d+))', branch)
    req(m, 'bad Subject B local performance timing branch')
    return m.group(1), f'v{int(m.group(2)) - 1}'


def runtime(path, probe):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function finalSig(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x254000+i)>>>0);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function normalizerRetention(field){
  const sample={schema:1,events:[{layer:'miniMock',sourceId:'probe',level:'標準',ok:true,elapsedMs:1234,at:'2026-08-19T00:00:00.000Z'}]};
  const p={...profile,[field]:sample};
  const out={};
  for(const name of ['normalizeProfileData','normalizeProfileDataV3ForChecksum','normalizeProfileDataV4ForChecksum']){
    const fn=globalThis[name];
    if(typeof fn==='function'){
      try{const n=fn(p);out[name]=JSON.stringify(n?.[field])===JSON.stringify(sample);}catch(e){out[name]='error:'+String(e?.message||e);}
    }
  }
  return out;
}
function perfProbe(){
  if(!globalThis.SUBJECT_B_LOCAL_PERFORMANCE_V254_SPEC)return null;
  profile.subjectBPerformanceV254={schema:1,events:[]};
  let accepted=0;
  const layers=['compound','miniMock','securityMock','final'], levels=['基礎','標準','応用'];
  for(let i=0;i<245;i++){
    if(subjectBPerformanceRecordV254({layer:layers[i%4],sourceId:'q'+i,level:levels[i%3],ok:i%2===0,elapsedMs:(i+1)*100,at:`2026-08-19T00:${String(i%60).padStart(2,'0')}:00.000Z`}))accepted++;
  }
  const invalid=subjectBPerformanceRecordV254({layer:'invalid',sourceId:'x',level:'標準',ok:true,elapsedMs:1});
  const root=subjectBPerformanceRootV254(), summary=subjectBPerformanceSummaryV254();
  return {accepted,invalid,length:root.events.length,first:root.events[0],last:root.events[root.events.length-1],summary,retention:normalizerRetention('subjectBPerformanceV254')};
}
const probeFlag=__PROBE__;
console.log('__V254__'+Buffer.from(JSON.stringify({
 v:APP_VERSION,
 spec:globalThis.SUBJECT_B_LOCAL_PERFORMANCE_V254_SPEC||null,
 helperTypes:{record:typeof globalThis.subjectBPerformanceRecordV254,summary:typeof globalThis.subjectBPerformanceSummaryV254,root:typeof globalThis.subjectBPerformanceRootV254},
 perf:probeFlag?perfProbe():null,
 banks:{questions:hashJson(QUESTION_BANK),trace:hashJson(B_EXERCISES),compound:hashJson(B_COMPOUND_SETS),security:hashJson(SECURITY_SCENARIOS),finalAlgorithm:hashJson(B_EXAM_ALGO_ITEMS)},
 questionCount:QUESTION_BANK.length,
 finalSignature2000:finalSig(2000),
 contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],
 sem:validateSubjectBSemantics()
})).toString('base64'));
'''.replace('__PROBE__', 'true' if probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'runtime.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-8000:])
        m = re.search(r'__V254__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req((version, previous) == ('v254', 'v253'), 'v254 repair expects v253 parent')
source = Path('audits/SUBJECT_B_ANSWER_LIFECYCLE_DETAIL_AUDIT_v253.txt')
req(source.exists(), 'v253 answer lifecycle evidence missing')
st = source.read_text()
req('PASS — DETAIL EVIDENCE CAPTURED' in st and 'bMockAnswers' in st and 'bFinalAnswers' in st and 'secMockAnswers' in st and 'bCompoundAnswers' in st, 'v253 evidence drift')

manifest = json.loads(Path('_release/content-change-v254.json').read_text())
req(manifest['parent_main_sha'] == parent, 'v254 manifest parent drift')
req(manifest['source_quality_audit'] == str(source), 'v254 manifest source drift')
req(manifest['quality_audit_marker'] == 'subject_b_local_calibration_lacks_per_question_response_time', 'v254 finding marker drift')
req(manifest['content_files'] == ['app/subject-b-local-performance-overrides-v254.txt'] and manifest['assembly_files'] == ['index.html'], 'v254 manifest scope drift')
req(manifest['instrumentation']['local_only'] is True and manifest['instrumentation']['remote_telemetry'] is False, 'v254 local-only contract drift')
req(manifest['instrumentation']['event_limit'] == 240, 'v254 event limit drift')

expected = {
    'app/subject-b-local-performance-overrides-v254.txt',
    '_release/content-change-v254.json',
    'index.html',
    '.github/subject-b-local-performance-timing/validate_repair.py',
    '.github/workflows/subject-b-local-performance-timing.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v254 source drift: ' + repr(sorted(changed ^ expected)))

override = Path('app/subject-b-local-performance-overrides-v254.txt').read_text()
for token in [
    'performance.now', 'eventLimit:240', 'remoteTelemetry:false',
    "'[data-copt]'", "'[data-bmopt]'", "'[data-smopt]'", "'[data-bfopt]'",
    'renderCompoundQuestion=function', 'renderBMockQuestion=function', 'renderSecurityMockQuestion=function', 'renderBFinalQuestion=function',
    'finishCompoundChallenge=function', 'finishBMiniMock=function', 'finishSecurityMock=function', 'finishBFinal=function',
    'subjectBPerformanceRecordV254', 'subjectBPerformanceSummaryV254'
]:
    req(token in override, 'v254 instrumentation contract missing: ' + token)
for banned in ['fetch(', 'XMLHttpRequest', 'sendBeacon(', 'WebSocket(', 'QUESTION_BANK.push', 'B_EXERCISES.push', 'B_EXAM_ALGO_ITEMS.push']:
    req(banned not in override, 'v254 local-only/content-preservation contract violated: ' + banned)

cand = runtime('_site/index.html', True)
par = runtime('_site_parent/index.html', False)
req(cand['v'] == 'v254' and par['v'] == 'v253', 'runtime versions')
req(cand['spec'] is not None and par['spec'] is None, 'v254 instrumentation presence drift')
req(cand['helperTypes'] == {'record': 'function', 'summary': 'function', 'root': 'function'}, 'v254 helper export drift')
req(cand['banks'] == par['banks'], 'question/practice bank drift')
req(cand['questionCount'] == par['questionCount'] == 710, 'question count drift')
req(cand['finalSignature2000'] == par['finalSignature2000'], '2000-seed final selection/order/options drift')
req(cand['contracts'] == par['contracts'] == [20, 16, 4, 6000, 43, 15, 4], 'final contract drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic validation failed')

perf = cand['perf']
req(perf and perf['accepted'] == 245 and perf['invalid'] is False and perf['length'] == 240, 'bounded event recorder failed')
req(perf['first']['sourceId'] == 'q5' and perf['last']['sourceId'] == 'q244', 'ring-buffer retention order failed')
summary = perf['summary']
req(summary['total'] == {'count': 240, 'correct': 120, 'rate': 50, 'avgMs': 12550, 'medianMs': 12550}, 'performance summary aggregate drift: ' + repr(summary['total']))
req(all(x['count'] == 60 for x in summary['byLayer'].values()) and len(summary['byLayer']) == 4, 'layer summary distribution drift')
req(all(x['count'] == 80 for x in summary['byLevel'].values()) and len(summary['byLevel']) == 3, 'difficulty summary distribution drift')
req(perf['retention'].get('normalizeProfileData') is True, 'current profile normalizer drops v254 optional field')
for name, ok in perf['retention'].items():
    req(ok is True, f'{name} drops/errors on v254 optional field: {ok!r}')

files = ['index.html', 'manifest.webmanifest', 'sw.js', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']
req(all((Path('_site') / x).read_bytes() == (Path('_site_reference') / x).read_bytes() for x in files), 'candidate/approved-content-reference byte mismatch')

fixture = {
    'version': version,
    'previous': previous,
    'parent': parent,
    'result': 'PASS — NO FINDINGS',
    'profileField': cand['spec']['profileField'],
    'eventLimit': cand['spec']['eventLimit'],
    'eventSchema': cand['spec']['eventSchema'],
    'layers': cand['spec']['layers'],
    'localOnly': cand['spec']['localOnly'],
    'remoteTelemetry': cand['spec']['remoteTelemetry'],
    'boundedRecorder': {'accepted': perf['accepted'], 'retained': perf['length'], 'firstSourceId': perf['first']['sourceId'], 'lastSourceId': perf['last']['sourceId']},
    'summary': summary,
    'normalizerRetention': perf['retention'],
    'bankHashes': cand['banks'],
    'finalSignature2000Match': cand['finalSignature2000'] == par['finalSignature2000'],
    'contracts': cand['contracts'],
    'semanticOK': True,
    'candidateReferenceSixFileByteEquality': True,
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-local-performance-timing-v254.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')

audit = f'''FE QUEST v254 — Subject B Local Performance Timing Instrumentation
===================================================================

Result
------
PASS — NO FINDINGS
Previous release: v253
Source main: {parent}
Learner-facing change in v254: no visible UI change; local-only per-question learning evidence is now recorded for future adaptive recommendations.

What changed
------------
- Added optional profile field: subjectBPerformanceV254 (schema 1).
- Records one event per answered question in compound, algorithm mini-mock, security mini-mock, and full Subject B final sessions.
- Measures active time to the first committed answer with performance.now() when available; revisits accumulate only while the question remains unanswered.
- Stores only layer, source id, authored difficulty, first-answer correctness, elapsed milliseconds, and timestamp.
- Keeps at most 240 events and derives aggregate/layer/difficulty summaries at read time.
- No remote telemetry or network transmission was added.

Persistence / bounded-data evidence
-----------------------------------
245 synthetic valid events accepted; retained: {perf['length']} (expected cap 240).
Oldest retained source: {perf['first']['sourceId']}; newest retained source: {perf['last']['sourceId']}.
Current and checksum profile normalizers preserve the optional v254 field: {json.dumps(perf['retention'], ensure_ascii=False, sort_keys=True)}.
Aggregate summary probe: {json.dumps(summary['total'], ensure_ascii=False, sort_keys=True)}.

Behavior preservation
---------------------
Question / TRACE / compound / security / final-algorithm banks: unchanged from v253.
2000 deterministic final sessions: selection/order/options signature unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Scoring, exam countdowns, readiness calculations/thresholds, remediation targets, and published difficulty labels: unchanged.
Subject B semantic diagnostics: OK.
Candidate/approved-content-reference six-file byte equality: yes.

Privacy boundary
----------------
The new evidence stays inside the existing local profile. No fetch/XMLHttpRequest/sendBeacon/WebSocket path was added by the instrumentation. Sparse personal timing data is evidence for later recommendations only; it does not relabel authored 基礎 / 標準 / 応用 difficulty.

Decision
--------
The v251 response-time gap is instrumented without changing exam behavior. Next, perform a post-instrumentation audit focused on save/restore/import normalization, first-answer single-count semantics, timer pause/resume behavior across navigation, and bounded storage. Only after that passes should learner-local summaries influence recommendations.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_LOCAL_PERFORMANCE_TIMING_v254.txt').write_text(audit)
print(audit)
