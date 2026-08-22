# FE QUEST v342 — Auth production setup readiness

Result: **PASS — 25 / 25 AUTH-PRODUCTION CHECKS PASS**

- canonical production URL is resolved as `https://taiwanwan64.github.io/fe-quest/`
- public v342 config is activated for that exact root using the Supabase publishable key only
- v341 production remains cloud-free, so this activation does not change the current released app
- hosted Supabase Site URL, Additional Redirect URL, and Magic Link template remain an explicit manual Dashboard gate because the connected management tool does not expose those Auth mutations
- the Magic Link contract returns `token_hash` + `type=email` to the static root through `{{ .RedirectTo }}` and matches the existing PKCE `verifyOtp` implementation
- live acceptance still covers signed-out local study, explicit first sync, second device, offline reconnect, both conflict resolutions, logout, account deletion, export/recovery, and final Supabase advisors
- release PR #107 remains gated until hosted Auth settings and real acceptance tests pass

The production URL is no longer guessed or unresolved.
