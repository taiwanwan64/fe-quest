from pathlib import Path
import hashlib, json, os, re, subprocess


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip()
    m = re.fullmatch(r'subject-b-answer-lifecycle-detail-audit-(v(\d+))', branch)
    req(m, 'bad Subject B answer lifecycle detail audit branch')
    return m.group(1), f'v{int(m.group(2)) - 1}'


def extract_js(path):
    html = Path(path).read_text()
    return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I) if x.strip() and not x.lstrip().startswith('{'))


def function_name_before(js, pos):
    start = max(0, pos - 18000)
    chunk = js[start:pos]
    pats = [
        r'function\s+([A-Za-z_$][\w$]*)\s*\(',
        r'([A-Za-z_$][\w$]*)\s*=\s*function\s*\(',
        r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>',
    ]
    hits = []
    for pat in pats:
        hits.extend((m.start(), m.group(1)) for m in re.finditer(pat, chunk))
    return max(hits)[1] if hits else '(unresolved)'


def compact(s, limit=1100):
    s = re.sub(r'\s+', ' ', s).strip()
    return s[:limit] + ('…' if len(s) > limit else '')


def evidence(js):
    rows = []
    patterns = [
        ('answer-array-write', re.compile(r'([A-Za-z_$][\w$]*(?:Answers|Answer))\s*\[[^\]]+\]\s*=')),
        ('answer-object-write', re.compile(r'([A-Za-z_$][\w$]*)\.answers\s*\[[^\]]+\]\s*=')),
        ('answer-array-init', re.compile(r'([A-Za-z_$][\w$]*(?:Answers|Answer))\s*=\s*(?:Array\s*\(|\[[^;]*\])')),
    ]
    seen = set()
    for kind, pat in patterns:
        for m in pat.finditer(js):
            name = m.group(1)
            if not re.search(r'(?:^|_)(?:b|security|compound|final|mock)', name, re.I) and not re.search(r'(?:B|Security|Compound|Final|Mock)', name):
                continue
            pos = m.start()
            around = js[max(0, pos - 900):min(len(js), pos + 1500)]
            fn = function_name_before(js, pos)
            flags = {
                'dateNow': bool(re.search(r'Date\.now\s*\(', around)),
                'performanceNow': bool(re.search(r'performance\.now\s*\(', around)),
                'correctnessCompare': bool(re.search(r'(?:===|!==)\s*(?:item\.)?a\b|\bok\s*=', around)),
                'renderCall': bool(re.search(r'\brender[A-Za-z_$][\w$]*\s*\(', around)),
                'indexMutation': bool(re.search(r'(?:Index|index)\s*(?:\+\+|--|=)', around)),
                'saveProfile': 'saveProfile(' in around,
            }
            key = (kind, name, fn, compact(around, 500))
            if key in seen:
                continue
            seen.add(key)
            rows.append({'kind': kind, 'state': name, 'function': fn, 'flags': flags, 'context': compact(around)})
    return rows


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req((version, previous) == ('v253', 'v252'), 'v253 audit expects v252 parent')
source = Path('audits/SUBJECT_B_RESPONSE_TIME_HOOK_DETAIL_AUDIT_v252.txt')
req(source.exists(), 'v252 detail evidence missing')
st = source.read_text()
req('PASS — DETAIL EVIDENCE CAPTURED' in st and 'Per-item timing evidence at bMockStats/bFinalStats mutation sites: 0' in st, 'v252 handoff drift')

expected = {
    '.github/subject-b-answer-lifecycle-detail-audit/validate_audit.py',
    '.github/workflows/subject-b-answer-lifecycle-detail-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v253 audit-only source drift: ' + repr(sorted(changed ^ expected)))

cand_js, par_js = extract_js('_site/index.html'), extract_js('_site_parent/index.html')
cand, par = evidence(cand_js), evidence(par_js)
req(cand == par, 'audit-only answer lifecycle evidence drift')
req(cand, 'no Subject B answer lifecycle evidence captured')

writes = [x for x in cand if x['kind'] in ('answer-array-write', 'answer-object-write')]
req(writes, 'no Subject B answer writes captured')
states = sorted({x['state'] for x in writes})
functions = sorted({x['function'] for x in writes})

fixture = {
    'version': version,
    'previous': previous,
    'parent': parent,
    'result': 'PASS — DETAIL EVIDENCE CAPTURED',
    'answerStates': states,
    'writeFunctions': functions,
    'writes': writes,
    'allEvidence': cand,
    'candidateJsSha256': hashlib.sha256(cand_js.encode()).hexdigest(),
    'parentJsSha256': hashlib.sha256(par_js.encode()).hexdigest(),
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-answer-lifecycle-detail-audit-v253.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')

lines = []
for i, x in enumerate(writes, 1):
    flags = ', '.join(k for k, v in x['flags'].items() if v) or 'none'
    lines.append(f"[{i}] {x['state']} / {x['function']} / {flags}\n    {x['context']}")
report = '\n'.join(lines)

audit = f'''FE QUEST v253 — Subject B Answer Lifecycle Detail Audit
===========================================================

Result
------
PASS — DETAIL EVIDENCE CAPTURED
Previous release: v252
Source main: {parent}
Learner-facing change in v253: none

Purpose
-------
v252 identified the persistence finish functions but confirmed they only know whole-session time. v253 locates the actual Subject B answer-state writes so per-question timing can start on question render and stop on the existing answer commit, without reimplementing correctness or attaching broad document-level click listeners.

Answer state arrays / objects detected
-------------------------------------
{', '.join(states)}

Write containers detected
-------------------------
{', '.join(functions)}

Answer-write neighborhoods
--------------------------
{report}

Decision
--------
For instrumentation, prefer the smallest mode-specific wrapper around these existing answer writes and their paired render functions. Start a monotonic timer when the current question becomes active; on the first committed answer for that question, store one bounded local event using the already-authored item id/level and the existing selected answer. Do not double-count answer changes, do not derive correctness from button text, and do not affect the exam countdown. If a mode writes answers only through inline callbacks rather than a stable function, use a mode-local render wrapper to bind timing metadata to the current item instead of a global click listener.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_ANSWER_LIFECYCLE_DETAIL_AUDIT_v253.txt').write_text(audit)
print(audit)
