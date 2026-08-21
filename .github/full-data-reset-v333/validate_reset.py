from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def context():
    branch=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'full-data-reset-(v(\d+))',branch)
    req(m is not None,'bad full data reset branch')
    version=m.group(1); number=int(m.group(2))
    return version,f'v{number-1}'


def scripts(path):
    html=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))


def runtime(path):
    js=scripts(path)
    stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function fn(name){try{const v=eval(name);return typeof v==='function'?String(v):null}catch(e){return null}}
function value(name){try{return eval(name)}catch(e){return null}}
function withoutMeta(p){const x=structuredClone(p);delete x.profileMeta;return x;}
let smoke=null;
if(typeof resetLearningProfileCandidateV333==='function'){
  const synthetic=structuredClone(profile);
  synthetic.settings={...safeObject(synthetic.settings),__resetSentinelV333:'must-disappear'};
  synthetic.xp=98765;
  synthetic.streak=42;
  const fresh=resetLearningProfileCandidateV333(synthetic);
  const expected=normalizeProfileData(structuredClone(DEFAULT_PROFILE));
  smoke={
    fullProfileMatchesDefault:JSON.stringify(withoutMeta(fresh))===JSON.stringify(withoutMeta(expected)),
    settingsMatchDefault:JSON.stringify(fresh.settings)===JSON.stringify(expected.settings),
    sentinelGone:!Object.prototype.hasOwnProperty.call(safeObject(fresh.settings),'__resetSentinelV333'),
    xpMatchesDefault:fresh.xp===expected.xp,
    streakMatchesDefault:fresh.streak===expected.streak,
    schema:fresh.profileSchemaVersion
  };
}
const out={
  v:APP_VERSION,
  spec:value('LEARNING_DATA_RESET_SPEC_V333'),
  confirmText:value('LEARNING_DATA_RESET_CONFIRM_TEXT_V333'),
  candidateFn:fn('resetLearningProfileCandidateV333'),
  recoveryFn:fn('createPreResetRecoveryPointV333'),
  transientFn:fn('clearTransientLearningStateV333'),
  performFn:fn('performLearningDataResetV333'),
  requestFn:fn('requestLearningDataResetV333'),
  installFn:fn('installLearningDataResetV333'),
  smoke,
  bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.concept,q.difficulty,q.cognitiveLevel,q.q,q.options,q.a,q.exp,q.hint,q.choiceExps]),
  subjectBSemantics:validateSubjectBSemantics()
};
console.log('__V333_RESET__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'runtime.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V333_RESET__([A-Za-z0-9+/=]+)',z.stdout)
        req(m is not None,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))


version,previous=context()
req((version,previous)==('v333','v332'),'expects v333 over v332')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()

source_allowed={
    'app/learning-data-reset-overrides-v333.txt',
    'index.html',
    '.github/full-data-reset-v333/prepare_reference.py',
    '.github/full-data-reset-v333/validate_reset.py',
    '.github/workflows/full-data-reset-v333.yml',
    '.github/workflows/learning-data-reset-v332.yml',
    '.github/workflows/subject-a-mock-category-order-diversity-repair.yml',
    '.github/workflows/subject-b-trace-overlap-repair.yml',
}
generated_allowed={
    'manifest.webmanifest','sw.js',
    '_regression/full-data-reset-v333.fixture.json',
    'audits/FULL_DATA_RESET_v333.txt',
}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(source_allowed<=changed,'missing intended reset files '+repr(sorted(source_allowed-changed)))
req(changed<=source_allowed|generated_allowed,'unexpected reset drift '+repr(sorted(changed-(source_allowed|generated_allowed))))

cand=runtime('_site/index.html')
par=runtime('_site_parent/index.html')
req(cand['v']=='v333' and par['v']=='v332','runtime versions')
req(par['spec'] is None and par['performFn'] is None,'parent unexpectedly contains v333 reset feature')
req(cand['bankSignature']==par['bankSignature'],'question bank/content drift')
req(cand['subjectBSemantics'].get('ok') is True and par['subjectBSemantics'].get('ok') is True,'Subject B semantic regression')

spec=cand['spec'] or {}
expected_spec={
    'scope':'full-active-profile',
    'preservesStudySettings':False,
    'clearsExamSchedule':True,
    'clearsStudyPlanningSettings':True,
    'preservesDownloadedBackups':True,
    'preservesRecoveryCenterSnapshots':True,
    'createsPreResetRecoveryPoint':True,
    'clearsAutomaticFallbackToOldProgress':True,
    'clearsResumeState':True,
    'clearsLegacyProfileMirrors':True,
    'confirmationSteps':2,
    'remoteTelemetry':False,
}
req(spec==expected_spec,'reset policy drift '+json.dumps(spec,ensure_ascii=False,sort_keys=True))
req(cand['confirmText']=='初期化','confirmation text')
smoke=cand['smoke'] or {}
req(smoke.get('fullProfileMatchesDefault') is True,'full active profile did not return to default '+json.dumps(smoke,ensure_ascii=False))
req(smoke.get('settingsMatchDefault') is True and smoke.get('sentinelGone') is True,'study settings were preserved unexpectedly '+json.dumps(smoke,ensure_ascii=False))
req(smoke.get('xpMatchesDefault') is True and smoke.get('streakMatchesDefault') is True,'learning state did not return to defaults')

candidate=cand['candidateFn'] or ''
recovery=cand['recoveryFn'] or ''
transient=cand['transientFn'] or ''
perform=cand['performFn'] or ''
request=cand['requestFn'] or ''
install=cand['installFn'] or ''
req('DEFAULT_PROFILE' in candidate and 'current?.settings' not in candidate and 'keepSettings' not in candidate,'candidate must reset settings with DEFAULT_PROFILE')
req("writeRecoveryCheckpoint(profile,'pre-manual-reset',true)" in recovery.replace(' ',''),'pre-reset recovery point missing')
for token in ['UI_STATE_KEY','BFINAL_RESUME_KEY','PROFILE_MIGRATION_JOURNAL_KEY','PRE_IMPORT_PROFILE_KEY','PRE_MANUAL_RESTORE_PROFILE_KEY','LEGACY_STORAGE_KEYS']:
    req(token in transient,'transient/legacy cleanup missing '+token)
req('clearBFinalResume' in transient,'Subject B final resume cleanup missing')
for token in ['writeCurrentProfile','preservePrevious:false','LAST_GOOD_PROFILE_KEY','queueRecoveryCheckpoint']:
    req(token in perform.replace(' ',''),'reset persistence contract missing '+token)
req('window.confirm' in request and 'window.prompt' in request,'two-step destructive confirmation missing')
for token in ['試験予定日','1日の学習時間','自動調整','初回利用時の状態から再計算']:
    req(token in request,'full-reset confirmation copy missing '+token)
req("#pwaHealthCard .pwa-health-actions-advanced" in install,'data-management placement missing')
req('resetLearningDataV333' in install and 'min-height:44px' in install,'reset control/tap target missing')
req('完全に初期化' in install,'full reset button copy missing')
req('caches.' not in perform and 'serviceWorker' not in perform,'reset must not clear PWA installation/cache')

release_files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in release_files),'candidate/reference six-file mismatch')

fixture={
    'version':version,'previous':previous,'parent':parent,
    'result':'PASS — FULL ACTIVE-PROFILE RESET VALIDATED',
    'policy':spec,
    'fullProfileMatchesDefault':True,
    'studySettingsReset':True,
    'examScheduleResetViaDefaultProfile':True,
    'planningAndReadinessInputsReset':True,
    'preResetRecoveryPoint':True,
    'oldAutomaticFallbackRemoved':True,
    'resumeAndTransientStateCleared':True,
    'legacyProfileMirrorsCleared':True,
    'twoStepConfirmation':True,
    'pwaInstallAndCachePreserved':True,
    'questionBankUnchanged':True,
    'subjectBSemanticsOK':True,
    'candidateReferenceSixFileByteEquality':True,
}
Path('_regression').mkdir(exist_ok=True)
Path('_regression/full-data-reset-v333.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')

audit=f'''FE QUEST v333 — Full Active-Profile Reset\n==========================================\n\nResult\n------\nPASS — FULL ACTIVE-PROFILE RESET VALIDATED\nPrevious release: v332\nSource main: {parent}\n\nLearner-facing behavior\n-----------------------\n- 「アプリ・データ」内の初期化を、学習履歴だけではなくアクティブプロフィール全体の初期化へ変更。\n- 教材進捗、問題・復習・模試・科目B、XP、ストリークを初回状態へ戻す。\n- 試験予定日、1日の学習時間、自動調整など profile.settings も DEFAULT_PROFILE に戻す。\n- その結果、試験準備度、残り日数、必要ペース、完了見込みなどの派生表示も初期状態から再計算される。\n- 実行前に復旧センター用の pre-manual-reset 復旧点を作成し、既存の復旧点と外部バックアップは安全のため保持する。\n- 旧プロフィールは自動復元されず、復旧センターから明示的に選んだ場合だけ戻せる。\n- UI再開状態、科目B総合実戦の再開状態、移行ジャーナル、旧一時復元データ、legacy profile mirror は消去する。\n- confirm の後に「初期化」の入力を要求する2段階確認。\n- PWA本体、Service Worker、Cache Storage は削除しない。\n- 旧feature workflowは汎用index.html変更だけでは起動しないようトリガーを限定し、別リリースのPRを誤って失敗させない。\n\nRegression\n----------\nQUESTION_BANK: unchanged.\nSubject B semantic diagnostics: OK.\nCandidate/approved-reference six-file byte equality: yes.\nStandard release invariants are validated separately by release_validate.py.\n'''
Path('audits').mkdir(exist_ok=True)
Path('audits/FULL_DATA_RESET_v333.txt').write_text(audit)
print(audit)
