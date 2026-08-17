from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile, hashlib


def req(v, m):
    if not v:
        raise AssertionError(m)


def ident(p):
    p = Path(p)
    b = p.read_bytes()
    return {"path": p.as_posix(), "utf8_bytes": len(b), "sha256": hashlib.sha256(b).hexdigest()}


def ctx():
    branch = os.environ.get("GITHUB_REF_NAME") or subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
    m = re.fullmatch(r"(v(\d+))-subject-b-session-content-staging", branch)
    req(m, "bad branch")
    version = m.group(1)
    return version, f"v{int(m.group(2)) - 1}"


def dump(path):
    html = Path(path).read_text()
    scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", html, re.S | re.I)
    js = "\n".join(x for x in scripts if x.strip() and not x.lstrip().startswith("{"))
    stub = runpy.run_path(".github/release/runtime_stub.py")["STUB"]
    tail = r'''
const __savedStats=JSON.parse(JSON.stringify(profile.bMockStats||{}));
function __restoreStats(){profile.bMockStats=JSON.parse(JSON.stringify(__savedStats));}
function __setStats(fn){profile.bMockStats={};B_EXERCISES.forEach((e,i)=>{const v=fn(e,i)||{};profile.bMockStats[e.id]={seen:v.seen||0,correct:0,lastSeen:v.lastSeen??null};});}
function __levelCounts(items){const o={};items.forEach(x=>o[x.level]=(o[x.level]||0)+1);return o;}
function __familyCounts(items){const o={};items.forEach(x=>{const f=globalThis.bMockFamilyOf?bMockFamilyOf(x):x.id;o[f]=(o[f]||0)+1;});return o;}
function __runSessions(n){let maxFamily=0,badQuota=0;for(let i=0;i<n;i++){const out=buildBMock();const q=__levelCounts(out),f=__familyCounts(out);maxFamily=Math.max(maxFamily,...Object.values(f));if(out.length!==8||q['基礎']!==2||q['標準']!==4||q['応用']!==2)badQuota++;}return {maxFamily,badQuota};}
let session=null;
const __spec=globalThis['SUBJECT_B_SESSION_V'+APP_VERSION.slice(1)+'_SPEC']||null;
if(__spec){
  __setStats(()=>({seen:0,lastSeen:null}));const equal=__runSessions(160);
  const hot=new Set(['linear_search','binary_search_b','bubble_sort_b','selection_sort_b']);
  __setStats(e=>hot.has(e.id)?{seen:0,lastSeen:null}:{seen:40,lastSeen:'2026-08-10'});const adversarial=__runSessions(160);
  __setStats((e,i)=>({seen:i,lastSeen:'2026-08-'+String(1+i).padStart(2,'0')}));
  const fair=selectBMockLevelCandidates([{id:'linear_search',level:'標準'},{id:'stack_ops',level:'標準'},{id:'recursion',level:'標準'},{id:'matrix_sum',level:'標準'}],2,{}).map(x=>x.id);
  profile.bMockStats.linear_search={seen:0,correct:0,lastSeen:null};profile.bMockStats.stack_ops={seen:20,correct:0,lastSeen:'2026-08-10'};
  const cap=selectBMockLevelCandidates([{id:'linear_search',level:'標準'},{id:'stack_ops',level:'標準'}],1,{search_sort:2}).map(x=>x.id);
  const noAlt=selectBMockLevelCandidates([{id:'linear_search',level:'標準'},{id:'binary_search_b',level:'標準'}],1,{search_sort:2}).map(x=>x.id);
  session={equal,adversarial,fair,cap,noAlt,familyMap:globalThis.B_MOCK_FAMILY_BY_ID,familyMax:globalThis.B_MOCK_FAMILY_MAX,buildSource:String(buildBMock)};
}
__restoreStats();
console.log('__BS__'+Buffer.from(JSON.stringify({v:APP_VERSION,q:QUESTION_BANK,e:B_EXERCISES,c:B_PREDICTION_CONTRACTS,b:B_COMPOUND_SETS,s:SECURITY_SCENARIOS,am:B_MOCK_COUNT,aq:B_MOCK_QUOTAS,sm:SECURITY_MOCK_COUNT,sq:SECURITY_MOCK_QUOTAS,fc:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],spec:__spec,session,sem:validateSubjectBSemantics()})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / "x.js"
        f.write_text(stub + "\n" + js + "\n" + tail)
        z = subprocess.run(["node", str(f)], capture_output=True, text=True)
        req(z.returncode == 0, "runtime dump " + z.stderr[-3500:])
        m = re.search(r"__BS__([A-Za-z0-9+/=]+)", z.stdout)
        req(m, "dump marker")
        return json.loads(base64.b64decode(m.group(1)))


def levels(items):
    out = {}
    for item in items:
        out[item["level"]] = out.get(item["level"], 0) + 1
    return out


version, previous = ctx()
manifest_path = Path(f"_release/content-change-{version}.json")
req(manifest_path.exists(), "manifest missing")
mf = json.loads(manifest_path.read_text())
parent = subprocess.check_output(["git", "rev-parse", "origin/main"], text=True).strip()
req(mf.get("schema_version") == 1 and mf.get("release") == version and mf.get("previous_release") == previous, "manifest release context")
req(mf.get("parent_main_sha") == parent, "manifest parent")
req(mf.get("change_type") == "subject-b-session-selection", "change type")
req(mf.get("source_priority_tier") == "medium", "priority tier")
req(mf.get("allowed_logic_targets") == ["buildBMock"], "logic target")
marker = mf.get("quality_audit_marker", "")
req(marker.startswith(version + "-"), "quality marker")

source_audit = Path(mf["source_quality_audit"])
source = json.loads(source_audit.read_text())
medium = source.get("findings", {}).get("medium", [])
req(any(x.get("id") == "algorithm_mini_intra_session_family_balance" and x.get("defer_to") == version for x in medium), "source Medium finding")
req(source.get("decision", {}).get("next_release") == version, "source next release")
req(source.get("decision", {}).get("next_scope") == "algorithm mini mock selection diversity only", "source next scope")

tooling = {
    ".github/workflows/subject-b-session-content-release-validate.yml",
    ".github/subject-b-session-content-release/validate_content.py",
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
    "_regression/diagnostic-archive-inventory.fixture.json",
    ".github/workflows/release-validate.yml",
    ".github/release/release_materialize.py",
    ".github/release/prepare_reference.py",
    ".github/release/release_validate.py",
    ".github/release/runtime_stub.py",
    ".github/content-release/prepare_reference.py",
    "app/subject-b-security-overrides-v200.txt",
    "app/subject-b-algorithm-overrides-v202.txt",
    "_regression/subject-b-session-quality-v204.fixture.json",
]
for p in stable:
    req(Path(p).read_bytes() == subprocess.check_output(["git", "show", parent + ":" + p]), "stable drift " + p)

override_path = Path(mf["content_files"][0])
override = override_path.read_text()
for forbidden in ["B_PREDICTION_CONTRACTS[", "SECURITY_SCENARIOS.find", "B_COMPOUND_SETS.find", "QUESTION_BANK.find", "profile.schemaVersion"]:
    req(forbidden not in override, "forbidden content mutation token " + forbidden)
req("buildBMock=function()" in override and "B_MOCK_FAMILY_BY_ID" in override and "selectBMockLevelCandidates" in override, "session override contract")

candidate = dump("_site/index.html")
parent_rt = dump("_site_parent/index.html")
preserve = mf["preserve"]
req(candidate["v"] == version and parent_rt["v"] == previous, "versions")
req(candidate["q"] == parent_rt["q"], "Subject A drift")
req(candidate["e"] == parent_rt["e"], "B_EXERCISES drift")
req(candidate["c"] == parent_rt["c"], "prediction contracts drift")
req(candidate["b"] == parent_rt["b"], "compound drift")
req(candidate["s"] == parent_rt["s"], "security drift")
req(len(candidate["e"]) == preserve["exercise_count"], "exercise count")
req(sum(bool(st.get("predict")) for e in candidate["e"] for st in e.get("steps", [])) == preserve["prediction_steps"], "prediction steps")
req(len(candidate["b"]) == preserve["compound_set_count"] and sum(len(x.get("qs", [])) for x in candidate["b"]) == preserve["compound_question_count"], "compound structure")
req(len(candidate["s"]) == preserve["security_scenario_count"] and sum(len(x["steps"]) for x in candidate["s"]) == preserve["security_question_count"], "security structure")
req(candidate["am"] == preserve["algorithm_mock_count"] and candidate["aq"] == preserve["algorithm_mock_quotas"], "algorithm mock quota")
req(candidate["sm"] == preserve["security_mock_count"] and candidate["sq"] == preserve["security_mock_quotas"], "security mock quota")
req(candidate["fc"] == preserve["final_counts"], "final counts")
req(candidate["sem"].get("ok") is True, "semantic " + repr(candidate["sem"].get("errors")))

spec = candidate.get("spec") or {}
session = candidate.get("session") or {}
req(parent_rt.get("spec") is None and parent_rt.get("session") is None, "parent unexpectedly has session repair")
req(spec.get("policy") == "algorithm-mini-intra-session-family-balance", "policy")
req(spec.get("sourceAudit") == "v204-algorithm_mini_intra_session_family_balance", "source audit marker")
req(spec.get("familyMax") == preserve["family_max_when_alternative_exists"] == 2, "family cap")
family_map = session.get("familyMap") or {}
exercise_ids = [x["id"] for x in candidate["e"]]
req(set(family_map) == set(exercise_ids) and len(family_map) == 20, "family coverage")
req(len(set(family_map.values())) >= 8, "family classification too coarse")
req({"linear_search", "binary_search_b", "bubble_sort_b", "selection_sort_b"} <= {k for k,v in family_map.items() if v == "search_sort"}, "search/sort family")
req(session.get("familyMax") == 2, "runtime family max")
for key in ("equal", "adversarial"):
    req(session[key]["badQuota"] == 0 and session[key]["maxFamily"] <= 2, key + " session balance")
req(session.get("fair") == ["linear_search", "stack_ops"], "seen fairness")
req(session.get("cap") == ["stack_ops"], "cap should prefer quota-compatible alternative")
req(session.get("noAlt") and session["noAlt"][0] in {"linear_search", "binary_search_b"}, "cap must relax when no alternative exists")
req("familyCounts" in session.get("buildSource", "") and "selectLevel" in session.get("buildSource", ""), "buildBMock source not replaced")

files = ["index.html", "manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]
req(all((Path("_site") / x).read_bytes() == (Path("_site_reference") / x).read_bytes() for x in files), "candidate/reference")

fixture = {
    "name": f"subject-b-session-balance-{version}",
    "version": version,
    "previous_version": previous,
    "parent_main_sha": parent,
    "source_quality_audit": ident(source_audit),
    "learner_facing_change": True,
    "changed_runtime_target": "buildBMock",
    "content_banks_deep_identical_to_parent": {
        "QUESTION_BANK": True,
        "B_EXERCISES": True,
        "B_PREDICTION_CONTRACTS": True,
        "B_COMPOUND_SETS": True,
        "SECURITY_SCENARIOS": True,
    },
    "algorithm_mock": {
        "count": candidate["am"],
        "quotas": candidate["aq"],
        "family_count": len(set(family_map.values())),
        "family_max": session["familyMax"],
        "family_map": family_map,
        "equal_stats_probe": session["equal"],
        "adversarial_search_sort_probe": session["adversarial"],
        "seen_lastSeen_fairness_probe": session["fair"],
        "cap_alternative_probe": session["cap"],
        "cap_relaxation_probe": session["noAlt"],
    },
    "security_mock_quotas": candidate["sq"],
    "final_counts": candidate["fc"],
    "subject_b_semantic_validator_ok": True,
    "candidate_reference_six_file_byte_equality": True,
    "status": "passed",
}
Path(f"_regression/subject-b-session-balance-{version}.fixture.json").write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n")
Path(f"audits/SUBJECT_B_SESSION_BALANCE_{version}.txt").write_text(f"""FE QUEST {version} — Subject B Algorithm Mini-Mock Family Balance Repair\n\nPASSED\nPrevious: {previous}\nSource finding: algorithm_mini_intra_session_family_balance (Medium, {previous})\n\nChanged runtime target: buildBMock selection only.\nPreserved: all learner question banks/contracts, saved-state IDs, 8 questions, quotas {candidate['aq']}, security mock {candidate['sq']}, final {candidate['fc']}.\nFamily policy: 20/20 B_EXERCISES classified into {len(set(family_map.values()))} broad families; family cap=2 whenever the current difficulty quota has an under-cap alternative.\nExposure policy: candidates remain ordered by seen, then lastSeen, then random tie; diversity intervenes only after a family has already filled two session slots.\nStress probes: equal-history max family={session['equal']['maxFamily']}; adversarial search/sort max family={session['adversarial']['maxFamily']}; quotas bad={session['equal']['badQuota'] + session['adversarial']['badQuota']}.\nCap probe: search/sort already at 2 -> selected {session['cap']}; no-alternative probe -> selected {session['noAlt']}.\nCandidate/reference six-file equality: yes. Subject B semantic validation: OK.\nPolicy: no question wording changed; references remain calibration-only for scope, structure and difficulty.\n""")
print("FEQUEST_SUBJECT_B_SESSION_CONTENT_RELEASE_OK", version, "families=" + str(len(set(family_map.values()))), "max=2")
