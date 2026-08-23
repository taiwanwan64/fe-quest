from pathlib import Path
import base64,hashlib,json,re,runpy,shutil,subprocess,tempfile,sys

sys.path.insert(0,str(Path('.github/release').resolve()))
from split_release_common import materialize_tree,req,sha_bytes,V343_ADAPTIVE_PRECISION_SOURCE,cloud_runtime_assets

TARGET='v343';PREVIOUS='v342'
source_index=Path('index.html').read_bytes();source_sw=Path('sw.js').read_bytes();source_js=Path('assets/app-v342.js').read_bytes()
feature_path=Path(V343_ADAPTIVE_PRECISION_SOURCE);feature=feature_path.read_text();feature_b=feature_path.read_bytes()
cases=[]
def record(name,ok):
    cases.append({'name':name,'pass':bool(ok)});req(ok,name)

record('production starts on v342',b'base-shell-v342.html' in source_index and b"APP_VERSION = 'v342'" in source_sw)
record('feature source declares schema-free confidence policy','no-schema-change' in feature and 'PROFILE_SCHEMA_VERSION' not in feature)
record('feature source avoids wrapper chaining','__baseRecommendedPrescription' not in feature and 'recommendedPrescription = ' not in feature)
record('feature source replaces recommendedPrescription as a named function',feature.count('function recommendedPrescription()')==1)
record('feature source exports pure decision helper','function subjectAPrescriptionDecisionV343' in feature)
record('feature source requires repeated reason evidence','minDistinctReasonQuestions:2' in feature)
record('feature source requires timed sample evidence','minTimedAnswers:5' in feature)

with tempfile.TemporaryDirectory() as td:
    root=Path(td)/'repo';root.mkdir()
    for rel in ['index.html','manifest.webmanifest','sw.js']:
        shutil.copy2(rel,root/rel)
    for directory in ['app','assets','cloud','vendor']:
        shutil.copytree(directory,root/directory)
    result=materialize_tree(root,TARGET,PREVIOUS);p=result['files']
    record('v343 materializes from v342',result['already_materialized'] is False)
    js=p['js'].read_text();shell=p['shell'].read_text();sw=p['sw'].read_text();manifest=json.loads(p['asset_manifest'].read_text())
    record('generated app advances to v343',"const APP_VERSION = 'v343';" in js and "const APP_VERSION = 'v342';" not in js)
    record('adaptive precision is injected exactly once',js.count('const V343_ADAPTIVE_PRECISION_SPEC=')==1)
    record('recommendedPrescription remains a single named implementation',js.count('function recommendedPrescription()')==1)
    record('generated app keeps profile schema v5',"const PROFILE_SCHEMA_VERSION = 5;" in js and 'PROFILE_SCHEMA_VERSION = 6' not in js)
    record('generated shell keeps cloud activation once',shell.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
    record('generated service worker keeps cloud runtime exactly once',all(sw.count(f"'{rel}'")==1 for rel in cloud_runtime_assets(TARGET)))
    adaptive=manifest.get('adaptivePrecision') or {}
    record('asset manifest records adaptive source identity',adaptive.get('version')=='v343' and adaptive.get('sourcePath')==V343_ADAPTIVE_PRECISION_SOURCE and adaptive.get('utf8Bytes')==len(feature_b) and adaptive.get('sha256')==sha_bytes(feature_b) and adaptive.get('profileSchemaChange') is False)
    record('cloud activation metadata remains enabled',(manifest.get('cloudActivation') or {}).get('defaultConfigEnabled') is True)

    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
const __gSafe=f=>{try{return {ok:true,value:f()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};
const __decision=(top,e)=>subjectAPrescriptionDecisionV343(top,e);
const __top=(accuracy=60,repeats=0)=>({cat:'ネットワーク',priority:70,accuracy,repeats});
const __scenarios={
 sparseReason:__decision(__top(60,0),{reason:'計算ミス',reasonSupport:1,recentReasonSupport:1,reasonConfident:false,timedAnswers:2,avgSeconds:70,timingConfident:false}),
 repeatedCalc:__decision(__top(60,0),{reason:'計算ミス',reasonSupport:2,recentReasonSupport:2,reasonConfident:true,timedAnswers:4,avgSeconds:70,timingConfident:false}),
 slowButCorrect:__decision(__top(100,0),{reason:null,reasonSupport:0,recentReasonSupport:0,reasonConfident:false,timedAnswers:8,avgSeconds:140,timingConfident:true}),
 oneTimeShortageCorroborated:__decision(__top(60,0),{reason:'時間不足',reasonSupport:1,recentReasonSupport:1,reasonConfident:false,timedAnswers:8,avgSeconds:140,timingConfident:true}),
 repeatedShortageButFast:__decision(__top(60,0),{reason:'時間不足',reasonSupport:2,recentReasonSupport:2,reasonConfident:true,timedAnswers:8,avgSeconds:70,timingConfident:true}),
 repeatErrors:__decision(__top(60,2),{reason:'読み違い',reasonSupport:1,recentReasonSupport:1,reasonConfident:false,timedAnswers:3,avgSeconds:70,timingConfident:false})
};
const __evidence=__gSafe(()=>{
  ensureQuestionProfile();
  profile.qStats={};profile.mockMistakeStats={};
  const ids=weakQuestionIdsForCat('ネットワーク').slice(0,4);
  if(ids.length<4)throw new Error('not enough network questions for evidence fixture');
  profile.qStats[ids[0]]={attempts:2,correct:1,lastReason:'計算ミス',last:localDateISO(0),avgSeconds:80,timedAnswers:2};
  profile.qStats[ids[1]]={attempts:2,correct:1,lastReason:'計算ミス',last:localDateISO(0),avgSeconds:90,timedAnswers:2};
  profile.qStats[ids[2]]={attempts:1,correct:0,lastReason:'読み違い',last:localDateISO(0),avgSeconds:100,timedAnswers:1};
  profile.qStats[ids[3]]={attempts:1,correct:1,lastReason:null,last:localDateISO(0),avgSeconds:70,timedAnswers:1};
  return subjectAAdaptiveEvidenceV343('ネットワーク');
});
const __result={
 version:APP_VERSION,
 profileSchema:PROFILE_SCHEMA_VERSION,
 questionCount:QUESTION_BANK.length,
 answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),
 cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length),
 subjectB:__gSafe(()=>validateSubjectBSemantics()),
 firstRun:__gSafe(()=>firstRunNeedsSetupV340()),
 self:__gSafe(()=>({ok:FEQUEST_SELF_CHECK?.ok,current:FEQUEST_SELF_CHECK?.currentContract,browser:FEQUEST_SELF_CHECK?.browserUiContract,releaseVersion:FEQUEST_SELF_CHECK?.releaseVersion})),
 contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0},
 scenarios:__scenarios,
 evidence:__evidence
};
console.log('__V343_ADAPTIVE_GUARD__'+Buffer.from(JSON.stringify(__result)).toString('base64'));
'''
    runtime_path=root/'runtime-v343-adaptive.js';runtime_path.write_text(stub+'\n'+js+'\n'+tail)
    z=subprocess.run(['node','--check',str(runtime_path)],capture_output=True,text=True);record('generated v343 passes Node syntax',z.returncode==0)
    z=subprocess.run(['node',str(runtime_path)],capture_output=True,text=True);record('generated v343 executes in runtime stub',z.returncode==0)
    marker=re.search(r'__V343_ADAPTIVE_GUARD__([A-Za-z0-9+/=]+)',z.stdout);record('runtime emits adaptive validation marker',marker is not None)
    runtime=json.loads(base64.b64decode(marker.group(1)))
    record('question bank remains 710',runtime['questionCount']==710)
    record('answer distribution remains balanced',runtime['answerDistribution']==[178,178,177,177])
    record('cognitive distribution remains calibrated',runtime['cognitiveDistribution']==[166,323,221])
    record('Subject B semantics remain valid',runtime['subjectB']['ok'] and runtime['subjectB']['value'].get('ok') is True)
    record('fresh first-run remains valid',runtime['firstRun']['ok'] and runtime['firstRun']['value'] is True)
    record('runtime contracts remain zero',(runtime.get('contracts') or {}).get('count',0)==0)
    record('self check remains healthy',runtime['self']['ok'] and runtime['self']['value']['ok'] is True and runtime['self']['value']['current'].get('passed')==71 and runtime['self']['value']['browser'].get('total')==23)
    record('runtime reports target v343',runtime['self']['value'].get('releaseVersion')=='v343')
    record('profile schema remains v5',runtime['profileSchema']==5)
    sc=runtime['scenarios']
    record('one sparse reason cannot overfit prescription',sc['sparseReason']['kind']=='knowledge' and sc['sparseReason']['evidenceConfidence']=='insufficient')
    record('repeated recent calculation reason selects calculation drill',sc['repeatedCalc']['kind']=='calc' and sc['repeatedCalc']['evidenceConfidence']=='reason-repeated')
    record('slow but correct does not force speed drill',sc['slowButCorrect']['kind']=='knowledge')
    record('one time-shortage reason needs measured corroboration',sc['oneTimeShortageCorroborated']['kind']=='speed' and sc['oneTimeShortageCorroborated']['evidenceConfidence']=='reason-time-corroborated')
    record('self-reported time shortage contradicted by fast timing does not force speed',sc['repeatedShortageButFast']['kind']=='knowledge')
    record('repeated errors remain primary when reason confidence is weak',sc['repeatErrors']['kind']=='repeat')
    ev=runtime['evidence'];record('real helper aggregates distinct recent reason evidence',ev['ok'] and ev['value']['reason']=='計算ミス' and ev['value']['reasonSupport']==2 and ev['value']['recentReasonSupport']==2 and ev['value']['reasonConfident'] is True)
    record('real helper aggregates existing timed answer fields',ev['value']['timedAnswers']>=6 and ev['value']['timingConfident'] is True)

record('simulation leaves production v342 source untouched',Path('index.html').read_bytes()==source_index and Path('sw.js').read_bytes()==source_sw and Path('assets/app-v342.js').read_bytes()==source_js)
record('production root remains v342',b'base-shell-v342.html' in Path('index.html').read_bytes())
req(all(x['pass'] for x in cases),'adaptive confidence validation failed')
report={'name':'v343-adaptive-confidence-guard','result':'PASS','caseCount':len(cases),'productionVersion':'v342','targetVersion':'v343','profileSchema':5,'validatedCases':[x['name'] for x in cases]}
Path('_regression/v343-adaptive-confidence-guard.fixture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
Path('audits/V343_ADAPTIVE_CONFIDENCE_GUARD.md').write_text(f'''# FE QUEST v343 — Adaptive evidence confidence guard\n\nResult: **PASS — {len(cases)} / {len(cases)} ADAPTIVE-CONFIDENCE CASES PASS**\n\nThe first v343 precision change is schema-free and conservative. It reuses existing Subject A per-question reason/timing evidence, requires repeated/recent reason support for reason-specific prescriptions, requires measured timing plus weak accuracy to corroborate a single `時間不足` report, preserves repeated-error priority, and does not allow slow-but-correct timing alone to force speed practice.\n\nProduction remains v342 during this validation.\n''')
print(f'PASS — {len(cases)}/{len(cases)} V343 ADAPTIVE CONFIDENCE CASES PASS')
