from pathlib import Path
import base64,json,re,runpy,shutil,subprocess,tempfile,sys

sys.path.insert(0,str(Path('.github/release').resolve()))
from split_release_common import materialize_tree,cloud_runtime_assets,req,sha_bytes

TARGET='v343';PREVIOUS='v342'
EXPECTED_CLOUD=[x[2:] for x in cloud_runtime_assets(TARGET)]
SAFARI_SELECTOR='#firstRunExperienceV340 input[type=date]{width:auto;inline-size:auto;min-width:0;min-inline-size:0;max-width:100%;max-inline-size:100%;display:block;box-sizing:border-box;-webkit-min-logical-width:0;justify-self:stretch;align-self:stretch;overflow:hidden;min-height:46px;'

cases=[]
def record(name,condition):
    cases.append({'name':name,'pass':bool(condition)})
    req(condition,name)

source_index=Path('index.html').read_bytes();source_sw=Path('sw.js').read_bytes()
record('production source starts on v342 before simulation',b'base-shell-v342.html' in source_index and b"APP_VERSION = 'v342'" in source_sw)
record('post-v342 cloud runtime set remains available to v343',len(EXPECTED_CLOUD)==15)

with tempfile.TemporaryDirectory() as td:
    root=Path(td)/'repo';root.mkdir()
    for rel in ['index.html','manifest.webmanifest','sw.js']:
        shutil.copy2(rel,root/rel)
    for directory in ['app','assets','cloud','vendor']:
        shutil.copytree(directory,root/directory)
    result=materialize_tree(root,TARGET,PREVIOUS)
    p=result['files']
    record('v343 simulation materializes from v342',result['already_materialized'] is False)
    shell=p['shell'].read_text();js=p['js'].read_text();sw=p['sw'].read_text();manifest=json.loads(p['asset_manifest'].read_text())
    app_tag='<script src="./assets/app-v343.js"></script>'
    activation_tag='<script src="./cloud/activation-loader-v342.js"></script>'
    record('v343 shell retains one cloud activation loader after core app',shell.count(activation_tag)==1 and shell.index(app_tag)<shell.index(activation_tag))
    record('v343 application version advances',"const APP_VERSION = 'v343';" in js and "const APP_VERSION = 'v342';" not in js)
    record('v343 Safari date correction is inherited',SAFARI_SELECTOR in js)
    date_decl=js[js.index('#firstRunExperienceV340 input[type=date]{')+len('#firstRunExperienceV340 input[type=date]{'):]
    date_decl=date_decl[:date_decl.index('}')];parts={x.strip() for x in date_decl.split(';') if x.strip()}
    record('v343 Safari date control does not regress to percentage width','width:100%' not in parts and 'inline-size:100%' not in parts)
    cloud=manifest.get('cloudActivation') or {};execution=manifest.get('executionContract') or {}
    record('v343 asset manifest retains cloud activation metadata',execution.get('applicationScriptTagCount')==2 and execution.get('cloudActivationFailOpen') is True and cloud.get('precache')==EXPECTED_CLOUD)
    record('v343 cloud config remains enabled at canonical redirect',cloud.get('defaultConfigEnabled') is True and cloud.get('configuredRedirectTo')=='https://taiwanwan64.github.io/fe-quest/')
    identities={x['path']:x for x in cloud.get('assets',[])}
    identity_ok=True
    for rel in EXPECTED_CLOUD:
        b=(root/rel).read_bytes();item=identities.get(rel) or {}
        identity_ok=identity_ok and item.get('utf8Bytes')==len(b) and item.get('sha256')==sha_bytes(b)
    record('v343 cloud asset identities match inherited runtime bytes',identity_ok)
    record('v343 service worker advances cache version',"const APP_VERSION = 'v343';" in sw and "fe-quest-v343-1" in sw)
    record('v343 service worker keeps every cloud runtime asset exactly once',all(sw.count(f"'./{rel}'")==1 for rel in EXPECTED_CLOUD))
    record('v343 service worker keeps offline behavior',all(x in sw for x in ['GET_VERSION','networkWithTimeout','staleWhileRevalidate',"request.headers.has('range')"]))

    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail='''\nconst __cSafe=f=>{try{return {ok:true,value:f()}}catch(e){return {ok:false,error:String(e&&e.stack||e)}}};\nconst __c={\n version:APP_VERSION,\n self:__cSafe(()=>({ok:FEQUEST_SELF_CHECK?.ok,current:FEQUEST_SELF_CHECK?.currentContract,browser:FEQUEST_SELF_CHECK?.browserUiContract,releaseVersion:FEQUEST_SELF_CHECK?.releaseVersion,releaseAdapter:FEQUEST_SELF_CHECK?.releaseAdapter})),\n questionCount:QUESTION_BANK.length,\n answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),\n cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length),\n subjectB:__cSafe(()=>validateSubjectBSemantics()),\n firstRun:__cSafe(()=>firstRunNeedsSetupV340()),\n contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0}\n};\nconsole.log('__V343_CONTINUITY__'+Buffer.from(JSON.stringify(__c)).toString('base64'));\n'''
    runtime_path=root/'runtime-v343.js';runtime_path.write_text(stub+'\n'+js+'\n'+tail)
    z=subprocess.run(['node','--check',str(runtime_path)],capture_output=True,text=True);record('v343 transformed runtime passes Node syntax',z.returncode==0)
    z=subprocess.run(['node',str(runtime_path)],capture_output=True,text=True);record('v343 transformed runtime executes',z.returncode==0)
    m=re.search(r'__V343_CONTINUITY__([A-Za-z0-9+/=]+)',z.stdout);record('v343 runtime emits continuity evidence',m is not None)
    runtime=json.loads(base64.b64decode(m.group(1)))
    record('v343 question bank remains 710 with balanced answers',runtime['questionCount']==710 and runtime['answerDistribution']==[178,178,177,177])
    record('v343 cognitive distribution remains calibrated',runtime['cognitiveDistribution']==[166,323,221])
    record('v343 Subject B semantics remain valid',runtime['subjectB']['ok'] and runtime['subjectB']['value'].get('ok') is True)
    record('v343 fresh first-run remains valid',runtime['firstRun']['ok'] and runtime['firstRun']['value'] is True)
    record('v343 runtime contract failures remain zero',(runtime.get('contracts') or {}).get('count',0)==0)
    selfv=runtime['self'];adapter=(selfv.get('value') or {}).get('releaseAdapter')
    record('v343 self-check remains healthy',selfv['ok'] and selfv['value']['ok'] is True and selfv['value']['current'].get('passed')==71 and selfv['value']['browser'].get('total')==23)
    record('v343 self-check reports target release version',selfv['value'].get('releaseVersion')==TARGET)
    record('v343 self-check adapter remains a valid inherited adapter',isinstance(adapter,str) and re.fullmatch(r'runV\d+SelfCheck',adapter) is not None)

record('v343 simulation never mutates production source',Path('index.html').read_bytes()==source_index and Path('sw.js').read_bytes()==source_sw)
record('current production root remains v342 during continuity work',b'base-shell-v342.html' in Path('index.html').read_bytes())
req(all(x['pass'] for x in cases),'v343 continuity regression failed')
report={
  'name':'v343-release-continuity','result':'PASS','caseCount':len(cases),'target':TARGET,'previous':PREVIOUS,
  'cloudAssetCount':len(EXPECTED_CLOUD),'productionVersion':'v342','validatedCases':[x['name'] for x in cases]
}
Path('_regression/v343-release-continuity.fixture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
Path('audits/V343_RELEASE_CONTINUITY.md').write_text(f'''# FE QUEST v343 — Post-v342 release continuity\n\nResult: **PASS — {len(cases)} / {len(cases)} V343 CONTINUITY CASES PASS**\n\n- v343 can be mechanically materialized from the production v342 split release\n- account/cloud activation remains present exactly once in the shell\n- all {len(EXPECTED_CLOUD)} pinned cloud runtime assets remain in the asset manifest and Service Worker precache exactly once\n- canonical production cloud config remains enabled\n- the iOS Safari/WebKit date sizing correction is inherited\n- 710-question, answer-distribution, cognitive-distribution, Subject B, first-run, and runtime contracts remain intact\n- the simulation does not mutate the production v342 source\n''')
print(f'PASS — {len(cases)}/{len(cases)} V343 RELEASE CONTINUITY CASES PASS')
