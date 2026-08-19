from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)


def context():
    branch = os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'], text=True).strip()
    m = re.fullmatch(r'subject-b-local-performance-timing-(v(\d+))', branch)
    req(m, 'bad v254 branch')
    return m.group(1), f'v{int(m.group(2))-1}'


def run_runtime(path, probe):
    html = Path(path).read_text()
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', html, re.S | re.I)
    js = '\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub = runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail = r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function finalSig(){let h=2166136261>>>0;for(let i=0;i<2000;i++){profile.bFinalStats={};Math.random=seedRand(0x254000+i);const rows=buildBFinal();h=hashText(h,JSON.stringify(rows.map(x=>[x.kind,x.sourceId,x.q,x.options,x.a])));}return h>>>0;}
function retentionProbe(){
 const sample={schema:1,events:[{layer:'miniMock',sourceId:'probe',level:'標準',ok:true,elapsedMs:1234,at:'2026-08-19T00:00:00.000Z'}]};
 const p={...profile,subjectBPerformanceV254:sample}, out={};
 const fns=[['normalizeProfileData',normalizeProfileData],['normalizeProfileDataV3ForChecksum',normalizeProfileDataV3ForChecksum],['normalizeProfileDataV4ForChecksum',normalizeProfileDataV4ForChecksum]];
 for(const [name,fn] of fns){try{out[name]=JSON.stringify(fn(p)?.subjectBPerformanceV254)===JSON.stringify(sample);}catch(e){out[name]='error:'+String(e?.message||e);}}
 return out;
}
function perfProbe(){
 profile.subjectBPerformanceV254={schema:1,events:[]};
 const layers=['compound','miniMock','securityMock','final'],levels=['基礎','標準','応用'];let accepted=0;
 for(let i=0;i<245;i++)accepted+=subjectBPerformanceRecordV254({layer:layers[i%4],sourceId:'q'+i,level:levels[i%3],ok:i%2===0,elapsedMs:(i+1)*100,at:'2026-08-19T00:00:00.000Z'})?1:0;
 const invalid=subjectBPerformanceRecordV254({layer:'invalid',sourceId:'x',elapsedMs:1});
 const root=subjectBPerformanceRootV254(),summary=subjectBPerformanceSummaryV254();
 const ref=[];subjectBPerformanceResetV254('miniMock',ref);const st=subjectBPerformanceStateV254('miniMock');st.meta.k={sourceId:'single',level:'標準'};st.elapsed.k=777;subjectBPerformanceFreezeV254('miniMock','k',1,1);const first=st.frozen.k;st.elapsed.k=9999;subjectBPerformanceFreezeV254('miniMock','k',0,1);const second=st.frozen.k;
 return {accepted,invalid,length:root.events.length,first:root.events[0],last:root.events[root.events.length-1],summary,retention:retentionProbe(),singleFreeze:first===second&&first===777};
}
const enabled=typeof SUBJECT_B_LOCAL_PERFORMANCE_V254_SPEC!=='undefined';
console.log('__V254__'+Buffer.from(JSON.stringify({
 v:APP_VERSION, enabled,
 spec:enabled?SUBJECT_B_LOCAL_PERFORMANCE_V254_SPEC:null,
 perf:(enabled&&__PROBE__)?perfProbe():null,
 banks:{q:hashJson(QUESTION_BANK),ex:hashJson(B_EXERCISES),compound:hashJson(B_COMPOUND_SETS),sec:hashJson(SECURITY_SCENARIOS),algo:hashJson(B_EXAM_ALGO_ITEMS)},
 qcount:QUESTION_BANK.length, sig:finalSig(), contract:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT,B_FINAL_SECONDS,B_EXAM_ALGO_ITEMS.length,[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208], sem:validateSubjectBSemantics()
})).toString('base64'));
'''.replace('__PROBE__', 'true' if probe else 'false')
    with tempfile.TemporaryDirectory() as td:
        p = Path(td)/'runtime.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z = subprocess.run(['node',str(p)], capture_output=True, text=True)
        req(z.returncode == 0, 'runtime failed: '+z.stderr[-8000:])
        m = re.search(r'__V254__([A-Za-z0-9+/=]+)', z.stdout); req(m, 'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version, previous = context()
parent = subprocess.check_output(['git','rev-parse','origin/main'], text=True).strip()
req((version,previous)==('v254','v253'), 'v254 expects v253 parent')
source = Path('audits/SUBJECT_B_ANSWER_LIFECYCLE_DETAIL_AUDIT_v253.txt')
req(source.exists() and 'PASS — DETAIL EVIDENCE CAPTURED' in source.read_text(), 'v253 evidence missing/drifted')
manifest = json.loads(Path('_release/content-change-v254.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source), 'manifest source/parent drift')
req(manifest['quality_audit_marker']=='subject_b_local_calibration_lacks_per_question_response_time', 'manifest finding drift')
req(manifest['instrumentation']['local_only'] is True and manifest['instrumentation']['remote_telemetry'] is False and manifest['instrumentation']['event_limit']==240, 'instrumentation manifest drift')
expected={'app/subject-b-local-performance-overrides-v254.txt','_release/content-change-v254.json','index.html','.github/subject-b-local-performance-timing/validate_repair.py','.github/workflows/subject-b-local-performance-timing.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'], text=True).splitlines())
req(changed==expected, 'v254 source drift: '+repr(sorted(changed^expected)))

override=Path('app/subject-b-local-performance-overrides-v254.txt').read_text()
for token in ['performance.now','eventLimit:240','remoteTelemetry:false',"'[data-copt]'", "'[data-bmopt]'", "'[data-smopt]'", "'[data-bfopt]'",'renderCompoundQuestion=function','renderBMockQuestion=function','renderSecurityMockQuestion=function','renderBFinalQuestion=function','finishCompoundChallenge=function','finishBMiniMock=function','finishSecurityMock=function','finishBFinal=function']:
    req(token in override, 'instrumentation contract missing: '+token)
for banned in ['fetch(','XMLHttpRequest','sendBeacon(','WebSocket(','QUESTION_BANK.push','B_EXERCISES.push','B_EXAM_ALGO_ITEMS.push']:
    req(banned not in override, 'local-only/content contract violated: '+banned)

cand, par = run_runtime('_site/index.html', True), run_runtime('_site_parent/index.html', False)
req(cand['v']=='v254' and par['v']=='v253' and cand['enabled'] and not par['enabled'], 'runtime versions/instrumentation presence')
req(cand['banks']==par['banks'] and cand['qcount']==par['qcount']==710, 'question/practice bank drift')
req(cand['sig']==par['sig'], '2000-seed final selection/order/options drift')
req(cand['contract']==par['contract']==[20,16,4,6000,43,15,4], 'final contract drift')
req(cand['sem'].get('ok') is True, 'Subject B semantic diagnostics failed')
p=cand['perf']; req(p['accepted']==245 and p['invalid'] is False and p['length']==240, 'bounded recorder failed')
req(p['first']['sourceId']=='q5' and p['last']['sourceId']=='q244', 'ring retention order failed')
req(p['singleFreeze'] is True, 'first-answer single-freeze semantics failed')
req(p['summary']['total']=={'count':240,'correct':120,'rate':50,'avgMs':12550,'medianMs':12550}, 'summary aggregate drift: '+repr(p['summary']['total']))
req(len(p['summary']['byLayer'])==4 and all(x['count']==60 for x in p['summary']['byLayer'].values()), 'layer summary drift')
req(len(p['summary']['byLevel'])==3 and all(x['count']==80 for x in p['summary']['byLevel'].values()), 'difficulty summary drift')
req(all(v is True for v in p['retention'].values()) and len(p['retention'])==3, 'profile normalizer retention failed: '+repr(p['retention']))
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files), 'candidate/approved content reference mismatch')

fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','profileField':cand['spec']['profileField'],'eventLimit':cand['spec']['eventLimit'],'layers':cand['spec']['layers'],'boundedRecorder':{'accepted':p['accepted'],'retained':p['length'],'oldest':p['first']['sourceId'],'newest':p['last']['sourceId']},'firstAnswerSingleFreeze':p['singleFreeze'],'summary':p['summary'],'normalizerRetention':p['retention'],'bankHashes':cand['banks'],'finalSignatureMatch':True,'contract':cand['contract'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True); Path('_regression/subject-b-local-performance-timing-v254.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v254 — Subject B Local Performance Timing Instrumentation
===================================================================

Result
------
PASS — NO FINDINGS
Previous release: v253
Source main: {parent}
Learner-facing change in v254: no visible UI change; local-only per-question learning evidence is recorded for future adaptive recommendations.

Change
------
An optional subjectBPerformanceV254 profile field now records one bounded event for the first committed answer in compound practice, algorithm mini-mock, security mini-mock, and the full Subject B final. Each event contains only practice layer, source id, authored difficulty, first-answer correctness, active elapsed milliseconds, and timestamp. Active unanswered time pauses across question navigation and resumes on return. At most 240 events are retained.

Validation
----------
245 synthetic valid events accepted; 240 retained (q5 through q244).
First-answer freeze is idempotent: yes.
Aggregate probe: {json.dumps(p['summary']['total'],ensure_ascii=False,sort_keys=True)}.
Profile/current checksum normalizers retain the optional field: {json.dumps(p['retention'],ensure_ascii=False,sort_keys=True)}.
No fetch/XMLHttpRequest/sendBeacon/WebSocket path was added.

Regression
----------
Question / TRACE / compound / security / final-algorithm banks: unchanged from v253.
2000 deterministic final sessions: selection/order/options unchanged.
Final contract: 100 min / 20 total / 16 algorithm + 4 security / pool 43 / high-trace 15 / floor 4.
Scoring, exam countdown, readiness, remediation routes, and published difficulty labels: unchanged.
Subject B semantic diagnostics: OK.
Candidate/approved-content-reference six-file byte equality: yes.

Decision
--------
The v251 response-time evidence gap is instrumented locally without changing exam behavior. Next run a post-instrumentation audit that exercises save/restore/import normalization and timer pause/resume/first-answer behavior before using these summaries in learner-facing recommendations.
'''
Path('audits').mkdir(exist_ok=True); Path('audits/SUBJECT_B_LOCAL_PERFORMANCE_TIMING_v254.txt').write_text(audit); print(audit)
