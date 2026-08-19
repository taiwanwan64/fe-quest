from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-final-security-rotation-repair-(v(\d+))',branch)
    req(m,'bad Subject B final security rotation repair branch')
    version=m.group(1)
    return version,f'v{int(m.group(2))-1}'


def runtime(path):
    html=Path(path).read_text()
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I)
    js='\n'.join(s for s in scripts if s.strip() and not s.lstrip().startswith('{'))
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function seedRand(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function hashText(h,s){for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function hashJson(v){return hashText(2166136261>>>0,JSON.stringify(v))>>>0;}
function mark(items,day){
  for(const item of items){
    const key=item.kind==='security'?`sec:${item.sourceId}`:`algo:${item.sourceId}`;
    const st=profile.bFinalStats[key]||(profile.bFinalStats[key]={seen:0,correct:0,lastSeen:null});
    st.seen=(st.seen||0)+1;st.lastSeen=`2026-11-${String(day).padStart(2,'0')}`;
  }
}
function sec(items){
  const rows=items.filter(x=>x.kind==='security');
  return {count:rows.length,logs:rows.filter(x=>!!x.log).length,cases:rows.filter(x=>!x.log).length,ids:rows.map(x=>x.sourceId),unique:new Set(rows.map(x=>x.sourceId)).size};
}
function firstSig(n){
  let h=2166136261>>>0,quotaOK=true,blockOK=true;
  for(let i=0;i<n;i++){
    profile.bFinalStats={};Math.random=seedRand((0x239100+i)>>>0);
    const items=buildBFinal(),s=sec(items);
    quotaOK=quotaOK&&s.logs===2&&s.cases===2&&s.count===4&&s.unique===4;
    blockOK=blockOK&&items.slice(0,16).every(x=>x.kind==='algo')&&items.slice(16).every(x=>x.kind==='security');
    h=hashText(h,JSON.stringify(items.map(x=>({kind:x.kind,sourceId:x.sourceId,q:x.q,options:x.options,a:x.a,format:x.format}))));
  }
  return {hash:h>>>0,quotaOK,blockOK};
}
function synthetic(seed){
  profile.bFinalStats={};
  B_EXAM_ALGO_ITEMS.forEach((e,i)=>profile.bFinalStats[`algo:${e.id}`]={seen:(i+seed)%4,correct:0,lastSeen:null});
  SECURITY_SCENARIOS.forEach((s,i)=>profile.bFinalStats[`sec:${s.id}`]={seen:((i+seed)%5===0?0:1+((i+seed)%2)),correct:0,lastSeen:null});
}
function algoSig(n){
  let h=2166136261>>>0;
  for(let i=0;i<n;i++){
    synthetic(i);Math.random=seedRand((0x239900+i)>>>0);
    const rows=buildBFinal().filter(x=>x.kind==='algo');
    h=hashText(h,JSON.stringify(rows.map(x=>({sourceId:x.sourceId,q:x.q,options:x.options,a:x.a,domain:x.domain,level:x.level}))));
  }
  return h>>>0;
}
function cohort(seed,sessions=6){
  profile.bFinalStats={};const seen=new Set(),rows=[];
  for(let s=0;s<sessions;s++){
    Math.random=seedRand((seed+s*104729)>>>0);
    const items=buildBFinal(),q=sec(items);
    q.ids.forEach(id=>seen.add(id));
    rows.push({coverage:seen.size,logs:q.logs,cases:q.cases,ids:q.ids,unique:q.unique,block:items.slice(0,16).every(x=>x.kind==='algo')&&items.slice(16).every(x=>x.kind==='security')});
    mark(items,s+1);
  }
  return rows;
}
function rotation(){
  const cs=[];for(let i=0;i<100;i++)cs.push(cohort((0x239d00+i)>>>0,6));
  const vals=(session,key)=>cs.map(c=>c[session][key]);
  return {
    all15By4:cs.filter(c=>c[3].coverage===SECURITY_SCENARIOS.length).length,
    all15By5:cs.filter(c=>c[4].coverage===SECURITY_SCENARIOS.length).length,
    all15By6:cs.filter(c=>c[5].coverage===SECURITY_SCENARIOS.length).length,
    coverageAfter5:{min:Math.min(...vals(4,'coverage')),max:Math.max(...vals(4,'coverage'))},
    quotasValid:cs.every(c=>c.every(r=>r.logs>=1&&r.logs<=3&&r.cases>=1&&r.cases<=3&&r.logs+r.cases===4)),
    uniqueValid:cs.every(c=>c.every(r=>r.unique===4)),
    blockValid:cs.every(c=>c.every(r=>r.block)),
    example:cs[0]
  };
}
function allSeen(){
  profile.bFinalStats={};SECURITY_SCENARIOS.forEach(s=>profile.bFinalStats[`sec:${s.id}`]={seen:2,correct:0,lastSeen:null});
  let ok=true;for(let i=0;i<100;i++){Math.random=seedRand((0x239f00+i)>>>0);const q=sec(buildBFinal());ok=ok&&q.logs===2&&q.cases===2;}return ok;
}
function readOnly(){synthetic(7);const b=JSON.stringify(profile.bFinalStats);Math.random=seedRand(0x239abc);buildBFinal();return b===JSON.stringify(profile.bFinalStats);}
function remediation(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const a=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),s=SECURITY_SCENARIOS.map(makeFinalSecurity);
  return {
    algorithm:a.length,security:s.length,
    algoBad:a.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId),
    secBad:s.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId)
  };
}
const inventory={total:SECURITY_SCENARIOS.length,logs:SECURITY_SCENARIOS.filter(s=>!!s.log).length,cases:SECURITY_SCENARIOS.filter(s=>!s.log).length,ids:SECURITY_SCENARIOS.map(s=>s.id)};
console.log('__V239__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,spec:globalThis.SUBJECT_B_FINAL_SECURITY_ROTATION_V239_SPEC||null,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,pool:B_EXAM_ALGO_ITEMS.length,
  highCount:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])].length,floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  inventory,bankHashes:{questions:hashJson(QUESTION_BANK),exercises:hashJson(B_EXERCISES),security:hashJson(SECURITY_SCENARIOS),finalAlgo:hashJson(B_EXAM_ALGO_ITEMS)},
  first:firstSig(500),algoHistory:algoSig(500),rotation:rotation(),allSeenDefault:allSeen(),buildReadOnly:readOnly(),remediation:remediation(),sem:validateSubjectBSemantics()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-7000:])
        m=re.search(r'__V239__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v239' and previous=='v238','v239 repair expects v238 parent')
source=Path('audits/SUBJECT_B_FINAL_SECURITY_ROTATION_DIAGNOSIS_AUDIT_v238.txt')
req(source.exists(),'v238 diagnosis audit missing')
st=source.read_text()
req('PASS — DIAGNOSIS RECORDED' in st and 'All 15 covered by session 5: 0 / 100' in st,'v238 diagnosis evidence drift')
manifest=json.loads(Path('_release/content-change-v239.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'manifest parent/source drift')
req(manifest['source_priority_tier']=='medium' and manifest['quality_audit_marker']=='subject_b_final_security_long_run_coverage_gap','manifest finding drift')
req(manifest['content_files']==['app/subject-b-final-security-rotation-overrides-v239.txt'] and manifest['assembly_files']==['index.html'],'manifest file scope drift')
expected={'app/subject-b-final-security-rotation-overrides-v239.txt','_release/content-change-v239.json','index.html','.github/subject-b-final-security-rotation-repair/validate_repair.py','.github/workflows/subject-b-final-security-rotation-repair.yml'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v239 source drift: '+repr(sorted(changed^expected)))
override=Path('app/subject-b-final-security-rotation-overrides-v239.txt').read_text()
req('const before=buildBFinal' in override and 'pickSecurityForFinal(logs,q.logs,used)' in override and 'pickSecurityForFinal(cases,q.cases,used)' in override,'adaptive rebuild contract missing')
req('saveProfile' not in override and 'profile.bFinalStats[' not in override,'repair must not persist new state')
req('minPerType:1' in override and 'maxPerType:3' in override,'1+3 boundary missing')

cand=runtime('_site/index.html');par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['counts']==[20,16,4] and cand['seconds']==6000 and cand['pool']==43 and cand['highCount']==15 and cand['floor']==4,'final contract drift')
req(cand['bankHashes']==par['bankHashes'],'content bank drift')
req(cand['inventory']==par['inventory'] and cand['inventory']['total']==15,'security inventory drift')
req(sorted([cand['inventory']['logs'],cand['inventory']['cases']])==[4,11],'security subpool inventory drift')
req(cand['first']==par['first'],'first-final behavior must be exactly unchanged')
req(cand['first']['quotaOK'] and cand['first']['blockOK'],'first-final 2+2/block contract')
req(cand['algoHistory']==par['algoHistory'],'algorithm selection/order/options drift under history')
req(par['rotation']['all15By5']==0,'parent v238 gap not reproduced')
req(cand['rotation']['all15By5']==100 and cand['rotation']['coverageAfter5']=={'min':15,'max':15},'v239 did not close five-session coverage gap')
req(cand['rotation']['quotasValid'] and cand['rotation']['uniqueValid'] and cand['rotation']['blockValid'],'adaptive security structural contract')
req(cand['allSeenDefault'] is True,'2+2 default must return after all scenarios seen')
req(cand['buildReadOnly'] is True,'buildBFinal must not mutate exposure history')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
req(cand['remediation']['algorithm']==43 and not cand['remediation']['algoBad'],'algorithm remediation drift')
req(cand['remediation']['security']==15 and not cand['remediation']['secBad'],'security remediation drift')
spec=cand.get('spec') or {}
req(spec.get('findingResolved')=='subject_b_final_security_long_run_coverage_gap' and spec.get('firstFinalPreserved') is True,'v239 spec drift')
req(spec.get('algorithmSelectionChanged') is False and spec.get('algorithmOrderChanged') is False and spec.get('scoringChanged') is False and spec.get('timingChanged') is False,'preservation spec drift')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference byte mismatch')

fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — NO FINDINGS','findingResolved':'subject_b_final_security_long_run_coverage_gap','inventory':cand['inventory'],'parentAll15By5':par['rotation']['all15By5'],'candidateAll15By5':cand['rotation']['all15By5'],'candidateAll15By4':cand['rotation']['all15By4'],'candidateAll15By6':cand['rotation']['all15By6'],'firstFinalExactSignatureMatch':cand['first']==par['first'],'algorithmHistorySignatureMatch':cand['algoHistory']==par['algoHistory'],'adaptiveQuotasValid':cand['rotation']['quotasValid'],'allSeenRestores2Plus2':cand['allSeenDefault'],'buildReadOnly':cand['buildReadOnly'],'finalContracts':{'counts':cand['counts'],'seconds':cand['seconds'],'algorithmPool':cand['pool'],'highTraceCount':cand['highCount'],'highTraceFloor':cand['floor']},'remediation':cand['remediation'],'semanticOK':True,'candidateReferenceSixFileByteEquality':True,'example':cand['rotation']['example']}
Path('_regression/subject-b-final-security-rotation-repair-v239.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path('audits/SUBJECT_B_FINAL_SECURITY_ROTATION_REPAIR_v239.txt').write_text(f'''FE QUEST v239 — Subject B Final Security Rotation Repair\n=========================================================\n\nResult\n------\nPASS — NO FINDINGS\nPrevious release: v238\nSource main: {parent}\nResolved finding: subject_b_final_security_long_run_coverage_gap\nLearner-facing change: final security scenario rotation after exposure history only\n\nDiagnosis confirmed\n-------------------\nSecurity inventory: {cand['inventory']['total']} scenarios = log-reading {cand['inventory']['logs']} / case-judgment {cand['inventory']['cases']}.\nThe fixed 2+2 boundary gives only ten slots to the eleven-item side in five finals, so v238 reproduced incomplete 15-scenario coverage after five sessions.\n\nRepair\n------\nThe first final is exactly unchanged: 2 log-reading + 2 case-judgment, with 500 deterministic full-item signatures identical to v238.\nAfter history exists and unseen scenarios remain, v239 rebuilds only the four security slots as 1+3, 2+2 or 3+1 to maximize unseen-scenario coverage while retaining at least one item from each format.\nOnce all fifteen scenarios have been seen, selection returns to the existing 2+2 boundary. No new profile field or persistence write is introduced.\n\nCoverage\n--------\nv238 all 15 seen by final 5: {par['rotation']['all15By5']} / 100 cohorts\nv239 all 15 seen by final 4: {cand['rotation']['all15By4']} / 100 cohorts\nv239 all 15 seen by final 5: {cand['rotation']['all15By5']} / 100 cohorts\nv239 all 15 seen by final 6: {cand['rotation']['all15By6']} / 100 cohorts\nEvery simulated final: four unique security scenarios, one to three log-reading items, one to three case-judgment items, algorithm block first, security block last.\n\nPreservation\n------------\nAlgorithm history signature vs v238 (500 deterministic histories): identical.\nQuestion/security/algorithm content-bank fingerprints: identical.\nFinal contract: 100 min / 20 total / 16 algorithm + 4 security / algorithm pool 43 / high-trace inventory 15 / floor 4.\nAlgorithm remediation: {cand['remediation']['algorithm']}/43 valid. Security remediation: {cand['remediation']['security']}/15 valid.\nScoring, correct answers, difficulty labels, readiness threshold, remediation targets and profile schema: unchanged.\nSubject B semantic diagnostics: OK.\nCandidate/reference six-file byte equality: yes.\n\nDecision\n--------\nv239 closes the v237-v238 security long-run coverage finding with a narrow history-aware security rebuild. Next release should audit repeated-final learner flow after the adaptive boundary, especially adjacent repetition and whether the temporary 1+3 mix remains pedagogically natural.\n''')
print('PASS — FE QUEST v239 Subject B final security rotation repair validated')
print(json.dumps(fixture,ensure_ascii=False))
