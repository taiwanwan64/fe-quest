from pathlib import Path
import base64, hashlib, json, os, re, runpy, subprocess, tempfile

V='v340'; P='v339'

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'first-run-experience-(v(\d+))',b); req(m is not None,'bad v340 branch '+b)
    v=m.group(1); p=f'v{int(m.group(2))-1}'; req((v,p)==(V,P),'expects v340/v339'); return b

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function safe(fn){try{return {ok:true,value:fn()};}catch(e){return {ok:false,error:String(e&&e.stack||e)};}}
function hash(v){return require('crypto').createHash('sha256').update(JSON.stringify(v)).digest('hex');}
function compact(t){return t?{type:t.type||null,title:t.title||null,minutes:Number(t.minutes)||0,bmode:t.bmode||null,bid:t.bid||null,lessonId:t.lessonId||null}:null;}
function futureDate(days){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const baseline={
 plan:safe(()=>buildTodayTasks().map(compact)),
 qHash:safe(()=>hash(QUESTION_BANK)),
 bHash:safe(()=>hash([B_EXERCISES,SECURITY_SCENARIOS,B_EXAM_ALGO_ITEMS,B_COMPOUND_SETS])),
 schema:safe(()=>({profile:Object.keys(profile||{}).sort(),settings:Object.keys(profile?.settings||{}).sort(),questions:QUESTION_BANK.length})),
 sem:safe(()=>validateSubjectBSemantics())
};
const v340=safe(()=>{
 if(typeof firstRunNeedsSetupV340!=='function')return {available:false};
 const original=JSON.parse(JSON.stringify(profile));
 const fresh=firstRunNeedsSetupV340();
 const freshHistory=firstRunHasLearningHistoryV340();
 const spec=globalThis.FIRST_RUN_EXPERIENCE_V340_SPEC||null;
 profile.settings=profile.settings||{};
 profile.settings.studyMinutes=45;
 profile.settings.examDate=futureDate(365);
 profile.settings.autoPace=true;
 const configuredNeed=firstRunNeedsSetupV340();
 const configuredTasks=ensureTodayPlanSnapshot(true).map(compact);
 const effective=effectiveStudyMinutes();
 const configuredTotal=configuredTasks.reduce((s,t)=>s+t.minutes,0);
 const configuredSettings={studyMinutes:profile.settings.studyMinutes,examDate:profile.settings.examDate,autoPace:profile.settings.autoPace};
 Object.keys(profile).forEach(k=>delete profile[k]);Object.assign(profile,JSON.parse(JSON.stringify(original)));
 profile.settings.examDate='';profile.xp=5;
 const existingNeed=firstRunNeedsSetupV340();
 Object.keys(profile).forEach(k=>delete profile[k]);Object.assign(profile,original);
 return {available:true,fresh,freshHistory,spec,configuredNeed,configuredTasks,effective,configuredTotal,configuredSettings,existingNeed};
});
console.log('__V340__'+Buffer.from(JSON.stringify({v:APP_VERSION,baseline,v340,contracts:globalThis.FEQUEST_RUNTIME_CONTRACTS||{count:0}})).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'runtime.js'; p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-16000:])
        m=re.search(r'__V340__([A-Za-z0-9+/=]+)',z.stdout); req(m is not None,'v340 marker missing')
        return json.loads(base64.b64decode(m.group(1)))

branch=context(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
expected={
 '.github/first-run-experience/discover_v340.py',
 '.github/first-run-experience/validate_v340.py',
 '.github/first-run-experience/finalize_plan_v340.py',
 '.github/workflows/first-run-experience-v340.yml',
 'app/first-run-experience-v340.txt',
 'index.html'
}
allowed=expected|{'manifest.webmanifest','sw.js','FE_QUEST_DEVELOPMENT_PLAN.md','audits/V340_FIRST_RUN_DISCOVERY.json','audits/FIRST_RUN_EXPERIENCE_v340.md','_regression/first-run-experience-v340.fixture.json'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(expected<=changed,'missing v340 source '+repr(sorted(expected-changed)))
req(changed<=allowed,'unexpected v340 drift '+repr(sorted(changed-allowed)))

cand=runtime('_site/index.html'); par=runtime('_site_parent/index.html')
req(cand['v']==V and par['v']==P,'versions')
for k in ('plan','qHash','bHash','schema'):
    req(cand['baseline'][k]==par['baseline'][k],'baseline behavior/content drift '+k)
req(cand['baseline']['schema']['value']['questions']==710,'question count drift')
req(cand['baseline']['sem']['ok'] and cand['baseline']['sem']['value'].get('ok') is True,'Subject B semantics')
req((cand.get('contracts') or {}).get('count',0)==0,'runtime contract failures')

x=cand['v340']; req(x['ok'],'v340 probe failed '+str(x.get('error'))); x=x['value']
req(x.get('available') is True,'v340 API missing')
req(x.get('fresh') is True and x.get('freshHistory') is False,'fresh learner must need setup')
req(x.get('configuredNeed') is False,'configured learner still flagged first-run')
req(x.get('existingNeed') is False,'existing learner must not be interrupted')
req(x.get('configuredSettings',{}).get('studyMinutes')==45,'study minutes setup')
req(bool(x.get('configuredSettings',{}).get('examDate')),'exam date setup')
req(x.get('configuredSettings',{}).get('autoPace') is True,'auto pace setup')
req(len(x.get('configuredTasks') or [])>0,'configured plan not actionable')
req(x.get('configuredTotal')==x.get('effective'),'configured plan does not match effective minutes')
spec=x.get('spec') or {}; req(spec.get('profileSchemaChanged') is False and spec.get('adaptivePlannerChanged') is False and spec.get('existingLearnerRouteChanged') is False,'v340 scope contract')
req(spec.get('minutePresets')==[30,45,60,90],'minute presets contract')

src=Path('app/first-run-experience-v340.txt').read_text()
for token in ['firstRunExamDateV340','firstRunCreatePlanV340','firstRunStartV340','今日の計画を作る','学習した結果','ensureTodayPlanSnapshot(true)','saveProfile()','home.prepend(root)','@media(max-width:720px)']:
    req(token in src,'v340 UI source token missing '+token)
req('refreshProfileUI=function' not in src and 'renderHome=function' not in src,'v340 must not add permanent core renderer wrapper')
req(src.count('FIRST_RUN_EXPERIENCE_V340_SPEC')>=2,'v340 spec export')
idx=Path('index.html').read_text(); req(idx.count('app/first-run-experience-v340.txt')==1,'v340 include count')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/f).read_bytes()==(Path('_site_reference')/f).read_bytes() for f in files),'approved reference mismatch')

summary={
 'freshLearnerPrompted':True,
 'configuredLearnerPrompted':False,
 'existingLearnerPrompted':False,
 'minutePresets':[30,45,60,90],
 'configuredPlanActionable':True,
 'configuredPlanMinutesMatchEffectiveMinutes':True,
 'questionCount':710,
 'questionBankHashUnchanged':True,
 'subjectBContentHashUnchanged':True,
 'adaptivePlannerBaselineUnchanged':True,
 'profileSchemaChanged':False,
 'subjectBSemanticOK':True,
 'coreRendererWrapperAdded':False,
 'mobileBreakpointContract':'720px'
}
fixture={'name':'first-run-experience-v340','version':V,'previous':P,'parentMainSha':parent,'result':'PASS — FIRST-RUN SETTINGS PRODUCE AN ACTIONABLE ADAPTIVE PLAN WITHOUT DISTURBING EXISTING LEARNERS','summary':summary,'probe':x}
Path('_regression').mkdir(exist_ok=True);Path('_regression/first-run-experience-v340.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n')
report=f'''# FE QUEST v340 — First-run experience validation\n\nResult: **{fixture['result']}**\n\n- fresh / zero-history / examDate未設定: 初回設定を表示\n- 試験日設定済み: 初回設定を表示しない\n- 学習履歴あり: 初回設定を表示しない\n- 設定項目: 受験予定日 + 1日30/45/60/90分\n- 設定後: 既存 `ensureTodayPlanSnapshot(true)` で今日の計画を再生成\n- 生成計画の合計分数: `effectiveStudyMinutes()` と一致\n- 既存 `buildTodayTasks()` / QUESTION_BANK / Subject B content: v339と不変\n- 科目A: 710問維持\n- profile schema: 変更なし\n- Subject B semantics: OK\n- `refreshProfileUI` / `renderHome` への新しい恒久wrapper: なし\n- iPhone向け: 720px以下で1列フォーム、48〜52pxの操作高を確保\n\n初回カードはホームの通常フロー先頭へ挿入し、固定ヘッダーや下部ナビの位置を奪わない。設定後は既存の適応学習ロジックそのものを使い、試験日・学習時間・進捗に基づく今日の計画と理由をその場で表示する。\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/FIRST_RUN_EXPERIENCE_v340.md').write_text(report);print(report)
