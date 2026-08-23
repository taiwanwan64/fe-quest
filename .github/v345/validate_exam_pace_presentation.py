from pathlib import Path
import base64,json,re,runpy,shutil,subprocess,tempfile,sys
sys.path.insert(0,str(Path('.github/release').resolve()))
from split_release_common import materialize_tree,req,sha_bytes,V345_EXAM_PACE_SOURCE,cloud_runtime_assets

TARGET='v345';PREVIOUS='v344';cases=[]
def rec(name,ok):cases.append({'name':name,'pass':bool(ok)});req(ok,name)
base={x:Path(x).read_bytes() for x in ['index.html','sw.js','assets/app-v344.js','assets/app-v344.css','app/base-shell-v344.html']}
feature=Path(V345_EXAM_PACE_SOURCE);fb=feature.read_bytes();ft=feature.read_text()
rec('production is v344',b'base-shell-v344.html' in base['index.html'] and b"APP_VERSION = 'v344'" in base['sw.js'])
rec('feature is schema-free','profileSchemaChange:false' in ft and 'PROFILE_SCHEMA_VERSION' not in ft)
rec('feature reuses existing exam pace status','examPaceOutcomeDecisionV345(examPaceStatus())' in ft and "evidenceBasis:'existing-exam-pace-status'" in ft)
rec('feature does not represent pass probability','passProbability:false' in ft and '合格確率ではありません' in ft)
rec('feature keeps taper priority','taperPriority:true' in ft and "if(p?.taper)" in ft)
rec('feature avoids wrapper chaining','__base' not in ft and 'renderLearningOutcomeReportV344 = ' not in ft)

with tempfile.TemporaryDirectory() as td:
  root=Path(td)/'repo';root.mkdir()
  for rel in ['index.html','manifest.webmanifest','sw.js']:shutil.copy2(rel,root/rel)
  for d in ['app','assets','cloud','vendor']:shutil.copytree(d,root/d)
  r=materialize_tree(root,TARGET,PREVIOUS);p=r['files']
  js=p['js'].read_text();shell=p['shell'].read_text();css=p['css'].read_text();manifest=json.loads(p['asset_manifest'].read_text())
  rec('v345 materializes from v344',not r['already_materialized'])
  rec('generated app is v345',"const APP_VERSION = 'v345';" in js and "const APP_VERSION = 'v344';" not in js)
  rec('pace logic injected once',js.count('const V345_EXAM_PACE_PRESENTATION_SPEC=')==1 and js.count('function examPaceOutcomeDecisionV345(')==1 and js.count('function renderLearningOutcomeReportV344()')==1)
  rec('existing pace engine remains unique',js.count('function examPaceStatus()')==1 and js.count('function estimateRemainingStudyMinutes()')==1 and js.count('function recentCalendarPace(')==1 and js.count('function renderExamPace()')==1)
  rec('profile schema stays v5',"const PROFILE_SCHEMA_VERSION = 5;" in js and 'PROFILE_SCHEMA_VERSION = 6' not in js)
  ids=['analyticsOutcomeExamPace','analyticsOutcomeExamPaceIcon','analyticsOutcomeExamPaceTitle','analyticsOutcomeExamPaceNote']
  rec('pace markup ids are unique',all(shell.count(f'id="{x}"')==1 for x in ids))
  rec('pace summary stays inside recent report',shell.index('id="analyticsOutcomeReport"')<shell.index('id="analyticsOutcomeExamPace"')<shell.index('v344-outcome-evidence-note'))
  rec('existing report evidence boundary remains','今週と先週の完全な成績比較ではありません' in shell)
  rec('pace CSS is unique',css.count('/* ===== v345: exam pace outcome summary ===== */')==1)
  rec('mobile pace CSS is bounded','@media(max-width:700px){.v345-exam-pace-row' in css)
  rec('Safari date correction remains','width:auto;inline-size:auto;min-width:0;min-inline-size:0;max-width:100%;max-inline-size:100%' in js)
  rec('cloud activation stays once',shell.count('<script src="./cloud/activation-loader-v342.js"></script>')==1)
  rec('cloud precache stays once',all(p['sw'].read_text().count(f"'{x}'")==1 for x in cloud_runtime_assets(TARGET)))
  m=manifest.get('examPacePresentation') or {}
  rec('manifest records feature identity',m.get('sourcePath')==V345_EXAM_PACE_SOURCE and m.get('sha256')==sha_bytes(fb) and m.get('utf8Bytes')==len(fb) and m.get('profileSchemaChange') is False and m.get('passProbability') is False)

  stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
  tail=r'''
const __phase=(name='実力形成期',icon='🧩')=>({name,icon});
const __sc={
 unset:examPaceOutcomeDecisionV345({hasExam:false,baseline:60,effective:60,phase:__phase('通常学習','📘')}),
 expired:examPaceOutcomeDecisionV345({hasExam:true,expired:true,days:-1,baseline:60,effective:60,phase:__phase('受験日経過','📅')}),
 recentGood:examPaceOutcomeDecisionV345({hasExam:true,days:30,baseline:60,effective:60,remaining:900,required:30,currentPace:50,paceSource:'recent',recent:{observedDays:14},status:'good',auto:true,taper:false,phase:__phase('仕上げ期','🎯')}),
 sparseWarn:examPaceOutcomeDecisionV345({hasExam:true,days:20,baseline:60,effective:75,remaining:1400,required:70,currentPace:60,paceSource:'plan',recent:{observedDays:2},status:'warn',auto:true,taper:false,phase:__phase('仕上げ期','🎯')}),
 autoOff:examPaceOutcomeDecisionV345({hasExam:true,days:20,baseline:60,effective:60,remaining:1600,required:80,currentPace:60,paceSource:'plan',recent:{observedDays:2},status:'danger',auto:false,taper:false,phase:__phase('仕上げ期','🎯')}),
 complete:examPaceOutcomeDecisionV345({hasExam:true,days:20,baseline:60,effective:60,remaining:0,required:0,currentPace:60,paceSource:'recent',recent:{observedDays:14},status:'good',auto:true,taper:false,phase:__phase('仕上げ期','🎯')}),
 taperReduced:examPaceOutcomeDecisionV345({hasExam:true,days:3,baseline:60,effective:30,remaining:1200,taper:true,taperCap:30,phase:__phase('仕上がり保護期','🛡️')}),
 taperBelowCap:examPaceOutcomeDecisionV345({hasExam:true,days:7,baseline:30,effective:30,remaining:1200,taper:true,taperCap:45,phase:__phase('直前調整期','🧠')}),
 examDay:examPaceOutcomeDecisionV345({hasExam:true,days:0,baseline:60,effective:10,remaining:1200,taper:true,taperCap:10,phase:__phase('受験当日','☀️')})
};
const __first=firstRunNeedsSetupV340();
ensureQuestionProfile();
const __originalSettings=JSON.parse(JSON.stringify(profile.settings||{}));
profile.settings={...profile.settings,studyMinutes:120,autoPace:true,examDate:localDateISO(7)};
const __actual7=examPaceStatus();
profile.settings.examDate=localDateISO(3);const __actual3=examPaceStatus();
profile.settings.examDate=localDateISO(1);const __actual1=examPaceStatus();
profile.settings.examDate=localDateISO(0);const __actual0=examPaceStatus();
profile.settings=__originalSettings;
const __out={version:APP_VERSION,schema:PROFILE_SCHEMA_VERSION,q:QUESTION_BANK.length,a:[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length),c:['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length),b:validateSubjectBSemantics(),first:__first,self:{ok:FEQUEST_SELF_CHECK?.ok,current:FEQUEST_SELF_CHECK?.currentContract,browser:FEQUEST_SELF_CHECK?.browserUiContract,releaseVersion:FEQUEST_SELF_CHECK?.releaseVersion},contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0},sc:__sc,actual:[__actual7,__actual3,__actual1,__actual0].map(x=>({days:x.days,taper:x.taper,cap:x.taperCap,effective:x.effective,baseline:x.baseline}))};
console.log('__V345__'+Buffer.from(JSON.stringify(__out)).toString('base64'));
'''
  rp=root/'runtime.js';rp.write_text(stub+'\n'+js+'\n'+tail)
  z=subprocess.run(['node','--check',str(rp)],capture_output=True,text=True);rec('Node syntax passes',z.returncode==0)
  z=subprocess.run(['node',str(rp)],capture_output=True,text=True);rec('runtime executes',z.returncode==0)
  mm=re.search(r'__V345__([A-Za-z0-9+/=]+)',z.stdout);rec('runtime marker emitted',mm is not None);o=json.loads(base64.b64decode(mm.group(1)))
  rec('question bank remains 710',o['q']==710)
  rec('answer distribution remains balanced',o['a']==[178,178,177,177])
  rec('cognitive distribution remains calibrated',o['c']==[166,323,221])
  rec('Subject B semantics remain valid',o['b'].get('ok') is True)
  rec('fresh first-run remains valid',o['first'] is True)
  rec('runtime contracts remain zero',(o['contracts'] or {}).get('count',0)==0)
  rec('self-check remains healthy',o['self']['ok'] is True and o['self']['current'].get('passed')==71 and o['self']['browser'].get('total')==23 and o['self']['releaseVersion']=='v345')
  rec('runtime schema remains v5',o['schema']==5)
  sc=o['sc']
  rec('unset exam asks for date without pace claim',sc['unset']['state']=='unset' and '受験日を設定' in sc['unset']['title'])
  rec('expired exam stops pace claim',sc['expired']['state']=='expired' and '更新' in sc['expired']['title'])
  rec('normal recent pace shows required and measured pace',sc['recentGood']['state']=='pace' and '必要30分/日' in sc['recentGood']['title'] and '現在50分/日' in sc['recentGood']['title'] and '直近14日間' in sc['recentGood']['detail'])
  rec('sparse evidence is labelled as configured-value estimate',sc['sparseWarn']['state']=='pace' and '設定中の60分/日' in sc['sparseWarn']['detail'] and '60→75分' in sc['sparseWarn']['detail'])
  rec('auto-off is disclosed',sc['autoOff']['state']=='pace' and '自動調整はOFF' in sc['autoOff']['detail'])
  rec('completed menu avoids fake required pace',sc['complete']['state']=='complete' and '主要メニューは完了済み' in sc['complete']['title'])
  rec('taper reduction overrides catch-up wording',sc['taperReduced']['state']=='taper' and '60→30分/日' in sc['taperReduced']['title'] and '必要' not in sc['taperReduced']['title'] and '全部消化する時期ではありません' in sc['taperReduced']['detail'])
  rec('low configured time is not raised to taper cap',sc['taperBelowCap']['state']=='taper' and sc['taperBelowCap']['title']=='直前調整：30分/日' and '上限45分以内' in sc['taperBelowCap']['detail'])
  rec('exam day stays at ten-minute taper',sc['examDay']['state']=='taper' and '60→10分/日' in sc['examDay']['title'])
  rec('all exam-set summaries disclaim pass probability',all('合格確率ではありません' in sc[k]['detail'] for k in ['recentGood','sparseWarn','autoOff','complete','taperReduced','taperBelowCap','examDay']))
  rec('production taper contract still yields 45/30/15/10',[(x['days'],x['cap'],x['effective']) for x in o['actual']]==[(7,45,45),(3,30,30),(1,15,15),(0,10,10)])

rec('simulation leaves v344 production untouched',all(Path(k).read_bytes()==v for k,v in base.items()))
rec('production root remains v344',b'base-shell-v344.html' in Path('index.html').read_bytes())
report={'name':'v345-exam-pace-presentation','result':'PASS','caseCount':len(cases),'productionVersion':'v344','targetVersion':'v345','profileSchema':5,'validatedCases':[x['name'] for x in cases]}
Path('_regression/v345-exam-pace-presentation.fixture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
Path('audits/V345_EXAM_PACE_PRESENTATION.md').write_text(f'''# FE QUEST v345 — Exam pace presentation

Result: **PASS — {len(cases)} / {len(cases)} V345 EXAM-PACE CASES PASS**

v345 adds one display-only pace summary to the existing recent learning report. It reuses the production `examPaceStatus()` contract rather than creating a second estimator. Outside the final seven days it may show FE QUEST's internal required minutes/day and current pace, while explicitly distinguishing recorded recent pace from a configured-value fallback. Inside the final seven days, the established taper contract wins: 45 / 30 / 15 / 10 minute caps reduce load and the summary does not tell the learner to catch up by consuming all remaining menus.

The pace estimate remains an estimate for completing FE QUEST recommended menus, not pass probability. No profile field, planner mutation, question content, cloud-sync data contract, or recovery behavior is introduced.

Validation preserved the 710-question bank, answer distribution `[178,178,177,177]`, cognitive distribution `[166,323,221]`, Subject B semantics, fresh first-run, current contract 71/71, Browser UI contract 23, runtime contract failures 0, profile schema v5, Safari date-input correction, v342 cloud runtime continuity, and production v344 source bytes.

Production remains **v344** during this candidate validation.
''')
print(f'PASS — {len(cases)}/{len(cases)} V345 EXAM PACE CASES PASS')
