# FE QUEST v342 — Supabase Auth production setup

Status: **HOSTED AUTH SETTINGS CONFIGURED — LIVE ACCEPTANCE IN PROGRESS**

Canonical production URL:

```text
https://taiwanwan64.github.io/fe-quest/
```

Isolated live-auth callback used before release:

```text
https://taiwanwan64.github.io/fe-quest/v342-auth-test.html
```

## 1. Required production URL

Use the exact HTTPS production root, including the trailing slash:

```text
https://taiwanwan64.github.io/fe-quest/
```

Requirements:
- HTTPS only.
- Must remain the exact deployed FE QUEST root that learners open.
- Do not use a preview/staging URL as the final production Magic Link destination.
- If the public URL changes later, update Supabase Auth settings and `cloud/public-config-v342.js` together before release.

## 2. Supabase Dashboard — URL Configuration

Project: `fe-quest` (`gkvgxnkoypypikxtyeoz`)

Configured under **Authentication → URL Configuration**:

```text
Site URL
https://taiwanwan64.github.io/fe-quest/

Additional Redirect URLs
https://taiwanwan64.github.io/fe-quest/
https://taiwanwan64.github.io/fe-quest/v342-auth-test.html
```

Use exact URLs rather than a broad wildcard. FE QUEST sends an explicit `emailRedirectTo` from `signInWithOtp`.

The connected Supabase management tool does not expose hosted Auth URL/template mutation, so these values must be saved manually in the Dashboard and verified by live Auth logs.

## 3. Supabase Dashboard — PKCE email templates

FE QUEST uses passwordless email Auth with PKCE and a static browser callback. **Both the new-user `Confirm sign up` template and the returning-user `Magic link or OTP` template must return `token_hash` + `type=email` to FE QUEST.**

This is required because `signInWithOtp({ shouldCreateUser: true })` automatically creates a user when the email is new. On that first request Supabase sends the **Confirm sign up** template; later requests use **Magic link or OTP**. Configuring only Magic Link leaves the first-login path on the hosted `/verify` confirmation flow and no FE QUEST browser session is created.

### 3.1 Confirm sign up

Open **Authentication → Emails → Confirm sign up**.

Suggested subject:

```text
FE QUEST メールアドレス確認
```

Body:

```html
<h2>FE QUESTを始める</h2>
<p>次のリンクからメールアドレスを確認して、FE QUESTにログインしてください。</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">メールアドレスを確認してログイン</a></p>
<p>このリンクは一度だけ利用できます。</p>
<p>心当たりがない場合は、このメールを無視してください。</p>
```

### 3.2 Magic link or OTP

Open **Authentication → Emails → Magic link or OTP**.

Subject:

```text
FE QUEST ログインリンク
```

Body:

```html
<h2>FE QUESTにログイン</h2>
<p>次のリンクからFE QUESTにログインしてください。</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">FE QUESTにログイン</a></p>
<p>このリンクは一度だけ利用できます。</p>
<p>心当たりがない場合は、このメールを無視してください。</p>
```

Why this exact contract:
- FE QUEST uses Supabase Auth PKCE.
- The browser callback parser accepts `token_hash` plus the exact `type=email` query pair.
- The callback exchanges the token with `verifyOtp({ token_hash, type: 'email' })` before reading the session.
- `{{ .RedirectTo }}` is the explicit HTTPS `emailRedirectTo` sent by FE QUEST.
- Do not point these templates at `/auth/confirm`; FE QUEST is a static PWA and consumes the token in its browser page.
- `{{ .ConfirmationURL }}` must not be used for these two FE QUEST PKCE paths.

## 4. Email provider settings

Custom SMTP is configured for controlled live testing. Keep these rules:
- Magic Link/OTP expiry no more than 1 hour; current target is 3600 seconds.
- Do not enable email-link tracking that rewrites authentication URLs.
- Gmail SMTP is acceptable for controlled development testing but is not the intended long-term transactional sender for broad public release.
- Before broader release, move to a production transactional email provider / authenticated domain and retest delivery.
- Test at least one common consumer mailbox and one mobile mail client.

Email security scanners may prefetch one-time links. If real-world testing shows consumed/expired Magic Links, FE QUEST should switch to an explicit OTP entry flow rather than weakening token validation.

## 5. Public browser configuration activation

`cloud/public-config-v342.js` is intentionally configured for the canonical production root:

```js
enabled:true,
redirectTo:'https://taiwanwan64.github.io/fe-quest/'
```

This does **not** activate cloud sync in current v341 production because v341 does not load the v342 cloud runtime. It only makes the v342 candidate ready to use the verified root.

Keep these invariants:
- provider remains `supabase`,
- project URL remains `https://gkvgxnkoypypikxtyeoz.supabase.co`,
- browser key remains the publishable key only,
- never add `sb_secret_*`, service-role keys, access tokens, refresh tokens, SMTP credentials, or Management API tokens to the repository.

## 6. Required live acceptance sequence

Do not promote v342 until every item passes:

1. Signed out: FE QUEST opens and local study/save works with no login.
2. Existing confirmed email: request Magic Link; the live test page receives `token_hash` + `type=email`, verifies it, removes the one-time values from the visible URL, and `auth.getUser()` confirms the session server-side.
3. Brand-new email: request login; Confirm sign up uses the same token-hash browser callback and completes the first session without falling back to hosted `/verify`.
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

## 7. Live finding already verified

The first live attempt established that SMTP, user creation, email delivery, and redirect allowlisting were functioning: Supabase accepted `/otp`, created the Auth user, then a hosted `/verify` request confirmed the email. The absence of `last_sign_in_at` proved that email confirmation alone was not a completed FE QUEST PKCE session. This exposed the missing Confirm sign up template requirement, which is now part of the release gate and automated documentation checks.

## 8. Current backend verification

As of the v342 activation preparation:
- Supabase project `fe-quest` is active and healthy in `ap-northeast-1`.
- `public.user_profiles` exists with RLS enabled and ownership tied to `auth.users`.
- migrations `v342_cloud_sync_foundation` and `v342_revoke_anon_rpc_execute` are applied.
- `fequest-delete-account-v342` Edge Function is active with JWT verification enabled.
- Performance Advisor reports no lints.
- Security Advisor reports the intentional `SECURITY DEFINER` warning for `fequest_commit_profile_v342`; the function verifies `auth.uid() = p_user_id`, uses a fixed search path, is executable only by `authenticated`, and direct INSERT/UPDATE/DELETE grants remain revoked. This warning is accepted by design so CAS writes can occur without granting blind table-write privileges to the browser.

## 9. Release gate

PR `#107` (`v342-staging`) must remain draft/unmerged until:
- URL Configuration, Confirm sign up, Magic link or OTP, and SMTP settings are saved in Supabase,
- both returning-user and first-time-user PKCE email flows pass live testing,
- the staging candidate is refreshed from latest `main`,
- the full release suite passes again with the activated public config,
- the remaining cloud sync acceptance sequence passes,
- privacy policy remains accurate for the actual production behavior.

If any live cloud test fails, keep production on v341. Local-first behavior is the rollback boundary.
