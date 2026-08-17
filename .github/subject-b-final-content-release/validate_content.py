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
    m = re.fullmatch(r"(v(\d+))-subject-b-final-content-staging", branch)
    req(m, "bad Subject B final content branch")
    version = m.group(1)
    return version, f"v{int(m.group(2)) - 1}"


def dump(path):
    html = Path(path).read_text()
    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", html, re.S | re.I)
    js = "\n".join(x for x in scripts if x.strip() and not x.lstrip().startswith("{"))
    stub = runpy.run_path(".github/release/runtime_stub.py")["STUB"]
    tail = r'''
const __savedFinalStats=JSON.parse(JSON.stringify(profile.bFinalStats||{}));
function __restoreFinalStats(){profile.bFinalStats=JSON.parse(JSON.stringify(__savedFinalStats));}
function __setFinalStats(fn){
  profile.bFinalStats={};
  B_EXAM_ALGO_ITEMS.forEach((e,i)=>{const v=fn(e,i)||{};profile.bFinalStats[`algo:${e.id}`]={seen:v.seen||0,correct:0,lastSeen:v.lastSeen??null};});
  SECURITY_SCENARIOS.forEach(s=>{profile.bFinalStats[`sec:${s.id}`]={seen:0,correct:0,lastSeen:null};});
}
function __finalSummary(items){
  const algo=items.filter(x=>x.kind==='algo'),sec=items.filter(x=>x.kind==='security');
  const levels=algo.reduce((m,x)=>{m[x.level]=(m[x.level]||0)+1;return m;},{});
  return {
    total:items.length,algo:algo.length,sec:sec.length,levels,
    domains:new Set(algo.map(x=>x.domain)).size,
    unique:new Set(algo.map(x=>x.sourceId)).size,
    high:globalThis.bFinalHighTraceCountV208?bFinalHighTraceCountV208(algo):null,
    log:sec.filter(x=>!!x.log).length,nonlog:sec.filter(x=>!x.log).length
  };
}
function __runFinalSessions(n){
  let minHigh=999,maxHigh=0,badContract=0,badSecurity=0;
  for(let i=0;i<n;i++){
    const s=__finalSummary(buildBFinal());
    if(s.high!==null){minHigh=Math.min(minHigh,s.high);maxHigh=Math.max(maxHigh,s.high);}
    if(s.total!==20||s.algo!==16||s.sec!==4||s.levels['標準']!==8||s.levels['応用']!==8||s.domains!==10||s.unique!==16)badContract++;
    if(s.log!==2||s.nonlog!==2)badSecurity++;
  }
  return {minHigh:minHigh===999?null:minHigh,maxHigh,badContract,badSecurity};
}
const __spec=globalThis['SUBJECT_B_FINAL_V'+APP_VERSION.slice(1)+'_SPEC']||null;
let finalProbe=null;
if(__spec){
  __setFinalStats(()=>({seen:0,lastSeen:null}));
  const equal=__runFinalSessions(160);
  const highSet=new Set(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[]);
  __setFinalStats(e=>highSet.has(e.id)?{seen:80,lastSeen:'2026-08-16'}:{seen:0,lastSeen:null});
  const adversarial=__runFinalSessions(160);
  const lowIds=['bexam_ctrl_02','bexam_arr_03','bexam_mat_02','bexam_obj_02','bexam_rec_02','bexam_tree_01','bexam_list_02','bexam_bit_01','bexam_rec_04','bexam_tree_03','bexam_list_01','bexam_sq_03','bexam_bit_03','bexam_algo_02','bexam_arr_04','bexam_obj_03'];
  __setFinalStats((e,i)=>({seen:highSet.has(e.id)?i+1:0,lastSeen:null}));
  const lowInput=lowIds.map(id=>B_EXAM_ALGO_ITEMS.find(x=>x.id===id)).map(makeFinalAlgoExam);
  const repaired=bFinalRepairTraceFloorV208(lowInput);
  const repairSummary=__finalSummary(repaired);
  const replacements=repaired.filter(x=>!lowIds.includes(x.sourceId)).map(x=>x.sourceId);
  finalProbe={equal,adversarial,repairSummary,replacements,buildSource:String(buildBFinal),repairSource:String(bFinalRepairTraceFloorV208)};
}
__restoreFinalStats();
console.log('__BF__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,q:QUESTION_BANK,e:B_EXERCISES,c:B_PREDICTION_CONTRACTS,b:B_COMPOUND_SETS,s:SECURITY_SCENARIOS,x:B_EXAM_ALGO_ITEMS,
  fc:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],domains:B_FINAL_ALGO_DOMAINS,spec:__spec,probe:finalProbe,sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / "x.js"
        f.write_text(stub + "\n" + js + "\n" + tail)
        z = subprocess.run(["node", str(f)], capture_output=True, text=True)
        req(z.returncode == 0, "runtime dump " + z.stderr[-4000:])
        m = re.search(r"__BF__([A-Za-z0-9+/=]+)", z.stdout)
        req(m, "dump marker")
        return json.loads(base64.b64decode(m.group(1)))


version, previous = ctx()
manifest_path = Path(f"_release/content-change-{version}.json")
req(manifest_path.exists(), "manifest missing")
mf = json.loads(manifest_path.read_text())
parent = subprocess.check_output(["git", "rev-parse", "origin/main"], text=True).strip()
req(mf.get("schema_version") == 1 and mf.get("release") == version and mf.get("previous_release") == previous, "manifest release context")
req(mf.get("parent_main_sha") == parent, "manifest parent")
req(mf.get("change_type") == "subject-b-final-selection", "change type")
req(mf.get("source_priority_tier") == "medium", "priority tier")
req(mf.get("allowed_logic_targets") == ["buildBFinal"], "logic target")
marker = mf.get("quality_audit_marker", "")
req(marker.startswith(version + "-"), "quality marker")

source_audit = Path(mf["source_quality_audit"])
source = json.loads(source_audit.read_text())
medium = source.get("findings", {}).get("medium", [])
req(any(x.get("id") == "final_practice_sustained_trace_floor" and x.get("defer_to") == version for x in medium), "source Medium finding")
req(source.get("decision", {}).get("next_release") == version, "source next release")
req(source.get("decision", {}).get("next_scope") == "narrow final-algorithm sustained-trace selection repair", "source next scope")
source_high_ids = source.get("high_trace_load_rubric", {}).get("high_trace_load_ids", [])
req(len(source_high_ids) == 12, "source high-trace inventory")

tooling = {
    ".github/workflows/subject-b-final-content-release-validate.yml",
    ".github/subject-b-final-content-release/validate_content.py",
}
committed = set(subprocess.check_output(["git", "diff", "--name-only", "origin/main...HEAD"], text=True).splitlines())
expected = set(mf["content_files"]) | set(mf["assembly_files"]) | {manifest_path.as_posix()}
for p in tooling:
    if subprocess.run(["git", "cat-file", "-e", parent + ":" + p], capture_output=True).returncode:
        expected.add(p)
req(committed == expected, "pre-release drift " + repr(sorted(committed ^ expected)))
for p in tooling:
    req(Path(p).exists() and version not in Path(p).read_text(), "tooling target literal/missing " + p)

stable = [
    "app/base-stable.html",
    "app/learning-patches.txt",
    "app/runtime-semantic-diagnostics.txt",
    "app/runtime-diagnostic-wrapper.txt",
    "app/runtime-release-adapter.txt",
    "app/runtime-release-diagnostic-spec.txt",
    "app/subject-b-security-overrides-v200.txt",
    "app/subject-b-algorithm-overrides-v202.txt",
    "app/subject-b-session-overrides-v205.txt",
    "_regression/subject-b-final-fidelity-v207.fixture.json",
    "_regression/diagnostic-archive-inventory.fixture.json",
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
for forbidden in ["QUESTION_BANK.find", "SECURITY_SCENARIOS.find", "B_EXAM_ALGO_ITEMS.push", "B_EXAM_ALGO_ITEMS.splice", "profile.schemaVersion"]:
    req(forbidden not in override, "forbidden content mutation token " + forbidden)
req("buildBFinal=function()" in override and "bFinalRepairTraceFloorV208" in override and "B_FINAL_HIGH_TRACE_IDS_V208" in override, "final override contract")

candidate = dump("_site/index.html")
parent_rt = dump("_site_parent/index.html")
preserve = mf["preserve"]
req(candidate["v"] == version and parent_rt["v"] == previous, "versions")
for key, label in [("q", "Subject A"), ("e", "B_EXERCISES"), ("c", "prediction"), ("b", "compound"), ("s", "security"), ("x", "final algorithm pool")]:
    req(candidate[key] == parent_rt[key], label + " drift")
req(len(candidate["x"]) == preserve["algorithm_pool_count"] == 40, "algorithm pool count")
req(candidate["fc"] == preserve["final_counts"] == [20, 16, 4], "final counts")
req(len(candidate["domains"]) == preserve["algorithm_domain_count"] == 10, "domain count")
req(candidate["sem"].get("ok") is True, "semantic " + repr(candidate["sem"].get("errors")))

spec = candidate.get("spec") or {}
probe = candidate.get("probe") or {}
req(parent_rt.get("spec") is None and parent_rt.get("probe") is None, "parent unexpectedly has final repair")
req(spec.get("policy") == "final-practice-sustained-trace-floor", "policy")
req(spec.get("sourceAudit") == "v207-final_practice_sustained_trace_floor", "source audit marker")
req(spec.get("highTraceFloor") == preserve["high_trace_floor_when_compatible"] == 4, "trace floor")
req(set(spec.get("highTraceIds", [])) == set(source_high_ids) and len(spec.get("highTraceIds", [])) == preserve["high_trace_pool_count"], "stable high-trace classification")
for name in ("equal", "adversarial"):
    p = probe.get(name) or {}
    req(p.get("badContract") == 0, name + " structural contract")
    req(p.get("badSecurity") == 0, name + " security 2+2 contract")
    req((p.get("minHigh") or 0) >= 4, name + " sustained-trace floor")
repair = probe.get("repairSummary") or {}
req(repair.get("algo") == 16 and repair.get("levels") == preserve["algorithm_levels"] and repair.get("domains") == 10 and repair.get("unique") == 16, "low-trace repair structural drift")
req((repair.get("high") or 0) >= 4, "low-trace repair floor")
req(len(probe.get("replacements") or []) == 4, "low-trace probe should require four same-domain/same-level replacements")
req("__buildBFinalBeforeV208" in probe.get("buildSource", "") and "bFinalRepairTraceFloorV208" in probe.get("buildSource", ""), "buildBFinal source not wrapped")
req("candidate.domain===rawVictim.domain" in probe.get("repairSource", "") and "candidate.level===rawVictim.level" in probe.get("repairSource", ""), "same-domain/same-level repair boundary missing")

files = ["index.html", "manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]
req(all((Path("_site") / x).read_bytes() == (Path("_site_reference") / x).read_bytes() for x in files), "candidate/reference")

fixture = {
    "name": f"subject-b-final-trace-balance-{version}",
    "version": version,
    "previous_version": previous,
    "parent_main_sha": parent,
    "source_quality_audit": ident(source_audit),
    "learner_facing_change": True,
    "changed_runtime_target": "buildBFinal selection only",
    "question_wording_changed": False,
    "saved_state_ids_changed": False,
    "content_banks_deep_identical_to_parent": {
        "QUESTION_BANK": True,
        "B_EXERCISES": True,
        "B_PREDICTION_CONTRACTS": True,
        "B_COMPOUND_SETS": True,
        "SECURITY_SCENARIOS": True,
        "B_EXAM_ALGO_ITEMS": True,
    },
    "final_practice": {
        "counts": candidate["fc"],
        "algorithm_levels": preserve["algorithm_levels"],
        "algorithm_domains": len(candidate["domains"]),
        "high_trace_pool_count": len(source_high_ids),
        "high_trace_floor": spec["highTraceFloor"],
        "equal_history_probe": probe["equal"],
        "adversarial_high_seen_probe": probe["adversarial"],
        "v207_zero_high_construction_repair": repair,
        "v207_probe_replacements": probe["replacements"],
        "repair_boundary": spec["repairBoundary"],
    },
    "security_final": {"log": preserve["security_log_count"], "nonlog": preserve["security_nonlog_count"]},
    "subject_b_semantic_validator_ok": True,
    "candidate_reference_six_file_byte_equality": True,
    "status": "passed",
}
Path(f"_regression/subject-b-final-trace-balance-{version}.fixture.json").write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n")
Path(f"audits/SUBJECT_B_FINAL_TRACE_BALANCE_{version}.txt").write_text(f"""FE QUEST {version} — Subject B Final-Practice Sustained-Trace Repair\n================================================================\n\nPASSED\nPrevious: {previous}\nSource release: {previous}\nSource main: {parent}\nSource finding: final_practice_sustained_trace_floor (Medium, {previous})\n\nChanged runtime target: buildBFinal selection only.\nQuestion wording/IDs: unchanged. B_EXAM_ALGO_ITEMS remains 40/40 byte-equivalent at runtime.\nFinal contract preserved: 20 total = 16 algorithm + 4 security; algorithm levels = 標準8 / 応用8; all ten algorithm domains; unique algorithm IDs; security = 2 log + 2 non-log.\n\nTrace policy\n------------\nStable high-trace classification: {len(source_high_ids)} / 40 algorithm items.\nInternal readiness floor: at least {spec['highTraceFloor']} high-trace items among the 16 algorithm questions.\nRepair boundary: same domain and same difficulty only, so the existing breadth and 8/8 difficulty contracts cannot be displaced by the floor repair.\nCandidate ranking inside the compatible high-trace class remains seen-count first, then current-session format load, then random tie.\nThe value {spec['highTraceFloor']} is an FE QUEST internal readiness floor, not an official IPA composition ratio.\n\nStress evidence\n---------------\nEqual-history 160 sessions: minimum high-trace={probe['equal']['minHigh']}, maximum={probe['equal']['maxHigh']}, structural failures={probe['equal']['badContract']}, security failures={probe['equal']['badSecurity']}.\nAdversarial history (all high-trace items heavily seen) 160 sessions: minimum high-trace={probe['adversarial']['minHigh']}, maximum={probe['adversarial']['maxHigh']}, structural failures={probe['adversarial']['badContract']}, security failures={probe['adversarial']['badSecurity']}.\nv207 zero-high contract-valid construction after repair: high-trace={repair['high']}; replacements={probe['replacements']}.\n\nCandidate/reference six-file equality: yes. Subject B semantic validation: OK.\nReferences remain calibration-only for scope, structure, terminology and difficulty; proprietary question wording is not copied.\n\nNext\n----\nAudit post-repair final-practice behavior before considering any denser question-content expansion.\n""")
print(f"FEQUEST_SUBJECT_B_FINAL_CONTENT_RELEASE_OK version={version} floor={spec['highTraceFloor']} equal-min={probe['equal']['minHigh']} adversarial-min={probe['adversarial']['minHigh']} candidate-reference=1")
