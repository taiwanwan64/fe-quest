# FE QUEST v342 — Supabase PKCE magic-link callback validation

Result: **PASS — 12 / 12 PKCE EMAIL CALLBACK CASES PASS**

- FE QUEST now recognizes only `token_hash` callbacks with `type=email`
- the one-time token is exchanged through Supabase `verifyOtp()` before the session is read
- successful exchange removes `token_hash` / `type` from the browser URL while preserving unrelated query/hash state
- repeated initialization does not replay a consumed magic-link token
- missing SDK verifier or expired token fails open: local study remains available and no learner persistence is touched
- failed verification does not erase the callback URL before diagnosis/retry
- magic-link send still uses the explicit HTTPS app redirect URL
- the auth contract records that the hosted Supabase Magic Link template must redirect `token_hash` + `type=email` to FE QUEST
- FE QUEST still never stores or inspects refresh tokens, and the v341 production shell remains cloud-free

**External deployment requirement:** Supabase Auth's hosted passwordless documentation requires a PKCE Magic Link email template that sends `token_hash` to the application. For the static FE QUEST root URL, configure the hosted template to use the allowed FE QUEST redirect URL and append `?token_hash={{ .TokenHash }}&type=email` (using Supabase template variables such as `.RedirectTo`/`.TokenHash` as configured in the Dashboard).
