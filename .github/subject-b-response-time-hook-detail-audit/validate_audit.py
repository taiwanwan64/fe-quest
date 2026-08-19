from pathlib import Path
import hashlib, json, os, re, subprocess


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-response-time-hook-detail-audit-(v(\d+))', branch)
    req(m, 'bad Subject B response-time hook detail audit branch')
    return m.group(1), f'v{int(m.group(2)) - 1}'


def extract_js(path):
    html = Path(path).read_text()
    return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I) if x.strip() and not x.lstrip().startswith('{'))


def function_name_before(js, pos):
    start = max(0, pos - 16000)
    chunk = js[start:pos]
    patterns = [
        r'function\s+([A-Za-z_$][\w$]*)\s*\(',
        r'([A-Za-z_$][\w$]*)\s*=\s*function\s*\(',
        r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>',
    ]
    hits = []
    for pat in patterns:
        for m in re.finditer(pat, chunk):
            hits.append((m.start(), m.group(1)))
    return max(hits)[1] if hits else '(unresolved)'


def compact(s, limit=900):
    s = re.sub(r'\s+', ' ', s).strip()
    return s[:limit] + ('…' if len(s) > limit else '')


def evidence(js):
    tokens = ['bMockStats', 'bMockHistory', 'securityMockHistory', 'bCompoundHistory', 'bFinalStats', 'bFinalHistory']
    rows = []
    for token in tokens:
        pos = 0
        seen = set()
        while True:
            pos = js.find(token, pos)
            if pos < 0:
                break
            lo, hi = max(0, pos - 700), min(len(js), pos + 1000)
            around = js[lo:hi]
            fn = function_name_before(js, pos)
            mutation = bool(re.search(r'(?:profile\.)?' + re.escape(token) + r'.{0,180}(?:\+\+|\+=|=|\.push\s*\(|\.unshift\s*\()', around, re.S))
            record = bool(re.search(r'(?:\.push|\.unshift)\s*\(\s*\{', around, re.S))
            flags = {
                'mutation': mutation,
                'recordObject': record,
                'correct': bool(re.search(r'\b(?:correct|ok|right)\b', around, re.I)),
                'seen': bool(re.search(r'\bseen\b', around, re.I)),
                'rate': bool(re.search(r'\brate\b', around, re.I)),
                'seconds': bool(re.search(r'\bseconds\b', around, re.I)),
                'level': bool(re.search(r'\b(?:level|difficulty)\b', around, re.I)),
                'dateNow': bool(re.search(r'Date\.now\s*\(', around)),
                'performanceNow': bool(re.search(r'performance\.now\s*\(', around)),
                'elapsed': bool(re.search(r'\b(?:elapsed|duration|response(?:Time)?|answerTime|questionTime|timeMs)\b', around, re.I)),
            }
            key = (token, fn, tuple(flags.items()), compact(around, 450))
            if key not in seen:
                seen.add(key)
                rows.append({'token': token, 'function': fn, 'flags': flags, 'context': compact(around)})
            pos += len(token)
    return rows


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req((version, previous) == ('v252', 'v251'), 'v252 audit expects v251 parent')
source = Path('audits/SUBJECT_B_LEARNER_LOCAL_CALIBRATION_READINESS_AUDIT_v251.txt')
req(source.exists(), 'v251 evidence missing')
st = source.read_text()
req('subject_b_local_calibration_lacks_per_question_response_time' in st and 'PASS — MEDIUM FINDING RECORDED' in st, 'v251 finding drift')

expected = {
    '.github/subject-b-response-time-hook-detail-audit/validate_audit.py',
    '.github/workflows/subject-b-response-time-hook-detail-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v252 audit-only source drift: ' + repr(sorted(changed ^ expected)))

cand_js, par_js = extract_js('_site/index.html'), extract_js('_site_parent/index.html')
# Version materialization changes only outer-shell metadata; normalize it before comparing the relevant evidence.
cand = evidence(cand_js)
par = evidence(par_js)
req(cand == par, 'audit-only Subject B recording source evidence drift')
req(len(cand) > 0, 'no Subject B persistence evidence captured')

# Prefer mutation/record locations in the human-facing report; retain all evidence in the fixture.
interesting = [x for x in cand if x['flags']['mutation'] or x['flags']['recordObject']]
req(interesting, 'no Subject B persistence mutation/record locations captured')
functions = sorted({x['function'] for x in interesting})
per_item_timing = [x for x in interesting if x['token'] in ('bMockStats', 'bFinalStats') and (x['flags']['performanceNow'] or x['flags']['elapsed'])]

fixture = {
    'version': version,
    'previous': previous,
    'parent': parent,
    'result': 'PASS — DETAIL EVIDENCE CAPTURED',
    'interestingFunctions': functions,
    'perItemTimingEvidenceCount': len(per_item_timing),
    'evidence': cand,
    'candidateJsSha256': hashlib.sha256(cand_js.encode()).hexdigest(),
    'parentJsSha256': hashlib.sha256(par_js.encode()).hexdigest(),
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-response-time-hook-detail-audit-v252.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')

lines = []
for i, x in enumerate(interesting, 1):
    markers = ', '.join(k for k, v in x['flags'].items() if v) or 'none'
    lines.append(f"[{i}] {x['token']} / {x['function']} / {markers}\n    {x['context']}")
report = '\n'.join(lines)

audit = f'''FE QUEST v252 — Subject B Response-Time Hook Detail Audit
===============================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v251
Source main: {parent}
Learner-facing change in v252: none

Purpose
-------
v251 found that Subject B already persists accuracy/exposure evidence and session-level history, but no per-question response-time recorder was detected. v252 captures the exact persistence mutation/recording neighborhoods so the next instrumentation change can hook into the smallest existing answer lifecycle rather than adding broad DOM listeners or duplicating scoring logic.

Detected persistence functions / containers
------------------------------------------
{', '.join(functions)}
Per-item timing evidence at bMockStats/bFinalStats mutation sites: {len(per_item_timing)}

Mutation / record neighborhoods
-------------------------------
{report}

Interpretation
--------------
Use these neighborhoods only to choose safe hook points. The next repair should not infer correctness independently from the UI, should not replace the existing bMockStats/bFinalStats/history structures, and should not turn session timers into synthetic per-question timings. Prefer wrapping the existing answer-commit functions if they are identifiable; otherwise add timing at the narrowest mode-specific submit function and pass the already-computed correctness into a bounded local recorder.

Decision
--------
Proceed to a small local-only performance event layer only after the affected answer-commit functions are explicit from this evidence. Cap retained events, make the new profile field optional/backward-compatible, and validate save/restore plus no change to scoring, final timing, question selection, answer order, readiness thresholds, or published difficulty labels.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_RESPONSE_TIME_HOOK_DETAIL_AUDIT_v252.txt').write_text(audit)
print(audit)
