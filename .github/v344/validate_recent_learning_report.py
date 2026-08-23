from pathlib import Path
import base64,json,re,runpy,shutil,subprocess,tempfile,sys
sys.path.insert(0,str(Path('.github/release').resolve()))
from split_release_common import materialize_tree,req,sha_bytes,V344_LEARNING_OUTCOMES_SOURCE,cloud_runtime_assets

TARGET='v344';PREVIOUS='v343';cases=[]
def rec(name,ok):cases.append({'name':name,'pass':bool(ok)});req(ok,name)
base={x:Path(x).read_bytes() for x in ['index.html','sw.js','assets/app-v343.js','assets/app-v343.css','app/base-shell-v343.html']}
feature=Path(V344_LEARNING_OUTCOMES_SOURCE);fb=feature.read_bytes();ft=feature.read_text()
rec('production is v343',b'base-shell-v343.html' in base['index.html'] and b"APP_VERSION = 'v343'" in base['sw.js'])
rec('feature is schema-free','profileSchemaChange:false' in ft and 'PROFILE_SCHEMA_VERSION' not in ft)
rec('feature uses bounded recorded-answer evidence',"wording:'recorded-answer-windows'" in ft and 'recentN:' in ft and 'previousN:' in ft)
rec('feature keeps one named analytics render',ft.count('function renderLearningAnalytics()')==1 and 'renderLearningAnalytics = ' not in ft)

with tempfile.TemporaryDirectory() as td:
  root=Path(td)/'repo';root.mkdir()
  for rel in ['index.html','manifest.webmanifest','sw.js']:shutil.copy2(rel,root/rel)
  for d in ['app','assets','cloud','vendor']:shutil.copytree(d,root/d)
  r=materialize_tree(root,TARGET,PREVIOUS);p=r['files']
  js=p['js'].read_text();shell=p['shell'].read_text();css=p['css'].read_text();manifest=json.loads(p['asset_manifest'].read_text())
  rec('v344 materializes from v343',not r['already_materialized'])
  rec('generated app is v344',"const APP_VERSION = 'v344';" in js and "const APP_VERSION = 'v343';" not in js)
  rec('report logic injected once',js.count('const V344_LEARNING_OUTCOMES_SPEC=')==1 and js.count('function renderLearningAnalytics()')==1 and js.count('function learningOutcomeReportDecisionV344(')==1)
  rec('profile schema stays v5',"const PROFILE_SCHEMA_VERSION = 5;" in js and 'PROFILE_SCHEMA_VERSION = 6' not in js)
  ids=['analyticsOutcomeReport','analyticsOutcomeActivity','analyticsOutcomeActivityNote','analyticsOutcomeGrowth','analyticsOutcomeGrowthNote','analyticsOutcomeNext','analyticsOutcomeNextNote']
  rec('report markup ids are unique',all(shell.count(f'id="{x}"')==1 for x in ids))
  rec('report precedes action card',shell.index('id="analyticsOutcomeReport"')<shell.index('analytics-priority-card'))
  rec('report discloses evidence boundary','今週と先週の完全な成績比較ではありません' in shell)
  rec('report CSS is unique',css.count('/* ===== v344: bounded learning outcome report ===== */')==1)
  rec('mobile report is one column','@media(max-width:700px){.v344-outcome-grid{grid-template-columns:1fr}' in css)
  rec('cloud activation stays once',shell.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
  rec('cloud precache stays once',all(p['sw'].read_text().count(f"'{x}'")==1 for x in cloud_runtime_assets(TARGET)))
  m=manifest.get('learningOutcomes') or {}
  rec('manifest records feature identity',m.get('sourcePath')==V344_LEARNING_OUTCOMES_SOURCE and m.get('sha256')==sha_bytes(fb) and m.get('utf8Bytes')==len(fb) and m.get('profileSchemaChange') is False)

  stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
  tail=r'''
const __v344S=(c,a,x,m)=>({cat:c,attempts:a,accuracy:x,mastery:m});
const __v344T=(c,d,r,p,rn,pn)=>({cat:c,delta:d,recent:r,previous:p,recentN:rn,previousN:pn,totalRecorded:rn+pn});
const __v344Scenarios={
 pending:learningOutcomeReportDecisionV344({}),
 growth:learningOutcomeReportDecisionV344({sevenMinutes:125,sevenActiveDays:4,trends:[__v344T('ネットワーク',20,80,60,10,4),__v344T('セキュリティ',0,70,70,7,7)],snapshots:[__v344S('ネットワーク',15,70,65),__v344S('セキュリティ',12,55,60)]}),
 small:learningOutcomeReportDecisionV344({trends:[__v344T('データベース',7,77,70,8,6)],snapshots:[__v344S('データベース',9,68,62)]}),
 review:learningOutcomeReportDecisionV344({trends:[__v344T('アルゴリズム',12,72,60,9,5)],snapshots:[__v344S('アルゴリズム',14,50,55)],activeReview:{concept:'スタック',guidance:'後日復習まで進めます。'}})
};
const __v344FirstRun=firstRunNeedsSetupV340();
ensureQuestionProfile();profile.sessions=[{date:'2026-08-23',log:Array.from({length:10},(_,i)=>({cat:'ネットワーク',ok:i<8}))},{date:'2026-08-20',log:Array.from({length:4},(_,i)=>({cat:'ネットワーク',ok:i<2}))}];profile.mockHistory=[];
const __v344RealTrend=analyticsOutcomeTrendV344('ネットワーク');
const __v344Result={version:APP_VERSION,schema:PROFILE_SCHEMA_VERSION,q:QUESTION_BANK.length,a:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),c:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length),b:validateSubjectBSemantics(),first:__v344FirstRun,self:{ok:FEQUEST_SELF_CHECK?.ok,current:FEQUEST_SELF_CHECK?.currentContract,browser:FEQUEST_SELF_CHECK?.browserUiContract,releaseVersion:FEQUEST_SELF_CHECK?.releaseVersion},contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0},sc:__v344Scenarios,rt:__v344RealTrend};
console.log('__V344__'+Buffer.from(JSON.stringify(__v344Result)).toString('base64'));
'''
  rp=root/'runtime.js';rp.write_text(stub+'\n'+js+'\n'+tail)
  z=subprocess.run(['node','--check',str(rp)],capture_output=True,text=True);rec('Node syntax passes',z.returncode==0)
  z=subprocess.run(['node',str(rp)],capture_output=True,text=True);rec('runtime executes',z.returncode==0)
  mm=re.search(r'__V344__([A-Za-z0-9+/=]+)',z.stdout);rec('runtime marker emitted',mm is not None);o=json.loads(base64.b64decode(mm.group(1)))
  rec('question bank remains 710',o['q']==710)
  rec('answer distribution remains balanced',o['a']==[178,178,177,177])
  rec('cognitive distribution remains calibrated',o['c']==[166,323,221])
  rec('Subject B semantics remain valid',o['b'].get('ok') is True)
  rec('fresh first-run remains valid',o['first'] is True)
  rec('runtime contracts remain zero',(o['contracts'] or {}).get('count',0)==0)
  rec('self-check remains healthy',o['self']['ok'] is True and o['self']['current'].get('passed')==71 and o['self']['browser'].get('total')==23 and o['self']['releaseVersion']=='v344')
  rec('runtime schema remains v5',o['schema']==5)
  rec('no evidence stays pending',o['sc']['pending']['growthState']=='pending' and o['sc']['pending']['next']['kind']=='collect')
  rec('meaningful growth keeps exact sample counts',o['sc']['growth']['growthState']=='growth' and o['sc']['growth']['growth']['recentN']==10 and o['sc']['growth']['growth']['previousN']==4)
  rec('weakest attempted category becomes next focus',o['sc']['growth']['next']['cat']=='セキュリティ')
  rec('small rise is not overstated',o['sc']['small']['growthState']=='stable' and o['sc']['small']['growth'] is None)
  rec('active review keeps priority',o['sc']['review']['next']['kind']=='review' and 'スタック' in o['sc']['review']['next']['title'])
  rec('real trend keeps 10 and 4 answer windows',o['rt']['recentN']==10 and o['rt']['previousN']==4 and o['rt']['recent']==80 and o['rt']['previous']==50 and o['rt']['delta']==30)

rec('simulation leaves v343 production untouched',all(Path(k).read_bytes()==v for k,v in base.items()))
rec('production root remains v343',b'base-shell-v343.html' in Path('index.html').read_bytes())
report={'name':'v344-recent-learning-report','result':'PASS','caseCount':len(cases),'productionVersion':'v343','targetVersion':'v344','profileSchema':5,'validatedCases':[x['name'] for x in cases]}
Path('_regression/v344-recent-learning-report.fixture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
Path('audits/V344_RECENT_LEARNING_REPORT.md').write_text(f'# FE QUEST v344 — Recent learning report\n\nResult: **PASS — {len(cases)} / {len(cases)} V344 REPORT CASES PASS**\n\nDisplay-only report using calendar-indexed activity plus bounded recorded-answer windows with exact sample counts. No profile schema or learner-data write change. Production remains v343 during validation.\n')
print(f'PASS — {len(cases)}/{len(cases)} V344 RECENT LEARNING REPORT CASES PASS')
