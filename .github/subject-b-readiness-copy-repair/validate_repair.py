from pathlib import Path
import base64, json, os, re, runpy, subprocess, tempfile


def req(ok,msg):
    if not ok:
        raise AssertionError(msg)


def ctx():
    branch=os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-b-readiness-copy-repair-(v(\d+))',branch)
    req(m,'bad Subject B readiness copy repair branch')
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
function selectionSignature(n){let h=2166136261>>>0;for(let i=0;i<n;i++){profile.bFinalStats={};Math.random=seedRand((0x224000+i)>>>0);const a=buildBFinal();h=hashText(h,a.map(x=>`${x.kind}:${x.sourceId}`).join('|'));}return h>>>0;}
function allProgress(items,value){return Object.fromEntries(items.map(x=>[x.id,value]));}
function compoundRows(rates){return rates.map((rate,i)=>({rate,date:`2026-08-${17-i}`,id:`c${i}`,correct:rate>=67?2:rate>=33?1:0,total:3}));}
function baseScenario(){
  profile.settings={...(profile.settings||{}),examDate:''};
  profile.bProgress=allProgress(B_EXERCISES,100);
  profile.securityBProgress=allProgress(SECURITY_SCENARIOS,100);
  profile.bCompoundStats={};
  for(const s of B_COMPOUND_SETS.slice(0,3)) profile.bCompoundStats[s.id]={seen:1,correct:2,lastSeen:'2026-08-17'};
  profile.bMockHistory=[{rate:90,date:'2026-08-17'}];
  profile.securityMockHistory=[{rate:90,date:'2026-08-17'}];
  profile.bCompoundHistory=compoundRows([67,33,100]);
  profile.bFinalHistory=[];
  delete profile.subjectBReadinessV222;
}
function finalRow(rate,algoCorrect,secCorrect,date='2026-08-17'){return {rate,correct:algoCorrect+secCorrect,blank:0,algoCorrect,secCorrect,date,seconds:4200};}
function recSnap(name){const r=subjectBHubRecommendation();return {name,stage:r.stage,mode:r.mode,id:r.id||null,title:r.title,kicker:r.kicker||'',desc:r.desc};}
function integratedProbe(){
  const out=[];
  baseScenario();profile.bCompoundHistory=compoundRows([64,64,64]);out.push(recSnap('prefinal_compound_weak'));
  baseScenario();profile.bFinalHistory=[finalRow(40,4,4)];out.push(recSnap('first_final_compound_target'));
  baseScenario();profile.bFinalHistory=[finalRow(40,4,4)];subjectBHubRecommendation();profile.bCompoundHistory.unshift({rate:67,date:'2026-08-18',id:'new67',correct:2,total:3});out.push(recSnap('first_final_after_one_new_67'));
  baseScenario();profile.bMockHistory=[{rate:64,date:'2026-08-17'}];profile.bCompoundHistory=compoundRows([90,90,90]);out.push(recSnap('prefinal_algorithm_weak'));
  baseScenario();profile.securityMockHistory=[{rate:64,date:'2026-08-17'}];profile.bCompoundHistory=compoundRows([90,90,90]);out.push(recSnap('prefinal_security_weak'));
  return out;
}
function copyProbe(){
  const rows={
    compoundFirst:subjectBReadinessPracticeRecV222({mode:'compound',title:'複合問題',icon:'🧩',rate:56},'firstFinal'),
    compoundPre:subjectBReadinessPracticeRecV222({mode:'compound',title:'複合問題',icon:'🧩',rate:56},'preFinal'),
    algoFirst:subjectBReadinessPracticeRecV222({mode:'miniMock',title:'アルゴリズム ミニ模試',icon:'📝',rate:56},'firstFinal'),
    securityFirst:subjectBReadinessPracticeRecV222({mode:'securityMock',title:'セキュリティ ミニ模試',icon:'🛡️',rate:56},'firstFinal')
  };
  return rows;
}
function remediationCoverage(){
  const ex=new Set(B_EXERCISES.map(x=>x.id)),secIds=new Set(SECURITY_SCENARIOS.map(x=>x.id));
  const algo=B_EXAM_ALGO_ITEMS.map(makeFinalAlgoExam),sec=SECURITY_SCENARIOS.map(makeFinalSecurity);
  const algoBad=algo.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.domain);return t.mode!=='trace'||!ex.has(t.id);}).map(x=>x.sourceId);
  const secBad=sec.filter(x=>{const t=bFinalRemediationTarget(x.studyMode,x.sourceId,x.concept||'情報セキュリティ');return t.mode!=='security'||t.id!==x.sourceId||!secIds.has(t.id);}).map(x=>x.sourceId);
  return {algorithm:algo.length,security:sec.length,algoBad,secBad};
}
console.log('__V224__'+Buffer.from(JSON.stringify({
  v:APP_VERSION,
  counts:[B_FINAL_COUNT,B_FINAL_ALGO_COUNT,B_FINAL_SEC_COUNT],seconds:B_FINAL_SECONDS,
  pool:B_EXAM_ALGO_ITEMS.length,high:[...(globalThis.B_FINAL_HIGH_TRACE_IDS_V208||[])],floor:globalThis.B_FINAL_HIGH_TRACE_FLOOR_V208,
  orderSpec:globalThis.SUBJECT_B_FINAL_ORDER_V214_SPEC||null,recoverySpec:globalThis.SUBJECT_B_FINAL_REMEDIATION_V217_SPEC||null,xpSpec:globalThis.SUBJECT_B_FINAL_XP_V219_SPEC||null,
  readinessSpec:globalThis.SUBJECT_B_READINESS_V222_SPEC||null,copySpec:globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC||null,
  sem:validateSubjectBSemantics(),selectionSig:selectionSignature(500),coverage:remediationCoverage(),copy:copyProbe(),integrated:integratedProbe()
})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'
        p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed: '+z.stderr[-5000:])
        m=re.search(r'__V224__([A-Za-z0-9+/=]+)',z.stdout)
        req(m,'runtime marker missing')
        return html,json.loads(base64.b64decode(m.group(1)))


version,previous=ctx()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
req(version=='v224' and previous=='v223','v224 readiness copy repair expects v223 parent')
source=Path('audits/SUBJECT_B_READINESS_POSTREPAIR_AUDIT_v223.txt')
req(source.exists(),'v223 readiness post-repair evidence missing')
st=source.read_text()
req('PASS — LOW FINDING RECORDED' in st and 'compound_remediation_window_message' in st,'v223 low finding evidence drift')
manifest=json.loads(Path('_release/content-change-v224.json').read_text())
req(manifest['parent_main_sha']==parent and manifest['source_quality_audit']==str(source),'v224 content manifest parent/source drift')
req(manifest['quality_audit_marker']=='compound_remediation_window_message' and manifest['source_priority_tier']=='low','v224 manifest audit marker drift')
req(manifest['content_files']==['app/subject-b-readiness-copy-overrides-v224.txt'] and manifest['assembly_files']==['index.html'],'v224 approved file scope drift')
expected={
  '.github/subject-b-readiness-copy-repair/validate_repair.py',
  '.github/workflows/subject-b-readiness-copy-repair.yml',
  '_release/content-change-v224.json',
  'app/subject-b-readiness-copy-overrides-v224.txt',
  'index.html'
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(changed==expected,'v224 repair source drift: '+repr(sorted(changed^expected)))
for path in ['app/base-stable.html','app/subject-b-final-order-overrides-v214.txt','app/subject-b-final-remediation-overrides-v217.txt','app/subject-b-final-xp-overrides-v219.txt','app/subject-b-readiness-overrides-v222.txt']:
    req(Path(path).read_bytes()==subprocess.check_output(['git','show',parent+':'+path]),'preserved learner-facing source drift: '+path)

html,cand=runtime('_site/index.html')
_,par=runtime('_site_parent/index.html')
req(cand['v']==version and par['v']==previous,'runtime versions')
req(cand['counts']==par['counts']==[20,16,4],'final counts drift')
req(cand['seconds']==par['seconds']==6000,'time limit drift')
req(cand['pool']==par['pool']==43,'algorithm pool drift')
req(cand['high']==par['high'] and len(cand['high'])==15,'high-trace inventory drift')
req(cand['floor']==par['floor']==4,'high-trace floor drift')
req(cand['orderSpec']==par['orderSpec'],'v214 order spec drift')
req(cand['recoverySpec']==par['recoverySpec'],'v217 recovery spec drift')
req(cand['xpSpec']==par['xpSpec'],'v219 XP spec drift')
req(cand['readinessSpec']==par['readinessSpec'],'v222 readiness calculation/spec drift')
req(par['copySpec'] is None,'parent unexpectedly contains v224 copy repair')
spec=cand['copySpec'] or {}
req(spec.get('policy')=='clarify-compound-readiness-copy-with-three-attempt-average','v224 copy policy missing')
req(spec.get('compoundEvidenceWindow')==3 and spec.get('shortPracticeFloor')==65,'v224 copy facts drift')
req(spec.get('changesRecommendationCopyOnly') is True and spec.get('recommendationModeChanged') is False and spec.get('readinessCalculationChanged') is False,'v224 copy-only scope drift')
req(cand['selectionSig']==par['selectionSig'],'500-seed selection/order drift')
req(cand['sem'].get('ok') is True,'Subject B semantic validation failed')
cov=cand['coverage']
req(cov['algorithm']==43 and not cov['algoBad'],'algorithm remediation coverage drift')
req(cov['security']==15 and not cov['secBad'],'security remediation coverage drift')

cc,pc=cand['copy'],par['copy']
for k in ['algoFirst','securityFirst']:
    req(cc[k]==pc[k],k+' copy unexpectedly changed')
for k in ['compoundFirst','compoundPre']:
    req({x:cc[k][x] for x in ['stage','mode','id','title','icon','kicker']}=={x:pc[k][x] for x in ['stage','mode','id','title','icon','kicker']},k+' recommendation structure changed')
req('直近3回の平均正答率' in cc['compoundFirst']['desc'] and '65%以上' in cc['compoundFirst']['desc'],'compound first-final copy not clarified')
req('1回確認' not in cc['compoundFirst']['desc'],'misleading one-attempt copy remains')
req('直近3回の平均正答率は56%' in cc['compoundPre']['desc'] and '65%以上' in cc['compoundPre']['desc'],'compound pre-final copy not clarified')
req(cc['compoundFirst']['desc']!=pc['compoundFirst']['desc'] and cc['compoundPre']['desc']!=pc['compoundPre']['desc'],'compound copy did not change')

CI={x['name']:x for x in cand['integrated']};PI={x['name']:x for x in par['integrated']}
for name in CI:
    req(CI[name]['mode']==PI[name]['mode'] and CI[name]['stage']==PI[name]['stage'] and CI[name]['title']==PI[name]['title'],'recommendation behavior changed: '+name)
req(CI['prefinal_compound_weak']['mode']=='compound' and '直近3回の平均正答率' in CI['prefinal_compound_weak']['desc'],'integrated pre-final compound copy missing')
req(CI['first_final_compound_target']['mode']=='compound' and '直近3回の平均正答率' in CI['first_final_compound_target']['desc'],'integrated first-final compound copy missing')
req(CI['first_final_after_one_new_67']['mode']=='compound' and '直近3回の平均正答率' in CI['first_final_after_one_new_67']['desc'],'rolling-window follow-up copy missing')
req(CI['prefinal_algorithm_weak']['desc']==PI['prefinal_algorithm_weak']['desc'],'algorithm integrated copy changed')
req(CI['prefinal_security_weak']['desc']==PI['prefinal_security_weak']['desc'],'security integrated copy changed')

for token in ['SUBJECT_B_READINESS_COPY_V224_SPEC','const _subjectBReadinessPracticeRecV224=subjectBReadinessPracticeRecV222;','直近3回の平均正答率','globalThis.SUBJECT_B_READINESS_COPY_V224_SPEC=SUBJECT_B_READINESS_COPY_V224_SPEC;']:
    req(token in html,'v224 integration token missing: '+token)
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference six-file mismatch')

fixture={
  'name':f'subject-b-readiness-copy-repair-{version}',
  'version':version,'previous_version':previous,'parent_main_sha':parent,'learner_facing_change':True,
  'resolved_finding':'compound_remediation_window_message','copy_spec':spec,
  'copy_probe':cand['copy'],'integrated_recommendations':cand['integrated'],
  'runtime_preservation':{
    'final_counts':cand['counts'],'time_limit_seconds':cand['seconds'],'algorithm_pool':cand['pool'],
    'high_trace_count':len(cand['high']),'high_trace_floor':cand['floor'],
    'selection_signature_500_seeds_unchanged':True,'readiness_spec_unchanged':True,'semantic_validator_ok':True
  },
  'remediation_coverage':cov,'candidate_reference_six_file_equal':True,
  'findings':{'high':[],'medium':[],'low':[]},'status':'passed-v223-low-resolved'
}
Path(f'_regression/subject-b-readiness-copy-repair-{version}.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
Path(f'audits/SUBJECT_B_READINESS_COPY_REPAIR_{version}.txt').write_text(f'''FE QUEST {version} — Subject B Compound-Readiness Copy Repair
=============================================================================

Result
------
PASS — v223 LOW FINDING RESOLVED
Previous: {previous}
Source main: {parent}
Learner-facing change in {version}: yes
Resolved: compound_remediation_window_message

Repair
------
The readiness calculation is unchanged. Compound readiness still uses the average of the three newest compound attempts and the threshold remains 65%.
Only the learner-facing recommendation copy was clarified. When compound practice is the target, the app now states that the judgment uses the recent three-attempt average instead of implying that one new attempt at 65% is sufficient.
The same evidence wording is used both before the first final practice and after a weak first final routes the learner back to compound practice.

Behavior proof
--------------
The realistic v223 finding scenario remains behaviorally identical: after a 67%, 33%, 100% compound window and a weak first final, one new 67% compound attempt still leaves the rolling three-attempt average below 65%, so compound practice remains recommended.
The v224 difference is explanatory: that recommendation now explicitly says the recent three-attempt average is the criterion.
Algorithm mini-mock and security mini-mock recommendation copy is byte-for-byte behaviorally unchanged in the runtime probes.
Recommendation modes, stage, and titles match v223 for all integrated scenarios.

Preserved contracts
-------------------
500 deterministic final-session seeds matched {previous} selection/order.
100 minutes / 20 questions; algorithm 16 + security 4; algorithm pool 43; high-trace inventory 15 / floor 4.
v214 final order, v217 recovery entry, v219 XP display, and v222 readiness calculation/spec are unchanged.
Algorithm remediation targets valid: 43 / 43. Security remediation targets valid: 15 / 15.
Subject B semantic validation: OK.
Candidate/reference generated six release files byte-identical: yes.

Findings summary
----------------
High: 0
Medium: 0
Low: 0

Decision
--------
The v223 copy/evidence mismatch is resolved. Use v225 for a post-repair learner-flow audit or move to the next Subject B quality frontier; do not expand scope in v224.
''')
print(f'FEQUEST_SUBJECT_B_READINESS_COPY_REPAIR_OK version={version} high=0 medium=0 low=0 selection=500 copy-only=1')
