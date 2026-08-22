# FE QUEST v342 — Supabase Auth production setup

Status: **PRODUCTION URL RESOLVED — DASHBOARD AUTH SETTINGS AND LIVE ACCEPTANCE STILL REQUIRED**

Canonical production URL:

```text
https://taiwanwan64.github.io/fe-quest/
```

This URL was supplied as the actual FE QUEST production root. Do not substitute a preview/staging URL for production Magic Links.

## 1. Required production URL

Use this exact HTTPS root, including the trailing slash:

```text
https://taiwanwan64.github.io/fe-quest/
```

Requirements:
- HTTPS only.
- Must remain the exact deployed FE QUEST root that learners open.
- Do not use a preview/staging URL for production Magic Links.
- If the public URL changes later, update both Supabase Auth settings and `cloud/public-config-v342.js` together before release.

## 2. Supabase Dashboard — URL Configuration

Project: `fe-quest` (`gkvgxnkoypypikxtyeoz`)

Open **Authentication → URL Configuration** and configure:

```text
Site URL
https://taiwanwan64.github.io/fe-quest/

Additional Redirect URLs
https://taiwanwan64.github.io/fe-quest/
```

Use the exact URL rather than a broad wildcard. FE QUEST sends this same URL as `emailRedirectTo` from `signInWithOtp`.

The connected Supabase management tool available to this project does not expose hosted Auth URL/template mutation, so these Dashboard values must be saved manually before live Magic Link testing. Do not mark this gate complete merely because the browser config has been committed.

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

`cloud/public-config-v342.js` is now intentionally configured for the canonical production root:

```js
enabled:true,
redirectTo:'https://taiwanwan64.github.io/fe-quest/'
```

This does **not** activate cloud sync in current v341 production because v341 does not load the v342 cloud runtime. It only makes the future v342 candidate ready to use the verified root once the hosted Auth settings above are saved.

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

## 7. Current backend verification

As of the v342 activation preparation:
- Supabase project `fe-quest` is active and healthy in `ap-northeast-1`.
- `public.user_profiles` exists with RLS enabled and ownership tied to `auth.users`.
- migrations `v342_cloud_sync_foundation` and `v342_revoke_anon_rpc_execute` are applied.
- `fequest-delete-account-v342` Edge Function is active with JWT verification enabled.
- Performance Advisor reports no lints.
- Security Advisor reports the intentional `SECURITY DEFINER` warning for `fequest_commit_profile_v342`; the function verifies `auth.uid() = p_user_id`, uses a fixed search path, is executable only by `authenticated`, and direct INSERT/UPDATE/DELETE grants remain revoked. This warning is accepted by design so CAS writes can occur without granting blind table-write privileges to the browser.

## 8. Release gate

PR `#107` (`v342-staging`) must remain draft/unmerged until:
- URL Configuration and Magic Link template are saved in Supabase,
- the staging candidate is refreshed from latest `main`,
- the full release suite passes again with the activated public config,
- the live acceptance sequence above passes,
- privacy policy remains accurate for the actual production behavior.

If any live cloud test fails, keep production on v341. Local-first behavior is the rollback boundary.
