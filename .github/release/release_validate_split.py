from pathlib import Path
from html.parser import HTMLParser
import base64,hashlib,json,re,runpy,subprocess,tempfile
from split_release_common import release_context,req,sha_bytes,ident,transform_shell,transform_js

branch,version,number,previous=release_context()
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
fixture=Path(f'_regression/release-tooling-cadence-{version}.fixture.json')
audit=Path(f'audits/RELEASE_TOOLING_CADENCE_AUDIT_{version}.txt')
req(fixture.exists() and audit.exists(),'split materialization evidence missing')

release_files=[
 'index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png',
 f'assets/app-{version}.css',f'assets/app-{version}.js',f'assets/asset-manifest-{version}.json'
]
for rel in release_files:
    a=Path('_site')/rel;b=Path('_site_reference')/rel
    req(a.exists() and b.exists(),'release file missing '+rel)
    req(a.read_bytes()==b.read_bytes(),'split tooling/reference output differs '+rel)

src_index=Path('index.html').read_text()
req(src_index==f'---\n---\n{{% include_relative app/base-shell-{version}.html %}}\n','root split include drift')
for rel in [f'app/base-shell-{version}.html',f'assets/app-{version}.css',f'assets/app-{version}.js',f'assets/asset-manifest-{version}.json']:
    req(Path(rel).exists(),'target split source missing '+rel)

# Approved transform identity against previous main split release.
prev_shell=subprocess.check_output(['git','show',parent+f':app/base-shell-{previous}.html']).decode()
prev_css=subprocess.check_output(['git','show',parent+f':assets/app-{previous}.css'])
prev_js=subprocess.check_output(['git','show',parent+f':assets/app-{previous}.js']).decode()
req(Path(f'app/base-shell-{version}.html').read_text()==transform_shell(prev_shell,previous,version),'target shell differs from approved transform')
req(Path(f'assets/app-{version}.css').read_bytes()==prev_css,'mechanical CSS changed')
req(Path(f'assets/app-{version}.js').read_text()==transform_js(prev_js,previous,version),'target JS differs from approved transform contract')

manifest=json.loads(Path(f'assets/asset-manifest-{version}.json').read_text())
req(manifest.get('version')==version and manifest.get('previousVersion')==previous,'asset manifest version chain')
for item in manifest.get('assets',[]):
    p=Path(item['path']);b=p.read_bytes();req(len(b)==item['utf8Bytes'] and sha_bytes(b)==item['sha256'],'asset manifest identity '+item['path'])
exec_contract=manifest.get('executionContract') or {}
req(exec_contract.get('scriptType')=='classic' and exec_contract.get('assetRecoveryBootstrap') is True and exec_contract.get('recoveryMutatesLearningData') is False,'asset execution contract')

prod=Path('_site/index.html').read_text();js=Path(f'_site/assets/app-{version}.js').read_text();css=Path(f'_site/assets/app-{version}.css').read_bytes()
req(f'<title>FE QUEST PWA {version}</title>' in prod,'built split title')
req(f'./assets/app-{version}.css' in prod and f'./assets/app-{version}.js' in prod,'built asset refs')
req(f'FEQUEST_ASSET_RECOVERY_{version.upper()}_START' in prod,'built recovery bootstrap')
req("const APP_VERSION = '"+version+"';" in js,'external JS target version')
if version=='v342':
    safari_selector='#firstRunExperienceV340 input[type=date]{width:auto;inline-size:auto;min-width:0;min-inline-size:0;max-width:100%;max-inline-size:100%;display:block;box-sizing:border-box;-webkit-min-logical-width:0;justify-self:stretch;align-self:stretch;overflow:hidden;min-height:46px;'
    req(safari_selector in js,'v342 Safari first-run date sizing hotfix')
    date_decl=js[js.index('#firstRunExperienceV340 input[type=date]{')+len('#firstRunExperienceV340 input[type=date]{'):]
    date_decl=date_decl[:date_decl.index('}')]
    date_parts={x.strip() for x in date_decl.split(';') if x.strip()}
    req('width:100%' not in date_parts and 'inline-size:100%' not in date_parts,'v342 Safari date control must not force percentage width')
    req('-webkit-appearance:none' not in date_parts and 'appearance:none' not in date_parts,'v342 Safari date control must preserve native appearance')
req(len(css)>200000 and len(js.encode())>3000000,'split payload size regression')
inline_app=[x for x in re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',prod,re.S|re.I) if x.strip()]
req(len(inline_app)==1 and 'fequestAssetRecovery' in inline_app[0],'only recovery bootstrap may remain inline')

mweb=json.loads(Path('_site/manifest.webmanifest').read_text());req(mweb.get('name')==f'FE QUEST {version}','web manifest target version')
sw=Path('_site/sw.js').read_text()
for token in [f"const APP_VERSION = '{version}';",f'fe-quest-{version}-1',f"'./assets/app-{version}.css'",f"'./assets/app-{version}.js'",f"'./assets/asset-manifest-{version}.json'",'GET_VERSION','networkWithTimeout','staleWhileRevalidate']:
    req(token in sw,'service worker split contract '+token)
req(not Path('_site/_regression').exists(),'regression deployed')
req(not Path('_site/.github').exists(),'release tooling deployed')

class Dom(HTMLParser):
    def __init__(self):super().__init__();self.ids=set();self.classes=[]
    def handle_starttag(self,t,a):
        d=dict(a)
        if d.get('id'):self.ids.add(d['id'])
        self.classes+=d.get('class','').split()
d=Dom();d.feed(prod)
ids_req=['home','map','weak','problems','plan','coverage','mock','lesson','trace','settingsBtn','bMockResultList','startDiagnostic','installCard','pwaHealthCard','aiDrawer','aiFab','aiBackdrop','toast','offlinePill','planFocusCard','planDetailsToggle','analyticsDetailsToggle','weakTopAction','rightDailyAction','rightDailyProgress','quizSubmit','subjectBNextCard','subjectBProgressStrip','bTraceNextCard','secNextCard','bPracticeNextCard']
req(all(x in d.ids for x in ids_req),'required split DOM ids')

stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
tail=f'''
const __srSafe=f=>{{try{{return {{ok:true,value:f()}}}}catch(e){{return {{ok:false,error:String(e&&e.stack||e)}}}}}};
const __sr={{
 version:APP_VERSION,
 self:__srSafe(()=>({{ok:FEQUEST_SELF_CHECK?.ok,current:FEQUEST_SELF_CHECK?.currentContract,browser:FEQUEST_SELF_CHECK?.browserUiContract,releaseVersion:FEQUEST_SELF_CHECK?.releaseVersion,releaseAdapter:FEQUEST_SELF_CHECK?.releaseAdapter}})),
 questionCount:QUESTION_BANK.length,
 answerDistribution:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),
 cognitiveDistribution:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length),
 subjectB:__srSafe(()=>validateSubjectBSemantics()),
 today:__srSafe(()=>buildTodayTasks().map(t=>({{type:t.type||null,title:t.title||null,minutes:Number(t.minutes)||0}}))),
 firstRun:__srSafe(()=>firstRunNeedsSetupV340()),
 contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{{count:0}}
}};
console.log('__SPLIT_RELEASE__'+Buffer.from(JSON.stringify(__sr)).toString('base64'));
'''
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'runtime.js';p.write_text(stub+'\n'+js+'\n'+tail)
    z=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);req(z.returncode==0,'split Node syntax '+z.stderr[-5000:])
    z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'split Node runtime '+z.stderr[-10000:])
    mm=re.search(r'__SPLIT_RELEASE__([A-Za-z0-9+/=]+)',z.stdout);req(mm is not None,'split runtime marker')
    runtime=json.loads(base64.b64decode(mm.group(1)))
req(runtime['version']==version,'runtime version')
req(runtime['questionCount']==710,'question count')
req(runtime['answerDistribution']==[178,178,177,177],'answer distribution')
req(runtime['cognitiveDistribution']==[166,323,221],'cognitive distribution')
req(runtime['subjectB']['ok'] and runtime['subjectB']['value'].get('ok') is True,'Subject B semantics')
req(runtime['today']['ok'] and len(runtime['today']['value'])>0,'adaptive daily plan')
req(runtime['firstRun']['ok'] and runtime['firstRun']['value'] is True,'fresh first-run contract')
req((runtime.get('contracts') or {}).get('count',0)==0,'runtime contract failures')
selfv=runtime['self'];req(selfv['ok'] and selfv['value']['ok'] is True,'self check')
req(selfv['value']['current'].get('total')==71 and selfv['value']['current'].get('passed')==71,'current contract 71')
req(selfv['value']['browser'].get('total')==23,'browser contract 23')
req(selfv['value']['releaseVersion']==version and selfv['value']['releaseAdapter']==f'runV{number}SelfCheck','release adapter')

fx=json.loads(fixture.read_text())
fx['validation']={
 'status':'passed','candidate_reference_release_file_equality':True,
 'splitHtml':ident('_site/index.html'),'externalCss':ident(f'_site/assets/app-{version}.css'),'externalJs':ident(f'_site/assets/app-{version}.js'),
 'mechanicalCssByteIdenticalToPrevious':True,'approvedJsTransformContract':True,'v342SafariFirstRunDateSizing':version=='v342','mechanicalShellOnlyVersionedDistributionRefsChanged':True,
 'questionCount':710,'answerDistribution':[178,178,177,177],'cognitiveDistribution':[166,323,221],
 'currentContract':'71/71','browserUiContract':23,'subjectBSemantics':True,'runtimeContractFailures':0,'freshFirstRunPreserved':True
}
fixture.write_text(json.dumps(fx,ensure_ascii=False,indent=2)+'\n')
audit.write_text(audit.read_text().replace('pending real Jekyll candidate/reference + external-JS runtime validation','PASSED real Jekyll candidate/reference + external-JS runtime validation')+f'''\nValidated\n---------\nCandidate/reference release files: byte equal\nQuestion bank: 710; answers 178/178/177/177; cognitive 166/323/221\nCurrent contract: 71/71; browser UI contract: 23\nSubject B semantics: OK; runtime contract failures: 0\nFresh first-run contract: preserved\nApproved JS transform: APP_VERSION plus v342 Safari date-input sizing correction without percentage width\nSplit assets: service-worker precached; recovery bootstrap non-destructive\n''')
print(f'FEQUEST_SPLIT_RELEASE_VALIDATION_OK version={version} previous={previous} questions=710 current=71/71 browser=23')
