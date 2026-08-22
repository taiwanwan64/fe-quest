# FE QUEST v342 — Live Auth acceptance evidence

Date: 2026-08-22 JST

Status: **PASS — returning-user and brand-new-user passwordless PKCE Auth both verified against the live Supabase project.**

## Returning-user path

- Gmail custom SMTP delivered the FE QUEST Magic Link.
- `Magic link or OTP` returned `token_hash` + `type=email` to the isolated GitHub Pages callback.
- Browser `verifyOtp` completed and the diagnostic page verified the user again against Supabase Auth.
- `auth.users.last_sign_in_at` advanced to 2026-08-22 22:47:03 JST.

## Brand-new-user path

- A previously unused Gmail plus-alias was submitted through `signInWithOtp({ shouldCreateUser: true })`.
- Supabase created the Auth user at 2026-08-22 22:52:16 JST.
- The customized `Confirm sign up` template returned `token_hash` + `type=email` directly to FE QUEST.
- Email confirmation and first sign-in completed at 2026-08-22 22:52:38 JST.
- The diagnostic page verified the signed-in user against the Supabase server.

## Findings closed by this test

The first live attempt exposed that customizing only `Magic link or OTP` is insufficient for automatic first-user creation. New addresses use `Confirm sign up`. The production guide and CI now require both templates to use the same PKCE token-hash callback contract.

## Remaining v342 live acceptance

Auth transport is now proven. Remaining release gates are the actual learner-profile flows: explicit first sync, session persistence, device/browser B adoption, offline-to-reconnect, stale-client conflict detection, both conflict resolutions, logout, account deletion, JSON export, Recovery Center, and final Supabase advisors.

Production root remains v341 while these gates are exercised.
