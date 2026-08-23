from pathlib import Path
import hashlib,json,re

JS=Path('assets/app-v343.js').read_text()


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def named_function(name):
    m=re.search(rf'\bfunction\s+{re.escape(name)}\s*\([^)]*\)\s*\{{',JS)
    req(m is not None,f'missing function {name}')
    i=m.end()-1;depth=0;quote=None;esc=False
    while i<len(JS):
        ch=JS[i]
        if quote:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch==quote: quote=None
        else:
            if ch in "'\"`": quote=ch
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:return JS[m.start():i+1]
        i+=1
    raise AssertionError(f'unclosed function {name}')

analytics=named_function('analyticsAttemptStream')
finish_quiz=named_function('finishQuizSession')
finish_mock=named_function('finishMock')
ensure_q=named_function('ensureQuestionProfile')
normalize=named_function('normalizeProfileData')

checks={
  'production_v343': "const APP_VERSION = 'v343';" in JS,
  'analytics_uses_sessions': 'profile.sessions' in analytics and 's.log' in analytics,
  'analytics_uses_mock_history': 'profile.mockHistory' in analytics and 'h.details' in analytics,
  'analytics_has_date_cat_ok': all(t in analytics for t in ['date:','cat:','ok:']),
  'quiz_sessions_runtime_cap_20': 'profile.sessions=profile.sessions.slice(0,20)' in finish_quiz,
  'quiz_session_log_cap_10': 'log:sessionLog.slice(0,10)' in finish_quiz,
  'mock_history_runtime_cap_10': 'profile.mockHistory=profile.mockHistory.slice(0,10)' in finish_mock,
  'qstats_has_only_latest_reason_date': 'lastReason' in ensure_q and 'lastReviewDate' in ensure_q,
  'qstats_no_dated_attempt_history': all(t not in ensure_q for t in ['attemptHistory','reasonHistory','dailyAttempts']),
  'normalizer_can_read_sessions': 'out.sessions=safeArray(p.sessions,3000)' in normalize,
  'normalizer_can_read_mock_history': 'out.mockHistory=safeArray(p.mockHistory,100)' in normalize,
}
for k,v in checks.items():req(v,k)

# A fixed two-calendar-week comparison needs complete dated attempts for both windows.
# Current normalizers can accept more history, but ordinary runtime writes aggressively cap
# the arrays. Twenty quiz sessions can represent fewer than 14 calendar days for an active
# learner, and each saved session keeps only the first ten attempt rows. qStats cannot
# reconstruct older dated attempts because it retains aggregate totals + latest dates/reason.
weekly_calendar_complete=False
schema_free_safe_for_plan_weighting=False

findings={
  'bundle':{
    'path':'assets/app-v343.js',
    'utf8Bytes':len(JS.encode()),
    'sha256':hashlib.sha256(JS.encode()).hexdigest(),
  },
  'evidence':{
    'attemptStreamSources':['profile.sessions[].log','profile.mockHistory[].details'],
    'quizSessionRetention':20,
    'savedAttemptRowsPerQuizSession':10,
    'mockHistoryRetention':10,
    'qStatsCanReconstructPriorWeek':False,
    'normalizerReadCaps':{'sessions':3000,'mockHistory':100},
    'runtimeWriteCapsAreLowerThanNormalizerCaps':True,
  },
  'decision':{
    'twoCalendarWeekCompletenessGuaranteed':weekly_calendar_complete,
    'safeToWeightTodayPlanWithoutSchemaOrRetentionChange':schema_free_safe_for_plan_weighting,
    'recommendation':'do-not-add-weekly-trend-weighting-in-v343',
    'reason':'runtime history caps can truncate the prior comparison window for active learners; aggregate qStats cannot reconstruct the missing dated attempts',
    'next':'keep v343 evidence-confidence guard as the final v343 learner-facing precision change; design v344 reporting from explicitly bounded recent-record evidence or introduce a deliberate rolling aggregate only with schema/migration review',
  },
  'checks':checks,
}
print('V343_WEEKLY_TREND_AUDIT_BEGIN')
print(json.dumps(findings,ensure_ascii=False,indent=2))
print('V343_WEEKLY_TREND_AUDIT_END')
print('PASS — WEEKLY TREND AUDIT: DEFER WEIGHTING; EXISTING RUNTIME HISTORY IS NOT CALENDAR-COMPLETE')
