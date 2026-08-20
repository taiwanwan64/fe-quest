from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'early-use-transition-resimulation-(v(\d+))',b);req(m,'bad v331 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function v331safe(fn){try{return {ok:true,value:fn()};}catch(e){return {ok:false,error:String((e&&e.stack)||e)};}}
function v331compact(t){if(!t)return null;return {type:t.type||null,title:t.title||null,minutes:t.minutes||0,bmode:t.bmode||null,bid:t.bid||null,lessonId:t.lessonId||null};}
function v331plan(){return v331safe(function(){return buildTodayTasks().map(v331compact);});}
function v331daily(){return v331safe(function(){var r=getDailyRecord();var done={};Object.keys(r.done||{}).forEach(function(k){done[k]=!!r.done[k];});return {done:done,doneKeys:Object.keys(done).filter(function(k){return done[k];}),activityCount:(profile.activity||[]).length,sessionCount:(profile.sessions||[]).length,streak:profile.streak,lastStudyDate:profile.lastStudyDate};});}
ensureQuestionProfile();
var freshPlan=v331plan();
var snapshot=v331safe(function(){return ensureTodayPlanSnapshot();});
var snapTasks=(snapshot.ok&&Array.isArray(snapshot.value))?snapshot.value:[];
var snapCompact=snapTasks.map(v331compact);
var initialBTask=null;for(var si=0;si<snapTasks.length;si++){if(snapTasks[si]&&snapTasks[si].type==='subjectB'){initialBTask=snapTasks[si];break;}}
var initialBSlot=v331safe(function(){return initialBTask?dailyTaskSlot(initialBTask):null;});
var lesson=v331safe(function(){return nextLessonChoice();});
var lessonBefore=null,lessonAfter=null,lessonMutation={ok:false,error:'lesson unresolved'};
if(lesson.ok&&lesson.value&&lesson.value.id){lessonBefore=(profile.lessonProgress&&profile.lessonProgress[lesson.value.id])||0;try{activeLesson=lesson.value.id;_completeLessonV65();lessonMutation={ok:true,value:true};}catch(e){lessonMutation={ok:false,error:String((e&&e.stack)||e)};}lessonAfter=(profile.lessonProgress&&profile.lessonProgress[lesson.value.id])||0;}
var nextLesson=v331safe(function(){return nextLessonChoice();});
var reviewQ=v331safe(function(){return trackedQuestionPool()[0];});
var reviewBefore=Object.keys(profile.reviewJourneys||{}).length;
var reviewMutation=(reviewQ.ok&&reviewQ.value)?v331safe(function(){return registerReviewJourney(reviewQ.value,'v331-disposable-resim');}):{ok:false,error:'question unresolved'};
var reviewAfter=Object.keys(profile.reviewJourneys||{}).length;
var reviewDaily=v331safe(function(){return markDailyTask('review',{});});
var bChoice=v331safe(function(){return nextBChoice(20);});
var bItem=v331safe(function(){if(!(bChoice.ok&&bChoice.value&&bChoice.value.id))return null;for(var i=0;i<B_EXERCISES.length;i++){if(B_EXERCISES[i].id===bChoice.value.id)return B_EXERCISES[i];}return null;});
var bId=(bItem.ok&&bItem.value)?bItem.value.id:null;
var bBefore=bId?((profile.bProgress&&profile.bProgress[bId])||0):null;
var bXpBefore=profile.xp||0;
var perfBefore=JSON.stringify(profile.subjectBPerformanceV254||{}).length;
var dailyBefore=v331daily();
var bMutation={ok:false,error:'TRACE route unresolved'};
if(bId){try{currentB=bItem.value;finishBExercise();bMutation={ok:true,value:true};}catch(e){bMutation={ok:false,error:String((e&&e.stack)||e)};}}
var bAfter=bId?((profile.bProgress&&profile.bProgress[bId])||0):null;
var bXpAfter=profile.xp||0;
var perfAfter=JSON.stringify(profile.subjectBPerformanceV254||{}).length;
var dailyAfter=v331daily();
var postBChoice=v331safe(function(){return nextBChoice(20);});
var postPlan=v331plan();
var postBTask=null;if(postPlan.ok&&Array.isArray(postPlan.value)){for(var pi=0;pi<postPlan.value.length;pi++){if(postPlan.value[pi]&&postPlan.value[pi].type==='subjectB'){postBTask=postPlan.value[pi];break;}}}
var state={freshPlan:freshPlan,snapshot:{ok:snapshot.ok,tasks:snapCompact,bTask:v331compact(initialBTask),bSlot:initialBSlot},lesson:{choice:lesson,before:lessonBefore,mutation:lessonMutation,after:lessonAfter,next:nextLesson},review:{questionId:(reviewQ.ok&&reviewQ.value)?reviewQ.value.id:null,before:reviewBefore,mutation:reviewMutation,after:reviewAfter,daily:reviewDaily},subjectB:{choice:bChoice,id:bId,before:bBefore,mutation:bMutation,after:bAfter,xpBefore:bXpBefore,xpAfter:bXpAfter,perfBefore:perfBefore,perfAfter:perfAfter,dailyBefore:dailyBefore,dailyAfter:dailyAfter,postChoice:postBChoice,postTask:postBTask},postPlan:postPlan,semantic:validateSubjectBSemantics()};
console.log('__V331__'+Buffer.from(JSON.stringify({v:APP_VERSION,state:state})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-12000:]);m=re.search(r'__V331__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v331','v330'),'expects v331');parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
p330=Path('_regression/subject-b-trace-progress-contract-audit-v330.fixture.json');req(p330.exists(),'v330 fixture missing');req(json.loads(p330.read_text()).get('result')=='PASS — V329 TRACE TELEMETRY EXPECTATION WAS OUT OF CONTRACT','v330 result')
expected={'.github/early-use-transition-resimulation/validate_audit.py','.github/workflows/early-use-transition-resimulation.yml'};generated={'index.html','manifest.webmanifest','sw.js','_regression/early-use-transition-resimulation-v331.fixture.json','audits/EARLY_USE_TRANSITION_RESIMULATION_v331.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(expected<=changed,'missing source');req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v331' and par['v']=='v330','versions');req(cand['state']['semantic'].get('ok') is True and par['state']['semantic'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
def outcome(x):
    s=x['state'];b=s['subjectB'];return {'freshPlan':s['freshPlan'],'snapshot':s['snapshot'],'lessonId':s['lesson']['choice'].get('value',{}).get('id') if s['lesson']['choice'].get('ok') else None,'lessonBefore':s['lesson']['before'],'lessonMutationOK':s['lesson']['mutation']['ok'],'lessonAfter':s['lesson']['after'],'nextLessonId':s['lesson']['next'].get('value',{}).get('id') if s['lesson']['next'].get('ok') else None,'reviewQuestionId':s['review']['questionId'],'reviewBefore':s['review']['before'],'reviewMutationOK':s['review']['mutation']['ok'],'reviewAfter':s['review']['after'],'reviewDailyValue':s['review']['daily'].get('value'),'bChoice':b['choice'],'bId':b['id'],'bBefore':b['before'],'bMutationOK':b['mutation']['ok'],'bAfter':b['after'],'bXpDelta':b['xpAfter']-b['xpBefore'],'traceTelemetryDelta':b['perfAfter']-b['perfBefore'],'dailyBefore':b['dailyBefore'],'dailyAfter':b['dailyAfter'],'postBChoice':b['postChoice'],'postBTask':b['postTask'],'postPlan':s['postPlan']}
co,po=outcome(cand),outcome(par);req(co==po,'audit-only disposable transition drift')
slot=co['snapshot']['bSlot'].get('value') if co['snapshot']['bSlot'].get('ok') else None
done_after=(co['dailyAfter'].get('value') or {}).get('done',{}) if co['dailyAfter'].get('ok') else {}
bchoice=(co['bChoice'].get('value') or {}) if co['bChoice'].get('ok') else {}
postchoice=(co['postBChoice'].get('value') or {}) if co['postBChoice'].get('ok') else {}
posttask=co['postBTask'] or {}
checks={'freshPlanActionable':co['freshPlan'].get('ok') is True and len(co['freshPlan'].get('value') or [])>0,'todaySnapshotActionable':co['snapshot']['ok'] is True and co['snapshot']['bTask'] is not None,'lessonReached100':co['lessonBefore']==0 and co['lessonMutationOK'] and co['lessonAfter']==100,'lessonAdvanced':bool(co['lessonId']) and bool(co['nextLessonId']) and co['lessonId']!=co['nextLessonId'],'reviewJourneyCreated':co['reviewMutationOK'] and co['reviewAfter']>co['reviewBefore'],'traceRouteResolved':bchoice.get('mode')=='trace' and bool(co['bId']),'traceReached100':co['bBefore']==0 and co['bMutationOK'] and co['bAfter']==100,'traceXpAwarded':co['bXpDelta']>0,'traceTelemetryRemainsSeparate':co['traceTelemetryDelta']==0,'subjectBDailyTaskMarked':bool(slot) and done_after.get(slot) is True,'nextSubjectBRouteAdvanced':bool(postchoice) and not (postchoice.get('mode')=='trace' and postchoice.get('id')==co['bId']),'postPlanActionable':co['postPlan'].get('ok') is True and len(co['postPlan'].get('value') or [])>0,'postPlanAvoidsCompletedTrace':not (posttask.get('bmode')=='trace' and posttask.get('bid')==co['bId'])}
req(all(checks.values()),'early-use real TRACE route check failed '+json.dumps(checks,ensure_ascii=False))
result='PASS — EARLY-USE ROUTES COHERE THROUGH REAL TRACE COMPLETION'
summary={'checks':checks,'outcome':co,'interpretation':'The v329 disposable early-use sequence was re-run after v330 clarified the contracts. This time Subject B uses the learner-facing finishBExercise chain rather than v254 timing telemetry. The first TRACE exercise moves from 0 to 100, awards its normal XP, marks the matching today-plan Subject B slot, leaves v254 timing telemetry untouched, and the next Subject B recommendation no longer points at the completed TRACE item. Lesson and review transitions remain coherent. This is a route/state-continuity test only, not evidence of seven-day retention or exam readiness.','decision':'PROCEED TO NEXT-DAY / MULTI-SESSION CONTINUITY DISCOVERY WITHOUT FABRICATING RETENTION'}
fixture={'version':version,'previous':previous,'parent':parent,'result':result,'summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/early-use-transition-resimulation-v331.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n');summary_text=json.dumps(summary,ensure_ascii=True,indent=2)
audit=f'''FE QUEST v331 — Early-Use Transition Re-simulation\n====================================================\n\nResult\n------\n{result}\nPrevious release: v330\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nRe-run the v329 early-use state transition with the real short-TRACE completion contract established by v330. The simulation uses production lesson, review, today-plan and finishBExercise routes and deliberately does not invent calendar retention or readiness gains.\n\nSummary\n-------\n{summary_text}\n\nRegression\n----------\nCandidate and untouched v330 parent produce the same sanitized disposable-transition outcome.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\n{summary['decision']}\n''';Path('audits').mkdir(exist_ok=True);Path('audits/EARLY_USE_TRANSITION_RESIMULATION_v331.txt').write_text(audit);print(audit)
