from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def context():
    branch = os.environ.get("GITHUB_REF_NAME") or subprocess.check_output(
        ["git", "branch", "--show-current"], text=True
    ).strip()
    m = re.fullmatch(r"subject-b-difficulty-practice-calibration-audit-(v(\d+))", branch)
    req(m, "bad Subject B difficulty/practice calibration audit branch")
    return m.group(1), f"v{int(m.group(2)) - 1}"


def runtime(path):
    html = Path(path).read_text()
    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", html, re.S | re.I)
    js = "\n".join(s for s in scripts if s.strip() and not s.lstrip().startswith("{"))
    stub = runpy.run_path(".github/release/runtime_stub.py")["STUB"]
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function tx(v){return String(v??'').trim();}
function rank(v){return ({'基礎':1,'標準':2,'応用':3})[tx(v)]||0;}
function dist(rows,key='level'){const out={};for(const x of rows){const k=tx(x?.[key])||'未設定';out[k]=(out[k]||0)+1;}return out;}
function calibration(){
  const traceById=Object.fromEntries(B_EXERCISES.map(x=>[x.id,x]));
  const finalSourceById=Object.fromEntries(B_EXAM_ALGO_ITEMS.map(x=>[x.id,x]));
  const finalExam=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam);
  const recovery=finalExam.map(x=>{
    const src=finalSourceById[x.sourceId];
    const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);
    const ex=traceById[t?.id];
    const finalLevel=tx(src?.level),targetLevel=tx(ex?.level);
    return {id:x.sourceId,finalLevel,targetMode:t?.mode||null,targetId:t?.id||null,targetLevel,delta:rank(finalLevel)-rank(targetLevel)};
  });
  const invalid=recovery.filter(x=>x.targetMode!=='trace'||!x.targetId||!x.targetLevel);
  const harder=recovery.filter(x=>!invalid.includes(x)&&x.delta<0);
  const same=recovery.filter(x=>!invalid.includes(x)&&x.delta===0).length;
  const easier=recovery.filter(x=>!invalid.includes(x)&&x.delta>0).length;

  const secById=Object.fromEntries(SECURITY_SCENARIOS.map(x=>[x.id,x]));
  const secMismatch=SECURITY_SCENARIOS.map(makeFinalSecurity)
    .filter(x=>tx(x.level)!==tx(secById[x.sourceId]?.level))
    .map(x=>({id:x.sourceId,finalLevel:tx(x.level),sourceLevel:tx(secById[x.sourceId]?.level)}));

  const quota={...B_MOCK_QUOTAS},traceLevels=dist(B_EXERCISES);
  const quotaShortfall=Object.entries(quota)
    .filter(([k,v])=>(traceLevels[k]||0)<Number(v))
    .map(([k,v])=>({level:k,quota:Number(v),inventory:traceLevels[k]||0}));

  const algoById=Object.fromEntries(B_EXAM_ALGO_ITEMS.map(x=>[x.id,x]));
  const secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const mixes=[];let signature=2166136261>>>0;
  for(let i=0;i<2000;i++){
    profile.bFinalStats={};
    Math.random=seedRand((0x247000+i)>>>0);
    const rows=buildBFinal();
    signature=hashText(signature,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));
    const m={基礎:0,標準:0,応用:0,security:0,unknown:0};
    for(const row of rows){
      const a=algoById[row.sourceId];
      if(a){const lv=tx(a.level);if(lv in m)m[lv]++;else m.unknown++;}
      else if(secIds.has(row.sourceId))m.security++;
      else m.unknown++;
    }
    mixes.push(m);
  }
  function summary(k){const a=mixes.map(x=>x[k]).sort((x,y)=>x-y);const n=a.length,m=Math.floor(n/2);return {min:a[0],median:n%2?a[m]:(a[m-1]+a[m])/2,max:a[n-1]};}

  const compound=B_COMPOUND_SETS.flatMap(s=>(s.qs||[]).map(q=>({level:q.qlevel||s.level})));
  const securityPractice=SECURITY_SCENARIOS.flatMap(s=>(s.steps||[]).map(()=>({level:s.level})));
  return {
    counts:{traceExercises:B_EXERCISES.length,tracePredictions:B_EXERCISES.reduce((n,x)=>n+(x.steps||[]).filter(s=>s.predict).length,0),compoundQuestions:compound.length,securityPracticeQuestions:securityPractice.length,securityScenarios:SECURITY_SCENARIOS.length,finalAlgorithm:B_EXAM_ALGO_ITEMS.length},
    levels:{trace:traceLevels,compound:dist(compound),security:dist(securityPractice),finalAlgorithm:dist(B_EXAM_ALGO_ITEMS),miniMockQuota:quota},
    quotaShortfall,
    recovery:{total:recovery.length,invalid,harder,same,easier,rows:recovery},
    securityMismatch:secMismatch,
    finalMix2000:{advanced:summary('応用'),standard:summary('標準'),basic:summary('基礎'),security:summary('security'),unknown:summary('unknown')},
    finalSignature2000:signature>>>0
  };
}
const c=calibration();
console.log('__V247__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  finalContract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208],
  bankHashes:{questions:hashJson(QUESTION_BANK),trace:hashJson(B_EXERCISES),compound:hashJson(B_COMPOUND_SETS),security:hashJson(SECURITY_SCENARIOS),finalAlgorithm:hashJson(B_EXAM_ALGO_ITEMS)},
  sem:validateSubjectBSemantics(),
  calibration:c
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "runtime.js"
        p.write_text(stub + "\n" + js + "\n" + tail)
        z = subprocess.run(["node", str(p)], capture_output=True, text=True)
        req(z.returncode == 0, "runtime failed: " + z.stderr[-7000:])
        m = re.search(r"__V247__([A-Za-z0-9+/=]+)", z.stdout)
        req(m, "runtime marker missing")
        return json.loads(base64.b64decode(m.group(1)))


version, previous = context()
parent = subprocess.check_output(["git", "rev-parse", "origin/main"], text=True).strip()
req((version, previous) == ("v247", "v246"), "v247 audit expects v246 parent")
source = Path("audits/SUBJECT_B_REVIEW_ACTION_POST_REPAIR_AUDIT_v246.txt")
req(source.exists(), "v246 audit evidence missing")
req("PASS — NO FINDINGS" in source.read_text() and "difficulty-label / practice-calibration evidence" in source.read_text(), "v246 handoff drift")

expected = {
    ".github/subject-b-difficulty-practice-calibration-audit/validate_audit.py",
    ".github/workflows/subject-b-difficulty-practice-calibration-audit.yml",
}
changed = set(subprocess.check_output(["git", "diff", "--name-only", "origin/main...HEAD"], text=True).splitlines())
req(changed == expected, "v247 audit-only source drift: " + repr(sorted(changed ^ expected)))

cand, par = runtime("_site/index.html"), runtime("_site_parent/index.html")
req(cand["v"] == version and par["v"] == previous, "runtime versions")
req(cand["bankHashes"] == par["bankHashes"], "audit-only Subject B bank drift")
req(cand["calibration"] == par["calibration"], "audit-only calibration behavior drift")
req(cand["finalContract"] == par["finalContract"] == [20,16,4,6000,43,15,4], "final contract drift")
req(cand["sem"].get("ok") is True, "Subject B semantic diagnostics failed")

cal = cand["calibration"]
findings=[]
known={"基礎","標準","応用"}
for layer,d in cal["levels"].items():
    if layer=="miniMockQuota": continue
    unknown=[k for k in d if k not in known]
    if unknown: findings.append(("High","subject_b_unknown_difficulty_label",f"{layer}: {unknown}"))
if cal["quotaShortfall"]:
    findings.append(("High","subject_b_mini_mock_quota_inventory_shortfall",json.dumps(cal["quotaShortfall"],ensure_ascii=False)))
if cal["recovery"]["invalid"]:
    findings.append(("High","subject_b_final_remediation_target_missing_for_calibration",f"{len(cal['recovery']['invalid'])} invalid final→TRACE targets"))
if cal["recovery"]["harder"]:
    findings.append(("Medium","subject_b_remediation_target_harder_than_final_label",f"{len(cal['recovery']['harder'])} final items route to a harder-labeled TRACE exercise"))
if cal["securityMismatch"]:
    findings.append(("Medium","subject_b_security_final_practice_level_mismatch",f"{len(cal['securityMismatch'])} security final/source level mismatches"))
if cal["finalMix2000"]["basic"]["max"] or cal["finalMix2000"]["unknown"]["max"]:
    findings.append(("Medium","subject_b_final_session_difficulty_mix_unexpected",json.dumps(cal["finalMix2000"],ensure_ascii=False)))

priority={"High":3,"Medium":2,"Low":1};findings.sort(key=lambda x:-priority[x[0]])
result="PASS — NO FINDINGS" if not findings else f"PASS — {findings[0][0].upper()} FINDING RECORDED"
fixture={
    "version":version,"previous":previous,"parent":parent,"result":result,
    "findings":[{"priority":p,"marker":m,"detail":d} for p,m,d in findings],
    "counts":cal["counts"],"levels":cal["levels"],"quotaShortfall":cal["quotaShortfall"],
    "recovery":{"total":cal["recovery"]["total"],"invalid":len(cal["recovery"]["invalid"]),"harder":len(cal["recovery"]["harder"]),"same":cal["recovery"]["same"],"easier":cal["recovery"]["easier"]},
    "securityMismatch":len(cal["securityMismatch"]),"finalMix2000":cal["finalMix2000"],
    "bankHashes":cand["bankHashes"],"finalSignature2000":cal["finalSignature2000"],"semanticOK":True
}
Path("_regression").mkdir(exist_ok=True)
Path("_regression/subject-b-difficulty-practice-calibration-audit-v247.fixture.json").write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+"\n")
find_text="none" if not findings else "\n".join(f"- {p}: {m} — {d}" for p,m,d in findings)
audit=f'''FE QUEST v247 — Subject B Difficulty Label & Practice Calibration Audit
======================================================================

Result
------
{result}
Previous release: v246
Source main: {parent}
Learner-facing change in v247: none

Purpose
-------
v246 closed the final-review reason/action sequence and handed off to difficulty-label / practice-calibration evidence. v247 is audit-only. It checks the authored 基礎 / 標準 / 応用 inventory, mini-mock quota feasibility, final→TRACE recovery calibration, security source/final consistency, and the actual difficulty-label mix of 2000 deterministic final sessions.

Inventory
---------
TRACE exercises / prediction questions: {cal['counts']['traceExercises']} / {cal['counts']['tracePredictions']}
Compound questions: {cal['counts']['compoundQuestions']}
Security practice questions / scenarios: {cal['counts']['securityPracticeQuestions']} / {cal['counts']['securityScenarios']}
Final algorithm source questions: {cal['counts']['finalAlgorithm']}
TRACE levels: {json.dumps(cal['levels']['trace'],ensure_ascii=False,sort_keys=True)}
Compound levels: {json.dumps(cal['levels']['compound'],ensure_ascii=False,sort_keys=True)}
Security levels: {json.dumps(cal['levels']['security'],ensure_ascii=False,sort_keys=True)}
Final algorithm levels: {json.dumps(cal['levels']['finalAlgorithm'],ensure_ascii=False,sort_keys=True)}
Mini-mock quota: {json.dumps(cal['levels']['miniMockQuota'],ensure_ascii=False,sort_keys=True)}
Quota shortfall: {json.dumps(cal['quotaShortfall'],ensure_ascii=False)}

Recovery calibration
--------------------
Final algorithm items checked: {cal['recovery']['total']}
Invalid final→TRACE targets: {len(cal['recovery']['invalid'])}
Targets labeled harder than failed final item: {len(cal['recovery']['harder'])}
Same-level targets: {cal['recovery']['same']}
Easier-labeled targets: {cal['recovery']['easier']}
Security final/source level mismatches: {len(cal['securityMismatch'])}

Final-session label mix (2000 deterministic sessions)
----------------------------------------------------
応用 algorithm questions/session: {json.dumps(cal['finalMix2000']['advanced'],ensure_ascii=False,sort_keys=True)}
標準 algorithm questions/session: {json.dumps(cal['finalMix2000']['standard'],ensure_ascii=False,sort_keys=True)}
基礎 algorithm questions/session: {json.dumps(cal['finalMix2000']['basic'],ensure_ascii=False,sort_keys=True)}
Security questions/session: {json.dumps(cal['finalMix2000']['security'],ensure_ascii=False,sort_keys=True)}
Unknown labels/session: {json.dumps(cal['finalMix2000']['unknown'],ensure_ascii=False,sort_keys=True)}

Interpretation boundary
-----------------------
This audit tests internal calibration, not whether static labels perfectly predict real exam difficulty. The earlier structural-burden proxy showed weak TRACE 標準→応用 separation, but code length/branches cannot fully represent conceptual difficulty, reading load, or state-tracking burden. Therefore structural proxy evidence alone is not used to relabel learner-facing content.

Findings
--------
{find_text}

Regression
----------
Question / TRACE / compound / security / final-algorithm bank hashes vs v246: identical.
Full calibration snapshot and 2000-session signature vs v246: identical.
Final contract unchanged: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace 15 / floor 4.
Subject B semantic diagnostics: OK.

Decision
--------
If clean, keep the current coarse difficulty labels and practice quotas. The next useful evidence step is learner-local calibration: summarize accuracy and response time by practice layer/difficulty and use those observations for adaptive recommendations, while keeping published 基礎 / 標準 / 応用 labels stable until real learner performance provides a reason to change them.
'''
Path("audits").mkdir(exist_ok=True)
Path("audits/SUBJECT_B_DIFFICULTY_PRACTICE_CALIBRATION_AUDIT_v247.txt").write_text(audit)
print(audit)
