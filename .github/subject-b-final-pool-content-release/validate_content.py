from pathlib import Path
import base64, hashlib, json, os, re, runpy, subprocess, tempfile


def req(v, m):
    if not v:
        raise AssertionError(m)


def ident(p):
    p = Path(p)
    b = p.read_bytes()
    return {"path": p.as_posix(), "utf8_bytes": len(b), "sha256": hashlib.sha256(b).hexdigest()}


def ctx():
    branch = os.environ.get("GITHUB_REF_NAME") or subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
    m = re.fullmatch(r"subject-b-final-pool-(v(\d+))", branch)
    req(m, "bad Subject B final pool content branch")
    version = m.group(1)
    return version, f"v{int(m.group(2)) - 1}"


def dump(path):
    html = Path(path).read_text()
    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", html, re.S | re.I)
    js = "\n".join(x for x in scripts if x.strip() and not x.lstrip().startswith("{"))
    stub = runpy.run_path(".github/release/runtime_stub.py")["STUB"]
    tail = r'''
const __savedStats=JSON.parse(JSON.stringify(profile.bFinalStats||{}));
function __restoreStats(){profile.bFinalStats=JSON.parse(JSON.stringify(__savedStats));}
function __setStats(fn){
  profile.bFinalStats={};
  B_EXAM_ALGO_ITEMS.forEach((e,i)=>{const v=fn(e,i)||{};profile.bFinalStats[`algo:${e.id}`]={seen:v.seen||0,correct:0,lastSeen:v.lastSeen??null};});
  SECURITY_SCENARIOS.forEach(s=>{profile.bFinalStats[`sec:${s.id}`]={seen:0,correct:0,lastSeen:null};});
}
const __highIds=[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])];
const __highSet=new Set(__highIds);
function __summary(items){
  const algo=items.filter(x=>x?.kind==='algo'),sec=items.filter(x=>x?.kind==='security');
  const levels=algo.reduce((m,x)=>{m[x.level]=(m[x.level]||0)+1;return m;},{});
  return {
    total:items.length,algo:algo.length,sec:sec.length,levels,
    domains:new Set(algo.map(x=>x.domain)).size,
    unique:new Set(algo.map(x=>x.sourceId)).size,
    high:algo.filter(x=>__highSet.has(x.sourceId)).length,
    log:sec.filter(x=>!!x.log).length,nonlog:sec.filter(x=>!x.log).length
  };
}
function __runSessions(n){
  let minHigh=999,maxHigh=0,badContract=0,badSecurity=0;
  for(let i=0;i<n;i++){
    const s=__summary(buildBFinal());
    minHigh=Math.min(minHigh,s.high);maxHigh=Math.max(maxHigh,s.high);
    if(s.total!==20||s.algo!==16||s.sec!==4||s.levels['標準']!==8||s.levels['応用']!==8||s.domains!==10||s.unique!==16)badContract++;
    if(s.log!==2||s.nonlog!==2)badSecurity++;
  }
  return {minHigh,maxHigh,badContract,badSecurity};
}
__setStats(()=>({seen:0,lastSeen:null}));
const __equal=__runSessions(320);
__setStats(e=>__highSet.has(e.id)?{seen:80,lastSeen:'2026-08-17'}:{seen:0,lastSeen:null});
const __adversarial=__runSessions(320);
const __answerPositions=[0,0,0,0];B_EXAM_ALGO_ITEMS.forEach(q=>__answerPositions[q.a]++);
const __highLevels={'標準':0,'応用':0};B_EXAM_ALGO_ITEMS.filter(q=>__highSet.has(q.id)).forEach(q=>__highLevels[q.level]++);
const __defaultCells=B_FINAL_ALGO_DOMAINS.map(domain=>({domain,level:B_FINAL_APPLIED_DOMAINS.has(domain)?'応用':'標準'}));
const __coveredDefaultCells=__defaultCells.filter(cell=>B_EXAM_ALGO_ITEMS.some(q=>__highSet.has(q.id)&&q.domain===cell.domain&&q.level===cell.level));
const __codeLines=B_EXAM_ALGO_ITEMS.map(q=>q.code.length);
const __spec=globalThis.SUBJECT_B_FINAL_V211_SPEC||null;
const __sem=validateSubjectBSemantics();
__restoreStats();
console.log('__BFPOOL__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,q:QUESTION_BANK,e:B_EXERCISES,c:B_PREDICTION_CONTRACTS,b:B_COMPOUND_SETS,s:SECURITY_SCENARIOS,
  x:B_EXAM_ALGO_ITEMS,xc:B_EXAM_ALGO_CONTRACTS,fc:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],domains:B_FINAL_ALGO_DOMAINS,
  highIds:__highIds,highLevels:__highLevels,defaultCells:__defaultCells,coveredDefaultCells:__coveredDefaultCells,
  answerPositions:__answerPositions,codeLines:__codeLines,spec:__spec,sem:__sem,probe:{equal:__equal,adversarial:__adversarial}
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / "runtime.js"
        f.write_text(stub + "\n" + js + "\n" + tail)
        z = subprocess.run(["node", str(f)], capture_output=True, text=True)
        req(z.returncode == 0, "runtime dump " + z.stderr[-5000:])
        m = re.search(r"__BFPOOL__([A-Za-z0-9+/=]+)", z.stdout)
        req(m, "runtime dump marker")
        return json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
manifest_path = Path(f"_release/content-change-{version}.json")
req(manifest_path.exists(), "content manifest missing")
mf = json.loads(manifest_path.read_text())
parent = subprocess.check_output(["git", "rev-parse", "origin/main"], text=True).strip()
req(mf.get("schema_version") == 1, "manifest schema")
req(mf.get("release") == version and mf.get("previous_release") == previous, "manifest release context")
req(mf.get("parent_main_sha") == parent, "manifest parent")
req(mf.get("change_type") == "subject-b-final-pool-expansion", "change type")
req(mf.get("source_priority_tier") == "low", "priority tier")
allowed_ids = mf.get("allowed_question_ids") or []
req(len(allowed_ids) == 3 and len(set(allowed_ids)) == 3, "three approved ids required")

source_audit = Path(mf.get("source_quality_audit", ""))
req(source_audit.exists(), "source audit missing")
audit_text = source_audit.read_text()
req("TARGETED SMALL EXPANSION APPROVED" in audit_text, "source audit decision")
req("Approve exactly three original FE QUEST additions" in audit_text, "source audit three-item scope")
req("final_high_trace_rotation_density" in audit_text, "source Low finding")
req(all(x in audit_text for x in ["オブジェクト指向 / 標準", "ビット列 / 応用", "木構造 / 標準"]), "source target cells")

tooling = {
    ".github/workflows/subject-b-final-pool-content-release-validate.yml",
    ".github/subject-b-final-pool-content-release/validate_content.py",
}
committed = set(subprocess.check_output(["git", "diff", "--name-only", "origin/main...HEAD"], text=True).splitlines())
expected = set(mf.get("content_files", [])) | set(mf.get("assembly_files", [])) | {manifest_path.as_posix()} | tooling
req(committed == expected, "pre-release drift " + repr(sorted(committed ^ expected)))

stable = [
    "app/base-stable.html",
    "app/learning-patches.txt",
    "app/learning-quality-overrides.txt",
    "app/subject-b-security-overrides-v200.txt",
    "app/subject-b-algorithm-overrides-v202.txt",
    "app/subject-b-session-overrides-v205.txt",
    "app/subject-b-final-overrides-v208.txt",
    "audits/SUBJECT_B_FINAL_POST_REPAIR_AUDIT_v209.txt",
    "audits/SUBJECT_B_FINAL_DENSITY_AUDIT_v210.txt",
    ".github/workflows/release-validate.yml",
    ".github/release/release_materialize.py",
    ".github/release/prepare_reference.py",
    ".github/release/release_validate.py",
    ".github/release/runtime_stub.py",
    ".github/content-release/prepare_reference.py",
]
for p in stable:
    req(Path(p).read_bytes() == subprocess.check_output(["git", "show", parent + ":" + p]), "stable drift " + p)

override_path = Path(mf["content_files"][0])
override = override_path.read_text()
req("B_EXAM_ALGO_ITEMS.push" in override, "pool append missing")
req("B_FINAL_HIGH_TRACE_IDS_V208.add" in override, "high-trace extension missing")
req("buildBFinal=function" not in override and "__buildBFinalBeforeV208" not in override, "selector must not change")
for forbidden in ["QUESTION_BANK.find", "B_EXERCISES.find", "SECURITY_SCENARIOS.find", "B_EXAM_ALGO_ITEMS.splice", "profile.schemaVersion"]:
    req(forbidden not in override, "forbidden mutation token " + forbidden)
for qid in allowed_ids:
    req(override.count(qid) >= 2, "approved id missing " + qid)

candidate = dump("_site/index.html")
parent_rt = dump("_site_parent/index.html")
preserve = mf["preserve"]
req(candidate["v"] == version and parent_rt["v"] == previous, "runtime versions")
for key, label in [("q", "QUESTION_BANK"), ("e", "B_EXERCISES"), ("c", "prediction"), ("b", "compound"), ("s", "security")]:
    req(candidate[key] == parent_rt[key], label + " drift")
req(len(parent_rt["x"]) == preserve["parent_algorithm_pool_count"] == 40, "parent algorithm count")
req(len(candidate["x"]) == preserve["algorithm_pool_count"] == 43, "candidate algorithm count")
req(candidate["x"][:40] == parent_rt["x"], "existing 40 algorithm items changed")
added = candidate["x"][40:]
req([x["id"] for x in added] == allowed_ids, "appended id order/scope")
req(len({x["id"] for x in candidate["x"]}) == 43, "algorithm ids not unique")

expected_shape = {
    "bexam_obj_04": ("オブジェクト指向", "標準", "途中状態", 0, "a.value=8, c.value=8"),
    "bexam_bit_05": ("ビット列", "応用", "処理結果", 1, "01101111₂"),
    "bexam_tree_05": ("木構造", "標準", "途中状態", 2, "sum=8, queue=[D,E]"),
}
for item in added:
    qid = item["id"]
    domain, level, fmt, answer_index, answer = expected_shape[qid]
    req((item["domain"], item["level"], item["format"], item["a"]) == (domain, level, fmt, answer_index), qid + " metadata")
    req(len(item.get("options", [])) == 4 and len(set(item["options"])) == 4, qid + " options")
    req(len(item.get("code", [])) >= 6, qid + " trace density")
    req(item["options"][item["a"]] == answer, qid + " answer")
    req(candidate["xc"].get(qid) == answer, qid + " semantic contract")

req(candidate["fc"] == preserve["final_counts"] == [20, 16, 4], "final counts")
req(len(candidate["domains"]) == preserve["algorithm_domain_count"] == 10, "domain count")
req(candidate["answerPositions"] == [11, 11, 11, 10], "answer-position balance")
req(candidate["sem"].get("ok") is True, "semantic " + repr(candidate["sem"].get("errors")))

spec = candidate.get("spec") or {}
req(spec.get("policy") == "final-algorithm-pool-density-expansion", "v211 spec policy")
req(spec.get("sourceAudit") == "v210-final_high_trace_rotation_density", "v211 spec source")
req(spec.get("addedIds") == allowed_ids, "v211 spec ids")
req(spec.get("algorithmPoolCount") == 43, "v211 spec pool")
req(spec.get("highTracePoolCount") == preserve["high_trace_pool_count"] == 15, "v211 spec high trace")
req(spec.get("highTraceLevels") == preserve["high_trace_levels"] == {"標準": 5, "応用": 10}, "v211 spec high levels")
req(spec.get("highTraceFloor") == preserve["high_trace_floor"] == 4, "v211 floor")
req(spec.get("selectorChanged") is False and preserve["selector_changed"] is False, "selector changed")
req(len(parent_rt["highIds"]) == preserve["parent_high_trace_pool_count"] == 12, "parent high trace inventory")
req(len(candidate["highIds"]) == 15 and set(candidate["highIds"]) == set(parent_rt["highIds"]) | set(allowed_ids), "high trace inventory extension")
req(candidate["highLevels"] == {"標準": 5, "応用": 10}, "high trace level distribution")
req(len(candidate["coveredDefaultCells"]) == len(candidate["defaultCells"]) == 10, "default high-trace cell coverage")

for name in ("equal", "adversarial"):
    p = candidate["probe"][name]
    req(p["badContract"] == 0, name + " final structural contract")
    req(p["badSecurity"] == 0, name + " final security contract")
    req(p["minHigh"] >= 4, name + " trace floor")

files = ["index.html", "manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]
req(all((Path("_site") / x).read_bytes() == (Path("_site_reference") / x).read_bytes() for x in files), "candidate/reference six-file mismatch")

lines = candidate["codeLines"]
fixture = {
    "name": f"subject-b-final-pool-density-{version}",
    "version": version,
    "previous_version": previous,
    "parent_main_sha": parent,
    "source_quality_audit": ident(source_audit),
    "learner_facing_change": True,
    "change_type": "append-only-original-final-algorithm-items",
    "added_ids": allowed_ids,
    "existing_40_deep_identical_to_parent": True,
    "selector_changed": False,
    "saved_state_ids_changed": False,
    "algorithm_pool": {
        "parent": 40,
        "candidate": 43,
        "levels": {"標準": 21, "応用": 22},
        "answer_positions": candidate["answerPositions"],
        "code_lines": {"min": min(lines), "max": max(lines), "average": round(sum(lines) / len(lines), 3)},
    },
    "high_trace": {
        "parent": 12,
        "candidate": 15,
        "levels": candidate["highLevels"],
        "floor": 4,
        "default_domain_level_cells_covered": len(candidate["coveredDefaultCells"]),
    },
    "final_practice": {
        "counts": candidate["fc"],
        "algorithm_levels": preserve["algorithm_levels_per_session"],
        "algorithm_domains": 10,
        "security_log": preserve["security_log_count"],
        "security_nonlog": preserve["security_nonlog_count"],
        "equal_history_320": candidate["probe"]["equal"],
        "adversarial_high_seen_320": candidate["probe"]["adversarial"],
    },
    "subject_b_semantic_validator_ok": True,
    "candidate_reference_six_file_byte_equality": True,
    "status": "passed",
}
Path(f"_regression/subject-b-final-pool-density-{version}.fixture.json").write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n")

Path(f"audits/SUBJECT_B_FINAL_POOL_DENSITY_{version}.txt").write_text(f"""FE QUEST {version} — Subject B Final-Algorithm Pool Density Expansion
======================================================================

PASSED
Previous: {previous}
Source main: {parent}
Source finding: final_high_trace_rotation_density (Low, v210)

Change
------
Append-only expansion: 3 original FE QUEST algorithm items.
Existing final-algorithm items preserved byte-for-byte at runtime: 40 / 40.
Selector logic changed: no.
Saved-state IDs changed: no.

Added items
-----------
bexam_obj_04 — オブジェクト指向 / 標準 / 途中状態 / sustained trace
bexam_bit_05 — ビット列 / 応用 / 処理結果 / sustained trace
bexam_tree_05 — 木構造 / 標準 / 途中状態 / sustained trace

Pool after expansion
--------------------
Algorithm pool: 40 -> 43
Levels: 標準21 / 応用22
High-trace inventory: 12 -> 15 (標準5 / 応用10)
Default domain-level high-trace compatibility: 10 / 10
Answer positions: {candidate['answerPositions']}
Code-line inventory: min {min(lines)} / max {max(lines)} / average {sum(lines)/len(lines):.3f}
These are FE QUEST internal inventory metrics, not official IPA item ratios.

Final-practice preservation
---------------------------
20 total = 16 algorithm + 4 security.
Algorithm per session = 標準8 / 応用8, all ten domains, unique algorithm IDs.
Security = 2 log + 2 non-log.
Sustained-trace floor remains 4; it was not raised.
Equal-history 320 sessions: min high {candidate['probe']['equal']['minHigh']} / max high {candidate['probe']['equal']['maxHigh']} / structural failures {candidate['probe']['equal']['badContract']} / security failures {candidate['probe']['equal']['badSecurity']}.
Adversarial high-trace-seen 320 sessions: min high {candidate['probe']['adversarial']['minHigh']} / max high {candidate['probe']['adversarial']['maxHigh']} / structural failures {candidate['probe']['adversarial']['badContract']} / security failures {candidate['probe']['adversarial']['badSecurity']}.

Validation
----------
Subject B semantic validation: OK.
Candidate/reference generated six-file equality: yes.

Decision
--------
The v210 Low watch is addressed by increasing rotation density rather than changing the selector or raising the readiness floor.
Next: audit post-expansion selection rotation and item quality before any further Subject B pool growth.
""")

print(f"FEQUEST_SUBJECT_B_FINAL_POOL_CONTENT_VALIDATED version={version} added={len(allowed_ids)} pool=43 high=15 parent={parent}")
