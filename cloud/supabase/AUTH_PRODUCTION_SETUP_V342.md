# FE QUEST v342 — Supabase Auth production setup

Status: **DO NOT ENABLE CLOUD SYNC UNTIL EVERY REQUIRED ITEM IS VERIFIED**

This document converts the remaining hosted Supabase Auth settings into a deterministic release checklist. Replace `<FE_QUEST_PRODUCTION_URL>` only with the exact HTTPS URL that learners actually open in production. Do not guess the GitHub Pages URL.

## 1. Required production URL

Set one canonical URL including the trailing slash when the deployed FE QUEST root uses one:

```text
<FE_QUEST_PRODUCTION_URL>
```

Requirements:
- HTTPS only.
- Must be the exact deployed FE QUEST root that loads the v342 application.
- Do not use a preview/staging URL for production Magic Links.
- Do not enable `cloud/public-config-v342.js` until this URL has been opened successfully in a normal browser.

## 2. Supabase Dashboard — URL Configuration

Project: `fe-quest` (`gkvgxnkoypypikxtyeoz`)

Open **Authentication → URL Configuration** and configure:

```text
Site URL
<FE_QUEST_PRODUCTION_URL>

Additional Redirect URLs
<FE_QUEST_PRODUCTION_URL>
```

Use the exact URL rather than a broad wildcard. FE QUEST sends this same URL as `emailRedirectTo` from `signInWithOtp`.

## 3. Supabase Dashboard — Magic Link template

Open **Authentication → Email Templates → Magic Link**.

Subject:

```text
FE QUEST ログインリンク
```

Body:

```html
<h2>FE QUESTにログイン</h2>
<p>次のリンクからFE QUESTにログインしてください。</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">FE QUESTにログイン</a></p>
<p>このリンクは一度だけ利用できます。心当たりがない場合は、このメールを無視してください。</p>
```

Why this exact contract:
- FE QUEST uses Supabase Auth PKCE.
- The browser callback parser accepts `token_hash` plus the exact `type=email` query pair.
- The callback exchanges the token with `verifyOtp({ token_hash, type: 'email' })` before reading the session.
- `{{ .RedirectTo }}` is the explicit production HTTPS `emailRedirectTo` sent by FE QUEST.
- Do not point the template at `/auth/confirm`; FE QUEST is a static PWA and consumes the token at its root URL.

## 4. Email provider settings

For initial controlled testing, Supabase's hosted email sender may be used if the project permits it. Before broader public release:
- keep Magic Link/OTP expiry short; target no more than 1 hour,
- do not enable email-link tracking that rewrites authentication URLs,
- if delivery volume/reliability becomes important, configure a production SMTP provider,
- test at least one common consumer mailbox and one mobile mail client.

Email security scanners may prefetch one-time links. If real-world testing shows consumed/expired Magic Links, FE QUEST should switch to an explicit OTP entry flow rather than weakening token validation.

## 5. Public browser configuration activation

Only after Dashboard settings above are saved and verified, update:

`cloud/public-config-v342.js`

from:

```js
enabled:false,
redirectTo:null
```

to:

```js
enabled:true,
redirectTo:'<FE_QUEST_PRODUCTION_URL>'
```

Keep these invariants:
- provider remains `supabase`,
- project URL remains `https://gkvgxnkoypypikxtyeoz.supabase.co`,
- browser key remains the publishable key only,
- never add `sb_secret_*`, service-role keys, access tokens, refresh tokens, SMTP credentials, or Management API tokens to the repository.

## 6. Required live acceptance sequence

Do not promote v342 until every item passes:

1. Signed out: FE QUEST opens and local study/save works with no login.
2. Request Magic Link using a new email; UI confirms that the email was sent.
3. Open the email link in the same browser; callback verifies and removes `token_hash`/`type` from the visible URL.
4. Signed in but sync disabled: no learner data is uploaded automatically.
5. Explicitly enable sync: existing local profile uploads on first link when cloud is empty.
6. Reload: authenticated session persists without disrupting local data.
7. Device/browser B: sign in to the same account and adopt cloud data safely.
8. Offline on A: learning and local persistence continue; reconnect then sync succeeds.
9. Create divergent changes on A and B: stale client does not silently overwrite cloud state; conflict UI appears.
10. Resolve once with **この端末のデータを使う** and verify the promoted revision.
11. Recreate a conflict and resolve once with **クラウドのデータを使う**; recovery point is created before local replacement.
12. Log out: only this device session/sync metadata is disabled; local learner data remains.
13. Log back in, then delete account: two confirmations are required; Auth user and cloud profile disappear; local learner data remains.
14. JSON export and Recovery Center remain usable independently of cloud sync.
15. Run Supabase Security Advisor and Performance Advisor again after acceptance testing.

## 7. Release gate

PR `#107` (`v342-staging`) must remain draft/unmerged until:
- the exact production URL is verified,
- URL Configuration and Magic Link template are saved in Supabase,
- public config is activated with that exact URL,
- the staging candidate is refreshed from latest `main`,
- the full release suite passes again,
- the live acceptance sequence above passes,
- privacy policy remains accurate for the actual production behavior.

If any live cloud test fails, keep production on v341. Local-first behavior is the rollback boundary.
