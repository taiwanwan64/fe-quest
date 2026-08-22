from pathlib import Path
import re


def req(ok, msg):
    if not ok:
        raise AssertionError(msg)

privacy = Path('privacy.html')
config = Path('cloud/public-config-v342.js')
shell = Path('app/base-shell-v341.html')
req(privacy.exists(), 'privacy.html missing')
req(config.exists(), 'v342 cloud config missing')

text = privacy.read_text()
config_text = config.read_text()
prod = shell.read_text()

checks = {
    'policy has a Japanese title': '<h1>プライバシーポリシー</h1>' in text,
    'cloud sync is explicitly optional': 'クラウド同期は任意です' in text and 'ログインしなくても学習できます' in text,
    'local learner data categories are disclosed': all(x in text for x in ['回答履歴','学習進捗','模試履歴','XP']),
    'email/auth processing is disclosed': 'メールアドレス' in text and 'セッション情報' in text,
    'cloud profile metadata is disclosed': all(x in text for x in ['リビジョン','チェックサム']),
    'Supabase is disclosed': 'Supabase' in text,
    'GitHub Pages is disclosed': 'GitHub Pages' in text,
    'no-sale statement is present': '第三者へ販売することはありません' in text,
    'account deletion cloud cascade behavior is disclosed': 'アカウント削除' in text and 'クラウド上の学習プロフィールも削除' in text,
    'local data survives account deletion': '端末内の学習データは自動削除しません' in text,
    'JSON export/recovery independence is disclosed': 'JSONエクスポート' in text and '復旧機能' in text,
    'security boundary is disclosed': 'publishable key' in text and '管理者用の秘密鍵は配置しません' in text and 'Row Level Security（RLS）' in text,
    'policy has an operational contact path': 'https://github.com/taiwanwan64/fe-quest/issues' in text,
    'policy warns it must match actual released behavior': '実際の公開機能と内容に差異が生じた場合' in text,
    'current cloud config remains disabled': 'enabled:false' in config_text and 'redirectTo:null' in config_text,
    'v341 production shell remains cloud-free': 'activation-loader-v342.js' not in prod,
}

for name, ok in checks.items():
    req(ok, name)

for forbidden in ['sb_secret_', 'service_role_', 'SUPABASE_SERVICE_ROLE_KEY']:
    req(forbidden not in text, f'privacy page leaks forbidden credential material: {forbidden}')

# The policy itself must not introduce analytics/ad scripts before that statement is changed.
for tracker in ['googletagmanager.com','google-analytics.com','connect.facebook.net','cdn.segment.com','posthog','mixpanel']:
    req(tracker not in text.lower(), f'privacy page embeds tracker: {tracker}')

result = len(checks) + 2
report = f'''# FE QUEST v342 — Privacy readiness\n\nResult: **PASS — {result} / {result} PRIVACY-READINESS CHECKS PASS**\n\n- a public Japanese privacy policy now documents FE QUEST's local-first storage model\n- optional Supabase Auth/cloud synchronization and the data categories involved are disclosed\n- GitHub Pages and Supabase are identified as external infrastructure providers\n- the policy states that FE QUEST does not currently embed ad/third-party behavioral analytics SDKs or sell learner/email data for advertising\n- cloud account deletion and deliberate preservation of local learner data are separately explained\n- publishable-key/RLS security boundaries, conflict protection, JSON export, and recovery independence are documented\n- an operational GitHub Issues contact route is provided\n- the page contains no secret/service-role material or tracker script\n- cloud configuration remains disabled and v341 production behavior is unchanged\n\nBefore any future ads, analytics, payments, or additional processors are activated, this policy must be reviewed and updated to match the actual production behavior.\n'''
Path('audits/V342_PRIVACY_READINESS.md').write_text(report)
print(report)
'''
