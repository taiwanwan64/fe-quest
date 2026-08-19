from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(
        ['git', 'branch', '--show-current'], text=True
    ).strip()
    m = re.fullmatch(r'subject-b-learner-local-calibration-readiness-audit-(v(\d+))', branch)
    req(m, 'bad Subject B learner-local calibration readiness audit branch')
    return m.group(1), f'v{int(m.group(2)) - 1}'


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function tx(v){return String(v??'').trim();}
const profileTokens=['bMockStats','bMockHistory','securityMockHistory','bCompoundHistory','bFinalStats','bFinalHistory','securityStats'];
const globals=Object.getOwnPropertyNames(globalThis).filter(k=>typeof globalThis[k]==='function');
const relevantFunctions=[];
for(const name of globals){
  let src='';try{src=String(globalThis[name]);}catch(e){continue;}
  const tokens=profileTokens.filter(t=>src.includes(t));
  if(!tokens.length)continue;
  relevantFunctions.push({
    name,tokens,
    flags:{
      correct:/\b(?:correct|ok|right)\b/i.test(src),
      rate:/\brate\b/i.test(src),
      seen:/\bseen\b/i.test(src),
      level:/\b(?:level|difficulty)\b/i.test(src),
      seconds:/\bseconds\b/i.test(src),
      dateNow:/Date\.now\s*\(/.test(src),
      performanceNow:/performance\.now\s*\(/.test(src),
      elapsed:/\b(?:elapsed|duration|response(?:Time)?|answerTime|questionTime|timeMs|msPer)\b/i.test(src)
    },
    chars:src.length
  });
}
function sourceWindowEvidence(){
  const source=__FEQ_V251_SOURCE__;
  const out={};
  for(const token of profileTokens){
    const rows=[];let pos=0;
    while((pos=source.indexOf(token,pos))>=0){
      const s=source.slice(Math.max(0,pos-500),Math.min(source.length,pos+700));
      rows.push({
        rate:/\brate\b/.test(s),correct:/\b(?:correct|ok|right)\b/i.test(s),seen:/\bseen\b/i.test(s),level:/\b(?:level|difficulty)\b/i.test(s),seconds:/\bseconds\b/i.test(s),
        dateNow:/Date\.now\s*\(/.test(s),performanceNow:/performance\.now\s*\(/.test(s),elapsed:/\b(?:elapsed|duration|response(?:Time)?|answerTime|questionTime|timeMs|msPer)\b/i.test(s)
      });
      pos+=token.length;
      if(rows.length>=40)break;
    }
    const flags={};for(const k of ['rate','correct','seen','level','seconds','dateNow','performanceNow','elapsed'])flags[k]=rows.some(r=>r[k]);
    out[token]={occurrences:rows.length,flags};
  }
  return out;
}
const sourceEvidence=sourceWindowEvidence();
const timingFns=relevantFunctions.filter(x=>x.flags.performanceNow||x.flags.elapsed);
const perQuestionTimingFns=timingFns.filter(x=>x.tokens.some(t=>['bMockStats','bFinalStats','securityStats'].includes(t)));
const historyTimingFns=relevantFunctions.filter(x=>x.flags.seconds||x.flags.performanceNow||x.flags.elapsed).filter(x=>x.tokens.some(t=>t.endsWith('History')));
const statsAccuracyEvidence=['bMockStats','bFinalStats','securityStats'].filter(t=>sourceEvidence[t]?.occurrences>0&&(sourceEvidence[t].flags.correct||sourceEvidence[t].flags.seen));
console.log('__V251__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  profileKeys:Object.keys(profile||{}).filter(k=>/^b|security/i.test(k)).sort(),
  relevantFunctions:relevantFunctions.sort((a,b)=>a.name.localeCompare(b.name)),
  sourceEvidence,
  timing:{perQuestionTimingFns:perQuestionTimingFns.map(x=>x.name),historyTimingFns:historyTimingFns.map(x=>x.name)},
  accuracyStatsTokens:statsAccuracyEvidence,
  banks:{questions:hashJson(QUESTION_BANK),trace:hashJson(B_EXERCISES),compound:hashJson(B_COMPOUND_SETS),security:hashJson(SECURITY_SCENARIOS),finalAlgorithm:hashJson(B_EXAM_ALGO_ITEMS)},
  contracts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],
  sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    tail = tail.replace('__FEQ_V251_SOURCE__', json.dumps(js, ensure_ascii=False))
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'runtime.js'
        p.write_text(stub + '\n' + js + '\n' + tail)
        z = subprocess.run(['node', str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: ' + z.stderr[-7000:])
        m = re.search(r'__V251__([A-Za-z0-9+/=]+)', z.stdout)
        req(m, 'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
parent = subprocess.check_output(['git', 'rev-parse', 'origin/main'], text=True).strip()
req((version, previous) == ('v251', 'v250'), 'v251 audit expects v250 parent')
source = Path('audits/SUBJECT_B_REMEDIATION_DIFFICULTY_POST_REPAIR_AUDIT_v250.txt')
req(source.exists(), 'v250 evidence missing')
st = source.read_text()
req('PASS — NO FINDINGS' in st and 'learner-local performance' in st and 'accuracy and response time' in st, 'v250 handoff drift')

expected = {
    '.github/subject-b-learner-local-calibration-readiness-audit/validate_audit.py',
    '.github/workflows/subject-b-learner-local-calibration-readiness-audit.yml',
}
changed = set(subprocess.check_output(['git', 'diff', '--name-only', 'origin/main...HEAD'], text=True).splitlines())
req(changed == expected, 'v251 audit-only source drift: ' + repr(sorted(changed ^ expected)))

cand, par = runtime('_site/index.html'), runtime('_site_parent/index.html')
req(cand['v'] == 'v251' and par['v'] == 'v250', 'runtime versions')
req(cand['banks'] == par['banks'], 'audit-only bank drift')
req(cand['sourceEvidence'] == par['sourceEvidence'], 'audit-only persistence evidence drift')
req(cand['relevantFunctions'] == par['relevantFunctions'], 'audit-only recording-function drift')
req(cand['timing'] == par['timing'] and cand['accuracyStatsTokens'] == par['accuracyStatsTokens'], 'audit-only calibration-capability drift')
req(cand['contracts'] == par['contracts'] == [20, 16, 4, 6000, 43, 15, 4], 'final contract drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic diagnostics failed')

findings = []
if not cand['timing']['perQuestionTimingFns']:
    findings.append({
        'priority': 'Medium',
        'marker': 'subject_b_local_calibration_lacks_per_question_response_time',
        'detail': 'Existing Subject B persisted stats/history expose accuracy/exposure evidence and some session-level timing, but no detected per-question response-time recorder tied to Subject B item stats.'
    })
if not cand['accuracyStatsTokens']:
    findings.append({
        'priority': 'High',
        'marker': 'subject_b_local_calibration_lacks_accuracy_evidence',
        'detail': 'No persisted Subject B accuracy/exposure stats were detected for learner-local calibration.'
    })
priority = {'High': 3, 'Medium': 2, 'Low': 1}
findings.sort(key=lambda x: -priority[x['priority']])
result = 'PASS — NO FINDINGS' if not findings else f"PASS — {findings[0]['priority'].upper()} FINDING RECORDED"

fixture = {
    'version': version,
    'previous': previous,
    'parent': parent,
    'result': result,
    'findings': findings,
    'profileKeys': cand['profileKeys'],
    'sourceEvidence': cand['sourceEvidence'],
    'relevantFunctions': cand['relevantFunctions'],
    'timing': cand['timing'],
    'accuracyStatsTokens': cand['accuracyStatsTokens'],
    'bankHashes': cand['banks'],
    'contracts': cand['contracts'],
    'semanticOK': True,
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/subject-b-learner-local-calibration-readiness-audit-v251.fixture.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')

func_lines = []
for f in cand['relevantFunctions']:
    yes = ', '.join(k for k, v in f['flags'].items() if v) or 'no calibration markers'
    func_lines.append(f"- {f['name']}: tokens={','.join(f['tokens'])}; markers={yes}")
func_text = '\n'.join(func_lines) if func_lines else '- none detected'
ev_lines = []
for token, ev in cand['sourceEvidence'].items():
    yes = ', '.join(k for k, v in ev['flags'].items() if v) or 'none'
    ev_lines.append(f"- {token}: occurrences={ev['occurrences']}; nearby markers={yes}")
ev_text = '\n'.join(ev_lines)
finding_text = 'none' if not findings else '\n'.join(f"- {x['priority']}: {x['marker']} — {x['detail']}" for x in findings)

audit = f'''FE QUEST v251 — Subject B Learner-Local Calibration Readiness Audit
====================================================================

Result
------
{result}
Previous release: v250
Source main: {parent}
Learner-facing change in v251: none

Purpose
-------
v250 closed the static difficulty-label / practice-calibration repair sequence and handed off to learner-local evidence. v251 checks whether the current local profile and Subject B recording paths already retain enough evidence to summarize accuracy and response time by practice layer/difficulty before adding any new telemetry or adaptive recommendation logic.

Persisted Subject B evidence markers
------------------------------------
{ev_text}

Relevant recording functions detected at runtime
------------------------------------------------
{func_text}

Calibration readiness
---------------------
Persisted accuracy/exposure stat tokens detected: {', '.join(cand['accuracyStatsTokens']) if cand['accuracyStatsTokens'] else 'none'}
History/session timing functions detected: {', '.join(cand['timing']['historyTimingFns']) if cand['timing']['historyTimingFns'] else 'none'}
Per-question timing functions tied to Subject B item stats detected: {', '.join(cand['timing']['perQuestionTimingFns']) if cand['timing']['perQuestionTimingFns'] else 'none'}

Findings
--------
{finding_text}

Regression
----------
Question / TRACE / compound / security / final-algorithm banks: unchanged from v250.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.

Decision
--------
If per-question response time is missing while accuracy/exposure evidence already exists, add the smallest bounded local-only timing layer rather than replacing existing histories. Record only the fields needed for learning adaptation (practice layer, source id, authored difficulty, correctness, elapsed time, timestamp), cap retained events, and derive summaries at read time. Do not send telemetry off-device, do not change scoring/timing, and do not alter published difficulty labels from sparse personal data. After instrumentation, audit save/restore/schema compatibility and adaptive recommendation behavior separately.
'''
Path('audits').mkdir(exist_ok=True)
Path('audits/SUBJECT_B_LEARNER_LOCAL_CALIBRATION_READINESS_AUDIT_v251.txt').write_text(audit)
print(audit)
