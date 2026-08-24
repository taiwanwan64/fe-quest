from pathlib import Path
import base64,json,re,runpy,subprocess,tempfile

ROOT=Path('.')
cases=[]

def rec(name,ok):
    cases.append(name)
    if not ok:
        raise AssertionError(name)

index=(ROOT/'index.html').read_text()
sw=(ROOT/'sw.js').read_text()
shell=(ROOT/'app/base-shell-v345.html').read_text()
app=(ROOT/'assets/app-v345.js').read_text()
cloud_ui=(ROOT/'cloud/sync-ui-v342.js').read_text()
privacy=(ROOT/'privacy.html').read_text()
feedback=(ROOT/'.github/ISSUE_TEMPLATE/beta-feedback.md').read_text()
measurement=(ROOT/'docs/BETA_MEASUREMENT_PLAN_v346.md').read_text()
guide_path=ROOT/'docs/EXTERNAL_BETA_DRY_RUN_v347.md'
guide=guide_path.read_text()

# Production/version/data-contract baseline.
rec('production root is v345','{% include_relative app/base-shell-v345.html %}' in index and 'base-shell-v346.html' not in index)
rec('service worker is v345',"const APP_VERSION = 'v345';" in sw and "fe-quest-v345-1" in sw)
rec('profile schema remains v5',"const PROFILE_SCHEMA_VERSION = 5;" in app and 'PROFILE_SCHEMA_VERSION = 6' not in app)

# First-run -> diagnostic -> today path.
rec('home exposes diagnostic CTA','id="startDiagnostic"' in shell and '実力診断を始める' in shell)
rec('home exposes today resume CTA','id="todayResumeBtn"' in shell and '今日の学習を始める' in shell)
rec('first-run gate exists','function firstRunNeedsSetupV340()' in app and 'firstRunHasLearningHistoryV340' in app)
rec('first-run requires exam date',"if(!exam){error.textContent='受験予定日を選ぶと" in app)
rec('first-run rejects past exam date',"if(exam<firstRunDateKeyV340())" in app)
rec('first-run saves selected study minutes','profile.settings.studyMinutes=selected;' in app)
rec('first-run enables auto pace','profile.settings.autoPace=true;' in app)
rec('first-run saves profile before ready state','const saved=saveProfile();' in app and 'if(!saved)' in app)
rec('first-run snapshots today plan','ensureTodayPlanSnapshot(true)' in app)
rec('first-run renders ready plan','renderFirstRunPlanReadyV340(root,tasks);' in app)
rec('diagnostic CTA starts diagnostic flow',"startDiagnosticBtn.addEventListener('click',()=>startDiagnosticFlow(true))" in app)
rec('diagnostic finish returns home',"document.getElementById('diagFinish')?.addEventListener('click',()=>{showScreen('home')" in app)
rec('diagnostic finish continues into today resume',"document.getElementById('todayResumeBtn')?.click()" in app)
rec('today resume selects first incomplete task','const nextTask=tasks.find(t=>!dailyTaskDone(rec,t));' in app)
rec('today resume launches selected task','resume.onclick=()=>launchDailyTask(nextTask);' in app)
rec('right rail uses same next-task launcher','rightAction.onclick=nextTask?()=>launchDailyTask(nextTask):null' in app)
rec('daily task launcher exists','function launchDailyTask(t)' in app)

# Outcome / next-action presentation.
rec('recent learning report exists','id="analyticsOutcomeReport"' in shell and '最近の学習レポート' in shell)
rec('exam pace row exists','id="analyticsOutcomeExamPace"' in shell and '試験までのペース' in shell)
rec('exam pace presentation reuses existing pace status','examPaceOutcomeDecisionV345(examPaceStatus())' in app)
rec('exam pace states not pass probability','合格確率ではありません' in app and 'passProbability:false' in app)
rec('subject B result primary routes remain',shell.count('次の科目Bへ →')>=2)
rec('mock result review primary remains','id="mockStartReview"' in shell and '誤答・見直しを確認 →' in shell)

# Cloud/data safety and beta operations.
rec('cloud sync is optional local-first','ログインしなくても、これまで通りこの端末だけで学習できます。' in cloud_ui)
rec('cloud conflict requires explicit choice','新しい学習履歴を自動で上書きしません。どちらを残すか選んでください。' in cloud_ui)
rec('account deletion remains learner-facing','data-sync-action="delete-account"' in cloud_ui and 'アカウントとクラウド上の学習データを削除しました' in cloud_ui)
rec('privacy policy is current v345 baseline','v345で公開中のローカルファースト学習・任意のクラウド同期・アカウント削除の実装を基準' in privacy)
rec('privacy policy warns against sensitive public reports','認証トークン' in privacy and 'JSONエクスポートの全文' in privacy and '公開Issue' in privacy)
rec('beta feedback template exists','βフィードバック / 不具合報告' in feedback and '学習データへの影響' in feedback)
rec('beta feedback avoids sensitive dumps','認証トークン' in feedback and 'JSONエクスポート全文' in feedback and 'localStorage/IndexedDBの全文' in feedback)
rec('measurement plan avoids silent analytics','自動トラッキングを追加しない' in measurement and '第三者の行動分析SDK' in measurement)
rec('measurement plan covers day 1 3 7 30',all(x in measurement for x in ['1日目','3日目','7日目','30日目']))
rec('measurement plan tests core value','次に何を勉強するかを自分で考える負担が減ったか' in measurement)
rec('dry-run guide exists',guide_path.exists() and '初回設定 → 実力診断 → 今日の学習' in guide)
rec('dry-run guide links production privacy feedback','https://taiwanwan64.github.io/fe-quest/' in guide and 'privacy.html' in guide and 'βフィードバック / 不具合報告' in guide)

common_tracking_tokens=['googletagmanager.com','google-analytics.com','plausible.io','api.mixpanel.com','app.posthog.com','cdn.segment.com','api.amplitude.com']
combined='\n'.join([index,shell,app])
rec('no common third-party analytics endpoints',not any(token in combined for token in common_tracking_tokens))

# Runtime smoke: exercise the decision/plan contracts without changing persisted production files.
stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
tail=r'''
function __src(name){try{const v=eval(name);return typeof v==='function'?String(v):'';}catch(_){return '';}}
const __fresh=firstRunNeedsSetupV340();
ensureQuestionProfile();
const __settings=JSON.parse(JSON.stringify(profile.settings||{}));
profile.settings={...profile.settings,studyMinutes:60,autoPace:true,examDate:localDateISO(30)};
const __dated=firstRunNeedsSetupV340();
let __tasks=[];try{__tasks=buildTodayTasks()||[];}catch(_){__tasks=[];}
const __pace=examPaceOutcomeDecisionV345(examPaceStatus());
const __self=globalThis.FEQUEST_SELF_CHECK||{};
const __contracts=globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0};
const __out={
  version:APP_VERSION,
  schema:PROFILE_SCHEMA_VERSION,
  fresh:__fresh,
  dated:__dated,
  taskCount:Array.isArray(__tasks)?__tasks.length:0,
  taskTypes:Array.isArray(__tasks)?__tasks.map(x=>x&&x.type).filter(Boolean):[],
  pace:__pace,
  sem:validateSubjectBSemantics(),
  self:{ok:__self.ok,current:__self.currentContract,browser:__self.browserUiContract,releaseVersion:__self.releaseVersion},
  contracts:__contracts,
  launchSource:__src('launchDailyTask'),
  renderSource:__src('renderToday')
};
profile.settings=__settings;
console.log('__V347__'+Buffer.from(JSON.stringify(__out)).toString('base64'));
'''
with tempfile.TemporaryDirectory() as td:
    runtime=Path(td)/'runtime.js'
    runtime.write_text(stub+'\n'+app+'\n'+tail)
    z=subprocess.run(['node','--check',str(runtime)],capture_output=True,text=True)
    rec('runtime syntax passes',z.returncode==0)
    z=subprocess.run(['node',str(runtime)],capture_output=True,text=True)
    rec('runtime executes',z.returncode==0)
    m=re.search(r'__V347__([A-Za-z0-9+/=]+)',z.stdout)
    rec('runtime marker emitted',m is not None)
    out=json.loads(base64.b64decode(m.group(1)))

rec('runtime remains v345 schema v5',out['version']=='v345' and out['schema']==5)
rec('runtime fresh first-run is required',out['fresh'] is True)
rec('runtime exam date clears first-run gate',out['dated'] is False)
rec('runtime today plan produces at least one task',out['taskCount']>=1)
rec('runtime daily launcher has guided routes',all(token in out['launchSource'] for token in ['showScreen','startQuiz']))
rec('runtime exam pace is bounded and disclaims pass probability',out['pace'].get('state') in {'pace','complete','taper'} and '合格確率ではありません' in out['pace'].get('detail',''))
rec('runtime subject B semantics remain valid',out['sem'].get('ok') is True)
rec('runtime self-check remains healthy',out['self'].get('ok') is True and out['self'].get('current',{}).get('passed')==71 and out['self'].get('browser',{}).get('total')==23 and out['self'].get('releaseVersion')=='v345')
rec('runtime contracts remain zero',int((out.get('contracts') or {}).get('count',0))==0)

report={
    'name':'v347-beta-journey-dry-run',
    'result':'PASS',
    'productionVersion':'v345',
    'profileSchema':5,
    'caseCount':len(cases),
    'checks':cases,
    'runtimeTaskCount':out['taskCount'],
    'runtimeTaskTypes':out['taskTypes']
}
fixture=ROOT/'_regression/v347-beta-journey-dry-run.fixture.json'
fixture.parent.mkdir(exist_ok=True)
fixture.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f"PASS — {len(cases)}/{len(cases)} V347 BETA JOURNEY DRY-RUN CHECKS PASS; runtime tasks={out['taskCount']}")
